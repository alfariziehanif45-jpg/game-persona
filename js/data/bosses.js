/* =========================================================
   bosses.js — BOSS SYSTEM
   Setiap boss: 2-3 phase, HP bar khusus, Ultimate, mekanik unik,
   pola serang berubah tiap phase, dan kelemahan TERSEMBUNYI
   (terungkap saat terkena / lewat skill Scan "Insight" Yu).
   Cocokkan boss dengan nama di G.CHAPTERS[].boss.
   Field phase:
     at     : phase mulai saat HP <= at (pecahan, 1 = awal)
     n      : nama phase         pat: pola aksi (diulang)
     atkm   : pengali ATK        acts: aksi per giliran
     heal   : pulihkan % HP saat masuk phase
     mech   : barrier | reflect | revive | null     refl: elemen pantulan
     weak/res/imm : mengganti kelemahan saat phase berganti
     finish : true = incar anggota HP < 30%
   Aksi pola: atk heavy aoe debuff drain charge guard enrage
   'charge' = kumpul tenaga; giliran berikutnya ULTIMATE meledak,
   kecuali digagalkan dengan serangan ke kelemahan boss (atau di-GUARD).
   Muat SEBELUM Battle.js
   ========================================================= */
window.G=window.G||{};
G.BOSSES={
'Penjaga Retakan':{lv:3,hp:260,atk:9,xp:120,weak:['elec'],res:['phys'],imm:[],
 ult:{n:'Fissure Collapse',m:2.2},
 phases:[
  {at:1,  n:'Gerbang Retak',   pat:['atk','atk','aoe','charge']},
  {at:.5, n:'Retakan Meluas',  pat:['atk','aoe','debuff','charge'],atkm:1.25,msg:'Retakan membesar!'}]},

'Pemakan Kota':{lv:5,hp:340,atk:10,xp:150,weak:['fire'],res:['curse'],imm:['ice'],
 ult:{n:'Devour Block',m:2.3},
 phases:[
  {at:1,  n:'Lapar',           pat:['atk','heavy','atk','charge']},
  {at:.55,n:'Kenyang',         pat:['drain','aoe','atk','charge'],atkm:1.2,mech:'barrier',msg:'Kulit pelindungnya mengeras!'}]},

'Zio Shade':{lv:7,hp:430,atk:11,xp:190,weak:['wind'],res:['phys'],imm:['elec'],
 ult:{n:'Mazionga Void',m:2.4},
 phases:[
  {at:1,  n:'Bayangan Petir',  pat:['atk','atk','heavy','charge']},
  {at:.66,n:'Badai Listrik',   pat:['aoe','atk','debuff','charge'],atkm:1.2,msg:'Petir menyambar liar!'},
  {at:.33,n:'Zio Murka',       pat:['aoe','heavy','aoe','charge'],atkm:1.4,acts:1,finish:true,msg:'Zio Shade murka!'}]},

'Echo Sovereign':{lv:9,hp:520,atk:12,xp:230,weak:['curse'],res:['bless'],imm:[],
 ult:{n:'Echo of Ruin',m:2.4},
 phases:[
  {at:1,  n:'Gema Pertama',    pat:['atk','aoe','atk','charge']},
  {at:.5, n:'Gema Pemantul',   pat:['heavy','atk','debuff','charge'],atkm:1.25,mech:'reflect',refl:'fire',msg:'Dia memantulkan api! Ganti elemen!'}]},

'Joker Sin':{lv:11,hp:620,atk:14,xp:280,weak:['bless'],res:['curse'],imm:[],
 ult:{n:'Judgement Card',m:2.5},
 phases:[
  {at:1,  n:'Kartu Dosa',      pat:['atk','atk','drain','charge']},
  {at:.66,n:'Kartu Hukuman',   pat:['aoe','heavy','atk','charge'],atkm:1.2,mech:'revive',msg:'Takdir tidak bisa dihapus!'},
  {at:.33,n:'Joker Liar',      pat:['heavy','aoe','heavy','charge'],atkm:1.45,finish:true}]},

'Shadow Hour':{lv:13,hp:700,atk:15,xp:330,weak:['bless'],res:['phys'],imm:[],
 ult:{n:'Twenty-Fifth Hour',m:2.6},
 phases:[
  {at:1,  n:'Jam Berhenti',    pat:['atk','guard','heavy','charge']},
  {at:.5, n:'Jam ke-25',       pat:['aoe','debuff','heavy','charge'],atkm:1.3,mech:'barrier',weak:['phys','bless'],msg:'Waktu membeku! Pecahkan barrier!'}]},

'Fog Lord':{lv:15,hp:780,atk:16,xp:380,weak:['fire'],res:['ice','wind'],imm:[],
 ult:{n:'Dense Fog',m:2.6},
 phases:[
  {at:1,  n:'Kabut Tipis',     pat:['debuff','atk','atk','charge']},
  {at:.6, n:'Kabut Pekat',     pat:['aoe','debuff','heavy','charge'],atkm:1.25,mech:'reflect',refl:'ice',msg:'Kabut memantulkan es!'},
  {at:.3, n:'Penguasa Kabut',  pat:['aoe','heavy','aoe','charge'],atkm:1.45,mech:null,finish:true}]},

'Mirror Self':{lv:17,hp:860,atk:18,xp:430,weak:['curse'],res:['bless'],imm:[],
 ult:{n:'Shattered Mirror',m:2.7},
 phases:[
  {at:1,  n:'Cermin Pertama',  pat:['atk','heavy','atk','charge']},
  {at:.66,n:'Cermin Retak',    pat:['aoe','atk','drain','charge'],atkm:1.2,weak:['bless'],res:['curse'],msg:'Kelemahannya berubah!'},
  {at:.33,n:'Diri Sejati',     pat:['heavy','aoe','heavy','charge'],atkm:1.4,weak:['phys'],res:['bless'],mech:'reflect',refl:'curse',finish:true,msg:'Kelemahannya berubah lagi!'}]},

'Archivist Nyx':{lv:19,hp:980,atk:19,xp:500,weak:['ice','bless'],res:['curse'],imm:[],
 ult:{n:'Close The Book',m:2.8},
 phases:[
  {at:1,  n:'Penjaga Arsip',   pat:['atk','debuff','aoe','charge']},
  {at:.66,n:'Halaman Terlarang',pat:['aoe','atk','heavy','charge'],atkm:1.25,mech:'barrier',msg:'Arsip melindunginya!'},
  {at:.33,n:'Buku Tertutup',   pat:['aoe','heavy','charge'],atkm:1.5,acts:2,finish:true,mech:'revive',msg:'Nyx menulis ulang takdirnya!'}]},

'Hollow Eclipse':{lv:22,hp:1250,atk:21,xp:800,weak:['bless'],res:['phys'],imm:[],
 ult:{n:'Eclipse Verdict',m:3},
 phases:[
  {at:1,  n:'Gerhana Awal',    pat:['atk','aoe','heavy','charge']},
  {at:.66,n:'Gerhana Sebagian',pat:['aoe','debuff','heavy','charge'],atkm:1.25,weak:['ice'],res:['bless'],mech:'barrier',msg:'Gerhana menutup cahaya!'},
  {at:.33,n:'Gerhana Total',   pat:['heavy','aoe','aoe','charge'],atkm:1.5,acts:2,weak:['curse'],res:['ice'],mech:'reflect',refl:'bless',finish:true,msg:'GERHANA TOTAL!'}]}
};
(function(){G.EMOJI=G.EMOJI||{};Object.keys(G.BOSSES).forEach(n=>{G.BOSSES[n].boss=1;if(!G.EMOJI[n])G.EMOJI[n]='👁️'})})();