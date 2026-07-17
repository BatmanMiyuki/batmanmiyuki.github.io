// ============================================
// MeinkraftAI — Application Engine
// ============================================

let currentBuild = null;
let viewer = null;
let currentDBTab = 'blocks';
let aiProcessing = false;

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  initCounters();
  renderQuickBuilds();
  renderDB();
  renderCommands();
  navigate('home');
});

// ── NAVIGATION ──
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');
  document.querySelector(`.nav-link[data-page="${page}"]`)?.classList.add('active');
  document.getElementById('navLinks')?.classList.remove('open');
  window.scrollTo(0, 0);
  if (page === 'database') renderDB();
  if (page === 'chat') document.getElementById('chatInput')?.focus();
}
function goHome() { navigate('home'); }
function toggleMobileMenu() { document.getElementById('navLinks').classList.toggle('open'); }

// ── COUNTERS ──
function initCounters() {
  document.querySelectorAll('.stat-num[data-count]').forEach(el => {
    const target = +el.dataset.count;
    let current = 0;
    const step = Math.ceil(target / 60);
    const interval = setInterval(() => {
      current += step;
      if (current >= target) { current = target; clearInterval(interval); }
      el.textContent = current.toLocaleString();
    }, 30);
  });
}

// ── QUICK BUILDS ──
function renderQuickBuilds() {
  const grid = document.getElementById('quickBuilds');
  grid.innerHTML = Object.entries(BUILDS).map(([key, b]) => `
    <div class="build-card card" onclick="quickBuild('${key}')">
      <div class="build-card-arrow">→</div>
      <div class="build-card-icon">${b.emoji}</div>
      <div class="build-card-name">${b.name}</div>
      <div class="build-card-desc">${b.desc}</div>
    </div>
  `).join('');
}

// ── GENERATOR ──
function quickBuild(key) {
  navigate('generator');
  const build = BUILDS[key];
  if (!build) return;
  document.getElementById('buildInput').value = build.name;
  displayBuild(build);
}

function randomBuild() {
  const keys = Object.keys(BUILDS);
  quickBuild(keys[Math.floor(Math.random() * keys.length)]);
}

function generateBuild() {
  const input = document.getElementById('buildInput').value.trim();
  if (!input) return toast('Décris ce que tu veux construire !');
  
  const genBtn = document.getElementById('genBtn');
  genBtn.disabled = true;
  genBtn.innerHTML = '<span class="spinner"></span> Génération...';
  
  startAILog();
  
  // Try to match known builds
  const lower = input.toLowerCase();
  let matched = null;
  const matchMap = {
    mcdonalds: ['mcdo', 'mcdonald', 'burger', 'fast food', 'fast-food'],
    castle: ['château', 'chateau', 'fort', 'castle', 'médiéval', 'medieval'],
    skyscraper: ['gratte', 'immeuble', 'building', 'skyscraper', 'tour'],
    treehouse: ['cabane', 'arbre', 'tree', 'treehouse'],
    pirate_ship: ['pirate', 'bateau', 'navire', 'ship', 'pirate'],
    volcano_lair: ['volcan', 'base secrète', 'lair', 'volcano'],
    futuristic_house: ['futuriste', 'futur', 'moderne', 'futuristic'],
    church: ['église', 'eglise', 'chapelle', 'church', 'cathédrale', 'cathedrale'],
  };
  
  for (const [key, keywords] of Object.entries(matchMap)) {
    if (keywords.some(kw => lower.includes(kw))) { matched = BUILDS[key]; break; }
  }
  
  // Simulate AI processing with staggered log messages
  const delay = matched ? 1200 : 3000;
  
  setTimeout(() => {
    if (matched) {
      logAI(`✅ Structure reconnue : ${matched.name}`, 'success');
      logAI(`📐 Dimensions : ${matched.w}×${matched.h}×${matched.d}`, '');
      logAI(`📦 ${Object.values(matched.materials).reduce((a,b)=>a+b,0).toLocaleString()} blocs nécessaires`, '');
      logAI(`📖 ${matched.steps.length} étapes de construction`, '');
      displayBuild(matched);
    } else {
      // Generate a custom build
      const size = document.getElementById('buildSize').value;
      const style = document.getElementById('buildStyle').value;
      const custom = generateCustom(input, style, size);
      logAI(`🧠 Structure personnalisée générée`, 'success');
      logAI(`📐 Dimensions : ${custom.w}×${custom.h}×${custom.d}`, '');
      logAI(`📦 ${Object.values(custom.materials).reduce((a,b)=>a+b,0).toLocaleString()} blocs`, '');
      displayBuild(custom);
    }
    genBtn.disabled = false;
    genBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg> Générer';
  }, delay);
}

