window.G=window.G||{};
/* =====================================================================
   EXTRA BOSS: ELIZABETH  (muat SETELAH hub.js)
   - 2 fase, HP lumayan tebal, serangan sangat sakit
   - bisa HEAL sendiri (otomatis saat HP turun melewati ambang tertentu)
   - hadiah Yen dan EXP sangat besar
   Atur kesulitan lewat tabel ELIZ.ph di bawah (hp, atk, heal).
   ===================================================================== */
(()=>{
if(!G.DUNGEONS||!G.runDungeon||!G.foe||G._eliz)return;G._eliz=1;
const NC=()=>(G.CHAPTERS||[]).length||10;

const ELIZ={id:'elizabeth',n:'EXTRA: ELIZABETH',e:'\u{1F9E9}',boss:'ELIZABETH',elite:1,floors:2,
 d:'Pelayan misterius dari Velvet Room. 2 fase, serangan sangat sakit, bisa menyembuhkan diri. Hadiah Yen dan EXP luar biasa besar.',
 /* hadiah clear pertama; ulang = 50% */
 rw:{yen:30000,items:10,sp:10,elx:3},
 ph:[
  {n:'Permintaan Pertama',hp:12,atk:3.6,xp:80,
   /* heal: saat HP turun di bawah tiap ambang (persen dari HP maks), pulih sebesar 'amt' persen. Tiap ambang hanya sekali */
   heal:{at:[.6,.3],amt:.25},
   intro:[['Narator','Di antara mimpi dan kenyataan, sebuah pintu biru berdiri. Seorang pelayan menunggu.'],
          ['ELIZABETH','Selamat datang, tamu istimewa. Aku sudah lama menanti seseorang sepertimu.'],
          ['ELIZABETH','Ini permintaanku: tunjukkan padaku batas kekuatanmu. Jangan kecewakan aku.']]},
  {n:'Permintaan Terakhir',hp:16,atk:5,xp:160,
   heal:{at:[.7,.45,.2],amt:.2},
   intro:[['ELIZABETH','Luar biasa. Kalian bertahan lebih lama dari dugaanku.'],
          ['ELIZABETH','Sekarang aku akan serius. Mari kita lihat apakah tekadmu cukup untuk permintaan terakhir ini.'],
          ['Narator','Aura biru pekat menyelimuti ruangan. Tekanannya hampir tak tertahankan.']]}]};
Object.defineProperty(ELIZ,'need',{get:()=>Math.min(25,NC()),enumerable:true});
if(!G.DUNGEONS.some(x=>x.id==ELIZ.id))G.DUNGEONS.push(ELIZ);

/* musuh satu fase Elizabeth */
G.elizFoe=p=>{const cn=Math.max(1,G.state.ch+1),ph=ELIZ.ph[p];
 return G.foe(cn,3,1,'ELIZABETH - '+ph.n,{hp:ph.hp,atk:ph.atk,xp:ph.xp})};

const _dgFoes=G.dgFoes;
if(_dgFoes)G.dgFoes=(D,f)=>D&&D.id=='elizabeth'?[G.elizFoe(Math.max(0,Math.min(1,f-1)))]:_dgFoes(D,f);

/* pemantau heal: saat HP boss turun melewati ambang, ia menyembuhkan diri.
   Mengembalikan fungsi untuk menghentikan pemantau. */
const watchHeal=(boss,cfg)=>{if(!boss||!cfg)return()=>{};
 const mx=boss.max||boss.hp,todo=cfg.at.slice().sort((a,b)=>b-a);
 const t=setInterval(()=>{
  if(!(boss.hp>0)||!todo.length)return;
  if(boss.hp<=mx*todo[0]){todo.shift();
   const heal=Math.round(mx*cfg.amt);boss.hp=Math.min(mx,boss.hp+heal);
   const msg=`ELIZABETH menyembuhkan dirinya! (+${Math.round(cfg.amt*100)}% HP)`;
   try{G.log&&G.log(msg)}catch(e){}console.log('[Elizabeth]',msg)}},100);
 return()=>clearInterval(t)};

const _run=G.runDungeon;
G.runDungeon=D=>{if(!D||D.id!='elizabeth')return _run(D);
 const S=G.state;S.dg=S.dg||{};S.dg.eliz=S.dg.eliz||0;let p=0;
 const win=()=>{const first=!S.dg.elizDone,k=first?1:.5,r=D.rw,y=Math.round(r.yen*k),it=Math.round(r.items*k),sp=Math.round(r.sp*k),ex=first?r.elx:0;
  S.dg.elizDone=1;S.dg.eliz++;S.dg.clears=(S.dg.clears||0)+1;
  S.yen=(S.yen||0)+y;S.items=(S.items||0)+it;S.spitems=(S.spitems||0)+sp;if(ex)S.megaelx=(S.megaelx||0)+ex;
  G.save();
  G.dialog([['ELIZABETH','Memuaskan. Permintaanku terpenuhi. Terimalah imbalan ini.'],['Narator','Pintu biru perlahan menutup. Elizabeth tersenyum tipis lalu menghilang.']],()=>{
   alert(`${D.n} TUNTAS!\n+\u00a5${y} \u00b7 +${it} Potion \u00b7 +${sp} SP Drink`+(ex?` \u00b7 +${ex} Mega Elixir`:' (ulang: hadiah 50%)')+'\nEXP besar sudah diberikan dari tiap fase.');hub()})};
 const go=()=>{const ph=D.ph[p],foe=G.elizFoe(p),stop=watchHeal(foe,ph.heal);
  G.dialog(ph.intro,()=>G.fight([foe],ok=>{stop();
   if(!ok)return after();
   p++;if(p>=D.ph.length)return win();
   G.save();
   G.dialog([['ELIZABETH','Belum selesai. Fase berikutnya akan jauh lebih sakit.'],['Narator',`FASE ${p} SELESAI. FASE ${p+1}/${D.ph.length} dimulai!`]],go)},[D.boss]))};
 go()};
})();