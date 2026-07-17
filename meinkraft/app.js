// ============================================
// MINECRAFT IA - APPLICATION PRINCIPALE
// ============================================

let viewer = null;
let currentBuild = null;

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    initBackground();
    initNavigation();
    initDatabase();
    initCommands();
    initRecipes();
    initBiomes();
    
    // Init 3D viewer
    const canvas = document.getElementById('viewerCanvas');
    if (canvas) {
        viewer = new MinecraftViewer(canvas);
        window.addEventListener('resize', () => viewer.resize());
    }
    
    console.log("⛏️ Minecraft IA - Architecte Ultime chargé !");
});

// ============================================
// FONDS ANIMÉS
// ============================================
function initBackground() {
    const bg = document.getElementById('bgAnimation');
    const blockColors = ['#5D8C3E', '#8B6F47', '#808080', '#BC9458', '#DBD3A0', '#3C44AA', '#FF0000', '#FFD700'];
    
    for (let i = 0; i < 30; i++) {
        const block = document.createElement('div');
        block.className = 'floating-block';
        block.style.left = Math.random() * 100 + '%';
        block.style.backgroundColor = blockColors[Math.floor(Math.random() * blockColors.length)];
        block.style.animationDelay = Math.random() * 20 + 's';
        block.style.animationDuration = (15 + Math.random() * 20) + 's';
        block.style.width = (15 + Math.random() * 25) + 'px';
        block.style.height = block.style.width;
        bg.appendChild(block);
    }
}

// ============================================
// NAVIGATION
// ============================================
function initNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            btn.classList.add('active');
            document.getElementById(btn.dataset.section).classList.add('active');
        });
    });
}

// ============================================
// GÉNÉRATEUR
// ============================================
function generateBuild() {
    const input = document.getElementById('buildInput').value;
    const size = document.getElementById('buildSize-select').value;
    const style = document.getElementById('buildStyle').value;
    
    if (!input.trim()) {
        showToast("⚠️ Décris ce que tu veux construire !");
        return;
    }
    
    showToast("🏗️ Génération en cours...");
    
    setTimeout(() => {
        // Chercher dans les structures prédéfinies
        const lowerInput = input.toLowerCase();
        let build = null;
        
        for (const [key, structure] of Object.entries(STRUCTURES)) {
            if (lowerInput.includes(key) || 
                lowerInput.includes(structure.name.toLowerCase()) ||
                (key === 'mcdonalds' && (lowerInput.includes('mcdo') || lowerInput.includes('mcdonald'))) ||
                (key === 'castle' && (lowerInput.includes('château') || lowerInput.includes('chateau') || lowerInput.includes('fort'))) ||
                (key === 'skyscraper' && (lowerInput.includes('gratte') || lowerInput.includes('immeuble') || lowerInput.includes('building'))) ||
                (key === 'treehouse' && (lowerInput.includes('cabane') || lowerInput.includes('arbre') || lowerInput.includes('tree'))) ||
                (key === 'pirate_ship' && (lowerInput.includes('pirate') || lowerInput.includes('bateau') || lowerInput.includes('navire'))) ||
                (key === 'volcano_lair' && (lowerInput.includes('volcan') || lowerInput.includes('base secrète') || lowerInput.includes('villain'))) ||
                (key === 'futuristic_house' && (lowerInput.includes('futuriste') || lowerInput.includes('moderne') || lowerInput.includes('futur'))) ||
                (key === 'church' && (lowerInput.includes('église') || lowerInput.includes('eglise') || lowerInput.includes('chapelle')))) {
                build = structure;
                break;
            }
        }
        
        if (!build) {
            build = generateCustomBuild(input, style, size);
        }
        
        displayBuild(build);
    }, 1000);
}

function quickBuild(type) {
    showToast("🏗️ Construction rapide...");
    
    setTimeout(() => {
        const build = STRUCTURES[type];
        if (build) {
            document.getElementById('buildInput').value = build.name;
            displayBuild(build);
        }
    }, 500);
}

function randomBuild() {
    const types = Object.keys(STRUCTURES);
    const randomType = types[Math.floor(Math.random() * types.length)];
    quickBuild(randomType);
}

function clearBuild() {
    document.getElementById('buildInput').value = '';
    document.getElementById('viewerContainer').style.display = 'none';
    document.getElementById('materialsSection').style.display = 'none';
    document.getElementById('tutorialSection').style.display = 'none';
    document.getElementById('totalBlocks').textContent = '0';
    document.getElementById('uniqueBlocks').textContent = '0';
    document.getElementById('buildTime').textContent = '~0 min';
    document.getElementById('buildSize').textContent = '0x0x0';
    currentBuild = null;
    showToast("🗑️ Effacé !");
}

function displayBuild(build) {
    currentBuild = build;
    
    // Calculer totaux
    const totalBlocks = Object.values(build.materials).reduce((a, b) => a + b, 0);
    const uniqueBlocks = Object.keys(build.materials).length;
    const buildTime = Math.ceil(totalBlocks / 200); // ~200 blocs/min
    
    // Stats
    document.getElementById('totalBlocks').textContent = totalBlocks.toLocaleString();
    document.getElementById('uniqueBlocks').textContent = uniqueBlocks;
    document.getElementById('buildTime').textContent = `~${buildTime} min`;
    document.getElementById('buildSize').textContent = `${build.width}x${build.height}x${build.depth}`;
    
    // Afficher viewer
    document.getElementById('viewerContainer').style.display = 'block';
    if (viewer) {
        viewer.loadBuilding(build);
    }
    
    // Matériaux
    displayMaterials(build);
    
    // Tutoriel
    displayTutorial(build);
    
    showToast(`✅ ${build.name} généré ! (${totalBlocks} blocs)`);
}

function displayMaterials(build) {
    document.getElementById('materialsSection').style.display = 'block';
    const grid = document.getElementById('materialsList');
    
    const materials = Object.entries(build.materials)
        .map(([id, count]) => ({
            id,
            name: viewer ? viewer.getBlockName(id) : id,
            count,
            color: viewer ? viewer.getBlockColor(id, 1) : '#808080'
        }))
        .sort((a, b) => b.count - a.count);
    
    grid.innerHTML = materials.map(m => `
        <div class="material-item">
            <div style="width:32px;height:32px;background:${m.color};border:2px outset #5a5a5a;"></div>
            <div class="material-info">
                <div class="material-name">${m.name}</div>
                <div class="material-count">× ${m.count.toLocaleString()}</div>
            </div>
        </div>
    `).join('');
}

