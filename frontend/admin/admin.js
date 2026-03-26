'use strict';
/* ═══════════════════════════════════════════════════
   EventHall Admin — admin.js
   ═══════════════════════════════════════════════════ */
 
const ADMIN_EMAIL = 'admin@eventhall.in';
const ADMIN_PASS  = 'Admin@1234';
const HALL_COLORS = ['#4f7fff','#2dce89','#f0b429','#f5365c','#9b59ff','#11cdef'];
const HALL_NAMES  = { 1:'Royal Grand Hall', 2:'Shanthi Mahal', 3:'Pearl Banquet', 4:'Emerald Convention', 5:'Coconut Grove', 6:'Heritage Palace' };
 
let currentPage = 'dashboard';
let currentBkId = null, currentBkRef = null, currentBkUserId = null;
let bkPage = 1, bkTotal = 0;
let revenueChart = null, hallChart = null, hallCompareChart = null, statusChart = null, eventTypeChart = null, slotChart = null, annualChart = null, hallRevChart = null, trendChart = null;
let bkTimer = null, usrTimer = null;
let msgTargetUserId = null, msgTargetName = null;
 
/* ── API ── */
async function api(path, opts = {}) {
  try {
    const res  = await fetch(path, { headers: { 'Content-Type': 'application/json', ...opts.headers }, ...opts });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { return { error: 'Invalid server response' }; }
    if (!res.ok) return { error: data.message || data.error || 'Request failed' };
    return data;
  } catch (e) { return { error: e.message }; }
}
 
/* ── AUTH ── */
function adminLogin() {
  const email = document.getElementById('adminEmail').value.trim();
  const pass  = document.getElementById('adminPassword').value;
  const err   = document.getElementById('loginError');
  if (email === ADMIN_EMAIL && pass === ADMIN_PASS) {
    sessionStorage.setItem('adminAuth', '1');
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminApp').style.display = 'flex';
    initAdmin();
  } else { err.textContent = 'Incorrect credentials. Try again.'; err.style.display = 'block'; }
}
function adminLogout() { sessionStorage.removeItem('adminAuth'); location.reload(); }
document.addEventListener('keydown', e => {
  if (e.key === 'Enter' && document.getElementById('loginOverlay').style.display !== 'none') adminLogin();
});
 
/* ── INIT ── */
function initAdmin() {
  startClocks();
  setGreeting();
  setHeroDate();
  nav('dashboard', document.querySelector('[data-page=dashboard]'));
  refreshBadges();
  setInterval(refreshBadges, 60000);
}
 
function startClocks() {
  const tick = () => {
    const now = new Date();
    const t = now.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
    document.getElementById('topbarClock').textContent = t;
    document.getElementById('sidebarTime').textContent = t;
  };
  tick(); setInterval(tick, 1000);
}
 
function setGreeting() {
  const h = new Date().getHours();
  const g = h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening';
  document.getElementById('timeGreeting').textContent = g;
}
 
function setHeroDate() {
  const d = new Date();
  document.getElementById('heroDate').innerHTML =
    `${d.toLocaleDateString('en-IN',{weekday:'long'})}<br>` +
    `${d.toLocaleDateString('en-IN',{day:'2-digit',month:'long',year:'numeric'})}`;
}
 
/* ── NAV ── */
function nav(name, el) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));
  const pg = document.getElementById('page-' + name);
  if (pg) pg.classList.add('active');
  if (el) el.classList.add('active');
  document.getElementById('pageTitle').textContent = name.charAt(0).toUpperCase() + name.slice(1);
  currentPage = name;
  if (name === 'dashboard') loadDashboard();
  if (name === 'bookings')  loadBookings();
  if (name === 'users')     loadUsers();
  if (name === 'messages')  loadMessages();
  if (name === 'analytics') loadAnalytics();
  document.getElementById('sidebar').classList.remove('open');
  return false;
}
function toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); }
 
