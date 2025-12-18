// Christmas-themed interactive frontend JS
/* Interactive background: click to pan toward point, drag to pan, and arrow keys to nudge */
let bgPos = { x: 50, y: 18 }; // percent
let isDragging = false;
let dragStart = null;

function setBackgroundPos(xPercent, yPercent, animate = true){
  bgPos.x = Math.max(0, Math.min(100, xPercent));
  bgPos.y = Math.max(0, Math.min(100, yPercent));
  if(animate) document.body.style.transition = 'background-position 700ms cubic-bezier(.2,.8,.2,1)';
  else document.body.style.transition = 'none';
  document.body.style.backgroundPosition = `${bgPos.x}% ${bgPos.y}%`;
}

// animate toward a target position smoothly (ease)
function animateTo(targetX, targetY, duration = 800){
  const startX = bgPos.x, startY = bgPos.y;
  const start = performance.now();
  function step(now){
    const t = Math.min(1, (now - start) / duration);
    // easeInOutCubic
  const e = t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3) / 2;
  const nx = startX + (targetX - startX) * e;
  const ny = startY + (targetY - startY) * e;
  document.body.style.backgroundPosition = `${nx}% ${ny}%`;
  if(t < 1) requestAnimationFrame(step);
  else { bgPos.x = targetX; bgPos.y = targetY; }
  }
  requestAnimationFrame(step);
}
// click to move background center (but ignore clicks on interactive elements)
document.addEventListener('click', (e) => {
  const ignoreTags = ['BUTTON','A','INPUT','SELECT','TEXTAREA','LABEL'];
  if (ignoreTags.includes(e.target.tagName) || e.target.closest('.card') || e.target.closest('.btn')) return;
  // compute percent position relative to viewport
  const x = (e.clientX / window.innerWidth) * 100;
  const y = (e.clientY / window.innerHeight) * 100;
  // push a little toward click point but keep within safe band
  const targetX = 50 + (x - 50) * 0.8; // 80% of delta
  const targetY = 18 + (y - 18) * 0.6; // dampen vertical movement
  animateTo(targetX, targetY, 900);
});
// drag to pan background
document.addEventListener('pointerdown', (e) => {
  // only start drag when pressing on body background (not on controls)
  const ignore = e.target.closest('.controls, .card, .modal, .btn, input, select, textarea');
  if(ignore) return;
  isDragging = true;
  dragStart = { x: e.clientX, y: e.clientY, startPos: {...bgPos} };
  document.body.style.transition = 'none';
});
document.addEventListener('pointermove', (e) => {
  if(!isDragging || !dragStart) return;
  const dx = e.clientX - dragStart.x;
  const dy = e.clientY - dragStart.y;
  // convert pixel delta to percent relative to viewport
  const nx = dragStart.startPos.x - (dx / window.innerWidth) * 60; // scale factor
  const ny = dragStart.startPos.y - (dy / window.innerHeight) * 40;
  setBackgroundPos(nx, ny, false);
});
document.addEventListener('pointerup', () => { isDragging = false; dragStart = null; document.body.style.transition = 'background-position 700ms cubic-bezier(.2,.8,.2,1)'; });

// keyboard nudges
document.addEventListener('keydown', (e) => {
  const step = e.shiftKey ? 8 : 3;
  if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){
  e.preventDefault();
  if(e.key === 'ArrowLeft') setBackgroundPos(bgPos.x - step, bgPos.y);
  if(e.key === 'ArrowRight') setBackgroundPos(bgPos.x + step, bgPos.y);
    if(e.key === 'ArrowUp') setBackgroundPos(bgPos.x, bgPos.y - step);
    if(e.key === 'ArrowDown') setBackgroundPos(bgPos.x, bgPos.y + step);
  }
});

// ensure initial background position is applied
setTimeout(()=> setBackgroundPos(bgPos.x, bgPos.y, false), 80);
const foodListElem = document.getElementById('food-list');
const searchInput = document.getElementById('search');
const filterBtns = Array.from(document.querySelectorAll('.filter-btn'));
const favoritesElem = document.getElementById('favorites');
const sortSelect = document.getElementById('sort');
const detailModal = document.getElementById('detail-modal');
const closeModalBtn = document.getElementById('close-modal');
const modalImg = document.getElementById('modal-img');
const modalTitle = document.getElementById('modal-title');
const modalDesc = document.getElementById('modal-desc');
const modalRecipe = document.getElementById('modal-recipe');
const modalFavBtn = document.getElementById('modal-fav');
const toggleSnow = document.getElementById('toggle-snow');
const toggleLights = document.getElementById('toggle-lights');
const backToBoothsBtn = document.getElementById('back-to-booths');

