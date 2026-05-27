/* ═══════════════════════════════════════════════════════════
   EventHall — booking.js  (All fixes applied)
   • Past date blocked (tomorrow+ only)
   • Non-veg breads, rice, salads, beverages filled
   • 6 unique stage designs (no duplicates)
   • Messages integration
   ═══════════════════════════════════════════════════════════ */
"use strict";
 
const BASE_URL = "/api";
 
/* ─────────────────────────────────────────────────────────
   API HELPER
───────────────────────────────────────────────────────── */
async function api(endpoint, method = "GET", body = null) {
  const options = { method, headers: { "Content-Type": "application/json" } };
  if (body) options.body = JSON.stringify(body);
  try {
    showSpinner(true);
    const res  = await fetch(`${BASE_URL}${endpoint}`, options);
    const text = await res.text();
    showSpinner(false);
    let data;
    try { data = JSON.parse(text); }
    catch { throw new Error("Server returned invalid response — make sure the backend is running."); }
    if (!res.ok) throw new Error(data.message || data.error || "Server error");
    return data;
  } catch (err) {
    showSpinner(false);
    throw err;
  }
}
 
/* ─────────────────────────────────────────────────────────
   SPINNER
───────────────────────────────────────────────────────── */
function showSpinner(show) {
  let s = document.getElementById("globalSpinner");
  if (!s) {
    s = document.createElement("div");
    s.id = "globalSpinner";
    s.style.cssText = "position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:9999";
    s.innerHTML = `<div style="width:48px;height:48px;border:4px solid rgba(201,168,76,.2);border-top-color:var(--gold);border-radius:50%;animation:spin .8s linear infinite"></div>`;
    const style = document.createElement("style");
    style.textContent = "@keyframes spin{to{transform:rotate(360deg)}}";
    document.head.appendChild(style);
    document.body.appendChild(s);
  }
  s.style.display = show ? "flex" : "none";
}
 
/* ─────────────────────────────────────────────────────────
   STATIC DATA
───────────────────────────────────────────────────────── */
const HALLS = [
  { id:1, name:"Royal Grand Hall",   location:"MG Road, Udupi",     capacity:800,  price:85000,  tags:["AC","Parking","Wi-Fi"] },
  { id:2, name:"Shanthi Mahal",      location:"Manipal, Udupi",     capacity:500,  price:55000,  tags:["AC","Stage","Catering"] },
  { id:3, name:"Pearl Banquet",      location:"Kunjibettu, Udupi",  capacity:300,  price:38000,  tags:["AC","Parking"] },
  { id:4, name:"Emerald Convention", location:"Puttur Road, Udupi", capacity:1200, price:130000, tags:["AC","Parking","Generator"] },
  { id:5, name:"Coconut Grove Hall", location:"Kaup, Udupi",        capacity:250,  price:28000,  tags:["Garden","Parking"] },
  { id:6, name:"Heritage Palace",    location:"Brahmavar, Udupi",   capacity:600,  price:70000,  tags:["AC","Heritage","Parking"] },
];
 
const FOOD_PACKAGES = [
  { id:"basic",   icon:"🥗", name:"Garden Fresh",  desc:"Veg only — 3 curries, rice, roti, dal, raita, dessert",           price:250 },
  { id:"classic", icon:"🍛", name:"Classic Feast", desc:"Veg + Non-Veg — Biryani, 2 curries, starters, dessert",           price:380 },
  { id:"royal",   icon:"👑", name:"Royal Banquet", desc:"Premium multi-cuisine — Live counters, 10+ items, dessert spread", price:600 },
  { id:"snack",   icon:"🍢", name:"Snack Box",     desc:"Light bites — Samosa, kababs, sandwiches, tea/coffee",            price:150 },
  { id:"dinner",  icon:"🌙", name:"Grand Dinner",  desc:"Elegant dinner spread — 3-course meal with mocktails",             price:500 },
  { id:"kids",    icon:"🎉", name:"Kids Special",  desc:"Fun menu — Pizza, pasta, nuggets, ice cream, juice",              price:200 },
];
 
