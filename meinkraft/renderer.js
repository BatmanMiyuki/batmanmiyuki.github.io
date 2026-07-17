// MeinkraftAI — Isometric Voxel Renderer
class VoxelRenderer {
  constructor(canvas, opts = {}) {
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.rot = opts.rot ?? 35;
    this.tilt = opts.tilt ?? 30;
    this.zoom = opts.zoom ?? 1;
    this.dragging = false;
    this.lastX = 0;
    this.lastY = 0;
    this.autoRot = false;
    this.frame = null;
    this.voxels = [];
    this.build = null;
    this.size = { w: 0, h: 0, d: 0 };
    
    this.c.addEventListener('mousedown', e => {
      this.dragging = true;
      this.lastX = e.clientX;
      this.lastY = e.clientY;
    });
    window.addEventListener('mousemove', e => {
      if (!this.dragging) return;
      this.rot += (e.clientX - this.lastX) * 0.6;
      this.tilt = Math.max(5, Math.min(80, this.tilt - (e.clientY - this.lastY) * 0.6));
      this.lastX = e.clientX;
      this.lastY = e.clientY;
      this.draw();
    });
    window.addEventListener('mouseup', () => this.dragging = false);
    this.c.addEventListener('wheel', e => {
      e.preventDefault();
      this.zoom = Math.max(0.3, Math.min(3.5, this.zoom - e.deltaY * 0.001));
      this.draw();
    });
    // Touch
    this.c.addEventListener('touchstart', e => {
      if (e.touches.length === 1) {
        this.dragging = true;
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
      }
    });
    this.c.addEventListener('touchmove', e => {
      if (!this.dragging || e.touches.length !== 1) return;
      e.preventDefault();
      this.rot += (e.touches[0].clientX - this.lastX) * 0.6;
      this.tilt = Math.max(5, Math.min(80, this.tilt - (e.touches[0].clientY - this.lastY) * 0.6));
      this.lastX = e.touches[0].clientX;
      this.lastY = e.touches[0].clientY;
      this.draw();
    }, { passive: false });
    this.c.addEventListener('touchend', () => this.dragging = false);
  }
  
  load(build) {
    this.build = build;
    this.size = { w: build.w, h: build.h, d: build.d };
    this.voxels = this._genVoxels(build);
    this.draw();
  }
  
  setView(v) {
    this.autoRot = false;
    if (this.frame) cancelAnimationFrame(this.frame);
    switch(v) {
      case 'perspective': this.rot=35; this.tilt=30; this.zoom=1; break;
      case 'front': this.rot=0; this.tilt=0; this.zoom=1.2; break;
      case 'side': this.rot=90; this.tilt=0; this.zoom=1.2; break;
      case 'top': this.rot=0; this.tilt=85; this.zoom=1; break;
      case 'inside': this.rot=45; this.tilt=40; this.zoom=2; break;
      case '360':
        this.autoRot = true;
        this.tilt = 28;
        this.zoom = 1;
        const go = () => {
          if (!this.autoRot) return;
          this.rot += 0.4;
          this.draw();
          this.frame = requestAnimationFrame(go);
        };
        go();
        break;
    }
    this.draw();
  }
  
