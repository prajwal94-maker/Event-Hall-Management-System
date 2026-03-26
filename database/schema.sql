-- ═══════════════════════════════════════════════════════════
--  EventHall — schema.sql   (MySQL 8.0+)
-- ═══════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS event_hall_booking
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE event_hall_booking;

-- ─── USERS ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(180) NOT NULL UNIQUE,
  password   VARCHAR(255) NOT NULL,
  phone      VARCHAR(20),
  role       ENUM('user','admin') DEFAULT 'user',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT IGNORE INTO users (name, email, password, phone, role)
VALUES ('Admin', 'admin@eventhall.in', 'Admin@1234', '+91 98765 43210', 'admin');

-- ─── BOOKINGS ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  booking_id       VARCHAR(40) NOT NULL UNIQUE,
  user_id          INT NOT NULL,
  hall_id          INT NOT NULL,
  event_type       VARCHAR(80),
  event_date       DATE NOT NULL,
  time_slot        VARCHAR(20),
  participants     INT DEFAULT 0,
  hall_cost        DECIMAL(12,2) DEFAULT 0,
  food_items       TEXT,
  food_cost        DECIMAL(12,2) DEFAULT 0,
  design_cost      DECIMAL(12,2) DEFAULT 0,
  stage_design     VARCHAR(100),
  total_amount     DECIMAL(12,2) DEFAULT 0,
  advance_paid     DECIMAL(12,2) DEFAULT 0,
  remaining_amount DECIMAL(12,2) DEFAULT 0,
  payment_method   VARCHAR(40),
  status           VARCHAR(20) DEFAULT 'confirmed',
  cancelled_at     DATETIME NULL DEFAULT NULL,
  cancel_reason    VARCHAR(100) NULL DEFAULT NULL,
  cancel_notes     TEXT NULL DEFAULT NULL,
  refund_amount    DECIMAL(12,2) DEFAULT 0,
  cancellation_id  VARCHAR(40) NULL DEFAULT NULL,
  created_at       DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_hall_date_slot (hall_id, event_date, time_slot)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── MESSAGES (manager → user) ───────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  booking_id  VARCHAR(40) NOT NULL,
  user_id     INT NOT NULL,
  subject     VARCHAR(200) NOT NULL,
  body        TEXT NOT NULL,
  is_read     TINYINT(1) DEFAULT 0,
  sent_by     ENUM('admin','user') DEFAULT 'admin',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_booking_id (booking_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── CONTACT MESSAGES ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(180) NOT NULL,
  message    TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ─── VIEW ─────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_booking_summary AS
SELECT b.*, u.name AS user_name, u.email AS user_email, u.phone AS user_phone
FROM bookings b JOIN users u ON b.user_id = u.id;
