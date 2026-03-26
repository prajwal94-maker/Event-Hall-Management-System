/* ═══════════════════════════════════════════════════════════
   EventHall — server.js   (Complete, zero-error)
   ═══════════════════════════════════════════════════════════ */
require("dotenv").config();
const express = require("express");
const mysql   = require("mysql2");
const cors    = require("cors");
const path    = require("path");
 
const app  = express();
const PORT = process.env.PORT || 3000;
 
app.use(cors());
app.use(express.json());
 
/* ── Serve static frontend ── */
app.use(express.static(path.join(__dirname, "../frontend")));
 
/* ═══════════════════════════════════════════════════════════
   DATABASE
   ═══════════════════════════════════════════════════════════ */
const db = mysql.createPool({
  host:             process.env.DB_HOST         || "localhost",
  user:             process.env.DB_USER         || "root",
  password:         process.env.DB_PASSWORD     || "",
  database:         process.env.DB_NAME         || "event_hall_booking",
  port:             process.env.DB_PORT         || 3306,
  charset:          "utf8mb4",
  waitForConnections: true,
  connectionLimit:    10,
  queueLimit:         0,
});

// Verify connection on startup
db.query("SELECT 1", (err) => {
  if (err) { console.error("❌ DB connection failed:", err.message); return; }
  console.log("✅ Connected to MySQL — event_hall_booking");
 
  const alters = [
    "ALTER TABLE bookings ADD COLUMN status           VARCHAR(20)   DEFAULT 'confirmed'",
    "ALTER TABLE bookings ADD COLUMN cancelled_at     DATETIME      NULL DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN cancel_reason    VARCHAR(100)  NULL DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN cancel_notes     TEXT          NULL DEFAULT NULL",
    "ALTER TABLE bookings ADD COLUMN refund_amount    DECIMAL(10,2) DEFAULT 0",
    "ALTER TABLE bookings ADD COLUMN cancellation_id  VARCHAR(40)   NULL DEFAULT NULL",
    "ALTER TABLE users    ADD COLUMN role ENUM('user','admin') DEFAULT 'user'",
    "UPDATE users SET role='admin' WHERE email='admin@eventhall.in' AND role IS NULL",
    "UPDATE bookings SET status='confirmed' WHERE status IS NULL",
  ];

  const creates = [
    `CREATE TABLE IF NOT EXISTS messages (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      booking_id VARCHAR(40) NOT NULL,
      user_id    INT NOT NULL,
      subject    VARCHAR(200) NOT NULL,
      body       TEXT NOT NULL,
      is_read    TINYINT(1) DEFAULT 0,
      sent_by    ENUM('admin','user') DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
    `CREATE TABLE IF NOT EXISTS contact_messages (
      id         INT AUTO_INCREMENT PRIMARY KEY,
      name       VARCHAR(120) NOT NULL,
      email      VARCHAR(180) NOT NULL,
      message    TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`,
  ];
  creates.forEach(sql => db.query(sql, err => {
    if (err) console.warn("CREATE warn:", err.message);
  }));

  function runAlters(i) {
    if (i >= alters.length) return;
    db.query(alters[i], err => {
      if (err && !err.message.toLowerCase().includes("duplicate column"))
        console.warn("ALTER warn:", err.message);
      runAlters(i + 1);
    });
  }
  runAlters(0);
});
 
/* ═══════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════ */
function getDeductionPct(eventDate) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const evDate   = new Date(eventDate);
  const daysLeft = Math.ceil((evDate - today) / (1000*60*60*24));
  if (daysLeft > 30) return 10;
  if (daysLeft > 14) return 20;
  if (daysLeft > 7)  return 35;
  if (daysLeft > 0)  return 50;
  return 100;
}
 
/* ═══════════════════════════════════════════════════════════
   AUTH ROUTES
   ═══════════════════════════════════════════════════════════ */
app.post("/api/register", (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone)
    return res.status(400).json({ error: "All fields are required" });
 
  db.query(
    "INSERT INTO users (name,email,password,phone) VALUES (?,?,?,?)",
    [name, email, password, phone],
    (err, result) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ error: "Email already registered" });
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: "User registered successfully", userId: result.insertId });
    }
  );
});
 
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ message: "Email and password are required" });
 
  db.query(
    "SELECT * FROM users WHERE email=? AND password=?",
    [email, password],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Server error" });
      if (!result.length)
        return res.status(401).json({ message: "Invalid email or password" });
      const { password: _pw, ...safeUser } = result[0];
      res.json({ message: "Login successful", user: safeUser });
    }
  );
});
 
/* ═══════════════════════════════════════════════════════════
   BOOKING ROUTES
   ═══════════════════════════════════════════════════════════ */
app.post("/api/bookings", (req, res) => {
  const {
    user_id, hall_id, event_type, event_date, time_slot,
    participants, hall_cost, food_items, food_cost,
    design_cost, stage_design, total_amount, payment_method,
  } = req.body;
 
  /* ── Reject today and past dates ── */
  const today = new Date(); today.setHours(0,0,0,0);
  const evDate = new Date(event_date);
  if (evDate <= today)
    return res.status(400).json({ message: "Please select a future date for your event" });
 
  const booking_id = "BK" + Date.now();
  const advance    = Math.ceil(total_amount * 0.25);
  const remaining  = total_amount - advance;
 
  db.query(`
    INSERT INTO bookings
      (booking_id,user_id,hall_id,event_type,event_date,time_slot,
       participants,hall_cost,food_items,food_cost,design_cost,
       total_amount,advance_paid,remaining_amount,stage_design,payment_method,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,'confirmed')`,
    [booking_id,user_id,hall_id,event_type,event_date,time_slot,
     participants,hall_cost,food_items,food_cost,design_cost,
     total_amount,advance,remaining,stage_design,payment_method],
    (err) => {
      if (err) {
        if (err.code === "ER_DUP_ENTRY")
          return res.status(400).json({ message: "Hall already booked for this date and time" });
        return res.status(500).json({ message: "Booking failed: " + err.message });
      }
      res.json({ message: "Booking successful", booking_id });
    }
  );
});
 
app.get("/api/bookings/:userId", (req, res) => {
  db.query(
    "SELECT * FROM bookings WHERE user_id=? ORDER BY created_at DESC",
    [req.params.userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Could not fetch bookings" });
      res.json(result);
    }
  );
});
 
app.post("/api/check-availability", (req, res) => {
  const { hall_id, event_date, time_slot } = req.body;
 
  const today = new Date(); today.setHours(0,0,0,0);
  const evDate = new Date(event_date);
  if (evDate <= today)
    return res.json({ available: false, reason: "past_date" });
 
  db.query(
    `SELECT id FROM bookings
     WHERE hall_id=? AND event_date=? AND time_slot=?
       AND (status IS NULL OR status != 'cancelled') LIMIT 1`,
    [hall_id, event_date, time_slot],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Server error" });
      res.json({ available: result.length === 0 });
    }
  );
});
 
/* ═══════════════════════════════════════════════════════════
   CANCEL BOOKING
   ═══════════════════════════════════════════════════════════ */
app.post("/api/cancel-booking", (req, res) => {
  const { user_id, booking_id, reason, notes, refund_amount, deduct_pct } = req.body;
  if (!user_id || !booking_id)
    return res.status(400).json({ message: "user_id and booking_id are required" });
 
  db.query(
    "SELECT * FROM bookings WHERE booking_id=? AND user_id=?",
    [booking_id, user_id],
    (err, rows) => {
      if (err) return res.status(500).json({ message: "Database error: " + err.message });
      if (!rows.length) return res.status(404).json({ message: "Booking not found" });
 
      const booking = rows[0];
      if (booking.status === "cancelled")
        return res.status(400).json({ message: "This booking is already cancelled" });
 
      const deductPct   = Number(deduct_pct) || getDeductionPct(booking.event_date);
      const paid        = Number(booking.advance_paid) || 0;
      const deduction   = Math.ceil(paid * deductPct / 100);
      const finalRefund = refund_amount !== undefined
        ? Number(refund_amount) : Math.max(0, paid - deduction);
      const cancelId    = "CX-" + Date.now();
 
      db.query(
        `UPDATE bookings SET status='cancelled', cancelled_at=NOW(),
         cancel_reason=?, cancel_notes=?, refund_amount=?, cancellation_id=?
         WHERE booking_id=? AND user_id=?`,
        [reason||"not_specified", notes||"", finalRefund, cancelId, booking_id, user_id],
        (err2) => {
          if (err2) return res.status(500).json({ message: "Could not cancel: " + err2.message });
          res.json({
            message: "Booking cancelled successfully",
            cancellation_id: cancelId,
            refund_amount: finalRefund,
            deduction_pct: deductPct,
          });
        }
      );
    }
  );
});
 
/* ═══════════════════════════════════════════════════════════
   MESSAGES  — Manager ↔ User
   ═══════════════════════════════════════════════════════════ */
 
/* Send message (admin → user) */
app.post("/api/admin/send-message", (req, res) => {
  const { booking_id, user_id, subject, body } = req.body;
  if (!user_id || !subject || !body)
    return res.status(400).json({ message: "user_id, subject and body are required" });
 
  const bId = booking_id || "GENERAL";
 
  db.query(
    "INSERT INTO messages (booking_id,user_id,subject,body,sent_by) VALUES (?,?,?,?,'admin')",
    [bId, user_id, subject, body],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: "Message sent", id: result.insertId });
    }
  );
});
 
/* Unread count — must be defined BEFORE /:userId to avoid route conflict */
app.get("/api/messages/:userId/unread-count", (req, res) => {
  db.query(
    "SELECT COUNT(*) AS cnt FROM messages WHERE user_id=? AND is_read=0",
    [req.params.userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ count: result[0].cnt });
    }
  );
});
 
/* Get all messages for a user */
app.get("/api/messages/:userId", (req, res) => {
  db.query(
    "SELECT * FROM messages WHERE user_id=? ORDER BY created_at DESC",
    [req.params.userId],
    (err, result) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(result);
    }
  );
});
 
/* Mark message as read */
app.put("/api/messages/:id/read", (req, res) => {
  db.query(
    "UPDATE messages SET is_read=1 WHERE id=?",
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json({ message: "Marked as read" });
    }
  );
});
 
/* ═══════════════════════════════════════════════════════════
   ADMIN ROUTES
   ═══════════════════════════════════════════════════════════ */
 
/* Dashboard stats */
app.get("/api/admin/stats", (req, res) => {
  const queries = {
    totalBookings:    "SELECT COUNT(*) AS v FROM bookings",
    activeBookings:   "SELECT COUNT(*) AS v FROM bookings WHERE status IN ('confirmed','pending')",
    cancelledBookings:"SELECT COUNT(*) AS v FROM bookings WHERE status='cancelled'",
    completedBookings:"SELECT COUNT(*) AS v FROM bookings WHERE status='completed'",
    totalRevenue:     "SELECT COALESCE(SUM(advance_paid),0) AS v FROM bookings WHERE status IN ('confirmed','completed','pending')",
    totalUsers:       "SELECT COUNT(*) AS v FROM users WHERE role='user'",
    todayBookings:    "SELECT COUNT(*) AS v FROM bookings WHERE DATE(created_at)=CURDATE()",
    unreadMessages:   "SELECT COUNT(*) AS v FROM messages WHERE is_read=0",
    pendingAmount:    "SELECT COALESCE(SUM(remaining_amount),0) AS v FROM bookings WHERE status IN ('confirmed','pending')",
  };
  const result = {};
  const keys   = Object.keys(queries);
  let done = 0;
  keys.forEach(key => {
    db.query(queries[key], (err, rows) => {
      result[key] = err ? 0 : rows[0].v;
      if (++done === keys.length) res.json(result);
    });
  });
});
 
/* Revenue chart (last 12 months) */
app.get("/api/admin/revenue-chart", (req, res) => {
  db.query(`
    SELECT DATE_FORMAT(created_at,'%b %Y') AS month,
           YEAR(created_at)  AS yr,
           MONTH(created_at) AS mo,
           COALESCE(SUM(advance_paid), 0) AS revenue,
           COUNT(*) AS bookings
    FROM bookings
    WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      AND status != 'cancelled'
    GROUP BY yr, mo
    ORDER BY yr, mo`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
 
      /* Fill in all 12 months so the chart always has bars */
      const result = [];
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const yr = d.getFullYear();
        const mo = d.getMonth() + 1;
        const label = d.toLocaleString('en-IN', { month: 'short', year: 'numeric' });
        const found = rows.find(r => Number(r.yr) === yr && Number(r.mo) === mo);
        result.push({ month: label, yr, mo, revenue: found ? parseFloat(found.revenue) || 0 : 0, bookings: found ? parseInt(found.bookings) || 0 : 0 });
      }
      res.json(result);
    }
  );
});
 
/* Hall stats */
app.get("/api/admin/hall-stats", (req, res) => {
  db.query(`
    SELECT hall_id, COUNT(*) AS total,
           SUM(CASE WHEN status='confirmed' THEN 1 ELSE 0 END) AS confirmed,
           SUM(CASE WHEN status='cancelled' THEN 1 ELSE 0 END) AS cancelled,
           COALESCE(SUM(CASE WHEN status='confirmed' THEN advance_paid ELSE 0 END),0) AS revenue
    FROM bookings GROUP BY hall_id ORDER BY total DESC`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});
 
/* All bookings with filters */
app.get("/api/admin/bookings", (req, res) => {
  const { status, hall_id, date_from, date_to, search, page = 1, limit = 20, id } = req.query;
  let where = ["1=1"];
  const params = [];
 
  if (id)        { where.push("b.id=?");             params.push(id); }
  if (status)    { where.push("b.status=?");          params.push(status); }
  if (hall_id)   { where.push("b.hall_id=?");         params.push(hall_id); }
  if (date_from) { where.push("b.event_date>=?");     params.push(date_from); }
  if (date_to)   { where.push("b.event_date<=?");     params.push(date_to); }
  if (search)    { where.push("(u.name LIKE ? OR b.booking_id LIKE ? OR u.email LIKE ?)");
                   params.push(`%${search}%`,`%${search}%`,`%${search}%`); }
 
  const offset = (Number(page)-1) * Number(limit);
  const sql = `SELECT b.*,
                      u.name  AS user_name,
                      u.email AS user_email,
                      u.phone AS user_phone
               FROM bookings b JOIN users u ON b.user_id=u.id
               WHERE ${where.join(" AND ")}
               ORDER BY b.created_at DESC LIMIT ? OFFSET ?`;
 
  db.query(sql, [...params, Number(limit), offset], (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    db.query(`SELECT COUNT(*) AS total FROM bookings b JOIN users u ON b.user_id=u.id WHERE ${where.join(" AND ")}`,
      params, (err2, cnt) => {
        res.json({ bookings: rows, total: err2 ? 0 : cnt[0].total, page: Number(page), limit: Number(limit) });
      }
    );
  });
});
 
/* All users */
app.get("/api/admin/users", (req, res) => {
  const { search } = req.query;
  let sql = `SELECT u.*,
    (SELECT COUNT(*) FROM bookings b WHERE b.user_id=u.id) AS booking_count,
    (SELECT COALESCE(SUM(b.advance_paid),0) FROM bookings b WHERE b.user_id=u.id AND b.status!='cancelled') AS total_spent
    FROM users u WHERE u.role='user'`;
  const params = [];
  if (search) { sql += " AND (u.name LIKE ? OR u.email LIKE ?)"; params.push(`%${search}%`,`%${search}%`); }
  sql += " ORDER BY u.created_at DESC";
  db.query(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json(rows);
  });
});
 
/* Update booking status */
app.put("/api/admin/bookings/:id/status", (req, res) => {
  const { status } = req.body;
  db.query("UPDATE bookings SET status=? WHERE id=?", [status, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Status updated" });
  });
});
 
/* Delete booking */
app.delete("/api/admin/bookings/:id", (req, res) => {
  db.query("DELETE FROM bookings WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: err.message });
    res.json({ message: "Booking deleted" });
  });
});
 
/* Get all messages (admin view) */
app.get("/api/admin/messages", (req, res) => {
  db.query(
    `SELECT m.*,u.name AS user_name,u.email AS user_email
     FROM messages m JOIN users u ON m.user_id=u.id
     ORDER BY m.created_at DESC LIMIT 200`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});
 
/* Recent bookings */
app.get("/api/admin/recent-bookings", (req, res) => {
  db.query(
    `SELECT b.*,u.name AS user_name,u.email AS user_email
     FROM bookings b JOIN users u ON b.user_id=u.id
     ORDER BY b.created_at DESC LIMIT 10`,
    (err, rows) => {
      if (err) return res.status(500).json({ message: err.message });
      res.json(rows);
    }
  );
});
 
/* ═══════════════════════════════════════════════════════════
   CATCH-ALL
   ═══════════════════════════════════════════════════════════ */
app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` });
  }
  res.sendFile(path.join(__dirname, "../frontend/index.html"));
});
 
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  res.status(500).json({ message: "Internal server error: " + err.message });
});
 
app.listen(PORT, () => console.log(`🚀 EventHall server → http://localhost:${PORT}`));
