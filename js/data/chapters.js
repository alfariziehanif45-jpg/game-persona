/* =========================================================
   chapters.js — PERSONA: MULTIVERSE ARCHIVE
   25 chapter x 3 stage (stage 3 = boss).
   Format baris dialog: ['Nama','teks']
     'Narator' / 'Suara'  -> tampil sebagai narasi
     {choice:[{t:'teks pilihan', set:{flag:1}, say:[['Nama','balasan']]}]}
     {if:'flag', then:[...baris], else:[...baris]}
   Field join:'naoya' = protagonis yang terbuka setelah chapter selesai
   Tambahan di file ini:
     G.BOSS2  = data boss (kelemahan, phase, ultimate) untuk boss chapter 11-25, side chapter & dungeon
     G.SIDE2  = side chapter baru (digabung otomatis ke G.SIDE oleh main.js)
   ========================================================= */
window.G=window.G||{};

G.CHAPTERS=[
/* 1 */{t:'Terdampar',boss:'Penjaga Retakan',
 intro:[
  ['Narator','Di suatu malam, dunia-dunia yang seharusnya tak pernah terhubung mulai retak.'],
  ['Kael','...Dimana ini? Langit retak seperti kaca.'],
  ['Kael','Aku ingat gelap, lalu suara itu. Setelahnya, kosong.'],
  ['Suara','"Welcome to Multiverse Archive. Your previous journey has ended. Now, a new story awaits."'],
  ['Kael','Siapa di sana?! Tunjukkan dirimu!'],
  ['Suara','Para pengembara dari dunia lain sudah menunggumu. Tapi pertama, lewati penjaga gerbang.'],
  {choice:[
   {t:'Maju tanpa ragu.',set:{berani:1},say:[['Kael','Tidak ada jalan pulang kalau aku diam saja.']]},
   {t:'Amati dulu sekelilingnya.',set:{waspada:1},say:[['Kael','Tenang. Perhatikan pola gerakannya sebelum menyerang.']]}
  ]}
 ],
 outro:[
  ['Narator','Penjaga Retakan hancur, memperlihatkan kalender raksasa yang berdetak mundur.'],
  ['Kael','Retakan itu menghitung mundur. Kiamat akan datang.'],
  ['Narator','Kael, Wild Card dari Void, jatuh ke Multiverse Archive. Sesuatu mengamatinya dari balik dunia ini.']
 ]},

/* 2 */{t:'Kota yang Menghilang',boss:'Pemakan Kota',
 intro:[
  ['Kael','Satu blok kota lenyap dalam semalam. Tidak ada puing, tidak ada jejak.'],
  ['Narator','Eclipse memakan dunia sedikit demi sedikit, dan semua yang dimakan dihapus dari catatan Archive.'],
  ['Kael','Kalau semua lenyap tanpa catatan... siapa yang akan ingat mereka?'],
  {if:'berani',then:[['Kael','Aku tidak akan membiarkannya melahap blok berikutnya!']],else:[['Kael','Pola serangannya berulang. Kita bisa memanfaatkannya.']]}
 ],
 outro:[
  ['Kael','Pemakan Kota hanya suruhan. Ada sesuatu yang mengendalikannya.'],
  ['Kael','Kita harus cari sumbernya.'],
  ['Narator','Dari reruntuhan, tampak sosok berkacamata mengamati dari kejauhan.']
 ]},

/* 3 */{t:'Pria Berkacamata',boss:'Zio Shade',join:'naoya',
 intro:[
  ['Naoya','Berhenti di situ. Aku tidak merasakan aura Persona darimu, tapi ada yang aneh.'],
  ['Kael','Aku bukan musuh. Namaku Kael. Kau siapa?'],
  ['Naoya','Naoya. Aku baru keluar dari pertempuran di Mikage-cho, lalu tiba-tiba terbangun di sini.'],
  ['Naoya','Kau bukan dari dunia ini. Ikut aku, ada yang mengincarmu.'],
  {choice:[
   {t:'"Aku juga terseret ke tempat ini."',set:{naoya_bond:1},say:[['Naoya','Kalau begitu kita senasib. Sendirian terasa lebih buruk dari tidak tahu apa-apa.']]},
   {t:'"Buktikan kau bukan ancaman."',set:{naoya_bond:0},say:[['Naoya','Wajar curiga. Sikapmu mengingatkanku pada diriku sendiri.']]}
  ]},
  ['Naoya','Awas! Bayangan itu datang!']
 ],
 outro:[
  {if:'naoya_bond',then:[['Naoya','Terima kasih sudah percaya. Kupikir aku harus melawan ini sendirian.']],else:[['Naoya','Kau bertarung dengan baik. Aku mulai percaya padamu.']]},
  ['Naoya','Catatan yang kutemukan menyebut tempat ini "Archive". Semua dunia tercatat di sini.'],
  ['Naoya','Aku Naoya. Mari hentikan kehancuran ini bersama.']
 ]},

/* 4 */{t:'Jejak Eclipse',boss:'Echo Sovereign',
 intro:[
  ['Naoya','Jejak Eclipse menuju kota lama. Energinya makin pekat.'],
  ['Kael','Ada yang menunggu di sana.'],
  ['Naoya','Kael, ada satu hal. Tiap kali dunia lenyap, aku merasa ada suara yang membisikkan nama kita.'],
  ['Kael','Kau juga mendengarnya? Seperti halaman buku yang dibalik.']
 ],
 outro:[
  ['Narator','Echo Sovereign pecah. Dari bayangannya terpantul sosok berjas merah yang berjalan menjauh.'],
  ['Kael','Kita butuh sekutu lebih banyak.'],
  ['Naoya','Dan kurasa mereka sedang mencari kita juga.']
 ]},

/* 5 */{t:'Dosa & Hukuman',boss:'Joker Sin',join:'tatsuya',
 intro:[
  ['Tatsuya','Dunia yang runtuh karena rumor, dan sekarang dunia tanpa nama. Menarik.'],
  ['Kael','Kau tampak tidak panik sama sekali.'],
  ['Tatsuya','Panik tak menyelesaikan apa pun. Tatsuya Suou. Rumor jadi nyata di sini, jadi kau pasti si pendatang.'],
  ['Tatsuya','Semua orang di sini punya "asal". Kau tidak. Itu membuatmu kunci, atau masalah.'],
  {choice:[
   {t:'"Kalau aku kunci, bantu aku membukanya."',set:{tatsuya_bond:1},say:[['Tatsuya','Berani juga. Tapi kalau kau jadi masalah, aku yang menghentikanmu.']]},
   {t:'"Aku tidak tahu apa-apa soal itu."',say:[['Tatsuya','Kejujuran. Cukup, untuk sekarang.']]}
  ]}
 ],
 outro:[
  ['Tatsuya','Joker Sin hanyalah rumor yang diberi bentuk. Pembuat rumornya masih bebas.'],
  ['Tatsuya','Aku ikut. Rumor ini harus dihentikan.']
 ]},

/* 6 */{t:'Jam Tengah Malam',boss:'Shadow Hour',join:'makoto',
 intro:[
  ['Narator','Jam raksasa tanpa jarum berdiri di lapangan kosong. Seorang remaja bersandar di bawahnya.'],
  ['Makoto','Jam di sini tidak pernah bergerak. Seperti Dark Hour, tapi lebih sunyi.'],
  ['Makoto','Makoto Yuki. Dulu kukira hidupku hanya sampai bulan Januari. Ternyata ceritaku belum selesai.'],
  ['Makoto','Ada jam ke-25. Waktu berhenti di sana.'],
  {choice:[
   {t:'"Mari cari jalan pulang bersama."',set:{makoto_bond:1},say:[['Makoto','Ya. Mungkin ini kesempatan kedua. Aku ikut.']]},
   {t:'"Jangan lengah, ada yang mengawasi kita."',say:[['Makoto','Aku juga merasakannya. Tatapan dari balik dinding dunia ini.']]}
  ]}
 ],
 outro:[
  ['Makoto','Eclipse ini punya inti, dan intinya ada di tempat berkabut.'],
  ['Makoto','Aku ikut sampai akhir.']
 ]},

/* 7 */{t:'Kabut Kebenaran',boss:'Fog Lord',
 intro:[
  ['Makoto','Kabut menelan kebenaran. Cari yang jujur.'],
  ['Narator','Kabut tebal menyelimuti jalan sepi. Di tengahnya, berdiri siluet berambut abu-abu.'],
  ['Kael','Kita temukan titik lemahnya. Jangan terpisah!']
 ],
 outro:[
  ['Kael','Kabut mulai menipis.'],
  ['Makoto','Dan sosok itu masih menunggu, tenang seperti sebelumnya.']
 ]},

/* 8 */{t:'TV Kebenaran',boss:'Mirror Self',join:'yu',
 intro:[
  ['Yu','Kabut ini berbeda dari Inaba. Tak ada TV, tapi rasanya sama menekan.'],
  ['Kael','Kau tenang sekali untuk orang yang tersesat.'],
  ['Yu','Yu Narukami. Pengalaman mengajariku: kebenaran terlihat setelah kabut menipis.'],
  ['Yu','Masuklah ke TV. Dirimu sendiri menunggu.'],
  {choice:[
   {t:'"Percayalah padaku."',set:{yu_bond:1},say:[['Yu','Aku percaya pada ikatan. Dan matamu tidak berbohong.']]},
   {t:'"Aku tidak minta dipercaya. Lihat saja nanti."',say:[['Yu','Pendekatan yang jujur. Aku suka.']]}
  ]}
 ],
 outro:[
  ['Kael','Aku melihat diriku sendiri... dan aku menerimanya.'],
  ['Yu','Aku Yu. Aku percaya padamu.']
 ]},

/* 9 */{t:'Menara Arsip',boss:'Archivist Nyx',join:'ren',
 intro:[
  ['Narator','Menara Archive menjulang, dikelilingi rak buku yang berisi kisah tak terhitung.'],
  ['Nyx','Semua dunia hanya buku. Aku yang menutupnya.'],
  ['Kael','Dia dalang kiamatnya!'],
  ['Ren','Akhirnya muncul juga. Aku hampir bosan menunggu.'],
  ['Ren','Ren Amamiya. Tertangkap, kabur, mengubah hati orang. Pengalamanku soal dunia aneh lumayan banyak.'],
  {choice:[
   {t:'"Kalau begitu kita rebut naskahnya."',set:{ren_bond:1},say:[['Ren','Itu yang ingin kudengar. Take your heart, Kael.']]},
   {t:'"Aku lebih penasaran siapa penulisnya."',say:[['Ren','Pertanyaan yang tepat. Mari cari tahu bersama.']]}
  ]}
 ],
 outro:[
  ['Nyx','Kalian hanya menunda akhir. Yang menulis kalian belum selesai.'],
  ['Ren','Pencuri hati dari dunia lain? Aku ikut. Showtime.']
 ]},

/* 10 */{t:'Akhir Eclipse',boss:'Hollow Eclipse',
 intro:[
  ['Narator','Semua protagonis akhirnya berkumpul di aula Archive.'],
  ['Ren','Lima protagonis, lima dunia, dan satu orang tanpa dunia.'],
  ['Yu','Setiap rak menyimpan realitas. Beberapa sudah kosong.'],
  ['Makoto','Seseorang menghapusnya satu per satu.'],
  ['Tatsuya','Dan kita halaman terakhir yang belum dirobek.'],
  ['Naoya','Apa pun yang mengamati kita, ia menunggu kita bergerak.'],
  ['Kael','Semua MC, satu tujuan. Hancurkan kiamat ini!'],
  ['Ren','Ayo curi masa depan.']
 ],
 outro:[
  ['Narator','Langit menutup. Dunia selamat... untuk sementara.'],
  {if:'berani',then:[['Narator','Keberanian Kael menjadi api yang menyatukan semua dunia.']],else:[['Narator','Kewaspadaan Kael menyelamatkan tim dari setiap jebakan tak terlihat.']]},
  ['Kael','Eclipse hanyalah gejala. Siapa yang menulis kiamat ini?'],
  ['Suara','"Welcome to Multiverse Archive... Chapter selanjutnya baru saja dibuka."']
 ]}
];