function generateCustom(name, style, size) {
  const sizes = {small:{w:16,h:16,d:16},medium:{w:32,h:24,d:32},large:{w:48,h:32,d:48}};
  const s = sizes[size] || sizes.medium;
  const styleBlocks = {
    modern: {white_concrete:500,black_concrete:200,glass:300,quartz_block:200,smooth_stone:300,gray_concrete:150,lit_redstone_lamp:30,iron_block:50,end_rod:20},
    medieval: {stone_bricks:800,cobblestone:400,oak_planks:300,oak_log:150,oak_fence:100,oak_stairs:80,torch:30,glass:20},
    fantasy: {purpur_block:400,end_stone_bricks:300,quartz_block:200,sea_lantern:50,end_rod:40,glass:80,prismarine:100,end_stone:200},
    japanese: {cherry_planks:400,spruce_planks:200,smooth_stone:300,white_concrete:200,red_concrete:50,black_concrete:100,glass:60,lit_redstone_lamp:20},
  };
  const materials = styleBlocks[style] || styleBlocks.modern;
  
  return {
    name: name || "Structure Personnalisée",
    emoji: "🏗️",
    desc: `Structure style ${style} taille ${size}`,
    w: s.w, h: s.h, d: s.d,
    materials,
    steps: [
      {t:"Fondations",d:`Zone ${s.w}×${s.d}. Délimite contours`,b:{[Object.keys(materials)[0]]:200}},
      {t:"Murs extérieurs",d:"Élève les murs, prévois ouvertures fenêtres/portes",b:{[Object.keys(materials)[1]]:300}},
      {t:"Fenêtres & portes",d:"Installe verre et portes",b:{glass:50}},
      {t:"Toiture",d:"Toit selon style: plat/moderne, pente/médiéval, dôme/fantasy",b:{[Object.keys(materials)[2]]:150}},
      {t:"Intérieur",d:"Divise en pièces, planchers, escaliers",b:{[Object.keys(materials)[3]]:100}},
      {t:"Éclairage",d:"Lanternes, torche ou blocs lumineux selon style",b:{torch:20}},
      {t:"Décoration ext",d:"Jardin, clôtures, sentiers",b:{[Object.keys(materials)[4]]:80}},
      {t:"Finitions",d:"Meubles, déco, éclairage d'ambiance",b:{[Object.keys(materials)[0]]:50}},
    ],
    tips:[
      `Style ${style}: utilise les blocs caractéristiques`,
      "Commence par fondations → structure porteuse",
      "Éclairage intérieur ET extérieur",
      "Détails = différence bon/excellent build",
      "Dalles et escaliers pour courbes",
      "N'hésite pas à modifier selon tes goûts !"
    ]
  };
}

function displayBuild(build) {
  currentBuild = build;
  
  // Stats
  const total = Object.values(build.materials).reduce((a,b) => a + b, 0);
  const types = Object.keys(build.materials).length;
  const time = Math.ceil(total / 200);
  document.getElementById('sBlocks').textContent = total.toLocaleString();
  document.getElementById('sTypes').textContent = types;
  document.getElementById('sTime').textContent = `~${time}min`;
  document.getElementById('sDims').textContent = `${build.w}×${build.h}×${build.d}`;
  document.getElementById('statsBar').style.display = 'grid';
  
  // Viewer
  document.getElementById('viewerCard').style.display = 'block';
  document.getElementById('viewerTitle').textContent = build.name;
  initViewer(build);
  
  // Tutorial
  document.getElementById('tutorialContainer').style.display = 'block';
  renderTutorialSteps(build);
  renderTutorialMaterials(build);
  renderTutorialSchema(build);
  renderTutorialTips(build);
}

