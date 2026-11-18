G.ENEMIES=['Shade Hollow','Cinder Wraith','Echo Beast','Fallen Arcana','Eclipse Knight'];
G.DIFF={easy:{n:'Easy',e:.7,d:.7,x:1.2},normal:{n:'Normal',e:1,d:1,x:1},hard:{n:'Hard',e:1.4,d:1.3,x:.9},hardcore:{n:'Hardcore',e:1.9,d:1.7,x:.8,perma:true}};
// Balance: musuh lebih lunak. Naikkan angka-angka di bawah kalau terasa terlalu mudah.
G.mkEnemy=(ch,st,boss,name)=>{const l=ch*2+st,m=G.DIFF[G.state.diff];
 const hp=Math.round((28+l*7)*(boss?2.2:1)*m.e);
 return{n:name||G.ENEMIES[(ch+st)%5],hp,max:hp,atk:Math.round((4+l*.9)*(boss?1.3:1)*m.d),xp:Math.round((12+l*4)*(boss?3:1)*m.x)}};
// Ikon emoji musuh (ganti sesuka hati)
G.EMOJI={'Shade Hollow':'👻','Cinder Wraith':'🔥','Echo Beast':'🐺','Fallen Arcana':'🃏','Eclipse Knight':'🛡️','Penjaga Retakan':'🗿','Pemakan Kota':'🐛','Zio Shade':'⚡','Echo Sovereign':'👑','Joker Sin':'🤡','Shadow Hour':'🕛','Fog Lord':'🌫️','Mirror Self':'🪞','Archivist Nyx':'📖','Hollow Eclipse':'🌑'};