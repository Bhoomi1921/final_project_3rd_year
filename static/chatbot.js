// ═══════════════════════════════════════════════════════════════════
//  Safe Return — AI Chatbot  (chatbot.js)
//  Drop this file in your project, add <script src="chatbot.js"></script>
//  before </body> in index.html
// ═══════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', function() {
(function () {
  'use strict';

  // ── Knowledge Base ──────────────────────────────────────────────
  const KB = {
    greetings: ['hi','hello','hey','namaste','hii','helo','good morning','good evening','good afternoon'],
    howAreYou: ['how are you','how r u','how are u','whats up','what\'s up','sup'],
    thanks: ['thank','thanks','thankyou','thank you','thx','ty','shukriya','dhanyawad'],
    bye: ['bye','goodbye','exit','quit','see you','tata','alvida'],

    topics: {
      howToUse: {
        keys: ['how to use','how do i use','guide','tutorial','instructions','start','begin','use app','use this','help me use'],
        title: '📖 How to Use Safe Return',
        steps: [
          { icon:'1️⃣', text:'<b>Login / Register</b> — Click "Login / Register" on the home page. Select your role: <b>Public</b>, <b>Volunteer</b>, or <b>Admin</b>.' },
          { icon:'2️⃣', text:'<b>Report a Missing Person</b> — Go to <b>Report Person</b>, fill in details like name, age, last seen location, and upload a photo.' },
          { icon:'3️⃣', text:'<b>AI Face Recognition</b> — Admin can click 🤖 <b>Recognition</b> on any report to scan and match the person\'s face against the shelter database.' },
          { icon:'4️⃣', text:'<b>NGO Map</b> — Use the <b>Map</b> tab to find nearby shelters and NGOs in your city.' },
          { icon:'5️⃣', text:'<b>Notifications</b> — You\'ll get alerts when a match is found. Check the 🔔 bell icon anytime.' },
          { icon:'6️⃣', text:'<b>Mark as Found</b> — Once reunited, mark the person as ✅ Found from the dashboard.' },
        ]
      },
      reportMissing: {
        keys: ['report missing','report person','how to report','submit report','lost person','file report','missing report'],
        title: '🚨 How to Report a Missing Person',
        steps: [
          { icon:'✅', text:'Login with your credentials (Public role).' },
          { icon:'✅', text:'Click <b>Report Person</b> from the top menu.' },
          { icon:'✅', text:'Fill: Full Name, Age, Gender, Last Seen Location & Date/Time.' },
          { icon:'✅', text:'Upload a clear photo of the missing person.' },
          { icon:'✅', text:'Enter your contact name and <b>10-digit Indian mobile number</b>.' },
          { icon:'✅', text:'Click <b>Submit Report</b>. You\'ll get a confirmation!' },
        ]
      },
      faceRecognition: {
        keys: ['face recognition','ai recognition','ai match','recognition','face match','detect face','run recognition','how recognition works'],
        title: '🤖 How AI Face Recognition Works',
        steps: [
          { icon:'🔹', text:'Admin logs in and sees all missing person reports on the dashboard.' },
          { icon:'🔹', text:'Click the <b>🤖 Recognition</b> button next to any report.' },
          { icon:'🔹', text:'The system uses <b>ArcFace + RetinaFace</b> deep learning to compare the photo against the shelter\'s database.' },
          { icon:'🔹', text:'If a match is found with high confidence (>78%), the status updates to <b>Found</b> and a notification is sent.' },
          { icon:'🔹', text:'You can also <b>upload a new photo</b> or use your <b>camera</b> to scan in real-time.' },
        ]
      },
      ngoMap: {
        keys: ['map','ngo','shelter','nearby','find ngo','find shelter','nearest shelter','location map'],
        title: '🗺️ NGO & Shelter Map',
        steps: [
          { icon:'📍', text:'Click <b>Map Navigation</b> from the dashboard or home page.' },
          { icon:'📍', text:'Type your <b>city name</b> in the search bar and click Search.' },
          { icon:'📍', text:'<b>Orange markers</b> = Featured NGOs | <b>Green markers</b> = OpenStreetMap NGOs.' },
          { icon:'📍', text:'Click any marker to see the NGO name, address, and phone number.' },
          { icon:'📍', text:'Emergency: <b>Police 100</b> | <b>Ambulance 108</b>' },
        ]
      },
      notifications: {
        keys: ['notification','alert','bell','notify','updates','news','match notification'],
        title: '🔔 Notifications',
        steps: [
          { icon:'💡', text:'Notifications are sent automatically when a face recognition <b>match is found</b>.' },
          { icon:'💡', text:'Click the <b>🔔 bell icon</b> in the top navbar to see all alerts.' },
          { icon:'💡', text:'You can filter by: <b>Match Found</b>, <b>Updates</b>, <b>System</b>.' },
          { icon:'💡', text:'Click <b>View Details</b> on any notification to see family contact and match info.' },
          { icon:'💡', text:'Use <b>Mark All as Read</b> to clear the unread badge.' },
        ]
      },
      feedback: {
        keys: ['feedback','review','rating','rate','rate app','give feedback','opinion','suggestion','improve'],
        title: '⭐ Give Feedback & Rating',
        isForm: 'feedback'
      },
      complaint: {
        keys: ['complaint','problem','issue','bug','not working','error','facing problem','facing issue','trouble','help me fix'],
        title: '🛠️ Report a Problem / Complaint',
        isForm: 'complaint'
      },
      customerCare: {
        keys: ['customer care','customer support','helpline','contact support','support','call','phone number','toll free','emergency','help line','helpline number'],
        title: '📞 Helpline & Customer Care',
        isContact: true
      },
      aadhaar: {
        keys: ['aadhaar','aadhar','identity','verify','otp','verification'],
        title: '🪪 Aadhaar Verification',
        steps: [
          { icon:'🔐', text:'Safe Return supports optional Aadhaar-based verification for confirmed family identity.' },
          { icon:'🔐', text:'Enter the <b>family Aadhaar</b> and <b>missing person\'s Aadhaar</b> during report submission.' },
          { icon:'🔐', text:'An <b>OTP will be sent</b> to the Aadhaar-registered mobile number.' },
          { icon:'🔐', text:'Enter the OTP to confirm identity — this is especially required before handover.' },
        ]
      },
      status: {
        keys: ['status','check status','my report','report status','found status','missing status','track'],
        title: '📋 Check Report Status',
        steps: [
          { icon:'🔍', text:'Login and go to your <b>Dashboard</b>.' },
          { icon:'🔍', text:'All reports are listed with their current status: <b>Missing</b>, <b>Processing</b>, or <b>Found</b>.' },
          { icon:'🔍', text:'Admin can also click <b>View</b> on any row to see full details.' },
          { icon:'🔍', text:'If status is Found, admin can click <b>✅ Found</b> to officially update it.' },
        ]
      }
    },

    quickReplies: [
      { label:'📖 How to Use', topic:'howToUse' },
      { label:'🚨 Report Missing', topic:'reportMissing' },
      { label:'🤖 Face Recognition', topic:'faceRecognition' },
      { label:'🗺️ NGO Map', topic:'ngoMap' },
      { label:'🔔 Notifications', topic:'notifications' },
      { label:'📋 Check Status', topic:'status' },
      { label:'🪪 Aadhaar', topic:'aadhaar' },
      { label:'📞 Helpline', topic:'customerCare' },
      { label:'⭐ Feedback', topic:'feedback' },
      { label:'🛠️ Report Issue', topic:'complaint' },
    ]
  };

  const CONTACT_INFO = {
    helpline: '1800-XXX-XXXX',
    emergency: '100 (Police) / 108 (Ambulance)',
    email: 'support@safereturn.in',
    whatsapp: '+91-98765-43210',
    hours: 'Mon–Sat, 9AM–6PM IST',
  };

  // ── State ────────────────────────────────────────────────────────
  let isOpen       = false;
  let isMinimized  = false;
  let unreadCount  = 0;
  let feedbackStep = 0;
  let feedbackData = {};
  let complaintStep = 0;
  let complaintData = {};
  let currentMode  = null; // 'feedback' | 'complaint' | null
  let msgCount     = 0;

  // ── Inject CSS ───────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&display=swap');

    #sr-chat-root * { box-sizing: border-box; font-family: 'Nunito', 'Segoe UI', sans-serif; }

    /* ── Bubble ── */
    #sr-chat-bubble {
      position: fixed; bottom: 28px; right: 28px; z-index: 9999;
      width: 62px; height: 62px; border-radius: 50%;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; box-shadow: 0 6px 24px rgba(249,115,22,.45);
      transition: transform .25s, box-shadow .25s;
      border: none; outline: none;
    }
    #sr-chat-bubble:hover { transform: scale(1.1); box-shadow: 0 10px 30px rgba(249,115,22,.55); }
    #sr-chat-bubble svg { width: 28px; height: 28px; fill: white; }
    #sr-chat-bubble.open svg.icon-chat { display: none; }
    #sr-chat-bubble.open svg.icon-close { display: block !important; }
    #sr-chat-bubble svg.icon-close { display: none; }

    /* pulse ring */
    #sr-chat-bubble::after {
      content: ''; position: absolute; inset: -5px; border-radius: 50%;
      border: 2px solid rgba(249,115,22,.4);
      animation: sr-pulse 2s ease-out infinite;
    }
    @keyframes sr-pulse {
      0%   { transform: scale(1); opacity: 1; }
      100% { transform: scale(1.5); opacity: 0; }
    }

    /* badge */
    #sr-badge {
      position: absolute; top: -3px; right: -3px;
      background: #ef4444; color: white; font-size: 10px; font-weight: 800;
      width: 20px; height: 20px; border-radius: 50%;
      display: none; align-items: center; justify-content: center;
      border: 2px solid white;
    }
    #sr-badge.show { display: flex; }

    /* ── Window ── */
    #sr-chat-window {
      position: fixed; bottom: 105px; right: 28px; z-index: 9998;
      width: 370px; height: 580px;
      background: #fff; border-radius: 22px;
      box-shadow: 0 20px 60px rgba(0,0,0,.18), 0 0 0 1px rgba(0,0,0,.06);
      display: flex; flex-direction: column; overflow: hidden;
      transform: scale(.85) translateY(20px); opacity: 0; pointer-events: none;
      transition: transform .28s cubic-bezier(.34,1.56,.64,1), opacity .2s;
    }
    #sr-chat-window.open {
      transform: scale(1) translateY(0); opacity: 1; pointer-events: all;
    }
    #sr-chat-window.minimized { height: 64px; }

    /* Header */
    #sr-chat-header {
      background: linear-gradient(135deg, #f97316 0%, #ea580c 60%, #c2410c 100%);
      padding: 14px 16px; display: flex; align-items: center; gap: 12px;
      flex-shrink: 0; position: relative; cursor: pointer;
    }
    .sr-avatar {
      width: 40px; height: 40px; border-radius: 50%;
      background: rgba(255,255,255,.25); display: flex; align-items: center;
      justify-content: center; font-size: 20px; flex-shrink: 0;
      border: 2px solid rgba(255,255,255,.4);
    }
    .sr-header-info { flex: 1; }
    .sr-header-name { color: white; font-weight: 800; font-size: .97rem; line-height: 1.2; }
    .sr-header-status { color: rgba(255,255,255,.82); font-size: .75rem; display: flex; align-items: center; gap: 5px; margin-top: 2px; }
    .sr-status-dot { width: 7px; height: 7px; border-radius: 50%; background: #4ade80; display: inline-block; animation: sr-blink 1.5s ease-in-out infinite; }
    @keyframes sr-blink { 0%,100%{opacity:1} 50%{opacity:.3} }
    .sr-header-actions { display: flex; gap: 8px; }
    .sr-h-btn { background: rgba(255,255,255,.2); border: none; color: white; width: 30px; height: 30px; border-radius: 50%; cursor: pointer; font-size: .85rem; display: flex; align-items: center; justify-content: center; transition: background .2s; }
    .sr-h-btn:hover { background: rgba(255,255,255,.35); }

    /* Body */
    #sr-chat-body {
      flex: 1; overflow-y: auto; padding: 16px 14px;
      background: #f8fafc; display: flex; flex-direction: column; gap: 10px;
      scroll-behavior: smooth;
    }
    #sr-chat-body::-webkit-scrollbar { width: 4px; }
    #sr-chat-body::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }

    /* Messages */
    .sr-msg { display: flex; gap: 8px; animation: sr-fadein .25s ease; max-width: 100%; }
    @keyframes sr-fadein { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }

    .sr-msg.bot { align-items: flex-end; }
    .sr-msg.user { flex-direction: row-reverse; }

    .sr-bot-ava { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg,#f97316,#ea580c); display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; }

    .sr-bubble {
      max-width: 82%; padding: 11px 14px; border-radius: 18px;
      font-size: .875rem; line-height: 1.5; position: relative;
    }
    .sr-bubble.bot { background: white; color: #1e293b; border-bottom-left-radius: 4px; box-shadow: 0 2px 8px rgba(0,0,0,.07); }
    .sr-bubble.user { background: linear-gradient(135deg,#f97316,#ea580c); color: white; border-bottom-right-radius: 4px; }
    .sr-bubble b { font-weight: 700; }

    /* Step cards inside bot bubbles */
    .sr-step { display: flex; gap: 8px; align-items: flex-start; margin: 5px 0; }
    .sr-step-icon { font-size: 1rem; flex-shrink: 0; margin-top: 1px; }
    .sr-step-text { font-size: .83rem; color: #334155; line-height: 1.5; }

    /* Contact card */
    .sr-contact-card { background: #fff7ed; border: 1.5px solid #fed7aa; border-radius: 12px; padding: 12px; margin-top: 6px; }
    .sr-contact-row { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: .83rem; color: #334155; border-bottom: 1px solid #fde8cc; }
    .sr-contact-row:last-child { border: none; }
    .sr-contact-row span.icon { font-size: 1.1rem; width: 22px; text-align: center; flex-shrink:0; }
    .sr-contact-row a { color: #ea580c; font-weight: 700; text-decoration: none; }
    .sr-contact-row a:hover { text-decoration: underline; }

    /* Quick replies */
    #sr-quick-wrap {
      padding: 10px 14px; border-top: 1px solid #f1f5f9;
      background: white; display: flex; flex-wrap: wrap; gap: 6px;
      flex-shrink: 0; max-height: 120px; overflow-y: auto;
    }
    #sr-quick-wrap::-webkit-scrollbar { width: 3px; }
    #sr-quick-wrap::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 3px; }
    .sr-qr {
      background: #fff7ed; color: #ea580c; border: 1.5px solid #fed7aa;
      padding: 5px 11px; border-radius: 20px; font-size: .78rem; font-weight: 700;
      cursor: pointer; transition: all .18s; white-space: nowrap;
    }
    .sr-qr:hover { background: #f97316; color: white; border-color: #f97316; transform: translateY(-1px); }

    /* Input bar */
    #sr-chat-footer {
      display: flex; gap: 8px; padding: 10px 14px;
      border-top: 1px solid #f1f5f9; background: white; flex-shrink: 0;
    }
    #sr-input {
      flex: 1; border: 1.5px solid #e2e8f0; border-radius: 22px;
      padding: 9px 16px; font-size: .875rem; outline: none;
      transition: border-color .2s; font-family: inherit;
      background: #f8fafc;
    }
    #sr-input:focus { border-color: #f97316; background: white; }
    #sr-send {
      width: 40px; height: 40px; border-radius: 50%;
      background: linear-gradient(135deg,#f97316,#ea580c);
      border: none; color: white; cursor: pointer; display: flex;
      align-items: center; justify-content: center; flex-shrink: 0;
      transition: transform .2s, box-shadow .2s;
    }
    #sr-send:hover { transform: scale(1.1); box-shadow: 0 4px 12px rgba(249,115,22,.4); }
    #sr-send svg { width: 18px; height: 18px; fill: white; }

    /* Typing indicator */
    .sr-typing { display: flex; gap: 4px; align-items: center; padding: 10px 14px; }
    .sr-typing span { width: 7px; height: 7px; border-radius: 50%; background: #cbd5e1; animation: sr-bounce .9s infinite; display: block; }
    .sr-typing span:nth-child(2) { animation-delay: .15s; }
    .sr-typing span:nth-child(3) { animation-delay: .3s; }
    @keyframes sr-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }

    /* Star rating */
    .sr-stars { display: flex; gap: 6px; justify-content: center; margin: 8px 0; }
    .sr-star { font-size: 1.6rem; cursor: pointer; transition: transform .15s; filter: grayscale(1); }
    .sr-star:hover, .sr-star.active { filter: none; transform: scale(1.2); }

    /* Form input inside chat */
    .sr-chat-input-field {
      width: 100%; border: 1.5px solid #e2e8f0; border-radius: 10px;
      padding: 9px 13px; font-size: .85rem; margin: 6px 0; outline: none;
      font-family: inherit; transition: border-color .2s;
    }
    .sr-chat-input-field:focus { border-color: #f97316; }
    .sr-chat-input-field::placeholder { color: #94a3b8; }
    textarea.sr-chat-input-field { resize: none; height: 70px; }

    .sr-submit-btn {
      width: 100%; background: linear-gradient(135deg,#f97316,#ea580c);
      color: white; border: none; padding: 10px; border-radius: 10px;
      font-size: .87rem; font-weight: 700; cursor: pointer; margin-top: 4px;
      font-family: inherit; transition: opacity .2s;
    }
    .sr-submit-btn:hover { opacity: .9; }

    /* Success checkmark */
    .sr-success { text-align: center; padding: 8px 0; }
    .sr-success .sr-check { font-size: 2.5rem; display: block; margin-bottom: 6px; }
    .sr-success p { color: #334155; font-size: .87rem; }

    /* Responsive */
    @media (max-width: 420px) {
      #sr-chat-window { width: calc(100vw - 20px); right: 10px; bottom: 90px; }
      #sr-chat-bubble { right: 16px; bottom: 16px; }
    }
  `;
  document.head.appendChild(style);

  // ── Build DOM ────────────────────────────────────────────────────
  const root = document.createElement('div');
  root.id = 'sr-chat-root';
  root.innerHTML = `
    <!-- Bubble -->
    <button id="sr-chat-bubble" aria-label="Open chat">
      <svg class="icon-chat" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 10H6V10h12v2zm0-3H6V7h12v2z"/></svg>
      <svg class="icon-close" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
      <span id="sr-badge"></span>
    </button>

    <!-- Window -->
    <div id="sr-chat-window">
      <div id="sr-chat-header">
        <div class="sr-avatar">🤖</div>
        <div class="sr-header-info">
          <div class="sr-header-name">SafeBot — Safe Return</div>
          <div class="sr-header-status"><span class="sr-status-dot"></span> Online • Always here to help</div>
        </div>
        <div class="sr-header-actions">
          <button class="sr-h-btn" id="sr-minimize-btn" title="Minimize">─</button>
          <button class="sr-h-btn" id="sr-close-btn" title="Close">✕</button>
        </div>
      </div>
      <div id="sr-chat-body"></div>
      <div id="sr-quick-wrap"></div>
      <div id="sr-chat-footer">
        <input id="sr-input" type="text" placeholder="Ask me anything…" autocomplete="off"/>
        <button id="sr-send">
          <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  // ── Element refs ─────────────────────────────────────────────────
  const bubble   = document.getElementById('sr-chat-bubble');
  const win      = document.getElementById('sr-chat-window');
  const body     = document.getElementById('sr-chat-body');
  const input    = document.getElementById('sr-input');
  const sendBtn  = document.getElementById('sr-send');
  const badge    = document.getElementById('sr-badge');
  const qWrap    = document.getElementById('sr-quick-wrap');
  const minBtn   = document.getElementById('sr-minimize-btn');
  const closeBtn = document.getElementById('sr-close-btn');
  const header   = document.getElementById('sr-chat-header');

  // ── Helpers ───────────────────────────────────────────────────────
  function scrollBottom() {
    setTimeout(() => { body.scrollTop = body.scrollHeight; }, 60);
  }

  function showBadge(n) {
    badge.textContent = n;
    badge.classList.toggle('show', n > 0);
  }

  function addMsg(html, from = 'bot') {
    const wrap = document.createElement('div');
    wrap.className = 'sr-msg ' + from;
    if (from === 'bot') {
      wrap.innerHTML = `<div class="sr-bot-ava">🤖</div><div class="sr-bubble bot">${html}</div>`;
    } else {
      wrap.innerHTML = `<div class="sr-bubble user">${html}</div>`;
    }
    body.appendChild(wrap);
    scrollBottom();
    msgCount++;
    return wrap;
  }

  function showTyping() {
    const t = document.createElement('div');
    t.className = 'sr-msg bot';
    t.id = 'sr-typing';
    t.innerHTML = `<div class="sr-bot-ava">🤖</div><div class="sr-bubble bot"><div class="sr-typing"><span></span><span></span><span></span></div></div>`;
    body.appendChild(t);
    scrollBottom();
    return t;
  }

  function removeTyping() {
    const t = document.getElementById('sr-typing');
    if (t) t.remove();
  }

  function botReply(html, delay = 700) {
    const t = showTyping();
    return new Promise(resolve => {
      setTimeout(() => {
        removeTyping();
        addMsg(html, 'bot');
        resolve();
      }, delay);
    });
  }

  function renderQuickReplies() {
    qWrap.innerHTML = '';
    KB.quickReplies.forEach(qr => {
      const btn = document.createElement('button');
      btn.className = 'sr-qr';
      btn.textContent = qr.label;
      btn.onclick = () => handleTopic(qr.topic, qr.label);
      qWrap.appendChild(btn);
    });
  }

  // ── Topic Handlers ────────────────────────────────────────────────
  async function handleTopic(topicKey, label) {
    currentMode = null;
    addMsg(label, 'user');
    const topic = KB.topics[topicKey];
    if (!topic) return;

    if (topic.isContact) {
      await botReply(`
        <b>${topic.title}</b>
        <div class="sr-contact-card">
          <div class="sr-contact-row"><span class="icon">📞</span> Helpline: <a href="tel:${CONTACT_INFO.helpline}">${CONTACT_INFO.helpline}</a> (Toll-Free)</div>
          <div class="sr-contact-row"><span class="icon">🚨</span> Emergency: <b>${CONTACT_INFO.emergency}</b></div>
          <div class="sr-contact-row"><span class="icon">📧</span> Email: <a href="mailto:${CONTACT_INFO.email}">${CONTACT_INFO.email}</a></div>
          <div class="sr-contact-row"><span class="icon">💬</span> WhatsApp: <a href="https://wa.me/${CONTACT_INFO.whatsapp.replace(/[^0-9]/g,'')}">${CONTACT_INFO.whatsapp}</a></div>
          <div class="sr-contact-row"><span class="icon">🕐</span> Hours: ${CONTACT_INFO.hours}</div>
        </div>
        <br><small style="color:#64748b;">We're here to help you reunite with your loved ones. ❤️</small>
      `);
      return;
    }

    if (topic.isForm === 'feedback') {
      startFeedback();
      return;
    }
    if (topic.isForm === 'complaint') {
      startComplaint();
      return;
    }

    // Steps-based response
    const stepsHtml = topic.steps.map(s =>
      `<div class="sr-step"><span class="sr-step-icon">${s.icon}</span><span class="sr-step-text">${s.text}</span></div>`
    ).join('');
    await botReply(`<b>${topic.title}</b><br><br>${stepsHtml}`);
  }

  // ── Feedback Flow ─────────────────────────────────────────────────
  async function startFeedback() {
    currentMode = 'feedback';
    feedbackStep = 0;
    feedbackData = {};
    await botReply(`
      <b>⭐ We'd love your feedback!</b><br>
      It helps us improve Safe Return for everyone.<br><br>
      <b>Step 1/3</b> — How would you rate your experience?<br>
      <div class="sr-stars" id="sr-star-row">
        <span class="sr-star" data-v="1">⭐</span>
        <span class="sr-star" data-v="2">⭐</span>
        <span class="sr-star" data-v="3">⭐</span>
        <span class="sr-star" data-v="4">⭐</span>
        <span class="sr-star" data-v="5">⭐</span>
      </div>
    `);
    // Attach star handlers
    setTimeout(() => {
      document.querySelectorAll('#sr-star-row .sr-star').forEach(star => {
        star.addEventListener('click', () => {
          feedbackData.rating = parseInt(star.dataset.v);
          document.querySelectorAll('#sr-star-row .sr-star').forEach((s, i) => {
            s.classList.toggle('active', i < feedbackData.rating);
          });
          setTimeout(() => feedbackStep2(), 500);
        });
      });
    }, 100);
  }

  async function feedbackStep2() {
    feedbackStep = 2;
    const label = ['😞 Poor','😕 Fair','😊 Good','😀 Great','🤩 Excellent'][feedbackData.rating - 1];
    addMsg(`${feedbackData.rating} Star${feedbackData.rating > 1 ? 's' : ''} — ${label}`, 'user');
    await botReply(`
      <b>Step 2/3</b> — What did you like or dislike? <small style="color:#94a3b8;">(optional)</small><br>
      <textarea class="sr-chat-input-field" id="sr-fb-comment" placeholder="Share your thoughts…"></textarea>
      <button class="sr-submit-btn" onclick="window._srFbStep3()">Next →</button>
    `);
  }

  window._srFbStep3 = async function () {
    feedbackData.comment = document.getElementById('sr-fb-comment')?.value.trim() || '';
    addMsg(feedbackData.comment || '(No comment)', 'user');
    await botReply(`
      <b>Step 3/3</b> — Your name (optional):<br>
      <input class="sr-chat-input-field" id="sr-fb-name" placeholder="Your name…" /><br>
      Your contact (optional):<br>
      <input class="sr-chat-input-field" id="sr-fb-contact" placeholder="Email or phone…" />
      <button class="sr-submit-btn" onclick="window._srFbSubmit()">Submit Feedback 🚀</button>
    `);
  };

  window._srFbSubmit = async function () {
    feedbackData.name    = document.getElementById('sr-fb-name')?.value.trim() || 'Anonymous';
    feedbackData.contact = document.getElementById('sr-fb-contact')?.value.trim() || '';
    addMsg('Submitting feedback…', 'user');
    await botReply(`
      <div class="sr-success">
        <span class="sr-check">🎉</span>
        <b>Thank you, ${feedbackData.name}!</b>
        <p>Your <b>${feedbackData.rating}⭐</b> feedback has been recorded.<br>
        We'll use it to make Safe Return even better for families!</p>
      </div>
    `);
    currentMode = null;
    setTimeout(() => botReply('Is there anything else I can help you with?'), 1000);
  };

  // ── Complaint Flow ────────────────────────────────────────────────
  async function startComplaint() {
    currentMode = 'complaint';
    complaintStep = 1;
    complaintData = {};
    await botReply(`
      <b>🛠️ Report a Problem</b><br>
      I'm sorry you're having trouble. Let me help!<br><br>
      <b>Step 1/3</b> — What type of issue are you facing?<br><br>
      ${['🔴 App not loading','📷 Photo upload failing','🤖 Face recognition error','🔔 Not getting notifications','📋 Report not submitting','🗺️ Map not working','🔐 Login issues','❓ Other'].map(o =>
        `<button class="sr-qr" style="margin:3px 0;display:block;width:100%;text-align:left;" onclick="window._srComplaintType('${o}')">${o}</button>`
      ).join('')}
    `);
  }

  window._srComplaintType = async function (type) {
    complaintData.type = type;
    addMsg(type, 'user');
    complaintStep = 2;
    await botReply(`
      <b>Step 2/3</b> — Please describe the issue in detail:<br>
      <textarea class="sr-chat-input-field" id="sr-cmp-desc" placeholder="What happened? What did you expect?"></textarea>
      <button class="sr-submit-btn" onclick="window._srComplaintStep3()">Next →</button>
    `);
  };

  window._srComplaintStep3 = async function () {
    complaintData.desc = document.getElementById('sr-cmp-desc')?.value.trim();
    if (!complaintData.desc) { alert('Please describe the issue.'); return; }
    addMsg(complaintData.desc, 'user');
    await botReply(`
      <b>Step 3/3</b> — Your contact details (so we can follow up):<br>
      <input class="sr-chat-input-field" id="sr-cmp-name" placeholder="Your name *" /><br>
      <input class="sr-chat-input-field" id="sr-cmp-phone" placeholder="Phone or Email *" />
      <button class="sr-submit-btn" onclick="window._srComplaintSubmit()">Submit Complaint 📨</button>
    `);
  };

  window._srComplaintSubmit = async function () {
    const name  = document.getElementById('sr-cmp-name')?.value.trim();
    const phone = document.getElementById('sr-cmp-phone')?.value.trim();
    if (!name || !phone) { alert('Please fill in your name and contact.'); return; }
    complaintData.name  = name;
    complaintData.phone = phone;
    addMsg(`${name} — ${phone}`, 'user');
    const ref = 'SR-' + Date.now().toString().slice(-6);
    await botReply(`
      <div class="sr-success">
        <span class="sr-check">✅</span>
        <b>Complaint Registered!</b>
        <p>Reference No: <b style="color:#f97316;">${ref}</b><br>
        Issue: <b>${complaintData.type}</b><br>
        We'll contact <b>${name}</b> at <b>${phone}</b> within <b>24–48 hours</b>.</p>
      </div>
    `);
    currentMode = null;
    setTimeout(() => botReply(`Meanwhile, you can also reach us directly:<br>📞 <b>${CONTACT_INFO.helpline}</b> (Toll-Free)`), 1000);
  };

  // ── NLP Matcher ───────────────────────────────────────────────────
  function matchTopic(text) {
    const t = text.toLowerCase().trim();

    if (KB.greetings.some(g => t.includes(g))) return 'greeting';
    if (KB.howAreYou.some(g => t.includes(g))) return 'howAreYou';
    if (KB.thanks.some(g => t.includes(g))) return 'thanks';
    if (KB.bye.some(g => t.includes(g))) return 'bye';

    for (const [key, topic] of Object.entries(KB.topics)) {
      if (topic.keys.some(k => t.includes(k))) return key;
    }
    return null;
  }

  async function handleInput() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';

    addMsg(text, 'user');

    const topic = matchTopic(text);

    if (topic === 'greeting') {
      await botReply(`Hey there! 👋 I'm <b>SafeBot</b>, your assistant for Safe Return.<br>I can help you with:<br><br>
        📖 How to use the app<br>🚨 Reporting missing persons<br>🤖 Face recognition<br>📞 Helpline numbers<br>⭐ Feedback & complaints<br><br>
        Just type your question or tap a button below! 😊`);
      return;
    }
    if (topic === 'howAreYou') {
      await botReply(`I'm doing great, thank you for asking! 😊 I'm always ready to help reunite families. How can I assist you today?`);
      return;
    }
    if (topic === 'thanks') {
      await botReply(`You're welcome! 😊 Happy to help. If you have any more questions, I'm always here. Together, we'll bring families back home. ❤️`);
      return;
    }
    if (topic === 'bye') {
      await botReply(`Goodbye! 👋 Take care, and don't hesitate to come back if you need help. Safe Return is always here for you. ❤️`);
      return;
    }
    if (topic) {
      await handleTopic(topic, text);
      return;
    }

    // Fallback
    await botReply(`I'm not sure I understood that. 🤔 Here are some things I can help with — just tap a button below, or try rephrasing your question!`);
  }

  // ── Toggle Open/Close ─────────────────────────────────────────────
  function openChat() {
    isOpen = true;
    win.classList.add('open');
    bubble.classList.add('open');
    showBadge(0);
    unreadCount = 0;
    if (msgCount === 0) sendWelcome();
    setTimeout(() => input.focus(), 300);
  }

  function closeChat() {
    isOpen = false;
    isMinimized = false;
    win.classList.remove('open', 'minimized');
    bubble.classList.remove('open');
  }

  function toggleMinimize() {
    isMinimized = !isMinimized;
    win.classList.toggle('minimized', isMinimized);
    minBtn.textContent = isMinimized ? '□' : '─';
  }

  async function sendWelcome() {
    await botReply(`👋 Hi! I'm <b>SafeBot</b> — your 24/7 assistant for <b>Safe Return</b>.<br><br>
      I can help you:<br>
      • 📖 Learn how to use the app<br>
      • 🚨 Report a missing person<br>
      • 🤖 Understand AI face recognition<br>
      • 📞 Get helpline numbers<br>
      • ⭐ Submit feedback or complaints<br><br>
      <b>What would you like to do today?</b>`, 400);
    renderQuickReplies();
  }

  // ── Events ────────────────────────────────────────────────────────
  bubble.addEventListener('click', () => isOpen ? closeChat() : openChat());
  closeBtn.addEventListener('click', e => { e.stopPropagation(); closeChat(); });
  minBtn.addEventListener('click', e => { e.stopPropagation(); toggleMinimize(); });
  header.addEventListener('click', () => { if (isMinimized) toggleMinimize(); });

  sendBtn.addEventListener('click', handleInput);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') handleInput(); });

  // Auto-open with badge after 4s if user hasn't opened it
  setTimeout(() => {
    if (!isOpen) {
      unreadCount = 1;
      showBadge(unreadCount);
    }
  }, 4000);

})();
}); // end DOMContentLoaded