/* ================= LANJUTAN CERITA: CHAPTER 11 - 25 ================= */
G.CHAPTERS.push(

/* 11 */{t:'Halaman Kosong',boss:'Blank Page',
 intro:[
  ['Narator','Archive sunyi setelah Eclipse runtuh. Namun di lantai bawah, halaman-halaman buku mulai memutih.'],
  ['Ren','Tulisannya hilang sendiri. Bukan dimakan, tapi seperti... tidak pernah ditulis.'],
  ['Yu','Dunia yang belum selesai ditulis tidak punya masa depan.'],
  ['Suara','"Satu halaman kosong lebih menakutkan daripada seribu monster."'],
  ['Kael','Siapa pun kau, berhenti bersembunyi di balik suara!'],
  {choice:[
   {t:'Turun ke lantai bawah sekarang.',set:{berani:1},say:[['Kael','Kalau menunggu, halaman lain ikut hilang.']]},
   {t:'Periksa rak-rak dulu, cari petunjuk.',set:{waspada:1},say:[['Makoto','Setuju. Kita tidak tahu apa yang menunggu di bawah.']]}
  ]},
  ['Narator','Selembar halaman raksasa melayang bangkit, putih tanpa satu pun kata.']
 ],
 outro:[
  ['Yu','Di sampul buku terakhir ada satu kata: "VOID".'],
  ['Kael','Itu... bukan sekadar kata. Itu dunia asalku.'],
  ['Naoya','Kalau dunia asalmu ikut tertulis di sini, mungkin kau bukan tersesat secara kebetulan.']
 ]},

/* 12 */{t:'Gema Mikage-cho',boss:'Mikage Phantom',
 intro:[
  ['Narator','Sebuah pecahan dunia melayang di ruang Archive: jalanan malam Mikage-cho yang sepi.'],
  ['Naoya','Ini rumahku. Atau sisanya. Aku tidak mau melihat apa yang ada di dalamnya.'],
  {choice:[
   {t:'"Aku di sini. Kita lihat sama-sama."',set:{naoya_bond:1},say:[['Naoya','...Terima kasih. Rasanya tidak seberat itu kalau ada yang menemani.']]},
   {t:'"Kalau terlalu berat, tunggu di luar."',say:[['Naoya','Tidak. Ini pertarunganku juga.']]}
  ]},
  ['Narator','Dari balik bayangan, sosok yang meniru Naoya muncul dengan senyum dingin.'],
  ['Naoya','Itu bukan aku. Itu semua keraguan yang kubawa dari dunia itu.']
 ],
 outro:[
  {if:'naoya_bond',then:[['Naoya','Aku tidak lagi lari dari masa laluku. Kau yang membuatku berani.']],else:[['Naoya','Aku menang sendiri. Tapi kehadiran kalian terasa di belakangku.']]},
  ['Narator','Pecahan Mikage-cho berubah menjadi kunci kecil dan terbang ke tangan Kael.'],
  ['Kael','Setiap dunia menyimpan kunci. Mereka mengarah ke tempat yang sama.']
 ]},

/* 13 */{t:'Rumor Menjadi Nyata',boss:'Rumor Incarnate',
 intro:[
  ['Tatsuya','Aku mendengar sesuatu yang tidak kusukai. Rumor bahwa Kael-lah penyebab semua kiamat ini.'],
  ['Kael','Aku? Aku bahkan tidak tahu siapa aku sebenarnya!'],
  ['Tatsuya','Di dunia ini rumor jadi nyata. Kalau semua orang percaya, rumor itu akan menjadi kenyataan.'],
  {choice:[
   {t:'"Bantah rumor itu. Cari siapa penyebarnya."',set:{berani:1},say:[['Tatsuya','Aku suka caramu. Tindakan langsung.']]},
   {t:'"Biar kubuktikan lewat perbuatan."',set:{waspada:1},say:[['Tatsuya','Pilihan yang dewasa. Tapi musuh tidak menunggu.']]}
  ]},
  ['Narator','Ribuan bisikan berkumpul membentuk satu tubuh hitam bermata banyak.']
 ],
 outro:[
  ['Tatsuya','Rumor lenyap, tapi sumbernya tidak. Seseorang menyebarkannya dari dalam Archive.'],
  ['Makoto','Aku tahu satu orang yang menyimpan semua catatan di sini.'],
  ['Kael','Nyx. Dia menyimpan sesuatu dari kita.']
 ]},

/* 14 */{t:'Jam ke-25',boss:'Twilight Chronos',
 intro:[
  ['Narator','Waktu di Archive membeku. Jam raksasa berdetak sekali, lalu berhenti lagi.'],
  ['Makoto','Ini jam ke-25 yang pernah kuceritakan. Waktu di antara waktu.'],
  ['Makoto','Aku pernah berdamai dengan akhir hidupku. Rasanya sama sunyinya, tapi kali ini aku tidak sendirian.'],
  ['Kael','Kita lewati bersama.'],
  ['Narator','Sosok berjubah jam pasir turun dari langit, membawa pendulum seukuran gedung.']
 ],
 outro:[
  ['Makoto','Chronos tidak mengendalikan waktu. Dia dijaga seseorang yang punya kuasa menulis ulang masa lalu.'],
  ['Kael','Menulis ulang masa lalu...'],
  ['Narator','Pendulum jatuh ke lantai, memperlihatkan sebuah memori: seorang anak berdiri di depan buku tebal, tangannya gemetar.']
 ]},

/* 15 */{t:'Kabut Tak Bernama',boss:'Fog Reaper',
 intro:[
  ['Narator','Kabut kembali, kali ini lebih tebal. Di dalamnya, bayangan dari masa lalu Kael berdiri tanpa wajah.'],
  ['Yu','Kabut menampilkan hal yang kau takuti. Jangan lawan sendirian.'],
  ['Kael','Aku melihat... diriku sendiri membuka sebuah buku di tengah gelap.'],
  {choice:[
   {t:'Hadapi ingatan itu.',set:{ingat:1},say:[['Kael','Aku harus tahu. Apa pun yang terjadi, itu bagian dariku.']]},
   {t:'Tolak, fokus pada pertarungan.',say:[['Yu','Tidak apa-apa. Ingatan itu akan menunggu sampai kau siap.']]}
  ]},
  ['Narator','Sosok penyabit berselimut kabut mengayun, memotong jalan setapak di depan mereka.']
 ],
 outro:[
  {if:'ingat',then:[['Kael','Aku ingat sekarang. Aku bukan hanya penghuni Void. Aku yang pertama kali membuka buku itu.']],else:[['Kael','Ada sesuatu yang kulupakan. Dan aku mulai takut mengingatnya.']]},
  ['Yu','Siapa pun dirimu dulu, kau Kael yang sekarang. Itu yang kami percaya.'],
  ['Narator','Kabut terbelah, memperlihatkan pintu emas dengan lambang mata terbuka.']
 ]},

/* 16 */{t:'Istana Pencuri',boss:'Velvet Sovereign',
 intro:[
  ['Ren','Pintu emas itu... aku mengenal aroma ini. Istana. Tempat keinginan seseorang dibentuk.'],
  ['Ren','Penguasanya mengoleksi cerita orang lain dan menyimpannya di brankas.'],
  ['Kael','Mengoleksi cerita?'],
  ['Ren','Dan itu berarti ada sesuatu yang bisa kita curi kembali. Kael, ikut aku. Waktunya jadi pencuri.'],
  ['Narator','Aula berlapis beludru merah terbuka. Di singgasana duduk sosok bermahkota halaman buku.']
 ],
 outro:[
  ['Ren','Brankasnya terbuka. Isinya halaman yang hilang dari dunia-dunia yang runtuh.'],
  ['Kael','Kita kembalikan semuanya.'],
  ['Narator','Satu halaman tersisa di tangan Kael. Tulisannya berbunyi: "Kael bukan korban. Kael adalah pembaca pertama."']
 ]},

/* 17 */{t:'Pemakan Ingatan',boss:'Memory Eater',
 intro:[
  ['Narator','Semua ingatan Kael tentang perjalanan sebelum Archive mulai terkoyak, ditarik oleh sesuatu dari kegelapan.'],
  ['Kael','Wajah mereka... nama mereka... aku tidak ingat lagi!'],
  ['Naoya','Pegang tanganku! Jangan biarkan kau lupa siapa dirimu!'],
  ['Makoto','Ingatan bisa dibangun lagi. Tapi hanya kalau kau bertahan.'],
  {choice:[
   {t:'"Aku tidak akan menyerah pada kegelapan ini."',set:{berani:1},say:[['Kael','Setiap ingatanku, akan kuambil kembali.']]},
   {t:'"Aku butuh kalian untuk mengingatkanku."',set:{percaya:1},say:[['Tatsuya','Itu fungsi tim. Kami di sini.']]}
  ]},
  ['Narator','Makhluk berwujud rahang dan halaman menganga, melahap bayangan di sekitarnya.']
 ],
 outro:[
  ['Kael','Aku ingat. Dulu aku punya dunia. Dan aku membuangnya.'],
  ['Yu','Membuangnya?'],
  ['Kael','Aku menulis ending yang tidak bisa dihapus. Untuk melupakan seseorang yang hilang.']
 ]},

/* 18 */{t:'Pengkhianatan Nyx',boss:'Nyx Unbound',
 intro:[
  ['Narator','Nyx berdiri di tengah aula, tak lagi mengenakan topeng penjaga.'],
  ['Nyx','Aku tidak menutup dunia karena membenci kalian. Aku menutupnya agar sang Penulis tidak bisa membacanya.'],
  ['Kael','Sang Penulis? Jadi kau tahu siapa dalangnya sejak awal!'],
  ['Nyx','Dan aku tahu satu hal lagi: kau tidak bisa bertemu dengannya tanpa mengorbankan sesuatu.'],
  ['Ren','Dia tidak akan membiarkan kita lewat. Bersiap!'],
  {if:'percaya',then:[['Kael','Nyx, aku percaya kau punya alasan. Tapi aku harus lewat.']],else:[['Kael','Alasanmu tidak cukup. Minggir!']]}
 ],
 outro:[
  ['Nyx','Kalian... benar-benar keras kepala. Seperti dia dulu.'],
  ['Nyx','Terimalah kunci ini. Perpustakaan Terlarang ada di bawah menara. Di sana naskah asli disimpan.'],
  ['Narator','Nyx menghilang dalam butiran cahaya, meninggalkan kunci hitam bertuliskan "INDEX".']
 ]},

/* 19 */{t:'Perpustakaan Terlarang',boss:'Forbidden Index',
 intro:[
  ['Narator','Lorong tak berujung dipenuhi buku yang dirantai. Setiap sampul memuat nama dunia yang pernah ada.'],
  ['Yu','Tempat ini lebih tua dari Archive itu sendiri.'],
  ['Tatsuya','Dan setiap buku di sini terasa seperti dilarang untuk dibuka.'],
  ['Kael','Naskah yang kita cari ada di ujung lorong ini.'],
  ['Narator','Sebuah katalog raksasa dengan ribuan mata terbuka menghalangi jalan.']
 ],
 outro:[
  ['Makoto','Katalog itu menyimpan lokasi semua naskah. Sekarang kita punya petanya.'],
  ['Ren','Sebuah ruangan dengan segel tak terbaca. Itu pasti tujuannya.'],
  ['Kael','Dunia yang tak tertulis ada di baliknya.']
 ]},

/* 20 */{t:'Dunia yang Tak Tertulis',boss:'Unwritten Beast',
 intro:[
  ['Narator','Mereka melangkah ke ruang putih tanpa lantai, tanpa langit. Hanya kekosongan.'],
  ['Naoya','Tempat apa ini? Tidak ada apa pun!'],
  ['Kael','Ini dunia yang tidak sempat ditulis. Dan penghuninya... marah.'],
  ['Narator','Makhluk dari kekosongan meraung, tubuhnya terbentuk dari kalimat yang terhapus.'],
  {choice:[
   {t:'"Beri dia nama. Beri dia cerita."',set:{percaya:1},say:[['Yu','Pendekatan unik. Tapi kita tetap harus bertahan hidup.']]},
   {t:'"Kita hancurkan dia sebelum menelan kita."',set:{berani:1},say:[['Tatsuya','Pilihan praktis. Mari bergerak.']]}
  ]}
 ],
 outro:[
  ['Narator','Makhluk itu memudar, meninggalkan secarik kertas bertuliskan satu kalimat: "Aku hanya ingin ditulis."'],
  ['Kael','Dunia yang tak tertulis bukan musuh. Mereka hanya dilupakan.'],
  ['Ren','Dan seseorang melakukannya dengan sengaja.']
 ]},

/* 21 */{t:'Sang Penulis Pertama',boss:'Ink Scribe',
 intro:[
  ['Narator','Di ujung ruang putih berdiri meja tulis raksasa dengan pena menggantung tanpa penulis.'],
  ['Suara','"Selamat datang. Aku sudah lama menunggu pembacaku kembali."'],
  ['Kael','Kau... Penulisnya?'],
  ['Suara','"Bukan. Aku hanya pelayannya. Dia sedang tertidur di ujung cerita ini."'],
  ['Naoya','Pelayan atau bukan, jangan biarkan dia mendekati Kael!'],
  ['Narator','Sosok berjubah hitam penuh tinta mengangkat pena, siap menulis ulang kenyataan.']
 ],
 outro:[
  ['Ink Scribe','"Kau masih belum mengerti, Kael. Penulis itu tidak jahat. Dia hanya tidak bisa mengakhiri ceritanya."'],
  ['Kael','Kenapa dia tidak bisa mengakhirinya?'],
  ['Ink Scribe','"Karena akhir yang ia tulis tidak pernah ia inginkan."']
 ]},

/* 22 */{t:'Tinta Hitam',boss:'Inkborn Titan',
 intro:[
  ['Narator','Tinta hitam menggenangi seluruh ruang putih, membentuk gelombang setinggi menara.'],
  ['Makoto','Tinta itu hidup! Dan terus bertambah!'],
  ['Yu','Tinta itu adalah semua akhir yang tidak ia inginkan.'],
  ['Ren','Berarti kalau kita kalahkan raksasa ini, kita memotong sumber tintanya.'],
  ['Kael','Ayo selesaikan. Satu langkah lagi menuju sang Penulis.']
 ],
 outro:[
  ['Narator','Raksasa tinta ambruk menjadi kolam hitam, lalu menguap dan menyisakan tangga putih menuju atas.'],
  ['Tatsuya','Tangga itu mengarah ke puncak Archive.'],
  ['Naoya','Apa pun yang menunggu di sana, kita hadapi bersama.']
 ]},

/* 23 */{t:'Akhir Palsu',boss:'False Ending',
 intro:[
  ['Narator','Di puncak tangga, mereka masuk ke dunia yang hangat: matahari terbit, kota hidup kembali, semua orang tersenyum.'],
  ['Naoya','Ini... Mikage-cho yang dulu. Semua orang selamat.'],
  ['Yu','Inaba, tanpa kabut. Teman-temanku ada di sini.'],
  ['Suara','"Tinggallah. Di sini tak ada kehilangan. Tak ada perang."'],
  {choice:[
   {t:'"Ini palsu. Kami tidak akan tinggal."',set:{tolak_akhir:1},say:[['Kael','Kebahagiaan yang tidak nyata bukan kebahagiaan.']]},
   {t:'"...Satu menit lagi. Aku ingin melihatnya."',say:[['Ren','Kael, jangan! Itu jebakan!']]}
  ]},
  ['Narator','Dunia manis itu pecah, memperlihatkan wujud aslinya: ending sempurna yang dipaksakan.']
 ],
 outro:[
  {if:'tolak_akhir',then:[['Kael','Aku menolak akhir palsu itu sejak langkah pertama.']],else:[['Kael','Aku hampir percaya. Terima kasih sudah menarikku kembali.']]},
  ['Yu','Ending itu dibuat seseorang yang sangat kesepian.'],
  ['Narator','Di balik dunia palsu itu, sebuah pintu terakhir terbuka.']
 ]},

/* 24 */{t:'Naskah Terakhir',boss:'First Reader',
 intro:[
  ['Narator','Di balik pintu, seorang pemuda duduk di tengah lautan buku, wajahnya persis seperti Kael.'],
  ['First Reader','Akhirnya kau datang. Aku sudah menunggu lama.'],
  ['Kael','Kau... aku?'],
  ['First Reader','Aku adalah bagianmu yang tidak mau melupakan. Dulu kau membuang aku ke Void agar bisa melangkah. Dan aku menjaga naskah ini.'],
  ['First Reader','Aku tidak bisa membiarkanmu mengubah akhirnya. Kalau kau menang, aku akan lenyap.'],
  ['Kael','Maaf. Tapi aku harus lewat.']
 ],
 outro:[
  ['First Reader','Kau tumbuh. Aku... bangga.'],
  ['Kael','Aku tidak akan membuangmu lagi. Aku bawa kau bersamaku.'],
  ['Narator','Pemuda itu tersenyum, lalu memudar menjadi cahaya yang masuk ke dada Kael.'],
  ['Suara','"Naskah terakhir terbuka. Tinggal satu halaman."']
 ]},

/* 25 */{t:'Akhir dari Segalanya',boss:'Author of Void',
 intro:[
  ['Narator','Halaman terakhir Archive terbuka. Di tengah ruang tanpa batas, sang Penulis berdiri dengan wujud bayangan raksasa.'],
  ['Author of Void','Kau sudah tahu semuanya. Dunia-dunia ini lahir dari kehilanganku. Setiap kiamat adalah air mata.'],
  ['Kael','Dan kau terus menulis agar tidak perlu menghadapi akhirnya.'],
  ['Ren','Semua protagonis, satu tujuan. Kita tulis akhir yang kita pilih sendiri!'],
  ['Yu','Ikatan kita tidak bisa kau hapus.'],
  ['Makoto','Aku sudah pernah menerima akhir. Aku tidak takut.'],
  ['Tatsuya','Ceritamu sudah cukup panjang. Biarkan orang lain menulis sisanya.'],
  ['Naoya','Kami bukan karaktermu. Kami penulis hidup kami sendiri.'],
  ['Kael','Ini bukan sekadar pertarungan. Ini permintaan maaf, dan perpisahan.'],
  ['Author of Void','Kalau begitu... tunjukkan padaku akhir yang lebih baik.']
 ],
 outro:[
  ['Narator','Sang Penulis berlutut, bayangannya menyusut menjadi sosok manusia biasa yang menangis.'],
  ['Author of Void','Aku hanya... tidak mau sendirian lagi.'],
  ['Kael','Kau tidak sendirian. Kami akan membaca ceritamu, sampai halaman terakhir.'],
  {if:'tolak_akhir',then:[['Narator','Karena sejak awal Kael menolak akhir palsu, dunia tertulis ulang dengan akhir yang jujur dan hangat.']],else:[['Narator','Meski sempat goyah, Kael memilih akhir yang nyata. Dunia tertulis ulang dengan segala luka dan harapannya.']]},
  {if:'percaya',then:[['Narator','Kepercayaan Kael pada rekan-rekannya mengikat semua dunia dengan benang yang tak bisa putus.']],else:[['Narator','Keteguhan Kael menjadi pelita bagi semua dunia yang pernah hilang.']]},
  ['Narator','Archive terbuka lebar. Dunia-dunia yang hilang kembali satu per satu, halaman demi halaman.'],
  ['Ren','Kita menang. Dan ceritanya masih berlanjut.'],
  ['Kael','Kita tulis sisanya bersama.'],
  ['Suara','"Welcome to Multiverse Archive... Every ending is a new beginning. THE END."']
 ]}
);

