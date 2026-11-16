/* ============================================================
   槐安里：未寄出的全家福 — 游戏主程序
   ============================================================ */

(function () {
  'use strict';

  const D = window.GAME_DATA;
  const P = window.PAGES;
  const SAVE_KEY = 'huai_an_li_save_v1';
  const DEV_SESSION_KEY = 'huai_an_li_dev_unlocked';
  const DEV_PASSWORD = '88888888';
  const VERSION = 1;

  let state = null;
  let gameStarted = false;
  let currentRoute = '/';
  let overlayMode = null;
  let bootNewArmed = false;
  let bootAudioPref = true;
  let bootEffectsPref = true;
  let storageAvailable = true;
  let devUnlocked = false;
  let renderToken = 0;
  let chatTimer = null;
  let pendingConfirm = null;
  let lastScareAt = 0;
  let sourceForCopy = '';

  const $ = function (id) { return document.getElementById(id); };
  const pageView = $('page-view');
  const overlayRoot = $('overlay-root');
  const toastRoot = $('toast-root');
  const addressInput = $('address-input');

  const FRAGMENT_IDS = D.FRAGMENTS.map(function (f) { return f.id; });
  const CLUE_IDS = D.CLUES.map(function (c) { return c.id; });
  const ENDING_IDS = D.ENDINGS.map(function (e) { return e.id; });
  const ROUTE_META = {};
  const FILE_MAP = {};

  D.ROUTES.forEach(function (r) {
    ROUTE_META[r.path] = r;
    if (r.file) {
      FILE_MAP[r.file.toLowerCase()] = r.path;
    }
  });

  const ALIASES = {
    'index.htm': '/',
    'index.html': '/',
    'home': '/',
    '': '/',
    'about.htm': '/about',
    'news/notice.htm': '/notice',
    'photo/album.htm': '/album',
    'bbs/index.htm': '/bbs',
    'bbs/topic.asp?id=404': '/bbs/404',
    'bbs/topic.asp?id=7': '/bbs/underground',
    'guestbook/index.htm': '/guestbook',
    '~xiaoman/index.htm': '/diary',
    '~xiaoman/last.htm': '/diary/last',
    'oicq/chat.htm': '/chat',
    'search.asp': '/search',
    'archive/20000103.htm': '/archive',
    'links.htm': '/links',
    'b2/door.htm': '/underground',
    'restore/100.htm': '/ritual',
    '404.htm': '/404',
    'error/404.htm': '/lost',
    'album': '/album',
    'notice': '/notice',
    'bbs': '/bbs',
    'chat': '/chat',
    'search': '/search',
    'archive': '/archive',
    'guestbook': '/guestbook',
    'diary': '/diary',
    'about': '/about',
    'links': '/links',
    'underground': '/underground',
    'ritual': '/ritual',
    '404': '/404'
  };

  /* ---------------- 存档 ---------------- */

  function defaultState() {
    return {
      version: VERSION,
      started: false,
      route: '/',
      mailRead: false,
      fragments: [],
      clues: [],
      visited: [],
      chatLog: [],
      chatFragmentGiven: false,
      chatGreeted: false,
      guestbook: [],
      gateOpen: false,
      basementStage: 0,
      basementAttempts: 0,
      basementError: '',
      ritualDeveloped: false,
      ritualChoice: '',
      ritualError: '',
      playerName: '',
      endings: [],
      searchQuery: '',
      effects: true,
      audio: true,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }

  function uniqueValid(list, valid) {
    const out = [];
    (Array.isArray(list) ? list : []).forEach(function (v) {
      if (valid.indexOf(v) !== -1 && out.indexOf(v) === -1) out.push(v);
    });
    return out;
  }

  function normalizeState(raw) {
    const base = defaultState();
    if (!raw || typeof raw !== 'object') return base;
    const merged = Object.assign(base, raw);
    merged.version = VERSION;
    merged.fragments = uniqueValid(raw.fragments, FRAGMENT_IDS);
    merged.clues = uniqueValid(raw.clues, CLUE_IDS);
    merged.endings = uniqueValid(raw.endings, ENDING_IDS);
    merged.visited = Array.isArray(raw.visited) ? raw.visited.filter(function (x) { return typeof x === 'string'; }).slice(-200) : [];
    merged.chatLog = Array.isArray(raw.chatLog) ? raw.chatLog.filter(function (m) {
      return m && typeof m === 'object' && ['self', 'ghost', 'sys', 'file'].indexOf(m.who) !== -1;
    }).slice(-160) : [];
    merged.guestbook = Array.isArray(raw.guestbook) ? raw.guestbook.filter(function (g) {
      return g && typeof g === 'object' && typeof g.message === 'string';
    }).slice(-30) : [];
    merged.route = typeof raw.route === 'string' ? raw.route : '/';
    merged.searchQuery = typeof raw.searchQuery === 'string' ? raw.searchQuery : '';
    merged.playerName = typeof raw.playerName === 'string' ? raw.playerName.slice(0, 20) : '';
    merged.basementStage = Math.max(0, Math.min(6, parseInt(raw.basementStage, 10) || 0));
    merged.basementAttempts = Math.max(0, parseInt(raw.basementAttempts, 10) || 0);
    merged.effects = raw.effects !== false;
    merged.audio = raw.audio !== false;
    merged.mailRead = !!raw.mailRead;
    merged.gateOpen = !!raw.gateOpen;
    merged.ritualDeveloped = !!raw.ritualDeveloped;
    merged.chatFragmentGiven = !!raw.chatFragmentGiven;
    merged.chatGreeted = !!raw.chatGreeted;
    merged.ritualChoice = ['', 'remember', 'replace', 'forget'].indexOf(raw.ritualChoice) !== -1 ? raw.ritualChoice : '';
    merged.ritualError = typeof raw.ritualError === 'string' ? raw.ritualError : '';
    merged.basementError = typeof raw.basementError === 'string' ? raw.basementError : '';
    merged.createdAt = Number(raw.createdAt) || Date.now();
    merged.updatedAt = Number(raw.updatedAt) || Date.now();
    if (ENDING_IDS.indexOf(merged.route.replace('/ending/', '')) !== -1 && merged.route.indexOf('/ending/') === 0) {
      // ending route is valid
    }
    return merged;
  }

  function checkStorage() {
    try {
      const k = '__huai_an_li_test__';
      window.localStorage.setItem(k, '1');
      window.localStorage.removeItem(k);
      return true;
    } catch (e) {
      return false;
    }
  }

  function loadSave() {
    if (!storageAvailable) return null;
    try {
      const raw = window.localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return null;
      return normalizeState(parsed);
    } catch (e) {
      console.warn('[槐安里] 存档读取失败：', e);
      return null;
    }
  }

  function saveNow(silent) {
    if (!state) return;
    state.updatedAt = Date.now();
    state.route = currentRoute;
    if (!storageAvailable) {
      setSaveStatus('本地存档不可用');
      return;
    }
    try {
      window.localStorage.setItem(SAVE_KEY, JSON.stringify(state));
      if (!silent) setSaveStatus('本地存档已连接');
    } catch (e) {
      storageAvailable = false;
      setSaveStatus('本地存档失败');
      if (!silent) {
        toast('存档失败', '浏览器拒绝写入本地存档。请检查隐私设置，或使用本地服务器打开。', 'bad');
      }
    }
  }

  function setSaveStatus(text) {
    const el = $('save-status');
    if (el) el.textContent = text;
  }

  function clearSave() {
    if (!storageAvailable) return;
    try { window.localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ }
  }

  function resetProgress(keepEndings) {
    const endings = keepEndings ? (state.endings || []).slice() : [];
    const effects = state.effects !== false;
    const audio = state.audio !== false;
    state = defaultState();
    state.endings = endings;
    state.effects = effects;
    state.audio = audio;
    currentRoute = '/';
    bootNewArmed = false;
  }

  /* ---------------- 声音 ---------------- */

  const AudioEngine = {
    ctx: null,
    master: null,
    droneGain: null,
    noiseGain: null,
    noiseSource: null,
    filter: null,
    started: false,
    enabled: true,

    init: function () {
      if (this.ctx) return;
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.0001;
        this.master.connect(this.ctx.destination);

        this.filter = this.ctx.createBiquadFilter();
        this.filter.type = 'lowpass';
        this.filter.frequency.value = 380;
        this.filter.Q.value = 0.7;
        this.filter.connect(this.master);

        this.droneGain = this.ctx.createGain();
        this.droneGain.gain.value = 0.14;
        this.droneGain.connect(this.filter);

        const o1 = this.ctx.createOscillator();
        o1.type = 'sine';
        o1.frequency.value = 55;
        o1.connect(this.droneGain);
        o1.start();

        const o2 = this.ctx.createOscillator();
        o2.type = 'triangle';
        o2.frequency.value = 82.4;
        const g2 = this.ctx.createGain();
        g2.gain.value = 0.22;
        o2.connect(g2);
        g2.connect(this.droneGain);
        o2.start();

        // 老电脑的风扇声 / 底噪
        const bufferSize = this.ctx.sampleRate * 2;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let last = 0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          last = (last + 0.02 * white) / 1.02;
          data[i] = last * 2.2;
        }
        this.noiseSource = this.ctx.createBufferSource();
        this.noiseSource.buffer = buffer;
        this.noiseSource.loop = true;
        this.noiseGain = this.ctx.createGain();
        this.noiseGain.gain.value = 0.05;
        this.noiseSource.connect(this.noiseGain);
        this.noiseGain.connect(this.filter);
        this.noiseSource.start();

        this.started = true;
      } catch (e) {
        console.warn('[槐安里] 音频初始化失败：', e);
      }
    },

    setEnabled: function (on) {
      this.enabled = !!on;
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const target = this.enabled ? 0.055 : 0.0001;
      try {
        this.master.gain.cancelScheduledValues(t);
        this.master.gain.setValueAtTime(Math.max(0.0001, this.master.gain.value), t);
        this.master.gain.exponentialRampToValueAtTime(target, t + 0.55);
        if (this.enabled && this.ctx.state === 'suspended') this.ctx.resume();
      } catch (e) { /* ignore */ }
    },

    resume: function () {
      if (!this.ctx) this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
      this.setEnabled(this.enabled);
    },

    setMood: function (route) {
      if (!this.filter || !this.ctx) return;
      const t = this.ctx.currentTime;
      let freq = 380;
      if (route === '/underground' || route === '/404') freq = 170;
      if (route.indexOf('/ending') === 0) freq = 520;
      try { this.filter.frequency.linearRampToValueAtTime(freq, t + 1.1); } catch (e) { /* ignore */ }
    },

    tone: function (freq, dur, type, gain, delay) {
      if (!this.enabled) return;
      this.resume();
      if (!this.ctx) return;
      const t = this.ctx.currentTime + (delay || 0);
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || 'sine';
      o.frequency.value = freq;
      g.gain.value = 0.0001;
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      g.gain.exponentialRampToValueAtTime(gain || 0.05, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (dur || 0.25));
      o.stop(t + (dur || 0.25) + 0.04);
    },

    collect: function () {
      const self = this;
      this.tone(523.25, 0.22, 'sine', 0.06, 0);
      this.tone(659.25, 0.24, 'sine', 0.05, 0.13);
      this.tone(783.99, 0.45, 'sine', 0.035, 0.27);
      setTimeout(function () { self.tone(392, 0.9, 'sine', 0.025, 0); }, 260);
    },

    error: function () {
      this.tone(110, 0.4, 'sawtooth', 0.025, 0);
      this.tone(103.8, 0.5, 'square', 0.012, 0.1);
    },

    door: function () {
      this.tone(73.4, 1.2, 'sawtooth', 0.025, 0);
      this.tone(164.8, 0.5, 'triangle', 0.02, 0.3);
    },

    scare: function () {
      if (!this.enabled) return;
      this.resume();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const len = this.ctx.sampleRate * 0.9;
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.4);
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const g = this.ctx.createGain();
      g.gain.value = 0.11;
      src.connect(g);
      g.connect(this.master);
      src.start(t);
      this.tone(48, 1.1, 'sawtooth', 0.04, 0);
    }
  };

  /* ---------------- 提示 ---------------- */

  function toast(title, message, kind, timeout) {
    if (!toastRoot) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = (title ? '<span class="toast-title">' + P.helpers.esc(title) + '</span>' : '') + P.helpers.esc(message || '');
    toastRoot.appendChild(el);
    window.setTimeout(function () {
      el.style.opacity = '0';
      el.style.transition = 'opacity .25s ease';
      window.setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 280);
    }, timeout || 3800);
  }

  /* ---------------- 启动屏幕 ---------------- */

  function bootHTML(saved) {
    const savedRoute = saved ? (ROUTE_META[saved.route] || ROUTE_META['/']) : null;
    let saveLine = '';
    if (saved) {
      const dt = new Date(saved.updatedAt || Date.now());
      const stamp = dt.getFullYear() + '-' + P.helpers.pad(dt.getMonth() + 1, 2) + '-' + P.helpers.pad(dt.getDate(), 2) + ' ' + P.helpers.pad(dt.getHours(), 2) + ':' + P.helpers.pad(dt.getMinutes(), 2);
      saveLine = '<div class="boot-save">检测到本地存档 · 上次浏览：<span class="saved-route">' + P.helpers.esc(savedRoute ? savedRoute.label : '未知页面') + '</span><br>存档时间：' + P.helpers.esc(stamp) + ' · 底片 ' + (saved.fragments ? saved.fragments.length : 0) + '/7</div>';
    } else {
      saveLine = '<div class="boot-save">未检测到本地存档。本次浏览将自动保存。</div>';
    }
    if (!storageAvailable) {
      saveLine = '<div class="boot-save" style="color:#b88771">本地存档不可用。请通过本地服务器打开本档案，或检查浏览器的隐私设置。</div>';
    }

    const newLabel = saved
      ? (bootNewArmed ? '确认清空存档并重新开始' : '重新开始')
      : '载入档案';
    const newHint = bootNewArmed
      ? '<div class="boot-warning" style="border-color:#7e3a32;color:#c08b7e">再次点击将删除本地进度。此操作不可撤销。</div>'
      : '';

    return '' +
      '<div class="boot-screen" role="dialog" aria-modal="true" aria-label="槐安里档案启动">' +
        '<div class="monitor">' +
          '<div class="monitor-bezel">' +
            '<div class="monitor-screen">' +
              '<div class="boot-topline"><span>HUAI\'ANLI ARCHIVE SYSTEM · v1.99</span><span>LOCAL / OFFLINE</span></div>' +
              '<div class="boot-logo">槐安里</div>' +
              '<div class="boot-sub">一个被留在千禧年前夜的网页</div>' +
              '<div class="boot-rule"></div>' +
              '<div class="boot-log">' +
                '<p>C:\\&gt; ping www.huai-an-li.net</p>' +
                '<p class="ok">正在 Ping 127.0.0.1 [127.0.0.1] 具有 32 字节的数据……</p>' +
                '<p class="ok">来自 127.0.0.1 的回复：字节=404 时间&lt;1ms TTL=64</p>' +
                '<p>正在读取光盘映像…… <span class="ok">OK</span></p>' +
                '<p>正在恢复已删除的网页…… <span class="warn">1 个页面未能恢复</span></p>' +
                '<p>正在检查本地存档…… <span class="ok">' + (saved ? 'FOUND' : 'NO SAVE') + '</span></p>' +
                '<p class="bad">警告：检测到一个未关闭的网页。</p>' +
              '</div>' +
              saveLine +
              '<div class="boot-warning">' + P.helpers.esc(D.SITE.warning) + '</div>' +
              '<div class="boot-actions">' +
                (saved ? '<button type="button" class="boot-start" data-action="boot-continue">继续上次浏览</button>' : '') +
                '<button type="button" class="' + (saved ? 'boot-secondary' : 'boot-start') + '" data-action="boot-new">' + P.helpers.esc(newLabel) + '</button>' +
                newHint +
              '</div>' +
              '<div class="boot-actions" style="margin-top:14px;flex-direction:row;justify-content:center;gap:16px">' +
                '<label class="boot-checkline"><input type="checkbox" id="boot-audio"' + (bootAudioPref ? ' checked' : '') + '> 启用环境音</label>' +
                '<label class="boot-checkline"><input type="checkbox" id="boot-effects"' + (bootEffectsPref ? ' checked' : '') + '> 启用视觉特效</label>' +
              '</div>' +
              '<div class="boot-save" style="margin-top:13px">建议在安静环境中浏览 · 可随时在工具栏关闭声音和特效<br>如果没有自动保存，请通过本地服务器打开本档案。</div>' +
            '</div>' +
          '</div>' +
          '<div class="monitor-stand"></div>' +
          '<div class="monitor-base"></div>' +
          '<div class="monitor-brand">HUALIAN MONITOR · MODEL 1999</div>' +
        '</div>' +
      '</div>';
  }

  function showBoot(saved) {
    overlayMode = 'boot';
    gameStarted = false;
    overlayRoot.innerHTML = bootHTML(saved);
    bindBootCheckboxes();
  }

  function bindBootCheckboxes() {
    const a = $('boot-audio');
    const e = $('boot-effects');
    if (a) {
      bootAudioPref = a.checked;
      a.addEventListener('change', function () { bootAudioPref = a.checked; });
    }
    if (e) {
      bootEffectsPref = e.checked;
      e.addEventListener('change', function () { bootEffectsPref = e.checked; });
    }
  }

  function readBootPrefs() {
    const a = $('boot-audio');
    const e = $('boot-effects');
    if (a) bootAudioPref = a.checked;
    if (e) bootEffectsPref = e.checked;
  }

  function beginGame(mode, saved) {
    readBootPrefs();
    if (mode === 'resume' && saved) {
      state = normalizeState(saved);
      currentRoute = state.route || '/';
    } else {
      state = defaultState();
      state.audio = bootAudioPref;
      state.effects = bootEffectsPref;
      currentRoute = '/';
    }
    state.started = true;
    state.audio = bootAudioPref;
    state.effects = bootEffectsPref;
    gameStarted = true;
    overlayMode = null;
    overlayRoot.innerHTML = '';
    document.body.classList.toggle('effects-on', state.effects !== false);
    document.body.classList.toggle('effects-off', state.effects === false);
    AudioEngine.enabled = state.audio !== false;
    AudioEngine.init();
    AudioEngine.resume();
    AudioEngine.setEnabled(state.audio !== false);
    const hashRoute = routeFromHash();
    if (mode === 'resume' && hashRoute && isValidRoute(hashRoute)) {
      currentRoute = hashRoute;
    } else if (mode !== 'resume') {
      currentRoute = '/';
    }
    checkRoute();
    renderRoute(currentRoute, { updateHash: true, replace: true });
    saveNow();
    updateAudioUI();
    updateEffectsUI();
    if (!state.mailRead && currentRoute.indexOf('/ending/') !== 0) {
      window.setTimeout(function () { if (gameStarted) openMail(); }, 420);
    }
    if (currentRoute === '/' && !state.mailRead) {
      // 邮件弹窗会覆盖首页，不需要再显示额外提示
    }
  }

  /* ---------------- 路由 ---------------- */

  function isValidRoute(path) {
    return !!ROUTE_META[path] || path === '/lost';
  }

  function normalizeRoute(path) {
    if (!path) return '/';
    let p = String(path).trim();
    if (p.indexOf('http://') === 0) p = p.slice(7);
    if (p.indexOf('https://') === 0) p = p.slice(8);
    p = p.replace(/^www\.huai-an-li\.net/i, '');
    p = p.replace(/^#/, '');
    if (p.charAt(0) !== '/') p = '/' + p;
    p = p.replace(/\/+$/, '') || '/';
    if (ROUTE_META[p]) return p;
    return p;
  }

  function parseAddress(raw) {
    let s = String(raw || '').trim();
    if (!s) return null;
    if (s.indexOf('#') === 0) return normalizeRoute(s);
    s = s.replace(/^https?:\/\//i, '');
    s = s.replace(/^www\.huai-an-li\.net\/?/i, '');
    s = s.replace(/^huai-an-li\.net\/?/i, '');
    const withQuery = s.toLowerCase();
    if (withQuery.indexOf('topic.asp?id=404') !== -1) return '/bbs/404';
    if (withQuery.indexOf('topic.asp?id=7') !== -1) return '/bbs/underground';
    s = s.split('?')[0].split('#')[0];
    s = s.replace(/^\/+/, '').replace(/\/+$/, '');
    const lower = s.toLowerCase();
    if (ALIASES[lower]) return ALIASES[lower];
    if (FILE_MAP[lower]) return FILE_MAP[lower];
    if (lower === '404' || lower === '404.htm') return '/404';
    if (lower.indexOf('topic.asp') !== -1) {
      if (lower.indexOf('404') !== -1) return '/bbs/404';
      return '/bbs/underground';
    }
    if (lower.indexOf('~xiaoman') !== -1) {
      return lower.indexOf('last') !== -1 ? '/diary/last' : '/diary';
    }
    const withSlash = '/' + lower;
    if (ROUTE_META[withSlash]) return withSlash;
    return null;
  }

  function routeFromHash() {
    const raw = window.location.hash || '';
    if (!raw || raw === '#') return null;
    return normalizeRoute(raw.replace(/^#/, ''));
  }

  function updateHash(path, replace) {
    const hash = '#' + path;
    if (window.location.hash === hash) return;
    try {
      if (replace) window.history.replaceState(null, '', hash);
      else window.history.pushState(null, '', hash);
    } catch (e) {
      window.location.hash = path;
    }
  }

  function checkRoute() {
    if (!isValidRoute(currentRoute)) currentRoute = '/lost';
  }

  function navigate(path, opts) {
    opts = opts || {};
    let target = normalizeRoute(path);
    if (!isValidRoute(target)) {
      state.lostQuery = path;
      target = '/lost';
    }
    if (target === currentRoute && !opts.force) {
      renderRoute(currentRoute, { updateHash: false });
      if (opts.scrollTop !== false) pageView.scrollTop = 0;
      return;
    }
    currentRoute = target;
    state.route = target;
    state.basementError = '';
    renderRoute(target, { updateHash: true, replace: !!opts.replace });
    if (opts.scrollTop !== false) {
      try { pageView.scrollTop = 0; } catch (e) { /* ignore */ }
      window.scrollTo(0, 0);
    }
  }

  function renderRoute(route, opts) {
    opts = opts || {};
    if (!state) return;
    renderToken += 1;
    if (chatTimer) { window.clearTimeout(chatTimer); chatTimer = null; }
    currentRoute = route;
    state.route = route;
    if (ENDING_IDS.indexOf(route.replace('/ending/', '')) !== -1 && route.indexOf('/ending/') === 0) {
      const id = route.replace('/ending/', '');
      if (state.endings.indexOf(id) === -1) state.endings.push(id);
    }
    if (state.visited.indexOf(route) === -1) state.visited.push(route);
    if (state.visited.length > 200) state.visited = state.visited.slice(-200);
    const meta = ROUTE_META[route] || { label: '页面不存在', file: 'error/404.htm', chapter: '系统' };
    let html = '';
    try {
      html = P.render(route, state);
    } catch (e) {
      console.error('[槐安里] 页面渲染失败：', e);
      html = '' +
        '<div class="error-page"><div class="error-inner">' +
          '<div class="error-code">500</div>' +
          '<div class="error-title">档案页损坏</div>' +
          '<div class="error-desc"><p>这个页面无法正确显示。可能是服务器硬盘又出现了坏道。</p>' +
          '<p><code>' + P.helpers.esc(e && e.message ? e.message : '未知错误') + '</code></p></div>' +
          '<div class="btn-row" style="justify-content:center"><button class="btn" data-action="refresh">重新载入</button><button class="btn" data-action="open-dev">打开开发者工具</button><a class="btn" href="#/" data-nav="/">返回首页</a></div>' +
        '</div></div>';
    }
    pageView.innerHTML = html;
    try { pageView.scrollTop = 0; } catch (e) { /* ignore */ }
    if (opts.updateHash !== false) {
      updateHash(route, !!opts.replace);
    }
    updateChrome(meta, route);
    AudioEngine.setMood(route);
    if (route === '/chat' && state.fragments.length >= 4 && !state.chatGreeted) {
      state.chatGreeted = true;
    }
    saveNow(true);
    if (route === '/chat') window.setTimeout(scrollChatToBottom, 80);
    if (route === '/underground' || route.indexOf('/ending/') === 0) {
      document.body.classList.add('dark-context');
    } else {
      document.body.classList.remove('dark-context');
    }
  }

  function updateChrome(meta, route) {
    const title = meta && meta.label ? meta.label : '页面不存在';
    const full = title + ' - 槐安里·我们的家';
    document.title = full;
    const wt = $('window-title');
    if (wt) wt.textContent = title + ' - Microsoft Internet Explorer';
    const fragCount = $('fragment-count');
    if (fragCount) fragCount.textContent = String((state.fragments || []).length);
    const addr = 'http://' + D.SITE.domain + '/' + (meta && meta.file ? meta.file : 'error/404.htm');
    if (addressInput && document.activeElement !== addressInput) addressInput.value = addr;
    const zone = $('zone-label');
    if (zone) zone.textContent = (meta && meta.chapter ? meta.chapter : '档案区');
    const sc = $('status-clock');
    if (sc) sc.textContent = D.SITE.archiveDate;
    setSaveStatus(storageAvailable ? '本地存档已连接' : '本地存档不可用');
    updateAudioUI();
    updateEffectsUI();
    const status = $('status-message');
    if (status) {
      if (route === '/underground') status.textContent = '正在读取 B2 层…… 信号很弱';
      else if (route.indexOf('/ending/') === 0) status.textContent = '网页已停止响应';
      else if (route === '/404') status.textContent = '错误：页面不在索引中';
      else status.textContent = '完成';
    }
    document.body.classList.toggle('route-ending', route.indexOf('/ending/') === 0);
    document.body.classList.toggle('route-dark', route === '/underground' || route === '/404');
  }

  /* ---------------- 音频 / 特效 UI ---------------- */

  function updateAudioUI() {
    const glyph = $('audio-glyph');
    const label = $('audio-label');
    const btn = $('audio-btn');
    if (glyph) glyph.textContent = state && state.audio ? '♪' : '×';
    if (label) label.textContent = state && state.audio ? '声音开' : '声音关';
    if (btn) btn.classList.toggle('is-on', !!(state && state.audio));
  }

  function updateEffectsUI() {
    const label = $('effects-label');
    if (label) label.textContent = state && state.effects !== false ? '特效开' : '特效关';
    document.body.classList.toggle('effects-on', !state || state.effects !== false);
    document.body.classList.toggle('effects-off', !!state && state.effects === false);
    if (state && state.effects === false) {
      document.body.classList.remove('effects-on');
      document.body.classList.add('effects-off');
    }
  }

  function toggleAudio() {
    if (!state) return;
    state.audio = !state.audio;
    AudioEngine.enabled = state.audio;
    AudioEngine.resume();
    AudioEngine.setEnabled(state.audio);
    updateAudioUI();
    saveNow(true);
    toast(state.audio ? '环境音已开启' : '环境音已关闭', state.audio ? '你听见了电脑风扇以外的东西。' : '房间突然安静了。', state.audio ? 'good' : '');
  }

  function toggleEffects() {
    if (!state) return;
    state.effects = !state.effects;
    updateEffectsUI();
    saveNow(true);
    toast(state.effects ? '视觉特效已开启' : '视觉特效已降低', state.effects ? '扫描线、闪烁和故障效果恢复。' : '已关闭闪烁、噪点与惊吓特效。', '');
  }

  /* ---------------- 声效快捷 ---------------- */

  function sfxCollect() { AudioEngine.collect(); }
  function sfxError() { AudioEngine.error(); }

  /* ============================================================
     以下是弹窗、交互与谜题逻辑。
     ============================================================ */

  /* ---------------- 弹窗基础 ---------------- */

  function openModal(opts) {
    opts = opts || {};
    overlayMode = 'modal';
    document.body.classList.add('modal-open');
    const cls = opts.size || '';
    const footer = opts.footer
      ? '<div class="modal-actions">' + opts.footer + '</div>'
      : '';
    overlayRoot.innerHTML = '' +
      '<div class="modal-backdrop" data-backdrop="1">' +
        '<div class="modal-window ' + cls + '" role="dialog" aria-modal="true" aria-label="' + P.helpers.esc(opts.title || '窗口') + '">' +
          '<div class="modal-titlebar"><span>' + P.helpers.esc(opts.title || '窗口') + '</span><button type="button" class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div>' +
          '<div class="modal-content">' + (opts.content || '') + footer + '</div>' +
          (opts.status ? '<div class="modal-statusbar">' + P.helpers.esc(opts.status) + '</div>' : '') +
        '</div>' +
      '</div>';
    const backdrop = overlayRoot.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeModal();
      });
    }
    window.setTimeout(function () {
      const focusable = overlayRoot.querySelector('.modal-content input:not([disabled]), .modal-content textarea:not([disabled]), .modal-content select:not([disabled]), .modal-content button, .modal-close');
      if (focusable) {
        try { focusable.focus(); } catch (e) { /* ignore */ }
      }
    }, 40);
  }

  function closeModal() {
    if (overlayMode !== 'modal') return;
    overlayRoot.innerHTML = '';
    overlayMode = null;
    document.body.classList.remove('modal-open');
    pendingConfirm = null;
  }

  function openMessage(title, message, opts) {
    opts = opts || {};
    openModal({
      title: title,
      size: opts.size || 'small',
      content: '<p>' + message + '</p>',
      footer: opts.footer || '<button type="button" class="win-btn" data-action="close-modal">确定</button>',
      status: opts.status || ''
    });
  }

  function confirmAction(title, message, yesLabel, callback) {
    pendingConfirm = callback;
    openModal({
      title: title,
      size: 'small',
      content: '<div class="confirm-line">' + message + '</div>',
      footer: '<button type="button" class="win-btn" data-action="close-modal">取消</button>' +
        '<button type="button" class="win-btn primary" data-action="confirm-yes">' + P.helpers.esc(yesLabel || '确定') + '</button>'
    });
  }

  /* ---------------- 邮件 ---------------- */

  function openMail() {
    if (!state) return;
    state.mailRead = true;
    saveNow(true);
    if (gameStarted) renderRoute(currentRoute, { updateHash: false });
    const content = '' +
      '<div class="email-fields">' +
        '<div><span class="field-label">发件人：</span><span class="field-value">gui@huai-an-li.net</span></div>' +
        '<div><span class="field-label">收件人：</span><span class="field-value">unknown@163.com</span></div>' +
        '<div><span class="field-label">发送时间：</span><span class="field-value">2001年9月14日 23:59:59</span></div>' +
        '<div><span class="field-label">主题：</span><span class="field-value"><b>请帮我按一次快门</b></span></div>' +
        '<div><span class="field-label">附件：</span><span class="field-value">无（附件已损坏）</span></div>' +
      '</div>' +
      '<div class="email-body">' +
        '<p>你好。</p>' +
        '<p>你打开的这份网页备份，来自槐安里社区。</p>' +
        '<p>他们都说7号楼没有404室，可我就住在那里。1999年的最后一天，大家拍了一张全家福。照片里少了一个人。</p>' +
        '<p>请帮我找齐七张底片，把照片拼好。不要相信公告栏。不要在地下室回头。如果听见有人叫你的名字，不要答应。</p>' +
        '<p>照片需要一个人。但不需要你替我消失。</p>' +
        '<p class="sig">—— 小满<br><span style="font-size:10px;color:#7b6a50">（这封信没有通过邮件服务器。它一直在你的收件箱里。）</span></p>' +
      '</div>';
    openModal({
      title: '新邮件 - Outlook Express',
      size: 'large',
      content: content,
      footer: '<button type="button" class="win-btn" data-action="close-modal">稍后再看</button>' +
        '<button type="button" class="win-btn primary" data-action="mail-open-link">打开信中的链接</button>',
      status: '1 封未读邮件 · 连接：本地脱机'
    });
  }

  /* ---------------- 底片归档 ---------------- */

  const FRAGMENT_CLUES = {
    f1: 'registry',
    f2: null,
    f3: 'entrance',
    f4: 'dontlook',
    f5: 'birthday',
    f6: 'photo_rule',
    f7: null
  };

  function addFragment(id, silent) {
    if (FRAGMENT_IDS.indexOf(id) === -1) return false;
    if (!state) return false;
    if (state.fragments.indexOf(id) !== -1) return false;
    state.fragments.push(id);
    const clue = FRAGMENT_CLUES[id];
    if (clue && state.clues.indexOf(clue) === -1) state.clues.push(clue);
    if (id === 'f6') state.chatFragmentGiven = true;
    saveNow(true);
    if (!silent) sfxCollect();
    return true;
  }

  function addClue(id, silent) {
    if (CLUE_IDS.indexOf(id) === -1) return false;
    if (!state) return false;
    if (state.clues.indexOf(id) !== -1) return false;
    state.clues.push(id);
    saveNow(true);
    if (!silent) AudioEngine.tone(440, 0.2, 'sine', 0.03, 0);
    return true;
  }

  function openFragmentModal(id) {
    const f = D.FRAGMENTS.filter(function (x) { return x.id === id; })[0];
    if (!f) return;
    const clueId = FRAGMENT_CLUES[id];
    const clue = clueId ? D.CLUES.filter(function (c) { return c.id === clueId; })[0] : null;
    const content = '' +
      '<div style="display:grid;grid-template-columns:150px minmax(0,1fr);gap:12px;align-items:start">' +
        '<div style="border:1px solid #8c7d61;padding:4px;background:#e1d7c0"><img src="' + P.helpers.esc(f.src) + '" alt="' + P.helpers.esc(f.title) + '" style="display:block;width:100%;filter:sepia(.25) contrast(1.06)"></div>' +
        '<div><p class="small" style="margin-bottom:4px">底片 ' + f.n + ' / 7 · ' + P.helpers.esc(f.source) + '</p>' +
          '<h2 style="margin:0 0 5px;color:#691111;font-family:var(--hei);font-size:15px;font-weight:normal">' + P.helpers.esc(f.title) + '</h2>' +
          '<p style="font-size:12px;line-height:1.9">' + P.helpers.esc(f.quote) + '</p>' +
          '<p class="small">' + P.helpers.esc(f.detail) + '</p>' +
          (clue ? '<div class="inline-note" style="margin-bottom:0"><b>线索已记录：</b>' + P.helpers.esc(clue.text) + '</div>' : '') +
        '</div>' +
      '</div>' +
      '<p class="small" style="margin-top:10px">当前进度：' + state.fragments.length + ' / 7。底片会自动保存在本机。</p>';
    openModal({
      title: '底片已归档 · ' + f.title,
      size: 'large',
      content: content,
      footer: '<button type="button" class="win-btn" data-action="close-modal">继续浏览</button>' +
        '<button type="button" class="win-btn" data-action="open-notebook">打开线索本</button>',
      status: '写入本地存档…… OK'
    });
  }

  function collectFragmentUI(id) {
    if (state.fragments.indexOf(id) !== -1) {
      toast('已经收集过了', '这张底片在你的线索本里。', '');
      return;
    }
    const added = addFragment(id, false);
    closeModal();
    if (!added) return;
    renderRoute(currentRoute, { updateHash: false });
    const f = D.FRAGMENTS.filter(function (x) { return x.id === id; })[0];
    toast('底片已归档', f ? f.title + ' · ' + state.fragments.length + '/7' : '进度已保存。', 'clue', 3200);
    window.setTimeout(function () { openFragmentModal(id); }, 220);
  }

  function clueFromUI(id) {
    if (!state) return;
    if (state.clues.indexOf(id) !== -1) {
      toast('线索已经记录过了', '打开线索本可以再查看。', '');
      return;
    }
    addClue(id, false);
    renderRoute(currentRoute, { updateHash: false });
    const c = D.CLUES.filter(function (x) { return x.id === id; })[0];
    toast('线索已记录', c ? c.title + '：' + c.text : '已写入线索本。', 'clue', 5200);
  }

  /* ---------------- 相册大图 ---------------- */

  function openLightbox(data) {
    if (!data || !data.photo) return;
    overlayMode = 'modal';
    document.body.classList.add('modal-open');
    const frag = data.fragment || '';
    const already = frag && state.fragments.indexOf(frag) !== -1;
    const collectButton = frag
      ? (already
        ? '<span class="tag">底片已收入线索本</span>'
        : '<button type="button" class="win-btn primary" data-action="collect-fragment" data-fragment="' + P.helpers.esc(frag) + '">收取这张底片</button>')
      : '';
    overlayRoot.innerHTML = '' +
      '<div class="modal-backdrop" data-backdrop="1">' +
        '<div class="lightbox-window" role="dialog" aria-modal="true" aria-label="照片查看器">' +
          '<div class="lightbox-title"><span>' + P.helpers.esc(data.title || '照片查看器') + ' · ' + P.helpers.esc(data.photo) + '</span><button type="button" class="modal-close" data-action="close-modal" aria-label="关闭">×</button></div>' +
          '<div class="lightbox-img-wrap"><img src="' + P.helpers.esc(data.photo) + '" alt="' + P.helpers.esc(data.title || '照片') + '"></div>' +
          '<div class="lightbox-caption"><b>' + P.helpers.esc(data.title || '') + '</b><br>' + P.helpers.esc(data.caption || '') + '</div>' +
          '<div class="modal-actions" style="padding:7px 10px;background:#c0c0c0;border-top:1px solid #888;margin:0">' +
            collectButton +
            '<button type="button" class="win-btn" data-action="close-modal">关闭</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    const backdrop = overlayRoot.querySelector('.modal-backdrop');
    if (backdrop) {
      backdrop.addEventListener('click', function (e) {
        if (e.target === backdrop) closeModal();
      });
    }
  }

  /* ---------------- 线索本 ---------------- */

  let notebookTab = 'fragments';

  function openNotebook(tab) {
    if (tab) notebookTab = tab;
    const n = state.fragments.length;
    const m = state.clues.length;
    let fragHTML = '';
    D.FRAGMENTS.forEach(function (f) {
      const got = state.fragments.indexOf(f.id) !== -1;
      fragHTML += '<div class="fragment-item' + (got ? '' : ' empty') + '">' +
        (got
          ? '<div class="fragment-thumb"><img src="' + P.helpers.esc(f.src) + '" alt=""></div>'
          : '<div class="fragment-thumb empty"><img src="assets/fragment-empty.svg" alt="未显影底片"></div>') +
        '<div><div class="frag-id">FRAGMENT ' + f.n + '</div>' +
          '<h4>' + (got ? P.helpers.esc(f.title) : '未找到的底片') + '</h4>' +
          '<p>' + (got ? P.helpers.esc(f.quote) : '这张底片还留在网页的某个角落。') + '</p>' +
        '</div>' +
      '</div>';
    });

    let clueHTML = '';
    D.CLUES.forEach(function (c) {
      const got = state.clues.indexOf(c.id) !== -1;
      clueHTML += '<li class="' + (got ? '' : 'empty') + '">' +
        (got
          ? P.helpers.esc(c.text) + '<span class="clue-source">来源：' + P.helpers.esc(c.source) + '</span>'
          : '尚未记录。') +
      '</li>';
    });

    const content = '' +
      '<div class="notebook-summary"><span>底片：<b>' + n + ' / 7</b> · 线索：<b>' + m + ' / ' + D.CLUES.length + '</b></span><span class="small">自动保存于本机</span></div>' +
      '<div class="tabs">' +
        '<button type="button" class="tab-btn ' + (notebookTab === 'fragments' ? 'active' : '') + '" data-action="notebook-tab" data-tab="fragments">底片档案（' + n + '）</button>' +
        '<button type="button" class="tab-btn ' + (notebookTab === 'clues' ? 'active' : '') + '" data-action="notebook-tab" data-tab="clues">线索记录（' + m + '）</button>' +
      '</div>' +
      '<div class="tab-panel ' + (notebookTab === 'fragments' ? 'active' : '') + '">' +
        '<div class="fragment-list">' + fragHTML + '</div>' +
        (n === 7 ? '<div class="inline-note">七张底片已经集齐。<a href="#/ritual" data-nav="/ritual">前往修复全家福</a></div>' : '<p class="small">提示：底片可能藏在公告、相册、BBS、留言本、个人主页、OICQ 和防空洞里。</p>') +
      '</div>' +
      '<div class="tab-panel ' + (notebookTab === 'clues' ? 'active' : '') + '">' +
        '<ul class="clue-list">' + clueHTML + '</ul>' +
      '</div>';

    openModal({
      title: '线索本 · 槐安里档案修复计划',
      size: 'large',
      content: content,
      footer: (n === 7 ? '<a class="win-btn primary" href="#/ritual" data-nav="/ritual">去修复全家福</a>' : '') +
        '<button type="button" class="win-btn" data-action="close-modal">关闭</button>',
      status: '线索只保存在本地浏览器 · 不会上传'
    });
  }

  /* ---------------- 源代码 ---------------- */

  const SOURCE_MAP = {
    '/': [
      '<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">',
      '<html>',
      '<head>',
      '<title>槐安里·我们的家</title>',
      '<meta http-equiv="Content-Type" content="text/html; charset=gb2312">',
      '<!-- 本站由阿哲维护。服务器在我家阳台上。 -->',
      '<!-- 如果你能看到这里，请去留言本第404条。 -->',
      '<!-- 不要相信公告栏。 -->',
      '</head>',
      '<body bgcolor="#F4EFE2" text="#181716" link="#0000C8">',
      '<center><font face="楷体" size="6" color="#7D0C0C">槐安里·我们的家</font></center>',
      '<!-- 小满：如果照片洗出来，我把你放在最后一排右边。 -->',
      '</body>',
      '</html>'
    ].join('\n'),
    '/notice': [
      '<html><head><title>社区公告</title></head>',
      '<body bgcolor="#F4EFE2">',
      '<!-- 第100户名单是空的。居委会说“统一安排”。 -->',
      '<!-- 404室登记为仓库。但仓库没有窗户。 -->',
      '<!-- 附件：合影底片_099.jpg 扫描件损坏 -->',
      '</body></html>'
    ].join('\n'),
    '/diary': [
      '<html><head><title>纸飞机的小窝</title></head>',
      '<body bgcolor="#FBF2DF">',
      '<!-- 我的生日：1987.11.07 -->',
      '<!-- 门锁密码：1107 -->',
      '<!-- 阿哲哥说，如果听见有人叫我，不要回头。 -->',
      '</body></html>'
    ].join('\n'),
    '/about': [
      '<html><head><title>站长的话</title></head>',
      '<body>',
      '<!-- 2000-01-01 00:03 我没有开门。 -->',
      '<!-- 404.htm 仍然存在。它不在导航里。 -->',
      '<!-- 对不起。 -->',
      '</body></html>'
    ].join('\n'),
    '/search': [
      '<html><head><title>站内搜索</title></head>',
      '<body>',
      '<!-- 结果总数：18 + 1（未索引） -->',
      '<!-- 未索引页面：404.htm -->',
      '<!-- 搜索“阿哲”可以看到。 -->',
      '</body></html>'
    ].join('\n'),
    '/404': [
      '<html><head><title>404</title></head>',
      '<body bgcolor="#000000" text="#888888">',
      '<!-- 这里没有404室。 -->',
      '<!-- 这里从来没有住过人。 -->',
      '<!-- 你来了。 -->',
      '</body></html>'
    ].join('\n'),
    '/ritual': [
      '<html><head><title>修复全家福</title></head>',
      '<body>',
      '<!-- 照片缺的不是人，是一个名字。 -->',
      '<!-- 名单格式：姓名 + 户号。 -->',
      '<!-- 不要把我自己写上去。 -->',
      '</body></html>'
    ].join('\n')
  };

  function openSource() {
    let src = SOURCE_MAP[currentRoute];
    if (!src) {
      src = [
        '<html>',
        '<head><title>' + (ROUTE_META[currentRoute] ? ROUTE_META[currentRoute].label : '未命名页面') + '</title></head>',
        '<body bgcolor="#F4EFE2">',
        '<!-- 该页面的源代码已丢失。 -->',
        '<!-- 只有底片还在。 -->',
        '</body>',
        '</html>'
      ].join('\n');
    }
    sourceForCopy = src;
    openModal({
      title: '查看源代码 - ' + (ROUTE_META[currentRoute] ? ROUTE_META[currentRoute].file : 'unknown.htm'),
      size: 'large',
      content: '<div class="small" style="margin-bottom:6px">只读。部分注释可能已被服务器删除。</div>' +
        '<pre class="dev-state" style="max-height:360px;color:#c9d6b4;background:#0b0d0a">' + P.helpers.esc(src) + '</pre>',
      footer: '<button type="button" class="win-btn" data-action="copy-source">复制源代码</button><button type="button" class="win-btn" data-action="close-modal">关闭</button>',
      status: '源文件：本地缓存副本'
    });
  }

  /* ---------------- 开发者工具 ---------------- */

  function openDev() {
    if (devUnlocked) {
      showDevPanel();
      return;
    }
    openModal({
      title: '站点维护 · 身份验证',
      size: 'small',
      content: '<p>此页面仅供站点维护人员使用。请输入维护密码。</p>' +
        '<form data-form="dev-login" autocomplete="off">' +
          '<div class="dev-password-row"><input type="password" class="retro-input" name="password" id="dev-password" maxlength="32" placeholder="维护密码" aria-label="维护密码"><button type="submit" class="win-btn primary">验证</button></div>' +
          '<p class="dev-hint" style="margin-top:8px">密码由档案修复人员持有。连续输错不会锁定，但会被记录。</p>' +
        '</form>',
      footer: '<button type="button" class="win-btn" data-action="close-modal">取消</button>',
      status: 'DEV ACCESS · 未验证'
    });
  }

  function showDevPanel() {
    const routeOptions = D.ROUTES.map(function (r) {
      let lock = 'open';
      let lockText = '可访问';
      if (r.path === '/diary/last' && state.fragments.indexOf('f5') === -1) { lock = 'locked'; lockText = '需f5'; }
      if (r.path === '/ritual' && state.fragments.length < 7) { lock = 'locked'; lockText = '需7底片'; }
      if (r.ending) {
        const id = r.path.replace('/ending/', '');
        const on = state.endings.indexOf(id) !== -1;
        lock = on ? 'open' : 'locked';
        lockText = on ? '已解锁' : '未抵达';
      }
      if (r.path === '/underground' && !state.gateOpen) { lock = 'locked'; lockText = '门锁'; }
      if (r.path === '/404') { lock = 'locked'; lockText = '隐藏'; }
      return '<button type="button" class="dev-route-item" data-action="dev-jump" data-route="' + P.helpers.esc(r.path) + '" title="' + P.helpers.esc(r.desc) + '">' +
        '<span class="dev-route-name">' + P.helpers.esc(r.path) + ' · ' + P.helpers.esc(r.label) + '</span>' +
        '<span class="lock-mark ' + lock + '">' + P.helpers.esc(lockText) + '</span>' +
      '</button>';
    }).join('');

    const flags = [
      ['mailRead', '邮件已读'],
      ['gateOpen', '防空洞铁门'],
      ['ritualDeveloped', '全家福已显影'],
      ['chatFragmentGiven', 'OICQ文件已发']
    ].map(function (f) {
      const on = !!state[f[0]];
      return '<div class="dev-flag-row"><span>' + P.helpers.esc(f[0]) + ' · ' + P.helpers.esc(f[1]) + '</span><button type="button" class="btn small" data-action="dev-set-flag" data-flag="' + P.helpers.esc(f[0]) + '" data-value="' + (on ? 'false' : 'true') + '">' + (on ? 'ON' : 'OFF') + '</button></div>';
    }).join('');

    const stageOptions = [0, 1, 2, 3, 4, 5, 6].map(function (i) {
      return '<option value="' + i + '"' + (Number(state.basementStage) === i ? ' selected' : '') + '>阶段 ' + i + '</option>';
    }).join('');

    const content = '' +
      '<div class="dev-toolbar">' +
        '<span class="dev-badge">DEV MODE</span>' +
        '<span class="dev-path">' + P.helpers.esc(currentRoute) + ' · 底片 ' + state.fragments.length + '/7 · 结局 ' + state.endings.length + '/3</span>' +
        '<button type="button" class="btn small" data-action="dev-refresh">刷新面板</button>' +
        '<button type="button" class="btn small" data-action="dev-reload">重载页面</button>' +
      '</div>' +
      '<div class="dev-grid">' +
        '<div class="dev-box">' +
          '<h4>底片 / 线索</h4>' +
          '<div class="small">当前：底片 ' + state.fragments.length + '/7 · 线索 ' + state.clues.length + '/' + D.CLUES.length + '</div>' +
          '<div class="btn-row">' +
            '<button type="button" class="btn small" data-action="dev-fill-fragments">全部底片</button>' +
            '<button type="button" class="btn small" data-action="dev-clear-fragments">清空底片</button>' +
            '<button type="button" class="btn small" data-action="dev-fill-clues">全部线索</button>' +
            '<button type="button" class="btn small" data-action="dev-clear-clues">清空线索</button>' +
          '</div>' +
          '<div class="btn-row"><button type="button" class="btn small primary" data-action="dev-full-progress">一键满进度</button><button type="button" class="btn small" data-action="dev-reset">重置进度</button></div>' +
        '</div>' +
        '<div class="dev-box">' +
          '<h4>状态旗标</h4>' + flags +
          '<div class="form-row" style="margin-top:6px"><label for="dev-stage">地下阶段</label><select id="dev-stage" class="retro-select">' + stageOptions + '</select><button type="button" class="btn small" data-action="dev-apply-stage">应用</button></div>' +
          '<div class="small">gateOpen = 铁门已开；basementStage 0–6。</div>' +
        '</div>' +
      '</div>' +
      '<div class="dev-section">' +
        '<h3>任意页面跳转（' + D.ROUTES.length + ' 个）</h3>' +
        '<div class="dev-route-list">' + routeOptions + '</div>' +
        '<div class="small" style="margin-top:4px">直接跳转不会绕过页面内部的条件判断；需要时可先修改状态旗标或“一键满进度”。</div>' +
      '</div>' +
      '<div class="dev-section">' +
        '<h3>存档快照</h3>' +
        '<pre class="dev-state">' + P.helpers.esc(JSON.stringify(state, null, 2)) + '</pre>' +
      '</div>' +
      '<div class="small">密码验证已通过。开发者工具只在当前标签页会话内保持解锁。存档键：' + SAVE_KEY + '</div>';

    openModal({
      title: '开发者工具 · 槐安里档案修复',
      size: 'wide',
      content: content,
      footer: '<button type="button" class="win-btn" data-action="close-modal">关闭开发者工具</button>' +
        '<button type="button" class="win-btn primary" data-action="dev-jump" data-route="/">回到首页</button>',
      status: 'DEV ACCESS GRANTED · 修改会立即写入本地存档'
    });
  }

  /* ---------------- 惊吓与故障 ---------------- */

  function triggerScare(text) {
    if (!state || state.effects === false) {
      if (text) toast('你回头了', text, 'bad', 5000);
      return;
    }
    const now = Date.now();
    if (now - lastScareAt < 1800) return;
    lastScareAt = now;
    const flash = document.createElement('div');
    flash.className = 'glitch-flash';
    document.body.appendChild(flash);
    window.setTimeout(function () { if (flash.parentNode) flash.parentNode.removeChild(flash); }, 620);

    const scare = document.createElement('div');
    scare.className = 'jumpscare';
    scare.setAttribute('aria-hidden', 'true');
    scare.innerHTML = '<div class="scare-face"></div>';
    document.body.appendChild(scare);
    AudioEngine.scare();
    window.setTimeout(function () { if (scare.parentNode) scare.parentNode.removeChild(scare); }, 1350);
    if (text) {
      window.setTimeout(function () { toast('你回头了', text, 'bad', 5200); }, 900);
    }
  }

  /* ---------------- 地下室 ---------------- */

  function handleGateSubmit(form) {
    const code = String((form.elements.code && form.elements.code.value) || '').trim();
    if (state.fragments.length < 6) {
      state.basementError = '底片不够，门锁没有反应。';
      sfxError();
      toast('门没有反应', '你手里的底片还不够。至少需要六张。', 'bad');
      return;
    }
    if (code === '1107') {
      state.gateOpen = true;
      state.basementError = '';
      state.basementStage = 1;
      state.basementAttempts = 0;
      saveNow(true);
      AudioEngine.door();
      renderRoute('/underground', { updateHash: false });
      toast('锁开了', '铁门向内弹开一条缝。里面没有回声。', 'good', 4200);
    } else {
      state.basementAttempts += 1;
      state.basementError = '密码错误。';
      saveNow(true);
      sfxError();
      const formEl = $('gate-code');
      if (formEl) {
        formEl.classList.remove('shake');
        void formEl.offsetWidth;
        formEl.classList.add('shake');
        formEl.select();
      }
      toast('密码错误', '门后传来一声很轻的笑。它记住了你的声音。', 'bad', 4200);
    }
  }

  function basementNext() {
    const stage = Math.max(1, Number(state.basementStage) || 1);
    if (stage < 5) {
      state.basementStage = Math.min(5, stage + 1);
      saveNow(true);
      AudioEngine.tone(220, 0.3, 'sine', 0.025, 0);
      renderRoute('/underground', { updateHash: false });
      try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
    }
  }

  function basementTake() {
    if (state.fragments.indexOf('f7') === -1) {
      addFragment('f7', false);
      state.basementStage = 5;
      saveNow(true);
      renderRoute('/underground', { updateHash: false });
      toast('最后一张底片', '相纸边缘烫着你的手指。背后的声音停住了。', 'clue', 4800);
    } else {
      state.basementStage = 5;
      saveNow(true);
      renderRoute('/underground', { updateHash: false });
    }
  }

  function basementEscape() {
    state.basementStage = 6;
    saveNow(true);
    AudioEngine.door();
    renderRoute('/underground', { updateHash: false });
    toast('你没有回头', '天快亮了。七张底片都在你手里。', 'good', 5000);
  }

  function basementLookback() {
    const hadFragment = state.fragments.indexOf('f7') !== -1;
    triggerScare('背后没有人。只有一张刚冲洗出来的照片，掉在地上。照片里是你。');
    window.setTimeout(function () {
      if (!gameStarted) return;
      state.fragments = state.fragments.filter(function (x) { return x !== 'f7'; });
      state.basementStage = 1;
      state.basementError = '';
      saveNow(true);
      renderRoute('/underground', { updateHash: false });
      openMessage(
        '你回头了',
        '<p>你不记得自己是怎么回到门口的。</p><p>手里的底片不见了。铁门还开着，向下的坡道里传来数数的声音。</p><p class="red">“九十八，九十九，一百……”</p>' +
        (hadFragment ? '<p>最后一张底片重新回到了墙缝里。你需要再走一次。</p>' : '<p>你还没有拿到最后一张底片。不要回头。</p>'),
        { size: 'small', status: 'B2 · 记录已覆盖' }
      );
      AudioEngine.error();
    }, 1280);
  }

  function basementBack() {
    navigate('/bbs/underground');
  }

  function basementFinish() {
    navigate('/ritual');
  }

  /* ---------------- 修复全家福与结局 ---------------- */

  function developRitual() {
    state.ritualDeveloped = true;
    state.ritualChoice = '';
    state.ritualError = '';
    saveNow(true);
    AudioEngine.collect();
    renderRoute('/ritual', { updateHash: false });
    toast('显影完成', '照片里有一百个位置。只有九十九个人。', 'clue', 4600);
    window.setTimeout(function () {
      const el = document.querySelector('.ritual-choices');
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }

  function chooseRitual(choice) {
    if (['remember', 'replace', 'forget'].indexOf(choice) === -1) return;
    state.ritualChoice = choice;
    state.ritualError = '';
    saveNow(true);
    renderRoute('/ritual', { updateHash: false });
    if (choice !== 'forget') {
      window.setTimeout(function () {
        const el = document.querySelector('.ritual-form');
        if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const input = el ? el.querySelector('input') : null;
        if (input) input.focus();
      }, 120);
    }
  }

  function cancelRitual() {
    state.ritualChoice = '';
    state.ritualError = '';
    saveNow(true);
    renderRoute('/ritual', { updateHash: false });
  }

  function unlockEnding(id) {
    if (!state) return;
    if (ENDING_IDS.indexOf(id) === -1) return;
    if (state.endings.indexOf(id) === -1) state.endings.push(id);
    saveNow(true);
  }

  function goEnding(id) {
    unlockEnding(id);
    navigate('/ending/' + id, { scrollTop: true });
  }

  function submitRitualName(form) {
    const raw = String((form.elements.name && form.elements.name.value) || '').trim();
    const normalized = raw.replace(/\s+/g, '');
    if (normalized === '沈小满' || normalized === '小满') {
      goEnding('remember');
      AudioEngine.collect();
      return;
    }
    state.ritualError = '名单上没有这个名字。请写下照片里缺掉的那个人的全名。';
    saveNow(true);
    sfxError();
    renderRoute('/ritual', { updateHash: false });
    toast('名单拒绝了这个名字', '笔尖停在纸上。名单只认识一个名字。', 'bad', 4300);
  }

  function submitReplaceName(form) {
    const name = String((form.elements.name && form.elements.name.value) || '').trim().slice(0, 20);
    if (!name) {
      toast('姓名不能为空', '第100户需要一个人。', 'bad');
      return;
    }
    state.playerName = name;
    saveNow(true);
    goEnding('replace');
    triggerScare('窗口无法关闭。');
  }

  function chooseForget() {
    confirmAction(
      '关闭网页',
      '删除本地存档，并关闭这个网页？<br>这个操作不会保留你的底片与线索。',
      '删除并关闭',
      function () {
        state.fragments = [];
        state.clues = [];
        state.chatLog = [];
        state.chatFragmentGiven = false;
        state.chatGreeted = false;
        state.gateOpen = false;
        state.basementStage = 0;
        state.ritualDeveloped = false;
        state.ritualChoice = '';
        state.playerName = '';
        state.mailRead = true;
        unlockEnding('forget');
        goEnding('forget');
      }
    );
  }

  function restartGame() {
    confirmAction(
      '重新开始',
      '确定要重新开始吗？<br>当前进度会被清除，已经发现的结局会保留。',
      '重新开始',
      function () {
        resetProgress(true);
        saveNow(true);
        renderRoute('/', { updateHash: true, replace: true });
        toast('已重新开始', '你再次收到了一封来自2001年的邮件。', '', 3000);
        window.setTimeout(function () { if (gameStarted && !state.mailRead) openMail(); }, 500);
      }
    );
  }

  /* ---------------- OICQ ---------------- */

  function isChatOnline() {
    return state && state.fragments.length >= 4;
  }

  function chatKeyFromText(text) {
    const t = String(text || '');
    for (let i = 0; i < D.CHAT.keywords.length; i++) {
      const item = D.CHAT.keywords[i];
      for (let j = 0; j < item.words.length; j++) {
        if (t.indexOf(item.words[j]) !== -1) return item.key;
      }
    }
    return 'unknown';
  }

  function scrollChatToBottom() {
    const box = $('chat-messages');
    if (box) box.scrollTop = box.scrollHeight;
  }

  function sendChat(explicitKey, text) {
    if (!gameStarted) return;
    if (!isChatOnline()) {
      sfxError();
      toast('对方不在线', '消息没有送达。至少找到四张底片后，她才会出现。', 'bad', 4200);
      return;
    }
    const message = String(text || (D.CHAT.quick.filter(function (q) { return q.key === explicitKey; })[0] || {}).label || '').trim();
    if (!message) return;
    const key = explicitKey || chatKeyFromText(message);
    state.chatLog.push({ who: 'self', text: message });
    state.chatLog = state.chatLog.slice(-160);
    saveNow(true);
    renderRoute('/chat', { updateHash: false });
    const typing = $('chat-typing');
    if (typing) typing.textContent = '纸飞机 正在输入……';
    scrollChatToBottom();
    if (chatTimer) window.clearTimeout(chatTimer);
    const token = renderToken;
    chatTimer = window.setTimeout(function () {
      if (!gameStarted || token !== renderToken || currentRoute !== '/chat') return;
      const replies = (D.CHAT.replies[key] || D.CHAT.replies.unknown).slice();
      let giveFile = false;
      if (!state.chatFragmentGiven && ['photo', 'help', 'remember'].indexOf(key) !== -1) {
        giveFile = true;
      }
      if (key === 'basement') addClue('entrance', true);
      if (key === 'photo' || key === 'help') addClue('photo_rule', true);
      if (key === 'remember') addClue('photo_rule', true);
      replies.forEach(function (m) {
        state.chatLog.push({ who: m.who, text: m.text });
      });
      if (giveFile) {
        addFragment('f6', true);
        state.chatLog.push({
          who: 'file',
          name: '地下室台阶.jpg',
          src: 'assets/photo-basement.svg',
          caption: '接收于 2000-01-01 00:00:00。发送者状态：离线。照片右下角有一只红色的小鞋。'
        });
        state.chatLog.push({ who: 'ghost', text: '最后一张在墙里。你到了就会知道。别回头。' });
        AudioEngine.collect();
        toast('收到文件', '地下室台阶.jpg 已保存到线索本。底片 ' + state.fragments.length + '/7。', 'clue', 5200);
      } else {
        AudioEngine.tone(330, 0.12, 'sine', 0.02, 0);
      }
      state.chatLog = state.chatLog.slice(-160);
      state.chatGreeted = true;
      saveNow(true);
      renderRoute('/chat', { updateHash: false });
      scrollChatToBottom();
      chatTimer = null;
    }, 820);
  }

  /* ---------------- 搜索 / 其他 ---------------- */

  function runSearch(q) {
    state.searchQuery = String(q || '').trim().slice(0, 60);
    saveNow(true);
    if (currentRoute !== '/search') navigate('/search');
    else renderRoute('/search', { updateHash: false });
    window.setTimeout(function () {
      const input = document.querySelector('input[name="q"]');
      if (input) input.focus();
    }, 80);
  }

  function submitGuestbook(form) {
    const name = String((form.elements.name && form.elements.name.value) || '').trim().slice(0, 20) || '匿名访客';
    const message = String((form.elements.message && form.elements.message.value) || '').trim().slice(0, 180);
    if (!message) {
      toast('留言为空', '写点什么。哪怕只是一个名字。', 'bad');
      return;
    }
    state.guestbook.push({
      name: name,
      message: message,
      time: '2001-09-14 23:59'
    });
    state.guestbook = state.guestbook.slice(-30);
    saveNow(true);
    renderRoute('/guestbook', { updateHash: false });
    toast('留言已提交', '系统显示：待审核。管理员上次登录于2001年。', 'good', 4300);
    window.setTimeout(function () {
      const entries = document.querySelectorAll('.guest-entry');
      const last = entries[entries.length - 1];
      if (last && last.scrollIntoView) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 200);
  }

  function devFillFragments() {
    FRAGMENT_IDS.forEach(function (id) {
      if (state.fragments.indexOf(id) === -1) state.fragments.push(id);
    });
    saveNow(true);
    renderRoute(currentRoute, { updateHash: false });
    showDevPanel();
    toast('DEV', '已解锁全部底片。', 'good');
  }

  function devClearFragments() {
    state.fragments = [];
    state.gateOpen = false;
    state.basementStage = 0;
    state.ritualDeveloped = false;
    saveNow(true);
    renderRoute(currentRoute, { updateHash: false });
    showDevPanel();
    toast('DEV', '底片与门锁状态已清空。', '');
  }

  function devFillClues() {
    CLUE_IDS.forEach(function (id) {
      if (state.clues.indexOf(id) === -1) state.clues.push(id);
    });
    saveNow(true);
    renderRoute(currentRoute, { updateHash: false });
    showDevPanel();
    toast('DEV', '已解锁全部线索。', 'good');
  }

  function devClearClues() {
    state.clues = [];
    saveNow(true);
    renderRoute(currentRoute, { updateHash: false });
    showDevPanel();
    toast('DEV', '线索已清空。', '');
  }

  function devFullProgress() {
    devFillFragments();
    CLUE_IDS.forEach(function (id) {
      if (state.clues.indexOf(id) === -1) state.clues.push(id);
    });
    state.gateOpen = true;
    state.basementStage = 6;
    state.chatFragmentGiven = true;
    state.chatGreeted = true;
    state.ritualDeveloped = false;
    saveNow(true);
    renderRoute(currentRoute, { updateHash: false });
    showDevPanel();
    toast('DEV', '一键满进度完成：7张底片、全部线索、铁门已开。', 'good');
  }

  function devReset() {
    confirmAction(
      'DEV · 重置进度',
      '清空底片、线索、聊天记录和结局，但保留声音与特效设置？',
      '重置进度',
      function () {
        const effects = state.effects;
        const audio = state.audio;
        state = defaultState();
        state.effects = effects;
        state.audio = audio;
        currentRoute = '/';
        saveNow(true);
        renderRoute('/', { updateHash: true, replace: true });
        showDevPanel();
        toast('DEV', '进度已重置。', '');
      }
    );
  }

  function copyText(text, label) {
    if (!text) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          toast('已复制', label || '内容已复制到剪贴板。', 'good');
        }).catch(function () {
          toast('复制失败', '浏览器拒绝了剪贴板访问。请手动选择文本。', 'bad');
        });
      } else {
        toast('无法自动复制', '请手动选择文本。', '');
      }
    } catch (e) {
      toast('无法自动复制', '请手动选择文本。', '');
    }
  }

  /* ---------------- 菜单 / 伪关闭 ---------------- */

  function handleMenu(menu) {
    const map = {
      file: ['文件', '<p>此网页为只读档案。</p><p>“另存为”功能已被服务器禁用。保存下来的文件只有一张白纸。</p>'],
      edit: ['编辑', '<p>无法复制。</p><p>照片上的字不在文本层里。它们是在底片上曝光的。</p>'],
      view: ['查看', '<p>页面源文件为只读。</p><p>你可以使用工具栏的“查看源代码”，或者按 F5 重新载入。</p>'],
      favorites: ['收藏夹', '<p>已添加到收藏夹：<b>槐安里·我们的家</b>。</p><p>书签无法删除。下次打开浏览器时，它还会在这里。</p>'],
      tools: ['工具', '<p>Internet 选项：</p><p>主页已被锁定为 <code>http://www.huai-an-li.net/</code>。<br>清除历史记录：失败。<br>脱机工作：已启用。</p><p>站点维护入口位于页面底部，或使用工具栏的“维护”。</p>'],
      help: ['帮助', '<p><b>Microsoft Internet Explorer 5.0</b></p><p>本档案由槐安里社区提供。部分页面可能无法在当前浏览器中正确显示。</p><p>如果网页自行滚动，请不要惊慌。那是服务器在调整频率。</p>']
    };
    const m = map[menu];
    if (m) openMessage(m[0], m[1], { status: '帮助主题：浏览本地档案' });
  }

  function fakeClose() {
    openMessage(
      '无法关闭窗口',
      '<p>你点击了关闭按钮。</p><p>窗口没有关闭。</p><p>任务栏上的“槐安里·我们的家”仍然亮着。你听见硬盘转了两圈，然后停了。</p><p class="red">“照片还没有修好。”</p>',
      { size: 'small', status: 'IEXPLORE.EXE · 无响应' }
    );
  }

  function fakeMinimize() {
    toast('窗口已最小化', '但它又自己弹了回来。', '', 2800);
  }

  /* ---------------- 动作分发 ---------------- */

  function handleAction(action, el) {
    if (!action) return;
    switch (action) {
      case 'boot-continue': {
        const saved = loadSave();
        if (saved) beginGame('resume', saved);
        else beginGame('new');
        break;
      }
      case 'boot-new': {
        const saved = loadSave();
        if (saved && !bootNewArmed) {
          readBootPrefs();
          bootNewArmed = true;
          showBoot(saved);
          toast('重新开始', '再次点击“确认清空存档并重新开始”将删除本地进度。', 'bad', 4200);
        } else {
          bootNewArmed = false;
          resetProgress(false);
          clearSave();
          beginGame('new');
        }
        break;
      }
      case 'mail-open-link':
        closeModal();
        state.mailRead = true;
        saveNow(true);
        navigate('/notice');
        break;
      case 'open-mail':
        openMail();
        break;
      case 'close-modal':
        closeModal();
        break;
      case 'confirm-yes': {
        const cb = pendingConfirm;
        pendingConfirm = null;
        closeModal();
        if (typeof cb === 'function') cb();
        break;
      }
      case 'open-notebook':
        openNotebook();
        break;
      case 'notebook-tab':
        openNotebook(el.dataset.tab || 'fragments');
        break;
      case 'open-dev':
        openDev();
        break;
      case 'dev-jump': {
        const target = el.dataset.route;
        closeModal();
        if (target) {
          AudioEngine.tone(520, 0.12, 'sine', 0.03, 0);
          navigate(target, { force: true });
        }
        break;
      }
      case 'dev-fill-fragments': devFillFragments(); break;
      case 'dev-clear-fragments': devClearFragments(); break;
      case 'dev-fill-clues': devFillClues(); break;
      case 'dev-clear-clues': devClearClues(); break;
      case 'dev-full-progress': devFullProgress(); break;
      case 'dev-reset': devReset(); break;
      case 'dev-refresh': showDevPanel(); break;
      case 'dev-reload':
        saveNow(true);
        window.location.reload();
        break;
      case 'dev-set-flag': {
        const flag = el.dataset.flag;
        if (['mailRead', 'gateOpen', 'ritualDeveloped', 'chatFragmentGiven'].indexOf(flag) !== -1) {
          state[flag] = el.dataset.value === 'true';
          saveNow(true);
          renderRoute(currentRoute, { updateHash: false });
          showDevPanel();
          toast('DEV', flag + ' = ' + state[flag], 'good');
        }
        break;
      }
      case 'dev-apply-stage': {
        const sel = $('dev-stage');
        const v = sel ? parseInt(sel.value, 10) : 0;
        state.basementStage = Math.max(0, Math.min(6, v));
        if (state.basementStage > 0) state.gateOpen = true;
        saveNow(true);
        renderRoute(currentRoute, { updateHash: false });
        showDevPanel();
        toast('DEV', '地下阶段 = ' + state.basementStage, 'good');
        break;
      }
      case 'view-source': openSource(); break;
      case 'copy-source': copyText(sourceForCopy, '源代码已复制。'); break;
      case 'collect-fragment': collectFragmentUI(el.dataset.fragment); break;
      case 'add-clue': clueFromUI(el.dataset.clue); break;
      case 'open-photo':
        openLightbox({
          photo: el.dataset.photo,
          title: el.dataset.title,
          caption: el.dataset.caption,
          fragment: el.dataset.fragment
        });
        break;
      case 'dead-link':
        openMessage('网页无法显示', '<p>' + P.helpers.esc(el.dataset.message || '该网页暂时不可用。') + '</p><p class="small">HTTP 404 · 无法找到该页面。</p>', { status: '脱机浏览 · 缓存中没有副本' });
        break;
      case 'scroll-to': {
        const target = document.getElementById(el.dataset.target || '');
        if (target) target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
      case 'search-preset':
        runSearch(el.dataset.query || '');
        break;
      case 'chat-quick':
        sendChat(el.dataset.key, (D.CHAT.quick.filter(function (q) { return q.key === el.dataset.key; })[0] || {}).label);
        break;
      case 'basement-back': basementBack(); break;
      case 'basement-next': basementNext(); break;
      case 'basement-take': basementTake(); break;
      case 'basement-escape': basementEscape(); break;
      case 'basement-lookback': basementLookback(); break;
      case 'basement-finish': basementFinish(); break;
      case 'ritual-develop': developRitual(); break;
      case 'ritual-choice': chooseRitual(el.dataset.choice); break;
      case 'ritual-cancel': cancelRitual(); break;
      case 'choose-forget': chooseForget(); break;
      case 'restart-game': restartGame(); break;
      case 'fake-close': fakeClose(); break;
      case 'fake-minimize': fakeMinimize(); break;
      case 'fake-maximize':
        toast('无法最大化', '窗口尺寸由服务器控制。它比你想象的更小。', '', 3200);
        break;
      case 'back':
        window.history.back();
        break;
      case 'forward':
        window.history.forward();
        break;
      case 'stop':
        toast('已停止载入', '但网页已经加载完了。你在等什么？', '', 2800);
        break;
      case 'refresh':
        renderRoute(currentRoute, { updateHash: false });
        toast('已重新载入', '页面回到了最初的样子。除了你收集过的东西。', '', 2800);
        break;
      case 'home':
        navigate('/');
        break;
      case 'open-search':
        navigate('/search');
        window.setTimeout(function () {
          const input = document.querySelector('input[name="q"]');
          if (input) input.focus();
        }, 100);
        break;
      case 'go':
        submitAddress();
        break;
      case 'toggle-audio': toggleAudio(); break;
      case 'toggle-effects': toggleEffects(); break;
      default:
        console.warn('[槐安里] 未处理的动作：', action);
    }
  }

  /* ---------------- 表单 ---------------- */

  function handleSubmit(form) {
    const type = form.dataset.form;
    if (!type) return;
    if (type === 'dev-login') {
      const input = form.querySelector('input[name="password"]');
      const value = input ? input.value : '';
      if (value === DEV_PASSWORD) {
        devUnlocked = true;
        try { window.sessionStorage.setItem(DEV_SESSION_KEY, '1'); } catch (e) { /* ignore */ }
        showDevPanel();
        toast('验证通过', '开发者工具已解锁。', 'good');
        AudioEngine.tone(660, 0.2, 'sine', 0.04, 0);
      } else {
        sfxError();
        if (input) {
          input.value = '';
          input.classList.remove('shake');
          void input.offsetWidth;
          input.classList.add('shake');
          input.focus();
        }
        toast('密码错误', '维护密码不正确。错误尝试已被记录。', 'bad');
      }
      return;
    }
    if (type === 'gate') {
      handleGateSubmit(form);
      return;
    }
    if (type === 'search') {
      const input = form.querySelector('input[name="q"]');
      runSearch(input ? input.value : '');
      return;
    }
    if (type === 'guestbook') {
      submitGuestbook(form);
      return;
    }
    if (type === 'chat') {
      const input = form.querySelector('[name="message"]');
      const text = input ? input.value : '';
      if (!text.trim()) {
        toast('没有内容', '输入一句话，或者点击下面的快捷回复。', '');
        return;
      }
      sendChat(null, text);
      return;
    }
    if (type === 'ritual-name') {
      submitRitualName(form);
      return;
    }
    if (type === 'ritual-replace') {
      submitReplaceName(form);
      return;
    }
  }

  /* ---------------- 地址栏 ---------------- */

  function submitAddress() {
    if (!addressInput) return;
    const raw = addressInput.value;
    const parsed = parseAddress(raw);
    if (!parsed) {
      openMessage(
        '无法连接',
        '<p>Internet Explorer 无法打开该网页。</p><p><code>' + P.helpers.esc(raw) + '</code></p><p class="small">请检查地址是否正确，或尝试站内搜索。此档案没有连接到外部网络。</p>',
        { status: '正在查找站点…… 失败' }
      );
      return;
    }
    navigate(parsed);
  }

  /* ---------------- 事件绑定 ---------------- */

  function bindGlobalEvents() {
    document.addEventListener('click', function (e) {
      const actionEl = e.target.closest ? e.target.closest('[data-action]') : null;
      if (actionEl) {
        e.preventDefault();
        handleAction(actionEl.dataset.action, actionEl);
        return;
      }
      const menuEl = e.target.closest ? e.target.closest('[data-menu]') : null;
      if (menuEl) {
        e.preventDefault();
        handleMenu(menuEl.dataset.menu);
        return;
      }
      const navEl = e.target.closest ? e.target.closest('[data-nav]') : null;
      if (navEl) {
        e.preventDefault();
        if (!gameStarted) return;
        navigate(navEl.dataset.nav);
        return;
      }
      if (gameStarted) AudioEngine.resume();
    });

    document.addEventListener('submit', function (e) {
      const form = e.target.closest ? e.target.closest('form[data-form]') : null;
      if (!form) return;
      e.preventDefault();
      handleSubmit(form);
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlayMode === 'modal') {
        e.preventDefault();
        closeModal();
        return;
      }
      if (e.key && e.key.toLowerCase() === 'd' && e.ctrlKey && e.shiftKey) {
        e.preventDefault();
        if (gameStarted) openDev();
        return;
      }
      if (e.target === addressInput && e.key === 'Enter') {
        e.preventDefault();
        submitAddress();
      }
    });

    window.addEventListener('hashchange', onRouteEvent);
    window.addEventListener('popstate', onRouteEvent);

    window.addEventListener('beforeunload', function () {
      if (state && gameStarted) saveNow(true);
    });

    document.addEventListener('visibilitychange', function () {
      if (document.hidden && state && gameStarted) saveNow(true);
    });

    if (addressInput) {
      addressInput.addEventListener('focus', function () { addressInput.select(); });
    }
  }

  function onRouteEvent() {
    if (!gameStarted) return;
    const r = routeFromHash();
    if (!r) return;
    if (!isValidRoute(r)) {
      currentRoute = '/lost';
      state.lostQuery = r;
      renderRoute('/lost', { updateHash: false });
      return;
    }
    if (r !== currentRoute) {
      currentRoute = r;
      renderRoute(r, { updateHash: false });
      try { window.scrollTo(0, 0); } catch (e) { /* ignore */ }
    }
  }

  /* ---------------- 启动 ---------------- */

  function startClock() {
    // 档案时间固定在 2001-09-14 23:59。真实时间只在开发者工具里显示。
    const el = $('status-clock');
    if (el) el.textContent = D.SITE.archiveDate;
  }

  function init() {
    storageAvailable = checkStorage();
    devUnlocked = (function () {
      try { return window.sessionStorage.getItem(DEV_SESSION_KEY) === '1'; } catch (e) { return false; }
    })();
    const saved = loadSave();
    if (saved) {
      bootAudioPref = saved.audio !== false;
      bootEffectsPref = saved.effects !== false;
    }
    state = saved ? normalizeState(saved) : defaultState();
    bootNewArmed = false;
    bindGlobalEvents();
    showBoot(saved);
    startClock();
    if (!storageAvailable) {
      console.warn('[槐安里] localStorage 不可用，进度将无法持久保存。');
    }
    window.addEventListener('error', function (e) {
      console.error('[槐安里] 未捕获错误：', e.message);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
