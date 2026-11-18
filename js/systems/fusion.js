window.G=window.G||{};
/* =====================================================================
   SISTEM FUSE  (muat SETELAH hub.js)
   - Tab baru "FUSE" di HUB
   - Gabungkan 3 PERSONA atau 3 SKILL milik satu protagonis -> 1 persona/skill baru
   - Hasil bisa dilihat dulu sebelum fusi (preview), bahan akan HABIS dipakai
   - 35 persona + 35 skill hasil fusi (7 elemen x 5 tingkat)
   - 9 persona + 6 skill dari RESEP KHUSUS (butuh 3 bahan tertentu)
   Aturan hasil:
     1. Elemen hasil = elemen yang paling banyak di 3 bahan (seri = elemen bahan terkuat)
     2. Tingkat hasil ditentukan rata-rata Power bahan
     3. 3 bahan satu elemen = tingkat +1 (bonus murni)
     4. 3 bahan hasil fusi = tingkat paling rendah di antara mereka +1
     5. Maksimal tingkat 5 (resep khusus lebih kuat lagi)
   ===================================================================== */
(()=>{
if(G._fuse)return;G._fuse=1;
const EL=['phys','fire','ice','elec','wind','light','dark'];
const KRE={phys:/phys|fisik|slash|tebas|pukul/i,fire:/fire|api/i,ice:/\bice\b|\bes\b|beku/i,elec:/elec|petir|volt/i,wind:/wind|angin/i,light:/light|cahaya|suci|holy|bless/i,dark:/dark|gelap|kutuk|curse/i};
const FL={phys:'kekuatan fisik murni',fire:'api yang membakar',ice:'dingin yang membekukan',elec:'petir yang menyambar',wind:'angin yang menyayat',light:'cahaya yang menyucikan',dark:'kegelapan yang melahap'};
const ELN={phys:'Fisik',fire:'Api',ice:'Es',elec:'Petir',wind:'Angin',light:'Cahaya',dark:'Gelap'};
const PT={phys:'pahlawan',fire:'iblis',ice:'malaikat',elec:'dewa',wind:'dewa',light:'malaikat',dark:'iblis'};
const RM=['I','II','III','IV','V'];

/* ---------- DATA: persona hasil fusi (nama, emoji) per elemen, tingkat 1 sampai 5 ---------- */
const PN={
 phys:[['Berserker','\u{1F4A2}'],['Sigurd','\u{1F5E1}'],['Cu Chulainn','\u{1F531}'],['Rama','\u{1F3F9}'],['Vajra Titan','\u{1F5FF}']],
 fire:[['Salamander','\u{1F98E}'],['Ifrit','\u{1F479}'],['Agni','\u{1F525}'],['Hephaestus','\u2692'],['Kagutsuchi','\u{1F30B}']],
 ice:[['Jack Frost','\u26C4'],['Snow Queen','\u{1F478}'],['Skadi','\u{1F3D4}'],['Ymir','\u{1F9CA}'],['Cocytus','\u2744']],
 elec:[['Raiju','\u26A1'],['Raijin','\u{1F941}'],['Thor','\u{1F528}'],['Indra','\u{1F329}'],['Takemikazuchi','\u2694']],
 wind:[['Sylph','\u{1F343}'],['Fuujin','\u{1F32C}'],['Garuda','\u{1F985}'],['Quetzalcoatl','\u{1F40D}'],['Aeolus','\u{1F32A}']],
 light:[['Seraph','\u{1F54A}'],['Ishtar','\u2B50'],['Metatron','\u{1F4D6}'],['Ra','\u2600'],['Ahura Mazda','\u{1F506}']],
 dark:[['Lilith','\u{1F319}'],['Mara','\u{1F608}'],['Hecate','\u{1F311}'],['Nyx','\u{1F30C}'],['Abaddon','\u2620']]};
/* ---------- DATA: skill hasil fusi per elemen, tingkat 1 sampai 5 ---------- */
const SN={
 phys:['Tebasan Silang','Hantaman Baja','Badai Tebasan','Raungan Pedang','Tebasan Semesta'],
 fire:['Percikan Api','Bola Inferno','Ledakan Magma','Badai Api','Surya Mini'],
 ice:['Serpihan Es','Tombak Es','Badai Salju','Zero Mutlak','Kiamat Beku'],
 elec:['Kilat Mini','Sambaran Ganda','Rantai Petir','Tombak Halilintar','Palu Halilintar'],
 wind:['Sayatan Angin','Pusaran Tajam','Tornado','Badai Pemotong','Amukan Topan'],
 light:['Kilau Suci','Tombak Cahaya','Hujan Cahaya','Sinar Penghakiman','Cahaya Awal Mula'],
 dark:['Bisikan Gelap','Kabut Kutukan','Gerhana','Lubang Hampa','Akhir Segala Bayang']};
/* statistik per tingkat */
const PP=[92,102,112,122,134],PS=[26,28,30,33,36],PC=[3,3,3,4,4];
const KP=[58,72,86,100,118],KS=[14,19,24,30,36],KC=[1,2,2,3,4];
/* ---------- DATA: RESEP KHUSUS (butuh persis 3 bahan bernama ini, urutan bebas) ---------- */
const SPECIAL=[
 {kind:'persona',id:'fz_sp_1',need:['Mephisto','Surtr','Fenrir'],n:'Satan Maharaja',e:'\u{1F47F}',t:'iblis',kd:'dark',pow:150,sp:40,cd:4,cost:7000,d:'Raja para iblis. Tiga iblis terkuat melebur jadi satu kutukan.'},
 {kind:'persona',id:'fz_sp_2',need:['Raphael','Michael','Uriel'],n:'Serafim Agung',e:'\u{1F607}',t:'malaikat',kd:'light',pow:150,sp:40,cd:4,cost:7000,d:'Malaikat tertinggi. Cahaya tiga panglima langit dalam satu sayap.'},
 {kind:'persona',id:'fz_sp_3',need:['Loki','Surtr','Fenrir'],n:'Ragnarok',e:'\u2604',t:'iblis',kd:'fire',pow:152,sp:41,cd:4,cost:7500,d:'Hari kiamat para dewa. Api, tipu daya, dan taring menghancurkan segalanya.'},
 {kind:'persona',id:'fz_sp_4',need:['Zeus','Odin','Amaterasu'],n:'Pantheon',e:'\u{1F3DB}',t:'khusus',kd:'light',pow:160,sp:42,cd:4,cost:9000,d:'Dewan para dewa dunia. Tiga dewa tertinggi menyatukan kuasa.'},
 {kind:'persona',id:'fz_sp_5',need:['Hercules','Achilles','Gilgamesh'],n:'Raja Pahlawan Sejati',e:'\u{1F9B8}',t:'pahlawan',kd:'phys',pow:158,sp:41,cd:4,cost:8500,d:'Gabungan kekuatan, ketangguhan, dan kemegahan tiga pahlawan legendaris.'},
 {kind:'persona',id:'fz_sp_6',need:['King Arthur','Joan of Arc','Gilgamesh'],n:'Pembawa Panji Suci',e:'\u{1F6A9}',t:'pahlawan',kd:'light',pow:155,sp:41,cd:4,cost:8000,d:'Panji yang dibawa tiga pahlawan. Siapa pun di bawahnya tidak mengenal takut.'},
 {kind:'persona',id:'fz_sp_7',need:['Thoth','Azazel','Michael'],n:'Penulis Takdir',e:'\u{1F58B}',t:'khusus',kd:'light',pow:158,sp:41,cd:4,cost:8500,d:'Juru tulis yang menulis akhir cerita musuh dengan tinta cahaya.'},
 {kind:'persona',id:'fz_sp_8',need:['Gabriel','Odin','Susanoo'],n:'Terompet Badai',e:'\u{1F3BA}',t:'dewa',kd:'wind',pow:150,sp:40,cd:4,cost:7000,d:'Terompet suci ditiup di tengah badai dewa. Semua musuh tersapu.'},
 {kind:'persona',id:'fz_sp_9',need:['Mephisto','Raphael','Loki'],n:'Lucifer',e:'\u{1F31F}',t:'khusus',kd:'dark',pow:160,sp:42,cd:4,cost:9000,d:'Malaikat yang jatuh. Terang dan gelap menyatu dalam satu pemberontakan.'},
 {kind:'skill',id:'fz_ss_1',need:['Tebasan Arsip','Segel Halaman','Bab Terakhir'],n:'Arsip Terlarang',kd:'dark',pow:125,sp:38,cd:4,cost:4000,d:'Membuka halaman terlarang dari Archive. Musuh terhapus dari catatan.'},
 {kind:'skill',id:'fz_ss_2',need:['Tinju Badai','Tarian Pedang','Hantaman Meteor'],n:'Tinju Seribu Bintang',kd:'phys',pow:120,sp:36,cd:4,cost:3500,d:'Seribu pukulan secepat meteor jatuh.'},
 {kind:'skill',id:'fz_ss_3',need:['Api Janji','Hantaman Meteor','Embun Beku'],n:'Termal Kiamat',kd:'fire',pow:118,sp:35,cd:4,cost:3500,d:'Panas dan dingin ekstrem bertabrakan. Musuh retak dari dalam.'},
 {kind:'skill',id:'fz_ss_4',need:['Sambaran Fajar','Murka Langit','Pusaran Senyap'],n:'Topan Petir',kd:'elec',pow:120,sp:36,cd:4,cost:3500,d:'Badai yang dipenuhi petir. Menyambar tanpa henti.'},
 {kind:'skill',id:'fz_ss_5',need:['Lonceng Suci','Cahaya Penebus','Bayang Kutukan'],n:'Neraca Penghakiman',kd:'light',pow:122,sp:36,cd:4,cost:3500,d:'Menimbang dosa musuh dengan cahaya dan bayangan, lalu menjatuhkan vonis.'},
 {kind:'skill',id:'fz_ss_6',need:['Tebasan Takdir','Cahaya Harapan','Epilog Semesta'],n:'Takdir Baru',kd:'light',pow:140,sp:42,cd:4,cost:6000,d:'Tebasan yang menulis ulang akhir pertarungan menjadi kemenangan.'}];

/* ---------- gabungkan semua jadi daftar definisi ---------- */
const DEF=[];
EL.forEach(kd=>[0,1,2,3,4].forEach(t=>{
 DEF.push({kind:'persona',id:'fz_p_'+kd+t,n:PN[kd][t][0],e:PN[kd][t][1],t:PT[kd],kd,pow:PP[t],sp:PS[t],cd:PC[t],fz:t,d:`Persona hasil fusi tingkat ${RM[t]}. Memanggil ${FL[kd]}.`});
 DEF.push({kind:'skill',id:'fz_s_'+kd+t,n:SN[kd][t],kd,pow:KP[t],sp:KS[t],cd:KC[t],fz:t,d:`Skill hasil fusi tingkat ${RM[t]}. Menyerang dengan ${FL[kd]}.`})}));
SPECIAL.forEach(s=>DEF.push(Object.assign({fz:5},s)));

/* ---------- daftarkan ke G.PERSONAS / G.SKILLS (tidak dijual di shop: reward:true) ---------- */
const kindFor=kd=>{const K=G.KIND||{},dk={light:'bless',dark:'curse'}[kd];if(dk&&K[dk])return dk;
 try{return G.kindOf(KRE[kd]||/phys/i)}catch(e){return Object.keys(K)[0]}};
const reg=()=>{if(!G.KIND)return;G.PERSONAS=G.PERSONAS||[];G.SKILLS=G.SKILLS||[];
 DEF.forEach(x=>{const arr=x.kind=='persona'?G.PERSONAS:G.SKILLS;if(arr.some(v=>v.id==x.id))return;
  const o={id:x.id,n:x.n,k:kindFor(x.kd),pow:x.pow,sp:x.sp,cd:x.cd,price:0,d:x.d,reward:true,fz:x.fz,kd:x.kd};
  if(x.kind=='persona'){o.e=x.e;o.t=x.t}arr.push(o)})};
const master=(kind,id)=>(kind=='persona'?G.PERSONAS:G.SKILLS).find(v=>v.id==id);
const elemOf=x=>{if(x.kd)return x.kd;const K=G.KIND||{},tx=(x.k||'')+' '+(K[x.k]||'');
 return EL.find(kd=>KRE[kd].test(tx))||EL.find(kd=>kindFor(kd)==x.k)||'phys'};
const lbl=t=>G.tLabel?G.tLabel(t):t;

/* ---------- HITUNG HASIL FUSI ---------- */
const calc=(kind,items)=>{
 const names=items.map(x=>x.n).sort().join('|'),
  sp=SPECIAL.find(s=>s.kind==kind&&s.need.slice().sort().join('|')==names);
 if(sp)return{res:master(kind,sp.id),cost:sp.cost,special:1,tier:5};
 const ths=kind=='persona'?[88,96,104,112]:[50,62,76,90],
  avg=items.reduce((a,x)=>a+(x.pow||0),0)/3,els=items.map(elemOf),cnt={};
 let t=ths.filter(v=>avg>=v).length;
 els.forEach(e=>cnt[e]=(cnt[e]||0)+1);
 if(Object.keys(cnt).length==1)t++;                                   /* bonus murni */
 if(items.every(x=>x.fz!=null))t=Math.max(t,Math.min(...items.map(x=>x.fz))+1);   /* fusi bertingkat */
 t=Math.min(4,t);
 const order=items.map((x,i)=>i).sort((a,b)=>(items[b].pow||0)-(items[a].pow||0));
 let kd=els[order[0]],bc=0;
 order.forEach(i=>{if(cnt[els[i]]>bc){bc=cnt[els[i]];kd=els[i]}});
 return{res:master(kind,'fz_'+(kind=='persona'?'p':'s')+'_'+kd+t),cost:(t+1)*(kind=='persona'?900:450),special:0,tier:t}};

/* ---------- UI ---------- */
const kc=(n,t,d,x,w,cls)=>`<div class="kc ${w?'wide':''} ${cls||''}"><b>${n}</b><span>${t}</span><small>${d}</small>${x||''}</div>`;
const equipped=(ch,kind)=>new Set((G.moves?G.moves(ch,kind,true):[]).filter(m=>m.eq).map(m=>m.id));
const redraw=()=>{const sc=document.querySelector('#app .hbp'),y=sc?sc.scrollTop:0;window.hub();const n=document.querySelector('#app .hbp');if(n)n.scrollTop=y};

const decorate=isF=>{
 const A=document.getElementById('app');if(!A)return;
 const T=A.querySelector('.tabs'),P=A.querySelector('.hbp'),B=A.querySelector('.hbs'),U=G.ui,S=G.state;
 if(!T||!P||!S)return;
 /* tombol tab FUSE */
 if(!T.querySelector('[data-fuse]')){const b=document.createElement('button');b.className='tb3'+(isF?' on':'');b.dataset.fuse=1;b.textContent='FUSE';
  b.onclick=()=>{U.tab='fuse';window.hub()};T.appendChild(b)}
 if(!isF)return;
 T.querySelectorAll('.tb3').forEach(b=>b.classList.toggle('on',!!b.dataset.fuse));
 const wm=A.querySelector('.wm');if(wm)wm.textContent='FUSE';

 let ch=U.sel;if(!S.lv[ch]){ch='kael';U.sel=ch}
 const f=U.fz=U.fz||{k:'persona',sel:[],ch:ch};
 if(f.ch!=ch){f.ch=ch;f.sel=[]}
 const kind=f.k,o=G.own(ch),list=(kind=='persona'?o.per:o.skl)||[],eq=equipped(ch,kind);
 const items=list.map(id=>master(kind,id)).filter(Boolean).sort((a,b)=>(b.pow||0)-(a.pow||0));
 f.sel=f.sel.filter(id=>items.some(x=>x.id==id));
 const sel=f.sel,C=G.CHARS[ch],nm=kind=='persona'?'PERSONA':'SKILL';

 /* panel kiri: daftar protagonis */
 if(B){const ps=G.spr?G.spr('characters',ch,'pt'):'';
  B.innerHTML='<div class="hbh">PROTAGONIS</div>'+Object.keys(G.CHARS).filter(k=>S.lv[k]).map(k=>{const sp=G.spr?G.spr('characters',k,'pt'):'';
   return`<button class="si ${k==ch?'on':''}" data-fc="${k}">${sp?`<span class="pw">${sp}</span>`:''}<b>${G.CHARS[k].n}</b></button>`}).join('')+(ps?`<div class="por">${ps}</div>`:'')}

 /* kartu */
 let cards=kc('\u2605','FUSE &bull; '+C.n,`Pilih 3 ${nm.toLowerCase()} sebagai bahan, lalu fusi menjadi 1 ${nm.toLowerCase()} baru. Bahan akan HABIS dipakai. Elemen hasil mengikuti bahan terbanyak, tingkat hasil mengikuti rata-rata Power. 3 bahan satu elemen = tingkat +1. 3 bahan hasil fusi = tingkat +1 dari yang terendah. &bull; \u00a5 ${S.yen}`,
  `<div style="display:flex;gap:8px;flex-wrap:wrap">${[['persona','PERSONA'],['skill','SKILL']].map(([k,t])=>`<button class="bb ${k==kind?'on':''}" data-fk="${k}" ${k==kind?'style="outline:3px solid #fff"':''}>${t}</button>`).join('')}</div>`,1);
 if(sel.length<3){
  cards+=kc('--','HASIL FUSI',`Pilih ${3-sel.length} bahan lagi (${sel.length}/3). Hasil akan tampil di sini sebelum kamu memfusikannya.`,'',1)}
 else{const c=calc(kind,sel.map(id=>master(kind,id))),r=c.res;
  if(!r)cards+=kc('--','HASIL FUSI','Data hasil fusi belum termuat. Coba buka ulang tab ini.','',1);
  else{const dup=list.includes(r.id)&&!sel.includes(r.id),poor=S.yen<c.cost,ok=!dup&&!poor;
   cards+=kc('\u2605',(r.e||'')+' '+r.n+(c.special?' (RESEP KHUSUS)':` (Tingkat ${RM[c.tier]})`),
    `${kind=='persona'?lbl(r.t)+' &bull; ':''}${(G.KIND||{})[r.k]||''} &bull; Power ${r.pow} &bull; ${r.sp} SP &bull; CD ${r.cd} &bull; Biaya \u00a5${c.cost}`,
    `<small>${r.d}</small>`+(dup?'<small>Hasil ini sudah kamu miliki. Ganti salah satu bahan.</small>':poor?'<small>Yen tidak cukup untuk fusi ini.</small>':'')+`<button class="bb eqb" id="fzgo" ${ok?'':'disabled'}>FUSI SEKARANG</button>`,1,'eq')}}
 /* daftar resep khusus */
 const found=(S.fz&&S.fz.found)||{};
 cards+=kc('\u{1F4D6}','RESEP KHUSUS '+nm,'Bahan harus persis tiga ini (urutan bebas). Hasilnya lebih kuat dari tingkat V biasa.',
  '<small>'+SPECIAL.filter(s=>s.kind==kind).map(s=>`${found[s.id]?'\u2713 ':'&bull; '}${s.need.join(' + ')} &rarr; <b>${s.n}</b>`).join('<br>')+'</small>',1);
 /* daftar bahan */
 if(!items.length)cards+=kc('--','BELUM ADA '+nm,`Beli ${nm.toLowerCase()} di tab SHOP dulu. Fusi butuh minimal 3.`,'',1);
 cards+=items.map((x,i)=>{const on=sel.includes(x.id);
  return kc(String(i+1).padStart(2,'0'),(x.e||'')+' '+x.n,
   `${kind=='persona'?lbl(x.t)+' &bull; ':''}${ELN[elemOf(x)]||''} &bull; Power ${x.pow||'-'} &bull; ${x.sp} SP &bull; CD ${x.cd||0}`+(x.fz!=null?` &bull; FUSI ${x.fz>=5?'KHUSUS':RM[x.fz]}`:'')+(eq.has(x.id)?' &bull; \u2713 DIBAWA':''),
   `<small>${x.d||''}</small><button class="bb ${on?'eqb':''}" data-fp="${x.id}">${on?'\u2713 DIPILIH (BATAL)':'PILIH'}</button>`,0,on?'eq':'')}).join('');
 P.innerHTML=cards;

 /* handler */
 A.querySelectorAll('[data-fc]').forEach(b=>b.onclick=()=>{U.sel=b.dataset.fc;f.sel=[];redraw()});
 P.querySelectorAll('[data-fk]').forEach(b=>b.onclick=()=>{f.k=b.dataset.fk;f.sel=[];redraw()});
 P.querySelectorAll('[data-fp]').forEach(b=>b.onclick=()=>{const id=b.dataset.fp,i=f.sel.indexOf(id);
  if(i>=0)f.sel.splice(i,1);else{if(f.sel.length>=3)f.sel.shift();f.sel.push(id)}redraw()});
 const go=document.getElementById('fzgo');
 if(go)go.onclick=()=>{
  const ids=f.sel.slice(),its=ids.map(id=>master(kind,id));if(its.length!=3||its.some(x=>!x))return;
  const c=calc(kind,its),r=c.res;if(!r)return;
  if(S.yen<c.cost)return alert('Yen tidak cukup');
  if(list.includes(r.id)&&!ids.includes(r.id))return alert('Hasil ini sudah kamu miliki. Ganti salah satu bahan.');
  if(!confirm(`Fusi ${its.map(x=>x.n).join(' + ')}\n= ${r.n}\nBiaya \u00a5${c.cost}\n\nKetiga bahan akan HABIS. Lanjut?`))return;
  const wasEq=ids.some(id=>eq.has(id));
  ids.forEach(id=>{if(eq.has(id)&&G.toggleEq){try{G.toggleEq(ch,kind,id)}catch(e){}}
   const i=list.indexOf(id);if(i>=0)list.splice(i,1)});
  if(!list.includes(r.id))list.push(r.id);
  S.yen-=c.cost;
  if(wasEq&&G.toggleEq){try{G.toggleEq(ch,kind,r.id)}catch(e){}}
  S.fz=S.fz||{n:0,found:{}};S.fz.n=(S.fz.n||0)+1;S.fz.found=S.fz.found||{};if(c.special)S.fz.found[r.id]=1;
  f.sel=[];G.save&&G.save();
  alert(`FUSI BERHASIL!\n${r.e||''} ${r.n}\nPower ${r.pow} \u00b7 ${r.sp} SP \u00b7 CD ${r.cd}`+(wasEq?'\nOtomatis dibawa menggantikan bahan.':''));
  redraw()}};

/* ---------- pasang ke hub() (dibungkus, hub.js tidak diubah) ---------- */
reg();
const h0=window.hub;
if(typeof h0=='function'&&!h0._fz){
 const h=function(){reg();const U=G.ui,isF=!!U&&U.tab=='fuse';
  if(isF)U.tab='status';             /* hub asli tidak kenal tab 'fuse', jadi dirender sebagai STATUS lalu isinya diganti */
  let r;try{r=h0.apply(this,arguments)}finally{if(isF)U.tab='fuse'}
  try{decorate(isF)}catch(e){console.error('[Fuse]',e)}
  return r};
 Object.keys(h0).forEach(k=>{h[k]=h0[k]});h._fz=1;window.hub=h}
})();