/* ================= DATA BOSS (kelemahan, phase, ultimate) ================= */
(()=>{
 G.BOSS2=G.BOSS2||{};
 const PAT=[['atk','atk','aoe','charge'],['atk','heavy','debuff','charge'],['heavy','aoe','drain','charge'],['heavy','aoe','heavy','charge']];
 const AT={2:[1,.5],3:[1,.66,.33],4:[1,.7,.45,.2]};
 /* mk(nama, weak[], res[], ultimate, teks aoe, [nama phase], {mech:['barrier'|'reflect'|'revive'|null,...], refl:'elemen', acts:aksi phase terakhir}) */
 const mk=(n,weak,res,ult,aoeN,names,o)=>{o=o||{};const at=AT[names.length]||AT[3],mech=o.mech||[];
  G.BOSS2[n]={weak,res,imm:[],aoeN,ult:{n:ult,m:2.4},
   phases:names.map((pn,k)=>{const ph={at:at[k],n:pn,atkm:+(1+.2*k).toFixed(2),pat:PAT[Math.min(k,3)]};
    if(mech[k]){ph.mech=mech[k];if(mech[k]=='reflect')ph.refl=o.refl||'fire'}
    if(k>0)ph.msg='Pola serangannya berubah!';
    if(o.acts&&k==names.length-1)ph.acts=o.acts;
    if(k==names.length-1&&names.length>=3)ph.finish=1;
    return ph})}};
 /* chapter 11-25 */
 mk('Blank Page',['fire'],['bless'],'Void Erase','menghapus semua',['Halaman Kosong','Tinta Menghitam'],{mech:[null,'barrier']});
 mk('Mikage Phantom',['bless'],['curse'],'Mikage Requiem','menyapu semua',['Bayangan Ragu','Wujud Asli'],{mech:[null,'reflect'],refl:'fire'});
 mk('Rumor Incarnate',['elec'],['wind'],'Seribu Bisikan','membisikkan semua',['Rumor Pertama','Rumor Nyata'],{mech:[null,'barrier']});
 mk('Twilight Chronos',['ice'],['elec'],'Time Collapse','mengguncang waktu',['Pendulum Pertama','Waktu Membeku'],{mech:[null,'reflect'],refl:'elec'});
 mk('Fog Reaper',['wind'],['ice'],'Reaper\'s Harvest','menyabit semua',['Kabut Tipis','Kabut Maut'],{mech:[null,'revive']});
 mk('Velvet Sovereign',['phys'],['fire'],'Royal Heist','merampok semua',['Raja Beludru','Mahkota Halaman','Sang Kolektor'],{mech:[null,'barrier','reflect'],refl:'phys'});
 mk('Memory Eater',['curse'],['bless'],'Memory Devour','melahap semua',['Rahang Lapar','Ingatan Terkoyak','Lupa Segalanya'],{mech:['barrier',null,'revive']});
 mk('Nyx Unbound',['bless'],['curse'],'Midnight Seal','menyegel semua',['Penjaga Menara','Segel Terlepas','Nyx Sejati'],{mech:[null,'reflect','barrier'],refl:'curse',acts:2});
 mk('Forbidden Index',['fire'],['ice'],'Index Burn','membakar semua',['Katalog Terlarang','Mata Seribu','Indeks Terakhir'],{mech:['barrier',null,'reflect'],refl:'ice'});
 mk('Unwritten Beast',['elec'],['phys'],'Blank Roar','meraung kosong',['Raungan Hampa','Kalimat Terhapus','Dunia Tak Bernama'],{mech:[null,'revive','barrier'],acts:2});
 mk('Ink Scribe',['wind'],['curse'],'Rewrite Reality','menulis ulang semua',['Pelayan Tinta','Pena Terlarang','Tulisan Terakhir'],{mech:['barrier',null,'reflect'],refl:'wind'});
 mk('Inkborn Titan',['ice'],['fire'],'Ink Tsunami','menenggelamkan semua',['Gelombang Hitam','Raksasa Tinta','Banjir Akhir'],{mech:[null,'barrier','revive'],acts:2});
 mk('False Ending',['bless'],['phys'],'Perfect Ending','mengaburkan semua',['Senyum Palsu','Dunia Sempurna','Kebenaran Retak'],{mech:['reflect',null,'barrier'],refl:'bless',acts:2});
 mk('First Reader',['curse'],['wind'],'Final Chapter','menutup semua',['Pembaca Pertama','Bayangan Kael','Kenangan Terakhir'],{mech:[null,'reflect','revive'],refl:'curse',acts:2});
 mk('Author of Void',['phys'],['bless'],'World Rewrite','menghapus semua dunia',['Penulis','Akhir Palsu','Void Mutlak','Tinta Terakhir'],{mech:[null,'barrier','reflect','revive'],refl:'fire',acts:2});
 /* boss side chapter */
 mk('Penjaga Arsip',['elec'],['curse'],'Archive Lockdown','mengunci semua',['Penjaga Pertama','Mode Pengamanan'],{mech:[null,'barrier']});
 mk('Bayangan Pustakawan',['fire'],['wind'],'Overdue Fine','menghukum semua',['Pustakawan','Denda Terakhir'],{mech:[null,'reflect'],refl:'ice'});
 mk('Penjaga Gerbang',['ice'],['elec'],'Gate Crash','menghancurkan semua',['Gerbang Terkunci','Gerbang Terbuka'],{mech:['barrier',null]});
 mk('Ratu Debu',['wind'],['bless'],'Dust Storm','menyapu semua',['Ratu Debu','Badai Debu'],{mech:[null,'barrier']});
 mk('Golem Halaman',['fire'],['phys'],'Paper Crush','meremukkan semua',['Golem Kertas','Golem Berlapis'],{mech:['barrier','revive']});
 mk('Pemburu Bayangan',['bless'],['curse'],'Shadow Hunt','memburu semua',['Pemburu','Perburuan Akhir'],{mech:[null,'reflect'],refl:'curse'});
 mk('Dalang Boneka',['elec'],['wind'],'Puppet Show','mempertunjukkan semua',['Dalang','Panggung Terakhir','Tali Putus'],{mech:[null,'barrier','revive']});
 /* boss dungeon */
 mk('Penjaga Latihan',['phys'],['bless'],'Training Rush','menyerbu semua',['Instruktur','Latihan Berat'],{mech:[null,'barrier']});
 mk('Penjaga Brankas',['elec'],['phys'],'Vault Slam','menghantam semua',['Penjaga Brankas','Kunci Ganda'],{mech:['barrier','reflect'],refl:'phys'});
 mk('Penjaga Harta',['wind'],['fire'],'Treasure Storm','menyapu semua',['Penjaga Harta','Naga Emas','Penjaga Terakhir'],{mech:[null,'revive','barrier']});
 mk('Penguasa Jurang',['curse'],['bless'],'Abyss Maw','menelan semua',['Penguasa','Jurang Terbuka','Hampa Abadi'],{mech:['barrier','reflect','revive'],refl:'bless',acts:2});
})();