  _genVoxels(build) {
    const V = [];
    const { w, h, d, materials } = build;
    const matIds = Object.keys(materials);
    
    // Generate a proper building shape
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        for (let z = 0; z < d; z++) {
          const isWallX = x === 0 || x === w - 1;
          const isWallZ = z === 0 || z === d - 1;
          const isWall = isWallX || isWallZ;
          const isFloor = y === 0;
          const isRoof = y === h - 1;
          const isMidFloor = y === Math.floor(h * 0.45) && h > 10;
          
          // Door openings
          const isDoor = (x === Math.floor(w/2) || x === Math.floor(w/2) + 1) && z === 0 && y < 3;
          if (isDoor) continue;
          
          // Windows
          const isWin = isWall && y > 2 && y < h - 2 &&
            ((isWallZ && x > 1 && x < w - 2 && x % 3 === 1) ||
             (isWallX && z > 1 && z < d - 2 && z % 3 === 1));
          
          let col = null;
          let type = 'solid';
          
          if (isRoof) {
            // Roof with edge
            const isEdge = x === 0 || x === w-1 || z === 0 || z === d-1;
            col = this._blockCol(matIds[0], isEdge ? 0.65 : 0.75);
            type = 'roof';
          } else if (isWin) {
            col = 'rgba(168,216,234,0.6)';
            type = 'glass';
          } else if (isFloor || isMidFloor) {
            col = this._blockCol(matIds[Math.min(2, matIds.length - 1)], 0.55);
            type = 'floor';
          } else if (isWall) {
            // Alternate wall materials for detail
            const useIdx = ((x + z) % 5 === 0 && matIds.length > 3) ? 3 : 0;
            col = this._blockCol(matIds[useIdx], 0.5 + (y / h) * 0.4);
            type = 'wall';
          }
          
          if (col) {
            V.push({ x, y: h - 1 - y, z, col, type });
          }
        }
      }
    }
    
    // Add some interior details for inside view
    if (matIds.length > 3) {
      // Furniture-like blocks inside
      for (let x = 2; x < w - 2; x += Math.max(3, Math.floor(w/5))) {
        for (let z = 2; z < d - 2; z += Math.max(3, Math.floor(d/5))) {
          if (Math.random() > 0.5) {
            V.push({
              x, y: h - 2, z,
              col: this._blockCol(matIds[1], 0.6),
              type: 'furniture'
            });
          }
        }
      }
    }
    
    return V;
  }
  
  _blockCol(id, bright = 1) {
    const hex = getBlockColor(id);
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `rgb(${(r*bright)|0},${(g*bright)|0},${(b*bright)|0})`;
  }
  
  _proj(x, y, z) {
    const rad = this.rot * Math.PI / 180;
    const tr = this.tilt * Math.PI / 180;
    const { w, d, h } = this.size;
    const ox = x - w/2, oz = z - d/2, oy = y - h/2;
    const rx = ox * Math.cos(rad) - oz * Math.sin(rad);
    const rz = ox * Math.sin(rad) + oz * Math.cos(rad);
    const py = oy * Math.cos(tr) - rz * Math.sin(tr);
    const pz = oy * Math.sin(tr) + rz * Math.cos(tr);
    const s = 11 * this.zoom;
    return {
      x: this.c.width / 2 + rx * s,
      y: this.c.height / 2 - py * s,
      z: pz
    };
  }
  
  draw() {
    const ctx = this.ctx;
    const W = this.c.width;
    const H = this.c.height;
    
    // Background gradient
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#0c0c18');
    g.addColorStop(1, '#141428');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    
    if (!this.voxels.length) {
      ctx.fillStyle = '#6366f1';
      ctx.font = '14px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('Génère une structure pour voir l\'aperçu 3D', W/2, H/2);
      return;
    }
    
    // Project and sort
    const sorted = this.voxels.map(v => {
      const p = this._proj(v.x, v.y, v.z);
      return { ...v, px: p.x, py: p.y, pz: p.z };
    }).sort((a, b) => b.pz - a.pz);
    
    // Draw voxels as isometric cubes
    const bs = Math.max(3, 9 * this.zoom); // block size
    
    sorted.forEach(v => {
      const x = v.px, y = v.py, s = bs;
      
      if (v.type === 'glass') {
        // Glass: semi-transparent
        ctx.fillStyle = v.col;
        ctx.fillRect(x - s/2, y - s/2, s, s);
        ctx.strokeStyle = 'rgba(168,216,234,0.3)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x - s/2, y - s/2, s, s);
      } else {
        // Top face (lighter)
        ctx.fillStyle = v.col;
        ctx.fillRect(x - s/2, y - s/2, s, s);
        
        // Right face (darker)
        const dark = this._darken(v.col, 0.7);
        ctx.fillStyle = dark;
        ctx.fillRect(x + s/2 - s*0.2, y - s/2 + s*0.2, s*0.2, s);
        
        // Bottom face (darkest)
        const dark2 = this._darken(v.col, 0.5);
        ctx.fillStyle = dark2;
        ctx.fillRect(x - s/2, y + s/2 - s*0.2, s, s*0.2);
        
        // Edge highlight
        if (v.type === 'wall' || v.type === 'roof') {
          ctx.strokeStyle = 'rgba(255,255,255,0.06)';
          ctx.lineWidth = 0.3;
          ctx.strokeRect(x - s/2, y - s/2, s, s);
        }
      }
    });
    
    // HUD
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.roundRect(10, 10, 170, 44, 8);
    ctx.fill();
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 10px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(`${this.size.w}×${this.size.h}×${this.size.d}  •  ${this.voxels.length} voxels`, 20, 28);
    ctx.fillStyle = '#71717a';
    ctx.font = '9px Inter';
    ctx.fillText(`Rot: ${Math.floor(this.rot % 360)}°  Zoom: ${this.zoom.toFixed(1)}x`, 20, 44);
  }
  
  _darken(color, factor) {
    if (color.startsWith('rgba')) return color;
    const m = color.match(/\d+/g);
    if (!m) return color;
    return `rgb(${(m[0]*factor)|0},${(m[1]*factor)|0},${(m[2]*factor)|0})`;
  }
}