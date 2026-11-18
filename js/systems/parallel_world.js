/* ============================================================
 * parallel_world.js  —  4. Parallel World System  (HUB + STORY 40 CHAPTER)
 *
 * ISI:
 *  1. Tombol ARCHIVE melayang disembunyikan -> jadi tab di HUB.
 *  2. Tab "PARALLEL WORLD" di HUB -> BABAK CERITA 40 CHAPTER
 *     (8 arc x 5 chapter, tiap chapter 2 stage + boss).
 *     Musuh mengikuti LEVEL TERTINGGI tim & makin sulit tiap chapter.
 *  3. Cerita: pencarian kebenaran diri. Makin jauh -> UI makin rusak
 *     (teks tersensor glitch, scanline, getar) dan kisah makin kelam.
 *  4. Chapter 40: keputusan terakhir
 *       - TERIMA & BERDAMAI (korbankan diri demi dunia) = GOOD ENDING
 *       - SIMPAN DENDAM (korbankan dunia demi tujuan baru) = BAD ENDING
 *     lalu POST CREDIT: keadaan dunia sesuai pilihan (+ pengaruh
 *     keputusan di Chapter 1). Ending yang sudah dilihat bisa ditonton lagi.
 *
 * API lama tetap sama:
 *   ParallelWorld.prompt('world1','save_village',(i)=>{...});
 *   ParallelWorld.decide / getBoss / getCharacters / getVariant / setFlag
 *   ParallelWorld.enterStory();   // buka layar Parallel World
 *
 * CATATAN:
 *  - Nama pembicara dialog yang dipakai: ARCHIVE, KAEL, AKU, ELIZABETH, ???
 *    (kalau G.dialog kamu punya warna/potret per nama, tambahkan 'AKU' & '???').
 *  - Save lama aman: chapter yang sudah selesai (1-4) tetap terhitung.
 *  - Kalau tombol ARCHIVE tidak ikut hilang, isi CFG.ARCHIVE_SELECTOR
 *    (contoh: '#ma-launcher').
 * ============================================================ */