/* ================= SIDE CHAPTER =================
   after = muncul setelah chapter ke-N selesai   n = jumlah musuh   elite:1 = musuh pertama mini boss
   boss = nama boss dari G.BOSS2   rw = hadiah {yen, items(Potion), sp(SP Drink)} */
G.SIDE2=[
 {id:'sx1',t:'Surat dari Dunia Lain',after:1,n:2,rw:{yen:150,items:1},
  d:[['Narator','Sebuah surat melayang turun dari rak Archive, ditulis dengan tulisan tangan yang gemetar.'],['Kael','"Tolong... bayangan di lantai tiga mengambil bukuku." Ayo bantu mereka.']]},
 {id:'sx2',t:'Kucing di Perpustakaan',after:2,n:2,rw:{yen:200,sp:1},
  d:[['Narator','Seekor kucing hitam berlari melewati kaki Kael membawa selembar halaman.'],['Kael','Dia dikejar bayangan! Kita tolong dia!']]},
 {id:'sx3',t:'Jejak Kaki di Kabut',after:4,n:2,elite:1,rw:{yen:300,items:1},
  d:[['Naoya','Ada jejak kaki besar menuju kabut. Bukan musuh biasa.'],['Kael','Hati-hati. Elite sedang berkeliaran.']]},
 {id:'sx4',t:'Pedagang Tinta',after:5,n:2,rw:{yen:350,items:2},
  d:[['Narator','Seorang pedagang tua menjajakan botol tinta berpendar di lorong sepi.'],['Pedagang','Tolong usir makhluk-makhluk itu dan kuberi hadiah.']]},
 {id:'sx5',t:'Pesta Bayangan',after:7,n:3,elite:1,rw:{yen:500,items:2,sp:1},
  d:[['Tatsuya','Kudengar pesta bayangan digelar di aula tengah malam.'],['Ren','Kita tidak diundang. Tapi kita akan datang.']]},
 {id:'sx6',t:'Cermin Retak',after:8,n:2,elite:1,rw:{yen:600,items:1},
  d:[['Yu','Cermin ini memantulkan masa lalu yang pecah. Jangan lihat terlalu lama.'],['Kael','Terlambat. Ada yang keluar dari sana!']]},
 {id:'sx7',t:'Latihan Para Protagonis',after:9,n:3,elite:1,rw:{yen:700,sp:2},
  d:[['Ren','Sebelum menghadapi hal besar, kita perlu latihan.'],['Makoto','Aku setuju. Lawan kita kali ini cukup tangguh.']]},
 {id:'sx8',t:'Ruang Arsip Rahasia',after:11,boss:'Penjaga Arsip',rw:{yen:900,items:2},
  d:[['Nyx','Ada ruang arsip tersembunyi di sayap barat. Penjaganya masih patuh pada perintah lama.'],['Kael','Kalau begitu kita buka paksa pintunya.']]},
 {id:'sx9',t:'Hujan Tinta',after:13,n:3,rw:{yen:1000,items:2,sp:1},
  d:[['Narator','Hujan tinta hitam turun di Archive, mewarnai rak-rak buku.'],['Makoto','Makhluk bertinta bermunculan. Lindungi arsipnya!']]},
 {id:'sx10',t:'Gerbang Terkunci',after:15,boss:'Penjaga Gerbang',rw:{yen:1300,items:2,sp:1},
  d:[['Yu','Gerbang ini tidak ada di peta. Dan dijaga seseorang.'],['Naoya','Dia tidak berniat membukanya begitu saja.']]},
 {id:'sx11',t:'Tamu Tak Diundang',after:18,n:3,elite:1,rw:{yen:1600,items:3},
  d:[['Ren','Ada yang menyelinap masuk ke Archive. Banyak, dan bukan manusia.'],['Kael','Kita bereskan sebelum mereka mencapai menara.']]},
 {id:'sx12',t:'Kenangan yang Tersisa',after:20,boss:'Bayangan Pustakawan',rw:{yen:2000,items:2,sp:2},
  d:[['Narator','Pustakawan lama Archive muncul sebagai bayangan, masih menjaga buku yang tersisa.'],['Kael','Kami datang membawa buku-buku itu pulang. Biarkan kami lewat.']]},
 {id:'sx13',t:'Janji Terakhir',after:23,n:3,elite:1,rw:{yen:3000,items:3,sp:3},
  d:[['Narator','Sebelum pertarungan terakhir, para protagonis berkumpul di aula Archive.'],['Kael','Satu pertempuran lagi sebelum akhir. Mari kita buktikan kita siap.']]}
];

