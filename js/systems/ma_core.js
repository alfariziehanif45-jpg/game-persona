/* ============================================================
 * ma_core.js  —  Inti bersama untuk 4 sistem baru
 * (Archive, Bond, Parallel World, Memory Fragment)
 *
 * WAJIB di-load PALING PERTAMA di antara file sistem baru.
 * Menyediakan: penyimpanan, event bus, toast, modal, panel hub.
 *
 * CATATAN: tombol ARCHIVE melayang SUDAH DIHAPUS. Panel dibuka lewat
 * tab ARCHIVE di HUB (parallel_world.js) atau shortcut Alt+A.
 * ============================================================ */
(function () {
  'use strict';

  const MA = (window.MA = window.MA || {});
  const SAVE_KEY = 'multiverse_archive_v1';
  const listeners = {};
  const tabs = [];
  let store = {};

  try { store = JSON.parse(localStorage.getItem(SAVE_KEY)) || {}; } catch (e) { store = {}; }

  const clone = (o) => JSON.parse(JSON.stringify(o));

  /* ---------- Helper ---------- */
  MA.esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  /* ---------- Penyimpanan ---------- */
  MA.state = function (ns, defaults) {
    store[ns] = Object.assign(clone(defaults), store[ns] || {});
    return store[ns];
  };

  MA.save = function () {
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(store)); } catch (e) { /* abaikan */ }
  };

  MA.exportData = () => clone(store);

  MA.importData = function (obj) {
    if (!obj || typeof obj !== 'object') return;
    Object.keys(obj).forEach((ns) => {
      if (store[ns]) {
        Object.keys(store[ns]).forEach((k) => delete store[ns][k]);
        Object.assign(store[ns], clone(obj[ns]));
      } else {
        store[ns] = clone(obj[ns]);
      }
    });
    MA.save();
    MA.emit('imported');
    MA.refresh();
  };

  MA.resetAll = function () {
    Object.keys(store).forEach((ns) => {
      const o = store[ns];
      Object.keys(o).forEach((k) => { o[k] = (typeof o[k] === 'object' && o[k] !== null) ? (Array.isArray(o[k]) ? [] : {}) : o[k]; });
    });
    MA.save();
    MA.refresh();
  };

  /* ---------- Event bus ---------- */
  MA.on = function (evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); };
  MA.emit = function (evt, payload) {
    (listeners[evt] || []).slice().forEach((fn) => {
      try { fn(payload); } catch (err) { console.error('[MA] error di event "' + evt + '"', err); }
    });
  };

  /* ---------- CSS ---------- */
  function injectCSS() {
    if (document.getElementById('ma-style')) return;
    const css = `
.ma-fab,#ma-fab{display:none!important}
.ma-overlay{position:fixed;inset:0;background:#000a;z-index:9500;display:flex;align-items:center;justify-content:center;font-family:system-ui,sans-serif}
.ma-overlay.ma-top{z-index:9800}
.ma-panel,.ma-box{background:#141a28;color:#e8ecf8;border:1px solid #4b5b86;border-radius:12px;box-shadow:0 8px 30px #000a}
.ma-panel{width:min(820px,94vw);height:min(600px,88vh);display:flex;flex-direction:column}
.ma-head{display:flex;align-items:center;gap:6px;padding:10px 12px;border-bottom:1px solid #2d3956;flex-wrap:wrap}
.ma-head .ma-title{font-weight:700;margin-right:auto}
.ma-tab{background:#1d2433;color:#aab6d8;border:1px solid #2d3956;border-radius:8px;padding:5px 10px;cursor:pointer;font-size:13px}
.ma-tab.on{background:#3b5bdb;color:#fff;border-color:#3b5bdb}
.ma-body{padding:12px;overflow:auto;flex:1}
.ma-box{width:min(460px,92vw);padding:16px}
.ma-box h3{margin:0 0 8px}
.ma-mbody{line-height:1.5;margin-bottom:12px;max-height:55vh;overflow:auto;white-space:pre-wrap}
.ma-btns{display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap}
.ma-btn{background:#3b5bdb;color:#fff;border:0;border-radius:8px;padding:7px 12px;cursor:pointer;font-size:13px}
.ma-btn.alt{background:#2d3956}
.ma-btn:disabled{opacity:.4;cursor:not-allowed}
.ma-card{background:#1b2236;border:1px solid #2d3956;border-radius:10px;padding:10px;margin-bottom:8px}
.ma-card.locked{opacity:.55}
.ma-card h4{margin:0 0 4px;font-size:15px}
.ma-muted{color:#8e9abd;font-size:12px}
.ma-bar{height:8px;background:#0c101b;border-radius:6px;overflow:hidden;margin:6px 0}
.ma-bar>i{display:block;height:100%;background:linear-gradient(90deg,#3b5bdb,#9775fa)}
.ma-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px}
.ma-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
.ma-toast{position:fixed;right:14px;top:14px;z-index:9900;background:#1d2433;color:#fff;border-left:4px solid #9775fa;padding:9px 14px;border-radius:8px;font:14px system-ui,sans-serif;box-shadow:0 2px 12px #000a;animation:ma-in .25s}
@keyframes ma-in{from{opacity:0;transform:translateX(30px)}to{opacity:1;transform:none}}`;
    const st = document.createElement('style');
    st.id = 'ma-style';
    st.textContent = css;
    document.head.appendChild(st);
  }

  /* ---------- Toast ---------- */
  let toastY = 0;
  MA.toast = function (msg) {
    injectCSS();
    const t = document.createElement('div');
    t.className = 'ma-toast';
    t.style.top = (14 + toastY * 46) + 'px';
    t.textContent = msg;
    toastY++;
    document.body.appendChild(t);
    setTimeout(() => { t.remove(); toastY = Math.max(0, toastY - 1); }, 3200);
  };

  /* ---------- Modal ---------- */
  MA.modal = function (title, html, buttons) {
    injectCSS();
    const ov = document.createElement('div');
    ov.className = 'ma-overlay ma-top';
    ov.innerHTML = '<div class="ma-box"><h3>' + MA.esc(title) + '</h3><div class="ma-mbody">' + html +
      '</div><div class="ma-btns"></div></div>';
    const close = () => ov.remove();
    (buttons && buttons.length ? buttons : [{ label: 'Tutup' }]).forEach((b) => {
      const btn = document.createElement('button');
      btn.className = 'ma-btn' + (b.alt ? ' alt' : '');
      btn.textContent = b.label;
      btn.onclick = () => { close(); if (b.fn) b.fn(); };
      ov.querySelector('.ma-btns').appendChild(btn);
    });
    document.body.appendChild(ov);
    return close;
  };

  /* ---------- Hub panel ---------- */
  MA.registerTab = function (tab) { tabs.push(tab); };

  let panel = null;
  let activeTab = null;

  function renderPanel() {
    if (!panel) return;
    const cur = tabs.find((t) => t.id === activeTab) || tabs[0];
    if (!cur) return;
    activeTab = cur.id;
    const head = panel.querySelector('.ma-head');
    head.querySelectorAll('.ma-tab').forEach((b) => b.remove());
    const closeBtn = head.querySelector('.ma-close');
    tabs.forEach((t) => {
      const b = document.createElement('button');
      b.className = 'ma-tab' + (t.id === activeTab ? ' on' : '');
      b.textContent = (t.icon || '') + ' ' + t.label;
      b.onclick = () => { activeTab = t.id; renderPanel(); };
      head.insertBefore(b, closeBtn);
    });
    const body = panel.querySelector('.ma-body');
    body.innerHTML = '';
    try { cur.render(body); } catch (e) { body.textContent = 'Error: ' + e.message; console.error(e); }
  }

  MA.open = function (tabId) {
    injectCSS();
    if (!panel) {
      panel = document.createElement('div');
      panel.className = 'ma-overlay';
      panel.innerHTML = '<div class="ma-panel"><div class="ma-head"><span class="ma-title">🌌 Multiverse Archive</span>' +
        '<button class="ma-btn alt ma-close">✖</button></div><div class="ma-body"></div></div>';
      panel.querySelector('.ma-close').onclick = MA.close;
      panel.addEventListener('mousedown', (e) => { if (e.target === panel) MA.close(); });
      document.body.appendChild(panel);
    }
    panel.style.display = 'flex';
    if (tabId) activeTab = tabId;
    renderPanel();
  };

  MA.close = function () { if (panel) panel.style.display = 'none'; MA.save(); };
  MA.isOpen = () => !!panel && panel.style.display !== 'none';
  MA.refresh = function () { if (MA.isOpen()) renderPanel(); };

  /* ---------- Shortcut (tanpa tombol melayang) ---------- */
  function initUI() {
    injectCSS();
    // buang sisa tombol melayang kalau ada file lain yang membuatnya
    const old = document.getElementById('ma-fab');
    if (old) old.remove();
    document.addEventListener('keydown', (e) => {
      if (e.altKey && (e.key === 'a' || e.key === 'A')) { e.preventDefault(); MA.isOpen() ? MA.close() : MA.open(); }
      if (e.key === 'Escape' && MA.isOpen()) MA.close();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initUI);
  else initUI();

  window.addEventListener('beforeunload', MA.save);
  console.log('[MA] core siap');
})();