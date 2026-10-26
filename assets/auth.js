/* SimuVerse auth — browser-only (localStorage). Fine for a demo/portfolio; use a real backend for production. */
(function () {
  const USERS = 'simuverse_users', SESSION = 'simuverse_session', DAY = 864e5;
  const base = document.currentScript.src.replace(/assets\/auth\.js.*$/, '');
  const read = k => { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } };
  const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');

  async function hash(pw, salt) {
    if (window.crypto && crypto.subtle) {
      const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pw), 'PBKDF2', false, ['deriveBits']);
      return hex(await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: new TextEncoder().encode(salt), iterations: 100000, hash: 'SHA-256' }, key, 256));
    }
    let h = 0; for (const c of salt + pw) h = (h * 31 + c.charCodeAt(0)) | 0; return 'x' + h;
  }
  const session = () => { const s = read(SESSION); return s && s.exp > Date.now() ? s : null; };
  const start = u => localStorage.setItem(SESSION, JSON.stringify({ name: u.name, email: u.email, exp: Date.now() + 7 * DAY }));
  const safeNext = n => { const m = /^simulations\/([a-z0-9-]+)(\.html)?$/.exec(n || ''); return m ? 'simulations/' + m[1] + '.html' : 'index.html'; };


  /* ---- progress / XP (per user, stored in this browser) ---- */
  const PKEY = e => 'simuverse_progress_' + e, XP_PER_LEVEL = 150;
  const RANKS = ['Cadet', 'Trainee', 'Operator', 'Specialist', 'Expert', 'Master'];
  const SIM_ID = { 'a320-cockpit': 'a320', 'laparoscopic-simulator': 'lap', 'fire-extinguisher-trainer': 'fire' };
  const day = d => (d || new Date()).toISOString().slice(0, 10);
  function prog() {
    const s = session(); if (!s) return null;
    return Object.assign({ xp: 0, launch: {}, min: {}, days: [], last: {} }, read(PKEY(s.email)) || {});
  }
  function save(p) { const s = session(); if (s) try { localStorage.setItem(PKEY(s.email), JSON.stringify(p)); } catch (e) {} }
  function streak(days) {
    let n = 0, d = new Date();
    if (!days.includes(day(d))) d = new Date(Date.now() - DAY);
    while (days.includes(day(d))) { n++; d = new Date(d.getTime() - DAY); }
    return n;
  }
  function track(id) {
    const p = prog(); if (!p) return;
    p.launch[id] = (p.launch[id] || 0) + 1;
    if (p.last[id] !== day()) { p.last[id] = day(); p.xp += 50; }
    if (!p.days.includes(day())) p.days.push(day());
    save(p);
    setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      const q = prog(); if (!q) return;
      q.min[id] = (q.min[id] || 0) + 0.5; q.xp += 5; save(q);
    }, 30000);
  }
  /* ---- plain-language error banner for simulations ---- */
  function watch() {
    const show = msg => {
      if (document.getElementById('sv-err')) return;
      const b = document.createElement('div'); b.id = 'sv-err'; b.setAttribute('role', 'alert');
      b.style.cssText = 'position:fixed;z-index:100;left:50%;top:70px;transform:translateX(-50%);width:min(520px,calc(100vw - 24px));padding:16px 18px;border-radius:16px;background:#fff;color:#10262C;font:500 14px/1.5 system-ui,sans-serif;box-shadow:0 10px 40px #0006;border:3px solid #E5481C';
      b.innerHTML = '<b>This simulation could not start.</b><br>' + msg + '<br><br>Try: Chrome or Edge, hardware acceleration turned on, and an internet connection (the 3D library loads online). <a href="' + base + 'index.html" style="color:#2F6FDB">Back to SimuVerse</a>';
      document.body.appendChild(b);
    };
    addEventListener('error', e => {
      const t = e.target;
      if (t && t.tagName === 'SCRIPT') show('A required script failed to load.');
      else if (!document.querySelector('canvas')) show('Error: ' + String(e.message || 'unknown').replace(/[<>&]/g, ''));
    }, true);
    addEventListener('unhandledrejection', e => { if (!document.querySelector('canvas')) show('Error: ' + String((e.reason && e.reason.message) || e.reason).replace(/[<>&]/g, '')); });
    addEventListener('load', () => setTimeout(() => {
      const c = document.createElement('canvas');
      if (!(c.getContext('webgl2') || c.getContext('webgl'))) show('Your browser has WebGL turned off or unavailable.');
      else if (!document.querySelector('canvas')) show('The 3D scene did not load. A script may be blocked or offline.');
    }, 5000));
  }

  window.SimuAuth = {
    base, session, safeNext,
    stats() {
      const p = prog(); if (!p) return null;
      const L = Math.floor(p.xp / XP_PER_LEVEL), st = streak(p.days);
      const mins = Object.values(p.min).reduce((a, b) => a + b, 0), l = p.launch;
      const B = (id, icon, name, hint, ok) => ({ id, icon, name, hint, earned: !!ok });
      return {
        xp: p.xp, level: L + 1, into: p.xp % XP_PER_LEVEL, per: XP_PER_LEVEL, rank: RANKS[Math.min(L, RANKS.length - 1)],
        streak: st, minutes: Math.floor(mins), launch: l, min: p.min,
        badges: [
          B('f', '✈️', 'First flight', 'Launch the A320 trainer', l.a320),
          B('s', '🩺', 'Scrubbed in', 'Launch the laparoscopic trainer', l.lap),
          B('w', '🔥', 'Fire warden', 'Launch the fire trainer', l.fire),
          B('a', '🏅', 'All-rounder', 'Try all three simulations', l.a320 && l.lap && l.fire),
          B('r', '⚡', 'On a roll', 'Train 3 days in a row', st >= 3),
          B('t', '⏱️', 'Focused', 'Train for 30 minutes', mins >= 30)
        ]
      };
    },
    async signUp(name, email, pw) {
      email = email.trim().toLowerCase(); name = name.trim();
      if (!name) throw new Error('Enter your name.');
      if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error('Enter a valid email address.');
      if (pw.length < 8) throw new Error('Use a password with at least 8 characters.');
      const users = read(USERS) || {};
      if (users[email]) throw new Error('An account with this email already exists. Sign in instead.');
      const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
      users[email] = { name, email, salt, hash: await hash(pw, salt) };
      localStorage.setItem(USERS, JSON.stringify(users));
      start(users[email]);
    },
    async signIn(email, pw) {
      const u = (read(USERS) || {})[email.trim().toLowerCase()];
      if (!u || u.hash !== await hash(pw, u.salt)) throw new Error('Email or password is incorrect.');
      start(u);
    },
    signOut() { localStorage.removeItem(SESSION); location.href = base + 'index.html'; },
    loginUrl(next) { return base + 'login.html?next=' + encodeURIComponent(next); },
    /* Call in the <head> of every protected page. */
    guard() {
      if (!session()) { location.replace(this.loginUrl('simulations/' + location.pathname.split('/').pop().replace(/\.html$/, '') + '.html')); return; }
      track(SIM_ID[location.pathname.split('/').pop().replace('.html', '')] || 'other'); watch();
      addEventListener('DOMContentLoaded', () => {
        const a = document.createElement('a');
        a.href = base + 'index.html'; a.textContent = 'SimuVerse home';
        a.style.cssText = 'position:fixed;z-index:60;right:14px;bottom:calc(14px + env(safe-area-inset-bottom));padding:9px 14px;border-radius:99px;background:#10262Cdd;color:#fff;font:600 13px system-ui,sans-serif;text-decoration:none;border:1px solid #ffffff40;backdrop-filter:blur(8px)';
        document.body.appendChild(a);
      });
    },
    /* Landing page: show user state and route simulation links through login. */
    init() {
      const s = session(), slot = document.getElementById('account');
      if (slot) slot.innerHTML = s
        ? '<span>' + s.name.split(' ')[0].replace(/[<>&"]/g, '') + '</span><button id="out" type="button">Sign out</button>'
        : '<a class="btn" href="login.html">Sign in</a>';
      const out = document.getElementById('out'); if (out) out.onclick = () => this.signOut();
      document.querySelectorAll('[data-sim]').forEach(a => a.addEventListener('click', e => {
        if (!session()) { e.preventDefault(); location.href = this.loginUrl(a.getAttribute('href')); }
      }));
    }
  };
})();
