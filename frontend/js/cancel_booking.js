/* ═══════════════════════════════════════════════════════════
   EventHall — cancel_booking.js
   Load AFTER booking.js
   ═══════════════════════════════════════════════════════════ */
"use strict";

/* ─────────────────────────────────────────────────────────
   SAFE API
───────────────────────────────────────────────────────── */
async function safeApi(endpoint, method="GET", body=null) {
  const options={method,headers:{"Content-Type":"application/json"}};
  if(body) options.body=JSON.stringify(body);
  showSpinner(true);
  try {
    const res  = await fetch(BASE_URL+endpoint, options);
    const text = await res.text();
    showSpinner(false);
    let data;
    try { data=JSON.parse(text); }
    catch { console.error("Non-JSON response:",text.slice(0,300)); throw new Error("Server error. Make sure backend is running."); }
    if(!res.ok) throw new Error(data.message||data.error||"Request failed");
    return data;
  } catch(err) { showSpinner(false); throw err; }
}

/* ─────────────────────────────────────────────────────────
   STATE
───────────────────────────────────────────────────────── */
let cancelTarget         = null;
let selectedCancelReason = null;
let otpTimerInterval     = null;
let generatedOtp         = null;

/* ─────────────────────────────────────────────────────────
   POLICY
───────────────────────────────────────────────────────── */
function getCancellationPolicy(eventDate) {
  const today    = new Date(); today.setHours(0,0,0,0);
  const evDate   = new Date(eventDate); evDate.setHours(0,0,0,0);
  const daysLeft = Math.ceil((evDate-today)/(1000*60*60*24));
  if(daysLeft>30) return{pct:10, label:"10% charge — more than 30 days before event"};
  if(daysLeft>14) return{pct:20, label:"20% charge — 15–30 days before event"};
  if(daysLeft>7)  return{pct:35, label:"35% charge — 8–14 days before event"};
  if(daysLeft>0)  return{pct:50, label:"50% charge — within 7 days of event"};
  return              {pct:100,label:"No refund — event date has passed"};
}

function generateFrontendOtp() {
  return String(Math.floor(100000+Math.random()*900000));
}

/* ─────────────────────────────────────────────────────────
   OPEN CANCEL MODAL
───────────────────────────────────────────────────────── */
function openCancelModal(booking) {
  cancelTarget=booking; selectedCancelReason=null; generatedOtp=null;
  document.getElementById("cancelStep1").style.display="block";
  document.getElementById("cancelStep2").style.display="none";
  document.getElementById("cancelStep3").style.display="none";
  document.getElementById("cancelBookingRef").textContent="Ref: "+booking.booking_id;
  const policy=getCancellationPolicy(booking.event_date);
  document.getElementById("cancelPolicyText").innerHTML=`<strong style="color:#e8a020">${policy.label}</strong>`;
  document.querySelectorAll(".reason-option").forEach(el=>el.classList.remove("selected"));
  document.getElementById("cancelStep1NextBtn").disabled=true;
  document.getElementById("refundPreview").style.display="none";
  document.getElementById("cancelNotesWrap").style.display="none";
  const ta=document.getElementById("cancelNotes"); if(ta) ta.value="";
  const cc=document.getElementById("notesCharCount"); if(cc) cc.textContent="0 / 300";
  openModal("cancelBookingModal");
}

function openCancelModalById(bookingId) {
  const booking=_bookingMap[bookingId];
  if(!booking) { toast("Booking data not found. Please close and reopen My Bookings.","error"); return; }
  openCancelModal(booking);
}

function closeCancelModal() {
  closeModal("cancelBookingModal");
  clearOtpTimer();
  cancelTarget=null; selectedCancelReason=null; generatedOtp=null;
}

/* ─────────────────────────────────────────────────────────
   SELECT REASON
───────────────────────────────────────────────────────── */
function selectCancelReason(labelEl, value) {
  document.querySelectorAll(".reason-option").forEach(el=>el.classList.remove("selected"));
  labelEl.classList.add("selected");
  selectedCancelReason=value;
  document.getElementById("cancelStep1NextBtn").disabled=false;
  document.getElementById("cancelNotesWrap").style.display=value==="other"?"block":"none";
  if(cancelTarget) {
    const policy=getCancellationPolicy(cancelTarget.event_date);
    const paid=Number(cancelTarget.advance_paid)||0;
    const deduction=Math.ceil(paid*policy.pct/100);
    const refund=Math.max(0,paid-deduction);
    document.getElementById("refundPreview").style.display="block";
    document.getElementById("refundAmountPaid").textContent="₹"+paid.toLocaleString("en-IN");
    document.getElementById("refundDeductPct").textContent=policy.pct;
    document.getElementById("refundDeduction").textContent="−₹"+deduction.toLocaleString("en-IN");
    document.getElementById("refundFinalAmt").textContent="₹"+refund.toLocaleString("en-IN");
  }
}

