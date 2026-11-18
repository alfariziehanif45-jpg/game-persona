window.G=window.G||{};
const FOE_DMG=1.2,FOE_HEAVY=2; /* damage dasar musuh (sebelum dikali tingkat kesulitan) */

/* ===== JEMBATAN KE 4 SISTEM BARU (Archive / Bond / Parallel World / Memory Fragment) =====
   Semua aman: kalau ma_core.js dkk belum di-load, battle tetap jalan seperti biasa.
   G.MAemit(event,data)  = kirim event ke sistem baru
   G.slug(nama)          = "Slime Arsip" -> "slime_arsip" (dipakai sebagai id arsip: enemy_slime_arsip / boss_...)
   G.bondM(id,'atk')     = pengali bonus dari kemampuan Bond (1 = tidak ada bonus). Kunci: atk / def / hp
   Opsi tambahan G.battle(enemies,cb,opts):
     opts.world    = id dunia (mis. 'world1')  -> event world_entered + dipakai untuk flag & event boss dunia
     opts.location = id lokasi                 -> otomatis membuka arsip location_<id>
     opts.winFlags = {kunci:nilai}             -> flag Parallel World yang di-set kalau menang (butuh opts.world)
   Data musuh boleh punya:  id:'slime'  (id arsip; default dari nama)   fragment:'frag_xxx' (jatuh saat musuh kalah) */
G.MAemit=G.MAemit||((ev,p)=>{try{if(window.MA&&MA.emit)MA.emit(ev,p)}catch(e){console.warn('[MA]',ev,e)}});
G.slug=G.slug||(s=>String(s||'').toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,''));
G.bondM=G.bondM||((id,k)=>{try{const b=window.Bond&&Bond.bonus?Bond.bonus(id):null;return 1+((b&&+b[k])||0)}catch(e){return 1}});

/* ===== KESULITAN: skala musuh sesuai pilihan pemain (kunci = G.DIFF: easy / normal / hard / hardcore) =====
   hp / atk = pengali HP & ATK semua musuh    dmg = pengali damage yang diterima tim
   heavy    = peluang serangan berat           aoe = elite pakai serangan area tiap N giliran (kecil = lebih sering)
   xa       = aksi tambahan boss: 0 tidak ada, 1 hanya phase terakhir, 2 mulai phase 2
   Mau lebih gampang / lebih susah? Cukup ubah angka di sini. */
G.DIFFSCALE=G.DIFFSCALE||{
 easy:    {hp:1.1,atk:1.00,dmg:1.2,heavy:.25,aoe:3,xa:0},
 normal:  {hp:1.5,atk:1.25,dmg:1.4,heavy:.30,aoe:3,xa:0},
 hard:    {hp:2.0,atk:1.50,dmg:1.7,heavy:.38,aoe:2,xa:1},
 hardcore:{hp:2.6,atk:1.80,dmg:2.0,heavy:.45,aoe:2,xa:2}};
/* tambahan per kategori musuh: mini boss (elite) dan boss jauh lebih tebal & sakit dari musuh biasa */
G.CATSCALE=G.CATSCALE||{
 normal :{hp:1.0,atk:1.00},
 elite  :{hp:1.6,atk:1.25},
 support:{hp:1.3,atk:1.10},
 special:{hp:1.4,atk:1.20},
 boss   :{hp:2.0,atk:1.20}};

/* ===== SKALA CHAPTER: makin jauh chapter, musuh & boss makin sulit =====
   Chapter 1 = tanpa tambahan (pengali 1). Tiap chapter berikutnya (n = chapter - 1):
   hp / atk   = tambahan HP & ATK semua musuh per chapter (HP juga naik sedikit kuadratik)
   dmg        = tambahan damage yang diterima tim per chapter
   heavy      = tambahan peluang serangan berat per chapter (maksimal heavyMax)
   bossHp / bossAtk = tambahan KHUSUS boss per chapter (di atas skala musuh biasa)
   xp         = hadiah EXP & Yen ikut naik supaya tetap adil
   ult        = kekuatan ultimate boss
   cap        = batas chapter yang dihitung (biar tidak meledak)
   Otomatis juga: chapter 4+ serangan area elite lebih sering (8+ lebih sering lagi), musuh biasa dapat resist tambahan,
   chapter 5+ boss dapat aksi tambahan di phase terakhir, chapter 9+ boss dapat aksi tambahan mulai phase 2.
   Mau lebih gampang / susah? Ubah angka di G.CHAPSCALE. */
G.CHAPSCALE=G.CHAPSCALE||{hp:.22,atk:.14,dmg:.07,heavy:.015,heavyMax:.2,bossHp:.12,bossAtk:.06,xp:.18,ult:.06,cap:20};
/* Nomor chapter aktif. Urutan: opts.chapter -> e.chapter pada musuh -> G.chapter -> state (chapter / chap / bab / story / prog).
   Kalau game-mu menyimpan chapter di tempat lain, cukup isi G.chapter (angka atau fungsi) atau kirim opts.chapter ke G.battle. */
G.chapterNo=(opts,enemies)=>{const S=G.state||{};
 const gc=typeof G.chapter=='function'?G.chapter():G.chapter;
 const ec=(enemies||[]).map(e=>e&&e.chapter).find(v=>+v>0);
 const c=[opts&&opts.chapter,ec,gc,S.chapter,S.chap,S.bab,S.story&&S.story.chapter,S.prog&&S.prog.chapter].find(v=>+v>0);
 return c?Math.floor(+c):1};
G.chScale=ch=>{const C=G.CHAPSCALE,n=Math.max(0,Math.min(C.cap,ch-1));
 return{ch,n,hp:1+C.hp*n+.01*n*n,atk:1+C.atk*n,dmg:1+C.dmg*n,heavy:Math.min(C.heavyMax,C.heavy*n),
  aoeCut:ch>=8?2:ch>=4?1:0,xa:ch>=9?2:ch>=5?1:0,bossHp:1+C.bossHp*n,bossAtk:1+C.bossAtk*n,xp:1+C.xp*n,ult:1+C.ult*n}};

/* ===== SISTEM WEAK & ALL-OUT =====
   WEAK        : serang kelemahan musuh -> kamu dapat giliran tambahan (1 MORE).
                 Musuh yang menyerang kelemahan anggota timmu -> musuh itu juga dapat giliran tambahan
                 (dan damage ke anggota itu x1.35). GUARD menetralkan kelemahan di ronde itu.
   ALL-OUT     : gauge terisi dari serangan (+5), kena weakness musuh (+18), critical (+6), guard (+8),
                 dan menerima serangan (+3). Gauge 100 = ALL-OUT ATTACK bisa dipakai (butuh min. 2 anggota hidup).
                 Semua anggota yang ikut bertarung menyerbu semua musuh sekaligus, lalu gauge kosong lagi.
   Kelemahan anggota tim: isi G.TEAMDATA[id].weak (string / array elemen). Kalau kosong, otomatis dari elemennya. */
G.AOMAX=100;
G.AOGAIN=G.AOGAIN||{hit:5,weak:18,crit:6,guard:8,hurt:3,mult:1.1};
G.PWEAK=G.PWEAK||{fire:'ice',ice:'fire',elec:'wind',wind:'elec',bless:'curse',curse:'bless',phys:'elec'};
G.pweak=id=>{const t=(G.TEAMDATA||{})[id]||{};if(t.weak)return[].concat(t.weak);const w=G.PWEAK[t.elem];return w?[w]:[]};

/* ===== COOLDOWN (baru) =====
   - SEMUA skill, persona, dan combo punya cooldown (minimal 1 ronde). Tombol ATTACK sudah dihapus,
     jadi skill dasar juga kena cooldown. GUARD selalu bisa dipakai sebagai cadangan (+4 SP).
   - COOLDOWN AWAL: skill/persona dengan cd >= min mulai battle dalam keadaan cooldown
     sebesar ceil(cd * mult) ronde. Jadi move kuat tidak bisa langsung dipakai di giliran pertama.
     Mau satu move tertentu bebas dari cooldown awal? Beri field  oc:0  pada move itu.
     Mau cooldown awal lebih lama? Isi  oc:n  (n ronde) atau ubah angka di bawah. */
G.MINCD=1;
G.OPENCD=G.OPENCD||{min:3,mult:.5,chance:.5};   /* chance = peluang TIAP move kuat mulai battle dalam cooldown (acak tiap battle) */
/* peluang efek debuff musuh benar-benar mengenai (damage-nya tetap kena). 1 = selalu, 0 = tidak pernah.
   Seal (kunci Skill/Persona) sengaja paling jarang; musuh yang sudah memakai Seal juga harus menunggu 3 giliran. */
G.DEBCHANCE=G.DEBCHANCE||{seal:.5,poison:.75,burn:.75,weaken:.85,drainsp:.85};
G.SEALGAP=3;
/* LAMA DEBUFF: tiap debuff (racun, bakar, seal, ATK/DEF turun) diundi acak antara min - max giliran. 1 = singkat, 5 = lama. */
G.DEBTURN=G.DEBTURN||{min:1,max:5};

/* ===== HUKUM GAME (baru): boss yang bisa MELANGGAR aturan permainan =====
   Dipasang per PHASE boss lewat field di data phase (lihat deathworld.js, Alternate Kael):
     laws:['weak','guard',...]  = hukum yang dilanggar selama phase itu (tampil di bar boss sebagai label ungu)
     sys:['wipecmd','steal',...] = jenis "serangan sistem" yang dipakai aksi 'meta' (masukkan 'meta' ke pat phase)
     fw:['kalimat',...]          = boss berbicara langsung ke PENGGUNA (tembok keempat). Boleh pakai token
                                   {time} {part} {diff} {round} {fav} {alive}
     fake:true                   = kalau HP-nya habis, muncul VICTORY palsu lalu ia bangkit (sekali per phase)
     fakeFw:['kalimat']          = ucapan setelah VICTORY palsu (opsional)
   Hukum yang tersedia (n = nama di HUD, d = penjelasan):
     weak  kelemahan TIDAK memberi 1 MORE ke tim (boss tetap dapat)     guard  GUARD ditembus (tidak mengurangi damage)
     cd    cooldown hanya berkurang tiap 2 ronde                         item   tombol ITEM tidak bisa dipakai
     swap  tombol SWAP tidak bisa dipakai                                ao     gauge ALL-OUT tidak terisi & tidak bisa dipakai
     scan  info kelemahan musuh disembunyikan                            turn   boss kadang menyela giliranmu
     undo  boss menekan UNDO: sebagian damage ronde itu dikembalikan
   Aksi 'meta' (sys): wipecmd = hapus 1 tombol 1 ronde | steal = hapus item dari tas (DIKEMBALIKAN setelah battle)
     cdwrite = tulis ulang cooldown | drainao = kosongkan gauge | swaphp = tukar HP & SP satu anggota
     glitch = layar rusak + damage tim | predict = membaca & menghukum tombol yang paling sering kamu tekan | taunt = bicara ke pengguna */
G.LAWS=G.LAWS||{
 weak :{n:'KELEMAHAN',d:'Menyerang kelemahan tidak memberi 1 MORE untukmu'},
 guard:{n:'GUARD',d:'GUARD ditembus, tidak mengurangi damage'},
 cd   :{n:'COOLDOWN',d:'Cooldown hanya berkurang tiap 2 ronde'},
 item :{n:'TAS ITEM',d:'Item tidak bisa dipakai'},
 swap :{n:'SWAP',d:'Ganti anggota tidak bisa dipakai'},
 ao   :{n:'ALL-OUT',d:'Gauge ALL-OUT tidak terisi dan tidak bisa dipakai'},
 scan :{n:'ANALISIS',d:'Informasi kelemahan disembunyikan'},
 turn :{n:'GILIRAN',d:'Boss bisa menyela giliranmu'},
 undo :{n:'UNDO',d:'Sebagian damage dikembalikan boss'}};

/* ===== DATA SKILL & PERSONA (dipakai Battle dan Shop) =====
   k (jenis): dmg=1 musuh, aoe=semua musuh, drain=serang+serap HP, heal=pulihkan diri, healall=pulihkan tim
              taunt=provokasi, debuff=lemahkan musuh, scan=ungkap kelemahan
              poison=serang + racun (damage tiap ronde), burn=serang + bakar (damage tiap ronde),
              weaken=serang ringan + ATK & DEF satu musuh turun
   pow = kekuatan, sp = biaya SP, price = harga di shop, el = elemen
   cd = COOLDOWN (jumlah ronde musuh yang harus dilewati sebelum bisa dipakai lagi; minimal 1)
        cooldown di-reset setiap battle baru (dan dimulai dengan cooldown awal untuk move kuat) */
G.SKILLS=[
 {id:'twin',n:'Twin Slash',k:'dmg',pow:38,sp:6,cd:1,price:80,d:'Tebasan ganda ke satu musuh'},
 {id:'mend',n:'Mend',k:'heal',pow:45,sp:8,cd:2,price:100,d:'Pulihkan HP sendiri'},
 {id:'blaze',n:'Blaze',k:'dmg',pow:55,sp:10,cd:2,price:150,d:'Api membakar satu musuh'},
 {id:'siphon',n:'Soul Siphon',k:'drain',pow:45,sp:12,cd:3,price:200,d:'Serang dan serap HP musuh'},
 {id:'thunder',n:'Thunder Fang',k:'dmg',pow:70,sp:14,cd:3,price:220,d:'Sambaran kuat ke satu musuh'},
 {id:'cleave',n:'Sweeping Cut',k:'aoe',pow:40,sp:14,cd:3,price:260,d:'Tebasan ke semua musuh'},
 {id:'venom',n:'Venom Fang',k:'poison',pow:35,sp:9,cd:2,price:140,d:'Serang dan racuni musuh (damage tiap ronde, lama acak 1-5 ronde)'},
 {id:'ember',n:'Burning Edge',k:'burn',pow:40,sp:10,cd:2,price:170,d:'Serang dan bakar musuh (damage tiap ronde, lama acak 1-5 ronde)'},
 {id:'hex',n:'Hex Sigil',k:'weaken',pow:25,sp:10,cd:3,price:190,d:'Serang ringan, ATK & DEF satu musuh turun (lama acak 1-5 ronde)'}];
/* Persona = iblis / malaikat yang dipanggil protagonis untuk membantu */
G.PERSONAS=[
 {id:'mara',n:'Mara',t:'iblis',e:'😈',k:'dmg',pow:50,sp:10,cd:2,price:120,d:'Iblis penggoda, serangan kegelapan'},
 {id:'raphael',n:'Raphael',t:'malaikat',e:'😇',k:'heal',pow:60,sp:12,cd:3,price:180,d:'Malaikat penyembuh, pulihkan HP'},
 {id:'lilith',n:'Lilith',t:'iblis',e:'🦇',k:'drain',pow:55,sp:16,cd:3,price:300,d:'Iblis malam, serap HP musuh'},
 {id:'gabriel',n:'Gabriel',t:'malaikat',e:'👼',k:'healall',pow:45,sp:20,cd:4,price:380,d:'Malaikat pembawa pesan, pulihkan semua tim'},
 {id:'asmodeus',n:'Asmodeus',t:'iblis',e:'👹',k:'aoe',pow:60,sp:24,cd:4,price:450,d:'Raja iblis, hantam semua musuh'},
 {id:'michael',n:'Michael',t:'malaikat',e:'⚔️',k:'dmg',pow:110,sp:22,cd:4,price:520,d:'Malaikat agung, tebasan suci sangat kuat'},
 {id:'hecate',n:'Hecate',t:'iblis',e:'🧙',k:'poison',pow:45,sp:14,cd:3,price:340,d:'Iblis sihir, racun kuat yang menggerogoti musuh'},
 {id:'surtr',n:'Surtr',t:'iblis',e:'🌋',k:'burn',pow:55,sp:18,cd:3,price:420,d:'Raksasa api, bakar musuh hingga ronde berikutnya'},
 {id:'uriel',n:'Uriel',t:'malaikat',e:'🕯️',k:'weaken',pow:35,sp:14,cd:3,price:360,d:'Malaikat cahaya, melemahkan ATK & DEF satu musuh'}];
