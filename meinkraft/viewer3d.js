// ============================================
// MINECRAFT IA - MOTEUR DE RENDU 3D ISOMÉTRIQUE
// ============================================

class MinecraftViewer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.rotation = 30;
        this.tilt = 25;
        this.zoom = 1;
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        this.currentView = 'perspective';
        this.autoRotate = false;
        this.rotationSpeed = 0.5;
        this.buildingData = null;
        this.animFrame = null;
        
        this.initEvents();
        this.resize();
    }
    
    resize() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = 500;
        this.render();
    }
    
    initEvents() {
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        });
        
        window.addEventListener('mousemove', (e) => {
            if (!this.isDragging) return;
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            this.rotation += dx * 0.5;
            this.tilt = Math.max(5, Math.min(75, this.tilt - dy * 0.5));
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
            this.render();
        });
        
        window.addEventListener('mouseup', () => {
            this.isDragging = false;
        });
        
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            this.zoom = Math.max(0.3, Math.min(3, this.zoom - e.deltaY * 0.001));
            this.render();
        });
    }
    
    setView(view) {
        this.currentView = view;
        this.autoRotate = false;
        
        switch(view) {
            case 'perspective':
                this.rotation = 30;
                this.tilt = 25;
                this.zoom = 1;
                break;
            case 'front':
                this.rotation = 0;
                this.tilt = 0;
                this.zoom = 1.2;
                break;
            case 'side':
                this.rotation = 90;
                this.tilt = 0;
                this.zoom = 1.2;
                break;
            case 'top':
                this.rotation = 0;
                this.tilt = 80;
                this.zoom = 1;
                break;
            case 'interior':
                this.rotation = 45;
                this.tilt = 35;
                this.zoom = 1.8;
                break;
            case 'rotate360':
                this.autoRotate = true;
                this.rotation = 0;
                this.tilt = 25;
                this.zoom = 1;
                this.startAutoRotate();
                break;
        }
        this.render();
    }
    
    startAutoRotate() {
        const animate = () => {
            if (!this.autoRotate) return;
            this.rotation += this.rotationSpeed;
            this.render();
            this.animFrame = requestAnimationFrame(animate);
        };
        animate();
    }
    
    stopAutoRotate() {
        this.autoRotate = false;
        if (this.animFrame) cancelAnimationFrame(this.animFrame);
    }
    
    loadBuilding(building) {
        this.buildingData = building;
        this.generateVoxelData(building);
        this.render();
    }
    
    generateVoxelData(building) {
        this.voxels = [];
        const w = building.width || 20;
        const h = building.height || 15;
        const d = building.depth || 20;
        const materials = Object.keys(building.materials || {});
        
        // Murs extérieurs
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                for (let z = 0; z < d; z++) {
                    const isWall = x === 0 || x === w-1 || z === 0 || z === d-1;
                    const isFloor = y === 0 || y === Math.floor(h/2);
                    const isRoof = y === h-1;
                    const isDoor = (x === Math.floor(w/2) || x === Math.floor(w/2)+1) && z === 0 && y < 3;
                    const isWindow = isWall && y > 2 && y < h-2 && 
                                   ((x % 4 === 2 && (z === 0 || z === d-1)) || 
                                    (z % 4 === 2 && (x === 0 || x === w-1)));
                    
                    if (isDoor) continue;
                    
                    let color = null;
                    let blockType = '';
                    
                    if (isRoof) {
                        color = this.getBlockColor(materials[0] || 'stone_bricks', 0.7);
                        blockType = 'roof';
                    } else if (isWindow) {
                        color = this.getBlockColor('glass_pane', 0.3);
                        blockType = 'window';
                    } else if (isFloor) {
                        color = this.getBlockColor(materials[Math.floor(Math.random()*3)+1] || 'smooth_stone', 0.6);
                        blockType = 'floor';
                    } else if (isWall) {
                        color = this.getBlockColor(materials[0] || 'white_concrete', 0.5 + (y/h)*0.3);
                        blockType = 'wall';
                    }
                    
                    if (color) {
                        this.voxels.push({ x, y: h - 1 - y, z, color, type: blockType });
                    }
                }
            }
        }
        
        // Détails intérieurs
        if (this.currentView === 'interior') {
            // Ajouter meubles etc
            for (let x = 2; x < w-2; x += 4) {
                for (let z = 2; z < d-2; z += 4) {
                    if (Math.random() > 0.6) {
                        this.voxels.push({ 
                            x, y: h - 2, z, 
                            color: this.getBlockColor('oak_planks', 0.8),
                            type: 'furniture'
                        });
                    }
                }
            }
        }
    }
    
    getBlockColor(blockId, brightness) {
        const colorMap = {
            'stone_bricks': '#7A7A7A',
            'cobblestone': '#777777',
            'oak_planks': '#BC9458',
            'oak_log': '#6B511F',
            'white_concrete': '#CFD5D6',
            'black_concrete': '#080A0F',
            'red_concrete': '#8E2121',
            'gray_concrete': '#36393D',
            'glass_pane': '#C8E8FF',
            'smooth_stone': '#A0A0A0',
            'quartz_block': '#E8E4D8',
            'iron_block': '#D8D8D8',
            'spruce_planks': '#6B4F2A',
            'birch_planks': '#D4C483',
            'dark_oak_planks': '#3E2812',
            'bricks': '#9B4C3C',
            'nether_bricks': '#2C1218',
            'purpur_block': '#9A5A9A',
            'end_stone': '#DBD6A0',
            'prismarine': '#6BA395',
            'glowstone': '#FFD700',
            'sea_lantern': '#88CCFF',
            'magma_block': '#8B2500',
            'obsidian': '#1B0B2A',
            'mossy_stone_bricks': '#6A7A5A',
            'yellow_concrete': '#F1AF15',
            'light_blue_stained_glass': '#2489C7',
            'deepslate_bricks': '#4A4A4A',
            'blackstone': '#2A2A2A',
            'basalt': '#4A4A4A',
            'copper_block': '#C07040',
            'red_carpet': '#B02E26',
            'white_carpet': '#FFFFFF',
            'oak_fence': '#BC9458',
            'torch': '#FFA500',
            'lantern': '#FFA500',
            'water': '#3F76E4',
            'lava': '#CF4A09',
            'grass_block': '#5D8C3E',
            'dirt': '#8B6F47',
            'sand': '#DBD3A0',
            'cherry_planks': '#E8B4B8',
            'bamboo_planks': '#C8B862',
            'acacia_planks': '#AD5E24',
            'red_nether_bricks': '#4A1A1A',
            'mud_bricks': '#8A6A4C',
            'smooth_basalt': '#3A3A3A',
            'polished_blackstone': '#3A3A3A',
            'end_stone_bricks': '#DBD6A0',
        };
        
        const hex = colorMap[blockId] || '#808080';
        const r = parseInt(hex.slice(1,3), 16);
        const g = parseInt(hex.slice(3,5), 16);
        const b = parseInt(hex.slice(5,7), 16);
        
        return `rgb(${Math.floor(r*brightness)}, ${Math.floor(g*brightness)}, ${Math.floor(b*brightness)})`;
    }
    
    project(x, y, z) {
        const rad = this.rotation * Math.PI / 180;
        const tiltRad = this.tilt * Math.PI / 180;
        
        const cosR = Math.cos(rad);
        const sinR = Math.sin(rad);
        const cosT = Math.cos(tiltRad);
        const sinT = Math.sin(tiltRad);
        
        const ox = x - (this.buildingData?.width || 20) / 2;
        const oz = z - (this.buildingData?.depth || 20) / 2;
        const oy = y - (this.buildingData?.height || 15) / 2;
        
        const rx = ox * cosR - oz * sinR;
        const rz = ox * sinR + oz * cosR;
        const ry = oy;
        
        const px = rx;
        const py = ry * cosT - rz * sinT;
        const pz = ry * sinT + rz * cosT;
        
        const scale = 12 * this.zoom;
        const cx = this.canvas.width / 2;
        const cy = this.canvas.height / 2;
        
        return {
            x: cx + px * scale,
            y: cy - py * scale,
            z: pz
        };
    }
    
    render() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // Fond dégradé
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(1, '#1a1a2a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        
        // Grille au sol
        this.drawGrid();
        
        if (!this.voxels || this.voxels.length === 0) {
            ctx.fillStyle = '#FFD700';
            ctx.font = '14px "Press Start 2P"';
            ctx.textAlign = 'center';
            ctx.fillText('Génère une structure pour voir', w/2, h/2 - 10);
            ctx.fillText('le rendu 3D ici !', w/2, h/2 + 20);
            return;
        }
        
        // Trier les voxels par profondeur pour le rendu correct
        const sorted = [...this.voxels].map(v => {
            const p = this.project(v.x, v.y, v.z);
            return { ...v, px: p.x, py: p.y, pz: p.z };
        }).sort((a, b) => b.pz - a.pz);
        
        // Rendu des voxels
        sorted.forEach(v => {
            this.drawVoxel(v.px, v.py, v.color, v.type);
        });
        
        // HUD
        this.drawHUD();
    }
    
    drawGrid() {
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        ctx.lineWidth = 1;
        
        const gridSize = 20;
        for (let i = -gridSize; i <= gridSize; i++) {
            const p1 = this.project(i, 0, -gridSize);
            const p2 = this.project(i, 0, gridSize);
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
            
            const p3 = this.project(-gridSize, 0, i);
            const p4 = this.project(gridSize, 0, i);
            ctx.beginPath();
            ctx.moveTo(p3.x, p3.y);
            ctx.lineTo(p4.x, p4.y);
            ctx.stroke();
        }
    }
    
    drawVoxel(x, y, color, type) {
        const ctx = this.ctx;
        const size = 5 * this.zoom;
        
        ctx.fillStyle = color;
        ctx.fillRect(x - size/2, y - size/2, size, size);
        
        // Effet de bordure pour la profondeur
        if (type === 'wall') {
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 0.5;
            ctx.strokeRect(x - size/2, y - size/2, size, size);
        }
        
        // Effet lumineux pour les fenêtres
        if (type === 'window') {
            ctx.fillStyle = 'rgba(200,232,255,0.3)';
            ctx.fillRect(x - size/2, y - size/2, size, size);
        }
    }
    
    drawHUD() {
        const ctx = this.ctx;
        
        // Info en haut à gauche
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(10, 10, 200, 60);
        ctx.strokeStyle = '#4a4a4a';
        ctx.strokeRect(10, 10, 200, 60);
        
        ctx.fillStyle = '#FFD700';
        ctx.font = '10px "Press Start 2P"';
        ctx.textAlign = 'left';
        ctx.fillText(`Vue: ${this.currentView}`, 20, 30);
        ctx.fillStyle = '#90EE90';
        ctx.fillText(`Zoom: ${this.zoom.toFixed(1)}x`, 20, 48);
        ctx.fillText(`Rotation: ${Math.floor(this.rotation)}°`, 20, 62);
        
        // Contrôles en bas
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(10, this.canvas.height - 30, 280, 25);
        ctx.fillStyle = '#666';
        ctx.font = '8px "Press Start 2P"';
        ctx.fillText('🖱️ Glisser: Rotation | Molette: Zoom', 20, this.canvas.height - 15);
    }
    
    getMaterialsList() {
        if (!this.buildingData) return [];
        const mats = this.buildingData.materials || {};
        return Object.entries(mats).map(([id, count]) => ({
            id,
            name: this.getBlockName(id),
            count,
            color: this.getBlockColor(id, 1)
        })).sort((a, b) => b.count - a.count);
    }
    
    getBlockName(id) {
        const nameMap = {
            'stone_bricks': 'Pierres Taillées',
            'cobblestone': 'Pierres',
            'oak_planks': 'Planches de Chêne',
            'oak_log': 'Bûche de Chêne',
            'white_concrete': 'Béton Blanc',
            'black_concrete': 'Béton Noir',
            'red_concrete': 'Béton Rouge',
            'gray_concrete': 'Béton Gris',
            'yellow_concrete': 'Béton Jaune',
            'glass_pane': 'Vitre',
            'smooth_stone': 'Pierre Lisse',
            'quartz_block': 'Bloc de Quartz',
            'iron_block': 'Bloc de Fer',
            'iron_bars': 'Barreaux de Fer',
            'iron_door': 'Porte de Fer',
            'spruce_planks': "Planches d'Épicéa",
            'birch_planks': 'Planches de Bouleau',
            'dark_oak_planks': 'Planches de Chêne Noir',
            'oak_door': 'Porte de Chêne',
            'oak_fence': 'Clôture de Chêne',
            'oak_stairs': 'Escaliers de Chêne',
            'oak_slab': 'Dalle de Chêne',
            'torch': 'Torche',
            'lantern': 'Lanterne',
            'glowstone': 'Pierre Luminescente',
            'sea_lantern': 'Lanterne Marine',
            'redstone_lamp': 'Lampe Redstone',
            'chest': 'Coffre',
            'barrel': 'Tonneau',
            'crafting_table': 'Établi',
            'furnace': 'Fourneau',
            'blast_furnace': 'Haut Fourneau',
            'anvil': 'Enclume',
            'enchanting_table': "Table d'Enchantement",
            'brewing_stand': 'Alambic',
            'bed': 'Lit',
            'painting': 'Tableau',
            'banner': 'Bannière',
            'red_banner': 'Bannière Rouge',
            'black_banner': 'Bannière Noire',
            'white_carpet': 'Tapis Blanc',
            'red_carpet': 'Tapis Rouge',
            'black_carpet': 'Tapis Noir',
            'light_blue_carpet': 'Tapis Bleu Clair',
            'ladder': 'Échelle',
            'chain': 'Chaîne',
            'sign': 'Panneau',
            'oak_sign': 'Panneau de Chêne',
            'dispenser': 'Distributeur',
            'tnt': 'TNT',
            'white_wool': 'Laine Blanche',
            'black_wool': 'Laine Noire',
            'red_wool': 'Laine Rouge',
            'mossy_stone_bricks': 'Pierres Taillées Moussues',
            'prismarine': 'Prismarine',
            'dark_prismarine': 'Prismarine Sombre',
            'purpur_block': 'Purpur',
            'end_stone': "Pierre de l'End",
            'end_stone_bricks': "Pierres de l'End Taillées",
            'end_rod': "Tige de l'End",
            'obsidian': 'Obsidienne',
            'blackstone': 'Pierre Noire',
            'basalt': 'Basalte',
            'smooth_basalt': 'Basalte Lisse',
            'deepslate_bricks': ' Briques de Deepslate',
            'nether_bricks': ' Briques du Nether',
            'red_nether_bricks': ' Briques Rouges du Nether',
            'magma_block': 'Bloc de Magma',
            'lava_bucket': 'Seau de Lave',
            'water_bucket': "Seau d'Eau",
            'grass_block': "Bloc d'Herbe",
            'flower': 'Fleur',
            'oak_sapling': 'Pousse de Chêne',
            'campfire': 'Feu de Camp',
            'bell': 'Cloche',
            'candle': 'Bougie',
            'bookshelf': 'Bibliothèque',
            'lectern': 'Lutrin',
            'armor_stand': 'Porte-armure',
            'flower_pot': 'Pot de Fleur',
            'copper_block': 'Bloc de Cuivre',
            'exposed_copper': 'Cuivre Exposé',
            'cherry_planks': 'Planches de Cerisier',
            'cherry_log': 'Bûche de Cerisier',
            'bamboo_planks': 'Planches de Bambou',
            'acacia_planks': "Planches d'Acacia",
            'oak_wood': 'Bois de Chêne',
            'spruce_log': "Bûche d'Épicéa",
            'white_stained_glass': 'Verre Teinté Blanc',
            'blue_stained_glass': 'Verre Teinté Bleu',
            'red_stained_glass': 'Verre Teinté Rouge',
            'yellow_stained_glass': 'Verre Teinté Jaune',
            'green_stained_glass': 'Verre Teinté Vert',
            'purple_stained_glass': 'Verre Teinté Violet',
            'light_blue_stained_glass': 'Verre Teinté Bleu Clair',
            'moss_carpet': 'Tapis de Mousse',
            'vines': 'Vigne',
            'oak_trapdoor': 'Trappe de Chêne',
            'beacon': 'Balise',
            'lever': 'Levier',
            'button': 'Bouton',
            'target': 'Cible',
            'redstone': 'Redstone',
            'redstone_block': 'Bloc de Redstone',
            'redstone_repeater': 'Répéteur',
            'redstone_comparator': 'Comparateur',
            'observer': 'Observateur',
            'piston': 'Piston',
            'sticky_piston': 'Piston Collant',
            'hopper': 'Entonnoir',
            'smithing_table': 'Table de Forgeron',
            'grindstone': 'Meule',
            'mud_bricks': ' Briques de Boue',
            'smooth_stone_slab': 'Dalle de Pierre Lisse',
            'stone_bricks_wall': 'Mur de Pierres Taillées',
            'bricks': ' Briques',
            'sand': 'Sable',
            'dirt': 'Terre',
        };
        return nameMap[id] || id.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

console.log("🎨 Moteur 3D chargé avec succès !");