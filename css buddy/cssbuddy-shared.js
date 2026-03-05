/* ============================================================
   CSS BUDDY — Shared Auth & State Manager v5
   ✦ Email / Password login (works without any setup)
   ✦ REAL Google Sign-In via Google Identity Services
   ✦ Full color theme picker — presets + custom hex
   ✦ Persistent login & data across all pages

   ══ HOW TO ENABLE GOOGLE LOGIN (only 3 steps!) ════════
   STEP 1: Go to https://console.cloud.google.com
   STEP 2: New Project → APIs & Services → Credentials
           → + CREATE CREDENTIALS → OAuth 2.0 Client ID
           → Application type: Web application
           → Add under "Authorized JavaScript origins":
               http://localhost  (for testing on your PC)
               https://yourdomain.com  (if hosted online)
           → Click CREATE → Copy the Client ID
   STEP 3: Paste your Client ID below (replace YOUR_CLIENT_ID...)
   ══════════════════════════════════════════════════════ */
  /*
 * Create form to request access token from Google's OAuth 2.0 server.
 */
 async function handleLogin() {
    account.createOAuth2Session (
       'google',
       'https://group2-matiyaga.netlify.app/',
       'https://group2-matiyaga.netlify.app/fail'
    )
 }



function oauthSignIn() {
  // Google's OAuth 2.0 endpoint for requesting an access token
  var oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';

  // Create <form> element to submit parameters to OAuth 2.0 endpoint.
  var form = document.createElement('form');
  form.setAttribute('method', 'GET'); // Send as a GET request.
  form.setAttribute('action', oauth2Endpoint);

  // Parameters to pass to OAuth 2.0 endpoint.
  var params = {'client_id': '732747904577-mehjk086g8jdedcs80518pu86eeirdk9.apps.googleusercontent.com',
                'redirect_uri': 'YOUR_REDIRECT_URI',
                'response_type': 'token',
                'scope': 'https://www.googleapis.com/auth/drive.metadata.readonly https://www.googleapis.com/auth/calendar.readonly',
                'include_granted_scopes': 'true',
                'state': 'pass-through value'};

  // Add form parameters as hidden input values.
  for (var p in params) {
    var input = document.createElement('input');
    input.setAttribute('type', 'hidden');
    input.setAttribute('name', p);
    input.setAttribute('value', params[p]);
    form.appendChild(input);
  }

  // Add form to page and submit it to open the OAuth 2.0 endpoint.
  document.body.appendChild(form);
  form.submit();
}

