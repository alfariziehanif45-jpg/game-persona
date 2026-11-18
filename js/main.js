window.G=window.G||{};G.spr=G.spr||(()=>"");G.slug=G.slug||(n=>String(n).toLowerCase());
/* ===== BAHASA (ID/EN/JP): fungsi aslinya ada di js/lang.js. Baris ini hanya pengaman kalau lang.js belum dimuat ===== */
G.T=G.T||(s=>s);G.cycleLang=G.cycleLang||(()=>{});G.langName=G.langName||(()=>'');
/* sprite KAEL ALTERNATE: kalau belum ada gambar assets/characters/altkael.png, otomatis pakai sprite Kael */
if(!G.spr.__alt){const _sp=G.spr;G.spr=function(a,k,...r){const v=_sp.call(this,a,k,...r);return(!v&&k==='altkael')?_sp.call(this,a,'kael',...r):v};G.spr.__alt=1}
/* ===== GABUNG DATA TAMBAHAN dari chapters.js (side chapter baru & boss chapter 11-25) ===== */
G.SIDE=G.SIDE||[];(G.SIDE2||[]).forEach(x=>{if(!G.SIDE.some(y=>y.id==x.id))G.SIDE.push(x)});
G.BOSSES=G.BOSSES||{};Object.keys(G.BOSS2||{}).forEach(k=>{if(!G.BOSSES[k])G.BOSSES[k]=G.BOSS2[k]});
/* ===== PEMBUAT MUSUH: G.mkEnemy hanya sampai chapter 10, jadi chapter 11+ di-skala di sini =====
   G.foe(nomorChapter, stage, boss?, namaBoss, {hp,atk,xp}) */
G.foe=(cn,st,boss,name,mult)=>{const e=G.mkEnemy(Math.min(cn,10),st,boss,name),x=cn>10?cn-10:0,m=Object.assign({hp:1,atk:1,xp:1},mult||{});
 const hm=m.hp*(1+x*.12),am=m.atk*(1+x*.09),xm=m.xp*(1+x*.10);
 if(hm!=1){if(e.hp!=null)e.hp=Math.round(e.hp*hm);if(e.max!=null)e.max=Math.round(e.max*hm)}
 if(am!=1&&e.atk!=null)e.atk=Math.max(1,Math.round(e.atk*am));
 if(xm!=1)e.xp=Math.round((+e.xp||10)*xm);
 return e};
/* musuh & hadiah side chapter */
G.sideFoes=s=>{const cn=Math.max(1,G.state.ch+1);if(s.boss)return[G.foe(cn,3,1,s.boss,{hp:.8,atk:.9,xp:1.5})];
 const a=[];for(let k=0;k<(s.n||1);k++)a.push(G.foe(cn,1+(k%3),0));if(s.elite&&a[0]){a[0].cat='elite';a[0].xp=Math.round((+a[0].xp||10)*1.8)}return a};
G.sideReward=s=>{const S=G.state,r=s.rw||{items:1},y=r.yen||0,it=r.items!=null?r.items:1,sp=r.sp||0;
 S.yen=(S.yen||0)+y;S.items=(S.items||0)+it;S.spitems=(S.spitems||0)+sp;
 return `SIDE CHAPTER SELESAI!\n+\u00a5${y} \u00b7 +${it} Potion`+(sp?` \u00b7 +${sp} SP Drink`:'')};

/* =====================================================================
   SKILL & PERSONA KHAS TIAP PROTAGONIS (BEDA-BEDA UNTUK SETIAP KARAKTER)
   ---------------------------------------------------------------------
   - Item di G.SKILLS / G.PERSONAS yang punya field  only:[idKarakter]
     hanya muncul di SHOP protagonis tersebut (ditandai \u2605 KHAS).
   - Edit tabel G.EXCL di bawah untuk menambah / mengganti set tiap karakter.
     Kunci = id karakter di G.CHARS (contoh: kael).
   - Karakter yang belum punya entri di G.EXCL otomatis diberi set khas
     sendiri (dipilih dari kumpulan pool berdasarkan id-nya), jadi tidak
     pernah sama persis antar karakter.
   - kind (jenis serangan) dicari otomatis dari G.KIND supaya aman.
   - t:'iblis' | 'malaikat'  (persona hadiah KAEL ALTERNATE memakai 'dewa' | 'pahlawan' | 'khusus')
   ===================================================================== */
G.kindOf=(re,fb)=>{const K=G.KIND||{},ks=Object.keys(K);return ks.find(k=>re.test(k+' '+K[k]))||fb||(G.SKILLS&&G.SKILLS[0]&&G.SKILLS[0].k)||ks[0]};
G.EXCL={
 /* ----- KAEL: Penjaga Arsip (halaman, tinta, takdir) ----- */
 kael:{
  skills:[
   {n:'Tebasan Arsip',kd:'phys',pow:46,sp:10,cd:1,price:380,d:'Tebasan cepat dari halaman Archive yang terkoyak.'},
   {n:'Segel Halaman',kd:'light',pow:60,sp:16,cd:2,price:560,d:'Menyegel musuh dengan cahaya dari halaman suci.'},
   {n:'Bab Terakhir',kd:'dark',pow:94,sp:30,cd:4,price:980,d:'Menutup bab hidup musuh dalam satu coretan tinta.'}],
  personas:[
   {n:'Thoth',e:'\u{1F4DC}',t:'malaikat',kd:'light',pow:82,sp:24,cd:3,price:1400,d:'Dewa juru tulis. Menuliskan hukuman cahaya ke seluruh musuh.'},
   {n:'Azazel',e:'\u{1F5A4}',t:'iblis',kd:'dark',pow:96,sp:28,cd:3,price:1600,d:'Iblis pembuang dosa. Melempar kutukan gelap berat ke musuh.'}]},
 /* ----- KAEL ALTERNATE: pahlawan yang menulis ulang takdir (dibuka lewat DEATH WORLD: Harapan dan Takdir) ----- */
 altkael:{
  skills:[
   {n:'Tebasan Takdir',kd:'phys',pow:70,sp:14,cd:1,price:900,d:'Tebasan dari takdir yang sudah ditulis ulang.'},
   {n:'Cahaya Harapan',kd:'light',pow:88,sp:22,cd:2,price:1200,d:'Sinar harapan yang membakar keputusasaan musuh.'},
   {n:'Epilog Semesta',kd:'dark',pow:110,sp:34,cd:4,price:1800,d:'Menulis epilog bagi musuh. Tidak ada bab sesudahnya.'}],
  personas:[]},
 /* ----- CONTOH: tambahkan karakter lain dengan pola yang sama -----
 idkarakter:{
  skills:[{n:'Nama Skill',kd:'fire',pow:50,sp:12,cd:1,price:400,d:'Deskripsi.'}, ...],
  personas:[{n:'Nama Persona',e:'\u{1F525}',t:'iblis',kd:'fire',pow:90,sp:26,cd:3,price:1500,d:'Deskripsi.'}, ...]},
 */
};
/* pool cadangan: dipakai untuk karakter yang belum ada di G.EXCL */
G.EXCL_POOL={
 skills:[
  {n:'Tinju Badai',kd:'phys',pow:48,sp:10,cd:1,price:380,d:'Rentetan pukulan beruntun yang mematahkan guard.'},
  {n:'Api Janji',kd:'fire',pow:58,sp:15,cd:2,price:540,d:'Bola api bertekad yang membakar satu musuh.'},
  {n:'Embun Beku',kd:'ice',pow:56,sp:14,cd:2,price:520,d:'Kristal es menusuk dan melambatkan lawan.'},
  {n:'Sambaran Fajar',kd:'elec',pow:62,sp:16,cd:2,price:580,d:'Petir cepat dari langit pagi.'},
  {n:'Pusaran Senyap',kd:'wind',pow:54,sp:13,cd:1,price:500,d:'Bilah angin tanpa suara menyayat musuh.'},
  {n:'Lonceng Suci',kd:'light',pow:64,sp:18,cd:2,price:620,d:'Dentang suci yang menghantam musuh dengan cahaya.'},
  {n:'Bayang Kutukan',kd:'dark',pow:66,sp:19,cd:3,price:660,d:'Bayangan pekat yang menggerogoti jiwa lawan.'},
  {n:'Hantaman Meteor',kd:'fire',pow:90,sp:28,cd:4,price:940,d:'Menjatuhkan batu membara dari atas. Sangat kuat.'},
  {n:'Badai Kristal',kd:'ice',pow:88,sp:27,cd:4,price:920,d:'Hujan es tajam menghantam musuh.'},
  {n:'Tarian Pedang',kd:'phys',pow:84,sp:25,cd:3,price:880,d:'Rangkaian tebasan anggun bertenaga tinggi.'},
  {n:'Murka Langit',kd:'elec',pow:92,sp:29,cd:4,price:960,d:'Petir besar dari langit marah.'},
  {n:'Cahaya Penebus',kd:'light',pow:86,sp:26,cd:4,price:900,d:'Sinar penebus yang menghapus kesombongan musuh.'}],
 iblis:[
  {n:'Mephisto',e:'\u{1F608}',kd:'dark',pow:92,sp:27,cd:3,price:1500,d:'Iblis perjanjian. Menukar jiwa musuh dengan kehancuran.'},
  {n:'Surtr',e:'\u{1F525}',kd:'fire',pow:96,sp:28,cd:3,price:1600,d:'Raksasa api. Menyapu musuh dengan pedang membara.'},
  {n:'Loki',e:'\u{1F40D}',kd:'wind',pow:88,sp:25,cd:3,price:1450,d:'Dewa tipu daya. Serangan licik sulit dihindari.'},
  {n:'Fenrir',e:'\u{1F43A}',kd:'phys',pow:98,sp:29,cd:3,price:1650,d:'Serigala pemusnah. Cabikan buas ke musuh.'}],
 malaikat:[
  {n:'Raphael',e:'\u2728',kd:'light',pow:84,sp:24,cd:3,price:1400,d:'Malaikat penyembuh. Hukuman cahaya yang lembut tapi pasti.'},
  {n:'Michael',e:'\u2694\uFE0F',kd:'light',pow:92,sp:27,cd:3,price:1550,d:'Panglima langit. Pedang cahaya membelah musuh.'},
  {n:'Gabriel',e:'\u{1F4EF}',kd:'wind',pow:86,sp:25,cd:3,price:1450,d:'Pembawa terompet. Badai suci menghantam musuh.'},
  {n:'Uriel',e:'\u{1F31F}',kd:'elec',pow:90,sp:26,cd:3,price:1500,d:'Api cahaya Tuhan. Petir suci menyambar musuh.'}]};