function displayTutorial(build) {
    document.getElementById('tutorialSection').style.display = 'block';
    
    // Overview
    document.getElementById('overviewContent').innerHTML = `
        <div class="generator-container">
            <h3 style="color:#FFD700;font-size:0.8em;margin-bottom:15px;">${build.emoji} ${build.name}</h3>
            <p class="command-desc" style="font-size:0.7em;line-height:2;">${build.description}</p>
            <div style="margin-top:15px;display:grid;grid-template-columns:repeat(2,1fr);gap:10px;">
                <div class="stat-item" style="background:#2a2a2a;padding:10px;border:2px solid #4a4a4a;">
                    <div class="stat-label">Dimensions</div>
                    <div class="stat-value" style="font-size:0.8em;">${build.width} × ${build.height} × ${build.depth}</div>
                </div>
                <div class="stat-item" style="background:#2a2a2a;padding:10px;border:2px solid #4a4a4a;">
                    <div class="stat-label">Types de blocs</div>
                    <div class="stat-value" style="font-size:0.8em;">${Object.keys(build.materials).length}</div>
                </div>
                <div class="stat-item" style="background:#2a2a2a;padding:10px;border:2px solid #4a4a4a;">
                    <div class="stat-label">Nombre d'étapes</div>
                    <div class="stat-value" style="font-size:0.8em;">${build.steps.length}</div>
                </div>
                <div class="stat-item" style="background:#2a2a2a;padding:10px;border:2px solid #4a4a4a;">
                    <div class="stat-label">Temps estimé</div>
                    <div class="stat-value" style="font-size:0.8em;">~${Math.ceil(Object.values(build.materials).reduce((a,b)=>a+b,0)/200)} min</div>
                </div>
            </div>
        </div>
    `;
    
    // Steps
    document.getElementById('tutorialSteps').innerHTML = build.steps.map(step => `
        <div class="step">
            <div class="step-title">${step.title}</div>
            <div class="step-desc">${step.desc}</div>
            <div class="step-blocks">
                <div class="step-blocks-title">📦 Blocs nécessaires pour cette étape :</div>
                ${Object.entries(step.blocks).map(([id, count]) => 
                    `<span style="color:#90EE90;font-size:0.6em;">${viewer ? viewer.getBlockName(id) : id}: ×${count}</span> `
                ).join(' | ')}
            </div>
        </div>
    `).join('');
    
    // Schema (simplified layer view)
    let schemaHTML = '';
    const layerCount = Math.min(build.height, 10);
    const gridW = Math.min(build.width, 16);
    const gridD = Math.min(build.depth, 16);
    
    for (let layer = 0; layer < layerCount; layer++) {
        schemaHTML += `<div class="layer-schema">
            <div class="layer-title">📐 Couche ${layer + 1} (Y=${layer})</div>
            <div class="block-grid" style="grid-template-columns:repeat(${gridW}, 25px);">`;
        
        for (let z = 0; z < gridD; z++) {
            for (let x = 0; x < gridW; x++) {
                const isWall = x === 0 || x === gridW-1 || z === 0 || z === gridD-1;
                const isFloor = layer === 0;
                const isRoof = layer === layerCount - 1;
                const isDoor = (x === Math.floor(gridW/2) || x === Math.floor(gridW/2)+1) && z === 0 && layer < 3;
                
                let bg = 'transparent';
                let symbol = '';
                
                if (isDoor) {
                    bg = '#6B511F';
                    symbol = '🚪';
                } else if (isRoof) {
                    bg = '#7A7A7A';
                } else if (isFloor) {
                    bg = '#A0A0A0';
                } else if (isWall) {
                    bg = '#CFD5D6';
                    if ((x % 4 === 2 && z === 0) || (z % 4 === 2 && x === 0)) {
                        bg = '#C8E8FF';
                        symbol = '⬜';
                    }
                }
                
                schemaHTML += `<div class="block-cell" style="background:${bg};">${symbol}</div>`;
            }
        }
        
        schemaHTML += `</div></div>`;
    }
    document.getElementById('schemaContent').innerHTML = schemaHTML;
    
    // Tips
    document.getElementById('tipsContent').innerHTML = `
        <div class="generator-container">
            <h3 style="color:#FFD700;font-size:0.8em;margin-bottom:15px;">💡 Astuces pour ${build.name}</h3>
            ${build.tips.map(tip => `
                <div style="padding:10px;margin-bottom:8px;background:#2a2a2a;border:2px solid #4a4a4a;">
                    <span style="font-size:0.65em;color:#c6c6c6;line-height:1.8;">${tip}</span>
                </div>
            `).join('')}
        </div>
        <div class="generator-container" style="margin-top:15px;">
            <h3 style="color:#FFD700;font-size:0.8em;margin-bottom:15px;">📋 Commandes Utiles</h3>
            <div class="command-syntax">/give @s minecraft:${Object.keys(build.materials)[0]} ${Object.values(build.materials)[0]}</div>
            <div class="command-syntax">/fill ~ ~ ~ ~${build.width} ~${build.height} ~${build.depth} minecraft:${Object.keys(build.materials)[0]} hollow</div>
            <div class="command-syntax">/tp @s ~ ~${build.height + 5} ~ (vue aérienne)</div>
            <div class="command-syntax">/gamemode creative</div>
        </div>
    `;
}

// ============================================
// VUE 3D
// ============================================
function setView(view) {
    document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
    if (viewer) viewer.setView(view);
}

function setTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
}

// ============================================
// EXPORT
// ============================================
function exportMaterials() {
    if (!currentBuild) {
        showToast("⚠️ Génère d'abord une structure !");
        return;
    }
    
    const text = `=== MATÉRIAUX: ${currentBuild.name} ===\n` +
        `Dimensions: ${currentBuild.width}x${currentBuild.height}x${currentBuild.depth}\n` +
        `Total: ${Object.values(currentBuild.materials).reduce((a,b)=>a+b,0)} blocs\n\n` +
        Object.entries(currentBuild.materials)
            .map(([id, count]) => `${viewer ? viewer.getBlockName(id) : id}: ${count}`)
            .join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Liste copiée dans le presse-papier !");
    }).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast("📋 Liste copiée !");
    });
}