/* ── FORMAT ── */
function fmtMoney(n) {
  const v = parseFloat(n) || 0;
  if (v >= 10000000) return '₹' + (v/10000000).toFixed(2) + 'Cr';
  if (v >= 100000)   return '₹' + (v/100000).toFixed(1) + 'L';
  if (v >= 1000)     return '₹' + (v/1000).toFixed(1) + 'K';
  return '₹' + v.toFixed(0);
}
function fmtFull(n) { return '₹' + (parseFloat(n)||0).toLocaleString('en-IN'); }
function fmtDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
function esc(s) { if (!s) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function shortHall(id) { return HALL_NAMES[id] || 'Hall ' + id; }
function hallColor(id) { return HALL_COLORS[(id-1) % HALL_COLORS.length]; }
function badge(status) {
  const m = { confirmed:'badge-confirmed', pending:'badge-pending', cancelled:'badge-cancelled', completed:'badge-completed' };
  return `<span class="badge ${m[status]||'badge-pending'}">${status||'—'}</span>`;
}
 
/* ── BADGES ── */
async function refreshBadges() {
  const s = await api('/api/admin/stats');
  if (s.error) return;
  const mb = document.getElementById('navMsgBadge');
  const bb = document.getElementById('navBkBadge');
  mb.textContent = s.unreadMessages; mb.style.display = s.unreadMessages > 0 ? 'inline-block' : 'none';
  bb.textContent = s.activeBookings;  bb.style.display = s.activeBookings  > 0 ? 'inline-block' : 'none';
}
 
/* ── GLOBAL SEARCH ── */
function globalSearchFn() {
  const q = document.getElementById('globalSearch').value.trim();
  if (q.length > 1) {
    nav('bookings', document.querySelector('[data-page=bookings]'));
    document.getElementById('bkSearch').value = q;
    debounceBookings();
  }
}
 
/* ═══════════════ DASHBOARD ═══════════════ */
async function loadDashboard() {
  const [stats, halls, recent] = await Promise.all([
    api('/api/admin/stats'),
    api('/api/admin/hall-stats'),
    api('/api/admin/recent-bookings')
  ]);

  if (!stats.error) {
    animateNum('kpiTotal',    stats.totalBookings    || 0);
    animateNum('kpiActive',   stats.activeBookings   || 0);
    animateNum('kpiCancelled',stats.cancelledBookings|| 0);
    animateNum('kpiUsers',    stats.totalUsers       || 0);
    animateNum('kpiToday',    stats.todayBookings    || 0);
    animateNum('kpiMsgs',     stats.unreadMessages   || 0);
    document.getElementById('kpiRevenue').textContent = fmtMoney(stats.totalRevenue);
    document.getElementById('kpiPending').textContent = fmtMoney(stats.pendingAmount);
    const pct = stats.totalBookings > 0 ? Math.round(stats.completedBookings / stats.totalBookings * 100) : 0;
    document.getElementById('kpiTotalSub').textContent = `${pct}% completion rate`;
    const revPerBk = stats.activeBookings > 0 ? (stats.totalRevenue / stats.activeBookings) : 0;
    document.getElementById('kpiRevSub').textContent = `Avg ${fmtMoney(revPerBk)} per booking`;
  }

  buildHallCompareChart(halls);
  buildHallChart(halls);
  buildRecentTable(recent);
  buildHallPerf(halls);
  buildStatusChart(stats);
  api('/api/admin/bookings?limit=500').then(bkData => {
    buildEventTypeChartFromData(bkData);
    buildSlotChartFromData(bkData);
  });
}
 
function animateNum(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  const diff  = target - start;
  const dur   = 600;
  const t0    = performance.now();
  const tick  = (now) => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(start + diff * p);
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
 

/* ── Real-data-only helpers ── */
function showEmpty(canvasId, msg) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const wrap = canvas.parentElement;
  canvas.style.display = 'none';
  if (wrap && !wrap.querySelector('.no-data-msg')) {
    const d = document.createElement('div');
    d.className = 'no-data-msg';
    d.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#5a6478;font-size:0.85rem;gap:8px;text-align:center;padding:1rem';
    d.innerHTML = '<span style="font-size:2.2rem">📊</span><span>' + msg + '</span>';
    wrap.appendChild(d);
  }
}
function clearEmpty(canvasId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  canvas.style.display = '';
  const wrap = canvas.parentElement;
  const old = wrap && wrap.querySelector('.no-data-msg');
  if (old) old.remove();
}

function buildRevenueChart(data) {
  const canvas = document.getElementById('revenueChart');
  if (!canvas) return;
  if (revenueChart) { revenueChart.destroy(); revenueChart = null; }
  clearEmpty('revenueChart');
  if (!Array.isArray(data) || data.error) { showEmpty('revenueChart','No data available'); return; }
  const revenues = data.map(r => parseFloat(r.revenue)||0);
  const bookings = data.map(r => parseInt(r.bookings)||0);
  revenueChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: {
      labels: data.map(r => r.month||''),
      datasets: [
        { type:'bar', label:'Revenue (₹)', data:revenues,
          backgroundColor: revenues.map(v => v>0 ? 'rgba(79,127,255,0.75)' : 'rgba(79,127,255,0.15)'),
          borderRadius:6, borderSkipped:false, yAxisID:'y', hoverBackgroundColor:'rgba(123,163,255,0.9)' },
        { type:'line', label:'Bookings', data:bookings,
          borderColor:'#2dce89', backgroundColor:'rgba(45,206,137,0.1)',
          borderWidth:2.5, pointRadius:5, pointBackgroundColor:'#2dce89',
          pointBorderColor:'#141820', pointBorderWidth:2, fill:true, tension:0.4, yAxisID:'y2' }
      ]
    },
    options: {
      responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
      plugins: {
        legend:{display:false},
        tooltip:{ backgroundColor:'rgba(20,24,32,0.95)', titleColor:'#e8ecf4', bodyColor:'#8892a4',
          borderColor:'rgba(255,255,255,0.1)', borderWidth:1, padding:12, cornerRadius:10,
          callbacks:{ label: c => c.dataset.label==='Revenue (₹)'
            ? '  Revenue: ₹'+Number(c.parsed.y).toLocaleString('en-IN')
            : '  Bookings: '+c.parsed.y } }
      },
      scales:{
        y:{ position:'left', beginAtZero:true, grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#5a6478',callback:v=>fmtMoney(v)} },
        y2:{ position:'right', beginAtZero:true, grid:{display:false}, ticks:{color:'#5a6478',stepSize:1,precision:0} },
        x:{ grid:{display:false}, ticks:{color:'#5a6478'} }
      }
    }
  });
  const leg = document.getElementById('revLegend');
  if (leg) leg.innerHTML = '<span style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#8892a4"><span style="width:12px;height:12px;border-radius:3px;background:rgba(79,127,255,0.75);display:inline-block"></span>Revenue</span><span style="display:flex;align-items:center;gap:6px;font-size:0.78rem;color:#8892a4"><span style="width:12px;height:3px;background:#2dce89;display:inline-block;border-radius:2px"></span>Bookings</span>';
}
 
