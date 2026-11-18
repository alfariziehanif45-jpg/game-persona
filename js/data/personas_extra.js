/* =====================================================================
   FILE: js/personas_extra.js
   DESKRIPSI: Berisi 50 Persona tambahan (Sejarah, Pahlawan, Penjahat, Mitologi)
   ===================================================================== */
window.G = window.G || {};

G.EXTRA_PERSONAS_DATA = [
    /* --- SEJARAH & PAHLAWAN DUNIA (Fisik / Angin / Cahaya) --- */
    {n:'Alexander Agung', e:'⚔️', t:'pahlawan', kd:'phys', pow:105, sp:28, cd:3, price:1500, d:'Penakluk dunia dari Makedonia. Tebasan pedangnya membelah lautan musuh.'},
    {n:'Julius Caesar', e:'🏛️', t:'pahlawan', kd:'phys', pow:102, sp:27, cd:3, price:1450, d:'Kaisar Roma. Formasi legiunnya menghancurkan pertahanan lawan.'},
    {n:'Leonidas', e:'🛡️', t:'pahlawan', kd:'phys', pow:100, sp:25, cd:3, price:1400, d:'Raja Sparta. Pertahanan Spartan yang tiada tanding.'},
    {n:'Spartacus', e:'⛓️', t:'pahlawan', kd:'phys', pow:96, sp:24, cd:3, price:1350, d:'Gladiator pemberontak. Serangan putus asa yang mematikan.'},
    {n:'Miyamoto Musashi', e:'🥋', t:'pahlawan', kd:'phys', pow:108, sp:29, cd:3, price:1600, d:'Pendekar pedang legendaris Jepang. Teknik dua pedangnya mematikan.'},
    {n:'Bruce Lee', e:'🐉', t:'pahlawan', kd:'phys', pow:110, sp:30, cd:3, price:1650, d:'Master bela diri. Kecepatan pukulannya tak tertangkap mata.'},
    {n:'Sun Tzu', e:'📜', t:'pahlawan', kd:'wind', pow:95, sp:25, cd:3, price:1400, d:'Ahli strategi perang. Menyerang dari celah yang tak terduga.'},
    {n:'Napoleon', e:'🎩', t:'pahlawan', kd:'phys', pow:104, sp:27, cd:3, price:1500, d:'Kaisar Prancis. Taktik artileri yang mengguncang daratan Eropa.'},
    {n:'Hector', e:'🗡️', t:'pahlawan', kd:'phys', pow:102, sp:26, cd:3, price:1450, d:'Pangeran Troya. Tombak penjaga kota yang tak kenal takut.'},
    {n:'Perseus', e:'🪞', t:'pahlawan', kd:'light', pow:104, sp:27, cd:3, price:1500, d:'Pembunuh Medusa. Menggunakan pantulan cahaya untuk menyerang.'},
    {n:'Guan Yu', e:'🗡️', t:'pahlawan', kd:'phys', pow:108, sp:29, cd:3, price:1600, d:'Dewa Perang Tiongkok. Guandao-nya menyapu bersih pasukan musuh.'},
    {n:'Zhuge Liang', e:'🪶', t:'pahlawan', kd:'ice', pow:98, sp:25, cd:3, price:1400, d:'Strategi naga tidur. Memanggil badai es untuk menghentikan musuh.'},
    {n:'Nezha', e:'🔥', t:'pahlawan', kd:'fire', pow:102, sp:26, cd:3, price:1450, d:'Pangeran api. Lingkaran api dan tombak yang membara.'},
    {n:'Sun Wukong', e:'🐒', t:'pahlawan', kd:'phys', pow:115, sp:32, cd:4, price:1800, d:'Kera Sakti. Tongkat emasnya menghantam dengan kekuatan gunung.'},
    {n:'Enkidu', e:'⛓️', t:'pahlawan', kd:'phys', pow:106, sp:28, cd:3, price:1550, d:'Rantai para dewa. Mengikat musuh dengan kekuatan alam liar.'},

    /* --- PENJAHAT & IBLIS SEJARAH (Kegelapan / Api / Petir) --- */
    {n:'Genghis Khan', e:'🏹', t:'iblis', kd:'wind', pow:106, sp:28, cd:3, price:1550, d:'Penakluk Mongol. Pasukan berkuda badai yang menghancurkan segalanya.'},
    {n:'Attila the Hun', e:'🐎', t:'iblis', kd:'phys', pow:102, sp:26, cd:3, price:1450, d:'Cambuk Tuhan. Serbuan kavaleri yang brutal dan tak terhentikan.'},
    {n:'Vlad the Impaler', e:'🦇', t:'iblis', kd:'dark', pow:108, sp:29, cd:4, price:1600, d:'Dracula. Menghisap sisa kehidupan musuh untuk memperkuat diri.'},
    {n:'Lu Bu', e:'🦅', t:'iblis', kd:'phys', pow:112, sp:31, cd:3, price:1700, d:'Jenderal terbang. Kekuatan destruktif yang mengkhianati siapa pun.'},
    {n:'Rasputin', e:'🔮', t:'iblis', kd:'dark', pow:94, sp:24, cd:3, price:1350, d:'Biksu gila. Kutukan mistis yang sulit untuk dibunuh.'},
    {n:'Blackbeard', e:'🏴‍☠️', t:'iblis', kd:'phys', pow:98, sp:25, cd:3, price:1400, d:'Bajak laut legendaris. Tembakan meriam dan tebasan pedang laut.'},
    {n:'Al Capone', e:'🔫', t:'iblis', kd:'phys', pow:96, sp:24, cd:3, price:1350, d:'Bos mafia. Rentetan tembakan tommy gun dari balik kegelapan.'},
    {n:'Nero', e:'🔥', t:'iblis', kd:'fire', pow:100, sp:26, cd:3, price:1450, d:'Kaisar gila Roma. Membakar kota dengan api kegilaan.'},
    {n:'Caligula', e:'🏛️', t:'iblis', kd:'dark', pow:95, sp:25, cd:3, price:1400, d:'Tiran Roma. Serangan psikis yang merusak mental lawan.'},
    {n:'Cleopatra', e:'🐍', t:'iblis', kd:'dark', pow:98, sp:26, cd:3, price:1400, d:'Ratu Nil. Racun ular yang mematikan dan tipu daya kerajaan.'},
    {n:'Seth', e:'🏜️', t:'iblis', kd:'dark', pow:106, sp:28, cd:3, price:1550, d:'Dewa badai gurun Mesir. Pasir hisap yang mengubur musuh.'},
    {n:'Medusa', e:'🐍', t:'iblis', kd:'dark', pow:102, sp:27, cd:3, price:1500, d:'Gorgon. Tatapan matanya membekukan jiwa musuh.'},
    {n:'Tezcatlipoca', e:'🐆', t:'iblis', kd:'dark', pow:108, sp:29, cd:3, price:1600, d:'Cermin berasap. Mencuri bayangan dan kekuatan musuh.'},
    {n:'Izanami', e:'🌑', t:'iblis', kd:'dark', pow:110, sp:30, cd:4, price:1650, d:'Dewi kematian Jepang. Menarik musuh ke dalam alam baka.'},
    {n:'Hel', e:'💀', t:'iblis', kd:'dark', pow:102, sp:27, cd:3, price:1450, d:'Penguasa Helheim. Separuh tubuh membusuk, kekuatan membekukan.'},

    /* --- DEWA & MITOLOGI (Elemen / Cahaya / Es / Petir) --- */
    {n:'Hades', e:'💀', t:'dewa', kd:'dark', pow:110, sp:30, cd:4, price:1700, d:'Raja Dunia Bawah. Api biru yang membakar jiwa.'},
    {n:'Poseidon', e:'🔱', t:'dewa', kd:'ice', pow:108, sp:29, cd:3, price:1650, d:'Dewa Laut. Trisula yang memanggil badai es dan tsunami.'},
    {n:'Ares', e:'⚔️', t:'dewa', kd:'fire', pow:112, sp:31, cd:3, price:1750, d:'Dewa Perang. Amukan api dan darah yang tak terhentikan.'},
    {n:'Hermes', e:'👟', t:'dewa', kd:'wind', pow:98, sp:25, cd:3, price:1400, d:'Utusan Dewa. Serangan angin secepat kilat.'},
    {n:'Apollo', e:'🏹', t:'dewa', kd:'light', pow:105, sp:28, cd:3, price:1550, d:'Dewa Matahari. Panah cahaya yang menghanguskan kegelapan.'},
    {n:'Artemis', e:'🌙', t:'dewa', kd:'ice', pow:104, sp:27, cd:3, price:1500, d:'Dewi Bulan. Panah es yang membekukan target dari kejauhan.'},
    {n:'Athena', e:'🦉', t:'dewa', kd:'light', pow:106, sp:28, cd:3, price:1550, d:'Dewi Kebijaksanaan. Tombak cahaya dan perlindungan Aegis.'},
    {n:'Thor', e:'🔨', t:'dewa', kd:'elec', pow:115, sp:32, cd:4, price:1800, d:'Dewa Petir. Palu Mjolnir menghancurkan segalanya dengan kilat.'},
    {n:'Baldur', e:'☀️', t:'dewa', kd:'light', pow:100, sp:26, cd:3, price:1450, d:'Dewa Cahaya. Sinar kemurnian yang menyilaukan musuh.'},
    {n:'Anubis', e:'⚖️', t:'dewa', kd:'dark', pow:108, sp:29, cd:3, price:1600, d:'Penimbang Jiwa. Menghakimi musuh dengan kutukan kematian.'},
    {n:'Ra', e:'☀️', t:'dewa', kd:'fire', pow:110, sp:30, cd:4, price:1650, d:'Dewa Matahari Mesir. Bola api raksasa dari langit.'},
    {n:'Osiris', e:'🌿', t:'dewa', kd:'light', pow:105, sp:28, cd:3, price:1550, d:'Dewa Kehidupan. Cahaya regenerasi yang membakar musuh.'},
    {n:'Horus', e:'🦅', t:'dewa', kd:'wind', pow:104, sp:27, cd:3, price:1500, d:'Dewa Langit. Serangan angin mata elang yang presisi.'},
    {n:'Raijin', e:'⚡', t:'dewa', kd:'elec', pow:108, sp:29, cd:3, price:1600, d:'Dewa Petir Jepang. Tabuhan drum yang memanggil halilintar.'},
    {n:'Fujin', e:'🌪️', t:'dewa', kd:'wind', pow:105, sp:28, cd:3, price:1550, d:'Dewa Angin Jepang. Kantung angin yang menyapu bersih medan.'},
    {n:'Izanagi', e:'🗡️', t:'dewa', kd:'light', pow:112, sp:31, cd:4, price:1700, d:'Bapak Para Dewa. Tombak pencipta yang membelah kekacauan.'},
    {n:'Tsukuyomi', e:'🌙', t:'dewa', kd:'ice', pow:102, sp:27, cd:3, price:1450, d:'Dewa Bulan. Kegelapan malam yang membekukan darah.'},
    {n:'Quetzalcoatl', e:'🐍', t:'dewa', kd:'wind', pow:106, sp:28, cd:3, price:1550, d:'Ular Berbulu. Terbangan angin suci yang menghantam dari atas.'},
    {n:'Erlang Shen', e:'👁️', t:'dewa', kd:'light', pow:104, sp:27, cd:3, price:1500, d:'Dewa Bermata Tiga. Tombak ilahi yang melihat semua kelemahan.'}
];

G.loadExtraPersonas = function() {
    if (G._extrasLoaded) return;
    G.PERSONAS = G.PERSONAS || [];
    
    G.EXTRA_PERSONAS_DATA.forEach((p, i) => {
        const id = 'hist_' + i;
        // Cek agar tidak duplikat jika fungsi ini terpanggil 2x
        if (!G.PERSONAS.some(x => x.id === id)) {
            G.PERSONAS.push({
                id: id,
                n: p.n,
                e: p.e,
                t: p.t,
                k: p.kd, 
                pow: p.pow,
                sp: p.sp,
                cd: p.cd,
                price: p.price,
                d: p.d,
                only: null,   // Bisa dibeli oleh semua karakter
                reward: false // Dijual di toko
            });
        }
    });
    
    G._extrasLoaded = true;
    console.log("[Extra Personas] 50 Persona Sejarah & Mitologi berhasil dimuat!");
};