/* =========================================================
   EPISODE SYSTEM — taruh di PALING BAWAH chapters.js
   (atau muat sebagai file terpisah SETELAH chapters.js, sebelum hub/main)

   Struktur cerita (nomor chapter dihitung dari 1, tidak mengubah urutan / join / side chapter yang ada):
     EP 1  Terjebak di Archive   ch 1-2    Kael terjebak sendirian di dunia lain
     EP 2  Pria Berkacamata      ch 3-4    bertemu Naoya   -> Naoya jadi playable
     EP 3  Rumor & Hukuman       ch 5      bertemu Tatsuya -> Tatsuya jadi playable
     EP 4  Jam Tengah Malam      ch 6      bertemu Makoto  -> Makoto jadi playable
     EP 5  Kabut & Kebenaran     ch 7-8    bertemu Yu      -> Yu jadi playable
     EP 6  Sang Pencuri Hati     ch 9-25   bertemu Ren     -> Ren jadi playable, lalu akhir Archive

   Mau geser batas episode? Cukup ubah angka from / to di G.EPISODES.
   Kartu pembuka episode otomatis muncul di awal chapter pertama episode,
   kartu penutup di akhir chapter terakhir episode, dan pengumuman karakter baru
   muncul di akhir chapter yang punya field join.
   ========================================================= */
G.EPISODES=[
 {id:1,t:'Terjebak di Archive',sub:'Kael sendirian di dunia yang bukan miliknya',from:1,to:2,unlock:null,
  intro:[
   ['EPISODE 1','Terjebak di Archive'],
   ['Narator','Kael terbangun di dunia yang bukan miliknya. Tidak ada pintu keluar, tidak ada peta, dan tidak ada seorang pun yang mengenalnya.'],
   ['Kael','Aku terjebak. Kalau aku ingin pulang, aku harus bertahan dulu.'],
   ['Narator','Di episode ini: bertahan hidup sendirian, memahami Archive, dan mencari jalan keluar yang mungkin tidak pernah ada.']],
  outro:[
   ['Kael','Dua kali aku selamat sendirian. Tapi aku tidak bisa terus begini.'],
   ['Narator','Kael sadar: Archive tidak punya jalan keluar bagi orang yang berjalan sendirian. Ia butuh sekutu dari dunia lain.'],
   ['SISTEM','EPISODE 1 SELESAI — Terjebak di Archive. Selanjutnya: pertemuan dengan para protagonis dari dunia lain!']]},

 {id:2,t:'Pria Berkacamata',sub:'Pertemuan dengan Naoya',from:3,to:4,unlock:'naoya',
  intro:[
   ['EPISODE 2','Pertemuan pertama: Naoya, pria berkacamata dari Mikage-cho'],
   ['Narator','Untuk pertama kalinya Kael bertemu seseorang yang juga terseret ke Archive. Tapi bisakah ia percaya pada orang asing?'],
   ['Kael','Siapa pun dia, aku tidak mau sendirian lagi.']],
  outro:[
   ['Naoya','Jejak Eclipse, suara halaman dibalik, sosok berjas merah... semua ini saling berhubungan.'],
   ['Kael','Kita berdua sudah cukup untuk bertahan. Tapi belum cukup untuk menang.'],
   ['SISTEM','EPISODE 2 SELESAI — Pria Berkacamata. Selanjutnya: pertemuan dengan Tatsuya!']]},

 {id:3,t:'Rumor & Hukuman',sub:'Pertemuan dengan Tatsuya',from:5,to:5,unlock:'tatsuya',
  intro:[
   ['EPISODE 3','Pertemuan kedua: Tatsuya Suou, pemilik dunia rumor'],
   ['Narator','Di Archive, rumor bisa menjadi nyata. Dan Tatsuya sudah terlalu lama hidup di antara rumor dan hukuman.'],
   ['Kael','Orang ini sulit dibaca. Tapi mungkin itu justru yang kami butuhkan.']],
  outro:[
   ['Tatsuya','Tiga orang yang saling curiga bisa jadi tim yang paling kuat, asal tahu kapan berhenti curiga.'],
   ['SISTEM','EPISODE 3 SELESAI — Rumor & Hukuman. Selanjutnya: pertemuan dengan Makoto!']]},

 {id:4,t:'Jam Tengah Malam',sub:'Pertemuan dengan Makoto',from:6,to:6,unlock:'makoto',
  intro:[
   ['EPISODE 4','Pertemuan ketiga: Makoto Yuki, penjaga jam ke-25'],
   ['Narator','Waktu berhenti di lapangan kosong. Di bawah jam tanpa jarum, seorang remaja tenang menunggu seseorang yang belum ia kenal.'],
   ['Kael','Dia terlihat seperti orang yang sudah pernah menghadapi akhir.']],
  outro:[
   ['Makoto','Aku sudah pernah menerima akhir. Kali ini aku ingin mencoba memilih awal.'],
   ['SISTEM','EPISODE 4 SELESAI — Jam Tengah Malam. Selanjutnya: pertemuan dengan Yu!']]},

 {id:5,t:'Kabut & Kebenaran',sub:'Pertemuan dengan Yu',from:7,to:8,unlock:'yu',
  intro:[
   ['EPISODE 5','Pertemuan keempat: Yu Narukami, sang penembus kabut'],
   ['Narator','Kabut menelan kebenaran. Di tengahnya berdiri siluet berambut abu-abu yang tampak tidak asing dengan kabut seperti ini.'],
   ['Kael','Jangan terpisah. Kabut ini terlalu tebal untuk dihadapi sendirian.']],
  outro:[
   ['Yu','Kebenaran selalu terlihat setelah kabut menipis. Dan sekarang kita sudah cukup untuk berdiri bersama.'],
   ['SISTEM','EPISODE 5 SELESAI — Kabut & Kebenaran. Selanjutnya: pertemuan terakhir dengan Ren!']]},

 {id:6,t:'Sang Pencuri Hati',sub:'Pertemuan dengan Ren & akhir Archive',from:9,to:25,unlock:'ren',
  intro:[
   ['EPISODE 6','Pertemuan terakhir: Ren Amamiya, sang pencuri hati'],
   ['Narator','Menara Archive menjulang. Di sinilah semua benang cerita bertemu, dan di sinilah protagonis terakhir menunggu.'],
   ['Kael','Lima dunia, lima protagonis. Dan di puncak menara, jawaban yang kucari.']],
  outro:[
   ['SISTEM','EPISODE 6 SELESAI — Sang Pencuri Hati. Seluruh kisah Multiverse Archive tamat. Terima kasih sudah bermain!']]}
];