G.ensureEx=()=>{
 if(G.EXOK||!G.CHARS)return;G.EXOK=1;G.SKILLS=G.SKILLS||[];G.PERSONAS=G.PERSONAS||[];

 if (G.loadExtraPersonas) G.loadExtraPersonas(); 
 
 /* daftarkan KAEL ALTERNATE sebagai protagonis (join:-1 = tidak pernah bergabung otomatis lewat cerita utama) */
 if(G.CHARS.kael&&!G.CHARS.altkael)G.CHARS.altkael=Object.assign({},G.CHARS.kael,{n:'Alternate Kael',join:-1,img:(G.dw&&G.dw.altImg)||(G.FIN&&G.FIN.altImg)||'assets/characters/altkael.png'});
 const add=(arr,o)=>{if(!arr.some(v=>v.id==o.id))arr.push(o)},
  mkS=(id,x,i,who)=>({id:id+'_xs'+i,n:x.n,k:G.kindOf(KRE[x.kd]||/phys/i),pow:x.pow,sp:x.sp,cd:x.cd||0,price:x.price,d:x.d,only:[who]}),
  mkP=(id,x,i,who)=>({id:id+'_xp'+i,n:x.n,e:x.e||'\u{1F300}',t:x.t,k:G.kindOf(KRE[x.kd]||/phys/i),pow:x.pow,sp:x.sp,cd:x.cd||0,price:x.price,d:x.d,only:[who]}),
  KRE={phys:/phys|fisik|slash|tebas|pukul/i,fire:/fire|api/i,ice:/\bice\b|\bes\b|beku/i,elec:/elec|petir|volt/i,wind:/wind|angin/i,light:/light|cahaya|suci|holy/i,dark:/dark|gelap|kutuk/i,heal:/heal|pulih/i};
 G.KRE=KRE;
 Object.keys(G.CHARS).forEach(id=>{
  let ex=G.EXCL[id];
  if(!ex){const h=[...id].reduce((a,c)=>(a*31+c.charCodeAt(0))|0,7)>>>0,P=G.EXCL_POOL,n=P.skills.length;
   ex={skills:[0,4,8].map(o=>P.skills[(h+o)%n]),
    personas:[Object.assign({t:'iblis'},P.iblis[h%4]),Object.assign({t:'malaikat'},P.malaikat[(h>>2)%4])]}}
  ex.skills.forEach((x,i)=>add(G.SKILLS,mkS(id,x,i,id)));
  ex.personas.forEach((x,i)=>add(G.PERSONAS,mkP(id,x,i,id)))});
 G.altInit&&G.altInit()};

/* =====================================================================
   KAEL ALTERNATE  (karakter rahasia, dibuka dari DEATH WORLD)
   ---------------------------------------------------------------------
   SYARAT BUKA : chapter "HARAPAN DAN TAKDIR" di DEATH WORLD berhasil dibuka/diselesaikan.
   HASIL       : otomatis masuk menu TEAM, Level 99, membawa persona bertema DEWA dan
                 PAHLAWAN DUNIA, plus persona khusus "NEW HERO" (otomatis DIBAWA).
   CARA PICU   : (1) otomatis, hub() memindai save & meta mencari tanda chapter itu selesai;
                 (2) pasti: panggil  G.unlockAltKael()  dari deathworld.js tepat saat chapter
                     "Harapan dan Takdir" terbuka / selesai, atau  G.onDeathWorldChapter(namaAtauId).
   ===================================================================== */
G.ALTRE=/harapan.*takdir|takdir.*harapan|hope.*(destiny|fate)|(destiny|fate).*hope/i;
G.ALTDONE=/clear|done|tuntas|win|selesai|beat|menang|open|buka|unlock/i;
/* persona hadiah (reward:true = tidak dijual di shop). t: dewa | pahlawan | khusus */
G.ALTP=[
 {id:'altkael_hp0',n:'New Hero',e:'\u{1F9B8}',t:'khusus',kd:'light',pow:140,sp:36,cd:4,d:'Persona khusus Kael Alternate. Wujud harapan dan takdir yang ditulis ulang: pahlawan baru yang menolak akhir cerita.'},
 {id:'altkael_hp1',n:'Amaterasu',e:'\u2600\uFE0F',t:'dewa',kd:'light',pow:104,sp:29,cd:3,d:'Dewi matahari Jepang. Cahaya fajar menghanguskan kegelapan.'},
 {id:'altkael_hp2',n:'Zeus',e:'\u26A1',t:'dewa',kd:'elec',pow:108,sp:30,cd:3,d:'Raja para dewa Olympus. Petir langit menyambar seluruh musuh.'},
 {id:'altkael_hp3',n:'Odin',e:'\u{1F441}\uFE0F',t:'dewa',kd:'wind',pow:100,sp:28,cd:3,d:'Bapa para dewa Asgard. Tombak Gungnir tak pernah meleset.'},
 {id:'altkael_hp4',n:'Susanoo',e:'\u26C8\uFE0F',t:'dewa',kd:'wind',pow:102,sp:28,cd:3,d:'Dewa badai pembunuh naga. Badai dan pedang dalam satu tebasan.'},
 {id:'altkael_hp5',n:'Hercules',e:'\u{1F4AA}',t:'pahlawan',kd:'phys',pow:106,sp:29,cd:3,d:'Pahlawan dua belas tugas. Kekuatan fisik tanpa tanding.'},
 {id:'altkael_hp6',n:'King Arthur',e:'\u{1F5E1}\uFE0F',t:'pahlawan',kd:'light',pow:104,sp:29,cd:3,d:'Raja pahlawan Camelot. Excalibur membelah kegelapan.'},
 {id:'altkael_hp7',n:'Achilles',e:'\u{1F6E1}\uFE0F',t:'pahlawan',kd:'phys',pow:102,sp:28,cd:3,d:'Pahlawan Troya tak terkalahkan. Hanya satu titik lemah.'},
 {id:'altkael_hp8',n:'Gilgamesh',e:'\u{1F451}',t:'pahlawan',kd:'phys',pow:110,sp:31,cd:3,d:'Raja pahlawan pertama dunia. Gerbang harta menghujani musuh.'},
 {id:'altkael_hp9',n:'Joan of Arc',e:'\u{1F525}',t:'pahlawan',kd:'fire',pow:98,sp:27,cd:3,d:'Pahlawan Orleans. Api iman yang membakar keraguan.'}];
/* daftarkan persona hadiah ke G.PERSONAS (dipanggil dari ensureEx) */
G.altInit=()=>{G.PERSONAS=G.PERSONAS||[];G.ALTP.forEach(x=>{if(G.PERSONAS.some(v=>v.id==x.id))return;
 const dk={light:'bless',dark:'curse'}[x.kd]||x.kd;
 G.PERSONAS.push({id:x.id,n:x.n,e:x.e,t:x.t,k:(G.KIND&&G.KIND[dk])?dk:G.kindOf((G.KRE||{})[x.kd]||/phys/i),pow:x.pow,sp:x.sp,cd:x.cd,price:0,d:x.d,only:['altkael'],reward:true})})};
/* buka Kael Alternate: Lv 99 + semua persona dewa/pahlawan + New Hero + skill khas, lalu otomatis DIBAWA */
G.unlockAltKael=quiet=>{const S=G.state;if(!S||!G.CHARS||!G.CHARS.kael)return false;
 G.ensureEx&&G.ensureEx();if(!G.CHARS.altkael)return false;G.altInit();
 const fresh=!S.lv.altkael;S.altk=1;if(!fresh)return false;
 S.lv.altkael={l:99,x:0};
 const o=G.own('altkael');o.per=o.per||[];o.skl=o.skl||[];
 G.ALTP.forEach(x=>{if(!o.per.includes(x.id))o.per.push(x.id)});
 [0,1,2].forEach(i=>{const id='altkael_xs'+i;if(G.SKILLS.some(v=>v.id==id)&&!o.skl.includes(id))o.skl.push(id)});
 /* auto-DIBAWA sampai batas slot: New Hero paling depan */
 try{[['persona',G.ALTP.map(x=>x.id)],['skill',[0,1,2].map(i=>'altkael_xs'+i)]].forEach(([kind,ids])=>{for(const id of ids){const r=G.toggleEq('altkael',kind,id);if(r&&r.ok===false)break}})}catch(e){}
 G.save&&G.save();
 if(!quiet)alert('KAEL ALTERNATE BERGABUNG!\nLv 99 \u00b7 Persona Dewa & Pahlawan Dunia \u00b7 Persona khusus: NEW HERO\nCek menu HUB > TEAM untuk memasukkannya ke tim.');
 return true};
