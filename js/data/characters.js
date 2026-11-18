// Karakter party. join = nomor chapter (mulai 1) saat bergabung.
window.G=window.G||{};
G.CHARS={
 kael:{n:'Kael',hp:100,sp:40,atk:12,def:6,sk:['Void Slash',24,8],join:1},
 naoya:{n:'Naoya (P1)',hp:90,sp:35,atk:11,def:6,sk:['Zio Burst',22,7],join:3},
 tatsuya:{n:'Tatsuya (P2)',hp:95,sp:35,atk:13,def:5,sk:['Sin Strike',25,8],join:5},
 makoto:{n:'Makoto (P3)',hp:110,sp:30,atk:14,def:7,sk:['Twilight Cut',26,9],join:6},
 yu:{n:'Yu (P4)',hp:105,sp:40,atk:13,def:7,sk:['Izanagi Rush',26,9],join:8},
 ren:{n:'Ren (P5)',hp:100,sp:45,atk:15,def:6,sk:['Arsene Gun',30,10],join:10}
};
G.stat=(id,lv,k)=>Math.round(G.CHARS[id][k]*(1+0.13*(lv-1)));
G.need=lv=>lv*30;