const MENU_ITEMS = [
  /* ── Starters ── */
  { id:"m01", name:"Veg Spring Rolls",      category:"Starters", type:"veg",    price:60,  icon:"🥢" },
  { id:"m02", name:"Paneer Tikka",          category:"Starters", type:"veg",    price:90,  icon:"🧀" },
  { id:"m03", name:"Aloo Tikki",            category:"Starters", type:"veg",    price:50,  icon:"🥔" },
  { id:"m04", name:"Veg Manchurian",        category:"Starters", type:"veg",    price:70,  icon:"🥦" },
  { id:"m05", name:"Samosa (2 pcs)",        category:"Starters", type:"veg",    price:30,  icon:"🥟" },
  { id:"m06", name:"Chicken Tikka",         category:"Starters", type:"nonveg", price:120, icon:"🍗" },
  { id:"m07", name:"Chicken Kabab",         category:"Starters", type:"nonveg", price:100, icon:"🍢" },
  { id:"m08", name:"Fish Fingers",          category:"Starters", type:"nonveg", price:110, icon:"🐟" },
  { id:"m09", name:"Prawns Fry",            category:"Starters", type:"nonveg", price:180, icon:"🦐" },
  { id:"m10", name:"Mutton Seekh Kabab",    category:"Starters", type:"nonveg", price:160, icon:"🍖" },
  /* ── Main Course ── */
  { id:"m11", name:"Paneer Butter Masala",  category:"Main Course", type:"veg",    price:100, icon:"🧀" },
  { id:"m12", name:"Dal Makhani",           category:"Main Course", type:"veg",    price:80,  icon:"🫘" },
  { id:"m13", name:"Veg Biryani",           category:"Main Course", type:"veg",    price:120, icon:"🍚" },
  { id:"m14", name:"Palak Paneer",          category:"Main Course", type:"veg",    price:90,  icon:"🥬" },
  { id:"m15", name:"Veg Pulao",             category:"Main Course", type:"veg",    price:80,  icon:"🍛" },
  { id:"m16", name:"Chole Bhature",         category:"Main Course", type:"veg",    price:70,  icon:"🫓" },
  { id:"m17", name:"Dal Fry",               category:"Main Course", type:"veg",    price:70,  icon:"🍲" },
  { id:"m18", name:"Chicken Biryani",       category:"Main Course", type:"nonveg", price:140, icon:"🍗" },
  { id:"m19", name:"Mutton Curry",          category:"Main Course", type:"nonveg", price:200, icon:"🥩" },
  { id:"m20", name:"Butter Chicken",        category:"Main Course", type:"nonveg", price:150, icon:"🍛" },
  { id:"m21", name:"Fish Curry",            category:"Main Course", type:"nonveg", price:130, icon:"🐠" },
  { id:"m22", name:"Prawn Masala",          category:"Main Course", type:"nonveg", price:220, icon:"🦐" },
  { id:"m23", name:"Egg Curry",             category:"Main Course", type:"nonveg", price:90,  icon:"🥚" },
  /* ── Breads (veg) ── */
  { id:"m24", name:"Naan (2 pcs)",          category:"Breads", type:"veg",    price:30, icon:"🫓" },
  { id:"m25", name:"Tandoori Roti (2 pcs)", category:"Breads", type:"veg",    price:20, icon:"🫓" },
  { id:"m26", name:"Paratha (2 pcs)",       category:"Breads", type:"veg",    price:25, icon:"🫓" },
  { id:"m27", name:"Puri (4 pcs)",          category:"Breads", type:"veg",    price:25, icon:"🫓" },
  /* ── Breads (non-veg) — FIXED ── */
  { id:"m27b", name:"Keema Naan (2 pcs)",     category:"Breads", type:"nonveg", price:60, icon:"🫓" },
  { id:"m27c", name:"Chicken Kathi Roll",      category:"Breads", type:"nonveg", price:80, icon:"🌯" },
  { id:"m27d", name:"Mutton Paratha (2 pcs)",  category:"Breads", type:"nonveg", price:70, icon:"🫓" },
  { id:"m27e", name:"Egg Paratha (2 pcs)",     category:"Breads", type:"nonveg", price:40, icon:"🍳" },
  /* ── Rice (veg) ── */
  { id:"m28", name:"Steamed Rice",          category:"Rice", type:"veg",    price:40, icon:"🍚" },
  { id:"m29", name:"Jeera Rice",            category:"Rice", type:"veg",    price:50, icon:"🍚" },
  /* ── Rice (non-veg) — FIXED ── */
  { id:"m29c", name:"Chicken Fried Rice",   category:"Rice", type:"nonveg", price:110, icon:"🍗" },
  { id:"m29d", name:"Mutton Biryani",        category:"Rice", type:"nonveg", price:160, icon:"🥩" },
  { id:"m29e", name:"Prawn Fried Rice",      category:"Rice", type:"nonveg", price:140, icon:"🦐" },
  { id:"m29f", name:"Egg Fried Rice",        category:"Rice", type:"nonveg", price:80,  icon:"🥚" },
  /* ── Salads (veg) ── */
  { id:"m30", name:"Green Salad",           category:"Salads", type:"veg",    price:40, icon:"🥗" },
  { id:"m31", name:"Raita",                 category:"Salads", type:"veg",    price:35, icon:"🥣" },
  /* ── Salads (non-veg) — FIXED ── */
  { id:"m31b", name:"Chicken Caesar Salad", category:"Salads", type:"nonveg", price:90, icon:"🥗" },
  { id:"m31c", name:"Egg Salad",            category:"Salads", type:"nonveg", price:60, icon:"🥚" },
  /* ── Desserts ── */
  { id:"m32", name:"Gulab Jamun (2 pcs)",   category:"Desserts", type:"veg",    price:40, icon:"🍮" },
  { id:"m33", name:"Ice Cream",             category:"Desserts", type:"veg",    price:50, icon:"🍦" },
  { id:"m34", name:"Kheer",                 category:"Desserts", type:"veg",    price:45, icon:"🥛" },
  { id:"m35", name:"Rasmalai (2 pcs)",      category:"Desserts", type:"veg",    price:55, icon:"🍮" },
  { id:"m36", name:"Halwa",                 category:"Desserts", type:"veg",    price:40, icon:"🍯" },
  /* ── Desserts (non-veg) — ADDED ── */
  { id:"m36b", name:"Egg Pudding",          category:"Desserts", type:"nonveg", price:55, icon:"🍮" },
  { id:"m36c", name:"Caramel Custard",      category:"Desserts", type:"nonveg", price:60, icon:"🍮" },
  { id:"m36d", name:"Chicken Cake",         category:"Desserts", type:"nonveg", price:80, icon:"🎂" },
  { id:"m36e", name:"Egg Brownie",          category:"Desserts", type:"nonveg", price:65, icon:"🍫" },
  /* ── Beverages (veg) ── */
  { id:"m37", name:"Fresh Lime Water",      category:"Beverages", type:"veg",    price:25, icon:"🍋" },
  { id:"m38", name:"Mango Lassi",           category:"Beverages", type:"veg",    price:40, icon:"🥭" },
  { id:"m39", name:"Masala Chai",           category:"Beverages", type:"veg",    price:20, icon:"☕" },
  { id:"m40", name:"Cold Coffee",           category:"Beverages", type:"veg",    price:45, icon:"☕" },
  /* ── Beverages (non-veg) — FIXED ── */
  { id:"m40b", name:"Chicken Shorba",       category:"Beverages", type:"nonveg", price:70, icon:"🍵" },
  { id:"m40c", name:"Mutton Bone Soup",     category:"Beverages", type:"nonveg", price:80, icon:"🦴" },
];
 
/* ── 6 UNIQUE stage designs (NO duplicates) ── */
const STAGE_DESIGNS = [
  { id:"floral",  name:"Floral Bloom",    price:15000, img:"./images/stages/floral.jpg",  desc:"Lush flower walls, pastel drapes & fresh blooms",         badge:"Most Popular" },
  { id:"royal",   name:"Royal Gold",      price:25000, img:"./images/stages/royal.jpg",   desc:"Gold pillars, velvet backdrop & crystal chandeliers",      badge:"Premium" },
  { id:"modern",  name:"Modern LED",      price:18000, img:"./images/stages/modern.jpg",  desc:"LED video wall, dynamic lighting & sleek panels",          badge:"Trending" },
  { id:"rustic",  name:"Rustic Garden",   price:12000, img:"./images/stages/rustic.jpg",  desc:"Wooden arch, fairy lights & earthy greenery",              badge:"" },
  { id:"fairy",   name:"Fairy Lights",    price:10000, img:"./images/stages/fairy.jpg",   desc:"Warm string lights, sheer curtains & dreamy glow",         badge:"Budget Pick" },
  { id:"crystal", name:"Premium Crystal", price:35000, img:"./images/stages/crystal.jpg", desc:"Crystal backdrop, laser lights & luxury draping",          badge:"Luxury" },
];
 
/* ─────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────── */
let currentUser       = null;
let selectedHall      = null;
let selectedPackage   = null;
let selectedMenuItems = {};
let selectedStage     = null;
let selectedPayMethod = null;
let currentStep       = 1;
let foodMode          = "package";
let lastBooking       = null;
const _bookingMap     = {};  // shared with cancel_booking.js
 
/* ─────────────────────────────────────────────────────────
   SESSION
───────────────────────────────────────────────────────── */
function saveSession(user) {
  const safe = { id:user.id, name:user.name, email:user.email, phone:user.phone };
  localStorage.setItem("eh_session", JSON.stringify(safe));
}
function loadSession()  { try { return JSON.parse(localStorage.getItem("eh_session")); } catch { return null; } }
function clearSession() { localStorage.removeItem("eh_session"); }
 
/* ─────────────────────────────────────────────────────────
   PARTICLES
───────────────────────────────────────────────────────── */
function initParticles() {
  const c = document.getElementById("heroParticles");
  if (!c) return;
  for (let i = 0; i < 18; i++) {
    const d = document.createElement("div");
    d.className = "particle";
    d.style.cssText = `left:${Math.random()*100}%;animation-duration:${8+Math.random()*12}s;animation-delay:${Math.random()*10}s;width:${1+Math.random()*3}px;height:${1+Math.random()*3}px`;
    c.appendChild(d);
  }
}
 
/* ─────────────────────────────────────────────────────────
   MODAL HELPERS
───────────────────────────────────────────────────────── */
function openModal(id)  { document.getElementById(id).classList.add("open"); }
function closeModal(id) { document.getElementById(id).classList.remove("open"); }
 
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".modal-overlay").forEach(o => {
    o.addEventListener("click", e => { if (e.target === o) o.classList.remove("open"); });
  });
});
 
/* ═══════════════════════════════════════════════════════════
   AUTH
   ═══════════════════════════════════════════════════════════ */
function switchTab(tab) {
  document.getElementById("loginForm").style.display    = tab==="login"    ? "block" : "none";
  document.getElementById("registerForm").style.display = tab==="register" ? "block" : "none";
  document.getElementById("loginTab").classList.toggle("active",    tab==="login");
  document.getElementById("registerTab").classList.toggle("active", tab==="register");
}
 
