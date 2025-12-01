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

// sample dataset of Danish Christmas foods with Unsplash images
const foods = [
  { id:1, name:'Tarteletter', category:'mains', img:'https://opskrifteradmin.coop.dk/media/25302/tarteletter-1080_1080.jpg?width=850&upscale=false&format=webp', desc:'Dejlige flødeostehummertarteletter - klassisk dansk juleret.', recipe:["Preheat ovn til 200°C","Tag små tarteletskaller","Fyld med flødeostehummer og gourmetmajs","Bag 10-12 minutter til gylden farve","Server varm"] },
  { id:2, name:'Gløgg', category:'drinks', img:'https://sweetstothestreets.dk/wp-content/uploads/2023/01/gloegg-1080x675.jpg', desc:'Varm krydret vin med rosiner og mandler.', recipe:["Varm vin med krydderier","Tilsæt sukker efter smag","Server varm med rosiner"] },
  { id:3, name:'Æbleskiver', category:'sweets', img:'https://mummum.dk/wp-content/uploads/2024/11/aebleskiver-med-aeble-min-1536x1536.jpg', desc:'Små runde pandekager serveret med flormelis og syltetøj.', recipe:["Lav dej med æg og kærnemælk","Bag i æbleskivepande","Vend ofte","Server varme med syltetøj"] },
  { id:4, name:'Risalamande', category:'sweets', img:'https://www.valdemarsro.dk/wp-content/2012/11/risalamande-1.jpg', desc:'Kold risdessert med kirsebærsauce.', recipe:["Kog risengrød","Bland med flødeskum og hakkede mandler","Server kold med kirsebærsauce"] },
];

let state = {
  filter: 'all',
  q: '',
  favorites: JSON.parse(localStorage.getItem('jul-favs') || '[]')
};

function saveState(){
  localStorage.setItem('jul-favs', JSON.stringify(state.favorites));
}

function render(){
  // filters
  const filtered = foods.filter(f=>{
    if(state.filter !== 'all' && f.category !== state.filter) return false;
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
  modalImg.src = f.img; modalTitle.textContent = f.name; modalDesc.textContent = f.desc;
  modalRecipe.innerHTML = f.recipe.map(r=>`<li>${r}</li>`).join('');
  modalFavBtn.textContent = state.favorites.includes(id)?'Fjern favorit':'Favorit';
  modalFavBtn.onclick = ()=>{ toggleFav(id); modalFavBtn.textContent = state.favorites.includes(id)?'Fjern favorit':'Favorit'; };
  detailModal.classList.remove('hidden');
}

function closeModal(){ detailModal.classList.add('hidden'); }

// events
filterBtns.forEach(b=>b.addEventListener('click',()=>{ filterBtns.forEach(x=>x.classList.remove('active')); b.classList.add('active'); state.filter = b.dataset.filter; render(); }));
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