/* ===== helper (bisa dipakai hub / chapter select) ===== */
G.epOf=ci=>G.EPISODES.find(e=>ci+1>=e.from&&ci+1<=e.to)||null;          /* ci = index chapter (0-based) */
G.epTag=ci=>{const e=G.epOf(ci);return e?'EP '+e.id:''};                  /* contoh: "EP 2" */
G.epLabel=ci=>{const e=G.epOf(ci);return e?`EP ${e.id} &bull; ${e.t}`:''};/* contoh: "EP 2 • Pria Berkacamata" */

/* ===== suntik dialog episode ke G.CHAPTERS (sekali saja) ===== */
(()=>{if(G._epApplied||!G.CHAPTERS)return;G._epApplied=1;
 const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
 const nm=id=>(G.CHARS&&G.CHARS[id]&&G.CHARS[id].n)||cap(id);
 G.CHAPTERS.forEach(c=>{if(c.ep)return});
 G.EPISODES.forEach(e=>{
  for(let n=e.from;n<=e.to;n++){const c=G.CHAPTERS[n-1];if(c){c.ep=e.id;c.epTitle=e.t}}
  const f=G.CHAPTERS[e.from-1],l=G.CHAPTERS[e.to-1];
  if(f)f.intro=e.intro.concat(f.intro);                     /* kartu pembuka di awal chapter pertama episode */
  if(l){const o=l.outro,last=e.to==G.CHAPTERS.length;       /* kartu penutup di akhir chapter terakhir episode */
   if(last&&o.length)o.splice(o.length-1,0,...e.outro);else o.push(...e.outro)}
 });
 /* pengumuman karakter baru di akhir chapter yang punya field join */
 G.CHAPTERS.forEach(c=>{if(!c.join)return;
  c.outro.push(['SISTEM',`${nm(c.join)} bergabung! Sekarang bisa dimainkan. Atur tim sebelum battle (maksimal 4 anggota).`])});
 /* chapter 10: semua protagonis lengkap */
 const c10=G.CHAPTERS[9];if(c10)c10.outro.push(['SISTEM','Semua protagonis kini terkumpul: Kael, Naoya, Tatsuya, Makoto, Yu, dan Ren. Pilih 4 terbaik untuk setiap pertempuran!']);
})();