function updateNotesCount() {
  const ta=document.getElementById("cancelNotes");
  const cc=document.getElementById("notesCharCount");
  if(ta&&cc) cc.textContent=ta.value.length+" / 300";
}

/* ─────────────────────────────────────────────────────────
   STEP 1 → 2
───────────────────────────────────────────────────────── */
function goToCancelStep2() {
  if(!selectedCancelReason) { toast("Please select a cancellation reason","error"); return; }
  generatedOtp=generateFrontendOtp();
  document.getElementById("cancelStep1").style.display="none";
  document.getElementById("cancelStep2").style.display="block";
  const otpBox=document.getElementById("otpDisplayBox");
  if(otpBox) otpBox.innerHTML=generatedOtp.split("").map(d=>`<span class="otp-display-digit">${d}</span>`).join("");
  resetOtpInputs();
  startOtpTimer();
}

function goBackToCancelStep1() {
  clearOtpTimer(); generatedOtp=null;
  document.getElementById("cancelStep2").style.display="none";
  document.getElementById("cancelStep1").style.display="block";
}

/* ─────────────────────────────────────────────────────────
   OTP INPUT BOXES
───────────────────────────────────────────────────────── */
function resetOtpInputs() {
  document.querySelectorAll(".otp-digit").forEach(input=>{
    input.value=""; input.classList.remove("filled","error-shake");
    const fresh=input.cloneNode(true);
    input.parentNode.replaceChild(fresh,input);
  });
  const freshDigits=document.querySelectorAll(".otp-digit");
  freshDigits.forEach((input,idx)=>{
    input.addEventListener("input",()=>{
      input.value=input.value.replace(/\D/g,"").slice(0,1);
      input.classList.toggle("filled",!!input.value);
      if(input.value&&idx<freshDigits.length-1) freshDigits[idx+1].focus();
      checkOtpComplete(freshDigits);
    });
    input.addEventListener("keydown",e=>{
      if(e.key==="Backspace"&&!input.value&&idx>0){ freshDigits[idx-1].value=""; freshDigits[idx-1].classList.remove("filled"); freshDigits[idx-1].focus(); }
    });
    input.addEventListener("paste",e=>{
      const pasted=(e.clipboardData||window.clipboardData).getData("text").replace(/\D/g,"");
      if(pasted.length===6){ e.preventDefault(); freshDigits.forEach((d,i)=>{d.value=pasted[i]||"";d.classList.toggle("filled",!!pasted[i]);}); freshDigits[5].focus(); checkOtpComplete(freshDigits); }
    });
  });
  const errEl=document.getElementById("otpError"); if(errEl) errEl.style.display="none";
  const btnEl=document.getElementById("cancelStep2ConfirmBtn"); if(btnEl) btnEl.disabled=true;
  setTimeout(()=>{if(freshDigits[0]) freshDigits[0].focus();},150);
}

function checkOtpComplete(digits) {
  const full=Array.from(digits).every(d=>d.value.length===1);
  const btn=document.getElementById("cancelStep2ConfirmBtn");
  if(btn) btn.disabled=!full;
}

function getEnteredOtp() {
  return Array.from(document.querySelectorAll(".otp-digit")).map(d=>d.value).join("");
}

/* ─────────────────────────────────────────────────────────
   RESEND
───────────────────────────────────────────────────────── */
function resendOtp() {
  generatedOtp=generateFrontendOtp();
  const otpBox=document.getElementById("otpDisplayBox");
  if(otpBox) otpBox.innerHTML=generatedOtp.split("").map(d=>`<span class="otp-display-digit">${d}</span>`).join("");
  resetOtpInputs();
  startOtpTimer();
  toast("New OTP generated — enter the code shown above","info");
}

/* ─────────────────────────────────────────────────────────
   TIMER
───────────────────────────────────────────────────────── */
function startOtpTimer() {
  clearOtpTimer();
  let secs=30;
  const tw=document.getElementById("otpTimerWrap");
  const rw=document.getElementById("otpResendWrap");
  const cd=document.getElementById("otpCountdown");
  if(rw) rw.style.display="none";
  if(tw) tw.style.display="inline";
  if(cd) cd.textContent=secs;
  otpTimerInterval=setInterval(()=>{
    secs--;
    if(cd) cd.textContent=secs;
    if(secs<=0){ clearOtpTimer(); if(tw) tw.style.display="none"; if(rw) rw.style.display="inline"; }
  },1000);
}