// ── AI LOG ──
function startAILog() {
  const body = document.getElementById('aiLogBody');
  body.innerHTML = '';
  document.querySelector('.ai-dot').classList.add('active');
  logAI('🔄 Analyse de la demande...', '');
  setTimeout(() => logAI('🧠 Recherche de la structure optimale...', ''), 600);
  setTimeout(() => logAI('📐 Calcul des dimensions...', ''), 1000);
  setTimeout(() => logAI('📦 Compilation des matériaux...', ''), 1400);
  setTimeout(() => logAI('📖 Rédaction du tutoriel...', ''), 1800);
  setTimeout(() => logAI('🎨 Rendu de l\'aperçu 3D...', ''), 2200);
}

function logAI(text, cls) {
  const body = document.getElementById('aiLogBody');
  const p = document.createElement('p');
  p.className = 'log-line' + (cls ? ' ' + cls : '');
  p.textContent = text;
  body.appendChild(p);
  body.scrollTop = body.scrollHeight;
}

// ── 3D VIEWER ──
function initViewer(build) {
  const canvas = document.getElementById('viewerCanvas');
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = 420;
  
  viewer = new IsometricViewer(canvas, build);
  viewer.render();
}

class IsometricViewer {
  constructor(canvas, build) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.build = build;
    this.rot = 30;
    this.tilt = 25;
    this.zoom = 1;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.autoRotate = false;
    this.animFrame = null;
    this.voxels = this.generateVoxels();
    
