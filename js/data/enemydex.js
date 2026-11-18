/* =========================================================
   enemydex.js — ENEMY SYSTEM (data musuh biasa)
   4 kategori:
     normal  : serangan sederhana
     elite   : kuat, enrage saat HP < 50%, serangan area tiap 3 giliran
     support : menyembuhkan / buff sekutu, debuff tim
     special : mekanik unik (barrier / reflect / revive)
   Tiap musuh: lv, weak (kelemahan), res (resist), imm (immune), el (elemen serangan)
   Musuh dengan nama yang SAMA seperti di sini otomatis memakai data ini
   (nilai hp/atk/xp dari Enemies.js lama tetap dipakai kalau ada).
   Muat SEBELUM Battle.js
   ========================================================= */
window.G=window.G||{};
G.CATS={normal:{n:'NORMAL',hp:30,atk:5,xp:10},elite:{n:'ELITE',hp:95,atk:9,xp:38},support:{n:'SUPPORT',hp:48,atk:4,xp:22},special:{n:'SPECIAL',hp:75,atk:7,xp:32},boss:{n:'BOSS',hp:400,atk:10,xp:150}};

G.ENEMYDEX={
 /* --- NORMAL --- */
 'Shadow Grunt':{cat:'normal',e:'👤',lv:1,weak:['elec'],res:['phys'],imm:[]},
 'Void Slime':  {cat:'normal',e:'🫧',lv:1,weak:['fire'],res:['ice'],imm:[]},
 'Lost Pixie':  {cat:'normal',e:'🧚',lv:2,weak:['wind'],res:['bless'],imm:[]},
 /* --- ELITE --- */
 'Eclipse Knight':{cat:'elite',e:'🗡️',lv:4,weak:['ice'],res:['fire','phys'],imm:['curse'],aoeN:'Eclipse Sweep'},
 'Crimson Warden':{cat:'elite',e:'🔴',lv:5,weak:['bless'],res:['curse'],imm:[],aoeN:'Crimson Wave'},
 /* --- SUPPORT --- */
 'Pixie Medic':   {cat:'support',e:'💉',lv:3,weak:['phys'],res:['bless'],imm:[],healPct:.35},
 'Archive Scribe':{cat:'support',e:'📜',lv:3,weak:['fire'],res:['ice'],imm:[]},
 'Mirage Hexer':  {cat:'support',e:'🔮',lv:4,weak:['elec'],res:['curse'],imm:[]},
 /* --- SPECIAL --- */
 'Mirror Mimic':  {cat:'special',e:'🪞',lv:4,weak:['curse'],res:[],imm:[],mech:'reflect',refl:'fire',
                   hint:'Memantulkan elemen tertentu — ganti elemen serangan!'},
 'Barrier Golem': {cat:'special',e:'🗿',lv:5,weak:['elec'],res:['phys'],imm:[],mech:'barrier',
                   hint:'Barrier menahan 75% damage. Pecahkan dengan kelemahannya!'},
 'Phoenix Wisp':  {cat:'special',e:'🔥',lv:5,weak:['ice'],res:['fire'],imm:['fire'],mech:'revive',
                   hint:'Bangkit sekali. Habisi dengan kelemahannya agar tidak bangkit!'}
};

/* emoji untuk musuh baru (pakai G.EMOJI yang sudah ada di game) */
(function(){G.EMOJI=G.EMOJI||{};Object.keys(G.ENEMYDEX).forEach(n=>{if(!G.EMOJI[n])G.EMOJI[n]=G.ENEMYDEX[n].e||'👹'})})();

/* Buat musuh baru lengkap dengan stat berdasar kategori & level:
     G.spawn('Pixie Medic')       -> {n,hp,atk,xp,...}
     G.spawn('Shadow Grunt',3)    -> level 3
   Pakai untuk mengisi array musuh yang dikirim ke G.battle(...)         */
G.spawn=(name,lv)=>{const t=G.ENEMYDEX[name];if(!t)throw new Error('Musuh tidak ada di ENEMYDEX: '+name);
 const c=G.CATS[t.cat]||G.CATS.normal,L=Math.max(1,+lv||t.lv||1);
 const hp=Math.round((t.hp||c.hp)*(1+.25*(L-1))),atk=Math.round((t.atk||c.atk)*(1+.15*(L-1))),xp=Math.round((t.xp||c.xp)*(1+.2*(L-1)));
 return Object.assign(JSON.parse(JSON.stringify(t)),{n:name,lv:L,hp,max:hp,atk,xp})};

/* Contoh formasi per chapter, tinggal dipanggil dari main.js / Story.js:
     G.battle(G.formation(3), cb)                                        */
G.formation=ch=>{const F=[
 ['Shadow Grunt','Void Slime'],
 ['Shadow Grunt','Lost Pixie','Void Slime'],
 ['Eclipse Knight','Pixie Medic'],
 ['Mirror Mimic','Archive Scribe','Shadow Grunt'],
 ['Crimson Warden','Mirage Hexer'],
 ['Barrier Golem','Pixie Medic','Lost Pixie'],
 ['Eclipse Knight','Mirror Mimic','Archive Scribe'],
 ['Phoenix Wisp','Crimson Warden'],
 ['Barrier Golem','Mirage Hexer','Pixie Medic','Eclipse Knight'],
 ['Phoenix Wisp','Mirror Mimic','Crimson Warden']][Math.max(0,Math.min(9,ch-1))];
 return F.map(n=>G.spawn(n,Math.max(1,ch)))};