// sample dataset of Danish Christmas foods with local images
const foods = [
  { id:1, name:'Tarteletter (høns i asparges)', price: '2 for 15', category:'bode2', img:'./images/Tarteletter.png', desc:'Klassiske tarteletter med høns i asparges - dansk juleklassiker.', recipe:["Steg kyllingetern gyldne i smør","Tilsæt hvedemel og lav en jævning","Hæld bouillon i lidt ad gangen under piskning","Tilsæt fløde og kog op","Tilsæt asparges i stykker og varm igennem","Fyld tarteletskaller med hønsefyld","Server straks mens det er varmt"] },
  { id:2, name:'Gløgg', price: 20, category:'bode3', img:'./images/Gløgg.png', desc:'Varm krydret vin med rosiner og mandler.', recipe:["Varm vin med krydderier","Tilsæt sukker efter smag","Server varm med rosiner"] },
  { id:3, name:'Æbleskiver', price: 15, category:'bode1', img:'./images/Æbleskiver.png', desc:'Lækre hjemmelavede æbleskiver lige til en hul tand. 3 stk for 15 kr.', recipe:["Bland alt det tøre i en skål (mel, citronskrald, sukker, kardemumme, natron, salt)","Del blommerne og pisk ægehviderne stive","Tilsæt blomerne og kærnemælken til det tøre og pisk til jævn","Vend de stive ægehvider i dejen","Lad æbleskivehjærnet blive godt varm og stej i masser af smør","Fyld hullerne helt op og vend dem med f.eks. en kødnål"] },
  { id:5, name:'Hjemmelavede Vaniljekranse', price: 10, category:'bode1', img:'./images/Hjemmelavede Vaniljekranse.png', desc:'Klassiske vaniljekranse med ægte vaniljekulde. 10 stk for 10 kr. Arbejdstid: 30 min.', recipe:["Tag smøren ud af køleskabet mindst 6 timer før","Forvarm ovnen til 200 grader","Flæk vaniljestang og skrab kornene ud, mas dem sammen med lidt sukker","Pisk vaniljestang, sukker og blødt smør","Pisk æget i","Bland hvedemel og mandelmel og eldt det ind i dejen","Put dejen i en sprøjtepose og sprøjt krænse ud","Bag vaniljekransende i 9-11 minutter til de er lyst gyldne","Lad dem køle helt af før opbevaring"] },
  { id:6, name:'Juleboller', price: 8, category:'bode1', img:'./images/Juleboller.png', desc:'Vamsede juleboller med kardomme, kanel og chokolade. I alt 2 timer med hævning.', recipe:["Opvarm mælken til den er lun","Hæld mælken i dejskål sammen med appelsinsaft, appelsinskal, kardemomme, kanel og opløs gæren","Rør æg i væsken, tilsæt flormelis, hvedemel og salt","Skær smøret i tern","Ælt dejen i 10-12 min ved middel-lav hastighed","Tilsæt smøret ca. halvvejs gennem ælting","Hak mørk chokolade og hasselnødder, kom i dejen","Stil dejen til hævning i 1 time tildækket","Del dejen i 12-14 små klumper og ælt bollerne ved at folde siderne ind under","Læg dem i bradepande med samlingen nedad","Lad dem hæve i 30 min yderligere","Bag i 10-15 minutter ved 200 grader til gyldne","Pensl med sukkervand og drys hasselnødder"] },
  { id:7, name:'Brunkager', price: 10, category:'bode1', img:'./images/Brunkager.png', desc:'Lækre hjemmelavede brunkager. 10 stk for 10 kr. Total tid: 1 time 30 min.', recipe:["Kom mandlerne i skål med meget varmt vand og smut den brune skald af, tør og hak dem","Kom smør, sukker og sirup i gryde og smelt på middel lav varme","Lad det køle 10 minutter efter smeltning","Tilsæt de hakede mandler og krydderier (nelike, kanel, kardemumme)","Opløs potasken i lidt varmt vand og tilsæt til dejen","Kom melet i lidt efter lidt og ældt indtil glat","Del dejen i pølser og pak i film, sæt på køl i mindst 1 time","Skær i tynde skiver og bag ved 175 grader i 6-8 minutter"] },
  { id:8, name:'Brunformkager', price: 10, category:'bode1', img:'./images/Brunformkager.png', desc:'Lækre brunkager formkager - den bedste aktivitet i julen. 10 stk for 10 kr. Total tid: 1 time 30 min.', recipe:["Kom smør, sukker og sirup i gryde og smelt på middel lav varme","Lad det køle 10 minutter efter smeltning","Tilsæt krydderier (nelike, kanel, kardemumme)","Opløs potasken i lidt varmt vand og tilsæt til dejen","Kom melet i lidt efter lidt og ældt indtil glat","Del dejen og pak i film, sæt på køl i mindst 1 time","Rul ud og skær former","Bag ved 175 grader i 6-10 minutter - pas på de bliver ikke brændt i kanten"] },
  { id:9, name:'Jule Muffins', price: 12, category:'bode1', img:'./images/Jule Muffins.png', desc:'Lækre, flotte, pyntede jule muffins med smørcreme og pebermyntestokke. Total tid: 45 min.', recipe:["Pisk det bløde smør luftit","Tilsæt sukker og flormelis lidt efter lidt","Tilsæt marcipan groftrevet","Tilsæt æggene","Blend hvedemel, bagepulver og krydderier (nellike, kardemomme, ingefær, kanel)","Fold mel-blandingen i smørblandingen","Fordel i muffinforms og bag","Til smørcreme: Pisk smør luftit, tilsæt flormelis og vaniljesukker lidt efter lidt","Pisk indtil cremet og glat"] },
  { id:10, name:'Stjernebrød med Kanelremonce', price: 10, category:'bode1', img:'./images/Stjernebrød med Kanelremonce.png', desc:'Svampet og lækkert kanelbrød som kan trækkes fra hinanden. Total tid: 1 time 5 min.', recipe:["Smelt smørret i gryde, tilsæt mælk og rør gæren ud","Tilsæt de øvrige ingredienser til dejen","Slå dejen sammen og lad hæve tildækket i ca. 30 min","Til remonce: Rør smør, brun farin og kanel sammen","Tag dejen ud og del i 4 stykker, form boller og rul ud","Fordel remoncen på 3 af 4 bundene","Læg en smurt bund på plade, de andre ovenpå, slut uden remonce","Skær 16 lige store snit ud fra centrum","Løft 2 snitter af gangen og sno dem 3 gange rundt","Tryk enderne sammen så de hæfter","Lad efterhæve i 15 min, pensl med æg","Bag ved 200° i ca. 20 min, drys med flormelis til sidst"] },
  { id:11, name:'Kakao', price: 5, category:'bode3', img:'./images/Kakao.png', desc:'Varm kakao.', recipe:["Varm mælk i gryde til det er varmt men ikke koger","Tilsæt kakaopulver og sukker","Pisk godt sammen til det er glat","Hæld op i krus","Server varm"] },
  { id:12, name:'Pimp Din Gin', price: 10, category:'bode3', img:'./images/Pimp Din Gin.png', desc:'Krydre din gin med julekrydderier og botanicals.', recipe:["Start med god gin i glas","Tilsæt friske krydderier: kanel, stjerneanis, kardemomme","Tilsæt friske urter som rosmarin eller timian","Tilsæt citrus skræl (appelsin, citron)","Lad det trække i nogle timer","Sigt og server med tonic eller som shot"] },
  { id:13, name:'Brændte Mandler', price: 10, category:'bode3', img:'./images/Brændte Mandler.png', desc:'Sprøde, karamelliserede mandler med kanel. Klassisk julemarked snack.', recipe:["Kom mandler, sukker og vand i pande","Varm op ved middel varme og rør konstant","Sukker vil opløse og begynde at krystalisere omkring mandler","Fortsæt med at røre til sukker smelter og karamelliserer","Tilsæt kanel og rør godt rundt","Hæld ud på bagepapir og lad køle","Bryd fra hinanden når det er koldt"] },
  { id:14, name:'Småkager', price: 10, category:'bode3', img:'./images/Småkager.png', desc:'Blandede danske småkager. 10 stk for 10 kr.', recipe:["Pisk smør og sukker luftigt","Tilsæt æg og vaniljesukker","Bland mel og bagepulver","Ælt dejen sammen","Del dejen i portioner og tilsæt forskellige smagsvarianter","Rul ud og skær i former","Bag ved 180 grader i 8-10 minutter","Lad køle og pynt eventuelt med glasur"] },
  { id:15, name:'Kombucha', price: 'Gratis', category:'bode3', img:'./images/Kombucha.png', desc:'Hjemmelavet fermenteret kombucha med ingefær og citron.', recipe:["Kog vand og lav stærk te","Tilsæt sukker og rør til opløst","Lad køle til rumtemperatur","Tilsæt SCOBY og startervæske","Dæk med klæde og lad fermentere i 7-14 dage","Smag undervejs - stop når sødmen er balanceret","Hæld på flasker med ingefær og citron","Lad sekundærfermentere i 2-3 dage for brus","Køl ned og nyd"] },
  { id:16, name:'Risalamande', price: 10, category:'bode4', img:'./images/Risalamande.png', desc:'Klassisk dansk juledessert med mandler og kirsebærsovs.', recipe:["Kog risene møre i mælk med vanilje og salt","Lad risengrøden køle helt af","Hak mandler fint","Pisk fløde til skum","Bland den kolde risengrød med hakkede mandler","Vend den piskede fløde forsigtigt i","Læg hele mandlen i til den der finder den","Server med varm kirsebærsovs"] },
  { id:17, name:'Kartoffel Porrersuppe', price: 10, category:'bode4', img:'./images/Kartoffel Porrersuppe.png', desc:'Cremet og varmende suppe med kartofler og porre.', recipe:["Skær kartofler i tern og porre i skiver","Svits porrerne i smør til de er bløde","Tilsæt kartofler og bouillon","Kog til kartofler er møre","Blend suppen til ønsket konsistens","Tilsæt fløde og varm igennem","Smag til med salt og peber","Server med brød"] },
  { id:18, name:'Hjemmelavet Pita', price: 15, category:'bode6', img:'./images/Hjemmelavet Pita.png', desc:'Friskbagt pita brød med fyld.', recipe:["Bland mel, vand, gær, salt og olivenolie","Ælt dejen til den er glat og elastisk","Lad hæve i 1 time tildækket","Del i kugler og rul ud til flade brød","Bag på meget varm pande eller i ovn ved 250°C","Bag 2-3 minutter på hver side til de puffer op","Fyld med grøntsager, kød og sauce efter smag","Server varmt"] },
  { id:19, name:'Bagekartofler med Fyld', price: 15, category:'bode5', img:'./images/Bagekartofler med Fyld.png', desc:'Sprøde bagekartofler med valgfrit fyld.', recipe:["Vask kartofler og prik med gaffel","Gnid med olie og drys med salt","Bag ved 200°C i 45-60 minutter til de er møre","Skær et kryds i toppen","Tryk let for at åbne kartoflen","Fyld med smør, creme fraiche, bacon, ost eller andet fyld","Server varmt med friske krydderurter"] },
];