    canvas.addEventListener('mousedown', e => { this.dragging = true; this.lastX = e.clientX; this.lastY = e.clientY; });
    window.addEventListener('mousemove', e => {
      if (!this.dragging) return;
      this.rot += (e.clientX - this.lastX) * 0.5;
      this.tilt = Math.max(5, Math.min(75, this.tilt - (e.clientY - this.lastY) * 0.5));
      this.lastX = e.clientX; this.lastY = e.clientY;
      this.render();
    });
    window.addEventListener('mouseup', () => this.dragging = false);
    canvas.addEventListener('wheel', e => { e.preventDefault(); this.zoom = Math.max(0.3, Math.min(3, this.zoom - e.deltaY * 0.001)); this.render(); });
  }
  
  generateVoxels() {
    const voxels = [];
    const { w, h, d, materials } = this.build;
    const mats = Object.keys(materials);
    
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          const wall = x === 0 || x === w-1 || z === 0 || z === d-1;
          const floor = y === 0 || y === Math.floor(h * 0.45);
          const roof = y === h-1;
          const door = (x === Math.floor(w/2) || x === Math.floor(w/2)+1) && z === 0 && y < 3;
          const window = wall && y > 2 && y < h-2 && ((x % 4 === 2 && (z===0||z===d-1)) || (z%4===2 && (x===0||x===w-1)));
          
          if (door) continue;
          
          let color = null;
          let type = 'block';
          
          if (roof) { color = this.blockColor(mats[0]); type = 'roof'; }
          else if (window) { color = '#a8d8ea'; type = 'window'; }
          else if (floor) { color = this.blockColor(mats[Math.min(2, mats.length-1)]); type = 'floor'; }
          else if (wall) { color = this.blockColor(mats[0], 0.6 + (y/h)*0.4); type = 'wall'; }
          
          if (color) voxels.push({ x, y: h-1-y, z, color, type });
        }
      }
    }
    return voxels;
  }
  
  blockColor(id, bright = 1) {
    const block = DB.blocks.find(b => b.id === id);
    const hex = block ? block.col : '#808080';
    const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
    return `rgb(${Math.floor(r*bright)},${Math.floor(g*bright)},${Math.floor(b*bright)})`;
  }
  
  project(x, y, z) {
    const rad = this.rot * Math.PI / 180, tiltRad = this.tilt * Math.PI / 180;
    const { w, d } = this.build;
    const ox = x - w/2, oz = z - d/2, oy = y - this.build.h/2;
    const rx = ox * Math.cos(rad) - oz * Math.sin(rad);
    const rz = ox * Math.sin(rad) + oz * Math.cos(rad);
    const py = oy * Math.cos(tiltRad) - rz * Math.sin(tiltRad);
    const pz = oy * Math.sin(tiltRad) + rz * Math.cos(tiltRad);
    const scale = 10 * this.zoom;
    return { x: this.canvas.width/2 + rx * scale, y: this.canvas.height/2 - py * scale, z: pz };
  }
  
  render() {
    const ctx = this.ctx, w = this.canvas.width, h = this.canvas.height;
    const grad = ctx.createLinearGradient(0,0,0,h);
    grad.addColorStop(0, '#0d0d1a');
    grad.addColorStop(1, '#15152a');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);
    
    if (!this.voxels.length) return;
    
    const sorted = this.voxels.map(v => {
      const p = this.project(v.x, v.y, v.z);
      return { ...v, px: p.x, py: p.y, pz: p.z };
    }).sort((a,b) => b.pz - a.pz);
    
    const size = Math.max(4, 8 * this.zoom);
    sorted.forEach(v => {
      ctx.fillStyle = v.color;
      ctx.fillRect(v.px - size/2, v.py - size/2, size, size);
      if (v.type === 'window') {
        ctx.fillStyle = 'rgba(168,216,234,0.3)';
        ctx.fillRect(v.px - size/2, v.py - size/2, size, size);
      }
      if (v.type === 'wall') {
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(v.px - size/2, v.py - size/2, size, size);
      }
    });
    
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(10, 10, 180, 50);
    ctx.fillStyle = '#6366f1';
    ctx.font = '10px Inter';
    ctx.fillText(`Zoom: ${this.zoom.toFixed(1)}x  Rot: ${Math.floor(this.rot)}°`, 20, 28);
    ctx.fillStyle = '#9898b0';
    ctx.fillText(`${this.voxels.length} voxels rendus`, 20, 44);
  }
  
  setView(view) {
    this.autoRotate = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    switch(view) {
      case 'perspective': this.rot=30; this.tilt=25; this.zoom=1; break;
      case 'front': this.rot=0; this.tilt=0; this.zoom=1.2; break;
      case 'top': this.rot=0; this.tilt=80; this.zoom=1; break;
      case 'interior': this.rot=45; this.tilt=35; this.zoom=1.8; break;
      case 'rotate360':
        this.autoRotate = true;
        const animate = () => {
          if (!this.autoRotate) return;
          this.rot += 0.5;
          this.render();
          this.animFrame = requestAnimationFrame(animate);
        };
        animate();
        break;
    }
    this.render();
  }
}

function setView(view) {
  document.querySelectorAll('.vt').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  if (viewer) viewer.setView(view);
}

// ── TUTORIAL ──
function renderTutorialSteps(build) {
  const el = document.getElementById('tut-steps');
  el.innerHTML = build.steps.map((s, i) => `
    <div class="step" data-step="${i+1}">
      <div class="step-title">${s.t}</div>
      <div class="step-desc">${s.d}</div>
      <div class="step-blocks">
        ${Object.entries(s.b).map(([id, count]) => {
          const block = DB.blocks.find(b => b.id === id);
          const name = block ? block.name : id.replace(/_/g,' ');
          return `<span class="step-block">${name}: ×${count}</span>`;
        }).join('')}
      </div>
    </div>
  `).join('');
}

