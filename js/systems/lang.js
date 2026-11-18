/* =====================================================================
   lang.js  —  SUB / BAHASA TEKS: Indonesia (id) · English (en) · 日本語 (ja)
   ---------------------------------------------------------------------
   Muat file ini SEBELUM file game utama (supaya menu pertama sudah terjemah):
       <script src="js/systems/lang.js"></script>

   CARA KERJA
   - Teks asli tetap bahasa Indonesia. Terjemahan dicari berdasarkan teks Indonesia-nya.
   - Penerjemah otomatis memantau layar (#app) dan alert/confirm, jadi semua file
     (hub, battle, dungeon, dll.) ikut terjemah selama teksnya ada di kamus.
   - Dialog cerita ikut diterjemah lewat pembungkus G.dialog (format baris: [pembicara, teks]).
   - Pilihan bahasa disimpan di localStorage.

   MENAMBAH TERJEMAHAN (bisa dari file mana pun, kapan pun):
       G.addTR({'Teks Indonesia':['English','日本語'], ...});
       G.addTRP(/^Pola (\d+)$/, 'Pattern $1', 'パターン $1');   // pola dengan angka

   MENCARI TEKS YANG BELUM TERJEMAH (BARU, tanpa console):
       Tekan  Ctrl + Shift + L  kapan saja di dalam game.
       Browser mengunduh file  terjemahan_belum.txt  berisi semua teks data game
       (skill, persona, chapter, side chapter, musuh, dialog, dll.) yang belum ada
       terjemahannya. Kirim file itu supaya kamusnya bisa dilengkapi.
       Untuk teks yang muncul saat battle: ketik  G.TRLOG=true  di console, mainkan
       satu battle, lalu tekan Ctrl+Shift+L.
   ===================================================================== */
