/* ============================================================
   features.js — افزونه‌های نسخه اندروید «باغ ایرانی»
   این فایل بعد از اسکریپت اصلی بازی لود می‌شود و بدون دست‌زدن
   به منطق اصلی، قابلیت‌های جدید را اضافه می‌کند.
   ============================================================ */
(function () {
  'use strict';

  const isAndroid = !!(window.Android && typeof window.Android.vibrate === 'function');

  // ---------- استایل‌های جدید ----------
  const css = document.createElement('style');
  css.textContent = `
    .season-layer { position: fixed; inset: 0; z-index: 1; pointer-events: none; overflow: hidden; }
    .season-p { position: absolute; top: -8vh; will-change: transform; opacity: .75; }
    @keyframes seasonFall {
      0%   { transform: translate3d(0,-8vh,0) rotate(0deg); opacity: 0; }
      10%  { opacity: .8; }
      50%  { transform: translate3d(var(--sway,30px),50vh,0) rotate(180deg); }
      100% { transform: translate3d(calc(var(--sway,30px) * -1),110vh,0) rotate(360deg); opacity: 0; }
    }
    @keyframes seasonRise {
      0%   { transform: translate3d(0,105vh,0) scale(.6); opacity: 0; }
      15%  { opacity: .9; }
      50%  { transform: translate3d(var(--sway,30px),50vh,0) scale(1.1); }
      100% { transform: translate3d(calc(var(--sway,30px) * -1),-10vh,0) scale(.7); opacity: 0; }
    }
    #extraBtn .count { background: var(--turquoise-deep); }
    .complete-pop {
      position: fixed; left: 50%; top: 24%; transform: translateX(-50%);
      z-index: 170; pointer-events: none; font-weight: 900; font-size: 22px;
      color: var(--gold-light); text-shadow: 0 0 18px rgba(212,175,55,.9), 0 3px 8px rgba(0,0,0,.6);
      animation: completePop 1.4s cubic-bezier(.34,1.56,.64,1) forwards;
      white-space: nowrap;
    }
    @keyframes completePop {
      0%   { transform: translate(-50%, 20px) scale(.3); opacity: 0; }
      25%  { transform: translate(-50%, 0) scale(1.2); opacity: 1; }
      75%  { transform: translate(-50%, -8px) scale(1); opacity: 1; }
      100% { transform: translate(-50%, -40px) scale(.9); opacity: 0; }
    }
    .pause-veil {
      position: fixed; inset: 0; z-index: 300; display: none; align-items: center; justify-content: center;
      background: rgba(5,10,24,.88); color: var(--gold-light); font-size: 20px; font-weight: 800;
      flex-direction: column; gap: 10px;
    }
    .pause-veil.show { display: flex; }
  `;
  document.head.appendChild(css);

  // ---------- ۱) لرزش native ----------
  window.vib = function (pattern) {
    if (!settings.vibrate) return;
    let ms = 20;
    if (Array.isArray(pattern)) {
      ms = pattern.filter((_, i) => i % 2 === 0).reduce((a, b) => a + b, 0);
    } else if (typeof pattern === 'number') {
      ms = pattern;
    }
    ms = Math.max(8, Math.min(ms, 200));
    if (isAndroid) { try { window.Android.vibrate(ms); } catch (e) {} }
    else if ('vibrate' in navigator) navigator.vibrate(pattern);
  };

  // جلوگیری از منوی راست‌کلیک/انتخاب متن
  document.addEventListener('contextmenu', e => e.preventDefault());

  // ---------- ۲) ذرات فصلی (هر باغ یک حال‌وهوا) ----------
  const SEASONS = [
    { items: ['🌸', '🌷', '🌼'], mode: 'fall' },   // بهاری
    { items: ['✨', '☀️', '🦋'], mode: 'rise' },   // تابستانی
    { items: ['🍁', '🍂', '🍃'], mode: 'fall' },   // پاییزی
    { items: ['❄️', '❅', '❆'], mode: 'fall' },    // زمستانی
    { items: ['✨', '⭐', '🌟'], mode: 'rise' },   // افسانه‌ای
    { items: ['🦋', '🕊️', '✨', '👑'], mode: 'rise' }, // بهشتی
  ];
  const layer = document.createElement('div');
  layer.className = 'season-layer';
  document.body.appendChild(layer);
  let currentSeason = -1;

  function setSeason(idx) {
    if (idx === currentSeason) return;
    currentSeason = idx;
    layer.innerHTML = '';
    const cfg = SEASONS[idx % SEASONS.length];
    for (let i = 0; i < 14; i++) {
      const el = document.createElement('div');
      el.className = 'season-p';
      el.textContent = cfg.items[i % cfg.items.length];
      el.style.left = (Math.random() * 100) + '%';
      el.style.fontSize = (14 + Math.random() * 16) + 'px';
      el.style.setProperty('--sway', (20 + Math.random() * 50) + 'px');
      const dur = 9 + Math.random() * 9;
      el.style.animation = `${cfg.mode === 'fall' ? 'seasonFall' : 'seasonRise'} ${dur}s linear ${-Math.random() * dur}s infinite`;
      layer.appendChild(el);
    }
  }

  // ---------- ۳) دکمه «ظرف اضافه» ----------
  const extraBtn = document.createElement('button');
  extraBtn.className = 'power-btn';
  extraBtn.id = 'extraBtn';
  extraBtn.title = 'ظرف خالی اضافه';
  extraBtn.innerHTML = '🧪<span class="count">1</span>';
  $('mapBtn').parentNode.insertBefore(extraBtn, $('mapBtn'));

  let baseCount = 0;
  extraBtn.addEventListener('click', () => {
    if (state.won) return;
    if (state.bottles.length !== baseCount) { showToast('ظرف اضافه رو قبلاً گرفتی!', 'anar'); return; }
    state.bottles.push([]);
    state.selected = null;
    state.usedHint = true; // استفاده از ظرف اضافه = بدون امتیاز «بدون کمک»
    sfxGift(); vib(30);
    showToast('🧪 یک ظرف خالی اضافه شد!', 'gold');
    render();
  });

  // ---------- ۴) جشن تکمیل هر ظرف + امتیاز ----------
  let prevComplete = 0;
  let suppress = true;
  let completedFruits = new Set();

  function isFull(b) { return b.length === state.capacity && b.every(c => c === b[0]); }
  function countComplete() { return state.bottles.filter(isFull).length; }

  function completePop(text) {
    const el = document.createElement('div');
    el.className = 'complete-pop';
    el.textContent = text;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  }

  const _render = window.render;
  window.render = function () {
    _render();
    extraBtn.disabled = !!state.won || state.bottles.length !== baseCount;
    if (suppress) return;
    const c = countComplete();
    if (c > prevComplete) {
      // کدام میوه کامل شد؟
      const fresh = state.bottles.filter(isFull).map(b => b[0]).find(f => !completedFruits.has(f));
      if (fresh !== undefined) {
        completedFruits.add(fresh);
        const fruit = state.fruitMap[fresh];
        state.sessionScore += 10;
        completePop(`${fruit ? fruit.emoji : '✨'} ${fruit ? fruit.name : ''} کامل شد! +۱۰`);
        throwConfetti(10);
        vib([25, 40, 25]);
        if (!state.won) sfxGift();
      }
    }
    prevComplete = c;
  };

  const _loadStage = window.loadStage;
  window.loadStage = function (levelIdx, stage) {
    suppress = true;
    completedFruits = new Set();
    _loadStage(levelIdx, stage);
    baseCount = state.bottles.length;
    prevComplete = countComplete();
    suppress = false;
    setSeason(levelIdx);
    extraBtn.disabled = false;
  };

  // ---------- ۵) توقف زمان وقتی اپ در پس‌زمینه است ----------
  const veil = document.createElement('div');
  veil.className = 'pause-veil';
  veil.innerHTML = '<div style="font-size:54px">⏸️</div><div>بازی متوقف شد</div><div style="font-size:12px;opacity:.7">برای ادامه ضربه بزن</div>';
  document.body.appendChild(veil);
  let pausedAt = 0;

  function pauseGame() {
    if (state.timerId && !state.won && !pausedAt) {
      pausedAt = Date.now();
      stopTimer();
      veil.classList.add('show');
    }
    try { stopMusic(); } catch (e) {}
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
  }
  function resumeGame() {
    if (pausedAt) {
      state.startTime += Date.now() - pausedAt;
      pausedAt = 0;
      state.timerId = setInterval(() => {
        state.elapsed = Math.floor((Date.now() - state.startTime) / 1000);
        $('timer').textContent = fmtTime(state.elapsed);
      }, 250);
    }
    veil.classList.remove('show');
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    if (settings.music) { try { startMusic(); } catch (e) {} }
  }
  veil.addEventListener('click', resumeGame);
  window.onAppPause = pauseGame;
  window.onAppResume = function () {
    // اگر زمان در حال توقف است، بازی را با ضربه ادامه می‌دهیم تا بازیکن آماده باشد
    if (!pausedAt) resumeGame();
  };
  document.addEventListener('visibilitychange', () => { if (document.hidden) pauseGame(); });

  // ---------- ۶) دکمه Back اندروید ----------
  window.onAndroidBack = function () {
    if (veil.classList.contains('show')) { resumeGame(); return 'handled'; }
    const open = document.querySelector('.modal.show');
    if (open) {
      if (open.id === 'menuModal') return 'exit';
      if (['welcomeModal', 'winModal', 'levelDoneModal', 'gameDoneModal'].includes(open.id)) return 'handled';
      closeAllModals();
      return 'handled';
    }
    openMenu();
    return 'handled';
  };

  // ---------- ۷) اشتراک‌گذاری ----------
  function shareText() {
    const score = getTotalScore();
    const t = getTitleByScore(score);
    return `🌳 من توی «باغ ایرانی» ${score} امتیاز دارم و لقبم «${t.title}» ـه!\nتوانایی‌ات رو امتحان کن 🍎🍇🍊`;
  }
  function doShare() {
    const text = shareText();
    if (window.Android && typeof window.Android.share === 'function') window.Android.share(text);
    else if (navigator.share) navigator.share({ text }).catch(() => {});
    else showToast('اشتراک‌گذاری در این دستگاه پشتیبانی نمی‌شود', 'anar');
  }

  const winBtns = document.querySelector('#winModal .row-btns');
  if (winBtns) {
    const b = document.createElement('button');
    b.className = 'ghost';
    b.textContent = '📤 اشتراک';
    b.addEventListener('click', doShare);
    winBtns.insertBefore(b, winBtns.firstChild);
  }
  const setBtns = document.querySelector('#settingsModal .row-btns');
  if (setBtns) {
    const b = document.createElement('button');
    b.className = 'ghost';
    b.textContent = '📤 معرفی بازی';
    b.addEventListener('click', doShare);
    setBtns.insertBefore(b, setBtns.firstChild);
  }

  // رفع باگ نسخه وب: بعد از وارد کردن نام در اولین اجرا، مرحله اول لود نمی‌شد
  $('startGameBtn').addEventListener('click', () => {
    if (localStorage.getItem('baghIran_name') && state.bottles.length === 0) loadStage(0, 1);
  });

  // ---------- اجرای اولیه ----------
  // بازی اصلی قبل از ما یک بار loadStage(0,1) را اجرا کرده؛ وضعیت را همگام می‌کنیم.
  baseCount = state.bottles.length;
  prevComplete = countComplete();
  suppress = false;
  setSeason(state.levelIdx || 0);
})();
