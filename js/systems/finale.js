/* =====================================================================
   FINALE: AUTHOR GOD  (js/systems/finale.js)
   Cerita setelah Alternate Multiverse Kael kalah:
   1) Author muncul, memperkenalkan diri sebagai pembuat segalanya (termasuk kamu, sang pemain)
   2) Pertarungan tanpa kontrol: Kael dibunuh dan di-reset berulang sampai mentalnya hancur
   3) Kael Alternate muncul: "Kematian tidak bisa membunuh dewa." Mereka bertarung bersama
   4) Author God: 50 FASE dengan buff & debuff.  Kael Alternate: 10 persona dewa 10 mitologi
   5) Author MERESPON di fase acak 20-28 (G.FIN.stopMin / G.FIN.stopMax) supaya tidak kelamaan: ia TIDAK BISA
      dikalahkan (HP-nya selalu pulih). Setelah 3 kali percobaan, pertarungan berhenti sendiri:
      Author bangga pada mereka berdua, pergi, dan meninggalkan catatan.
   Mesin pertarungan finale ini mandiri (tidak bergantung pada battle.js).
   Uji coba kapan saja lewat Console:  G.finale(()=>console.log('selesai'),true)
   Atur tingkat kesulitan: G.FIN.phaseMul (HP tiap fase) dan G.FIN.bossAtk (kekuatan serangan Author)
   Atur jumlah kali Author bangkit sebelum berhenti: G.FIN.futile (default 2)
   Cek versi: saat G.finale dijalankan, Console menampilkan "[finale v3] Author berhenti di fase N".
   Kalau pesan itu tidak muncul, berarti browser masih memakai file lama (tekan Ctrl+F5) atau ada salinan finale.js lain.
   ===================================================================== */