/* dipanggil dari deathworld.js:  G.onDeathWorldChapter('Harapan dan Takdir')  atau id chapternya */
G.onDeathWorldChapter=v=>{const t=typeof v=='object'&&v?[v.id,v.t,v.n,v.name,v.title].filter(Boolean).join(' '):String(v||'');return G.ALTRE.test(t)?G.unlockAltKael():false};
/* pemindai otomatis: cari kunci/isi save yang menandakan chapter "Harapan dan Takdir" sudah dibuka/selesai */
G.altScan=(o,d)=>{if(!o||typeof o!='object'||d>4)return false;
 for(const k of Object.keys(o)){const v=o[k];
  if(G.ALTRE.test(k)&&v){if(typeof v!='object')return true;if(Object.keys(v).some(z=>G.ALTDONE.test(z)&&v[z]))return true}
  if(Array.isArray(o)&&typeof v=='string'&&G.ALTRE.test(v))return true;
  if(v&&typeof v=='object'&&G.altScan(v,d+1))return true}
 return false};
G.altCheck=()=>{const S=G.state;if(!S||!S.lv||!G.CHARS||!G.CHARS.kael)return;
 if(S.altk&&!S.lv.altkael){G.unlockAltKael(true);return}   /* save lama yang sudah ditandai tapi datanya hilang */
 /* syarat asli (deathworld.js): level HARAPAN & TAKDIR terbuka = FINALE Author tamat (G.meta.fin.won) dan Death World terbuka di save ini */
 const dw=G.dw,htOpen=dw&&dw.htOpen?dw.htOpen():!!(G.meta&&G.meta.fin&&G.meta.fin.won),dwOpen=dw&&dw.unlocked?dw.unlocked():S.ch>=G.CHAPTERS.length;
 if(!S.lv.altkael&&htOpen&&dwOpen)G.unlockAltKael()};
/* ===== LEVEL MAKSIMAL = 99 =====
   G.MAXLV dipakai di mana-mana. Ubah angkanya kalau mau batas lain.
   - G.need(99) = Infinity, jadi EXP tidak pernah cukup untuk naik lagi
   - semua level di save dipaksa maksimal 99 (juga sebelum tiap save) */
G.MAXLV=99;
G.capLv=()=>{
 if(G.need&&!G.need.__cap){const _n=G.need;G.need=l=>l>=G.MAXLV?Infinity:_n(l);G.need.__cap=1}
 if(G.save&&!G.save.__cap){const _s=G.save;G.save=function(...a){G.capLv();return _s.apply(this,a)};G.save.__cap=1}
 const S=G.state;if(S&&S.lv)Object.keys(S.lv).forEach(k=>{const v=S.lv[k];if(v&&v.l>=G.MAXLV){v.l=G.MAXLV;v.x=0}})};
/* ===== PHOENIX: skill bawaan Alternate Kael (pasif, selalu aktif) =====
   Saat HP-nya habis ia BANGKIT dengan sebagian HP dan menjadi LEBIH KUAT (ATK/DEF naik tiap bangkit).
   Batas bangkit = G.PHOENIX.max kali per battle. Setelah itu kematian berikutnya = gugur sungguhan.
   WIRING di battle.js: tepat saat sebuah unit sekutu HP-nya <= 0, panggil
       if(G.phoenix&&G.phoenix.tryRevive(unit))return;   // true = ia bangkit, jangan tandai mati
   Counter di-reset otomatis tiap G.battle dimulai. */
G.PHOENIX={max:5,heal:.5,atkUp:.15,defUp:.10};
G.phoenix={used:0,
 reset(){this.used=0},
 left(){return Math.max(0,G.PHOENIX.max-this.used)},
 isAlt(u){const id=u&&(u.id||u.k||u.key||u.ch||u.who),nm=u&&(u.n||u.name);return id==='altkael'||/alternate\s*kael|kael\s*alternate/i.test(String(nm||''))},
 tryRevive(u){if(!this.isAlt(u))return false;const P=G.PHOENIX;
  if(this.used>=P.max){u.phoenixDead=1;return false}      /* jatah habis: otomatis gugur */
  this.used++;
  const mk=['max','mhp','maxhp','hpMax','maxHp'].find(k=>typeof u[k]=='number'),m=mk?u[mk]:100;
  u.hp=Math.max(1,Math.round(m*P.heal));
  ['dead','ko','down','fallen'].forEach(k=>{if(k in u)u[k]=false});
  [['atk',P.atkUp],['def',P.defUp]].forEach(([k,v])=>{if(typeof u[k]=='number')u[k]=Math.round(u[k]*(1+v))});
  const msg=`PHOENIX! Alternate Kael bangkit dari abu (${this.used}/${P.max}) dan menjadi lebih kuat!`+(this.left()?'':' Ini kebangkitan terakhirnya.');
  try{G.log&&G.log(msg)}catch(e){}console.log('[Phoenix]',msg);return true}};
