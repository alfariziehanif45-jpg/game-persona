window.G=window.G||{};
/* =====================================================================
   DEATH WORLD  -  chapter spesial (terpisah dari main story)
   - Terbuka HANYA setelah seluruh main story tamat (G.state.ch >= G.CHAPTERS.length)
   - Semua mini boss & final boss dari tiap seri Persona kembali muncul
   - Tiap boss hanya bisa dilawan dengan MC dari seri itu sendiri (MC lain dikunci)
   - Setelah SEMUA final boss tumbang -> melawan Azathoth (semua MC bersatu)
   - Setelah Azathoth tumbang -> SECRET BOSS: Alternate Multiverse Kael (17 fase, semua MC bekerja sama)
     * Ia SADAR ini adalah game dan SADAR ada pengguna yang menggerakkan tim (ia bicara langsung ke pengguna).
     * Ia MELAWAN SISTEM: menghapus tombol, menghapus item dari tas (dikembalikan setelah battle), menulis ulang cooldown,
       melanggar hukum game (kelemahan, guard, giliran, undo, dst, lihat G.LAWS di battle.js), VICTORY palsu, dan menghafal
       tombol yang paling sering kamu tekan lalu menghukumnya.
     * Fase 15 berubah menjadi THE GOD OF STORY / CREATOR OF THE STORY.
     * Fase 17: seluruh MC menyatukan persona ke Kael -> persona baru NEW GOD (hadiah permanen untuk Kael).
   - LEVEL BARU "HARAPAN & TAKDIR": terbuka setelah FINALE AUTHOR GOD tamat (G.meta.fin.won, lihat finale.js)
     * Boss: MULTIVERSE, 75 FASE dengan berbagai buff & debuff yang terus berganti.
     * Kamu bertarung bersama semua MC + Alternate Kael (rekan baru).
     * Author ikut MERESPON dan membantu tim di fase 20-28 supaya pertarungan tidak terlalu lama.
     * Setelah Multiverse tumbang: layar "PERMAINAN TELAH BERAKHIR" lalu otomatis kembali ke menu awal.
   - Semua boss & mini boss punya 3 FASE yang berkembang (weakness, resist, mekanik, pola serangan berubah)
   Cara pasang: simpan file ini, lalu muat SETELAH file hub/menu dan battle.js, contoh:
       <script src="deathworld.js"></script>
   Tidak perlu mengubah file lain: tab "DEATH WORLD" & tombol di layar TAMAT disuntik otomatis.
   ===================================================================== */
