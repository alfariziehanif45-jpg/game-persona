window.G=window.G||{};
G.dialog=(lines,done)=>{let i=0,tm,full,typing;const a=document.getElementById('app');
 const show=()=>{if(i>=lines.length)return done();const w=lines[i][0];full=lines[i][1];let n=0;typing=1;
  a.innerHTML=`<div class="scene"><div class="dlg" id="d"><div class="who">${w}</div><p id="t"></p><div class="next">&#9654; KLIK</div></div></div>`;
  const t=document.getElementById('t');clearInterval(tm);
  tm=setInterval(()=>{t.textContent=full.slice(0,++n);if(n>=full.length){clearInterval(tm);typing=0}},25);
  document.getElementById('d').onclick=()=>{if(typing){clearInterval(tm);t.textContent=full;typing=0}else{i++;show()}}};show()};