window.G=window.G||{};
(()=>{
const LANGS=['id','en','ja'],
 LN={id:'Bahasa: Indonesia',en:'Language: English',ja:'言語: 日本語'};
let lang='id';try{const v=localStorage.getItem('mv_lang');if(LANGS.includes(v))lang=v}catch(e){}
G.lang=lang;

const D=Object.create(null),DL=Object.create(null),P=[],cache=new Map();
G.addTR=o=>{Object.keys(o).forEach(k=>{D[k]=o[k];DL[k.toLowerCase()]=o[k]});cache.clear()};
G.addTRP=(re,en,ja)=>{P.push([re,en,ja]);cache.clear()};
const li=()=>G.lang=='en'?0:1;

/* ---------- inti penerjemah ---------- */
function tx(s){
 const i=li();
 if(D[s])return D[s][i];
 if(!/[A-Za-z]/.test(s))return s;
 if(s.indexOf('\n')>=0)return s.split('\n').map(tx).join('\n');
 if(/ [\u2022\u00b7] /.test(s))return s.split(/( [\u2022\u00b7] )/).map((p,k)=>k%2?p:tx(p)).join('');
 const m=s.match(/^(\s*)([\s\S]*?)(\s*)$/);if((m[1]||m[3])&&m[2])return m[1]+tx(m[2])+m[3];
 for(const [re,en,ja] of P){if(re.test(s)){const t=i?ja:en;return t==null?s:s.replace(re,t)}}
 const dl=DL[s.toLowerCase()];
 if(dl){let r=dl[i];if(s===s.toUpperCase()&&/^[\x00-\x7f]*$/.test(r))r=r.toUpperCase();return r}
 const p=s.match(/^([^\p{L}\p{N}]+)([\s\S]+)$/u);   /* awalan simbol/emoji: "✓ ", "🔒 ", "★ " */
 if(p){const r=tx(p[2]);return r===p[2]?s:p[1]+r}
 if(G.TRLOG)(G.missing=G.missing||new Set()).add(s);
 return s}
G.T=s=>{if(typeof s!='string'||G.lang=='id')return s;const k=G.lang+'\0'+s;let v=cache.get(k);
 if(v===undefined){v=tx(s);cache.set(k,v)}return v};

/* ---------- penerjemah layar otomatis ---------- */
const store=new WeakMap();
const proc=n=>{const p=n.parentNode;if(!p||/^(SCRIPT|STYLE|TEXTAREA)$/.test(p.nodeName))return;
 const v=n.nodeValue;let r=store.get(n);if(!r||r.out!==v)r={src:v,out:v};   /* teks diubah game = sumber baru */
 const t=G.T(r.src);r.out=t;store.set(n,r);if(v!==t)n.nodeValue=t};
const walk=root=>{if(root.nodeType==3)return proc(root);if(root.nodeType!=1)return;
 const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while(n=w.nextNode())proc(n)};
const start=()=>{walk(document.body);
 new MutationObserver(ms=>{for(const m of ms){if(m.type=='characterData')proc(m.target);else m.addedNodes.forEach(walk)}})
  .observe(document.body,{childList:true,subtree:true,characterData:true})};
document.body?start():document.addEventListener('DOMContentLoaded',start);

/* alert & confirm */
['alert','confirm'].forEach(k=>{const f=window[k];window[k]=function(m){return f.call(window,G.T(String(m)))}});

/* ---------- ganti bahasa ---------- */
G.langName=()=>LN[G.lang];
G.setLang=l=>{if(!LANGS.includes(l))return;G.lang=l;cache.clear();
 try{localStorage.setItem('mv_lang',l)}catch(e){}
 document.documentElement.lang=l;if(document.body)walk(document.body)};
G.cycleLang=()=>G.setLang(LANGS[(LANGS.indexOf(G.lang)+1)%LANGS.length]);
document.documentElement.lang=lang;

/* ---------- dialog cerita: terjemahkan baris sebelum ditampilkan ----------
   dipasang lazy (dipanggil dari menu()) karena G.dialog didefinisikan di file lain */
G.trLines=L=>{if(G.lang=='id'||!Array.isArray(L))return L;
 return L.map(x=>{
  if(Array.isArray(x))return x.map((v,i)=>i>0&&typeof v=='string'?G.T(v):v);   /* [pembicara, teks] */
  if(typeof x=='string')return G.T(x);
  if(x&&typeof x=='object'){const o=Object.assign({},x);['text','t','msg','line'].forEach(k=>{if(typeof o[k]=='string')o[k]=G.T(o[k])});return o}
  return x})};
G.langHook=()=>{if(G._lh||!G.dialog)return;G._lh=1;const d=G.dialog;
 G.dialog=function(lines,...r){return d.call(this,G.trLines(lines),...r)}};

/* ---------- PEMINDAI TEKS BELUM TERJEMAH (Ctrl + Shift + L) ----------
   Menelusuri semua tabel data di G (skill, persona, chapter, side chapter, musuh, dialog...)
   dan mengumpulkan teks yang belum punya terjemahan, ditambah teks runtime kalau G.TRLOG=true. */
G.dumpMissing=(download=true)=>{
 const keep=G.lang;G.lang='en';
 const out=new Set(),seen=new Set();
 const add=s=>{if(typeof s!=='string')return;s=s.trim();
  if(s.length<2||s.length>900||!/[A-Za-z]/.test(s))return;
  if(/^[\w\-]+$/.test(s)&&s===s.toLowerCase())return;                    /* id internal: kael, phys, altkael_hp1 */
  if(/^(assets|css|js)\//.test(s)||/\.(png|jpe?g|gif|webp|svg|mp3|ogg|wav|js|css|html)$/i.test(s))return;
  if(/^#[0-9a-f]{3,8}$/i.test(s)||/^(rgba?|hsla?)\(/i.test(s))return;
  if(G.T(s)!==s)return;                                                  /* sudah ada terjemahannya */
  out.add(s)};
 const walkObj=(o,d)=>{
  if(o==null||d>7)return;
  if(typeof o==='string'){add(o);return}
  if(typeof o!=='object'||seen.has(o)||o.nodeType)return;
  seen.add(o);
  let keys;try{keys=Object.keys(o)}catch(e){return}
  for(const k of keys){let v;try{v=o[k]}catch(e){continue}
   if(typeof v==='function')continue;
   if(d===0&&/^(state|missing|ui|meta|dw|FIN|fin|lang)$/.test(k))continue;
   walkObj(v,d+1)}};
 try{walkObj(G,0)}catch(e){console.warn('[dumpMissing]',e)}
 if(G.missing)G.missing.forEach(s=>{if(typeof s==='string'&&s.trim())out.add(s.trim())});
 G.lang=keep;
 const arr=[...out].sort((a,b)=>a.localeCompare(b));
 console.log('[Terjemahan belum ada]',arr.length,'teks');
 if(download&&arr.length){
  const blob=new Blob([JSON.stringify(arr,null,1)],{type:'text/plain;charset=utf-8'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='terjemahan_belum.txt';document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),4000)}
 return arr};
document.addEventListener('keydown',e=>{if(e.ctrlKey&&e.shiftKey&&(e.key==='L'||e.key==='l')){e.preventDefault();G.dumpMissing()}});

/* =====================================================================
   KAMUS   'Teks Indonesia':['English','日本語']
   ===================================================================== */
G.addTR({
/* ---- menu & slot ---- */
'Ganti bahasa teks: Indonesia / English / 日本語.':['Change text language: Indonesia / English / 日本語.','表示言語を切り替える：Indonesia / English / 日本語。'],
'MENU: MAIN ★ SELECT A COMMAND':['MENU: MAIN ★ SELECT A COMMAND','メニュー：メイン ★ コマンドを選択'],
'LOAD ★ SELECT A SLOT':['LOAD ★ SELECT A SLOT','ロード ★ スロットを選択'],
'DELETE ★ SELECT A SLOT':['DELETE ★ SELECT A SLOT','削除 ★ スロットを選択'],
'NEW GAME ★ SELECT A SLOT':['NEW GAME ★ SELECT A SLOT','ニューゲーム ★ スロットを選択'],
'DIFFICULTY ★ CHOOSE YOUR FATE':['DIFFICULTY ★ CHOOSE YOUR FATE','難易度 ★ 運命を選べ'],
'New Game':['New Game','ニューゲーム'],'Load':['Load','ロード'],
'Mulai petualangan baru di Multiverse Archive.':['Begin a new adventure in the Multiverse Archive.','マルチバース・アーカイブで新たな冒険を始める。'],
'Hapus Save':['Delete Save','セーブ削除'],
'Hapus salah satu slot save.':['Delete one of the save slots.','セーブスロットを1つ削除する。'],
'Kembali ke menu utama.':['Return to the main menu.','メインメニューに戻る。'],
'Kembali memilih difficulty.':['Return to difficulty select.','難易度選択に戻る。'],
'Back':['Back','戻る'],'Kosong':['Empty','空き'],'akan DITIMPA':['will be OVERWRITTEN','上書きされます'],
'Musuh lemah, EXP lebih banyak.':['Weak enemies, more EXP.','敵が弱く、EXPが多い。'],
'Pengalaman seimbang.':['Balanced experience.','バランスの取れた難易度。'],
'Musuh kuat dan EXP berkurang.':['Strong enemies, less EXP.','敵が強く、EXPが減る。'],
'Sangat berat. Kalah = save terhapus!':['Brutal. Lose = save deleted!','超高難度。負けるとセーブが消える！'],
'Easy':['Easy','イージー'],'Normal':['Normal','ノーマル'],'Hard':['Hard','ハード'],'Hardcore':['Hardcore','ハードコア'],
/* ---- hub: umum ---- */
'STATUS':['STATUS','ステータス'],'TEAM':['TEAM','チーム'],'SKILL':['SKILL','スキル'],'PERSONA':['PERSONA','ペルソナ'],
'SHOP':['SHOP','ショップ'],'DUNGEON':['DUNGEON','ダンジョン'],'SIDE':['SIDE','サイド'],'CHAPTER':['CHAPTER','チャプター'],
'ATK':['ATK','攻撃'],'DEF':['DEF','防御'],
'PROTAGONIS':['PROTAGONISTS','主人公'],'Protagonis':['Protagonist','主人公'],
'Main Story':['Main Story','メインストーリー'],'Ending':['Ending','エンディング'],'Save':['Save','セーブ'],'Menu':['Menu','メニュー'],
'LEVEL MAKSIMAL, EXP tidak bertambah lagi':['MAX LEVEL, no more EXP gained','最大レベル。これ以上EXPは増えない'],
'KLIK NAMA DI KIRI':['CLICK A NAME ON THE LEFT','左の名前をクリック'],
'Aktif/nonaktifkan protagonis (maks 4)':['Toggle protagonists on/off (max 4)','主人公の参加/不参加を切替（最大4人）'],
'SELALU AKTIF':['ALWAYS ON','常時発動'],'BAWA':['EQUIP','装備'],'DIBAWA (LEPAS)':['EQUIPPED (REMOVE)','装備中（外す）'],
'DIMILIKI':['OWNED','所持済み'],'BELI':['BUY','購入'],'MAIN':['PLAY','プレイ'],'MASUK':['ENTER','入る'],
'TERKUNCI':['LOCKED','ロック中'],'SELESAI':['CLEARED','クリア済み'],'TERSEDIA':['AVAILABLE','挑戦可能'],'Terbuka':['Unlocked','解放済み'],
'BOSS':['BOSS','ボス'],'MINI BOSS':['MINI BOSS','ミニボス'],'Side chapter':['Side chapter','サイドチャプター'],
'PHOENIX (BAWAAN)':['PHOENIX (INNATE)','フェニックス（固有）'],
'ATTACK / GUARD':['ATTACK / GUARD','攻撃 / 防御'],
'ATTACK = ATK x 2':['ATTACK = ATK x 2','攻撃 = ATK x 2'],
'GUARD = DEF x2 dan +4 SP':['GUARD = DEF x2 and +4 SP','防御 = DEF x2 と SP+4'],
'BELI SKILL BARU':['BUY NEW SKILLS','新スキルを購入'],
'Buka tab SHOP lalu pilih kategori SKILL. Tiap protagonis punya skill KHAS sendiri.':['Open the SHOP tab and pick the SKILL category. Every protagonist has their own UNIQUE skills.','SHOPタブでSKILLを選択。主人公ごとに専用スキルがある。'],
'memanggil persona untuk membantu':['summons a persona to help','ペルソナを召喚して戦う'],
'BELUM ADA PERSONA':['NO PERSONA YET','ペルソナ未所持'],
'Beli iblis atau malaikat di tab SHOP, kategori PERSONA':['Buy a demon or angel in the SHOP tab, PERSONA category','SHOPタブのPERSONAで悪魔か天使を購入'],
/* jenis persona */
'Iblis':['Demon','悪魔'],'Malaikat':['Angel','天使'],'Dewa':['God','神'],'Pahlawan Dunia':['World Hero','世界の英雄'],
'Persona Khusus':['Special Persona','特別ペルソナ'],'Persona awal':['Starter Persona','初期ペルソナ'],
/* ---- jenis serangan (G.KIND). Cadangan: label Indonesia dan Inggris, huruf besar/kecil bebas ---- */
'Fisik':['Physical','物理'],'Physical':['Physical','物理'],'Phys':['Physical','物理'],'Slash':['Slash','斬撃'],'Tebasan':['Slash','斬撃'],
'Api':['Fire','火炎'],'Fire':['Fire','火炎'],'Es':['Ice','氷結'],'Ice':['Ice','氷結'],'Beku':['Ice','氷結'],
'Petir':['Lightning','電撃'],'Listrik':['Electric','電撃'],'Lightning':['Lightning','電撃'],'Electric':['Electric','電撃'],'Elec':['Electric','電撃'],
'Angin':['Wind','疾風'],'Wind':['Wind','疾風'],
'Cahaya':['Light','閃光'],'Light':['Light','閃光'],'Suci':['Holy','神聖'],'Holy':['Holy','神聖'],'Berkat':['Bless','祝福'],'Bless':['Bless','祝福'],
'Gelap':['Dark','暗黒'],'Dark':['Dark','暗黒'],'Kutukan':['Curse','呪怨'],'Kutuk':['Curse','呪怨'],'Curse':['Curse','呪怨'],
'Penyembuhan':['Healing','回復'],'Pemulihan':['Recovery','回復'],'Heal':['Heal','回復'],'Healing':['Healing','回復'],
'Racun':['Poison','毒'],'Poison':['Poison','毒'],'Dukungan':['Support','支援'],'Support':['Support','支援'],
'Nuklir':['Nuclear','核熱'],'Psi':['Psy','念動'],'Almighty':['Almighty','万能'],'Serba bisa':['Almighty','万能'],
/* ---- shop ---- */
'Skill dan persona dibeli untuk protagonis ini':['Skills and personas are bought for this protagonist','スキルとペルソナはこの主人公用に購入'],
'ITEM':['ITEM','アイテム'],
'Yen tidak cukup':['Not enough Yen','円が足りない'],
'Tersimpan di Slot':['Saved to Slot','保存先スロット'],
'Potion':['Potion','ポーション'],'Pulihkan 50 HP':['Restores 50 HP','HPを50回復'],
'Obat dasar untuk satu anggota. Murah dan cocok dibawa banyak.':['Basic medicine for one member. Cheap, so carry plenty.','味方1人用の基本薬。安価でたくさん持てる。'],
'Potion Pack x3':['Potion Pack x3','ポーションパック x3'],'3x Potion, lebih hemat':['3x Potion, better value','ポーション3個、お得'],
'Paket 3 Potion dengan harga lebih murah dibanding beli satuan.':['A 3-Potion pack, cheaper than buying one by one.','単品より安いポーション3個セット。'],
'High Potion':['High Potion','ハイポーション'],'Pulihkan 40% HP (min 150)':['Restores 40% HP (min 150)','HPを40%回復（最低150）'],
'Pemulihan besar untuk satu anggota. Efektif untuk karakter dengan HP tinggi.':['Big recovery for one member. Great for high-HP characters.','味方1人を大きく回復。HPが高いキャラに有効。'],
'High Potion Pack x3':['High Potion Pack x3','ハイポーションパック x3'],'3x High Potion, lebih hemat':['3x High Potion, better value','ハイポーション3個、お得'],
'Paket 3 High Potion dengan harga lebih murah dibanding beli satuan.':['A 3-High Potion pack, cheaper than buying one by one.','単品より安いハイポーション3個セット。'],
'Mega Potion':['Mega Potion','メガポーション'],'Pulihkan HP penuh':['Fully restores HP','HPを全回復'],
'Memulihkan seluruh HP satu anggota. Andalan saat melawan boss.':['Fully restores one member\'s HP. A boss-fight staple.','味方1人のHPを全回復。ボス戦の頼れる一品。'],
'Mega Potion Pack x3':['Mega Potion Pack x3','メガポーションパック x3'],'3x Mega Potion, lebih hemat':['3x Mega Potion, better value','メガポーション3個、お得'],
'Paket 3 Mega Potion untuk persiapan menghadapi boss.':['A 3-Mega Potion pack to prepare for bosses.','ボス戦に備えたメガポーション3個セット。'],
'SP Drink':['SP Drink','SPドリンク'],'Pulihkan 20 SP':['Restores 20 SP','SPを20回復'],
'Minuman penambah tenaga agar skill dan persona bisa dipakai lagi.':['An energy drink so skills and personas can be used again.','スキルやペルソナをまた使えるようにする栄養ドリンク。'],
'Ether':['Ether','エーテル'],'Pulihkan 50% SP':['Restores 50% SP','SPを50%回復'],
'Cairan sihir yang memulihkan setengah SP maksimum satu anggota.':['A magic liquid that restores half of one member\'s max SP.','味方1人の最大SPの半分を回復する魔法の液体。'],
'Mega SP Drink':['Mega SP Drink','メガSPドリンク'],'Pulihkan SP penuh':['Fully restores SP','SPを全回復'],
'Memulihkan seluruh SP satu anggota. Cocok untuk karakter yang haus skill.':['Fully restores one member\'s SP. Perfect for skill-hungry characters.','味方1人のSPを全回復。スキルを多用するキャラ向け。'],
'Group SP Drink':['Group SP Drink','グループSPドリンク'],'Pulihkan 20 SP seluruh tim':['Restores 20 SP to the whole team','チーム全員のSPを20回復'],
'Minuman tenaga yang dibagikan ke seluruh anggota tim yang masih hidup.':['An energy drink shared with every living team member.','生存中の全員に配る栄養ドリンク。'],
'Elixir':['Elixir','エリクサー'],'HP & SP penuh':['Full HP & SP','HPとSPを全回復'],
'Memulihkan HP dan SP satu anggota sekaligus. Item darurat terbaik.':['Restores one member\'s HP and SP at once. The best emergency item.','味方1人のHPとSPを同時に回復。最高の緊急アイテム。'],
'Elixir Pack x3':['Elixir Pack x3','エリクサーパック x3'],'3x Elixir, lebih hemat':['3x Elixir, better value','エリクサー3個、お得'],
'Paket 3 Elixir dengan harga lebih murah dibanding beli satuan.':['A 3-Elixir pack, cheaper than buying one by one.','単品より安いエリクサー3個セット。'],
'Mega Elixir':['Mega Elixir','メガエリクサー'],'HP & SP penuh + hapus debuff':['Full HP & SP + clears debuffs','HP・SP全回復＋デバフ解除'],
'Pemulihan total satu anggota: HP dan SP penuh, plus menghapus racun, bakar, seal, dan debuff ATK/DEF.':['Total recovery for one member: full HP and SP, plus clears poison, burn, seal, and ATK/DEF debuffs.','味方1人を完全回復：HP・SP全回復に加え、毒・火傷・封印・攻防ダウンも解除。'],
'Panacea':['Panacea','万能薬'],'Hapus semua debuff':['Clears all debuffs','すべてのデバフを解除'],
'Obat penawar untuk satu anggota: menghapus racun, bakar, seal, serta ATK/DEF turun.':['An antidote for one member: clears poison, burn, seal, and lowered ATK/DEF.','味方1人用の解毒薬：毒・火傷・封印・攻防ダウンを解除。'],
'Group Herb':['Group Herb','グループハーブ'],'Pulihkan 30% HP seluruh tim':['Restores 30% HP to the whole team','チーム全員のHPを30%回復'],
'Ramuan herbal yang menyembuhkan seluruh tim sekaligus.':['A herbal remedy that heals the whole team at once.','チーム全員を一度に癒す薬草。'],
'Group Mega Herb':['Group Mega Herb','グループメガハーブ'],'Pulihkan HP penuh seluruh tim':['Fully restores HP to the whole team','チーム全員のHPを全回復'],
'Ramuan langka yang memulihkan HP seluruh tim yang masih hidup sampai penuh.':['A rare herb that fully restores the HP of every living team member.','生存中の全員のHPを全回復する希少な薬草。'],
'Group Elixir':['Group Elixir','グループエリクサー'],'HP & SP penuh seluruh tim + hapus debuff':['Full HP & SP for the team + clears debuffs','全員のHP・SP全回復＋デバフ解除'],
'Elixir terbaik: seluruh anggota hidup pulih HP dan SP sampai penuh, dan semua debuff hilang.':['The ultimate elixir: every living member is fully restored in HP and SP, and all debuffs vanish.','究極のエリクサー：生存中の全員のHPとSPが全回復し、デバフも消える。'],
'Revive':['Revive','リバイブ'],'Hidupkan anggota tumbang (HP 50%)':['Revives a fallen member (50% HP)','戦闘不能の味方を復活（HP50%）'],
'Membangkitkan anggota yang tumbang dengan setengah HP.':['Revives a fallen member with half HP.','戦闘不能の味方をHP半分で復活させる。'],
'Max Revive':['Max Revive','マックスリバイブ'],'Hidupkan anggota tumbang (HP penuh)':['Revives a fallen member (full HP)','戦闘不能の味方を復活（HP全快）'],
'Membangkitkan anggota yang tumbang dengan HP penuh.':['Revives a fallen member with full HP.','戦闘不能の味方をHP全快で復活させる。'],
'Revive All':['Revive All','リバイブオール'],'Hidupkan semua anggota tumbang (HP 50%)':['Revives all fallen members (50% HP)','戦闘不能の味方全員を復活（HP50%）'],
'Membangkitkan seluruh anggota tim yang tumbang sekaligus dengan setengah HP.':['Revives every fallen team member at once with half HP.','戦闘不能の味方全員をHP半分で一度に復活させる。'],
'Power Candy':['Power Candy','パワーキャンディ'],'ATK tim naik 3 ronde':['Team ATK up for 3 rounds','チームの攻撃が3ラウンド上昇'],
'Permen penguat. Serangan seluruh tim meningkat selama 3 ronde.':['A strengthening candy. The whole team\'s attack rises for 3 rounds.','強化キャンディ。チーム全員の攻撃が3ラウンド上がる。'],
'Guard Candy':['Guard Candy','ガードキャンディ'],'DEF tim naik 3 ronde':['Team DEF up for 3 rounds','チームの防御が3ラウンド上昇'],
'Permen pelindung. Pertahanan seluruh tim meningkat selama 3 ronde.':['A protective candy. The whole team\'s defense rises for 3 rounds.','守りのキャンディ。チーム全員の防御が3ラウンド上がる。'],
'Rainbow Candy':['Rainbow Candy','レインボーキャンディ'],'ATK & DEF tim naik 3 ronde':['Team ATK & DEF up for 3 rounds','チームの攻防が3ラウンド上昇'],
'Permen pelangi. Serangan dan pertahanan seluruh tim meningkat selama 3 ronde.':['A rainbow candy. The whole team\'s attack and defense rise for 3 rounds.','虹色のキャンディ。チーム全員の攻撃と防御が3ラウンド上がる。'],
'Time Sand':['Time Sand','タイムサンド'],'Reset cooldown semua skill tim':['Resets all team skill cooldowns','チーム全員のスキルCTをリセット'],
'Pasir waktu yang membuat semua skill dan persona seluruh tim langsung siap dipakai lagi.':['Sand of time that makes every skill and persona of the team ready to use again.','チーム全員のスキルとペルソナをすぐ使える状態に戻す時の砂。'],
'Spark Battery':['Spark Battery','スパークバッテリー'],'Isi gauge ALL-OUT +50%':['Fills the ALL-OUT gauge +50%','ALL-OUTゲージを+50%'],
'Baterai kilat yang mengisi setengah gauge ALL-OUT. Cepat siap menyerbu bersama.':['A lightning battery that fills half the ALL-OUT gauge. Get ready to rush together fast.','ALL-OUTゲージを半分溜める電池。すぐに総攻撃の準備ができる。'],
/* ---- dungeon ---- */
'ARCHIVE DEPTHS':['ARCHIVE DEPTHS','アーカイブの深淵'],
'RUANG LATIHAN':['TRAINING ROOM','訓練室'],'BRANKAS ARCHIVE':['ARCHIVE VAULT','アーカイブ金庫'],'RUANG HARTA':['TREASURE ROOM','宝物庫'],'JURANG HAMPA':['VOID ABYSS','虚無の深淵'],
'Penjaga Latihan':['Training Guardian','訓練の守護者'],'Penjaga Brankas':['Vault Guardian','金庫の守護者'],'Penjaga Harta':['Treasure Guardian','宝の守護者'],'Penguasa Jurang':['Lord of the Abyss','深淵の支配者'],
'EXP berlimpah. Cocok untuk naik level.':['Plenty of EXP. Great for leveling up.','EXPが豊富。レベル上げに最適。'],
'Banyak Yen, musuh lebih keras.':['Lots of Yen, tougher enemies.','円が大量。敵はやや強い。'],
'Banyak item (Potion & SP Drink) plus EXP lumayan.':['Lots of items (Potion & SP Drink) plus decent EXP.','アイテム（ポーション・SPドリンク）が大量、EXPもそこそこ。'],
'Turun terus sedalam mungkin. Hadiah terbesar, risiko terbesar.':['Descend as deep as you can. Biggest rewards, biggest risks.','できるだけ深く潜れ。報酬もリスクも最大。'],
'Tanpa batas lantai':['Endless floors','階層無制限'],
'Kalah = hadiah dungeon yang belum diambil hangus':['Lose = unclaimed dungeon rewards are lost','負けると未回収の報酬は失われる'],
'PERINGATAN HARDCORE: kalah = save terhapus!':['HARDCORE WARNING: lose = save deleted!','ハードコア警告：負けるとセーブが消える！'],
'Batal = mundur & ambil hadiah':['Cancel = retreat & claim rewards','キャンセル = 撤退して報酬を受け取る'],
'Mundur dari dungeon.':['Retreated from the dungeon.','ダンジョンから撤退した。'],
/* ---- side chapter ---- */
'SEMUA SIDE CHAPTER':['ALL SIDE CHAPTERS','全サイドチャプター'],
'SIDE CHAPTER SELESAI!':['SIDE CHAPTER CLEARED!','サイドチャプタークリア！'],
/* ---- chapter tab ---- */
'TAMAT':['THE END','完'],
'Semua chapter utama sudah kamu selesaikan. Pakai PILIH CHAPTER untuk mengulang chapter mana pun, atau lanjut farming lewat Dungeon & Side Chapter.':['You have cleared every main chapter. Use SELECT CHAPTER to replay any chapter, or keep farming through Dungeons & Side Chapters.','すべてのメインチャプターをクリアした。チャプター選択で好きな章を遊び直すか、ダンジョンとサイドチャプターで周回しよう。'],
'PILIH CHAPTER':['SELECT CHAPTER','チャプター選択'],
'LIHAT SEMUA SIDE CHAPTER':['VIEW ALL SIDE CHAPTERS','全サイドチャプターを見る'],
'CHAPTER SELECT':['CHAPTER SELECT','チャプター選択'],'Arahkan kursor ke chapter.':['Point the cursor at a chapter.','カーソルをチャプターに合わせてください。'],
'Kembali':['Back','戻る'],
/* ---- ending ---- */
'EPISODE CLEAR':['EPISODE CLEAR','エピソードクリア'],
'Semua chapter berhasil kamu selesaikan. Terima kasih sudah bermain! Kamu masih bisa farming di Dungeon dan Side Chapter, atau mengulang chapter mana pun.':['You cleared every chapter. Thank you for playing! You can still farm in Dungeons and Side Chapters, or replay any chapter.','すべてのチャプターをクリアしました。遊んでくれてありがとう！ダンジョンやサイドチャプターで周回したり、好きな章を遊び直せます。'],
'Lanjut Bebas (Hub)':['Free Play (Hub)','フリープレイ（ハブ）'],'Pilih Chapter':['Select Chapter','チャプター選択'],
'LAPORAN PETUALANGAN':['ADVENTURE REPORT','冒険レポート'],
'Kesulitan':['Difficulty','難易度'],'Chapter selesai':['Chapters cleared','クリアしたチャプター'],'Level Kael':['Kael\'s level','Kaelのレベル'],
'Protagonis terbuka':['Protagonists unlocked','解放した主人公'],'Dungeon tuntas':['Dungeons cleared','クリアしたダンジョン'],
'Rekor Jurang Hampa':['Void Abyss record','虚無の深淵の記録'],'Yen':['Yen','円'],
/* ---- istilah battle umum (cadangan; battle.js memakai teks sendiri) ---- */
'Attack':['Attack','攻撃'],'Guard':['Guard','防御'],'Skill':['Skill','スキル'],'Persona':['Persona','ペルソナ'],'Item':['Item','アイテム'],
'Escape':['Escape','逃走'],'ALL-OUT ATTACK':['ALL-OUT ATTACK','総攻撃'],'ALL-OUT':['ALL-OUT','総攻撃'],
/* ---- Kael Alternate ---- */
'KAEL ALTERNATE BERGABUNG!':['ALTERNATE KAEL HAS JOINED!','アルタネイト・ケイルが仲間に！'],
'Persona Dewa & Pahlawan Dunia':['Gods & World Heroes personas','神と世界の英雄のペルソナ'],
'Persona khusus: NEW HERO':['Special persona: NEW HERO','特別ペルソナ：NEW HERO'],
'Cek menu HUB > TEAM untuk memasukkannya ke tim.':['Check HUB > TEAM to add them to your party.','HUB > TEAM で仲間に加えよう。'],
'Tebasan Arsip':['Archive Slash','アーカイブ斬'],'Tebasan cepat dari halaman Archive yang terkoyak.':['A swift slash from a torn Archive page.','破れたアーカイブのページから放つ高速斬り。'],
'Segel Halaman':['Page Seal','ページの封印'],'Menyegel musuh dengan cahaya dari halaman suci.':['Seals the enemy with light from a sacred page.','聖なるページの光で敵を封じる。'],
'Bab Terakhir':['Final Chapter','最終章'],'Menutup bab hidup musuh dalam satu coretan tinta.':['Closes the enemy\'s chapter of life with a single stroke of ink.','インクのひと筆で敵の人生の章を閉じる。'],
'Dewa juru tulis. Menuliskan hukuman cahaya ke seluruh musuh.':['The scribe god. Writes a sentence of light upon all enemies.','書記の神。すべての敵に光の裁きを書き記す。'],
'Iblis pembuang dosa. Melempar kutukan gelap berat ke musuh.':['The scapegoat demon. Hurls a heavy dark curse at the enemy.','罪を流す悪魔。重い闇の呪いを敵に放つ。'],
'Tebasan Takdir':['Slash of Fate','運命の斬撃'],'Tebasan dari takdir yang sudah ditulis ulang.':['A slash from a rewritten fate.','書き換えられた運命から放つ斬撃。'],
'Cahaya Harapan':['Light of Hope','希望の光'],'Sinar harapan yang membakar keputusasaan musuh.':['A ray of hope that burns away the enemy\'s despair.','敵の絶望を焼き尽くす希望の光。'],
'Epilog Semesta':['Epilogue of the Universe','宇宙のエピローグ'],'Menulis epilog bagi musuh. Tidak ada bab sesudahnya.':['Writes an epilogue for the enemy. No chapter follows.','敵にエピローグを書く。その先に章はない。'],
'Persona khusus Kael Alternate. Wujud harapan dan takdir yang ditulis ulang: pahlawan baru yang menolak akhir cerita.':['Alternate Kael\'s special persona. Hope and rewritten fate given form: a new hero who refuses the story\'s ending.','アルタネイト・ケイル専用のペルソナ。書き換えられた希望と運命の化身：物語の結末を拒む新たな英雄。'],
'Dewi matahari Jepang. Cahaya fajar menghanguskan kegelapan.':['The Japanese sun goddess. Dawn light scorches the darkness.','日本の太陽神。暁の光が闇を焼き払う。'],
'Raja para dewa Olympus. Petir langit menyambar seluruh musuh.':['King of the Olympian gods. Lightning from the sky strikes every enemy.','オリュンポスの神々の王。天の雷がすべての敵を撃つ。'],
'Bapa para dewa Asgard. Tombak Gungnir tak pernah meleset.':['Father of the Asgardian gods. The spear Gungnir never misses.','アスガルドの神々の父。槍グングニルは決して外れない。'],
'Dewa badai pembunuh naga. Badai dan pedang dalam satu tebasan.':['The storm god and dragon slayer. Storm and sword in a single slash.','竜を討つ嵐の神。嵐と剣をひと太刀に込める。'],
'Pahlawan dua belas tugas. Kekuatan fisik tanpa tanding.':['Hero of the twelve labors. Unmatched physical strength.','十二の功業の英雄。比類なき怪力。'],
'Raja pahlawan Camelot. Excalibur membelah kegelapan.':['The hero king of Camelot. Excalibur cleaves the darkness.','キャメロットの英雄王。エクスカリバーが闇を裂く。'],
'Pahlawan Troya tak terkalahkan. Hanya satu titik lemah.':['The invincible hero of Troy. Only one weak point.','無敵のトロイアの英雄。弱点はただ一つ。'],
'Raja pahlawan pertama dunia. Gerbang harta menghujani musuh.':['The first hero king of the world. The gate of treasures rains on the enemy.','世界最初の英雄王。王の財宝の門が敵に降り注ぐ。'],
'Pahlawan Orleans. Api iman yang membakar keraguan.':['The Maid of Orleans. A flame of faith that burns away doubt.','オルレアンの乙女。迷いを焼く信仰の炎。'],
/* ---- SKILL KHAS karakter lain (G.EXCL_POOL) ---- */
'Tinju Badai':['Storm Fist','嵐拳'],'Rentetan pukulan beruntun yang mematahkan guard.':['A relentless flurry of punches that breaks guards.','ガードを砕く連続パンチの嵐。'],
'Api Janji':['Vow Flame','誓いの炎'],'Bola api bertekad yang membakar satu musuh.':['A fireball of resolve that burns one enemy.','決意の火球が敵1体を焼く。'],
'Embun Beku':['Frost Dew','凍てつく露'],'Kristal es menusuk dan melambatkan lawan.':['Piercing ice crystals that slow the foe.','突き刺さる氷晶が敵を鈍らせる。'],
'Sambaran Fajar':['Dawn Strike','暁の落雷'],'Petir cepat dari langit pagi.':['A swift lightning bolt from the morning sky.','朝の空から走る速い雷。'],
'Pusaran Senyap':['Silent Vortex','静寂の渦'],'Bilah angin tanpa suara menyayat musuh.':['Soundless wind blades slash the enemy.','音もない風の刃が敵を切り裂く。'],
'Lonceng Suci':['Holy Bell','聖なる鐘'],'Dentang suci yang menghantam musuh dengan cahaya.':['A sacred toll that strikes the enemy with light.','聖なる鐘の音が光となって敵を打つ。'],
'Bayang Kutukan':['Curse Shadow','呪いの影'],'Bayangan pekat yang menggerogoti jiwa lawan.':['A dense shadow that gnaws at the foe\'s soul.','濃い影が敵の魂を蝕む。'],
'Hantaman Meteor':['Meteor Smash','メテオスマッシュ'],'Menjatuhkan batu membara dari atas. Sangat kuat.':['Drops a blazing rock from above. Extremely powerful.','燃える岩を頭上から落とす。非常に強力。'],
'Badai Kristal':['Crystal Storm','クリスタルストーム'],'Hujan es tajam menghantam musuh.':['A rain of sharp ice pummels the enemy.','鋭い氷の雨が敵を襲う。'],
'Tarian Pedang':['Sword Dance','剣の舞'],'Rangkaian tebasan anggun bertenaga tinggi.':['A graceful chain of high-power slashes.','優雅で威力の高い連続斬り。'],
'Murka Langit':['Wrath of Heaven','天の怒り'],'Petir besar dari langit marah.':['A giant thunderbolt from the furious sky.','怒れる天から落ちる巨大な雷。'],
'Cahaya Penebus':['Redeeming Light','贖罪の光'],'Sinar penebus yang menghapus kesombongan musuh.':['A redeeming ray that erases the enemy\'s arrogance.','敵の慢心を消し去る贖罪の光。'],
/* ---- PERSONA KHAS karakter lain (G.EXCL_POOL) ---- */
'Iblis perjanjian. Menukar jiwa musuh dengan kehancuran.':['The demon of pacts. Trades the enemy\'s soul for destruction.','契約の悪魔。敵の魂を破壊と引き換えにする。'],
'Raksasa api. Menyapu musuh dengan pedang membara.':['The fire giant. Sweeps enemies with a blazing sword.','炎の巨人。燃え盛る剣で敵を薙ぎ払う。'],
'Dewa tipu daya. Serangan licik sulit dihindari.':['The trickster god. Cunning attacks are hard to dodge.','悪戯の神。狡猾な攻撃は避けにくい。'],
'Serigala pemusnah. Cabikan buas ke musuh.':['The wolf of ruin. Savage rending against the enemy.','破滅の狼。野蛮な爪牙で敵を引き裂く。'],
'Malaikat penyembuh. Hukuman cahaya yang lembut tapi pasti.':['The healing angel. A gentle but certain judgment of light.','癒しの天使。優しくも確実な光の裁き。'],
'Panglima langit. Pedang cahaya membelah musuh.':['Commander of the heavens. A sword of light cleaves the enemy.','天の軍団長。光の剣が敵を断つ。'],
'Pembawa terompet. Badai suci menghantam musuh.':['The trumpet bearer. A holy storm batters the enemy.','ラッパを吹く者。聖なる嵐が敵を打つ。'],
'Api cahaya Tuhan. Petir suci menyambar musuh.':['Flame of God\'s light. Holy lightning strikes the enemy.','神の光の炎。聖なる雷が敵を撃つ。']
});

/* =====================================================================
   POLA (teks yang mengandung angka / nama)
   ===================================================================== */
const T=s=>G.T(s);
const itemJA=s=>String(s).replace(/SP Drink/g,'SPドリンク').replace(/Potion/g,'ポーション');
G.addTRP(/^Pilih salah satu dari (\d+) slot save\.$/,'Choose one of $1 save slots.','セーブスロット$1個から選ぶ。');
G.addTRP(/^Slot (\d+)$/,null,'スロット$1');
G.addTRP(/^TERISI: ([\s\S]*)$/,(_,r)=>'FILLED: '+T(r),(_,r)=>'使用中: '+T(r));
G.addTRP(/^LEVEL (\d+)( \(MAX\))?$/,null,'レベル $1$2');
G.addTRP(/^LV (\d+)$/,null,'Lv $1');
G.addTRP(/^Protagonis: (.*)$/,'Protagonist: $1','主人公: $1');
G.addTRP(/^SLOT (SKILL|PERSONA) (\d+)\/(\d+)$/,null,(_,a,b,c)=>(a=='SKILL'?'スキル':'ペルソナ')+'スロット '+b+'/'+c);
G.addTRP(/^Hanya yang berstatus DIBAWA yang bisa dipakai di battle\. Maksimal (\d+) (skill|persona) \(yang bertanda SELALU AKTIF tidak dihitung\)\.$/,
 'Only EQUIPPED ones can be used in battle. Max $1 $2 (ALWAYS ON ones are not counted).',
 (_,n,k)=>'EQUIP中のものだけ戦闘で使える。最大'+n+'個の'+(k=='skill'?'スキル':'ペルソナ')+'（常時発動は数えない）。');
G.addTRP(/^Pasif, SELALU AKTIF\. Saat HP habis ia bangkit dengan (\d+)% HP dan ATK\/DEF naik tiap bangkit\. Hanya (\d+)x per battle; setelah itu Alternate Kael gugur\.$/,
 'Passive, ALWAYS ON. When HP hits zero, he rises again with $1% HP and ATK/DEF increase each time. Only $2x per battle; after that Alternate Kael falls for good.',
 'パッシブ・常時発動。HPが尽きるとHP$1%で復活し、復活のたびに攻撃/防御が上がる。1戦闘$2回まで。その後アルタネイト・ケイルは倒れる。');
G.addTRP(/^KHAS ([\s\S]*)$/,(_,r)=>'UNIQUE '+T(r),(_,r)=>'専用 '+T(r));
G.addTRP(/^Power (\S+)$/,null,'パワー $1');
G.addTRP(/^CD (\d+)$/,null,'CT $1');
G.addTRP(/^Harga (\d+)¥$/,'Price $1¥','価格 $1¥');
G.addTRP(/^Item kamu: (\d+)$/,'You have: $1','所持数: $1');
G.addTRP(/^Lawan musuh berlantai-lantai untuk EXP, Yen, dan item\. Setiap lantai selesai kamu boleh mundur membawa hadiah\. Kalah = hadiah dungeon yang belum diambil hangus\. Rekor Jurang Hampa: lantai (\d+)$/,
 'Fight through multi-floor enemies for EXP, Yen, and items. After each floor you may retreat with your rewards. Lose = unclaimed dungeon rewards are lost. Void Abyss record: floor $1',
 '階層を進んでEXP・円・アイテムを獲得。各階層クリア後に報酬を持って撤退できる。負けると未回収の報酬は失われる。虚無の深淵の記録：$1階');
G.addTRP(/^Dungeon tuntas: (\d+)x$/,'Dungeons cleared: $1x','ダンジョンクリア: $1回');
G.addTRP(/^(\d+) lantai$/,'$1 floors','$1階層');
G.addTRP(/^Lantai (\d+)$/,'Floor $1','$1階');
G.addTRP(/^Buka setelah Chapter (\d+) selesai$/,'Unlocks after Chapter $1 is cleared','チャプター$1クリア後に解放');
G.addTRP(/^Selesai (\d+)\/(\d+)$/,'Cleared $1/$2','クリア $1/$2');
G.addTRP(/^Tersedia (\d+)$/,'Available $1','挑戦可能 $1');
G.addTRP(/^Terkunci (\d+)\. Side chapter terbuka seiring kamu menamatkan chapter utama\.$/,
 'Locked $1. Side chapters unlock as you clear main chapters.','ロック中 $1。メインチャプターをクリアするとサイドチャプターが解放される。');
G.addTRP(/^(\d+) musuh$/,'$1 enemies','敵$1体');
G.addTRP(/^Hadiah ¥(\d+)(.*)$/,(_,y,r)=>'Reward ¥'+y+r,(_,y,r)=>'報酬 ¥'+y+itemJA(r));
G.addTRP(/^CHAPTER (\d+): (.*)$/,(_,a,b)=>'CHAPTER '+a+': '+T(b),(_,a,b)=>'チャプター'+a+': '+T(b));
G.addTRP(/^CHAPTER (\d+)$/,null,'チャプター$1');
G.addTRP(/^CH (\d+)$/,null,'第$1章');
G.addTRP(/^ST (\d+)\/(\d+)$/,null,'ステージ $1/$2');
G.addTRP(/^EPISODE (\d+)$/,null,'エピソード$1');
G.addTRP(/^Stage (\d+)\/(\d+)$/,null,'ステージ $1/$2');
G.addTRP(/^STAGE (\d+)$/,null,'ステージ$1');
G.addTRP(/^Boss: (.*)$/,null,'ボス: $1');
G.addTRP(/^LIHAT SEMUA SIDE CHAPTER \((\d+) tersedia\)$/,'VIEW ALL SIDE CHAPTERS ($1 available)','全サイドチャプターを見る（$1件）');
G.addTRP(/^Tersimpan di Slot (\d+)$/,'Saved to Slot $1','スロット$1に保存しました');
G.addTRP(/^Hapus Slot (\d+)\?$/,'Delete Slot $1?','スロット$1を削除しますか？');
G.addTRP(/^Slot (\d+) sudah terisi\. Timpa\?$/,'Slot $1 is already in use. Overwrite?','スロット$1は使用中です。上書きしますか？');
G.addTRP(/^Masuk (.*)\?$/,(_,n)=>'Enter '+T(n)+'?',(_,n)=>T(n)+'に入りますか？');
G.addTRP(/^Lantai (\d+) selesai!$/,'Floor $1 cleared!','$1階クリア！');
G.addTRP(/^Hadiah terkumpul: (.*)$/,(_,r)=>'Rewards collected: '+r,(_,r)=>'獲得済みの報酬: '+itemJA(r));
G.addTRP(/^OK = lanjut ke lantai (\d+)$/,'OK = continue to floor $1','OK = $1階へ進む');
G.addTRP(/^Kalah di lantai (\d+)\. Hadiah dungeon yang belum diambil hangus\.$/,'Defeated on floor $1. Unclaimed dungeon rewards are lost.','$1階で敗北。未回収の報酬は失われた。');
G.addTRP(/^(.*) TUNTAS! Bonus clear x1\.5$/,(_,n)=>T(n)+' CLEARED! Clear bonus x1.5',(_,n)=>T(n)+' クリア！クリアボーナス x1.5');
G.addTRP(/^\+(\d+) Potion$/,null,'+$1 ポーション');
G.addTRP(/^\+(\d+) SP Drink$/,null,'+$1 SPドリンク');
G.addTRP(/^PHOENIX! Alternate Kael bangkit dari abu \((\d+)\/(\d+)\) dan menjadi lebih kuat!( Ini kebangkitan terakhirnya\.)?$/,
 (_,a,b,c)=>`PHOENIX! Alternate Kael rises from the ashes (${a}/${b}) and grows stronger!`+(c?' This is his last revival.':''),
 (_,a,b,c)=>`フェニックス！アルタネイト・ケイルが灰から蘇り（${a}/${b}）、さらに強くなった！`+(c?'これが最後の復活だ。':''));
})();