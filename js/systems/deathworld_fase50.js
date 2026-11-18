window.G=window.G||{};
/* =====================================================================
   DEATH WORLD - ADD-ON BOSS MULTIVERSE (level HARAPAN & TAKDIR)
   Muat SETELAH deathworld.js (dan hub.js), contoh:
       <script src="js/systems/deathworld.js"></script>
       <script src="js/systems/deathworld_fase50.js"></script>

   Perubahan:
   1. Total fase DIPADATKAN dari 75 menjadi 50 (DW.F50.total). HP boss ikut diperkecil seperbanding.
   2. Saat memasuki fase DW.F50.from (default 34, titik yang sama dengan "fase 50 dari 75"):
      - semua MC KECUALI Kael dan Alternate Kael otomatis gugur
      - item TIDAK bisa dipakai (hukum 'item' + isi tas dikosongkan sementara, dikembalikan setelah selesai)
      - Author menghidupkan kalian lagi setiap kali tim tumbang, TANPA BATAS
   3. Saat dihidupkan Author, HP boss TIDAK diisi penuh lagi: lanjut dari sisa HP terakhir
      (dipantau selama battle dan dikunci supaya tidak naik lagi).
   Pertarungan dipecah jadi beberapa battle (checkpoint tiap DW.F50.chunk fase).
   Mau titik kejadian di fase lain? Setel  DW.F50={from:50}  sebelum file ini dimuat.
   ===================================================================== */
