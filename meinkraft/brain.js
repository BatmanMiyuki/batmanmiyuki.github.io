// MeinkraftAI — Brain (Conversation + Generation + Tutorial)

let conversations = [];
let currentConv = null;
let renderers = new Map(); // canvas -> VoxelRenderer
let currentDBTab = 'blocks';

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
  newChat();
  autoResize(document.getElementById('chatInput'));
});

// ── CONVERSATION MANAGEMENT ──
function newChat() {
  const conv = { id: Date.now(), title: 'Nouvelle conversation', messages: [] };
  conversations.push(conv);
  currentConv = conv;
  document.getElementById('messages').innerHTML = '';
  document.getElementById('welcome').style.display = 'flex';
  updateHistory();
  document.getElementById('topTitle').textContent = conv.title;
}

function updateHistory() {
  const el = document.getElementById('history');
  el.innerHTML = conversations.map(c =>
    `<div class="hist-item ${c === currentConv ? 'active' : ''}" onclick="switchConv(${c.id})">${c.title}</div>`
  ).join('');
}

function switchConv(id) {
  const conv = conversations.find(c => c.id === id);
  if (!conv) return;
  currentConv = conv;
  const msgs = document.getElementById('messages');
  msgs.innerHTML = '';
  conv.messages.forEach(m => appendMsg(m.text, m.type, m.html, false));
  document.getElementById('welcome').style.display = conv.messages.length ? 'none' : 'flex';
  document.getElementById('topTitle').textContent = conv.title;
  updateHistory();
}

// ── MESSAGING ──
function sendMessage() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text || !currentConv) return;
  input.value = '';
  input.style.height = 'auto';
  
  document.getElementById('welcome').style.display = 'none';
  
  appendMsg(text, 'user');
  currentConv.messages.push({ text, type: 'user' });
  
  if (currentConv.messages.length === 1) {
    currentConv.title = text.slice(0, 40) + (text.length > 40 ? '...' : '');
    document.getElementById('topTitle').textContent = currentConv.title;
    updateHistory();
  }
  
  // Show thinking
  const thinkId = showThinking();
  
  // Process with delay for realism
  const thinkTime = 1500 + Math.random() * 2000;
  setTimeout(() => {
    removeThinking(thinkId);
    const response = processMessage(text);
    currentConv.messages.push(response);
  }, thinkTime);
}

function appendMsg(text, type, html = null, scroll = true) {
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.className = `msg ${type}`;
  const avatar = type === 'user' ? '👤' : '🤖';
  const name = type === 'user' ? 'Toi' : 'MeinkraftAI';
  div.innerHTML = `
    <div class="msg-avatar">${avatar}</div>
    <div class="msg-body">
      <div class="msg-name">${name}</div>
      <div class="msg-content">${html || text}</div>
    </div>
  `;
  container.appendChild(div);
  if (scroll) container.scrollTop = container.scrollHeight;
}

function showThinking() {
  const id = 'think-' + Date.now();
  const container = document.getElementById('messages');
  const div = document.createElement('div');
  div.id = id;
  div.className = 'msg ai';
  div.innerHTML = `
    <div class="msg-avatar">🤖</div>
    <div class="msg-body">
      <div class="msg-name">MeinkraftAI</div>
      <div class="thinking"><div class="thinking-dot"></div><div class="thinking-dot"></div><div class="thinking-dot"></div></div>
    </div>
  `;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
  return id;
}

function removeThinking(id) {
  document.getElementById(id)?.remove();
}