G.KIND={dmg:'Serang 1 musuh',aoe:'Semua musuh',drain:'Serap HP',heal:'Pulihkan HP',healall:'Pulihkan tim',
 taunt:'Provokasi + DEF naik',debuff:'Lemahkan semua musuh',scan:'Ungkap kelemahan',
 poison:'Serang + racun',burn:'Serang + bakar',weaken:'Lemahkan 1 musuh'};
/* elemen bawaan skill shop & persona */
G.SKEL={twin:'phys',blaze:'fire',siphon:'curse',thunder:'elec',cleave:'phys',mara:'curse',raphael:'bless',lilith:'curse',gabriel:'bless',asmodeus:'fire',michael:'bless',
 venom:'curse',ember:'fire',hex:'curse',hecate:'curse',surtr:'fire',uriel:'bless'};
/* daftar skill/persona yang dimiliki satu protagonis (tersimpan di G.state.skl / G.state.per) */
G.own=ch=>{const S=G.state;S.skl=S.skl||{};S.per=S.per||{};S.skl[ch]=S.skl[ch]||[];S.per[ch]=S.per[ch]||[];return{skl:S.skl[ch],per:S.per[ch]}};
/* ===== LOADOUT: batas skill & persona yang boleh DIBAWA ke battle =====
   Skill dasar / signature dan persona awal selalu aktif & tidak menghabiskan slot (ubah countBase kalau mau dihitung). */
G.LIMIT=G.LIMIT||{skill:3,persona:5};
G.eqKey=kind=>kind=='skill'?'skl':'per';
G.eqMax=kind=>kind=='skill'?G.LIMIT.skill:G.LIMIT.persona;
/* ID yang sedang dibawa. Otomatis: buang yang tidak dimiliki, isi item baru kalau slot masih kosong
   (jadi save lama & pembelian di Shop tetap jalan tanpa mengubah kode Shop). */
G.equipped=(ch,kind)=>{const S=G.state,o=G.own(ch),k=G.eqKey(kind),owned=o[k];
 S.eq=S.eq||{};const E=S.eq[ch]=S.eq[ch]||{};const L=E[k]=E[k]||{on:[],seen:[]};
 L.on=L.on.filter(id=>owned.includes(id));
 owned.forEach(id=>{if(!L.seen.includes(id)){L.seen.push(id);if(L.on.length<G.eqMax(kind))L.on.push(id)}});
 return L.on};
G.isEq=(ch,kind,id)=>G.equipped(ch,kind).includes(id);
/* pasang / lepas. Return {ok,eq,msg} untuk ditampilkan di layar Skill / Persona */
G.toggleEq=(ch,kind,id)=>{const on=G.equipped(ch,kind),max=G.eqMax(kind),nm=kind=='skill'?'skill':'persona';
 if(!G.own(ch)[G.eqKey(kind)].includes(id))return{ok:false,eq:false,msg:'Belum dimiliki'};
 const x=on.indexOf(id);
 if(x>=0){on.splice(x,1);return{ok:true,eq:false,msg:'Dilepas'}}
 if(on.length>=max)return{ok:false,eq:false,msg:`Maksimal ${max} ${nm}! Lepas salah satu dulu`};
 on.push(id);return{ok:true,eq:true,msg:'Dibawa'}};
G.eqCount=(ch,kind)=>G.equipped(ch,kind).length;
/* all=true -> semua yang dimiliki + flag m.eq (untuk layar Skill/Persona). default -> hanya yang dibawa (untuk Battle)
   Semua move dipaksa punya cooldown minimal G.MINCD (skill dasar & signature juga). */
G.moves=(ch,kind,all)=>{const C=G.CHARS[ch],o=G.own(ch),td=(G.TEAMDATA||{})[ch]||{},ce=td.elem||null,SK=G.SKEL||{};
 const eqS=G.equipped(ch,'skill'),eqP=G.equipped(ch,'persona'),mc=m=>Math.max(G.MINCD,+m.cd||0);
 const tag=(x,list)=>Object.assign({},x,{el:x.el!==undefined?x.el:(SK[x.id]||null),cd:mc(x),eq:list.includes(x.id)});
 const pickOwned=(ids,list)=>ids.filter(id=>all||list.includes(id)).map(id=>(kind=='skill'?G.SKILLS:G.PERSONAS).find(x=>x.id==id)).filter(Boolean).map(x=>tag(x,list));
 if(kind=='skill'){const arr=[{id:'base',n:C.sk[0],k:'dmg',pow:C.sk[1],sp:C.sk[2],cd:1,el:ce,d:'Skill dasar',eq:1,free:1}];
  if(td.sig)arr.push(Object.assign({cd:2,eq:1,free:1},td.sig));
  arr.forEach(m=>{m.cd=mc(m)});
  return arr.concat(pickOwned(o.skl,eqS))}
 const P0=G.PERSONA&&G.PERSONA[ch];
 return(P0?[{id:'own',n:P0[0],t:'persona',e:'🎭',k:'dmg',pow:60,sp:12,cd:2,el:ce,d:P0[1]||'Persona awal',eq:1,free:1}]:[]).concat(pickOwned(o.per,eqP))};

/* opts.noPick = true -> lewati layar atur tim (dipakai otomatis untuk lantai dungeon berikutnya)
   opts.chapter = nomor chapter (opsional; kalau kosong dicari otomatis lewat G.chapterNo)
   opts.world / opts.location / opts.winFlags = lihat penjelasan "JEMBATAN KE 4 SISTEM BARU" di atas */