function renderTutorialMaterials(build) {
  const el = document.getElementById('tut-materials');
  const mats = Object.entries(build.materials).map(([id, count]) => {
    const block = DB.blocks.find(b => b.id === id);
    return { id, name: block ? block.name : id.replace(/_/g,' '), count, col: block ? block.col : '#808080', tex: block?.tex };
  }).sort((a,b) => b.count - a.count);
  
  const total = mats.reduce((s,m) => s + m.count, 0);
  
  el.innerHTML = `
    <div style="padding:16px;margin-bottom:16px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
      <div style="font-weight:700">Total: <span style="color:var(--green2)">${total.toLocaleString()} blocs</span> · ${mats.length} types</div>
      <button class="btn btn-sm btn-outline" onclick="copyMaterials()">📋 Copier la liste</button>
    </div>
    <div class="mat-grid">
      ${mats.map(m => `
        <div class="mat-item">
          <div class="mat-swatch" style="background:${m.col}"></div>
          <div class="mat-info">
            <div class="mat-name">${m.name}</div>
            <div class="mat-count">× ${m.count.toLocaleString()}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderTutorialSchema(build) {
  const el = document.getElementById('tut-schema');
  const layers = Math.min(build.h, 8);
  const gw = Math.min(build.w, 16);
  const gd = Math.min(build.d, 16);
  const mats = Object.keys(build.materials);
  
  let html = '';
  for (let layer = 0; layer < layers; layer++) {
    html += `<div class="schema-layer"><div class="schema-title">Couche ${layer+1} (Y=${layer})</div><div class="schema-grid" style="grid-template-columns:repeat(${gw},22px)">`;
    for (let z = 0; z < gd; z++) {
      for (let x = 0; x < gw; x++) {
        const wall = x===0||x===gw-1||z===0||z===gd-1;
        const floor = layer===0;
        const roof = layer===layers-1;
        const door = (x===Math.floor(gw/2)||x===Math.floor(gw/2)+1)&&z===0&&layer<3;
        
        let bg = 'transparent', sym = '';
        if (door) { bg='#6B511F'; sym='🚪'; }
        else if (roof) { bg='#7A7A7A'; }
        else if (floor) { bg='#A0A0A0'; }
        else if (wall) { bg='#CFD5D6'; if ((x%4===2&&(z===0||z===gd-1))||(z%4===2&&(x===0||x===gw-1))) { bg='#a8d8ea'; }}
        
        html += `<div class="schema-cell" style="background:${bg}">${sym}</div>`;
      }
    }
    html += '</div></div>';
  }
  el.innerHTML = html;
}

function renderTutorialTips(build) {
  const el = document.getElementById('tut-tips');
  el.innerHTML = `
    <div style="display:grid;gap:10px">
      ${build.tips.map(tip => `
        <div style="padding:14px 18px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius-sm);font-size:.88rem;color:var(--text2)">
          💡 ${tip}
        </div>
      `).join('')}
    </div>
    <div style="margin-top:20px;padding:20px;background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)">
      <h4 style="margin-bottom:12px;font-size:.9rem;color:var(--amber)">📋 Commandes utiles</h4>
      <div class="cmd-syntax">/give @s minecraft:${Object.keys(build.materials)[0]} ${Object.values(build.materials)[0]}</div>
      <div class="cmd-syntax">/fill ~ ~ ~ ~${build.w} ~${build.h} ~${build.d} minecraft:${Object.keys(build.materials)[0]} hollow</div>
      <div class="cmd-syntax">/tp @s ~ ~${build.h+5} ~</div>
      <div class="cmd-syntax">/gamemode creative</div>
    </div>
  `;
}

function setTutTab(tab) {
  document.querySelectorAll('.tt').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tut-panel').forEach(p => p.classList.remove('active'));
  event.target.classList.add('active');
  document.getElementById('tut-' + tab).classList.add('active');
}

function copyMaterials() {
  if (!currentBuild) return;
  const mats = Object.entries(currentBuild.materials)
    .map(([id, c]) => `${DB.blocks.find(b=>b.id===id)?.name||id}: ${c}`)
    .join('\n');
  copyText(`=== ${currentBuild.name} ===\nTotal: ${Object.values(currentBuild.materials).reduce((a,b)=>a+b,0)} blocs\n\n${mats}`);
}

// ── DATABASE ──
function setDBTab(cat) {
  currentDBTab = cat;
  document.querySelectorAll('.dbt').forEach(t => t.classList.remove('active'));
  document.querySelector(`.dbt[data-cat="${cat}"]`)?.classList.add('active');
  document.getElementById('dbSearch').value = '';
  renderDB();
}

function renderDB(filter = '') {
  const grid = document.getElementById('dbGrid');
  const lf = filter.toLowerCase();
  
  if (currentDBTab === 'blocks') {
    const items = DB.blocks.filter(b => !lf || b.name.toLowerCase().includes(lf) || b.id.includes(lf));
    grid.innerHTML = items.map(b => `
      <div class="db-card" onclick="copyText('/give @s minecraft:${b.id}')">
        <div class="db-card-icon" style="width:48px;height:48px;margin:0 auto 8px;border-radius:8px;background:${b.col};border:2px solid var(--border2)"></div>
        <div class="db-card-name">${b.name}</div>
        <div class="db-card-id">${b.id}</div>
        <div class="db-card-extra">Dureté: ${b.hard} | ${b.tool}</div>
      </div>
    `).join('');
  }
  else if (currentDBTab === 'items') {
    const items = DB.items.filter(b => !lf || b.name.toLowerCase().includes(lf) || b.id.includes(lf));
    grid.innerHTML = items.map(i => `
      <div class="db-card" onclick="copyText('/give @s minecraft:${i.id}')">
        <div class="db-card-icon">${i.emoji}</div>
        <div class="db-card-name">${i.name}</div>
        <div class="db-card-id">${i.id}</div>
        <div class="db-card-extra">${i.cat}</div>
      </div>
    `).join('');
  }
  else if (currentDBTab === 'mobs') {
    const items = DB.mobs.filter(m => !lf || m.name.toLowerCase().includes(lf) || m.id.includes(lf));
    grid.innerHTML = items.map(m => `
      <div class="db-card" onclick="copyText('/summon minecraft:${m.id} ~ ~ ~')">
        <div class="db-card-icon">${m.emoji}</div>
        <div class="db-card-name">${m.name}</div>
        <div class="db-card-id">❤️ ${m.hp} PV</div>
        <div class="db-card-extra">${m.hostile?'⚔️ Hostile':'🟢 Passif'} · ${m.desc}</div>
      </div>
    `).join('');
  }
  else if (currentDBTab === 'enchants') {
    const items = DB.enchants.filter(e => !lf || e.name.toLowerCase().includes(lf) || e.id.includes(lf));
    grid.innerHTML = items.map(e => `
      <div class="db-card" onclick="copyText('/enchant @s minecraft:${e.id} ${e.max}')">
        <div class="db-card-icon">✨</div>
        <div class="db-card-name">${e.name}</div>
        <div class="db-card-id">${e.id} (max ${e.max})</div>
        <div class="db-card-extra">${e.desc} · ${e.type}</div>
      </div>
    `).join('');
  }
  else if (currentDBTab === 'effects') {
    const items = DB.effects.filter(e => !lf || e.name.toLowerCase().includes(lf) || e.id.includes(lf));
    grid.innerHTML = items.map(e => `
      <div class="db-card" onclick="copyText('/effect give @s minecraft:${e.id} 60 1')">
        <div class="db-card-icon">${e.emoji}</div>
        <div class="db-card-name">${e.name}</div>
        <div class="db-card-id">${e.id}</div>
        <div class="db-card-extra">${e.desc}</div>
      </div>
    `).join('');
  }
  else if (currentDBTab === 'structures') {
    const items = DB.structures.filter(s => !lf || s.name.toLowerCase().includes(lf));
    grid.innerHTML = items.map(s => `
      <div class="db-card">
        <div class="db-card-icon">🏗️</div>
        <div class="db-card-name">${s.name}</div>
        <div class="db-card-id">${s.biome}</div>
        <div class="db-card-extra">${s.desc}</div>
      </div>
    `).join('');
  }
}

function filterDB(val) { renderDB(val); }

// ── COMMANDS ──
function renderCommands() {
  const el = document.getElementById('cmdList');
  el.innerHTML = DB.commands.map(c => `
    <div class="cmd-card">
      <div class="cmd-header">
        <span class="cmd-name">/${c.cmd}</span>
        <button class="btn btn-sm btn-outline" onclick="copyText('${c.ex}')">📋 Copier exemple</button>
      </div>
      <div class="cmd-syntax">${c.syntax}</div>
      <div class="cmd-desc">${c.desc}</div>
      <div class="cmd-example">💡 ${c.ex}</div>
    </div>
  `).join('');
}

function filterCmds(val) {
  const cards = document.querySelectorAll('#cmdList .cmd-card');
  cards.forEach(c => {
    c.style.display = c.textContent.toLowerCase().includes(val.toLowerCase()) ? 'block' : 'none';
  });
}

// ── CHAT ──
function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  input.value = '';
  
  addChatMsg(msg, 'user');
  
  setTimeout(() => {
    addChatMsg(aiRespond(msg), 'ai');
  }, 600 + Math.random() * 800);
}

