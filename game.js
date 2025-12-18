/* Æbleskive Imperiet - game.js
   Komplett rewrite: mange fabrikker, opgraderinger, achievements, gåder, gem/indlæs
   Put denne fil i samme mappe som index.html
*/

// ---------- Grundvariabler ----------
let cookies = 0;
let perClick = 10;
let perSecond = 100;

// ---------- DOM refs ----------
const countEl = document.getElementById("cookieCount");
const cookieBtn = document.getElementById("cookieButton");
const cpsEl = document.getElementById("cpsDisplay");
const pcEl = document.getElementById("pcDisplay");
const itemsGrid = document.getElementById("itemsGrid");
const upgradesGrid = document.getElementById("upgradesGrid");
const achievementsGrid = document.getElementById("achievementsGrid");
const saveBtn = document.getElementById("saveBtn");
const loadBtn = document.getElementById("loadBtn");
const resetBtn = document.getElementById("resetBtn");
const getRiddleBtn = document.getElementById("getRiddleBtn");

// ---------- Helper: talformat med 'dumb' units ----------
function formatNumber(n) {
    if (n === null || n === undefined) return "0";
    n = Number(n);
    if (n < 1000) return String(Math.floor(n));
    const units = ["", "K", "M", "B", "T", "AX", "BX", "CX", "DX", "EX", "PX", "ZX"];
    let idx = 0;
    while (n >= 1000 && idx < units.length - 1) { n /= 1000; idx++; }
    return (Math.round(n * 100) / 100).toString().replace(/\.00$/,"") + units[idx];
}

// ---------- Floating text ----------
function spawnFloatingText(text, x=null, y=null) {
    const el = document.createElement("div");
    el.className = "floating-number";
    el.textContent = text;
    document.body.appendChild(el);
    // position near center or specified coords
    const left = x ?? (window.innerWidth / 2 + (Math.random()*200 - 100));
    const top = y ?? (window.innerHeight / 2 + (Math.random()*60 - 30));
    el.style.left = `${left}px`;
    el.style.top = `${top}px`;
    setTimeout(()=>{ el.style.transform = "translate(-50%,-120%) scale(1.05)"; el.style.opacity = "0"; }, 20);
    setTimeout(()=> el.remove(), 1000);
}

// ---------- Fabrikker / automations (items) ----------
// Flere levels, med stigende pris og cps
const items = [
    { name:"Den Ekstremt Overdimensionerede Hyper-Mega-Ultra ÆbleskivePande Ekspres-Produktionel Enhed™", price:5000, cps:50, owned:0 },
    { name:"Det Uendelige Æbleskive-Automatiserings-Køkkenapparat Med Ekstra TurboRotation Og KarameliseringsSystem™", price:25000, cps:250, owned:0 },
    { name:"Den Multidimensionelle Æbleskive-Genererings-Motor Med Kvantebaseret DejPartikelForstærker™", price:200000, cps:1500, owned:0 },
    { name:"Galaktisk Æbleskive-FabriksProduktionel EnergiMultiplikator Med Overophedede DejKraftTurbiner™", price:800000, cps:5000, owned:0 },
    { name:"Intergalaktisk Æbleskive-SuperFabrik Med MegaHyperTurbo-Hastigheds-DejEkstruderingsSystem™", price:3000000, cps:25000, owned:0 },
    { name:"Den Kosmiske Æbleskive-SortEnergi-Producent Med AntiMaterie DejKompression™", price:15000000, cps:100000, owned:0 }
];