async function doRegister() {
  const name  = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const pass  = document.getElementById("regPassword").value;
  const phone = document.getElementById("regPhone").value.trim();
  if (!name||!email||!pass||!phone) { toast("Please fill all fields","error"); return; }
  if (pass.length < 8)              { toast("Password must be at least 8 characters","error"); return; }
  const phoneDigits = phone.replace(/\D/g, ""); // strip non-digits
  if (phoneDigits.length !== 10) { toast("Phone number must be exactly 10 digits", "error"); return; }
  if (!/^[6-9]/.test(phoneDigits)) { toast("Enter a valid Indian mobile number (starts with 6–9)", "error"); return; }
  try {
    await api("/register","POST",{ name, email, password:pass, phone });
    toast(`Registered! Please login, ${name} 🎉`,"success");
    switchTab("login");
    document.getElementById("loginEmail").value = email;
  } catch (err) {
    const msg = err.message.toLowerCase();
    toast(msg.includes("dup")||msg.includes("exists") ? "Email already registered." : "Registration failed: "+err.message, "error");
  }
}
 
async function doLogin() {
  const email = document.getElementById("loginEmail").value.trim();
  const pass  = document.getElementById("loginPassword").value;
  if (!email||!pass) { toast("Please fill all fields","error"); return; }
  try {
    const data = await api("/login","POST",{ email, password:pass });
    currentUser = { id:data.user.id, name:data.user.name, email:data.user.email, phone:data.user.phone };
    saveSession(currentUser);
    applyLoginUI();
    closeModal("authModal");
    toast(`Welcome back, ${currentUser.name.split(" ")[0]}! 🎉`,"success");
    checkUnreadMessages();
  } catch (err) {
    toast(err.message || "Invalid email or password","error");
  }
}
 
function logout() {
  currentUser = null;
  clearSession();
  document.getElementById("loginBtn").style.display          = "inline-flex";
  document.getElementById("logoutBtn").style.display         = "none";
  document.getElementById("bookingDetailsBtn").style.display = "none";
  document.getElementById("messagesBtn").style.display       = "none";
  document.getElementById("userName").style.display          = "none";
  document.getElementById("bookingSection").style.display    = "none";
  window.scrollTo({ top:0, behavior:"smooth" });
  toast("Logged out successfully","info");
}
 
function applyLoginUI() {
  document.getElementById("loginBtn").style.display          = "none";
  document.getElementById("logoutBtn").style.display         = "inline-flex";
  document.getElementById("bookingDetailsBtn").style.display = "inline-flex";
  document.getElementById("messagesBtn").style.display       = "inline-flex";
  const un = document.getElementById("userName");
  un.textContent   = `Hi, ${currentUser.name.split(" ")[0]}`;
  un.style.display = "inline";
  checkUnreadMessages();
}
 
/* ═══════════════════════════════════════════════════════════
   MESSAGES
   ═══════════════════════════════════════════════════════════ */
async function checkUnreadMessages() {
  if (!currentUser) return;
  try {
    const data  = await api(`/messages/${currentUser.id}/unread-count`);
    const badge = document.getElementById("msgBadge");
    if (badge) {
      badge.textContent   = data.count || 0;
      badge.style.display = data.count > 0 ? "inline-flex" : "none";
    }
  } catch { /* silent */ }
}
 
async function openMessagesModal() {
  if (!currentUser) { toast("Please login first","info"); openModal("authModal"); return; }
  const list = document.getElementById("messagesList");
  list.innerHTML = `<div style="text-align:center;padding:2rem;color:var(--text2)">⏳ Loading messages…</div>`;
  openModal("messagesModal");
  try {
    const messages = await api(`/messages/${currentUser.id}`);
    if (!messages.length) {
      list.innerHTML = `<div style="text-align:center;padding:2.5rem;color:var(--text2)"><div style="font-size:2.5rem;margin-bottom:.5rem">📭</div><p>No messages yet.</p></div>`;
      return;
    }
    list.innerHTML = messages.map(m => `
      <div class="msg-item ${m.is_read ? "" : "unread"}" onclick="markRead(${m.id}, this)">
        ${!m.is_read ? '<span class="msg-unread-dot"></span>' : ""}
        <div class="msg-subject">${m.subject}</div>
        <div class="msg-body">${m.body}</div>
        <div class="msg-meta">
          ${m.booking_id && m.booking_id !== 'GENERAL' ? `<span>Booking: <strong style="color:var(--gold)">${m.booking_id}</strong></span>` : '<span>General Message</span>'}
          <span>${new Date(m.created_at).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</span>
        </div>
      </div>
    `).join("");
    // Update badge
    checkUnreadMessages();
  } catch (err) {
    list.innerHTML = `<div style="text-align:center;padding:2rem;color:#f88">❌ ${err.message}</div>`;
  }
}
 
async function markRead(id, el) {
  if (!el.classList.contains("unread")) return;
  try {
    await api(`/messages/${id}/read`, "PUT");
    el.classList.remove("unread");
    el.querySelector(".msg-unread-dot")?.remove();
    checkUnreadMessages();
  } catch { /* silent */ }
}
 
/* ═══════════════════════════════════════════════════════════
   MY BOOKINGS
   ═══════════════════════════════════════════════════════════ */
async function openBookingDetails() {
  if (!currentUser) { toast("Please login first","info"); openModal("authModal"); return; }
  const list = document.getElementById("bookingDetailsList");
  list.innerHTML = `<div style="text-align:center;padding:2.5rem;color:var(--text2)"><div style="font-size:2rem;margin-bottom:.5rem">⏳</div>Loading your bookings…</div>`;
  openModal("bookingDetailsModal");
  try {
    const data     = await api(`/bookings/${currentUser.id}`);
    const bookings = Array.isArray(data) ? data : (data.bookings || []);
    if (!bookings.length) {
      list.innerHTML = `<div class="no-bookings"><div class="big">📭</div><p>No bookings yet.</p><button class="btn btn-gold" style="margin-top:1rem;border-radius:50px" onclick="closeModal('bookingDetailsModal');startBooking()">Book Your First Event</button></div>`;
      return;
    }
    bookings.forEach(b => { _bookingMap[b.booking_id] = b; });
    list.innerHTML = bookings.map(b => buildBookingCard(b)).join("");
  } catch (err) {
    list.innerHTML = `<div style="text-align:center;padding:2rem;color:#f88">❌ ${err.message}</div>`;
  }
}
 