/* label jenis persona */
G.tLabel=t=>({iblis:'Iblis',malaikat:'Malaikat',dewa:'Dewa',pahlawan:'Pahlawan Dunia',khusus:'Persona Khusus'}[t]||'Persona awal');
/* ===== HUB: gaya Persona 5 (disuntik otomatis, tidak perlu ubah style.css) ===== */
(()=>{if(document.getElementById('hub-p5'))return;
 const nth=[...Array(14)].map((_,i)=>`#app .hb .hbp>.kc:nth-child(${i+1}){animation-delay:${i*.045}s}`).join('\n');
 const st=document.createElement('style');st.id='hub-p5';st.textContent=`
#app .hb,#app .hb :where(.hbbg,.hbt,.hbk,.tabs,.tb3,.yen,.hbm,.hbs,.hbh,.si,.si>b,.pw,.hbp,.wm,.kc,.kc>*,.bb,.hbf,.hbf button,.por,.bar,.bar i){all:unset;box-sizing:border-box}
#app .hb{position:relative;display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;color:#fff;font-family:Impact,'Arial Narrow Bold','Haettenschweiler',sans-serif;font-style:italic}
#app .hb .hbbg{position:absolute;inset:0;z-index:0;background:radial-gradient(circle,rgba(0,0,0,.38) 1.6px,transparent 2px) 0 0/11px 11px,linear-gradient(112deg,#e60012 0 52%,#050505 52% 58%,#fff 58% 59%,#b0000f 59% 100%);animation:hbDots 14s linear infinite}
@keyframes hbDots{to{background-position:110px 110px,0 0}}
#app .hb .hbt{position:relative;z-index:3;display:flex;align-items:center;gap:22px;padding:14px 30px;background:#000;box-shadow:0 5px 0 #fff,0 11px 0 #e60012}
#app .hb .hbk{display:block;flex:none;background:#fff;color:#000;font-size:20px;letter-spacing:1px;padding:8px 20px;white-space:nowrap;transform:skewX(-14deg) rotate(-1.5deg);box-shadow:5px 5px 0 #e60012}
#app .hb .tabs{display:flex;flex:1;flex-wrap:wrap;gap:10px;margin-left:8px}
#app .hb .tb3{display:block;cursor:pointer;background:#111;color:#fff;font-size:22px;letter-spacing:1px;padding:8px 22px;border:2px solid #fff;transform:skewX(-14deg);transition:.14s}
#app .hb .tb3:hover{background:#e60012;transform:skewX(-14deg) translateY(-3px)}
#app .hb .tb3.on{background:#fff;color:#000;box-shadow:5px 5px 0 #e60012;transform:skewX(-14deg) scale(1.1)}
#app .hb .yen{display:block;flex:none;background:#ffd400;color:#000;font-size:30px;padding:4px 22px;border:3px solid #000;box-shadow:4px 4px 0 #fff;transform:skewX(-14deg) rotate(2deg)}
#app .hb .hbm{position:relative;z-index:1;display:flex;flex:1;min-height:0}
#app .hb .hbs{position:relative;z-index:1;display:flex;flex-direction:column;gap:12px;flex:none;width:280px;padding:26px 22px 22px 28px;overflow-y:auto;background:linear-gradient(90deg,rgba(0,0,0,.94),rgba(0,0,0,.72))}
#app .hb .hbs:empty{display:none}
#app .hb .hbh{display:block;font-size:15px;letter-spacing:6px;padding-bottom:7px;border-bottom:4px solid #e60012;transform:skewX(-10deg)}
#app .hb .si{display:flex;align-items:center;gap:12px;cursor:pointer;background:#111;color:#fff;font-size:22px;padding:8px 16px 8px 10px;border:2px solid #fff;transform:skewX(-10deg);transition:.14s}
#app .hb .si>b{font-weight:400}
#app .hb .si:hover{background:#e60012;transform:skewX(-10deg) translateX(8px)}
#app .hb .si.on{background:#fff;color:#000;box-shadow:6px 6px 0 #e60012;transform:skewX(-10deg) translateX(14px)}
#app .hb .pw{display:block;flex:none;width:46px;height:46px;overflow:hidden;background:#222;border:2px solid #000;transform:skewX(10deg)}
#app .hb .pw>*{display:block;width:100%!important;height:100%!important;object-fit:cover}
#app .hb .por{display:block;flex:none;height:230px;margin-top:auto;overflow:hidden;background:#000;border:4px solid #fff;box-shadow:8px 8px 0 #e60012;transform:skewX(-6deg) rotate(1.2deg)}
#app .hb .por>*{display:block;width:100%!important;height:100%!important;object-fit:cover;object-position:top}
/* Grid layout: Item akan berjejer dari kiri ke kanan. Lebar minmax dikecilkan agar lebih banyak yang muat sejajar */
#app .hb .hbp{position:relative;z-index:1;display:grid;flex:1;min-width:0;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px 24px;align-content:start;padding:24px 36px 24px 28px;overflow-y:auto;justify-content:start}
#app .hb .wm{position:absolute;right:30px;bottom:-14px;z-index:0;font-size:160px;letter-spacing:4px;color:rgba(255,255,255,.14);transform:rotate(-6deg);pointer-events:none;white-space:nowrap}
#app .hb .kc{position:relative;display:grid;grid-template-columns:64px 1fr;column-gap:16px;align-items:start;align-content:center;min-height:92px;padding:12px 20px 14px 0;background:#0a0a0a;color:#fff;border:3px solid #fff;box-shadow:8px 8px 0 #e60012;transform:skewX(-8deg) rotate(-.5deg);animation:hbIn .38s backwards;transition:.15s}
#app .hb .kc:nth-child(even){transform:skewX(-8deg) rotate(.6deg)}
#app .hb .kc:hover{transform:skewX(-8deg) translate(-4px,-4px);box-shadow:12px 12px 0 #ffd400}
#app .hb .kc.wide{grid-column:1/-1}
#app .hb .kc.eq{border-color:#ffd400;box-shadow:8px 8px 0 #ffd400}
#app .hb .kc.eq:hover{box-shadow:12px 12px 0 #e60012}
#app .hb .kc.dim{opacity:.62}
#app .hb .kc>b{display:flex;align-items:center;justify-content:center;grid-column:1;grid-row:1/span 5;align-self:stretch;margin:-12px 0 -14px -3px;background:#fff;color:#000;font-size:32px}
#app .hb .kc.eq>b{background:#ffd400}
#app .hb .kc>span{display:block;grid-column:2;font-size:24px;line-height:1.1;letter-spacing:1px;text-shadow:3px 3px 0 #e60012;margin-bottom:4px;word-break:break-word}
#app .hb .kc>small{display:block;grid-column:2;margin-top:4px;font:700 13px/1.4 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#e8e8e8;word-break:break-word}
/* PERBAIKAN MUTLAK: Memaksa tombol kategori (ITEM, SKILL, PERSONA) berjejer ke samping (row) */
#app .hb .kc>div { grid-column: 2; margin-top: 10px; display: flex !important; flex-direction: row !important; flex-wrap: wrap !important; gap: 10px; align-items: center; }
#app .hb .kc>.bb, #app .hb .kc>button{grid-column:2;margin-top:10px;justify-self:start}
#app .hb .bb{display:inline-block;justify-self:start;cursor:pointer;background:#e60012;color:#fff;font-size:20px;letter-spacing:1px;padding:6px 22px;border:2px solid #fff;box-shadow:4px 4px 0 #000;transform:skewX(-10deg);transition:.12s}
#app .hb .bb:hover{background:#fff;color:#e60012;transform:skewX(-10deg) translate(-2px,-2px)}
#app .hb .bb.on{background:#fff;color:#000}
#app .hb .bb.eqb{background:#ffd400;color:#000;border-color:#000}
#app .hb .bb.eqb:hover{background:#fff;color:#e60012}
#app .hb .bb:disabled{background:#3a3a3a;color:#999;border-color:#777;box-shadow:none;cursor:not-allowed;transform:skewX(-10deg)}
#app .hb .bar{display:block;height:14px;background:#2b2b2b;border:2px solid #fff;transform:skewX(-20deg)}
#app .hb .bar i{display:block;height:100%;background:linear-gradient(90deg,#ffd400,#ff8a00)}
#app .hb .bar.hp i{background:linear-gradient(90deg,#27d96a,#b6ff5a)}
#app .hb .bar.sp i{background:linear-gradient(90deg,#ff3fa4,#ff9ad0)}
#app .hb .bar.atk i{background:linear-gradient(90deg,#ff2b2b,#ff7b4a)}
#app .hb .bar.def i{background:linear-gradient(90deg,#2aa7ff,#8fe0ff)}
#app .hb .hbf{position:relative;z-index:3;display:flex;justify-content:flex-end;align-items:center;gap:18px;padding:14px 36px 48px;background:#000;box-shadow:0 -5px 0 #fff,0 -11px 0 #e60012}
#app .hb .hbf button{display:block;cursor:pointer;background:#fff;color:#000;font-size:24px;padding:10px 34px;transform:skewX(-14deg);box-shadow:5px 5px 0 #e60012;transition:.12s}
#app .hb .hbf button:hover{background:#ffd400;transform:skewX(-14deg) translate(-3px,-3px);box-shadow:8px 8px 0 #e60012}
#app .hb .hbf #go{background:#e60012;color:#fff;font-size:30px;padding:12px 48px;border:3px solid #fff;box-shadow:5px 5px 0 #fff}
#app .hb .hbf #go:hover{background:#fff;color:#e60012}
#app .hb .hbf #lg{background:#ffd400;font-size:20px;padding:10px 24px}
#app .hb ::-webkit-scrollbar{width:10px}#app .hb ::-webkit-scrollbar-track{background:#000}#app .hb ::-webkit-scrollbar-thumb{background:#e60012;border:2px solid #000}
@keyframes hbIn{from{opacity:0;translate:-60px 0}}
${nth}`;document.head.appendChild(st)})();
const A=()=>document.getElementById('app'),$=id=>document.getElementById(id);
G.rn=(t,seed=0)=>[...G.T(t)].map((ch,i)=>{if(ch==' ')return'<span class="sp"></span>';const r=(i*7+seed*13+ch.charCodeAt(0))%9,st=['w','b','r','w','b','n','w','r','b'][r],f=['Impact','Georgia','Arial Black','Courier New','Trebuchet MS'][(r+i)%5],rot=((r*5+i*3)%13)-6,sz=1+((r+i)%4)*.08;return`<span class="rl ${st}" style="font-family:${f};transform:rotate(${rot}deg) scale(${sz})">${ch}</span>`}).join('');
function ttl(sub,items){A().innerHTML=`<div class="ttl"><div class="tr"></div><div class="stars"></div><div class="tt">${G.rn('PESONA')}</div><div class="tb">${sub}</div><div class="tm">${items.map((it,k)=>`<button class="ti" data-k="${k}" ${it.dis?'disabled':''}>${G.rn(it.t,k)}</button>`).join('')}</div><div class="tc" id="tc"></div><div class="tp">&#9675; Back &nbsp; &#10005; Confirm</div></div>`;
 const show=k=>{$('tc').innerHTML=G.rn(items[k].t,k+3)+`<small>${items[k].d}</small>`};const f=items.findIndex(x=>!x.dis);show(f);
 A().querySelectorAll('.ti').forEach(b=>{const k=+b.dataset.k;b.onmouseenter=b.onfocus=()=>show(k);b.onclick=items[k].f})}
/* ================= MENU UTAMA + SISTEM 3 SLOT SAVE =================
   (fungsi G.slotInfo, G.slotHas, G.setSlot, G.load(n), G.wipe(n) ada di file save)
   Item "Bahasa" mengganti bahasa teks: Indonesia > English > 日本語 (lihat js/lang.js) */
function menu(){G.ui.free=0;G.langHook&&G.langHook();ttl('MENU: MAIN &#9733; SELECT A COMMAND',[
 {t:'New Game',d:'Mulai petualangan baru di Multiverse Archive.',f:pickDiff},
 {t:'Load',d:'Pilih salah satu dari '+G.SLOTS+' slot save.',f:loadMenu,dis:!G.hasSave()},
 {t:'Hapus Save',d:'Hapus salah satu slot save.',f:delMenu,dis:!G.hasSave()},
 {t:G.langName(),d:'Ganti bahasa teks: Indonesia / English / 日本語.',f:()=>{G.cycleLang();menu()}}])}
function loadMenu(){ttl('LOAD &#9733; SELECT A SLOT',[
 ...Array.from({length:G.SLOTS},(_,i)=>({t:'Slot '+(i+1),d:G.slotInfo(i+1),dis:!G.slotHas(i+1),f:()=>{if(G.load(i+1))hub();else menu()}})),
 {t:'Back',d:'Kembali ke menu utama.',f:menu}])}
function delMenu(){ttl('DELETE &#9733; SELECT A SLOT',[
 ...Array.from({length:G.SLOTS},(_,i)=>({t:'Slot '+(i+1),d:G.slotInfo(i+1),dis:!G.slotHas(i+1),f:()=>{if(confirm('Hapus Slot '+(i+1)+'?')){G.wipe(i+1);menu()}}})),
 {t:'Back',d:'Kembali ke menu utama.',f:menu}])}
/* pilih slot untuk game baru; slot yang sudah terisi akan ditimpa (ada konfirmasi) */
function pickSlot(d){ttl('NEW GAME &#9733; SELECT A SLOT',[
 ...Array.from({length:G.SLOTS},(_,i)=>({t:'Slot '+(i+1),d:G.slotHas(i+1)?'TERISI: '+G.slotInfo(i+1)+' \u2022 akan DITIMPA':'Kosong',f:()=>{
   if(G.slotHas(i+1)&&!confirm('Slot '+(i+1)+' sudah terisi. Timpa?'))return;
   G.setSlot(i+1);G.state=G.newState(d);G.save();hub()}})),
 {t:'Back',d:'Kembali memilih difficulty.',f:pickDiff}])}
/* pilih difficulty. Kalau Kael Alternate pernah kamu kalahkan, dia bereaksi terhadap pilihanmu
   (lebih sulit = senang, lebih mudah = menghina "pengecut"). Lihat G.kaelLines di file save. */
function pickDiff(){ttl('DIFFICULTY &#9733; CHOOSE YOUR FATE',[...Object.keys(G.DIFF).map(k=>({t:G.DIFF[k].n,d:{easy:'Musuh lemah, EXP lebih banyak.',normal:'Pengalaman seimbang.',hard:'Musuh kuat dan EXP berkurang.',hardcore:'Sangat berat. Kalah = save terhapus!'}[k],
  f:()=>{const L=G.kaelLines?G.kaelLines(k,'start'):null,go=()=>pickSlot(k);L?G.dialog(L,go):go()}})),{t:'Back',d:'Kembali ke menu utama.',f:menu}])}
