/* =========================================================
   team.js — TEAM SYSTEM
   - Maks 4 karakter aktif (G.state.party), sisanya cadangan
   - Role, elemen, dan skill khas (signature) tiap karakter
   - Bond (G.state.team.bond) membuka skill KOMBINASI
   Muat SEBELUM Battle.js
   ========================================================= */
window.G=window.G||{};

/* ---------- Elemen ---------- */
G.ELEM={
 fire:{n:'Fire',e:'🔥'},ice:{n:'Ice',e:'❄️'},elec:{n:'Elec',e:'⚡'},wind:{n:'Wind',e:'🌪️'},
 bless:{n:'Bless',e:'✨'},curse:{n:'Curse',e:'💀'},phys:{n:'Phys',e:'🗡️'},
 void:{n:'Void',e:'🌀'} /* Void: tidak kena weak/resist/immune */
};

/* ---------- Role (pengali stat) ---------- */
G.ROLES={
 attacker:{n:'Attacker',e:'⚔️',atk:1.15,def:.95,hp:.95,heal:.9, d:'Damage tinggi'},
 tank:    {n:'Tank',    e:'🛡️',atk:.9, def:1.4,hp:1.3,heal:1,  d:'HP & DEF besar, bisa menarik serangan'},
 healer:  {n:'Healer',  e:'💚',atk:.9, def:1,  hp:1,  heal:1.35,d:'Penyembuh tim'},
 support: {n:'Support', e:'🎵',atk:.95,def:1,  hp:1,  heal:1.1, d:'Buff tim & analisis musuh'},
 debuffer:{n:'Debuffer',e:'🌀',atk:1,  def:1,  hp:1,  heal:1,   d:'Melemahkan musuh'}
};

/* ---------- Data tiap karakter: role, elemen, skill khas ----------
   k: dmg | aoe | drain | heal | healall | taunt | debuff | scan
   x (efek tambahan): defup | atkup | spup | scan | weakdown            */
G.TEAMDATA={
 kael:   {role:'attacker',elem:'void', sig:{id:'sig_kael',   n:'Void Rend',      k:'dmg',    pow:80,sp:14,el:'void', d:'Tebasan Void, menembus resist & immune'}},
 naoya:  {role:'tank',    elem:'phys', sig:{id:'sig_naoya',  n:'Iron Provoke',   k:'taunt',  pow:0, sp:8, d:'Tarik serangan musuh, DEF naik 2 giliran'}},
 tatsuya:{role:'debuffer',elem:'fire', sig:{id:'sig_tatsuya',n:'Rumor Brand',    k:'debuff', pow:0, sp:10,d:'ATK & DEF semua musuh turun 3 giliran'}},
 makoto: {role:'healer',  elem:'ice',  sig:{id:'sig_makoto', n:'Midnight Heal',  k:'healall',pow:40,sp:16,d:'Pulihkan HP seluruh tim'}},
 yu:     {role:'support', elem:'elec', sig:{id:'sig_yu',     n:'Insight',        k:'scan',   pow:0, sp:8, x:'atkup',d:'Ungkap kelemahan musuh + ATK tim naik'}},
 ren:    {role:'attacker',elem:'curse',sig:{id:'sig_ren',    n:'Eiha Overdrive', k:'dmg',    pow:90,sp:18,el:'curse',d:'Kutukan kuat ke satu musuh'}}
};

/* ---------- Skill KOMBINASI (butuh Bond) ----------
   a & b = pasangan (keduanya harus aktif & hidup di tim).
   need = level Bond minimum (Bond terendah di antara keduanya).
   Bisa dipakai oleh a ATAU b. SP dipotong dari pemakai.             */