/* ===== SIDE CHAPTER TAMBAHAN (sx14 - sx30) ===== */
G.SIDE2.push(
 {id:'sx14',t:'Penjaga Rak Berdebu',after:1,n:2,rw:{yen:180,items:1},
  d:[['Narator','Di sudut Archive, rak-rak tua tertutup debu tebal. Sesuatu bergerak di baliknya.'],['Kael','Ada bayangan kecil di sana. Kita periksa.']]},
 {id:'sx15',t:'Lampu yang Padam',after:3,n:2,rw:{yen:320,items:1,sp:1},
  d:[['Naoya','Semua lampu di lorong timur padam sekaligus. Itu bukan kebetulan.'],['Kael','Ada yang suka gelap. Kita nyalakan lagi.']]},
 {id:'sx16',t:'Bisikan di Lorong',after:3,n:3,rw:{yen:380,items:1},
  d:[['Naoya','Kau dengar? Seperti seseorang memanggil namaku dari ujung lorong.'],['Kael','Jangan ikuti suaranya. Itu umpan.']]},
 {id:'sx17',t:'Taruhan Tatsuya',after:6,n:2,elite:1,rw:{yen:650,items:1,sp:1},
  d:[['Tatsuya','Aku bertaruh kita bisa menumbangkan elite itu tanpa luka berarti.'],['Kael','Taruhanmu kalah kalau aku terluka duluan.'],['Tatsuya','Menarik. Kita lihat.']]},
 {id:'sx18',t:'Jam yang Berdetak Sendiri',after:6,n:3,rw:{yen:600,items:2},
  d:[['Makoto','Ada jam kecil berdetak di bawah lantai. Padahal waktu di sini tidak bergerak.'],['Kael','Pasti ada yang mengacaukannya. Kita hentikan.']]},
 {id:'sx19',t:'Teh di Tengah Kabut',after:8,n:2,elite:1,rw:{yen:800,items:2},
  d:[['Yu','Aku menemukan teko dan cangkir di tengah kabut. Seseorang sedang menunggu.'],['Kael','Dan sepertinya tamunya tidak ramah.']]},
 {id:'sx20',t:'Duel Latihan Ren',after:10,n:3,elite:1,rw:{yen:1100,items:2,sp:1},
  d:[['Ren','Kael, mau menguji kemampuan kita? Sebelum hal besar datang.'],['Kael','Selalu siap. Tapi musuhnya bukan kita, tentu saja.']]},
 {id:'sx21',t:'Pasar Malam Archive',after:10,boss:'Ratu Debu',rw:{yen:1400,items:2,sp:1},
  d:[['Narator','Pasar malam misterius berdiri di lantai tujuh. Penjualnya bukan manusia.'],['Ren','Ratu pasar ini tidak suka pembeli yang cuma melihat-lihat.']]},
 {id:'sx22',t:'Gema Rumah Lama',after:12,n:3,rw:{yen:1200,items:2},
  d:[['Naoya','Pecahan Mikage-cho masih menyisakan gema suara orang-orang.'],['Kael','Biar mereka tenang. Kita bereskan sisa bayangannya.']]},
 {id:'sx23',t:'Kereta Tanpa Penumpang',after:14,n:2,elite:1,rw:{yen:1500,items:2,sp:1},
  d:[['Makoto','Sebuah kereta berhenti di stasiun Archive. Tidak ada penumpang, tapi terdengar langkah.'],['Yu','Naik atau tidak?'],['Kael','Kita periksa dari luar dulu. Hati-hati.']]},
 {id:'sx24',t:'Golem di Gudang Buku',after:16,boss:'Golem Halaman',rw:{yen:1900,items:3,sp:1},
  d:[['Ren','Gudang buku bawah tanah dijaga golem raksasa dari tumpukan halaman.'],['Tatsuya','Kertas bisa terbakar. Kau tahu apa yang harus dilakukan.']]},
 {id:'sx25',t:'Surat Tanpa Pengirim',after:17,n:3,elite:1,rw:{yen:1800,items:2,sp:1},
  d:[['Narator','Sepucuk surat tanpa nama pengirim ditemukan di ruang ingatan Kael.'],['Kael','Isinya hanya satu kalimat: "Jangan lupa pulang." Kita cari siapa yang mengirimnya.']]},
 {id:'sx26',t:'Pemburu di Lantai Gelap',after:19,boss:'Pemburu Bayangan',rw:{yen:2400,items:3,sp:2},
  d:[['Nyx','Ada pemburu yang mengincar halaman-halaman terlarang. Dia tidak akan berhenti.'],['Kael','Kalau begitu kita hentikan dia di sini.']]},
 {id:'sx27',t:'Kebun Tinta',after:21,n:3,elite:1,rw:{yen:2600,items:3},
  d:[['Yu','Di balik tangga ada kebun tempat tinta tumbuh seperti bunga.'],['Makoto','Dan setiap bunganya menjaga diri dengan kekuatan sendiri.']]},
 {id:'sx28',t:'Panggung Boneka',after:22,boss:'Dalang Boneka',rw:{yen:3200,items:3,sp:2},
  d:[['Narator','Tirai merah terbuka. Boneka-boneka berbentuk para protagonis menari di panggung.'],['Ren','Dalangnya pasti ada di belakang. Mari kita putus talinya.']]},
 {id:'sx29',t:'Pesta Perpisahan',after:24,n:3,elite:1,rw:{yen:3600,items:3,sp:2},
  d:[['Narator','Dunia-dunia yang pulih mengirim utusan ke Archive untuk berterima kasih.'],['Ren','Tapi sisa-sisa bayangan masih berkeliaran. Kita bersihkan dulu sebelum pesta.']]},
 {id:'sx30',t:'Ujian Para Penjaga',after:24,boss:'Penguasa Jurang',rw:{yen:5000,items:4,sp:3},
  d:[['Nyx','Satu ujian terakhir untuk membuktikan kalian layak menjaga Archive.'],['Kael','Kami sudah sejauh ini. Tidak akan mundur sekarang.']]}
);