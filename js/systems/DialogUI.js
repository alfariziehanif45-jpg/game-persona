/* =========================================================
   DialogUI.js — G.dialog(lines, done)
   MUAT FILE INI PALING AKHIR (setelah Story.js dan main.js dibaca),
   supaya menimpa G.dialog versi lama yang bikin error.

   Baris yang didukung:
     ['Nama','teks']                         dialog biasa
     ['Narator','teks'] / ['Suara','teks']   narasi (tanpa portrait)
     {choice:[{t:'pilihan',set:{flag:1},say:[['Nama','balasan']]}]}
     {if:'flag',then:[...],else:[...]}       percabangan
   Baris yang rusak/kosong dilewati, tidak membuat error.
   ========================================================= */
window.G=window.G||{};
(function(){
 if(!document.getElementById('dlg-style')){
  const s=document.createElement('style');s.id='dlg-style';
  s.textContent=`
  .scene .pt{position:absolute;left:6%;bottom:190px;height:62%;max-height:480px;pointer-events:none}
  .scene .pt img{height:100%;display:block;border:3px solid #fff;background:#111;box-shadow:8px 8px 0 #e60012;transform:skewX(-3deg)}
  .scene .dlg.narr p{font-style:italic;color:#ddd}
  .scene .dlg.narr .who{display:none}
  .scene .dlg.lock{pointer-events:none;opacity:.35}
  .scene .dch{position:absolute;left:12%;right:12%;top:20%;display:flex;flex-direction:column;gap:14px;z-index:5}
  .scene .dch button{background:#0a0a0a;color:#fff;border:3px solid #fff;padding:14px 22px;font-size:20px;font-style:italic;font-weight:800;text-align:left;cursor:pointer;transform:skewX(-6deg);box-shadow:6px 6px 0 #e60012;transition:.15s;width:auto;height:auto;margin:0}
  .scene .dch button:hover{background:#e60012;transform:skewX(-6deg) translateX(14px)}`;
  document.head.appendChild(s);
 }
 const NARR=['narator','suara','???'];
 const PORT=['kael','naoya','tatsuya','makoto','yu','ren'];
 const esc=x=>String(x==null?'':x).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));

 function expand(lines,F){
  const out=[];
  (Array.isArray(lines)?lines:[]).forEach(l=>{
   if(!l)return;
   if(!Array.isArray(l)&&l.if!==undefined)out.push(...expand(F[l.if]?l.then:l.else,F));
   else out.push(l);
  });
  return out;
 }

 let tm=null;
 G.dialog=(lines,done)=>{
  clearInterval(tm);
  G.state=G.state||{};G.state.flags=G.state.flags||{};
  const F=G.state.flags,q=expand(lines,F),a=document.getElementById('app');
  let i=0,full='',typing=0,finished=0;
  const finish=()=>{if(finished)return;finished=1;clearInterval(tm);if(typeof done==='function')done()};

  const show=()=>{
   clearInterval(tm);
   if(i>=q.length)return finish();
   const l=q[i];

   /* ---- pilihan ---- */
   if(!Array.isArray(l)&&l.choice){
    const dl=a.querySelector('.dlg');
    if(!a.querySelector('.scene'))a.innerHTML='<div class="scene"></div>';
    if(dl)dl.classList.add('lock');
    const box=document.createElement('div');box.className='dch';
    l.choice.forEach(o=>{
     const b=document.createElement('button');b.textContent='▶ '+(o.t||'...');
     b.onclick=ev=>{
      ev.stopPropagation();
      Object.assign(F,o.set||{});
      q.splice(i+1,0,...expand(o.say,F));
      i++;show();
     };
     box.appendChild(b);
    });
    a.querySelector('.scene').appendChild(box);
    return;
   }

   /* ---- baris dialog ---- */
   if(!Array.isArray(l)||l.length<2){i++;return show()}   // baris rusak: lewati
   const w=String(l[0]);full=String(l[1]);
   const key=w.toLowerCase(),narr=NARR.includes(key),pt=PORT.includes(key)?key:'';
   a.innerHTML=`<div class="scene">${pt?`<div class="pt"><img src="assets/characters/${pt}.png" onerror="this.style.display='none'"></div>`:''}`+
    `<div class="dlg ${narr?'narr':''}" id="d"><div class="who">${esc(w)}</div><p id="t"></p><div class="next">&#9654; KLIK</div></div></div>`;
   const t=document.getElementById('t'),d=document.getElementById('d');
   let n=0;typing=1;
   tm=setInterval(()=>{
    if(!t||!t.isConnected){clearInterval(tm);typing=0;return}   // layar sudah berganti
    t.textContent=full.slice(0,++n);
    if(n>=full.length){clearInterval(tm);typing=0}
   },25);
   d.onclick=()=>{
    if(typing){clearInterval(tm);t.textContent=full;typing=0}
    else{i++;show()}
   };
  };
  show();
 };
})();