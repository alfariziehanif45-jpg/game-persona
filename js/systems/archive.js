/* ============================================================
 * archive.js  —  Archive Collection System (gaya UI Persona 3)
 *
 * Terhubung otomatis ke game:
 *   - Karakter : semua G.CHARS (terbuka otomatis kalau sudah kamu miliki / ikut battle menang)
 *   - Musuh    : G.ENEMYDEX + semua musuh yang pernah muncul di G.battle
 *   - Boss     : G.BOSSES  + semua boss yang pernah muncul di G.battle
 *   - Bond     : membaca G.team.bondLv(id) (sistem Bond bawaan game-mu)
 *
 * Event dari battle.js (via G.MAemit) yang didengar:
 *   enemy_defeated, boss_defeated  -> payload: id arsip (slug nama / e.id)
 *   character_met                  -> payload: id karakter
 *   bond_gain                      -> payload: {id, xp}   (cadangan kalau G.team tidak ada)
 *
 * Alat tes (Console F12):  Archive.demo()  /  Archive.reset()
 * Butuh ma_core.js dimuat SEBELUM file ini, dan battle.js SEBELUM file ini.
 * ============================================================ */
(function () {
  'use strict';
  const MA = window.MA;
  if (!MA) { console.error('[Archive] ma_core.js belum di-load!'); return; }
  const G = (window.G = window.G || {});

  const CATS = {
    character: { label: 'Karakter', icon: '🧑' },
    enemy: { label: 'Musuh', icon: '👹' },
    boss: { label: 'Boss', icon: '💀' },
  };

  const BOND_STEP = 100; // hanya untuk bond cadangan (kalau G.team tidak ada)

  const entries = {};
  const st = MA.state('archive', { unlocked: {}, seen: {}, completed: {}, kills: {}, bonds: {} });
  st.unlocked = st.unlocked || {};
  st.seen = st.seen || {};
  st.completed = st.completed || {};
  st.kills = st.kills || {};
  st.bonds = st.bonds || {};

  let filter = 'character'; // character | enemy | boss | bond
  let selected = null;

  /* ---------- helper ---------- */
  const slug = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
  const title = (s) => String(s || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const idOf = (p) => (p && typeof p === 'object' ? (p.id || p.sid || p.name || '') : p);
  const elName = (k) => {
    const E = G.ELEM && G.ELEM[k];
    return E ? ((E.e || '') + ' ' + String(E.n || k).toUpperCase()).trim() : String(k).toUpperCase();
  };
  const fmtEl = (v) => {
    if (v === undefined || v === null || v === '') return '';
    const a = [].concat(v);
    return a.length ? a.map(elName).join(' · ') : '-';
  };
  const rawChar = (id) => String(id).replace(/^character_/, '');
  const normChar = (name) => {
    name = String(name || '');
    return name.indexOf('character_') === 0 ? name : 'character_' + name;
  };
  const spr = (id) => {
    try { return G.spr ? G.spr('characters', id, 'pt') : ''; } catch (e) { return ''; }
  };

  /* ============================================================
   * PENDAFTARAN DATA DARI GAME
   * ============================================================ */
  function fill(e, o) {
    Object.keys(o).forEach((k) => {
      if ((e[k] === undefined || e[k] === null || e[k] === '') && o[k] !== undefined && o[k] !== null && o[k] !== '') e[k] = o[k];
    });
  }

  function makeFoe(cat, sid, src, name) {
    const id = cat + '_' + sid;
    src = src || {};
    const nm = name || src.n || title(sid);
    const data = {
      id, cat, title: nm,
      icon: (G.EMOJI && G.EMOJI[nm]) || '',
      lv: src.lv,
      hp: src.max || src.hp,
      weak: src.weak,
      resist: src.res,
      imm: src.imm,
      drop: src.drop || src.fragment,
      phases: src.phases && src.phases.length ? src.phases.length : undefined,
      kind: src.cat,
      world: src.world,
      text: src.desc || src.text || src.info || src.lore || '',
    };
    if (entries[id]) { fill(entries[id], data); return entries[id]; }
    entries[id] = data;
    return data;
  }

  function regFoes() {
    const B = G.BOSSES || {}, D = G.ENEMYDEX || {};
    Object.keys(B).forEach((n) => makeFoe('boss', (B[n] && B[n].id) || slug(n), B[n], n));
    Object.keys(D).forEach((n) => {
      if (B[n]) return;
      const d = D[n] || {};
      makeFoe(d.boss ? 'boss' : 'enemy', d.id || slug(n), d, n);
    });
  }

  function regChars() {
    if (!G.CHARS) return;
    Object.keys(G.CHARS).forEach((k) => {
      const C = G.CHARS[k] || {};
      const td = (G.TEAMDATA || {})[k] || {};
      const ro = (G.ROLES && G.ROLES[td.role]) || {};
      const per = G.PERSONA && G.PERSONA[k];
      let weak = [];
      try { weak = G.pweak ? G.pweak(k) : [].concat(td.weak || []); } catch (e) { weak = []; }
      const id = 'character_' + k;
      const data = {
        id, cat: 'character', cid: k, title: C.n || title(k),
        role: ((ro.e || '') + ' ' + (ro.n || '')).trim(),
        persona: per ? per[0] : '',
        elem: td.elem,
        weak,
        text: C.desc || C.bio || C.info || C.story || C.text || '',
      };
      if (entries[id]) fill(entries[id], data); else entries[id] = data;
    });
  }

  // karakter yang sudah kamu miliki di save otomatis terbuka
  function syncOwned() {
    const lv = G.state && G.state.lv;
    if (!lv) return;
    let changed = false;
    Object.keys(lv).forEach((k) => {
      const id = 'character_' + k;
      if (entries[id] && !st.unlocked[id]) { st.unlocked[id] = Date.now(); changed = true; }
    });
    if (changed) MA.save();
  }

  // pantau semua battle supaya musuh / boss yang pernah muncul terdaftar lengkap dengan datanya
  function hookBattle() {
    if (!G.battle || G.battle.__ma) return;
    const orig = G.battle;
    const wrapped = function (enemies) {
      try {
        const B = G.BOSSES || {}, D = G.ENEMYDEX || {};
        (enemies || []).forEach((e) => {
          if (!e || !e.n) return;
          const tpl = B[e.n] || D[e.n] || {};
          const src = Object.assign({}, tpl, e);
          const boss = !!(e.boss || B[e.n] || tpl.boss);
          makeFoe(boss ? 'boss' : 'enemy', e.id || tpl.id || slug(e.n), src, e.n);
        });
      } catch (err) { console.warn('[Archive] hook battle:', err); }
      return orig.apply(this, arguments);
    };
    wrapped.__ma = 1;
    G.battle = wrapped;
  }

  function refreshSources() { regChars(); regFoes(); hookBattle(); syncOwned(); }

  /* ============================================================
   * LOGIKA
   * ============================================================ */
  const bondMax = () => {
    const T = G.team || {};
    return +T.BOND_MAX || +T.bondMax || +T.maxBond || 10;
  };

  function extRank(id) {
    try {
      if (G.team && typeof G.team.bondLv === 'function') {
        const v = +G.team.bondLv(rawChar(id));
        if (!isNaN(v)) return v;
      }
    } catch (e) { /* abaikan */ }
    return null;
  }

  const Archive = {
    CATS,

    register(list) {
      [].concat(list).forEach((e) => { if (e && e.id && CATS[e.cat]) entries[e.id] = e; });
    },

    has: (id) => !!st.unlocked[id],
    get: (id) => entries[id] || null,

    discover(cat, name) { return Archive.unlock(cat + '_' + name); },

    unlock(id) {
      if (st.unlocked[id]) return false;
      if (!entries[id]) return false;
      st.unlocked[id] = Date.now();
      MA.toast('📚 Arsip baru: ' + entries[id].title);
      MA.emit('archive_unlocked', id);
      checkComplete(entries[id].cat);
      MA.save();
      MA.refresh();
      return true;
    },

    // musuh / boss dikalahkan
    defeat(cat, name) {
      const id = cat + '_' + name;
      if (!entries[id]) makeFoe(cat, name, null, null);
      st.kills[id] = (st.kills[id] || 0) + 1;
      const fresh = Archive.unlock(id);
      if (!fresh) { MA.save(); MA.refresh(); }
      return st.kills[id];
    },

    kills: (id) => st.kills[id] || 0,

    // ---------- Bond ----------
    bondPoints: (name) => st.bonds[normChar(name)] || 0,

    bondRank(name) {
      const id = normChar(name);
      if (!st.unlocked[id]) return 0;
      const ext = extRank(id);
      if (ext !== null) return Math.min(bondMax(), Math.max(0, ext));
      return Math.min(bondMax(), Math.floor((st.bonds[id] || 0) / BOND_STEP) + 1);
    },

    // dipakai hanya sebagai cadangan kalau G.team tidak tersedia
    addBond(name, amount) {
      const id = normChar(name);
      amount = Number(amount) || 0;
      if (amount <= 0 || !entries[id]) return 0;
      st.bonds[id] = (st.bonds[id] || 0) + amount;
      MA.save();
      MA.refresh();
      return Archive.bondRank(id);
    },

    list(cat) {
      return Object.values(entries).filter((e) => !cat || cat === 'all' || e.cat === cat);
    },

    progress(cat) {
      const all = Archive.list(cat);
      const got = all.filter((e) => st.unlocked[e.id]).length;
      return { got, total: all.length, pct: all.length ? Math.round((got / all.length) * 100) : 0 };
    },
  };

  function checkComplete(cat) {
    const p = Archive.progress(cat);
    if (p.total > 0 && p.got === p.total && !st.completed[cat]) {
      st.completed[cat] = true;
      MA.toast('🏆 Koleksi ' + CATS[cat].label + ' lengkap!');
      MA.emit('archive_complete', cat);
    }
  }

  /* ---------- Event dari battle.js ---------- */
  MA.on('enemy_defeated', (p) => { const s = idOf(p); if (s) Archive.defeat('enemy', s); });
  MA.on('boss_defeated', (p) => { const s = idOf(p); if (s) Archive.defeat('boss', s); });
  MA.on('character_met', (p) => { const s = idOf(p); if (s) Archive.discover('character', s); });
  MA.on('bond_gain', (p) => {
    if (p && typeof p === 'object' && p.id) {
      // kalau G.team tidak ada, simpan poin sendiri
      if (!(G.team && typeof G.team.bondLv === 'function')) Archive.addBond(p.id, p.xp || 0);
      else MA.refresh();
    }
  });
  MA.on('bond_up', (p) => { if (p && typeof p === 'object') Archive.addBond(p.id, p.amount || p.xp || 0); });

  /* ============================================================
   * STYLE (Persona 3: biru tua, cyan, putih, miring)
   * ============================================================ */
  function injectStyle() {
    if (document.getElementById('p3a-style')) return;
    const s = document.createElement('style');
    s.id = 'p3a-style';
    s.textContent = [
      /* --- bingkai panel MA diganti ke gaya Persona 3 --- */
      '.ma-panel{width:min(1040px,96vw)!important;height:min(720px,92vh)!important;background:#00106b!important;border:3px solid #3df2ff!important;border-radius:0!important;box-shadow:0 0 0 3px #000,0 0 30px rgba(61,242,255,.5)!important}',
      '.ma-head{background:#000!important;border-bottom:4px solid #3df2ff!important;padding:10px 16px!important}',
      '.ma-head .ma-title{font:italic 400 22px Impact,"Arial Black",sans-serif!important;letter-spacing:3px;text-transform:uppercase;text-shadow:3px 3px 0 #0a2bd6}',
      '.ma-tab{background:#0a2bd6!important;color:#fff!important;border:0!important;border-radius:0!important;font:italic 400 14px Impact,"Arial Black",sans-serif!important;letter-spacing:1px;text-transform:uppercase;transform:skewX(-14deg);padding:6px 18px!important}',
      '.ma-tab.on{background:#fff!important;color:#00106b!important;box-shadow:3px 3px 0 #3df2ff}',
      '.ma-close{background:#e60012!important;border-radius:0!important;transform:skewX(-14deg)}',
      '.ma-body{padding:0!important;background:transparent!important}',

      '.p3a{--b1:#00106b;--b2:#0a2bd6;--cy:#3df2ff;--wh:#fff;--yl:#ffe45e;--rd:#ff3b5c;',
      'position:relative;color:var(--wh);font-family:"Arial Black",Impact,"Segoe UI",sans-serif;',
      'padding:16px;overflow:hidden;min-height:100%;',
      'background:radial-gradient(120% 90% at 85% 0%,#1740ff 0%,#0a1fb4 38%,#00106b 100%);}',
      '.p3a:before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.18;',
      'background:repeating-linear-gradient(115deg,transparent 0 22px,#3df2ff 22px 24px);}',
      '.p3a *{box-sizing:border-box}',
      '.p3a-in{position:relative;z-index:1}',

      '.p3a-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px}',
      '.p3a-title{font-size:32px;font-style:italic;letter-spacing:2px;text-transform:uppercase;line-height:1;',
      'transform:skewX(-10deg);text-shadow:4px 4px 0 #000;margin:0}',
      '.p3a-title small{display:block;font-size:11px;letter-spacing:4px;color:var(--cy);text-shadow:none;margin-top:4px}',
      '.p3a-sum{display:flex;gap:8px;flex-wrap:wrap}',
      '.p3a-sum div{background:#000;border-left:4px solid var(--cy);padding:5px 12px;transform:skewX(-10deg);font-size:11px;letter-spacing:1px}',
      '.p3a-sum b{display:block;font-size:18px;color:var(--yl)}',
      '.p3a-sum span{display:inline-block;transform:skewX(10deg)}',

      '.p3a-tabs{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:10px;border-bottom:3px solid var(--cy)}',
      '.p3a-tab{cursor:pointer;border:0;background:#000;color:var(--wh);font:inherit;font-size:13px;font-style:italic;',
      'letter-spacing:1px;text-transform:uppercase;padding:8px 18px;transform:skewX(-14deg);transition:.12s;',
      'box-shadow:3px 3px 0 var(--b2)}',
      '.p3a-tab span{display:inline-block;transform:skewX(14deg)}',
      '.p3a-tab:hover{background:var(--b2)}',
      '.p3a-tab.on{background:var(--wh);color:var(--b1);box-shadow:4px 4px 0 var(--cy)}',

      '.p3a-body{display:grid;grid-template-columns:minmax(220px,.9fr) 1.4fr;gap:18px;align-items:start}',
      '@media(max-width:720px){.p3a-body{grid-template-columns:1fr}.p3a-title{font-size:24px}}',

      '.p3a-list{display:flex;flex-direction:column;gap:7px;max-height:min(440px,52vh);overflow:auto;padding:4px 10px 6px 14px}',
      '.p3a-item{cursor:pointer;position:relative;display:flex;align-items:center;gap:10px;background:rgba(0,0,0,.72);',
      'padding:8px 14px;transform:skewX(-10deg);border-left:6px solid var(--b2);transition:.12s;min-height:48px}',
      '.p3a-item>*{transform:skewX(10deg)}',
      '.p3a-item:hover{background:var(--b2);margin-left:6px}',
      '.p3a-item.on{background:var(--wh);color:var(--b1);border-left-color:var(--rd);margin-left:12px;box-shadow:5px 5px 0 var(--cy)}',
      '.p3a-item.on:before{content:"\\25B6";position:absolute;left:-24px;top:50%;transform:translateY(-50%) skewX(10deg);color:var(--cy);font-size:16px}',
      '.p3a-item.lock{opacity:.55;cursor:default}',
      '.p3a-item.lock:hover{background:rgba(0,0,0,.72);margin-left:0}',
      '.p3a-ico{font-size:20px;width:34px;height:34px;display:flex;align-items:center;justify-content:center;overflow:hidden;flex:none}',
      '.p3a-ico>*{display:block;width:100%!important;height:100%!important;object-fit:cover}',
      '.p3a-name{flex:1;font-size:14px;font-style:italic;letter-spacing:.5px;text-transform:uppercase;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.p3a-tag{font-size:10px;background:var(--yl);color:#000;padding:2px 6px;letter-spacing:1px}',
      '.p3a-rk{font-size:12px;color:var(--cy)}',
      '.p3a-item.on .p3a-rk{color:var(--b2)}',
      '.p3a-cnt{font-size:12px;color:var(--yl)}',
      '.p3a-item.on .p3a-cnt{color:var(--rd)}',

      '.p3a-detail{background:rgba(0,0,0,.78);border-top:5px solid var(--cy);border-left:5px solid var(--cy);',
      'padding:18px 20px;min-height:280px;position:relative;clip-path:polygon(0 0,100% 0,100% calc(100% - 24px),calc(100% - 24px) 100%,0 100%)}',
      '.p3a-detail:after{content:"";position:absolute;right:0;bottom:0;width:24px;height:24px;background:var(--cy);',
      'clip-path:polygon(100% 0,0 100%,100% 100%)}',
      '.p3a-dh{display:flex;gap:14px;align-items:flex-start}',
      '.p3a-dh>div:last-child{flex:1;min-width:0}',
      '.p3a-port{flex:none;width:92px;height:92px;border:3px solid var(--wh);background:#111;overflow:hidden;transform:skewX(-6deg);box-shadow:4px 4px 0 var(--b2);',
      'display:flex;align-items:center;justify-content:center;font-size:46px}',
      '.p3a-port>*{display:block;width:100%!important;height:100%!important;object-fit:cover}',
      '.p3a-cat{font-size:11px;letter-spacing:4px;color:var(--cy);text-transform:uppercase}',
      '.p3a-dtitle{font-size:28px;font-style:italic;text-transform:uppercase;margin:4px 0 2px;line-height:1.05;text-shadow:3px 3px 0 var(--b2)}',
      '.p3a-world{font-size:12px;color:#b9c4ff;letter-spacing:1px;margin-bottom:6px}',
      '.p3a-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:6px;margin:12px 0}',
      '.p3a-stat{background:var(--b1);border-left:4px solid var(--cy);padding:6px 10px;transform:skewX(-8deg)}',
      '.p3a-stat>*{display:block;transform:skewX(8deg)}',
      '.p3a-stat i{font-style:normal;font-size:10px;letter-spacing:2px;color:var(--cy)}',
      '.p3a-stat b{font-size:13px}',
      '.p3a-text{font-family:"Segoe UI",Arial,sans-serif;font-weight:600;font-size:14px;line-height:1.65;color:#e8ecff;',
      'margin:10px 0 0;padding-top:10px;border-top:2px dashed rgba(61,242,255,.5)}',

      '.p3a-bond{margin-top:14px;background:linear-gradient(90deg,var(--b2),var(--b1));padding:12px 14px;border:2px solid var(--cy);transform:skewX(-4deg)}',
      '.p3a-bond>*{transform:skewX(4deg)}',
      '.p3a-bhead{display:flex;align-items:baseline;justify-content:space-between;gap:10px;flex-wrap:wrap}',
      '.p3a-arc{font-size:13px;letter-spacing:2px;color:var(--yl);text-transform:uppercase}',
      '.p3a-rank{font-size:38px;font-style:italic;line-height:1;text-shadow:3px 3px 0 #000}',
      '.p3a-rank small{font-size:12px;letter-spacing:3px;color:var(--cy);margin-right:6px}',
      '.p3a-pips{display:flex;gap:4px;margin:10px 0 6px}',
      '.p3a-pips i{flex:1;height:14px;background:#000;border:1px solid var(--cy);transform:skewX(-20deg)}',
      '.p3a-pips i.f{background:linear-gradient(180deg,#fff,var(--cy));border-color:#fff}',
      '.p3a-bar{height:8px;background:#000;border:1px solid var(--cy)}',
      '.p3a-bar b{display:block;height:100%;background:var(--yl)}',
      '.p3a-bnote{font-size:11px;letter-spacing:1px;color:#b9c4ff;margin-top:5px}',
      '.p3a-cmb{margin-top:8px;font:700 12px "Segoe UI",Arial,sans-serif;color:#e8ecff;line-height:1.6}',
      '.p3a-cmb u{text-decoration:none;display:inline-block;background:#6a00c8;border:1px solid #fff;padding:0 8px;margin:0 6px 4px 0}',

      '.p3a-empty{padding:30px 10px;text-align:center;color:#b9c4ff;font-size:13px;letter-spacing:2px;text-transform:uppercase}',
      '.p3a-qs{font-size:64px;text-align:center;color:rgba(255,255,255,.15);letter-spacing:10px;margin:30px 0 6px}',
    ].join('');
    document.head.appendChild(s);
  }

  /* ============================================================
   * UI
   * ============================================================ */
  function visibleList() {
    if (filter === 'bond') {
      return Archive.list('character').sort((a, b) => {
        const ra = Archive.bondRank(a.id), rb = Archive.bondRank(b.id);
        if (ra !== rb) return rb - ra;
        return a.title.localeCompare(b.title);
      });
    }
    return Archive.list(filter);
  }

  function totals() {
    let kills = 0;
    Object.keys(st.kills).forEach((k) => { kills += st.kills[k]; });
    const chars = Archive.list('character').filter((c) => Archive.has(c.id));
    const mx = bondMax();
    const maxed = chars.filter((c) => Archive.bondRank(c.id) >= mx).length;
    return { kills, met: chars.length, maxed, all: Archive.progress('all') };
  }

  function dateStr(ts) {
    try { return new Date(ts).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }); }
    catch (e) { return '-'; }
  }

  function stat(label, value) {
    if (value === undefined || value === null || value === '') return '';
    return '<div class="p3a-stat"><i>' + label + '</i><b>' + MA.esc(String(value)) + '</b></div>';
  }

  function iconHtml(e, ok) {
    if (!ok) return '❔';
    if (e.cat === 'character') { const h = spr(e.cid); return h || CATS.character.icon; }
    return MA.esc(e.icon || CATS[e.cat].icon);
  }

  function bondBlock(e) {
    const mx = bondMax();
    const rank = Archive.bondRank(e.id);
    const ext = extRank(e.id) !== null;
    const maxed = rank >= mx;
    let pips = '';
    for (let i = 1; i <= mx; i++) pips += '<i class="' + (i <= rank ? 'f' : '') + '"></i>';

    let bar = '', note;
    if (ext) {
      note = maxed ? 'BOND SEMPURNA' : 'Naik lewat battle bersama & event cerita';
    } else {
      const inRank = (st.bonds[e.id] || 0) % BOND_STEP;
      bar = '<div class="p3a-bar"><b style="width:' + (maxed ? 100 : inRank) + '%"></b></div>';
      note = maxed ? 'BOND SEMPURNA' : inRank + ' / ' + BOND_STEP + ' menuju Rank ' + (rank + 1);
    }

    // skill combo dengan karakter lain
    let cmb = '';
    const me = rawChar(e.id);
    (G.COMBOS || []).forEach((c) => {
      if (c.a !== me && c.b !== me) return;
      const other = c.a === me ? c.b : c.a;
      const oc = G.CHARS && G.CHARS[other];
      if (!oc) return;
      cmb += '<u>⚡ ' + MA.esc(c.n || 'Combo') + ' × ' + MA.esc(oc.n) + (c.need ? ' (Bond Lv' + c.need + ')' : '') + '</u>';
    });

    return '<div class="p3a-bond">' +
      '<div class="p3a-bhead"><div class="p3a-arc">SOCIAL LINK</div>' +
      '<div class="p3a-rank"><small>RANK</small>' + (maxed ? 'MAX' : rank) + '</div></div>' +
      '<div class="p3a-pips">' + pips + '</div>' + bar +
      '<div class="p3a-bnote">' + note + '</div>' +
      (cmb ? '<div class="p3a-cmb">' + cmb + '</div>' : '') +
      '</div>';
  }

  function detailHtml(e) {
    if (!e) return '<div class="p3a-empty">Belum ada arsip</div>';
    if (!Archive.has(e.id)) {
      return '<div class="p3a-cat">' + CATS[e.cat].label + '</div>' +
        '<div class="p3a-qs">???</div>' +
        '<div class="p3a-empty">Belum ditemukan</div>';
    }
    let h = '<div class="p3a-dh"><div class="p3a-port">' + iconHtml(e, true) + '</div><div>' +
      '<div class="p3a-cat">' + CATS[e.cat].icon + ' ' + CATS[e.cat].label + '</div>' +
      '<div class="p3a-dtitle">' + MA.esc(e.title) + '</div>' +
      '<div class="p3a-world">' + (e.world ? MA.esc(e.world) : '') + '</div></div></div>';

    h += '<div class="p3a-stats">';
    if (e.cat === 'enemy' || e.cat === 'boss') {
      h += stat('DIKALAHKAN', Archive.kills(e.id) + ' kali');
      h += stat('TIPE', e.kind ? String(e.kind).toUpperCase() : '');
      h += stat('LEVEL', e.lv);
      h += stat('HP', e.hp);
      h += stat('KELEMAHAN', fmtEl(e.weak));
      h += stat('TAHAN', fmtEl(e.resist));
      h += stat('KEBAL', fmtEl(e.imm));
      h += stat('FASE', e.phases);
      h += stat('DROP', e.drop);
      h += stat('PERTAMA KALI', dateStr(st.unlocked[e.id]));
    } else {
      const lv = G.state && G.state.lv && G.state.lv[e.cid];
      h += stat('LEVEL', lv ? lv.l : '');
      h += stat('PERAN', e.role);
      h += stat('PERSONA', e.persona);
      h += stat('ELEMEN', e.elem ? elName(e.elem) : '');
      h += stat('KELEMAHAN', fmtEl(e.weak));
      h += stat('BOND', 'Rank ' + Archive.bondRank(e.id));
      h += stat('BERTEMU', dateStr(st.unlocked[e.id]));
    }
    h += '</div>';

    if (e.cat === 'character') h += bondBlock(e);
    if (e.text) h += '<p class="p3a-text">' + MA.esc(e.text) + '</p>';
    return h;
  }

  function render(el) {
    injectStyle();
    refreshSources();
    const t = totals();
    const list = visibleList();
    if (!selected || !list.some((e) => e.id === selected)) {
      const first = list.find((e) => Archive.has(e.id)) || list[0];
      selected = first ? first.id : null;
    }

    let html = '<div class="p3a"><div class="p3a-in">';

    html += '<div class="p3a-head"><h3 class="p3a-title">Archive<small>MULTIVERSE RECORDS</small></h3>' +
      '<div class="p3a-sum">' +
      '<div><span>ARSIP<b>' + t.all.got + '/' + t.all.total + '</b></span></div>' +
      '<div><span>MUSUH KALAH<b>' + t.kills + '</b></span></div>' +
      '<div><span>BOND MAX<b>' + t.maxed + '/' + t.met + '</b></span></div>' +
      '</div></div>';

    const tabs = [
      ['character', '🧑 Karakter'],
      ['enemy', '👹 Musuh'],
      ['boss', '💀 Boss'],
      ['bond', '💙 Bond'],
    ];
    html += '<div class="p3a-tabs">';
    tabs.forEach((x) => {
      const p = x[0] === 'bond' ? Archive.progress('character') : Archive.progress(x[0]);
      html += '<button class="p3a-tab' + (filter === x[0] ? ' on' : '') + '" data-f="' + x[0] + '"><span>' +
        x[1] + ' ' + p.got + '/' + p.total + '</span></button>';
    });
    html += '</div>';

    const mx = bondMax();
    html += '<div class="p3a-body"><div class="p3a-list">';
    if (!list.length) html += '<div class="p3a-empty">Belum ada arsip</div>';
    list.forEach((e) => {
      const ok = Archive.has(e.id);
      const isNew = ok && !st.seen[e.id];
      let right = '';
      if (ok && (filter === 'bond' || e.cat === 'character')) {
        const r = Archive.bondRank(e.id);
        right = '<span class="p3a-rk">' + (filter === 'bond' ? 'R' : '💙') + (r >= mx ? 'MAX' : r) + '</span>';
      } else if (ok && (e.cat === 'enemy' || e.cat === 'boss')) right = '<span class="p3a-cnt">×' + Archive.kills(e.id) + '</span>';
      html += '<div class="p3a-item' + (selected === e.id ? ' on' : '') + (ok ? '' : ' lock') + '" data-id="' + MA.esc(e.id) + '">' +
        '<span class="p3a-ico">' + iconHtml(e, ok) + '</span>' +
        '<span class="p3a-name">' + (ok ? MA.esc(e.title) : '???') + '</span>' +
        (isNew ? '<span class="p3a-tag">NEW</span>' : '') + right + '</div>';
    });
    html += '</div>';

    html += '<div class="p3a-detail">' + detailHtml(entries[selected]) + '</div>';
    html += '</div></div></div>';

    el.innerHTML = html;

    el.querySelectorAll('[data-f]').forEach((b) => {
      b.onclick = () => { filter = b.dataset.f; selected = null; render(el); el.scrollTop = 0; };
    });
    el.querySelectorAll('.p3a-item[data-id]').forEach((c) => {
      c.onclick = () => {
        const id = c.dataset.id;
        selected = id;
        if (Archive.has(id) && !st.seen[id]) { st.seen[id] = true; MA.save(); }
        render(el);
      };
    });
  }

  MA.registerTab({ id: 'archive', label: 'Arsip', icon: '📚', render });

  /* ---------- Inisialisasi ---------- */
  refreshSources();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', refreshSources);

  /* ---------- Alat tes (Console F12) ----------
   *   Archive.demo();   // buka semua arsip untuk melihat tampilannya
   *   Archive.reset();  // kosongkan lagi arsip, kill, dan bond cadangan
   */
  Archive.demo = function () {
    refreshSources();
    Object.keys(entries).forEach((id) => {
      const e = entries[id];
      if (!st.unlocked[id]) st.unlocked[id] = Date.now();
      if (e.cat === 'enemy' || e.cat === 'boss') st.kills[id] = st.kills[id] || 3;
    });
    MA.save();
    MA.refresh();
  };

  Archive.reset = function () {
    st.unlocked = {}; st.seen = {}; st.completed = {}; st.kills = {}; st.bonds = {};
    syncOwned();
    MA.save();
    MA.refresh();
  };

  window.Archive = Archive;
})();