G.ui=G.ui||{tab:'status',sel:'kael'};
/* [nama, harga, jumlah, kunci stok, deskripsi singkat, keterangan detail]
   Kunci stok harus sama dengan di battle.js (ITEMS): items, hipot, megapot, spitems, elixir, grpot, revive, mrevive, atkc, defc,
   spmega, ether, panacea, megaelx, grsp, grmega, grelx, reviveall, rainc, timesand, spark */
const SHOP=[
 ['Potion',60,1,'items','Pulihkan 50 HP','Obat dasar untuk satu anggota. Murah dan cocok dibawa banyak.'],
 ['Potion Pack x3',150,3,'items','3x Potion, lebih hemat','Paket 3 Potion dengan harga lebih murah dibanding beli satuan.'],
 ['High Potion',140,1,'hipot','Pulihkan 40% HP (min 150)','Pemulihan besar untuk satu anggota. Efektif untuk karakter dengan HP tinggi.'],
 ['High Potion Pack x3',390,3,'hipot','3x High Potion, lebih hemat','Paket 3 High Potion dengan harga lebih murah dibanding beli satuan.'],
 ['Mega Potion',320,1,'megapot','Pulihkan HP penuh','Memulihkan seluruh HP satu anggota. Andalan saat melawan boss.'],
 ['Mega Potion Pack x3',870,3,'megapot','3x Mega Potion, lebih hemat','Paket 3 Mega Potion untuk persiapan menghadapi boss.'],
 ['SP Drink',70,1,'spitems','Pulihkan 20 SP','Minuman penambah tenaga agar skill dan persona bisa dipakai lagi.'],
 ['Ether',120,1,'ether','Pulihkan 50% SP','Cairan sihir yang memulihkan setengah SP maksimum satu anggota.'],
 ['Mega SP Drink',220,1,'spmega','Pulihkan SP penuh','Memulihkan seluruh SP satu anggota. Cocok untuk karakter yang haus skill.'],
 ['Group SP Drink',240,1,'grsp','Pulihkan 20 SP seluruh tim','Minuman tenaga yang dibagikan ke seluruh anggota tim yang masih hidup.'],
 ['Elixir',260,1,'elixir','HP & SP penuh','Memulihkan HP dan SP satu anggota sekaligus. Item darurat terbaik.'],
 ['Elixir Pack x3',720,3,'elixir','3x Elixir, lebih hemat','Paket 3 Elixir dengan harga lebih murah dibanding beli satuan.'],
 ['Mega Elixir',520,1,'megaelx','HP & SP penuh + hapus debuff','Pemulihan total satu anggota: HP dan SP penuh, plus menghapus racun, bakar, seal, dan debuff ATK/DEF.'],
 ['Panacea',90,1,'panacea','Hapus semua debuff','Obat penawar untuk satu anggota: menghapus racun, bakar, seal, serta ATK/DEF turun.'],
 ['Group Herb',220,1,'grpot','Pulihkan 30% HP seluruh tim','Ramuan herbal yang menyembuhkan seluruh tim sekaligus.'],
 ['Group Mega Herb',650,1,'grmega','Pulihkan HP penuh seluruh tim','Ramuan langka yang memulihkan HP seluruh tim yang masih hidup sampai penuh.'],
 ['Group Elixir',1200,1,'grelx','HP & SP penuh seluruh tim + hapus debuff','Elixir terbaik: seluruh anggota hidup pulih HP dan SP sampai penuh, dan semua debuff hilang.'],
 ['Revive',400,1,'revive','Hidupkan anggota tumbang (HP 50%)','Membangkitkan anggota yang tumbang dengan setengah HP.'],
 ['Max Revive',900,1,'mrevive','Hidupkan anggota tumbang (HP penuh)','Membangkitkan anggota yang tumbang dengan HP penuh.'],
 ['Revive All',1300,1,'reviveall','Hidupkan semua anggota tumbang (HP 50%)','Membangkitkan seluruh anggota tim yang tumbang sekaligus dengan setengah HP.'],
 ['Power Candy',120,1,'atkc','ATK tim naik 3 ronde','Permen penguat. Serangan seluruh tim meningkat selama 3 ronde.'],
 ['Guard Candy',120,1,'defc','DEF tim naik 3 ronde','Permen pelindung. Pertahanan seluruh tim meningkat selama 3 ronde.'],
 ['Rainbow Candy',220,1,'rainc','ATK & DEF tim naik 3 ronde','Permen pelangi. Serangan dan pertahanan seluruh tim meningkat selama 3 ronde.'],
 ['Time Sand',300,1,'timesand','Reset cooldown semua skill tim','Pasir waktu yang membuat semua skill dan persona seluruh tim langsung siap dipakai lagi.'],
 ['Spark Battery',350,1,'spark','Isi gauge ALL-OUT +50%','Baterai kilat yang mengisi setengah gauge ALL-OUT. Cepat siap menyerbu bersama.']];