function exportSchematic() {
    if (!currentBuild) {
        showToast("⚠️ Génère d'abord une structure !");
        return;
    }
    showToast("💾 Schéma exporté ! (fichier JSON)");
    
    const data = JSON.stringify(currentBuild, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentBuild.name.replace(/\s+/g, '_')}_schema.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function shareBuild() {
    if (!currentBuild) {
        showToast("⚠️ Génère d'abord une structure !");
        return;
    }
    
    const shareText = `🏗️ ${currentBuild.name} sur Minecraft IA!\n` +
        `${currentBuild.description}\n` +
        `📐 ${currentBuild.width}x${currentBuild.height}x${currentBuild.depth}\n` +
        `📦 ${Object.values(currentBuild.materials).reduce((a,b)=>a+b,0)} blocs`;
    
    if (navigator.share) {
        navigator.share({ title: currentBuild.name, text: shareText });
    } else {
        navigator.clipboard.writeText(shareText);
        showToast("📤 Lien copié pour partage !");
    }
}

// ============================================
// BASE DE DONNÉES
// ============================================
function initDatabase() {
    renderBlocks();
    renderItems();
    renderMobs();
    renderEnchantments();
    renderEffects();
    renderStructures();
}

function renderBlocks() {
    const grid = document.getElementById('blocksGrid');
    if (!grid || !MC_DATA || !MC_DATA.blocks) return;
    
    const categories = ['building', 'nature', 'wood', 'ore', 'mineral', 'decoration', 'redstone', 'light', 'utility', 'nether', 'end', 'special'];
    const uniqueBlocks = [];
    const seen = new Set();
    
    MC_DATA.blocks.forEach(b => {
        if (!seen.has(b.id)) {
            seen.add(b.id);
            uniqueBlocks.push(b);
        }
    });
    
    grid.innerHTML = uniqueBlocks.slice(0, 120).map(b => `
        <div class="item-card" onclick="showBlockInfo('${b.id}')">
            <div class="item-icon">${b.emoji}</div>
            <div class="item-name">${b.name}</div>
            <div class="item-id">${b.id}</div>
        </div>
    `).join('');
}

function renderItems() {
    const grid = document.getElementById('itemsGrid');
    if (!grid) return;
    
    const items = [
        { id: "diamond_sword", name: "Épée de Diamant", emoji: "⚔️" },
        { id: "diamond_pickaxe", name: "Pioche de Diamant", emoji: "⛏️" },
        { id: "diamond_axe", name: "Hache de Diamant", emoji: "🪓" },
        { id: "diamond_shovel", name: "Pelle de Diamant", emoji: "🔧" },
        { id: "diamond_hoe", name: "Houe de Diamant", emoji: "🌾" },
        { id: "netherite_sword", name: "Épée de Netherite", emoji: "⚔️" },
        { id: "netherite_pickaxe", name: "Pioche de Netherite", emoji: "⛏️" },
        { id: "bow", name: "Arc", emoji: "🏹" },
        { id: "crossbow", name: "Arbalète", emoji: "🏹" },
        { id: "trident", name: "Trident", emoji: "🔱" },
        { id: "mace", name: "Masse", emoji: "🔨" },
        { id: "shield", name: "Bouclier", emoji: "🛡️" },
        { id: "elytra", name: "Élytres", emoji: "🦋" },
        { id: "totem_of_undying", name: "Totem d'Immortalité", emoji: "🏅" },
        { id: "golden_apple", name: "Pomme Dorée", emoji: "🍎" },
        { id: "enchanted_golden_apple", name: "Pomme Dorée Enchantée", emoji: "🍎" },
        { id: "ender_pearl", name: "Perle de l'Ender", emoji: "🟣" },
        { id: "blaze_rod", name: "Bâton de Blaze", emoji: "🔥" },
        { id: "blaze_powder", name: "Poudre de Blaze", emoji: "🔥" },
        { id: "eye_of_ender", name: "Œil de l'Ender", emoji: "👁️" },
        { id: "nether_star", name: "Étoile du Nether", emoji: "⭐" },
        { id: "beacon", name: "Balise", emoji: "🔦" },
        { id: "conduit", name: "Conduit", emoji: "🌊" },
        { id: "heart_of_the_sea", name: "Cœur de la Mer", emoji: "💙" },
        { id: "nautilus_shell", name: "Coquille de Nautile", emoji: "🐚" },
        { id: "saddle", name: "Selle", emoji: "🐴" },
        { id: "name_tag", name: "Étiquette", emoji: "🏷️" },
        { id: "lead", name: "Laisse", emoji: "🪢" },
        { id: "compass", name: "Boussole", emoji: "🧭" },
        { id: "clock", name: "Horloge", emoji: "🕐" },
        { id: "map", name: "Carte", emoji: "🗺️" },
        { id: "spyglass", name: "Longue-vue", emoji: "🔭" },
        { id: "recovery_compass", name: "Boussole de Récupération", emoji: "🧭" },
        { id: "bundle", name: "Sac", emoji: "🎒" },
        { id: "fishing_rod", name: "Canne à Pêche", emoji: "🎣" },
        { id: "flint_and_steel", name: "Briquet", emoji: "🔥" },
        { id: "fire_charge", name: "Boule de Feu", emoji: "🔥" },
        { id: "bucket", name: "Seau", emoji: "🪣" },
        { id: "water_bucket", name: "Seau d'Eau", emoji: "🪣" },
        { id: "lava_bucket", name: "Seau de Lave", emoji: "🪣" },
        { id: "milk_bucket", name: "Seau de Lait", emoji: "🪣" },
        { id: "experience_bottle", name: "Bouteille d'Enchantement", emoji: "🧪" },
        { id: "firework_rocket", name: "Fusée de Feu d'Artifice", emoji: "🎆" },
        { id: "firework_star", name: "Étoile de Feu d'Artifice", emoji: "⭐" },
        { id: "written_book", name: "Livre Écrit", emoji: "📖" },
        { id: "writable_book", name: "Livre et Plume", emoji: "📝" },
        { id: "knowledge_book", name: "Livre de Connaissance", emoji: "📚" },
        { id: "enchanted_book", name: "Livre Enchanté", emoji: "📖" },
        { id: "music_disc_13", name: "Disque 13", emoji: "💿" },
        { id: "music_disc_cat", name: "Disque Cat", emoji: "💿" },
        { id: "music_disc_blocks", name: "Disque Blocks", emoji: "💿" },
        { id: "music_disc_chirp", name: "Disque Chirp", emoji: "💿" },
        { id: "music_disc_far", name: "Disque Far", emoji: "💿" },
        { id: "music_disc_mall", name: "Disque Mall", emoji: "💿" },
        { id: "music_disc_mellohi", name: "Disque Mellohi", emoji: "💿" },
        { id: "music_disc_stal", name: "Disque Stal", emoji: "💿" },
        { id: "music_disc_strad", name: "Disque Strad", emoji: "💿" },
        { id: "music_disc_ward", name: "Disque Ward", emoji: "💿" },
        { id: "music_disc_11", name: "Disque 11", emoji: "💿" },
        { id: "music_disc_wait", name: "Disque Wait", emoji: "💿" },
        { id: "music_disc_otherside", name: "Disque Otherside", emoji: "💿" },
        { id: "music_disc_5", name: "Disque 5", emoji: "💿" },
        { id: "music_disc_pigstep", name: "Disque Pigstep", emoji: "💿" },
        { id: "disc_fragment_5", name: "Fragment de Disque 5", emoji: "💿" },
        { id: "goat_horn", name: "Corne de Chèvre", emoji: "📯" },
        { id: "breeze_rod", name: "Tige de Breeze", emoji: "💨" },
        { id: "wind_charge", name: "Charge de Vent", emoji: "💨" },
        { id: "trial_key", name: "Clé d'Épreuve", emoji: "🔑" },
        { id: "ominous_trial_key", name: "Clé d'Épreuve Sinistre", emoji: "🔑" },
        { id: "ominous_bottle", name: "Bouteille Sinistre", emoji: "🧪" },
    ];
    
    grid.innerHTML = items.map(i => `
        <div class="item-card" onclick="showItemInfo('${i.id}')">
            <div class="item-icon">${i.emoji}</div>
            <div class="item-name">${i.name}</div>
            <div class="item-id">${i.id}</div>
        </div>
    `).join('');
}

function renderMobs() {
    const content = document.getElementById('mobsContent');
    if (!content) return;
    
    const mobs = [
        { name: "Zombie", id: "zombie", emoji: "🧟", health: 20, behavior: "Hostile, brûle au soleil" },
        { name: "Squelette", id: "skeleton", emoji: "💀", health: 20, behavior: "Hostile, tire des flèches" },
        { name: "Araignée", id: "spider", emoji: "🕷️", health: 16, behavior: "Hostile la nuit, neutre le jour" },
        { name: "Creeper", id: "creeper", emoji: "💚", health: 20, behavior: "Hostile, explose quand proche" },
        { name: "Enderman", id: "enderman", emoji: "🟣", health: 40, behavior: "Neutre, téléportation" },
        { name: "Blaze", id: "blaze", emoji: "🔥", health: 20, behavior: "Hostile, boules de feu" },
        { name: "Wither Squelette", id: "wither_skeleton", emoji: "🖤", health: 20, behavior: "Hostile, effet Wither" },
        { name: "Ghast", id: "ghast", emoji: "👻", health: 10, behavior: "Hostile, boules de feu explosives" },
        { name: "Piglin", id: "piglin", emoji: "🐷", health: 16, behavior: "Neutre, aime l'or" },
        { name: "Hoglin", id: "hoglin", emoji: "🐗", health: 40, behavior: "Hostile, charge" },
        { name: "Phantom", id: "phantom", emoji: "👻", health: 20, behavior: "Hostile, attaque ceux qui ne dorment pas" },
        { name: "Slime", id: "slime", emoji: "🟢", health: 16, behavior: "Hostile, rebondit" },
        { name: "Magma Cube", id: "magma_cube", emoji: "🟧", health: 16, behavior: "Hostile, rebondit, immunisé à la lave" },
        { name: "Witch", id: "witch", emoji: "🧙", health: 26, behavior: "Hostile, lance des potions" },
        { name: "Ravageur", id: "ravager", emoji: "🐂", health: 100, behavior: "Hostile, très puissant" },
        { name: "Gardien", id: "guardian", emoji: "🐟", health: 30, behavior: "Hostile, laser" },
        { name: "Ancien Gardien", id: "elder_guardian", emoji: "🐟", health: 80, behavior: "Hostile, fatigue minière" },
        { name: "Shulker", id: "shulker", emoji: "📦", health: 30, behavior: "Hostile, projectiles homing" },
        { name: "Endermite", id: "endermite", emoji: "🐛", health: 8, behavior: "Hostile, attiré par les perles" },
        { name: "Silverfish", id: "silverfish", emoji: "🐛", health: 8, behavior: "Hostile, spawn depuis les blocs" },
        { name: "Vex", id: "vex", emoji: "👻", health: 14, behavior: "Hostile, traverse les murs" },
        { name: "Pillager", id: "pillager", emoji: "🏹", health: 24, behavior: "Hostile, arbalète" },
        { name: "Vindicator", id: "vindicator", emoji: "🪓", health: 24, behavior: "Hostile, hache" },
        { name: "Évocateur", id: "evoker", emoji: "🧙", health: 24, behavior: "Hostile, magie" },
        { name: "Warden", id: "warden", emoji: "🟫", health: 500, behavior: "Hostile, aveugle, très puissant" },
        { name: "Breeze", id: "breeze", emoji: "💨", health: 30, behavior: "Hostile, charges de vent" },
        { name: "Creaking", id: "creaking", emoji: "🌳", health: 1, behavior: "Hostile, ne bouge que quand on ne regarde pas" },
        { name: "Villageois", id: "villager", emoji: "👨‍🌾", health: 20, behavior: "Passif, commerce" },
        { name: "Vagabond", id: "wandering_trader", emoji: "🦙", health: 20, behavior: "Passif, commerce rare" },
        { name: "Fermentier", id: "iron_golem", emoji: "🤖", health: 100, behavior: "Neutre, protège les villages" },
        { name: "Snow Golem", id: "snow_golem", emoji: "⛄", health: 4, behavior: "Passif, lance des boules de neige" },
        { name: "Vache", id: "cow", emoji: "🐄", health: 10, behavior: "Passif, drop cuir et viande" },
        { name: "Cochon", id: "pig", emoji: "🐷", health: 10, behavior: "Passif, drop viande" },
        { name: "Mouton", id: "sheep", emoji: "🐑", health: 10, behavior: "Passif, drop laine" },
        { name: "Poulet", id: "chicken", emoji: "🐔", health: 4, behavior: "Passif, drop plumes et œufs" },
        { name: "Cheval", id: "horse", emoji: "🐴", health: 30, behavior: "Passif, montable" },
        { name: "Âne", id: "donkey", emoji: "🫏", health: 30, behavior: "Passif, montable avec coffre" },
        { name: "Loup", id: "wolf", emoji: "🐺", health: 8, behavior: "Neutre, apprivoisable" },
        { name: "Chat", id: "cat", emoji: "🐱", health: 10, behavior: "Passif, apprivoisable, effraie les creepers" },
        { name: "Perroquet", id: "parrot", emoji: "🦜", health: 6, behavior: "Passif, imite les sons des mobs" },
        { name: "Dauphin", id: "dolphin", emoji: "🐬", health: 10, behavior: "Neutre, aide à trouver des trésors" },
        { name: "Tortue", id: "turtle", emoji: "🐢", health: 30, behavior: "Passif, pond des œufs" },
        { name: "Axolotl", id: "axolotl", emoji: "🦎", health: 14, behavior: "Passif, attaque les mobs aquatiques" },
        { name: "Grenouille", id: "frog", emoji: "🐸", health: 10, behavior: "Passif, mange les slimes" },
        { name: "Tadpole", id: "tadpole", emoji: "🐟", health: 6, behavior: "Passif, se transforme en grenouille" },
        { name: "Allay", id: "allay", emoji: "🧚", health: 20, behavior: "Passif, collecte des items" },
        { name: "Sniffer", id: "sniffer", emoji: "🦕", health: 14, behavior: "Passif, fouille le sol" },
        { name: "Armadillo", id: "armadillo", emoji: "🦔", health: 12, behavior: "Passif, drop écailles" },
        { name: "Bébé Zombie", id: "zombie_villager", emoji: "🧟", health: 20, behavior: "Hostile, peut être guéri" },
        { name: "Wither", id: "wither", emoji: "💀", health: 300, behavior: "Boss, destruction" },
        { name: "Ender Dragon", id: "ender_dragon", emoji: "🐉", health: 200, behavior: "Boss final, crache du feu" },
        { name: "Elder Guardian", id: "elder_guardian", emoji: "🐟", health: 80, behavior: "Mini-boss, fatigue minière" },
        { name: "Warden", id: "warden", emoji: "🟫", health: 500, behavior: "Ultra-mob, 30 dégâts par coup" },
    ];
    
    const uniqueMobs = [];
    const seen = new Set();
    mobs.forEach(m => {
        if (!seen.has(m.id)) {
            seen.add(m.id);
            uniqueMobs.push(m);
        }
    });
    
    content.innerHTML = uniqueMobs.map(m => `
        <div class="command-card" style="display:flex;align-items:center;gap:15px;">
            <div style="font-size:2em;">${m.emoji}</div>
            <div style="flex:1;">
                <div style="color:#FFD700;font-size:0.7em;margin-bottom:5px;">${m.name}</div>
                <div style="color:#90EE90;font-size:0.55em;">❤️ PV: ${m.health} | ${m.behavior}</div>
                <div style="color:#666;font-size:0.5em;margin-top:3px;">ID: ${m.id}</div>
            </div>
            <button class="mc-btn" style="font-size:0.5em;padding:8px;" onclick="copyCommand('/summon minecraft:${m.id} ~ ~ ~')">📋 Summon</button>
        </div>
    `).join('');
}

function renderEnchantments() {
    const content = document.getElementById('enchantmentsContent');
    if (!content) return;
    
    const enchants = [
        { name: "Tranchant", id: "sharpness", max: 5, desc: "Augmente les dégâts" },
        { name: "Effilochage", id: "sweeping", max: 3, desc: "Dégâts de zone" },
        { name: "Smite", id: "smite", max: 5, desc: "Dégâts aux morts-vivants" },
        { name: "Châtiment des arthropodes", id: "bane_of_arthropods", max: 5, desc: "Dégâts aux arthropodes" },
        { name: "Knockback", id: "knockback", max: 2, desc: "Repousse les ennemis" },
        { name: "Aspect ardent", id: "fire_aspect", max: 2, desc: "Mets le feu aux ennemis" },
        { name: "Looting", id: "looting", max: 3, desc: "Augmente les drops" },
        { name: "Tranchant", id: "sharpness", max: 5, desc: "Dégâts supplémentaires" },
        { name: "Efficacité", id: "efficiency", max: 5, desc: "Mine plus vite" },
        { name: "Fortune", id: "fortune", max: 3, desc: "Plus de drops de minerais" },
        { name: "Silk Touch", id: "silk_touch", max: 1, desc: "Récupère les blocs tels quels" },
        { name: "Solidité", id: "unbreaking", max: 3, desc: "Durabilité augmentée" },
        { name: "Réparation", id: "mending", max: 1, desc: "Répare avec l'XP" },
        { name: "Infinity", id: "infinity", max: 1, desc: "Flèches infinies" },
        { name: "Puissance", id: "power", max: 5, desc: "Plus de dégâts à l'arc" },
        { name: "Flamme", id: "flame", max: 1, desc: "Flèches enflammées" },
        { name: "Punch", id: "punch", max: 2, desc: "Repousse avec l'arc" },
        { name: "Protection", id: "protection", max: 4, desc: "Réduit tous les dégâts" },
        { name: "Protection contre le feu", id: "fire_protection", max: 4, desc: "Réduit les dégâts de feu" },
        { name: "Protection contre les explosions", id: "blast_protection", max: 4, desc: "Réduit les dégâts d'explosion" },
        { name: "Protection contre les projectiles", id: "projectile_protection", max: 4, desc: "Réduit les dégâts de projectiles" },
        { name: "Respiration", id: "respiration", max: 3, desc: "Respire sous l'eau" },
        { name: "Aqua Affinity", id: "aqua_affinity", max: 1, desc: "Mine vite sous l'eau" },
        { name: "Épineuses", id: "thorns", max: 3, desc: "Renvoie les dégâts" },
        { name: "Chute amortie", id: "feather_falling", max: 4, desc: "Réduit les dégâts de chute" },
        { name: "Depth Strider", id: "depth_strider", max: 3, desc: "Nage plus vite" },
        { name: "Frost Walker", id: "frost_walker", max: 2, desc: "Gèle l'eau sous les pieds" },
        { name: "Soul Speed", id: "soul_speed", max: 3, desc: "Court vite sur le sable des âmes" },
        { name: "Loyauté", id: "loyalty", max: 3, desc: "Le trident revient" },
        { name: "Riptide", id: "riptide", max: 3, desc: "Propulsion dans l'eau/pluie" },
        { name: "Channeling", id: "channeling", max: 1, desc: "Invoque la foudre" },
        { name: "Impaling", id: "impaling", max: 5, desc: "Dégâts aux mobs aquatiques" },
        { name: "Multishot", id: "multishot", max: 1, desc: "Tire 3 flèches" },
        { name: "Quick Charge", id: "quick_charge", max: 3, desc: "Recharge plus vite" },
        { name: "Piercing", id: "piercing", max: 4, desc: "Traverse les entités" },
        { name: "Curse of Vanishing", id: "vanishing_curse", max: 1, desc: "Disparaît à la mort" },
        { name: "Curse of Binding", id: "binding_curse", max: 1, desc: "Ne peut pas être retiré" },
        { name: "Wind Burst", id: "wind_burst", max: 3, desc: "Crée une explosion de vent" },
        { name: "Density", id: "density", max: 5, desc: "Plus de dégâts en chute" },
        { name: "Breach", id: "breach", max: 4, desc: "Perce l'armure" },
    ];
    
    content.innerHTML = enchants.map(e => `
        <div class="command-card" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="color:#FFD700;font-size:0.7em;">✨ ${e.name}</div>
                <div style="color:#90EE90;font-size:0.55em;">${e.desc} (Max: ${e.max})</div>
                <div style="color:#666;font-size:0.5em;">ID: ${e.id}</div>
            </div>
            <button class="mc-btn" style="font-size:0.5em;padding:8px;" onclick="copyCommand('/enchant @s minecraft:${e.id} ${e.max}')">📋 Niv. ${e.max}</button>
        </div>
    `).join('');
}

function renderEffects() {
    const content = document.getElementById('effectsContent');
    if (!content) return;
    
    const effects = [
        { name: "Vitesse", id: "speed", emoji: "💨", desc: "Augmente la vitesse de déplacement" },
        { name: "Lenteur", id: "slowness", emoji: "🐌", desc: "Réduit la vitesse de déplacement" },
        { name: "Hâte", id: "haste", emoji: "⛏️", desc: "Augmente la vitesse de minage" },
        { name: "Fatigue Minière", id: "mining_fatigue", emoji: "😴", desc: "Réduit la vitesse de minage" },
        { name: "Force", id: "strength", emoji: "💪", desc: "Augmente les dégâts" },
        { name: "Instant Health", id: "instant_health", emoji: "❤️", desc: "Restaure des PV" },
        { name: "Instant Damage", id: "instant_damage", emoji: "💀", desc: "Inflige des dégâts" },
        { name: "Saut Amélioré", id: "jump_boost", emoji: "🦘", desc: "Augmente la hauteur de saut" },
        { name: "Nausée", id: "nausea", emoji: "🤢", desc: "Distord la vision" },
        { name: "Régénération", id: "regeneration", emoji: "💖", desc: "Régénère les PV" },
        { name: "Résistance", id: "resistance", emoji: "🛡️", desc: "Réduit les dégâts" },
        { name: "Résistance au Feu", id: "fire_resistance", emoji: "🔥", desc: "Immunise au feu" },
        { name: "Apnée", id: "water_breathing", emoji: "🫁", desc: "Respire sous l'eau" },
        { name: "Invisibilité", id: "invisibility", emoji: "👻", desc: "Rend invisible" },
        { name: "Vision Nocturne", id: "night_vision", emoji: "👁️", desc: "Voit dans le noir" },
        { name: "Faim", id: "hunger", emoji: "🍔", desc: "Augmente la faim" },
        { name: "Faiblesse", id: "weakness", emoji: "😵", desc: "Réduit les dégâts" },
        { name: "Poison", id: "poison", emoji: "☠️", desc: "Inflige des dégâts (1 PV)" },
        { name: "Wither", id: "wither", emoji: "💀", desc: "Inflige des dégâts" },
        { name: "Absorption", id: "absorption", emoji: "💛", desc: "Ajoute des PV bonus" },
        { name: "Saturation", id: "saturation", emoji: "🍽️", desc: "Restaure la faim" },
        { name: "Lévitation", id: "levitation", emoji: "🎈", desc: "Fait léviter" },
        { name: "Luck", id: "luck", emoji: "🍀", desc: "Augmente la chance" },
        { name: "Bad Luck", id: "unluck", emoji: "🍀", desc: "Réduit la chance" },
        { name: "Slow Falling", id: "slow_falling", emoji: "🪶", desc: "Tombe lentement" },
        { name: "Conduit Power", id: "conduit_power", emoji: "🌊", desc: "Mine vite sous l'eau" },
        { name: "Dolphins Grace", id: "dolphins_grace", emoji: "🐬", desc: "Nage très vite" },
        { name: "Darkness", id: "darkness", emoji: "🌑", desc: "Assombrit l'écran" },
    ];
    
    content.innerHTML = effects.map(e => `
        <div class="command-card" style="display:flex;justify-content:space-between;align-items:center;">
            <div>
                <div style="color:#FFD700;font-size:0.7em;">${e.emoji} ${e.name}</div>
                <div style="color:#90EE90;font-size:0.55em;">${e.desc}</div>
                <div style="color:#666;font-size:0.5em;">ID: ${e.id}</div>
            </div>
            <button class="mc-btn" style="font-size:0.5em;padding:8px;" onclick="copyCommand('/effect give @s minecraft:${e.id} 60 1 true')">📋 Activer</button>
        </div>
    `).join('');
}

function renderStructures() {
    const content = document.getElementById('structuresContent');
    if (!content) return;
    
    const structures = [
        { name: "Village", desc: "Villages de villageois avec maisons, fermes et marchés", biome: "Plaine, Savane, Taïga, Désert, Toundra" },
        { name: "Donjon (Dungeon)", desc: "Petite salle avec spawner de mob et coffres", biome: "Souterrain" },
        { name: "Temple du Désert", desc: "Temple de sable avec pièges et trésors", biome: "Désert" },
        { name: "Temple de la Jungle", desc: "Temple végétal avec pièges à flèches", biome: "Jungle" },
        { name: "Manoir Woodland", desc: "Gigantesque manoir avec pillagers et trésors", biome: "Forêt Sombre" },
        { name: "Monument Océanique", desc: "Monument sous-marin avec guardians", biome: "Océan Profond" },
        { name: "Forteresse du Nether", desc: "Structure du Nether avec blazes et wither squelettes", biome: "Nether" },
        { name: "Cité de l'End", desc: "Ville de l'End avec shulkers et élytres", biome: "End" },
        { name: "Tour de Pillage", desc: "Tour des pillagers avec butin", biome: "Plaine, Taïga" },
        { name: "Rempart des Bastions", desc: "Structures du Nether avec piglins et trésors", biome: "Nether" },
        { name: "Ruines Océaniques", desc: "Ruines sous-marines avec trésors", biome: "Océan" },
        { name: "Épave", desc: "Navires échoués avec coffres", biome: "Océan" },
        { name: "Trésor Enterré", desc: "Coffre sous le sable", biome: "Plage" },
        { name: "Cartographe", desc: "Carte vers les structures", biome: "Village" },
        { name: "Portail de l'End", desc: "Portail vers la dimension de l'End", biome: "Forteresse" },
        { name: "Portail du Nether", desc: "Portail vers le Nether", biome: "Overworld" },
        { name: "Chambre Sculk", desc: "Chambre deepslate avec sculk et warden", biome: "Deep Dark" },
        { name: "Ancienne Cité", desc: "Cité sculk avec le Warden", biome: "Deep Dark" },
        { name: "Salle d'Épreuve", desc: "Structure avec Trial Spawner", biome: "Overworld" },
        { name: "Chambre de l'Épreuve", desc: "Salle de combat avec générateurs", biome: "Overworld" },
    ];
    
    content.innerHTML = structures.map(s => `
        <div class="command-card">
            <div style="color:#FFD700;font-size:0.7em;margin-bottom:5px;">🏗️ ${s.name}</div>
            <div style="color:#c6c6c6;font-size:0.6em;line-height:1.8;">${s.desc}</div>
            <div style="color:#90EE90;font-size:0.55em;margin-top:5px;">🌍 Biome: ${s.biome}</div>
        </div>
    `).join('');
}

// ============================================
// COMMANDES
// ============================================
function initCommands() {
    const list = document.getElementById('commandsList');
    if (!list) return;
    
    const commands = [
        { name: "/give", syntax: "/give <cible> <item> [quantité]", desc: "Donne un item à un joueur", example: "/give @s diamond 64" },
        { name: "/tp", syntax: "/tp <cible> <x> <y> <z>", desc: "Téléporte un joueur", example: "/tp @s 0 100 0" },
        { name: "/effect", syntax: "/effect give <cible> <effet> [durée] [amplificateur]", desc: "Applique un effet de potion", example: "/effect give @s speed 60 2" },
        { name: "/gamemode", syntax: "/gamemode <mode> [cible]", desc: "Change le mode de jeu", example: "/gamemode creative" },
        { name: "/difficulty", syntax: "/difficulty <difficulté>", desc: "Change la difficulté", example: "/difficulty peaceful" },
        { name: "/time", syntax: "/time set <valeur>", desc: "Change l'heure", example: "/time set day" },
        { name: "/weather", syntax: "/weather <météo> [durée]", desc: "Change la météo", example: "/weather clear" },
        { name: "/fill", syntax: "/fill <x1> <y1> <z1> <x2> <y2> <z2> <bloc>", desc: "Remplit une zone avec des blocs", example: "/fill ~ ~ ~ ~10 ~5 ~10 stone" },
        { name: "/clone", syntax: "/clone <x1> <y1> <z1> <x2> <y2> <z2> <x> <y> <z>", desc: "Copie une structure", example: "/clone 0 0 0 10 10 10 100 0 0" },
        { name: "/setblock", syntax: "/setblock <x> <y> <z> <bloc>", desc: "Place un bloc", example: "/setblock ~ ~ ~ diamond_block" },
        { name: "/summon", syntax: "/summon <entité> [x] [y] [z]", desc: "Invoque une entité", example: "/summon zombie ~ ~ ~" },
        { name: "/kill", syntax: "/kill [cible]", desc: "Tue une entité", example: "/kill @e[type=zombie]" },
        { name: "/clear", syntax: "/clear [cible] [item] [max]", desc: "Inventaire d'un joueur", example: "/clear @s diamond 0" },
        { name: "/enchant", syntax: "/enchant <cible> <enchantement> [niveau]", desc: "Enchante un item", example: "/enchant @s sharpness 5" },
        { name: "/xp", syntax: "/xp <quantité> [cible]", desc: "Donne de l'XP", example: "/xp 1000L @s" },
        { name: "/spawnpoint", syntax: "/spawnpoint [cible] [x] [y] [z]", desc: "Définit le point d'apparition", example: "/spawnpoint @s" },
        { name: "/gamerule", syntax: "/gamerule <règle> [valeur]", desc: "Change les règles du jeu", example: "/gamerule keepInventory true" },
        { name: "/title", syntax: "/title <cible> <action> <texte>", desc: "Affiche un titre", example: "/title @s title {\"text\":\"Salut!\"}" },
        { name: "/say", syntax: "/say <message>", desc: "Envoie un message à tous", example: "/say Bonjour tout le monde !" },
        { name: "/msg", syntax: "/msg <cible> <message>", desc: "Message privé", example: "/msg Steve Salut !" },
        { name: "/team", syntax: "/team <action> [nom]", desc: "Gestion des équipes", example: "/team add MonEquipe" },
        { name: "/scoreboard", syntax: "/scoreboard <objectif> <action>", desc: "Tableau de scores", example: "/scoreboard objectives add kills playerKillCount" },
        { name: "/execute", syntax: "/execute <cible> <position> <commande>", desc: "Exécute une commande", example: "/execute as @a run say Hello" },
        { name: "/particle", syntax: "/particle <particule> <x> <y> <z>", desc: "Crée des particules", example: "/particle flame ~ ~ ~ 1 1 1 0.1 100" },
        { name: "/playsound", syntax: "/playsound <son> <source> <cible>", desc: "Joue un son", example: "/playsound minecraft:block.note_block.pling master @s" },
        { name: "/stopsound", syntax: "/stopsound <cible> [source]", desc: "Stop un son", example: "/stopsound @s" },
        { name: "/worldborder", syntax: "/worldborder <action> <valeur>", desc: "Bordure du monde", example: "/worldborder set 1000" },
        { name: "/locate", syntax: "/locate <structure>", desc: "Trouve une structure", example: "/locate structure village" },
        { name: "/locatebiome", syntax: "/locatebiome <biome>", desc: "Trouve un biome", example: "/locatebiome jungle" },
        { name: "/teleport", syntax: "/tp <cible> <destination>", desc: "Téléportation avancée", example: "/tp @s @a[limit=1]" },
        { name: "/item", syntax: "/item <cible> <slot> <item>", desc: "Modifie les items", example: "/item replace entity @s weapon.mainhand with diamond_sword" },
        { name: "/attribute", syntax: "/attribute <cible> <attribut> <action>", desc: "Modifie les attributs", example: "/attribute @s generic.max_health base set 40" },
        { name: "/damage", syntax: "/damage <cible> <quantité> [type]", desc: "Inflige des dégâts", example: "/damage @s 10 minecraft:fall" },
        { name: "/ride", syntax: "/ride <cible> mount <monture>", desc: "Fait monter sur une entité", example: "/ride @s mount @e[type=horse,limit=1]" },
        { name: "/return", syntax: "/return <valeur>", desc: "Retourne une valeur de fonction", example: "/return 1" },
        { name: "/data", syntax: "/data <cible> <action> <path>", desc: "Modifie les NBT", example: "/data merge entity @e[type=zombie,limit=1] {CustomName:\"ZombieChef\"}" },
        { name: "/bossbar", syntax: "/bossbar <action> <id>", desc: "Barre de boss", example: "/bossbar add mybar \"Mon Boss\"" },
        { name: "/schedule", syntax: "/schedule <action> <fonction> <délai>", desc: "Planifie une fonction", example: "/schedule function my:function 10s" },
        { name: "/recipe", syntax: "/recipe <action> <cible> <recette>", desc: "Déverrouille des recettes", example: "/recipe give @s *" },
        { name: "/advancement", syntax: "/advancement <action> <cible> <avancement>", desc: "Gestion des avancements", example: "/advancement grant @s everything" },
        { name: "/tag", syntax: "/tag <cible> <action> <tag>", desc: "Gestion des tags", example: "/tag @s add monTag" },
        { name: "/forceload", syntax: "/forceload <action> <x> <z>", desc: "Force le chargement de chunks", example: "/forceload add ~ ~" },
        { name: "/setworldspawn", syntax: "/setworldspawn [x] [y] [z]", desc: "Définit le spawn du monde", example: "/setworldspawn 0 100 0" },
        { name: "/spectate", syntax: "/spectate [cible] [joueur]", desc: "Mode spectateur sur une entité", example: "/spectate @e[type=villager,limit=1]" },
        { name: "/spreadplayers", syntax: "/spreadplayers <x> <z> <espacement> <rayon> <cible>", desc: "Disperse les joueurs", example: "/spreadplayers 0 0 100 500 @a" },
        { name: "/place", syntax: "/place <feature> [x] [y] [z]", desc: "Place une structure", example: "/place structure village" },
        { name: "/jfr", syntax: "/jfr start/stop", desc: "Enregistre les performances", example: "/jfr start" },
    ];
    
    list.innerHTML = commands.map(c => `
        <div class="command-card">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <div style="color:#FFD700;font-size:0.8em;">${c.name}</div>
                <button class="mc-btn" style="font-size:0.5em;padding:6px 10px;" onclick="copyCommand('${c.example}')">📋 Copier</button>
            </div>
            <div class="command-syntax">${c.syntax}</div>
            <div class="command-desc">${c.desc}</div>
            <div style="margin-top:8px;padding:8px;background:rgba(0,0,0,0.3);border:1px solid #4a4a4a;">
                <div style="color:#90EE90;font-size:0.5em;">💡 Exemple:</div>
                <div style="color:#FFD700;font-size:0.6em;font-family:monospace;">${c.example}</div>
            </div>
        </div>
    `).join('');
}

function searchCommands(query) {
    const items = document.querySelectorAll('#commandsList .command-card');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? 'block' : 'none';
    });
}

