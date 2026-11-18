/* =========================================================
   story_multiverse.js — PERSONA: MULTIVERSE ARCHIVE
   Prolog + pertemuan KAEL dengan tiap protagonis.
   Pakai:  MultiverseStory.play('prolog', onEnd)
           MultiverseStory.play('meet_naoya', onEnd)  dst.
   ========================================================= */
window.MultiverseStory=(()=>{
const K=(t)=>({n:'KAEL',who:'kael',t});
const N=(t)=>({n:'NAOYA',who:'naoya',t});
const T=(t)=>({n:'TATSUYA',who:'tatsuya',t});
const M=(t)=>({n:'MAKOTO',who:'makoto',t});
const Y=(t)=>({n:'YU',who:'yu',t});
const R=(t)=>({n:'REN',who:'ren',t});
const nr=(narr)=>({narr});

const S={};

/* ---------- PROLOG ---------- */
S.prolog=[
 {bg:'void'},{show:[]},
 {title:'PERSONA: MULTIVERSE ARCHIVE',sub:'THE BEGINNING OF AN UNKNOWN JOURNEY'},
 nr('Di suatu malam, berbagai dunia yang seharusnya tidak pernah terhubung tiba-tiba mengalami fenomena aneh.'),
 nr('Ruang dan waktu mulai retak. Seseorang... atau sesuatu... mulai mengumpulkan individu dari berbagai realitas.'),
 {bg:'glitch'},
 nr('Para protagonis yang pernah menghadapi ancaman besar di dunia masing-masing terbangun di tempat yang asing.'),
 {bg:'dawn'},{show:['kael']},
 K('...Di mana ini? Langit ini... bukan langit dunia mana pun yang kukenal.'),
 K('Aku ingat gelap. Lalu suara itu. Setelahnya... kosong.'),
 nr('Sebuah suara bergema, tenang tapi dingin, seperti datang dari balik halaman buku yang tak terlihat.'),
 {n:'???',t:'"Welcome to Multiverse Archive. Your previous journey has ended. Now, a new story awaits."'},
 K('Siapa di sana?! Tunjukkan dirimu!'),
 {n:'???',t:'Kau akan mengerti sebentar lagi. Mereka sudah menunggumu... para pengembara dari dunia lain.'},
 nr('Suara itu menghilang. Hanya jejak cahaya merah yang mengarah ke dalam kabut.'),
 {choice:[
   {t:'Ikuti cahaya itu.',set:{berani:1},say:[K('Tidak ada pilihan lain. Aku harus tahu apa yang terjadi.')]},
   {t:'Waspada dulu, amati sekitar.',set:{waspada:1},say:[K('Tenang. Jangan gegabah. Perhatikan setiap detail...'),nr('Di kejauhan, ada beberapa siluet yang sama bingungnya denganmu.')]},
 ]},
 {toast:'CHAPTER 1 — Pertemuan Pertama'},
];

/* ---------- NAOYA (P1) ---------- */
S.meet_naoya=[
 {bg:'void'},{show:['kael','naoya']},
 nr('Di antara reruntuhan perpustakaan melayang, seorang pemuda berkacamata berdiri waspada.'),
 N('Berhenti di situ. Aku tidak merasakan aura Persona dari dirimu... tapi ada sesuatu yang aneh.'),
 K('Tenang, aku bukan musuh. Namaku Kael. Kau siapa?'),
 N('Naoya. Aku baru saja keluar dari pertempuran di Mikage-cho. Lalu tiba-tiba aku di sini.'),
 {choice:[
   {t:'"Aku juga terseret ke tempat ini."',set:{naoya_bond:1},say:[N('Kalau begitu kita senasib. Aku benci tidak tahu apa-apa, tapi sendirian lebih buruk.'),{toast:'BOND — Naoya naik'}]},
   {t:'"Buktikan kau bukan ancaman."',set:{naoya_bond:0},say:[N('Hmph. Wajar curiga. Tapi sikapmu mengingatkanku pada diriku sendiri.')]},
 ]},
 {ifFlag:'naoya_bond',then:[N('Ambil ini. Catatan yang kutemukan: tempat ini disebut "Archive". Semua dunia tercatat di sini.')],else:[N('Kalau mau bertahan, kita perlu informasi. Jangan buang waktu.')]},
 K('Archive... Jadi ada yang mengumpulkan kita secara sengaja.'),
 N('Ya. Dan kurasa kita bukan satu-satunya.'),
 {toast:'NAOYA bergabung — tersedia di menu TEAM'},
];

/* ---------- TATSUYA (P2) ---------- */
S.meet_tatsuya=[
 {bg:'glitch'},{show:['kael','tatsuya']},
 nr('Gerbang berlapis kaca retak. Di baliknya, sosok berjas merah menatap pantulan dirinya sendiri.'),
 T('Dunia yang runtuh karena rumor, dan sekarang... dunia yang tak punya nama. Menarik.'),
 K('Kau sepertinya tidak terlalu panik.'),
 T('Panik tak menyelesaikan apa pun. Tatsuya Suou. Dan kau... pemuda yang tidak berasal dari mana pun, kan?'),
 K('Kau tahu sesuatu tentangku?'),
 T('Hanya intuisi. Semua orang di sini punya "asal". Kau tidak. Itu membuatmu kunci, atau masalah.'),
 {choice:[
   {t:'"Kalau aku kunci, bantu aku membukanya."',set:{tatsuya_bond:1},say:[T('Berani juga. Baik, aku ikut. Tapi kalau kau jadi masalah, aku yang menghentikanmu.'),{toast:'BOND — Tatsuya naik'}]},
   {t:'"Aku tidak tahu apa-apa soal itu."',say:[T('Kejujuran. Cukup. Untuk sekarang.')]},
 ]},
 {toast:'TATSUYA bergabung — tersedia di menu TEAM'},
];

/* ---------- MAKOTO (P3) ---------- */
S.meet_makoto=[
 {bg:'void'},{show:['kael','makoto']},
 nr('Jam raksasa tanpa jarum berdiri di tengah lapangan kosong. Seorang remaja bersandar di bawahnya, mendengarkan musik dari earphone yang mati.'),
 M('...Jam di sini tidak pernah bergerak. Seperti Dark Hour, tapi lebih sunyi.'),
 K('Kau dari dunia yang punya "jam" tersembunyi?'),
 M('Makoto Yuki. Aku selalu berpikir hidupku hanya sampai bulan Januari... tapi ternyata ceritaku belum selesai.'),
 M('Aku tidak bisa menjelaskan kenapa, tapi aku merasa tenang di dekatmu.'),
 {choice:[
   {t:'"Mari cari jalan pulang bersama."',set:{makoto_bond:1},say:[M('Ya. Mungkin ini kesempatan kedua. Aku ikut.'),{toast:'BOND — Makoto naik'}]},
   {t:'"Jangan lengah, sesuatu mengawasi kita."',say:[M('Aku juga merasakannya. Tatapan dari balik dinding dunia ini.')]},
 ]},
 {toast:'MAKOTO bergabung — tersedia di menu TEAM'},
];

/* ---------- YU (P4) ---------- */
S.meet_yu=[
 {bg:'dawn'},{show:['kael','yu']},
 nr('Kabut tebal menyelimuti sebuah jalan sepi. Seorang pemuda berambut abu-abu berdiri di tengah kabut, tenang dan mengamati.'),
 Y('Kabut ini... berbeda dari kabut Inaba. Tidak ada TV, tidak ada bayangan, tapi rasanya sama menekan.'),
 K('Kau terlihat sangat tenang untuk orang yang tersesat.'),
 Y('Aku Yu Narukami. Pengalaman mengajariku: kebenaran selalu terlihat setelah kabut menipis.'),
 Y('Dan kau, Kael... kau yang menarik kami semua ke sini?'),
 K('Bukan aku! Aku sendiri tidak tahu kenapa aku di sini.'),
 {choice:[
   {t:'"Percayalah padaku."',set:{yu_bond:1},say:[Y('Aku percaya pada ikatan. Dan matamu tidak berbohong.'),{toast:'BOND — Yu naik'}]},
   {t:'"Aku tidak memintamu percaya. Buktikan saja nanti."',say:[Y('Pendekatan yang jujur. Aku suka.')]},
 ]},
 {toast:'YU bergabung — tersedia di menu TEAM'},
];

/* ---------- REN (P5) ---------- */
S.meet_ren=[
 {bg:'glitch'},{show:['kael','ren']},
 nr('Sebuah panggung teater tanpa penonton. Lampu sorot menyala, dan seorang pemuda berjas hitam muncul dengan senyum tipis.'),
 R('Akhirnya muncul juga. Aku hampir bosan menunggu di sini.'),
 K('Kau seperti sudah tahu aku akan datang.'),
 R('Ren Amamiya. Tertangkap, kabur, mengubah hati orang. Pengalamanku soal "dunia aneh" lumayan banyak.'),
 R('Tapi ini yang pertama kalinya aku merasa... sebuah panggung ditulis untuk kita semua.'),
 {choice:[
   {t:'"Kalau begitu kita rebut naskahnya."',set:{ren_bond:1},say:[R('Itu yang ingin kudengar. Take your heart, Kael.'),{toast:'BOND — Ren naik'}]},
   {t:'"Aku lebih penasaran siapa penulisnya."',say:[R('Pertanyaan yang tepat. Mari cari tahu bersama.')]},
 ]},
 {toast:'REN bergabung — tersedia di menu TEAM'},
];

/* ---------- KUMPUL SEMUA ---------- */
S.gathering=[
 {bg:'dawn'},{show:['naoya','tatsuya','makoto','yu','ren','kael']},
 nr('Semua protagonis akhirnya berkumpul di aula Archive, dikelilingi rak buku raksasa yang berisi kisah tak terhitung.'),
 R('Jadi... lima protagonis, lima dunia, dan satu orang tanpa dunia.'),
 Y('Setiap rak di sini menyimpan sebuah realitas. Dan beberapa... sudah kosong.'),
 M('Seseorang sedang menghapus mereka satu per satu.'),
 T('Dan kita adalah halaman terakhir yang belum dirobek.'),
 N('Apa pun yang mengamati kita, ia sedang menunggu kita bergerak.'),
 {show:['kael']},
 K('Kalau begitu, kita jangan hanya menunggu. Kita cari tahu siapa yang menulis semua ini.'),
 {show:['naoya','tatsuya','makoto','yu','ren','kael']},
 R('Setuju. Ketua tim?'),
 K('Aku? ...Baiklah. Mari mulai perjalanan ini.'),
 {ifFlag:'berani',then:[nr('Keberanianmu menular. Tim bergerak lebih cepat dari yang dibayangkan.')],else:[nr('Kewaspadaanmu menyelamatkan tim dari jebakan pertama yang tak terlihat.')]},
 {bg:'void'},
 {n:'???',t:'"Welcome to Multiverse Archive... Let the story begin."'},
 {toast:'CHAPTER 1 SELESAI'},
];

function play(key,onEnd){
  const s=S[key];
  if(!s){console.warn('[Story] tidak ada:',key);onEnd&&onEnd({});return}
  const saved=(window.G&&G.state&&G.state.storyFlags)||{};
  Dialog.play(s,{flags:saved,onEnd:f=>{
    if(window.G&&G.state){G.state.storyFlags=f;G.state.storyDone=G.state.storyDone||{};G.state.storyDone[key]=1}
    onEnd&&onEnd(f);
  }});
}
return{play,keys:()=>Object.keys(S)};
})();