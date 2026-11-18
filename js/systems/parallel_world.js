/* ============================================================
 * parallel_world.js  —  4. Parallel World System  (HUB + STORY 40 CHAPTER)
 *
 * ISI:
 *  1. Tombol ARCHIVE melayang disembunyikan -> jadi tab di HUB.
 *  2. Tab "PARALLEL WORLD" di HUB -> BABAK CERITA 40 CHAPTER
 *     (8 arc x 5 chapter, tiap chapter 2 stage + boss).
 *  3. PROTAGONIS = KAEL. Selama Parallel World HANYA Kael yang bisa
 *     dipakai (party asli otomatis disimpan lalu dikembalikan setelah
 *     keluar dari chapter / kalah / game di-reload).
 *     Musuh mengikuti LEVEL KAEL & makin sulit tiap chapter.
 *  4. Cerita: Kael terbangun tanpa ingatan di dunia yang sekarat. Ia
 *     mencari jati dirinya dan kebenaran dunia ini. Makin jauh -> UI
 *     makin rusak (teks tersensor glitch, scanline, getar) dan kisah
 *     makin kelam.
 *  5. Chapter 40: keputusan terakhir
 *       - TERIMA & BERDAMAI (Kael mengorbankan diri) = GOOD ENDING
 *       - SIMPAN DENDAM (Kael mengambil pena)         = BAD ENDING
 *     APA PUN PILIHANNYA, DUNIA TETAP BERADA DI ERA KELAM PENUH
 *     PENDERITAAN. Yang berbeda hanya nasib dunia & Kael. Pilihan di
 *     Chapter 1 ikut memengaruhi POST CREDIT. Ending yang sudah dilihat
 *     bisa ditonton lagi.
 *
 * API lama tetap sama:
 *   ParallelWorld.prompt('world1','save_village',(i)=>{...});
 *   ParallelWorld.decide / getBoss / getCharacters / getVariant / setFlag
 *   ParallelWorld.enterStory();   // buka layar Parallel World
 *
 * CATATAN:
 *  - Nama pembicara dialog: ARCHIVE, KAEL, ELIZABETH, ???
 *    (kalau G.dialog kamu punya warna/potret per nama, tambahkan '???').
 *  - ID karakter Kael dicari otomatis di data game. Kalau ID-nya bukan
 *    'kael', isi CFG.KAEL_ID.
 *  - Save lama aman: chapter yang sudah selesai tetap terhitung.
 *  - Kalau tombol ARCHIVE tidak ikut hilang, isi CFG.ARCHIVE_SELECTOR
 *    (contoh: '#ma-launcher').
 * ============================================================ */
