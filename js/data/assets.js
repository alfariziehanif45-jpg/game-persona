window.G=window.G||{};
// Model/gambar: taruh PNG transparan di assets/characters/<nama>.png dan assets/enemies/<nama>.png
// <nama> = huruf kecil, spasi jadi "-" (contoh: "Shade Hollow" -> shade-hollow.png). Kalau file belum ada, tampil siluet.
G.slug=n=>String(n).toLowerCase().replace(/\(.*?\)/g,'').trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
G.spr=(type,key,cls)=>`<div class="spr ${cls||''}" data-i="${String(key)[0]}"><img src="assets/${type}/${G.slug(key)}.png" alt="" onload="this.parentNode.classList.add('ok')" onerror="this.remove()"></div>`;