(()=>{
const DW=G.dw;if(!DW||!DW.stage||DW._f50)return;
const MV=DW.stage('mv');if(!MV)return;DW._f50=1;
const F=DW.F50=Object.assign({from:34,chunk:5,total:50},DW.F50||{});
const IK=['items','hipot','megapot','spitems','elixir','grpot','revive','mrevive','atkc','defc','spmega','ether','panacea','megaelx','grsp','grmega','grelx','reviveall','rainc','timesand','spark'];
const L=(w,t)=>[w,t];
const SS=()=>{const S=G.state;S.dw=S.dw||{};S.dw.done=S.dw.done||{};return S.dw};

/* ---------- 1. padatkan fase: 75 -> F.total (fase pertama & terakhir tetap, Author tetap di tengah) ---------- */
const OLD=MV.ph.length;
const fwFix=s=>String(s).replace('Dua puluh satu fase. ','').replace('Sepuluh fase. ','').replace('Lima fase lagi.','Sebentar lagi.').replace('Seperempat jalan lagi menuju Takdir. ','');
if(F.total&&F.total<OLD){
 const src=MV.ph,pick=Array.from({length:F.total},(_,j)=>Math.round(j*(OLD-1)/(F.total-1)));
 MV.ph=pick.map((o,j)=>{const p=Object.assign({},src[o]);p.msg=String(p.msg||'').replace(/Fase\s*\d+\s*\/\s*\d+/,'Fase '+(j+1)+'/'+F.total);if(p.fw)p.fw=p.fw.map(fwFix);p._o=o+1;return p});
 MV.hp=Math.round(MV.hp*F.total/OLD);
 const pre0=MV.pre;MV.pre=()=>pre0().map(l=>[l[0],String(l[1]).replace('Tujuh puluh lima bab','Lima puluh bab')])}
const N=MV.ph.length;

/* ---------- data fase: item dikunci mulai fase F.from + pesan fase itu ---------- */
MV.ph.forEach((p,i)=>{if(i+1>=F.from)p.laws=[...new Set([...(p.laws||[]),'item'])]});
const p0=MV.ph[F.from-1];
if(p0){p0.msg='Fase '+F.from+'/'+N+': '+p0.n+'. Semua MC selain Kael dan Alternate Kael gugur! Item terkunci, tetapi Author menahan kematian kalian!';
 p0.fw=(p0.fw||[]).concat(['Multiverse: Tasmu kututup. Tidak ada lagi yang menolongmu.','Author: Selama penaku masih menulis, kalian tidak akan benar-benar mati.'])}
const au=MV.ph.map((p,i)=>(p._o>=20&&p._o<=28)?i+1:0).filter(Boolean),auR=au.length?au[0]+'-'+au[au.length-1]:'';
MV.hint=N+' FASE dengan buff & debuff yang terus berganti! Author ikut membantu di tengah pertarungan'+(auR?' (fase '+auR+')':'')+'. Mulai fase '+F.from+': semua MC selain Kael & Alternate Kael gugur dan item terkunci, tapi Author menghidupkan kalian lagi tanpa batas (HP boss tidak pulih). Bawa SP yang cukup!';

/* ---------- item: kosongkan saat fase F.from+, kembalikan setelahnya (aman walau browser ditutup) ---------- */
DW.lockItems=()=>{const S=G.state,d=SS();if(d.stash)return;d.stash={};IK.forEach(k=>{if(S[k]){d.stash[k]=S[k];S[k]=0}})};
DW.restoreItems=()=>{const S=G.state;if(!S||!S.dw||!S.dw.stash)return;Object.keys(S.dw.stash).forEach(k=>{S[k]=(S[k]||0)+S.dw.stash[k]});delete S.dw.stash;if(G.save)G.save()};

/* teks layar Death World yang tertulis "75 FASE" / "fase 20-28" di deathworld.js disesuaikan */
const fixText=()=>{const A=document.getElementById('app');if(!A)return;
 A.querySelectorAll('*').forEach(el=>{if(el.children.length)return;const t=el.textContent||'';
  if(!/75\s*fase|fase\s*20-28/i.test(t))return;
  el.textContent=t.replace(/75(\s*)(fase)/gi,(m,s,f)=>N+s+f).replace(/fase\s*20-28/gi,auR?'fase '+auR:'fase tengah')})};
{const sc=DW.screen;DW.screen=function(){DW.restoreItems();const r=sc.apply(this,arguments);try{fixText()}catch(e){}return r};
 const h0=window.hub;if(typeof h0=='function'&&!h0._f50){const h=function(){DW.restoreItems();const r=h0.apply(this,arguments);try{fixText()}catch(e){}return r};h._f50=1;h._dw=1;window.hub=h}}

/* ---------- potongan boss: HP & XP dibagi sesuai jumlah fase ---------- */
const seg=(a,b)=>Object.assign({},MV,{ph:MV.ph.slice(a-1,b),hp:Math.max(1,Math.round(MV.hp*(b-a+1)/N)),xp:Math.round(MV.xp*(b-a+1)/N)});
const chunks=(()=>{const a=[];let s=F.from;while(s<=N){let e=Math.min(N,s+F.chunk-1);if(N-e>0&&N-e<F.chunk)e=N;a.push([s,e]);s=e+1}return a})();

/* ---------- satu battle dengan susunan tim tertentu.
   off    = jumlah fase sebelum potongan ini (untuk tampilan "FASE x/total")
   hpLeft = sisa HP boss dari percobaan sebelumnya (kalau ada), supaya HP tidak diisi penuh lagi.
            Selama battle HP boss dipantau: HP terendah dicatat, dan kalau hpLeft diberikan
            HP boss dikunci agar tidak pernah melebihi nilai terendah itu. ---------- */
const withParty=(ids,stg,cb,off,hpLeft)=>{const S=G.state,T=G.team,temp=[],oldParty=S.party.slice(),oS=T&&T.sync,oR=T&&T.reserve,lvK=(S.lv.kael&&S.lv.kael.l)||1;
 ids.forEach(id=>{if(!S.lv[id]){S.lv[id]={l:Math.max(1,lvK-1),x:0};temp.push(id)}});
 S.party=ids.slice();if(T){T.sync=()=>{};T.reserve=()=>[]}
 const foes=DW.foes(stg),boss=foes[0];
 const resume=hpLeft>0&&!!boss;
 let low=Infinity;
 if(resume){const v=Math.max(1,Math.min(boss.max||hpLeft,Math.round(hpLeft)));boss.hp=v;low=v}
 else if(boss&&boss.hp>0)low=boss.hp;
 /* pemantau HP: catat HP terendah; saat lanjut (resume) cegah HP naik lagi */
 const tick=setInterval(()=>{if(!boss)return;
  if(resume&&boss.hp>low&&low>0)boss.hp=low;
  if(boss.hp>0&&boss.hp<low)low=boss.hp},40);
 DW._off=off||0;DW._len=stg.ph.length;startFix();
 G.battle(foes,ok=>{clearInterval(tick);DW._off=null;S.party=oldParty;if(T){T.sync=oS;T.reserve=oR}temp.forEach(id=>{delete S.lv[id]});
  let left=low;if(boss&&boss.hp>0&&boss.hp<left)left=boss.hp;
  if(!isFinite(left)||left<1)left=1;
  cb(ok,left)},{noPick:true,chapter:1})};

/* ---------- tampilan nomor fase: HUD menulis "FASE a/b" dari potongan boss; ditulis ulang jadi nomor asli dari total ---------- */
const fixPhase=()=>{if(DW._off==null)return;const A=document.getElementById('app')||document.body;
 A.querySelectorAll('*').forEach(el=>{if(el.children.length)return;const m=/FASE\s*(\d+)\s*\/\s*(\d+)/i.exec(el.textContent||'');
  if(m&&+m[2]==DW._len&&DW._len!=N)el.textContent=el.textContent.replace(m[0],'FASE '+(+m[1]+DW._off)+'/'+N)})};
let fixOn=0;const startFix=()=>{if(fixOn)return;fixOn=1;new MutationObserver(fixPhase).observe(document.body,{childList:true,subtree:true,characterData:true})};

const RETRY=[
 'Belum! Belum selesai! Kutulis ulang halaman ini. Bangkitlah!',
 'Aku tidak akan membiarkan kalian berakhir di sini. Berdirilah!',
 'Tintaku belum kering. Kuhapus kekalahan itu. Sekali lagi!',
 'Kematian bukan bagian dari naskah kali ini. Bangun, kalian berdua!',
 'Aku di sini. Selama aku ada, halaman ini akan kutulis ulang sebanyak yang diperlukan.'];

/* ---------- alur khusus boss Multiverse ---------- */
const orig=DW.fight;
DW.fight=sid=>{if(sid!='mv')return orig(sid);
 const S=G.state;if(!DW.avail(MV))return;
 const full=DW.party(MV),alt=DW.ensureAlt(),keep=['kael'].concat(alt?[alt]:[]).filter(k=>(G.CHARS||{})[k]),
  fallen=full.filter(k=>!keep.includes(k)).map(k=>(G.CHARS[k]||{}).n||k),
  lost=()=>typeof after=='function'?after():DW.screen();
 const win=()=>{DW.restoreItems();const d=SS(),first=!d.done.mv,r=MV.rw,k=first?1:.3,y=Math.round(r.yen*k);
  d.done.mv=1;d.mv=1;S.yen=(S.yen||0)+y;if(first){S.items=(S.items||0)+r.items;S.spitems=(S.spitems||0)+r.sp}
  if(G.save)G.save();
  G.dialog(MV.post(),()=>{alert(`${MV.n} DIKALAHKAN!\n+\u00a5${y}`+(first?` \u00b7 +${r.items} Potion \u00b7 +${r.sp} SP Drink`:' (ulang: hadiah 30%)'));DW.theEnd()})};
 const part2=(i,left)=>{if(i>=chunks.length)return win();
  const[a,b]=chunks[i];
  withParty(keep,seg(a,b),(ok,hp)=>{
   /* mati = hidup lagi, HP boss lanjut dari sisa terakhir (tidak penuh lagi) */
   if(!ok)return G.dialog([L('Author',RETRY[Math.floor(Math.random()*RETRY.length)])],()=>part2(i,hp));
   part2(i+1)},a-1,left)};
 const mid=()=>[
  L('Multiverse','Di sini hanya yang terkuat yang boleh tetap berdiri.'),
  L('Narator',(fallen.length?fallen.join(', ')+' tumbang satu per satu...':'Para sekutu tumbang satu per satu...')+' Hanya Kael dan Alternate Kael yang masih berdiri.'),
  L('Multiverse','Tasmu kututup. Tidak ada lagi item yang menolong kalian.'),
  L('Author','Belum! Aku tidak akan membiarkan bab ini berakhir begini. Dengan sisa tintaku, kalian tidak akan benar-benar mati!'),
  L('Author','Setiap kali kalian jatuh, akan kutulis ulang halamannya. Bangkitlah, berapa pun kalinya!'),
  L('Kael','Author... terima kasih. Kita lanjut, Alternate Kael!'),
  L('Alternate Kael','Dengan senang hati. Kita akhiri ini bersama.')];
 G.dialog(MV.pre(),()=>withParty(full,seg(1,F.from-1),ok=>{
  if(!ok)return lost();
  G.dialog(mid(),()=>{DW.lockItems();if(G.save)G.save();part2(0)})}))};
})();