(function () {
  'use strict';
  const MA = window.MA;
  if (!MA) { console.error('[ParallelWorld] ma_core.js belum di-load!'); return; }

  /* ---------- PENGATURAN (boleh diubah) ---------- */
  const CFG = {
    KAEL_ID: 'kael',          // ID karakter Kael di G.state (huruf kecil). Dicari otomatis juga.
    ARCHIVE_SELECTOR: '',     // selector CSS tombol ARCHIVE melayang (kosong = deteksi otomatis)
    TAB_ARCHIVE: 'ARCHIVE',
    TAB_PW: 'PARALLEL WORLD',
    BASE_CH: 10,              // chapter dasar musuh (G.mkEnemy maksimal chapter 10)
    LV_SCALE: 0.55,           // tiap 1 level Kael = +0.55 "chapter" skala musuh
    HP_PER_CH: 0.12,          // tambahan HP musuh per chapter Parallel World (ch40 = ~x5.7)
    ATK_PER_CH: 0.06,         // tambahan ATK musuh per chapter Parallel World (ch40 = ~x3.3)
    XP_PER_CH: 0.15,          // tambahan XP per chapter
  };

  const worlds = {};
  const st = MA.state('parallel', { flags: {}, choices: {}, seen: {}, story: { cleared: 0 } });
  st.story = st.story || { cleared: 0 };
  st.story.endings = st.story.endings || {};

  function flagsOf(w) { return (st.flags[w] = st.flags[w] || {}); }

  const PW = {
    register(list) { [].concat(list).forEach((w) => { if (w && w.id) worlds[w.id] = w; }); },
    get: (id) => worlds[id] || null,

    getVariant(worldId) {
      const w = worlds[worldId];
      if (!w) return null;
      const f = flagsOf(worldId);
      let best = null;
      let bestScore = -1;
      w.variants.forEach((v) => {
        const req = v.requires || {};
        const keys = Object.keys(req);
        if (keys.every((k) => f[k] === req[k]) && keys.length > bestScore) { best = v; bestScore = keys.length; }
      });
      return best || w.variants[0];
    },

    getBoss: (id) => { const v = PW.getVariant(id); return v ? v.boss : null; },
    getCharacters: (id) => { const v = PW.getVariant(id); return v ? (v.characters || []).slice() : []; },
    getFlag: (w, k) => flagsOf(w)[k],
    hasDecided: (w, d) => !!(st.choices[w] && d in st.choices[w]),

    setFlag(worldId, key, value) {
      const before = PW.getVariant(worldId);
      flagsOf(worldId)[key] = value;
      afterChange(worldId, before);
    },

    decide(worldId, decisionId, choiceIdx) {
      const w = worlds[worldId];
      const d = w && w.decisions.find((x) => x.id === decisionId);
      const ch = d && d.choices[choiceIdx];
      if (!ch) return false;
      const before = PW.getVariant(worldId);
      st.choices[worldId] = st.choices[worldId] || {};
      st.choices[worldId][decisionId] = choiceIdx;
      Object.assign(flagsOf(worldId), ch.flags || {});
      afterChange(worldId, before);
      return true;
    },

    prompt(worldId, decisionId, cb) {
      const w = worlds[worldId];
      const d = w && w.decisions.find((x) => x.id === decisionId);
      if (!d) { if (cb) cb(-1); return; }
      if (PW.hasDecided(worldId, decisionId)) { if (cb) cb(st.choices[worldId][decisionId]); return; }
      MA.modal('⚖️ ' + d.title, MA.esc(d.text),
        d.choices.map((c, i) => ({ label: c.label, fn: () => { PW.decide(worldId, decisionId, i); if (cb) cb(i); } })));
    },

    rewind(worldId) {
      const before = PW.getVariant(worldId);
      st.choices[worldId] = {};
      st.flags[worldId] = {};
      afterChange(worldId, before, true);
    },

    progress(worldId) {
      const w = worlds[worldId];
      const seen = (st.seen[worldId] || []).length;
      return { seen, total: w ? w.variants.length : 0 };
    },

    enterStory() { screen(); },
  };

  function afterChange(worldId, beforeVariant, silent) {
    const now = PW.getVariant(worldId);
    st.seen[worldId] = st.seen[worldId] || [];
    if (now && st.seen[worldId].indexOf(now.id) < 0) {
      st.seen[worldId].push(now.id);
      MA.emit('variant_discovered', { world: worldId, variant: now.id });
      MA.emit('history_found', worldId + '_' + now.id);
    }
    if (!silent && beforeVariant && now && beforeVariant.id !== now.id) {
      MA.toast('🌀 Dunia berubah: ' + now.name);
      MA.emit('world_changed', { world: worldId, from: beforeVariant.id, to: now.id });
    }
    MA.save();
    MA.refresh();
  }

  /* ============================================================
   *  KAEL SAJA  (party dikunci ke Kael selama Parallel World)
   * ============================================================ */
  function kaelId() {
    const G = window.G, S = G && G.state;
    const pool = [];
    if (S && S.lv) Object.keys(S.lv).forEach((k) => pool.push(k));
    if (G) {
      ['chars', 'characters', 'CHARS', 'roster'].forEach((k) => {
        const c = G[k];
        if (!c) return;
        if (Array.isArray(c)) c.forEach((x) => { if (x && x.id) pool.push(x.id); });
        else if (typeof c === 'object') Object.keys(c).forEach((x) => pool.push(x));
      });
    }
    const want = String(CFG.KAEL_ID || 'kael').toLowerCase();
    return pool.find((id) => String(id).toLowerCase() === want) ||
           pool.find((id) => /kael/i.test(String(id))) ||
           CFG.KAEL_ID || 'kael';
  }

  /* field lain yang mungkin dipakai game untuk menentukan siapa yang bertarung */
  const TEAM_KEYS = ['active', 'team', 'squad', 'front', 'lineup'];   /* diisi Kael saja */
  const BENCH_KEYS = ['bench', 'reserve', 'back', 'standby'];         /* dikosongkan */
  const LEAD_KEYS = ['leader', 'lead', 'current', 'cur', 'turnChar'];  /* diset ke Kael (kalau string) */
  let guardTimer = null;

  function enforceKael() {
    const G = window.G, S = G && G.state;
    if (!S) return;
    const id = kaelId();
    if (!Array.isArray(S.party) || S.party.length !== 1 || S.party[0] !== id) S.party = [id];
    TEAM_KEYS.forEach((k) => { if (Array.isArray(S[k]) && (S[k].length !== 1 || S[k][0] !== id)) S[k] = [id]; });
    BENCH_KEYS.forEach((k) => { if (Array.isArray(S[k]) && S[k].length) S[k] = []; });
    LEAD_KEYS.forEach((k) => { if (typeof S[k] === 'string' && S[k] !== id) S[k] = id; });
  }

  /* matikan tombol ganti/tukar karakter yang muncul selama chapter */
  function blockSwapUI() {
    const A = document.getElementById('app');
    if (!A || A.querySelector('.pws')) return;       /* di menu Parallel World tidak perlu */
    A.querySelectorAll('button,[role="button"],.btn').forEach((b) => {
      if (b.dataset.pwlock) return;
      const t = (b.textContent || '').trim();
      if (/^(🔄\s*)?(ganti|tukar|switch|swap|change\s*(char|party))/i.test(t) || /^(party|formasi|tim)$/i.test(t)) {
        b.dataset.pwlock = '1';
        b.disabled = true;
        b.style.opacity = '.35';
        b.style.pointerEvents = 'none';
        b.title = 'Di Parallel World hanya Kael yang bisa bertarung.';
      }
    });
  }

  /* ---------- KUNCI LAYAR "ATUR TIM" ----------
   * Semua kartu karakter selain Kael: digelapkan, ada tulisan TERKUNCI, tidak bisa
   * diklik (mouse maupun keyboard). Kalau ada yang sudah terpilih otomatis
   * (mis. Alternate Kael), ia dilepas sekali secara otomatis; Kael dipilih otomatis. */
  let autoClicks = 0;

  function lockCSS() {
    if (document.getElementById('pw-lock')) return;
    const s = document.createElement('style');
    s.id = 'pw-lock';
    s.textContent = `
[data-pwlockcard]{pointer-events:none!important;cursor:not-allowed!important;filter:grayscale(1) brightness(.4)!important;position:relative!important}
[data-pwlockcard]::after{content:'🔒 TERKUNCI';position:absolute;right:14px;bottom:10px;z-index:5;padding:2px 12px;background:#000;color:#ff2a4a;border:2px solid #ff2a4a;font:italic 400 18px Impact,sans-serif;letter-spacing:1px;transform:skewX(-10deg);filter:none}`;
    document.head.appendChild(s);
  }

  function hasBadge(card) {
    return Array.prototype.some.call(card.querySelectorAll('*'), (x) => !x.children.length && /^[1-4]$/.test((x.textContent || '').trim()));
  }

  function teamCards(root) {
    const re = (t) => /LV\s*\d/i.test(t) && /HP\s*\d/i.test(t) && /LEMAH/i.test(t);
    const set = [];
    root.querySelectorAll('div,button,li,article,label,section').forEach((e) => {
      if (!re(e.textContent || '')) return;
      for (let n = 0; n < e.children.length; n++) { if (re(e.children[n].textContent || '')) return; }  /* ambil yang terkecil */
      let c = e;                                                 /* naik ke kartu utuh (berisi tepat 1 karakter) */
      while (c.parentElement && c.parentElement !== root &&
             ((c.parentElement.textContent || '').match(/LV\s*\d/gi) || []).length === 1) c = c.parentElement;
      if (set.indexOf(c) < 0) set.push(c);
    });
    return set;
  }

  function lockTeamScreen() {
    const A = document.getElementById('app');
    if (!A || !/ATUR\s*TIM/i.test(A.textContent || '')) { autoClicks = 0; return; }
    lockCSS();
    teamCards(A).forEach((card) => {
      const t = (card.textContent || '').toUpperCase();
      const isKael = /\bKAEL\b/.test(t) && t.indexOf('ALTERNATE') < 0;
      if (isKael) {
        card.removeAttribute('data-pwlockcard');
        if (!hasBadge(card) && autoClicks < 8) { autoClicks++; card.click(); }      /* pilih Kael otomatis */
      } else {
        if (hasBadge(card) && autoClicks < 8) { autoClicks++; card.click(); }       /* lepas yang terlanjur terpilih */
        card.setAttribute('data-pwlockcard', '1');
        card.setAttribute('tabindex', '-1');
        card.setAttribute('aria-disabled', 'true');
      }
    });
  }

  /* blokir klik/Enter asli (bukan dari script) pada kartu terkunci selama chapter berjalan */
  ['click', 'mousedown', 'pointerdown', 'touchstart'].forEach((ev) => {
    document.addEventListener(ev, (e) => {
      if (!guardTimer || !e.isTrusted) return;
      const t = e.target && e.target.closest ? e.target.closest('[data-pwlockcard]') : null;
      if (t) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  });

  function guardTick() { enforceKael(); blockSwapUI(); lockTeamScreen(); }

  function lockParty() {
    const G = window.G, S = G && G.state;
    if (!S) { alert('Data game belum siap.'); return false; }
    if (!st.story.savedParty) {
      st.story.savedParty = (S.party || []).slice();
      st.story.savedExtra = {};
      TEAM_KEYS.concat(BENCH_KEYS, LEAD_KEYS).forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(S, k) && (Array.isArray(S[k]) || typeof S[k] === 'string')) {
          st.story.savedExtra[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
        }
      });
    }
    enforceKael();
    if (!guardTimer) guardTimer = setInterval(guardTick, 120);   /* pengawas: paksa Kael terus */
    MA.save(); G.save && G.save();
    return true;
  }

  function unlockParty() {
    if (guardTimer) { clearInterval(guardTimer); guardTimer = null; }
    document.querySelectorAll('[data-pwlockcard]').forEach((e) => { e.removeAttribute('data-pwlockcard'); e.removeAttribute('aria-disabled'); e.removeAttribute('tabindex'); });
    autoClicks = 0;
    const G = window.G, S = G && G.state;
    if (!S || !st.story.savedParty) return;
    S.party = st.story.savedParty.slice();
    const ex = st.story.savedExtra || {};
    Object.keys(ex).forEach((k) => { S[k] = Array.isArray(ex[k]) ? ex[k].slice() : ex[k]; });
    delete st.story.savedParty;
    delete st.story.savedExtra;
    MA.save(); G.save && G.save();
  }

  /* ============================================================
   *  BABAK CERITA PARALLEL WORLD  (40 CHAPTER)
   * ============================================================ */
  const BOSS_NAMES = {
    guardian: 'Penjaga Gerbang',
    shadow_guardian: 'Penjaga Bayangan',
    corrupted_elder: 'Tetua Tercemar',
  };

  /* nama pembicara (singkatan -> nama tampil). Protagonis = KAEL. */
  const SP = { A: 'ARCHIVE', K: 'KAEL', E: 'ELIZABETH', X: '???' };
  const L = (arr) => arr.map((r) => [SP[r[0]] || r[0], r[1]]);

  /* 8 ARC x 5 CHAPTER */
  const ARCS = [
    { n: 'ARC I — RETAKAN', d: 'Kau terbangun tanpa nama di dunia yang sudah lama sekarat.' },
    { n: 'ARC II — INGATAN PALSU', d: 'Masa lalu yang kau ingat ternyata disusun orang lain.' },
    { n: 'ARC III — DARAH ARSIP', d: 'Arsip menyimpan lebih banyak rahasia daripada yang ia akui.' },
    { n: 'ARC IV — JEJAK PENULIS', d: 'Kau mulai curiga bahwa kau bukan manusia, melainkan tulisan.' },
    { n: 'ARC V — DUNIA RETAK', d: 'Setiap jawaban yang kau temukan melukai dunia ini.' },
    { n: 'ARC VI — DENDAM', d: 'Kau mulai ingat untuk apa kau diciptakan.' },
    { n: 'ARC VII — ARSIP RUNTUH', d: 'Satu-satunya penuntunmu perlahan mati.' },
    { n: 'ARC VIII — KEBENARAN', d: 'Tidak ada lagi yang bisa disembunyikan.' },
  ];

  /* [judul, boss, blurb, intro, outro, extra]
   * Garis besar kebenaran:
   *  - Dunia ini adalah NASKAH yang ditulis berkali-kali oleh seorang Penulis yang
   *    kehilangan Elizabeth. Tiap naskah gagal, lalu dibuang jadi dunia paralel.
   *  - Kael adalah tokoh ke-131: sisa DENDAM sang Penulis yang diberi nama & wajah,
   *    dibuat supaya kelak memegang pena dan menulis ulang kenyataan.
   *  - ARCHIVE dibuat untuk mencegah pena itu dipakai. Ia gagal menahan dunia.
   *  - Apa pun pilihan Kael, era kelam tidak akan berakhir. */
  const RAW = [
    /* ===== ARC I — RETAKAN ===== */
    ['GERBANG YANG TERBALIK', 'Penjaga Gerbang',
      'Kau terbangun di antara abu. Hanya satu hal yang kau punya: sebuah nama.',
      [['A', 'Kau bangun di tengah abu. Satu-satunya yang tersisa di kepalamu hanyalah sebuah nama: Kael.'],
       ['K', 'Kenapa aku tidak ingat apa pun? Hanya ada bekas luka di tangan kiriku.'],
       ['A', 'Dunia ini sedang sekarat. Kebenaran tentang dirimu terkubur di dalam sakitnya. Cari dia.']],
      [['K', 'Gerbang terbuka. Tapi di baliknya hanya ada dunia yang lebih sunyi.'],
       ['A', 'Setiap jawaban punya harga, Kael. Hari ini kau belum membayar apa-apa.']],
      { bossFrom: 'world1', dec1: ['world1', 'save_village'], dec2: ['world1', 'guardian_fate'] }],

    ['KOTA CERMIN', 'Penguasa Cermin',
      'Sebuah kota yang membalik setiap langkahmu. Pantulanmu tidak punya luka yang sama denganmu.',
      [['A', 'Kota ini tidak punya bayangan. Semua bayangan berdiri di seberang cermin, menatapmu.'],
       ['K', 'Pantulanku tidak punya bekas luka di tangan kiri. Padahal luka itu satu-satunya yang kuingat.'],
       ['A', 'Cermin tidak pernah berbohong.']],
      [['K', 'Cermin itu pecah. Serpihannya memperlihatkan wajah yang lebih tua dan sangat lelah.'],
       ['A', 'Itu bukan wajahmu, Kael. Belum.']]],

    ['PERPUSTAKAAN TANPA HURUF', 'Pustakawan Bisu',
      'Setiap orang punya satu buku. Buku tentangmu kosong.',
      [['A', 'Setiap orang di dunia ini punya satu buku. Cari milikmu.'],
       ['K', 'Semua halamannya kosong. Hanya ada satu garis di sampul: sebuah nama yang dicoret.']],
      [['K', 'Dicoret, bukan dihapus. Seseorang tidak ingin aku hilang sepenuhnya.'],
       ['A', 'Atau seseorang ingin kau menemukannya, tepat pada saat yang ia tentukan.']]],

    ['JALAN TANPA UJUNG', 'Pejalan Berulang',
      'Pohon yang sama, batu yang sama. Kau sudah berjalan di sini berkali-kali.',
      [['K', 'Pohon ini, batu ini... aku sudah pernah lewat sini. Berkali-kali.'],
       ['A', 'Sebelas kali. Yang terpotong bukan jalannya, tapi ingatanmu.']],
      [['K', 'Setiap putaran aku bertanya hal yang sama, dan setiap putaran aku lupa jawabannya.'],
       ['K', 'Kali ini tidak. Aku akan menyimpannya, sekecil apa pun.']]],

    ['NAMA YANG TERHAPUS', 'Penghapus Nama',
      'Kau mencoba mengingat namamu yang lain. Sesuatu menghalangimu.',
      [['K', 'Kael... itu pasti bukan namaku yang sebenarnya. Siapa aku sebelum ini?'],
       ['A', 'Kael adalah nama yang diberikan padamu. Nama yang lain dilindungi seseorang yang lebih dulu ada.']],
      [['K', 'Semakin dalam aku mencari, semakin sedikit yang tersisa untuk dipegang.'],
       ['A', 'Garis waktu mulai retak di tepinya. Jangan menoleh ke belakang terlalu lama.']]],

    /* ===== ARC II — INGATAN PALSU ===== */
    ['RUMAH MASA KECIL', 'Ibu Boneka',
      'Rumah yang kau ingat ternyata hanya dinding kertas.',
      [['K', 'Ini rumahku. Tapi dindingnya hanya kertas.'],
       ['A', 'Rumah ini disusun dari potongan ingatanmu. Ada yang sengaja ditambahkan.']],
      [['K', 'Wanita itu tersenyum, tapi aku tidak pernah punya ibu yang tersenyum seperti itu.'],
       ['A', 'Seseorang menulis masa kecilmu, Kael. Bukan kau.']]],

    ['SEKOLAH TANPA MURID', 'Guru Bayangan',
      'Bel berbunyi, tapi tidak ada yang masuk. Kelas ini menunggu satu orang.',
      [['A', 'Bel berbunyi tapi tidak ada yang masuk. Kelas ini menunggu satu orang.'],
       ['K', 'Mejaku. Ada ukiran di sana: “jangan percaya Arsip”.']],
      [['A', 'Itu bukan tulisanku.'],
       ['K', 'Bukan. Itu tulisan tanganku sendiri, dari seseorang yang pernah berdiri di sini sebelum aku.']]],

    ['ALBUM FOTO KOSONG', 'Kolektor Potret',
      'Semua wajah di foto terhapus, kecuali satu perempuan yang berdiri di sampingmu.',
      [['K', 'Semua wajah di foto ini terhapus. Kecuali satu perempuan yang berdiri di sampingku.'],
       ['A', 'Namanya Elizabeth.']],
      [['K', 'Elizabeth ada di setiap fotoku. Tapi aku tidak ingat sedekat apa kami dulu.'],
       ['A', 'Mungkin itu bagian yang paling menyakitkan, jadi ia disimpan paling dalam.']]],

    ['HUJAN ABU', 'Peramal Abu',
      'Langit menurunkan abu. Setiap serpihnya adalah halaman yang terbakar.',
      [['A', 'Langit menurunkan abu seperti salju. Setiap serpihnya adalah halaman yang terbakar.'],
       ['A', 'Dunia ini mulai kehabisan halaman.']],
      [['K', 'Kenapa Arsip membiarkan dunianya terbakar?'],
       ['A', 'Aku tidak membakarnya. Aku hanya tidak lagi mampu menahannya.']]],

    ['SUARA DALAM KASET', 'Penyiar Gema',
      'Sebuah kaset berputar sendiri. Suara seseorang berkata: “Jangan cari aku.”',
      [['X', 'Jangan cari aku. Kalau kau mendengar ini, berhentilah di sini.'],
       ['K', 'Suara itu mirip suaraku. Kenapa dia melarangku mencari?']],
      [['A', 'Karena dia tahu kau tidak akan berhenti.'],
       ['K', 'Ingatan masa kecilku palsu. Lalu apa yang asli dariku?'],
       ['A', 'Bagian pertama kebenaran sudah terbuka. Sisanya tidak akan seindah ini.']]],

    /* ===== ARC III — DARAH ARSIP ===== */
    ['RUANG ARSIP RAHASIA', 'Penjaga Arsip',
      'Ruangan yang tidak ada di peta. Di rak-raknya, ratusan salinan dirimu.',
      [['A', 'Ruangan ini tidak ada di peta. Aku sendiri jarang masuk ke sini.'],
       ['K', 'Kenapa ada begitu banyak salinan diriku di rak?']],
      [['K', 'Seratus tiga puluh versi Kael. Semuanya berhenti di halaman yang berbeda.'],
       ['A', 'Dan kau yang ke-131. Yang pertama masih berjalan sejauh ini.']]],

    ['MESIN PENJAHIT TAKDIR', 'Penenun Takdir',
      'Benang merah menjalar dari langit-langit, menjahit orang menjadi cerita.',
      [['K', 'Benang merah ini menempel di dadaku.'],
       ['A', 'Benang itu menuntunmu sejak awal. Kau tidak pernah benar-benar punya pilihan.']],
      [['K', 'Kau mengakuinya sekarang?'],
       ['A', 'Aku tidak bisa berbohong lagi. Aku mulai retak juga.']]],

    ['GUDANG DUNIA MATI', 'Pemulung Dunia',
      'Dunia-dunia gagal ditumpuk seperti sampah. Beberapa masih berdenyut.',
      [['A', 'Setiap naskah yang gagal dibuang ke sini. Setiap garis waktu yang tidak memuaskan penulisnya.'],
       ['K', 'Ada suara dari dalam tumpukan itu. Mereka masih hidup.']],
      [['K', 'Mereka masih hidup, dan dunia ini menutup pintunya begitu saja.'],
       ['A', 'Itulah harga dari sebuah dunia yang rapi.']]],

    ['MENARA JAM PATAH', 'Penjaga Waktu Patah',
      'Jarum jam berputar mundur. Setiap detik menghapus satu kenangan.',
      [['A', 'Jangan berdiri terlalu lama. Waktu di sini memakan ingatan.'],
       ['K', 'Tadi aku sedang marah pada seseorang. Aku lupa siapa.']],
      [['A', 'Cepat, ucapkan tujuanmu sebelum ikut hilang!'],
       ['K', 'Mencari tahu siapa aku sebenarnya, dan kenapa dunia ini dibiarkan membusuk.']]],

    ['PASAR FRAGMEN', 'Pedagang Ingatan',
      'Ingatan dijual dalam botol kaca. Satu botol berlabel namamu.',
      [['K', 'Satu botol ini berlabel namaku.'],
       ['X', 'Isinya bukan ingatanmu. Ingatan itu milik orang yang menulismu.']],
      [['K', 'Jadi ingatan yang kuyakini sebagai milikku... sebenarnya dipinjam?'],
       ['A', 'Dipinjam, dipotong, lalu ditempelkan padamu. Maaf, Kael. Aku tahu sejak lama.']]],

    /* ===== ARC IV — JEJAK PENULIS ===== */
    ['LORONG SEPASANG LANGKAH', 'Langkah Kedua',
      'Suara langkah mengikutimu, terlambat setengah detik.',
      [['A', 'Jangan menoleh.'],
       ['K', 'Kenapa?'],
       ['A', 'Karena kau akan mengenalinya.']],
      [['K', 'Wajah itu hampir seperti wajahku, tapi jauh lebih tua dan lelah.'],
       ['A', 'Dialah yang menulis semuanya. Sang Penulis. Dan ia berhenti di sini.']]],

    ['TAMAN YANG MATI', 'Tukang Kebun Duka',
      'Bunga-bunga di taman ini tumbuh dari nisan.',
      [['E', 'Seseorang menanam kami di sini agar tidak dilupakan.'],
       ['K', 'Elizabeth? Kau ada di sini?']],
      [['E', 'Aku hanya gema. Yang menyiramku adalah dukanya.'],
       ['K', 'Duka siapa?'],
       ['E', 'Cari sendiri. Aku tidak sanggup mengatakannya.']]],

    ['PANGGUNG SANDIWARA', 'Sutradara Palsu',
      'Tirai terbuka. Seluruh perjalananmu dipentaskan lengkap dengan naskah.',
      [['A', 'Setiap dialog ditulis. Setiap pilihan sudah dipilihkan.'],
       ['K', 'Termasuk saat ini?'],
       ['A', 'Termasuk saat ini.']],
      [['K', 'Kalau semuanya sudah ditulis, kenapa aku masih bisa marah?'],
       ['A', 'Karena penulisnya juga marah. Dan kemarahannya ikut mengalir padamu.']]],

    ['RUANG INTEROGASI', 'Hakim Diri',
      'Satu kursi, satu lampu, dan hakim dengan wajah yang kau kenal.',
      [['X', 'Kau dituduh bukan manusia. Apa yang bisa kau katakan untuk dirimu, hai Tokoh?'],
       ['K', 'Aku bernapas. Aku merasa sakit. Aku berjalan sejauh ini dengan kakiku sendiri!']],
      [['X', 'Vonis ditunda. Kau belum cukup kuat untuk mendengarnya.'],
       ['A', 'Sedikit lagi, Kael. Kau hampir sampai.']]],

    ['KEMATIAN PERTAMA', 'Dirimu yang Pertama',
      'Di tengah ruangan terbaring tubuh dengan wajah yang sama denganmu. Ia sudah mati lama sekali.',
      [['K', 'Wajah itu wajahku. Jadi aku bukan yang asli?'],
       ['A', 'Itu wajah sang Penulis, saat ia masih muda. Wajahmu dipinjam darinya.']],
      [['A', 'Kebenaran pertama: kau bukan manusia, Kael. Kau adalah dendam sang Penulis yang diberi nama dan wajah.'],
       ['K', 'Jadi seluruh hidupku hanyalah kemarahan orang lain yang dibuat berjalan.'],
       ['A', 'Itu yang kuketahui. Tapi aku tidak tahu apa yang akan kau lakukan dengan kebenaran itu.']]],

    /* ===== ARC V — DUNIA RETAK ===== */
    ['LANGIT RETAK', 'Penjaga Langit Retak',
      'Langit pecah seperti kaca. Dari retaknya merembes tinta hitam.',
      [['A', 'Setiap kebenaran yang kau temukan melukai dunia ini. Aku tidak bisa menahannya lagi.'],
       ['K', 'Jadi semakin aku mencari tahu, semakin dunia ini hancur?']],
      [['A', 'Dunia ini ditulis dari ketidaktahuanmu. Semakin kau tahu, semakin ia robek.'],
       ['K', 'Dan aku tetap berjalan. Itu membuatku sama kejamnya dengan penulisku.']]],

    ['LAUT TERBALIK', 'Leviathan Terbalik',
      'Laut menggantung di langit. Ikan berenang di atas kepalamu.',
      [['K', 'Haruskah kita terus?'],
       ['A', 'Berhenti sekarang berarti semua yang hilang tadi sia-sia.']],
      [['A', 'Leviathan itu tenggelam ke atas, lenyap di dalam retakan langit.'],
       ['A', 'Satu dunia lagi hilang dari daftar. Nelayan di dunia itu tidak sempat tahu kenapa.']]],

    ['KOTA TANPA WARNA', 'Kurator Abu-abu',
      'Warna dicabut satu per satu. Orang-orang berjalan seperti tokoh yang naskahnya habis.',
      [['K', 'Mereka masih bernapas?'],
       ['A', 'Selama kau masih membaca, mereka masih ada.']],
      [['K', 'Aku tidak mau membuat orang lain menderita demi jawabanku.'],
       ['A', 'Terlambat untuk itu. Kita sudah terlalu jauh.']]],

    ['HUTAN JERITAN', 'Rimba Menjerit',
      'Pohon-pohon menjerit dengan suara orang yang kau kenal.',
      [['E', 'Tolong jangan lihat aku. Aku sudah bukan aku.'],
       ['K', 'Elizabeth! Kenapa semuanya jadi seperti ini?']],
      [['A', 'Karena kau semakin dekat dengan jawabannya.'],
       ['K', 'Kalau begitu jawabannya pasti sesuatu yang mengerikan.']]],

    ['GERBANG SERIBU PINTU', 'Penjaga Pintu',
      'Seribu pintu, satu yang benar. Sisanya membawa ke akhir dunia lain.',
      [['A', 'Pintu paling gelap. Ikuti aku.'],
       ['K', 'Kenapa selalu pintu yang paling gelap?']],
      [['A', 'Pintu yang benar terbuka. Di baliknya ada bau terbakar.'],
       ['A', 'Mulai dari sini aku tidak bisa lagi memastikan apakah yang kau lihat itu nyata.']]],

    /* ===== ARC VI — DENDAM ===== */
    ['ALTAR PEMBALASAN', 'Imam Dendam',
      'Altar di tengah reruntuhan. Di atasnya nama-nama yang dicoret dengan darah.',
      [['X', 'Ini daftar mereka yang harus membayar. Daftar yang ditulis sang Penulis untukmu.'],
       ['K', 'Untukku? Kenapa namaku ada di bagian paling atas?']],
      [['K', 'Aku lahir untuk menagih semua ini. Dendamnya adalah isi tubuhku.'],
       ['A', 'Dendam itu bukan dirimu, Kael. Tapi kau yang harus membawanya.']]],

    ['PERANG TANPA NAMA', 'Jenderal Hampa',
      'Dua pasukan saling menebas tanpa tahu alasannya. Panji mereka sama-sama kosong.',
      [['A', 'Perang ini lahir dari satu kemarahan yang dituliskan terlalu kuat.'],
       ['K', 'Berhenti! Kalian bahkan tidak tahu kenapa kalian bertarung!']],
      [['K', 'Setiap korban di sini lahir dari amarah yang sama denganku?'],
       ['A', 'Kau menyebutnya dendam. Dunia menyebutnya bencana.']]],

    ['MAKAM ELIZABETH', 'Gema Elizabeth',
      'Di tengah makam, sebuah batu tanpa nama. Kau tahu siapa pemiliknya.',
      [['K', 'Elizabeth, kaulah yang hilang itu. Yang membuat sang Penulis gila.'],
       ['E', 'Aku mati karena kecerobohanku sendiri, bukan karena siapa pun. Tapi dia tidak bisa menerimanya.']],
      [['E', 'Dia menulis ulang dunia demi aku. Dan setiap tulisan ulang melukai orang lain.'],
       ['K', 'Dan aku tokoh terakhir yang ia tulis untuk menyelesaikannya.'],
       ['E', 'Kau boleh membencinya. Tapi jangan menjadi dia.']]],

    ['API YANG DINYALAKAN', 'Pembakar Dunia',
      'Kau melihat dirimu sendiri menyalakan api di desa pertama.',
      [['X', 'Lihatlah. Bukan penjaga gerbang yang membakarnya. Kau.'],
       ['K', 'Aku... tidak ingat melakukannya.']],
      [['K', 'Tanganku yang menyalakan api itu, di salah satu garis waktu yang sudah dibuang.'],
       ['A', 'Kau korban sekaligus penyebabnya. Itu yang membuat kisahmu begitu kejam.']]],

    ['PENA PERTAMA', 'Penulis Pertama',
      'Sebuah pena hitam melayang di ruang hampa. Siapa pun pemegangnya bisa menulis ulang kenyataan.',
      [['A', 'Pena itu bukan milikku. Aku diciptakan agar pena itu tidak pernah dipakai. Dan aku gagal.']],
      [['A', 'Pena itu menunggu pemiliknya. Kau tahu siapa.'],
       ['K', 'Aku belum memutuskan apa pun.'],
       ['A', 'Tentu. Kau selalu memutuskan di akhir.']]],

    /* ===== ARC VII — ARSIP RUNTUH ===== */
    ['PERPUSTAKAAN TERBAKAR', 'Arsiparis Gila',
      'Perpustakaan tempat semuanya dimulai kini terbakar. Arsip tertawa di antara asapnya.',
      [['A', 'Maaf. Aku mulai lupa siapa yang menciptakanku.'],
       ['K', 'Arsip, bertahanlah.']],
      [['A', 'Aku sudah hampir selesai. Maju terus.']]],

    ['HALAMAN ROBEK', 'Perobek Halaman',
      'Halaman beterbangan seperti burung yang terluka. Beberapa memuat wajah orang yang tidak kau kenal.',
      [['K', 'Mereka siapa?'],
       ['A', 'Orang-orang yang hidup dan mati di dunia yang dibuang. Tak seorang pun menyelamatkan mereka.']],
      [['K', 'Ada tulisan di salah satu halaman: “Tolong hentikan ini.” Itu tulisan tangan sang Penulis.'],
       ['A', 'Bagian dirinya yang sudah lama lelah. Ia meminta tolong kepada tokoh yang ia ciptakan sendiri.']]],

    ['TINTA HITAM', 'Raja Tinta',
      'Tinta menenggelamkan lantai sampai selutut. Setiap tetesnya membisikkan nama aslimu.',
      [['X', 'Namamu yang sebenarnya adalah...'],
       ['A', 'Jangan dengarkan!']],
      [['K', 'Aku sudah mendengarnya. Dan ternyata tidak ada nama lain.'],
       ['K', 'Namaku memang Kael. Satu-satunya hal yang benar-benar milikku.'],
       ['A', 'Itu cukup, Kael. Itu lebih dari cukup.']]],

    ['RUANG TANPA CERMIN', 'Dirimu yang Terbuang',
      'Tidak ada pantulan. Hanya sisi dirimu yang pernah kau buang: marah, takut, serakah.',
      [['X', 'Kau membuang kami. Sekarang kami datang menagih.'],
       ['K', 'Kalian bagian dariku. Aku tidak bisa membunuh kalian.']],
      [['A', 'Maka jangan lawan mereka. Terima mereka, lalu lanjutkan.'],
       ['K', 'Menerima, bukan menghapus.']]],

    ['JANTUNG ARSIP', 'Jantung Arsip',
      'Arsip menuntunmu ke jantungnya. Berdenyut lemah, hampir berhenti.',
      [['A', 'Kalau aku mati, dunia paralel berhenti terbelah. Tapi pena itu jadi bebas.']],
      [['A', 'Aku sudah memberikan semua yang kupunya. Sisanya pilihanmu.'],
       ['K', 'Arsip...'],
       ['A', 'Terima kasih sudah menjadi pembaca terakhirku. Berjalanlah, Kael.']]],

    /* ===== ARC VIII — KEBENARAN ===== */
    ['LORONG AKHIR', 'Bayangan Sang Penulis',
      'Sosok tua dengan wajah yang kau kenal menunggumu. Ia tidak marah. Ia hanya sangat lelah.',
      [['X', 'Akhirnya kau datang. Tokohku yang ke-131.'],
       ['K', 'Kau yang menulisku. Kau yang membuat dunia ini seperti ini.'],
       ['X', 'Benar. Dan aku sudah terlalu lelah untuk membela diri.']],
      [['X', 'Kalahkan aku sebanyak yang kau mau. Di ujung lorong nanti, kau tetap yang memilih.']]],

    ['WUJUD KEHILANGAN', 'Wujud Kehilangan',
      'Bayangan raksasa yang menyerupai Elizabeth, tapi hancur dari dalam.',
      [['E', 'Aku bukan dia. Aku hanya apa yang tersisa dari kehilangan.']],
      [['K', 'Aku mengerti. Kehilangan tidak bisa dikalahkan.'],
       ['E', 'Hanya bisa dibawa. Atau dijadikan senjata.']]],

    ['TAKHTA KOSONG', 'Penjaga Takhta Kosong',
      'Siapa pun yang duduk di sana menjadi penulis dunia baru.',
      [['K', 'Aku tidak ingin menjadi penulis siapa pun.'],
       ['X', 'Kalau begitu kau tidak layak duduk. Kau hanya layak memilih.']],
      [['A', 'Takhta itu bergetar, tapi tidak runtuh. Kau akan tetap sampai di ujung.']]],

    ['GERBANG SEBELUM AKHIR', 'Bayangan Dirimu',
      'Seratus tiga puluh Kael berbaris di gerbang terakhir: yang marah, yang menyerah, yang mati.',
      [['K', 'Aku tidak akan menjadi salah satu dari kalian.'],
       ['X', 'Kau sudah menjadi kami semua.']],
      [['E', 'Apa pun yang kau pilih nanti, aku tidak akan menyalahkanmu.'],
       ['K', 'Terima kasih, Elizabeth. Aku akan memilih sendiri.']]],

    ['UJUNG SEMUA DUNIA', 'Penulis Alternatif',
      'Halaman terakhir. Tidak ada lagi cabang. Hanya pena, dan kau.',
      [['A', 'Ini halaman terakhir dari semua dunia. Setelah ini tidak ada cabang lagi.'],
       ['X', 'Ambil pena itu, Kael. Hidupkan dia kembali. Dunia hanyalah tinta.'],
       ['K', 'Atau aku melepaskan semuanya.']],
      [['A', 'Penulis Alternatif lenyap. Pena hitam kini menunggu tanganmu.'],
       ['K', 'Jadi di sinilah semuanya berakhir. Dan hanya aku yang memutuskan bagaimana.']]],
  ];

  const STORY = RAW.map((r, i) => Object.assign({
    t: r[0], boss: r[1], blurb: r[2], intro: L(r[3]), outro: L(r[4]),
    arc: Math.floor(i / 5),
  }, r[5] || {}));
  const N = STORY.length;

  /* ---------- KEPUTUSAN TERAKHIR & ENDING ---------- */
  const FINAL_TEXT =
    'Pena hitam melayang di depanmu. Elizabeth menunggu dalam diam. Bayangan sang Penulis menatap dari kejauhan. ' +
    'Semua kebenaran sudah terbuka. Kini hanya ada dua jalan.\n\n' +
    'Apa pun yang kau pilih, dunia ini tidak akan pulih. Era kelam sudah terlalu dalam: kelaparan, perang, dan abu akan tetap ada. ' +
    'Yang kau tentukan hanyalah bagaimana dunia itu bertahan.\n\n' +
    '🕊️ TERIMA & BERDAMAI: kau melepaskan dendam dan mematahkan pena. Kael lenyap, dunia tak lagi ditulis siapa pun.\n\n' +
    '🔥 SIMPAN DENDAM: kau mengambil pena dan menulis ulang kenyataan. Dunia menjadi naskahmu, selamanya.';

  const ENDINGS = {
    good: {
      name: 'GOOD ENDING — “NAMA MILIKKU”',
      scene: L([
        ['K', 'Aku bukan dendam sang Penulis. Aku Kael. Itu satu-satunya hal yang benar-benar milikku.'],
        ['X', 'Kalau kau mematahkan pena itu, kau ikut lenyap. Dunia ini juga tidak akan pernah disembuhkan.'],
        ['K', 'Aku tahu. Dunia ini terlalu rusak untuk disembuhkan. Tapi setidaknya ia tidak akan ditulis ulang lagi, dan tidak ada lagi dunia yang dibuang.'],
        ['E', 'Terima kasih, Kael. Sudah mau pulang.'],
        ['K', 'Maaf aku tidak bisa memberikan akhir yang indah. Hanya akhir yang jujur.'],
        ['A', 'Pena patah. Satu nama tertulis, bukan oleh tinta, melainkan oleh dunia yang kau tinggalkan.'],
      ]),
      post(v) {
        const village = {
          prime: 'Desa di gerbang pertama masih berdiri, tapi sumurnya kering dan ladangnya gagal panen. Penduduknya bertahan dengan sisa gandum, dan tidak pernah tahu siapa yang menjaga gerbang mereka.',
          fallen: 'Desa di gerbang pertama tetap menjadi abu. Para penyintas membangun gubuk di atas reruntuhan dan menguburkan nama-nama yang tidak sempat mereka tulis.',
          redeemed: 'Penjaga gerbang yang dulu terkutuk kini menjaga sebuah desa yang kelaparan. Ia membagi jatah makannya kepada anak-anak, dan tidak pernah meminta maaf, sebab ia tidak tahu kepada siapa.',
        }[v] || 'Desa di gerbang pertama bertahan dalam kesunyian dan kelaparan.';
        return [
          'Pena itu patah, dan dunia berhenti terbelah. Tidak ada lagi dunia yang dibuang, tidak ada lagi tinta yang merembes dari langit.',
          'Tapi langit yang retak tidak menyatu kembali. Abu masih turun, laut masih menggantung, dan kota-kota tetap kehilangan warnanya.',
          village,
          'Perang tanpa nama tetap berkobar. Kini perang itu lahir dari lapar dan takut, bukan dari tulisan siapa pun. Tak ada lagi yang bisa disalahkan, dan tak ada lagi yang bisa menyelamatkan.',
          'Elizabeth tidak kembali. Namanya tinggal gema di taman yang mati, tempat bunga tumbuh dari nisan dan tidak ada yang menyiraminya lagi.',
          'Kael lenyap tanpa meninggalkan jasad. Tidak ada yang mengingatnya, kecuali dunia yang diam-diam masih menyimpan jejak langkahnya.',
          'Di tengah reruntuhan, seorang anak kelaparan menemukan buku kosong. Ia tidak menunggu siapa pun menulis ceritanya. Dengan tangan gemetar, ia menulis namanya sendiri.',
          'Era kelam masih panjang. Tetapi untuk pertama kalinya, penderitaan dunia ini adalah milik dunia itu sendiri.',
        ];
      },
    },
    bad: {
      name: 'BAD ENDING — “TINTA”',
      scene: L([
        ['K', 'Aku tidak akan memaafkan dunia yang mengambilnya. Dunia yang membuatku hanya untuk menanggung semua ini.'],
        ['X', 'Akhirnya. Tulis, Kael. Tulis semuanya.'],
        ['E', 'Jangan. Jangan lakukan ini atas namaku.'],
        ['K', 'Maaf, Elizabeth. Aku tidak tahu cara lain untuk menjadi sesuatu selain dendam ini.'],
        ['A', 'Pena menyentuh halaman. Dunia-dunia paralel runtuh menjadi tinta, dan tinta itu menjadi satu kalimat: “Dia kembali.”'],
      ]),
      post(v) {
        const village = {
          prime: 'Desa di gerbang pertama masih berdiri. Penduduknya mengulang pagi yang sama setiap hari, dengan perut kosong yang tak pernah mereka mengerti.',
          fallen: 'Desa di gerbang pertama tetap menjadi abu. Kau menuliskannya demikian, karena amarahmu butuh sesuatu untuk dikenang.',
          redeemed: 'Penjaga gerbang yang dulu kau ampuni kini berdiri di depan desa yang kosong, menunggu seseorang yang tidak akan pernah datang.',
        }[v] || 'Desa di gerbang pertama kosong dan sunyi.';
        return [
          'Elizabeth kembali. Ia berdiri di dunia yang kau tulis ulang, tetapi tak seorang pun mengenali dunia itu, termasuk dirinya.',
          'Langit kini adalah halaman putih yang dipenuhi kalimat. Orang-orang berjalan, berbicara, dan tersenyum persis seperti yang kau tuliskan, tidak lebih.',
          'Kelaparan, perang, dan abu tidak kau hapus. Kau menuliskannya, karena dunia yang tidak menderita terasa asing bagi tangan yang hanya mengenal dendam.',
          village,
          'Dunia-dunia paralel yang lain habis menjadi tinta. Tidak ada lagi jalan menuju dunia lain, tidak ada lagi tempat untuk pergi.',
          'Arsip tidak pernah bangun lagi. Tak ada yang tersisa untuk mengingatkanmu bahwa kau pernah punya pilihan.',
          'Elizabeth menatapmu dan bertanya, “Kenapa kau menangis?” Kau tidak bisa menjawab, sebab kau tidak boleh menuliskan jawaban untuk dirimu sendiri.',
          'Era kelam tidak akan pernah berakhir. Kau telah menjadi sang Penulis berikutnya, dan di suatu tempat dalam tinta, sebuah halaman kosong mulai menyiapkan tokoh ke-132.',
        ];
      },
    },
  };

  /* ---------- efek korupsi ---------- */
  const GL = '▓▒░#@%§¤Ø∆Ξ';
  function corrupt(s, lv, seed, k) {
    const p = (lv - 0.2) * (k || 0.35);
    if (p <= 0) return s;
    let out = '', r = (seed + 1) * 7919;
    for (let n = 0; n < s.length; n++) {
      r = (r * 9301 + 49297) % 233280;
      const c = s[n];
      out += (c !== ' ' && r / 233280 < p) ? GL[r % GL.length] : c;
    }
    return out;
  }

  function setOverlay(lv) {
    const b = document.body;
    b.classList.add('pw-in');
    b.classList.toggle('pw-hi', lv >= 0.5);
    b.style.setProperty('--pwcor', Math.max(0, Math.min(1, lv)).toFixed(2));
  }
  function clearOverlay() { document.body.classList.remove('pw-in', 'pw-hi'); }

  /* ---------- skala musuh mengikuti level KAEL ---------- */
  function topLevel() {
    const G = window.G, S = G && G.state;
    if (!S || !S.lv) return 1;
    const kv = S.lv[kaelId()];
    if (kv && kv.l) return kv.l;
    let m = 1;
    Object.keys(S.lv).forEach((k) => { const v = S.lv[k]; if (v && v.l > m) m = v.l; });
    return m;
  }
  function effCh() { return Math.round(CFG.BASE_CH + (topLevel() - 1) * CFG.LV_SCALE); }

  function mkFoe(cn, stage, boss, name, mult) {
    const G = window.G;
    if (G.foe) return G.foe(cn, stage, boss, name, mult);
    const e = G.mkEnemy(Math.min(cn, 10), stage, boss, name);
    if (mult && e.hp != null) { e.hp = Math.round(e.hp * (mult.hp || 1)); if (e.max != null) e.max = e.hp; }
    if (mult && e.atk != null) e.atk = Math.round(e.atk * (mult.atk || 1));
    return e;
  }

  function foesFor(c, i, k, bossName) {
    const cn = effCh();
    const hm = 1 + CFG.HP_PER_CH * i, am = 1 + CFG.ATK_PER_CH * i, xm = 1.5 + CFG.XP_PER_CH * i;
    if (k === 2) {
      /* boss: tiap chapter ke-5 (arc finale) lebih kuat, chapter 40 paling kuat */
      const bb = (i === N - 1) ? 1.6 : (i % 5 === 4 ? 1.3 : 1.15);
      return [
        mkFoe(cn, 3, 1, bossName, { hp: hm * 1.25 * bb, atk: am * 1.1 * (bb > 1.2 ? 1.1 : 1), xp: xm * 2.5 }),
        mkFoe(cn, 1, 0, undefined, { hp: hm, atk: am, xp: xm }),
      ];
    }
    const n = k === 0 ? 2 : 3, a = [];
    for (let j = 0; j < n; j++) a.push(mkFoe(cn, 1 + ((k + j) % 3), 0, undefined, { hp: hm, atk: am, xp: xm }));
    return a;
  }

  function lose() {
    unlockParty();
    clearOverlay();
    typeof window.after === 'function' ? window.after() : screen();
  }

  function runChapter(i) {
    const G = window.G, S = G.state, c = STORY[i];
    if (!lockParty()) return;                       /* hanya Kael yang bertarung */
    const bossName = c.bossFrom ? (BOSS_NAMES[PW.getBoss(c.bossFrom)] || c.boss) : c.boss;
    setOverlay(i / (N - 1));

    const decide = (d, next) => { if (d) PW.prompt(d[0], d[1], () => next()); else next(); };
    const stage = (k, next) => {
      enforceKael();                                 /* kunci ulang sebelum SETIAP pertarungan */
      G.fight(foesFor(c, i, k, bossName), (ok) => {
        if (!ok) return lose();
        enforceKael();
        G.save && G.save();
        next();
      });
    };

    const reward = (next) => {
      const first = (st.story.cleared || 0) <= i, cn = effCh(), r = first ? 1 : 0.5;
      const y = Math.round((300 + 80 * cn) * (1 + 0.10 * i) * r);
      const it = Math.max(1, Math.round((2 + i * 0.25) * r)), sp = Math.max(1, Math.round((1 + i * 0.15) * r));
      S.yen = (S.yen || 0) + y; S.items = (S.items || 0) + it; S.spitems = (S.spitems || 0) + sp;
      if (first) st.story.cleared = i + 1;
      MA.save(); G.save && G.save();
      alert('PARALLEL WORLD CHAPTER ' + (i + 1) + ' SELESAI!' + (first ? '' : ' (ulang, hadiah 50%)') +
        '\n+¥' + y + ' · +' + it + ' Potion · +' + sp + ' SP Drink');
      if (next) next(); else screen();
    };

    const ending = (kind) => {
      st.story.ending = kind;
      st.story.endings[kind] = true;
      MA.emit('pw_ending', kind);
      MA.save();
      reward(() => G.dialog(ENDINGS[kind].scene, () => creditsScreen(kind)));
    };

    const finale = () => MA.modal('⚖️ KEPUTUSAN TERAKHIR', MA.esc(FINAL_TEXT), [
      { label: '🕊️ TERIMA & BERDAMAI (Kael mengorbankan diri)', fn: () => ending('good') },
      { label: '🔥 SIMPAN DENDAM (Kael mengambil pena)', fn: () => ending('bad') },
    ]);

    const done = (i === N - 1) ? finale : () => reward();

    G.dialog(c.intro, () =>
      decide(c.dec1, () =>
        stage(0, () => stage(1, () => stage(2, () =>
          G.dialog(c.outro, () => decide(c.dec2, done)))))));
  }

  /* ---------- LAYAR PARALLEL WORLD ---------- */
  function injectCSS() {
    if (document.getElementById('pw-p5')) return;
    const s = document.createElement('style');
    s.id = 'pw-p5';
    s.textContent = `
[data-pwhide]{display:none!important}
body.pw-in::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9998;background:repeating-linear-gradient(0deg,rgba(0,0,0,calc(var(--pwcor,0)*.38)) 0 1px,transparent 1px 3px);mix-blend-mode:multiply}
body.pw-hi::after{animation:pwFl 2.6s steps(1) infinite}
@keyframes pwFl{0%,90%,100%{opacity:1}92%{opacity:.35}94%{opacity:1}96%{opacity:.6}}
#app .pws{position:relative;display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;color:#fff;font-family:Impact,'Arial Narrow Bold',sans-serif;font-style:italic;background:#050505}
#app .pws .pwbg{position:absolute;inset:0;z-index:0;background:radial-gradient(circle,rgba(0,0,0,.38) 1.6px,transparent 2px) 0 0/11px 11px,linear-gradient(112deg,#4b0a8a 0 52%,#050505 52% 58%,#fff 58% 59%,#2a0550 59% 100%);animation:pwDots 14s linear infinite;filter:hue-rotate(calc(var(--cor,0)*-70deg)) saturate(calc(1 - var(--cor,0)*.55)) brightness(calc(1 - var(--cor,0)*.35))}
@keyframes pwDots{to{background-position:110px 110px,0 0}}
#app .pws .pwt{position:relative;z-index:2;display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px;padding:14px 30px;background:#000;box-shadow:0 5px 0 #fff,0 11px 0 #7a1fd1}
#app .pws .pwk{display:block;background:#fff;color:#000;font-size:28px;letter-spacing:2px;padding:6px 24px;transform:skewX(-14deg) rotate(-1.5deg);box-shadow:5px 5px 0 #7a1fd1}
#app .pws .pwl{display:block;background:#ffd400;color:#000;font-size:20px;padding:4px 18px;border:3px solid #000;transform:skewX(-14deg)}
#app .pws .pwp{position:relative;z-index:1;flex:1;min-height:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:26px 30px;align-content:start;padding:34px 44px;overflow-y:auto}
#app .pws .pwa{grid-column:1/-1;margin-top:10px;padding:6px 20px;background:#000;border-left:10px solid #ffd400;transform:skewX(-6deg)}
#app .pws .pwa b{display:block;font-weight:400;font-size:26px;letter-spacing:2px;color:#ffd400}
#app .pws .pwa small{display:block;font:700 13px/1.4 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#ccc}
#app .pws .pwc{display:block;background:#0a0a0a;border:3px solid #fff;box-shadow:8px 8px 0 #7a1fd1;padding:14px 22px 16px;transform:skewX(-6deg)}
#app .pws .pwc.lock{opacity:.55}
#app .pws .pwc.done{box-shadow:8px 8px 0 #ffd400}
#app .pws .pwc.cur{border-color:#ffd400}
#app .pws .pwc b{display:block;font-weight:400;font-size:30px;text-shadow:3px 3px 0 #7a1fd1}
#app .pws .pwc small{display:block;margin:6px 0 10px;font:700 14px/1.4 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#e8e8e8}
#app .pws button{display:inline-block;cursor:pointer;background:#7a1fd1;color:#fff;font:italic 400 22px Impact,sans-serif;letter-spacing:1px;padding:6px 26px;border:2px solid #fff;box-shadow:4px 4px 0 #000;transform:skewX(-10deg);transition:.12s}
#app .pws button:hover{background:#fff;color:#7a1fd1}
#app .pws button:disabled{background:#3a3a3a;color:#999;border-color:#777;box-shadow:none;cursor:not-allowed}
#app .pws .pwf{position:relative;z-index:2;display:flex;justify-content:flex-end;gap:16px;flex-wrap:wrap;padding:14px 36px 40px;background:#000;box-shadow:0 -5px 0 #fff,0 -11px 0 #7a1fd1}
#app .pws .pwf button{background:#fff;color:#000;font-size:24px;padding:10px 34px}
#app .pws .pwf button:hover{background:#ffd400;color:#000}
/* tingkat kerusakan UI mengikuti progres */
@keyframes pwGl{0%,91%,100%{transform:skewX(-6deg) translate(0)}92%{transform:skewX(-6deg) translate(-5px,1px)}94%{transform:skewX(-6deg) translate(6px,-2px)}96%{transform:skewX(-6deg) translate(-2px,2px)}}
#app .pws.c1 .pwc b{text-shadow:3px 3px 0 #7a1fd1,-2px 0 0 rgba(255,0,60,.6)}
#app .pws.c2 .pwc{animation:pwGl 6s infinite}
#app .pws.c2 .pwc b{text-shadow:3px 3px 0 #c00018,-3px -1px 0 #0ff}
#app .pws.c3 .pwc{animation:pwGl 3.2s infinite;border-color:#ff2a4a;box-shadow:8px 8px 0 #600}
#app .pws.c3 .pwc.done{box-shadow:8px 8px 0 #8a6d00}
#app .pws.c3 .pwk{background:#ff2a4a;color:#000;box-shadow:5px 5px 0 #000}
#app .pws.c3 .pwt{box-shadow:0 5px 0 #ff2a4a,0 11px 0 #400}
/* post credit */
#app .pws.cr .pwp{display:block;max-width:900px;margin:0 auto;padding:40px 44px}
#app .pws .pwr{margin:0 0 26px;padding:0 0 0 18px;border-left:6px solid #ffd400;font:700 18px/1.7 'Trebuchet MS',Arial,sans-serif;font-style:normal;opacity:0;animation:pwIn 1.4s forwards}
#app .pws.bad .pwr{border-left-color:#ff2a4a}
@keyframes pwIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
#app .pws .pwend{margin-top:34px;font-size:34px;font-weight:400;text-shadow:3px 3px 0 #7a1fd1;opacity:0;animation:pwIn 1.6s forwards}`;
    document.head.appendChild(s);
  }

  function tierOf(cl) { return cl >= 30 ? 3 : cl >= 20 ? 2 : cl >= 10 ? 1 : 0; }

  function screen() {
    const A = document.getElementById('app');
    if (!A) return;
    unlockParty();                                  /* di menu, party asli dikembalikan */
    injectCSS();
    const L2 = topLevel(), cn = effCh(), cl = Math.min(st.story.cleared || 0, N);
    const lv = cl / N;
    setOverlay(lv);

    let cards = '';
    STORY.forEach((c, i) => {
      if (i % 5 === 0) {
        const a = ARCS[c.arc], arcLocked = i > cl;
        cards += `<div class="pwa"><b>${arcLocked ? corrupt(a.n, Math.max(lv, 0.6), c.arc, 0.5) : a.n}</b><small>${arcLocked ? '???' : corrupt(a.d, lv, c.arc, 0.3)}</small></div>`;
      }
      const locked = i > cl, done = i < cl, cur = i === cl;
      const hidden = i > cl;               /* chapter yang belum dibuka disamarkan */
      const title = hidden ? '???' : corrupt(c.t, i / (N - 1), i, 0.5);
      const blurb = hidden ? 'Belum terungkap.' : corrupt(c.blurb, i / (N - 1), i + 100, 0.35);
      const status = done ? '✓ SELESAI (boleh diulang)' : locked ? '🔒 Selesaikan chapter sebelumnya' : 'TERSEDIA';
      cards += `<div class="pwc ${locked ? 'lock' : ''} ${done ? 'done' : ''} ${cur ? 'cur' : ''}" ${cur ? 'id="pwcur"' : ''}>
        <b>CHAPTER ${i + 1}: ${title}</b>
        <small>${blurb}<br>${status} • 2 stage + boss • HP musuh x${(1 + CFG.HP_PER_CH * i).toFixed(2)}</small>
        <button data-pc="${i}" ${locked ? 'disabled' : ''}>${locked ? 'TERKUNCI' : done ? 'ULANG' : 'MASUK'}</button></div>`;
    });

    let endBtns = '';
    if (st.story.endings.good) endBtns += '<button data-end="good">POST CREDIT: GOOD</button>';
    if (st.story.endings.bad) endBtns += '<button data-end="bad">POST CREDIT: BAD</button>';

    A.innerHTML = `<div class="wipe"></div><div class="pws c${tierOf(cl)}" style="--cor:${lv.toFixed(2)}"><div class="pwbg"></div>
      <div class="pwt"><span class="pwk">PARALLEL WORLD</span>
      <span class="pwl">CHAPTER ${cl}/${N}</span>
      <span class="pwl">HANYA KAEL • LV KAEL: ${L2} • SKALA MUSUH: CH ${cn}</span></div>
      <div class="pwp">${cards}</div>
      <div class="pwf">${endBtns}<button id="pwback">Kembali</button></div></div>`;
    A.querySelectorAll('[data-pc]').forEach((b) => b.onclick = () => runChapter(+b.dataset.pc));
    A.querySelectorAll('[data-end]').forEach((b) => b.onclick = () => creditsScreen(b.dataset.end));
    document.getElementById('pwback').onclick = () => { clearOverlay(); typeof window.hub === 'function' ? window.hub() : location.reload(); };
    const cur = document.getElementById('pwcur');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
  }

  /* ---------- POST CREDIT ---------- */
  function creditsScreen(kind) {
    const A = document.getElementById('app');
    if (!A) return;
    unlockParty();
    injectCSS();
    setOverlay(kind === 'bad' ? 0.9 : 0.55);
    const e = ENDINGS[kind];
    const v = (PW.getVariant('world1') || {}).id;
    const paras = e.post(v);
    const body = paras.map((p, i) => `<p class="pwr" style="animation-delay:${(i * 1.6 + 0.6).toFixed(1)}s">${MA.esc(p)}</p>`).join('') +
      `<div class="pwend" style="animation-delay:${(paras.length * 1.6 + 1).toFixed(1)}s">${MA.esc(e.name)}</div>`;
    A.innerHTML = `<div class="wipe"></div><div class="pws cr ${kind}" style="--cor:${kind === 'bad' ? 0.9 : 0.55}"><div class="pwbg"></div>
      <div class="pwt"><span class="pwk">POST CREDIT</span><span class="pwl">ERA KELAM — KEADAAN DUNIA SETELAH PILIHAN KAEL</span></div>
      <div class="pwp">${body}</div>
      <div class="pwf"><button id="pwback">Kembali</button></div></div>`;
    document.getElementById('pwback').onclick = () => screen();
  }

  /* ============================================================
   *  TAB DI HUB: ARCHIVE (menggantikan tombol melayang) + PARALLEL WORLD
   * ============================================================ */
  let launcherClick = null, launcherRoot = null, lastScan = 0;

  function findLauncher() {
    if (launcherClick && document.body.contains(launcherClick)) return;
    launcherClick = launcherRoot = null;
    if (CFG.ARCHIVE_SELECTOR) {
      const e = document.querySelector(CFG.ARCHIVE_SELECTOR);
      if (e) { launcherClick = launcherRoot = e; }
      return;
    }
    const now = Date.now();
    if (now - lastScan < 400) return;
    lastScan = now;
    const all = document.body.querySelectorAll('div,button,a,span');
    for (const e of all) {
      if (e.dataset.pwtab || e.closest('.tabs') || e.children.length > 4) continue;
      if ((e.textContent || '').trim().toUpperCase() !== 'ARCHIVE') continue;
      let n = e;
      while (n && n !== document.body) {
        if (getComputedStyle(n).position === 'fixed') {
          if (n.offsetHeight < 110 && n.offsetWidth < 420) { launcherClick = e; launcherRoot = n; return; }
          break;
        }
        n = n.parentElement;
      }
    }
  }

  function openArchive() {
    if (typeof MA.open === 'function') { MA.isOpen && MA.isOpen() ? MA.close() : MA.open(); return; }
    findLauncher();
    if (launcherClick) { launcherClick.click(); return; }
    ['open', 'toggle', 'show'].some((f) => { if (typeof MA[f] === 'function') { MA[f](); return true; } return false; });
  }

  function injectTabs() {
    findLauncher();
    if (launcherRoot && !launcherRoot.hasAttribute('data-pwhide')) launcherRoot.setAttribute('data-pwhide', '1');
    injectCSS();
    const tabs = document.querySelector('#app .hb .tabs');
    if (tabs) { clearOverlay(); unlockParty(); }   /* kembali ke HUB = efek mati & party asli kembali */
    if (!tabs || tabs.querySelector('[data-pwtab]')) return;
    [['archive', CFG.TAB_ARCHIVE, openArchive], ['pw', CFG.TAB_PW, screen]].forEach(([id, label, fn]) => {
      const b = document.createElement('button');
      b.className = 'tb3'; b.dataset.pwtab = id; b.textContent = label;
      b.onclick = fn;
      tabs.appendChild(b);
    });
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; injectTabs(); });
  }).observe(document.body, { childList: true, subtree: true });
  setTimeout(injectTabs, 300);
  setTimeout(unlockParty, 600);   /* jaga-jaga kalau game di-reload saat party masih terkunci */

  /* ---------- UI panel Archive (tab Dunia Paralel) ---------- */
  function render(el) {
    const list = Object.values(worlds);
    const ed = st.story.endings || {};
    let html = '<div class="ma-card"><h4>🌀 Babak Parallel World</h4>' +
      '<div class="ma-muted">Chapter selesai: ' + (st.story.cleared || 0) + '/' + N +
      ' • Hanya Kael yang bisa dipakai • Musuh mengikuti level Kael.</div>' +
      '<div class="ma-muted">Ending: ' + (ed.good ? '🕊️ Good ' : '') + (ed.bad ? '🔥 Bad ' : '') + (!ed.good && !ed.bad ? '???' : '') + '</div>' +
      '<div class="ma-chips" style="margin-top:8px"><button class="ma-btn" id="pw-enter">⚔️ Masuk Babak Baru</button></div></div>';
    if (!list.length) html += '<div class="ma-muted">Belum ada dunia terdaftar.</div>';
    list.forEach((w) => {
      const v = PW.getVariant(w.id);
      const p = PW.progress(w.id);
      html += '<div class="ma-card"><h4>🌐 ' + MA.esc(w.name) + '</h4>' +
        '<div class="ma-muted">Versi ditemukan: ' + p.seen + '/' + p.total + '</div>' +
        '<div style="margin:6px 0"><b>' + MA.esc(v.name) + '</b><br>' + MA.esc(v.desc) + '</div>' +
        '<div class="ma-muted">Boss: ' + MA.esc(v.boss || '-') + ' • Karakter: ' + MA.esc((v.characters || []).join(', ') || '-') + '</div>';
      const made = w.decisions.filter((d) => PW.hasDecided(w.id, d.id));
      if (made.length) {
        html += '<div style="margin-top:6px"><div class="ma-muted">Keputusan:</div>';
        made.forEach((d) => {
          html += '<div class="ma-muted">• ' + MA.esc(d.title) + ' → ' + MA.esc(d.choices[st.choices[w.id][d.id]].label) + '</div>';
        });
        html += '</div>';
      }
      html += '<div class="ma-chips" style="margin-top:8px"><button class="ma-btn alt" data-rewind="' + w.id + '">⏪ Putar Balik Waktu</button></div></div>';
    });
    el.innerHTML = html;
    const enter = el.querySelector('#pw-enter');
    if (enter) enter.onclick = () => { if (typeof MA.close === 'function') MA.close(); screen(); };
    el.querySelectorAll('[data-rewind]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.rewind;
        MA.modal('Putar Balik Waktu', 'Semua keputusan di dunia ini akan dihapus agar kamu bisa mencoba jalur lain. Arsip & fragmen yang sudah didapat tetap aman.', [
          { label: 'Batal', alt: true },
          { label: 'Putar Balik', fn: () => PW.rewind(id) },
        ]);
      };
    });
  }

  MA.registerTab({ id: 'parallel', label: 'Dunia Paralel', icon: '🌀', render });

  /* ---------- DATA DUNIA (GANTI sesuai dunia di game kamu) ---------- */
  PW.register([
    {
      id: 'world1', name: 'Dunia Awal',
      variants: [
        { id: 'prime', name: 'Garis Waktu Utama', desc: 'Desa masih berdiri dan penjaga gerbang berdiri teguh.', requires: {}, characters: ['kael'], boss: 'guardian' },
        { id: 'fallen', name: 'Garis Waktu Runtuh', desc: 'Desa hancur akibat pilihan Kael. Bayangan menguasai gerbang.', requires: { village: 'burned' }, characters: ['kael'], boss: 'shadow_guardian' },
        { id: 'redeemed', name: 'Garis Waktu Penebusan', desc: 'Desa selamat dan sang penjaga sadar dari kutukannya.', requires: { village: 'saved', mercy: true }, characters: ['kael', 'guardian_freed'], boss: 'corrupted_elder' },
      ],
      decisions: [
        { id: 'save_village', title: 'Nasib Desa', text: 'Api mulai melahap desa. Kael hanya sempat memilih satu hal.', choices: [
          { label: 'Selamatkan penduduk', flags: { village: 'saved' } },
          { label: 'Kejar sang penjaga', flags: { village: 'burned' } },
        ] },
        { id: 'guardian_fate', title: 'Nasib Sang Penjaga', text: 'Sang penjaga terluka dan memohon ampun.', choices: [
          { label: 'Ampuni dia', flags: { mercy: true } },
          { label: 'Habisi dia', flags: { mercy: false } },
        ] },
      ],
    },
  ]);

  window.ParallelWorld = PW;
})();/* ============================================================
 * parallel_world.js  —  4. Parallel World System  (HUB + STORY 40 CHAPTER)
 *
 * ISI:
 *  1. Tombol ARCHIVE melayang disembunyikan -> jadi tab di HUB.
 *  2. Tab "PARALLEL WORLD" di HUB -> BABAK CERITA 40 CHAPTER
 *     (8 arc x 5 chapter, tiap chapter 2 stage + boss).
 *  3. PROTAGONIS = KAEL. Selama Parallel World HANYA Kael yang bisa
 *     dipakai (party asli otomatis disimpan lalu dikembalikan setelah
 *     keluar dari chapter / kalah / game di-reload).
 *     Musuh mengikuti LEVEL KAEL & makin sulit tiap chapter.
 *  4. Cerita: Kael terbangun tanpa ingatan di dunia yang sekarat. Ia
 *     mencari jati dirinya dan kebenaran dunia ini. Makin jauh -> UI
 *     makin rusak (teks tersensor glitch, scanline, getar) dan kisah
 *     makin kelam.
 *  5. Chapter 40: keputusan terakhir
 *       - TERIMA & BERDAMAI (Kael mengorbankan diri) = GOOD ENDING
 *       - SIMPAN DENDAM (Kael mengambil pena)         = BAD ENDING
 *     APA PUN PILIHANNYA, DUNIA TETAP BERADA DI ERA KELAM PENUH
 *     PENDERITAAN. Yang berbeda hanya nasib dunia & Kael. Pilihan di
 *     Chapter 1 ikut memengaruhi POST CREDIT. Ending yang sudah dilihat
 *     bisa ditonton lagi.
 *
 * API lama tetap sama:
 *   ParallelWorld.prompt('world1','save_village',(i)=>{...});
 *   ParallelWorld.decide / getBoss / getCharacters / getVariant / setFlag
 *   ParallelWorld.enterStory();   // buka layar Parallel World
 *
 * CATATAN:
 *  - Nama pembicara dialog: ARCHIVE, KAEL, ELIZABETH, ???
 *    (kalau G.dialog kamu punya warna/potret per nama, tambahkan '???').
 *  - ID karakter Kael dicari otomatis di data game. Kalau ID-nya bukan
 *    'kael', isi CFG.KAEL_ID.
 *  - Save lama aman: chapter yang sudah selesai tetap terhitung.
 *  - Kalau tombol ARCHIVE tidak ikut hilang, isi CFG.ARCHIVE_SELECTOR
 *    (contoh: '#ma-launcher').
 * ============================================================ */