function buildBookingCard(b) {
  let foodLabel = "";
  try {
    const fi = typeof b.food_items === "string" ? JSON.parse(b.food_items) : b.food_items;
    if (fi) {
      if (fi.mode === "package") foodLabel = `📦 ${fi.name}`;
      else if (fi.mode === "manual" && fi.items?.length) foodLabel = `🧾 Custom (${fi.items.length} dishes)`;
    }
  } catch { foodLabel = b.food_items || ""; }
 
  const hall       = HALLS.find(h => h.id == b.hall_id);
  const hallName   = hall ? hall.name : `Hall #${b.hall_id}`;
  const dateStr    = b.event_date ? new Date(b.event_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}) : b.event_date;
  const isCancelled = b.status === "cancelled";
  const today       = new Date(); today.setHours(0,0,0,0);
  const canCancel   = !isCancelled && new Date(b.event_date) > today;
 
  let cancelHtml = "";
  if (isCancelled)   cancelHtml = `<div class="cancelled-badge">✗ Booking Cancelled</div>`;
  else if (canCancel) cancelHtml = `<button class="cancel-booking-btn" onclick="openCancelModalById('${b.booking_id}')">🚫 Cancel This Booking</button>`;
  else                cancelHtml = `<div style="text-align:center;margin-top:.8rem;font-size:.78rem;color:var(--text2)">⚠️ Cannot cancel — event date has passed</div>`;
 
  return `
    <div class="booking-detail-card" id="bcard-${b.booking_id}">
      <div class="booking-status ${isCancelled?"cancelled":"confirmed"}">${isCancelled?"✗ Cancelled":"✓ Confirmed"}</div>
      <div class="booking-detail-row"><span class="lbl">Booking ID</span><span class="val" style="color:var(--gold)">${b.booking_id}</span></div>
      <div class="booking-detail-row"><span class="lbl">Event Type</span><span class="val">${b.event_type}</span></div>
      <div class="booking-detail-row"><span class="lbl">Date</span><span class="val">${dateStr}</span></div>
      <div class="booking-detail-row"><span class="lbl">Time Slot</span><span class="val">${b.time_slot==="morning"?"Morning (8AM–4PM)":"Evening (5PM–1AM)"}</span></div>
      <div class="booking-detail-row"><span class="lbl">Guests</span><span class="val">${b.participants}</span></div>
      <div class="booking-detail-row"><span class="lbl">Hall</span><span class="val">${hallName}</span></div>
      ${foodLabel?`<div class="booking-detail-row"><span class="lbl">Food</span><span class="val">${foodLabel}</span></div>`:""}
      ${b.stage_design?`<div class="booking-detail-row"><span class="lbl">Stage</span><span class="val">${b.stage_design}</span></div>`:""}
      <div class="booking-detail-row"><span class="lbl">Payment</span><span class="val">${b.payment_method}</span></div>
      <div class="booking-detail-row"><span class="lbl">Advance Paid</span><span class="val" style="color:var(--gold)">₹${Number(b.advance_paid).toLocaleString("en-IN")}</span></div>
      <div class="booking-detail-row"><span class="lbl">Remaining</span><span class="val">₹${Number(b.remaining_amount).toLocaleString("en-IN")}</span></div>
      <div class="booking-detail-row"><span class="lbl">Total</span><span class="val">₹${Number(b.total_amount).toLocaleString("en-IN")}</span></div>
      ${cancelHtml}
    </div>`;
}
 
/* ═══════════════════════════════════════════════════════════
   NAVIGATION
   ═══════════════════════════════════════════════════════════ */
function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior:"smooth" });
}
 
function startBooking() {
  if (!currentUser) { toast("Please login to book an event","info"); openModal("authModal"); return; }
  const section = document.getElementById("bookingSection");
  section.style.display = "block";
  setMinDate();
  section.scrollIntoView({ behavior:"smooth" });
}
 
/* ─────────────────────────────────────────────────────────
   DATE — FUTURE ONLY (tomorrow+)
───────────────────────────────────────────────────────── */
function setMinDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yyyy = tomorrow.getFullYear();
  const mm   = String(tomorrow.getMonth()+1).padStart(2,"0");
  const dd   = String(tomorrow.getDate()).padStart(2,"0");
  const minVal = `${yyyy}-${mm}-${dd}`;
  const inp = document.getElementById("eventDate");
  if (inp) { inp.min = minVal; if (inp.value && inp.value <= minVal) inp.value = ""; }
}
 
/* ═══════════════════════════════════════════════════════════
   STEPPER
   ═══════════════════════════════════════════════════════════ */
function showStep(n) {
  document.querySelectorAll(".form-step").forEach(s => s.classList.remove("active"));
  document.getElementById("step"+n).classList.add("active");
  for (let i=1; i<=4; i++) {
    const s = document.getElementById("s"+i);
    s.classList.remove("active","done");
    if (i<n)  s.classList.add("done");
    if (i===n) s.classList.add("active");
    if (i<4) document.getElementById("sl"+i).classList.toggle("done", i<n);
  }
  currentStep = n;
  document.getElementById("bookingSection").scrollIntoView({ behavior:"smooth" });
}
 
async function nextStep(from) {
  if (from===1) {
    if (!validateStep1()) return;
    showStep(2);
    renderHalls();
    return;
  }
  if (from===2) {
    if (!selectedHall) { toast("Please select a hall","error"); return; }
    const date     = document.getElementById("eventDate").value;
    const timeSlot = document.getElementById("timeSlot").value;
    try {
      const result = await api("/check-availability","POST",{ hall_id:selectedHall.id, event_date:date, time_slot:timeSlot });
      if (!result.available) {
        const msg = document.getElementById("availabilityMessage");
        msg.textContent = `⚠️ "${selectedHall.name}" is already booked for ${date} (${timeSlot} slot). Please choose another.`;
        msg.style.display = "block";
        selectedHall = null;
        document.getElementById("selectHallBtn").disabled = true;
        renderHalls();
        toast("Hall not available for this date & slot","error");
        return;
      }
      document.getElementById("availabilityMessage").style.display = "none";
    } catch (err) { toast("Availability check failed: "+err.message,"error"); return; }
    showStep(3);
    renderAddons();
    return;
  }
  if (from===3) { buildSummary(); showStep(4); return; }
}
 
function prevStep(from) { showStep(from-1); }
 
/* ─────────────────────────────────────────────────────────
   STEP 1 VALIDATION — strict future date
───────────────────────────────────────────────────────── */
function validateStep1() {
  if (!document.getElementById("eventType").value)  { toast("Please select an event type","error"); return false; }
  if (!document.getElementById("timeSlot").value)   { toast("Please select a time slot","error");   return false; }
  const dateVal = document.getElementById("eventDate").value;
  if (!dateVal) { toast("Please select a date","error"); return false; }
  const now      = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  if (dateVal <= todayStr) { toast("Please select a future date (tomorrow or later)","error"); return false; }
  const guests = parseInt(document.getElementById("participants").value);
  if (!guests || guests < 10) { toast("Please enter at least 10 guests","error"); return false; }
  return true;
}
 
/* ─────────────────────────────────────────────────────────
   STEP 2 — HALLS
───────────────────────────────────────────────────────── */
function renderHalls(filter="") {
  const guests   = parseInt(document.getElementById("participants").value) || 0;
  const list     = document.getElementById("hallsList");
  const query    = filter.toLowerCase();
  const filtered = HALLS.filter(h => (h.name+" "+h.location).toLowerCase().includes(query) && h.capacity >= guests);
  if (!filtered.length) {
    list.innerHTML = `<p style="color:var(--text2);grid-column:1/-1;text-align:center;padding:2rem">No halls match your search or guest count.</p>`;
    return;
  }
  list.innerHTML = filtered.map(h => `
    <div class="hall-card ${selectedHall&&selectedHall.id===h.id?"selected":""}" onclick="selectHall(${h.id})">
      <div class="hall-name">${h.name}</div>
      <div class="hall-location">📍 ${h.location}</div>
      <div class="hall-meta">
        <span class="hall-tag">👥 Up to ${h.capacity.toLocaleString()}</span>
        ${h.tags.map(t=>`<span class="hall-tag">${t}</span>`).join("")}
      </div>
      <div class="hall-price">₹${h.price.toLocaleString()} <span>/ day</span></div>
    </div>
  `).join("");
}
 
function filterHalls() { renderHalls(document.getElementById("locationSearch").value); }
 
function selectHall(id) {
  selectedHall = HALLS.find(h => h.id===id);
  document.getElementById("selectHallBtn").disabled = false;
  document.getElementById("availabilityMessage").style.display = "none";
  renderHalls(document.getElementById("locationSearch").value);
  toast(`${selectedHall.name} selected ✓`,"success");
}
 
