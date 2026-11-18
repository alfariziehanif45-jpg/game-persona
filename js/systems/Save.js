/* =====================================================================
   SAVE SYSTEM: 3 SLOT + META "KAEL ALTERNATE"
   - Slot disimpan di  pesona_save_1 .. pesona_save_3
   - Save lama (pesona_save) otomatis dipindah ke Slot 1
   - META (pesona_meta) TIDAK ikut terhapus kalau save dihapus / hardcore kalah,
     jadi Kael Alternate tetap ingat kamu di save mana pun.
   ===================================================================== */
window.G=window.G||{};
const KEY='pesona_save',MKEY='pesona_meta',SLOTKEY='pesona_slot';
G.SLOTS=3;
const sk=n=>KEY+'_'+n;

/* migrasi save lama -> slot 1 */
try{const old=localStorage.getItem(KEY);
 if(old&&!localStorage.getItem(sk(1))){localStorage.setItem(sk(1),old)}
 if(old)localStorage.removeItem(KEY)}catch(e){}

G.slot=+localStorage.getItem(SLOTKEY)||1;
G.setSlot=n=>{G.slot=n;localStorage.setItem(SLOTKEY,n)};

G.newState=d=>({diff:d,ch:0,st:0,party:['kael'],lv:{kael:{l:1,x:0}},side:{},items:3});

G.slotRaw=n=>{try{return JSON.parse(localStorage.getItem(sk(n)))}catch(e){return null}};
G.slotHas=n=>!!G.slotRaw(n);
G.firstEmpty=()=>{for(let i=1;i<=G.SLOTS;i++)if(!G.slotHas(i))return i;return 0};
G.slotInfo=n=>{const s=G.slotRaw(n);if(!s)return'Kosong';
 const kl=s.lv&&s.lv.kael?s.lv.kael.l:1,dn=G.DIFF&&G.DIFF[s.diff]?G.DIFF[s.diff].n:s.diff,
  tg=s.t?new Date(s.t).toLocaleString('id-ID',{day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}):'-';
 return `Chapter ${(s.ch||0)+1} Stage ${(s.st||0)+1} \u2022 Kael Lv ${kl} \u2022 ${dn} \u2022 \u00a5${s.yen||0} \u2022 ${tg}`};

G.save=()=>{if(!G.state)return;G.state.t=Date.now();localStorage.setItem(sk(G.slot),JSON.stringify(G.state))};
G.hasSave=()=>{for(let i=1;i<=G.SLOTS;i++)if(G.slotHas(i))return true;return false};
/* G.load() = muat slot aktif | G.load(n) = muat slot n. Mengembalikan true/false */
G.load=n=>{if(n)G.setSlot(n);const s=G.slotRaw(G.slot);if(!s)return false;G.state=s;
 try{G.syncKael()}catch(e){console.warn('[syncKael]',e)}
 return true};
G.wipe=n=>localStorage.removeItem(sk(n||G.slot));

/* ================= META: KAEL ALTERNATE INGAT KAMU ================= */
/* Cocok dengan nama boss apa pun yang mengandung "Kael" (protagonis tidak pernah jadi boss,
   jadi boss ber-nama Kael pasti Kael Alternate). Kalau namanya tidak mengandung "Kael",
   tambahkan kata kuncinya di sini, contoh: /kael|bayangan arsip/i */
G.KAEL_RE=/alternate.*kael|kael.*alternate/i;
G.isAltKael=a=>G.KAEL_RE.test([].concat(a||[]).filter(Boolean).join(' '));

G.meta=(()=>{try{return JSON.parse(localStorage.getItem(MKEY))||{}}catch(e){return{}}})();
G.metaSave=()=>localStorage.setItem(MKEY,JSON.stringify(G.meta));
G.rank=d=>Math.max(0,Object.keys(G.DIFF).indexOf(d));
G.dname=r=>{const k=Object.keys(G.DIFF)[r];return k?G.DIFF[k].n:'?'};