let state = {
  filter: null,
  q: '',
  favorites: JSON.parse(localStorage.getItem('jul-favs') || '[]'),
  showBoothSelection: true
};

function saveState(){
  localStorage.setItem('jul-favs', JSON.stringify(state.favorites));
}

function render(){
  // Show/hide UI elements based on state
  if(state.showBoothSelection) {
    // Hide filters, search, and sort when showing booths
    document.querySelector('.filters').style.display = 'none';
    searchInput.style.display = 'none';
    document.querySelector('.toolbar').style.display = 'none';
    if(backToBoothsBtn) backToBoothsBtn.style.display = 'none';
    
    foodListElem.innerHTML = `
      <article class="booth-card" data-booth="alle">
        <div class="booth-icon">🎄</div>
        <h3>Alle</h3>
      </article>
      <article class="booth-card" data-booth="bode1">
        <div class="booth-icon">🏪</div>
        <h3>Bod 1</h3>
      </article>
      <article class="booth-card" data-booth="bode2">
        <div class="booth-icon">🏪</div>
        <h3>Bod 2</h3>
      </article>
      <article class="booth-card" data-booth="bode3">
        <div class="booth-icon">🏪</div>
        <h3>Bod 3</h3>
      </article>
      <article class="booth-card" data-booth="bode4">
        <div class="booth-icon">🏪</div>
        <h3>Bod 4</h3>
      </article>
      <article class="booth-card" data-booth="bode5">
        <div class="booth-icon">🏪</div>
        <h3>Bod 5</h3>
      </article>
      <article class="booth-card" data-booth="bode6">
        <div class="booth-icon">🏪</div>
        <h3>Bod 6</h3>
      </article>
    `;
    
    // Attach booth selection events
    document.querySelectorAll('.booth-card').forEach(card=>{
      card.addEventListener('click', ()=>{
        const booth = card.dataset.booth;
        state.filter = booth;
        state.showBoothSelection = false;
        // Update active filter button
        filterBtns.forEach(btn => {
          btn.classList.toggle('active', btn.dataset.filter === booth);
        });
        render();
      });
    });
    return;
  }
  
  // Show filters, search, and sort when showing food items
  document.querySelector('.filters').style.display = 'flex';
  searchInput.style.display = 'block';
  document.querySelector('.toolbar').style.display = 'flex';
  if(backToBoothsBtn) backToBoothsBtn.style.display = 'inline-flex';

  // filters
  const filtered = foods.filter(f=>{
    if(state.filter && state.filter !== 'alle' && f.category !== state.filter) return false;
    if(state.q && !(f.name.toLowerCase().includes(state.q) || f.desc.toLowerCase().includes(state.q))) return false;
    return true;
  });

  // sort
  if(sortSelect.value === 'alpha') filtered.sort((a,b)=>a.name.localeCompare(b.name));

  const placeholder = 'https://via.placeholder.com/600x400?text=Billede';
  foodListElem.innerHTML = filtered.map(f=>`
    <article class="card" data-id="${f.id}">
      <img src="${f.img || placeholder}" alt="${f.name}" onerror="this.onerror=null;this.src='${placeholder}'">
      <h4>${f.name}</h4>
      <p>${f.desc}</p>
      <div class="meta">
        <span class="price">${f.price} kr.</span>
        <button class="icon-btn fav-btn" aria-label="favorit">${state.favorites.includes(f.id)?'❤️':'🤍'}</button>
        <div>
          <button class="btn view-btn">Se</button>
        </div>
      </div>
    </article>
  `).join('');

  // attach events
  document.querySelectorAll('.card').forEach(card=>{
    const id = Number(card.dataset.id);
    card.querySelector('.view-btn').addEventListener('click',()=>openModal(id));
    card.querySelector('.fav-btn').addEventListener('click',(e)=>{toggleFav(id); e.stopPropagation();});
  });

  renderSidebar();
}

