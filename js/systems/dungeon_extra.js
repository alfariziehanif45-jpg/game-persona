window.G=window.G||{};
/* =====================================================================
   DUNGEON EXTRA  (muat SETELAH hub.js)
   - 10 dungeon biasa baru
   - 3 EXTRA DUNGEON: boss OUTER GOD, 3 fase, HP sangat tebal, serangan sangat sakit
   Atur tingkat kesulitan Outer God lewat angka hp / atk di tabel OUTER di bawah.
   ===================================================================== */
(()=>{
if(!G.DUNGEONS||!G.runDungeon||G._dgx)return;G._dgx=1;
const NC=()=>(G.CHAPTERS||[]).length||10;
/* syarat chapter dihitung saat dibaca, dibatasi jumlah chapter yang ada */
const mk=(o,n)=>{Object.defineProperty(o,'need',{get:()=>Math.min(n,NC()),enumerable:true});return o};
const add=o=>{if(!G.DUNGEONS.some(x=>x.id==o.id))G.DUNGEONS.push(o)};

/* ---------- 10 DUNGEON BIASA BARU ----------
   floors = jumlah lantai | hp/atk = pengali musuh | xp/yen = pengali hadiah | item = peluang drop */
[
 [{id:'kuil',n:'KUIL TINTA',e:'\u{1F4DC}',d:'Kuil tua penuh tinta hidup. Musuh seimbang, EXP bagus.',floors:10,hp:1.05,atk:1.05,xp:1.4,yen:1,item:.25,boss:'Penjaga Tinta'},2],
 [{id:'menara',n:'MENARA HALAMAN',e:'\u{1F5FC}',d:'Menara tinggi bertingkat. Lantainya lebih banyak dari biasanya.',floors:15,hp:1.15,atk:1.1,xp:1.3,yen:1.3,item:.25,boss:'Penguasa Menara'},4],
 [{id:'hutan',n:'HUTAN SUNYI',e:'\u{1F332}',d:'Hutan tanpa suara. Banyak drop item dari musuh liar.',floors:10,hp:1.2,atk:1.15,xp:1.2,yen:1,item:.55,boss:'Roh Hutan'},5],
 [{id:'kawah',n:'KAWAH API ARSIP',e:'\u{1F30B}',d:'Musuh panas dan agresif. Serangannya sakit, Yen-nya besar.',floors:12,hp:1.25,atk:1.3,xp:1.3,yen:2,item:.2,boss:'Naga Kawah'},7],
 [{id:'gletser',n:'GLETSER KRISTAL',e:'\u2744\uFE0F',d:'Musuh berdarah tebal di lantai es yang licin.',floors:12,hp:1.5,atk:1.15,xp:1.5,yen:1.4,item:.25,boss:'Raja Es'},8],
 [{id:'laut',n:'LAUTAN TINTA HITAM',e:'\u{1F30A}',d:'Selami lautan tinta. Hadiah EXP besar untuk yang berani.',floors:15,hp:1.35,atk:1.25,xp:2,yen:1.5,item:.3,boss:'Leviathan Tinta'},9],
 [{id:'langit',n:'ISTANA LANGIT',e:'\u{1F3EF}',d:'Istana di atas awan. Musuh cepat dan kuat, hadiah melimpah.',floors:15,hp:1.5,atk:1.35,xp:1.8,yen:2.2,item:.35,boss:'Jenderal Langit'},11],
 [{id:'cermin',n:'LABIRIN CERMIN',e:'\u{1F52E}',d:'Musuh yang meniru kekuatanmu. Sangat keras tapi EXP luar biasa.',floors:15,hp:1.7,atk:1.45,xp:2.4,yen:1.8,item:.3,boss:'Bayangan Cermin'},13],
 [{id:'neraka',n:'GERBANG NERAKA',e:'\u{1F525}',d:'Gerbang penuh iblis. Risiko tinggi, Yen tertinggi.',floors:20,hp:1.9,atk:1.6,xp:2.2,yen:3.2,item:.3,boss:'Penjaga Gerbang Neraka'},15],
 [{id:'waktu',n:'PERPUSTAKAAN WAKTU',e:'\u23F3',d:'Dungeon biasa terakhir dan terberat. Musuh paling kuat, hadiah paling besar.',floors:20,hp:2.2,atk:1.8,xp:3,yen:3.6,item:.4,boss:'Pustakawan Waktu'},17]
].forEach(([o,n])=>add(mk(o,n)));

/* ---------- 3 EXTRA DUNGEON: OUTER GOD ----------
   Tiap dungeon = 3 FASE (3 pertarungan beruntun lawan boss yang sama, tanpa jeda mundur).
   hp / atk = pengali statistik tiap fase (makin ke belakang makin gila).
   rw = hadiah clear pertama (ulang = 35%). */
const OUTER=[
 [{id:'azathoth',n:'EXTRA: AZATHOTH',e:'\u{1F441}\uFE0F',boss:'AZATHOTH',
   d:'Dewa Buta di pusat kekacauan. 3 fase, HP sangat tebal, serangan mematikan.',
   rw:{yen:9000,items:8,sp:8,elx:2},
   ph:[{n:'Kekacauan Buta',hp:9,atk:2.4,
     intro:[['Narator','Di luar semua halaman, sesuatu bergerak tanpa mata dan tanpa niat.'],['AZATHOTH','...']]},
    {n:'Seruling Tanpa Akhir',hp:14,atk:3.2,
     intro:[['Narator','Suara seruling memenuhi kehampaan. Realitas mulai retak.'],['AZATHOTH','(Tidak ada bahasa. Hanya kehancuran.)']]},
    {n:'Inti Semesta',hp:22,atk:4.4,
     intro:[['Narator','Inti kekacauan terbuka. Ini wujud yang tidak boleh dilihat siapa pun.'],['AZATHOTH','(Semesta menjerit.)']]}]},20],
 [{id:'yogsothoth',n:'EXTRA: YOG-SOTHOTH',e:'\u{1F5DD}\uFE0F',boss:'YOG-SOTHOTH',
   d:'Gerbang dan Kunci dari semua waktu. 3 fase, HP sangat tebal, serangan mematikan.',
   rw:{yen:12000,items:10,sp:10,elx:3},
   ph:[{n:'Gerbang Terbuka',hp:10,atk:2.6,
     intro:[['Narator','Sebuah gerbang terbuka di antara dimensi. Sesuatu melangkah keluar.'],['YOG-SOTHOTH','Aku adalah gerbang. Aku adalah kuncinya.']]},
    {n:'Kunci Semua Waktu',hp:15,atk:3.4,
     intro:[['YOG-SOTHOTH','Masa lalu dan masa depan hanya ruang yang belum kuinjak.'],['Narator','Waktu terlipat di sekeliling kalian.']]},
    {n:'Gumpalan Tak Berbentuk',hp:24,atk:4.6,
     intro:[['YOG-SOTHOTH','Lihatlah wujudku yang sebenarnya, dan hilanglah.'],['Narator','Bola-bola cahaya menutup seluruh pandangan.']]}]},23],
 [{id:'nyarlathotep',n:'EXTRA: NYARLATHOTEP',e:'\u{1F3AD}',boss:'NYARLATHOTEP',
   d:'Chaos yang merayap dan menipu. Outer God terkuat: 3 fase, HP paling tebal, serangan paling sakit.',
   rw:{yen:16000,items:12,sp:12,elx:4},
   ph:[{n:'Seribu Wajah',hp:11,atk:2.8,
     intro:[['Narator','Seorang pria berjubah tersenyum ramah. Itu bukan wajah aslinya.'],['NYARLATHOTEP','Selamat datang. Aku sudah lama menulis akhir ceritamu.']]},
    {n:'Utusan Kehancuran',hp:17,atk:3.7,
     intro:[['NYARLATHOTEP','Topeng pertama sudah lepas. Masih ada sembilan ratus sembilan puluh sembilan.'],['Narator','Bayangannya menutupi seluruh ruangan.']]},
    {n:'Chaos Merayap',hp:27,atk:5,
     intro:[['NYARLATHOTEP','Cukup bermain. Sekarang kalian akan melihat apa itu akhir yang sebenarnya.'],['Narator','Semesta mulai padam satu per satu.']]}]},25]
];
OUTER.forEach(([o,n])=>add(mk(Object.assign(o,{outer:1,floors:3,need:undefined}),n)));

/* musuh satu fase Outer God (dipakai juga kalau ada kode lain memanggil dgFoes) */
G.outerFoe=(D,p)=>{const S=G.state,cn=Math.max(1,S.ch+1),ph=D.ph[p];
 return G.foe(cn,3,1,D.boss+' - '+ph.n,{hp:ph.hp,atk:ph.atk,xp:6+p*4})};
const _dgFoes=G.dgFoes;
G.dgFoes=(D,f)=>D&&D.outer?[G.outerFoe(D,Math.max(0,Math.min(D.ph.length-1,f-1)))]:_dgFoes(D,f);

/* ---------- alur dungeon: Outer God punya alur sendiri, dungeon lain tetap alur lama ---------- */
const _run=G.runDungeon;
G.runDungeon=D=>{if(!D||!D.outer)return _run(D);
 const S=G.state;S.dg=S.dg||{};S.dg.outer=S.dg.outer||{};let p=0;
 const win=()=>{const first=!S.dg.outer[D.id],k=first?1:.35,r=D.rw,y=Math.round(r.yen*k),it=Math.round(r.items*k),sp=Math.round(r.sp*k),ex=first?r.elx:0;
  S.dg.outer[D.id]=(S.dg.outer[D.id]||0)+1;S.dg.clears=(S.dg.clears||0)+1;
  S.yen=(S.yen||0)+y;S.items=(S.items||0)+it;S.spitems=(S.spitems||0)+sp;if(ex)S.megaelx=(S.megaelx||0)+ex;
  G.save();
  G.dialog([['Narator',D.boss+' tumbang. Kehampaan kembali sunyi, untuk sekarang.']],()=>{
   alert(`${D.n} TUNTAS!\n+\u00a5${y} \u00b7 +${it} Potion \u00b7 +${sp} SP Drink`+(ex?` \u00b7 +${ex} Mega Elixir`:' (ulang: hadiah 35%)'));hub()})};
 const go=()=>{const ph=D.ph[p];
  G.dialog(ph.intro,()=>G.fight([G.outerFoe(D,p)],ok=>{
   if(!ok)return after();                       /* kalah di fase mana pun = gagal */
   p++;if(p>=D.ph.length)return win();
   G.save();
   G.dialog([['Narator',`FASE ${p} SELESAI. ${D.boss} berubah wujud... FASE ${p+1}/${D.ph.length} dimulai!`]],go)},[D.boss]))};
 go()};
})();