// ---------- Opgraderinger ----------
const upgrades = [
    { id:"u_click_x2", name:"Dobbelt klik", price:25_000, type:"click", mult:2, bought:false, desc:"Klik giver x2" },
    { id:"u_click_x5", name:"Super klik", price:500_000, type:"click", mult:5, bought:false, desc:"Klik x5" },
    { id:"u_cps_x1.5", name:"Bedre dej", price:150_000, type:"cps", mult:1.5, bought:false, desc:"CPS x1.5" },
    { id:"u_cps_x2", name:"Den Ubegribeligt Lange Navngivne KlikForstærker™ Som Forøger Alting 6x", price:5_000_000, type:"cps", mult:6, bought:false, desc:"CPS x6" },
    { id:"u_global_x3", name:"Den Absurd Overforstærkede Æbleskive-Dej Forædlings-ForbedringsMultiplikator™ (x8)", price:200_000_000, type:"global", mult:4, bought:false, desc:"Alt x4" },
    { id:"u_auto_discount", name:"Total Universel Æbleskive-Forstærker Med KvanteOgMultiversSynkronisering™ (x10)", price:20_000_000, type:"cps", mult:0.9, bought:false, desc:"cps x10" }
];
// ---------- Achievements (advanments) ----------
const achievements = [
    { id:"a0", name:"Sulten", cond: s=> s >= 1, reward:200, text:"Du tog din første bid." },
    { id:"a1", name:"Pande-ejer", cond: ()=> items[0].owned >= 1, reward:2000, text:"Du købte din første pande." },
    { id:"a2", name:"Millionær", cond: s=> s >= 1_000_000, reward:50_000, text:"Du nåede 1 million." },
    { id:"a3", name:"10M klubben", cond: s=> s >= 10_000_000, reward:250_000, text:"10 millioner! Hvem er du?" },
    { id:"a4", name:"Robotherre", cond: ()=> items[4].owned >= 1, reward:500_000, text:"En robot arbejder for dig." },
];
let gainedAchievements = {};

// ---------- Riddles ----------
const riddles = [
    { q:"Hvad har blade men er ikke et træ?", answers:["bog","en bog"], reward:3000, diff:1, hint:"Du læser i den." },
    { q:"Hvad bliver vådere jo mere det tørrer?", answers:["håndklæde","handklæde","towel"], reward:7500, diff:1, hint:"Tør efter badet." },
    { q:"Hvad er 2^10?", answers:["1024"], reward:20000, diff:2, hint:"Binært ven." },
    { q:"Skriv ordet for det danske symbol for 10^12 i dette spil (AX)", answers:["ax","AX"], reward:100000, diff:3, hint:"AX er vores notation for 10^12." },
    { q:"Sammensæt 'ÆBLE' + 'SKIVE' som ét ord", answers:["æbleskive","aebleskive"], reward:50000, diff:2, hint:"Det du spiser." }
];

// ---------- Render butik / upgrades / achievements ----------
function renderShop(){
    itemsGrid.innerHTML = "";
    items.forEach((it,idx)=>{
        const node = document.createElement("div");
        node.className = "shop-item";
        node.innerHTML = `
            <div>
                <strong>${it.name}</strong><br>
                Pris: ${formatNumber(it.price)} 🥞 <small style="color:var(--muted)">(${formatNumber(it.cps)}/s)</small><br>
                Ejet: ${it.owned}
            </div>
            <div>
                <button data-idx="${idx}" class="buy-item">Køb</button>
            </div>
        `;
        itemsGrid.appendChild(node);
    });
    // listeners
    document.querySelectorAll(".buy-item").forEach(btn=>{
        btn.onclick = ()=> {
            const idx = Number(btn.dataset.idx);
            buyItem(idx);
        };
    });
}

function renderUpgrades(){
    upgradesGrid.innerHTML = "";
    upgrades.forEach(u=>{
        const node = document.createElement("div");
        node.className = "upgrade-item";
        node.innerHTML = `
            <div class="meta"><strong>${u.name}</strong><div style="color:var(--muted);font-size:13px">${u.desc}</div></div>
            <div>
                <button data-id="${u.id}" ${u.bought?"disabled":""}>${u.bought? "Købt" : "Køb " + formatNumber(u.price)}</button>
            </div>
        `;
        upgradesGrid.appendChild(node);
    });
    document.querySelectorAll(".upgrade-item button").forEach(b=>{
        b.onclick = ()=>{
            const id = b.dataset.id;
            buyUpgrade(id);
        };
    });
}