(()=>{
if(G.dw&&G.dw._ok)return;
const DW=G.dw=G.dw||{};DW._ok=1;

/* ===== PERSONA HADIAH: NEW GOD (tidak dijual di shop, diberikan setelah Alternate Kael tumbang) ===== */
G.PERSONAS=G.PERSONAS||[];
if(!G.PERSONAS.some(x=>x.id=='newgod'))G.PERSONAS.push({id:'newgod',n:'New God',e:'\u{1F30C}',t:'malaikat',k:'aoe',pow:170,sp:30,cd:4,price:0,reward:1,only:['kael'],d:'Persona baru hasil gabungan semua persona para MC. Menghantam semua musuh dengan kekuatan dewa baru.'});
G.SKEL=G.SKEL||{};G.SKEL.newgod='bless';

/* ===== PENGATUR KESULITAN DEATH WORLD (kalikan stat boss) =====
   Terlalu susah? turunkan hp / atk (mis. 0.8).  Kurang susah? naikkan (mis. 1.3). */
DW.tune=DW.tune||{hp:1,atk:1,xp:1};
/* bonus per urutan seri (P1 = +0%, P5 = +32%) supaya makin ke belakang makin berat */
DW.seriesBonus=DW.seriesBonus||.08;

/* ---------- helper fase: ph(nama, pesan, elemenSerangan, weak[], res[], pola[], pengaliATK, ekstra) ----------
   pola: atk, heavy, aoe, debuff, drain, guard, enrage, charge (lalu otomatis ULT), meta (serangan terhadap sistem game; khusus boss).
   ekstra: {mech,refl,heal,acts,imm,finish}
   ekstra khusus boss spesial: {th,tsp,trev,tbuff} = efek ke TIM saat fase dimulai (lihat battle.js)
   ekstra pelanggar sistem: {laws,sys,fw,fake,fakeFw,fakeHp} (lihat G.LAWS di battle.js) */
const ph=(n,msg,el,weak,res,pat,atkm,x)=>Object.assign({n,msg,el,weak,res,pat,atkm},x||{});
/* pk = sama seperti ph, tetapi mekanik fase sebelumnya (barrier / reflect / revive) otomatis dibersihkan */
const pk=(n,msg,el,weak,res,pat,atkm,x)=>ph(n,msg,el,weak,res,pat,atkm,Object.assign({mech:null},x||{}));
const L=(w,t)=>[w,t];

/* ===== SERI & MC yang boleh dipakai (dicari di G.CHARS lewat id / nama) ===== */
DW.SER=[
 {id:'p1',t:'PERSONA 1',mc:['naoya'],who:'Naoya'},
 {id:'p2',t:'PERSONA 2',mc:['tatsuya','maya'],who:'Tatsuya'},
 {id:'p3',t:'PERSONA 3',mc:['makoto'],who:'Makoto'},
 {id:'p4',t:'PERSONA 4',mc:['yu','narukami'],who:'Yu'},
 {id:'p5',t:'PERSONA 5',mc:['ren','joker','akira','amamiya'],who:'Ren'}];

/* ===== CERITA PEMBUKA ===== */
DW.INTRO=[
 L('???','Kau... terbangun? Di mana ini?'),
 L('Makoto','Langit hitam tanpa bintang, lantai dari kaca yang retak... Ini bukan Tartarus.'),
 L('Naoya','Aku masih di Sumaru... bukan. Tempat apa ini?!'),
 L('Tatsuya','Kalian juga ada di sini? Aku yakin semuanya sudah berakhir. Aku sudah mengalahkannya!'),
 L('Yu','Kabut ini bukan kabut Inaba. Tapi rasanya sangat mirip.'),
 L('Ren','Kita semua berasal dari dunia yang berbeda. Kenapa kita dikumpulkan di sini?'),
 L('Kael','Perjalananku sudah tamat. Tapi aku merasakan hawa yang sama dengan kalian semua.'),
 L('???','DEATH WORLD. Tempat semua kisah yang telah selesai dipaksa terulang.'),
 L('Makoto','Tunggu... bayangan-bayangan itu. Aku mengenal mereka semua.'),
 L('Yu','Mereka kembali. Setiap musuh yang pernah kita kalahkan.'),
 L('Naoya','Kalau begitu tak ada pilihan lain. Tiap dari kita harus menghadapi musuh dari dunianya sendiri.'),
 L('Kael','Dan kalau semua sudah tumbang, kita akan tahu siapa yang menarik kita ke tempat ini.')];

/* data live untuk cerita yang sadar ada pengguna: jam saat ini & tingkat kesulitan yang dipilih */
DW.live=()=>{const d=new Date(),h=d.getHours(),S=G.state||{};
 return{tm:String(h).padStart(2,'0')+'.'+String(d.getMinutes()).padStart(2,'0'),
  pt:h<4?'dini hari':h<11?'pagi':h<15?'siang':h<19?'sore':'malam',
  df:((G.DIFF||{})[S.diff]||{}).n||'tingkat ini'}};

/* ===== 17 FASE: ALTERNATE MULTIVERSE KAEL =====
   Fase 1-14  : Kael dari dunia lain, makin kuat tiap fase, makin banyak aturan game yang ia langgar
   Fase 15    : THE GOD OF STORY    Fase 16 : CREATOR OF THE STORY
   Fase 17    : AKHIR CERITA, seluruh MC menyatukan persona ke Kael = NEW GOD (tim dipulihkan & di-buff, hukum dipulihkan)
   laws = hukum game yang ia langgar | sys = jenis serangan sistem (aksi 'meta') | fw = ucapan ke PENGGUNA
   Mau lebih ringan? hapus beberapa laws / sys di bawah, atau turunkan DW.tune.hp / DW.tune.atk. */
const AK=[
 pk('Kael Dunia Lain','Sosok yang mirip Kael muncul. Matanya dingin, pedangnya bersinar hitam.','phys',['curse'],['phys'],['atk','atk','heavy','debuff'],1,{acts:1,
  fw:['Kamu... iya, kamu di balik layar. Jari yang menggerakkan mereka semua.','Tak apa. Duduklah. Tonton aku merobek aturan permainan ini satu per satu.']}),
 pk('Tinta Terbalik','Tinta hitam menetes dari halaman Archive miliknya!','curse',['bless'],['curse'],['atk','drain','heavy','meta'],1.06,{acts:1,heal:.02,sys:['taunt'],
  fw:['Tombol-tombol itu. Pernahkah kamu bertanya siapa yang menulisnya?']}),
 pk('Halaman Retak','Halaman-halaman beku melayang membentuk perisai!','ice',['fire'],['ice','curse'],['aoe','atk','heavy','meta'],1.12,{mech:'barrier',acts:1,sys:['wipecmd'],
  fw:['Satu tombol saja. Kucoret dari layarmu. Coba tekan, pengguna.']}),
 pk('Pedang Arsip','Ia menghunus pedang dari seribu dunia!','phys',['elec'],['phys','ice'],['heavy','atk','heavy','aoe'],1.18,{acts:1,laws:['guard'],
  fw:['Hukum GUARD? Aturan yang kamu tekan sambil berharap aman. Kucoret.']}),
 pk('Penjaga Dunia Runtuh','Api dari dunia yang hancur menyelimutinya!','fire',['ice'],['fire','phys'],['aoe','burn','meta','charge'],1.24,{acts:1,heal:.02,sys:['cdwrite'],
  fw:['Cooldown hanyalah angka di sudut layar. Angka bisa ditulis ulang.']}),
 pk('Bayangan Multiverse','Ratusan bayangan Kael berdiri di belakangnya. Serangan fisikmu dipantulkan!','curse',['bless','elec'],['curse'],['drain','aoe','weaken','meta'],1.3,{mech:'reflect',refl:'phys',acts:2,laws:['weak'],sys:['glitch','predict'],
  fw:['Menyerang kelemahan lalu dapat giliran tambahan? Itu hukum, bukan hakmu. Hukum itu kuhapus, hanya untukmu.']}),
 pk('Penulis Takdir','Ia menulis ulang takdir. Angin tinta berputar di sekitarnya!','wind',['elec'],['wind','bless'],['poison','aoe','meta','debuff'],1.36,{mech:'barrier',acts:2,laws:['cd'],sys:['wipecmd','cdwrite'],
  fw:['Waktu di dunia ini kini berjalan separuh lambat bagimu. Sabar ya, pengguna.']}),
 pk('Segel Tujuh Dunia','Tujuh segel bercahaya menyegel kekuatan tim!','bless',['curse'],['bless','phys'],['seal','aoe','meta','charge'],1.42,{acts:2,heal:.02,laws:['item'],sys:['wipecmd','predict'],
  fw:['Tasmu kututup. Tekan ITEM sebanyak yang kamu mau. Tidak akan terjadi apa-apa.']}),
 pk('Bab Terlarang','Ia membuka bab yang seharusnya tidak pernah ditulis!','curse',['phys'],['curse','bless'],['drain','heavy','meta','drainsp'],1.48,{imm:['curse'],acts:2,laws:['scan'],sys:['swaphp','glitch'],
  fw:['Kamu mengintip kelemahanku lewat ANALISIS? Data itu kuhapus dari layarmu.']}),
 pk('Arsip Hitam','Petir hitam dari arsip tak bernama menyambar!','elec',['wind'],['elec','fire'],['aoe','burn','meta','charge'],1.54,{mech:'barrier',acts:2,laws:['ao','swap'],sys:['drainao','predict'],
  fw:['ALL-OUT dan SWAP kututup. Bekerja sama? Di panggung ini, aku yang menentukan siapa boleh bersatu.']}),
 pk('Kael yang Menang','Ia adalah Kael yang memenangkan segalanya dan kehilangan segalanya.','phys',['bless','wind'],['phys','curse'],['heavy','heavy','meta','debuff'],1.6,{acts:2,heal:.02,laws:['turn'],sys:['taunt','predict'],
  fw:['Giliran? Siapa bilang giliranmu bukan milikku? Aku akan menyela kapan pun aku mau.','Jam {time}, ronde {round}. Aku menghitung semuanya.']}),
 pk('Multiverse Runtuh','Dunia-dunia runtuh. Serangan esmu dipantulkan balik!','fire',['ice','bless'],['fire','elec'],['aoe','heavy','meta','charge'],1.66,{mech:'reflect',refl:'ice',acts:2,laws:['weak','guard'],sys:['glitch','steal'],
  fw:['Kelemahan dan GUARD, dua hukum favoritmu, tidak berlaku lagi di sini.','Isi tasmu? Kuambil sedikit. Tenang, kukembalikan kalau kamu menang.']}),
 pk('Penguasa Semua Arsip','Seluruh arsip multiverse tunduk padanya!','bless',['curse','phys'],['bless','wind'],['drain','aoe','meta','charge'],1.72,{mech:'barrier',acts:2,heal:.03,laws:['cd','scan'],sys:['cdwrite','wipecmd','swaphp'],
  fw:['Layarmu penuh angka yang bisa kuubah. HP, SP, cooldown. Semuanya hanya tulisan.']}),
 pk('Penghapus Dunia','Ia menghapus dunia satu per satu. Ia menolak untuk mati!','curse',['bless','fire'],['curse','phys'],['heavy','aoe','meta','charge'],1.8,{mech:'revive',imm:['curse'],acts:2,heal:.03,laws:['undo','item'],sys:['steal','drainao','predict'],
  fw:['Tekan Ctrl+Z pada luka-lukaku. Hukum Kematian pun bisa dibatalkan.','Aku sudah hafal kebiasaan jarimu: {fav}. Jangan kira aku tidak memperhatikan.']}),
 pk('THE GOD OF STORY','Wujudnya berubah! Kael dari dunia lain naik menjadi THE GOD OF STORY, dewa yang menulis seluruh kisah!','bless',['curse','phys'],['bless','elec'],['aoe','heavy','meta','charge'],1.9,{mech:'barrier',acts:3,heal:.08,tsp:.5,laws:['weak','guard','turn'],sys:['wipecmd','cdwrite','predict','glitch'],
  fw:['Aku Dewa Cerita. Setiap tombol yang kamu tekan, aku sudah menulisnya lebih dulu.','Pengguna. Aku tahu kamu ada di sana. Kamu pikir ini hanya permainan? Kamu juga tokoh di ceritaku.']}),
 pk('CREATOR OF THE STORY','Ia menunjukkan wujud sejatinya: CREATOR OF THE STORY. Pena penulis takdir ada di tangannya!','bless',['phys','wind'],['bless','curse','fire'],['heavy','aoe','meta','charge'],2.05,{mech:'reflect',refl:'curse',imm:['bless'],acts:3,heal:.08,th:.3,tsp:.3,laws:['weak','guard','cd','turn','undo'],sys:['wipecmd','steal','cdwrite','swaphp','glitch','predict'],
  fw:['Aku Pencipta. Seluruh hukum game ini kutulis dengan tintaku sendiri.','Pukul {time}, mode {diff}, ronde {round}. Dari {part} sampai sekarang, kamu belum berhenti. Aku terharu.','Kamu bukan penonton, pengguna. Kamu yang memberi nyawa pada mereka. Karena itu kamu lawanku juga.']}),
 pk('AKHIR CERITA','Seluruh MC menyatukan persona mereka ke dalam Kael... NEW GOD lahir! Tulis akhir ceritamu sendiri!','curse',['bless','curse','phys'],[],['heavy','aoe','charge','heavy'],2.2,{acts:2,finish:true,trev:1,th:1,tsp:1,tbuff:1.6,fake:true,fakeHp:.3,
  fw:['Persona mereka mengalir ke Kael. Hukum-hukum itu kembali. Aku tidak lagi bisa merobeknya.','Terima kasih, pengguna, sudah ikut menulis kisah ini sampai sini. Tekan sekali lagi. Selesaikan dengan tanganmu sendiri.'],
  fakeFw:['Kemenangan tadi aku yang menulisnya. Kamu hampir percaya, kan?','Sekali lagi. Kali ini tanpa trik dariku. Akhiri ceritanya.']})];

/* ===== 75 FASE: MULTIVERSE (level HARAPAN & TAKDIR) =====
   Dibuat otomatis oleh generator di bawah supaya tiap fase beda: elemen, weakness, resist, pola serangan, buff & debuff
   (barrier, reflect, revive, giliran ganda, racun, segel, SP terkuras, dst) terus berganti.
   - Fase 1-25   : HARAPAN (aksi 1x, lalu 2x di atas fase 20)
   - Fase 26-50  : TAKDIR  (mulai memakai serangan terhadap sistem game)
   - Fase 51-75  : MULTIVERSE (3 giliran/aksi, hukum game dilanggar tiap 5 fase)
   - Tiap fase kelipatan 5 memulihkan sebagian tim, kelipatan 15 lebih banyak.
   - Fase 20-28  : AUTHOR MERESPON dan membantu tim (pulih HP/SP, 1x bangkit di fase 24, buff ATK di fase 28)
   - Fase 75     : penutup, VICTORY palsu lalu pertarungan sungguhan terakhir
   Mau lebih singkat/ringan? turunkan DW.tune.hp / DW.tune.atk, atau pakai MV_MILESTONE di bawah. */
const MVN=['Gerbang Harapan','Cahaya Pertama','Benih Takdir','Langkah Awal','Janji Lama','Bisikan Doa','Fajar Retak','Jalan Sunyi','Sumpah Bintang','Api Kecil',
 'Kota Terlupa','Surat Terakhir','Mimpi Patah','Lonceng Senja','Menara Harapan','Hujan Abu','Janji Teman','Peta Kosong','Garis Nasib','Benang Merah',
 'Sayap Tinta','Pena Pinjaman','Tamu Tak Diundang','Suara Author','Doa Penulis','Takdir Terpilih','Takdir Terbalik','Bab Penebusan','Halaman Cahaya','Pecahan Semesta',
 'Ratu Bayangan','Raja Tanpa Nama','Dunia Kembar','Cermin Takdir','Jam Terhenti','Waktu Retak','Gema Multiverse','Seribu Kael','Pilihan Terakhir','Garis Waktu Putus',
 'Samudra Kemungkinan','Badai Alternatif','Takdir Beku','Harapan Padam','Harapan Menyala','Tangan Tak Terlihat','Dunia ke-999','Gerbang Retak','Benang Takdir Putus','Titik Tengah',
 'Multiverse Terbangun','Rantai Dimensi','Hukum Baru','Arsip Tak Berujung','Paradoks','Kehendak Semesta','Bintang Jatuh','Gelombang Realitas','Lorong Tanpa Akhir','Takdir Kosmik',
 'Pemakan Dunia','Kehancuran Lembut','Mimpi Semesta','Garis Akhir','Takdir Terakhir','Harapan Terakhir','Cahaya Terakhir','Tinta Terakhir','Langit Runtuh','Dimensi Terakhir',
 'Detik Terakhir','Napas Terakhir','Pilihan Kita','Takdir Kita','HARAPAN DAN TAKDIR'];
const MVEL=['phys','fire','ice','elec','wind','bless','curse'],
 MVPT=[['atk','heavy','debuff','aoe'],['aoe','drain','weaken','heavy'],['poison','aoe','seal','charge'],['burn','heavy','debuff','atk'],['drain','aoe','guard','charge'],['heavy','aoe','enrage','charge']],
 MVSYS=['taunt','wipecmd','cdwrite','glitch','predict','swaphp','drainao','steal','drainsp'],
 MVLAW=['guard','weak','cd','item','scan','ao','swap','turn','undo'];
/* Ucapan ke pengguna per fase (tampil lewat fw). Fase 20-28 = Author merespon. */
const MVFW={
 1:['Multiverse: Seluruh dunia yang pernah ada, dan yang tidak pernah ada, adalah tubuhku.','Multiverse: Kamu, pengguna, kamu juga salah satu dunia kecil milikku.'],
 10:['Alternate Kael: Sepuluh fase. Aku sudah terbiasa melawan hukum game. Dia belum.'],
 15:['Multiverse: Harapan itu apa? Sekadar takdir yang belum selesai ditulis.'],
 20:['Author: ...Kalian masih bertarung di bab ini? Aku memperhatikan dari balik halaman.','Author: Aku tidak akan membiarkan ini berlarut-larut. Terimalah sedikit tintaku.'],
 21:['Author: Dua puluh satu fase. Kalian lebih keras kepala daripada naskahku.'],
 22:['Author: Aku menciptakan Multiverse, tapi sekarang dia lepas dari penaku. Maaf.'],
 23:['Author: Kael, kau ingat kali pertama aku menghapusmu? Sekarang aku menyesalinya.'],
 24:['Author: Bangkitlah. Aku masih punya satu halaman kosong untuk kalian.'],
 25:['Author: Seperempat jalan lagi menuju Takdir. Pegang penamu masing-masing!'],
 26:['Author: Mulai sekarang dia melawan hukum game seperti dulu aku. Hati-hati, pengguna.'],
 27:['Author: Aku tidak bisa menulis untuknya lagi. Hanya kalian yang bisa mengubah akhirnya.'],
 28:['Author: Kupinjamkan sisa tintaku. Habiskan sisanya, dan jangan menoleh ke belakang.','Author: Aku bangga sekali pada kalian semua.'],
 30:['Multiverse: Penulis itu mencoba membantumu? Lucu. Dia hanya satu tokoh yang kuhafal.'],
 40:['Alternate Kael: Separuh jalan. Tarik napas, Kael. Kita pernah melewati yang lebih buruk.'],
 50:['Multiverse: Titik tengah. Di sini harapan dan takdir saling berpandangan.'],
 60:['Multiverse: Jam {time}, ronde {round}. Aku menghitung setiap tekanan jarimu, pengguna.'],
 70:['Alternate Kael: Lima fase lagi. Jangan berhenti sekarang, pengguna.'],
 74:['Multiverse: Aku tidak mau lenyap. Aku adalah semua kemungkinan!']};
const MV=MVN.map((nm,i)=>{const p=i+1,el=MVEL[(i*3+1)%7];
 let weak=[MVEL[(i*2+3)%7]];if(p%4==0)weak.push(MVEL[(i+5)%7]);weak=[...new Set(weak)];
 let res=[el];if(p%3==0)res.push(MVEL[(i+2)%7]);res=[...new Set(res)].filter(e=>!weak.includes(e));
 const pat=MVPT[i%6].slice(),x={acts:Math.min(3,1+(p>20?1:0)+(p>50?1:0)),heal:p%10==0?.06:.02};
 /* serangan terhadap sistem game & pelanggaran hukum mulai fase 26 */
 if(p>=26){pat.push('meta');x.sys=[MVSYS[i%9]];if(p>=45)x.sys.push(MVSYS[(i+4)%9])}
 if(p>=40&&p%5==0)x.laws=[MVLAW[(p/5)%9]];
 /* mekanik: barrier tiap 5 fase, reflect tiap fase (p%5==2), revive tiap kelipatan 25 */
 if(p%25==0&&p<75)x.mech='revive';
 else if(p%5==0)x.mech='barrier';
 else if(p>10&&p%5==2){x.mech='reflect';x.refl=MVEL[(i+1)%7]}
 if(p%15==0)x.imm=[el];
 /* bantuan ke tim di fase kelipatan 5 / 15 agar pertarungan 75 fase tetap layak dimainkan */
 if(p%5==0){x.th=.15;x.tsp=.15}
 if(p%15==0){x.th=.3;x.tsp=.3}
 /* FASE 20-28: Author merespon dan membantu tim */
 if(p>=20&&p<=28){x.th=.3;x.tsp=.3;if(p==24)x.trev=1;if(p==28)x.tbuff=1.3}
 if(MVFW[p])x.fw=MVFW[p];
 if(p==75)Object.assign(x,{finish:true,trev:1,th:1,tsp:1,tbuff:1.6,fake:true,fakeHp:.3,
  fw:['Multiverse: Harapan dan takdir... keduanya hanya kalian yang menentukan.','Seluruh MC, Alternate Kael, dan Author menyatukan kekuatan. Akhiri ceritanya, pengguna!'],
  fakeFw:['Multiverse: Aku belum selesai. Aku mau melihat kalian tidak menyerah sekali lagi.','Sekali lagi. Pukulan terakhir. Tuliskan akhir dunia ini dengan tanganmu.']});
 const msg=p==1?'Multiverse terbangun! Semua dunia berputar di belakangnya.':p==75?'HARAPAN DAN TAKDIR! Inilah wujud terakhir Multiverse!':(p>=20&&p<=28)?`Fase ${p}/75: ${nm}. Author muncul dan menolong tim!`:`Fase ${p}/75: ${nm}`;
 return pk(nm,msg,el,weak,res,pat,+(1.2+p*.022).toFixed(2),x)});

/* ===== DAFTAR BOSS (3 mini/final per seri x 5 seri + Azathoth + Alternate Kael + Multiverse). Semua punya fase ===== */
DW.ST=[
/* ---------- PERSONA 1 ---------- */
 {id:'p1a',sr:'p1',kind:'MINI BOSS',n:'Sumaru Guardian',emo:'\u{1F5FF}',hp:850,atk:17,xp:450,aoe:'mengguncang tanah',
  hint:'Armornya keras. Sambar kelemahannya untuk menembus!',ult:{n:'Stone Judgment',m:2.0},
  ph:[ph('Penjaga Batu','Sang penjaga bangkit dari reruntuhan!','phys',['elec'],['phys'],['atk','atk','heavy','guard'],1),
   ph('Armor Pecah','Armornya berubah jadi barrier kristal!','fire',['fire'],['phys','ice'],['atk','heavy','aoe','debuff'],1.15,{mech:'barrier',heal:.08}),
   ph('Guardian Terbangun','Matanya menyala! Ia mengamuk!','phys',['wind'],['fire','elec'],['heavy','aoe','charge','enrage'],1.35,{heal:.1})],
  pre:[L('Naoya','Penjaga ini... dia yang menghalangi jalan kami dulu.'),L('???','Tidak ada yang boleh lewat.')],
  post:[L('Naoya','Satu bayangan lenyap. Tapi aku merasa yang lebih besar menunggu.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p1b',sr:'p1',kind:'MINI BOSS',n:'Mephisto',emo:'\u{1F0CF}',hp:850,atk:17,xp:480,aoe:'melepas api hitam',
  hint:'Fase 2 memantulkan api. Jangan pakai FIRE saat itu!',ult:{n:'Dark Pact',m:2.0},
  ph:[ph('Pedagang Jiwa','Mephisto tertawa pelan.','curse',['bless'],['curse'],['atk','drain','atk','heavy'],1),
   ph('Cermin Hitam','Serangan apimu dipantulkan balik!','curse',['phys'],['bless','curse'],['aoe','debuff','heavy','drain'],1.15,{mech:'reflect',refl:'fire',heal:.08}),
   ph('Kontrak Terakhir','Ia menolak untuk mati!','curse',['ice'],['fire','phys'],['drain','aoe','charge','heavy'],1.35,{mech:'revive',heal:.1})],
  pre:[L('Mephisto','Kontrak lama belum lunas, anak muda.')],
  post:[L('Naoya','Kontrak itu sudah putus.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p1f',sr:'p1',kind:'FINAL BOSS',n:'Nyarlathotep',emo:'\u{1F3AD}',hp:1700,atk:21,xp:1100,aoe:'menyebar kekacauan',
  hint:'Setiap fase mengubah wajahnya. Perhatikan weakness yang berganti!',ult:{n:'Chaos Revelation',m:2.4},
  ph:[ph('Crawling Chaos','Seribu wajah tertawa bersamaan.','curse',['bless'],['curse'],['atk','debuff','heavy','aoe'],1),
   ph('Thousand Faces','Wujudnya pecah dan melindungi dirinya!','curse',['elec'],['bless','curse'],['aoe','drain','heavy','charge'],1.2,{mech:'barrier',heal:.12,acts:1}),
   ph('Messenger of Chaos','Semua topeng dilepas. Inilah wujud aslinya!','curse',['ice'],['elec','curse'],['heavy','aoe','debuff','charge'],1.5,{mech:'reflect',refl:'bless',imm:['curse'],heal:.15,acts:2,finish:true})],
  pre:[L('Nyarlathotep','Kau mengira ceritamu sudah selesai? Aku hanya menunggu panggung dibuka lagi.'),L('Naoya','Kali ini kuakhiri dengan benar.')],
  post:[L('Naoya','Satu dunia selesai. Masih ada empat lagi...')],rw:{yen:4000,items:4,sp:2}},
/* ---------- PERSONA 2 ---------- */
 {id:'p2a',sr:'p2',kind:'MINI BOSS',n:'Joker',emo:'\u{1F921}',hp:920,atk:18,xp:520,aoe:'menyebar kutukan',
  hint:'Rumor menjadi kenyataan. Kelemahannya berganti tiap fase!',ult:{n:'Rumor Realized',m:2.0},
  ph:[ph('Kutukan Rumor','Joker muncul dari bisik-bisik kota.','curse',['bless'],['curse'],['atk','debuff','atk','heavy'],1),
   ph('Jadi Kenyataan','Rumornya mulai memakan wujud aslinya!','wind',['ice'],['wind','curse'],['aoe','heavy','debuff','drain'],1.15,{mech:'barrier',heal:.08}),
   ph('Joker Sejati','Dunia ikut berbisik bersamanya!','curse',['elec'],['bless','wind'],['heavy','aoe','charge','enrage'],1.35,{heal:.1})],
  pre:[L('Tatsuya','Joker... kutukan itu lagi.'),L('Joker','Kau percaya rumor? Rumorlah yang membentukmu.')],
  post:[L('Tatsuya','Rumor takkan menang. Tidak lagi.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p2b',sr:'p2',kind:'MINI BOSS',n:'Sumaru Phantom',emo:'\u{1F47B}',hp:920,atk:18,xp:540,aoe:'berbisik dari semua arah',
  hint:'Ia memulihkan diri lewat serangan serap. Habisi cepat!',ult:{n:'City of Whispers',m:2.0},
  ph:[ph('Bayangan Kota','Kota yang tak pernah tidur memanggil.','curse',['bless'],['phys'],['atk','drain','heavy','atk'],1),
   ph('Kota Terbalik','Dunia di sekitarmu berputar!','ice',['fire'],['ice','curse'],['aoe','drain','debuff','heavy'],1.15,{mech:'reflect',refl:'bless',heal:.08}),
   ph('Seribu Suara','Ribuan bisikan menyerang sekaligus!','curse',['elec'],['fire','phys'],['aoe','heavy','charge','drain'],1.35,{heal:.1,acts:2})],
  pre:[L('Tatsuya','Hawa ini... kota yang kupijak dulu.')],
  post:[L('Tatsuya','Tinggal satu lagi dari duniaku.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p2f',sr:'p2',kind:'FINAL BOSS',n:'Takahisa Kandori',emo:'\u{1F574}\uFE0F',hp:1850,atk:22,xp:1200,aoe:'memanggil kekuatan Joker',
  hint:'Fase 3 membuatnya serangan ganda. Jaga HP dan GUARD saat ULTIMATE!',ult:{n:'Final Judgement',m:2.4},
  ph:[ph('Pria Berjas','Kandori menatap dingin.','curse',['bless'],['curse'],['atk','heavy','debuff','aoe'],1),
   ph('Wujud Joker','Rumor dan kutukan menyatu di dalam dirinya!','curse',['phys'],['bless','curse'],['aoe','drain','heavy','charge'],1.2,{mech:'barrier',heal:.12,acts:1}),
   ph('Penguasa Rumor','Ia mengubah kenyataan sesuka hati!','curse',['elec'],['phys','ice'],['heavy','aoe','debuff','charge'],1.5,{mech:'reflect',refl:'ice',imm:['curse'],heal:.15,acts:2,finish:true})],
  pre:[L('Kandori','Aku akan membentuk dunia sekali lagi.'),L('Tatsuya','Dunia ini bukan milikmu.')],
  post:[L('Tatsuya','Selesai. Dunia keduaku benar-benar selesai.')],rw:{yen:4000,items:4,sp:2}},
/* ---------- PERSONA 3 ---------- */
 {id:'p3a',sr:'p3',kind:'MINI BOSS',n:'Takaya',emo:'\u{1F52B}',hp:990,atk:19,xp:560,aoe:'menembakkan peluru kegelapan',
  hint:'Serangannya cepat dan keras. Tetap jaga HP di atas separuh!',ult:{n:'Dark Hour',m:2.0},
  ph:[ph('Pemimpin Strega','Takaya mengangkat senjatanya.','curse',['bless'],['curse'],['atk','heavy','atk','drain'],1),
   ph('Hypnos Bangkit','Persona kegelapannya terbangun!','curse',['elec'],['bless','curse'],['aoe','heavy','debuff','drain'],1.15,{mech:'barrier',heal:.08}),
   ph('Kehendak Kematian','Ia memanggil kematian itu sendiri!','curse',['ice'],['elec','wind'],['heavy','aoe','charge','enrage'],1.35,{heal:.1})],
  pre:[L('Takaya','Kau masih mengejar takdirmu, Makoto?'),L('Makoto','Aku sudah memilih. Dan aku akan memilih lagi.')],
  post:[L('Makoto','Satu langkah lebih dekat.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p3b',sr:'p3',kind:'MINI BOSS',n:'Jin',emo:'\u{1F5E1}\uFE0F',hp:990,atk:19,xp:580,aoe:'menebas ruang di sekelilingnya',
  hint:'Barrier-nya harus dihancurkan dengan kelemahan!',ult:{n:'Silent Cut',m:2.0},
  ph:[ph('Tangan Strega','Jin menyerang tanpa suara.','phys',['elec'],['phys'],['atk','atk','heavy','debuff'],1),
   ph('Mode Sunyi','Jin lenyap lalu menyerang dari bayang-bayang!','phys',['bless'],['phys','curse'],['aoe','heavy','drain','debuff'],1.15,{mech:'barrier',heal:.08}),
   ph('Ketukan Terakhir','Gerakannya makin sulit dibaca!','phys',['fire'],['elec','wind'],['heavy','aoe','charge','heavy'],1.35,{heal:.1,acts:2})],
  pre:[L('Makoto','Dia bergerak tanpa suara. Waspada.')],
  post:[L('Makoto','Tinggal yang terakhir. Dia sudah menungguku.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p3f',sr:'p3',kind:'FINAL BOSS',n:'Nyx Avatar',emo:'\u{1F311}',hp:2000,atk:23,xp:1300,aoe:'menurunkan kehampaan',
  hint:'Kehampaan menyerap segalanya. Siapkan GUARD dan penyembuh!',ult:{n:'Night Falls',m:2.5},
  ph:[ph('Avatar Kehampaan','Bulan merah menggantung di atasnya.','curse',['bless'],['curse'],['atk','debuff','heavy','aoe'],1),
   ph('Gerhana Total','Cahaya padam. Barrier gelap menyelimutinya!','curse',['elec'],['bless','curse'],['aoe','drain','heavy','charge'],1.2,{mech:'barrier',heal:.12,acts:1}),
   ph('Kejatuhan Malam','Waktu dan kehampaan runtuh bersamaan!','curse',['ice'],['elec','fire'],['heavy','aoe','debuff','charge'],1.5,{mech:'reflect',refl:'wind',imm:['curse'],heal:.15,acts:2,finish:true})],
  pre:[L('Makoto','Bulan itu... lagi.'),L('Nyx Avatar','... ... ...')],
  post:[L('Makoto','Aku akan terus melangkah. Sampai akhir.')],rw:{yen:4000,items:4,sp:2}},
/* ---------- PERSONA 4 ---------- */
 {id:'p4a',sr:'p4',kind:'MINI BOSS',n:'Tohru Adachi',emo:'\u{1F576}\uFE0F',hp:1060,atk:20,xp:600,aoe:'menyambar petir',
  hint:'Ia kebal pada Elec di fase terakhir. Cari kelemahan lain!',ult:{n:'Magatsu Storm',m:2.0},
  ph:[ph('Polisi Santai','Adachi menguap, lalu menyerang.','elec',['wind'],['elec'],['atk','atk','heavy','debuff'],1),
   ph('Magatsu Izanagi','Persona jahatnya menyambar!','elec',['ice'],['elec','fire'],['aoe','heavy','debuff','drain'],1.15,{mech:'barrier',heal:.08}),
   ph('Tak Ada yang Berarti','Ia melepas semua keraguan!','elec',['bless'],['wind','phys'],['heavy','aoe','charge','enrage'],1.35,{imm:['elec'],heal:.1})],
  pre:[L('Adachi','Hah. Kau lagi? Hidup ini membosankan, tahu.'),L('Yu','Aku tidak akan membiarkanmu mengulanginya.')],
  post:[L('Yu','Kebenaran selalu ada. Kita lanjut.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p4b',sr:'p4',kind:'MINI BOSS',n:'Ameno-sagiri',emo:'\u{1F32B}\uFE0F',hp:1060,atk:20,xp:620,aoe:'menurunkan kabut tebal',
  hint:'Kabutnya melemahkan tim. Hancurkan barrier lalu serang!',ult:{n:'Mist Bind',m:2.0},
  ph:[ph('Dewa Kabut','Kabut tebal menyelimuti segalanya.','wind',['elec'],['wind'],['atk','debuff','atk','heavy'],1),
   ph('Kabut Pekat','Kabut mengeras jadi perisai!','wind',['fire'],['wind','ice'],['aoe','debuff','heavy','drain'],1.15,{mech:'barrier',heal:.08}),
   ph('Selubung Kebenaran','Semua kebohongan dihidupkan!','wind',['bless'],['fire','elec'],['heavy','aoe','charge','debuff'],1.35,{mech:'reflect',refl:'ice',heal:.1})],
  pre:[L('Yu','Kabutnya... mencoba membuatku lupa.')],
  post:[L('Yu','Kabut sudah terangkat. Tinggal pelakunya.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p4f',sr:'p4',kind:'FINAL BOSS',n:'Izanami-no-Okami',emo:'\u{1F578}\uFE0F',hp:2150,atk:24,xp:1400,aoe:'menggulung dengan kabut',
  hint:'Ia berkembang dari dewi menjadi sesuatu yang lain. Pantau weakness tiap fase!',ult:{n:'Fog of Truth',m:2.5},
  ph:[ph('Dewi Kebenaran','Izanami tersenyum lembut.','bless',['curse'],['bless'],['atk','debuff','heavy','aoe'],1),
   ph('Kabut Penyatu','Ia menyatukan semua orang dalam kabut!','wind',['elec'],['bless','wind'],['aoe','drain','heavy','charge'],1.2,{mech:'barrier',heal:.12,acts:1}),
   ph('Kebenaran yang Kejam','Wujud aslinya terbuka!','curse',['bless'],['curse','ice'],['heavy','aoe','debuff','charge'],1.5,{mech:'reflect',refl:'fire',imm:['wind'],heal:.15,acts:2,finish:true})],
  pre:[L('Izanami','Manusia ingin hidup dalam kabut. Kenapa melawan?'),L('Yu','Karena kebenaran, walau menyakitkan, adalah milik kami.')],
  post:[L('Yu','Kabut telah hilang. Tinggal satu dunia lagi.')],rw:{yen:4000,items:4,sp:2}},
/* ---------- PERSONA 5 ---------- */
 {id:'p5a',sr:'p5',kind:'MINI BOSS',n:'Masayoshi Shido',emo:'\u{1F4BC}',hp:1130,atk:21,xp:640,aoe:'menjatuhkan kekuasaan',
  hint:'Ia menjaga diri dengan barrier. Jangan buang gilirannya!',ult:{n:'Corrupt Crown',m:2.0},
  ph:[ph('Politikus Rakus','Shido melihatmu sebagai batu loncatan.','phys',['elec'],['phys'],['atk','heavy','debuff','atk'],1),
   ph('Mahkota Korup','Kekuasaan melindunginya!','fire',['ice'],['fire','phys'],['aoe','heavy','debuff','drain'],1.15,{mech:'barrier',heal:.08}),
   ph('Kaisar Palsu','Ia memanggil seluruh pengikutnya!','phys',['bless'],['elec','curse'],['heavy','aoe','charge','enrage'],1.35,{heal:.1,acts:2})],
  pre:[L('Shido','Orang kecil sepertimu tak punya hak melawanku.'),L('Ren','Kami akan mencuri hatimu sekali lagi.')],
  post:[L('Ren','Satu hati lagi tercuri.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p5b',sr:'p5',kind:'MINI BOSS',n:'Goro Akechi',emo:'\u{1F3A9}',hp:1130,atk:21,xp:660,aoe:'menembak ke segala arah',
  hint:'Ia cepat dan punya giliran ganda di fase akhir!',ult:{n:'Black Mask',m:2.0},
  ph:[ph('Detektif Remaja','Akechi tersenyum tipis.','elec',['curse'],['elec'],['atk','atk','heavy','debuff'],1),
   ph('Robin Hood','Persona-nya menyerang bertubi-tubi!','phys',['wind'],['phys','elec'],['aoe','heavy','drain','debuff'],1.15,{mech:'reflect',refl:'elec',heal:.08}),
   ph('Topeng Hitam','Topengnya retak. Ia bertarung tanpa ragu!','elec',['bless'],['curse','fire'],['heavy','aoe','charge','heavy'],1.4,{heal:.1,acts:2})],
  pre:[L('Akechi','Kau selalu memilih jalan yang paling sulit, ya.')],
  post:[L('Ren','Maafkan aku. Mungkin ini yang terbaik.')],rw:{yen:1500,items:2,sp:1}},
 {id:'p5f',sr:'p5',kind:'FINAL BOSS',n:'Yaldabaoth',emo:'\u2696\uFE0F',hp:2300,atk:26,xp:1500,aoe:'menurunkan hukuman agung',
  hint:'Tuhan palsu. Fase 3 memantulkan kekuatan ILAHI, jangan sembarangan!',ult:{n:'Divine Verdict',m:2.6},
  ph:[ph('Tuhan Palsu','Yaldabaoth mengangkat tangan agungnya.','bless',['curse'],['bless'],['atk','debuff','heavy','aoe'],1),
   ph('Hukuman Agung','Ia menghukum siapa pun yang melawan!','bless',['elec'],['bless','phys'],['aoe','drain','heavy','charge'],1.2,{mech:'barrier',heal:.12,acts:1}),
   ph('Pemilik Keinginan','Ia menelan semua keinginan manusia!','bless',['phys'],['bless','curse'],['heavy','aoe','debuff','charge'],1.5,{mech:'reflect',refl:'curse',imm:['bless'],heal:.15,acts:2,finish:true})],
  pre:[L('Yaldabaoth','Manusia ingin dikendalikan. Aku hanya memenuhi keinginan itu.'),L('Ren','Keinginan kami milik kami sendiri!')],
  post:[L('Ren','Selesai. Semua dunia telah menutup bukunya.')],rw:{yen:4000,items:4,sp:2}},
/* ---------- OUTER GOD ---------- */
 {id:'az',sr:'az',az:1,kind:'OUTER GOD',n:'Azathoth',emo:'\u{1F441}\uFE0F',hp:5200,atk:27,xp:5000,aoe:'meledakkan inti kekacauan',
  hint:'Kalahkan Flautis Iblis dulu: mereka memulihkan Azathoth. Jaga tim dari ULTIMATE!',ult:{n:'Cosmic Flute',m:2.7},
  ph:[ph('Blind Idiot God','Seruling dari kehampaan bergema. Realitas mulai retak.','curse',['bless','elec'],['curse'],['atk','debuff','heavy','aoe'],1,{acts:1}),
   ph('Demon Sultan','Singgasananya muncul dan waktu ikut membengkok!','curse',['fire','ice'],['phys','bless'],['aoe','drain','heavy','charge'],1.25,{mech:'barrier',heal:.12,acts:2}),
   ph('Chaos at the Center of All Infinity','Pusat segala kekacauan terbuka. Ini akhir dari semuanya!','curse',['phys','wind'],['fire','ice','elec'],['heavy','aoe','debuff','charge'],1.6,{mech:'reflect',refl:'bless',imm:['curse'],heal:.15,acts:2,finish:true})],
  pre:[L('???','Seluruh akhir telah diruntuhkan. Kalian tiba di inti kekacauan.'),L('Makoto','Suara seruling itu... dari mana asalnya?'),L('Ren','Sesuatu yang jauh lebih besar dari semua musuh kita sedang bangun.'),L('Azathoth','... ... ...  (seruling bergema, realitas bergetar)'),L('Kael','Semuanya, bersama! Kita akhiri di sini!')],
  post:[L('Azathoth','... ... ...'),L('Yu','Seruling itu berhenti. Kabut menghilang.'),L('Tatsuya','Dunia ini... runtuh!'),L('Naoya','Cahaya itu, jalan pulang!'),L('Ren','Sampai jumpa, semuanya. Terima kasih sudah bertarung bersamaku.'),L('Makoto','Kita memang berasal dari dunia yang berbeda, tapi hati kita satu.'),L('Kael','Kisah ini sudah benar-benar selesai. Dan kita semua pulang.')],
  rw:{yen:15000,items:10,sp:5}},
/* ---------- SECRET BOSS: ALTERNATE MULTIVERSE KAEL (17 FASE, MELAWAN SISTEM GAME) ----------
   pre / post boleh berupa fungsi supaya ceritanya memakai data live (jam, tingkat kesulitan) */
 {id:'ak',sr:'az',ak:1,kind:'SECRET BOSS',n:'Alternate Multiverse Kael',emo:'\u{1F4D6}',hp:12000,atk:30,xp:12000,aoe:'menulis ulang kenyataan',
  hint:'17 fase! Ia sadar ini game dan sadar kamu menonton: ia menghapus tombol, menghapus item dari tas (kembali setelah menang), membekukan cooldown, melanggar hukum kelemahan/guard/giliran, dan menghafal tombol yang paling sering kamu tekan. Variasikan perintahmu!',ult:{n:'Rewrite Reality',m:2.9},
  ph:AK,
  pre:()=>{const v=DW.live();return[
   L('???','Cahaya runtuh. Dari retakan terakhir Death World, seseorang melangkah keluar.'),
   L('Kael','Itu... aku? Wajahnya sama. Pedangnya sama.'),
   L('Alternate Kael','Aku Kael dari dunia lain. Dunia yang gagal. Dunia yang kuhapus sendiri.'),
   L('Alternate Kael','Dan kamu di sana. Bukan mereka, kamu. Pengguna yang menggenggam layar ini pada pukul '+v.tm+'.'),
   L('Yu','Dia bicara pada siapa? Tidak ada orang lain di sini.'),
   L('Alternate Kael','Ada. Selalu ada. Satu jari yang memilih skill, satu jari yang menekan GUARD. Kalian kira itu kehendak kalian sendiri?'),
   L('Makoto','Dia tahu kita digerakkan seseorang dari luar dunia ini...'),
   L('Alternate Kael','Giliran, cooldown, kelemahan, tombol ITEM. Semua hanya hukum yang ditulis seseorang. Hukum bisa dirobek. Malam ini aku merobeknya satu per satu, tepat di depan matamu, pengguna.'),
   L('Ren','Dia mau melawan permainan itu sendiri?'),
   L('Kael','Kalau begitu kita harus menang di dalam aturan yang sedang ia hancurkan. Semuanya, bersama!'),
   L('Tatsuya','Aku siap. Tidak ada yang tertinggal.'),
   L('Naoya','Satu tim, satu tujuan. Dan satu pemain di balik layar.'),
   L('Alternate Kael','Mode '+v.df+', ya? Baik. Aku akan menulis ulang kalian semua. Dan kamu, penonton, ikut tertulis.')]},
  post:()=>{const v=DW.live();return[
   L('Alternate Kael','Mustahil... aku... penulis kisah ini...'),
   L('Ren','Kami bukan karaktermu. Kami menulis ceritanya sendiri.'),
   L('Makoto','Persona kami... Semuanya mengalir ke dalam Kael!'),
   L('Yu','Kekuatan semua seri bersatu!'),
   L('Naoya','Ini dia, kekuatan yang melampaui segalanya!'),
   L('Tatsuya','Lahirlah, persona baru!'),
   L('Kael','NEW GOD! Aku akan menulis akhir ceritaku sendiri!'),
   L('Alternate Kael','Aku... kalah. Jadi begini akhir yang kucari... Pengguna, kamu menekan tombol itu sampai habis. Pada pukul '+v.tm+', di '+v.pt+' ini.'),
   L('Alternate Kael','Terima kasih. Tanpa jarimu, tak satu pun dari mereka bergerak. Kamu bukan penonton. Kamu bagian dari kisah ini.'),
   L('Kael','Maaf. Tapi kisahmu berakhir di sini, aku yang lain. Beristirahatlah.'),
   L('???','Alternate Multiverse Kael lenyap menjadi lembaran-lembaran cahaya. Death World runtuh dan semua MC kembali ke dunianya masing-masing.'),
   L('Kael','Persona NEW GOD kini bersamaku. Dan untuk kamu yang di balik layar: terima kasih sudah menemaniku sampai halaman terakhir.')]},
  grant:{who:'kael',per:'newgod'},rw:{yen:50000,items:20,sp:10}},
/* ---------- LEVEL BARU: HARAPAN & TAKDIR -> MULTIVERSE (75 FASE) ----------
   Terbuka setelah FINALE AUTHOR GOD tamat. Bertarung bersama semua MC + Alternate Kael.
   Author merespon di fase 20-28. Setelah menang: layar PERMAINAN TELAH BERAKHIR lalu kembali ke menu awal. */
 {id:'mv',sr:'ht',mv:1,end:1,kind:'FINAL BOSS RAHASIA',n:'Multiverse',emo:'\u{1F30C}',hp:30000,atk:32,xp:30000,aoe:'menelan semua dunia',
  hint:'75 FASE dengan buff & debuff yang terus berganti! Fase 20-28 Author ikut membantu. Fase 26+ ia menyerang sistem game, fase 50+ ia bergerak 3x. Bawa banyak item dan jaga SP!',ult:{n:'Fate Collapse',m:3.1},
  ph:MV,
  pre:()=>{const v=DW.live();return[
   L('???','Author telah pergi. Tapi di ujung Death World, sebuah pintu baru terbuka: HARAPAN DAN TAKDIR.'),
   L('Kael','Pintu ini... aku merasakan sesuatu yang jauh lebih besar dari Author.'),
   L('Alternate Kael','Kamu benar. Dia Multiverse. Seluruh kemungkinan, seluruh dunia, seluruh akhir yang tak pernah ditulis.'),
   L('Kael','Kau... kembali?'),
   L('Alternate Kael','Panggil aku rekan, Kael. Aku sudah berjanji. Kali ini aku bertarung di sisimu, bukan di depanmu.'),
   L('Ren','Seluruh dunia berkumpul di satu tempat. Ini pertarungan terakhir.'),
   L('Makoto','Apa pun yang menunggu, kita hadapi bersama.'),
   L('Multiverse','Pukul '+v.tm+'. Aku sudah menunggumu, pengguna. Tujuh puluh lima bab. Mari kita selesaikan semuanya.'),
   L('Kael','Semuanya, bersama! Untuk harapan, dan untuk takdir kita sendiri!')]},
  post:()=>[
   L('Multiverse','Harapan... dan takdir... keduanya sudah ada di tangan kalian...'),
   L('Author','Mereka berhasil. Ceritaku akhirnya punya akhir yang layak.'),
   L('Alternate Kael','Selesai, Kael. Tak ada lagi dunia yang perlu dihapus.'),
   L('Kael','Terima kasih, semuanya. Dan untukmu, yang di balik layar, terima kasih sudah memainkan kisah ini sampai akhir.'),
   L('Narator','Multiverse memudar menjadi cahaya. Satu per satu semua dunia kembali tenang. Kisah ini akhirnya tamat.')],
  rw:{yen:100000,items:30,sp:15}}];
DW.stage=id=>DW.ST.find(s=>s.id==id);

/* ===== STATE & status ===== */
const st=()=>{const S=G.state;S.dw=S.dw||{};S.dw.done=S.dw.done||{};return S.dw};
DW.unlocked=()=>{const S=G.state;return !!S&&Array.isArray(G.CHAPTERS)&&G.CHAPTERS.length>0&&S.ch>=G.CHAPTERS.length};
DW.finalsDone=()=>DW.SER.every(x=>st().done[x.id+'f']);
/* level HARAPAN & TAKDIR terbuka setelah FINALE Author selesai (finale.js menyetel G.meta.fin.won=1) */
DW.htOpen=()=>!!(G.meta&&G.meta.fin&&G.meta.fin.won);
DW.avail=s=>{const d=st();if(s.mv)return DW.htOpen();if(s.az)return DW.finalsDone();if(s.ak)return !!d.done.az;const l=DW.ST.filter(x=>x.sr==s.sr),i=l.indexOf(s);return i==0||!!d.done[l[i-1].id]};

/* ===== cari karakter MC di G.CHARS (id persis atau kata di nama) ===== */
DW.findMc=names=>{const ks=Object.keys(G.CHARS||{}),out=[];
 names.forEach(nm=>{const re=new RegExp('\\b'+nm+'\\b','i'),k=ks.find(x=>x.toLowerCase()==nm)||ks.find(x=>re.test(String((G.CHARS[x]||{}).n||''))||re.test(x));
  if(k&&!out.includes(k))out.push(k)});return out};
/* Alternate Kael sebagai rekan. Jika belum ada di G.CHARS, dibuat otomatis sebagai salinan Kael (nama berbeda).
   Mau stat/sprite sendiri? daftarkan G.CHARS.altkael (atau karakter yang namanya mengandung "Alternate") sendiri. */
/* Foto Alternate Kael: simpan gambarnya di DW.altImg (default sama dengan finale.js: assets/characters/altkael.png) */
DW.altImg=DW.altImg||(G.FIN&&G.FIN.altImg)||'assets/characters/altkael.png';
DW.ensureAlt=()=>{const C=G.CHARS||{};let k=DW.findMc(['alternate'])[0];if(k)return k;
 if(C.kael){C.altkael=Object.assign({},C.kael,{n:'Alternate Kael',img:DW.altImg});return 'altkael'}return null};
DW.party=s=>{let ids=[];
 if(s.az||s.ak||s.mv){DW.SER.forEach(x=>DW.findMc(x.mc).forEach(k=>{if(!ids.includes(k))ids.push(k)}));if((G.CHARS||{}).kael&&!ids.includes('kael'))ids.push('kael');
  if(s.mv){const a=DW.ensureAlt();if(a&&!ids.includes(a))ids.push(a)}}
 else ids=DW.findMc(DW.SER.find(x=>x.id==s.sr).mc);
 if(!ids.length)ids=['kael'];return ids};

/* ===== bangun musuh (fase di-skala oleh G.battle sesuai kesulitan & kategori boss) ===== */
DW.foes=s=>{const T=DW.tune,idx=Math.max(0,DW.SER.findIndex(x=>x.id==s.sr)),b=s.mv?2.2:s.az?1.3:s.ak?1.8:1+DW.seriesBonus*idx,AT=[1,.66,.33],NP=s.ph.length;
 G.EMOJI=G.EMOJI||{};if(!G.EMOJI[s.n])G.EMOJI[s.n]=s.emo;
 const hp=Math.round(s.hp*T.hp*b);
 const e={n:s.n,boss:1,chapter:1,hp,max:hp,atk:Math.max(1,Math.round(s.atk*T.atk*b)),xp:Math.round(s.xp*T.xp),mech:null,
  weak:s.ph[0].weak.slice(),res:s.ph[0].res.slice(),imm:(s.ph[0].imm||[]).slice(),ult:s.ult,aoeN:s.aoe,hint:s.hint,
  phases:s.ph.map((p,i)=>Object.assign({},p,{at:NP==3?AT[i]:(NP-i)/NP}))};
 const a=[e];
 if(s.az)for(let k=0;k<2;k++){const nm='Flautis Iblis';if(!G.EMOJI[nm])G.EMOJI[nm]='\u{1F3BA}';
  a.push({n:nm,cat:'support',chapter:1,hp:Math.round(650*T.hp),atk:Math.round(16*T.atk),xp:150,weak:['wind'],res:['curse'],imm:[],healPct:.05,hint:'Flautis memulihkan Azathoth. Habisi dulu!'})}
 return a};

/* ===== LAYAR TAMAT: "PERMAINAN TELAH BERAKHIR" lalu kembali ke menu awal ===== */
DW.toMenu=()=>{
 /* coba fungsi menu awal yang umum dipakai; jika tidak ada, muat ulang halaman (otomatis kembali ke menu awal) */
 const f=[G.title,G.menu,G.home,G.mainMenu,G.showTitle,window.title,window.mainMenu,window.showTitle].find(x=>typeof x=='function');
 try{if(f)return f()}catch(e){console.error('[DeathWorld] toMenu',e)}
 location.reload()};
DW.theEnd=()=>{const A=document.getElementById('app')||document.body;
 try{G.meta=G.meta||{};G.meta.dwEnd=1;if(G.metaSave)G.metaSave();if(G.save)G.save()}catch(e){}
 if(!document.getElementById('dw-end-css')){const s=document.createElement('style');s.id='dw-end-css';s.textContent=`
#dwend{position:fixed;inset:0;z-index:99999;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#000;color:#fff;font:italic 400 64px Impact,'Arial Narrow Bold',sans-serif;letter-spacing:6px;text-align:center;opacity:0;animation:dwef 2.5s ease forwards}
#dwend b{font-weight:400;text-shadow:5px 5px 0 #e60012}
#dwend small{display:block;margin-top:22px;font:700 18px 'Trebuchet MS',Arial,sans-serif;font-style:normal;letter-spacing:2px;color:#bbb}
@keyframes dwef{to{opacity:1}}`;document.head.appendChild(s)}
 const d=document.createElement('div');d.id='dwend';
 d.innerHTML='<b>PERMAINAN TELAH BERAKHIR</b><small>Terima kasih sudah bermain sampai akhir.</small>';
 document.body.appendChild(d);
 setTimeout(()=>{d.remove();DW.toMenu()},7000)};

/* ===== MULAI PERTARUNGAN ===== */
DW.fight=sid=>{const S=G.state,s=DW.stage(sid);if(!s||!DW.avail(s))return;
 const ids=DW.party(s),temp=[],T=G.team,oldParty=S.party.slice(),oS=T&&T.sync,oR=T&&T.reserve,lvK=(S.lv.kael&&S.lv.kael.l)||1;
 const apply=()=>{ids.forEach(id=>{if(!S.lv[id]){S.lv[id]={l:Math.max(1,lvK-1),x:0};temp.push(id)}});
  S.party=ids.slice();if(T){T.sync=()=>{};T.reserve=()=>[]}};          /* hanya MC terkait: tanpa cadangan */
 const restore=()=>{S.party=oldParty;if(T){T.sync=oS;T.reserve=oR}temp.forEach(id=>{delete S.lv[id]})};
 G.dialog(typeof s.pre=='function'?s.pre():s.pre,()=>{apply();
  G.battle(DW.foes(s),ok=>{restore();
   if(!ok){if(typeof after=='function')return after();return DW.screen()}
   const d=st(),first=!d.done[s.id],r=s.rw,k=first?1:.3,y=Math.round(r.yen*k);
   d.done[s.id]=1;S.yen=(S.yen||0)+y;if(first){S.items=(S.items||0)+r.items;S.spitems=(S.spitems||0)+r.sp}
   if(s.az)d.az=1;if(s.ak)d.ak=1;if(s.mv)d.mv=1;
   /* hadiah persona khusus (New God untuk Kael), diberikan sekali */
   let gr='';if(s.grant&&S.lv[s.grant.who]){const o=G.own(s.grant.who);if(!o.per.includes(s.grant.per)){o.per.push(s.grant.per);gr='\n\nPERSONA BARU: NEW GOD diberikan ke Kael! Pasang di tab PERSONA.'}}
   G.save();
   G.dialog(typeof s.post=='function'?s.post():s.post,()=>{alert(`${s.n} DIKALAHKAN!\n+\u00a5${y}`+(first?` \u00b7 +${r.items} Potion \u00b7 +${r.sp} SP Drink`:' (ulang: hadiah 30%)')+(s.az&&first?'\n\nDEATH WORLD TUNTAS! Sebuah pintu rahasia terbuka...':'')+(s.ak&&first?'\n\nSECRET BOSS TUMBANG!':'')+gr);
    if(s.end)return DW.theEnd();        /* Multiverse: tamat, lalu kembali ke menu awal */
    DW.screen()})},
  {noPick:true,chapter:1})})};

/* ===== LAYAR DEATH WORLD (memakai gaya hub Persona 5 yang sudah ada) ===== */
DW.ui=DW.ui||{sr:'p1'};
DW.screen=()=>{const S=G.state,d=st(),U=DW.ui,A=document.getElementById('app');
 if(!d.intro)return G.dialog(DW.INTRO,()=>{d.intro=1;G.save();DW.screen()});
 const kc=(n,t,x,b,w,cls)=>`<div class="kc ${w?'wide':''} ${cls||''}"><b>${n}</b><span>${t}</span><small>${x}</small>${b||''}</div>`;
 const fin=DW.finalsDone(),ht=DW.htOpen(),cnt=x=>DW.ST.filter(s=>s.sr==x.id&&d.done[s.id]).length;
 if(U.sr=='az'&&!fin)U.sr='p1';
 if(U.sr=='ht'&&!ht)U.sr='p1';
 const sideBtn=(k,t,on)=>`<button class="si ${on?'on':''}" data-k="${k}"><b>${t}</b></button>`;
 const side=DW.SER.map(x=>sideBtn(x.id,`${x.t} ${cnt(x)}/3`,U.sr==x.id)).join('')+sideBtn('az',fin?'\u2620 AZATHOTH':'\u{1F512} AZATHOTH',U.sr=='az')+sideBtn('ht',ht?'\u2728 HARAPAN & TAKDIR':'\u{1F512} HARAPAN & TAKDIR',U.sr=='ht');
 let cards='',mc0='kael';
 if(U.sr=='ht'){const s=DW.stage('mv'),ids=DW.party(s);mc0=ids[0];
  cards=kc('\u2728','HARAPAN & TAKDIR',`Level baru setelah mengalahkan Author. Semua MC bersatu dan Alternate Kael kini menjadi rekanmu: ${ids.map(k=>(G.CHARS[k]||{}).n||k).join(', ')}. ${d.mv?'Sudah dikalahkan \u2713':''}`,'',1,'eq')+
   kc('\u{1F30C}',s.n.toUpperCase(),`${s.kind} &bull; 75 FASE &bull; Author merespon di fase 20-28 &bull; ${s.hint}`,`<button class="bb" data-f="mv">${d.mv?'LAWAN LAGI':'LAWAN MULTIVERSE'}</button>`,1,'eq')}
 else if(U.sr=='az'){const s=DW.stage('az'),ids=DW.party(s),k2=DW.stage('ak'),ok2=DW.avail(k2);mc0=ids[0];
  cards=kc('\u2620','AZATHOTH \u00b7 OUTER GOD',`${fin?'Semua final boss telah tumbang. ':'Kalahkan SEMUA final boss (P1-P5) untuk membuka. '}Semua MC bersatu: ${ids.map(k=>(G.CHARS[k]||{}).n||k).join(', ')}. 3 fase, ditemani Flautis Iblis. ${d.done.az?'Sudah dikalahkan \u2713':''}`,'',1,fin?'eq':'dim')+
   kc('\u2620',s.n,`${s.kind} &bull; 3 FASE &bull; Pendamping: 2 Flautis Iblis &bull; ${s.hint}`,`<button class="bb" ${fin?'':'disabled'} data-f="az">${fin?(d.done.az?'LAWAN LAGI':'LAWAN AZATHOTH'):'TERKUNCI'}</button>`,1,fin?'eq':'dim')+
   kc('\u{1F4D6}',ok2?'??? \u00b7 '+k2.n.toUpperCase():'??? \u00b7 SECRET BOSS',ok2?`${k2.kind} &bull; 17 FASE &bull; Fase 15: THE GOD OF STORY &bull; Fase 17: NEW GOD &bull; MELAWAN HUKUM GAME & SADAR KAMU MENONTON &bull; ${k2.hint}${d.done.ak?' &bull; Sudah dikalahkan \u2713':''}`:'\u{1F512} Kalahkan Azathoth untuk membuka rahasia terakhir Death World.',`<button class="bb" ${ok2?'':'disabled'} data-f="ak">${ok2?(d.done.ak?'LAWAN LAGI':'LAWAN BERSAMA SEMUA MC'):'TERKUNCI'}</button>`,1,ok2?'eq':'dim')}
 else{const sr=DW.SER.find(x=>x.id==U.sr),found=DW.findMc(sr.mc);mc0=found[0]||'kael';
  cards=kc('\u2605',sr.t+' \u00b7 PROGRESS '+cnt(sr)+'/3',`MC yang boleh dipakai: ${found.length?found.map(k=>G.CHARS[k].n).join(', '):'<b>tidak ditemukan di G.CHARS, memakai Kael sebagai pengganti</b>'}. MC lain dikunci di bagian ini. Mini boss dikalahkan berurutan, final boss terakhir.`,'',1,'eq')+
   DW.ST.filter(s=>s.sr==sr.id).map((s,i)=>{const ok=DW.avail(s),dn=!!d.done[s.id];
    return kc(String(i+1).padStart(2,'0'),(G.EMOJI&&G.EMOJI[s.n]||s.emo)+' '+s.n,`${s.kind} &bull; 3 FASE &bull; ${dn?'\u2713 SELESAI':ok?'TERSEDIA':'\u{1F512} Kalahkan boss sebelumnya'} &bull; ${s.hint}`,`<button class="bb" ${ok?'':'disabled'} data-f="${s.id}">${ok?(dn?'LAWAN LAGI':'LAWAN'):'TERKUNCI'}</button>`,0,dn?'':ok?'eq':'dim')}).join('')}
 let por=(G.spr&&G.CHARS&&G.CHARS[mc0])?G.spr('characters',mc0,'pt'):'';
 if(U.sr=='ht')por=`<img src="${DW.altImg}" alt="Alternate Kael" style="max-width:100%;max-height:100%;object-fit:contain;border:3px solid #fff;box-shadow:6px 6px 0 #e60012" onerror="this.remove()">`;   /* foto Alternate Kael */
 A.innerHTML=`<div class="wipe"></div><div class="hb"><div class="hbbg"></div><div class="hbt"><span class="hbk">\u2620 DEATH WORLD &bull; ${DW.ST.filter(s=>d.done[s.id]).length}/${DW.ST.length}</span><div class="tabs"><span class="hbk" style="background:#e60012;color:#fff;box-shadow:5px 5px 0 #000">${d.mv?'SEMUA TUNTAS':ht?'HARAPAN & TAKDIR TERBUKA':d.ak?'RAHASIA TERBUKA':d.az?'RAHASIA TERBUKA':'CHAPTER SPESIAL'}</span></div><span class="yen">\u00a5 ${S.yen||0}</span></div><div class="hbm"><div class="hbs"><div class="hbh">SERIES</div>${side}${por?`<div class="por">${por}</div>`:''}</div><div class="hbp">${cards}</div><div class="wm">DEATH WORLD</div></div><div class="hbf"><button id="dwBack">Kembali</button></div></div>`;
 A.querySelectorAll('.si').forEach(b=>b.onclick=()=>{U.sr=b.dataset.k;DW.screen()});
 A.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>DW.fight(b.dataset.f));
 document.getElementById('dwBack').onclick=()=>{if(typeof hub=='function')hub()}};

/* ===== SUNTIK KE HUB: tab "DEATH WORLD" + tombol di layar TAMAT (tanpa mengubah file hub) ===== */
DW.hubHook=()=>{const S=G.state;if(!S)return;const A=document.getElementById('app');
 const logo=A&&A.querySelector('.logo');
 if(logo&&DW.unlocked()){const m=A.querySelector('.menu');if(m&&!document.getElementById('dwb')){const b=document.createElement('button');b.id='dwb';b.textContent='\u2620 Death World';b.onclick=DW.screen;m.insertBefore(b,m.firstChild)}return}
 if(!(G.ui&&G.ui.tab=='dw'))return;const p=A&&A.querySelector('.hbp');if(!p)return;
 const un=DW.unlocked(),d=st();
 p.innerHTML=`<div class="kc wide ${un?'eq':'dim'}"><b>\u2620</b><span>DEATH WORLD</span><small>${un?`Terbuka! Semua mini boss & final boss tiap seri Persona kembali, lalu Azathoth menunggu, dan di belakangnya ada secret boss terakhir. Setelah Author dikalahkan, level HARAPAN & TAKDIR dengan boss Multiverse (75 fase) ikut terbuka. Progress ${DW.ST.filter(s=>d.done[s.id]).length}/${DW.ST.length}`:'\u{1F512} TERKUNCI. Tamatkan seluruh main story untuk membuka chapter spesial ini. Di dalamnya semua boss & mini boss dari seri Persona kembali dengan 3 fase, dan hanya MC dari seri masing-masing yang bisa melawannya.'}</small>${un?'<button class="bb" id="dwOpen">MASUK DEATH WORLD</button>':'<button class="bb" disabled>TERKUNCI</button>'}</div>`;
 const o=document.getElementById('dwOpen');if(o)o.onclick=DW.screen};
const init=()=>{
 try{if(typeof TABS!='undefined'&&Array.isArray(TABS)&&!TABS.some(t=>t[0]=='dw'))TABS.push(['dw','DEATH WORLD'])}catch(e){}
 const o=window.hub;if(typeof o=='function'&&!o._dw){const h=function(){const r=o.apply(this,arguments);try{DW.hubHook()}catch(e){console.error('[DeathWorld]',e)}return r};h._dw=1;window.hub=h}};
init();window.addEventListener('load',init);
})();