/* ─────────────────────────────────────────────────────────
   STEP 3 — ADD-ONS
───────────────────────────────────────────────────────── */
function renderAddons() {
  const foodRequired = document.getElementById("foodRequired").checked;
  const foodSection  = document.getElementById("foodSection");
  foodSection.style.display = foodRequired ? "block" : "none";
 
  if (foodRequired) {
    foodSection.innerHTML = `
      <h3 class="section-sub">🍽️ Food Selection</h3>
      <div class="food-mode-tabs">
        <button class="food-tab-btn ${foodMode==="package"?"active":""}" onclick="setFoodMode('package')">📦 Food Packages</button>
        <button class="food-tab-btn ${foodMode==="manual"?"active":""}"  onclick="setFoodMode('manual')">🧾 Build Your Own Menu</button>
      </div>
      <div id="packageModePanel" style="display:${foodMode==="package"?"block":"none"}">
        <p class="food-mode-hint">Choose one of our curated packages — great value, hassle-free.</p>
        <div class="packages-grid" id="packagesGrid"></div>
      </div>
      <div id="manualModePanel" style="display:${foodMode==="manual"?"block":"none"}">
        <p class="food-mode-hint">Hand-pick each dish. Price shown is per person.</p>
        <div class="manual-search-bar">
          <div class="manual-search-input-wrap">
            <span class="search-icon">🔍</span>
            <input type="text" id="menuSearch" placeholder="Search dishes…" oninput="renderMenuItems()"/>
            <button class="search-clear-btn" id="searchClearBtn" onclick="clearMenuSearch()">✕</button>
          </div>
          <div class="manual-filter-row">
            <button class="filter-chip active" onclick="setMenuFilter('all',this)">All</button>
            <button class="filter-chip"        onclick="setMenuFilter('veg',this)">🟢 Veg</button>
            <button class="filter-chip"        onclick="setMenuFilter('nonveg',this)">🔴 Non-Veg</button>
          </div>
          <div class="manual-cat-row" id="catFilterRow"></div>
        </div>
        <div id="menuItemsGrid"></div>
        <div class="manual-cart-bar" id="manualCartBar" style="display:none">
          <div class="cart-bar-info">
            <span class="cart-bar-count" id="cartItemCount">0 items</span>
            <span class="cart-bar-price" id="cartTotalPreview">₹0 / person</span>
          </div>
          <button class="btn btn-outline" style="font-size:.8rem;padding:.4rem .9rem" onclick="toggleCartPreview()">View Selection</button>
        </div>
        <div class="manual-cart-preview" id="manualCartPreview" style="display:none">
          <h4 style="font-family:'Cormorant Garamond',serif;color:var(--cream);margin-bottom:.8rem">🛒 Your Selected Items</h4>
          <div id="cartPreviewList"></div>
        </div>
      </div>`;
    renderPackages();
    renderCatChips();
    renderMenuItems();
  }
 
  renderStageGrid();
}
 
function setFoodMode(mode) {
  foodMode = mode;
  document.querySelectorAll(".food-tab-btn").forEach(b => {
    b.classList.toggle("active", (mode==="package"&&b.textContent.includes("Package"))||(mode==="manual"&&b.textContent.includes("Build")));
  });
  document.getElementById("packageModePanel").style.display = mode==="package"?"block":"none";
  document.getElementById("manualModePanel").style.display  = mode==="manual" ?"block":"none";
  if (mode==="manual")  { selectedPackage=null; renderPackages(); }
  if (mode==="package") { selectedMenuItems={}; }
}
 
function renderPackages() {
  const g = document.getElementById("packagesGrid");
  if (!g) return;
  g.innerHTML = FOOD_PACKAGES.map(p => `
    <div class="pkg-card ${selectedPackage&&selectedPackage.id===p.id?"selected":""}" onclick="selectPackage('${p.id}')">
      <div class="pkg-icon">${p.icon}</div>
      <div class="pkg-name">${p.name}</div>
      <div class="pkg-desc">${p.desc}</div>
      <div class="pkg-price">₹${p.price} <span>/ person</span></div>
    </div>`).join("");
}
 
function selectPackage(id) {
  selectedPackage = FOOD_PACKAGES.find(p => p.id===id);
  renderPackages();
  toast(`${selectedPackage.name} package selected`,"success");
}
 
let menuTypeFilter = "all";
let menuCatFilter  = "all";
 