function addChatMsg(text, type) {
  const container = document.getElementById('chatMsgs');
  const div = document.createElement('div');
  div.className = `chat-msg ${type}`;
  div.innerHTML = `
    <div class="chat-avatar">${type === 'user' ? '👤' : '🤖'}</div>
    <div class="chat-bubble">${text}</div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function aiRespond(msg) {
  const m = msg.toLowerCase();
  
  if (m.match(/mcdo|mcdonald|burger|fast.?food/i))
    return `🍔 Pour un McDonald's, clique sur "McDonald's" dans les structures populaires !<br><br>Tu auras un tutoriel en 10 étapes avec 1 600+ blocs, un schéma 3D interactif, et la liste complète des matériaux. Les arches dorées en béton jaune sont le détail iconique !`;
  
  if (m.match(/château|chateau|fort|castle/i))
    return `🏰 Le château fort est un classique ! Utilise la section Générateur pour un tutoriel complet : 4 tours, donjon, douves, pont-levis, grande salle. Astuce : varie stone_bricks / cobblestone / mossy_stone_bricks pour un rendu réaliste.`;
  
  if (m.match(/diamant|diamond/i))
    return `💎 Pour trouver des diamants (MC 1.21+) :<br><br>• Mine au niveau Y = -59<br>• Pioche en fer minimum<br>• Fortune III augmente les drops<br>• Strip mining toutes les 2 blocs<br>• Plus dans les grottes exposées<br><br><code>/give @s diamond 64</code> pour les avoir directement !`;
  
  if (m.match(/commande|command/i))
    return `⌨️ Les commandes les plus utiles :<br><br>• <code>/gamemode creative</code> — Mode créatif<br>• <code>/give @s diamond 64</code> — Donner des items<br>• <code>/fill ~ ~ ~ ~10 ~5 ~10 stone</code> — Remplir zone<br>• <code>/effect give @s speed 60 2</code> — Vitesse<br>• <code>/time set day</code> — Mettre le jour<br><br>Va dans l'onglet Commandes pour les 40+ commandes complètes !`;
  
  if (m.match(/enchant/i))
    return `✨ Top enchantements :<br><br>• <strong>Arme :</strong> Tranchant V + Looting III + Réparation<br>• <strong>Outil :</strong> Efficacité V + Fortune III + Réparation<br>• <strong>Armure :</strong> Protection IV + Réparation<br>• <strong>Arc :</strong> Puissance V + Infinity + Flamme<br><br><code>/enchant @s sharpness 5</code>`;
  
  if (m.match(/nether|portail/i))
    return `🔥 Portail du Nether :<br><br>1. Mine 10+ obsidienne<br>2. Cadre 4×5 minimum<br>3. Allume avec briquet<br>4. Entre !<br><br><strong>Prépare :</strong> armure fer, nourriture, blocs, potion Fire Resistance. Objectif : forteresse → Blaze Rods !`;
  
  if (m.match(/end|dragon/i))
    return `🟣 Vaincre l'Ender Dragon :<br><br>1. Forteresse Nether → 7+ Blaze Rods<br>2. Craft Eyes of Ender<br>3. Trouve forteresse de l'End<br>4. Active le portail<br>5. Détruis les cristaux de soin<br>6. Tue le dragon !<br><br><strong>Stuff :</strong> Armure diamant/netherite Prot IV, arc Puissance V, épeé Tranchant V, 64+ blocs, potions soin`;
  
  if (m.match(/redstone/i))
    return `🔴 Bases Redstone :<br><br>• <strong>Torche Redstone :</strong> source signal<br>• <strong>Fil :</strong> transmet 15 blocs max<br>• <strong>Répéteur :</strong> répète + délai<br>• <strong>Comparateur :</strong> compare signaux<br>• <strong>Piston :</strong> pousse blocs<br>• <strong>Observer :</strong> détecte changements<br><br>Tu peux faire des portes auto, ascenseurs, fermes auto !`;
  
  if (m.match(/warden|deep.?dark/i))
    return `🟫 Le Warden est le mob le plus dangereux (500 PV, 30 dmg) :<br><br>• Il est aveugle → utilise des projectiles pour l'éloigner<br>• Il spawn dans l'Ancienne Cité (Deep Dark)<br>• Évite de faire du bruit<br>• Wool sous les pieds = silencieux<br>• Ne le combat JAMAIS directement, esquive-le !`;
  
  if (m.match(/enderman|ender man/i))
    return `🟣 Enderman (40 PV) :<br><br>• Ne regarde pas dans les yeux !<br>• Neutre sauf si tu le regardes<br>• Se téléporte, immunisé aux projectiles<br>• Combat sous un bloc 2 de haut (il fait 3)<br>• Drop Ender Pearls → Eyes of Ender<br>• Eau = il prend des dégâts`;
  
  if (m.match(/village|villageois|villager/i))
    return `👨‍🌾 Villageois :<br><br>• Métiers : Farmer, Librarian, Armorer, Toolsmith...<br>• Change métier avec le bloc de travail correspondant<br>• Commerce émeraudes ↔ items<br>• Cure un zombie villager = prix -50%<br>• Hero of the Village = trades discount massif<br>• Protège avec des Iron Golems !`;
  
  if (m.match(/aide|help|salut|bonjour|hey/i))
    return `👋 Salut ! Je suis ton expert Minecraft. Demande-moi :<br><br>• 🏗️ De construire un bâtiment (ex: "McDonald's")<br>• 💎 Comment trouver des ressources<br>• ⌨️ Des commandes utiles<br>• ✨ Des enchantements recommandés<br>• 🗡️ Comment battre un boss<br>• 🔴 De la Redstone<br>• N'importe quoi d'autre !`;
  
  return `🎮 Bonne question ! Je connais tout sur Minecraft. Tu peux me demander :<br><br>• Des infos sur les blocs, items, mobs<br>• Comment trouver des diamants / émeraudes<br>• Des commandes pour construire<br>• Comment battre le Wither ou l'Ender Dragon<br>• Des astuces de Redstone<br><br>Essaie : <em>"Comment trouver des diamants ?"</em> ou <em>"Construis-moi un château"</em>`;
}

// ── UTILS ──
function copyText(text) {
  navigator.clipboard.writeText(text).then(() => toast('📋 Copié !')).catch(() => {
    const ta = document.createElement('textarea'); ta.value = text;
    document.body.appendChild(ta); ta.select(); document.execCommand('copy');
    document.body.removeChild(ta); toast('📋 Copié !');
  });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}