const TABS=[['status','STATUS'],['team','TEAM'],['skill','SKILL'],['persona','PERSONA'],['shop','SHOP'],['dungeon','DUNGEON'],['side','SIDE'],['chapter','CHAPTER']];
/* label episode (aman kalau chapters_episodes.js belum dimuat) */
const epTag=ci=>G.epTag?G.epTag(ci):'',epLabel=ci=>G.epLabel?G.epLabel(ci):'';
function hub(){G.capLv&&G.capLv();G.ensureEx&&G.ensureEx();G.altCheck&&G.altCheck();const S=G.state,U=G.ui,done=!G.CHAPTERS[S.ch],c=G.CHAPTERS[S.ch]||G.CHAPTERS[G.CHAPTERS.length-1];S.yen=S.yen||0;
 if(done&&!U.free)return ending();   /* cerita tamat: tampilkan layar ENDING, hub penuh hanya lewat tombol LANJUT BEBAS */
 if(!S.lv[U.sel])U.sel='kael';const ch=U.sel,l=S.lv[ch].l,C=G.CHARS[ch],own=Object.keys(G.CHARS).filter(k=>S.lv[k]);
 const li=(k,t,on)=>{const sp=G.spr('characters',k,'pt');return`<button class="si ${on?'on':''}" data-k="${k}">${sp?`<span class="pw">${sp}</span>`:''}<b>${t}</b></button>`},kc=(n,t,d,x,w,cls)=>`<div class="kc ${w?'wide':''} ${cls||''}"><b>${n}</b><span>${t}</span><small>${d}</small>${x||''}</div>`,bar=(v,m,c)=>`<div class="bar ${c||''}"><i style="width:${Math.max(4,Math.min(100,v/m*100))}%"></i></div>`;
 const side=U.tab=='team'?Object.keys(G.CHARS).filter(k=>k!='altkael'||S.lv[k]).map(k=>li(k,G.CHARS[k].n+(S.party.includes(k)?' \u2713':S.lv[k]?'':' \u{1F512}'),S.party.includes(k))).join(''):['status','skill','persona','shop'].includes(U.tab)?own.map(k=>li(k,G.CHARS[k].n,k==ch)).join(''):'';
 const hd=side?'<div class="hbh">PROTAGONIS</div>':'',ps0=side&&U.tab!='team'?G.spr('characters',ch,'pt'):'',por=ps0?`<div class="por">${ps0}</div>`:'';
 const side2=G.SIDE.filter(x=>S.ch>=x.after&&!S.side[x.id]);let cards='';
 /* ----- LOADOUT: tombol BAWA / DIBAWA untuk skill & persona (maks G.LIMIT) ----- */
 const eqBtn=(kind,m)=>m.free?'<button class="bb" disabled>SELALU AKTIF</button>':`<button class="bb ${m.eq?'eqb':''}" data-eq="${kind}:${m.id}">${m.eq?'\u2713 DIBAWA (LEPAS)':'BAWA'}</button>`;
 const slotCard=(kind,nm)=>{const n=G.eqCount(ch,kind),mx=G.eqMax(kind);return kc('\u2605',`SLOT ${nm} ${n}/${mx}`,`Hanya yang berstatus DIBAWA yang bisa dipakai di battle. Maksimal ${mx} ${nm.toLowerCase()} (yang bertanda SELALU AKTIF tidak dihitung).`,bar(n,mx),1,n>=mx?'eq':'')};
 const khas=x=>x.only&&x.only.includes(ch)?'\u2605 KHAS ':'';
 if(U.tab=='status')cards=kc('01','LEVEL '+l+(l>=G.MAXLV?' (MAX)':''),`Protagonis: ${C.n} &bull; ${l>=G.MAXLV?'LEVEL MAKSIMAL, EXP tidak bertambah lagi':`EXP ${S.lv[ch].x}/${G.need(l)}`}`,l>=G.MAXLV?bar(1,1):bar(S.lv[ch].x,G.need(l)),1)+[['hp',400],['sp',200],['atk',100],['def',60]].map(([k,m],i)=>kc('0'+(i+2),k.toUpperCase(),G.stat(ch,l,k),bar(G.stat(ch,l,k),m,k))).join('');
 if(U.tab=='team')cards=S.party.map((k,i)=>kc('0'+(i+1),G.CHARS[k].n,'LV '+S.lv[k].l)).join('')+kc('--','KLIK NAMA DI KIRI','Aktif/nonaktifkan protagonis (maks 4)','',1);
 if(U.tab=='skill')cards=slotCard('skill','SKILL')+(ch=='altkael'?kc('\u{1F525}','\u2605 PHOENIX (BAWAAN)',`Pasif, SELALU AKTIF. Saat HP habis ia bangkit dengan ${Math.round(G.PHOENIX.heal*100)}% HP dan ATK/DEF naik tiap bangkit. Hanya ${G.PHOENIX.max}x per battle; setelah itu Alternate Kael gugur.`,'<button class="bb" disabled>SELALU AKTIF</button>',1,'eq'):'')+G.moves(ch,'skill',true).map((m,i)=>kc('0'+(i+1),khas(m)+m.n,`${G.KIND[m.k]} &bull; Power ${Math.round(m.pow*(1+.13*(l-1)))} &bull; ${m.sp} SP &bull; CD ${m.cd||0}`,(m.d?`<small>${m.d}</small>`:'')+eqBtn('skill',m),0,m.eq?'eq':'dim')).join('')+kc('--','ATTACK / GUARD','ATTACK = ATK x 2 &bull; GUARD = DEF x2 dan +4 SP')+kc('--','BELI SKILL BARU','Buka tab SHOP lalu pilih kategori SKILL. Tiap protagonis punya skill KHAS sendiri.');
 if(U.tab=='persona'){const ps=G.moves(ch,'persona',true);cards=kc('USER',C.n,'Protagonis &bull; memanggil persona untuk membantu','',1)+slotCard('persona','PERSONA')+(ps.length?ps.map((m,i)=>kc('0'+(i+1),(m.e||'')+' '+khas(m)+m.n,`${G.tLabel(m.t)} &bull; ${G.KIND[m.k]} &bull; ${m.sp} SP &bull; CD ${m.cd||0}`,(m.d?`<small>${m.d}</small>`:'')+eqBtn('persona',m),0,m.eq?'eq':'dim')).join(''):kc('--','BELUM ADA PERSONA','Beli iblis atau malaikat di tab SHOP, kategori PERSONA'))}
 if(U.tab=='shop'){U.sc=U.sc||'item';const o=G.own(ch),cat=`<div style="display:flex;gap:8px;flex-wrap:wrap">${[['item','ITEM'],['skill','SKILL'],['persona','PERSONA']].map(([k,t])=>`<button class="bb ${k==U.sc?'on':''}" data-sc="${k}" ${k==U.sc?'style="outline:3px solid #fff"':''}>${t}</button>`).join('')}</div>`;
  const buy=(has,attr,id)=>has?'<button class="bb" disabled>DIMILIKI</button>':`<button class="bb" ${attr}="${id}">BELI</button>`;
  /* skill/persona khas karakter ini tampil paling atas; milik karakter lain disembunyikan */
  const vis=x=>!x.reward&&(!x.only||x.only.includes(ch)),srt=(a,b)=>(b.only&&b.only.includes(ch)?1:0)-(a.only&&a.only.includes(ch)?1:0);
  cards=kc('--','SHOP &bull; '+C.n,`Skill dan persona dibeli untuk protagonis ini &bull; \u00a5 ${S.yen}`,cat,1);
  if(U.sc=='item')cards+=SHOP.map((x,i)=>kc(String(i+1).padStart(2,'0'),x[0],`${x[4]} &bull; Harga ${x[1]}\u00a5 &bull; Item kamu: ${S[x[3]]||0}`,`<small>${x[5]}</small><button class="bb" data-b="${i}">BELI</button>`)).join('');
  if(U.sc=='skill')cards+=G.SKILLS.filter(vis).sort(srt).map((x,i)=>kc('0'+(i+1),khas(x)+x.n,`${G.KIND[x.k]} &bull; Power ${x.pow||'-'} &bull; ${x.sp} SP &bull; CD ${x.cd||0} &bull; Harga ${x.price}\u00a5`,`<small>${x.d}</small>`+buy(o.skl.includes(x.id),'data-bs',x.id),0,khas(x)?'eq':'')).join('');
  if(U.sc=='persona')cards+=G.PERSONAS.filter(vis).sort(srt).map((x,i)=>kc('0'+(i+1),x.e+' '+khas(x)+x.n,`${G.tLabel(x.t)} &bull; ${G.KIND[x.k]} &bull; Power ${x.pow||'-'} &bull; ${x.sp} SP &bull; CD ${x.cd||0} &bull; Harga ${x.price}\u00a5`,`<small>${x.d}</small>`+buy(o.per.includes(x.id),'data-bp',x.id),0,khas(x)?'eq':'')).join('')}
 if(U.tab=='dungeon'){const dg=S.dg||{};cards=kc('--','DUNGEON &bull; ARCHIVE DEPTHS',`Lawan musuh berlantai-lantai untuk EXP, Yen, dan item. Setiap lantai selesai kamu boleh mundur membawa hadiah. Kalah = hadiah dungeon yang belum diambil hangus. Rekor Jurang Hampa: lantai ${dg.best||0} &bull; Dungeon tuntas: ${dg.clears||0}x`,'',1)+G.DUNGEONS.map((D,i)=>{const lock=S.ch<D.need;return kc('0'+(i+1),D.e+' '+D.n,`${D.d} &bull; ${D.floors==Infinity?'Tanpa batas lantai':D.floors+' lantai'} &bull; ${lock?'\u{1F512} Buka setelah Chapter '+D.need+' selesai':'Terbuka'}`,`<button class="bb" ${lock?'disabled':''} data-dg="${D.id}">${lock?'TERKUNCI':'MASUK'}</button>`,0,lock?'dim':'')}).join('')}
 if(U.tab=='side'){const all=G.SIDE.slice().sort((a,b)=>(a.after||0)-(b.after||0)),dn=all.filter(x=>S.side[x.id]).length,av=all.filter(x=>!S.side[x.id]&&S.ch>=(x.after||0)).length;
  cards=kc('--','SEMUA SIDE CHAPTER',`Selesai ${dn}/${all.length} &bull; Tersedia ${av} &bull; Terkunci ${all.length-dn-av}. Side chapter terbuka seiring kamu menamatkan chapter utama.`,'',1)+all.map((x,i)=>{
   const d=!!S.side[x.id],lock=!d&&S.ch<(x.after||0),kind=x.boss?'BOSS':x.elite?'MINI BOSS':`${x.n||1} musuh`,
    st=d?'\u2713 SELESAI':lock?'\u{1F512} Buka setelah Chapter '+x.after+' selesai':'TERSEDIA',
    rw=x.rw?` &bull; Hadiah \u00a5${x.rw.yen||0}`+(x.rw.items?` + ${x.rw.items} Potion`:'')+(x.rw.sp?` + ${x.rw.sp} SP Drink`:''):'';
   return kc(String(i+1).padStart(2,'0'),x.t,`${st} &bull; ${kind}${rw}`,d||lock?`<button class="bb" disabled>${d?'SELESAI':'TERKUNCI'}</button>`:`<button class="bb" data-s="${x.id}">MAIN</button>`,0,d||lock?'dim':'eq')}).join('')}
 if(U.tab=='chapter')cards=(done?kc('\u2605','TAMAT','Semua chapter utama sudah kamu selesaikan. Pakai PILIH CHAPTER untuk mengulang chapter mana pun, atau lanjut farming lewat Dungeon & Side Chapter.','<button class="bb" id="cs">PILIH CHAPTER</button><button class="bb" data-t="side">LIHAT SEMUA SIDE CHAPTER</button>',1):kc('01','CHAPTER '+(S.ch+1)+': '+c.t,`${epLabel(S.ch)?epLabel(S.ch)+' &bull; ':''}Stage ${S.st+1}/3 &bull; Boss: ${c.boss}`,'<button class="bb" id="cs">PILIH CHAPTER</button><button class="bb" data-t="side">LIHAT SEMUA SIDE CHAPTER ('+side2.length+' tersedia)</button>'))+side2.map((x,i)=>kc('S'+(i+1),x.t,'Side chapter'+(x.rw?` &bull; Hadiah \u00a5${x.rw.yen||0}`+(x.rw.items?` + ${x.rw.items} Potion`:''):''),`<button class="bb" data-s="${x.id}">MAIN</button>`)).join('');
 A().innerHTML=`<div class="wipe"></div><div class="hb"><div class="hbbg"></div><div class="hbt"><span class="hbk">${done?'TAMAT':`${epTag(S.ch)?epTag(S.ch)+' &bull; ':''}CH ${S.ch+1} &bull; ST ${S.st+1}/3`} &bull; ${G.DIFF[S.diff].n}</span><div class="tabs">${TABS.map(([k,t])=>`<button class="tb3 ${k==U.tab?'on':''}" data-t="${k}">${t}</button>`).join('')}</div><span class="yen">\u00a5 ${S.yen}</span></div><div class="hbm"><div class="hbs">${hd}${side}${por}</div><div class="hbp">${cards}</div><div class="wm">${TABS.find(x=>x[0]==U.tab)[1]}</div></div><div class="hbf"><button id="lg">${G.langName()}</button><button id="go">${done?'Ending':'Main Story'}</button><button id="sv">Save</button><button id="mn">Menu</button></div></div>`;
 const q=(s,f)=>A().querySelectorAll(s).forEach(f);
 q('[data-t]',b=>b.onclick=()=>{U.tab=b.dataset.t;hub()});
 q('.si',b=>b.onclick=()=>{const k=b.dataset.k;if(U.tab=='team'){if(k=='kael'||!S.lv[k])return;const i=S.party.indexOf(k);if(i>=0)S.party.splice(i,1);else if(S.party.length<4)S.party.push(k)}else U.sel=k;hub()});
 /* pasang / lepas skill & persona */
 q('[data-eq]',b=>b.onclick=()=>{const[kind,id]=b.dataset.eq.split(':'),r=G.toggleEq(ch,kind,id);if(!r.ok)alert(r.msg);else G.save();const sc=document.querySelector('#app .hbp'),y=sc?sc.scrollTop:0;hub();const n=document.querySelector('#app .hbp');if(n)n.scrollTop=y});
 /* beli: posisi scroll dipertahankan supaya daftar shop tidak loncat ke atas */
 const keep=f=>{const sc=document.querySelector('#app .hbp'),y=sc?sc.scrollTop:0;f();const n=document.querySelector('#app .hbp');if(n)n.scrollTop=y};
 q('[data-b]',b=>b.onclick=()=>{const x=SHOP[b.dataset.b];if(S.yen>=x[1]){S.yen-=x[1];S[x[3]]=(S[x[3]]||0)+x[2];G.save();keep(hub)}else alert('Yen tidak cukup')});
 q('[data-sc]',b=>b.onclick=()=>{U.sc=b.dataset.sc;hub()});
 q('[data-bs]',b=>b.onclick=()=>{const x=G.SKILLS.find(v=>v.id==b.dataset.bs),o=G.own(ch);if(!x||o.skl.includes(x.id)||(x.only&&!x.only.includes(ch)))return;if(S.yen>=x.price){S.yen-=x.price;o.skl.push(x.id);G.save();keep(hub)}else alert('Yen tidak cukup')});
 q('[data-bp]',b=>b.onclick=()=>{const x=G.PERSONAS.find(v=>v.id==b.dataset.bp),o=G.own(ch);if(!x||o.per.includes(x.id)||(x.only&&!x.only.includes(ch)))return;if(S.yen>=x.price){S.yen-=x.price;o.per.push(x.id);G.save();keep(hub)}else alert('Yen tidak cukup')});
 /* side chapter: pakai G.fight supaya kemenangan atas Kael Alternate tercatat */
 q('[data-s]',b=>b.onclick=()=>{const s=G.SIDE.find(x=>x.id==b.dataset.s);if(!s||S.side[s.id]||S.ch<(s.after||0))return;G.dialog(s.d,()=>G.fight(G.sideFoes(s),r=>{if(r){S.side[s.id]=1;const m=G.sideReward(s);G.save();alert(m);hub()}else after()},[s.boss]))});
 q('[data-dg]',b=>b.onclick=()=>{const D=G.DUNGEONS.find(x=>x.id==b.dataset.dg);if(!D||S.ch<D.need)return;
  if(confirm(`Masuk ${D.n}?\n${D.d}\n\nKalah = hadiah dungeon yang belum diambil hangus`+(G.DIFF[S.diff].perma?'\nPERINGATAN HARDCORE: kalah = save terhapus!':'')))G.runDungeon(D)});
 if($('cs'))$('cs').onclick=chapters;$('go').onclick=()=>done?ending():S.st==0?G.dialog(c.intro,stage):stage();$('sv').onclick=()=>{G.save();alert('Tersimpan di Slot '+G.slot)};$('mn').onclick=menu;
 $('lg').onclick=()=>{G.cycleLang();hub()}}