function renderSidebar(){
  // favorites
  favoritesElem.innerHTML = state.favorites.map(id=>{
    const f = foods.find(x=>x.id===id);
    return `<li>${f ? f.name : '–' } <button class="icon-btn small remove-fav" data-id="${id}">✖</button></li>`;
  }).join('') || '<li><em>Ingen favoritter endnu</em></li>';

  // handlers for remove
  document.querySelectorAll('.remove-fav').forEach(btn=>btn.addEventListener('click',()=>{
    const id=Number(btn.dataset.id); state.favorites = state.favorites.filter(x=>x!==id); saveState(); render();
  }));
}

function toggleFav(id){
  if(state.favorites.includes(id)) state.favorites = state.favorites.filter(x=>x!==id);
  else state.favorites.push(id);
  saveState(); render();
}

function openModal(id){
  const f = foods.find(x=>x.id===id); if(!f) return;
  modalImg.src = f.img;
  modalTitle.textContent = f.name;
  modalDesc.innerHTML = `<span class="price" style="font-weight:bold;color:#222">${f.price} kr.</span><br>${f.desc}`;
  modalRecipe.innerHTML = f.recipe.map(r=>`<li>${r}</li>`).join('');
  modalFavBtn.textContent = state.favorites.includes(id)?'Fjern favorit':'Favorit';
  modalFavBtn.onclick = ()=>{ toggleFav(id); modalFavBtn.textContent = state.favorites.includes(id)?'Fjern favorit':'Favorit'; };
  detailModal.classList.remove('hidden');
}