/* dipanggil saat Alternate Kael kalah */
G.markKael=d=>{const r=G.rank(d),k=G.meta.k||(G.meta.k={n:0,best:-1,last:-1});
 k.n++;k.last=r;k.best=Math.max(k.best,r);G.metaSave();console.log('[Kael Alternate] kemenangan tercatat di',G.dname(r))};

/* Save lama (sebelum sistem ini ada) yang sudah melewati chapter / side chapter Kael Alternate
   otomatis dianggap sudah mengalahkannya. Hanya jalan kalau belum pernah tercatat. */
G.syncKael=()=>{const S=G.state;if(!S||(G.meta.k&&G.meta.k.n>0))return;
 let won=false;
 (G.CHAPTERS||[]).forEach((c,i)=>{if(c&&G.isAltKael(c.boss)&&S.ch>i)won=true});
 (G.SIDE||[]).forEach(x=>{if(x&&x.boss&&G.isAltKael(x.boss)&&S.side&&S.side[x.id])won=true});
 if(won)G.markKael(S.diff)};

/* mood: 'none' (belum pernah kalah) | 'brave' | 'same' | 'coward' */
G.kaelMood=d=>{const k=G.meta.k;if(!k||k.n<1)return'none';
 const r=G.rank(d);return r>k.best?'brave':r==k.best?'same':'coward'};

/* when: 'start' (pilih difficulty New Game) | 'meet' (bertemu di boss) */
G.kaelLines=(d,when)=>{const m=G.kaelMood(d);if(m=='none')return null;
 const k=G.meta.k,NM='Kael Alternate',b=G.dname(k.best),now=G.dname(G.rank(d)),
  pick=a=>a[Math.floor(Math.random()*a.length)],
  open=when=='start'?[
   [NM,'...Tunggu. Aku mengenal aura itu. Kau orangnya, yang pernah menutup bab hidupku sendiri.'],
   [NM,'Archive berbisik padaku: ada penantang lama yang kembali menulis takdirnya.']]:[
   [NM,'Hah... jadi kau datang lagi. Aku ingat wajah itu, orang yang pernah menumbangkanku.'],
   [NM,'Halaman-halaman ini tidak pernah lupa. Kau yang dulu mengalahkanku, bukan?']];
 const o=pick(open);
 if(m=='brave')return[o,
  pick([[NM,`Kau dulu menang di tingkat ${b}, dan sekarang memilih ${now}?! HAHAHA! Gila... aku suka keberanianmu!`],
        [NM,`${now}, lebih berat dari ${b}? Itu baru lawan yang layak kutunggu. Jangan mati sebelum kita bertemu lagi!`]]),
  pick([[NM,'Aku tidak akan menahan diri. Tunjukkan lagi kenapa kau pantas menulis akhir ceritamu sendiri!'],
        [NM,'Bagus. Seseorang yang berani melangkah lebih dalam akan selalu kuhormati. Ayo!']])];
 if(m=='same')return[o,
  pick([[NM,`${now} lagi, sama seperti sebelumnya. Kau tidak lari. Kuakui itu.`],
        [NM,`Tingkat ${now}, tidak turun, tidak naik. Cukup jantan. Tapi kali ini aku tidak akan kalah semudah dulu.`]]),
  [NM,'Buktikan kemenangan itu bukan kebetulan.']];
 return[o,
  pick([[NM,`Tunggu... dulu kau menang di tingkat ${b}, dan sekarang kau memilih ${now}? HAH! PENGECUT!`],
        [NM,`${now}? Setelah menumbangkanku di ${b}? Kau turun kelas karena takut kalah, dasar pengecut!`]]),
  pick([[NM,'Orang yang pernah mengalahkanku seharusnya tidak lari ke tingkat yang lebih mudah. Memalukan!'],
        [NM,'Kemenanganmu dulu jadi tidak ada artinya kalau kau bersembunyi di balik kesulitan yang rendah.']]),
  pick([[NM,'Silakan, kalau mau. Tapi jangan harap aku menghormatimu.'],
        [NM,'Naikkan lagi tingkatmu kalau punya nyali. Kalau tidak, aku akan terus mengingatmu sebagai pengecut.']])]};