G.battle=(enemies,cb,opts)=>{const S=G.state;S.items=+S.items||0;S.dex=S.dex||{};opts=opts||{};

 /* ================= ATUR TIM SEBELUM BATTLE (maks 4) ================= */
 const pickTeam=go=>{const app=document.getElementById('app'),own=Object.keys(G.CHARS).filter(k=>S.lv[k]);
  const OLDT=document.getElementById('tpk-style');if(OLDT)OLDT.remove();
  {const st=document.createElement('style');st.id='tpk-style';st.textContent=`
  .tpk{position:relative;width:100%;height:100%;display:flex;flex-direction:column;overflow:hidden;color:#fff;font-family:Impact,'Arial Narrow Bold',sans-serif;font-style:italic;background:radial-gradient(circle,rgba(0,0,0,.35) 1.6px,transparent 2px) 0 0/11px 11px,linear-gradient(112deg,#e60012 0 52%,#050505 52% 58%,#fff 58% 59%,#b0000f 59% 100%)}
  .tpk-h{display:flex;align-items:center;gap:24px;padding:16px 34px;background:#000;box-shadow:0 5px 0 #fff,0 11px 0 #e60012}
  .tpk-h b{font-weight:400;font-size:40px;letter-spacing:3px;text-shadow:3px 3px 0 #e60012;transform:skewX(-8deg)}
  .tpk-h span{font-size:22px;background:#ffd400;color:#000;padding:2px 18px;transform:skewX(-12deg);box-shadow:4px 4px 0 #fff}
  .tpk-foe{padding:12px 36px;font:700 14px 'Trebuchet MS',Arial,sans-serif;font-style:normal;background:rgba(0,0,0,.65)}
  .tpk-g{flex:1;display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:24px 26px;align-content:start;padding:28px 40px;overflow-y:auto}
  .tpk-c{position:relative;display:flex;gap:12px;align-items:center;cursor:pointer;background:#0a0a0a;border:3px solid #fff;box-shadow:7px 7px 0 #555;padding:10px 14px 10px 10px;transform:skewX(-6deg);opacity:.55;transition:.14s;user-select:none}
  .tpk-c.on{opacity:1;border-color:#ffd400;box-shadow:7px 7px 0 #ffd400}
  .tpk-c:hover{transform:skewX(-6deg) translate(-3px,-3px)}
  .tpk-p{flex:none;width:76px;height:76px;overflow:hidden;background:#222;border:2px solid #fff}
  .tpk-p>*{display:block;width:100%!important;height:100%!important;object-fit:cover}
  .tpk-i b{display:block;font-weight:400;font-size:26px;letter-spacing:1px;text-shadow:2px 2px 0 #e60012}
  .tpk-i small{display:block;font:700 12px/1.5 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#ddd}
  .tpk-i u{text-decoration:none;display:inline-block;padding:0 5px;margin-left:3px;border-radius:3px;background:#e60012;color:#fff}
  .tpk-n{position:absolute;right:-10px;top:-14px;min-width:34px;height:34px;display:none;align-items:center;justify-content:center;background:#ffd400;color:#000;border:3px solid #000;border-radius:50%;font-size:18px;transform:skewX(6deg)}
  .tpk-c.on .tpk-n{display:flex}
  .tpk-f{display:flex;align-items:center;justify-content:flex-end;gap:22px;padding:14px 36px 18px;background:#000;box-shadow:0 -5px 0 #fff,0 -11px 0 #e60012}
  .tpk-f #tpkm{margin-right:auto;font:700 14px 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#ffd400}
  .tpk-f button{cursor:pointer;background:#e60012;color:#fff;font:italic 400 30px Impact,sans-serif;padding:10px 46px;border:3px solid #fff;box-shadow:5px 5px 0 #fff;transform:skewX(-14deg);transition:.12s}
  .tpk-f button:hover{background:#fff;color:#e60012}`;document.head.appendChild(st)}
  let sel=S.party.filter(k=>own.includes(k));
  if(own.includes('kael')&&!sel.includes('kael'))sel.unshift('kael');
  sel=sel.slice(0,4);if(!sel.length)sel=[own[0]];
  const td=k=>(G.TEAMDATA||{})[k]||{},rl=k=>(G.ROLES&&G.ROLES[td(k).role])||{},E2=k=>(G.ELEM&&G.ELEM[k])?G.ELEM[k].e:'';
  let msg='Klik karakter untuk memasukkan / mengeluarkan dari tim. Kael selalu ikut.';
  const render=()=>{
   app.innerHTML=`<div class="wipe"></div><div class="tpk"><div class="tpk-h"><b>ATUR TIM</b><span>${sel.length} / 4 anggota</span></div>
   <div class="tpk-foe">Musuh: ${enemies.map(x=>`${G.EMOJI[x.n]||'👹'} ${x.n||'Musuh'}`).join(' &bull; ')}</div>
   <div class="tpk-g">${own.map(k=>{const C=G.CHARS[k],on=sel.includes(k),L=S.lv[k].l,t=td(k),r=rl(k),ws=G.pweak(k);
    return`<div class="tpk-c ${on?'on':''}" data-k="${k}"><div class="tpk-n">${sel.indexOf(k)+1}</div><div class="tpk-p">${G.spr('characters',k,'pt')}</div>
    <div class="tpk-i"><b>${C.n}${k=='kael'?' ★':''}</b><small>Lv ${L} &bull; ${r.e||''} ${r.n||''} &bull; ${E2(t.elem)} ${t.elem?String(t.elem).toUpperCase():'-'}</small>
    <small>HP ${Math.round(G.stat(k,L,'hp')*(r.hp||1)*G.bondM(k,'hp'))} &bull; SP ${G.stat(k,L,'sp')} &bull; ATK ${Math.round(G.stat(k,L,'atk')*G.bondM(k,'atk'))}</small>
    <small>Lemah: ${ws.length?ws.map(w=>`<u>${E2(w)}${String(w).toUpperCase()}</u>`).join(''):'-'}</small></div></div>`}).join('')}</div>
   <div class="tpk-f"><span id="tpkm">${msg}</span><button id="tpkGo">MULAI BATTLE</button></div></div>`;
   app.querySelectorAll('.tpk-c').forEach(c=>c.onclick=()=>{const k=c.dataset.k,x=sel.indexOf(k);
    if(k=='kael'&&x>=0){msg='Kael adalah pemimpin tim dan tidak bisa dikeluarkan.'}
    else if(x>=0){if(sel.length<=1)msg='Minimal 1 anggota!';else{sel.splice(x,1);msg=`${G.CHARS[k].n} dikeluarkan dari tim.`}}
    else if(sel.length>=4)msg='Maksimal 4 anggota! Keluarkan salah satu dulu.';
    else{sel.push(k);msg=`${G.CHARS[k].n} masuk tim.`}
    render()});
   document.getElementById('tpkGo').onclick=start};
  const start=()=>{document.onkeydown=null;S.party=sel.slice();if(G.team&&G.team.sync)G.team.sync();if(G.save)G.save();go()};
  document.onkeydown=ev=>{if(ev.key=='Enter')start()};
  render()};

 const run=()=>{
 if(G.team)G.team.sync();
 /* ---------- helper elemen / role ---------- */
 const EL=k=>(G.ELEM&&G.ELEM[k])?G.ELEM[k].e:'';
 const RO=x=>(G.ROLES&&G.ROLES[x.role])||{atk:1,def:1,hp:1,heal:1,n:'',e:''};
 /* HP awal ikut bonus kemampuan Bond (hp) */
 const mkUnit=id=>{const l=S.lv[id].l,td=(G.TEAMDATA||{})[id]||{},ro=(G.ROLES&&G.ROLES[td.role])||{},h=Math.round(G.stat(id,l,'hp')*(ro.hp||1)*G.bondM(id,'hp'));return{id,n:G.CHARS[id].n,l,hp:h,max:h,sp:G.stat(id,l,'sp'),role:td.role,el:td.elem,weak:G.pweak(id),fx:[],cds:{}}};
 const P=S.party.map(mkUnit);                                        /* tim aktif */
 const R=(G.team?G.team.reserve():[]).filter(id=>S.lv[id]&&G.CHARS[id]).map(mkUnit); /* cadangan */
 let i=0,t=0,log=[],first=1,menu=null,revIt=null;const a=document.getElementById('app'),alive=l=>l.filter(x=>x.hp>0),say=x=>log.unshift(x);
 const D0=(G.DIFFSCALE||{})[S.diff]||G.DIFFSCALE.normal;   /* skala kesulitan dasar */
 /* ---------- SKALA CHAPTER: kesulitan dasar + tambahan per chapter ---------- */
 const CHN=G.chapterNo(opts,enemies),CH=G.chScale(CHN);
 const D=Object.assign({},D0,{hp:D0.hp*CH.hp,atk:D0.atk*CH.atk,dmg:D0.dmg*CH.dmg,   /* skala aktif = kesulitan x chapter */
  heavy:Math.min(.7,D0.heavy+CH.heavy),aoe:Math.max(2,D0.aoe-CH.aoeCut),xa:Math.max(D0.xa,CH.xa)});
 const dm=x=>x.hit?`<span class="dmg">${x.hit}</span>`:x.heal?`<span class="dmg" style="color:#7dff9a">+${x.heal}</span>`:'';

 /* ================= SISTEM-BREAKER: boss yang melanggar hukum game =================
    (lihat penjelasan G.LAWS di atas) */
 const LW=G.LAWS||{};
 const law=k=>enemies.some(x=>x.hp>0&&x.laws&&x.laws.includes(k));            /* hukum k sedang dilanggar? */
 const anyLaw=()=>enemies.some(x=>x.hp>0&&x.laws&&x.laws.length);
 const lock={},stolen={},USE={};let RND=0,fwTok=0;                             /* lock = tombol yang dihapus boss */
 const CMDN={skill:'SKILL',persona:'PERSONA',guard:'GUARD',item:'ITEM',swap:'SWAP',scan:'ANALISIS',ao:'ALL-OUT'};
 const ITN={items:'Healing Potion',hipot:'High Potion',megapot:'Mega Potion',spitems:'SP Drink',elixir:'Elixir',grpot:'Group Herb',ether:'Ether'};
 const track=k=>{USE[k]=(USE[k]||0)+1};                                       /* catat kebiasaan tombol pemain */
 const blocked=c=>(lock[c]||0)>0||((c=='item'||c=='swap'||c=='ao')&&law(c));
 const lawNames=x=>(x.laws||[]).map(k=>(LW[k]||{n:k}).n).join(' · ');
 /* ---------- boss berbicara ke PENGGUNA (tembok keempat) ---------- */
 const fwTxt=s=>{const d=new Date(),h=d.getHours(),top=Object.keys(USE).sort((p,q)=>USE[q]-USE[p])[0],
   v={time:String(h).padStart(2,'0')+'.'+String(d.getMinutes()).padStart(2,'0'),part:h<4?'dini hari':h<11?'pagi':h<15?'siang':h<19?'sore':'malam',
    diff:((G.DIFF||{})[S.diff]||{}).n||'?',round:RND,fav:top?CMDN[top]:'tombol apa pun',alive:alive(P).length};
  return String(s).replace(/\{(\w+)\}/g,(m,k)=>v[k]!==undefined?v[k]:m)};
 const fwSay=(who,lines,delay)=>{const my=++fwTok,arr=[].concat(lines).map(fwTxt);let k=0;
  document.querySelectorAll('.fwbox').forEach(x=>x.remove());
  const step=()=>{if(my!=fwTok)return;document.querySelectorAll('.fwbox').forEach(x=>x.remove());if(k>=arr.length)return;
   const d=document.createElement('div');d.className='fwbox';d.innerHTML=`<small>${String(who).toUpperCase()} &bull; MENATAP KE LAYARMU</small><b>${arr[k]}</b>`;document.body.appendChild(d);
   const w=2500+arr[k].length*40;k++;setTimeout(step,w)};
  setTimeout(step,delay||0)};
 const sysPop=txt=>{const d=document.createElement('div');d.className='syspop';d.textContent=txt;document.body.appendChild(d);setTimeout(()=>d.remove(),1900)};
 const glitch=()=>{const b=document.querySelector('.bt');if(b){b.classList.remove('gl');void b.offsetWidth;b.classList.add('gl')}};
 const TAUNT=['Tombol itu... kamu menekannya dengan ragu, ya?','Aku bisa melihat layarmu, pengguna.','Jam {time}. Kamu masih di sini. Aku menghargainya.','Ronde {round}. Jarimu mulai lelah, bukan?','Kamu pikir kamu yang mengendalikan mereka? Aku yang menulis pilihanmu.','Mode {diff}. Kamu memilihnya sendiri. Aku hanya mengikuti naskah.'];
 const STEAL=['items','hipot','megapot','spitems','elixir','grpot','ether'];
 const giveBack=()=>{Object.keys(stolen).forEach(k=>{S[k]=(+S[k]||0)+stolen[k];delete stolen[k]})};
 const lockTick=()=>Object.keys(lock).forEach(k=>{lock[k]--;if(lock[k]<=0)delete lock[k]});
 const cdTick=()=>{if(law('cd')&&RND%2){say('⚖ Hukum Cooldown dilanggar: cooldown membeku ronde ini!');return}tickCd()};
 /* hukum GILIRAN: boss kadang menyela giliranmu dengan serangan */
 const turnLaw=()=>{if(!law('turn')||!alive(P).length||Math.random()>.3)return;
  const b=alive(enemies).find(x=>x.laws&&x.laws.includes('turn')&&!x.stun);if(!b)return;
  say(`⚖ ${b.n} menyela giliranmu!`);foeWeakHit=[];doAct(b,'atk');foeWeakHit=[]};
 /* hukum UNDO: boss menekan Ctrl+Z, sebagian damage ronde lalu dikembalikan */
 const undoLaw=()=>alive(enemies).forEach(b=>{if(b.laws&&b.laws.includes('undo')&&b.snap!=null&&b.hp<b.snap){
  const r=Math.round((b.snap-b.hp)*.35);if(r>0){healX(b,r);say(`⚖ ${b.n} menekan UNDO! Lukanya dikembalikan +${r}`)}}});
 /* VICTORY palsu: boss ber-flag fake menolak kalah, muncul layar kemenangan palsu lalu ia bangkit */
 const fakeWin=(x,cont)=>{x.fakeDone=1;document.onkeydown=null;menu=null;
  const o=document.createElement('div');o.className='fakeov';o.innerHTML=`<div><small>RESULT</small><b>VICTORY</b><i>+${x.xp} EXP</i></div>`;document.body.appendChild(o);
  setTimeout(()=>{o.classList.add('err');o.innerHTML=`<div><small>ERROR 0xFAKE</small><b>KEMENANGAN TIDAK SAH</b><i>${x.n} menolak ditulis sebagai kalah</i></div>`},1500);
  setTimeout(()=>{o.remove();const ph=(x.phases&&x.phases[x.phase||0])||{};
   x.hp=Math.max(1,Math.round(x.max*(ph.fakeHp||.3)));x.stun=0;x.charging=0;
   say(`⚖ ${x.n} menolak kalah! VICTORY tadi palsu!`);
   fwSay(x.n,ph.fakeFw||['Kemenangan itu belum sah, pengguna. Kisah tidak ditutup oleh satu tombol.','Lanjutkan. Kali ini tanpa trik dariku.'],0);cont()},3200)};
 /* cek menang: kembalikan true kalau sudah ditangani (menang / VICTORY palsu) */
 const chk=cont=>{const fk=enemies.find(x=>x.hp<=0&&x.fake&&!x.fakeDone);
  if(fk){fakeWin(fk,cont);return true}
  if(!alive(enemies).length){win();return true}return false};
 /* aksi 'meta' boss: serangan terhadap SISTEM game, bukan cuma karakter */
 const metaAct=e=>{const A=alive(P);if(!A.length)return;
  const ph=(e.phases&&e.phases[e.phase||0])||{},pool=(ph.sys&&ph.sys.length)?ph.sys:['taunt'],k=pool[Math.floor(Math.random()*pool.length)];
  const light=m=>{const x=tgtPick(e),d=hurt(e,x,m);return[x,d]};
  switch(k){
   case'wipecmd':{const c=['item','swap','ao','scan','guard'].filter(z=>!lock[z]),z=c.length?c[Math.floor(Math.random()*c.length)]:'item';lock[z]=2;
    const[x,d]=light(.4);sysPop(`⚠ TOMBOL ${CMDN[z]} DIHAPUS DARI GAME`);say(`${e.n} menghapus tombol ${CMDN[z]} dari game! (1 ronde) ${x.n} -${d}`);break}
   case'steal':{const ks=STEAL.filter(z=>(+S[z]||0)>0),[x,d]=light(.4);
    if(!ks.length){say(`${e.n} mengacak-acak tasmu, tapi kosong! ${x.n} -${d}`);break}
    const z=ks[Math.floor(Math.random()*ks.length)],n=Math.min(+S[z],z=='items'?2:1);S[z]-=n;stolen[z]=(stolen[z]||0)+n;
    sysPop('⚠ ISI TAS DIHAPUS DARI INVENTORI');say(`${e.n} menghapus ${n}x ${ITN[z]} dari tasmu! (kembali setelah battle) ${x.n} -${d}`);break}
   case'cdwrite':{let n=0;A.forEach(u=>G.moves(u.id,'skill').concat(G.moves(u.id,'persona')).forEach(m=>{if(!cdLeft(u,m)&&Math.random()<.5){u.cds=u.cds||{};u.cds[m.id]=2+Math.floor(Math.random()*2);n++}}));
    const[x,d]=light(.4);sysPop('⚠ COOLDOWN DITULIS ULANG');say(`${e.n} menulis ulang cooldown! ${n} move membeku. ${x.n} -${d}`);break}
   case'drainao':{const was=Math.round(AO/G.AOMAX*100);AO=0;const[x,d]=light(.4);sysPop('⚠ GAUGE ALL-OUT DIKOSONGKAN');say(`${e.n} mengosongkan gauge ALL-OUT${was?` (-${was}%)`:''}! ${x.n} -${d}`);break}
   case'swaphp':{const x=tgtPick(e),hp=x.hp/x.max,sm=Math.max(1,spMax(x)),sp=x.sp/sm;x.hp=Math.max(1,Math.round(x.max*sp));x.sp=Math.min(sm,Math.round(sm*hp));
    sysPop('⚠ NILAI HP & SP DITUKAR');say(`${e.n} menukar HP dan SP ${x.n}! (HP ${Math.round(sp*100)}%, SP ${Math.round(hp*100)}%)`);break}
   case'glitch':{glitch();sysPop('⚠ ERROR 0x'+(Math.floor(Math.random()*65535)).toString(16).toUpperCase().padStart(4,'0'));let s=0;A.forEach(y=>s+=hurt(e,y,.45));say(`${e.n} merusak layar! Tim -${s}`);break}
   case'predict':{const ks=Object.keys(USE).sort((p,q)=>USE[q]-USE[p]),top=ks[0],x=tgtPick(e);
    if(!top){const[y,d]=light(.4);fwSay(e.n,['Belum ada pola? Tekan sesuatu, pengguna. Aku akan menghafalnya.']);say(`${e.n} mengamati tombolmu. ${y.n} -${d}`);break}
    fwSay(e.n,[`Kamu terlalu sering menekan ${CMDN[top]}. Aku sudah hafal.`]);
    if(top=='skill'||top=='persona'){const d=hurt(e,x,.5);addFx(x,'seal',1,dur()+1);say(`${e.n} membaca kebiasaanmu: ${CMDN[top]} terus! ${x.n} tersegel -${d}`)}
    else if(top=='guard'){let s=0;A.forEach(y=>{y.g=0;s+=hurt(e,y,.6)});say(`${e.n} membaca GUARD-mu dan menembusnya! Tim -${s}`)}
    else if(top=='item'){metaStealOne(e)}
    else if(top=='ao'){AO=0;const d=hurt(e,x,.5);say(`${e.n} memotong gauge ALL-OUT! ${x.n} -${d}`)}
    else{lock[top]=2;const d=hurt(e,x,.5);say(`${e.n} menghapus tombol ${CMDN[top]}! ${x.n} -${d}`)}
    break}
   case'taunt':{const[x,d]=light(.5);fwSay(e.n,[TAUNT[Math.floor(Math.random()*TAUNT.length)]]);say(`${e.n} menyerang ${x.n} -${d}`);break}
   default:{const[x,d]=light(.8);say(`${e.n} -> ${x.n} ${d}`)}}};
 const metaStealOne=e=>{const ks=STEAL.filter(z=>(+S[z]||0)>0),x=tgtPick(e),d=hurt(e,x,.4);
  if(!ks.length){say(`${e.n} mengacak-acak tasmu, tapi kosong! ${x.n} -${d}`);return}
  const z=ks[Math.floor(Math.random()*ks.length)];S[z]--;stolen[z]=(stolen[z]||0)+1;say(`${e.n} menghapus 1x ${ITN[z]} dari tasmu! (kembali setelah battle) ${x.n} -${d}`)};

 /* ---------- ALL-OUT gauge ---------- */
 let AO=0,foeWeakHit=[];
 const gain=n=>{if(law('ao'))return;AO=Math.min(G.AOMAX,AO+n)};

 /* ---------- COOLDOWN skill / persona / combo ---------- */
 /* cds[id] = sisa ronde. Dipasang cd+1 saat dipakai, dikurangi 1 di akhir tiap ronde musuh,
    jadi cd:1 = lewati 1 ronde penuh, cd:3 = lewati 3 ronde. */
 const cdLeft=(u,m)=>Math.max(0,(u.cds&&u.cds[m.id])||0);
 const setCd=(u,m)=>{if(m.cd>0){u.cds=u.cds||{};u.cds[m.id]=m.cd+1}};
 const tickCd=()=>P.concat(R).forEach(u=>{if(!u.cds)return;Object.keys(u.cds).forEach(k=>{if(u.cds[k]>0)u.cds[k]--;if(u.cds[k]<=0)delete u.cds[k]})});

 /* ---------- buff / debuff ---------- */
 const fxM=(x,k)=>(x.fx||[]).filter(f=>f.k==k).reduce((m,f)=>m*f.m,1);
 const has=(x,k)=>(x.fx||[]).some(f=>f.k==k);
 const up=(x,k)=>(x.fx||[]).some(f=>f.k==k&&f.m>1);
 const addFx=(x,k,m,tt)=>{x.fx=x.fx||[];const f=x.fx.find(f=>f.k==k&&(f.m>1)==(m>1));if(f){f.t=Math.max(f.t,tt);f.m=m}else x.fx.push({k,m,t:tt})};
 /* DoT (damage over time): racun / bakar. pct = persen HP maksimum yang hilang tiap akhir ronde */
 const addDot=(x,k,pct,tt)=>{x.fx=(x.fx||[]).filter(f=>f.k!=k);x.fx.push({k,m:1,t:tt,dot:pct})};
 const DOTN={poison:['☠️RACUN','keracunan'],burn:['🔥BAKAR','terbakar']};
 const dotTick=()=>{enemies.concat(P).forEach(x=>{if(x.hp<=0||!x.fx)return;
  x.fx.filter(f=>f.dot).forEach(f=>{if(x.hp<=0)return;const d=Math.max(1,Math.round(x.max*f.dot*(x.boss?.5:1)));x.hp-=d;x.hit=(x.hit||0)+d;say(`${x.n} ${(DOTN[f.k]||['','terkena efek'])[1]} -${d}`)})})};
 const tickAll=()=>enemies.concat(P).forEach(x=>{if(!x.fx)return;x.fx.forEach(f=>f.t--);x.fx=x.fx.filter(f=>f.t>0)});
 const fxTags=x=>(x.fx||[]).map(f=>f.k=='taunt'?'<u class="b">🛡️TAUNT</u>':f.k=='seal'?'<u class="d">🔇SEAL</u>':f.dot?`<u class="d">${(DOTN[f.k]||[f.k.toUpperCase()])[0]}</u>`:`<u class="${f.m>1?'b':'d'}">${f.m>1?'▲':'▼'}${f.k.toUpperCase()}</u>`).join('');

 /* ---------- persiapan musuh (kategori, weak/res/imm, boss) ---------- */
 const HASH=s=>{let h=0;for(const c of String(s))h=(h*31+c.charCodeAt(0))>>>0;return h};
 const ELS=['fire','ice','elec','wind','bless','curse','phys'];
 const avgLv=Math.max(1,Math.round(P.reduce((s,u)=>s+u.l,0)/Math.max(1,P.length)));
 const clone=v=>v&&typeof v=='object'?JSON.parse(JSON.stringify(v)):v;
 const prep=e=>{const tpl=(G.BOSSES&&G.BOSSES[e.n])||(G.ENEMYDEX&&G.ENEMYDEX[e.n])||null;
  if(tpl)Object.keys(tpl).forEach(k=>{if(e[k]===undefined)e[k]=clone(tpl[k])});
  e.max=+e.max||+e.hp||30;if(!(e.hp>0))e.hp=e.max;e.atk=+e.atk||5;e.xp=+e.xp||10;
  e.cat=e.boss?'boss':(e.cat||'normal');e.lv=+e.lv||(avgLv+Math.floor((CHN-1)/2));
  if(!e.scaled){const cs=G.CATSCALE[e.cat]||G.CATSCALE.normal;   /* skala HP & ATK: kesulitan x chapter x kategori (sekali saja) */
   const bh=e.boss?CH.bossHp:1,ba=e.boss?CH.bossAtk:1;           /* boss dapat tambahan chapter ekstra */
   e.max=Math.round(e.max*D.hp*cs.hp*bh);e.hp=Math.round(e.hp*D.hp*cs.hp*bh);e.atk=Math.max(1,Math.round(e.atk*D.atk*cs.atk*ba));
   e.xp=Math.max(1,Math.round(e.xp*CH.xp));e.scaled=1}
  if(!e.weak&&!e.res&&!e.imm){const h=HASH(e.n);e.weak=[ELS[h%7]];e.res=[ELS[(h+3)%7]];e.imm=[]} /* musuh lama tanpa data: weakness otomatis */
  e.weak=e.weak||[];e.res=e.res||[];e.imm=e.imm||[];e.fx=e.fx||[];e.baseAtk=e.atk;
  /* chapter 4+: musuh biasa dapat 1 resist tambahan (makin susah menembus kelemahan) */
  if(!e.boss&&CHN>=4&&e.res.length<2){const x=ELS[(HASH(e.n)+5)%7];if(!e.weak.includes(x)&&!e.res.includes(x)&&!e.imm.includes(x))e.res.push(x)}
  if(e.boss){if(!e.phases||!e.phases.length)e.phases=[{at:1,n:'Phase 1',pat:['atk','atk','aoe','charge']}];
   e.phase=0;const p0=e.phases[0];if(p0.mech){e.mech=p0.mech;e.refl=p0.refl||e.refl}
   e.laws=(p0.laws||[]).slice();e.fake=!!p0.fake;e.fakeDone=0}
  if(e.mech=='barrier')e.barrier=1;
  if(e.mech=='reflect'&&!e.refl)e.refl='fire';
  e.snap=e.hp;
  return e};
 enemies.forEach(prep);
 /* ---- sambungan ke sistem baru: masuk dunia / lokasi (membuka arsip lokasi otomatis) ---- */
 if(opts.world)G.MAemit('world_entered',opts.world);
 if(opts.location)G.MAemit('location_visited',opts.location);
 const boss0=enemies.find(x=>x.boss);if(boss0)say(`${boss0.n} muncul!`+(CHN>1?` (Chapter ${CHN})`:''));
 if(boss0){const p0=boss0.phases[0];if(boss0.laws.length)say('⚖ HUKUM DILANGGAR: '+lawNames(boss0));if(p0.fw)fwSay(boss0.n,p0.fw,1400)}

 /* ---------- DEBUFF MUSUH (baru) ----------
    Aksi debuff yang bisa dipakai musuh / boss (juga boleh ditulis di pat boss: 'poison','burn','seal','weaken','drainsp','debuff'):
      poison  = serang ringan + RACUN (1-5 ronde)  burn    = serang ringan + BAKAR (1-5 ronde, lebih sakit)
      seal    = serang ringan + SEAL 1-5 giliran (target tidak bisa Skill / Persona)
      weaken  = serang ringan + ATK target turun   drainsp = serang ringan + curi SP target
      debuff  = DEF seluruh tim turun
      meta    = serangan terhadap SISTEM game (hanya boss, lihat G.LAWS / field sys pada phase)
    Tiap jenis musuh punya "selera" debuff sendiri (otomatis dari namanya), atau isi  e.debuffs:['poison','seal']  di data musuh.
    Seal baru muncul mulai chapter 3. Peluang debuff naik seiring chapter & kesulitan. */
 const DEBS=['poison','weaken','debuff','drainsp','seal','burn'];
 const pickDeb=e=>{let pool=(e.debuffs&&e.debuffs.length)?e.debuffs.slice():(()=>{const b=HASH(e.n)%DEBS.length;return[DEBS[b],DEBS[(b+2)%DEBS.length],DEBS[(b+4)%DEBS.length]]})();
  if(CHN<3||e.sealCd>0)pool=pool.filter(x=>x!='seal');if(!pool.length)pool=['debuff','weaken'];return pool[Math.floor(Math.random()*pool.length)]};
 const dur=()=>{const o=G.DEBTURN||{min:1,max:5},lo=Math.max(1,o.min|0),hi=Math.max(lo,o.max|0);return lo+Math.floor(Math.random()*(hi-lo+1))};
 const dHit=k=>{const c=(G.DEBCHANCE||{})[k];return Math.random()<(c===undefined?1:c)};
 const debChance=()=>Math.min(.32,.10+.015*CHN+(D.heavy-.25)*.3);

 /* ---------- elemen serangan musuh (untuk weakness anggota tim) ----------
    Urutan: elemen phase boss -> e.aEl / e.el / e.elem (kalau valid) -> otomatis dari nama musuh */
 const foeEl=e=>{const ph=e.boss&&e.phases&&e.phases[e.phase||0],c=[ph&&ph.el,e.aEl,e.el,e.elem].find(v=>typeof v=='string'&&ELS.includes(v));return c||ELS[(HASH(e.n)+2)%7]};

 /* ---------- Analisis: kelemahan yang ditemukan pemain (tersimpan) ---------- */
 const dk=e=>e.boss?e.n+'#'+(e.phase||0):e.n;
 const dx=e=>{const k=dk(e);return S.dex[k]=S.dex[k]||{w:[],r:[],i:[]}};
 const note=(e,el,af)=>{if(!el||el=='void')return;const D=dx(e),k={weak:'w',res:'r',imm:'i'}[af];if(k&&!D[k].includes(el))D[k].push(el)};
 const scanE=e=>{e.weak.forEach(el=>note(e,el,'weak'));e.res.forEach(el=>note(e,el,'res'));e.imm.forEach(el=>note(e,el,'imm'))};
 /* hukum ANALISIS: info kelemahan disembunyikan boss */
 const chips=e=>{if(e.hp>0&&law('scan'))return'<u class="i">⚖ ??? DISEMBUNYIKAN</u>';const D=dx(e);let h='';e.weak.forEach(el=>h+=`<u class="w">${D.w.includes(el)?EL(el):'?'}</u>`);D.r.forEach(el=>h+=`<u class="r">${EL(el)}</u>`);D.i.forEach(el=>h+=`<u class="i">${EL(el)}</u>`);return h};
 const aff=(e,el)=>{if(!el||el=='void')return'neutral';if(e.imm.includes(el))return'imm';if(e.weak.includes(el))return'weak';if(e.res.includes(el))return'res';return'neutral'};

 /* ---------- AUTO TARGET ---------- */
 const pick=(dir=1)=>{if(enemies[t]&&enemies[t].hp>0)return;const n=enemies.length;for(let s=1;s<=n;s++){const k=((t+dir*s)%n+n)%n;if(enemies[k].hp>0){t=k;return}}};
 const cycle=dir=>{const n=enemies.length;for(let s=1;s<=n;s++){const k=((t+dir*s)%n+n)%n;if(enemies[k].hp>0){t=k;break}}draw()};

 /* ---------- damage ke musuh (weakness / resist / immune / barrier / reflect) ---------- */
 const crit=()=>Math.random()<.15;
 /* ATK ikut bonus kemampuan Bond (atk) */
 const dealE=(e,base,el,p)=>{const af=aff(e,el),r={d:0,af};
  let d=base*fxM(p,'atk')*G.bondM(p.id,'atk')/Math.max(.3,fxM(e,'def'));
  if(af=='imm'){say(`${e.n} kebal terhadap ${EL(el)}!`);note(e,el,'imm');return r}
  if(e.mech=='reflect'&&el&&el==e.refl){const x=Math.max(1,Math.round(d*.4));p.hp-=x;p.hit=(p.hit||0)+x;say(`${e.n} memantulkan ${EL(el)}! ${p.n} -${x}`);note(e,el,'res');return r}
  if(af=='weak')d*=1.5;else if(af=='res')d*=.5;
  if(e.mech=='barrier'&&e.barrier){if(af=='weak'){e.barrier=0;e.stun=1;say(`BARRIER BREAK! ${e.n} lumpuh!`)}else d*=.25}
  if(af=='weak'&&e.charging){e.charging=0;e.stun=1;say(`ULTIMATE ${e.n} DIGAGALKAN!`)}
  d=Math.max(1,Math.round(d)||1);
  if(crit()){d=Math.round(d*1.6);say('CRITICAL!');gain(G.AOGAIN.crit)}
  e.hp-=d;e.hit=(e.hit||0)+d;r.d=d;note(e,el,af);
  gain(af=='weak'?G.AOGAIN.weak:G.AOGAIN.hit);
  if(af=='weak'){say(`WEAK! ${e.n}`);if(law('weak'))say('⚖ Hukum Kelemahan dilanggar: tidak ada 1 MORE!');else if(!p.usedMore)p.more=1}
  if(af=='res')say(`${e.n} resist ${EL(el)}`);
  if(e.hp<=0&&e.mech=='revive'&&!e.revived&&af!='weak'){e.revived=1;e.hp=Math.round(e.max*.4);e.barrier=0;say(`${e.n} bangkit kembali!`)}
  return r};
 const healX=(x,h)=>{const b=x.hp;x.hp=Math.min(x.max,x.hp+h);x.heal=x.hp-b;return x.heal};

 /* ---------- Boss: phase & banner ---------- */
 const bannerTxt=(title,sub,msg)=>{document.querySelectorAll('.bcast').forEach(x=>x.remove());const d=document.createElement('div');d.className='bcast per';
  d.innerHTML=`<div class="bc-in"><div class="bc-ic">⚠️</div><div class="bc-tx"><small>${msg||''}</small><b>${title}: ${sub}</b></div></div>`;document.body.appendChild(d);setTimeout(()=>d.remove(),2300)};
 const enterPhase=(e,k)=>{const ph=e.phases[k];e.phase=k;e.atk=Math.round(e.baseAtk*(ph.atkm||1));e.fx=[];e.charging=0;e.t=0;e.pi=0;e.stun=0;
  if(ph.heal)healX(e,Math.round(e.max*ph.heal));
  /* efek untuk TIM saat fase ini dimulai (dipakai boss spesial):
     th = pulihkan HP tim (0-1)  tsp = pulihkan SP tim (0-1)  trev = hidupkan yang tumbang  tbuff = ATK & DEF tim x (sampai battle selesai) */
  if(ph.trev)P.filter(u=>u.hp<=0).forEach(u=>rez(u,.5,.25));
  if(ph.th)alive(P).forEach(u=>healX(u,Math.round(u.max*ph.th)));
  if(ph.tsp)alive(P).forEach(u=>spX(u,Math.round(spMax(u)*ph.tsp)));
  if(ph.tbuff){alive(P).forEach(u=>{addFx(u,'atk',ph.tbuff,99);addFx(u,'def',ph.tbuff,99)});say('ATK & DEF seluruh tim melonjak!')}
  if(ph.weak)e.weak=ph.weak.slice();if(ph.res)e.res=ph.res.slice();if(ph.imm)e.imm=ph.imm.slice();
  if('mech' in ph){e.mech=ph.mech;e.barrier=ph.mech=='barrier'?1:0;if(ph.refl)e.refl=ph.refl}
  /* hukum game yang dilanggar di phase ini (menggantikan phase sebelumnya) */
  e.laws=(ph.laws||[]).slice();e.fake=!!ph.fake;e.fakeDone=0;e.snap=e.hp;
  if(!e.laws.length)Object.keys(lock).forEach(z=>delete lock[z]);
  say(`PHASE ${k+1}! ${ph.n}`);bannerTxt('PHASE '+(k+1),ph.n,ph.msg||'Pola serangannya berubah!');
  if(e.laws.length)say('⚖ HUKUM DILANGGAR: '+lawNames(e));
  if(ph.fw)fwSay(e.n,ph.fw,700)};
 const checkPhase=e=>{if(!e.boss||e.hp<=0)return;let k=0;e.phases.forEach((p,j)=>{if(e.hp/e.max<=p.at)k=j});if(k>(e.phase||0))enterPhase(e,k)};

 /* ---------- AI musuh ---------- */
 const tgtPick=(e,mode)=>{const al=alive(P);if(!al.length)return null;const tn=al.find(x=>has(x,'taunt'));if(tn&&Math.random()<.85)return tn;
  if(mode=='low')return al.slice().sort((p,q)=>p.hp/p.max-q.hp/q.max)[0];return al[Math.floor(Math.random()*al.length)]};
 /* target yang belum kena efek k (kalau semua sudah kena, acak) */
 const tgtNo=k=>{const al=alive(P);if(!al.length)return null;const tn=al.find(x=>has(x,'taunt'));if(tn&&Math.random()<.85)return tn;
  const f=al.filter(x=>!has(x,k)),l=f.length?f:al;return l[Math.floor(Math.random()*l.length)]};
 /* hurt: kalau elemen serangan musuh = kelemahan target (dan target tidak GUARD) -> damage x1.35 & musuh dapat giliran tambahan
    (hukum GUARD dilanggar -> GUARD tidak berpengaruh sama sekali)
    DEF target ikut bonus kemampuan Bond (def) */
 const hurt=(e,x,m)=>{const gd=x.g&&!law('guard'),dfn=(+G.stat(x.id,x.l,'def')||0)*RO(x).def*fxM(x,'def')*G.bondM(x.id,'def')*(gd?2:1);
  const raw=e.atk*fxM(e,'atk')*FOE_DMG*D.dmg*m;   /* DEF hanya menahan sebagian & damage tidak bisa turun di bawah 35% (guard: 20%) */
  let d=Math.max(1,Math.round(Math.max(raw*(gd?.2:.35),raw-dfn*.6))||1);
  const el=foeEl(e);
  if(!gd&&el&&(x.weak||[]).includes(el)){d=Math.round(d*1.35);if(!foeWeakHit.includes(x.n))foeWeakHit.push(x.n)}
  x.hp-=d;x.hit=(x.hit||0)+d;gain(G.AOGAIN.hurt);return d};
 const catAct=e=>{const lo=alive(P).some(x=>x.hp/x.max<.35),r=Math.random(),allies=alive(enemies).filter(y=>y!=e);
  if(e.cat=='elite'){if(e.hp<e.max*.5&&!e.enraged){e.enraged=1;return'enrage'}if(e.t%D.aoe==0)return'aoe';if(Math.random()<debChance()+.12)return pickDeb(e);if(lo)return'heavy';return r<D.heavy-.05?'heavy':'atk'}
  if(e.cat=='support'){if(allies.some(y=>y.hp<y.max*.5)||(!allies.length&&e.hp<e.max*.5))return'heal';if(allies.some(y=>!up(y,'atk')))return'buff';return e.t%2==0?pickDeb(e):'atk'}
  if(e.cat=='special'){if(e.mech=='barrier'&&!e.barrier&&e.t%3==0)return'rebarrier';if(e.mech=='reflect'&&e.t%2==0)return'switch';if(Math.random()<debChance()+.1)return pickDeb(e);return r<D.heavy+.05?'heavy':'atk'}
  if(e.hp<e.max*.25&&r<.3)return'guard';if(Math.random()<debChance())return pickDeb(e);return r<D.heavy?'heavy':'atk'};
 const bossAct=e=>{const ph=e.phases[e.phase||0];if(e.charging)return'ult';
  if(ph.finish&&alive(P).some(x=>x.hp/x.max<.3)&&Math.random()<.6)return'heavy';
  const pat=ph.pat&&ph.pat.length?ph.pat:['atk'];e.pi=(e.pi||0)+1;let act=pat[(e.pi-1)%pat.length];
  /* boss kadang mengganti serangan biasa dengan debuff (makin sering di chapter lanjut / kesulitan tinggi) */
  if(act=='atk'&&Math.random()<Math.min(.45,.18+.02*CHN+.05*D.xa))act=pickDeb(e);
  return act};
 const doAct=(e,act)=>{const A=alive(P);if(!A.length)return;
  switch(act){
   case'heavy':{const x=tgtPick(e,'low'),d=hurt(e,x,FOE_HEAVY/FOE_DMG);say(`${e.n} SERANGAN BERAT ${x.n} ${d}`);break}
   case'aoe':{let s=0;A.forEach(x=>s+=hurt(e,x,.7));say(`${e.n} ${e.aoeN||'menghantam semua'}! Tim -${s}`);break}
   case'debuff':{const n=dur();A.forEach(y=>addFx(y,'def',.75,n+1));say(`${e.n} melemahkan tim! (DEF turun ${n} giliran)`);break}
   case'poison':{const x=tgtNo('poison'),d=hurt(e,x,.6);const n=dur(),ok=dHit('poison');if(ok)addDot(x,'poison',.07,n);say(ok?`${e.n} meracuni ${x.n}! -${d} (RACUN ${n} ronde)`:`${e.n} menyerang ${x.n} -${d} (racun gagal)`);break}
   case'burn':{const x=tgtNo('burn'),d=hurt(e,x,.6);const n=dur(),ok=dHit('burn');if(ok)addDot(x,'burn',.09,n);say(ok?`${e.n} membakar ${x.n}! -${d} (BAKAR ${n} ronde)`:`${e.n} menyerang ${x.n} -${d} (api padam)`);break}
   case'seal':{const x=tgtNo('seal'),d=hurt(e,x,.5);e.sealCd=G.SEALGAP;const n=dur(),ok=dHit('seal');if(ok)addFx(x,'seal',1,n+1);say(ok?`${e.n} menyegel ${x.n}! -${d} (tidak bisa Skill/Persona ${n} giliran)`:`${x.n} menahan segel ${e.n}! -${d}`);break}
   case'weaken':{const x=tgtPick(e),d=hurt(e,x,.5);const n=dur(),ok=dHit('weaken');if(ok)addFx(x,'atk',.7,n+1);say(ok?`${e.n} melemahkan ${x.n}! -${d} (ATK turun ${n} giliran)`:`${e.n} menyerang ${x.n} -${d} (kutukan gagal)`);break}
   case'drainsp':{const x=tgtPick(e),d=hurt(e,x,.5),s=Math.min(x.sp,12+Math.round(CHN*1.5));const ok=dHit('drainsp');if(ok)x.sp-=s;say(ok?`${e.n} menyedot SP ${x.n}! -${d} (SP -${s})`:`${e.n} menyerang ${x.n} -${d} (SP aman)`);break}
   case'drain':{const x=tgtPick(e),d=hurt(e,x,1);healX(e,Math.round(d/2));say(`${e.n} menyerap ${x.n} ${d}`);break}
   case'meta':{metaAct(e);break}
   case'heal':{const t0=alive(enemies).sort((p,q)=>p.hp/p.max-q.hp/q.max)[0],h=Math.round(t0.max*(e.healPct||.3));healX(t0,h);say(`${e.n} menyembuhkan ${t0.n} +${t0.heal}`);break}
   case'buff':{const t0=alive(enemies).filter(y=>y!=e).find(y=>!up(y,'atk'))||e;addFx(t0,'atk',1.3,3);say(`${e.n} menguatkan ${t0.n}! (ATK naik)`);break}
   case'guard':{addFx(e,'def',1.5,2);say(`${e.n} bertahan`);break}
   case'enrage':{addFx(e,'atk',1.3,99);say(`${e.n} MENGAMUK! (ATK naik)`);break}
   case'rebarrier':{e.barrier=1;say(`${e.n} membentuk barrier baru!`);break}
   case'switch':{const pool=ELS.filter(z=>z!=e.refl);e.refl=pool[Math.floor(Math.random()*pool.length)];say(`${e.n} berubah! Kini memantulkan ${EL(e.refl)}`);break}
   case'charge':{e.charging=1;const u=e.ult||{n:'Ultimate'};say(`⚠ ${e.n} mengumpulkan kekuatan: ${u.n}!`);bannerTxt('ULTIMATE CHARGING',u.n,'Serang kelemahannya untuk menggagalkan, atau GUARD!');break}
   case'ult':{const u=e.ult||{n:'Ultimate',m:2.2};let s=0;e.charging=0;A.forEach(x=>s+=hurt(e,x,(u.m||2.2)*CH.ult));say(`${e.n} — ${u.n}! Tim -${s}`);break}   /* ultimate makin kuat tiap chapter */
   default:{const x=tgtPick(e,e.cat=='elite'?'low':null),d=hurt(e,x,1);say(`${e.n} -> ${x.n} ${d}`)}
  }};
 /* bonus=true -> giliran tambahan karena menembus kelemahan (tidak menambah counter giliran, tidak cek stun) */
 const foeTurn=(e,bonus)=>{if(e.hp<=0)return;
  if(!bonus){e.t=(e.t||0)+1;if(e.sealCd>0)e.sealCd--;
   if(e.stun){e.stun=0;say(`${e.n} lumpuh dan tidak bisa bergerak!`);return}}
  let n=e.boss?((e.phases[e.phase||0].acts)||1):1;
  if(e.boss&&((D.xa==1&&e.phases.length>1&&(e.phase||0)>=e.phases.length-1)||(D.xa==2&&(e.phase||0)>=1)))n++;   /* boss makin ganas di hard / hardcore / chapter lanjut */
  for(let k=0;k<n&&alive(P).length;k++)doAct(e,e.boss?bossAct(e):catAct(e))};

 /* ---------- daftar item ---------- */
 /* ---------- daftar item ----------
    c = jumlah di tas (S.<kunci>)   hide = disembunyikan kalau 0   dead = butuh target anggota tumbang (Revive)
    Beli di tab SHOP (kunci harus sama dengan di main.js: items, hipot, megapot, spitems, elixir, grpot, revive, mrevive, atkc, defc) */
 const spMax=p=>G.stat(p.id,p.l,'sp');
 const spX=(p,n)=>{const b=p.sp;p.sp=Math.min(spMax(p),p.sp+n);return p.sp-b};
 const rez=(u,pct,spPct)=>{u.hp=Math.max(1,Math.round(u.max*pct));u.sp=Math.max(u.sp,Math.round(spMax(u)*spPct));u.fx=[];u.g=0;u.more=0;u.usedMore=0};
 const cnt=k=>()=>+S[k]||0;
 /* hapus semua debuff (racun, bakar, seal, ATK/DEF turun); buff & taunt tetap */
 const clean=x=>{x.fx=(x.fx||[]).filter(f=>f.m>1||f.k=='taunt')};
 const ITEMS=[
  {n:'Healing Potion',d:'Pulihkan 50 HP',c:cnt('items'),use:p=>{S.items--;healX(p,50);say(p.n+' +'+p.heal+' HP')}},
  {n:'High Potion',d:'Pulihkan 40% HP (min 150)',c:cnt('hipot'),hide:1,use:p=>{S.hipot--;healX(p,Math.max(150,Math.round(p.max*.4)));say(p.n+' +'+p.heal+' HP')}},
  {n:'Mega Potion',d:'Pulihkan HP penuh',c:cnt('megapot'),hide:1,use:p=>{S.megapot--;healX(p,p.max);say(p.n+' HP penuh! +'+p.heal)}},
  {n:'SP Drink',d:'Pulihkan 20 SP',c:cnt('spitems'),hide:1,use:p=>{S.spitems--;say(p.n+' +'+spX(p,20)+' SP')}},
  {n:'Elixir',d:'HP & SP penuh',c:cnt('elixir'),hide:1,use:p=>{S.elixir--;healX(p,p.max);spX(p,spMax(p));say(p.n+' pulih sepenuhnya!')}},
  {n:'Group Herb',d:'Pulihkan 30% HP seluruh tim',c:cnt('grpot'),hide:1,use:p=>{S.grpot--;alive(P).forEach(x=>healX(x,Math.round(x.max*.3)));say('Seluruh tim pulih 30% HP!')}},
  {n:'Revive',d:'Hidupkan anggota tumbang (HP 50%)',c:cnt('revive'),hide:1,dead:1,use:u=>{S.revive--;rez(u,.5,.25);say(`${u.n} dihidupkan kembali! (HP 50%)`)}},
  {n:'Max Revive',d:'Hidupkan anggota tumbang (HP penuh)',c:cnt('mrevive'),hide:1,dead:1,use:u=>{S.mrevive--;rez(u,1,.5);say(`${u.n} bangkit dengan HP penuh!`)}},
  {n:'Power Candy',d:'ATK tim naik 3 ronde',c:cnt('atkc'),hide:1,use:p=>{S.atkc--;alive(P).forEach(x=>addFx(x,'atk',1.3,3));say('ATK tim naik!')}},
  {n:'Guard Candy',d:'DEF tim naik 3 ronde',c:cnt('defc'),hide:1,use:p=>{S.defc--;alive(P).forEach(x=>addFx(x,'def',1.3,3));say('DEF tim naik!')}},
  {n:'Mega SP Drink',d:'Pulihkan SP penuh',c:cnt('spmega'),hide:1,use:p=>{S.spmega--;say(p.n+' +'+spX(p,spMax(p))+' SP (penuh)')}},
  {n:'Ether',d:'Pulihkan 50% SP',c:cnt('ether'),hide:1,use:p=>{S.ether--;say(p.n+' +'+spX(p,Math.round(spMax(p)*.5))+' SP')}},
  {n:'Panacea',d:'Hapus semua debuff, racun, bakar & seal',c:cnt('panacea'),hide:1,use:p=>{S.panacea--;clean(p);say(p.n+' bersih dari semua debuff!')}},
  {n:'Mega Elixir',d:'HP & SP penuh + hapus semua debuff',c:cnt('megaelx'),hide:1,use:p=>{S.megaelx--;healX(p,p.max);spX(p,spMax(p));clean(p);say(p.n+' pulih total! HP & SP penuh, debuff hilang')}},
  {n:'Group SP Drink',d:'Pulihkan 20 SP seluruh tim',c:cnt('grsp'),hide:1,use:p=>{S.grsp--;alive(P).forEach(x=>spX(x,20));say('Seluruh tim +20 SP!')}},
  {n:'Group Mega Herb',d:'Pulihkan HP penuh seluruh tim',c:cnt('grmega'),hide:1,use:p=>{S.grmega--;alive(P).forEach(x=>healX(x,x.max));say('Seluruh tim HP penuh!')}},
  {n:'Group Elixir',d:'HP & SP penuh seluruh tim + hapus debuff',c:cnt('grelx'),hide:1,use:p=>{S.grelx--;alive(P).forEach(x=>{healX(x,x.max);spX(x,spMax(x));clean(x)});say('Seluruh tim pulih total! HP & SP penuh')}},
  {n:'Revive All',d:'Hidupkan semua anggota tumbang (HP 50%)',c:cnt('reviveall'),hide:1,ok:()=>P.some(u=>u.hp<=0),use:p=>{S.reviveall--;P.filter(u=>u.hp<=0).forEach(u=>rez(u,.5,.25));say('Semua anggota tumbang dihidupkan kembali!')}},
  {n:'Rainbow Candy',d:'ATK & DEF tim naik 3 ronde',c:cnt('rainc'),hide:1,use:p=>{S.rainc--;alive(P).forEach(x=>{addFx(x,'atk',1.3,3);addFx(x,'def',1.3,3)});say('ATK & DEF tim naik!')}},
  {n:'Time Sand',d:'Reset cooldown semua skill seluruh tim',c:cnt('timesand'),hide:1,use:p=>{S.timesand--;P.concat(R).forEach(u=>{u.cds={}});say('Semua cooldown direset!')}},
  {n:'Spark Battery',d:'Isi gauge ALL-OUT +50%',c:cnt('spark'),hide:1,use:p=>{S.spark--;gain(50);say('Gauge ALL-OUT +50%!')}}
 ];
 /* ---------- skill kombinasi (Bond) ---------- */
 const comboMoves=p=>{const out=[];(G.COMBOS||[]).forEach(c=>{if(c.a!=p.id&&c.b!=p.id)return;const oid=c.a==p.id?c.b:c.a,o=P.find(x=>x.id==oid&&x.hp>0);if(!o)return;
  const bl=G.team?Math.min(G.team.bondLv(p.id),G.team.bondLv(oid)):9;
  out.push(Object.assign({},c,{id:'cb_'+c.id,combo:1,pn:o.n,locked:bl<c.need,el:c.el||null,cd:Math.max(G.MINCD,c.cd!==undefined?+c.cd:3)}))});return out};
 const ICON={dmg:'💥',aoe:'🌀',drain:'🩸',heal:'💚',healall:'✨',taunt:'🛡️',debuff:'⬇️',scan:'🔍',poison:'☠️',burn:'🔥',weaken:'🔻'};

 /* ---------- COOLDOWN AWAL: move kuat belum bisa dipakai di giliran pertama ---------- */
 {const O=G.OPENCD||{min:3,mult:.5};
  const setOpen=(u,m)=>{const n=m.oc!==undefined?Math.max(0,+m.oc||0):(((+m.cd||0)>=O.min&&Math.random()<(O.chance!==undefined?O.chance:1))?Math.ceil(m.cd*O.mult):0);if(n>0){u.cds=u.cds||{};u.cds[m.id]=n}};
  P.concat(R).forEach(u=>{G.moves(u.id,'skill').concat(G.moves(u.id,'persona')).forEach(m=>setOpen(u,m))});
  P.forEach(u=>comboMoves(u).forEach(m=>setOpen(u,m)))}

 /* ---------- HUD atas, banner cast, style ---------- */
 const pad=(n,l)=>String(Math.max(0,Math.round(n)||0)).padStart(l,'0');
 const topHud=(p,list)=>`<div class="btop"><div class="btp-bar">
   <div class="btp-pt">${G.spr('characters',p.id,'pt')}</div>
   <div class="btp-name">${p.n}</div><div class="btp-lv">Lv ${p.l}</div>
   <div class="btp-hp">HP <b>${pad(p.hp,5)}</b> <s>/${pad(p.max,5)}</s></div>
   <div class="btp-sp">SP <b>${p.sp}</b> / ${G.stat(p.id,p.l,'sp')}</div>
   <div class="btp-ic">${list.map(m=>`<i class="k-${m.k}${cdLeft(p,m)?' cdon':''}">${m.e||ICON[m.k]||'✦'}</i>`).join('')}</div></div>
   <div class="btp-info" id="btpi"></div></div>`;
 const banner=(p,m)=>{document.querySelectorAll('.bcast').forEach(x=>x.remove());const d=document.createElement('div');d.className='bcast'+(m.t||m.combo?' per':'');
  d.innerHTML=`<div class="bc-in"><div class="bc-ic k-${m.k}">${m.e||ICON[m.k]||'✦'}</div><div class="bc-tx"><small>${m.combo?'⚡ COMBO bersama '+m.pn:p.n+(m.t?' memanggil Persona':' memakai Skill')}</small><b>${m.n.toUpperCase()}</b></div><span class="bc-k">${EL(m.el)} ${G.KIND[m.k]||''}</span></div>`;
  document.body.appendChild(d);setTimeout(()=>d.remove(),1900)};
 const OLD=document.getElementById('bcl-style');if(OLD)OLD.remove();
 {const st=document.createElement('style');st.id='bcl-style';st.textContent=`
 #cmd.bcl{position:absolute!important;left:14px!important;bottom:56px!important;top:auto!important;right:auto!important;width:340px!important;height:392px!important;z-index:6}
 #cmd .bcol.main{position:absolute;left:0;top:0;width:340px;height:392px}
 #cmd .bcol.main button{position:absolute!important;min-width:190px;text-align:left}
 #cmd .bcol.sub{position:absolute;left:340px;bottom:0;display:flex;flex-direction:column;gap:7px;max-height:340px;overflow-y:auto;overflow-x:hidden;padding:7px 18px 11px 12px;animation:bclIn .18s ease-out;scrollbar-width:thin;scrollbar-color:#e60012 #000}
 #cmd .bcol.sub .sk{box-sizing:border-box;display:block;flex:none;position:relative;width:216px;cursor:pointer;padding:5px 12px 6px 32px;background:#e60012;color:#fff;border:2px solid #fff;box-shadow:4px 4px 0 #000;font-family:Impact,'Arial Narrow Bold',sans-serif;font-style:italic;transform:skewX(-10deg) rotate(var(--r,0deg));transition:transform .12s,background .12s,color .12s;user-select:none;margin:0;height:auto;line-height:1}
 #cmd .bcol.sub .sk::before,#cmd .bcol.sub .sk::after{content:none!important;display:none!important}
 #cmd .bcol.sub .sk em{position:absolute;left:-3px;top:-3px;bottom:-3px;width:24px;background:#000;color:#fff;display:flex;align-items:center;justify-content:center;font:400 14px Impact,sans-serif;font-style:normal;border:3px solid #fff;border-right:0}
 #cmd .bcol.sub .sk b{display:block;font-weight:400;font-size:17px;letter-spacing:.5px;text-shadow:1px 1px 0 #000;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 #cmd .bcol.sub .sk i{display:block;margin-top:2px;font:700 10px/1.25 'Trebuchet MS',Arial,sans-serif;font-style:normal;color:#fff;opacity:1}
 #cmd .bcol.sub .sk:hover:not(.off){background:#fff;color:#e60012;transform:skewX(-10deg) rotate(var(--r,0deg)) translate(6px,-2px)}
 #cmd .bcol.sub .sk:hover:not(.off) b{color:#e60012;text-shadow:2px 2px 0 #000}
 #cmd .bcol.sub .sk:hover:not(.off) i{color:#111}
 #cmd .bcol.sub .sk.off{background:#3a3a3a;border-color:#777;box-shadow:none;cursor:not-allowed}
 #cmd .bcol.sub .sk.off b,#cmd .bcol.sub .sk.off i{color:#999;text-shadow:none}
 #cmd .bcol.sub .sk.cd{background:#2a2f3a;border-color:#6f86b5}
 #cmd .bcol.sub .sk.cd i{color:#ffd24a}
 #cmd .bcol.sub .sk .cdb{position:absolute;right:-8px;top:-9px;min-width:22px;height:22px;padding:0 4px;box-sizing:border-box;display:flex;align-items:center;justify-content:center;background:#ffcc00;color:#000;border:2px solid #000;border-radius:50%;font:400 12px Impact,sans-serif;font-style:normal;transform:skewX(10deg);box-shadow:1px 1px 0 #000}
 #cmd .bcol.sub .sk.cmb{background:#6a00c8}
 #cmd .bcol.sub .sk.cmb.off{background:#3a3a3a}
 #cmd .bcol.sub .sk.cmb.cd{background:#2a2f3a}
 #cmd .bcol.sub .sk.back{background:#111}
 #cmd button.act{filter:brightness(1.25);outline:3px solid #fff}
 #cmd button.ao{background:linear-gradient(90deg,#ffb300 var(--g,0%),#3a0008 var(--g,0%))!important;border:2px solid #fff!important;color:#fff!important;opacity:1!important}
 #cmd button.ao:disabled{opacity:.92!important;filter:none!important;cursor:not-allowed}
 #cmd button.ao b,#cmd button.ao i{text-shadow:2px 2px 0 #000}
 #cmd button.ao.rdy{animation:aoBlink .5s infinite}
 @keyframes aoBlink{50%{filter:brightness(1.7)}}
 .aog{position:absolute;top:10px;right:14px;width:230px;z-index:8;pointer-events:none;color:#fff;font:italic 400 16px Impact,sans-serif;text-shadow:2px 2px 0 #000;transform:skewX(-8deg)}
 .aog b{display:block;font-weight:400;letter-spacing:2px;color:#ffcc00}
 .aog .aob{height:14px;background:#111;border:3px solid #fff;box-shadow:3px 3px 0 #000}
 .aog .aob i{display:block;height:100%;background:linear-gradient(90deg,#e60012,#ffcc00);transition:width .3s}
 .aog.rdy .aob i{animation:aoBlink .5s infinite}
 .aog span{font-size:13px}
 .aog .chp{display:inline-block;margin-top:4px;padding:0 10px;background:#e60012;border:2px solid #fff;font-size:13px;letter-spacing:1px}
 .bbn.bs{top:118px!important;bottom:auto!important;zoom:.75;z-index:3!important}
 .bbar{z-index:9!important}
 .bf.t{filter:drop-shadow(0 0 10px #fff)}
 .einf{text-align:center;font:700 11px/1.4 'Trebuchet MS',Arial,sans-serif;color:#fff;margin-top:4px;white-space:nowrap;pointer-events:none}
 .einf .cat{display:inline-block;padding:0 8px;border:1px solid #fff;background:#222;font-style:italic;margin-right:4px}
 .einf .cat.elite{background:#b8860b}.einf .cat.support{background:#1a7f37}.einf .cat.special{background:#6a00c8}.einf .cat.boss{background:#e60012}
 .einf u,.bb-w u{text-decoration:none;display:inline-block;min-width:20px;padding:0 4px;margin:0 2px;border-radius:3px;font-style:normal;font-size:12px}
 .einf u.w,.bb-w u.w{background:#e60012}.einf u.r,.bb-w u.r{background:#1b5fd6}.einf u.i,.bb-w u.i{background:#666}.einf u.a{background:#7a3a00}
 .einf u.b,.bhud u.b{background:#2c5;color:#000}.einf u.d,.bhud u.d{background:#a22}
 .bhud u{text-decoration:none;font:700 10px Arial;padding:0 3px;margin-right:2px;border-radius:3px;color:#fff}
 .bhud u.w{background:#e60012}
 .bhud .rl{font-size:11px;margin-right:4px;opacity:.9}
 .bbar{position:absolute;top:8px;left:50%;transform:translateX(-50%);width:min(640px,54%);z-index:4;pointer-events:none;color:#fff}
 .bb-t{display:flex;align-items:center;gap:10px;margin-bottom:4px;text-shadow:2px 2px 0 #000}
 .bb-t b{font:italic 400 28px Impact,sans-serif;letter-spacing:2px;text-shadow:3px 3px 0 #e60012}
 .bb-t span{font:italic 400 16px Impact,sans-serif}
 .bb-ph{margin-left:auto;display:flex;gap:4px}
 .bb-ph i{font:italic 400 14px Impact,sans-serif;padding:0 10px;background:#222;border:2px solid #777;transform:skewX(-10deg);color:#888}
 .bb-ph i.on{background:#e60012;border-color:#fff;color:#fff}.bb-ph i.done{background:#111;color:#e60012;border-color:#e60012}
 .bb-hp{position:relative;height:18px;background:#111;border:3px solid #fff;box-shadow:4px 4px 0 #000;transform:skewX(-10deg)}
 .bb-hp i{display:block;height:100%;background:linear-gradient(90deg,#e60012,#ff6a3d);transition:width .4s}
 .bb-hp s{position:absolute;top:-3px;bottom:-3px;width:3px;background:#fff}
 .bb-w{margin-top:4px;font-size:12px}
 .bb-u{margin-top:4px;background:#ffcc00;color:#000;font:italic 800 14px 'Trebuchet MS',Arial,sans-serif;padding:2px 12px;display:inline-block;transform:skewX(-8deg);animation:bbBlink .6s infinite}
 @keyframes bbBlink{50%{background:#e60012;color:#fff}}
 .btop{zoom:.72;position:absolute;top:0;left:0;right:0;z-index:7;pointer-events:none;animation:btIn .25s ease-out}
 .btop::before{content:"";position:absolute;top:0;left:0;right:0;height:132px;background:#e60012;clip-path:polygon(0 0,100% 0,97% 66%,40% 100%,0 86%)}
 .btp-bar{position:relative;height:122px;background:#000;clip-path:polygon(0 0,100% 0,96.6% 64%,40% 95%,0 80%);box-shadow:inset 0 -5px 0 #fff}
 .btp-bar::after{content:"";position:absolute;inset:0;background:repeating-linear-gradient(115deg,transparent 0 26px,rgba(255,255,255,.05) 26px 28px)}
 .btp-pt{position:absolute;left:14px;top:8px;width:78px;height:78px;border:3px solid #fff;background:#111;transform:skewX(-6deg);overflow:hidden;z-index:1}
 .btp-pt *{max-width:100%;max-height:100%}
 .btp-name{position:absolute;left:112px;top:28px;font:italic 400 38px Impact,'Arial Narrow Bold',sans-serif;color:#fff;letter-spacing:2px;text-shadow:3px 3px 0 #e60012;transform:skewX(-8deg);z-index:1}
 .btp-lv{position:absolute;left:330px;top:44px;font:italic 400 22px Impact,sans-serif;color:#fff;z-index:1}
 .btp-hp,.btp-sp{position:absolute;font:italic 400 24px Impact,sans-serif;z-index:1;transform:skewX(-8deg)}
 .btp-hp{left:430px;top:16px;color:#7ff}.btp-hp b{font-size:32px;color:#4fffe0}.btp-hp s{text-decoration:none;font-size:18px;color:#4fd}
 .btp-sp{left:700px;top:20px;color:#f4a}.btp-sp b{font-size:30px}
 .btp-ic{position:absolute;left:430px;top:62px;display:flex;gap:8px;z-index:1}
 .btp-ic i{width:34px;height:34px;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:20px;background:#222;border:2px solid #888;transform:skewX(-10deg) rotate(-4deg);filter:grayscale(.8) brightness(.7);transition:.15s}
 .btp-ic i.on{filter:none;border-color:#fff;transform:skewX(-10deg) rotate(-4deg) scale(1.25);box-shadow:0 0 12px #fff}
 .btp-ic i.cdon{opacity:.45}
 .btp-ic i.k-dmg.on{background:#ff7a00}.btp-ic i.k-aoe.on{background:#a0f}.btp-ic i.k-drain.on{background:#e60012}.btp-ic i.k-heal.on{background:#2c5}.btp-ic i.k-healall.on{background:#fc0}.btp-ic i.k-taunt.on{background:#37f}.btp-ic i.k-debuff.on{background:#a22}.btp-ic i.k-scan.on{background:#2af}.btp-ic i.k-poison.on{background:#7a2fc4}.btp-ic i.k-burn.on{background:#e8590c}.btp-ic i.k-weaken.on{background:#a22}
 .btp-info{position:absolute;left:14px;top:126px;width:400px;background:#000;border:3px solid #fff;box-shadow:6px 6px 0 #e60012;padding:14px 22px 14px 26px;transform:skewX(-6deg);color:#fff}
 .btp-info h4{margin:0 0 6px;font:italic 400 26px Impact,sans-serif;letter-spacing:1px;text-shadow:2px 2px 0 #e60012}
 .btp-info p{margin:0 0 10px;font:700 14px/1.35 'Trebuchet MS',Arial,sans-serif}
 .btp-info .tags span{display:inline-block;margin:0 6px 4px 0;padding:1px 12px;background:#fff;color:#000;border-radius:10px;font:700 12px 'Trebuchet MS',Arial,sans-serif}
 .btp-info .tags span.cdt{background:#ffcc00}
 .btp-info .tags span.cdw{background:#e60012;color:#fff}
 .bcast{position:fixed;left:0;right:0;top:12px;z-index:10000;pointer-events:none;animation:bcIn .3s cubic-bezier(.2,1.4,.4,1) both,bcOut .3s 1.5s ease-in forwards}
 .bcast::before{content:"";position:absolute;left:0;right:0;top:-6px;height:116px;background:#e60012;clip-path:polygon(0 0,100% 0,100% 70%,30% 100%,0 80%)}
 .bcast.per::before{background:#fff}
 .bc-in{position:relative;height:104px;background:#000;clip-path:polygon(0 0,100% 0,100% 64%,30% 92%,0 74%);display:flex;align-items:center;gap:22px;padding:0 6% 14px}
 .bc-ic{width:70px;height:70px;display:flex;align-items:center;justify-content:center;font-size:40px;background:#e60012;border:3px solid #fff;transform:skewX(-10deg) rotate(-6deg);box-shadow:4px 4px 0 #fff}
 .bc-ic.k-dmg{background:#ff7a00}.bc-ic.k-aoe{background:#a0f}.bc-ic.k-heal{background:#2c5}.bc-ic.k-healall{background:#fc0}.bc-ic.k-poison{background:#7a2fc4}.bc-ic.k-burn{background:#e8590c}
 .bc-tx small{display:block;font:italic 700 15px 'Trebuchet MS',Arial,sans-serif;color:#ccc;letter-spacing:2px;text-transform:uppercase}
 .bc-tx b{display:block;font:italic 400 54px/1 Impact,'Arial Narrow Bold',sans-serif;color:#fff;letter-spacing:3px;text-shadow:4px 4px 0 #e60012;transform:skewX(-8deg)}
 .bc-k{margin-left:auto;padding:2px 18px;background:#fff;color:#000;border-radius:14px;font:700 14px 'Trebuchet MS',Arial,sans-serif;transform:skewX(-8deg)}
 .pmh{position:absolute;right:8px;bottom:50px;width:320px;display:flex;flex-direction:column-reverse;gap:5px;z-index:5;pointer-events:none}
 .pmh.cmp{width:150px}
 .pmh.cmp .pm{height:36px}
 .pmh.cmp .pm-n{width:32px}
 .pmh.cmp .pm-n b{width:22px;height:22px;font-size:13px}
 .pmh.cmp .pm-p,.pmh.cmp .pm-nm{display:none}
 .pmh.cmp .pm-b{padding:3px 6px 3px 5px}
 .pmh.cmp .pm-r i{height:12px;margin-top:2px}
 .pmh.cmp .pm-r i b{font-size:10px}
 .pw{position:relative;transition:transform .2s}
 .pw.on{transform:translateX(-14px)}
 .pw.dead{filter:grayscale(1) brightness(.6)}
 .pm{display:flex;align-items:stretch;height:46px;background:linear-gradient(90deg,#050507,#14161c 70%,#050507);box-shadow:inset 0 2px 0 #fff,inset 0 -2px 0 #fff;clip-path:polygon(14px 0,100% 0,100% 100%,0 100%);overflow:hidden}
 .pw.on .pm{box-shadow:inset 0 2px 0 #ffd0e0,inset 0 -2px 0 #ffd0e0}
 .pm-n{flex:none;width:40px;display:flex;align-items:center;justify-content:center;background:#0b0b0b}
 .pw.on .pm-n{background:linear-gradient(90deg,#ff3a7a,#c4124f)}
 .pm-n b{width:26px;height:26px;display:flex;align-items:center;justify-content:center;border:2px solid #fff;border-radius:50%;font:italic 700 16px Georgia,serif;color:#fff;text-shadow:1px 1px 0 #000}
 .pm-b{flex:1;min-width:0;padding:3px 8px 3px 6px}
 .pm-nm{display:flex;align-items:center;gap:4px;white-space:nowrap;overflow:hidden;font:700 12px Georgia,'Times New Roman',serif;font-variant:small-caps;letter-spacing:.5px;color:#fff;text-shadow:1px 1px 0 #000}
 .pm-nm .rl{font-size:10px;opacity:.9}
 .pm-nm u{text-decoration:none;font:700 9px Arial,sans-serif;padding:0 2px;border-radius:3px;color:#fff}
 .pm-nm u.w{background:#e60012}.pm-nm u.b{background:#2c5;color:#000}.pm-nm u.d{background:#a22}
 .pm-r i{display:block;position:relative;box-sizing:border-box;width:100%;min-width:0;height:13px;margin:2px 0 0;padding:0;background:#0a1c20;border:1px solid #234;transform:skewX(-20deg);overflow:hidden}
 .pm-r i s{position:absolute;left:0;top:0;bottom:0;transition:width .35s}
 .pm-r i.ph s{background:linear-gradient(180deg,#27d8b4,#0e8f78)}
 .pm-r i.ps s{background:linear-gradient(180deg,#38a6f0,#165f9e)}
 .pm-r i b{position:absolute;right:6px;top:0;bottom:0;display:flex;align-items:center;font:700 11px Georgia,serif;line-height:1;color:#fff;text-shadow:1px 1px 1px #000;transform:skewX(20deg)}
 .pm-p{flex:none;width:96px;overflow:hidden;background:#111;clip-path:polygon(16px 0,100% 0,100% 100%,0 100%);filter:brightness(.75)}
 .pw.on .pm-p{filter:none}
 .pm-p>*{display:block;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;object-fit:cover;object-position:center 25%}
 .pw.hit .pm{animation:pmHit .25s}
 @keyframes pmHit{25%{filter:brightness(2)}50%{transform:translateX(-5px)}}
 @keyframes btIn{from{opacity:0;transform:translateY(-40px)}to{opacity:1;transform:none}}
 @keyframes bcIn{from{opacity:0;transform:translateX(120%)}to{opacity:1;transform:none}}
 @keyframes bcOut{to{opacity:0;transform:translateX(-30%)}}
 @keyframes bclIn{from{opacity:0;transform:translateX(-18px)}to{opacity:1;transform:none}}
 /* ===== PERAPIAN BOSS BESAR (banyak phase), tim besar, banner panjang ===== */
 .bc-in{overflow:hidden}
 .bc-tx{min-width:0;flex:1}
 .bc-tx small{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .bc-tx b{font-size:clamp(26px,3.6vw,54px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:78vw}
 .bbar.big{width:min(580px,calc(100% - 560px));min-width:340px}
 .bb-t b{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
 .bb-t b.lg{font-size:22px;letter-spacing:1px}
 .bb-t span{white-space:nowrap}
 .bb-ph i.on{white-space:nowrap}
 .bb-seg{display:flex;gap:2px;margin-top:4px;transform:skewX(-10deg)}
 .bb-seg i{flex:1;height:6px;background:#2a2a2a;border:1px solid #555}
 .bb-seg i.on{background:#e60012;border-color:#fff;box-shadow:0 0 6px #e60012}
 .bb-seg i.done{background:#7a0010;border-color:#7a0010}
 .bb-pn{margin-top:3px;font:italic 400 14px Impact,sans-serif;letter-spacing:1px;color:#ffd400;text-shadow:2px 2px 0 #000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
 .bb-w{line-height:1.5}
 .bb-l{margin-top:4px;display:flex;flex-wrap:wrap;gap:3px;align-items:center;font:700 11px 'Trebuchet MS',Arial,sans-serif;color:#fff;text-shadow:1px 1px 0 #000}
 .bb-l u{text-decoration:none;padding:0 6px;background:#6a00c8;border:1px solid #fff;border-radius:3px;font-style:normal;animation:lawBl 1.2s infinite}
 .bb-l u.lk{background:#444;animation:none}
 @keyframes lawBl{50%{background:#e60012}}
 .bb-u{display:block;width:max-content;max-width:100%;box-sizing:border-box}
 .bbn.bs.bsx{top:176px!important}
 .pmh.many{width:250px;gap:3px}
 .pmh.many .pm{height:34px}
 .pmh.many .pm-p{display:none}
 .pmh.many .pm-n{width:30px}
 .pmh.many .pm-n b{width:20px;height:20px;font-size:12px}
 .pmh.many .pm-nm{font-size:11px}
 .pmh.many .pm-r i{height:11px;margin-top:1px}
 .pmh.many .pm-r i b{font-size:9px}
 .pmh.many.cmp{width:150px}
 .pmh.many.cmp .pm{height:30px}
 /* ===== EFEK SISTEM-BREAKER: ucapan ke pengguna, error palsu, VICTORY palsu, layar glitch ===== */
 .fwbox{position:fixed;left:50%;top:44%;transform:translate(-50%,-50%) skewX(-4deg);z-index:10001;pointer-events:none;width:min(620px,70vw);box-sizing:border-box;padding:14px 22px 16px;background:rgba(0,0,0,.9);border:3px solid #fff;box-shadow:7px 7px 0 #6a00c8,-4px -4px 0 #e60012;color:#fff;animation:fwIn .25s ease-out}
 .fwbox small{display:block;font:italic 400 14px Impact,sans-serif;letter-spacing:3px;color:#ffd400}
 .fwbox b{display:block;margin-top:6px;font:700 17px/1.45 'Trebuchet MS',Arial,sans-serif;font-style:normal}
 @keyframes fwIn{from{opacity:0;transform:translate(-50%,-44%) skewX(-4deg)}}
 .syspop{position:fixed;left:50%;top:27%;transform:translateX(-50%);z-index:10002;pointer-events:none;max-width:86vw;padding:8px 22px;background:#000;border:3px solid #ffd400;color:#ffd400;font:italic 400 24px Impact,sans-serif;letter-spacing:2px;box-shadow:5px 5px 0 #e60012;animation:sysIn .2s ease-out,sysOut .3s 1.6s forwards}
 @keyframes sysIn{from{opacity:0;transform:translateX(-50%) scale(1.3)}}
 @keyframes sysOut{to{opacity:0}}
 .fakeov{position:fixed;inset:0;z-index:10003;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.84);color:#fff;font-family:Impact,'Arial Narrow Bold',sans-serif;font-style:italic;text-align:center}
 .fakeov small{display:block;font-size:20px;letter-spacing:6px;color:#ffd400}
 .fakeov b{display:block;font-weight:400;font-size:clamp(44px,9vw,120px);letter-spacing:5px;text-shadow:6px 6px 0 #e60012}
 .fakeov i{display:block;font-size:22px;font-style:normal;margin-top:6px}
 .fakeov.err b{color:#ff3b3b;animation:glt .15s steps(2) infinite}
 .bt.gl{animation:glt .12s steps(2) 5}
 @keyframes glt{0%{transform:translate(2px,-1px);filter:hue-rotate(90deg)}50%{transform:translate(-3px,1px) skewX(2deg);filter:invert(.15)}100%{transform:none;filter:none}}
 .bt.sysg .bfloor{filter:hue-rotate(-40deg) saturate(1.5)}`;document.head.appendChild(st)}

 const tip=p=>{if(menu=='scan')return 'ANALISIS tidak memakai giliran. Klik musuh di daftar untuk menjadikannya target. Serang kelemahan = 1 MORE!';if(menu=='skill')return 'Pilih skill. Ungu = COMBO (butuh Bond)! Semua skill punya cooldown.';if(menu=='persona')return 'Panggil iblis atau malaikat. Setelah dipakai ada cooldown!';if(menu=='item')return 'Pilih item yang mau dipakai!';if(menu=='rev')return 'Pilih anggota yang mau dihidupkan kembali!';if(menu=='swap')return 'Pilih anggota cadangan yang masuk. (Memakai giliran)';
  const ch=alive(enemies).find(x=>x.charging);if(ch)return `⚠ ${ch.n} mengumpulkan ULTIMATE! Serang kelemahannya atau GUARD!`;
  if(has(p,'seal'))return `🔇 ${p.n} tersegel! Skill & Persona tidak bisa dipakai. Pilih GUARD / ITEM / SWAP.`;
  const mv=G.moves(p.id,'skill').concat(G.moves(p.id,'persona'));if(mv.length&&mv.every(m=>cdLeft(p,m)>0||p.sp<m.sp))return 'Semua skill cooldown / SP kurang. GUARD untuk +4 SP dan lanjut ronde!';
  if(has(p,'poison')||has(p,'burn'))return `${p.n} terkena efek racun / bakar! Pulihkan HP dengan Item.`;
  if(AO>=G.AOMAX&&alive(P).length>1)return '⚡ ALL-OUT siap! Tekan O untuk serangan serentak semua anggota!';
  if(log[0]=='CRITICAL!')return 'CRITICAL! Bagus sekali!';const w=alive(enemies).find(x=>x.hp/x.max<.3);if(w)return w.n+' hampir tumbang! Habisi sekarang!';if(p.sp<G.CHARS[p.id].sk[2])return 'SP-mu menipis. Guard memulihkan SP!';if(p.hp<p.max*.35)return 'HP-mu kritis! Pakai Item!';
  const e=enemies[t];if(e&&e.hint)return e.hint;return 'Klik musuh / Tab untuk ganti target. Serang kelemahan = 1 MORE!'};

 /* bar boss. Boss dengan banyak phase (>5, mis. Alternate Kael 17 fase) memakai tampilan ringkas:
    label "FASE n/N" + strip segmen + nama fase, supaya tidak meluber ke samping */
 const bossBar=b=>{const pct=Math.max(0,b.hp/b.max*100),np=b.phases.length,big=np>5,cur=b.phases[b.phase||0]||{},lk=Object.keys(lock),lw=b.laws||[];
  const pips=big?`<div class="bb-ph"><i class="on">FASE ${(b.phase||0)+1} / ${np}</i></div>`:`<div class="bb-ph">${b.phases.map((_,k)=>`<i class="${k==b.phase?'on':k<b.phase?'done':''}">${['I','II','III','IV','V'][k]||k+1}</i>`).join('')}</div>`;
  return `<div class="bbar${big?' big':''}"><div class="bb-t"><b class="${String(b.n).length>16?'lg':''}">${b.n}</b><span>Lv ${b.lv}</span>${pips}</div>`+
  `<div class="bb-hp"><i style="width:${pct}%"></i>${big?'':b.phases.slice(1).map(p=>`<s style="left:${p.at*100}%"></s>`).join('')}</div>`+
  (big?`<div class="bb-seg">${b.phases.map((_,k)=>`<i class="${k==b.phase?'on':k<b.phase?'done':''}"></i>`).join('')}</div><div class="bb-pn">${cur.n||''}</div>`:'')+
  `<div class="bb-w">${chips(b)} ${fxTags(b)}</div>`+
  (lw.length||lk.length?`<div class="bb-l">${lw.length?'⚖ HUKUM DILANGGAR:':''}${lw.map(k=>`<u title="${(LW[k]||{}).d||''}">${(LW[k]||{n:k}).n}</u>`).join('')}${lk.map(k=>`<u class="lk">🚫 ${CMDN[k]||k}</u>`).join('')}</div>`:'')+
  `${b.charging?`<div class="bb-u">⚠ ULTIMATE: ${(b.ult&&b.ult.n)||'???'} — serang kelemahannya atau GUARD!</div>`:''}${b.stun?`<div class="bb-u">LUMPUH!</div>`:''}</div>`};

 function draw(){pick();const p=P[i],C=G.CHARS[p.id],e=enemies[t];
 const bossE=alive(enemies).find(x=>x.boss);
 const sealed=has(p,'seal');
 const skAll=G.moves(p.id,'skill').concat(comboMoves(p)),peAll=G.moves(p.id,'persona');
 const aoReady=AO>=G.AOMAX&&alive(P).length>1&&!blocked('ao');
 a.innerHTML=(first?`<div class="wipe"></div><div class="intro">BATTLE <b>START!</b></div>`:'')+`<div class="bt${anyLaw()?' sysg':''}"><div class="bfloor"></div>
 ${menu=='skill'||menu=='persona'?topHud(p,menu=='skill'?skAll:peAll):''}
 ${bossE?bossBar(bossE):''}
 <div class="aog ${aoReady?'rdy':''}"><b>ALL-OUT</b><div class="aob"><i style="width:${AO/G.AOMAX*100}%"></i></div><span>${aoReady?'SIAP! Tekan O':blocked('ao')?'⚖ TERKUNCI':Math.round(AO/G.AOMAX*100)+'%'}</span>${CHN>1?`<br><span class="chp">CHAPTER ${CHN}</span>`:''}</div>
 <div class="bbn${bossE?(bossE.phases.length>5?' bs bsx':' bs'):''}"><span>&#127917;</span><b>${e.n}</b></div>
 <div class="bfoes">${enemies.map((x,k)=>`<div class="bf ${x.hp<=0?'dead':''} ${x.hit?'hit':''} ${k==t?'t':''}" data-k="${k}"><div class="lock"></div><div class="em">${G.EMOJI[x.n]||'👹'}</div>${dm(x)}<div class="hp"><i style="width:${Math.max(0,x.hp/x.max*100)}%"></i></div><div class="einf"><span class="cat ${x.cat}">${(G.CATS&&G.CATS[x.cat]?G.CATS[x.cat].n:x.cat.toUpperCase())}</span>Lv${x.lv} <u class="a">⚔${EL(foeEl(x))}</u><br>${chips(x)} ${x.barrier?'<u class="i">BARRIER</u>':''}${x.mech=='reflect'?`<u class="r">REFLECT ${EL(x.refl)}</u>`:''}<br>${fxTags(x)}</div></div>`).join('')}</div>
 <div class="brad bcl" id="cmd"></div>
 <div class="blog">${log.slice(0,3).join('<br>')}</div>
 <div class="pmh ${menu?'cmp':''} ${P.length>4?'many':''}">${P.map((q,k)=>{const mh=Math.max(1,q.max),ms=Math.max(1,G.stat(q.id,q.l,'sp')),hp=Math.max(0,q.hp);
  return`<div class="pw ${k==i?'on':''} ${q.hp<=0?'dead':''} ${q.hit?'hit':''}"><div class="pm"><div class="pm-n"><b>${k+1}</b></div>
  <div class="pm-b"><div class="pm-nm">${q.n}<span class="rl">${RO(q).e||''}${EL(q.el)}</span>${(q.weak||[]).map(w=>`<u class="w">▼${EL(w)}</u>`).join('')}${fxTags(q)}</div>
  <div class="pm-r"><i class="ph"><s style="width:${hp/mh*100}%"></s><b>${hp}</b></i><i class="ps"><s style="width:${Math.min(100,Math.max(0,q.sp)/ms*100)}%"></s><b>${Math.max(0,q.sp)}</b></i></div></div>
  <div class="pm-p">${G.spr('characters',q.id,'pt')}</div></div>${dm(q)}</div>`}).join('')}</div>
 <div class="bkeys"><span>A Analisis</span><span>S Skill</span><span>P Persona</span><span>G Guard</span><span>I Item</span><span>W Swap</span><span>O All-Out</span><span>Esc Kembali</span><span>Tab/Klik = Target</span></div></div>`;
 first=0;enemies.concat(P).forEach(x=>{x.hit=0;x.heal=0});
 a.querySelectorAll('.bf').forEach(f=>f.onclick=()=>{if(enemies[f.dataset.k].hp>0){t=+f.dataset.k;draw()}});
 const c=document.getElementById('cmd');
 /* eksekusi skill / persona / combo */
 const cast=m=>{if(cdLeft(p,m)>0){say(`${m.n} masih cooldown (${cdLeft(p,m)})`);return draw()}
  if(sealed){say(`${p.n} tersegel!`);return draw()}
  menu=null;p.more=0;p.sp-=m.sp;setCd(p,m);banner(p,m);track(m.t?'persona':'skill');
  const ro=RO(p),pw=Math.round(m.pow*(1+.13*(p.l-1))*(ro.atk||1)),hl=Math.round(m.pow*(1+.08*(p.l-1))*(ro.heal||1)),
   head=m.combo?`⚡ COMBO ${m.n}! (${p.n} × ${m.pn})`:m.t?`${m.e||''} ${p.n} memanggil ${m.n}!`:`${p.n} ${m.n}!`;
  if(m.combo)p.combo=1;
  if(m.k=='aoe'){let s=0;alive(enemies).forEach(x=>s+=dealE(x,pw,m.el,p).d);say(`${head} Semua musuh -${s}`)}
  else if(m.k=='drain'){const r=dealE(e,pw,m.el,p),h=healX(p,Math.round(r.d/2));say(`${head} ${e.n} -${r.d} (+${h} HP)`)}
  else if(m.k=='heal'){say(`${head} +${healX(p,hl)} HP`)}
  else if(m.k=='healall'){alive(P).forEach(x=>healX(x,hl));say(`${head} Tim +${hl} HP`)}
  else if(m.k=='taunt'){addFx(p,'taunt',1,2);addFx(p,'def',1.5,2);say(`${head} Musuh membidik ${p.n}! (DEF naik)`)}
  else if(m.k=='debuff'){{const n=dur();alive(enemies).forEach(x=>{addFx(x,'def',.7,n);addFx(x,'atk',.8,n)});say(`${head} ATK & DEF musuh turun! (${n} ronde)`)}}
  else if(m.k=='scan'){alive(enemies).forEach(scanE);say(`${head} Kelemahan musuh terungkap!`)}
  else if(m.k=='poison'){const r=dealE(e,pw,m.el,p);const n=dur(),hit=e.hp>0&&r.af!='imm';if(hit)addDot(e,'poison',.08,n);say(`${head} ${e.n} -${r.d}${hit?` & keracunan! (${n} ronde)`:''}`)}
  else if(m.k=='burn'){const r=dealE(e,pw,m.el,p);const n=dur(),hit=e.hp>0&&r.af!='imm';if(hit)addDot(e,'burn',.07,n);say(`${head} ${e.n} -${r.d}${hit?` & terbakar! (${n} ronde)`:''}`)}
  else if(m.k=='weaken'){const r=dealE(e,pw,m.el,p);const n=dur(),hit=e.hp>0&&r.af!='imm';if(hit){addFx(e,'atk',.7,n);addFx(e,'def',.8,n)}say(`${head} ${e.n} -${r.d}${hit?` & ATK/DEF turun! (${n} ronde)`:''}`)}
  else{const r=dealE(e,pw,m.el,p);say(`${head} ${e.n} -${r.d}`)}
  const x=m.x;if(x=='defup'){alive(P).forEach(u=>addFx(u,'def',1.3,3));say('DEF tim naik!')}
  else if(x=='atkup'){alive(P).forEach(u=>addFx(u,'atk',1.3,3));say('ATK tim naik!')}
  else if(x=='spup'){alive(P).forEach(u=>{u.sp=Math.min(G.stat(u.id,u.l,'sp'),u.sp+10)});say('SP tim +10')}
  else if(x=='scan'){alive(enemies).forEach(scanE);say('Kelemahan musuh terungkap!')}
  else if(x=='weakdown'){{const n=dur();alive(enemies).forEach(u=>addFx(u,'def',.75,n));say(`DEF musuh turun! (${n} ronde)`)}}
  end()};
 /* ganti anggota (memakai giliran) */
 const swap=k=>{menu=null;track('swap');const inn=R[k],out=P[i];say(`${out.n} ⇄ ${inn.n}! Ganti anggota`);out.fx=[];out.g=0;P[i]=inn;R[k]=out;end()};
 /* ALL-OUT ATTACK: semua anggota hidup menyerbu semua musuh, memakai giliran seluruh tim */
 const allOut=()=>{if(AO<G.AOMAX||alive(P).length<2||blocked('ao'))return;menu=null;track('ao');
  const al=alive(P),foes=alive(enemies);let s=0;
  bannerTxt('ALL-OUT ATTACK',al.map(u=>u.n).join(' + '),'⚡ Serangan serentak seluruh tim!');
  foes.forEach(f=>al.forEach(u=>{const base=(+G.stat(u.id,u.l,'atk')||5)*2*(.9+Math.random()*.2)*(RO(u).atk||1)*G.AOGAIN.mult;s+=dealE(f,base,null,u).d}));
  say(`⚡ ALL-OUT ATTACK! ${al.length} anggota menyerbu! Total -${s}`);
  AO=0;al.forEach(u=>{u.combo=1});P.forEach(u=>{u.more=0});
  i=P.length-1;end()};
 const main=document.createElement('div');main.className='bcol main';c.appendChild(main);
 /* 7 tombol utama: ANALISIS menggantikan ATTACK */
 const MP=[[40,0,-6],[110,56,5],[30,112,-4],[100,168,6],[30,224,-4],[100,280,5],[40,336,-6]];
 const btn=(par,txt,sub,f,d,on,cls,badge)=>{const isMain=par==main,n=par.children.length,b=document.createElement(isMain?'button':'div');
  b.innerHTML=isMain?`<b>${txt}</b><i>${sub}</i>`:`<em>${cls&&cls.indexOf('back')>=0?'✕':n+1}</em><b>${txt}</b><i>${sub}</i>${badge?`<span class="cdb">${badge}</span>`:''}`;b.disabled=!!d;
  if(isMain){const q=MP[n];b.style.left=q[0]+'px';b.style.top=q[1]+'px';b.style.setProperty('--r',q[2]+'deg')}
  else{b.className='sk'+(d?' off':'')+(cls?' '+cls:'');b.style.marginLeft=(n%2?16:0)+'px';b.style.setProperty('--r',(n%2?3:-2)+'deg')}
  if(on)b.classList.add('act');
  b.onclick=()=>{if(b.disabled)return;try{f()}catch(err){console.error('[Battle]',err);say('ERROR: '+err.message);draw()}};par.appendChild(b);return b};
 const open=m=>{menu=menu==m?null:m;if(menu=='scan'){alive(enemies).forEach(scanE);say('ANALISIS: kelemahan musuh terungkap!')}draw()};
 const unk=alive(enemies).reduce((n,x)=>n+x.weak.filter(w=>!dx(x).w.includes(w)).length,0);
 const bN=btn(main,'ANALISIS',unk?`Lihat kelemahan musuh &bull; ${unk} belum diketahui`:'Lihat kelemahan musuh &bull; gratis',()=>{if(menu!='scan')track('scan');open('scan')},(lock.scan||0)>0,menu=='scan');
 const bS=btn(main,'SKILL',sealed?'🔇 TERSEGEL':`${skAll.length} skill &bull; ${G.eqCount(p.id,'skill')}/${G.LIMIT.skill} dibawa`,()=>open('skill'),sealed,menu=='skill');
 const bP=btn(main,'PERSONA',sealed?'🔇 TERSEGEL':peAll.length?`${peAll.length} persona &bull; ${G.eqCount(p.id,'persona')}/${G.LIMIT.persona}`:'Belum punya',()=>open('persona'),sealed||!peAll.length,menu=='persona');
 const bG=btn(main,'GUARD','Bertahan, +4 SP',()=>{menu=null;p.more=0;p.g=1;p.sp=Math.min(G.stat(p.id,p.l,'sp'),p.sp+4);gain(G.AOGAIN.guard);say(p.n+' bertahan (+4 SP)');track('guard');end()},(lock.guard||0)>0);
 const vis=ITEMS.filter(x=>!x.hide||x.c()>0),tot=vis.reduce((s,x)=>s+x.c(),0);
 const bI=btn(main,'ITEM',`Buka tas &bull; x${tot}`,()=>open('item'),tot<1||blocked('item'),menu=='item'||menu=='rev');
 const rdy=R.filter(u=>u.hp>0).length;
 const bW=btn(main,'SWAP',rdy?`Cadangan &bull; ${rdy} siap`:'Tidak ada cadangan',()=>open('swap'),!rdy||blocked('swap'),menu=='swap');
 const bO=btn(main,'ALL-OUT',aoReady?'SIAP! Serang bersama':alive(P).length<2?'Butuh 2+ anggota hidup':`Gauge ${Math.round(AO/G.AOMAX*100)}%`,allOut,!aoReady);
 bO.classList.add('ao');bO.style.setProperty('--g',(AO/G.AOMAX*100)+'%');if(aoReady)bO.classList.add('rdy');
 /* tombol yang dihapus boss / dilarang hukum baru diberi label jelas */
 [[bN,'scan'],[bG,'guard'],[bI,'item'],[bW,'swap'],[bO,'ao']].forEach(([b,k])=>{if(b&&blocked(k)){const s=b.querySelector('i');if(s)s.innerHTML=(lock[k]>0?'🚫 DIHAPUS OLEH BOSS':'⚖ DILARANG HUKUM BARU')}});
 let subs=[];
 if(menu){const sub=document.createElement('div');sub.className='bcol sub';c.appendChild(sub);
  const sp=m=>p.sp<m.sp;
  /* teks CD di subjudul: "CD 3" kalau siap, "COOLDOWN n" kalau sedang cooldown */
  const cdTxt=m=>cdLeft(p,m)?` &bull; ⏳ COOLDOWN ${cdLeft(p,m)}`:(m.cd?` &bull; CD ${m.cd}`:'');
  const cdCls=(m,extra)=>(cdLeft(p,m)?'cd':'')+(extra?' '+extra:'');
  if(menu=='skill')skAll.forEach(m=>subs.push(btn(sub,(m.combo?'⚡ ':'')+m.n.toUpperCase(),
    (m.combo?(m.locked?`Butuh Bond Lv${m.need} dgn ${m.pn}`:`COMBO ${m.pn} &bull; ${EL(m.el)} ${G.KIND[m.k]} &bull; ${m.sp} SP`):`${EL(m.el)} ${G.KIND[m.k]} &bull; ${m.sp} SP`)+(m.locked?'':cdTxt(m)),
    ()=>cast(m),sp(m)||m.locked||cdLeft(p,m)>0,0,cdCls(m,m.combo?'cmb':''),cdLeft(p,m)||0)));
  else if(menu=='persona')peAll.forEach(m=>subs.push(btn(sub,`${m.e} ${m.n.toUpperCase()}`,`${m.t=='iblis'?'Iblis':m.t=='malaikat'?'Malaikat':'Persona'} &bull; ${EL(m.el)} ${G.KIND[m.k]} &bull; ${m.sp} SP${cdTxt(m)}`,()=>cast(m),sp(m)||cdLeft(p,m)>0,0,cdCls(m),cdLeft(p,m)||0)));
  else if(menu=='scan')enemies.forEach((x,k)=>{if(x.hp<=0)return;const f=l=>l.length?l.map(z=>EL(z)+String(z).toUpperCase()).join(' '):'-';
    subs.push(btn(sub,`${x.boss?'👑 ':''}${x.n.toUpperCase()}`,law('scan')?'⚖ DATA DIHAPUS OLEH BOSS &bull; kelemahan tidak terbaca':`LEMAH ${f(x.weak)} &bull; RESIST ${f(x.res)} &bull; KEBAL ${f(x.imm)} &bull; SERANG ${EL(foeEl(x))}${x.mech=='barrier'?' &bull; BARRIER':''}${x.mech=='reflect'?' &bull; REFLECT '+EL(x.refl):''}`,()=>{t=k;draw()},0,k==t))});
  else if(menu=='swap')R.forEach((u,k)=>subs.push(btn(sub,`${RO(u).e||''} ${u.n.toUpperCase()}`,`Lv${u.l} &bull; ${EL(u.el)} ${RO(u).n||''} &bull; HP ${Math.max(0,u.hp)}/${u.max}`,()=>swap(k),u.hp<=0)));
  else if(menu=='rev')P.forEach(u=>{if(u.hp<=0)subs.push(btn(sub,`${RO(u).e||''} ${u.n.toUpperCase()}`,`Lv${u.l} &bull; Tumbang &bull; ${revIt.n}`,()=>{menu=null;p.more=0;track('item');revIt.use(u);end()}))});
  else vis.forEach(it=>subs.push(btn(sub,it.n.toUpperCase(),`${it.d} &bull; x${it.c()}`,()=>{if(it.dead){revIt=it;menu='rev';draw();return}menu=null;p.more=0;track('item');it.use(p);end()},it.c()<1||(it.dead&&!P.some(u=>u.hp<=0))||(it.ok&&!it.ok()))));
  btn(sub,'KEMBALI','Tutup menu',()=>{menu=null;draw()},0,0,'back');
  const cur=menu=='skill'?skAll:menu=='persona'?peAll:null;
  const info=(m,k)=>{const el=document.getElementById('btpi');if(!el||!m)return;const cl=cdLeft(p,m);
   el.innerHTML=`<h4>${m.e||ICON[m.k]||''} ${m.n}</h4><p>${m.d||''}</p><div class="tags"><span>${EL(m.el)} ${m.el?m.el.toUpperCase():'-'}</span><span>${G.KIND[m.k]}</span><span>SP ${m.sp}</span><span>Power ${m.pow}</span><span class="cdt">CD ${m.cd||0}</span>${cl?`<span class="cdw">⏳ Siap dalam ${cl} ronde</span>`:''}</div>`;
   document.querySelectorAll('.btp-ic i').forEach((x,j)=>x.classList.toggle('on',j==k))};
  if(cur){subs.forEach((b,k)=>{b.onmouseenter=()=>info(cur[k],k)});info(cur[0],0)}}
 const clk=b=>{if(b&&!b.disabled)b.click()};
 document.onkeydown=ev=>{const k=ev.key.toLowerCase();
  if(k=='escape'||k=='backspace'){if(menu){menu=null;draw()}return}
  if(menu&&/^[1-9]$/.test(k)){clk(subs[+k-1]);return}
  if(k=='tab'||k=='arrowright'||k=='arrowdown'){ev.preventDefault&&ev.preventDefault();cycle(1);return}
  if(k=='arrowleft'||k=='arrowup'){ev.preventDefault&&ev.preventDefault();cycle(-1);return}
  if(k=='a')clk(bN);else if(k=='s')clk(bS);else if(k=='p')clk(bP);else if(k=='g')clk(bG);else if(k=='i')clk(bI);else if(k=='w')clk(bW);else if(k=='o')clk(bO)}}

 /* ---------- alur giliran ---------- */
 function end(){menu=null;enemies.forEach(checkPhase);if(chk(end))return;
  turnLaw();if(!alive(P).length)return lose();   /* hukum GILIRAN: boss bisa menyela */
  const p=P[i];if(p&&p.more&&!p.usedMore&&p.hp>0){p.more=0;p.usedMore=1;say(`1 MORE! ${p.n} bergerak lagi!`);pick();return draw()}
  if(p)p.more=0;
  pick();do{i++}while(P[i]&&P[i].hp<=0);if(i>=P.length)return foe();draw()}
 /* giliran musuh: kalau serangannya menembus kelemahan anggota tim -> musuh itu bergerak lagi (maks 1x per ronde) */
 function foe(){RND++;undoLaw();alive(enemies).forEach(e=>{if(!alive(P).length)return;
   foeWeakHit=[];foeTurn(e);
   if(foeWeakHit.length&&e.hp>0&&!e.stun&&alive(P).length){say(`⚡ ${e.n} menusuk kelemahan ${foeWeakHit.join(', ')}! GILIRAN EKSTRA`);foeWeakHit=[];foeTurn(e,1)}});
  foeWeakHit=[];
  /* efek racun / bakar bekerja di akhir ronde (ke tim maupun musuh), lalu durasi efek berkurang */
  dotTick();enemies.forEach(checkPhase);if(chk(foeEnd))return;foeEnd()}
 function foeEnd(){
  tickAll();cdTick();lockTick();enemies.forEach(x=>{x.snap=x.hp});P.forEach(p=>{p.g=0;p.usedMore=0;p.more=0});
  if(!alive(P).length)return lose();i=0;while(P[i].hp<=0)i++;draw()}
 /* hapus banner cast / phase / all-out / ucapan boss (timer-nya bisa tertahan oleh alert/confirm lantai dungeon) */
 const clearBanners=()=>{fwTok++;document.querySelectorAll('.bcast,.fwbox,.fakeov,.syspop').forEach(x=>x.remove())};
 const gainXp=(id,x)=>{const d=S.lv[id];if(!d)return;d.x+=x;while(d.x>=G.need(d.l)){d.x-=G.need(d.l);d.l++}};

 /* ---------- HADIAH SISTEM BARU: dipanggil sekali saat menang ----------
    Archive : musuh -> enemy_<id>, boss -> boss_<id>, karakter tim -> character_<id>
    Bond    : anggota hidup dapat XP kedekatan (boss + combo = lebih banyak)
    Memory  : e.fragment jatuh dari musuh, boss otomatis mencoba frag_boss_<id>
    Parallel: opts.winFlags diset ke dunia opts.world (bisa mengubah versi dunia & boss berikutnya) */
 const rewardSystems=boss=>{
  try{
   enemies.forEach(e=>{const sid=e.id||G.slug(e.n);
    G.MAemit(e.boss?'boss_defeated':'enemy_defeated',sid);
    if(e.fragment)G.MAemit('fragment_found',e.fragment);
    if(e.boss){G.MAemit('fragment_found','frag_boss_'+sid);if(opts.world)G.MAemit('world_boss_defeated',{world:opts.world,boss:sid})}});
   P.forEach(u=>G.MAemit('character_met',u.id));
   alive(P).forEach(u=>G.MAemit('bond_gain',{id:u.id,xp:3+(u.combo?3:0)+(boss?6:0)}));
   if(opts.world&&opts.winFlags&&window.ParallelWorld)Object.keys(opts.winFlags).forEach(k=>ParallelWorld.setFlag(opts.world,k,opts.winFlags[k]));
   G.MAemit('battle_win',{world:opts.world||null,boss,chapter:CHN,team:P.map(u=>u.id)});
  }catch(err){console.warn('[Battle] sistem baru gagal:',err)}};

 function win(){document.onkeydown=null;clearBanners();giveBack();const xp=enemies.reduce((s,e)=>s+e.xp,0);
  alive(P).forEach(p=>gainXp(p.id,xp));
  R.forEach(u=>gainXp(u.id,Math.round(xp*.5)));            /* cadangan dapat 50% EXP */
  const boss=enemies.some(e=>e.boss);
  if(G.team)P.forEach(u=>G.team.addBond(u.id,1+(u.combo?1:0)+(boss?2:0))); /* Bond naik */
  rewardSystems(boss);
  S.yen=(S.yen||0)+xp*3;a.innerHTML=`<div class="wipe"></div><div class="intro"><b>VICTORY</b> +${xp} EXP +${xp*3}¥ &bull; BOND UP</div>`;
  /* G._chain: battle yang langsung dimulai dari callback ini (lantai dungeon berikutnya) tidak menampilkan layar atur tim lagi */
  setTimeout(()=>{clearBanners();G._chain=1;try{cb(true)}finally{G._chain=0}},1500)}
 function lose(){document.onkeydown=null;clearBanners();giveBack();G.MAemit('battle_lose',{world:opts.world||null,chapter:CHN});a.innerHTML=`<div class="wipe"></div><div class="intro"><b>DEFEATED</b> Kalah... kembali ke hub</div>`;setTimeout(()=>{clearBanners();if(G.DIFF[S.diff].perma)G.wipe();cb(false)},1800)}
 draw()};

 /* ---------- mulai: atur tim dulu (kecuali dilewati) ---------- */
 const ownCount=Object.keys(G.CHARS).filter(k=>S.lv[k]).length;
 if(opts.noPick||G._chain||ownCount<2)run();else pickTeam(run)};