(function () {
  'use strict';
  const MA = window.MA;
  if (!MA) { console.error('[ParallelWorld] ma_core.js belum di-load!'); return; }

  /* ---------- PENGATURAN (boleh diubah) ---------- */
  const CFG = {
    ARCHIVE_SELECTOR: '',     // selector CSS tombol ARCHIVE melayang (kosong = deteksi otomatis)
    TAB_ARCHIVE: 'ARCHIVE',
    TAB_PW: 'PARALLEL WORLD',
    BASE_CH: 10,              // chapter dasar musuh (G.mkEnemy maksimal chapter 10)
    LV_SCALE: 0.55,           // tiap 1 level tertinggi tim = +0.55 "chapter" skala musuh
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
   *  BABAK CERITA PARALLEL WORLD  (40 CHAPTER)
   * ============================================================ */
  const BOSS_NAMES = {
    guardian: 'Penjaga Gerbang',
    shadow_guardian: 'Penjaga Bayangan',
    corrupted_elder: 'Tetua Tercemar',
  };

  /* nama pembicara (singkatan -> nama tampil) */
  const SP = { A: 'ARCHIVE', K: 'KAEL', M: 'AKU', E: 'ELIZABETH', X: '???' };
  const L = (arr) => arr.map((r) => [SP[r[0]] || r[0], r[1]]);

  /* 8 ARC x 5 CHAPTER */
  const ARCS = [
    { n: 'ARC I — RETAKAN', d: 'Ada yang janggal dengan dunia ini. Dan dengan dirimu.' },
    { n: 'ARC II — INGATAN PALSU', d: 'Masa lalu yang kau ingat ternyata disusun orang lain.' },
    { n: 'ARC III — DARAH ARSIP', d: 'Arsip menyimpan lebih banyak rahasia daripada yang ia akui.' },
    { n: 'ARC IV — BAYANGAN KAEL', d: 'Kebenaran pertama datang, dan harganya mulai terasa.' },
    { n: 'ARC V — DUNIA RETAK', d: 'Setiap jawaban yang kau temukan melukai dunia ini.' },
    { n: 'ARC VI — DENDAM', d: 'Kau mulai ingat apa yang sebenarnya kau inginkan.' },
    { n: 'ARC VII — ARSIP RUNTUH', d: 'Tempat yang menuntunmu perlahan mati.' },
    { n: 'ARC VIII — KEBENARAN', d: 'Tidak ada lagi yang bisa disembunyikan.' },
  ];

  /* [judul, boss, blurb, intro, outro, extra] */
  const RAW = [
    /* ===== ARC I — RETAKAN ===== */
    ['GERBANG YANG TERBALIK', 'Penjaga Gerbang',
      'Dunia pertama muncul kembali, tapi semuanya tidak sama seperti ingatanmu.',
      [['A', 'Sebuah halaman terbuka di luar urutan. Sebuah dunia yang seharusnya sudah selesai... bergerak lagi.'],
       ['K', 'Dunia yang sama, tapi bayangannya berbeda. Aku bisa merasakannya.'],
       ['A', 'Di dunia paralel, setiap keputusanmu mengubah siapa yang menunggumu. Berhati-hatilah.']],
      [['K', 'Gerbang ini sudah terbuka. Tapi di baliknya masih ada dunia lain.'],
       ['A', 'Garis waktu bergeser. Halaman berikutnya sudah menunggu.']],
      { bossFrom: 'world1', dec1: ['world1', 'save_village'], dec2: ['world1', 'guardian_fate'] }],

    ['KOTA CERMIN', 'Penguasa Cermin',
      'Sebuah kota yang membalik setiap langkahmu. Pantulanmu tidak punya luka yang sama denganmu.',
      [['A', 'Kota ini tidak punya bayangan. Semua bayangan berdiri di seberang cermin, menatapmu.'],
       ['M', 'Pantulanku tidak punya bekas luka di tangan kiri. Padahal aku ingat luka itu.'],
       ['K', 'Cermin tidak pernah berbohong. Berarti yang berbohong adalah ingatanmu.']],
      [['K', 'Cermin itu pecah. Tapi pecahannya masih menunjukkan wajah yang bukan wajahmu.'],
       ['A', 'Teruskan. Kebenaran selalu bersembunyi di tempat yang paling sunyi.']]],

    ['PERPUSTAKAAN TANPA HURUF', 'Pustakawan Bisu',
      'Setiap buku bercerita tentang seseorang. Buku tentangmu kosong.',
      [['A', 'Setiap buku di sini bercerita tentang seseorang. Cari bukumu.'],
       ['M', 'Semua halamannya kosong. Hanya ada satu garis di sampul: sebuah nama yang dicoret.']],
      [['K', 'Dicoret, bukan dihapus. Seseorang tidak ingin kau melupakannya sepenuhnya.'],
       ['M', 'Atau tidak ingin aku menemukannya.']]],

    ['JALAN TANPA UJUNG', 'Pejalan Berulang',
      'Pohon yang sama, batu yang sama. Kau sudah berjalan di sini berkali-kali.',
      [['M', 'Pohon ini, batu ini... aku sudah pernah lewat sini. Berkali-kali.'],
       ['A', 'Sebelas kali. Yang terpotong bukan jalannya, tapi ingatanmu.']],
      [['K', 'Setiap putaran kau bertanya hal yang sama. Dan setiap putaran, kau lupa jawabannya.'],
       ['M', 'Kali ini aku tidak akan lupa.']]],

    ['NAMA YANG TERHAPUS', 'Penghapus Nama',
      'Kau mencoba mengingat namamu sendiri. Sesuatu menghalangimu.',
      [['M', 'Siapa namaku? Kenapa aku tidak bisa mengingatnya?'],
       ['A', 'Nama itu dilindungi. Bukan olehku. Oleh seseorang yang lebih dulu ada.']],
      [['K', 'Kita lanjutkan. Semakin dalam, semakin sedikit yang tersisa untuk dijaga.'],
       ['A', 'Garis waktu mulai retak di tepinya. Jangan menoleh ke belakang terlalu lama.']]],

    /* ===== ARC II — INGATAN PALSU ===== */
    ['RUMAH MASA KECIL', 'Ibu Boneka',
      'Rumah yang kau ingat ternyata hanya dinding kertas.',
      [['M', 'Ini rumahku. Tapi dindingnya hanya kertas.'],
       ['A', 'Rumah ini disusun dari potongan ingatanmu. Ada yang sengaja ditambahkan.']],
      [['M', 'Wanita itu tersenyum, tapi aku tidak pernah punya ibu yang tersenyum seperti itu.'],
       ['K', 'Seseorang menulis masa kecilmu. Bukan kau.']]],

    ['SEKOLAH TANPA MURID', 'Guru Bayangan',
      'Bel berbunyi, tapi tidak ada yang masuk. Kelas ini menunggu satu orang.',
      [['K', 'Bel berbunyi tapi tidak ada yang masuk. Kelas ini menunggu satu orang.'],
       ['M', 'Mejaku. Ada ukiran di sana: “jangan percaya Arsip”.']],
      [['A', 'Itu bukan tulisanku.'],
       ['M', 'Bukan. Itu tulisanku sendiri, dari versi yang lebih dulu.']]],

    ['ALBUM FOTO KOSONG', 'Kolektor Potret',
      'Semua wajah di foto terhapus, kecuali satu orang di sampingmu.',
      [['M', 'Semua wajah di foto ini terhapus. Kecuali satu orang yang berdiri di sampingku.'],
       ['K', 'Elizabeth.']],
      [['M', 'Elizabeth ada di setiap fotoku. Tapi aku tidak ingat sedekat apa kami dulu.'],
       ['A', 'Mungkin itu bagian yang paling ingin kau lupakan.']]],

    ['HUJAN ABU', 'Peramal Abu',
      'Langit menurunkan abu. Setiap serpihnya adalah halaman yang terbakar.',
      [['A', 'Langit menurunkan abu seperti salju. Setiap serpihnya adalah halaman yang terbakar.'],
       ['A', 'Dunia ini mulai kehabisan halaman.']],
      [['M', 'Kenapa Arsip membiarkan dunianya terbakar?'],
       ['A', 'Aku tidak membakarnya. Aku hanya tidak lagi mampu menahannya.']]],

    ['SUARA DALAM KASET', 'Penyiar Gema',
      'Sebuah kaset berputar sendiri. Suaramu berkata: “Jangan cari aku.”',
      [['X', 'Jangan cari aku. Kalau kau mendengar ini, berhentilah.'],
       ['M', 'Itu suaraku. Kenapa aku melarang diriku sendiri?']],
      [['K', 'Karena dia tahu kau tidak akan berhenti.'],
       ['A', 'Bagian pertama kebenaran sudah terbuka. Sisanya tidak akan seindah ini.']]],

    /* ===== ARC III — DARAH ARSIP ===== */
    ['RUANG ARSIP RAHASIA', 'Penjaga Arsip',
      'Ruangan yang tidak ada di peta. Di rak-raknya, ratusan salinan dirimu.',
      [['A', 'Ruangan ini tidak ada di peta. Aku sendiri jarang masuk ke sini.'],
       ['M', 'Kenapa ada begitu banyak salinan diriku di rak?']],
      [['M', 'Seratus tiga puluh versi diriku. Semuanya berhenti di halaman yang berbeda.'],
       ['K', 'Dan kau yang pertama yang masih berjalan.']]],

    ['MESIN PENJAHIT TAKDIR', 'Penenun Takdir',
      'Benang merah menjalar dari langit-langit, menjahit orang menjadi cerita.',
      [['M', 'Benang merah ini menempel di dadaku.'],
       ['A', 'Benang itu menuntunmu sejak awal. Kau tidak pernah benar-benar punya pilihan.']],
      [['M', 'Kau mengakuinya sekarang?'],
       ['A', 'Aku tidak bisa berbohong lagi. Aku mulai retak juga.']]],

    ['GUDANG DUNIA MATI', 'Pemulung Dunia',
      'Dunia-dunia gagal ditumpuk seperti sampah. Beberapa masih berdenyut.',
      [['K', 'Jadi ini ujung dari setiap garis waktu yang dibuang.'],
       ['M', 'Ada suara dari dalam tumpukan itu. Mereka masih hidup.']],
      [['M', 'Mereka masih hidup. Dan kita menutupnya begitu saja.'],
       ['K', 'Itulah harga dari sebuah dunia yang rapi.']]],

    ['MENARA JAM PATAH', 'Penjaga Waktu Patah',
      'Jarum jam berputar mundur. Setiap detik menghapus satu kenangan.',
      [['A', 'Jangan berdiri terlalu lama. Waktu di sini memakan ingatan.'],
       ['M', 'Tadi aku sedang marah pada seseorang. Aku lupa siapa.']],
      [['K', 'Cepat, ucapkan tujuanmu sebelum ikut hilang!'],
       ['M', 'Mencari tahu siapa aku sebenarnya.']]],

    ['PASAR FRAGMEN', 'Pedagang Ingatan',
      'Ingatan dijual dalam botol kaca. Satu botol berlabel namamu.',
      [['M', 'Satu botol ini berlabel namaku. Berapa harganya?'],
       ['X', 'Kau sudah membayarnya. Dengan seluruh masa kecilmu.']],
      [['M', 'Aku menjual ingatanku sendiri? Untuk apa?'],
       ['K', 'Nanti. Aku akan menjelaskan nanti.']]],

    /* ===== ARC IV — BAYANGAN KAEL ===== */
    ['LORONG SEPASANG LANGKAH', 'Langkah Kedua',
      'Suara langkah mengikutimu, terlambat setengah detik.',
      [['K', 'Jangan menoleh.'],
       ['M', 'Kenapa, Kael?'],
       ['K', 'Karena kau akan mengenalinya.']],
      [['M', 'Wajah itu wajahku, tapi lebih tua dan jauh lebih lelah.'],
       ['K', 'Dialah yang menulis semuanya. Dan dia berhenti di sini.']]],

    ['TAMAN YANG MATI', 'Tukang Kebun Duka',
      'Bunga-bunga di taman ini tumbuh dari nisan.',
      [['E', 'Seseorang menanam kami di sini agar tidak dilupakan.'],
       ['M', 'Elizabeth? Kau ada di sini?']],
      [['E', 'Aku hanya gema. Yang menyiramku adalah dukamu.'],
       ['M', 'Dukaku atas apa?'],
       ['E', 'Cari sendiri. Aku tidak sanggup mengatakannya.']]],

    ['PANGGUNG SANDIWARA', 'Sutradara Palsu',
      'Tirai terbuka. Seluruh perjalananmu dipentaskan lengkap dengan naskah.',
      [['A', 'Setiap dialog ditulis. Setiap pilihan sudah dipilihkan.'],
       ['M', 'Termasuk saat ini?'],
       ['A', 'Termasuk saat ini.']],
      [['M', 'Kalau semuanya sudah ditulis, kenapa aku masih bisa marah?'],
       ['K', 'Karena penulisnya juga marah.']]],

    ['RUANG INTEROGASI', 'Hakim Diri',
      'Satu kursi, satu lampu, dan hakim dengan wajahmu sendiri.',
      [['X', 'Kau dituduh meninggalkan sesuatu. Apa yang kau tinggalkan, hai Penulis?'],
       ['M', 'Aku bukan penulis!']],
      [['X', 'Vonis ditunda. Kau belum cukup kuat untuk mendengarnya.'],
       ['K', 'Sedikit lagi. Kau hampir sampai.']]],

    ['KEMATIAN PERTAMA', 'Dirimu yang Pertama',
      'Di tengah ruangan terbaring tubuh dengan wajahmu. Ia sudah mati lama sekali.',
      [['M', 'Wajah itu wajahku. Jadi aku bukan yang asli?'],
       ['A', 'Kau adalah apa yang tersisa darinya. Bagian yang bersedia melupakan.']],
      [['K', 'Maaf. Seharusnya kukatakan sejak awal.'],
       ['M', 'Kau tahu sejak awal?'],
       ['K', 'Aku adalah bagian lainnya. Bagian yang menolak melupakan.'],
       ['A', 'Kebenaran pertama: kau dan Kael adalah satu orang yang terbelah.']]],

    /* ===== ARC V — DUNIA RETAK ===== */
    ['LANGIT RETAK', 'Penjaga Langit Retak',
      'Langit pecah seperti kaca. Dari retaknya merembes tinta hitam.',
      [['A', 'Setiap kebenaran yang kau temukan melukai dunia ini. Aku tidak bisa menahannya lagi.'],
       ['M', 'Jadi semakin aku mencari, semakin dunia ini hancur?']],
      [['K', 'Dunia ini ditulis dari ketidaktahuanmu. Semakin kau tahu, semakin ia robek.'],
       ['M', 'Dan kau tetap mendorongku maju.']]],

    ['LAUT TERBALIK', 'Leviathan Terbalik',
      'Laut menggantung di langit. Ikan berenang di atas kepalamu.',
      [['M', 'Haruskah kita terus?'],
       ['K', 'Berhenti sekarang berarti semua yang hilang tadi sia-sia.']],
      [['A', 'Leviathan itu tenggelam ke atas, lenyap di dalam retakan langit.'],
       ['A', 'Satu dunia lagi hilang dari daftar.']]],

    ['KOTA TANPA WARNA', 'Kurator Abu-abu',
      'Warna dicabut satu per satu. Orang-orang berjalan seperti tokoh yang naskahnya habis.',
      [['M', 'Mereka masih bernapas?'],
       ['A', 'Selama kau masih membaca, mereka masih ada.']],
      [['M', 'Aku tidak mau membuat orang lain menderita demi jawabanku.'],
       ['K', 'Terlambat untuk itu. Kita sudah terlalu jauh.']]],

    ['HUTAN JERITAN', 'Rimba Menjerit',
      'Pohon-pohon menjerit dengan suara orang yang kau kenal.',
      [['E', 'Tolong jangan lihat aku. Aku sudah bukan aku.'],
       ['M', 'Elizabeth! Kenapa semuanya jadi seperti ini?']],
      [['A', 'Karena kau semakin dekat dengan jawabannya.'],
       ['M', 'Kalau begitu jawabannya pasti sesuatu yang mengerikan.']]],

    ['GERBANG SERIBU PINTU', 'Penjaga Pintu',
      'Seribu pintu, satu yang benar. Sisanya membawa ke akhir dunia lain.',
      [['K', 'Pintu paling gelap. Ikuti aku.'],
       ['M', 'Kenapa selalu pintu yang paling gelap?']],
      [['A', 'Pintu yang benar terbuka. Di baliknya ada bau terbakar.'],
       ['A', 'Mulai dari sini aku tidak bisa lagi memastikan apakah yang kau lihat itu nyata.']]],

    /* ===== ARC VI — DENDAM ===== */
    ['ALTAR PEMBALASAN', 'Imam Dendam',
      'Altar di tengah reruntuhan. Di atasnya nama-nama yang dicoret dengan darah.',
      [['K', 'Ini daftar mereka yang harus membayar.'],
       ['M', 'Siapa yang membuat daftar ini?'],
       ['K', 'Kita.']],
      [['M', 'Aku menulis daftar ini? Aku menginginkan semua ini?'],
       ['K', 'Kau menginginkan satu hal. Daftar ini hanya jalannya.']]],

    ['PERANG TANPA NAMA', 'Jenderal Hampa',
      'Dua pasukan saling menebas tanpa tahu alasannya. Panji mereka sama-sama kosong.',
      [['A', 'Perang ini lahir dari satu kemarahan yang dituliskan terlalu kuat.'],
       ['M', 'Berhenti! Kalian bahkan tidak tahu kenapa kalian bertarung!']],
      [['M', 'Setiap korban di sini lahir dari amarahku?'],
       ['A', 'Kau menyebutnya dendam. Dunia menyebutnya bencana.']]],

    ['MAKAM ELIZABETH', 'Gema Elizabeth',
      'Di tengah makam, sebuah batu tanpa nama. Kau tahu siapa pemiliknya.',
      [['M', 'Elizabeth, kaulah yang hilang itu.'],
       ['E', 'Aku mati karena kecerobohanku, bukan karena siapa pun. Tapi kau tidak bisa menerimanya.']],
      [['M', 'Aku menulis ulang dunia agar kau tidak mati.'],
       ['E', 'Dan setiap tulisan ulang melukai orang lain.'],
       ['K', 'Kita bisa menulis ulang sekali lagi. Yang terakhir.']]],

    ['API YANG DINYALAKAN', 'Pembakar Dunia',
      'Kau melihat dirimu sendiri menyalakan api di desa pertama.',
      [['X', 'Lihatlah. Bukan penjaga gerbang yang membakarnya. Kau.'],
       ['K', 'Kita membakarnya. Kita ingin dunia merasakan kehilangan yang sama.']],
      [['M', 'Aku bukan korban. Aku penyebabnya.'],
       ['A', 'Kau keduanya.']]],

    ['PENA PERTAMA', 'Penulis Pertama',
      'Sebuah pena hitam melayang di ruang hampa. Siapa pun pemegangnya bisa menulis ulang kenyataan.',
      [['A', 'Pena itu bukan milikku. Aku diciptakan agar pena itu tidak pernah dipakai. Dan aku gagal.']],
      [['K', 'Pena itu menunggu pemiliknya. Kau tahu siapa.'],
       ['M', 'Aku belum memutuskan apa pun.'],
       ['K', 'Tentu. Kau selalu memutuskan di akhir.']]],

    /* ===== ARC VII — ARSIP RUNTUH ===== */
    ['PERPUSTAKAAN TERBAKAR', 'Arsiparis Gila',
      'Perpustakaan tempat semuanya dimulai kini terbakar. Arsip tertawa di antara asapnya.',
      [['A', 'Maaf. Aku mulai lupa siapa yang menciptakanku.'],
       ['M', 'Arsip, bertahanlah.']],
      [['A', 'Aku sudah hampir selesai. Maju terus.']]],

    ['HALAMAN ROBEK', 'Perobek Halaman',
      'Halaman beterbangan seperti burung yang terluka. Beberapa memuat wajah orang yang tidak kau kenal.',
      [['M', 'Mereka siapa?'],
       ['A', 'Orang-orang yang tidak sempat kau selamatkan.']],
      [['M', 'Ada tulisan di salah satu halaman: “Tolong hentikan ini.” Itu tulisan tanganku.'],
       ['K', 'Bagian dirimu yang lelah. Abaikan.']]],

    ['TINTA HITAM', 'Raja Tinta',
      'Tinta menenggelamkan lantai sampai selutut. Setiap tetesnya membisikkan namamu yang asli.',
      [['X', 'Namamu adalah...'],
       ['K', 'Jangan dengarkan!']],
      [['M', 'Aku ingat namaku.'],
       ['K', 'Jangan ucapkan! Belum saatnya.'],
       ['M', 'Kenapa kau takut?'],
       ['K', 'Karena setelah kau mengucapkannya, kau tidak akan mau memegang pena itu.']]],

    ['RUANG TANPA CERMIN', 'Dirimu yang Terbuang',
      'Tidak ada pantulan. Hanya dirimu yang pernah kau buang: marah, takut, serakah.',
      [['X', 'Kau membuang kami. Sekarang kami datang menagih.'],
       ['M', 'Kalian bagian dariku. Aku tidak bisa membunuh kalian.']],
      [['A', 'Maka jangan lawan mereka. Terima mereka, lalu lanjutkan.'],
       ['M', 'Menerima, bukan menghapus.']]],

    ['JANTUNG ARSIP', 'Jantung Arsip',
      'Arsip menuntunmu ke jantungnya. Berdenyut lemah, hampir berhenti.',
      [['A', 'Kalau aku mati, dunia paralel berhenti terbelah. Tapi pena itu jadi bebas.']],
      [['A', 'Aku sudah memberikan semua yang kupunya. Sisanya pilihanmu.'],
       ['M', 'Arsip...'],
       ['A', 'Terima kasih sudah menjadi pembaca terakhirku.']]],

    /* ===== ARC VIII — KEBENARAN ===== */
    ['LORONG AKHIR', 'Kael Pemegang Dendam',
      'Kael melepas topengnya. Ia bukan penuntun. Ia pemburu.',
      [['K', 'Cukup berpura-pura. Kau tahu, aku tahu.'],
       ['M', 'Kenapa kau menuntunku sampai sini?'],
       ['K', 'Aku hanya bayangan. Kau yang bisa memegang pena.']],
      [['K', 'Kalahkan aku sebanyak yang kau mau. Di ujung lorong nanti, kau tetap yang memilih.']]],

    ['WUJUD KEHILANGAN', 'Wujud Kehilangan',
      'Bayangan raksasa yang menyerupai Elizabeth, tapi hancur dari dalam.',
      [['E', 'Aku bukan dia. Aku hanya apa yang tersisa dari kehilangan.']],
      [['M', 'Aku mengerti. Kehilangan tidak bisa dikalahkan.'],
       ['E', 'Hanya bisa dibawa. Atau dijadikan senjata.']]],

    ['TAKHTA KOSONG', 'Penjaga Takhta Kosong',
      'Siapa pun yang duduk di sana menjadi penulis dunia baru.',
      [['M', 'Aku tidak ingin menjadi penulis siapa pun.'],
       ['X', 'Kalau begitu kau tidak layak duduk. Kau hanya layak memilih.']],
      [['K', 'Takhta itu bergetar, tapi tidak runtuh. Kau akan tetap sampai di ujung.']]],

    ['GERBANG SEBELUM AKHIR', 'Bayangan Dirimu',
      'Semua versi dirimu berbaris di gerbang terakhir: yang marah, yang menyerah, yang mati.',
      [['M', 'Aku tidak akan menjadi salah satu dari kalian.'],
       ['X', 'Kau sudah menjadi kami semua.']],
      [['E', 'Apa pun yang kau pilih nanti, aku sudah memaafkanmu.'],
       ['M', 'Terima kasih, Elizabeth.']]],

    ['UJUNG SEMUA DUNIA', 'Penulis Alternatif',
      'Halaman terakhir. Tidak ada lagi cabang. Hanya pena, dan kau.',
      [['A', 'Ini halaman terakhir dari semua dunia. Setelah ini tidak ada cabang lagi.'],
       ['K', 'Ambil pena itu. Hidupkan dia kembali. Dunia hanyalah tinta.'],
       ['M', 'Atau aku melepaskan semuanya.']],
      [['A', 'Penulis Alternatif lenyap. Pena hitam kini menunggu tanganmu.'],
       ['M', 'Jadi di sini semuanya berakhir. Dan aku yang memutuskan bagaimana.']]],
  ];

  const STORY = RAW.map((r, i) => Object.assign({
    t: r[0], boss: r[1], blurb: r[2], intro: L(r[3]), outro: L(r[4]),
    arc: Math.floor(i / 5),
  }, r[5] || {}));
  const N = STORY.length;

  /* ---------- KEPUTUSAN TERAKHIR & ENDING ---------- */
  const FINAL_TEXT =
    'Pena hitam melayang di depanmu. Kael menatap dari kejauhan, Elizabeth menunggu dalam diam. ' +
    'Semua kebenaran sudah terbuka. Kini hanya ada dua jalan.\n\n' +
    '🕊️ TERIMA & BERDAMAI: kau menerima kehilangan dan melepaskan dendam. Kau merelakan dirimu demi dunia.\n\n' +
    '🔥 SIMPAN DENDAM: kau mengambil pena dan menulis ulang kenyataan. Kau mengorbankan dunia demi tujuan barumu.';

  const ENDINGS = {
    good: {
      name: 'GOOD ENDING — “PULANG”',
      scene: L([
        ['M', 'Aku menerimanya. Elizabeth tidak akan kembali, dan aku bukan penulis siapa pun lagi.'],
        ['K', 'Kau benar-benar akan menghilang? Demi mereka?'],
        ['M', 'Bukan hanya demi mereka. Demi kita berdua. Ikutlah, Kael. Letakkan amarahmu.'],
        ['K', 'Baiklah. Aku lelah membawa ini sendirian.'],
        ['E', 'Terima kasih. Sudah pulang.'],
        ['A', 'Halaman terakhir ditutup. Satu nama tertulis, bukan oleh pena, melainkan oleh dunia yang kau selamatkan.'],
      ]),
      post(v) {
        const village = {
          prime: 'Desa di gerbang pertama masih berdiri, dan para penduduknya tidak pernah tahu siapa yang menjaga mereka.',
          fallen: 'Desa di gerbang pertama dibangun kembali dari abu. Pelan-pelan penduduknya menanam bunga di bekas reruntuhan.',
          redeemed: 'Penjaga gerbang yang dulu terkutuk kini menjaga desa sebagai warga biasa, dan setiap pagi menyapa anak-anak.',
        }[v] || 'Desa di gerbang pertama hidup tenang.';
        return [
          'Dunia-dunia paralel berhenti terbelah. Langit yang retak menyatu kembali, laut kembali ke bawah, dan kota-kota mendapatkan warnanya lagi.',
          village,
          'Para penghuni dunia mati yang dulu dibuang di gudang kini bernapas kembali, sebagai dunia yang berdiri sendiri.',
          'Elizabeth tidak kembali, tetapi namanya dikenang. Di taman yang sama, bunga tumbuh bukan dari nisan, melainkan dari tanah yang subur.',
          'Kael ikut hilang bersamamu. Mereka berdua, dua bagian dari satu orang yang terbelah, pergi dengan tenang.',
          'Di sebuah desa kecil, seorang anak menemukan buku kosong di tepi jalan. Ia tidak menunggu siapa pun menulis ceritanya. Ia mengambil pena dan menulis namanya sendiri.',
        ];
      },
    },
    bad: {
      name: 'BAD ENDING — “TINTA”',
      scene: L([
        ['M', 'Aku tidak akan memaafkan dunia yang mengambilnya.'],
        ['K', 'Akhirnya. Tulis. Tulis semuanya.'],
        ['E', 'Jangan. Jangan lakukan ini atas namaku.'],
        ['M', 'Maaf, Elizabeth. Aku hanya ingin kau kembali.'],
        ['A', 'Pena menyentuh halaman. Dunia-dunia paralel runtuh menjadi tinta, dan tinta itu menjadi satu kalimat: “Dia kembali.”'],
      ]),
      post(v) {
        const village = {
          prime: 'Desa di gerbang pertama masih berdiri. Penduduknya mengulang pagi yang sama setiap hari, tanpa tahu mengapa.',
          fallen: 'Desa di gerbang pertama tetap menjadi abu. Kau menuliskannya demikian, karena amarahmu butuh sesuatu untuk dikenang.',
          redeemed: 'Penjaga gerbang yang dulu kau ampuni kini berdiri di depan desa yang kosong, menunggu seseorang yang tidak akan datang.',
        }[v] || 'Desa di gerbang pertama kosong dan sunyi.';
        return [
          'Elizabeth kembali. Ia berdiri di dunia yang kau tulis ulang, tetapi tak seorang pun mengenali dunia itu, termasuk dirinya.',
          'Langit kini adalah halaman putih yang dipenuhi kalimat. Orang-orang berjalan, berbicara, dan tersenyum persis seperti yang kau tuliskan, tidak lebih.',
          village,
          'Dunia-dunia paralel yang lain habis menjadi tinta. Tidak ada lagi jalan menuju dunia lain, tidak ada lagi tempat untuk pergi.',
          'Kael tertawa untuk terakhir kalinya, lalu lenyap. Dendamnya sudah punya rumah, dan rumah itu adalah dirimu.',
          'Elizabeth menatapmu dan bertanya, “Kenapa kau menangis?” Kau tidak bisa menjawab, sebab kau tidak boleh menuliskan jawaban untuk dirimu sendiri.',
          'Jauh di dalam arsip yang sudah mati, sebuah halaman kosong terbuka. Sesuatu sedang mencari penulis baru.',
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

  /* ---------- skala musuh mengikuti level tim ---------- */
  function topLevel() {
    const G = window.G, S = G && G.state;
    if (!S || !S.lv) return 1;
    const ids = (S.party && S.party.length) ? S.party : Object.keys(S.lv);
    let m = 1;
    ids.forEach((k) => { const v = S.lv[k]; if (v && v.l > m) m = v.l; });
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

  function lose() { clearOverlay(); typeof window.after === 'function' ? window.after() : screen(); }

  function runChapter(i) {
    const G = window.G, S = G.state, c = STORY[i];
    const bossName = c.bossFrom ? (BOSS_NAMES[PW.getBoss(c.bossFrom)] || c.boss) : c.boss;
    setOverlay(i / (N - 1));

    const decide = (d, next) => { if (d) PW.prompt(d[0], d[1], () => next()); else next(); };
    const stage = (k, next) => G.fight(foesFor(c, i, k, bossName), (ok) => {
      if (!ok) return lose();
      G.save && G.save();
      next();
    });

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
      { label: '🕊️ TERIMA & BERDAMAI (korbankan dirimu)', fn: () => ending('good') },
      { label: '🔥 SIMPAN DENDAM (korbankan dunia)', fn: () => ending('bad') },
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
      <span class="pwl">LV TERTINGGI TIM: ${L2} • SKALA MUSUH: CH ${cn}</span></div>
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
    injectCSS();
    setOverlay(kind === 'bad' ? 0.9 : 0.15);
    const e = ENDINGS[kind];
    const v = (PW.getVariant('world1') || {}).id;
    const paras = e.post(v);
    const body = paras.map((p, i) => `<p class="pwr" style="animation-delay:${(i * 1.6 + 0.6).toFixed(1)}s">${MA.esc(p)}</p>`).join('') +
      `<div class="pwend" style="animation-delay:${(paras.length * 1.6 + 1).toFixed(1)}s">${MA.esc(e.name)}</div>`;
    A.innerHTML = `<div class="wipe"></div><div class="pws cr ${kind}" style="--cor:${kind === 'bad' ? 0.9 : 0.1}"><div class="pwbg"></div>
      <div class="pwt"><span class="pwk">POST CREDIT</span><span class="pwl">KEADAAN DUNIA SETELAH PILIHANMU</span></div>
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
    if (tabs) clearOverlay();   /* kembali ke HUB = efek korupsi dimatikan */
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

  /* ---------- UI panel Archive (tab Dunia Paralel) ---------- */
  function render(el) {
    const list = Object.values(worlds);
    const ed = st.story.endings || {};
    let html = '<div class="ma-card"><h4>🌀 Babak Parallel World</h4>' +
      '<div class="ma-muted">Chapter selesai: ' + (st.story.cleared || 0) + '/' + N +
      ' • Musuh mengikuti level tertinggi tim.</div>' +
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
        { id: 'prime', name: 'Garis Waktu Utama', desc: 'Desa masih berdiri dan penjaga gerbang berdiri teguh.', requires: {}, characters: ['elizabeth'], boss: 'guardian' },
        { id: 'fallen', name: 'Garis Waktu Runtuh', desc: 'Desa hancur akibat pilihanmu. Bayangan menguasai gerbang.', requires: { village: 'burned' }, characters: ['elizabeth', 'survivor'], boss: 'shadow_guardian' },
        { id: 'redeemed', name: 'Garis Waktu Penebusan', desc: 'Desa selamat dan sang penjaga sadar dari kutukannya.', requires: { village: 'saved', mercy: true }, characters: ['elizabeth', 'guardian_freed'], boss: 'corrupted_elder' },
      ],
      decisions: [
        { id: 'save_village', title: 'Nasib Desa', text: 'Api mulai melahap desa. Kamu hanya sempat memilih satu hal.', choices: [
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