function setMenuFilter(filter, btn) {
  menuTypeFilter = filter;
  document.querySelectorAll(".filter-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderMenuItems();
}
 
function setMenuCatFilter(cat, btn) {
  menuCatFilter = cat;
  document.querySelectorAll(".cat-chip").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  renderMenuItems();
}
 
function renderCatChips() {
  const row  = document.getElementById("catFilterRow");
  if (!row) return;
  const cats = ["All", ...new Set(MENU_ITEMS.map(i=>i.category))];
  row.innerHTML = cats.map((c,idx) => `<button class="cat-chip ${idx===0?"active":""}" onclick="setMenuCatFilter('${c==="All"?"all":c}',this)">${c}</button>`).join("");
}
 
function clearMenuSearch() {
  const el = document.getElementById("menuSearch");
  if (el) { el.value=""; renderMenuItems(); el.focus(); }
}
 
function renderMenuItems() {
  const query    = (document.getElementById("menuSearch")?.value||"").toLowerCase().trim();
  const clearBtn = document.getElementById("searchClearBtn");
  if (clearBtn) clearBtn.style.display = query?"flex":"none";
  let items = [...MENU_ITEMS];
  if (menuTypeFilter!=="all") items = items.filter(i=>i.type===menuTypeFilter);
  if (menuCatFilter!=="all")  items = items.filter(i=>i.category===menuCatFilter);
  if (query) items = items.filter(i=>i.name.toLowerCase().includes(query)||i.category.toLowerCase().includes(query));
  const grid = document.getElementById("menuItemsGrid");
  if (!grid) return;
  if (!items.length) { grid.innerHTML=`<div class="menu-empty"><div style="font-size:2.5rem">🍽️</div><p>No dishes found</p><button class="btn btn-ghost" style="font-size:.8rem;margin-top:.5rem" onclick="clearMenuSearch()">Clear</button></div>`; return; }
  const grouped = {};
  items.forEach(item => { if (!grouped[item.category]) grouped[item.category]=[]; grouped[item.category].push(item); });
  grid.innerHTML = Object.entries(grouped).map(([cat,catItems]) => `
    <div class="menu-category-block">
      <div class="menu-cat-header">${cat}</div>
      <div class="menu-items-list">
        ${catItems.map(item => {
          const qty = selectedMenuItems[item.id]||0;
          return `<div class="menu-item-row ${qty>0?"in-cart":""}" id="mir-${item.id}">
            <span class="menu-item-type ${item.type==="veg"?"veg":"nonveg"}"></span>
            <span class="menu-item-icon">${item.icon}</span>
            <div class="menu-item-info"><span class="menu-item-name">${item.name}</span><span class="menu-item-price">₹${item.price} / person</span></div>
            <div class="menu-item-qty" id="qty-${item.id}">
              ${qty>0
                ?`<button class="qty-btn minus" onclick="changeQty('${item.id}',-1)">−</button><span class="qty-num">${qty}</span><button class="qty-btn plus" onclick="changeQty('${item.id}',1)">+</button>`
                :`<button class="qty-btn add-btn" onclick="changeQty('${item.id}',1)">+ Add</button>`}
            </div>
          </div>`;
        }).join("")}
      </div>
    </div>`).join("");
  updateCartBar();
}
 
function changeQty(itemId, delta) {
  const newQty = Math.max(0,(selectedMenuItems[itemId]||0)+delta);
  if (newQty===0) delete selectedMenuItems[itemId]; else selectedMenuItems[itemId]=newQty;
  const qtyEl = document.getElementById("qty-"+itemId);
  const rowEl = document.getElementById("mir-"+itemId);
  const qty   = selectedMenuItems[itemId]||0;
  if (qtyEl) qtyEl.innerHTML = qty>0
    ?`<button class="qty-btn minus" onclick="changeQty('${itemId}',-1)">−</button><span class="qty-num">${qty}</span><button class="qty-btn plus" onclick="changeQty('${itemId}',1)">+</button>`
    :`<button class="qty-btn add-btn" onclick="changeQty('${itemId}',1)">+ Add</button>`;
  if (rowEl) rowEl.classList.toggle("in-cart",qty>0);
  updateCartBar();
  updateCartPreview();
}
 
function updateCartBar() {
  const ids       = Object.keys(selectedMenuItems);
  const perPerson = ids.reduce((sum,id) => { const i=MENU_ITEMS.find(x=>x.id===id); return sum+(i?i.price*(selectedMenuItems[id]||1):0); },0);
  const bar = document.getElementById("manualCartBar");
  if (bar) bar.style.display = ids.length>0?"flex":"none";
  const cc = document.getElementById("cartItemCount");
  const cp = document.getElementById("cartTotalPreview");
  if (cc) cc.textContent = `${ids.length} dish${ids.length!==1?"es":""} selected`;
  if (cp) cp.textContent = `₹${perPerson.toLocaleString()} / person`;
}
 
function toggleCartPreview() {
  const el = document.getElementById("manualCartPreview");
  if (!el) return;
  el.style.display = el.style.display!=="none"?"none":"block";
  if (el.style.display==="block") updateCartPreview();
}
 
function updateCartPreview() {
  const list = document.getElementById("cartPreviewList");
  if (!list) return;
  const ids = Object.keys(selectedMenuItems);
  if (!ids.length) { list.innerHTML=`<p style="color:var(--text2);font-size:.85rem">No items added yet.</p>`; return; }
  list.innerHTML = ids.map(id => {
    const item = MENU_ITEMS.find(i=>i.id===id);
    if (!item) return "";
    const qty = selectedMenuItems[id];
    return `<div class="cart-preview-row"><span>${item.icon} ${item.name}</span><div style="display:flex;align-items:center;gap:.5rem"><span style="color:var(--text2);font-size:.8rem">×${qty}</span><span style="color:var(--gold);font-size:.85rem">₹${(item.price*qty).toLocaleString()}/person</span><button class="qty-btn minus" onclick="changeQty('${id}',-${qty})" title="Remove">✕</button></div></div>`;
  }).join("");
}
 
function calcManualFoodPerPerson() {
  return Object.keys(selectedMenuItems).reduce((sum,id)=>{ const i=MENU_ITEMS.find(x=>x.id===id); return sum+(i?i.price*(selectedMenuItems[id]||1):0); },0);
}
 
function selectStage(id) {
  selectedStage = STAGE_DESIGNS.find(s=>s.id===id);
  renderStageGrid();
  toast(`${selectedStage.name} stage selected`,"success");
}
 
function renderStageGrid() {
  const grid = document.getElementById("stageGrid");
  if (!grid) return;
  grid.innerHTML = STAGE_DESIGNS.map(s => `
    <div class="stage-card ${selectedStage&&selectedStage.id===s.id?"selected":""}" onclick="selectStage('${s.id}')">
      <div class="stage-img-wrap">
        <img src="${s.img}" alt="${s.name}" class="stage-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
        <div class="stage-img-fallback" style="display:none">${s.id==="floral"?"🌸":s.id==="royal"?"👑":s.id==="modern"?"💡":s.id==="rustic"?"🌿":s.id==="fairy"?"✨":"🏆"}</div>
        ${s.badge?`<span class="stage-badge">${s.badge}</span>`:""}
        ${selectedStage&&selectedStage.id===s.id?`<div class="stage-selected-overlay">✓ Selected</div>`:""}
      </div>
      <div class="stage-info">
        <div class="stage-name">${s.name}</div>
        <div class="stage-desc">${s.desc}</div>
        <div class="stage-price">₹${s.price.toLocaleString()}<span class="stage-price-label"> / decoration</span></div>
      </div>
    </div>`).join("");
}
 
/* ─────────────────────────────────────────────────────────
   STEP 4 — SUMMARY
───────────────────────────────────────────────────────── */
function calcTotal() {
  const guests       = parseInt(document.getElementById("participants").value)||0;
  const foodRequired = document.getElementById("foodRequired")?.checked;
  let total = selectedHall ? selectedHall.price : 0;
  if (foodRequired) {
    if (foodMode==="package"&&selectedPackage) total += selectedPackage.price*guests;
    else if (foodMode==="manual")              total += calcManualFoodPerPerson()*guests;
  }
  if (selectedStage) total += selectedStage.price;
  return total;
}
 
function buildSummary() {
  const guests       = parseInt(document.getElementById("participants").value)||0;
  const total        = calcTotal();
  const hallCost     = selectedHall ? selectedHall.price : 0;
  const foodRequired = document.getElementById("foodRequired")?.checked;
  let foodCost=0, foodLine="";
  if (foodRequired) {
    if (foodMode==="package"&&selectedPackage) {
      foodCost = selectedPackage.price*guests;
      foodLine = `<div class="bill-row"><span class="bill-label">Food — ${selectedPackage.name} (×${guests})</span><span class="bill-val">₹${foodCost.toLocaleString()}</span></div>`;
    } else if (foodMode==="manual"&&Object.keys(selectedMenuItems).length>0) {
      foodCost = calcManualFoodPerPerson()*guests;
      const names = Object.keys(selectedMenuItems).map(id=>{const i=MENU_ITEMS.find(x=>x.id===id);return i?`${i.icon} ${i.name} ×${selectedMenuItems[id]}`:""}).filter(Boolean).join(", ");
      foodLine = `<div class="bill-row"><span class="bill-label">Custom Menu (${Object.keys(selectedMenuItems).length} dishes × ${guests} guests)</span><span class="bill-val">₹${foodCost.toLocaleString()}</span></div><div class="bill-row-detail"><span class="bill-label" style="font-size:.78rem;color:var(--text2);line-height:1.6">${names}</span></div>`;
    }
  }
  const stageCost = selectedStage ? selectedStage.price : 0;
  document.getElementById("billSummary").innerHTML = `
    <div class="bill-row"><span class="bill-label">Event Type</span><span class="bill-val">${document.getElementById("eventType").value}</span></div>
    <div class="bill-row"><span class="bill-label">Date</span><span class="bill-val">${document.getElementById("eventDate").value}</span></div>
    <div class="bill-row"><span class="bill-label">Time Slot</span><span class="bill-val">${document.getElementById("timeSlot").value==="morning"?"Morning (8AM–4PM)":"Evening (5PM–1AM)"}</span></div>
    <div class="bill-row"><span class="bill-label">Guests</span><span class="bill-val">${guests}</span></div>
    <div class="bill-row"><span class="bill-label">Hall — ${selectedHall?.name}</span><span class="bill-val">₹${hallCost.toLocaleString()}</span></div>
    ${foodLine}
    ${stageCost?`<div class="bill-row"><span class="bill-label">Stage — ${selectedStage.name}</span><span class="bill-val">₹${stageCost.toLocaleString()}</span></div>`:""}
    <div class="bill-row total"><span class="bill-label">Total Amount</span><span class="bill-val gold">₹${total.toLocaleString()}</span></div>`;
  updatePaymentDisplay();
}
 
function updatePaymentDisplay() {
  const total   = calcTotal();
  const advance = document.getElementById("advancePayment")?.checked;
  const amount  = advance ? Math.ceil(total*0.25) : total;
  const el  = document.getElementById("paymentAmount");
  const mel = document.getElementById("payModalAmount");
  if (el)  el.textContent  = advance ? `Advance: ₹${amount.toLocaleString()} (25%)` : "";
  if (mel) mel.textContent = `₹${amount.toLocaleString()}`;
}
 
function selectPayment(method) {
  selectedPayMethod = method;
  document.querySelectorAll(".pay-method-btn").forEach(b => b.classList.toggle("active", b.textContent.trim().toLowerCase().includes(method.toLowerCase())));
  toast(`${method} selected`,"info");
}
 
function openPaymentModal() {
  if (!selectedPayMethod) { toast("Please select a payment method","error"); return; }
  updatePaymentDisplay();
  openModal("paymentModal");
}
 
/* ═══════════════════════════════════════════════════════════
   PROCESS PAYMENT
   ═══════════════════════════════════════════════════════════ */
async function processPayment() {
  const total        = calcTotal();
  const isAdvance    = document.getElementById("advancePayment")?.checked || false;
  const amountPaid   = isAdvance ? Math.ceil(total*0.25) : total;
  const guests       = parseInt(document.getElementById("participants").value)||0;
  const foodRequired = document.getElementById("foodRequired")?.checked;
  const hallCost     = selectedHall ? selectedHall.price : 0;
  let foodItemsJson  = null, foodCost = 0;
 
  if (foodRequired) {
    if (foodMode==="package"&&selectedPackage) {
      foodCost      = selectedPackage.price*guests;
      foodItemsJson = JSON.stringify({ mode:"package", id:selectedPackage.id, name:selectedPackage.name, price:selectedPackage.price });
    } else if (foodMode==="manual"&&Object.keys(selectedMenuItems).length>0) {
      foodCost      = calcManualFoodPerPerson()*guests;
      const items   = Object.keys(selectedMenuItems).map(id=>{ const i=MENU_ITEMS.find(x=>x.id===id); return i?{id,name:i.name,qty:selectedMenuItems[id],price:i.price}:null; }).filter(Boolean);
      foodItemsJson = JSON.stringify({ mode:"manual", items });
    }
  }
 
  const stageCost = selectedStage ? selectedStage.price : 0;
  const payload   = {
    user_id:        currentUser.id,
    hall_id:        selectedHall.id,
    event_type:     document.getElementById("eventType").value,
    event_date:     document.getElementById("eventDate").value,
    time_slot:      document.getElementById("timeSlot").value,
    participants:   guests,
    hall_cost:      hallCost,
    food_items:     foodItemsJson,
    food_cost:      foodCost,
    design_cost:    stageCost,
    stage_design:   selectedStage?.name||null,
    total_amount:   total,
    payment_method: selectedPayMethod,
  };
 
  try {
    const result = await api("/bookings","POST",payload);
    closeModal("paymentModal");
    let foodLabel="";
    if (foodRequired) {
      if (foodMode==="package"&&selectedPackage) foodLabel=`📦 ${selectedPackage.name}`;
      else if (foodMode==="manual"&&Object.keys(selectedMenuItems).length>0) foodLabel=`🧾 Custom Menu (${Object.keys(selectedMenuItems).length} dishes)`;
    }
    showSuccessScreen({
      booking_id: result.booking_id||("BK"+Date.now()),
      event_type: payload.event_type, event_date: payload.event_date, time_slot: payload.time_slot,
      participants: guests, hall_name: selectedHall.name, hall_cost: hallCost,
      food_label: foodLabel, food_cost: foodCost, stage_name: selectedStage?.name||null, stage_cost: stageCost,
      total_amount: total, advance_paid: amountPaid, remaining: total-amountPaid, payment_method: selectedPayMethod,
    });
  } catch (err) {
    closeModal("paymentModal");
    const msg = err.message.toLowerCase();
    if (msg.includes("future")) toast("⚠️ Please select a future date","error");
    else if (msg.includes("already booked")||msg.includes("dup")) toast("⚠️ Hall already booked for this date and slot!","error");
    else toast("Booking failed: "+err.message,"error");
  }
}
 
/* ─────────────────────────────────────────────────────────
   SUCCESS SCREEN
───────────────────────────────────────────────────────── */
function showSuccessScreen(booking) {
  lastBooking = booking;
  document.getElementById("step4").innerHTML = `
    <div class="success-screen">
      <div class="check">✓</div>
      <h2 class="step-title" style="margin-bottom:.25rem">Booking Confirmed!</h2>
      <div class="booking-id">Booking ID: <strong>${booking.booking_id}</strong></div>
      <div class="success-details">
        <div class="success-detail-row"><span>Customer</span><span>${currentUser.name}</span></div>
        <div class="success-detail-row"><span>Email</span><span>${currentUser.email}</span></div>
        <div class="success-detail-row"><span>Phone</span><span>${currentUser.phone||"—"}</span></div>
        <div class="success-detail-row"><span>Event Type</span><span>${booking.event_type}</span></div>
        <div class="success-detail-row"><span>Date</span><span>${booking.event_date}</span></div>
        <div class="success-detail-row"><span>Time Slot</span><span>${booking.time_slot==="morning"?"Morning (8AM–4PM)":"Evening (5PM–1AM)"}</span></div>
        <div class="success-detail-row"><span>Guests</span><span>${booking.participants}</span></div>
        <div class="success-detail-row"><span>Hall</span><span>${booking.hall_name}</span></div>
        ${booking.food_label?`<div class="success-detail-row"><span>Food</span><span>${booking.food_label}</span></div>`:""}
        ${booking.stage_name?`<div class="success-detail-row"><span>Stage</span><span>${booking.stage_name}</span></div>`:""}
        <div class="success-detail-row"><span>Payment Mode</span><span>${booking.payment_method}</span></div>
        <div class="success-detail-row total-row"><span>Total Amount</span><span>₹${Number(booking.total_amount).toLocaleString("en-IN")}</span></div>
        <div class="success-detail-row paid-row"><span>Amount Paid Now</span><span>₹${Number(booking.advance_paid).toLocaleString("en-IN")}</span></div>
        <div class="success-detail-row"><span>Remaining</span><span>₹${Number(booking.remaining).toLocaleString("en-IN")}</span></div>
      </div>
      <div class="success-actions">
        <button class="btn btn-receipt" onclick="downloadReceipt()"><span>⬇️</span> Download Receipt</button>
        <button class="btn btn-gold" style="border-radius:50px;padding:.7rem 1.5rem" onclick="openBookingDetails()">📋 My Bookings</button>
        <button class="btn btn-outline" style="border-radius:50px;padding:.7rem 1.5rem" onclick="resetBooking()">Book Another</button>
      </div>
    </div>`;
  toast("Booking confirmed! 🎊","success");
}
 
/* ─────────────────────────────────────────────────────────
   DOWNLOAD RECEIPT
───────────────────────────────────────────────────────── */
function downloadReceipt() {
  if (!lastBooking) { toast("No booking data","error"); return; }
  const b   = lastBooking;
  const now = new Date().toLocaleString("en-IN",{day:"2-digit",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit",hour12:true});
  const rRow = (label,value) => `<div class="receipt-row"><span class="label">${label}</span><span class="value">${value}</span></div>`;
  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><title>Receipt ${b.booking_id}</title>
  <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;background:#f5f0e8;display:flex;align-items:flex-start;justify-content:center;padding:30px 16px;min-height:100vh}.receipt{background:#fff;width:100%;max-width:560px;border-radius:12px;overflow:hidden;box-shadow:0 8px 40px rgba(0,0,0,.15)}.rh{background:linear-gradient(135deg,#1a1409,#2e2411);padding:28px 28px 22px;text-align:center}.logo{font-family:Georgia,serif;font-size:28px;font-weight:700;color:#faf7f0}.logo span{color:#c9a84c}.sub{font-size:11px;color:#a89060;letter-spacing:.1em;text-transform:uppercase;margin-top:4px}.title{margin-top:16px;background:rgba(201,168,76,.15);border:1px solid rgba(201,168,76,.3);border-radius:6px;display:inline-block;padding:6px 18px;font-size:12px;font-weight:600;color:#c9a84c;letter-spacing:.08em;text-transform:uppercase}.id-bar{background:#c9a84c;padding:10px 28px;display:flex;justify-content:space-between;align-items:center}.id-l{font-size:11px;font-weight:600;color:#1a1409;text-transform:uppercase;letter-spacing:.06em}.id-v{font-family:Georgia,serif;font-size:18px;font-weight:700;color:#1a1409}.body{padding:24px 28px}.sec{margin-bottom:20px}.sec-t{font-size:10px;font-weight:600;color:#9e7a2a;text-transform:uppercase;letter-spacing:.1em;border-bottom:1px solid #e8ddc8;padding-bottom:5px;margin-bottom:10px}.receipt-row{display:flex;justify-content:space-between;font-size:13px;padding:5px 0;border-bottom:1px dotted #f0ebe0}.receipt-row:last-child{border-bottom:none}.label{color:#5c4a1e}.value{color:#1a1409;font-weight:500;text-align:right}.totals{background:#faf7f0;border:1px solid #e8ddc8;border-radius:8px;padding:14px 16px;margin-top:16px}.t-row{display:flex;justify-content:space-between;font-size:13px;padding:4px 0;color:#5c4a1e}.t-row.grand{font-size:16px;font-weight:700;color:#1a1409;border-top:1px solid #c9a84c;margin-top:8px;padding-top:10px;font-family:Georgia,serif}.t-row .value{font-weight:600}.stamp{border:3px solid #4caf50;color:#4caf50;border-radius:8px;display:inline-block;padding:4px 14px;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;transform:rotate(-2deg);margin-top:14px}.footer{background:#faf7f0;border-top:1px solid #e8ddc8;padding:16px 28px;text-align:center}.footer p{font-size:11px;color:#a89060;line-height:1.6}.gen{font-size:10px;color:#c0b090;margin-top:8px}@media print{body{background:#fff;padding:0}.receipt{box-shadow:none;border-radius:0;max-width:100%}.np{display:none}}</style></head><body>
  <div class="receipt"><div class="rh"><div class="logo">Event<span>Hall</span></div><div class="sub">Premium Event Venue Booking · Udupi</div><div class="title">✦ Official Booking Receipt ✦</div></div>
  <div class="id-bar"><span class="id-l">Booking Reference</span><span class="id-v">${b.booking_id}</span></div>
  <div class="body">
    <div class="sec"><div class="sec-t">Customer Details</div>${rRow("Name",currentUser.name)}${rRow("Email",currentUser.email)}${rRow("Phone",currentUser.phone||"—")}</div>
    <div class="sec"><div class="sec-t">Event Details</div>${rRow("Event Type",b.event_type)}${rRow("Date",b.event_date)}${rRow("Time Slot",b.time_slot==="morning"?"Morning (8AM–4PM)":"Evening (5PM–1AM)")}${rRow("Guests",String(b.participants))}${rRow("Hall",b.hall_name)}${b.stage_name?rRow("Stage",b.stage_name):""}${b.food_label?rRow("Food",b.food_label):""}</div>
    <div class="sec"><div class="sec-t">Bill Breakdown</div>${rRow("Hall Charges","₹"+Number(b.hall_cost).toLocaleString("en-IN"))}${b.food_cost>0?rRow(b.food_label||"Food","₹"+Number(b.food_cost).toLocaleString("en-IN")):""}${b.stage_cost>0?rRow("Stage Design","₹"+Number(b.stage_cost).toLocaleString("en-IN")):""}</div>
    <div class="totals"><div class="t-row grand"><span>Total Amount</span><span class="value">₹${Number(b.total_amount).toLocaleString("en-IN")}</span></div><div class="t-row"><span>Amount Paid</span><span class="value" style="color:#c9a84c">₹${Number(b.advance_paid).toLocaleString("en-IN")}</span></div><div class="t-row"><span>Remaining</span><span class="value">₹${Number(b.remaining).toLocaleString("en-IN")}</span></div><div class="t-row"><span>Payment Mode</span><span class="value">${b.payment_method}</span></div></div>
    <div style="text-align:center"><div class="stamp">${Number(b.remaining)>0?"⏳ Partially Paid":"✓ Payment Complete"}</div></div>
  </div>
  <div class="footer"><p>Thank you, <strong>${currentUser.name.split(" ")[0]}</strong>! We look forward to hosting your <strong>${b.event_type}</strong>.<br/>+91 98765 43210 | hello@eventhall.in</p><div class="gen">Receipt generated on ${now}</div></div>
  </div><div class="np" style="text-align:center;margin-top:20px"><button onclick="window.print()" style="background:#c9a84c;color:#1a1409;border:none;border-radius:50px;padding:10px 28px;font-size:14px;font-weight:700;cursor:pointer">🖨️ Print / Save as PDF</button></div>
  </body></html>`;
  const blob = new Blob([html],{type:"text/html;charset=utf-8"});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href=url; a.download=`EventHall_Receipt_${b.booking_id}.html`;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  toast("Receipt downloaded! Open in browser → Print → Save as PDF 🧾","success");
}
 
/* ─────────────────────────────────────────────────────────
   RESET
───────────────────────────────────────────────────────── */
function resetBooking() {
  selectedHall=null; selectedPackage=null; selectedMenuItems={}; selectedStage=null; selectedPayMethod=null; foodMode="package";
  ["eventType","timeSlot","eventDate","participants"].forEach(id=>{const el=document.getElementById(id);if(el)el.value="";});
  const fc=document.getElementById("foodRequired"); if(fc) fc.checked=false;
  document.getElementById("step4").innerHTML=`
    <h2 class="step-title">Booking Summary</h2>
    <div class="summary-layout">
      <div class="bill-summary" id="billSummary"></div>
      <aside class="payment-panel">
        <h3 class="section-sub" style="margin-top:0">Payment</h3>
        <label class="checkbox-label advance-check"><input type="checkbox" id="advancePayment" onchange="updatePaymentDisplay()"/> Pay 25% advance only</label>
        <div id="paymentAmount" class="advance-amount"></div>
        <div class="pay-methods">
          <button class="pay-method-btn" onclick="selectPayment('GPay')"><span class="pm-badge gpay">G</span> GPay</button>
          <button class="pay-method-btn" onclick="selectPayment('PhonePe')"><span class="pm-badge phonepe">P</span> PhonePe</button>
          <button class="pay-method-btn" onclick="selectPayment('Paytm')"><span class="pm-badge paytm">T</span> Paytm</button>
          <button class="pay-method-btn" onclick="selectPayment('UPI')"><span class="pm-badge upi">U</span> UPI QR</button>
        </div>
        <button class="btn btn-gold btn-full" onclick="openPaymentModal()">Confirm &amp; Pay</button>
      </aside>
    </div>
    <div class="step-actions"><button class="btn btn-outline" onclick="prevStep(4)">← Back</button></div>`;
  showStep(1);
}
 
/* ─────────────────────────────────────────────────────────
   TOAST
───────────────────────────────────────────────────────── */
function toast(message, type="info") {
  const icons={success:"✅",error:"❌",info:"ℹ️"};
  const el=document.createElement("div");
  el.className=`toast ${type}`;
  el.innerHTML=`<span class="toast-icon">${icons[type]||"ℹ️"}</span><span>${message}</span>`;
  document.getElementById("toastContainer").appendChild(el);
  setTimeout(()=>{ el.style.animation="toastOut .3s ease forwards"; setTimeout(()=>el.remove(),300); },3200);
}
 
/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded",()=>{
  const saved = loadSession();
  if (saved) { currentUser=saved; applyLoginUI(); }
  setMinDate();
  initParticles();
  // Poll unread count every 60s
  if (currentUser) setInterval(checkUnreadMessages, 60000);
});
 