(function (global) {
  'use strict';
var GOOGLE_CLIENT_ID = '732747904577-mehjk086g8jdedcs80518pu86eeirdk9.apps.googleusercontent.com';
  /* ═══════════════════════════════════════════════════════
     🔑  PASTE YOUR GOOGLE CLIENT ID HERE  (line below)
         It looks like:  1234567890-abcdef.apps.googleusercontent.com
  ═══════════════════════════════════════════════════════ */
var GOOGLE_CLIENT_ID = '732747904577-mehjk086g8jdedcs80518pu86eeirdk9.apps.googleusercontent.com';
  /* ════════════════════════════════════════════════════ */

  var STORAGE_KEY = 'cssbuddy_session';
  var USERS_KEY   = 'cssbuddy_users';
  var COLOR_KEY   = 'cssbuddy_colors_v3';

  /* ─── Helpers ─────────────────────────────────────── */
  function getUsers()    { try{return JSON.parse(localStorage.getItem(USERS_KEY)||'{}');}catch(e){return{};} }
  function saveUsers(u)  { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
  function getSession()  { try{return JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');}catch(e){return null;} }
  function saveSession(s){ localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); }
  function clearSession(){ localStorage.removeItem(STORAGE_KEY); }
  function makeId()      { return '_'+Math.random().toString(36).slice(2,10); }
  function hashPass(p)   { var h=0;for(var i=0;i<p.length;i++){h=((h<<5)-h)+p.charCodeAt(i);h|=0;}return 'h'+Math.abs(h).toString(36); }
  function defaultData() {
    return {
      progress:{coc1:0,coc2:0,coc3:0,coc4:0},
      quizScores:[],gameScores:{},bookmarks:[],
      flashcardsDone:0,achievements:[],
      createdAt:Date.now(),lastLogin:Date.now()
    };
  }

  /* ─── Decode Google JWT to get profile info ─────── */
  function decodeJWT(token) {
    try {
      var b = token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/');
      while(b.length%4) b+='=';
      return JSON.parse(atob(b));
    } catch(e){ return null; }
  }

  /* ─── Lazy-load Google Identity Services ────────── */
  var _gisReady=false, _gisCbs=[];
  function loadGIS(cb) {
    if(_gisReady && window.google && google.accounts){cb(null);return;}
    _gisCbs.push(cb);
    if(document.getElementById('_gis_scr')) return;
    var s=document.createElement('script');
    s.id='_gis_scr';
    s.src='https://accounts.google.com/gsi/client';
    s.async=true; s.defer=true;
    s.onerror=function(){
      var e='Failed to load Google Sign-In (no internet?).';
      _gisCbs.forEach(function(c){c(e);}); _gisCbs=[];
    };
    s.onload=function(){
      _gisReady=true;
      _gisCbs.forEach(function(c){c(null);}); _gisCbs=[];
    };
    document.head.appendChild(s);
  }

  /* ─── Auth ───────────────────────────────────────── */
  var Auth = {
    register:function(name,email,password){
      var users=getUsers(), key=email.toLowerCase().trim();
      if(users[key]) return{ok:false,msg:'An account with this email already exists.'};
      var id=makeId();
      users[key]={id:id,name:name.trim(),email:key,pass:hashPass(password),data:defaultData(),provider:'email'};
      saveUsers(users); return{ok:true,user:users[key]};
    },
    login:function(email,password){
      var users=getUsers(), key=email.toLowerCase().trim(), u=users[key];
      if(!u||u.provider==='google') return{ok:false,msg:'Invalid email or password.'};
      if(u.pass!==hashPass(password)) return{ok:false,msg:'Incorrect password.'};
      u.data.lastLogin=Date.now(); saveUsers(users); saveSession({email:key,id:u.id});
      return{ok:true,user:u};
    },
    googleLogin:function(profile){
      var users=getUsers(), key=profile.email.toLowerCase().trim();
      if(!users[key]){
        users[key]={
          id:profile.sub||makeId(),
          name:profile.name||profile.email.split('@')[0],
          email:key, picture:profile.picture||null,
          data:defaultData(), provider:'google'
        };
      } else {
        users[key].name    = profile.name    || users[key].name;
        users[key].picture = profile.picture || users[key].picture;
        users[key].provider='google';
        if(!users[key].data)            users[key].data=defaultData();
        if(!users[key].data.gameScores) users[key].data.gameScores={};
        if(!users[key].data.bookmarks)  users[key].data.bookmarks=[];
        if(!users[key].data.quizScores) users[key].data.quizScores=[];
        if(!users[key].data.progress)   users[key].data.progress={coc1:0,coc2:0,coc3:0,coc4:0};
      }
      users[key].data.lastLogin=Date.now();
      saveUsers(users); saveSession({email:key,id:users[key].id});
      return{ok:true,user:users[key]};
    },
    logout:     function(){clearSession();},
    currentUser:function(){var s=getSession();if(!s)return null;return getUsers()[s.email]||null;},
    updateData: function(fn){
      var s=getSession();if(!s)return;
      var users=getUsers(),u=users[s.email];if(!u)return;
      if(!u.data)u.data=defaultData(); fn(u.data); saveUsers(users);
    },
    getData:function(){var u=this.currentUser();return u?u.data:null;}
  };

  /* ─── Colors ─────────────────────────────────────── */
  var DEFAULT_COLORS={primary:'#3B82F6',primaryDark:'#1D4ED8',navy:'#0b3d8d',navyLight:'#1e3a6e',bg:'#E8EDF5'};
  var PRESETS=[
    {name:'Ocean Blue', primary:'#3B82F6',primaryDark:'#1D4ED8',navy:'#0b3d8d',navyLight:'#1e3a6e',bg:'#E8EDF5'},
    {name:'Teal Wave',  primary:'#14B8A6',primaryDark:'#0D9488',navy:'#0b4a45',navyLight:'#134e4a',bg:'#E6F4F4'},
    {name:'Emerald',    primary:'#22C55E',primaryDark:'#16A34A',navy:'#064e3b',navyLight:'#065f46',bg:'#ECFDF5'},
    {name:'Violet',     primary:'#8B5CF6',primaryDark:'#7C3AED',navy:'#1e1b4b',navyLight:'#312e81',bg:'#EDE9FE'},
    {name:'Rose Red',   primary:'#F43F5E',primaryDark:'#E11D48',navy:'#881337',navyLight:'#9f1239',bg:'#FFF1F2'},
    {name:'Amber Gold', primary:'#F59E0B',primaryDark:'#D97706',navy:'#0b3d8d',navyLight:'#1e3a6e',bg:'#FFFBEB'},
    {name:'Indigo',     primary:'#6366F1',primaryDark:'#4F46E5',navy:'#1e1b4b',navyLight:'#312e81',bg:'#EEF2FF'},
    {name:'Cyan',       primary:'#06B6D4',primaryDark:'#0891B2',navy:'#0b3d8d',navyLight:'#164e63',bg:'#ECFEFF'},
    {name:'Hot Pink',   primary:'#EC4899',primaryDark:'#DB2777',navy:'#831843',navyLight:'#9d174d',bg:'#FDF2F8'},
    {name:'Orange',     primary:'#F97316',primaryDark:'#EA580C',navy:'#431407',navyLight:'#7c2d12',bg:'#FFF7ED'},
    {name:'Dark Slate', primary:'#94A3B8',primaryDark:'#64748B',navy:'#0f172a',navyLight:'#1e293b',bg:'#F1F5F9'},
    {name:'Lime Green', primary:'#84CC16',primaryDark:'#65A30D',navy:'#1a2e05',navyLight:'#365314',bg:'#F7FEE7'}
  ];
  function getSavedColors(){try{return JSON.parse(localStorage.getItem(COLOR_KEY)||'null');}catch(e){return null;}}
  function persistColors(c){localStorage.setItem(COLOR_KEY,JSON.stringify(c));}
  function applyColors(c){
    var r=document.documentElement.style;
    r.setProperty('--primary',c.primary);r.setProperty('--primary-dark',c.primaryDark);
    r.setProperty('--navy',c.navy);r.setProperty('--navy-light',c.navyLight);r.setProperty('--bg',c.bg);
    if(document.body)document.body.style.background=c.bg;
  }
  (function earlyApply(){
    var s=getSavedColors();if(!s)return;
    try{
      var r=document.documentElement.style;
      r.setProperty('--primary',s.primary);r.setProperty('--primary-dark',s.primaryDark);
      r.setProperty('--navy',s.navy);r.setProperty('--navy-light',s.navyLight);r.setProperty('--bg',s.bg);
    }catch(e){}
  })();

  /* ─── Google icon SVG ────────────────────────────── */
  var GSVG='<svg width="18" height="18" viewBox="0 0 48 48" style="flex-shrink:0"><path fill="#EA4335" d="M24 9.5c3.2 0 5.9 1.1 8.1 2.9l6-6C34.5 3.1 29.6 1 24 1 14.8 1 7 6.7 3.7 14.7l7 5.4C12.5 13.5 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.4 5.7C43.3 37.6 46.5 31.5 46.5 24.5z"/><path fill="#FBBC05" d="M10.7 28.1A14.5 14.5 0 0 1 9.5 24c0-1.4.2-2.8.5-4.1l-7-5.4A23 23 0 0 0 1 24c0 3.7.9 7.2 2.5 10.3l7.2-6.2z"/><path fill="#34A853" d="M24 47c5.6 0 10.3-1.8 13.7-5l-7.4-5.7c-1.9 1.3-4.3 2.1-6.3 2.1-6.2 0-11.5-4-13.3-9.5l-7.2 6.2C7 41.3 14.8 47 24 47z"/></svg>';

  /* ─── Inject Login Modal UI ─────────────────────── */
  function injectUI(){
    if(document.getElementById('cb-ui-root'))return;
    var root=document.createElement('div'); root.id='cb-ui-root';
    root.innerHTML=
'<style>\n'
+'#cb-ui-root *{box-sizing:border-box;font-family:\'Outfit\',sans-serif}\n'
+'.cb-ov{display:none;position:fixed;inset:0;background:rgba(5,15,40,.78);backdrop-filter:blur(8px);z-index:9999;align-items:center;justify-content:center}\n'
+'.cb-ov.open{display:flex;animation:cbFI .2s ease}\n'
+'@keyframes cbFI{from{opacity:0}to{opacity:1}}\n'
+'.cb-box{background:#fff;border-radius:22px;padding:36px 30px 28px;width:460px;max-width:94vw;max-height:90vh;overflow-y:auto;box-shadow:0 28px 70px rgba(0,0,0,.32);position:relative;animation:cbSU .34s cubic-bezier(.175,.885,.32,1.275)}\n'
+'@keyframes cbSU{from{transform:translateY(26px) scale(.93);opacity:0}to{transform:none;opacity:1}}\n'
+'.cb-x{position:absolute;top:13px;right:13px;background:none;border:none;font-size:1.35rem;cursor:pointer;color:#94A3B8;padding:4px}.cb-x:hover{color:#1E293B}\n'
+'.cb-logo{text-align:center;font-size:1.75rem;font-weight:800;color:var(--navy,#0b3d8d);margin-bottom:4px}\n'
+'.cb-logo span{color:var(--primary,#3B82F6)}\n'
+'.cb-sub{text-align:center;color:#64748B;font-size:.86rem;margin-bottom:18px}\n'
+'.cb-tabs{display:flex;border-radius:11px;background:#F1F5F9;padding:4px;margin-bottom:18px;gap:4px}\n'
+'.cb-tab{flex:1;padding:8px;border:none;border-radius:8px;font-family:\'Outfit\',sans-serif;font-weight:600;font-size:.86rem;cursor:pointer;background:none;color:#64748B;transition:all .2s}\n'
+'.cb-tab.on{background:#fff;color:var(--navy,#0b3d8d);box-shadow:0 2px 8px rgba(0,0,0,.09)}\n'
+'.cb-form{display:flex;flex-direction:column;gap:11px}\n'
+'.cb-fld{display:flex;flex-direction:column;gap:4px}\n'
+'.cb-fld label{font-size:.78rem;font-weight:600;color:#475569}\n'
+'.cb-fld input{padding:10px 12px;border:2px solid #E2E8F0;border-radius:9px;font-family:\'Outfit\',sans-serif;font-size:.91rem;color:#1E293B;outline:none;transition:border-color .2s}\n'
+'.cb-fld input:focus{border-color:var(--primary,#3B82F6)}\n'
+'.cb-err{color:#EF4444;font-size:.78rem;min-height:14px;font-weight:500}\n'
+'.cb-bp{padding:12px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:10px;font-family:\'Outfit\',sans-serif;font-size:.93rem;font-weight:700;cursor:pointer;transition:all .2s}\n'
+'.cb-bp:hover{opacity:.86;transform:translateY(-1px)}.cb-bp:disabled{opacity:.6;cursor:not-allowed;transform:none}\n'
+'.cb-div{display:flex;align-items:center;gap:9px;margin:4px 0}\n'
+'.cb-div::before,.cb-div::after{content:\'\';flex:1;height:1px;background:#E2E8F0}\n'
+'.cb-div span{font-size:.75rem;color:#94A3B8;font-weight:500}\n'
+'.cb-gb{display:flex;align-items:center;justify-content:center;gap:10px;padding:12px 20px;border:2px solid #dadce0;border-radius:10px;background:#fff;cursor:pointer;font-family:\'Outfit\',sans-serif;font-weight:700;font-size:.92rem;color:#3c4043;transition:all .2s;width:100%;box-shadow:0 1px 4px rgba(0,0,0,.08)}\n'
+'.cb-gb:hover{border-color:#4285F4;background:#f8fbff;box-shadow:0 2px 10px rgba(66,133,244,.2)}\n'
+'.cb-gb:active{background:#f0f4ff}\n'
+'.cb-gb:disabled{opacity:.65;cursor:not-allowed}\n'
+'@keyframes spin{to{transform:rotate(360deg)}}.cb-spin{display:inline-block;animation:spin .7s linear infinite}\n'
+'#cb-toasts{position:fixed;bottom:20px;right:20px;z-index:99999;display:flex;flex-direction:column;gap:7px;pointer-events:none}\n'
+'.cb-t{display:flex;align-items:center;gap:9px;padding:10px 15px;border-radius:11px;min-width:230px;max-width:320px;font-weight:600;font-size:.86rem;box-shadow:0 6px 24px rgba(0,0,0,.16);color:#fff}\n'
+'@keyframes tIn{from{transform:translateX(108%) scale(.84);opacity:0}to{transform:none;opacity:1}}\n'
+'@keyframes tOut{from{transform:none;opacity:1}to{transform:translateX(108%) scale(.84);opacity:0}}\n'
+'.cb-t.ok{background:linear-gradient(135deg,#22C55E,#16A34A);animation:tIn .3s ease}\n'
+'.cb-t.err{background:linear-gradient(135deg,#EF4444,#DC2626);animation:tIn .3s ease}\n'
+'.cb-t.inf{background:linear-gradient(135deg,#3B82F6,#1D4ED8);animation:tIn .3s ease}\n'
+'.cb-login-btn{padding:7px 14px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:9px;font-family:\'Outfit\',sans-serif;font-weight:600;font-size:.83rem;cursor:pointer;transition:opacity .2s}.cb-login-btn:hover{opacity:.84}\n'
+'.cb-reg-btn{padding:7px 14px;background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.22);color:#fff;border-radius:9px;font-family:\'Outfit\',sans-serif;font-weight:600;font-size:.83rem;cursor:pointer;transition:background .2s}.cb-reg-btn:hover{background:rgba(255,255,255,.24)}\n'
+'.cb-home-btn{display:inline-flex;align-items:center;gap:5px;padding:7px 13px;background:rgba(255,255,255,.13);border:1px solid rgba(255,255,255,.2);border-radius:9px;color:#fff;font-family:\'Outfit\',sans-serif;font-weight:600;font-size:.82rem;text-decoration:none;transition:background .2s;white-space:nowrap}.cb-home-btn:hover{background:rgba(255,255,255,.24)}\n'
+'.cb-bubble{display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.12);border-radius:28px;padding:4px 11px 4px 5px;cursor:pointer;position:relative}\n'
+'.cb-avatar{width:38px;height:38px;border-radius:50%;background:var(--primary,#3B82F6);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:.78rem;overflow:hidden;flex-shrink:0;border:2px solid rgba(255,255,255,0.3)}\n'
+'.cb-avatar img{width:100%;height:100%;object-fit:cover;object-position:center 20%;border-radius:50%}\n'
+'.cb-uname{color:#fff;font-weight:600;font-size:.83rem;max-width:80px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}\n'
+'.cb-dd{display:none;position:absolute;top:calc(100% + 7px);right:0;background:#fff;border-radius:13px;padding:7px;min-width:175px;box-shadow:0 10px 36px rgba(0,0,0,.16);z-index:200}\n'
+'.cb-bubble:hover .cb-dd{display:block}\n'
+'.cb-ddi{display:flex;align-items:center;gap:7px;padding:8px 11px;border-radius:8px;font-size:.84rem;font-weight:600;color:#1E293B;cursor:pointer;transition:background .14s}.cb-ddi:hover{background:#F1F5F9}.cb-ddi.red{color:#EF4444}\n'
+'.cb-sep{height:1px;background:#E2E8F0;margin:3px 0}\n'
+'.cpanel{background:#fff;border-radius:18px;padding:20px 18px;box-shadow:0 4px 18px rgba(0,0,0,.08)}\n'
+'.cpanel-head{font-weight:800;font-size:.93rem;color:var(--navy,#0b3d8d);margin-bottom:13px}\n'
+'.cp-section-lbl{font-size:.7rem;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px}\n'
+'.cp-presets{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:14px}\n'
+'.cp-dot-wrap{display:flex;flex-direction:column;align-items:center;gap:3px}\n'
+'.cp-dot{width:36px;height:36px;border-radius:10px;cursor:pointer;border:3px solid transparent;transition:all .18s;position:relative}\n'
+'.cp-dot:hover{transform:scale(1.1);box-shadow:0 4px 12px rgba(0,0,0,.18)}\n'
+'.cp-dot.on{border-color:#fff;box-shadow:0 0 0 3px var(--primary,#3B82F6)}\n'
+'.cp-dot.on::after{content:"\\2713";position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:900;font-size:1rem;text-shadow:0 1px 3px rgba(0,0,0,.45)}\n'
+'.cp-lbl{font-size:.6rem;color:#64748B;font-weight:600;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:44px}\n'
+'.cp-divider{border:none;border-top:1px solid #E2E8F0;margin:12px 0 10px}\n'
+'.cp-rows{display:flex;flex-direction:column;gap:8px}\n'
+'.cp-row{display:flex;align-items:center;gap:8px}\n'
+'.cp-row label{font-size:.75rem;font-weight:600;color:#64748B;flex:1;min-width:0}\n'
+'.cp-row input[type=color]{width:36px;height:30px;border:2px solid #E2E8F0;border-radius:7px;cursor:pointer;padding:2px;background:#fff;flex-shrink:0}\n'
+'.cp-row input[type=text]{width:76px;padding:4px 7px;border:2px solid #E2E8F0;border-radius:7px;font-family:\'JetBrains Mono\',monospace;font-size:.74rem;color:#1E293B;outline:none;flex-shrink:0}\n'
+'.cp-row input[type=text]:focus{border-color:var(--primary,#3B82F6)}\n'
+'.cp-apply{width:100%;margin-top:11px;padding:9px;background:var(--primary,#3B82F6);color:#fff;border:none;border-radius:10px;font-family:\'Outfit\',sans-serif;font-weight:700;font-size:.85rem;cursor:pointer;transition:opacity .2s}.cp-apply:hover{opacity:.86}\n'
+'.cp-reset{width:100%;margin-top:5px;padding:7px;background:#F1F5F9;color:#475569;border:none;border-radius:10px;font-family:\'Outfit\',sans-serif;font-weight:600;font-size:.8rem;cursor:pointer;transition:background .2s}.cp-reset:hover{background:#E2E8F0}\n'
+'.cp-preview{display:flex;gap:6px;margin-top:10px;border-radius:9px;overflow:hidden;height:22px}\n'
+'.cp-prev-swatch{flex:1;transition:background .2s}\n'
+'</style>\n'

+'<div class="cb-ov" id="cb-auth-ov">\n'
+'  <div class="cb-box">\n'
+'    <button class="cb-x" onclick="CSS_BUDDY.closeModal()">&#x2715;</button>\n'
+'    <div class="cb-logo"><span>CSS</span> Buddy</div>\n'
+'    <div class="cb-sub">Your path to CSS NC II excellence &#127891;</div>\n'
+'    <div class="cb-tabs">\n'
+'      <button class="cb-tab on" id="cb-tl" onclick="CSS_BUDDY._switchTab(\'login\')">Login</button>\n'
+'      <button class="cb-tab"    id="cb-tr" onclick="CSS_BUDDY._switchTab(\'reg\')">Register</button>\n'
+'    </div>\n'

+'    <div id="cb-login-p">\n'
+'      <div class="cb-form">\n'
+'        <div class="cb-fld"><label>Email</label><input type="email" id="cb-le" placeholder="you@gmail.com" autocomplete="email"/></div>\n'
+'        <div class="cb-fld"><label>Password</label><input type="password" id="cb-lp" placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;" autocomplete="current-password"/></div>\n'
+'        <div class="cb-err" id="cb-lerr"></div>\n'
+'        <button class="cb-bp" onclick="CSS_BUDDY._doLogin()">&#128273; Login</button>\n'
+'        <div class="cb-div"><span>or sign in with</span></div>\n'
+'        <button class="cb-gb" id="cb-gbtn1" onclick="CSS_BUDDY._googleLogin()">'+GSVG+' Sign in with Google</button>\n'
+'      </div>\n'
+'    </div>\n'

+'    <div id="cb-reg-p" style="display:none">\n'
+'      <div class="cb-form">\n'
+'        <div class="cb-fld"><label>Full Name</label><input type="text" id="cb-rn" placeholder="Juan dela Cruz" autocomplete="name"/></div>\n'
+'        <div class="cb-fld"><label>Email</label><input type="email" id="cb-re" placeholder="you@gmail.com" autocomplete="email"/></div>\n'
+'        <div class="cb-fld"><label>Password</label><input type="password" id="cb-rp" placeholder="Min. 6 characters" autocomplete="new-password"/></div>\n'
+'        <div class="cb-fld"><label>Confirm Password</label><input type="password" id="cb-rp2" placeholder="Repeat password" autocomplete="new-password"/></div>\n'
+'        <div class="cb-err" id="cb-rerr"></div>\n'
+'        <button class="cb-bp" onclick="CSS_BUDDY._doRegister()">&#10024; Create Account</button>\n'
+'        <div class="cb-div"><span>or sign up instantly with</span></div>\n'
+'        <button class="cb-gb" id="cb-gbtn2" onclick="CSS_BUDDY._googleLogin()">'+GSVG+' Continue with Google</button>\n'
+'      </div>\n'
+'    </div>\n'
+'  </div>\n'
+'</div>\n'
+'<div id="cb-toasts"></div>';

    document.body.appendChild(root);
    [['cb-le','cb-lp'],['cb-rn','cb-re','cb-rp','cb-rp2']].forEach(function(group,gi){
      group.forEach(function(id){
        var el=document.getElementById(id);
        if(el) el.addEventListener('keydown',function(e){ if(e.key==='Enter') gi===0?CSS_BUDDY._doLogin():CSS_BUDDY._doRegister(); });
      });
    });
    document.getElementById('cb-auth-ov').addEventListener('click',function(e){ if(e.target===this) CSS_BUDDY.closeModal(); });
  }

  /* ─── Color Panel ────────────────────────────────── */
  function buildColorPanel(hostId){
    var host=document.getElementById(hostId); if(!host) return;
    var cur=getSavedColors()||DEFAULT_COLORS;
    var ph=PRESETS.map(function(p,i){
      return '<div class="cp-dot-wrap"><div class="cp-dot'+(p.primary===cur.primary&&p.navy===cur.navy?' on':'')
        +'" id="cpd-'+i+'" style="background:linear-gradient(135deg,'+p.primary+','+p.navy+')" title="'+p.name
        +'" onclick="CSS_BUDDY._applyPreset('+i+')"></div><div class="cp-lbl">'+p.name+'</div></div>';
    }).join('');
    var rh=[['primary','Buttons/Accents'],['primaryDark','Button Hover'],['navy','Navbar Color'],['navyLight','Navbar Hover'],['bg','Page BG']].map(function(pr){
      return '<div class="cp-row"><label>'+pr[1]+'</label><input type="color" id="cpc-'+pr[0]+'" value="'+cur[pr[0]]+'"><input type="text" id="cpt-'+pr[0]+'" value="'+cur[pr[0]]+'" maxlength="7"></div>';
    }).join('');
    host.innerHTML='<div class="cpanel"><div class="cpanel-head">&#127912; Customize Colors</div>'
      +'<div class="cp-section-lbl">Quick Presets</div><div class="cp-presets">'+ph+'</div>'
      +'<hr class="cp-divider"/><div class="cp-section-lbl">Custom Colors</div><div class="cp-rows">'+rh+'</div>'
      +'<div style="margin-top:10px"><div class="cp-section-lbl">Live Preview</div><div class="cp-preview">'
      +'<div class="cp-prev-swatch" id="prev-primary" style="background:'+cur.primary+'"></div>'
      +'<div class="cp-prev-swatch" id="prev-navy" style="background:'+cur.navy+'"></div>'
      +'<div class="cp-prev-swatch" id="prev-bg" style="background:'+cur.bg+'"></div></div></div>'
      +'<button class="cp-apply" onclick="CSS_BUDDY._applyCustom()">&#10003; Apply</button>'
      +'<button class="cp-reset" onclick="CSS_BUDDY._resetColors()">&#8635; Reset</button></div>';
    ['primary','primaryDark','navy','navyLight','bg'].forEach(function(k){
      var pc=document.getElementById('cpc-'+k), tx=document.getElementById('cpt-'+k);
      if(!pc||!tx) return;
      pc.addEventListener('input',function(){tx.value=pc.value;_lp();});
      tx.addEventListener('input',function(){ if(/^#[0-9a-fA-F]{6}$/.test(tx.value)){pc.value=tx.value;_lp();} });
    });
  }
  function _lp(){
    var g=function(k){var e=document.getElementById('cpc-'+k);return e?e.value:'';};
    var p=document.getElementById('prev-primary'),n=document.getElementById('prev-navy'),b=document.getElementById('prev-bg');
    if(p)p.style.background=g('primary');if(n)n.style.background=g('navy');if(b)b.style.background=g('bg');
  }
  function _mp(colors){
    PRESETS.forEach(function(p,i){ var d=document.getElementById('cpd-'+i); if(d) d.classList.toggle('on',p.primary===colors.primary&&p.navy===colors.navy); });
  }

  /* ═══════════════════════════════════════════════════
     PUBLIC CSS_BUDDY API
  ═══════════════════════════════════════════════════ */
  var CSS_BUDDY = {

    isLoggedIn:function(){ return !!Auth.currentUser(); },
    openModal: function(tab){ injectUI(); document.getElementById('cb-auth-ov').classList.add('open'); this._switchTab(tab||'login'); },
    closeModal:function(){ var o=document.getElementById('cb-auth-ov'); if(o) o.classList.remove('open'); },

    _switchTab:function(tab){
      document.getElementById('cb-login-p').style.display=tab==='login'?'':'none';
      document.getElementById('cb-reg-p').style.display  =tab==='reg'  ?'':'none';
      document.getElementById('cb-tl').classList.toggle('on',tab==='login');
      document.getElementById('cb-tr').classList.toggle('on',tab==='reg');
      document.getElementById('cb-lerr').textContent='';
      document.getElementById('cb-rerr').textContent='';
    },

    _doLogin:function(){
      var email=document.getElementById('cb-le').value.trim(),pass=document.getElementById('cb-lp').value;
      var err=document.getElementById('cb-lerr'); err.textContent='';
      if(!email||!pass){err.textContent='Please fill in all fields.';return;}
      var res=Auth.login(email,pass); if(!res.ok){err.textContent=res.msg;return;}
      this.closeModal(); this._onSuccess(res.user);
    },

    _doRegister:function(){
      var name=document.getElementById('cb-rn').value.trim(),email=document.getElementById('cb-re').value.trim();
      var pass=document.getElementById('cb-rp').value,pass2=document.getElementById('cb-rp2').value;
      var err=document.getElementById('cb-rerr'); err.textContent='';
      if(!name||!email||!pass||!pass2){err.textContent='Please fill in all fields.';return;}
      if(pass.length<6){err.textContent='Password must be at least 6 characters.';return;}
      if(pass!==pass2){err.textContent='Passwords do not match.';return;}
      if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){err.textContent='Enter a valid email.';return;}
      var res=Auth.register(name,email,pass); if(!res.ok){err.textContent=res.msg;return;}
      Auth.login(email,pass); this.closeModal(); this._onSuccess(res.user,true);
    },

    /* ══════════════════════════════════════════════════
       REAL GOOGLE SIGN-IN
       Opens the actual Google "Choose an account" popup.
       Pulls your real name, profile photo, and Gmail.
    ══════════════════════════════════════════════════ */
    _googleLogin:function(){
      var self=this;
      injectUI();

      var configured=GOOGLE_CLIENT_ID&&GOOGLE_CLIENT_ID.indexOf('YOUR_CLIENT_ID')<0&&GOOGLE_CLIENT_ID.length>10;
      var resetBtns=function(){
        ['cb-gbtn1','cb-gbtn2'].forEach(function(id){
          var b=document.getElementById(id);
          if(b){b.disabled=false;b.innerHTML=GSVG+' Sign in with Google';}
        });
      };

      ['cb-gbtn1','cb-gbtn2'].forEach(function(id){
        var b=document.getElementById(id);
        if(b){b.disabled=true;b.innerHTML='<span class="cb-spin">&#9696;</span>&nbsp; Connecting…';}
      });

      if(!configured){
        resetBtns();
        var errEl=document.getElementById('cb-lerr')||document.getElementById('cb-rerr');
        if(errEl) errEl.textContent='Add your GOOGLE_CLIENT_ID in cssbuddy-shared.js to enable Google login.';
        self._toast('err','&#9881; Set GOOGLE_CLIENT_ID in cssbuddy-shared.js (line 22)');
        return;
      }

      loadGIS(function(err){
        if(err){ resetBtns(); self._toast('err','&#10060; '+err); return; }

        /* Initialize with callback that handles the returned credential */
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: function(response){
            if(!response||!response.credential){ resetBtns(); return; }
            var profile=decodeJWT(response.credential);
            if(!profile||!profile.email){ resetBtns(); self._toast('err','&#10060; Google did not return account info.'); return; }
            var res=Auth.googleLogin({ sub:profile.sub, email:profile.email, name:profile.name, picture:profile.picture });
            self.closeModal();
            self._onSuccess(res.user);
            resetBtns();
          },
          cancel_on_tap_outside:true,
          use_fedcm_for_prompt:false
        });

        /* Try One Tap prompt first; fall back to rendered button click */
        google.accounts.id.prompt(function(notification){
          if(notification.isNotDisplayed()||notification.isSkippedMoment()||notification.isDismissedMoment()){
            /* One Tap was blocked — use hidden renderButton trick */
            var fw=document.getElementById('_cb_g_fw');
            if(!fw){
              fw=document.createElement('div');
              fw.id='_cb_g_fw';
              fw.style.cssText='position:fixed;bottom:-200px;left:0;opacity:0;pointer-events:none;z-index:-1';
              document.body.appendChild(fw);
            }
            fw.innerHTML='';
            google.accounts.id.renderButton(fw,{type:'standard',size:'large'});
            /* Find and click the rendered Google button */
            setTimeout(function(){
              var iframe=fw.querySelector('iframe');
              var btn=fw.querySelector('[role="button"]')||fw.querySelector('div[tabindex="0"]');
              if(btn){ btn.click(); }
              else {
                /* Last resort: try clicking inside the iframe via postMessage */
                resetBtns();
                self._toast('inf','&#8505; Please click "Sign in with Google" again — allow popups if blocked!');
              }
            },200);
          }
        });
      });
    },

    _onSuccess:function(user,isNew){
      this._renderNav(user); this._guestMode(false);
      if(typeof window.onCBLogin==='function') window.onCBLogin(user,user.data);
      this._toast('ok', isNew?'&#127881; Welcome, '+user.name.split(' ')[0]+'! Account created!':'&#128075; Welcome back, '+user.name.split(' ')[0]+'!');
    },

    logout:function(){
      if(window.google&&google.accounts&&google.accounts.id){
        try{ google.accounts.id.disableAutoSelect(); }catch(e){}
        var u=Auth.currentUser();
        if(u&&u.email) try{ google.accounts.id.revoke(u.email,function(){}); }catch(e){}
      }
      Auth.logout(); this._renderNav(null); this._guestMode(true);
      if(typeof window.onCBLogout==='function') window.onCBLogout();
      this._toast('inf','&#128682; Logged out successfully.');
    },

    /* ── Data ───────────────────────────────────────── */
    saveProgress:function(t,p){ Auth.updateData(function(d){d.progress[t]=p;}); },
    getProgress: function(t)  { var d=Auth.getData(); return d?(d.progress[t]||0):0; },

    saveQuizScore:function(cocKey,correct,total){
      var pct=Math.round((correct/total)*100);
      Auth.updateData(function(d){
        if(!d.quizScores)d.quizScores=[];
        d.quizScores.unshift({coc:String(cocKey),score:correct,total:total,pct:pct,date:Date.now()});
        if(d.quizScores.length>50)d.quizScores=d.quizScores.slice(0,50);
      });
    },
    getQuizScores:function(){ var d=Auth.getData(); return d?(d.quizScores||[]): []; },

    saveGameScore:function(gameName,score){
      Auth.updateData(function(d){
        if(!d.gameScores)d.gameScores={};
        if(!d.gameScores[gameName]||score>d.gameScores[gameName])d.gameScores[gameName]=score;
      });
    },
    getGameScores:function(){ var d=Auth.getData(); return d?(d.gameScores||{}):{};  },

    addBookmark:function(text,coc){
      var id=makeId();
      Auth.updateData(function(d){ if(!d.bookmarks)d.bookmarks=[]; d.bookmarks.push({id:id,text:text,coc:coc||'',date:Date.now()}); });
      return id;
    },
    removeBookmark:function(id){ Auth.updateData(function(d){ d.bookmarks=(d.bookmarks||[]).filter(function(b){return b.id!==id;}); }); },
    getBookmarks:  function()  { var d=Auth.getData(); return d?(d.bookmarks||[]): []; },

    incrementFlashcards:function(){ Auth.updateData(function(d){d.flashcardsDone=(d.flashcardsDone||0)+1;}); },
    getFlashcardsDone:  function(){ var d=Auth.getData(); return d?(d.flashcardsDone||0):0; },
    getAllData:   function(){ return Auth.getData(); },
    currentUser: function(){ return Auth.currentUser(); },
    getUID:      function(){ var u=Auth.currentUser(); return u?(u.id||u.email):null; },
    buildNav:    function(){ this._renderNav(Auth.currentUser()); },

    /* ── Toast ──────────────────────────────────────── */
    _toast:function(type,msg){
      injectUI();
      var c=document.getElementById('cb-toasts'), t=document.createElement('div');
      t.className='cb-t '+type;
      var ico={ok:'&#9989;',err:'&#10060;',inf:'&#8505;&#65039;'};
      t.innerHTML='<span style="font-size:1rem;flex-shrink:0">'+(ico[type]||'')+'</span><span>'+msg+'</span>';
      c.appendChild(t);
      setTimeout(function(){t.style.animation='tOut .3s ease forwards';setTimeout(function(){t.remove();},300);},3400);
    },
    _showToast:function(type,msg){this._toast(type,msg);},
    showToast:  function(type,msg){this._toast(type,msg);},

    /* ── Color picker ───────────────────────────────── */
    _applyPreset:function(idx){
      var p=PRESETS[idx]; if(!p) return;
      applyColors(p); persistColors(p); _mp(p);
      ['primary','primaryDark','navy','navyLight','bg'].forEach(function(k){
        var pc=document.getElementById('cpc-'+k),tx=document.getElementById('cpt-'+k);
        if(pc)pc.value=p[k];if(tx)tx.value=p[k];
      });
      _lp(); this._toast('ok','&#127912; "'+p.name+'" theme applied!');
    },
    _applyCustom:function(){
      var self=this,g=function(k){var e=document.getElementById('cpc-'+k);return e?e.value:'';};
      var c={primary:g('primary'),primaryDark:g('primaryDark'),navy:g('navy'),navyLight:g('navyLight'),bg:g('bg')};
      var ok=Object.keys(c).every(function(k){return /^#[0-9a-fA-F]{6}$/.test(c[k]);});
      if(!ok){self._toast('err','&#10060; Use 6-digit hex like #3B82F6');return;}
      applyColors(c); persistColors(c); _mp(c); self._toast('ok','&#127912; Custom colors applied!');
    },
    _resetColors:function(){
      applyColors(DEFAULT_COLORS); persistColors(DEFAULT_COLORS);
      var h=document.getElementById('cb-pal-inner'); if(h) buildColorPanel('cb-pal-inner'); _mp(DEFAULT_COLORS);
      this._toast('inf','&#8635; Colors reset to default.');
    },
    buildColorPanel:function(id){buildColorPanel(id);},
    buildThemePanel:function(id){buildColorPanel(id);},
    setTheme:function(){},

    /* ── Nav ─────────────────────────────────────────── */
    _renderNav:function(user){
      var nr=document.querySelector('.nav-right'); if(!nr) return;
      var path=window.location.pathname;
      var isHome=/index\.html$/.test(path)||/\/$/.test(path)||path==='';
      var homeBtn=isHome?''+'':'<a href="index.html" class="cb-home-btn">&#127968; Home</a>';
      if(!user){
        nr.innerHTML=homeBtn
          +'<button class="cb-login-btn" onclick="CSS_BUDDY.openModal(\'login\')">&#128273; Login</button>'
          +'<button class="cb-reg-btn"   onclick="CSS_BUDDY.openModal(\'reg\')">&#10024; Register</button>';
        return;
      }
      var ini=user.name.split(' ').map(function(n){return n[0];}).join('').toUpperCase().slice(0,2);
      var isGoogle=user.provider==='google';
      var pb=isGoogle?'<span style="font-size:.6rem;background:#EA4335;color:#fff;padding:1px 5px;border-radius:4px;font-weight:700;margin-left:4px;">G</span>':'';
      var avMap={girl:'2197.png',girl_pe:'2196.png',boy:'2199.png',boy_pe:'2198.png'};
      var users_av=getUsers(), full_av=users_av[user.email]||null;
      var avatarChoice=full_av&&full_av.avatarChoice?full_av.avatarChoice:null;
      // Resolve avatar images relative to the script's own location so they
      // work from any page depth (root, subfolder, etc.)
      var scriptBase=(function(){
        var scripts=document.querySelectorAll('script[src]');
        for(var i=0;i<scripts.length;i++){
          if(scripts[i].src.indexOf('cssbuddy-shared')>-1){
            return scripts[i].src.replace(/[^/]*$/,'');
          }
        }
        return '/'; // fallback to root
      })();
      var av;
      if(avatarChoice&&avMap[avatarChoice]){
        av='<img src="'+scriptBase+avMap[avatarChoice]+'" alt="avatar" style="width:100%;height:100%;object-fit:cover;object-position:center top;border-radius:50%;" onerror="this.parentElement.textContent=\''+ini+'\'">';
      } else if(user.picture){
        av='<img src="'+user.picture+'" alt="'+ini+'" style="width:100%;height:100%;object-fit:cover;object-position:center 20%;border-radius:50%;" onerror="this.parentElement.textContent=\''+ini+'\'">';
      } else {
        av=ini;
      }
      nr.innerHTML=homeBtn
        +'<div class="cb-bubble">'
        +'<div class="cb-avatar-ring"><div class="cb-avatar">'+av+'</div></div>'
        +'<span class="cb-uname">'+user.name.split(' ')[0]+'</span>'
        +'<span style="color:#94A3B8;font-size:.72rem">&#9660;</span>'
        +'<div class="cb-dd">'
        +'<div style="padding:7px 11px 9px;border-bottom:1px solid #E2E8F0;margin-bottom:3px;">'
        +'<div style="font-weight:700;font-size:.86rem;color:#1E293B">'+user.name+pb+'</div>'
        +'<div style="font-size:.72rem;color:#64748B;margin-top:1px">'+user.email+'</div></div>'
        +'<div class="cb-ddi" onclick="location.href=\'profile.html\'">&#128100; My Profile</div>'
        +'<div class="cb-ddi" onclick="location.href=\'quiz.html\'">&#127942; My Scores</div>'
        +'<div class="cb-sep"></div>'
        +'<div class="cb-ddi red" onclick="CSS_BUDDY.logout()">&#128682; Logout</div>'
        +'</div></div>';
    },
    _guestMode:function(g){ document.body.classList.toggle('guest-mode',g); },

    init:function(){
      injectUI();
      var saved=getSavedColors(); if(saved){applyColors(saved);document.body.style.background=saved.bg;}
      var user=Auth.currentUser();
      if(user){this._renderNav(user);this._guestMode(false);if(typeof window.onCBLogin==='function')window.onCBLogin(user,user.data);}
      else{this._renderNav(null);this._guestMode(true);}
      this._injectFloatingPalette();
    },

    _injectFloatingPalette:function(){
      if(document.getElementById('cb-float-palette'))return;
      var w=document.createElement('div'); w.id='cb-float-palette';
      w.innerHTML='<style>#cb-float-palette{position:fixed;bottom:24px;left:24px;z-index:8888}'
        +'#cb-pal-btn{width:48px;height:48px;border-radius:50%;background:var(--primary,#3B82F6);border:none;cursor:pointer;font-size:1.3rem;box-shadow:0 4px 18px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s}'
        +'#cb-pal-btn:hover{transform:scale(1.1);box-shadow:0 8px 24px rgba(0,0,0,.28)}'
        +'#cb-pal-drawer{display:none;position:absolute;bottom:58px;left:0;width:260px;background:#fff;border-radius:18px;box-shadow:0 12px 48px rgba(0,0,0,.18)}'
        +'#cb-pal-drawer.open{display:block;animation:drawerPop .28s cubic-bezier(.175,.885,.32,1.275)}'
        +'@keyframes drawerPop{from{opacity:0;transform:scale(.88) translateY(12px)}to{opacity:1;transform:none}}</style>'
        +'<button id="cb-pal-btn" title="Customize Colors" onclick="CSS_BUDDY._togglePalette()">&#127912;</button>'
        +'<div id="cb-pal-drawer"><div id="cb-pal-inner" style="padding:16px;"></div></div>';
      document.body.appendChild(w);
      document.addEventListener('click',function(e){
        var d=document.getElementById('cb-pal-drawer'),b=document.getElementById('cb-pal-btn');
        if(d&&!d.contains(e.target)&&e.target!==b)d.classList.remove('open');
      });
    },
    _togglePalette:function(){
      var d=document.getElementById('cb-pal-drawer'); if(!d)return;
      if(d.classList.toggle('open'))buildColorPanel('cb-pal-inner');
    }
  };

  global.CSS_BUDDY=CSS_BUDDY;
  if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded',function(){CSS_BUDDY.init();}); }
  else{ CSS_BUDDY.init(); }

})(window);