G.COMBOS=[
 {id:'bastion', a:'kael',b:'naoya',  n:'Void Bastion',     k:'aoe',    pow:60, sp:18,el:'void', x:'defup',   need:2,d:'Serang semua musuh + DEF tim naik'},
 {id:'verdict', a:'kael',b:'tatsuya',n:'Crimson Verdict',  k:'dmg',    pow:120,sp:22,el:'fire', x:'weakdown',need:2,d:'Api membakar satu musuh + DEF musuh turun'},
 {id:'hymn',    a:'kael',b:'makoto', n:'Archive Hymn',     k:'healall',pow:55, sp:20,           x:'spup',    need:2,d:'Pulihkan tim + SP tim +10'},
 {id:'sunder',  a:'kael',b:'yu',     n:'Truth Sunder',     k:'dmg',    pow:105,sp:20,el:'elec', x:'scan',    need:3,d:'Sambaran + ungkap semua kelemahan'},
 {id:'rewrite', a:'kael',b:'ren',    n:'Phantom Rewrite',  k:'aoe',    pow:90, sp:26,el:'curse',x:'atkup',   need:3,d:'Kutukan ke semua musuh + ATK tim naik'},
 {id:'fog',     a:'ren', b:'yu',     n:'Thieves of Fog',   k:'aoe',    pow:70, sp:22,el:'wind', x:'weakdown',need:3,d:'Badai kabut ke semua musuh + DEF musuh turun'},
 {id:'hour',    a:'naoya',b:'makoto',n:'Iron Hour',        k:'healall',pow:45, sp:18,           x:'defup',   need:3,d:'Pulihkan tim + DEF tim naik'},
 {id:'rumor',   a:'tatsuya',b:'ren', n:'Rumor Heist',      k:'dmg',    pow:130,sp:24,el:'curse',x:'weakdown',need:4,d:'Pukulan telak + DEF musuh turun'}
];

/* ---------- API Tim ---------- */
G.team={
 MAX:4,
 BOND_AT:[0,3,8,15,25],  /* poin Bond -> level 1..5 */
 T(){const S=G.state;S.team=S.team||{};S.team.bond=S.team.bond||{};S.team.bf=S.team.bf||{};return S.team},
 /* daftar protagonis yang sudah bergabung.
    Otomatis membaca G.state.unlocked / owned / roster; kalau tidak ada, pakai G.state.lv */
 roster(){const S=G.state;let ids;const pick=v=>Array.isArray(v)?v.slice():(v&&typeof v=='object'?Object.keys(v).filter(k=>v[k]):null);
  ids=pick(S.unlocked)||pick(S.owned)||pick(S.roster)||Object.keys(S.lv||{});
  (S.party||[]).forEach(id=>{if(!ids.includes(id))ids.push(id)});
  return ids.filter(id=>G.CHARS&&G.CHARS[id])},
 active(){return G.state.party||[]},
 reserve(){const a=this.active();return this.roster().filter(id=>!a.includes(id))},
 /* aktifkan / nonaktifkan (dipakai layar TEAM) */
 toggle(id){const p=G.state.party,k=p.indexOf(id);
  if(k>=0){if(p.length<=1)return{ok:0,msg:'Minimal 1 anggota aktif'};p.splice(k,1);return{ok:1,msg:id+' masuk cadangan'}}
  if(p.length>=this.MAX)return{ok:0,msg:'Tim penuh (maks '+this.MAX+')'};
  if(!this.roster().includes(id))return{ok:0,msg:'Belum bergabung'};
  p.push(id);return{ok:1,msg:id+' masuk tim aktif'}},
 /* Bond */
 bond(id){if(id=='kael')return 99;return this.T().bond[id]||0},
 bondLv(id){const b=this.bond(id);let l=1;this.BOND_AT.forEach((v,i)=>{if(b>=v)l=i+1});return l},
 addBond(id,n){if(id=='kael')return;const T=this.T();T.bond[id]=(T.bond[id]||0)+(n||1)},
 /* ubah pilihan dialog (flag naoya_bond dst) jadi poin Bond awal, sekali saja */
 sync(){const T=this.T(),F=G.state.flags||{};Object.keys(G.TEAMDATA).forEach(id=>{if(id=='kael')return;if(F[id+'_bond']&&!T.bf[id]){T.bf[id]=1;T.bond[id]=(T.bond[id]||0)+3}})},
 /* kartu info karakter (role, elemen, skill, bond) untuk layar TEAM */
 card(id){const td=G.TEAMDATA[id]||{},ro=G.ROLES[td.role]||{},el=G.ELEM[td.elem]||{},C=G.CHARS[id]||{};
  const cb=G.COMBOS.filter(c=>c.a==id||c.b==id).map(c=>c.n).join(', ')||'-';
  return `<div class="tcard"><b>${C.n||id}</b> ${ro.e||''} ${ro.n||''} &bull; ${el.e||''} ${el.n||''}<br>`+
   `Skill khas: ${td.sig?td.sig.n:'-'}<br>Bond Lv ${id=='kael'?'MAX':this.bondLv(id)} (${this.bond(id)==99?'-':this.bond(id)} pt)<br>Combo: ${cb}</div>`}
};