// ── AI BRAIN ──
function processMessage(text) {
  const m = text.toLowerCase();
  
  // Check if user wants to build something
  const buildMatch = matchBuildRequest(m);
  if (buildMatch) {
    return handleBuildRequest(buildMatch, text);
  }
  
  // Check if user is approving a build
  if (m.match(/^(ok|oui|go|c'est bon|valide|on y va|let's go|partez?|c'est parti|allez|nickel|parfait|super|génial|cool)/)) {
    // Check context - did we just propose something?
    const lastAI = [...currentConv.messages].reverse().find(msg => msg.type === 'ai');
    if (lastAI && lastAI.buildData) {
      return generateTutorial(lastAI.buildData);
    }
    return makeAIResponse(`D'accord ! Décris-moi ce que tu veux construire et je m'en occupe. 🏗️`);
  }
  
  // Knowledge responses
  if (m.match(/diamant|diamond/))
    return makeAIResponse(`<p><strong>💎 Trouver des diamants (MC 1.21+) :</strong></p>
      <ul>
        <li>Mine au niveau <strong>Y = -59</strong> (optimal)</li>
        <li>Pioche en fer minimum</li>
        <li><strong>Fortune III</strong> = ×2.2 drops en moyenne</li>
        <li>Strip mining toutes les 2 blocs</li>
        <li>Plus dans les grottes exposées</li>
        <li>Silk Touch pour stocker les blocs entiers</li>
      </ul>
      <div class="highlight">Commande rapide : <code>/give @s diamond 64</code></div>`);
  
  if (m.match(/nether|portail/))
    return makeAIResponse(`<p><strong>🔥 Aller dans le Nether :</strong></p>
      <ul>
        <li>Mine <strong>10+ obsidienne</strong> (pioche diamant)</li>
        <li>Construis un cadre <strong>4×5 minimum</strong></li>
        <li>Allume avec un <strong>briquet</strong></li>
        <li>Entre dans le portail (30 secondes de chargement)</li>
      </ul>
      <p><strong>Prépare :</strong> armure fer, nourriture, blocs, potion Fire Resistance</p>
      <p><strong>Objectif :</strong> trouve la forteresse → collecte Blaze Rods → craft Eyes of Ender</p>`);
  
  if (m.match(/end|dragon/))
    return makeAIResponse(`<p><strong>🟣 Vaincre l'Ender Dragon :</strong></p>
      <ol>
        <li>Forteresse Nether → 7+ <strong>Blaze Rods</strong></li>
        <li>Craft <strong>Eyes of Ender</strong> (Blaze Powder + Ender Pearl)</li>
        <li>Lance-les pour trouver la forteresse de l'End</li>
        <li>Active le portail (12 Eyes of Ender)</li>
        <li>Détruis les <strong>cristaux de soin</strong> (pylônes)</li>
        <li>Tue le dragon avec arc + épée</li>
      </ol>
      <div class="highlight"><strong>Stuff recommandé :</strong> Armure diamant/netherite Prot IV, arc Puissance V + Infinity, épée Tranchant V, 64+ blocs, potions soin, lit (pour explosion au End)</div>`);
  
  if (m.match(/redstone/))
    return makeAIResponse(`<p><strong>🔴 Guide Redstone :</strong></p>
      <ul>
        <li><strong>Torche Redstone :</strong> source de signal (niveau 15)</li>
        <li><strong>Fil :</strong> transmet jusqu'à 15 blocs</li>
        <li><strong>Répéteur :</strong> répète le signal + ajoute un délai</li>
        <li><strong>Comparateur :</strong> compare les signaux</li>
        <li><strong>Piston :</strong> pousse les blocs (12 max)</li>
        <li><strong>Piston collant :</strong> pousse ET tire</li>
        <li><strong>Observer :</strong> détecte les changements de bloc</li>
      </ul>
      <p>Tu peux créer des portes automatiques, ascenseurs, fermes auto, et même des ordinateurs !</p>`);
  
  if (m.match(/enchant/))
    return makeAIResponse(`<p><strong>✨ Meilleurs enchantements :</strong></p>
      <ul>
        <li><strong>Arme :</strong> Tranchant V + Looting III + Réparation + Aspect Ardent II</li>
        <li><strong>Outil :</strong> Efficacité V + Fortune III + Réparation + Silk Touch (à switcher)</li>
        <li><strong>Armure :</strong> Protection IV + Réparation + Aqua Affinity + Respiration III</li>
        <li><strong>Arc :</strong> Puissance V + Infinity + Flamme + Punch II</li>
        <li><strong>Trident :</strong> Loyauté III + Channeling (ou Riptide III pour mobilité)</li>
      </ul>
      <div class="highlight">Commande : <code>/enchant @s sharpness 5</code></div>`);
  
  if (m.match(/warden|deep.?dark/))
    return makeAIResponse(`<p><strong>🟫 Le Warden (500 PV, 30 dégâts) :</strong></p>
      <ul>
        <li><strong>Aveugle</strong> → détecte les vibrations et l'odeur</li>
        <li>Ne le combat <strong>JAMAIS</strong> directement</li>
        <li>Utilise de la <strong>laine</strong> sous tes pieds pour ne pas faire de vibrations</li>
        <li>Snowballs / arrows pour distraire</li>
        <li>Spawn dans l'Ancienne Cité (Deep Dark biome)</li>
        <li>Tu peux farmer les Ancient Cities silencieusement</li>
      </ul>`);
  
  if (m.match(/village|villageois|villager|commerce|trade/))
    return makeAIResponse(`<p><strong>👨‍🌾 Guide Villageois :</strong></p>
      <ul>
        <li><strong>13 métiers</strong> possibles (Farmer, Librarian, Armorer...)</li>
        <li>Change le métier avec le <strong>bloc de travail</strong> correspondant</li>
        <li>Cure un zombie villager = <strong>trades -50%</strong></li>
        <li><strong>Hero of the Village</strong> = discounts massifs</li>
        <li>Librarian peut vendre des livres enchantés uniques</li>
        <li>Protège le village avec des Iron Golems</li>
      </ul>`);
  
  if (m.match(/help|aide|salut|bonjour|hey|coucou/))
    return makeAIResponse(`<p>👋 <strong>Salut ! Je suis MeinkraftAI.</strong></p>
      <p>Je peux :</p>
      <ul>
        <li>🏗️ <strong>Construire</strong> : décris ce que tu veux, je génère la maquette 3D + tutoriel</li>
        <li>💎 <strong>Conseiller</strong> : trouver des ressources, enchantements, stratégies</li>
        <li>⚔️ <strong>Bosses</strong> : comment battre le Wither, l'Ender Dragon, le Warden</li>
        <li>🔴 <strong>Redstone</strong> : circuits, automatismes</li>
      </ul>
      <p>Décris-moi ce que tu veux construire !</p>`);
  
  // Default
  return makeAIResponse(`<p>Je comprends ! Peux-tu me décrire plus précisément ce que tu veux ? Par exemple :</p>
    <ul>
      <li>"Je veux un McDonald's réaliste"</li>
      <li>"Construis-moi un château médiéval"</li>
      <li>"Une base secrète souterraine"</li>
    </ul>
    <p>Ou pose-moi une question sur un aspect du jeu (diamants, redstone, enchantements, bosses...)</p>`);
}

// ── BUILD MATCHING ──
function matchBuildRequest(m) {
  const patterns = [
    { key:'mcdonalds', kws:['mcdo','mcdonald','burger','fast food','restaurant rapide'] },
    { key:'castle', kws:['château','chateau','fort','castle','médiéval','medieval','donjon'] },
    { key:'skyscraper', kws:['gratte','immeuble','building','skyscraper','tour','gratte-ciel'] },
    { key:'treehouse', kws:['cabane','arbre','tree','treehouse','maison arbre'] },
    { key:'pirate_ship', kws:['pirate','bateau','navire','ship','pirate','voilier'] },
    { key:'volcano_lair', kws:['volcan','base secrète','lair','volcano','base souterraine','antre'] },
    { key:'futuristic_house', kws:['futuriste','futur','moderne','contemporain','maison moderne'] },
    { key:'church', kws:['église','eglise','chapelle','church','cathédrale','cathedrale'] },
  ];
  
  for (const p of patterns) {
    if (p.kws.some(kw => m.includes(kw))) return p.key;
  }
  
  // Generic build keywords
  if (m.match(/constru|bâtir|batir|faire|créer|creer|générer|generer|build|veux|voudrais|imagine/)) {
    // Extract the subject
    const subject = m.replace(/.*(constru|bâtir|batir|faire|créer|creer|générer|generer|build|veux|voudrais|imagine)\S*\s*/,'').trim();
    return { custom: true, name: subject || 'structure' };
  }
  
  return null;
}

// ── BUILD REQUEST HANDLER ──
function handleBuildRequest(match, originalText) {
  let build;
  
  if (typeof match === 'string') {
    build = BUILDS[match];
  } else if (match.custom) {
    build = generateCustomBuild(match.name);
  }
  
  if (!build) return makeAIResponse("Je n'ai pas trouvé cette structure. Peux-tu reformuler ?");
  
  const total = Object.values(build.materials).reduce((a,b) => a+b, 0);
  const types = Object.keys(build.materials).length;
  
  // Generate viewer HTML
  const viewerId = 'viewer-' + Date.now();
  const viewHtml = `
    <p><strong>${build.emoji} ${build.name}</strong> — ${build.desc}</p>
    <p>📐 <strong>${build.w}×${build.h}×${build.d}</strong> • 📦 <strong>${total.toLocaleString()} blocs</strong> • 🧱 <strong>${types} types</strong></p>
    <p>Voici la maquette 3D :</p>
    <div class="viewer-block" id="${viewerId}">
      <div class="viewer-top">
        <span class="viewer-title">${build.emoji} ${build.name} — Aperçu 3D</span>
        <div class="viewer-views">
          <button class="vv active" onclick="setRView('${viewerId}','perspective',this)">Perspective</button>
          <button class="vv" onclick="setRView('${viewerId}','front',this)">Face</button>
          <button class="vv" onclick="setRView('${viewerId}','side',this)">Côté</button>
          <button class="vv" onclick="setRView('${viewerId}','top',this)">Dessus</button>
          <button class="vv" onclick="setRView('${viewerId}','inside',this)">Intérieur</button>
          <button class="vv" onclick="setRView('${viewerId}','360',this)">360°</button>
        </div>
      </div>
      <canvas class="viewer-canvas" id="canvas-${viewerId}"></canvas>
      <div class="viewer-stats">
        <span>📦 <span class="vs-val">${total.toLocaleString()}</span> blocs</span>
        <span>🧱 <span class="vs-val">${types}</span> types</span>
        <span>📐 <span class="vs-val">${build.w}×${build.h}×${build.d}</span></span>
        <span>⏱️ <span class="vs-val">~${Math.ceil(total/200)} min</span></span>
      </div>
      <div class="viewer-hint">Clique et glisse pour tourner • Molette pour zoomer</div>
    </div>
    <div class="action-row">
      <button class="action-btn primary" onclick="approveBuild('${typeof match === 'string' ? match : 'custom'}')">✅ On y va, génère le tuto !</button>
      <button class="action-btn" onclick="showMaterials('${viewerId}')">📦 Voir les matériaux</button>
    </div>
  `;
  
  const resp = { text: '', type: 'ai', html: viewHtml, buildData: build };
  
  // Append and init viewer
  appendMsg('', 'ai', viewHtml);
  setTimeout(() => {
    const canvas = document.getElementById('canvas-' + viewerId);
    if (canvas) {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 400;
      const r = new VoxelRenderer(canvas);
      r.load(build);
      renderers.set(viewerId, r);
    }
  }, 100);
  
  return resp;
}

function setRView(id, view, btn) {
  const r = renderers.get(id);
  if (r) r.setView(view);
  btn.parentElement.querySelectorAll('.vv').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
}

function approveBuild(key) {
  const build = key === 'custom' ? null : BUILDS[key];
  if (!build) return;
  const thinkId = showThinking();
  setTimeout(() => {
    removeThinking(thinkId);
    const resp = generateTutorial(build);
    currentConv.messages.push(resp);
  }, 2000);
}

function showMaterials(viewerId) {
  // Find the build data from the viewer
  const r = renderers.get(viewerId);
  if (!r || !r.build) return;
  const build = r.build;
  const total = Object.values(build.materials).reduce((a,b) => a+b, 0);
  
  let matHtml = `<div class="mat-total"><span>📦 Total</span><span>${total.toLocaleString()} blocs</span></div>`;
  Object.entries(build.materials).sort((a,b) => b[1]-a[1]).forEach(([id, count]) => {
    const name = getBlockName(id);
    const col = getBlockColor(id);
    matHtml += `<div class="mat-row"><div class="mat-swatch" style="background:${col}"></div><div class="mat-name">${name}</div><div class="mat-count">× ${count.toLocaleString()}</div></div>`;
  });
  
  appendMsg('', 'ai', `<p><strong>📦 Matériaux pour ${build.name} :</strong></p>${matHtml}`);
}

// ── TUTORIAL GENERATOR ──
function generateTutorial(build) {
  const total = Object.values(build.materials).reduce((a,b) => a+b, 0);
  const types = Object.keys(build.materials).length;
  
  // Generate steps HTML
  let stepsHtml = '';
  build.steps.forEach((s, i) => {
    const blockTags = Object.entries(s.b).map(([id, c]) =>
      `<span class="tut-block-tag">${getBlockName(id)}: ×${c}</span>`
    ).join('');
    stepsHtml += `
      <div class="tut-step">
        <div class="tut-step-num">${i+1}</div>
        <div class="tut-step-body">
          <div class="tut-step-title">${s.t}</div>
          <div class="tut-step-desc">${s.d}</div>
          <div class="tut-step-blocks">${blockTags}</div>
        </div>
      </div>`;
  });
  
  // Generate materials HTML
  let matsHtml = `<div class="mat-total"><span>📦 Total</span><span>${total.toLocaleString()} blocs</span></div>`;
  Object.entries(build.materials).sort((a,b) => b[1]-a[1]).forEach(([id, count]) => {
    matsHtml += `<div class="mat-row"><div class="mat-swatch" style="background:${getBlockColor(id)}"></div><div class="mat-name">${getBlockName(id)}</div><div class="mat-count">× ${count.toLocaleString()}</div></div>`;
  });
  
  // Generate schema HTML (layer by layer)
  let schemaHtml = '';
  const layers = Math.min(build.h, 8);
  const gw = Math.min(build.w, 16);
  const gd = Math.min(build.d, 16);
  const matIds = Object.keys(build.materials);
  
  for (let l = 0; l < layers; l++) {
    let cells = '';
    for (let z = 0; z < gd; z++) {
      for (let x = 0; x < gw; x++) {
        const wall = x===0||x===gw-1||z===0||z===gd-1;
        const floor = l===0;
        const roof = l===layers-1;
        const door = (x===Math.floor(gw/2)||x===Math.floor(gw/2)+1)&&z===0&&l<3;
        const win = wall && l>1 && l<layers-2 && ((x%3===1&&(z===0||z===gd-1))||(z%3===1&&(x===0||x===gw-1)));
        
        let bg = 'transparent', sym = '';
        if (door) { bg=getBlockColor('oak_planks'); sym='🚪'; }
        else if (roof) { bg=getBlockColor(matIds[0]); }
        else if (win) { bg='#a8d8ea'; }
        else if (floor) { bg=getBlockColor(matIds[Math.min(2,matIds.length-1)]); }
        else if (wall) { bg=getBlockColor(matIds[0]); }
        
        cells += `<div class="layer-cell" style="background:${bg}">${sym}</div>`;
      }
    }
    schemaHtml += `<div class="layer"><div class="layer-title">Couche ${l+1} (Y=${l})</div><div class="layer-grid" style="grid-template-columns:repeat(${gw},20px)">${cells}</div></div>`;
  }
  
  // Tips HTML
  let tipsHtml = build.tips.map(t => `<div class="tip-card">💡 ${t}</div>`).join('');
  
  // Commands
  let cmdsHtml = `
    <div class="tip-card"><code>/give @s minecraft:${matIds[0]} ${build.materials[matIds[0]]}</code></div>
    <div class="tip-card"><code>/fill ~ ~ ~ ~${build.w} ~${build.h} ~${build.d} minecraft:${matIds[0]} hollow</code></div>
    <div class="tip-card"><code>/gamemode creative</code></div>
    <div class="tip-card"><code>/tp @s ~ ~${build.h+5} ~</code> (vue aérienne)</div>
  `;
  
  // Build tutorial block
  const tutId = 'tut-' + Date.now();
  const tutHtml = `
    <p><strong>📖 Tutoriel : ${build.emoji} ${build.name}</strong></p>
    <p>Suit ces étapes couche par couche pour construire ${build.name} dans Minecraft.</p>
    <div class="tutorial-block" id="${tutId}">
      <div class="tut-header">
        <h3>${build.emoji} ${build.name} — Tutoriel Complet</h3>
      </div>
      <div class="tut-tabs">
        <button class="tut-tab active" onclick="showTutPanel('${tutId}','steps',this)">📖 Étapes</button>
        <button class="tut-tab" onclick="showTutPanel('${tutId}','mats',this)">📦 Matériaux</button>
        <button class="tut-tab" onclick="showTutPanel('${tutId}','schema',this)">📐 Schéma</button>
        <button class="tut-tab" onclick="showTutPanel('${tutId}','tips',this)">💡 Astuces</button>
        <button class="tut-tab" onclick="showTutPanel('${tutId}','cmds',this)">⌨️ Commandes</button>
      </div>
      <div class="tut-panel active" data-p="steps">${stepsHtml}</div>
      <div class="tut-panel" data-p="mats">${matsHtml}</div>
      <div class="tut-panel" data-p="schema">${schemaHtml}</div>
      <div class="tut-panel" data-p="tips">${tipsHtml}</div>
      <div class="tut-panel" data-p="cmds">${cmdsHtml}</div>
    </div>
    <p>Bon courage pour la construction ! 🎮 Si tu veux autre chose, demande-moi.</p>
  `;
  
  return { text: '', type: 'ai', html: tutHtml };
}

function showTutPanel(tutId, panel, btn) {
  const tut = document.getElementById(tutId);
  if (!tut) return;
  tut.querySelectorAll('.tut-tab').forEach(t => t.classList.remove('active'));
  tut.querySelectorAll('.tut-panel').forEach(p => p.classList.remove('active'));
  btn.classList.add('active');
  tut.querySelector(`[data-p="${panel}"]`)?.classList.add('active');
}

// ── CUSTOM BUILD GENERATOR ──
function generateCustomBuild(name) {
  const n = (name || 'structure').toLowerCase();
  
  // Analyze the request to determine style and materials
  let style = 'modern';
  if (n.match(/médiéval|medieval|chateau|fort|donjon|chevalier/)) style = 'medieval';
  else if (n.match(/fantasy|fantaisie|magique|elfe|dragon/)) style = 'fantasy';
  else if (n.match(/japon|japanese|temple|pagode|zen/)) style = 'japanese';
  else if (n.match(/pirate|bateau|navire|boat/)) style = 'pirate';
  else if (n.match(/nether|enfer|demon|noir/)) style = 'nether';
  else if (n.match(/moderne|futuriste|contemporain|villa/)) style = 'modern';
  else if (n.match(/forêt|foret|arbre|cabane|nature/)) style = 'nature';
  
  const size = 16 + Math.floor(Math.random() * 12); // 16-28
  const h = 8 + Math.floor(Math.random() * 8); // 8-16
  
  const styles = {
    modern: { mats:{white_concrete:400,black_concrete:200,glass:250,quartz_block:200,smooth_stone:300,gray_concrete:150}, emoji:'🏠', desc:'Structure moderne' },
    medieval: { mats:{stone_bricks:600,cobblestone:300,oak_planks:250,oak_log:150,oak_fence:100,oak_stairs:80}, emoji:'🏰', desc:'Structure médiévale' },
    fantasy: { mats:{purpur_block:300,end_stone_bricks:200,quartz_block:150,prismarine:100,end_rod:40,glass:60}, emoji:'✨', desc:'Structure fantasy' },
    japanese: { mats:{cherry_planks:300,spruce_planks:200,smooth_stone:250,white_concrete:150,red_concrete:50,black_concrete:80}, emoji:'⛩️', desc:'Structure japonaise' },
    pirate: { mats:{dark_oak_planks:500,spruce_planks:300,oak_planks:200,spruce_log:150,oak_fence:150,white_wool:80}, emoji:'🏴‍☠️', desc:'Structure pirate' },
    nether: { mats:{nether_bricks:500,blackstone:300,basalt:200,netherrack:150,magma_block:80,glass:40}, emoji:'🔥', desc:'Structure du Nether' },
    nature: { mats:{oak_planks:400,oak_log:300,spruce_planks:200,oak_leaves:800,glass:40,oak_fence:100}, emoji:'🌳', desc:'Structure nature' },
  };
  
  const s = styles[style] || styles.modern;
  
  // Scale materials
  const scale = (size * h) / (20 * 12); // relative to medium
  const materials = {};
  for (const [k, v] of Object.entries(s.mats)) {
    materials[k] = Math.round(v * scale);
  }
  
  return {
    name: capitalize(name || 'Structure'),
    emoji: s.emoji,
    desc: s.desc,
    w: size, h, d: size,
    materials,
    steps: generateSteps(name, style, size, h, materials),
    tips: generateTips(style),
  };
}

function generateSteps(name, style, w, h, mats) {
  const matIds = Object.keys(mats);
  const base = matIds[0];
  const accent = matIds[1] || base;
  const detail = matIds[2] || accent;
  const glass = matIds.find(id => id.includes('glass')) || 'glass';
  
  return [
    { t:'Fondations', d:`Délimite une zone de ${w}×${w} blocs. Pose le sol avec ${getBlockName(detail)}. Creuse 2 blocs en profondeur si tu veux une cave.`, b:{[detail]: Math.round(mats[detail]*0.2)} },
    { t:'Murs extérieurs', d:`Élève les murs sur ${h} blocs de haut en ${getBlockName(base)}. Laisse des ouvertures pour les fenêtres (tous les 3 blocs) et les portes (2 blocs de large, 3 de haut).`, b:{[base]: Math.round(mats[base]*0.4)} },
    { t:'Façade et entrée', d:`Décore la façade principale avec ${getBlockName(accent)} pour créer du contraste. L'entrée doit être visible et accueillante.`, b:{[accent]: Math.round(mats[accent]*0.3)} },
    { t:'Fenêtres', d:`Installe le verre dans toutes les ouvertures. Varie les tailles pour un look intéressant.`, b:{[glass]: mats[glass] || 50} },
    { t:'Toiture', d:`Construis le toit. Style ${style === 'modern' ? 'plat avec bordure' : 'en pente avec escaliers'}. Utilise ${getBlockName(base)} et ${getBlockName(accent)}.`, b:{[base]: Math.round(mats[base]*0.2), [accent]: Math.round(mats[accent]*0.2)} },
    { t:'Aménagement intérieur', d:`Divise l'espace en pièces. Ajoute des planchers aux étages. Crée un escalier pour monter.`, b:{[detail]: Math.round(mats[detail]*0.3)} },
    { t:'Éclairage', d:`Place des lanternes, torches ou blocs lumineux. L'éclairage fait toute la différence !`, b:{torch: 20} },
    { t:'Décoration extérieure', d:`Ajoute un jardin, des chemins, des arbres. Aménage les abords du bâtiment.`, b:{[detail]: Math.round(mats[detail]*0.1)} },
    { t:'Détails et finitions', d:`Les petits détails qui font la différence : meubles, panneaux, bannières, fleurs. Prends ton temps !`, b:{[accent]: Math.round(mats[accent]*0.1)} },
  ];
}

function generateTips(style) {
  const base = [
    'Prends ton temps, les détails font la différence',
    'Varie les matériaux pour éviter la monotonie',
    'L\'éclairage change tout — pense jour ET nuit',
    'N\'hésite pas à modifier le design selon tes goûts',
    'Utilise les dalles et escaliers pour créer des courbes',
    'Regarde des références photos avant de construire',
  ];
  const styleTips = {
    modern: ['Béton blanc + verre = combo parfait', 'Formes géométriques simples', 'Pense rooftop avec jardin'],
    medieval: ['Varie stone_bricks/cobblestone/mossy', 'Tours > murs plats', 'Mossy = vieillissement naturel'],
    fantasy: ['Purpur + prismarine = ambiance magique', 'Formes organiques et courbes', 'Éclairage avec end_rod'],
    japanese: ['Cherry wood + blanc = élégance', 'Toits courbés avec escaliers', 'Jardins zen autour'],
    pirate: ['Dark oak = bois de bateau parfait', 'Voiles en laine blanche', 'Drapeau au sommet'],
    nether: ['Nether bricks + blackstone = sombre et puissant', 'Magma_block pour l\'ambiance', 'Pas de fenêtres, c\'est le Nether !'],
    nature: ['Cache la structure dans le feuillage', '2-3 types de bois', 'Campfire au sol = ambiance'],
  };
  return [...(styleTips[style] || []), ...base].slice(0, 8).map(t => `💡 ${t}`);
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── HELPERS ──
function makeAIResponse(html) {
  const resp = { text: '', type: 'ai', html };
  appendMsg('', 'ai', html);
  return resp;
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function useExample(btn) {
  document.getElementById('chatInput').value = btn.textContent;
  sendMessage();
}

function autoResize(el) {
  el.addEventListener('input', () => {
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 150) + 'px';
  });
}

function toggleSidebar() {
  document.getElementById('sidebar').classList.toggle('show');
}

// ── DATABASE MODAL ──
function showDB() {
  document.getElementById('dbModal').classList.add('show');
  dbTab('blocks');
}
function closeDB() {
  document.getElementById('dbModal').classList.remove('show');
}
function dbTab(tab) {
  currentDBTab = tab;
  document.querySelectorAll('.mtab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.mtab[data-t="${tab}"]`)?.classList.add('active');
  document.getElementById('dbSearch').value = '';
  renderDBGrid('');
}
function searchDB(q) { renderDBGrid(q); }

function renderDBGrid(q) {
  const grid = document.getElementById('dbGrid');
  const lq = (q || '').toLowerCase();
  
  if (currentDBTab === 'blocks') {
    const items = Object.entries(BLOCKS).filter(([id, b]) => !lq || b.n.toLowerCase().includes(lq) || id.includes(lq));
    grid.innerHTML = items.slice(0, 100).map(([id, b]) => `
      <div class="db-item" onclick="copyCmd('/give @s minecraft:${id}')">
        <div class="db-icon" style="width:40px;height:40px;margin:0 auto 6px;border-radius:8px;background:${b.c};border:2px solid var(--border2)"></div>
        <div class="db-name">${b.n}</div>
        <div class="db-id">${id}</div>
      </div>
    `).join('');
  } else if (currentDBTab === 'items') {
    const items = ITEMS.filter(i => !lq || i.n.toLowerCase().includes(lq) || i.id.includes(lq));
    grid.innerHTML = items.map(i => `
      <div class="db-item" onclick="copyCmd('/give @s minecraft:${i.id}')">
        <div class="db-icon">${i.e}</div>
        <div class="db-name">${i.n}</div>
        <div class="db-id">${i.id}</div>
      </div>
    `).join('');
  } else if (currentDBTab === 'mobs') {
    const items = MOBS.filter(m => !lq || m.n.toLowerCase().includes(lq) || m.id.includes(lq));
    grid.innerHTML = items.map(m => `
      <div class="db-item" onclick="copyCmd('/summon minecraft:${m.id} ~ ~ ~')">
        <div class="db-icon">${m.e}</div>
        <div class="db-name">${m.n}</div>
        <div class="db-id">❤️ ${m.hp} PV</div>
        <div class="db-extra">${m.h ? '⚔️' : '🟢'} ${m.d}</div>
      </div>
    `).join('');
  } else if (currentDBTab === 'cmds') {
    const items = CMDS.filter(c => !lq || c.c.includes(lq) || c.d.toLowerCase().includes(lq));
    grid.innerHTML = items.map(c => `
      <div class="db-item" onclick="copyCmd('${c.e}')" style="text-align:left">
        <div class="db-name" style="color:var(--accent)">/${c.c}</div>
        <div class="db-id">${c.s}</div>
        <div class="db-extra">${c.d}</div>
      </div>
    `).join('');
  }
}

function copyCmd(cmd) {
  navigator.clipboard.writeText(cmd).then(() => toast('📋 Copié !')).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = cmd;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast('📋 Copié !');
  });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}