// ============================================
// RECETTES
// ============================================
function initRecipes() {
    renderRecipes();
}

function renderRecipes() {
    const list = document.getElementById('recipesList');
    if (!list) return;
    
    const recipes = [
        { name: "Épée de Diamant", result: "⚔️", ingredients: ["💎", "💎", "🪵"], grid: [["","💎",""],["","💎",""],["","🪵",""]] },
        { name: "Pioche de Diamant", result: "⛏️", ingredients: ["💎","🪵","🪵"], grid: [["💎","💎","💎"],["","🪵",""],["","🪵",""]] },
        { name: "Hache de Diamant", result: "🪓", ingredients: ["💎","🪵"], grid: [["💎","💎",""],["💎","🪵",""],["","🪵",""]] },
        { name: "Établi", result: "🔨", ingredients: ["🪵","🪵"], grid: [["🪵","🪵",""],["🪵","🪵",""],["","",""]] },
        { name: "Fourneau", result: "🔥", ingredients: ["🪨","🪨"], grid: [["🪨","🪨","🪨"],["🪨","","🪨"],["🪨","🪨","🪨"]] },
        { name: "Coffre", result: "📦", ingredients: ["🪵","🪵"], grid: [["🪵","🪵","🪵"],["🪵","","🪵"],["🪵","🪵","🪵"]] },
        { name: "Lit", result: "🛏️", ingredients: ["🪵","🧶"], grid: [["🧶","🧶","🧶"],["🪵","🪵","🪵"],["","",""]] },
        { name: "Torche", result: "🔦", ingredients: ["⬛","🪵"], grid: [["","⬛",""],["","🪵",""],["","",""]] },
        { name: "Enclume", result: "⚒️", ingredients: ["⬜","🪵"], grid: [["⬜","⬜","⬜"],["","⬜",""],["⬜","⬜","⬜"]] },
        { name: "Table d'Enchantement", result: "✨", ingredients: ["📖","💎","⬛"], grid: [["","📖",""],["💎","⬛","💎"],["⬛","⬛","⬛"]] },
        { name: "Balise", result: "🔦", ingredients: ["💎","⬛","⭐"], grid: [["💎","💎","💎"],["💎","⭐","💎"],["⬛","⬛","⬛"]] },
        { name: "Portail du Nether", result: "🟣", ingredients: ["⬛"], grid: [["⬛","⬛","⬛"],["⬛","","⬛"],["⬛","⬛","⬛"]] },
        { name: "Arc", result: "🏹", ingredients: ["🪵","🕸️"], grid: [["","🪵","🕸️"],["🪵","","🕸️"],["","🪵","🕸️"]] },
        { name: "Bouclier", result: "🛡️", ingredients: ["🪵","⬜"], grid: [["🪵","⬜","🪵"],["🪵","🪵","🪵"],["","🪵",""]] },
        { name: "Fusée de Feu d'Artifice", result: "🎆", ingredients: ["📜","🪨","⭐"], grid: [["","⭐",""],["","🪨",""],["","📜",""]] },
    ];
    
    list.innerHTML = recipes.map(r => `
        <div class="item-card" style="padding:15px;">
            <div style="font-size:2em;margin-bottom:8px;">${r.result}</div>
            <div class="item-name" style="margin-bottom:10px;">${r.name}</div>
            <div style="display:grid;grid-template-columns:repeat(3,28px);gap:2px;justify-content:center;">
                ${r.grid.flat().map(cell => 
                    `<div style="width:28px;height:28px;background:#2a2a2a;border:1px solid #4a4a4a;display:flex;align-items:center;justify-content:center;font-size:0.8em;">${cell}</div>`
                ).join('')}
            </div>
        </div>
    `).join('');
}