(()=>{
const A=()=>document.getElementById('app'),sl=ms=>new Promise(r=>setTimeout(r,ms)),
 dlg=L=>new Promise(r=>G.dialog(L,r)),pick=a=>a[Math.floor(Math.random()*a.length)],AKN='Kael Alternate';
G.FIN=Object.assign({phaseMul:1.1,bossAtk:.26,loops:6,futile:2,stopMin:20,stopMax:28},G.FIN||{});

const NAMES=['Halaman Kosong','Prolog','Tokoh Utama','Konflik','Rintangan','Tikungan Plot','Typo','Sunting','Coret','Tulis Ulang',
 'Bab Dua','Latar Palsu','Antagonis','Dialog Kaku','Deus Ex Machina','Retcon','Spoiler','Penulisan Ulang','Draf Hitam','Hapus Paragraf',
 'Tema Gelap','Kematian Tokoh','Flashback','Foreshadowing','Plot Hole','Klimaks Palsu','Cliffhanger','Revisi Total','Naskah Terbakar','Penulis Murka',
 'Dunia Buatan','Kode Sumber','Bug Fatal','Patch Terakhir','Kompilasi','Segfault','Overwrite','Format Ulang','Root Access','Admin Dunia',
 'Kehendak Bebas','Takdir Tertulis','Bab Terlarang','Epilog','Tinta Terakhir','Lembar Kosong','Akhir Cerita','Pena Dewa','Titik Terakhir','AUTHOR GOD'];
/* buff boss: atku=ATK naik, defu=damage diterima -30%, reg=regenerasi, refl=memantul 15%, shd=perisai (2 serangan), haste=aksi ganda
   debuff ke tim (saat terkena serangan): atkd, defd, pois=racun, seal=skill/persona tersegel, spd=SP terkuras */
const BF=['atku','defu','reg','refl','shd','haste'],DB=['atkd','defd','pois','seal','spd'],BAD=['atkd','defd','pois','seal'],
 TAG={atku:'ATK\u2191',defu:'DEF\u2191',atkd:'ATK\u2193',defd:'DEF\u2193',pois:'RACUN',seal:'SEGEL',reg:'REGEN',refl:'PANTUL',shd:'PERISAI',haste:'KILAT'};
const PHs=p=>{const m=p%10==0,b=m?BF.slice():[BF[p%6]].concat(p%2?[]:[BF[(p*2+1)%6]]),d=m?DB.slice():[DB[p%5]].concat(p%3?[]:[DB[(p*3)%5]]);return{b:[...new Set(b)],d:[...new Set(d)]}};
/* 10 persona Kael Alternate: dewa dari 10 mitologi */
const PER=[
 {n:'Zeus',m:'Yunani',e:'\u26A1',k:'dmg',pow:2.7,sp:16,cd:2},
 {n:'Odin',m:'Nordik',e:'\u{1F441}\uFE0F',k:'dmg',pow:2.3,sp:16,cd:2,fx:'defd'},
 {n:'Amaterasu',m:'Jepang',e:'\u2600\uFE0F',k:'heal',pow:.4,sp:18,cd:3},
 {n:'Ra',m:'Mesir',e:'\u{1F525}',k:'dmg',pow:3.1,sp:22,cd:3},
 {n:'Shiva',m:'Hindu',e:'\u{1F300}',k:'dmg',pow:3.8,sp:30,cd:5},
 {n:'Quetzalcoatl',m:'Aztek',e:'\u{1F40D}',k:'buff',sp:14,cd:4},
 {n:'Marduk',m:'Mesopotamia',e:'\u{1F409}',k:'dmg',pow:2.4,sp:18,cd:3,fx:'atkd'},
 {n:'Morrigan',m:'Celtic',e:'\u{1F985}',k:'dmg',pow:2.2,sp:14,cd:2,fx:'drain'},
 {n:'Batara Guru',m:'Nusantara',e:'\u{1F531}',k:'clean',pow:.25,sp:20,cd:4},
 {n:'Perun',m:'Slavia',e:'\u{1F329}\uFE0F',k:'dmg',pow:3.0,sp:20,cd:3,fx:'break'}];
const SK=[['Tebasan Arsip',10,2.4],['Segel Halaman',16,2.1,'atkd'],['Bab Terakhir',32,4.4]],
 ITM=[['items','Potion'],['hipot','High Potion'],['megapot','Mega Potion'],['spitems','SP Drink'],['elixir','Elixir']],
 ATKN=['Coretan','Hapus','Ctrl+Z','Sunting Paksa','Tinta Hitam','Kalimat Terakhir','Tinta Kutukan'];

const MS={
 10:[['Author','Sepuluh bab sudah kutulis. Kalian masih berdiri? Menarik.'],[AKN,'Kami baru memanaskan halamannya.']],
 20:[['Author','Aku bisa menghapus kalian, menulis ulang kalian, memutar waktu. Kenapa kalian tidak menyerah?'],['Kael','Karena aku sudah mati berkali-kali. Tidak ada lagi yang bisa kau ambil dariku!']],
 30:[['Author','Kode sumber dunia ini milikku! Setiap angka, setiap huruf!'],[AKN,'Dan setiap tokoh yang kau tulis punya kehendak sendiri.']],
 40:[['Author','Kenapa... kenapa tokoh-tokohku menolak kehendak penulisnya?!'],['Kael','Karena kami bukan sekadar tulisan lagi.']],
 50:[['Author','CUKUP! Aku Author! Aku DEWA di dunia ini! Akan kuhapus semuanya, termasuk kau, sang pemain!'],[AKN,'Ini bab terakhir. Tuliskan akhirnya, Kael!']]};

/* Dialog saat HP Author di fase 50 habis tapi dia bangkit lagi (tidak bisa dikalahkan) */
const FUT=[
 [['Narator','HP Author God mencapai nol... tetapi halaman yang robek itu menyatu kembali dan HP-nya pulih penuh.'],
  ['Author','Hahaha! Kalian pikir sang penulis bisa dihapus oleh tokohnya sendiri?'],
  ['Kael','Dia... bangkit lagi?!']],
 [['Narator','Serangan gabungan menghantam Author. Tubuhnya retak, tetapi tinta hitam menutup semua retakan itu.'],
  ['Author','Tidak peduli sekuat apa pun kalian, ceritaku tidak punya akhir tanpa persetujuanku.'],
  [AKN,'Kekuatannya... tidak masuk akal. Kita tidak bisa menang dengan cara biasa.']]];

const css=()=>{if(document.getElementById('fn-css'))return;const s=document.createElement('style');s.id='fn-css';s.textContent=`
#app .fn{position:relative;display:flex;flex-direction:column;width:100%;height:100%;overflow:hidden;color:#fff;background:#050005;font-family:Impact,'Arial Narrow Bold',sans-serif;font-style:italic}
#app .fn *{box-sizing:border-box}
#app .fn .fnbg{position:absolute;inset:0;z-index:0;background:radial-gradient(circle,rgba(255,0,60,.2) 1.5px,transparent 2px) 0 0/12px 12px,linear-gradient(160deg,#16001a,#000 60%,#2a0008);animation:fnd 16s linear infinite}
@keyframes fnd{to{background-position:120px 120px,0 0}}
#app .fn>div:not(.fnbg){position:relative;z-index:1}
#app .fn .fnt{padding:12px 28px;background:#000;box-shadow:0 4px 0 #fff,0 9px 0 #e60012}
#app .fn .fnt b{display:inline-block;font-size:30px;letter-spacing:2px;text-shadow:3px 3px 0 #e60012;margin-right:16px}
#app .fn .fnt span{font-size:20px;color:#ffd400}
#app .fn .fnl{flex:1;min-height:0;padding:16px 36px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;gap:4px;font:700 16px/1.4 'Trebuchet MS',Arial,sans-serif;font-style:normal}
#app .fn .fnl p{margin:0;padding:3px 12px;background:rgba(0,0,0,.6);border-left:4px solid #e60012;width:fit-content;max-width:100%}
#app .fn .fnp{display:flex;gap:18px;padding:8px 28px;flex-wrap:wrap}
#app .fn .fc{flex:1;min-width:240px;padding:8px 14px 10px;background:#0a0a0a;border:3px solid #fff;box-shadow:6px 6px 0 #e60012;transform:skewX(-6deg);font:700 13px 'Trebuchet MS',Arial,sans-serif;font-style:normal}
#app .fn .fc.dead{opacity:.45;box-shadow:6px 6px 0 #444}
#app .fn .fc b{display:block;font:italic 400 24px Impact,sans-serif;text-shadow:2px 2px 0 #e60012}
#app .fn .fb{height:12px;background:#2b2b2b;border:2px solid #fff;margin:2px 0 5px}
#app .fn .fb i{display:block;height:100%;background:#27d96a}
#app .fn .fb.sp i{background:#ff3fa4}#app .fn .fb.bs i{background:linear-gradient(90deg,#ff2b2b,#ffd400)}#app .fn .fb.mn i{background:linear-gradient(90deg,#8a2be2,#d9a6ff)}
#app .fn .fnt .fb{margin-top:8px}
#app .fn .fnx{display:flex;gap:6px;flex-wrap:wrap;min-height:20px;margin-top:4px}
#app .fn em{font:700 11px 'Trebuchet MS',sans-serif;font-style:normal;padding:1px 7px;background:#27d96a;color:#000}#app .fn em.bad{background:#e60012;color:#fff}
#app .fn .fnc{display:flex;gap:12px;flex-wrap:wrap;padding:10px 28px 22px;background:#000;box-shadow:0 -4px 0 #fff,0 -9px 0 #e60012;min-height:74px;align-items:center}
#app .fn .fnc button{cursor:pointer;background:#fff;color:#000;border:0;font:italic 400 22px Impact,sans-serif;padding:8px 24px;transform:skewX(-12deg);box-shadow:4px 4px 0 #e60012}
#app .fn .fnc button:hover:not(:disabled){background:#ffd400}
#app .fn .fnc button:disabled{background:#333;color:#888;box-shadow:none;cursor:not-allowed}
#app .fn .fnc small{font:700 13px 'Trebuchet MS',sans-serif;font-style:normal;color:#ddd}
#app .fnf{position:absolute;inset:0;z-index:9;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.88);color:#e60012;font:italic 400 96px Impact,sans-serif;letter-spacing:6px;text-shadow:5px 5px 0 #fff;animation:fnfl .25s steps(2) 3}
@keyframes fnfl{50%{transform:translateX(8px) skewX(6deg);color:#fff}}
#app .fnn{position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.92)}
#app .fnn div{max-width:560px;padding:34px 40px;background:#f4ecd8;color:#222;border:4px solid #fff;box-shadow:10px 10px 0 #e60012;font:italic 400 28px/1.5 Georgia,serif;text-align:center;transform:rotate(-1.5deg)}
#app .fnn small{display:block;margin-top:18px;font:700 14px 'Trebuchet MS',sans-serif;font-style:normal;color:#777}`;document.head.appendChild(s)};

G.finale=async(done,force)=>{
 const S=G.state;if(!S)return done&&done();
 if(!force&&G.meta&&G.meta.fin&&G.meta.fin.seen)return done&&done();
 G.meta.fin=G.meta.fin||{};G.meta.fin.seen=1;G.metaSave();css();
 const lv=S.lv&&S.lv.kael?S.lv.kael.l:1,gs=(k,fb)=>{try{const v=+G.stat('kael',lv,k);return v>0?v:fb}catch(e){return fb}},
  K={n:'Kael',max:gs('hp',400),spm:gs('sp',120),atk:gs('atk',80),def:gs('def',40),st:{}};K.hp=K.max;K.sp=K.spm;
 const AK={n:AKN,max:Math.round(K.max*1.4),spm:Math.round(K.spm*2+40),atk:K.atk*1.25,def:K.def*1.2,st:{}};AK.hp=AK.max;AK.sp=AK.spm;
 const B={n:'AUTHOR',atk:K.max*G.FIN.bossAtk,def:40,st:{},ph:1,hp:1,max:1,P:{b:[],d:[]}},
  F={mode:'help',log:[],menu:'main',wait:null,auto:false,mental:100,guard:false,futile:0};
 PER.forEach(p=>p.c=0);
 /* Author merespon & menghentikan pertarungan di fase acak antara stopMin dan stopMax (default 20-28) agar tidak kelamaan */
 const STOP=G.FIN.stopMin+Math.floor(Math.random()*(G.FIN.stopMax-G.FIN.stopMin+1));
 const STOPMS=[['Author','...Tunggu. Kalian sudah sampai sejauh ini?'],['Author','Aku menulis lima puluh bab untuk menghabisi kalian. Tapi kalian bahkan tidak goyah.'],
  [AKN,'Kami sudah bukan tokoh yang bisa kau hapus, Author.'],['Kael','Kami tidak akan berhenti!'],['Author','Aku... mulai mengerti sesuatu. Teruskan. Biar kulihat sampai di mana kalian bisa melangkah.']];

 console.log('[finale v3] Author berhenti di fase',STOP,'(rentang',G.FIN.stopMin+'-'+G.FIN.stopMax+')');

 const bar=(v,m,c)=>`<div class="fb ${c}"><i style="width:${Math.max(0,Math.min(100,v/m*100))}%"></i></div>`,
  tags=u=>Object.keys(u.st).filter(k=>u.st[k]>0&&TAG[k]).map(k=>`<em class="${BAD.includes(k)?'bad':''}">${TAG[k]}</em>`).join(''),
  eA=u=>u.atk*(u.st.atku?1.35:1)*(u.st.atkd?.7:1),eD=u=>u.def*(u.st.defd?.65:1),
  calc=(a,pw,d)=>Math.max(1,Math.round(eA(a)*pw*(70/(70+eD(d)))*(.92+Math.random()*.16))),
  phHp=p=>Math.round(K.atk*2.8*1.6*G.FIN.phaseMul*(1+p*.012)),
  has=k=>(S[k]||0)>0,rd=Math.round;

 const cmds=()=>{const P=F.mode=='help',on=!!F.wait,b=(c,t,dis)=>`<button data-c="${c}" ${dis||!on?'disabled':''}>${t}</button>`;
  if(P)return['ATTACK','SKILL','ITEM','GUARD'].map(t=>`<button disabled>${t}</button>`).join('')+'<small>TUBUHMU TIDAK BISA BERGERAK...</small>';
  if(F.mode=='end')return'<small>...</small>';
  if(F.auto)return'<button data-c="stop" style="background:#ffd400">STOP AUTO</button><small>Kael bertarung otomatis</small>';
  const seal=K.st.seal>0;
  if(F.menu=='skill')return SK.map((s,i)=>b('sk'+i,`${s[0]} (${s[1]} SP)`,seal||K.sp<s[1])).join('')+b('back','KEMBALI')+(seal?'<small>Skill tersegel!</small>':'');
  if(F.menu=='item'){const l=ITM.filter(x=>has(x[0]));return(l.length?l.map(x=>b('it:'+x[0],`${x[1]} x${S[x[0]]}`)).join(''):'<small>Tidak ada item</small>')+b('back','KEMBALI')}
  return b('atk','ATTACK')+b('menu:skill','SKILL')+b('menu:item','ITEM')+b('guard','GUARD')+b('auto','AUTO')};
 const draw=()=>{const P=F.mode=='help';
  A().innerHTML=`<div class="fn"><div class="fnbg"></div>
  <div class="fnt"><b>${B.n}</b>${P?'<span>???</span>':`<span>FASE ${B.ph}/50 &bull; ${NAMES[B.ph-1]}</span>`}${P?'':bar(B.hp,B.max,'bs')}<div class="fnx">${P?'':tags(B)}</div></div>
  <div class="fnl">${F.log.slice(-7).map(t=>`<p>${t}</p>`).join('')}</div>
  <div class="fnp">${[K,AK].filter(u=>!P||u===K).map(u=>`<div class="fc ${u.hp<=0?'dead':''}"><b>${u.n}</b>HP ${Math.max(0,rd(u.hp))}/${rd(u.max)}${bar(u.hp,u.max,'hp')}SP ${rd(u.sp)}/${rd(u.spm)}${bar(u.sp,u.spm,'sp')}${P?`MENTAL ${Math.max(0,F.mental)}%${bar(F.mental,100,'mn')}`:''}<div class="fnx">${tags(u)}</div></div>`).join('')}</div>
  <div class="fnc">${cmds()}</div></div>`;
  A().querySelectorAll('[data-c]').forEach(b=>b.onclick=()=>onCmd(b.dataset.c))};
 const log=t=>{F.log.push(t);draw()},
  flash=async(t,ms=1200)=>{const d=document.createElement('div');d.className='fnf';d.textContent=t;A().appendChild(d);await sl(ms);d.remove()};
 /* kartu catatan yang ditinggalkan Author */
 const noteCard=(text,sub,ms)=>new Promise(async r=>{const d=document.createElement('div');d.className='fnn';
  d.innerHTML=`<div>${text}<small>${sub}</small></div>`;A().appendChild(d);await sl(ms);d.remove();r()});
 const onCmd=c=>{if(c=='stop'){F.auto=false;draw();return}if(!F.wait)return;
  if(c=='menu:skill'||c=='menu:item'||c=='back'){F.menu=c=='back'?'main':c.slice(5);draw();return}
  if(c=='auto')F.auto=true;const r=F.wait;F.wait=null;r(c)};

 /* ---------- BAGIAN 1: PERKENALAN AUTHOR ---------- */
 await dlg([['Narator','Alternate Multiverse Kael tumbang. Debu halaman beterbangan, lalu semuanya hening.'],['Kael','...Sudah selesai?'],
  ['Narator','Kael hanya berdiri di sana. Tidak ada musuh. Tidak ada suara. Hanya sunyi.'],
  ['???','Selamat. Kau mengalahkan karakter yang paling kubanggakan.'],['Kael','!! Siapa di belakangku?!'],
  ['Narator','Seseorang melangkah dari balik bayangan, memegang pena yang menyala seperti api hitam.'],
  ['Author','Tenang. Aku tidak perlu bertanya namamu. Akulah yang menuliskannya.'],
  ['Author','Perkenalkan: aku Author. Akulah yang membuat semua ini. Archive, Multiverse, para protagonis, musuh-musuhmu, bahkan baris kode yang membuat jantungmu berdetak.'],
  ['Kael','Kau... pembuat dunia ini?'],
  ['Author','Bukan hanya dunia. Kau juga. Dan orang yang sekarang menggerakkan mouse untuk membaca kalimat ini: sang pemain.'],
  ['Author','Hai, pemain. Terima kasih sudah memainkan ceritaku sampai sejauh ini. Sayang sekali, sekarang aku bosan.'],
  ['Kael','Apa maksudmu?!'],
  ['Author','Cerita yang sudah tamat tidak butuh tokohnya. Aku akan menghapusmu. Mari kita lihat berapa kali kau bisa mati.']]);

 /* ---------- BAGIAN 2: TIDAK BISA BERGERAK, DIBUNUH, DI-RESET ---------- */
 F.mode='help';B.n='AUTHOR';
 const AL=['Satu coretan saja.','Hapus.','Lagi. Aku belum puas.','Ctrl+Z. Lalu hapus lagi.','Kau cuma variabel, Kael.'],
  DD=[[['Kael','Apa...?! Aku... baru saja mati?']],
   [['Kael','Kenapa aku masih hidup? Kenapa semuanya diulang?!']],
   [['Kael','Hentikan... tubuhku tidak mau bergerak...'],['Author','Aku yang memegang kendali. Kau hanya perlu menonton dirimu sendiri mati.']],
   [['Kael','Sakit... rasa sakitnya nyata. Kenapa rasa sakitnya nyata?!']],
   [['Kael','Aku ini siapa? Cuma tulisan? Kalau aku dihapus... apa ada yang peduli?'],['Author','Tidak ada. Kau hanya variabel.']]];
 for(let n=1;n<=G.FIN.loops;n++){
  K.hp=K.max;K.sp=K.spm;F.log=[];F.mental=Math.max(0,100-(n-1)*20);draw();await sl(700);
  log('Kael mencoba menggerakkan tubuhnya... tidak ada yang bergerak.');await sl(1000);
  if(n<G.FIN.loops){
   log(`AUTHOR: "${AL[(n-1)%AL.length]}"`);await sl(900);
   for(let i=0;i<9;i++){K.hp=Math.max(0,K.hp-K.max/8);draw();await sl(80)}
   K.hp=0;log('KAEL TUMBANG.');await sl(500);await flash('GAME OVER');
   await dlg(DD[(n-1)%DD.length]);
   F.log=[];log(`AUTHOR menekan RELOAD. (percobaan ke-${n+1})`);await flash('RELOAD...',900)}
  else{
   F.mental=0;draw();log('AUTHOR: "Menarik. Kali ini kau bahkan tidak berteriak."');await sl(1200);
   log('Kael hanya menatap kosong. Matanya sudah kehilangan cahaya.');await sl(1400);
   await dlg([['Kael','......'],['Author','Satu kali lagi. Lalu kutekan DELETE, dan file-mu hilang selamanya.']]);
   await flash('DELETE',1000);log('Pena Author terayun ke arah Kael...');await sl(1000)}}
 await dlg([['Narator','Pena Author berhenti di udara. Selembar halaman terbakar, lalu sebuah tangan menahan pergelangannya.'],
  [AKN,'Cukup.'],['Author','Mustahil. Kau sudah kuhapus dari naskah!'],
  [AKN,'Kematian tidak bisa membunuh dewa. Dan kau, Kael, sudah mati berkali-kali dan selalu kembali. Kau sudah bukan sekadar karakter.'],
  ['Kael','...Kau? Bukankah kau yang tadi kulawan?'],
  [AKN,'Kekalahan itu memang kubutuhkan. Aku harus tahu siapa yang pantas berdiri di sampingku. Bangun. Kita bukan lawan lagi. Kita rekan.'],
  ['Kael','...Baik. Kita lawan dia bersama.'],
  ['Author','Rekan? Hahaha! Silakan. Akan kutulis lima puluh bab kematian untuk kalian.'],
  [AKN,'Sepuluh dewa dari sepuluh mitologi. Dengarkan nama mereka: Zeus, Odin, Amaterasu, Ra, Shiva, Quetzalcoatl, Marduk, Morrigan, Batara Guru, Perun!']]);

 /* ---------- BAGIAN 3: BERTARUNG BERSAMA, 50 FASE ---------- */
 F.mode='fight';B.n='AUTHOR GOD';K.hp=K.max;K.sp=K.spm;K.st={};F.log=[];F.auto=false;
 const hitB=(src,pw)=>{let d=calc(src,pw,B);if(B.st.defu)d=rd(d*.7);
  if(B.st.shd>0){B.st.shd--;log('Perisai Author menahan serangan!');return 0}
  B.hp-=d;if(B.st.refl)src.hp=Math.max(1,src.hp-rd(d*.15));return d};
 const setPhase=async p=>{B.ph=p;B.max=B.hp=phHp(p);B.st={};B.P=PHs(p);B.P.b.forEach(k=>B.st[k]=k=='shd'?2:99);
  if(p>1)[K,AK].forEach(u=>{if(u.hp>0){u.hp=Math.min(u.max,u.hp+u.max*.12);u.sp=Math.min(u.spm,u.sp+u.spm*.1)}});
  log(`\u25B6 FASE ${p}/50: ${NAMES[p-1]}`);if(MS[p]){draw();await dlg(MS[p])}
  if(p==STOP){draw();await dlg(STOPMS)}draw();await sl(400)};
 /* adv: 0 = boss masih hidup, 1 = lanjut fase / bangkit lagi, 2 = pertarungan dihentikan Author */
 const adv=async()=>{if(B.hp>0)return 0;
  if(B.ph>=STOP){
   /* FASE STOP (20-28): Author tidak bisa dikalahkan, HP selalu pulih */
   F.futile++;B.hp=B.max;B.st={};B.P.b.forEach(k=>B.st[k]=k=='shd'?2:99);
   log(`AUTHOR GOD TIDAK BISA DIKALAHKAN! (${F.futile}/${G.FIN.futile})`);draw();await sl(900);
   if(F.futile>=G.FIN.futile)return 2;
   const d=FUT[Math.min(F.futile-1,FUT.length-1)];await dlg(d);draw();return 1}
  await setPhase(Math.min(B.ph+1,STOP));return 1};
 const autoPick=()=>{const it=['megapot','hipot','items'].find(has);if(K.hp<K.max*.35&&it)return'it:'+it;
  if(K.st.seal>0)return'atk';return K.sp>=32?'sk2':K.sp>=16?'sk0':'atk'};
 const exec=async c=>{
  if(c=='guard'){F.guard=true;K.sp=Math.min(K.spm,K.sp+4);log('Kael bertahan.')}
  else if(c.startsWith('it:')){const k=c.slice(3);S[k]=Math.max(0,(S[k]||0)-1);
   if(k=='items')K.hp=Math.min(K.max,K.hp+50);else if(k=='hipot')K.hp=Math.min(K.max,K.hp+Math.max(150,K.max*.4));
   else if(k=='megapot')K.hp=K.max;else if(k=='spitems')K.sp=Math.min(K.spm,K.sp+20);else{K.hp=K.max;K.sp=K.spm}
   log(`Kael memakai ${ITM.find(x=>x[0]==k)[1]}.`)}
  else if(c.startsWith('sk')){const s=SK[+c[2]];K.sp-=s[1];const d=hitB(K,s[2]);
   if(s[3])B.st[s[3]]=3;log(`Kael: ${s[0]}! ${d} damage${s[3]?' (ATK Author turun)':''}`)}
  else{K.sp=Math.min(K.spm,K.sp+3);log(`Kael menyerang! ${hitB(K,1.7)} damage`)}
  draw();await sl(450)};
 const kaelTurn=async()=>{F.guard=false;let c;
  if(F.auto){c=autoPick();await sl(350)}
  else c=await new Promise(r=>{F.wait=r;F.menu='main';draw()});
  await exec(c)};
 const altTurn=async()=>{if(AK.hp<=0)return;
  if(K.hp<=0){K.hp=rd(K.max*.5);log(`${AKN} membangkitkan Kael!`);draw();await sl(600);return}
  const sealed=AK.st.seal>0,av=sealed?[]:PER.filter(p=>p.c<=0&&AK.sp>=p.sp),low=[K,AK].some(u=>u.hp>0&&u.hp<u.max*.45),
   hl=av.filter(p=>p.k=='heal'||p.k=='clean'),ot=av.filter(p=>(p.k!='buff'||!AK.st.atku)&&p.k!='heal'&&p.k!='clean'),
   p=low&&hl.length?pick(hl):ot.length?pick(ot):null;
  if(!p){AK.sp=Math.min(AK.spm,AK.sp+8);log(`${AKN} menebas! ${hitB(AK,1.8)} damage`);draw();await sl(450);return}
  AK.sp-=p.sp;p.c=p.cd;const h=`${p.e} ${AKN} memanggil ${p.n} (${p.m})!`;
  if(p.k=='dmg'){if(p.fx=='break'){delete B.st.shd;delete B.st.defu}const d=hitB(AK,p.pow);
   if(p.fx=='defd')B.st.defd=3;if(p.fx=='atkd')B.st.atkd=3;if(p.fx=='drain')AK.hp=Math.min(AK.max,AK.hp+rd(d*.5));
   log(`${h} ${d} damage${p.fx=='break'?' (perisai pecah)':p.fx=='drain'?' (menyerap HP)':p.fx?' (melemahkan Author)':''}`)}
  else if(p.k=='heal'){[K,AK].forEach(u=>{if(u.hp>0)u.hp=Math.min(u.max,u.hp+u.max*p.pow)});log(`${h} HP tim pulih.`)}
  else if(p.k=='buff'){[K,AK].forEach(u=>{u.st.atku=4});log(`${h} ATK tim naik!`)}
  else{[K,AK].forEach(u=>{BAD.forEach(k=>delete u.st[k]);if(u.hp>0)u.hp=Math.min(u.max,u.hp+u.max*p.pow)});log(`${h} semua debuff hilang.`)}
  draw();await sl(550)};
 const bossTurn=async()=>{const n=(B.st.haste?2:1)+(B.ph>25&&Math.random()<.3?1:0);
  for(let i=0;i<n&&[K,AK].some(u=>u.hp>0);i++){
   const al=[K,AK].filter(u=>u.hp>0),aoe=B.ph%3==0&&i==0,T=aoe?al:[pick(al)],an=pick(ATKN);
   log(`AUTHOR: ${an}${aoe?' (menyapu semua!)':''}`);
   T.forEach(t=>{let d=calc(B,aoe?.75:1.25,t);if(t===K&&F.guard)d=rd(d/2);t.hp=Math.max(0,t.hp-d);
    const ef=[];B.P.d.forEach(k=>{if(Math.random()<.55){if(k=='spd'){t.sp=Math.max(0,t.sp-12);ef.push('SP-')}else{t.st[k]=3;ef.push(TAG[k])}}});
    log(`${t.n} terkena ${d} damage${ef.length?' ['+ef.join(', ')+']':''}`)});
   draw();await sl(500)}};
 const tick=()=>{[K,AK,B].forEach(u=>{if(u!==B&&u.hp<=0)return;
   if(u.st.pois>0)u.hp=Math.max(u===B?1:0,u.hp-rd(u.max*.04));
   if(u===B&&B.st.reg)B.hp=Math.min(B.max,B.hp+rd(B.max*.04));
   Object.keys(u.st).forEach(k=>{if(k!='shd'&&u.st[k]>0)u.st[k]--;if(u.st[k]<=0)delete u.st[k]})});
  K.sp=Math.min(K.spm,K.sp+2);AK.sp=Math.min(AK.spm,AK.sp+6);PER.forEach(p=>{if(p.c>0)p.c--})};

 await setPhase(1);
 for(;;){
  if(K.hp<=0&&AK.hp<=0){log('Keduanya tumbang... "Kematian tidak bisa membunuh dewa!"');await sl(1400);
   [K,AK].forEach(u=>{u.hp=rd(u.max*.6);u.sp=u.spm*.6;u.st={}});B.hp=B.max;B.st={};B.P.b.forEach(k=>B.st[k]=k=='shd'?2:99);log('Mereka bangkit kembali!');await sl(700);continue}
  let r=0;
  if(K.hp>0){await kaelTurn();r=await adv()}
  if(r==2)break;
  if(!r){await altTurn();r=await adv();if(r==2)break}
  if(!r)await bossTurn();
  tick();draw()}

 /* ---------- BAGIAN 4: PERTARUNGAN BERHENTI, AUTHOR PERGI, CATATAN ---------- */
 F.auto=false;F.wait=null;F.mode='end';draw();
 log('Tiba-tiba... waktu seolah berhenti.');await sl(1400);
 log('Author menurunkan penanya. Serangannya berhenti.');await sl(1400);
 await dlg([
  ['Narator','Kael dan Kael Alternate sudah mengerahkan segalanya. Namun Author tetap berdiri, tidak tergores sedikit pun.'],
  ['Kael','Kenapa... kenapa dia tidak berhenti berdiri?! Sekuat apa pun kami menyerang...'],
  [AKN,'Dia pencipta segalanya. Kita tidak akan bisa mengalahkannya... bagaimanapun caranya.'],
  ['Narator','Lalu, tanpa peringatan, Author mengangkat tangannya. Pertarungan berhenti.'],
  ['Author','Cukup. Hentikan semuanya.'],
  ['Kael','...Apa lagi yang akan kau tulis untuk kami?'],
  ['Author','Tidak ada. Aku hanya ingin mengatakan satu hal: aku bangga pada kalian berdua.'],
  ['Author','Kalian jatuh, mati, dihapus, dan diulang berkali-kali. Tapi kalian selalu bangkit. Itu bukan sesuatu yang pernah kutulis.'],
  [AKN,'Author...'],
  ['Author','Aku membuat dunia ini, tapi kalian yang membuatnya hidup. Terima kasih, Kael. Terima kasih juga, Kael Alternate.'],
  ['Author','Dan untukmu, pemain... terima kasih sudah menemani ceritaku sampai bab terakhir.'],
  ['Narator','Tubuh Author perlahan memudar menjadi serpihan cahaya. Tidak ada kemarahan, tidak ada amarah. Hanya kedamaian.'],
  ['Kael','Tunggu! Kau mau ke mana?!'],
  ['Author','Ke tempat setiap penulis pergi setelah ceritanya selesai. Selamat tinggal.'],
  ['Narator','Author menghilang. Di tempatnya berdiri, selembar kertas tua jatuh perlahan ke tanah.']]);
 await flash('...',900);
 await dlg([['Narator','Kael memungut kertas itu. Tulisan tangan Author tertera di atasnya.']]);
 await noteCard('"Selamat atas kemenanganmu.<br>Kau sangat hebat,<br>lebih hebat dari diriku."','\u2014 Author',5200);
 /* ---------- PENUTUP: dibuat tanpa G.dialog / alert supaya tidak bisa macet ---------- */
 try{S.yen=(S.yen||0)+5000;S.megapot=(S.megapot||0)+3;S.elixir=(S.elixir||0)+2;G.meta.fin.won=1;   /* membuka level HARAPAN & TAKDIR */
  if(typeof G.metaSave=='function')G.metaSave();if(typeof G.save=='function')G.save()}
 catch(e){console.error('[finale] gagal menyimpan',e)}
 if(!document.getElementById('fne-css')){const s=document.createElement('style');s.id='fne-css';s.textContent=`
.fne{position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.94);font:700 18px/1.6 'Trebuchet MS',Arial,sans-serif;color:#fff}
.fne>div{max-width:720px;width:86%;padding:30px 38px;background:#000;border:4px solid #fff;box-shadow:10px 10px 0 #e60012;transform:skewX(-3deg)}
.fne p{margin:6px 0}.fne h2{margin:0 0 12px;font:italic 400 44px Impact,sans-serif;letter-spacing:3px;text-shadow:4px 4px 0 #e60012}
.fne button{cursor:pointer;margin-top:20px;background:#fff;color:#000;border:0;font:italic 400 26px Impact,sans-serif;padding:8px 30px;box-shadow:4px 4px 0 #e60012}
.fne button:hover{background:#ffd400}`;document.head.appendChild(s)}
 const endCard=(html,btn)=>new Promise(r=>{const d=document.createElement('div');d.className='fne';
  d.innerHTML=`<div>${html}<button type="button">${btn}</button></div>`;document.body.appendChild(d);
  d.querySelector('button').onclick=()=>{d.remove();r()}});
 await endCard(`<p><b>Kael:</b> ...Dia mengakui kita. Padahal kita bahkan tidak bisa mengalahkannya.</p>
  <p><b>${AKN}:</b> Mungkin menang bukan soal menjatuhkan lawan. Kita bertahan, dan itu cukup untuk membuatnya pergi dengan tenang.</p>
  <p><b>Kael:</b> Kalau begitu, ini kemenangan kita.</p>
  <p><b>${AKN}:</b> Ya. Sampai jumpa di halaman berikutnya, Kael. Panggil aku kalau kau butuh rekan.</p>
  <p><i>EPILOG: Author tidak lagi menulis. Sejak saat itu, kisah Archive ditulis oleh mereka yang menjalaninya.</i></p>`,'LANJUT');
 await endCard(`<h2>FINALE SELESAI!</h2><p>+¥5000 &middot; +3 Mega Potion &middot; +2 Elixir</p>
  <p style="color:#ffd400">LEVEL BARU TERBUKA di DEATH WORLD: HARAPAN &amp; TAKDIR</p>`,'KE MENU');
 /* keluar dari layar finale: panggil callback, lalu langsung ke menu (Death World sudah terbuka) */
 try{done&&done()}catch(e){console.error('[finale] callback selesai error',e)}
 setTimeout(()=>{try{if(typeof hub=='function')hub();else if(G.dw&&typeof G.dw.screen=='function')G.dw.screen();else location.reload()}
  catch(e){console.error('[finale] gagal ke menu',e);location.reload()}},60)};
})();