/* ================= ENDING / TAMAT (gaya Persona 5) =================
   Tombol dibuat di dalam <div class="menu"> dengan id cs & mn, supaya tombol tambahan dari file lain
   (misalnya DEATH WORLD) tetap bisa disisipkan seperti biasa. */
function ending(){const S=G.state,U=G.ui;U.free=0;
 if(!document.getElementById('end-p5')){const st=document.createElement('style');st.id='end-p5';st.textContent=`
#app .end{position:relative;display:flex;width:100%;height:100%;overflow:hidden;color:#fff;font-family:Impact,'Arial Narrow Bold','Haettenschweiler',sans-serif;font-style:italic;background:#050505}
#app .end .endbg{position:absolute;inset:0;z-index:0;background:radial-gradient(circle,rgba(0,0,0,.38) 1.6px,transparent 2px) 0 0/11px 11px,linear-gradient(112deg,#e60012 0 46%,#050505 46% 52%,#fff 52% 53%,#b0000f 53% 100%);animation:endDots 14s linear infinite}
@keyframes endDots{to{background-position:110px 110px,0 0}}
#app .end .endl{position:relative;z-index:2;flex:none;width:48%;min-width:0;display:flex;flex-direction:column;justify-content:center;gap:16px;padding:40px 30px 70px 70px;box-sizing:border-box}
#app .end .endk{display:block;align-self:flex-start;background:#ffd400;color:#000;font-size:24px;letter-spacing:2px;padding:4px 22px;transform:skewX(-14deg) rotate(-2deg);box-shadow:5px 5px 0 #000}
#app .end .endt{display:block;font-size:150px;line-height:.95;letter-spacing:6px;color:#fff;text-shadow:7px 7px 0 #e60012,12px 12px 0 #000;transform:skewX(-8deg) rotate(-3deg);transform-origin:left bottom}
#app .end .ends{display:block;max-width:520px;padding:10px 18px;background:rgba(0,0,0,.78);border-left:6px solid #ffd400;font:700 16px/1.5 'Trebuchet MS',Arial,sans-serif;font-style:normal}
#app .end .menu{position:static!important;display:flex!important;flex-direction:column!important;gap:14px!important;margin:10px 0 0!important;padding:0!important;left:auto!important;top:auto!important;right:auto!important;bottom:auto!important;width:auto!important;height:auto!important;transform:none!important;background:none!important;border:0!important}
#app .end .menu button{display:block!important;cursor:pointer;width:380px;max-width:100%;box-sizing:border-box;margin:0!important;text-align:left;background:#fff!important;color:#000!important;font:italic 400 28px Impact,'Arial Narrow Bold',sans-serif!important;letter-spacing:1px;padding:10px 38px!important;border:0!important;clip-path:none!important;box-shadow:6px 6px 0 #e60012;transform:skewX(-12deg)!important;transition:.12s}
#app .end .menu button:hover{background:#e60012!important;color:#fff!important;box-shadow:6px 6px 0 #fff;transform:skewX(-12deg) translateX(10px)!important}
#app .end .menu button#hubfree{background:#ffd400!important}
#app .end .menu button#hubfree:hover{background:#e60012!important}
#app .end .endr{position:relative;z-index:2;flex:1;min-width:0;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:26px 28px;align-content:center;padding:40px 70px 70px 20px;box-sizing:border-box}
#app .end .endh{grid-column:1/-1;display:block;justify-self:start;background:#000;color:#fff;font-size:26px;letter-spacing:4px;padding:6px 26px;border:3px solid #fff;box-shadow:6px 6px 0 #ffd400;transform:skewX(-12deg)}
#app .end .er{display:block;background:#0a0a0a;border:3px solid #fff;box-shadow:7px 7px 0 #e60012;padding:10px 20px 12px;transform:skewX(-8deg) rotate(-.4deg);animation:endIn .4s backwards}
#app .end .er:nth-child(even){transform:skewX(-8deg) rotate(.5deg);box-shadow:7px 7px 0 #ffd400}
#app .end .er small{display:block;font:700 13px 'Trebuchet MS',Arial,sans-serif;font-style:normal;letter-spacing:2px;color:#ddd;text-transform:uppercase}
#app .end .er b{display:block;font-weight:400;font-size:38px;line-height:1.1;text-shadow:3px 3px 0 #e60012}
#app .end .endf{position:absolute;left:0;right:0;bottom:0;z-index:3;padding:10px 0;background:#000;white-space:nowrap;overflow:hidden;font-size:22px;letter-spacing:3px;box-shadow:0 -5px 0 #fff,0 -11px 0 #e60012;color:#fff}
#app .end .endf span{display:inline-block;padding-left:100%;animation:endTick 22s linear infinite}
@keyframes endTick{to{transform:translateX(-100%)}}
@keyframes endIn{from{opacity:0;translate:-50px 0}}`;document.head.appendChild(st)}
 const sd=(G.SIDE||[]).filter(x=>S.side&&S.side[x.id]).length,sn=(G.SIDE||[]).length,dg=S.dg||{},
  kl=S.lv&&S.lv.kael?S.lv.kael.l:1,allK=Object.keys(G.CHARS).filter(k=>k!='altkael'),crew=allK.filter(k=>S.lv[k]).length,
  rows=[['Kesulitan',G.DIFF[S.diff].n],['Chapter selesai',G.CHAPTERS.length+' / '+G.CHAPTERS.length],['Level Kael','Lv '+kl],['Protagonis terbuka',crew+' / '+allK.length],
   ['Side chapter',sd+' / '+sn],['Dungeon tuntas',(dg.clears||0)+'x'],['Rekor Jurang Hampa','Lantai '+(dg.best||0)],['Yen',`\u00a5 ${S.yen||0}`]];
 const tick='TAKE YOUR TIME \u2605 TAKE YOUR HEART \u2605 THANK YOU FOR PLAYING \u2605 '.repeat(4);
 A().innerHTML=`<div class="wipe"></div><div class="end"><div class="endbg"></div>
 <div class="endl"><span class="endk">EPISODE CLEAR</span><span class="endt">TAMAT</span>
  <span class="ends">Semua chapter berhasil kamu selesaikan. Terima kasih sudah bermain! Kamu masih bisa farming di Dungeon dan Side Chapter, atau mengulang chapter mana pun.</span>
  <div class="menu"><button id="hubfree">Lanjut Bebas (Hub)</button><button id="cs">Pilih Chapter</button><button id="mn">Menu</button><button id="lg">${G.langName()}</button></div></div>
 <div class="endr"><span class="endh">LAPORAN PETUALANGAN</span>${rows.map(([l,v],i)=>`<span class="er" style="animation-delay:${i*.06}s"><small>${l}</small><b>${v}</b></span>`).join('')}</div>
 <div class="endf"><span>${tick}</span></div></div>`;
 $('hubfree').onclick=()=>{U.free=1;U.tab='status';hub()};$('cs').onclick=chapters;$('mn').onclick=menu;$('lg').onclick=()=>{G.cycleLang();ending()}}