function clearOtpTimer() { if(otpTimerInterval){clearInterval(otpTimerInterval);otpTimerInterval=null;} }

/* ─────────────────────────────────────────────────────────
   CONFIRM CANCELLATION
───────────────────────────────────────────────────────── */
async function confirmCancellation() {
  const enteredOtp=getEnteredOtp();
  const errEl=document.getElementById("otpError");
  const btn=document.getElementById("cancelStep2ConfirmBtn");
  if(enteredOtp.length!==6) { toast("Please enter the complete 6-digit OTP","error"); return; }
  if(enteredOtp!==generatedOtp) {
    document.querySelectorAll(".otp-digit").forEach(d=>{d.classList.remove("error-shake");void d.offsetWidth;d.classList.add("error-shake");});
    if(errEl){errEl.style.display="block";errEl.textContent="❌ Incorrect OTP. Check the code shown above.";}
    return;
  }
  if(btn){btn.disabled=true;btn.textContent="Processing…";}
  if(errEl) errEl.style.display="none";
  const policy=getCancellationPolicy(cancelTarget.event_date);
  const paid=Number(cancelTarget.advance_paid)||0;
  const deduction=Math.ceil(paid*policy.pct/100);
  const refund=Math.max(0,paid-deduction);
  try {
    const result=await safeApi("/cancel-booking","POST",{
      user_id:currentUser.id, booking_id:cancelTarget.booking_id,
      reason:selectedCancelReason, notes:(document.getElementById("cancelNotes")||{}).value||"",
      refund_amount:refund, deduct_pct:policy.pct,
    });
    clearOtpTimer();
    showCancelSuccess(result,refund);
  } catch(err) {
    if(btn){btn.disabled=false;btn.textContent="Confirm Cancellation";}
    if(errEl){errEl.style.display="block";errEl.textContent="❌ "+err.message;}
    toast(err.message,"error");
  }
}

/* ─────────────────────────────────────────────────────────
   CANCEL SUCCESS
───────────────────────────────────────────────────────── */
function showCancelSuccess(result, refundAmount) {
  document.getElementById("cancelStep2").style.display="none";
  document.getElementById("cancelStep3").style.display="block";
  const hall=(HALLS.find(h=>h.id==cancelTarget.hall_id)||{}).name||("Hall #"+cancelTarget.hall_id);
  const dateStr=cancelTarget.event_date?new Date(cancelTarget.event_date).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"}):cancelTarget.event_date;
  const policy=getCancellationPolicy(cancelTarget.event_date);
  const paid=Number(cancelTarget.advance_paid)||0;
  const deduction=Math.ceil(paid*policy.pct/100);
  document.getElementById("cancelSuccessDetails").innerHTML=
    `<div class="cancel-success-detail-row"><span>Booking ID</span><span style="color:var(--gold)">${cancelTarget.booking_id}</span></div>`+
    `<div class="cancel-success-detail-row"><span>Event</span><span>${cancelTarget.event_type}</span></div>`+
    `<div class="cancel-success-detail-row"><span>Date</span><span>${dateStr}</span></div>`+
    `<div class="cancel-success-detail-row"><span>Hall</span><span>${hall}</span></div>`+
    `<div class="cancel-success-detail-row"><span>Cancellation ID</span><span style="color:var(--gold)">${result.cancellation_id||("CX-"+Date.now())}</span></div>`+
    `<div class="cancel-success-detail-row"><span>Cancelled On</span><span>${new Date().toLocaleString("en-IN",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span></div>`+
    `<div class="cancel-success-detail-row"><span>Amount Paid</span><span>₹${paid.toLocaleString("en-IN")}</span></div>`+
    `<div class="cancel-success-detail-row"><span>Deduction (${policy.pct}%)</span><span style="color:#f07070">−₹${deduction.toLocaleString("en-IN")}</span></div>`;
  document.getElementById("finalRefundAmount").textContent="₹"+refundAmount.toLocaleString("en-IN");
  // Update booking card in My Bookings if open
  if(_bookingMap[cancelTarget.booking_id]) _bookingMap[cancelTarget.booking_id].status="cancelled";
  toast("Booking cancelled! Refund of ₹"+refundAmount.toLocaleString("en-IN")+" initiated 🎉","success");
}

/* ─────────────────────────────────────────────────────────
   INIT
───────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded",()=>{
  const ta=document.getElementById("cancelNotes");
  if(ta) ta.addEventListener("input",updateNotesCount);
  const overlay=document.getElementById("cancelBookingModal");
  if(overlay) overlay.addEventListener("click",e=>{if(e.target===overlay) closeCancelModal();});
});