function closeModal(){ detailModal.classList.add('hidden'); }

// events
filterBtns.forEach(b=>b.addEventListener('click',()=>{ 
  filterBtns.forEach(x=>x.classList.remove('active')); 
  b.classList.add('active'); 
  state.filter = b.dataset.filter; 
  state.showBoothSelection = false;
  render(); 
}));
if(backToBoothsBtn) {
  backToBoothsBtn.addEventListener('click', ()=>{
    state.showBoothSelection = true;
    state.filter = null;
    state.q = '';
    searchInput.value = '';
    filterBtns.forEach(x=>x.classList.remove('active'));
    render();
  });
}
searchInput.addEventListener('input',()=>{ state.q = searchInput.value.trim().toLowerCase(); render(); });
sortSelect.addEventListener('change',()=>render());
closeModalBtn.addEventListener('click',closeModal);
detailModal.addEventListener('click',(e)=>{ if(e.target===detailModal) closeModal(); });

// snow toggle
function createSnow(){ const container=document.createElement('div'); container.className='snow'; for(let i=0;i<40;i++){ const s=document.createElement('i'); const left=Math.random()*100; s.style.left=`${left}%`; s.style.animationDuration=`${6+Math.random()*6}s`; s.style.opacity=0.6+Math.random()*0.4; s.style.width=2+Math.random()*6+'px'; s.style.height=s.style.width; s.style.top=`-${Math.random()*10}%`; container.appendChild(s); } document.body.appendChild(container); }
function removeSnow(){ const e=document.querySelector('.snow'); if(e) e.remove(); }
if(toggleSnow){
  toggleSnow.addEventListener('change',()=>{ if(toggleSnow.checked) createSnow(); else removeSnow(); });
  if(toggleSnow.checked) createSnow();
}