function buildHallCompareChart(data) {
  const canvas = document.getElementById('hallCompareChart');
  if (!canvas) return;
  if (hallCompareChart) { hallCompareChart.destroy(); hallCompareChart = null; }
  clearEmpty('hallCompareChart');
  if (!Array.isArray(data) || data.error || !data.length) { showEmpty('hallCompareChart','No bookings yet'); return; }
  const labels    = data.map(h => shortHall(h.hall_id));
  const confirmed = data.map(h => parseInt(h.confirmed) || 0);
  const completed = data.map(h => Math.max(0, parseInt(h.total||0) - parseInt(h.confirmed||0) - parseInt(h.cancelled||0)));
  const cancelled = data.map(h => parseInt(h.cancelled)  || 0);
  hallCompareChart = new Chart(canvas.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [
      { label:'Confirmed', data:confirmed, backgroundColor:'rgba(79,127,255,0.85)', borderRadius:5, borderSkipped:false },
      { label:'Completed', data:completed, backgroundColor:'rgba(45,206,137,0.85)', borderRadius:5, borderSkipped:false },
      { label:'Cancelled', data:cancelled, backgroundColor:'rgba(245,54,92,0.75)',  borderRadius:5, borderSkipped:false },
    ]},
    options: {
      responsive:true, maintainAspectRatio:false,
      interaction:{ mode:'index', intersect:false },
      plugins:{
        legend:{ position:'top', labels:{ color:'#8892a4', font:{size:11}, padding:16, boxWidth:12, boxHeight:12 } },
        tooltip:{ backgroundColor:'rgba(20,24,32,0.95)', titleColor:'#e8ecf4', bodyColor:'#8892a4', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, cornerRadius:8, padding:10 }
      },
      scales:{
        x:{ grid:{display:false}, ticks:{color:'#8892a4',font:{size:11}}, border:{color:'transparent'} },
        y:{ beginAtZero:true, grid:{color:'rgba(255,255,255,0.05)'}, ticks:{color:'#5a6478',stepSize:1,precision:0}, border:{color:'transparent'} }
      }
    }
  });
}

