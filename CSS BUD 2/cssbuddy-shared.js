/* ============================================================
   CSS BUDDY — Shared Auth & State Manager v3
   ✦ Persistent login (never logs out on refresh)
   ✦ Email + simulated Google login
   ✦ Full custom color picker — presets + free hex input
   ✦ Persistent color theme across all pages
   ✦ Auto Home button on every non-home page
   ============================================================ */
(function (global) {
  'use strict';

  const STORAGE_KEY = 'cssbuddy_session';
  const USERS_KEY   = 'cssbuddy_users';
  const COLOR_KEY   = 'cssbuddy_colors_v3';

  /* ── Tiny helpers ─────────────────────────────────────── */
  function getUsers()     { try { return JSON.parse(localStorage.getItem(USERS_KEY)||'{}'); } catch { return {}; } }
  function saveUsers(u)   { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  function getSession()   { try { return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); } catch { return null; } }
  function saveSession(s) { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  function clearSession() { localStorage.removeItem(STORAGE_KEY); }
  function makeId()       { return '_'+Math.random().toString(36).slice(2,10); }
  function hashPass(p)    { let h=0;for(let i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h|=0;}return 'h'+Math.abs(h).toString(36); }
  function defaultData()  {
    return { progress:{coc1:0,coc2:0,coc3:0,coc4:0}, quizScores:[], bookmarks:[], flashcardsDone:0, lastLogin:Date.now(), achievements:[] };
  }

  /* ── Color System ─────────────────────────────────────── */
  const DEFAULT_COLORS = {
    primary:'#3B82F6', primaryDark:'#1D4ED8',
    navy:'#0b3d8d',    navyLight:'#1e3a6e',
    bg:'#E8EDF5'
  };

  const PRESETS = [
    { name:'Ocean Blue',  primary:'#3B82F6', primaryDark:'#1D4ED8', navy:'#0b3d8d', navyLight:'#1e3a6e', bg:'#E8EDF5' },
    { name:'Teal Wave',   primary:'#14B8A6', primaryDark:'#0D9488', navy:'#0b4a45', navyLight:'#134e4a', bg:'#E6F4F4' },
    { name:'Emerald',     primary:'#22C55E', primaryDark:'#16A34A', navy:'#064e3b', navyLight:'#065f46', bg:'#ECFDF5' },
    { name:'Violet',      primary:'#8B5CF6', primaryDark:'#7C3AED', navy:'#1e1b4b', navyLight:'#312e81', bg:'#EDE9FE' },
    { name:'Rose Red',    primary:'#F43F5E', primaryDark:'#E11D48', navy:'#881337', navyLight:'#9f1239', bg:'#FFF1F2' },
    { name:'Amber Gold',  primary:'#F59E0B', primaryDark:'#D97706', navy:'#0b3d8d', navyLight:'#1e3a6e', bg:'#FFFBEB' },
    { name:'Indigo',      primary:'#6366F1', primaryDark:'#4F46E5', navy:'#1e1b4b', navyLight:'#312e81', bg:'#EEF2FF' },
    { name:'Cyan',        primary:'#06B6D4', primaryDark:'#0891B2', navy:'#0b3d8d', navyLight:'#164e63', bg:'#ECFEFF' },
    { name:'Hot Pink',    primary:'#EC4899', primaryDark:'#DB2777', navy:'#831843', navyLight:'#9d174d', bg:'#FDF2F8' },
    { name:'Orange',      primary:'#F97316', primaryDark:'#EA580C', navy:'#431407', navyLight:'#7c2d12', bg:'#FFF7ED' },
    { name:'Dark Slate',  primary:'#94A3B8', primaryDark:'#64748B', navy:'#0f172a', navyLight:'#1e293b', bg:'#F1F5F9' },
    { name:'Lime Green',  primary:'#84CC16', primaryDark:'#65A30D', navy:'#1a2e05', navyLight:'#365314', bg:'#F7FEE7' },
  ];

  function getSavedColors() { try { return JSON.parse(localStorage.getItem(COLOR_KEY)||'null'); } catch { return null; } }
  function persistColors(c) { localStorage.setItem(COLOR_KEY, JSON.stringify(c)); }

  function applyColors(c) {
    const r = document.documentElement.style;
    r.setProperty('--primary',      c.primary);
    r.setProperty('--primary-dark', c.primaryDark);
    r.setProperty('--navy',         c.navy);
    r.setProperty('--navy-light',   c.navyLight);
    r.setProperty('--bg',           c.bg);
    document.body && (document.body.style.background = c.bg);
  }

  // Apply before first paint
  (function earlyApply() {
    const s = getSavedColors();
    if (s) {
      try {
        const r = document.documentElement.style;
        r.setProperty('--primary', s.primary);
        r.setProperty('--primary-dark', s.primaryDark);
        r.setProperty('--navy', s.navy);
        r.setProperty('--navy-light', s.navyLight);
        r.setProperty('--bg', s.bg);
      } catch(e){}
    }
  })();

  /* ── Auth ─────────────────────────────────────────────── */
  const Auth = {
    register(name, email, password) {
      const users = getUsers(), key = email.toLowerCase().trim();
      if (users[key]) return { ok:false, msg:'An account with this email already exists.' };
      const id = makeId();
      users[key] = { id, name:name.trim(), email:key, pass:hashPass(password), data:defaultData(), provider:'email' };
      saveUsers(users);
      return { ok:true, user:users[key] };
    },
    login(email, password) {
      const users = getUsers(), key = email.toLowerCase().trim(), u = users[key];
      if (!u || u.provider==='google') return { ok:false, msg:'Invalid email or password.' };
      if (u.pass !== hashPass(password)) return { ok:false, msg:'Incorrect password.' };
      u.data.lastLogin = Date.now(); saveUsers(users); saveSession({ email:key, id:u.id });
      return { ok:true, user:u };
    },
    googleLogin(profile) {
      const users = getUsers(), key = profile.email.toLowerCase().trim();
      if (!users[key]) {
        users[key] = { id:makeId(), name:profile.name, email:key, picture:null, data:defaultData(), provider:'google' };
      } else { users[key].name = profile.name; }
      users[key].data.lastLogin = Date.now();
      saveUsers(users); saveSession({ email:key, id:users[key].id });
      return { ok:true, user:users[key] };
    },
    logout() { clearSession(); },
    currentUser() { const s=getSession(); if(!s) return null; return getUsers()[s.email]||null; },
    updateData(fn) {
      const s=getSession(); if(!s) return;
      const users=getUsers(), u=users[s.email]; if(!u) return;
      fn(u.data); saveUsers(users);
    },
    getData() { const u=this.currentUser(); return u?u.data:null; }
  };

  /* ── Inject modal + picker HTML (once) ───────────────── */
  function injectUI() {
    if (document.getElementById('cb-ui-root')) return;
    const root = document.createElement('div');
    root.id = 'cb-ui-root';
    root.innerHTML = `
<style>
#cb-ui-root * { box-sizing:border-box; font-family:'Outfit',sans-serif; }

/* overlays */
.cb-ov { display:none;position:fixed;inset:0;background:rgba(5,15,40,0.78);backdrop-filter:blur(8px);z-index:9999;align-items:center;justify-content:center; }
.cb-ov.open { display:flex;animation:cbFI 0.2s ease; }
@keyframes cbFI{from{opacity:0}to{opacity:1}}
.cb-box { background:#fff;border-radius:22px;padding:36px 30px 28px;width:450px;max-width:94vw;max-height:90vh;overflow-y:auto;box-shadow:0 28px 70px rgba(0,0,0,0.32);position:relative;animation:cbSU 0.34s cubic-bezier(0.175,0.885,0.32,1.275); }
@keyframes cbSU{from{transform:translateY(26px) scale(0.93);opacity:0}to{transform:none;opacity:1}}
.cb-x { position:absolute;top:13px;right:13px;background:none;border:none;font-size:1.35rem;cursor:pointer;color:#94A3B8;padding:4px; }
.cb-x:hover{color:#1E293B;}

/* auth form */
.cb-logo { text-align:center;font-size:1.75rem;font-weight:800;color:var(--navy,#0b3d8d);margin-bottom:4px; }
.cb-logo span { color:var(--primary,#3B82F6); }
.cb-sub  { text-align:center;color:#64748B;font-size:0.86rem;margin-bottom:18px; }
.cb-tabs { display:flex;border-radius:11px;background:#F1F5F9;padding:4px;margin-bottom:18px;gap:4px; }
.cb-tab  { flex:1;padding:8px;border:none;border-radius:8px;font-family:'Outfit',sans-serif;font-weight:600;font-size:0.86rem;cursor:pointer;background:none;color:#64748B;transition:all 0.2s; }
.cb-tab.on { background:#fff;color:var(--navy,#0b3d8d);box-shadow:0 2px 8px rgba(0,0,0,0.09); }
.cb-form { display:flex;flex-direction:column;gap:11px; }
.cb-fld  { display:flex;flex-direction:column;gap:4px; }
.cb-fld label { font-size:0.78rem;font-weight:600;color:#475569; }
.cb-fld input { padding:10px 12px;border:2px solid #E2E8F0;border-radius:9px;font-family:'Outfit',sans-serif;font-size:0.91rem;color:#1E293B;outline:none;transition:border-color 0.2s; }
.cb-fld input:focus { border-color:var(--primary,#3B82F6); }
.cb-err { color:#EF4444;font-size:0.78rem;min-height:14px;font-weight:500; }
.cb-bp  { padding:11px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:10px;font-family:'Outfit',sans-serif;font-size:0.93rem;font-weight:700;cursor:pointer;transition:all 0.2s; }
.cb-bp:hover { opacity:0.86;transform:translateY(-1px); }
.cb-div { display:flex;align-items:center;gap:9px;margin:3px 0; }
.cb-div::before,.cb-div::after { content:'';flex:1;height:1px;background:#E2E8F0; }
.cb-div span { font-size:0.75rem;color:#94A3B8;font-weight:500; }
.cb-gb  { display:flex;align-items:center;justify-content:center;gap:9px;padding:10px;border:2px solid #E2E8F0;border-radius:10px;background:#fff;cursor:pointer;font-family:'Outfit',sans-serif;font-weight:600;font-size:0.88rem;color:#1E293B;transition:all 0.2s; }
.cb-gb:hover { border-color:var(--primary,#3B82F6);background:#F8FAFC; }

/* toast */
#cb-toasts { position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:7px; }
.cb-t { display:flex;align-items:center;gap:9px;padding:10px 15px;border-radius:11px;min-width:230px;max-width:320px;font-weight:600;font-size:0.86rem;box-shadow:0 6px 24px rgba(0,0,0,0.16);color:#fff; }
@keyframes tIn  {from{transform:translateX(108%) scale(0.84);opacity:0}to{transform:none;opacity:1}}
@keyframes tOut {from{transform:none;opacity:1}to{transform:translateX(108%) scale(0.84);opacity:0}}
.cb-t.ok  { background:linear-gradient(135deg,#22C55E,#16A34A);animation:tIn .3s ease; }
.cb-t.err { background:linear-gradient(135deg,#EF4444,#DC2626);animation:tIn .3s ease; }
.cb-t.inf { background:linear-gradient(135deg,#3B82F6,#1D4ED8);animation:tIn .3s ease; }

/* nav elements */
.cb-login-btn { padding:7px 14px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:9px;font-family:'Outfit',sans-serif;font-weight:600;font-size:0.83rem;cursor:pointer;transition:opacity 0.2s; }
.cb-login-btn:hover { opacity:0.84; }
.cb-reg-btn { padding:7px 14px;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.22);color:#fff;border-radius:9px;font-family:'Outfit',sans-serif;font-weight:600;font-size:0.83rem;cursor:pointer;transition:background 0.2s; }
.cb-reg-btn:hover { background:rgba(255,255,255,0.24); }
.cb-home-btn { display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.2);border-radius:9px;color:#fff;font-family:'Outfit',sans-serif;font-weight:600;font-size:0.82rem;text-decoration:none;cursor:pointer;transition:background 0.2s;white-space:nowrap; }
.cb-home-btn:hover { background:rgba(255,255,255,0.24); }
.cb-bubble { display:flex;align-items:center;gap:7px;background:rgba(255,255,255,0.12);border-radius:28px;padding:4px 11px 4px 5px;cursor:pointer;position:relative; }
.cb-avatar { width:28px;height:28px;border-radius:50%;background:var(--primary,#3B82F6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:0.78rem;overflow:hidden;flex-shrink:0; }
.cb-avatar img { width:100%;height:100%;object-fit:cover; }
.cb-uname { color:#fff;font-weight:600;font-size:0.83rem;max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis; }
.cb-dd { display:none;position:absolute;top:calc(100% + 7px);right:0;background:#fff;border-radius:13px;padding:7px;min-width:168px;box-shadow:0 10px 36px rgba(0,0,0,0.16);z-index:200; }
.cb-bubble:hover .cb-dd { display:block; }
.cb-ddi { display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:8px;font-size:0.84rem;font-weight:600;color:#1E293B;cursor:pointer;transition:background 0.14s; }
.cb-ddi:hover { background:#F1F5F9; }
.cb-ddi.red { color:#EF4444; }
.cb-sep { height:1px;background:#E2E8F0;margin:3px 0; }

/* ═══════════════════════════════
   COLOR PICKER PANEL
═══════════════════════════════ */
.cpanel { background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 4px 18px rgba(0,0,0,0.08); }
.cpanel-head { font-weight:800;font-size:0.93rem;color:var(--navy,#0b3d8d);margin-bottom:13px; }
.cp-section-lbl { font-size:0.7rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px; }

/* Preset grid — 4 cols */
.cp-presets { display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px; }
.cp-dot-wrap { display:flex;flex-direction:column;align-items:center;gap:3px; }
.cp-dot { width:36px;height:36px;border-radius:10px;cursor:pointer;border:3px solid transparent;transition:all 0.18s;position:relative; }
.cp-dot:hover { transform:scale(1.1);box-shadow:0 4px 12px rgba(0,0,0,0.18); }
.cp-dot.on { border-color:#fff;box-shadow:0 0 0 3px var(--primary,#3B82F6); }
.cp-dot.on::after { content:'✓';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:1rem;text-shadow:0 1px 3px rgba(0,0,0,0.45); }
.cp-lbl { font-size:0.6rem;color:#64748B;font-weight:600;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:44px; }

/* Custom rows */
.cp-divider { border:none;border-top:1px solid #E2E8F0;margin:12px 0 10px; }
.cp-rows { display:flex;flex-direction:column;gap:8px; }
.cp-row { display:flex;align-items:center;gap:8px; }
.cp-row label { font-size:0.75rem;font-weight:600;color:#64748B;flex:1;min-width:0; }
.cp-row input[type=color] { width:36px;height:30px;border:2px solid #E2E8F0;border-radius:7px;cursor:pointer;padding:2px;background:#fff;flex-shrink:0; }
.cp-row input[type=text]  { width:76px;padding:4px 7px;border:2px solid #E2E8F0;border-radius:7px;font-family:'JetBrains Mono',monospace;font-size:0.74rem;color:#1E293B;outline:none;flex-shrink:0; }
.cp-row input[type=text]:focus { border-color:var(--primary,#3B82F6); }

.cp-apply { width:100%;margin-top:11px;padding:9px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:10px;font-family:'Outfit',sans-serif;font-weight:700;font-size:0.85rem;cursor:pointer;transition:opacity 0.2s; }
.cp-apply:hover { opacity:0.86; }
.cp-reset { width:100%;margin-top:5px;padding:7px;background:#F1F5F9;color:#475569;border:none;border-radius:10px;font-family:'Outfit',sans-serif;font-weight:600;font-size:0.8rem;cursor:pointer;transition:background 0.2s; }
.cp-reset:hover { background:#E2E8F0; }

/* live preview strip */
.cp-preview { display:flex;gap:6px;margin-top:10px;border-radius:9px;overflow:hidden;height:22px; }
.cp-prev-swatch { flex:1;transition:background 0.2s; }
</style>

<!-- Auth modal -->
<div class="cb-ov" id="cb-auth-ov">
  <div class="cb-box">
    <button class="cb-x" onclick="CSS_BUDDY.closeModal()">✕</button>
    <div class="cb-logo"><span>CSS</span> Buddy</div>
    <div class="cb-sub">Your path to CSS excellence </div>
    <div class="cb-tabs">
      <button class="cb-tab on" id="cb-tl" onclick="CSS_BUDDY._switchTab('login')">Login</button>
      <button class="cb-tab"    id="cb-tr" onclick="CSS_BUDDY._switchTab('reg')">Register</button>
    </div>
    <!-- LOGIN -->
    <div id="cb-login-p">
      <div class="cb-form">
        <div class="cb-fld"><label>Email</label><input type="email" id="cb-le" placeholder="you@email.com" autocomplete="email"/></div>
        <div class="cb-fld"><label>Password</label><input type="password" id="cb-lp" placeholder="••••••••" autocomplete="current-password"/></div>
        <div class="cb-err" id="cb-lerr"></div>
        <button class="cb-bp" onclick="CSS_BUDDY._doLogin()"> Login</button>
        <div class="cb-div"><span>or</span></div>
        <button class="cb-gb" onclick="CSS_BUDDY._googleLogin()">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.5 13.5 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.3 37.6 46.5 31.5 46.5 24.5z"/><path fill="#FBBC05" d="M10.7 28.1A14.5 14.5 0 0 1 9.5 24c0-1.4.2-2.8.5-4.1l-7-5.4A23 23 0 0 0 1 24c0 3.7.9 7.2 2.5 10.3l7.2-6.2z"/><path fill="#34A853" d="M24 47c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2.1-6.3 2.1-6.2 0-11.5-4-13.3-9.5l-7.2 6.2C7 41.3 14.8 47 24 47z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
    <!-- REGISTER -->
    <div id="cb-reg-p" style="display:none">
      <div class="cb-form">
        <div class="cb-fld"><label>Full Name</label><input type="text" id="cb-rn" placeholder="Juan dela Cruz" autocomplete="name"/></div>
        <div class="cb-fld"><label>Email</label><input type="email" id="cb-re" placeholder="you@email.com" autocomplete="email"/></div>
        <div class="cb-fld"><label>Password</label><input type="password" id="cb-rp" placeholder="Min. 6 characters" autocomplete="new-password"/></div>
        <div class="cb-fld"><label>Confirm Password</label><input type="password" id="cb-rp2" placeholder="Repeat password" autocomplete="new-password"/></div>
        <div class="cb-err" id="cb-rerr"></div>
        <button class="cb-bp" onclick="CSS_BUDDY._doRegister()"> Create Account</button>
        <div class="cb-div"><span>or</span></div>
        <button class="cb-gb" onclick="CSS_BUDDY._googleLogin()">
          <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.5 13.5 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.3 37.6 46.5 31.5 46.5 24.5z"/><path fill="#FBBC05" d="M10.7 28.1A14.5 14.5 0 0 1 9.5 24c0-1.4.2-2.8.5-4.1l-7-5.4A23 23 0 0 0 1 24c0 3.7.9 7.2 2.5 10.3l7.2-6.2z"/><path fill="#34A853" d="M24 47c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2.1-6.3 2.1-6.2 0-11.5-4-13.3-9.5l-7.2 6.2C7 41.3 14.8 47 24 47z"/></svg>
          Continue with Google
        </button>
      </div>
    </div>
  </div>
</div>

<!-- Google picker -->
<div class="cb-ov" id="cb-g-ov" style="z-index:10000;">
  <div class="cb-box" style="max-width:360px;padding:26px 22px;">
    <button class="cb-x" onclick="document.getElementById('cb-g-ov').classList.remove('open')">✕</button>
    <div style="text-align:center;margin-bottom:16px;">
      <svg width="40" height="40" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.5 13.5 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.3 37.6 46.5 31.5 46.5 24.5z"/><path fill="#FBBC05" d="M10.7 28.1A14.5 14.5 0 0 1 9.5 24c0-1.4.2-2.8.5-4.1l-7-5.4A23 23 0 0 0 1 24c0 3.7.9 7.2 2.5 10.3l7.2-6.2z"/><path fill="#34A853" d="M24 47c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2.1-6.3 2.1-6.2 0-11.5-4-13.3-9.5l-7.2 6.2C7 41.3 14.8 47 24 47z"/></svg>
      <div style="font-size:1.05rem;font-weight:800;color:var(--navy,#0b3d8d);margin-top:7px;">Sign in with Google</div>
    </div>
    <div id="cb-g-acc" style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px;"></div>
    <div style="border-top:1px solid #E2E8F0;padding-top:10px;">
      <div style="font-size:0.75rem;font-weight:700;color:#475569;margin-bottom:7px;">Or use another account:</div>
      <div style="display:flex;flex-direction:column;gap:7px;">
        <input type="text"  id="cb-gn" placeholder="Full Name"      style="padding:8px 10px;border:2px solid #E2E8F0;border-radius:8px;font-family:'Outfit',sans-serif;font-size:0.86rem;outline:none;"/>
        <input type="email" id="cb-ge" placeholder="Email address"  style="padding:8px 10px;border:2px solid #E2E8F0;border-radius:8px;font-family:'Outfit',sans-serif;font-size:0.86rem;outline:none;"/>
        <div class="cb-err" id="cb-gerr"></div>
        <button onclick="CSS_BUDDY._googleSubmit()" style="padding:9px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:8px;font-family:'Outfit',sans-serif;font-weight:700;font-size:0.86rem;cursor:pointer;">Continue</button>
      </div>
    </div>
  </div>
</div>

<!-- Toasts -->
<div id="cb-toasts"></div>
`;
    document.body.appendChild(root);

    // Enter key bindings
    [['cb-le','cb-lp'],['cb-rn','cb-re','cb-rp','cb-rp2']].forEach((group, gi) => {
      group.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('keydown', e => { if(e.key==='Enter') gi===0?CSS_BUDDY._doLogin():CSS_BUDDY._doRegister(); });
      });
    });
    document.getElementById('cb-auth-ov').addEventListener('click', function(e){ if(e.target===this) CSS_BUDDY.closeModal(); });
  }

  /* ── Build Color Picker in a container el ─────────────── */
  function buildColorPanel(hostId) {
    const host = document.getElementById(hostId);
    if (!host) return;
    const cur = getSavedColors() || DEFAULT_COLORS;

    host.innerHTML = `
      <div class="cpanel" id="cpanel-inner">
        <div class="cpanel-head">🎨 Customize Colors</div>

        <div class="cp-section-lbl">Quick Presets</div>
        <div class="cp-presets" id="cp-presets-grid">
          ${PRESETS.map((p,i)=>`
            <div class="cp-dot-wrap">
              <div class="cp-dot${p.primary===cur.primary&&p.navy===cur.navy?' on':''}"
                id="cpd-${i}"
                style="background:linear-gradient(135deg,${p.primary} 0%,${p.navy} 100%)"
                title="${p.name}"
                onclick="CSS_BUDDY._applyPreset(${i})">
              </div>
              <div class="cp-lbl">${p.name}</div>
            </div>`).join('')}
        </div>

        <hr class="cp-divider"/>
        <div class="cp-section-lbl"> Custom — pick any color</div>
        <div class="cp-rows">
          <div class="cp-row">
            <label> Buttons / Accents</label>
            <input type="color" id="cpc-primary"     value="${cur.primary}">
            <input type="text"  id="cpt-primary"     value="${cur.primary}" maxlength="7">
          </div>
          <div class="cp-row">
            <label> Button Hover</label>
            <input type="color" id="cpc-primaryDark" value="${cur.primaryDark}">
            <input type="text"  id="cpt-primaryDark" value="${cur.primaryDark}" maxlength="7">
          </div>
          <div class="cp-row">
            <label> Navbar Color</label>
            <input type="color" id="cpc-navy"        value="${cur.navy}">
            <input type="text"  id="cpt-navy"        value="${cur.navy}" maxlength="7">
          </div>
          <div class="cp-row">
            <label> Navbar Hover</label>
            <input type="color" id="cpc-navyLight"   value="${cur.navyLight}">
            <input type="text"  id="cpt-navyLight"   value="${cur.navyLight}" maxlength="7">
          </div>
          <div class="cp-row">
            <label> Page Background</label>
            <input type="color" id="cpc-bg"          value="${cur.bg}">
            <input type="text"  id="cpt-bg"          value="${cur.bg}" maxlength="7">
          </div>
        </div>

        <div style="margin-top:10px;">
          <div class="cp-section-lbl">Live Preview</div>
          <div class="cp-preview">
            <div class="cp-prev-swatch" id="prev-primary"  style="background:${cur.primary}"    title="Primary"></div>
            <div class="cp-prev-swatch" id="prev-navy"     style="background:${cur.navy}"       title="Navbar"></div>
            <div class="cp-prev-swatch" id="prev-bg"       style="background:${cur.bg}"         title="BG"  ></div>
          </div>
        </div>

        <button class="cp-apply" onclick="CSS_BUDDY._applyCustom()"> Apply My Colors</button>
        <button class="cp-reset" onclick="CSS_BUDDY._resetColors()">↺ Reset to Default</button>
      </div>`;

    // Wire color pickers ↔ text inputs with live preview
    const fields = ['primary','primaryDark','navy','navyLight','bg'];
    fields.forEach(k => {
      const picker = document.getElementById(`cpc-${k}`);
      const text   = document.getElementById(`cpt-${k}`);
      if (!picker || !text) return;
      const update = () => {
        text.value = picker.value;
        _livePreview();
      };
      picker.addEventListener('input', update);
      text.addEventListener('input', () => {
        if (/^#[0-9a-fA-F]{6}$/.test(text.value)) { picker.value = text.value; _livePreview(); }
      });
    });
  }

  function _livePreview() {
    const get = k => document.getElementById(`cpc-${k}`)?.value || '';
    const p = document.getElementById('prev-primary');
    const n = document.getElementById('prev-navy');
    const b = document.getElementById('prev-bg');
    if (p) p.style.background = get('primary');
    if (n) n.style.background = get('navy');
    if (b) b.style.background = get('bg');
  }

  function _markPreset(colors) {
    PRESETS.forEach((p,i) => {
      const d = document.getElementById(`cpd-${i}`);
      if (d) d.classList.toggle('on', p.primary===colors.primary && p.navy===colors.navy);
    });
  }

  /* ── Public API ───────────────────────────────────────── */
  const CSS_BUDDY = {

    isLoggedIn() { return !!Auth.currentUser(); },

    /* Auth */
    openModal(tab) { injectUI(); document.getElementById('cb-auth-ov').classList.add('open'); this._switchTab(tab||'login'); },
    closeModal()   { const o=document.getElementById('cb-auth-ov'); if(o) o.classList.remove('open'); },
    _switchTab(tab) {
      document.getElementById('cb-login-p').style.display = tab==='login' ? '' : 'none';
      document.getElementById('cb-reg-p').style.display   = tab==='reg'   ? '' : 'none';
      document.getElementById('cb-tl').classList.toggle('on', tab==='login');
      document.getElementById('cb-tr').classList.toggle('on', tab==='reg');
      document.getElementById('cb-lerr').textContent = '';
      document.getElementById('cb-rerr').textContent = '';
    },
    _doLogin() {
      const email=document.getElementById('cb-le').value.trim(), pass=document.getElementById('cb-lp').value;
      const err=document.getElementById('cb-lerr'); err.textContent='';
      if (!email||!pass) { err.textContent='Please fill in all fields.'; return; }
      const res=Auth.login(email,pass);
      if (!res.ok) { err.textContent=res.msg; return; }
      this.closeModal(); this._onSuccess(res.user);
    },
    _doRegister() {
      const name=document.getElementById('cb-rn').value.trim(), email=document.getElementById('cb-re').value.trim();
      const pass=document.getElementById('cb-rp').value, pass2=document.getElementById('cb-rp2').value;
      const err=document.getElementById('cb-rerr'); err.textContent='';
      if (!name||!email||!pass||!pass2) { err.textContent='Please fill in all fields.'; return; }
      if (pass.length<6)  { err.textContent='Password must be at least 6 characters.'; return; }
      if (pass!==pass2)   { err.textContent='Passwords do not match.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent='Enter a valid email.'; return; }
      const res=Auth.register(name,email,pass);
      if (!res.ok) { err.textContent=res.msg; return; }
      Auth.login(email,pass); this.closeModal(); this._onSuccess(res.user,true);
    },
    _googleLogin() {
      injectUI();
      const acc=document.getElementById('cb-g-acc');
      acc.innerHTML = Object.values(getUsers()).filter(u=>u.provider==='google').map(u=>`
        <div onclick="CSS_BUDDY._googleQL('${u.email}')" style="display:flex;align-items:center;gap:9px;padding:8px 10px;border:2px solid #E2E8F0;border-radius:9px;cursor:pointer;transition:all 0.18s;" onmouseover="this.style.borderColor='var(--primary,#3B82F6)'" onmouseout="this.style.borderColor='#E2E8F0'">
          <div style="width:32px;height:32px;border-radius:50%;background:var(--primary,#3B82F6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:0.9rem;flex-shrink:0">${u.name.charAt(0).toUpperCase()}</div>
          <div><div style="font-weight:700;font-size:0.86rem;color:#1E293B">${u.name}</div><div style="font-size:0.72rem;color:#64748B">${u.email}</div></div>
        </div>`).join('');
      document.getElementById('cb-gn').value=''; document.getElementById('cb-ge').value='';
      document.getElementById('cb-gerr').textContent='';
      document.getElementById('cb-g-ov').classList.add('open');
    },
    _googleQL(email) {
      const u=getUsers()[email]; if(!u) return;
      saveSession({email,id:u.id});
      document.getElementById('cb-g-ov').classList.remove('open'); this.closeModal(); this._onSuccess(u);
    },
    _googleSubmit() {
      const name=document.getElementById('cb-gn').value.trim(), email=document.getElementById('cb-ge').value.trim();
      const err=document.getElementById('cb-gerr'); err.textContent='';
      if (!name||!email) { err.textContent='Name and email required.'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { err.textContent='Enter a valid email.'; return; }
      const res=Auth.googleLogin({name,email,picture:null});
      document.getElementById('cb-g-ov').classList.remove('open'); this.closeModal(); this._onSuccess(res.user);
    },
    _onSuccess(user,isNew) {
      this._renderNav(user); this._guestMode(false);
      if (typeof window.onCBLogin==='function') window.onCBLogin(user, user.data);
      this._toast('ok', isNew?` Welcome, ${user.name.split(' ')[0]}! Account created!`:` Welcome back, ${user.name.split(' ')[0]}!`);
    },
    logout() {
      Auth.logout(); this._renderNav(null); this._guestMode(true);
      if (typeof window.onCBLogout==='function') window.onCBLogout();
      this._toast('inf',' Logged out successfully.');
    },

    /* Data helpers */
    saveProgress(t,p)          { Auth.updateData(d=>{d.progress[t]=p;}); },
    getProgress(t)             { const d=Auth.getData(); return d?(d.progress[t]||0):0; },
    saveQuizScore(t,s,tot)     { Auth.updateData(d=>{ if(!d.quizScores) d.quizScores=[]; d.quizScores.unshift({topic:t,score:s,total:tot,pct:Math.round(s/tot*100),date:Date.now()}); if(d.quizScores.length>50) d.quizScores=d.quizScores.slice(0,50); }); },
    getQuizScores()            { const d=Auth.getData(); return d?(d.quizScores||[]): []; },
    addBookmark(text)          { const id=makeId(); Auth.updateData(d=>{if(!d.bookmarks)d.bookmarks=[];d.bookmarks.push({id,text,date:Date.now()});}); return id; },
    removeBookmark(id)         { Auth.updateData(d=>{d.bookmarks=(d.bookmarks||[]).filter(b=>b.id!==id);}); },
    getBookmarks()             { const d=Auth.getData(); return d?(d.bookmarks||[]): []; },
    incrementFlashcards()      { Auth.updateData(d=>{d.flashcardsDone=(d.flashcardsDone||0)+1;}); },
    getFlashcardsDone()        { const d=Auth.getData(); return d?(d.flashcardsDone||0):0; },
    getAllData()                { return Auth.getData(); },
    currentUser()              { return Auth.currentUser(); },

    /* Toast */
    _toast(type, msg) {
      injectUI();
      const c=document.getElementById('cb-toasts'), t=document.createElement('div');
      t.className=`cb-t ${type}`;
      const ico={ok:'',err:'',inf:'ℹ️'};
      t.innerHTML=`<span style="font-size:1rem;flex-shrink:0">${ico[type]||''}</span><span>${msg}</span>`;
      c.appendChild(t);
      setTimeout(()=>{ t.style.animation='tOut .3s ease forwards'; setTimeout(()=>t.remove(),300); },3400);
    },

    /* Color picker */
    _applyPreset(idx) {
      const p=PRESETS[idx]; if(!p) return;
      applyColors(p); persistColors(p); _markPreset(p);
      // Sync inputs
      ['primary','primaryDark','navy','navyLight','bg'].forEach(k=>{
        const pc=document.getElementById(`cpc-${k}`), tx=document.getElementById(`cpt-${k}`);
        if(pc) pc.value=p[k]; if(tx) tx.value=p[k];
      });
      _livePreview();
      this._toast('ok',`🎨 "${p.name}" theme applied!`);
    },
    _applyCustom() {
      const get = k => document.getElementById(`cpc-${k}`)?.value||'';
      const c = { primary:get('primary'), primaryDark:get('primaryDark'), navy:get('navy'), navyLight:get('navyLight'), bg:get('bg') };
      if (!Object.values(c).every(v=>/^#[0-9a-fA-F]{6}$/.test(v))) {
        this._toast('err',' Invalid color. Use 6-digit hex e.g. #3B82F6'); return;
      }
      applyColors(c); persistColors(c); _markPreset(c);
      this._toast('ok','🎨 Custom colors applied!');
    },
    _resetColors() {
      applyColors(DEFAULT_COLORS); persistColors(DEFAULT_COLORS);
      // Rebuild panel
      const host = document.querySelector('[id$="-color-panel"]') || document.getElementById('cb-color-panel-host');
      if (host) buildColorPanel(host.id);
      _markPreset(DEFAULT_COLORS);
      this._toast('inf','↺ Colors reset to default.');
    },

    /* Build panel into a container */
    buildColorPanel(id) { buildColorPanel(id); },
    /* Legacy alias */
    buildThemePanel(id) { buildColorPanel(id); },
    /* Old setTheme compat — ignore */
    setTheme() {},

    /* Nav */
    _renderNav(user) {
      const nr = document.querySelector('.nav-right'); if(!nr) return;
      const path = window.location.pathname;
      const isHome = /index\.html$/.test(path) || /\/$/.test(path) || path === '';
      const homeBtn = isHome ? '' : `<a href="index.html" class="cb-home-btn">🏠 Home</a>`;

      if (!user) {
        nr.innerHTML = `${homeBtn}
          <button class="cb-login-btn" onclick="CSS_BUDDY.openModal('login')"> Login</button>
          <button class="cb-reg-btn"   onclick="CSS_BUDDY.openModal('reg')"> Register</button>`;
        return;
      }
      const ini = user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2);
      nr.innerHTML = `${homeBtn}
        <div class="cb-bubble">
          <div class="cb-avatar">${ini}</div>
          <span class="cb-uname">${user.name.split(' ')[0]}</span>
          <span style="color:#94A3B8;font-size:0.72rem">▾</span>
          <div class="cb-dd">
            <div style="padding:7px 11px 9px;border-bottom:1px solid #E2E8F0;margin-bottom:3px;">
              <div style="font-weight:700;font-size:0.86rem;color:#1E293B">${user.name}</div>
              <div style="font-size:0.72rem;color:#64748B;margin-top:1px">${user.email}</div>
            </div>
            <div class="cb-ddi" onclick="location.href='profile.html'"> My Profile</div>
            <div class="cb-ddi" onclick="location.href='quiz.html'"> My Scores</div>
            <div class="cb-sep"></div>
            <div class="cb-ddi red" onclick="CSS_BUDDY.logout()"> Logout</div>
          </div>
        </div>`;
    },
    _guestMode(g) { document.body.classList.toggle('guest-mode', g); },

    init() {
      injectUI();
      const saved = getSavedColors();
      if (saved) { applyColors(saved); document.body.style.background = saved.bg; }
      const user = Auth.currentUser();
      if (user) { this._renderNav(user); this._guestMode(false); if(typeof window.onCBLogin==='function') window.onCBLogin(user,user.data); }
      else       { this._renderNav(null); this._guestMode(true); }
      this._injectFloatingPalette();
    },

    _injectFloatingPalette() {
      if (document.getElementById('cb-float-palette')) return;
      // Only inject if the page doesn't already have a dedicated color panel host
      const hasPanel = document.getElementById('cb-color-panel-host');

      const wrap = document.createElement('div');
      wrap.id = 'cb-float-palette';
      wrap.innerHTML = `
<style>
#cb-float-palette { position:fixed; bottom:24px; left:24px; z-index:8888; }
#cb-pal-btn {
  width:48px; height:48px; border-radius:50%;
  background:var(--primary,#3B82F6);
  border:none; cursor:pointer; font-size:1.3rem;
  box-shadow:0 4px 18px rgba(0,0,0,0.22);
  display:flex; align-items:center; justify-content:center;
  transition:transform 0.2s, box-shadow 0.2s;
}
#cb-pal-btn:hover { transform:scale(1.1); box-shadow:0 8px 24px rgba(0,0,0,0.28); }
#cb-pal-drawer {
  display:none; position:absolute; bottom:58px; left:0;
  width:260px; background:#fff; border-radius:18px;
  box-shadow:0 12px 48px rgba(0,0,0,0.18);
  animation:drawerPop 0.28s cubic-bezier(0.175,0.885,0.32,1.275);
}
#cb-pal-drawer.open { display:block; }
@keyframes drawerPop { from{opacity:0;transform:scale(0.88) translateY(12px)} to{opacity:1;transform:none} }
</style>
<button id="cb-pal-btn" title="Customize Colors" onclick="CSS_BUDDY._togglePalette()">🎨</button>
<div id="cb-pal-drawer">
  <div id="cb-pal-inner" style="padding:16px;"></div>
</div>`;
      document.body.appendChild(wrap);

      // Close on outside click
      document.addEventListener('click', function(e) {
        const drawer = document.getElementById('cb-pal-drawer');
        const btn    = document.getElementById('cb-pal-btn');
        if (drawer && !drawer.contains(e.target) && e.target !== btn) {
          drawer.classList.remove('open');
        }
      });
    },

    _togglePalette() {
      const drawer = document.getElementById('cb-pal-drawer');
      if (!drawer) return;
      const isOpen = drawer.classList.toggle('open');
      if (isOpen) {
        // Build or rebuild the picker inside drawer
        const inner = document.getElementById('cb-pal-inner');
        const hostId = 'cb-pal-inner';
        buildColorPanel(hostId);
      }
    }
  };

  global.CSS_BUDDY = CSS_BUDDY;

  if (document.readyState==='loading') { document.addEventListener('DOMContentLoaded',()=>CSS_BUDDY.init()); }
  else { CSS_BUDDY.init(); }

})(window);