// lights toggle (simple body class)
if(toggleLights){
  toggleLights.addEventListener('change',()=>{ document.body.classList.toggle('lights', toggleLights.checked); });
}

// initial render
render();

/* Webdok and generated background features removed — cleaned up per user request */

// Ensure background video is visible and playing; make UI translucent if playback fails
function ensureBackgroundVideo(){
  const container = document.getElementById('christmas-bg');
  if(!container) return;
  const v = document.getElementById('bg-video');
  if(!v) return;
  // enforce covering layout and higher default opacity
  v.style.position = 'absolute'; v.style.inset = '0'; v.style.width = '100%'; v.style.height = '100%';
  v.style.objectFit = 'cover'; v.style.opacity = '0.7'; v.style.zIndex = '0'; v.style.pointerEvents = 'none';
  // try to play; some browsers require user interaction but we'll still attempt
  v.play().then(()=>{
    console.log('Background video playing');
    // make sure key UI elements are translucent so video shows through
    document.querySelectorAll('.card, .sidebar, .modal-content, .site-header, .site-footer').forEach(el=>{
      el.style.background = el.style.background || 'rgba(255,255,255,0.65)';
      el.style.backdropFilter = el.style.backdropFilter || 'blur(6px)';
    });
  }).catch(err=>{
    console.warn('Background video play failed', err);
    // fallback: reduce overlay darkness so background generated SVG is visible
    document.querySelectorAll('.card, .sidebar, .modal-content, .site-header, .site-footer').forEach(el=>{
      el.style.background = 'rgba(255,255,255,0.6)';
      el.style.backdropFilter = 'blur(6px)';
    });
  });
}

ensureBackgroundVideo();

// QR Code functionality
const qrModal = document.getElementById('qr-modal');
const qrBtn = document.getElementById('qr-btn');
const closeQrBtn = document.getElementById('close-qr');
const qrCodeImg = document.getElementById('qr-code');

const siteUrl = 'https://denichko09.github.io/Julemarkedet/';
const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(siteUrl)}`;

qrCodeImg.src = qrApiUrl;

if(qrBtn) qrBtn.addEventListener('click', ()=>{ qrModal.classList.remove('hidden'); });
if(closeQrBtn) closeQrBtn.addEventListener('click', ()=>{ qrModal.classList.add('hidden'); });
if(qrModal) qrModal.addEventListener('click', (e)=>{ if(e.target === qrModal) qrModal.classList.add('hidden'); });