function buildHallChart(data) {
  const canvas = document.getElementById('hallChart');
  if (!canvas) return;
  if (hallChart) { hallChart.destroy(); hallChart = null; }
  clearEmpty('hallChart');
  if (!Array.isArray(data) || data.error || !data.length) { showEmpty('hallChart','No bookings yet'); return; }
  const labels = data.map(r => shortHall(r.hall_id));
  const counts = data.map(r => parseInt(r.total||r.bookings)||0);
  const colors = data.map(r => hallColor(r.hall_id));
  hallChart = new Chart(canvas.getContext('2d'), {
    type:'doughnut',
    data:{ labels, datasets:[{ data:counts, backgroundColor:colors, borderWidth:0, hoverBorderWidth:3, hoverBorderColor:'#141820' }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'72%',
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(20,24,32,0.95)', titleColor:'#e8ecf4', bodyColor:'#8892a4', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, padding:10, cornerRadius:8 } } }
  });
  const legend = document.getElementById('donutLegend');
  if (legend) {
    const total = counts.reduce((a,b)=>a+b,0);
    legend.innerHTML = labels.map((l,i) => `<span class="donut-legend-item"><span class="donut-dot" style="background:${colors[i]}"></span>${l} <strong style="color:#e8ecf4;margin-left:4px">${total>0?Math.round(counts[i]/total*100):0}%</strong></span>`).join('');
  }
}
 
function buildRecentTable(data) {
  const tbody = document.getElementById('recentBody');
  if (!data || data.error || !Array.isArray(data) || !data.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="tbl-loading">No bookings yet</td></tr>';
    return;
  }
  tbody.innerHTML = data.map(b => `
    <tr style="cursor:pointer" onclick="openBkModal(${b.id})">
      <td><span style="font-family:'DM Mono',monospace;font-size:0.78rem;color:#7ba3ff">${esc(b.booking_id)}</span></td>
      <td><div style="font-weight:600">${esc(b.user_name||'—')}</div><div style="font-size:0.75rem;color:#5a6478">${esc(b.user_email||'')}</div></td>
      <td><span style="font-size:0.8rem;color:#8892a4">${shortHall(b.hall_id)}</span></td>
      <td>${fmtDate(b.event_date)}</td>
      <td style="font-weight:600">${fmtFull(b.total_amount)}</td>
      <td>${badge(b.status)}</td>
    </tr>`).join('');
}
 
function buildHallPerf(data) {
  const el = document.getElementById('hallPerf');
  if (!el) return;
  if (!Array.isArray(data) || data.error || !data.length) {
    el.innerHTML = '<div style="color:#5a6478;text-align:center;padding:2rem;font-size:0.85rem">📊 No bookings yet</div>';
    return;
  }
  const maxRev = Math.max(...data.map(d=>parseFloat(d.revenue)||0),1);
  el.innerHTML = data.map(d => {
    const rev = parseFloat(d.revenue)||0;
    const pct = Math.round(rev/maxRev*100);
    return `<div class="hall-perf-row">
      <div class="hall-perf-name">
        <span>${shortHall(d.hall_id)}</span>
        <span style="color:${hallColor(d.hall_id)};font-size:0.78rem">${fmtMoney(rev)}</span>
      </div>
      <div class="hall-perf-bar-bg"><div class="hall-perf-bar" style="width:${pct}%;background:${hallColor(d.hall_id)}"></div></div>
      <div class="hall-perf-meta"><span>${d.total||0} bookings</span><span>${d.confirmed||0} confirmed · ${d.cancelled||0} cancelled</span></div>
    </div>`;
  }).join('');
}
 
function buildStatusChart(stats) {
  const canvas = document.getElementById('statusChart');
  if (!canvas) return;
  if (statusChart) { statusChart.destroy(); statusChart = null; }
  clearEmpty('statusChart');
  const confirmed = (stats && !stats.error) ? (stats.activeBookings    ||0) : 0;
  const completed  = (stats && !stats.error) ? (stats.completedBookings ||0) : 0;
  const cancelled  = (stats && !stats.error) ? (stats.cancelledBookings ||0) : 0;
  if (confirmed+completed+cancelled === 0) { showEmpty('statusChart','No bookings yet'); return; }
  statusChart = new Chart(canvas, {
    type:'bar',
    data:{ labels:['Confirmed','Completed','Cancelled'],
      datasets:[{ data:[confirmed,completed,cancelled],
        backgroundColor:['rgba(79,127,255,0.85)','rgba(45,206,137,0.85)','rgba(245,54,92,0.85)'],
        borderRadius:8, borderSkipped:false, barThickness:24 }] },
    options:{ responsive:true, maintainAspectRatio:false, indexAxis:'y',
      plugins:{ legend:{display:false}, tooltip:{ backgroundColor:'rgba(20,24,32,0.95)', titleColor:'#e8ecf4', bodyColor:'#8892a4', borderColor:'rgba(255,255,255,0.1)', borderWidth:1, cornerRadius:8, callbacks:{label:c=>'  '+c.parsed.x+' bookings'} } },
      scales:{ x:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#5a6478',font:{size:11}},border:{color:'transparent'}}, y:{grid:{display:false},ticks:{color:'#e8ecf4',font:{size:12}},border:{color:'transparent'}} } }
  });
}
 
/* buildEventTypeChart replaced by buildEventTypeChartFromData */
 
/* buildSlotChart replaced by buildSlotChartFromData */
 
/* ═══════════════ BOOKINGS ═══════════════ */
async function loadBookings() {
  const params = new URLSearchParams({ page: bkPage, limit: 12 });
  const s=document.getElementById('bkSearch')?.value.trim();
  const st=document.getElementById('bkStatus')?.value;
  const h=document.getElementById('bkHall')?.value;
  const f=document.getElementById('bkFrom')?.value;
  const t=document.getElementById('bkTo')?.value;
  if (s)  params.set('search',   s);
  if (st) params.set('status',   st);
  if (h)  params.set('hall_id',  h);
  if (f)  params.set('date_from',f);
  if (t)  params.set('date_to',  t);
 
  const tbody = document.getElementById('bookingsBody');
  tbody.innerHTML = '<tr><td colspan="10" class="tbl-loading">Loading…</td></tr>';
  const data = await api('/api/admin/bookings?' + params);
 
  if (data.error || !data.bookings) {
    tbody.innerHTML = `<tr><td colspan="10" class="tbl-loading" style="color:#f5365c">⚠ ${data?.error||'Could not load'}</td></tr>`;
    return;
  }
  bkTotal = data.total || 0;
 
  /* Summary pills */
  const pills = document.getElementById('bkSummaryPills');
  if (pills) pills.innerHTML = `
    <span class="sum-pill">${bkTotal} total</span>
    <span class="sum-pill">Page ${bkPage} of ${Math.ceil(bkTotal/12)||1}</span>`;
 
  if (!data.bookings.length) {
    tbody.innerHTML = '<tr><td colspan="10" class="tbl-loading">No bookings match your filters</td></tr>';
    buildPagination(); return;
  }
 
  tbody.innerHTML = data.bookings.map(b => `
    <tr>
      <td><span style="font-family:'DM Mono',monospace;font-size:0.78rem;color:#7ba3ff">${esc(b.booking_id)}</span></td>
      <td>
        <div style="font-weight:600">${esc(b.user_name||'—')}</div>
        <div style="font-size:0.75rem;color:#5a6478">${esc(b.user_email||'')}</div>
      </td>
      <td><span style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${hallColor(b.hall_id)};flex-shrink:0"></span>${shortHall(b.hall_id)}</span></td>
      <td>${fmtDate(b.event_date)}</td>
      <td style="text-transform:capitalize;color:#8892a4">${esc(b.time_slot||'—')}</td>
      <td style="color:#8892a4">${b.participants||'—'}</td>
      <td style="font-weight:600">${fmtFull(b.total_amount)}</td>
      <td style="color:#2dce89">${fmtFull(b.advance_paid)}</td>
      <td>${badge(b.status)}</td>
      <td>
        <button class="icon-btn" title="View Details" onclick="openBkModal(${b.id})" style="margin-right:4px">👁</button>
        <button class="icon-btn" title="Message Customer" onclick="openUserMsgModalDirect(${b.user_id},'${esc(b.user_name||'Customer')}')">✉</button>
      </td>
    </tr>`).join('');
  buildPagination();
}
 
function buildPagination() {
  const pages = Math.ceil(bkTotal / 12);
  const el = document.getElementById('bkPagination');
  if (pages <= 1) { el.innerHTML = ''; return; }
  let h = `<span style="font-size:0.8rem;color:#5a6478;margin-right:8px">${bkTotal} records</span>`;
  h += `<button class="pg-btn" onclick="goBkPage(${bkPage-1})" ${bkPage===1?'disabled':''}>‹</button>`;
  for (let i=1; i<=pages; i++) {
    if (i===1||i===pages||Math.abs(i-bkPage)<=1) h += `<button class="pg-btn ${i===bkPage?'active':''}" onclick="goBkPage(${i})">${i}</button>`;
    else if (Math.abs(i-bkPage)===2) h += '<span style="padding:0 4px;color:#5a6478">…</span>';
  }
  h += `<button class="pg-btn" onclick="goBkPage(${bkPage+1})" ${bkPage===pages?'disabled':''}>›</button>`;
  el.innerHTML = h;
}
function goBkPage(p) { bkPage = p; loadBookings(); }
function clearBkFilters() {
  ['bkSearch','bkStatus','bkHall','bkFrom','bkTo'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  bkPage = 1; loadBookings();
}
function debounceBookings() { clearTimeout(bkTimer); bkTimer = setTimeout(() => { bkPage=1; loadBookings(); }, 350); }
 
/* ═══════════════ BOOKING MODAL ═══════════════ */
async function openBkModal(id) {
  currentBkId = id;
  document.getElementById('bkModal').style.display = 'flex';
  document.getElementById('bkModalBody').innerHTML = '<p style="color:#5a6478;padding:1rem 0">Loading…</p>';
  document.getElementById('inlineMsgStatus').textContent = '';
 
  const data = await api('/api/admin/bookings?id=' + id);
  const b = data.bookings && data.bookings[0];
  if (!b) { document.getElementById('bkModalBody').innerHTML = `<p style="color:#f5365c">Booking not found. ${data.error||''}</p>`; return; }
 
  currentBkRef    = b.booking_id;
  currentBkUserId = b.user_id;
  document.getElementById('bkModalTitle').textContent = b.booking_id;
  document.getElementById('bkModalStatus').value = b.status || 'confirmed';
 
  const remaining = parseFloat(b.remaining_amount)||0;
  document.getElementById('bkModalBody').innerHTML = `
    <div class="detail-grid">
      <div class="detail-item"><label>Customer</label><span>${esc(b.user_name||'—')}</span></div>
      <div class="detail-item"><label>Email</label><span>${esc(b.user_email||'—')}</span></div>
      <div class="detail-item"><label>Phone</label><span>${esc(b.user_phone||'—')}</span></div>
      <div class="detail-item"><label>Event Type</label><span style="text-transform:capitalize">${esc(b.event_type||'—')}</span></div>
      <div class="detail-item"><label>Hall</label><span>${shortHall(b.hall_id)}</span></div>
      <div class="detail-item"><label>Event Date</label><span>${fmtDate(b.event_date)}</span></div>
      <div class="detail-item"><label>Time Slot</label><span style="text-transform:capitalize">${esc(b.time_slot||'—')}</span></div>
      <div class="detail-item"><label>Guests</label><span>${b.participants||'—'}</span></div>
      <div class="detail-item"><label>Total Amount</label><span style="color:#f0b429;font-weight:700">${fmtFull(b.total_amount)}</span></div>
      <div class="detail-item"><label>Advance Paid</label><span style="color:#2dce89;font-weight:700">${fmtFull(b.advance_paid)}</span></div>
      <div class="detail-item"><label>Balance Due</label><span style="color:${remaining>0?'#f5365c':'#2dce89'};font-weight:700">${fmtFull(remaining)}</span></div>
      <div class="detail-item"><label>Payment Mode</label><span>${esc(b.payment_method||'—')}</span></div>
      <div class="detail-item"><label>Current Status</label><span>${badge(b.status)}</span></div>
      <div class="detail-item"><label>Booked On</label><span>${fmtDate(b.created_at)}</span></div>
    </div>
    ${b.stage_design ? `<div style="margin-top:14px;padding:10px 14px;background:rgba(79,127,255,0.08);border:1px solid rgba(79,127,255,0.2);border-radius:8px;font-size:0.875rem"><strong style="color:#7ba3ff">Stage Design:</strong> ${esc(b.stage_design)}</div>` : ''}
    ${b.cancel_reason ? `<div style="margin-top:10px;padding:10px 14px;background:rgba(245,54,92,0.08);border:1px solid rgba(245,54,92,0.2);border-radius:8px;font-size:0.875rem"><strong style="color:#f5365c">Cancellation Reason:</strong> ${esc(b.cancel_reason)}</div>` : ''}
  `;
}
 
function closeBkModal(e) { if (e.target.id === 'bkModal') document.getElementById('bkModal').style.display = 'none'; }
 
async function updateBookingStatus() {
  const newStatus = document.getElementById('bkModalStatus').value;
  if (!currentBkId) return;
  const res = await api(`/api/admin/bookings/${currentBkId}/status`, { method:'PUT', body:JSON.stringify({status:newStatus}) });
  if (res.error) { alert('Error: ' + res.error); return; }
  alert(`Status updated to "${newStatus}" ✓`);
  document.getElementById('bkModal').style.display = 'none';
  if (currentPage==='bookings')  loadBookings();
  if (currentPage==='dashboard') loadDashboard();
}
 
async function deleteBooking() {
  if (!currentBkId || !confirm('Delete this booking permanently? This cannot be undone.')) return;
  const res = await api(`/api/admin/bookings/${currentBkId}`, { method:'DELETE' });
  if (res.error) { alert('Error: ' + res.error); return; }
  alert('Booking deleted ✓');
  document.getElementById('bkModal').style.display = 'none';
  if (currentPage==='bookings')  loadBookings();
  if (currentPage==='dashboard') loadDashboard();
}
 
async function sendInlineMessage() {
  const subject  = document.getElementById('inlineMsgSubject').value.trim();
  const body     = document.getElementById('inlineMsgBody').value.trim();
  const statusEl = document.getElementById('inlineMsgStatus');
  if (!subject||!body) { statusEl.style.color='#f5365c'; statusEl.textContent='⚠ Subject and message required'; return; }
  if (!currentBkUserId) { statusEl.style.color='#f5365c'; statusEl.textContent='⚠ No user linked'; return; }
  const res = await api('/api/admin/send-message', { method:'POST', body:JSON.stringify({user_id:currentBkUserId,booking_id:currentBkRef||'GENERAL',subject,body}) });
  if (res.error) { statusEl.style.color='#f5365c'; statusEl.textContent='✗ '+res.error; return; }
  statusEl.style.color='#2dce89'; statusEl.textContent='✓ Sent!';
  document.getElementById('inlineMsgSubject').value = '';
  document.getElementById('inlineMsgBody').value    = '';
  setTimeout(() => { statusEl.textContent=''; }, 3000);
}
 
/* ═══════════════ USERS ═══════════════ */
async function loadUsers() {
  const search = document.getElementById('usrSearch')?.value.trim() || '';
  const tbody  = document.getElementById('usersBody');
  tbody.innerHTML = '<tr><td colspan="8" class="tbl-loading">Loading…</td></tr>';
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const data = await api('/api/admin/users?' + params);
 
  if (data.error || !Array.isArray(data)) {
    tbody.innerHTML = `<tr><td colspan="8" class="tbl-loading" style="color:#f5365c">⚠ ${data?.error||'Could not load'}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="8" class="tbl-loading">No users yet</td></tr>'; return; }
 
  tbody.innerHTML = data.map((u,i) => `
    <tr>
      <td style="color:#5a6478;font-family:'DM Mono',monospace">${String(i+1).padStart(2,'0')}</td>
      <td><div style="font-weight:600">${esc(u.name||'—')}</div></td>
      <td style="color:#8892a4">${esc(u.email||'—')}</td>
      <td style="color:#8892a4">${esc(u.phone||'—')}</td>
      <td><span class="badge badge-confirmed">${u.booking_count||0}</span></td>
      <td style="font-weight:600;color:#f0b429">${fmtMoney(u.total_spent||0)}</td>
      <td style="color:#5a6478">${fmtDate(u.created_at)}</td>
      <td><button class="icon-btn" title="Message Customer" onclick="openUserMsgModalDirect(${u.id},'${esc(u.name||'Customer')}')">✉</button></td>
    </tr>`).join('');
 
  populateMsgSelect(data);
}
 
function populateMsgSelect(users) {
  const sel = document.getElementById('msgUserId');
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = '<option value="">— Select Customer —</option>';
  users.forEach(u => {
    const o = document.createElement('option');
    o.value = u.id;
    o.textContent = `${u.name} (${u.email})`;
    sel.appendChild(o);
  });
  if (prev) sel.value = prev;
}
 
function debounceUsers() { clearTimeout(usrTimer); usrTimer = setTimeout(loadUsers, 350); }
 
/* ═══════════════ MESSAGES ═══════════════ */
async function loadMessages() {
  const uData = await api('/api/admin/users');
  if (!uData.error && Array.isArray(uData)) populateMsgSelect(uData);
 
  const data  = await api('/api/admin/messages');
  const tbody = document.getElementById('messagesBody');
 
  if (data.error || !Array.isArray(data)) {
    tbody.innerHTML = `<tr><td colspan="5" class="tbl-loading" style="color:#f5365c">⚠ ${data?.error||'Could not load'}</td></tr>`;
    return;
  }
  if (!data.length) { tbody.innerHTML = '<tr><td colspan="5" class="tbl-loading">No messages sent yet</td></tr>'; return; }
 
  tbody.innerHTML = data.map(m => `
    <tr>
      <td>
        <div style="font-weight:600">${esc(m.user_name||'—')}</div>
        <div style="font-size:0.75rem;color:#5a6478">${esc(m.user_email||'')}</div>
      </td>
      <td style="font-weight:500">${esc(m.subject||'—')}</td>
      <td style="color:#5a6478;max-width:240px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc((m.body||'').substring(0,100))}</td>
      <td style="color:#5a6478">${fmtDate(m.created_at)}</td>
      <td>${m.is_read ? '<span class="badge badge-completed">Read</span>' : '<span class="badge badge-pending">Unread</span>'}</td>
    </tr>`).join('');
}
 
async function sendAdminMessage() {
  const userId   = document.getElementById('msgUserId').value;
  const subject  = document.getElementById('msgSubject').value.trim();
  const body     = document.getElementById('msgBody').value.trim();
  const statusEl = document.getElementById('msgSendStatus');
  if (!userId)  { statusEl.style.color='#f5365c'; statusEl.textContent='⚠ Select a customer'; return; }
  if (!subject) { statusEl.style.color='#f5365c'; statusEl.textContent='⚠ Subject required'; return; }
  if (!body)    { statusEl.style.color='#f5365c'; statusEl.textContent='⚠ Message required'; return; }
  const res = await api('/api/admin/send-message', { method:'POST', body:JSON.stringify({user_id:userId,booking_id:'GENERAL',subject,body}) });
  if (res.error) { statusEl.style.color='#f5365c'; statusEl.textContent='✗ '+res.error; return; }
  statusEl.style.color='#2dce89'; statusEl.textContent='✓ Message sent!';
  document.getElementById('msgSubject').value = '';
  document.getElementById('msgBody').value    = '';
  document.getElementById('msgUserId').value  = '';
  setTimeout(() => { statusEl.textContent=''; }, 4000);
  loadMessages();
}
 
/* User message modal (from Users / Bookings table) */
function openUserMsgModalDirect(userId, userName) {
  msgTargetUserId = userId;
  msgTargetName   = userName;
  document.getElementById('userMsgTitle').textContent = 'Message to ' + userName;
  document.getElementById('userMsgSubject').value = '';
  document.getElementById('userMsgBody').value    = '';
  document.getElementById('userMsgStatus').textContent = '';
  document.getElementById('userMsgModal').style.display = 'flex';
}
function closeUserMsgModal(e) { if (e.target.id==='userMsgModal') document.getElementById('userMsgModal').style.display='none'; }
async function sendUserMessage() {
  const subject  = document.getElementById('userMsgSubject').value.trim();
  const body     = document.getElementById('userMsgBody').value.trim();
  const statusEl = document.getElementById('userMsgStatus');
  if (!subject||!body) { statusEl.style.color='#f5365c'; statusEl.textContent='⚠ Fill all fields'; return; }
  const res = await api('/api/admin/send-message', { method:'POST', body:JSON.stringify({user_id:msgTargetUserId,booking_id:'GENERAL',subject,body}) });
  if (res.error) { statusEl.style.color='#f5365c'; statusEl.textContent='✗ '+res.error; return; }
  statusEl.style.color='#2dce89'; statusEl.textContent='✓ Sent to '+msgTargetName+'!';
  setTimeout(() => { document.getElementById('userMsgModal').style.display='none'; }, 1800);
}
 
/* ═══════════════ ANALYTICS ═══════════════ */
async function loadAnalytics() {
  const [revenue, halls, bkData] = await Promise.all([
    api('/api/admin/revenue-chart'),
    api('/api/admin/hall-stats'),
    api('/api/admin/bookings?limit=500'),
  ]);
  buildAnnualChart(revenue);
  buildHallRevenueChart(halls);
  buildTrendChart(revenue);
  buildHallStatCards(halls);
  buildEventTypeChartFromData(bkData);
  buildSlotChartFromData(bkData);
}



function buildEventTypeChartFromData(bkData) {
  const canvas = document.getElementById('eventTypeChart');
  if (!canvas) return;
  if (eventTypeChart) { eventTypeChart.destroy(); eventTypeChart = null; }
  clearEmpty('eventTypeChart');
  const counts = {};
  if (bkData && !bkData.error && bkData.bookings) {
    bkData.bookings.forEach(b => { if (b.event_type) counts[b.event_type]=(counts[b.event_type]||0)+1; });
  }
  if (!Object.keys(counts).length) { showEmpty('eventTypeChart','No bookings yet'); return; }
  const labels=Object.keys(counts), vals=Object.values(counts);
  const colors=['rgba(79,127,255,0.85)','rgba(45,206,137,0.85)','rgba(240,180,41,0.85)','rgba(245,54,92,0.85)','rgba(155,89,255,0.85)','rgba(17,205,239,0.85)'];
  eventTypeChart = new Chart(canvas, {
    type:'doughnut',
    data:{ labels, datasets:[{ data:vals, backgroundColor:colors.slice(0,labels.length), borderWidth:2, borderColor:'#141820', hoverBorderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'55%',
      plugins:{ legend:{position:'bottom',labels:{color:'#8892a4',font:{size:10},padding:6,boxWidth:10,boxHeight:10}}, tooltip:{backgroundColor:'rgba(20,24,32,0.95)',titleColor:'#e8ecf4',bodyColor:'#8892a4',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,cornerRadius:8} } }
  });
}

function buildSlotChartFromData(bkData) {
  const canvas = document.getElementById('slotChart');
  if (!canvas) return;
  if (slotChart) { slotChart.destroy(); slotChart = null; }
  clearEmpty('slotChart');
  let morning=0, evening=0;
  if (bkData && !bkData.error && bkData.bookings) {
    bkData.bookings.forEach(b => { if (b.time_slot==='morning') morning++; else evening++; });
  }
  if (morning===0 && evening===0) { showEmpty('slotChart','No bookings yet'); return; }
  slotChart = new Chart(canvas, {
    type:'doughnut',
    data:{ labels:['Morning (8AM–4PM)','Evening (5PM–1AM)'],
      datasets:[{ data:[morning,evening], backgroundColor:['rgba(240,180,41,0.9)','rgba(155,89,255,0.9)'], borderWidth:2, borderColor:'#141820', hoverBorderWidth:0 }] },
    options:{ responsive:true, maintainAspectRatio:false, cutout:'60%',
      plugins:{ legend:{position:'bottom',labels:{color:'#8892a4',font:{size:10},padding:6,boxWidth:10,boxHeight:10}}, tooltip:{backgroundColor:'rgba(20,24,32,0.95)',titleColor:'#e8ecf4',bodyColor:'#8892a4',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,cornerRadius:8,callbacks:{label:c=>'  '+c.parsed+' bookings'}} } }
  });
}
 
function buildAnnualChart(data) {
  const canvas = document.getElementById('annualChart');
  if (!canvas) return;
  if (annualChart) { annualChart.destroy(); annualChart = null; }
  clearEmpty('annualChart');
  if (!Array.isArray(data)||data.error) { showEmpty('annualChart','No data available'); return; }
  const revenues=data.map(r=>parseFloat(r.revenue)||0);
  const avg=revenues.reduce((a,b)=>a+b,0)/revenues.length||0;
  annualChart = new Chart(canvas.getContext('2d'), {
    type:'bar',
    data:{ labels:data.map(r=>r.month||''), datasets:[
      { label:'Revenue', data:revenues, backgroundColor:revenues.map(v=>v>=avg?'rgba(79,127,255,0.8)':'rgba(79,127,255,0.3)'), borderRadius:6, borderSkipped:false, yAxisID:'y' },
      { label:'Avg', data:revenues.map(()=>avg), type:'line', borderColor:'rgba(240,180,41,0.6)', borderWidth:2, borderDash:[5,5], pointRadius:0, yAxisID:'y' }
    ]},
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{ legend:{labels:{color:'#8892a4',font:{size:11}}}, tooltip:{backgroundColor:'rgba(20,24,32,0.95)',titleColor:'#e8ecf4',bodyColor:'#8892a4',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,cornerRadius:8,
        callbacks:{label:c=>c.dataset.label==='Revenue'?'Revenue: ₹'+Number(c.parsed.y).toLocaleString('en-IN'):'Avg: ₹'+Number(c.parsed.y).toLocaleString('en-IN')}} },
      scales:{ y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#5a6478',callback:v=>fmtMoney(v)}}, x:{grid:{display:false},ticks:{color:'#5a6478'}} } }
  });
}
 
function buildHallRevenueChart(halls) {
  const canvas = document.getElementById('hallRevenueChart');
  if (!canvas) return;
  if (hallRevChart) { hallRevChart.destroy(); hallRevChart = null; }
  clearEmpty('hallRevenueChart');
  if (!Array.isArray(halls)||halls.error||!halls.length) { showEmpty('hallRevenueChart','No bookings yet'); return; }
  hallRevChart = new Chart(canvas.getContext('2d'), {
    type:'bar',
    data:{ labels:halls.map(h=>shortHall(h.hall_id)), datasets:[{ label:'Revenue', data:halls.map(h=>parseFloat(h.revenue)||0), backgroundColor:halls.map(h=>hallColor(h.hall_id)+'cc'), borderRadius:6, borderSkipped:false }] },
    options:{ responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false},tooltip:{backgroundColor:'rgba(20,24,32,0.95)',titleColor:'#e8ecf4',bodyColor:'#8892a4',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,cornerRadius:8,callbacks:{label:c=>'Revenue: ₹'+Number(c.parsed.y).toLocaleString('en-IN')}}},
      scales:{y:{grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#5a6478',callback:v=>fmtMoney(v)}},x:{grid:{display:false},ticks:{color:'#5a6478',maxRotation:30}}} }
  });
}
 
function buildTrendChart(data) {
  const canvas = document.getElementById('trendChart');
  if (!canvas) return;
  if (trendChart) { trendChart.destroy(); trendChart = null; }
  clearEmpty('trendChart');
  if (!Array.isArray(data)||data.error) { showEmpty('trendChart','No data available'); return; }
  trendChart = new Chart(canvas.getContext('2d'), {
    type:'line',
    data:{ labels:data.map(r=>r.month||''), datasets:[
      { label:'Revenue', data:data.map(r=>parseFloat(r.revenue)||0), borderColor:'#4f7fff', backgroundColor:'rgba(79,127,255,0.1)', borderWidth:2.5, fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:'#4f7fff', pointBorderColor:'#141820', pointBorderWidth:2, yAxisID:'y' },
      { label:'Bookings', data:data.map(r=>parseInt(r.bookings)||0), borderColor:'#2dce89', backgroundColor:'rgba(45,206,137,0.08)', borderWidth:2.5, fill:true, tension:0.4, pointRadius:4, pointBackgroundColor:'#2dce89', pointBorderColor:'#141820', pointBorderWidth:2, yAxisID:'y2' }
    ]},
    options:{ responsive:true, maintainAspectRatio:false, interaction:{mode:'index',intersect:false},
      plugins:{legend:{labels:{color:'#8892a4',font:{size:11}}},tooltip:{backgroundColor:'rgba(20,24,32,0.95)',titleColor:'#e8ecf4',bodyColor:'#8892a4',borderColor:'rgba(255,255,255,0.1)',borderWidth:1,cornerRadius:8}},
      scales:{ y:{position:'left',grid:{color:'rgba(255,255,255,0.05)'},ticks:{color:'#5a6478',callback:v=>fmtMoney(v)}}, y2:{position:'right',grid:{display:false},ticks:{color:'#5a6478',stepSize:1,precision:0}}, x:{grid:{display:false},ticks:{color:'#5a6478'}} } }
  });
}
 
function buildHallStatCards(halls) {
  const el = document.getElementById('hallStatCards');
  if (!el) return;
  if (!Array.isArray(halls)||halls.error||!halls.length) {
    el.innerHTML = '<div style="color:#5a6478;text-align:center;padding:2rem;grid-column:1/-1;font-size:0.85rem">📊 No booking data yet</div>';
    return;
  }
  el.innerHTML = halls.map(h => `
    <div class="hall-stat-card">
      <div class="hall-stat-name" style="color:${hallColor(h.hall_id)}">${shortHall(h.hall_id)}</div>
      <div class="hall-stat-row"><span class="label">Total Bookings</span><span class="val">${h.total||0}</span></div>
      <div class="hall-stat-row"><span class="label">Confirmed</span><span class="val" style="color:#2dce89">${h.confirmed||0}</span></div>
      <div class="hall-stat-row"><span class="label">Cancelled</span><span class="val" style="color:#f5365c">${h.cancelled||0}</span></div>
      <div class="hall-stat-row"><span class="label">Revenue</span><span class="val" style="color:#f0b429">${fmtMoney(h.revenue||0)}</span></div>
      <div class="hall-stat-row"><span class="label">Success Rate</span><span class="val">${h.total>0?Math.round((h.confirmed||0)/h.total*100):0}%</span></div>
    </div>`).join('');
}
 
/* ═══════════════ BOOTSTRAP ═══════════════ */
window.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('adminAuth') === '1') {
    document.getElementById('loginOverlay').style.display = 'none';
    document.getElementById('adminApp').style.display     = 'flex';
    initAdmin();
  }
});
 