function renderAchievements(){
    achievementsGrid.innerHTML = "";
    achievements.forEach(a=>{
        const unlocked = gainedAchievements[a.id];
        const node = document.createElement("div");
        node.className = "achievement-item " + (unlocked ? "" : "locked");
        node.innerHTML = `<div><strong>${a.name}</strong><div style="color:var(--muted);font-size:13px">${a.text}</div></div>
                          <div>${unlocked ? "Løst" : "Lås"}</div>`;
        achievementsGrid.appendChild(node);
    });
}

// ---------- Køb Item ----------
function buyItem(idx){
    const it = items[idx];
    const cost = it.price;
    if (cookies < cost) { flash("Ikke nok æbleskiver"); return; }
    cookies -= cost;
    it.owned++;
    perSecond += it.cps;
    // pris stiger
    it.price = Math.floor(it.price * (1.25 + Math.random()*0.15));
    spawnFloatingText(`-${formatNumber(cost)} 🥞`);
    spawnFloatingText(`+${formatNumber(it.cps)}/s`);
    checkAchievements();
    renderShop(); renderUpgrades(); renderAchievements(); updateUI();
}

// ---------- Køb Upgrade ----------
function buyUpgrade(id){
    const u = upgrades.find(x=>x.id===id);
    if (!u || u.bought) return;
    if (cookies < u.price) { flash("For dyrt"); return; }
    cookies -= u.price;
    u.bought = true;
    applyUpgrade(u);
    spawnFloatingText(`${u.name} aktiveret`);
    renderUpgrades(); renderShop(); updateUI();
}

function applyUpgrade(u){
    if (u.type === "click") {
        perClick = Math.floor(perClick * u.mult);
    } else if (u.type === "cps"){
        // multiplicere alle item cps og perSecond
        items.forEach(it => it.cps = Math.floor(it.cps * u.mult));
        perSecond = Math.floor(perSecond * u.mult);
    } else if (u.type === "global") {
        perClick = Math.floor(perClick * u.mult);
        items.forEach(it => it.cps = Math.floor(it.cps * u.mult));
        perSecond = Math.floor(perSecond * u.mult);
    } else if (u.type === "discount") {
        // discount reducerer priser fremadrettet (implement simplistisk: sæt price = price * mult)
        items.forEach(it => it.price = Math.floor(it.price * u.mult));
    }
}

// ---------- Achievements check ----------
function checkAchievements(){
    achievements.forEach(a=>{
        if (!gainedAchievements[a.id] && a.cond(cookies)){
            gainedAchievements[a.id] = true;
            cookies += a.reward;
            spawnFloatingText(`Advanment! ${a.name} +${formatNumber(a.reward)}🥞`);
            flash(`Advanment låst: ${a.name}`);
            renderAchievements(); updateUI();
        }
    });
}

// ---------- Riddle system ----------
let riddleCooldown = false;
function triggerRiddle(){
    if (riddleCooldown){ flash("Vent lidt før du trækker en ny gåde."); return; }
    // vælg gåde baseret på spillerniveau
    const pool = riddles.filter(r => {
        if (cookies < 100_000 && r.diff > 1) return false;
        if (cookies < 1_000_000 && r.diff > 2) return false;
        return true;
    });
    const r = pool[Math.floor(Math.random()*pool.length)];
    showRiddleModal(r);
    riddleCooldown = true;
    setTimeout(()=> riddleCooldown = false, 60_000); // 1 min cooldown
}