(function () {
  'use strict';
  const MA = window.MA;
  if (!MA) { console.error('[ParallelWorld] ma_core.js belum di-load!'); return; }

  /* ---------- PENGATURAN (boleh diubah) ---------- */
  const CFG = {
    KAEL_ID: 'kael',          // ID karakter Kael di G.state (huruf kecil). Dicari otomatis juga.
    ARCHIVE_SELECTOR: '',     // selector CSS tombol ARCHIVE melayang (kosong = deteksi otomatis)
    TAB_ARCHIVE: 'ARCHIVE',
    TAB_PW: 'PARALLEL WORLD',
    BASE_CH: 10,              // chapter dasar musuh (G.mkEnemy maksimal chapter 10)
    LV_SCALE: 0.55,           // tiap 1 level Kael = +0.55 "chapter" skala musuh
    HP_PER_CH: 0.12,          // tambahan HP musuh per chapter Parallel World (ch40 = ~x5.7)
    ATK_PER_CH: 0.06,         // tambahan ATK musuh per chapter Parallel World (ch40 = ~x3.3)
    XP_PER_CH: 0.15,          // tambahan XP per chapter
    /* BUFF KAEL (Kael bertarung sendirian, jadi ia diberi keunggulan kecil yang tumbuh tiap chapter).
     * Diterapkan sebagai pengali pada musuh: ATK +x% = HP musuh dibagi (1+x), DEF +y% = ATK musuh dibagi (1+y). */
    KAEL_ATK_BASE: 0.15,      // buff ATK dasar Kael sejak Chapter 1
    KAEL_DEF_BASE: 0.15,      // buff DEF dasar Kael sejak Chapter 1
    KAEL_ATK_PER_CH: 0.015,   // tambahan buff ATK per chapter (ch40 = +73%)
    KAEL_DEF_PER_CH: 0.015,   // tambahan buff DEF per chapter
  };

  const worlds = {};
  const st = MA.state('parallel', { flags: {}, choices: {}, seen: {}, story: { cleared: 0 } });
  st.story = st.story || { cleared: 0 };
  st.story.endings = st.story.endings || {};

  function flagsOf(w) { return (st.flags[w] = st.flags[w] || {}); }

  const PW = {
    register(list) { [].concat(list).forEach((w) => { if (w && w.id) worlds[w.id] = w; }); },
    get: (id) => worlds[id] || null,

    getVariant(worldId) {
      const w = worlds[worldId];
      if (!w) return null;
      const f = flagsOf(worldId);
      let best = null;
      let bestScore = -1;
      w.variants.forEach((v) => {
        const req = v.requires || {};
        const keys = Object.keys(req);
        if (keys.every((k) => f[k] === req[k]) && keys.length > bestScore) { best = v; bestScore = keys.length; }
      });
      return best || w.variants[0];
    },

    getBoss: (id) => { const v = PW.getVariant(id); return v ? v.boss : null; },
    getCharacters: (id) => { const v = PW.getVariant(id); return v ? (v.characters || []).slice() : []; },
    getFlag: (w, k) => flagsOf(w)[k],
    hasDecided: (w, d) => !!(st.choices[w] && d in st.choices[w]),

    setFlag(worldId, key, value) {
      const before = PW.getVariant(worldId);
      flagsOf(worldId)[key] = value;
      afterChange(worldId, before);
    },

    decide(worldId, decisionId, choiceIdx) {
      const w = worlds[worldId];
      const d = w && w.decisions.find((x) => x.id === decisionId);
      const ch = d && d.choices[choiceIdx];
      if (!ch) return false;
      const before = PW.getVariant(worldId);
      st.choices[worldId] = st.choices[worldId] || {};
      st.choices[worldId][decisionId] = choiceIdx;
      Object.assign(flagsOf(worldId), ch.flags || {});
      afterChange(worldId, before);
      return true;
    },

    prompt(worldId, decisionId, cb) {
      const w = worlds[worldId];
      const d = w && w.decisions.find((x) => x.id === decisionId);
      if (!d) { if (cb) cb(-1); return; }
      if (PW.hasDecided(worldId, decisionId)) { if (cb) cb(st.choices[worldId][decisionId]); return; }
      MA.modal('⚖️ ' + d.title, MA.esc(d.text),
        d.choices.map((c, i) => ({ label: c.label, fn: () => { PW.decide(worldId, decisionId, i); if (cb) cb(i); } })));
    },

    rewind(worldId) {
      const before = PW.getVariant(worldId);
      st.choices[worldId] = {};
      st.flags[worldId] = {};
      afterChange(worldId, before, true);
    },

    progress(worldId) {
      const w = worlds[worldId];
      const seen = (st.seen[worldId] || []).length;
      return { seen, total: w ? w.variants.length : 0 };
    },

    enterStory() { screen(); },
  };

  function afterChange(worldId, beforeVariant, silent) {
    const now = PW.getVariant(worldId);
    st.seen[worldId] = st.seen[worldId] || [];
    if (now && st.seen[worldId].indexOf(now.id) < 0) {
      st.seen[worldId].push(now.id);
      MA.emit('variant_discovered', { world: worldId, variant: now.id });
      MA.emit('history_found', worldId + '_' + now.id);
    }
    if (!silent && beforeVariant && now && beforeVariant.id !== now.id) {
      MA.toast('🌀 Dunia berubah: ' + now.name);
      MA.emit('world_changed', { world: worldId, from: beforeVariant.id, to: now.id });
    }
    MA.save();
    MA.refresh();
  }

  /* ============================================================
   *  KAEL SAJA  (party dikunci ke Kael selama Parallel World)
   * ============================================================ */
  function kaelId() {
    const G = window.G, S = G && G.state;
    const pool = [];
    if (S && S.lv) Object.keys(S.lv).forEach((k) => pool.push(k));
    if (G) {
      ['chars', 'characters', 'CHARS', 'roster'].forEach((k) => {
        const c = G[k];
        if (!c) return;
        if (Array.isArray(c)) c.forEach((x) => { if (x && x.id) pool.push(x.id); });
        else if (typeof c === 'object') Object.keys(c).forEach((x) => pool.push(x));
      });
    }
    const want = String(CFG.KAEL_ID || 'kael').toLowerCase();
    return pool.find((id) => String(id).toLowerCase() === want) ||
           pool.find((id) => /kael/i.test(String(id))) ||
           CFG.KAEL_ID || 'kael';
  }

  /* field lain yang mungkin dipakai game untuk menentukan siapa yang bertarung */
  const TEAM_KEYS = ['active', 'team', 'squad', 'front', 'lineup'];   /* diisi Kael saja */
  const BENCH_KEYS = ['bench', 'reserve', 'back', 'standby'];         /* dikosongkan */
  const LEAD_KEYS = ['leader', 'lead', 'current', 'cur', 'turnChar'];  /* diset ke Kael (kalau string) */
  let guardTimer = null;

  function enforceKael() {
    const G = window.G, S = G && G.state;
    if (!S) return;
    const id = kaelId();
    if (!Array.isArray(S.party) || S.party.length !== 1 || S.party[0] !== id) S.party = [id];
    TEAM_KEYS.forEach((k) => { if (Array.isArray(S[k]) && (S[k].length !== 1 || S[k][0] !== id)) S[k] = [id]; });
    BENCH_KEYS.forEach((k) => { if (Array.isArray(S[k]) && S[k].length) S[k] = []; });
    LEAD_KEYS.forEach((k) => { if (typeof S[k] === 'string' && S[k] !== id) S[k] = id; });
  }

  /* matikan tombol ganti/tukar karakter yang muncul selama chapter */
  function blockSwapUI() {
    const A = document.getElementById('app');
    if (!A || A.querySelector('.pws')) return;       /* di menu Parallel World tidak perlu */
    A.querySelectorAll('button,[role="button"],.btn').forEach((b) => {
      if (b.dataset.pwlock) return;
      const t = (b.textContent || '').trim();
      if (/^(🔄\s*)?(ganti|tukar|switch|swap|change\s*(char|party))/i.test(t) || /^(party|formasi|tim)$/i.test(t)) {
        b.dataset.pwlock = '1';
        b.disabled = true;
        b.style.opacity = '.35';
        b.style.pointerEvents = 'none';
        b.title = 'Di Parallel World hanya Kael yang bisa bertarung.';
      }
    });
  }

  /* ---------- KUNCI LAYAR "ATUR TIM" ----------
   * Semua kartu karakter selain Kael: digelapkan, ada tulisan TERKUNCI, tidak bisa
   * diklik (mouse maupun keyboard). Kalau ada yang sudah terpilih otomatis
   * (mis. Alternate Kael), ia dilepas sekali secara otomatis; Kael dipilih otomatis. */
  let autoClicks = 0;

  function lockCSS() {
    if (document.getElementById('pw-lock')) return;
    const s = document.createElement('style');
    s.id = 'pw-lock';
    s.textContent = `
[data-pwlockcard]{pointer-events:none!important;cursor:not-allowed!important;filter:grayscale(1) brightness(.4)!important;position:relative!important}
[data-pwlockcard]::after{content:'🔒 TERKUNCI';position:absolute;right:14px;bottom:10px;z-index:5;padding:2px 12px;background:#000;color:#ff2a4a;border:2px solid #ff2a4a;font:italic 400 18px Impact,sans-serif;letter-spacing:1px;transform:skewX(-10deg);filter:none}`;
    document.head.appendChild(s);
  }

  function hasBadge(card) {
    return Array.prototype.some.call(card.querySelectorAll('*'), (x) => !x.children.length && /^[1-4]$/.test((x.textContent || '').trim()));
  }

  function teamCards(root) {
    const re = (t) => /LV\s*\d/i.test(t) && /HP\s*\d/i.test(t) && /LEMAH/i.test(t);
    const set = [];
    root.querySelectorAll('div,button,li,article,label,section').forEach((e) => {
      if (!re(e.textContent || '')) return;
      for (let n = 0; n < e.children.length; n++) { if (re(e.children[n].textContent || '')) return; }  /* ambil yang terkecil */
      let c = e;                                                 /* naik ke kartu utuh (berisi tepat 1 karakter) */
      while (c.parentElement && c.parentElement !== root &&
             ((c.parentElement.textContent || '').match(/LV\s*\d/gi) || []).length === 1) c = c.parentElement;
      if (set.indexOf(c) < 0) set.push(c);
    });
    return set;
  }

  function lockTeamScreen() {
    const A = document.getElementById('app');
    if (!A || !/ATUR\s*TIM/i.test(A.textContent || '')) { autoClicks = 0; return; }
    lockCSS();
    teamCards(A).forEach((card) => {
      const t = (card.textContent || '').toUpperCase();
      const isKael = /\bKAEL\b/.test(t) && t.indexOf('ALTERNATE') < 0;
      if (isKael) {
        card.removeAttribute('data-pwlockcard');
        if (!hasBadge(card) && autoClicks < 8) { autoClicks++; card.click(); }      /* pilih Kael otomatis */
      } else {
        if (hasBadge(card) && autoClicks < 8) { autoClicks++; card.click(); }       /* lepas yang terlanjur terpilih */
        card.setAttribute('data-pwlockcard', '1');
        card.setAttribute('tabindex', '-1');
        card.setAttribute('aria-disabled', 'true');
      }
    });
  }

  /* blokir klik/Enter asli (bukan dari script) pada kartu terkunci selama chapter berjalan */
  ['click', 'mousedown', 'pointerdown', 'touchstart'].forEach((ev) => {
    document.addEventListener(ev, (e) => {
      if (!guardTimer || !e.isTrusted) return;
      const t = e.target && e.target.closest ? e.target.closest('[data-pwlockcard]') : null;
      if (t) { e.stopPropagation(); e.preventDefault(); }
    }, true);
  });

  function guardTick() { enforceKael(); blockSwapUI(); lockTeamScreen(); }

  function lockParty() {
    const G = window.G, S = G && G.state;
    if (!S) { alert('Data game belum siap.'); return false; }
    if (!st.story.savedParty) {
      st.story.savedParty = (S.party || []).slice();
      st.story.savedExtra = {};
      TEAM_KEYS.concat(BENCH_KEYS, LEAD_KEYS).forEach((k) => {
        if (Object.prototype.hasOwnProperty.call(S, k) && (Array.isArray(S[k]) || typeof S[k] === 'string')) {
          st.story.savedExtra[k] = Array.isArray(S[k]) ? S[k].slice() : S[k];
        }
      });
    }
    enforceKael();
    if (!guardTimer) guardTimer = setInterval(guardTick, 120);   /* pengawas: paksa Kael terus */
    MA.save(); G.save && G.save();
    return true;
  }

  function unlockParty() {
    if (guardTimer) { clearInterval(guardTimer); guardTimer = null; }
    document.querySelectorAll('[data-pwlockcard]').forEach((e) => { e.removeAttribute('data-pwlockcard'); e.removeAttribute('aria-disabled'); e.removeAttribute('tabindex'); });
    autoClicks = 0;
    const G = window.G, S = G && G.state;
    if (!S || !st.story.savedParty) return;
    S.party = st.story.savedParty.slice();
    const ex = st.story.savedExtra || {};
    Object.keys(ex).forEach((k) => { S[k] = Array.isArray(ex[k]) ? ex[k].slice() : ex[k]; });
    delete st.story.savedParty;
    delete st.story.savedExtra;
    MA.save(); G.save && G.save();
  }

  /* ============================================================
   *  BABAK CERITA PARALLEL WORLD  (40 CHAPTER)
   * ============================================================ */
  const BOSS_NAMES = {
    guardian: 'Penjaga Gerbang',
    shadow_guardian: 'Penjaga Bayangan',
    corrupted_elder: 'Tetua Tercemar',
  };

  /* nama pembicara (singkatan -> nama tampil). Protagonis = KAEL. */
  const SP = { A: 'ARCHIVE', K: 'KAEL', E: 'ELIZABETH', X: '???', P: 'PENGAMAT' };
  const L = (arr) => arr.map((r) => [SP[r[0]] || r[0], r[1]]);

  /* 8 ARC x 5 CHAPTER */
  const ARCS = [
    { n: 'ARC I — RETAKAN', d: 'Kau terbangun tanpa nama di dunia yang sudah lama sekarat.' },
    { n: 'ARC II — INGATAN PALSU', d: 'Masa lalu yang kau ingat ternyata disusun orang lain.' },
    { n: 'ARC III — DARAH ARSIP', d: 'Arsip menyimpan lebih banyak rahasia daripada yang ia akui.' },
    { n: 'ARC IV — JEJAK PENULIS', d: 'Kau mulai curiga bahwa kau bukan manusia, melainkan tulisan.' },
    { n: 'ARC V — DUNIA RETAK', d: 'Setiap jawaban yang kau temukan melukai dunia ini.' },
    { n: 'ARC VI — DENDAM', d: 'Kau mulai ingat untuk apa kau diciptakan.' },
    { n: 'ARC VII — ARSIP RUNTUH', d: 'Satu-satunya penuntunmu perlahan mati.' },
    { n: 'ARC VIII — KEBENARAN', d: 'Tidak ada lagi yang bisa disembunyikan.' },
  ];

  /* [judul, boss, blurb, intro, outro, extra]
   * Garis besar kebenaran:
   *  - Dunia ini adalah NASKAH yang ditulis berkali-kali oleh seorang Penulis yang
   *    kehilangan Elizabeth. Tiap naskah gagal, lalu dibuang jadi dunia paralel.
   *  - Kael adalah tokoh ke-131: sisa DENDAM sang Penulis yang diberi nama & wajah,
   *    dibuat supaya kelak memegang pena dan menulis ulang kenyataan.
   *  - ARCHIVE dibuat untuk mencegah pena itu dipakai. Ia gagal menahan dunia.
   *  - Apa pun pilihan Kael, era kelam tidak akan berakhir. */
  const RAW = [
    /* ===== ARC I — RETAKAN ===== */
    ['GERBANG YANG TERBALIK', 'Penjaga Gerbang',
      'Kau terbangun di antara abu. Hanya satu hal yang kau punya: sebuah nama.',
      [['A', 'Kau bangun di tengah abu. Satu-satunya yang tersisa di kepalamu hanyalah sebuah nama: Kael.'],
       ['K', 'Kenapa aku tidak ingat apa pun? Hanya ada bekas luka di tangan kiriku.'],
       ['A', 'Dunia ini sedang sekarat. Kebenaran tentang dirimu terkubur di dalam sakitnya. Cari dia.']],
      [['K', 'Gerbang terbuka. Tapi di baliknya hanya ada dunia yang lebih sunyi.'],
       ['A', 'Setiap jawaban punya harga, Kael. Hari ini kau belum membayar apa-apa.']],
      { bossFrom: 'world1', dec1: ['world1', 'save_village'], dec2: ['world1', 'guardian_fate'] }],

    ['KOTA CERMIN', 'Penguasa Cermin',
      'Sebuah kota yang membalik setiap langkahmu. Pantulanmu tidak punya luka yang sama denganmu.',
      [['A', 'Kota ini tidak punya bayangan. Semua bayangan berdiri di seberang cermin, menatapmu.'],
       ['K', 'Pantulanku tidak punya bekas luka di tangan kiri. Padahal luka itu satu-satunya yang kuingat.'],
       ['A', 'Cermin tidak pernah berbohong.']],
      [['K', 'Cermin itu pecah. Serpihannya memperlihatkan wajah yang lebih tua dan sangat lelah.'],
       ['A', 'Itu bukan wajahmu, Kael. Belum.']]],

    ['PERPUSTAKAAN TANPA HURUF', 'Pustakawan Bisu',
      'Setiap orang punya satu buku. Buku tentangmu kosong.',
      [['A', 'Setiap orang di dunia ini punya satu buku. Cari milikmu.'],
       ['K', 'Semua halamannya kosong. Hanya ada satu garis di sampul: sebuah nama yang dicoret.']],
      [['K', 'Dicoret, bukan dihapus. Seseorang tidak ingin aku hilang sepenuhnya.'],
       ['A', 'Atau seseorang ingin kau menemukannya, tepat pada saat yang ia tentukan.']]],

    ['JALAN TANPA UJUNG', 'Pejalan Berulang',
      'Pohon yang sama, batu yang sama. Kau sudah berjalan di sini berkali-kali.',
      [['K', 'Pohon ini, batu ini... aku sudah pernah lewat sini. Berkali-kali.'],
       ['A', 'Sebelas kali. Yang terpotong bukan jalannya, tapi ingatanmu.']],
      [['K', 'Setiap putaran aku bertanya hal yang sama, dan setiap putaran aku lupa jawabannya.'],
       ['K', 'Kali ini tidak. Aku akan menyimpannya, sekecil apa pun.']]],

    ['NAMA YANG TERHAPUS', 'Penghapus Nama',
      'Kau mencoba mengingat namamu yang lain. Sesuatu menghalangimu.',
      [['K', 'Kael... itu pasti bukan namaku yang sebenarnya. Siapa aku sebelum ini?'],
       ['A', 'Kael adalah nama yang diberikan padamu. Nama yang lain dilindungi seseorang yang lebih dulu ada.']],
      [['K', 'Semakin dalam aku mencari, semakin sedikit yang tersisa untuk dipegang.'],
       ['A', 'Garis waktu mulai retak di tepinya. Jangan menoleh ke belakang terlalu lama.']]],

    /* ===== ARC II — INGATAN PALSU ===== */
    ['RUMAH MASA KECIL', 'Ibu Boneka',
      'Rumah yang kau ingat ternyata hanya dinding kertas.',
      [['K', 'Ini rumahku. Tapi dindingnya hanya kertas.'],
       ['A', 'Rumah ini disusun dari potongan ingatanmu. Ada yang sengaja ditambahkan.']],
      [['K', 'Wanita itu tersenyum, tapi aku tidak pernah punya ibu yang tersenyum seperti itu.'],
       ['A', 'Seseorang menulis masa kecilmu, Kael. Bukan kau.']]],

    ['SEKOLAH TANPA MURID', 'Guru Bayangan',
      'Bel berbunyi, tapi tidak ada yang masuk. Kelas ini menunggu satu orang.',
      [['A', 'Bel berbunyi tapi tidak ada yang masuk. Kelas ini menunggu satu orang.'],
       ['K', 'Mejaku. Ada ukiran di sana: “jangan percaya Arsip”.']],
      [['A', 'Itu bukan tulisanku.'],
       ['K', 'Bukan. Itu tulisan tanganku sendiri, dari seseorang yang pernah berdiri di sini sebelum aku.']]],

    ['ALBUM FOTO KOSONG', 'Kolektor Potret',
      'Semua wajah di foto terhapus, kecuali satu perempuan yang berdiri di sampingmu.',
      [['K', 'Semua wajah di foto ini terhapus. Kecuali satu perempuan yang berdiri di sampingku.'],
       ['A', 'Namanya Elizabeth.']],
      [['K', 'Elizabeth ada di setiap fotoku. Tapi aku tidak ingat sedekat apa kami dulu.'],
       ['A', 'Mungkin itu bagian yang paling menyakitkan, jadi ia disimpan paling dalam.']]],

    ['HUJAN ABU', 'Peramal Abu',
      'Langit menurunkan abu. Setiap serpihnya adalah halaman yang terbakar.',
      [['A', 'Langit menurunkan abu seperti salju. Setiap serpihnya adalah halaman yang terbakar.'],
       ['A', 'Dunia ini mulai kehabisan halaman.']],
      [['K', 'Kenapa Arsip membiarkan dunianya terbakar?'],
       ['A', 'Aku tidak membakarnya. Aku hanya tidak lagi mampu menahannya.']]],

    ['SUARA DALAM KASET', 'Penyiar Gema',
      'Sebuah kaset berputar sendiri. Suara seseorang berkata: “Jangan cari aku.”',
      [['X', 'Jangan cari aku. Kalau kau mendengar ini, berhentilah di sini.'],
       ['K', 'Suara itu mirip suaraku. Kenapa dia melarangku mencari?']],
      [['A', 'Karena dia tahu kau tidak akan berhenti.'],
       ['K', 'Ingatan masa kecilku palsu. Lalu apa yang asli dariku?'],
       ['A', 'Bagian pertama kebenaran sudah terbuka. Sisanya tidak akan seindah ini.']]],

    /* ===== ARC III — DARAH ARSIP ===== */
    ['RUANG ARSIP RAHASIA', 'Penjaga Arsip',
      'Ruangan yang tidak ada di peta. Di rak-raknya, ratusan salinan dirimu.',
      [['A', 'Ruangan ini tidak ada di peta. Aku sendiri jarang masuk ke sini.'],
       ['K', 'Kenapa ada begitu banyak salinan diriku di rak?']],
      [['K', 'Seratus tiga puluh versi Kael. Semuanya berhenti di halaman yang berbeda.'],
       ['A', 'Dan kau yang ke-131. Yang pertama masih berjalan sejauh ini.']]],

    ['MESIN PENJAHIT TAKDIR', 'Penenun Takdir',
      'Benang merah menjalar dari langit-langit, menjahit orang menjadi cerita.',
      [['K', 'Benang merah ini menempel di dadaku.'],
       ['A', 'Benang itu menuntunmu sejak awal. Kau tidak pernah benar-benar punya pilihan.']],
      [['K', 'Kau mengakuinya sekarang?'],
       ['A', 'Aku tidak bisa berbohong lagi. Aku mulai retak juga.']]],

    ['GUDANG DUNIA MATI', 'Pemulung Dunia',
      'Dunia-dunia gagal ditumpuk seperti sampah. Beberapa masih berdenyut.',
      [['A', 'Setiap naskah yang gagal dibuang ke sini. Setiap garis waktu yang tidak memuaskan penulisnya.'],
       ['K', 'Ada suara dari dalam tumpukan itu. Mereka masih hidup.']],
      [['K', 'Mereka masih hidup, dan dunia ini menutup pintunya begitu saja.'],
       ['A', 'Itulah harga dari sebuah dunia yang rapi.']]],

    ['MENARA JAM PATAH', 'Penjaga Waktu Patah',
      'Jarum jam berputar mundur. Setiap detik menghapus satu kenangan.',
      [['A', 'Jangan berdiri terlalu lama. Waktu di sini memakan ingatan.'],
       ['K', 'Tadi aku sedang marah pada seseorang. Aku lupa siapa.']],
      [['A', 'Cepat, ucapkan tujuanmu sebelum ikut hilang!'],
       ['K', 'Mencari tahu siapa aku sebenarnya, dan kenapa dunia ini dibiarkan membusuk.']]],

    ['PASAR FRAGMEN', 'Pedagang Ingatan',
      'Ingatan dijual dalam botol kaca. Satu botol berlabel namamu.',
      [['K', 'Satu botol ini berlabel namaku.'],
       ['X', 'Isinya bukan ingatanmu. Ingatan itu milik orang yang menulismu.']],
      [['K', 'Jadi ingatan yang kuyakini sebagai milikku... sebenarnya dipinjam?'],
       ['A', 'Dipinjam, dipotong, lalu ditempelkan padamu. Maaf, Kael. Aku tahu sejak lama.']]],

    /* ===== ARC IV — JEJAK PENULIS ===== */
    ['LORONG SEPASANG LANGKAH', 'Langkah Kedua',
      'Suara langkah mengikutimu, terlambat setengah detik.',
      [['A', 'Jangan menoleh.'],
       ['K', 'Kenapa?'],
       ['A', 'Karena kau akan mengenalinya.']],
      [['K', 'Wajah itu hampir seperti wajahku, tapi jauh lebih tua dan lelah.'],
       ['A', 'Dialah yang menulis semuanya. Sang Penulis. Dan ia berhenti di sini.']]],

    ['TAMAN YANG MATI', 'Tukang Kebun Duka',
      'Bunga-bunga di taman ini tumbuh dari nisan.',
      [['E', 'Seseorang menanam kami di sini agar tidak dilupakan.'],
       ['K', 'Elizabeth? Kau ada di sini?']],
      [['E', 'Aku hanya gema. Yang menyiramku adalah dukanya.'],
       ['K', 'Duka siapa?'],
       ['E', 'Cari sendiri. Aku tidak sanggup mengatakannya.']]],

    ['PANGGUNG SANDIWARA', 'Sutradara Palsu',
      'Tirai terbuka. Seluruh perjalananmu dipentaskan lengkap dengan naskah.',
      [['A', 'Setiap dialog ditulis. Setiap pilihan sudah dipilihkan.'],
       ['K', 'Termasuk saat ini?'],
       ['A', 'Termasuk saat ini.']],
      [['K', 'Kalau semuanya sudah ditulis, kenapa aku masih bisa marah?'],
       ['A', 'Karena penulisnya juga marah. Dan kemarahannya ikut mengalir padamu.']]],

    ['RUANG INTEROGASI', 'Hakim Diri',
      'Satu kursi, satu lampu, dan hakim dengan wajah yang kau kenal.',
      [['X', 'Kau dituduh bukan manusia. Apa yang bisa kau katakan untuk dirimu, hai Tokoh?'],
       ['K', 'Aku bernapas. Aku merasa sakit. Aku berjalan sejauh ini dengan kakiku sendiri!']],
      [['X', 'Vonis ditunda. Kau belum cukup kuat untuk mendengarnya.'],
       ['A', 'Sedikit lagi, Kael. Kau hampir sampai.']]],

    ['KEMATIAN PERTAMA', 'Dirimu yang Pertama',
      'Di tengah ruangan terbaring tubuh dengan wajah yang sama denganmu. Ia sudah mati lama sekali.',
      [['K', 'Wajah itu wajahku. Jadi aku bukan yang asli?'],
       ['A', 'Itu wajah sang Penulis, saat ia masih muda. Wajahmu dipinjam darinya.']],
      [['A', 'Kebenaran pertama: kau bukan manusia, Kael. Kau adalah dendam sang Penulis yang diberi nama dan wajah.'],
       ['K', 'Jadi seluruh hidupku hanyalah kemarahan orang lain yang dibuat berjalan.'],
       ['A', 'Itu yang kuketahui. Tapi aku tidak tahu apa yang akan kau lakukan dengan kebenaran itu.']]],

    /* ===== ARC V — DUNIA RETAK ===== */
    ['LANGIT RETAK', 'Penjaga Langit Retak',
      'Langit pecah seperti kaca. Dari retaknya merembes tinta hitam.',
      [['A', 'Setiap kebenaran yang kau temukan melukai dunia ini. Aku tidak bisa menahannya lagi.'],
       ['K', 'Jadi semakin aku mencari tahu, semakin dunia ini hancur?']],
      [['A', 'Dunia ini ditulis dari ketidaktahuanmu. Semakin kau tahu, semakin ia robek.'],
       ['K', 'Dan aku tetap berjalan. Itu membuatku sama kejamnya dengan penulisku.']]],

    ['LAUT TERBALIK', 'Leviathan Terbalik',
      'Laut menggantung di langit. Ikan berenang di atas kepalamu.',
      [['K', 'Haruskah kita terus?'],
       ['A', 'Berhenti sekarang berarti semua yang hilang tadi sia-sia.']],
      [['A', 'Leviathan itu tenggelam ke atas, lenyap di dalam retakan langit.'],
       ['A', 'Satu dunia lagi hilang dari daftar. Nelayan di dunia itu tidak sempat tahu kenapa.']]],

    ['KOTA TANPA WARNA', 'Kurator Abu-abu',
      'Warna dicabut satu per satu. Orang-orang berjalan seperti tokoh yang naskahnya habis.',
      [['K', 'Mereka masih bernapas?'],
       ['A', 'Selama kau masih membaca, mereka masih ada.']],
      [['K', 'Aku tidak mau membuat orang lain menderita demi jawabanku.'],
       ['A', 'Terlambat untuk itu. Kita sudah terlalu jauh.']]],

    ['HUTAN JERITAN', 'Rimba Menjerit',
      'Pohon-pohon menjerit dengan suara orang yang kau kenal.',
      [['E', 'Tolong jangan lihat aku. Aku sudah bukan aku.'],
       ['K', 'Elizabeth! Kenapa semuanya jadi seperti ini?']],
      [['A', 'Karena kau semakin dekat dengan jawabannya.'],
       ['K', 'Kalau begitu jawabannya pasti sesuatu yang mengerikan.']]],

    ['GERBANG SERIBU PINTU', 'Penjaga Pintu',
      'Seribu pintu, satu yang benar. Sisanya membawa ke akhir dunia lain.',
      [['A', 'Pintu paling gelap. Ikuti aku.'],
       ['K', 'Kenapa selalu pintu yang paling gelap?']],
      [['A', 'Pintu yang benar terbuka. Di baliknya ada bau terbakar.'],
       ['A', 'Mulai dari sini aku tidak bisa lagi memastikan apakah yang kau lihat itu nyata.']]],

    /* ===== ARC VI — DENDAM ===== */
    ['ALTAR PEMBALASAN', 'Imam Dendam',
      'Altar di tengah reruntuhan. Di atasnya nama-nama yang dicoret dengan darah.',
      [['X', 'Ini daftar mereka yang harus membayar. Daftar yang ditulis sang Penulis untukmu.'],
       ['K', 'Untukku? Kenapa namaku ada di bagian paling atas?']],
      [['K', 'Aku lahir untuk menagih semua ini. Dendamnya adalah isi tubuhku.'],
       ['A', 'Dendam itu bukan dirimu, Kael. Tapi kau yang harus membawanya.']]],

    ['PERANG TANPA NAMA', 'Jenderal Hampa',
      'Dua pasukan saling menebas tanpa tahu alasannya. Panji mereka sama-sama kosong.',
      [['A', 'Perang ini lahir dari satu kemarahan yang dituliskan terlalu kuat.'],
       ['K', 'Berhenti! Kalian bahkan tidak tahu kenapa kalian bertarung!']],
      [['K', 'Setiap korban di sini lahir dari amarah yang sama denganku?'],
       ['A', 'Kau menyebutnya dendam. Dunia menyebutnya bencana.']]],

    ['MAKAM ELIZABETH', 'Gema Elizabeth',
      'Di tengah makam, sebuah batu tanpa nama. Kau tahu siapa pemiliknya.',
      [['K', 'Elizabeth, kaulah yang hilang itu. Yang membuat sang Penulis gila.'],
       ['E', 'Aku mati karena kecerobohanku sendiri, bukan karena siapa pun. Tapi dia tidak bisa menerimanya.']],
      [['E', 'Dia menulis ulang dunia demi aku. Dan setiap tulisan ulang melukai orang lain.'],
       ['K', 'Dan aku tokoh terakhir yang ia tulis untuk menyelesaikannya.'],
       ['E', 'Kau boleh membencinya. Tapi jangan menjadi dia.']]],

    ['API YANG DINYALAKAN', 'Pembakar Dunia',
      'Kau melihat dirimu sendiri menyalakan api di desa pertama.',
      [['X', 'Lihatlah. Bukan penjaga gerbang yang membakarnya. Kau.'],
       ['K', 'Aku... tidak ingat melakukannya.']],
      [['K', 'Tanganku yang menyalakan api itu, di salah satu garis waktu yang sudah dibuang.'],
       ['A', 'Kau korban sekaligus penyebabnya. Itu yang membuat kisahmu begitu kejam.']]],

    ['PENA PERTAMA', 'Penulis Pertama',
      'Sebuah pena hitam melayang di ruang hampa. Siapa pun pemegangnya bisa menulis ulang kenyataan.',
      [['A', 'Pena itu bukan milikku. Aku diciptakan agar pena itu tidak pernah dipakai. Dan aku gagal.']],
      [['A', 'Pena itu menunggu pemiliknya. Kau tahu siapa.'],
       ['K', 'Aku belum memutuskan apa pun.'],
       ['A', 'Tentu. Kau selalu memutuskan di akhir.']]],

    /* ===== ARC VII — ARSIP RUNTUH ===== */
    ['PERPUSTAKAAN TERBAKAR', 'Arsiparis Gila',
      'Perpustakaan tempat semuanya dimulai kini terbakar. Arsip tertawa di antara asapnya.',
      [['A', 'Maaf. Aku mulai lupa siapa yang menciptakanku.'],
       ['K', 'Arsip, bertahanlah.']],
      [['A', 'Aku sudah hampir selesai. Maju terus.']]],

    ['HALAMAN ROBEK', 'Perobek Halaman',
      'Halaman beterbangan seperti burung yang terluka. Beberapa memuat wajah orang yang tidak kau kenal.',
      [['K', 'Mereka siapa?'],
       ['A', 'Orang-orang yang hidup dan mati di dunia yang dibuang. Tak seorang pun menyelamatkan mereka.']],
      [['K', 'Ada tulisan di salah satu halaman: “Tolong hentikan ini.” Itu tulisan tangan sang Penulis.'],
       ['A', 'Bagian dirinya yang sudah lama lelah. Ia meminta tolong kepada tokoh yang ia ciptakan sendiri.']]],

    ['TINTA HITAM', 'Raja Tinta',
      'Tinta menenggelamkan lantai sampai selutut. Setiap tetesnya membisikkan nama aslimu.',
      [['X', 'Namamu yang sebenarnya adalah...'],
       ['A', 'Jangan dengarkan!']],
      [['K', 'Aku sudah mendengarnya. Dan ternyata tidak ada nama lain.'],
       ['K', 'Namaku memang Kael. Satu-satunya hal yang benar-benar milikku.'],
       ['A', 'Itu cukup, Kael. Itu lebih dari cukup.']]],

    ['RUANG TANPA CERMIN', 'Dirimu yang Terbuang',
      'Tidak ada pantulan. Hanya sisi dirimu yang pernah kau buang: marah, takut, serakah.',
      [['X', 'Kau membuang kami. Sekarang kami datang menagih.'],
       ['K', 'Kalian bagian dariku. Aku tidak bisa membunuh kalian.']],
      [['A', 'Maka jangan lawan mereka. Terima mereka, lalu lanjutkan.'],
       ['K', 'Menerima, bukan menghapus.']]],

    ['JANTUNG ARSIP', 'Jantung Arsip',
      'Arsip menuntunmu ke jantungnya. Berdenyut lemah, hampir berhenti.',
      [['A', 'Kalau aku mati, dunia paralel berhenti terbelah. Tapi pena itu jadi bebas.']],
      [['A', 'Aku sudah memberikan semua yang kupunya. Sisanya pilihanmu.'],
       ['K', 'Arsip...'],
       ['A', 'Terima kasih sudah menjadi pembaca terakhirku. Berjalanlah, Kael.']]],

    /* ===== ARC VIII — KEBENARAN ===== */
    ['LORONG AKHIR', 'Bayangan Sang Penulis',
      'Sosok tua dengan wajah yang kau kenal menunggumu. Ia tidak marah. Ia hanya sangat lelah.',
      [['X', 'Akhirnya kau datang. Tokohku yang ke-131.'],
       ['K', 'Kau yang menulisku. Kau yang membuat dunia ini seperti ini.'],
       ['X', 'Benar. Dan aku sudah terlalu lelah untuk membela diri.']],
      [['X', 'Kalahkan aku sebanyak yang kau mau. Di ujung lorong nanti, kau tetap yang memilih.']]],

    ['WUJUD KEHILANGAN', 'Wujud Kehilangan',
      'Bayangan raksasa yang menyerupai Elizabeth, tapi hancur dari dalam.',
      [['E', 'Aku bukan dia. Aku hanya apa yang tersisa dari kehilangan.']],
      [['K', 'Aku mengerti. Kehilangan tidak bisa dikalahkan.'],
       ['E', 'Hanya bisa dibawa. Atau dijadikan senjata.']]],

    ['TAKHTA KOSONG', 'Penjaga Takhta Kosong',
      'Siapa pun yang duduk di sana menjadi penulis dunia baru.',
      [['K', 'Aku tidak ingin menjadi penulis siapa pun.'],
       ['X', 'Kalau begitu kau tidak layak duduk. Kau hanya layak memilih.']],
      [['A', 'Takhta itu bergetar, tapi tidak runtuh. Kau akan tetap sampai di ujung.']]],

    ['GERBANG SEBELUM AKHIR', 'Bayangan Dirimu',
      'Seratus tiga puluh Kael berbaris di gerbang terakhir: yang marah, yang menyerah, yang mati.',
      [['K', 'Aku tidak akan menjadi salah satu dari kalian.'],
       ['X', 'Kau sudah menjadi kami semua.']],
      [['E', 'Apa pun yang kau pilih nanti, aku tidak akan menyalahkanmu.'],
       ['K', 'Terima kasih, Elizabeth. Aku akan memilih sendiri.']]],

    ['UJUNG SEMUA DUNIA', 'Penulis Alternatif',
      'Halaman terakhir. Tidak ada lagi cabang. Hanya pena, dan kau.',
      [['A', 'Ini halaman terakhir dari semua dunia. Setelah ini tidak ada cabang lagi.'],
       ['X', 'Ambil pena itu, Kael. Hidupkan dia kembali. Dunia hanyalah tinta.'],
       ['K', 'Atau aku melepaskan semuanya.']],
      [['A', 'Penulis Alternatif lenyap. Pena hitam kini menunggu tanganmu.'],
       ['K', 'Jadi di sinilah semuanya berakhir. Dan hanya aku yang memutuskan bagaimana.']]],
  ];

  const STORY = RAW.map((r, i) => Object.assign({
    t: r[0], boss: r[1], blurb: r[2], intro: L(r[3]), outro: L(r[4]),
    arc: Math.floor(i / 5),
  }, r[5] || {}));
  const N = STORY.length;

  /* ---------- SANG PENGAMAT (entitas misterius) ----------
   * Muncul di chapter tertentu. at:0 = sebelum stage pertama, at:2 = sebelum boss.
   * buff (opsional): { atk, def, n = jumlah stage yang dicakup, txt }.
   * Siapa dia sebenarnya tidak pernah dijelaskan. */
  const WATCH = {
    0: { at: 2, lines: L([
      ['P', '...Menarik. Tokoh yang bangun tanpa nama, dan sudah berani melangkah.'],
      ['K', 'Siapa di sana? Aku merasa ada yang menatapku sejak tadi.'],
      ['P', 'Belum waktunya kau tahu. Teruslah berjalan.']]) },
    2: { at: 0, buff: { atk: 0.10, def: 0.10, n: 3, txt: 'Pinjaman Pandangan' }, lines: L([
      ['P', 'Kau tersesat di antara buku kosong. Kasihan.'],
      ['K', 'Kau lagi. Apa maumu?'],
      ['P', 'Tidak ada. Aku hanya meminjamkan sedikit pandanganku agar kau tidak mati terlalu cepat.']]) },
    4: { at: 2, lines: L([
      ['P', 'Nama itu pinjaman. Kau tahu, bukan?'],
      ['K', 'Aku mulai menduganya.'],
      ['P', 'Bagus. Orang yang menduga biasanya bertahan lebih lama.']]) },
    7: { at: 2, buff: { atk: 0.15, def: 0.25, n: 1, txt: 'Perisai Kenangan' }, lines: L([
      ['P', 'Perempuan di foto itu... kau akan segera mengingatnya.'],
      ['K', 'Kenapa kau memberitahuku?'],
      ['P', 'Aku tidak memberitahu. Aku menguatkan tubuhmu supaya kau tidak runtuh saat ingatan itu datang.']]) },
    10: { at: 2, lines: L([
      ['P', 'Seratus tiga puluh Kael sebelum kau. Aku menonton setiap satunya.'],
      ['K', 'Dan kau tidak menolong satu pun?'],
      ['P', 'Menonton adalah satu-satunya hal yang bisa kulakukan.']]) },
    13: { at: 0, buff: { atk: 0.15, def: 0, n: 3, txt: 'Detik yang Dicuri' }, lines: L([
      ['P', 'Waktu di menara ini memakan ingatan. Aku curi beberapa detik untukmu.'],
      ['K', 'Kenapa kau mau repot?'],
      ['P', 'Cerita yang membosankan tidak layak ditonton sampai akhir.']]) },
    16: { at: 2, lines: L([
      ['P', 'Sang Penulis juga pernah kuawasi. Ia tidak pernah mendengarku.'],
      ['K', 'Mungkin karena ia terlalu sibuk menulis kehilangannya.'],
      ['P', 'Mungkin. Atau karena aku memang tidak pernah bicara kepadanya.']]) },
    19: { at: 0, buff: { atk: 0.12, def: 0.12, n: 3, txt: 'Hadiah Pembaca' }, lines: L([
      ['P', 'Kau bukan manusia, Kael. Dan aku tidak peduli.'],
      ['K', 'Kau tahu sejak awal.'],
      ['P', 'Tentu. Ambil ini. Ini bukan belas kasihan. Ini taruhan.']]) },
    22: { at: 2, lines: L([
      ['P', 'Dunia ini robek setiap kau mendekati kebenaran. Indah, bukan?'],
      ['A', 'Siapa itu? Aku tidak menciptakan entitas itu.'],
      ['K', 'Arsip, kau tidak tahu siapa dia?'],
      ['A', 'Tidak. Dan itu yang paling membuatku takut.']]) },
    25: { at: 2, buff: { atk: 0.30, def: 0.15, n: 1, txt: 'Taring Dendam' }, lines: L([
      ['P', 'Daftar nama itu menunggumu. Kau akan memerlukan tangan yang lebih tajam.'],
      ['K', 'Aku tidak mau jadi senjata untuk dendam siapa pun.'],
      ['P', 'Tidak ada yang bertanya apa maumu. Ambil saja.']]) },
    28: { at: 2, lines: L([
      ['P', 'Api itu. Kau tahu kenapa aku tidak menghentikannya?'],
      ['K', 'Karena kau hanya melihat.'],
      ['P', 'Ya. Dan aku membenci diriku karena itu.']]) },
    31: { at: 0, buff: { atk: 0, def: 0.20, n: 3, txt: 'Perisai Pembaca' }, lines: L([
      ['P', 'Halaman-halaman itu akan mengoyakmu. Pakailah ini.'],
      ['K', 'Kali ini kau terdengar hampir peduli.'],
      ['P', 'Jangan terlalu cepat menyimpulkan.']]) },
    34: { at: 2, buff: { atk: 0.30, def: 0.30, n: 1, txt: 'Warisan Arsip' }, lines: L([
      ['P', 'Arsip tidak akan bertahan lama. Ia bukan yang pertama yang kulihat mati.'],
      ['K', 'Diam. Jangan bicara seolah ia hanya tokoh.'],
      ['P', '...Maaf. Terimalah ini. Anggap saja titipannya.']]) },
    37: { at: 0, buff: { atk: 0.20, def: 0.20, n: 3, txt: 'Tawaran Tanpa Dendam' }, lines: L([
      ['P', 'Takhta kosong itu menawarkan kekuasaan. Aku menawarkan sesuatu yang lebih kecil: kekuatan tanpa dendam.'],
      ['K', 'Apa bedanya?'],
      ['P', 'Kau yang memutuskan apa yang kau lakukan dengannya. Hanya itu.']]) },
    39: { at: 2, buff: { atk: 0.45, def: 0.45, n: 1, txt: 'Mata Terakhir' }, lines: L([
      ['P', 'Apa pun yang kau pilih, aku akan tetap menonton.'],
      ['K', 'Kau tidak akan mengatakan siapa dirimu?'],
      ['P', 'Aku hanya seseorang yang membaca sampai halaman terakhir. Pergilah, Kael.']]) },
  };

  /* buff dasar Kael untuk chapter ke-i */
  function kaelBuff(i) {
    return {
      atk: CFG.KAEL_ATK_BASE + CFG.KAEL_ATK_PER_CH * i,
      def: CFG.KAEL_DEF_BASE + CFG.KAEL_DEF_PER_CH * i,
    };
  }
  /* buff total (dasar + pemberian Pengamat yang sedang aktif) */
  function totalBuff(i) {
    const b = kaelBuff(i), z = st.story.bless;
    return { atk: b.atk + (z ? z.atk : 0), def: b.def + (z ? z.def : 0) };
  }
  PW.getBuff = (i) => totalBuff(i == null ? Math.min(st.story.cleared || 0, N - 1) : i);

  /* ---------- KEPUTUSAN TERAKHIR & ENDING ---------- */
  const FINAL_TEXT =
    'Pena hitam melayang di depanmu. Elizabeth menunggu dalam diam. Bayangan sang Penulis menatap dari kejauhan. ' +
    'Semua kebenaran sudah terbuka. Kini hanya ada dua jalan.\n\n' +
    'Apa pun yang kau pilih, dunia ini tidak akan pulih. Era kelam sudah terlalu dalam: kelaparan, perang, dan abu akan tetap ada. ' +
    'Yang kau tentukan hanyalah bagaimana dunia itu bertahan.\n\n' +
    '🕊️ TERIMA & BERDAMAI: kau melepaskan dendam dan mematahkan pena. Kael lenyap, dunia tak lagi ditulis siapa pun.\n\n' +
    '🔥 SIMPAN DENDAM: kau mengambil pena dan menulis ulang kenyataan. Dunia menjadi naskahmu, selamanya.';

  const ENDINGS = {
    good: {
      name: 'GOOD ENDING — “NAMA MILIKKU”',
      scene: L([
        ['K', 'Aku bukan dendam sang Penulis. Aku Kael. Itu satu-satunya hal yang benar-benar milikku.'],
        ['X', 'Kalau kau mematahkan pena itu, kau ikut lenyap. Dunia ini juga tidak akan pernah disembuhkan.'],
        ['K', 'Aku tahu. Dunia ini terlalu rusak untuk disembuhkan. Tapi setidaknya ia tidak akan ditulis ulang lagi, dan tidak ada lagi dunia yang dibuang.'],
        ['E', 'Terima kasih, Kael. Sudah mau pulang.'],
        ['K', 'Maaf aku tidak bisa memberikan akhir yang indah. Hanya akhir yang jujur.'],
        ['A', 'Pena patah. Satu nama tertulis, bukan oleh tinta, melainkan oleh dunia yang kau tinggalkan.'],
      ]),
      post(v) {
        const village = {
          prime: 'Desa di gerbang pertama masih berdiri, tapi sumurnya kering dan ladangnya gagal panen. Penduduknya bertahan dengan sisa gandum, dan tidak pernah tahu siapa yang menjaga gerbang mereka.',
          fallen: 'Desa di gerbang pertama tetap menjadi abu. Para penyintas membangun gubuk di atas reruntuhan dan menguburkan nama-nama yang tidak sempat mereka tulis.',
          redeemed: 'Penjaga gerbang yang dulu terkutuk kini menjaga sebuah desa yang kelaparan. Ia membagi jatah makannya kepada anak-anak, dan tidak pernah meminta maaf, sebab ia tidak tahu kepada siapa.',
        }[v] || 'Desa di gerbang pertama bertahan dalam kesunyian dan kelaparan.';
        return [
          'Pena itu patah, dan dunia berhenti terbelah. Tidak ada lagi dunia yang dibuang, tidak ada lagi tinta yang merembes dari langit.',
          'Tapi langit yang retak tidak menyatu kembali. Abu masih turun, laut masih menggantung, dan kota-kota tetap kehilangan warnanya.',
          village,
          'Perang tanpa nama tetap berkobar. Kini perang itu lahir dari lapar dan takut, bukan dari tulisan siapa pun. Tak ada lagi yang bisa disalahkan, dan tak ada lagi yang bisa menyelamatkan.',
          'Elizabeth tidak kembali. Namanya tinggal gema di taman yang mati, tempat bunga tumbuh dari nisan dan tidak ada yang menyiraminya lagi.',
          'Kael lenyap tanpa meninggalkan jasad. Tidak ada yang mengingatnya, kecuali dunia yang diam-diam masih menyimpan jejak langkahnya.',
          'Di tengah reruntuhan, seorang anak kelaparan menemukan buku kosong. Ia tidak menunggu siapa pun menulis ceritanya. Dengan tangan gemetar, ia menulis namanya sendiri.',
          'Di suatu tempat yang tidak terjangkau halaman mana pun, sesuatu yang selalu mengawasi menutup bukunya perlahan. Ia tidak berkata apa-apa. Ia hanya menunggu cerita yang lain.',
          'Era kelam masih panjang. Tetapi untuk pertama kalinya, penderitaan dunia ini adalah milik dunia itu sendiri.',
        ];
      },
    },
    bad: {
      name: 'BAD ENDING — “TINTA”',
      scene: L([
        ['K', 'Aku tidak akan memaafkan dunia yang mengambilnya. Dunia yang membuatku hanya untuk menanggung semua ini.'],
        ['X', 'Akhirnya. Tulis, Kael. Tulis semuanya.'],
        ['E', 'Jangan. Jangan lakukan ini atas namaku.'],
        ['K', 'Maaf, Elizabeth. Aku tidak tahu cara lain untuk menjadi sesuatu selain dendam ini.'],
        ['A', 'Pena menyentuh halaman. Dunia-dunia paralel runtuh menjadi tinta, dan tinta itu menjadi satu kalimat: “Dia kembali.”'],
      ]),
      post(v) {
        const village = {
          prime: 'Desa di gerbang pertama masih berdiri. Penduduknya mengulang pagi yang sama setiap hari, dengan perut kosong yang tak pernah mereka mengerti.',
          fallen: 'Desa di gerbang pertama tetap menjadi abu. Kau menuliskannya demikian, karena amarahmu butuh sesuatu untuk dikenang.',
          redeemed: 'Penjaga gerbang yang dulu kau ampuni kini berdiri di depan desa yang kosong, menunggu seseorang yang tidak akan pernah datang.',
        }[v] || 'Desa di gerbang pertama kosong dan sunyi.';
        return [
          'Elizabeth kembali. Ia berdiri di dunia yang kau tulis ulang, tetapi tak seorang pun mengenali dunia itu, termasuk dirinya.',
          'Langit kini adalah halaman putih yang dipenuhi kalimat. Orang-orang berjalan, berbicara, dan tersenyum persis seperti yang kau tuliskan, tidak lebih.',
          'Kelaparan, perang, dan abu tidak kau hapus. Kau menuliskannya, karena dunia yang tidak menderita terasa asing bagi tangan yang hanya mengenal dendam.',
          village,
          'Dunia-dunia paralel yang lain habis menjadi tinta. Tidak ada lagi jalan menuju dunia lain, tidak ada lagi tempat untuk pergi.',
          'Arsip tidak pernah bangun lagi. Tak ada yang tersisa untuk mengingatkanmu bahwa kau pernah punya pilihan.',
          'Elizabeth menatapmu dan bertanya, “Kenapa kau menangis?” Kau tidak bisa menjawab, sebab kau tidak boleh menuliskan jawaban untuk dirimu sendiri.',
          'Sesuatu yang selalu mengawasi tetap membuka bukunya. Untuk pertama kalinya ia menutup mata, karena ia tidak sanggup lagi menonton.',
          'Era kelam tidak akan pernah berakhir. Kau telah menjadi sang Penulis berikutnya, dan di suatu tempat dalam tinta, sebuah halaman kosong mulai menyiapkan tokoh ke-132.',
        ];
      },
    },
  };

  /* ---------- efek korupsi ---------- */
  const GL = '▓▒░#@%§¤Ø∆Ξ';
  function corrupt(s, lv, seed, k) {
    const p = (lv - 0.2) * (k || 0.35);
    if (p <= 0) return s;
    let out = '', r = (seed + 1) * 7919;
    for (let n = 0; n < s.length; n++) {
      r = (r * 9301 + 49297) % 233280;
      const c = s[n];
      out += (c !== ' ' && r / 233280 < p) ? GL[r % GL.length] : c;
    }
    return out;
  }

  function setOverlay(lv) {
    const b = document.body;
    b.classList.add('pw-in');
    b.classList.toggle('pw-hi', lv >= 0.5);
    b.style.setProperty('--pwcor', Math.max(0, Math.min(1, lv)).toFixed(2));
  }
  function clearOverlay() { document.body.classList.remove('pw-in', 'pw-hi'); }

  /* ---------- skala musuh mengikuti level KAEL ---------- */
  function topLevel() {
    const G = window.G, S = G && G.state;
    if (!S || !S.lv) return 1;
    const kv = S.lv[kaelId()];
    if (kv && kv.l) return kv.l;
    let m = 1;
    Object.keys(S.lv).forEach((k) => { const v = S.lv[k]; if (v && v.l > m) m = v.l; });
    return m;
  }
  function effCh() { return Math.round(CFG.BASE_CH + (topLevel() - 1) * CFG.LV_SCALE); }

  function mkFoe(cn, stage, boss, name, mult) {
    const G = window.G;
    if (G.foe) return G.foe(cn, stage, boss, name, mult);
    const e = G.mkEnemy(Math.min(cn, 10), stage, boss, name);
    if (mult && e.hp != null) { e.hp = Math.round(e.hp * (mult.hp || 1)); if (e.max != null) e.max = e.hp; }
    if (mult && e.atk != null) e.atk = Math.round(e.atk * (mult.atk || 1));
    return e;
  }

  function foesFor(c, i, k, bossName) {
    const cn = effCh();
    const kb = totalBuff(i);                          /* buff Kael meringankan musuh */
    const hm = (1 + CFG.HP_PER_CH * i) / (1 + kb.atk), am = (1 + CFG.ATK_PER_CH * i) / (1 + kb.def), xm = 1.5 + CFG.XP_PER_CH * i;
    if (k === 2) {
      /* boss: tiap chapter ke-5 (arc finale) lebih kuat, chapter 40 paling kuat */
      const bb = (i === N - 1) ? 1.6 : (i % 5 === 4 ? 1.3 : 1.15);
      return [
        mkFoe(cn, 3, 1, bossName, { hp: hm * 1.25 * bb, atk: am * 1.1 * (bb > 1.2 ? 1.1 : 1), xp: xm * 2.5 }),
        mkFoe(cn, 1, 0, undefined, { hp: hm, atk: am, xp: xm }),
      ];
    }
    const n = k === 0 ? 2 : 3, a = [];
    for (let j = 0; j < n; j++) a.push(mkFoe(cn, 1 + ((k + j) % 3), 0, undefined, { hp: hm, atk: am, xp: xm }));
    return a;
  }

  function lose() {
    st.story.bless = null;
    unlockParty();
    clearOverlay();
    typeof window.after === 'function' ? window.after() : screen();
  }

  function runChapter(i) {
    const G = window.G, S = G.state, c = STORY[i];
    if (!lockParty()) return;                       /* hanya Kael yang bertarung */
    const bossName = c.bossFrom ? (BOSS_NAMES[PW.getBoss(c.bossFrom)] || c.boss) : c.boss;
    setOverlay(i / (N - 1));

    const decide = (d, next) => { if (d) PW.prompt(d[0], d[1], () => next()); else next(); };
    st.story.bless = null;                           /* buff Pengamat tidak dibawa antar-chapter */

    const stage = (k, next) => {
      enforceKael();                                 /* kunci ulang sebelum SETIAP pertarungan */
      G.fight(foesFor(c, i, k, bossName), (ok) => {
        if (!ok) return lose();
        const z = st.story.bless;                    /* habiskan jatah buff Pengamat */
        if (z) { z.n -= 1; if (z.n <= 0) st.story.bless = null; }
        enforceKael();
        G.save && G.save();
        next();
      });
    };

    /* Pengamat muncul (dialog + kadang buff) */
    const watch = (at, next) => {
      const w = WATCH[i];
      if (!w || w.at !== at) return next();
      G.dialog(w.lines, () => {
        if (w.buff) {
          st.story.bless = { atk: w.buff.atk || 0, def: w.buff.def || 0, n: w.buff.n || 1 };
          const pct = (v) => Math.round(v * 100);
          MA.toast('👁 ' + w.buff.txt + ': ' + (w.buff.atk ? 'ATK +' + pct(w.buff.atk) + '% ' : '') +
            (w.buff.def ? 'DEF +' + pct(w.buff.def) + '% ' : '') + '(' + (w.buff.n || 1) + ' stage)');
          MA.save();
        }
        next();
      });
    };

    const reward = (next) => {
      const first = (st.story.cleared || 0) <= i, cn = effCh(), r = first ? 1 : 0.5;
      const y = Math.round((300 + 80 * cn) * (1 + 0.10 * i) * r);
      const it = Math.max(1, Math.round((2 + i * 0.25) * r)), sp = Math.max(1, Math.round((1 + i * 0.15) * r));
      S.yen = (S.yen || 0) + y; S.items = (S.items || 0) + it; S.spitems = (S.spitems || 0) + sp;
      if (first) st.story.cleared = i + 1;
      MA.save(); G.save && G.save();
      alert('PARALLEL WORLD CHAPTER ' + (i + 1) + ' SELESAI!' + (first ? '' : ' (ulang, hadiah 50%)') +
        '\n+¥' + y + ' · +' + it + ' Potion · +' + sp + ' SP Drink');
      if (next) next(); else screen();
    };

    const ending = (kind) => {
      st.story.ending = kind;
      st.story.endings[kind] = true;
      MA.emit('pw_ending', kind);
      MA.save();
      reward(() => G.dialog(ENDINGS[kind].scene, () => creditsScreen(kind)));
    };

    const finale = () => MA.modal('⚖️ KEPUTUSAN TERAKHIR', MA.esc(FINAL_TEXT), [
      { label: '🕊️ TERIMA & BERDAMAI (Kael mengorbankan diri)', fn: () => ending('good') },
      { label: '🔥 SIMPAN DENDAM (Kael mengambil pena)', fn: () => ending('bad') },
    ]);

    const done = (i === N - 1) ? finale : () => reward();

    G.dialog(c.intro, () =>
      decide(c.dec1, () =>
        watch(0, () => stage(0, () => stage(1, () => watch(2, () => stage(2, () =>
          G.dialog(c.outro, () => decide(c.dec2, done)))))))));
  }

  /* ---------- LAYAR PARALLEL WORLD ---------- */
  function injectCSS() {
    if (document.getElementById('pw-p5')) return;
    const s = document.createElement('style');
    s.id = 'pw-p5';
    s.textContent = `
[data-pwhide]{display:none!important}
body.pw-in::after{content:'';position:fixed;inset:0;pointer-events:none;z-index:9998;background:repeating-linear-gradient(0deg,rgba(0,0,0,calc(var(--pwcor,0)*.38)) 0 1px,transparent 1px 3px);mix-blend-mode:multiply}
body.pw-hi::after{animation:pwFl 2.6s steps(1) infinite}
@keyframes pwFl{0%,90%,100%{opacity:1}92%{opacity:.35}94%{opacity:1}96%{opacity:.6}}
#app .pws{position:relative;display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;color:#fff;font-family:Impact,'Arial Narrow Bold',sans-serif;font-style:italic;background:#050505}
#app .pws .pwbg{position:absolute;inset:0;z-index:0;background:radial-gradient(circle,rgba(0,0,0,.38) 1.6px,transparent 2px) 0 0/11px 11px,linear-gradient(112deg,#4b0a8a 0 52%,#050505 52% 58%,#fff 58% 59%,#2a0550 59% 100%);animation:pwDots 14s linear infinite;filter:hue-rotate(calc(var(--cor,0)*-70deg)) saturate(calc(1 - var(--cor,0)*.55)) brightness(calc(1 - var(--cor,0)*.35))}
@keyframes pwDots{to{background-position:110px 110px,0 0}}
#app .pws .pwt{position:relative;z-index:2;display:flex;flex-wrap:wrap;align-items:center;gap:14px 22px;padding:14px 30px;background:#000;box-shadow:0 5px 0 #fff,0 11px 0 #7a1fd1}
#app .pws .pwk{display:block;background:#fff;color:#000;font-size:28px;letter-spacing:2px;padding:6px 24px;transform:skewX(-14deg) rotate(-1.5deg);box-shadow:5px 5px 0 #7a1fd1}
#app .pws .pwl{display:block;background:#ffd400;color:#000;font-size:20px;padding:4px 18px;border:3px solid #000;transform:skewX(-14deg)}
#app .pws .pwp{position:relative;z-index:1;flex:1;min-height:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(420px,1fr));gap:26px 30px;align-content:start;padding:34px 44px;overflow-y:auto}
#app .pws .pwa{grid-column:1/-1;margin-top:10px;padding:6px 20px;background:#000;border-left:10px solid #ffd400;transform:skewX(-6deg)}
#app .pws .pwa b{display:block;font-weight:400;font-size:26px;letter-spacing:2px;color:#ffd400}
#app .pws .pwa small{display:block;font:700 13px/1.4 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#ccc}
#app .pws .pwc{display:block;background:#0a0a0a;border:3px solid #fff;box-shadow:8px 8px 0 #7a1fd1;padding:14px 22px 16px;transform:skewX(-6deg)}
#app .pws .pwc.lock{opacity:.55}
#app .pws .pwc.done{box-shadow:8px 8px 0 #ffd400}
#app .pws .pwc.cur{border-color:#ffd400}
#app .pws .pwc b{display:block;font-weight:400;font-size:30px;text-shadow:3px 3px 0 #7a1fd1}
#app .pws .pwc small{display:block;margin:6px 0 10px;font:700 14px/1.4 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#e8e8e8}
#app .pws button{display:inline-block;cursor:pointer;background:#7a1fd1;color:#fff;font:italic 400 22px Impact,sans-serif;letter-spacing:1px;padding:6px 26px;border:2px solid #fff;box-shadow:4px 4px 0 #000;transform:skewX(-10deg);transition:.12s}
#app .pws button:hover{background:#fff;color:#7a1fd1}
#app .pws button:disabled{background:#3a3a3a;color:#999;border-color:#777;box-shadow:none;cursor:not-allowed}
#app .pws .pwf{position:relative;z-index:2;display:flex;justify-content:flex-end;gap:16px;flex-wrap:wrap;padding:14px 36px 40px;background:#000;box-shadow:0 -5px 0 #fff,0 -11px 0 #7a1fd1}
#app .pws .pwf button{background:#fff;color:#000;font-size:24px;padding:10px 34px}
#app .pws .pwf button:hover{background:#ffd400;color:#000}
/* tingkat kerusakan UI mengikuti progres */
@keyframes pwGl{0%,91%,100%{transform:skewX(-6deg) translate(0)}92%{transform:skewX(-6deg) translate(-5px,1px)}94%{transform:skewX(-6deg) translate(6px,-2px)}96%{transform:skewX(-6deg) translate(-2px,2px)}}
#app .pws.c1 .pwc b{text-shadow:3px 3px 0 #7a1fd1,-2px 0 0 rgba(255,0,60,.6)}
#app .pws.c2 .pwc{animation:pwGl 6s infinite}
#app .pws.c2 .pwc b{text-shadow:3px 3px 0 #c00018,-3px -1px 0 #0ff}
#app .pws.c3 .pwc{animation:pwGl 3.2s infinite;border-color:#ff2a4a;box-shadow:8px 8px 0 #600}
#app .pws.c3 .pwc.done{box-shadow:8px 8px 0 #8a6d00}
#app .pws.c3 .pwk{background:#ff2a4a;color:#000;box-shadow:5px 5px 0 #000}
#app .pws.c3 .pwt{box-shadow:0 5px 0 #ff2a4a,0 11px 0 #400}
/* post credit */
#app .pws.cr .pwp{display:block;max-width:900px;margin:0 auto;padding:40px 44px}
#app .pws .pwr{margin:0 0 26px;padding:0 0 0 18px;border-left:6px solid #ffd400;font:700 18px/1.7 'Trebuchet MS',Arial,sans-serif;font-style:normal;opacity:0;animation:pwIn 1.4s forwards}
#app .pws.bad .pwr{border-left-color:#ff2a4a}
@keyframes pwIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
#app .pws .pwend{margin-top:34px;font-size:34px;font-weight:400;text-shadow:3px 3px 0 #7a1fd1;opacity:0;animation:pwIn 1.6s forwards}`;
    document.head.appendChild(s);
  }

  function tierOf(cl) { return cl >= 30 ? 3 : cl >= 20 ? 2 : cl >= 10 ? 1 : 0; }

  function screen() {
    const A = document.getElementById('app');
    if (!A) return;
    unlockParty();                                  /* di menu, party asli dikembalikan */
    injectCSS();
    const L2 = topLevel(), cn = effCh(), cl = Math.min(st.story.cleared || 0, N);
    const lv = cl / N;
    setOverlay(lv);

    let cards = '';
    STORY.forEach((c, i) => {
      if (i % 5 === 0) {
        const a = ARCS[c.arc], arcLocked = i > cl;
        cards += `<div class="pwa"><b>${arcLocked ? corrupt(a.n, Math.max(lv, 0.6), c.arc, 0.5) : a.n}</b><small>${arcLocked ? '???' : corrupt(a.d, lv, c.arc, 0.3)}</small></div>`;
      }
      const locked = i > cl, done = i < cl, cur = i === cl;
      const hidden = i > cl;               /* chapter yang belum dibuka disamarkan */
      const title = hidden ? '???' : corrupt(c.t, i / (N - 1), i, 0.5);
      const blurb = hidden ? 'Belum terungkap.' : corrupt(c.blurb, i / (N - 1), i + 100, 0.35);
      const status = done ? '✓ SELESAI (boleh diulang)' : locked ? '🔒 Selesaikan chapter sebelumnya' : 'TERSEDIA';
      cards += `<div class="pwc ${locked ? 'lock' : ''} ${done ? 'done' : ''} ${cur ? 'cur' : ''}" ${cur ? 'id="pwcur"' : ''}>
        <b>CHAPTER ${i + 1}: ${title}</b>
        <small>${blurb}<br>${status} • 2 stage + boss • HP musuh x${(1 + CFG.HP_PER_CH * i).toFixed(2)}</small>
        <button data-pc="${i}" ${locked ? 'disabled' : ''}>${locked ? 'TERKUNCI' : done ? 'ULANG' : 'MASUK'}</button></div>`;
    });

    let endBtns = '';
    if (st.story.endings.good) endBtns += '<button data-end="good">POST CREDIT: GOOD</button>';
    if (st.story.endings.bad) endBtns += '<button data-end="bad">POST CREDIT: BAD</button>';

    A.innerHTML = `<div class="wipe"></div><div class="pws c${tierOf(cl)}" style="--cor:${lv.toFixed(2)}"><div class="pwbg"></div>
      <div class="pwt"><span class="pwk">PARALLEL WORLD</span>
      <span class="pwl">CHAPTER ${cl}/${N}</span>
      <span class="pwl">HANYA KAEL • LV KAEL: ${L2} • SKALA MUSUH: CH ${cn}</span>
      <span class="pwl">BUFF KAEL: ATK +${Math.round(kaelBuff(Math.min(cl, N - 1)).atk * 100)}% • DEF +${Math.round(kaelBuff(Math.min(cl, N - 1)).def * 100)}%</span></div>
      <div class="pwp">${cards}</div>
      <div class="pwf">${endBtns}<button id="pwback">Kembali</button></div></div>`;
    A.querySelectorAll('[data-pc]').forEach((b) => b.onclick = () => runChapter(+b.dataset.pc));
    A.querySelectorAll('[data-end]').forEach((b) => b.onclick = () => creditsScreen(b.dataset.end));
    document.getElementById('pwback').onclick = () => { clearOverlay(); typeof window.hub === 'function' ? window.hub() : location.reload(); };
    const cur = document.getElementById('pwcur');
    if (cur && cur.scrollIntoView) cur.scrollIntoView({ block: 'center' });
  }

  /* ---------- POST CREDIT ---------- */
  function creditsScreen(kind) {
    const A = document.getElementById('app');
    if (!A) return;
    unlockParty();
    injectCSS();
    setOverlay(kind === 'bad' ? 0.9 : 0.55);
    const e = ENDINGS[kind];
    const v = (PW.getVariant('world1') || {}).id;
    const paras = e.post(v);
    const body = paras.map((p, i) => `<p class="pwr" style="animation-delay:${(i * 1.6 + 0.6).toFixed(1)}s">${MA.esc(p)}</p>`).join('') +
      `<div class="pwend" style="animation-delay:${(paras.length * 1.6 + 1).toFixed(1)}s">${MA.esc(e.name)}</div>`;
    A.innerHTML = `<div class="wipe"></div><div class="pws cr ${kind}" style="--cor:${kind === 'bad' ? 0.9 : 0.55}"><div class="pwbg"></div>
      <div class="pwt"><span class="pwk">POST CREDIT</span><span class="pwl">ERA KELAM — KEADAAN DUNIA SETELAH PILIHAN KAEL</span></div>
      <div class="pwp">${body}</div>
      <div class="pwf"><button id="pwback">Kembali</button></div></div>`;
    document.getElementById('pwback').onclick = () => screen();
  }

  /* ============================================================
   *  TAB DI HUB: ARCHIVE (menggantikan tombol melayang) + PARALLEL WORLD
   * ============================================================ */
  let launcherClick = null, launcherRoot = null, lastScan = 0;

  function findLauncher() {
    if (launcherClick && document.body.contains(launcherClick)) return;
    launcherClick = launcherRoot = null;
    if (CFG.ARCHIVE_SELECTOR) {
      const e = document.querySelector(CFG.ARCHIVE_SELECTOR);
      if (e) { launcherClick = launcherRoot = e; }
      return;
    }
    const now = Date.now();
    if (now - lastScan < 400) return;
    lastScan = now;
    const all = document.body.querySelectorAll('div,button,a,span');
    for (const e of all) {
      if (e.dataset.pwtab || e.closest('.tabs') || e.children.length > 4) continue;
      if ((e.textContent || '').trim().toUpperCase() !== 'ARCHIVE') continue;
      let n = e;
      while (n && n !== document.body) {
        if (getComputedStyle(n).position === 'fixed') {
          if (n.offsetHeight < 110 && n.offsetWidth < 420) { launcherClick = e; launcherRoot = n; return; }
          break;
        }
        n = n.parentElement;
      }
    }
  }

  function openArchive() {
    if (typeof MA.open === 'function') { MA.isOpen && MA.isOpen() ? MA.close() : MA.open(); return; }
    findLauncher();
    if (launcherClick) { launcherClick.click(); return; }
    ['open', 'toggle', 'show'].some((f) => { if (typeof MA[f] === 'function') { MA[f](); return true; } return false; });
  }

  function injectTabs() {
    findLauncher();
    if (launcherRoot && !launcherRoot.hasAttribute('data-pwhide')) launcherRoot.setAttribute('data-pwhide', '1');
    injectCSS();
    const tabs = document.querySelector('#app .hb .tabs');
    if (tabs) { clearOverlay(); unlockParty(); }   /* kembali ke HUB = efek mati & party asli kembali */
    if (!tabs || tabs.querySelector('[data-pwtab]')) return;
    [['archive', CFG.TAB_ARCHIVE, openArchive], ['pw', CFG.TAB_PW, screen]].forEach(([id, label, fn]) => {
      const b = document.createElement('button');
      b.className = 'tb3'; b.dataset.pwtab = id; b.textContent = label;
      b.onclick = fn;
      tabs.appendChild(b);
    });
  }

  let queued = false;
  new MutationObserver(() => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => { queued = false; injectTabs(); });
  }).observe(document.body, { childList: true, subtree: true });
  setTimeout(injectTabs, 300);
  setTimeout(unlockParty, 600);   /* jaga-jaga kalau game di-reload saat party masih terkunci */

  /* ---------- UI panel Archive (tab Dunia Paralel) ---------- */
  function render(el) {
    const list = Object.values(worlds);
    const ed = st.story.endings || {};
    let html = '<div class="ma-card"><h4>🌀 Babak Parallel World</h4>' +
      '<div class="ma-muted">Chapter selesai: ' + (st.story.cleared || 0) + '/' + N +
      ' • Hanya Kael yang bisa dipakai • Musuh mengikuti level Kael.</div>' +
      '<div class="ma-muted">Ending: ' + (ed.good ? '🕊️ Good ' : '') + (ed.bad ? '🔥 Bad ' : '') + (!ed.good && !ed.bad ? '???' : '') + '</div>' +
      '<div class="ma-chips" style="margin-top:8px"><button class="ma-btn" id="pw-enter">⚔️ Masuk Babak Baru</button></div></div>';
    if (!list.length) html += '<div class="ma-muted">Belum ada dunia terdaftar.</div>';
    list.forEach((w) => {
      const v = PW.getVariant(w.id);
      const p = PW.progress(w.id);
      html += '<div class="ma-card"><h4>🌐 ' + MA.esc(w.name) + '</h4>' +
        '<div class="ma-muted">Versi ditemukan: ' + p.seen + '/' + p.total + '</div>' +
        '<div style="margin:6px 0"><b>' + MA.esc(v.name) + '</b><br>' + MA.esc(v.desc) + '</div>' +
        '<div class="ma-muted">Boss: ' + MA.esc(v.boss || '-') + ' • Karakter: ' + MA.esc((v.characters || []).join(', ') || '-') + '</div>';
      const made = w.decisions.filter((d) => PW.hasDecided(w.id, d.id));
      if (made.length) {
        html += '<div style="margin-top:6px"><div class="ma-muted">Keputusan:</div>';
        made.forEach((d) => {
          html += '<div class="ma-muted">• ' + MA.esc(d.title) + ' → ' + MA.esc(d.choices[st.choices[w.id][d.id]].label) + '</div>';
        });
        html += '</div>';
      }
      html += '<div class="ma-chips" style="margin-top:8px"><button class="ma-btn alt" data-rewind="' + w.id + '">⏪ Putar Balik Waktu</button></div></div>';
    });
    el.innerHTML = html;
    const enter = el.querySelector('#pw-enter');
    if (enter) enter.onclick = () => { if (typeof MA.close === 'function') MA.close(); screen(); };
    el.querySelectorAll('[data-rewind]').forEach((b) => {
      b.onclick = () => {
        const id = b.dataset.rewind;
        MA.modal('Putar Balik Waktu', 'Semua keputusan di dunia ini akan dihapus agar kamu bisa mencoba jalur lain. Arsip & fragmen yang sudah didapat tetap aman.', [
          { label: 'Batal', alt: true },
          { label: 'Putar Balik', fn: () => PW.rewind(id) },
        ]);
      };
    });
  }

  MA.registerTab({ id: 'parallel', label: 'Dunia Paralel', icon: '🌀', render });

  /* ---------- DATA DUNIA (GANTI sesuai dunia di game kamu) ---------- */
  PW.register([
    {
      id: 'world1', name: 'Dunia Awal',
      variants: [
        { id: 'prime', name: 'Garis Waktu Utama', desc: 'Desa masih berdiri dan penjaga gerbang berdiri teguh.', requires: {}, characters: ['kael'], boss: 'guardian' },
        { id: 'fallen', name: 'Garis Waktu Runtuh', desc: 'Desa hancur akibat pilihan Kael. Bayangan menguasai gerbang.', requires: { village: 'burned' }, characters: ['kael'], boss: 'shadow_guardian' },
        { id: 'redeemed', name: 'Garis Waktu Penebusan', desc: 'Desa selamat dan sang penjaga sadar dari kutukannya.', requires: { village: 'saved', mercy: true }, characters: ['kael', 'guardian_freed'], boss: 'corrupted_elder' },
      ],
      decisions: [
        { id: 'save_village', title: 'Nasib Desa', text: 'Api mulai melahap desa. Kael hanya sempat memilih satu hal.', choices: [
          { label: 'Selamatkan penduduk', flags: { village: 'saved' } },
          { label: 'Kejar sang penjaga', flags: { village: 'burned' } },
        ] },
        { id: 'guardian_fate', title: 'Nasib Sang Penjaga', text: 'Sang penjaga terluka dan memohon ampun.', choices: [
          { label: 'Ampuni dia', flags: { mercy: true } },
          { label: 'Habisi dia', flags: { mercy: false } },
        ] },
      ],
    },
  ]);

  window.ParallelWorld = PW;
})();