/* setelah kalah: muat ulang slot aktif; kalau slot sudah terhapus (hardcore) kembali ke menu */
function after(){G.hasSave()&&G.load()?hub():menu()}
/* pembungkus G.battle: kalau Kael Alternate kalah, kemenangan dicatat permanen (meta, tidak ikut terhapus bersama save) */
/* G.battle dibungkus SEKALI di sini, jadi semua pertempuran (cerita, side chapter, dungeon, DEATH WORLD)
   ikut terpantau. Bos "Alternate Multiverse Kael" ada di deathworld.js sebagai SECRET BOSS.
   Tambahan: kalau musuh yang dikalahkan membawa nama chapter "Harapan dan Takdir", Kael Alternate langsung dibuka. */
if(!G.battle.__kael){const _b=G.battle,nm=f=>f&&[f.n,f.name,f.nm,f.title].filter(Boolean).join(' ');
 G.battle=function(foes,cb,...r){G.phoenix&&G.phoenix.reset();const list=[].concat(foes||[]),alt=G.isAltKael&&G.isAltKael(list.map(nm));
  const go=()=>_b.call(this,foes,ok=>{
   if(ok&&G.state&&G.ALTRE.test(list.map(nm).join(' ')))G.unlockAltKael();
   if(ok&&alt&&G.state){G.markKael(G.state.diff);
    /* setelah Alternate Kael kalah, cerita FINALE (Author God) main sekali; selesai baru lanjut ke alur biasa */
    if(G.finale&&!(G.meta.fin&&G.meta.fin.seen))return G.finale(()=>{if(cb)cb(ok)})}
   if(cb)cb(ok)},...r);
  const L=alt&&G.state&&G.kaelLines?G.kaelLines(G.state.diff,'meet'):null;
  L?G.dialog(L,go):go()};
 G.battle.__kael=1}
G.fight=(foes,cb)=>G.battle(foes,cb);
/* ================= DUNGEON =================
   floors = jumlah lantai (Infinity = tanpa batas)   hp/atk = pengali musuh   xp = pengali EXP   yen = pengali Yen
   item = peluang drop Potion per lantai   need = chapter yang harus selesai (S.ch)   boss = nama boss di G.BOSS2 */
G.DUNGEONS=[
 {id:'latih',n:'RUANG LATIHAN',e:'\u{1F4D8}',d:'EXP berlimpah. Cocok untuk naik level.',need:1,floors:10,hp:1,atk:1,xp:1.8,yen:.6,item:.15,boss:'Penjaga Latihan'},
 {id:'brankas',n:'BRANKAS ARCHIVE',e:'\u{1F4B0}',d:'Banyak Yen, musuh lebih keras.',need:3,floors:10,hp:1.15,atk:1.1,xp:1,yen:2.4,item:.2,boss:'Penjaga Brankas'},
 {id:'harta',n:'RUANG HARTA',e:'\u{1F381}',d:'Banyak item (Potion & SP Drink) plus EXP lumayan.',need:6,floors:10,hp:1.2,atk:1.15,xp:1.2,yen:1.2,item:.6,boss:'Penjaga Harta'},
 {id:'abyss',n:'JURANG HAMPA',e:'\u{1F573}\uFE0F',d:'Turun terus sedalam mungkin. Hadiah terbesar, risiko terbesar.',need:10,floors:Infinity,hp:1.4,atk:1.25,xp:2.2,yen:1.8,item:.3,boss:'Penguasa Jurang'}];
G.dgFoes=(D,f)=>{const S=G.state,cn=Math.max(1,S.ch+1),inf=D.floors==Infinity,last=!inf&&f==D.floors,isB=last||(inf&&f%10==0),mid=!isB&&f%5==0,gr=inf?.08:.06;
 const m={hp:D.hp*(1+gr*(f-1)),atk:D.atk*(1+.04*(f-1)),xp:D.xp*(1+.06*(f-1))};
 if(isB){const a=[G.foe(cn,3,1,D.boss,{hp:m.hp*.9,atk:m.atk,xp:m.xp*2.5})];if(cn>=4)a.push(G.foe(cn,1,0,undefined,m));return a}
 const n=mid?2:f<3?1:f<7?2:3,a=[];for(let k=0;k<n;k++)a.push(G.foe(cn,1+(k%3),0,undefined,m));
 if(mid){a[0].cat='elite';a[0].xp=Math.round((+a[0].xp||10)*1.8)}
 return a};
G.runDungeon=D=>{const S=G.state;S.dg=S.dg||{};const bank={yen:0,items:0,sp:0},cn=Math.max(1,S.ch+1);let f=1;
 const pay=(k,why)=>{const y=Math.round(bank.yen*k);S.yen=(S.yen||0)+y;S.items=(S.items||0)+bank.items;S.spitems=(S.spitems||0)+bank.sp;G.save();
  alert(`${why}\n+\u00a5${y} \u00b7 +${bank.items} Potion \u00b7 +${bank.sp} SP Drink`);hub()};
 const go=()=>G.fight(G.dgFoes(D,f),ok=>{
  if(!ok){if(bank.yen||bank.items||bank.sp)alert(`Kalah di lantai ${f}. Hadiah dungeon yang belum diambil hangus.`);return after()}
  const last=D.floors!=Infinity&&f>=D.floors,five=f%5==0;
  bank.yen+=Math.round((25+10*cn)*D.yen*(1+.08*(f-1))*(five?2:1));
  if(Math.random()<D.item+(five?.5:0))bank.items++;if(Math.random()<D.item*.6)bank.sp++;
  if(D.floors==Infinity)S.dg.best=Math.max(S.dg.best||0,f);
  G.save();   /* EXP dari pertempuran ikut tersimpan tiap lantai */
  if(last){S.dg.clears=(S.dg.clears||0)+1;return pay(1.5,`${D.n} TUNTAS! Bonus clear x1.5`)}
  f++;
  if(!confirm(`Lantai ${f-1} selesai!\nHadiah terkumpul: \u00a5${bank.yen}, ${bank.items} Potion, ${bank.sp} SP Drink\n\nOK = lanjut ke lantai ${f}\nBatal = mundur & ambil hadiah`))return pay(1,'Mundur dari dungeon.');
  go()},[D.boss]);
 go()};

/* stage utama. Kalau boss-nya Kael Alternate dan kamu pernah mengalahkannya,
   dia menyapa dulu (senang / menghina "pengecut" tergantung difficulty sekarang vs rekor sebelumnya) */
function stage(ch=G.state.ch,st=G.state.st){const S=G.state,c=G.CHAPTERS[ch],boss=st==2,cur=ch==S.ch&&st==S.st;
 const foes=boss?[G.foe(ch+1,st+1,1,c.boss)].concat(ch>=3?[G.foe(ch+1,1,0)]:[]):Array.from({length:st+1},(_,k)=>G.foe(ch+1,st+1+k,0));
 const run=()=>G.fight(foes,ok=>{console.log('[Battle selesai]',ok?'MENANG':'KALAH');if(!ok)return after();
  if(!cur){G.save();return hub()}
  if(boss)G.dialog(c.outro,()=>{S.ch++;S.st=0;const n=Object.keys(G.CHARS).find(k=>G.CHARS[k].join==S.ch+1);
   if(n&&!S.party.includes(n)){S.party.push(n);S.lv[n]={l:Math.max(1,S.lv.kael.l-1),x:0}}G.save();S.ch>=G.CHAPTERS.length?ending():hub()});
  else{S.st++;G.save();hub()}},[c.boss]);
 run()}
/* ================= CHAPTER SELECT (dengan header EPISODE) ================= */
function chapters(){const S=G.state,cur=S.ch*3+S.st;
 /* header merah "EPISODE n" muncul di atas chapter pertama tiap episode */
 const epHead=i=>{const e=(G.EPISODES||[]).find(x=>x.from-1==i);
  return e?`<div class="eph" style="align-self:flex-start;display:block;margin:20px 0 4px 10px;padding:4px 22px;background:#e60012;color:#fff;font:italic 400 24px Impact,sans-serif;letter-spacing:2px;border:2px solid #fff;box-shadow:5px 5px 0 #000;transform:skewX(-10deg)">EPISODE ${e.id} &bull; ${e.t.toUpperCase()}</div>`:''};
 A().innerHTML=`<div class="wipe"></div><div class="cs"><div class="cl"><div class="cc"></div><div class="ci"><div class="tb2">CHAPTER SELECT</div><div id="cd">Arahkan kursor ke chapter.</div></div></div><div class="cr">${G.CHAPTERS.map((c,i)=>epHead(i)+`<div class="cp ${i*3>cur?'lock':''}" data-i="${i}"><div class="cn">${String(i+1).padStart(2,'0')}</div><div class="ct">${G.rn(c.t,i)}</div><div class="sb">${[0,1,2].map(k=>`<button data-c="${i}" data-s="${k}" ${i*3+k>cur?'disabled':''}>${k==2?'BOSS':'STAGE '+(k+1)}</button>`).join('')}</div></div>`).join('')}<button id="bk">Kembali</button></div></div>`;
 $('bk').onclick=hub;
 A().querySelectorAll('.cp').forEach(e=>e.onmouseenter=()=>{const i=+e.dataset.i,c=G.CHAPTERS[i],ep=G.epOf?G.epOf(i):null;
  $('cd').innerHTML=`${ep?`<small>EPISODE ${ep.id} &bull; ${ep.t}</small><br>`:''}<b>CHAPTER ${i+1}</b><br>${c.t}<br><small>"${c.blurb||c.intro[0][1]}"<br>Boss: ${c.boss}</small>`});
 A().querySelectorAll('.sb button').forEach(b=>b.onclick=()=>{const i=+b.dataset.c,k=+b.dataset.s;k==0?G.dialog(G.CHAPTERS[i].intro,()=>stage(i,k)):stage(i,k)})}
menu();