function showRiddleModal(r){
    const modal = document.createElement("div");
    modal.className = "riddle-modal";
    modal.innerHTML = `
        <div class="riddle-card">
            <h3>Gåde</h3>
            <p style="color:var(--muted)">${r.q}</p>
            <input id="riddleAnswer" placeholder="Skriv svar..." autofocus />
            <div class="actions">
                <button id="riddleSubmit">Svar</button>
                <button id="riddleHint">Hint</button>
                <button id="riddleClose">Luk</button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById("riddleClose").onclick = ()=> modal.remove();
    document.getElementById("riddleHint").onclick = ()=> flash("Hint: " + r.hint);
    document.getElementById("riddleSubmit").onclick = ()=>{
        const ans = document.getElementById("riddleAnswer").value.trim().toLowerCase();
        const ok = r.answers.some(a => a.toLowerCase() === ans);
        if (ok) {
            cookies += r.reward;
            spawnFloatingText(`+${formatNumber(r.reward)} 🥞`);
            flash("Rigtigt! Belønning givet.");
            modal.remove();
            checkAchievements();
            updateUI();
        } else {
            flash("Forkert svar.");
            modal.remove();
        }
    };
}

// ---------- UI & events ----------
function updateUI(){
    countEl.textContent = formatNumber(cookies);
    cpsEl.textContent = formatNumber(perSecond);
    pcEl.textContent = formatNumber(perClick);
}

function flash(txt, ms=1300){
    const el = document.createElement("div");
    el.className = "flash-msg";
    el.textContent = txt;
    document.body.appendChild(el);
    setTimeout(()=> el.style.opacity="0", ms-300);
    setTimeout(()=> el.remove(), ms);
}

// klik på æbleskive
cookieBtn.addEventListener("click", ()=>{
    cookies += perClick;
    spawnFloatingText("+" + formatNumber(perClick));
    updateUI();
    checkAchievements();
    // Lav partikler når man klikker
function spawnParticle(x, y) {
    const p = document.createElement("div");
    p.classList.add("particle");
    document.body.appendChild(p);

    p.style.left = x + "px";
    p.style.top = y + "px";

    setTimeout(() => p.remove(), 600);
}

});

// køb events er bundet i renderShop / renderUpgrades

// autosave / auto CPS
setInterval(()=>{
    cookies += perSecond;
    updateUI();
    checkAchievements();
}, 1000);

// save/load/reset
function saveGame(){
    const data = {
        cookies, perClick, perSecond,
        items, upgrades, gainedAchievements
    };
    localStorage.setItem("aeblesave_v2", JSON.stringify(data));
    flash("Gemmet");
}
function loadGame(){
    const raw = localStorage.getItem("aeblesave_v2");
    if (!raw) { flash("Ingen save fundet"); return; }
    try {
        const d = JSON.parse(raw);
        cookies = d.cookies ?? cookies;
        perClick = d.perClick ?? perClick;
        perSecond = d.perSecond ?? perSecond;
        // genindlæs items (pas på struktur)
        if (d.items && Array.isArray(d.items)){
            d.items.forEach((it, idx) => {
                if (items[idx]) {
                    items[idx].price = it.price ?? items[idx].price;
                    items[idx].owned = it.owned ?? items[idx].owned;
                    items[idx].cps = it.cps ?? items[idx].cps;
                }
            });
        }
        if (d.upgrades && Array.isArray(d.upgrades)){
            d.upgrades.forEach(u => {
                const local = upgrades.find(x=>x.id===u.id);
                if (local) local.bought = u.bought ?? local.bought;
            });
        }
        gainedAchievements = d.gainedAchievements ?? gainedAchievements;
        flash("Save indlæst");
        renderShop(); renderUpgrades(); renderAchievements(); updateUI();
    } catch(e){
        console.error(e);
        flash("Kunne ikke indlæse save");
    }
}
function resetGame(){
    if (!confirm("Er du sikker? Dette nulstiller alt.")) return;
    // reload page for simplest reset
    localStorage.removeItem("aeblesave_v2");
    location.reload();
}

// ---------- init ----------
renderShop();
renderUpgrades();
renderAchievements();
updateUI();

// events
saveBtn.onclick = saveGame;
loadBtn.onclick = loadGame;
resetBtn.onclick = resetGame;
getRiddleBtn.onclick = triggerRiddle;

// apply bought upgrades after load (if any bought)
setTimeout(()=> {
    upgrades.filter(u=>u.bought).forEach(applyUpgrade);
    updateUI();
}, 3000);