function searchRecipes(query) {
    const items = document.querySelectorAll('#recipesList .item-card');
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query.toLowerCase()) ? 'grid-item' : 'none';
    });
}

// ============================================
// BIOMES
// ============================================
function initBiomes() {
    const content = document.getElementById('biomesContent');
    if (!content) return;
    
    const biomes = [
        { name: "Plaines", emoji: "🌿", color: "#5D8C3E", temp: "Modéré", mobs: "Vache, Cochon, Mouton, Villageois", features: "Villages, Éoliennes" },
        { name: "Forêt", emoji: "🌲", color: "#2A6A1A", temp: "Modéré", mobs: "Loup, Renard, Abeille", features: "Arbres, Champignons" },
        { name: "Désert", emoji: "🏜️", color: "#DBD3A0", temp: "Chaud", mobs: "Husk, Lapin", features: "Temple du Désert, Pyramide" },
        { name: "Jungle", emoji: "🌴", color: "#3A6A1A", temp: "Chaud", mobs: "Perroquet, Ocelot, Panda", features: "Temple, Arbre Géant" },
        { name: "Montagne", emoji: "⛰️", color: "#808080", temp: "Froid", mobs: "Chèvre, Llama", features: "Émeraudes, Neige" },
        { name: "Taïga", emoji: "🌲", color: "#1A4A1A", temp: "Froid", mobs: "Loup, Renard, Villageois", features: "Villages, Baies" },
        { name: "Savane", emoji: "🌾", color: "#C8A82E", temp: "Chaud", mobs: "Cheval, Âne, Lion", features: "Villages, Acacias" },
        { name: "Toundra", emoji: "❄️", color: "#F0F0F0", temp: "Glacial", mobs: "Ours Polaire, Lapin Arctique", features: "Igloos, Glace" },
        { name: "Marais", emoji: "🐸", color: "#3A5A2A", temp: "Modéré", mobs: "Grenouille, Slime", features: "Cabanes de Sorcière, Vase" },
        { name: "Champignons", emoji: "🍄", color: "#6A5A7A", temp: "Modéré", mobs: "Mooshroom", features: "Vaches Champignon, Mycélium" },
        { name: "Océan", emoji: "🌊", color: "#3F76E4", temp: "Modéré", mobs: "Gardien, Poisson, Dauphin", features: "Monument, Ruines, Épaves" },
        { name: "Plage", emoji: "🏖️", color: "#DBD3A0", temp: "Modéré", mobs: "Tortue", features: "Trésor Enterré, Canne à Sucre" },
        { name: "Forêt Fleury", emoji: "🌸", color: "#E8B4B8", temp: "Modéré", mobs: "Abeille", features: "Arbres de Cerisier, Pétales" },
        { name: "Caverne Lush", emoji: "🌿", color: "#5A8A3A", temp: "Modéré", mobs: "Axolotl", features: "Mousse, Baies, Grottes" },
        { name: "Deep Dark", emoji: "🌑", color: "#0A2A2A", temp: "Froid", mobs: "Warden", features: "Ancienne Cité, Sculk" },
        { name: "Nether", emoji: "🔥", color: "#6A1A1A", temp: "Brûlant", mobs: "Piglin, Ghast, Blaze, Wither Squelette", features: "Forteresse, Bastion, Portail" },
        { name: "End", emoji: "🟣", color: "#1B0B2A", temp: "Aucun", mobs: "Enderman, Shulker, Dragon", features: "Cité de l'End, Portail, Chorus" },
        { name: "Crimson Forest", emoji: "🔴", color: "#8A1A1A", temp: "Chaud", mobs: "Piglin, Hoglin", features: "Champignons Cramoisis" },
        { name: "Warped Forest", emoji: "🟢", color: "#1A6A6A", temp: "Chaud", mobs: "Enderman", features: "Champignons Distordus" },
        { name: "Soul Sand Valley", emoji: "💀", color: "#5A4A2A", temp: "Chaud", mobs: "Ghast, Squelette", features: "Sable des Âmes, Basalte" },
    ];
    
    content.innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:15px;">
            ${biomes.map(b => `
                <div class="command-card" style="border-left:4px solid ${b.color};">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                        <span style="font-size:1.5em;">${b.emoji}</span>
                        <span style="color:#FFD700;font-size:0.7em;">${b.name}</span>
                    </div>
                    <div style="font-size:0.55em;color:#90EE90;margin-bottom:5px;">🌡️ Température: ${b.temp}</div>
                    <div style="font-size:0.55em;color:#c6c6c6;margin-bottom:5px;">👾 Mobs: ${b.mobs}</div>
                    <div style="font-size:0.55em;color:#FFA500;">✨ ${b.features}</div>
                </div>
            `).join('')}
        </div>
    `;
}

// ============================================
// RECHERCHE
// ============================================
function searchDatabase(query) {
    const results = document.getElementById('searchResults');
    if (!query || query.length < 2) {
        results.classList.remove('active');
        return;
    }
    
    const allBlocks = MC_DATA?.blocks || [];
    const matches = allBlocks.filter(b => 
        b.name.toLowerCase().includes(query.toLowerCase()) ||
        b.id.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 10);
    
    if (matches.length === 0) {
        results.innerHTML = '<div class="search-item"><span style="color:#666;">Aucun résultat...</span></div>';
    } else {
        results.innerHTML = matches.map(b => `
            <div class="search-item" onclick="selectSearchResult('${b.id}')">
                <span style="font-size:1.5em;">${b.emoji}</span>
                <div>
                    <div style="color:#FFD700;font-size:0.7em;">${b.name}</div>
                    <div style="color:#666;font-size:0.5em;">${b.id} | Catégorie: ${b.category}</div>
                </div>
            </div>
        `).join('');
    }
    results.classList.add('active');
}

function selectSearchResult(id) {
    document.getElementById('searchResults').classList.remove('active');
    document.getElementById('dbSearch').value = '';
    showToast(`🔍 Bloc sélectionné: ${id}`);
}

function showBlockInfo(id) {
    const block = MC_DATA?.blocks?.find(b => b.id === id);
    if (block) {
        showToast(`${block.emoji} ${block.name} | ID: ${block.id} | Dureté: ${block.hardness} | Outil: ${block.tool}`);
    }
}

function showItemInfo(id) {
    showToast(`📋 Item: ${id} | /give @s minecraft:${id}`);
}

function setDbTab(tab) {
    document.querySelectorAll('#database .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('#database .tab-content').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    document.getElementById('db-' + tab).classList.add('active');
}

function setRecipeTab(tab) {
    document.querySelectorAll('#recipes .tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
}

// ============================================
// CHAT IA
// ============================================
function sendChat() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    if (!message) return;
    
    addChatMessage(message, 'user');
    input.value = '';
    
    setTimeout(() => {
        const response = generateAIResponse(message);
        addChatMessage(response, 'ai');
    }, 500 + Math.random() * 1000);
}

function addChatMessage(text, type) {
    const container = document.getElementById('chatMessages');
    const msg = document.createElement('div');
    msg.className = `message ${type}`;
    msg.innerHTML = `
        <div class="message-header">${type === 'user' ? '👤 Toi' : '🤖 IA Minecraft'}</div>
        <div class="message-text">${text}</div>
    `;
    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
}

function generateAIResponse(message) {
    const lower = message.toLowerCase();
    
    // Réponses contextuelles intelligentes
    if (lower.includes('mcdonald') || lower.includes('mcdo') || lower.includes('burger')) {
        return `🍔 Exellent choix ! Pour construire un McDonald's, clique sur le bouton "McDonald's" dans la section Générateur, ou tape "McDonald's" dans la barre de recherche !<br><br>
        Tu auras :<br>
        • 📐 Schéma 3D interactif avec vue 360°<br>
        • 📖 Tutoriel pas-à-pas en 10 étapes<br>
        • 📦 Liste complète des matériaux (1600+ blocs)<br>
        • 💡 Astuces de construction<br><br>
        <em>Les arches dorées en béton jaune sont le détail le plus iconique !</em>`;
    }
    
    if (lower.includes('château') || lower.includes('chateau') || lower.includes('castle')) {
        return `🏰 Magnifique projet ! Le château fort médiéval est l'une des constructions les plus impressionnantes de Minecraft !<br><br>
        Je vais te générer un château complet avec :<br>
        • 🗼 4 tours d'angle avec créneaux<br>
        • ⚔️ Donjon central majestueux<br>
        • 🌊 Douves avec pont-levis<br>
        • 🏛️ Grande salle et quartiers royaux<br><br>
        <em>Utilise 2-3 types de pierre (stone_bricks, cobblestone, mossy) pour un rendu réaliste !</em>`;
    }
    
    if (lower.includes('commande') || lower.includes('command')) {
        return `⌨️ Voici les commandes les plus utiles de Minecraft :<br><br>
        • <code>/gamemode creative</code> - Mode créatif<br>
        • <code>/give @s diamond 64</code> - 64 diamants<br>
        • <code>/tp @s ~ ~100 ~</code> - Téléportation en hauteur<br>
        • <code>/fill ~ ~ ~ ~10 ~5 ~10 stone</code> - Remplir une zone<br>
        • <code>/effect give @s speed 60 2</code> - Vitesse x2<br>
        • <code>/time set day</code> - Mettre le jour<br>
        • <code>/weather clear</code> - Beau temps<br><br>
        Va dans la section "Commandes" pour voir toutes les 45+ commandes !`;
    }
    
    if (lower.includes('enchant') || lower.includes('enchantement')) {
        return `✨ Les meilleurs enchantements dans Minecraft :<br><br>
        <strong>Armes :</strong> Tranchant V, Looting III, Réparation<br>
        <strong>Outils :</strong> Efficacité V, Fortune III, Réparation<br>
        <strong>Armure :</strong> Protection IV, Réparation, Aqua Affinity<br>
        <strong>Arc :</strong> Puissance V, Infinity, Flamme<br><br>
        Commande : <code>/enchant @s sharpness 5</code><br>
        <em>Réparation + Fortune = combo ultime !</em>`;
    }
    
    if (lower.includes('diamond') || lower.includes('diamant')) {
        return `💎 Astuce pour trouver des diamants dans Minecraft 1.21 :<br><br>
        • Mine au niveau Y = -59 (niveau optimal)<br>
        • Utilise une pioche en fer minimum<br>
        • Fortune III augmente les drops x2.2 en moyenne<br>
        • Silk Touch pour récupérer le bloc entier<br>
        • Mine en branche (strip mining) toutes les 2 blocs<br>
        • Les diamants spawnent plus dans les grottes exposées<br><br>
        <em>Commande rapide : /give @s diamond 64</em>`;
    }
    
    if (lower.includes('redstone')) {
        return `🔴 La Redstone est le système électrique de Minecraft ! Voici les bases :<br><br>
        • <strong>Torche Redstone</strong> : Source de signal<br>
        • <strong>Fil</strong> : Transmet le signal (15 blocs max)<br>
        • <strong>Répéteur</strong> : Répète et décale le signal<br>
        • <strong>Comparateur</strong> : Compare les signaux<br>
        • <strong>Piston</strong> : Pousse les blocs<br>
        • <strong>Observer</strong> : Détecte les changements<br><br>
        Tu peux créer des portes automatiques, des ascenseurs, des fermes automatiques et bien plus !`;
    }
    
    if (lower.includes('nether') || lower.includes('portail')) {
        return `🔥 Pour aller dans le Nether :<br><br>
        1. Mine de l'obsidienne (10 blocs minimum)<br>
        2. Construis un portail (4x5 minimum)<br>
        3. Allume avec un briquet<br>
        4. Entre dans le portail<br><br>
        <strong>Prépare-toi !</strong> Le Nether est dangereux :<br>
        • Armure en fer minimum<br>
        • Beaucoup de nourriture<br>
        • Blocs pour construire<br>
        • Fire Resistance potion (idéal)<br><br>
        <em>Objectif : trouver la forteresse pour les Blaze Rods !</em>`;
    }
    
    if (lower.includes('end') || lower.includes('dragon')) {
        return `🟣 Pour vaincre l'Ender Dragon :<br><br>
        1. Trouve la forteresse du Nether → collecte 7+ Blaze Rods<br>
        2. Craft des Eyes of Ender (Blaze Powder + Ender Pearl)<br>
        3. Lance-les pour trouver la forteresse de l'End<br>
        4. Active le portail de l'End<br>
        5. Détruis les cristaux de soin (au sommet des pylônes)<br>
        6. Tue le dragon avec un arc + épée<br><br>
        <strong>Équipement recommandé :</strong><br>
        • Armure diamant/netherite complète Protection IV<br>
        • Arc Puissance V + Infinity<br>
        • Épée Tranchant V + Looting III<br>
        • 64+ blocs, nourriture, potions de soin`;
    }
    
    if (lower.includes('aide') || lower.includes('help') || lower.includes('bonjour') || lower.includes('salut')) {
        return `👋 Salut ! Je suis ton assistant IA Minecraft ultra-intelligent ! 🎮<br><br>
        Je peux t'aider avec :<br>
        • 🏗️ <strong>Générer des structures</strong> : McDonald's, château, gratte-ciel...<br>
        • 📦 <strong>Base de données</strong> : Tous les blocs, items, mobs<br>
        • ⌨️ <strong>Commandes</strong> : Toutes les 45+ commandes du jeu<br>
        • 📋 <strong>Recettes</strong> : Comment crafter n'importe quoi<br>
        • 🌍 <strong>Biomes</strong> : Tous les biomes et leurs particularités<br>
        • 💡 <strong>Astuces</strong> : Tips et tricks pour tout faire<br><br>
        <em>Que veux-tu savoir ou construire ?</em>`;
    }
    
    if (lower.includes('mod') || lower.includes('mods')) {
        return `🎮 Voici les mods les plus populaires pour Minecraft :<br><br>
        <strong>Optimisation :</strong> OptiFine, Sodium, Lithium<br>
        <strong>Technique :</strong> Create, Applied Energistics 2, Mekanism<br>
        <strong>Aventure :</strong> Twilight Forest, Aether, Blue Skies<br>
        <strong>Décoration :</strong> Chisel, Decocraft, Macaw's<br>
        <strong>Magie :</strong> Botania, Thaumcraft, Ars Nouveau<br>
        <strong>Quête :</strong> Better Minecraft, RLCraft, Vault Hunters<br><br>
        <em>Utilise CurseForge ou Modrinth pour les télécharger !</em>`;
    }
    
    // Réponse par défaut
    return `🎮 Excellente question ! Voici ce que je sais :<br><br>
    "${message}"<br><br>
    Je connais tout sur Minecraft ! N'hésite pas à me demander :<br>
    • De te créer un bâtiment (tape le nom)<br>
    • Des infos sur un item, bloc ou mob<br>
    • Des commandes pour tricher ou construire<br>
    • Des astuces de gameplay<br>
    • Des recettes de craft<br><br>
    <em>Essaie par exemple : "Construis-moi un château" ou "Comment trouver des diamants ?"</em>`;
}

// ============================================
// UTILITAIRES
// ============================================
function showToast(message) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => toast.remove(), 3000);
}

function copyCommand(cmd) {
    navigator.clipboard.writeText(cmd).then(() => {
        showToast(`📋 Copié : ${cmd}`);
    }).catch(() => {
        const ta = document.createElement('textarea');
        ta.value = cmd;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(`📋 Copié : ${cmd}`);
    });
}

// Fermer les résultats de recherche quand on clique ailleurs
document.addEventListener('click', (e) => {
    if (!e.target.closest('.search-container')) {
        document.querySelectorAll('.search-results').forEach(r => r.classList.remove('active'));
    }
});

console.log("⛏️ App.js chargé avec succès !");