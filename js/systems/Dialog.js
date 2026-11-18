/* =========================================================
   Dialog.js — mesin dialog/visual novel PESONA
   Pakai:  Dialog.play(script, {flags, onEnd})
   Baris script:
   {bg:'void'}                       ganti latar (void|glitch|dawn|'')
   {title:'JUDUL', sub:'teks kecil'}  layar judul
   {n:'KAEL', who:'kael', t:'teks'}   dialog (who = file portrait)
   {narr:'teks'}                     narasi tanpa nama
   {show:['kael','naoya']}           atur siapa tampil di layar
   {choice:[{t:'..', set:{flag:1}, say:[...baris balasan]}]}
   {toast:'Bond naik'}               notifikasi kecil
   {ifFlag:'ramah', then:[...], else:[...]}  percabangan
   ========================================================= */
window.Dialog=(()=>{
  const PORT='assets/characters/';
  let root,cur,idx,flags,onEnd,queue,typing,timer,full,stage,show=[],busy=false;

  const el=(c,h)=>{const d=document.createElement('div');d.className=c;if(h!=null)d.innerHTML=h;return d};

  function setShow(list){
    show=list||[];
    stage.innerHTML='';
    show.forEach(id=>{
      const s=el('sp');s.dataset.id=id;
      s.innerHTML=`<img src="${PORT}${id}.png" alt="${id}" onerror="this.style.display='none'">`;
      stage.appendChild(s);
      requestAnimationFrame(()=>s.classList.add('on'));
    });
  }
  function focus(id){[...stage.children].forEach(s=>s.classList.toggle('talk',s.dataset.id===id))}

  function type(text,node,done){
    clearInterval(timer);typing=true;full=text;let i=0;node.textContent='';
    timer=setInterval(()=>{
      node.textContent=text.slice(0,++i);
      if(i>=text.length){clearInterval(timer);typing=false;done&&done()}
    },22);
  }

  function expand(lines){ // proses ifFlag jadi baris biasa
    const out=[];
    lines.forEach(l=>{
      if(l.ifFlag!==undefined){out.push(...expand(flags[l.ifFlag]?(l.then||[]):(l.else||[])))}
      else out.push(l);
    });
    return out;
  }

  function next(){
    if(busy)return;
    if(idx>=queue.length)return finish();
    const l=queue[idx++];
    if(l.bg!==undefined){root.querySelector('.bg').className='bg '+l.bg;if(l.n==null&&!l.t&&!l.narr&&!l.show&&!l.title&&!l.choice&&!l.toast)return next()}
    if(l.show){setShow(l.show);if(!l.t&&!l.narr&&!l.choice)return next()}
    if(l.toast){const t=el('toast',l.toast);root.appendChild(t);setTimeout(()=>t.remove(),2200);if(!l.t&&!l.narr)return next()}
    if(l.title){
      busy=true;
      const t=el('title',`<h1>${l.title}</h1><p>${l.sub||''}</p>`);
      root.appendChild(t);
      setTimeout(()=>{t.remove();busy=false;next()},3200);return;
    }
    if(l.choice){
      busy=true;
      const c=el('choices');
      l.choice.forEach(o=>{
        const b=document.createElement('button');b.textContent='▶ '+o.t;
        b.onclick=()=>{
          Object.assign(flags,o.set||{});
          c.remove();busy=false;
          queue.splice(idx,0,...expand(o.say||[]));
          next();
        };
        c.appendChild(b);
      });
      root.appendChild(c);return;
    }
    // dialog biasa / narasi
    const name=root.querySelector('.name'),txt=root.querySelector('.txt');
    if(l.narr){name.style.display='none';txt.classList.add('narr');focus(null);type(l.narr,txt)}
    else{
      name.style.display='';name.textContent=l.n||'';txt.classList.remove('narr');
      focus(l.who);type(l.t,txt);
    }
    root.querySelector('.nxt').style.visibility='hidden';
    const unhide=()=>root.querySelector('.nxt').style.visibility='visible';
    const iv=setInterval(()=>{if(!typing){unhide();clearInterval(iv)}},100);
  }

  function advance(){
    if(busy)return;
    if(typing){clearInterval(timer);typing=false;root.querySelector('.txt').textContent=full;return}
    next();
  }

  function finish(){
    document.removeEventListener('keydown',keys);
    root.remove();root=null;
    onEnd&&onEnd(flags);
  }
  function keys(e){
    if(['Enter',' ','z','Z'].includes(e.key)){e.preventDefault();advance()}
    if(e.key==='Escape'&&root){finish()}
  }

  function play(script,opt={}){
    if(root)root.remove();
    flags=opt.flags||{};onEnd=opt.onEnd;idx=0;busy=false;
    queue=expand(script);
    root=el('');root.id='dlg';
    root.append(el('bg'),(stage=el('stage')));
    const box=el('box','<div class="name"></div><div class="txt"></div><div class="nxt">▼</div>');
    box.onclick=advance;root.appendChild(box);
    const sk=el('skip','SKIP ▶▶');sk.onclick=finish;root.appendChild(sk);
    document.body.appendChild(root);
    document.addEventListener('keydown',keys);
    next();
  }
  return{play};
})();