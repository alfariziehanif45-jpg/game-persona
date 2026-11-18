window.G=window.G||{};
/* =====================================================================
   SISTEM FUSE  (muat SETELAH main.js dan lang.js)
   - Tab "FUSE" di HUB
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
   Tampilan baru: memakai class sendiri (fz-*), tidak lagi memakai kartu .kc milik hub,
   sehingga tidak bentrok dengan CSS lain. Semua teks ikut diterjemah (ID / EN / JP).
   ===================================================================== */
(()=>{
if(G._fuse)return;G._fuse=1;
const EL=['phys','fire','ice','elec','wind','light','dark'];
const KRE={phys:/phys|fisik|slash|tebas|pukul/i,fire:/fire|api/i,ice:/\bice\b|\bes\b|beku/i,elec:/elec|petir|volt/i,wind:/wind|angin/i,light:/light|cahaya|suci|holy|bless/i,dark:/dark|gelap|kutuk|curse/i};
const FL={phys:'kekuatan fisik murni',fire:'api yang membakar',ice:'dingin yang membekukan',elec:'petir yang menyambar',wind:'angin yang menyayat',light:'cahaya yang menyucikan',dark:'kegelapan yang melahap'};
const ELN={phys:'Fisik',fire:'Api',ice:'Es',elec:'Petir',wind:'Angin',light:'Cahaya',dark:'Gelap'};
const ELC={phys:'#ffb347',fire:'#ff5a4d',ice:'#6fd6ff',elec:'#ffe14d',wind:'#6dffb8',light:'#fff2a0',dark:'#b98cff'};
const ELI={phys:'\u2694\uFE0F',fire:'\u{1F525}',ice:'\u2744\uFE0F',elec:'\u26A1',wind:'\u{1F343}',light:'\u2728',dark:'\u{1F311}'};
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

/* =====================================================================
   TERJEMAHAN (ID -> EN / JP). Dipasang ke kamus lang.js kalau tersedia.
   ===================================================================== */
(()=>{if(!G.addTR)return;
 const TR={},T=s=>G.T?G.T(s):s;
 /* nama skill fusi */
 const SNT={
  phys:[['Cross Slash','クロススラッシュ'],['Steel Smash','スチールスマッシュ'],['Slash Storm','斬撃の嵐'],['Blade Roar','剣の咆哮'],['Cosmic Slash','宇宙斬']],
  fire:[['Spark Flame','火花'],['Inferno Ball','インフェルノボール'],['Magma Blast','マグマブラスト'],['Firestorm','火炎の嵐'],['Mini Sun','ミニサン']],
  ice:[['Ice Shard','氷片'],['Ice Lance','氷の槍'],['Blizzard','吹雪'],['Absolute Zero','絶対零度'],['Frozen Apocalypse','凍結の終末']],
  elec:[['Mini Bolt','ミニボルト'],['Double Strike','ダブルボルト'],['Chain Lightning','チェインライトニング'],['Thunder Lance','雷の槍'],['Thunder Hammer','雷神の鎚']],
  wind:[['Wind Slash','風の斬撃'],['Sharp Vortex','鋭い渦'],['Tornado','トルネード'],['Cutting Storm','切り裂く嵐'],['Typhoon Fury','台風の怒り']],
  light:[['Holy Glimmer','聖なる輝き'],['Light Lance','光の槍'],['Rain of Light','光の雨'],['Judgment Ray','裁きの光線'],['Light of Genesis','始まりの光']],
  dark:[['Dark Whisper','闇のささやき'],['Curse Mist','呪いの霧'],['Eclipse','日蝕'],['Void Hole','虚無の穴'],['End of All Shadows','全ての影の終焉']]};
 EL.forEach(kd=>SN[kd].forEach((n,i)=>{TR[n]=SNT[kd][i]}));
 /* nama persona fusi: Inggris tetap, Jepang katakana */
 const PNJ={Berserker:'バーサーカー',Sigurd:'シグルド','Cu Chulainn':'クー・フーリン',Rama:'ラーマ','Vajra Titan':'ヴァジュラ・タイタン',
  Salamander:'サラマンダー',Ifrit:'イフリート',Agni:'アグニ',Hephaestus:'ヘパイストス',Kagutsuchi:'カグツチ',
  'Jack Frost':'ジャックフロスト','Snow Queen':'スノークイーン',Skadi:'スカディ',Ymir:'ユミル',Cocytus:'コキュートス',
  Raiju:'雷獣',Raijin:'雷神',Thor:'トール',Indra:'インドラ',Takemikazuchi:'タケミカヅチ',
  Sylph:'シルフ',Fuujin:'風神',Garuda:'ガルーダ',Quetzalcoatl:'ケツァルコアトル',Aeolus:'アイオロス',
  Seraph:'セラフ',Ishtar:'イシュタル',Metatron:'メタトロン',Ra:'ラー','Ahura Mazda':'アフラ・マズダ',
  Lilith:'リリス',Mara:'マーラ',Hecate:'ヘカテー',Nyx:'ニュクス',Abaddon:'アバドン'};
 Object.keys(PNJ).forEach(k=>{TR[k]=[k,PNJ[k]]});
 /* frasa elemen untuk deskripsi otomatis */
 const FLT={'kekuatan fisik murni':['pure physical power','純粋な物理の力'],'api yang membakar':['scorching fire','すべてを焼く炎'],'dingin yang membekukan':['freezing cold','凍てつく冷気'],
  'petir yang menyambar':['striking lightning','降り注ぐ雷'],'angin yang menyayat':['slicing wind','切り裂く風'],'cahaya yang menyucikan':['purifying light','清めの光'],'kegelapan yang melahap':['devouring darkness','すべてを喰らう闇']};
 Object.keys(FLT).forEach(k=>{TR[k]=FLT[k]});
 /* resep khusus: nama + deskripsi */
 const SPT={
  fz_sp_1:[['Satan the Sovereign','魔王サタン'],['King of demons. The three strongest demons fuse into a single curse.','悪魔の王。最強の三悪魔が一つの呪いに溶け合う。']],
  fz_sp_2:[['Archseraph','大熾天使'],['The highest angel. The light of three heavenly commanders in a single wing.','最高位の天使。三人の天の将の光がひとつの翼に宿る。']],
  fz_sp_3:[['Ragnarok','ラグナロク'],['The twilight of the gods. Fire, trickery, and fangs destroy everything.','神々の黄昏。炎と策略と牙がすべてを破壊する。']],
  fz_sp_4:[['Pantheon','パンテオン'],['The council of the world\'s gods. Three supreme gods unite their power.','世界の神々の評議会。三柱の最高神が力を合わせる。']],
  fz_sp_5:[['True Hero King','真の英雄王'],['The strength, toughness, and grandeur of three legendary heroes combined.','三人の伝説の英雄の力・不屈・威光が一つになる。']],
  fz_sp_6:[['Bearer of the Holy Banner','聖なる旗の担い手'],['A banner carried by three heroes. Anyone beneath it knows no fear.','三人の英雄が掲げる旗。その下では誰も恐れを知らない。']],
  fz_sp_7:[['Writer of Fate','運命の記述者'],['A scribe who writes the enemy\'s ending in ink of light.','光のインクで敵の結末を書き記す書記。']],
  fz_sp_8:[['Storm Trumpet','嵐のラッパ'],['A holy trumpet blown amid a god\'s storm. Every enemy is swept away.','神の嵐の中で吹かれる聖なるラッパ。すべての敵が吹き飛ぶ。']],
  fz_sp_9:[['Lucifer','ルシファー'],['The fallen angel. Light and darkness merge in a single rebellion.','堕ちた天使。光と闇がひとつの反逆となる。']],
  fz_ss_1:[['Forbidden Archive','禁じられたアーカイブ'],['Opens a forbidden page of the Archive. The enemy is erased from the record.','アーカイブの禁じられたページを開く。敵は記録から消える。']],
  fz_ss_2:[['Thousand Star Fist','千星拳'],['A thousand punches as fast as falling meteors.','流星のごとき速さで放つ千の拳。']],
  fz_ss_3:[['Doomsday Thermal','終末の熱衝撃'],['Extreme heat and cold collide. The enemy cracks from within.','極端な熱と冷気が衝突し、敵は内側から砕ける。']],
  fz_ss_4:[['Thunder Typhoon','雷の台風'],['A storm filled with lightning. Strikes without end.','雷に満ちた嵐。絶え間なく落ちる。']],
  fz_ss_5:[['Scales of Judgment','審判の天秤'],['Weighs the enemy\'s sins with light and shadow, then passes sentence.','光と影で敵の罪を量り、判決を下す。']],
  fz_ss_6:[['New Fate','新たな運命'],['A slash that rewrites the battle\'s ending into victory.','戦いの結末を勝利に書き換える斬撃。']]};
 SPECIAL.forEach(s=>{const t=SPT[s.id];if(!t)return;TR[s.n]=t[0];TR[s.d]=[t[1][0],t[1][1]]});
 /* teks antarmuka FUSE */
 Object.assign(TR,{
  'FUSE':['FUSE','合体'],'BAHAN':['MATERIALS','素材'],'Hasil':['Result','結果'],'PILIH':['SELECT','選択'],'DIPILIH':['SELECTED','選択中'],'DIBAWA':['EQUIPPED','装備中'],
  'Khusus':['Special','特別'],'RESEP KHUSUS':['SPECIAL RECIPES','特別レシピ'],'Resep khusus':['Special recipe','特別レシピ'],'Pilih bahan':['Select material','素材を選択'],
  'Pilih 3 bahan untuk digabung menjadi 1 yang baru. Hasilnya bisa dilihat dulu, tapi bahan akan habis setelah fusi.':['Pick 3 materials to merge into 1 new one. You can preview the result first, but the materials are consumed once you fuse.','素材を3つ選んで新しい1つに合体させる。結果は事前に確認できるが、合体後に素材は消費される。'],
  'Elemen hasil mengikuti bahan terbanyak. Tingkat hasil mengikuti rata-rata Power. Tiga bahan satu elemen memberi bonus +1 tingkat.':['The result element follows the most common material. The tier follows the average Power. Three materials of one element give a +1 tier bonus.','結果の属性は最も多い素材に従い、ランクは平均パワーで決まる。同属性の素材3つでランク+1。'],
  'Pilih 3 bahan dari daftar di bawah.':['Pick 3 materials from the list below.','下のリストから素材を3つ選ぶ。'],
  'Pilih 2 bahan lagi.':['Pick 2 more materials.','あと2つ素材を選ぼう。'],'Pilih 1 bahan lagi.':['Pick 1 more material.','あと1つ素材を選ぼう。'],
  'FUSI SEKARANG':['FUSE NOW','今すぐ合体'],
  'Yen tidak cukup untuk fusi ini.':['Not enough Yen for this fusion.','この合体には円が足りない。'],
  'Hasil ini sudah kamu miliki. Ganti salah satu bahan.':['You already own this result. Swap one of the materials.','この結果はすでに所持している。素材を1つ変えよう。'],
  'Data hasil fusi belum termuat. Coba buka ulang tab ini.':['Fusion data is not loaded yet. Try reopening this tab.','合体データが未読み込み。このタブを開き直してください。'],
  'Tiga bahan persis ini (urutan bebas) menghasilkan yang lebih kuat dari tingkat V.':['Exactly these three materials (any order) produce something stronger than tier V.','この3つの素材（順不同）で、ランクVより強力なものが生まれる。'],
  'Kamu butuh minimal 3 persona untuk fusi. Beli dulu di tab SHOP.':['You need at least 3 personas to fuse. Buy some in the SHOP tab first.','合体にはペルソナが3体以上必要。先にSHOPタブで購入しよう。'],
  'Kamu butuh minimal 3 skill untuk fusi. Beli dulu di tab SHOP.':['You need at least 3 skills to fuse. Buy some in the SHOP tab first.','合体にはスキルが3つ以上必要。先にSHOPタブで購入しよう。'],
  'FUSI BERHASIL!':['FUSION COMPLETE!','合体成功！'],
  'Otomatis dibawa menggantikan bahan.':['Automatically equipped in place of the materials.','素材の代わりに自動で装備した。'],
  'Ketiga bahan akan HABIS. Lanjut?':['All three materials will be CONSUMED. Continue?','3つの素材はすべて消費される。続けますか？']});
 G.addTR(TR);
 /* pola */
 G.addTRP(/^Persona hasil fusi tingkat (\S+)\. Memanggil (.+)\.$/,(_,n,f)=>`Fusion persona, tier ${n}. Summons ${T(f)}.`,(_,n,f)=>`合体ペルソナ・ランク${n}。${T(f)}を呼び出す。`);
 G.addTRP(/^Skill hasil fusi tingkat (\S+)\. Menyerang dengan (.+)\.$/,(_,n,f)=>`Fusion skill, tier ${n}. Attacks with ${T(f)}.`,(_,n,f)=>`合体スキル・ランク${n}。${T(f)}で攻撃する。`);
 G.addTRP(/^Tingkat (\S+)$/,'Tier $1','ランク$1');
 G.addTRP(/^Biaya ¥(\d+)$/,'Cost ¥$1','費用 ¥$1');
 G.addTRP(/^Fusi (.+)$/,(_,n)=>'Fuse '+n.split(' + ').map(T).join(' + '),(_,n)=>'合体：'+n.split(' + ').map(T).join(' + '));
 G.addTRP(/^= (.+)$/,(_,n)=>'= '+T(n),(_,n)=>'＝ '+T(n));
})();

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

/* ---------- CSS tampilan FUSE (disuntik sekali) ---------- */
(()=>{if(document.getElementById('fuse-p5'))return;
 const st=document.createElement('style');st.id='fuse-p5';st.textContent=`
#app .fz{grid-column:1/-1;width:100%;display:flex;flex-direction:column;gap:20px;position:relative;z-index:1;color:#fff;font:400 15px/1.55 "Segoe UI",Arial,sans-serif;font-style:normal;text-transform:none;letter-spacing:0}
#app .fz *{box-sizing:border-box;font-style:normal;text-transform:none;letter-spacing:0}
#app .fz button{all:unset;box-sizing:border-box;cursor:pointer}
#app .fz button:disabled{cursor:not-allowed}
#app .fz .fz-top{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
#app .fz .fz-ttl{display:block;background:#fff;color:#000;font:italic 400 38px/1 Impact,"Arial Narrow Bold",sans-serif;text-transform:uppercase;padding:6px 24px;transform:skewX(-10deg) rotate(-1deg);box-shadow:5px 5px 0 #000}
#app .fz .fz-who{display:block;background:#000;color:#fff;font:italic 400 24px/1 Impact,sans-serif;text-transform:uppercase;padding:9px 20px;border:2px solid #fff;transform:skewX(-10deg)}
#app .fz .fz-tabs{display:flex;gap:8px;margin-left:8px}
#app .fz .fz-tab{display:block;background:#000;color:#fff;border:2px solid #fff;font:italic 400 18px/1 Impact,sans-serif;text-transform:uppercase;padding:9px 22px;transform:skewX(-10deg);transition:.12s}
#app .fz .fz-tab:hover{background:#e60012}
#app .fz .fz-tab.on{background:#fff;color:#000;box-shadow:4px 4px 0 #000}
#app .fz .fz-yen{display:block;margin-left:auto;background:#ffd400;color:#000;font:italic 400 26px/1 Impact,sans-serif;padding:7px 20px;border:3px solid #000;box-shadow:4px 4px 0 #fff;transform:skewX(-10deg)}
#app .fz .fz-help{display:block;max-width:900px;background:rgba(0,0,0,.74);border-left:6px solid #ffd400;padding:10px 16px}
#app .fz .fz-help span{display:block}
#app .fz .fz-help span+span{margin-top:4px;color:#c9c9c9;font-size:14px}
#app .fz .fz-bench{display:flex;gap:18px;align-items:stretch;flex-wrap:wrap}
#app .fz .fz-slots{display:flex;gap:28px;flex:1 1 520px;align-items:stretch}
#app .fz .fz-slot{position:relative;flex:1 1 0;min-width:140px;min-height:170px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:16px 10px;background:rgba(0,0,0,.55);border:3px dashed rgba(255,255,255,.55);text-align:center;color:#ddd}
#app .fz .fz-slots .fz-slot+.fz-slot::before{content:"+";position:absolute;left:-23px;top:50%;margin-top:-18px;font:400 34px/1 Impact,sans-serif;color:#fff;text-shadow:2px 2px #000}
#app .fz .fz-slot.on{background:#0a0a0a;border:3px solid var(--c,#fff);box-shadow:6px 6px 0 var(--c,#fff);color:#fff;cursor:pointer;transition:.12s}
#app .fz .fz-slot.on:hover{transform:translate(-2px,-2px)}
#app .fz .fz-n{position:absolute;left:8px;top:8px;width:26px;height:26px;border-radius:50%;background:#e60012;color:#fff;font:400 15px/26px Impact,sans-serif;text-align:center}
#app .fz .fz-ico{display:block;font-size:42px;line-height:1}
#app .fz .fz-nm{display:block;font:italic 400 22px/1.1 Impact,"Arial Narrow Bold",sans-serif;text-transform:uppercase;letter-spacing:.5px}
#app .fz .fz-slot:not(.on) .fz-nm{font:400 15px/1.3 "Segoe UI",Arial,sans-serif;text-transform:none;opacity:.8}
#app .fz .fz-slot:not(.on) .fz-ico{color:#777;font:italic 400 48px/1 Impact,sans-serif}
#app .fz .fz-arrow{align-self:center;font:italic 400 46px/1 Impact,sans-serif;color:#fff;text-shadow:3px 3px #000}
#app .fz .fz-res{flex:1 1 380px;min-width:300px;display:flex;flex-direction:column;gap:10px;padding:16px 18px;background:#0a0a0a;border:3px solid #fff;box-shadow:8px 8px 0 #000}
#app .fz .fz-res.ready{border-color:var(--c,#ffd400);box-shadow:8px 8px 0 var(--c,#ffd400)}
#app .fz .fz-tag{display:block;align-self:flex-start;background:#e60012;color:#fff;font:italic 400 14px/1 Impact,sans-serif;letter-spacing:2px;text-transform:uppercase;padding:5px 12px}
#app .fz .fz-rname{display:flex;align-items:center;gap:10px;font:italic 400 36px/1.05 Impact,"Arial Narrow Bold",sans-serif;text-transform:uppercase;text-shadow:3px 3px 0 #e60012}
#app .fz .fz-rname .fz-ico{font-size:34px;text-shadow:none}
#app .fz .fz-qq{display:block;font:italic 400 64px/1 Impact,sans-serif;color:#4a4a4a}
#app .fz .fz-d{display:block;color:#e6e6e6}
#app .fz .fz-warn{display:block;background:#3a0a12;border-left:5px solid #ff4d4d;padding:7px 12px;color:#ffd0d0}
#app .fz .fz-go{display:block;align-self:flex-start;background:#e60012;color:#fff;border:3px solid #fff;font:italic 400 26px/1 Impact,sans-serif;text-transform:uppercase;padding:12px 34px;box-shadow:5px 5px 0 #000;transform:skewX(-10deg);transition:.12s}
#app .fz .fz-go:hover:not(:disabled){background:#fff;color:#e60012;transform:skewX(-10deg) translate(-2px,-2px)}
#app .fz .fz-go:disabled{background:#3a3a3a;color:#999;border-color:#777;box-shadow:none}
#app .fz .fz-meta{display:flex;flex-wrap:wrap;gap:6px}
#app .fz .fz-chip{display:inline-block;background:#222;color:#fff;border:1px solid #666;padding:1px 9px;font:600 12px/1.6 "Segoe UI",Arial,sans-serif}
#app .fz .fz-chip.el{background:var(--c,#444);color:#000;border-color:#000;font-weight:800}
#app .fz .fz-chip.gold{background:#ffd400;color:#000;border-color:#000;font-weight:800}
#app .fz .fz-chip.tier{background:#e60012;border-color:#fff;font-weight:800}
#app .fz .fz-chip.t{background:#fff;color:#000;border-color:#000}
#app .fz .fz-chip.pick{margin-left:auto;background:#e60012;border-color:#fff;font-weight:800}
#app .fz .fz-chip.pick.on{background:#ffd400;color:#000;border-color:#000}
#app .fz .fz-sec{display:flex;align-items:center;gap:10px}
#app .fz .fz-sec>span,#app .fz .fz-sech>span{display:block;font:italic 400 24px/1 Impact,sans-serif;text-transform:uppercase;background:#000;color:#fff;padding:6px 18px;border-left:8px solid #e60012}
#app .fz .fz-cnt{display:block;background:#fff;color:#000;font:400 14px/1 Impact,sans-serif;padding:5px 10px}
#app .fz .fz-sech{display:flex;align-items:center;gap:10px}
#app .fz .fz-sech:hover>span{background:#e60012}
#app .fz .fz-recnote{display:block;background:rgba(0,0,0,.65);padding:8px 14px;border-left:5px solid #ffd400}
#app .fz .fz-recs{display:grid;grid-template-columns:repeat(auto-fill,minmax(440px,1fr));gap:10px}
#app .fz .fz-rec{display:flex;align-items:center;flex-wrap:wrap;gap:8px;background:rgba(0,0,0,.74);border:2px solid #444;padding:9px 12px}
#app .fz .fz-rec.got{border-color:#ffd400}
#app .fz .fz-ing{display:inline-block;background:#1b1b1b;color:#8a8a8a;border:1px solid #444;padding:2px 10px;font-weight:600}
#app .fz .fz-ing.has{background:#fff;color:#000;border-color:#000}
#app .fz .fz-op{display:inline-block;color:#ffd400;font-weight:800}
#app .fz .fz-rout{display:inline-block;font:italic 400 19px/1 Impact,sans-serif;text-transform:uppercase;color:#ffd400}
#app .fz .fz-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:18px}
#app .fz .fz-card{position:relative;display:flex;flex-direction:column;gap:9px;padding:14px 16px;background:#0a0a0a;color:#fff;border:3px solid #fff;border-left:8px solid var(--c,#fff);box-shadow:6px 6px 0 #000;text-align:left;transition:.12s}
#app .fz .fz-card:hover{transform:translate(-3px,-3px);box-shadow:9px 9px 0 var(--c,#e60012)}
#app .fz .fz-card.sel{border-color:#ffd400;border-left-color:var(--c,#ffd400);box-shadow:6px 6px 0 #ffd400}
#app .fz .fz-head{display:flex;align-items:center;gap:10px}
#app .fz .fz-card .fz-ico{font-size:30px}
#app .fz .fz-card .fz-nm{font-size:22px}
#app .fz .fz-ord{position:absolute;right:-12px;top:-14px;width:30px;height:30px;border-radius:50%;background:#ffd400;color:#000;border:2px solid #000;font:400 17px/26px Impact,sans-serif;text-align:center}
#app .fz .fz-tags{display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-top:auto}
#app .fz .fz-empty{display:block;background:rgba(0,0,0,.74);border-left:6px solid #ff4d4d;padding:12px 18px}
@media (max-width:900px){#app .fz .fz-slots{flex-wrap:wrap}#app .fz .fz-recs{grid-template-columns:1fr}}`;
 document.head.appendChild(st)})();

/* ---------- UI ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const chip=(txt,cls,col)=>`<i class="fz-chip ${cls||''}"${col?` style="--c:${col}"`:''}>${esc(txt)}</i>`;
const metaOf=(x,withType)=>{const el=elemOf(x),o=[];
 if(withType&&x.t)o.push(chip(lbl(x.t),'t'));
 o.push(chip(ELN[el]||'','el',ELC[el]));o.push(chip('Power '+(x.pow||'-')));o.push(chip((x.sp||0)+' SP'));o.push(chip('CD '+(x.cd||0)));
 return o.join('')};
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
 const f=U.fz=U.fz||{k:'persona',sel:[],ch:ch,rec:0};
 if(f.ch!=ch){f.ch=ch;f.sel=[]}
 const kind=f.k,o=G.own(ch),list=(kind=='persona'?o.per:o.skl)||[],eq=equipped(ch,kind);
 const items=list.map(id=>master(kind,id)).filter(Boolean).sort((a,b)=>(b.pow||0)-(a.pow||0));
 f.sel=f.sel.filter(id=>items.some(x=>x.id==id));
 const sel=f.sel,C=G.CHARS[ch];

 /* panel kiri: daftar protagonis */
 if(B){const ps=G.spr?G.spr('characters',ch,'pt'):'';
  B.innerHTML='<div class="hbh">PROTAGONIS</div>'+Object.keys(G.CHARS).filter(k=>S.lv[k]).map(k=>{const sp=G.spr?G.spr('characters',k,'pt'):'';
   return`<button class="si ${k==ch?'on':''}" data-fc="${k}">${sp?`<span class="pw">${sp}</span>`:''}<b>${G.CHARS[k].n}</b></button>`}).join('')+(ps?`<div class="por">${ps}</div>`:'')}

 /* --- slot bahan --- */
 const slot=(id,i)=>{const x=id?master(kind,id):null;
  if(!x)return`<div class="fz-slot"><span class="fz-n">${i+1}</span><span class="fz-ico">?</span><span class="fz-nm">Pilih bahan</span></div>`;
  const el=elemOf(x);
  return`<button class="fz-slot on" data-fp="${x.id}" style="--c:${ELC[el]||'#fff'}"><span class="fz-n">${i+1}</span><span class="fz-ico">${x.e||ELI[el]}</span><span class="fz-nm">${esc(x.n)}</span><span class="fz-meta">${chip(ELN[el]||'','el',ELC[el])}${chip('Power '+(x.pow||'-'))}</span></button>`};
 const slots=[0,1,2].map(i=>slot(sel[i],i)).join('');

 /* --- hasil fusi --- */
 let res;
 if(sel.length<3){
  res=`<div class="fz-res"><span class="fz-tag">Hasil</span><span class="fz-qq">???</span><span class="fz-d">${['Pilih 3 bahan dari daftar di bawah.','Pilih 2 bahan lagi.','Pilih 1 bahan lagi.'][sel.length]}</span></div>`}
 else{const c=calc(kind,sel.map(id=>master(kind,id))),r=c.res;
  if(!r)res=`<div class="fz-res"><span class="fz-tag">Hasil</span><span class="fz-warn">Data hasil fusi belum termuat. Coba buka ulang tab ini.</span></div>`;
  else{const dup=list.includes(r.id)&&!sel.includes(r.id),poor=S.yen<c.cost,ok=!dup&&!poor,el=elemOf(r);
   res=`<div class="fz-res ready" style="--c:${ELC[el]||'#ffd400'}">
    <span class="fz-tag">Hasil</span>
    <span class="fz-rname"><span class="fz-ico">${r.e||ELI[el]}</span><span>${esc(r.n)}</span></span>
    <span class="fz-meta">${chip(c.special?'Resep khusus':'Tingkat '+RM[c.tier],'tier')}${metaOf(r,kind=='persona')}</span>
    <span class="fz-d">${esc(r.d)}</span>
    <span class="fz-meta">${chip('Biaya \u00a5'+c.cost,'gold')}</span>
    ${dup?'<span class="fz-warn">Hasil ini sudah kamu miliki. Ganti salah satu bahan.</span>':poor?'<span class="fz-warn">Yen tidak cukup untuk fusi ini.</span>':''}
    <button class="fz-go" id="fzgo" ${ok?'':'disabled'}>FUSI SEKARANG</button></div>`}}

 /* --- resep khusus --- */
 const found=(S.fz&&S.fz.found)||{},have=new Set(items.map(x=>x.n)),recs=SPECIAL.filter(s=>s.kind==kind);
 const recHtml=`<div class="fz-sec"><button class="fz-sech" data-frec="1"><span>RESEP KHUSUS</span><i class="fz-cnt">${recs.length}</i><i class="fz-cnt">${f.rec?'\u25B2':'\u25BC'}</i></button></div>`+
  (f.rec?`<span class="fz-recnote">Tiga bahan persis ini (urutan bebas) menghasilkan yang lebih kuat dari tingkat V.</span><div class="fz-recs">`+
   recs.map(s=>`<div class="fz-rec ${found[s.id]?'got':''}"><span>${s.need.map(n=>`<i class="fz-ing ${have.has(n)?'has':''}">${esc(n)}</i>`).join(' <i class="fz-op">+</i> ')}</span><i class="fz-op">\u2192</i><span class="fz-rout">${esc(s.n)}</span>${found[s.id]?'<i class="fz-chip gold">\u2713</i>':''}</div>`).join('')+`</div>`:'');

 /* --- daftar bahan --- */
 const card=x=>{const el=elemOf(x),on=sel.indexOf(x.id),tags=[];
  if(eq.has(x.id))tags.push(chip('DIBAWA','gold'));
  if(x.fz!=null)tags.push(chip(x.fz>=5?'Khusus':'Tingkat '+RM[x.fz],'tier'));
  tags.push(`<i class="fz-chip pick ${on>=0?'on':''}">${on>=0?'\u2713 DIPILIH':'PILIH'}</i>`);
  return`<button class="fz-card ${on>=0?'sel':''}" data-fp="${x.id}" style="--c:${ELC[el]||'#fff'}">
   ${on>=0?`<i class="fz-ord">${on+1}</i>`:''}
   <span class="fz-head"><span class="fz-ico">${x.e||ELI[el]}</span><span class="fz-nm">${esc(x.n)}</span></span>
   <span class="fz-meta">${metaOf(x,kind=='persona')}</span>
   <span class="fz-d">${esc(x.d||'')}</span>
   <span class="fz-tags">${tags.join('')}</span></button>`};
 const mats=`<div class="fz-sec"><span>BAHAN</span><i class="fz-cnt">${items.length}</i></div>`+
  (items.length<3?`<span class="fz-empty">${kind=='persona'?'Kamu butuh minimal 3 persona untuk fusi. Beli dulu di tab SHOP.':'Kamu butuh minimal 3 skill untuk fusi. Beli dulu di tab SHOP.'}</span>`:'')+
  (items.length?`<div class="fz-grid">${items.map(card).join('')}</div>`:'');

 P.innerHTML=`<div class="fz">
  <div class="fz-top"><span class="fz-ttl">FUSE</span><span class="fz-who">${esc(C.n)}</span>
   <div class="fz-tabs">${[['persona','PERSONA'],['skill','SKILL']].map(([k,t])=>`<button class="fz-tab ${k==kind?'on':''}" data-fk="${k}">${t}</button>`).join('')}</div>
   <span class="fz-yen">\u00a5 ${S.yen}</span></div>
  <div class="fz-help"><span>Pilih 3 bahan untuk digabung menjadi 1 yang baru. Hasilnya bisa dilihat dulu, tapi bahan akan habis setelah fusi.</span><span>Elemen hasil mengikuti bahan terbanyak. Tingkat hasil mengikuti rata-rata Power. Tiga bahan satu elemen memberi bonus +1 tingkat.</span></div>
  <div class="fz-bench"><div class="fz-slots">${slots}</div><span class="fz-arrow">\u25B6</span>${res}</div>
  ${recHtml}
  ${mats}
 </div>`;

 /* handler */
 A.querySelectorAll('[data-fc]').forEach(b=>b.onclick=()=>{U.sel=b.dataset.fc;f.sel=[];redraw()});
 P.querySelectorAll('[data-fk]').forEach(b=>b.onclick=()=>{f.k=b.dataset.fk;f.sel=[];redraw()});
 P.querySelectorAll('[data-frec]').forEach(b=>b.onclick=()=>{f.rec=f.rec?0:1;redraw()});
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

/* ---------- pasang ke hub() (dibungkus, main.js tidak diubah) ---------- */
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