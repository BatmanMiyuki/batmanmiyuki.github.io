/* ==========================================================================
   MIYUKI ULTRA-PREMIUM — JS Vanilla · 120FPS · Spotlight + 3D Tilt + Spring
   - Spotlight: radial gradient suit curseur (CSS vars --mx/--my)
   - 3D Tilt: perspective(1000px) rotateX/Y
   - Scale(0.96) tactile + pulse
   - Staggered reveal + shimmer skeleton
   ========================================================================== */

const state = {
  activeTab:'overview',
  search:'',
  completed: new Set(JSON.parse(localStorage.getItem('miyuki_done')||'[]')),
  platforms:[
    {id:'chesscom',name:'Chess.com',short:'CC',color:'oklch(0.72 0.14 145)',elo:1847,accounts:[
      {id:'m1',name:'Miyuki_Aura',elo:1847,status:'online'},
      {id:'m2',name:'Miyuki_Nova',elo:1721,status:'idle'},
      {id:'m3',name:'Miyuki_Lab',elo:1580,status:'offline'},
    ]},
    {id:'lichess',name:'Lichess.org',short:'LI',color:'oklch(0.68 0.18 280)',elo:1923,accounts:[
      {id:'l1',name:'Miyuki',elo:1923,status:'online'},
      {id:'l2',name:'Miyuki_Blitz',elo:2011,status:'online'},
    ]},
    {id:'chess24',name:'Chess24',short:'C24',color:'oklch(0.70 0.15 230)',elo:1765,accounts:[
      {id:'c1',name:'Miyuki_Pro',elo:1765,status:'idle'},
    ]},
  ],
  matches:[],
  mats:[
    {n:1,name:'Mat de l’imbécile',moves:'f3 e5 g4 Qh4#',time:'2 coups'},
    {n:2,name:'Mat du berger',moves:'e4 e5 Qh5 Nc6 Bc4 Nf6 Qxf7#',time:'4 coups'},
    {n:3,name:'Grob Shock',moves:'g4 e5 f3 Qh4#',time:'2 coups'},
    {n:4,name:'Hollandaise',moves:'d4 f5 Bg5 h6 Bh4 g5 e4 gxh4 Qh5#',time:'5 coups'},
    {n:5,name:'Bird Faux',moves:'f4 e5 g3 exf4 gxf4 Qh4#',time:'3 coups'},
    {n:6,name:'Caro-Kann étouffé',moves:'e4 c6 d4 d5 Nc3 dxe4 Nxe4 Nd7 Qe2 Ngf6 Nd6#',time:'6 coups'},
    {n:7,name:'Italienne étouffé',moves:'e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3#',time:'9 coups'},
    {n:8,name:'Owen Trap',moves:'e4 b6 d4 Bb7 Bd3 f5 exf5 Bxg2 Qh5+ g6 fxg6 Nf6 gxh7+ Nxh5 Bg6#',time:'9 coups'},
    {n:9,name:'Englund Corridor',moves:'d4 e5 dxe5 Nc6 Nf3 Qe7 Bf4 Qb4+ Bd2 Qxb2 Bc3 Bb4 Qd2 Bxc3 Qxc3 Qc1#',time:'10 coups'},
    {n:10,name:'Budapest étouffé',moves:'d4 Nf6 c4 e5 dxe5 Ng4 Bf4 Nc6 Nf3 Bb4+ Nbd2 Qe7 a3 Ngxe5 axb4 Nd3#',time:'10 coups'},
    {n:11,name:'Blackburne',moves:'e4 e5 Nf3 Nc6 Bc4 Nd4 Nxe5 Qg5 Nxf7 Qxg2 Rf1 Qxe4+ Be2 Nf3#',time:'7 coups'},
  ]
};

// Gen matches N*(N-1)/2
function genMatches(){
  const all = state.platforms.flatMap(p=>p.accounts.map(a=>({...a,plat:p.name,platId:p.id})));
  state.matches=[];
  for(let i=0;i<all.length;i++) for(let j=i+1;j<all.length;j++) state.matches.push({id:`${all[i].id}_vs_${all[j].id}`,a:all[i],b:all[j]});
}
genMatches();

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];

/* RENDER STATS — grid-lines + color-mix + @container */
function renderStats(){
  const grid=$('#statsGrid'); if(!grid) return;
  const total=state.matches.length, done=state.completed.size, prog=total?Math.round(done/total*100):0;
  const avg=Math.round(state.platforms.reduce((s,p)=>s+p.elo,0)/state.platforms.length);
  const cards=[
    {label:'ELO Moyen',value:avg,sub:`+23 ce mois · OKLCH Surface 2`,p:78,accent:true,icon:'◐'},
    {label:'Comptes actifs',value:state.platforms.reduce((n,p)=>n+p.accounts.length,0),sub:`${state.platforms.length} plateformes · subgrid`,p:60,icon:'◑'},
    {label:'Combats',value:`${done}/${total}`,sub:`${prog}% complétés · N*(N-1)/2`,p:prog,accent:true,icon:'◒'},
    {label:'Win Rate',value:'64%',sub:'12 victoires · neon pulse',p:64,icon:'◓',live:true},
  ];
  grid.innerHTML=cards.map((c,i)=>`
    <article class="card card--tilt reveal" data-tilt data-spotlight data-reveal style="--i:${i};--p:${c.p/100}">
      <div class="card__top"><span class="card__label">${c.icon} ${c.label}</span>${c.live?'<span class="badge-neon"><span class="pulse"></span> LIVE</span>':''}</div>
      <div class="card__value">${c.value}</div>
      <div class="card__sub">${c.sub}</div>
      <div class="progress"><div class="progress__bar ${c.accent?'progress__bar--accent':''}" style="--p:${c.p/100}"></div></div>
    </article>
  `).join('');
  // Animate progress 120FPS via rAF
  requestAnimationFrame(()=>$$('.progress__bar',grid).forEach(b=>{
    const p=b.style.getPropertyValue('--p'); b.style.setProperty('--p','0');
    requestAnimationFrame(()=>b.style.setProperty('--p',p));
  }));
}

/* PLATFORMS — subgrid + :has() */
function renderPlatforms(){
  const grid=$('#platformsGrid'); if(!grid) return;
  const q=state.search.toLowerCase();
  const filtered=state.platforms.filter(p=>!q||p.name.toLowerCase().includes(q)||p.accounts.some(a=>a.name.toLowerCase().includes(q)));
  grid.innerHTML=filtered.map((p,i)=>`
    <article class="platform-card reveal" data-spotlight data-reveal style="--i:${i}">
      <div class="platform-card__top">
        <div class="platform-card__logo" style="background:${p.color};color:white;border-color:${p.color}">${p.short}</div>
        <div><div class="platform-card__name">${p.name}</div><div style="font-size:11px;color:var(--text-3);font-family:var(--mono)">${p.accounts.length} comptes · ${p.id}</div></div>
        <span style="margin-left:auto;font-family:var(--mono);font-size:12px;background:var(--surface-2);border:1px solid var(--border-1);padding:3px 8px;border-radius:999px">${p.elo}</span>
      </div>
      <div class="platform-card__body">
        ${p.accounts.map(a=>`
          <div class="account-row">
            <div class="account-row__avatar">${a.name.slice(0,2).toUpperCase()}</div>
            <div class="account-row__name">${a.name}</div>
            <span class="account-row__elo">${a.elo}</span>
            <span style="width:6px;height:6px;border-radius:50%;background:${a.status==='online'?'var(--accent-4)':a.status==='idle'?'var(--accent-5)':'var(--text-4)'};box-shadow:0 0 0 3px ${a.status==='online'?'oklch(0.70 0.18 145 / 0.15)':'transparent'}"></span>
          </div>
        `).join('')}
      </div>
    </article>
  `).join('') || `<div style="grid-column:1/-1;padding:40px;text-align:center;color:var(--text-3);font-family:var(--mono)">Aucun résultat pour "${state.search}" · :has() filter</div>`;
}

/* MATCHES */
function renderMatches(){
  const list=$('#matchesList'); if(!list) return;
  list.innerHTML=state.matches.map((m,i)=>{
    const done=state.completed.has(m.id);
    return `<div class="match reveal" role="listitem" data-spotlight data-reveal style="--i:${i%6}" data-id="${m.id}">
      <button class="match__check ${done?'is-done':''}" data-check="${m.id}" aria-label="Marquer combat fini" aria-pressed="${done}">
        ${done?'<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12l5 5l10-10"/></svg>':''}
      </button>
      <div class="match__vs"><strong>${m.a.name}</strong> <span style="color:var(--text-3)">vs</span> <strong>${m.b.name}</strong></div>
      <span class="match__meta">${m.a.plat} · ${m.b.plat}</span>
    </div>`;
  }).join('');
}

/* BOARD */
function renderBoard(){
  const board=$('#board'); if(!board) return;
  const pos=[['r','n','b','q','k','b','n','r'],['p','p','p','p','.','p','p','p'],['.','.','.','.','.','.','.','.'],['.','.','.','.','p','.','.','.'],['.','.','B','.','P','.','.','.'],['.','.','.','.','.','N','.','.'],['P','P','P','P','.','P','P','P'],['R','N','B','Q','K','.','.','R']];
  const pieces={K:'♔',Q:'♕',R:'♖',B:'♗',N:'♘',P:'♙',k:'♚',q:'♛',r:'♜',b:'♝',n:'♞',p:'♟'};
  board.innerHTML=pos.flatMap((rank,r)=>rank.map((p,c)=>{
    const light=(r+c)%2===0; const last=(r===3&&c===4)||(r===4&&c===4);
    return `<div class="board__sq ${light?'board__sq--light':'board__sq--dark'} ${last?'board__sq--last':''}" role="gridcell" data-r="${r}" data-c="${c}">${p!=='.'?pieces[p]:''}</div>`;
  })).join('');
}

/* ACADEMY */
function renderAcademy(){
  const grid=$('#academyGrid'); if(!grid) return;
  grid.innerHTML=state.mats.map((m,i)=>`
    <article class="card reveal" data-spotlight data-tilt data-reveal style="--i:${i%4};display:flex;align-items:center;gap:16px;padding:16px 20px">
      <span style="width:36px;height:36px;border-radius:8px;background:var(--surface-3);border:1px solid var(--border-1);display:grid;place-items:center;font-size:12px;font-weight:700;font-family:var(--mono)">${String(m.n).padStart(2,'0')}</span>
      <div style="flex:1;min-width:0"><div style="font-size:13.5px;font-weight:600;letter-spacing:-0.01em">${m.name}</div><div style="font-size:11.5px;color:var(--text-3);font-family:var(--mono);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.moves}</div></div>
      <span style="font-size:11px;color:var(--text-3);font-family:var(--mono)">${m.time}</span>
    </article>
  `).join('');
}

/* SPOTLIGHT — suit curseur exact */
function bindSpotlight(){
  const cards = $$('[data-spotlight]');
  // Delegation pour perf 120fps
  document.addEventListener('mousemove', (e)=>{
    // throttle via rAF
    requestAnimationFrame(()=>{
      cards.forEach(card=>{
        const rect = card.getBoundingClientRect();
        if(e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', `${x}%`);
        card.style.setProperty('--my', `${y}%`);
      });
    });
  }, {passive:true});
}

/* 3D TILT — perspective(1000px) rotateX/Y */
function bindTilt(){
  const tiltEls = $$('[data-tilt]');
  tiltEls.forEach(el=>{
    let raf=null;
    el.addEventListener('mousemove', (e)=>{
      if(raf) return;
      raf = requestAnimationFrame(()=>{
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width/2;
        const cy = rect.top + rect.height/2;
        const dx = (e.clientX - cx) / (rect.width/2);
        const dy = (e.clientY - cy) / (rect.height/2);
        const rotY = dx * 8; // max 8deg
        const rotX = -dy * 8;
        el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateZ(0)`;
        raf=null;
      });
    });
    el.addEventListener('mouseleave', ()=>{
      el.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0)`;
    });
  });
}

/* REVEAL — staggered fade-in */
let revealObs;
function observeReveals(){
  if(!revealObs){
    revealObs = new IntersectionObserver((entries)=>{
      entries.forEach(en=>{
        if(en.isIntersecting){
          en.target.classList.add('is-in');
          revealObs.unobserve(en.target);
        }
      });
    },{threshold:0.12, rootMargin:'0px 0px -30px 0px'});
  }
  $$('[data-reveal]:not(.is-in)').forEach(el=>revealObs.observe(el));
}

/* INTERACTIONS */
function bindEvents(){
  const sidebar=$('#sidebar'), overlay=$('#overlay');
  const open=()=>{sidebar.classList.add('is-open');overlay.classList.add('is-open');document.body.style.overflow='hidden'};
  const close=()=>{sidebar.classList.remove('is-open');overlay.classList.remove('is-open');document.body.style.overflow=''};
  $('#openSidebar')?.addEventListener('click',open);
  $('#closeSidebar')?.addEventListener('click',close);
  overlay?.addEventListener('click',close);

  // Tabs scroll
  $$('[data-tab]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const tab=btn.dataset.tab;
      $$('[data-tab]').forEach(b=>b.classList.toggle('is-active', b.dataset.tab===tab));
      const target=document.getElementById(tab);
      if(target) target.scrollIntoView({behavior:'smooth', block:'start'});
      if(window.innerWidth<1024) close();
    });
  });

  // Matches check — scale 0.96 tactile + pulse
  $('#matchesList')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-check]'); if(!b) return;
    b.style.transform='scale(0.85)'; // feedback ultra-réactif
    setTimeout(()=>b.style.transform='',120);
    const id=b.dataset.check;
    if(state.completed.has(id)) state.completed.delete(id); else state.completed.add(id);
    localStorage.setItem('miyuki_done',JSON.stringify([...state.completed]));
    renderMatches(); renderStats(); observeReveals();
  });

  // Search debounce
  let t; $('#searchInput')?.addEventListener('input',e=>{
    clearTimeout(t); t=setTimeout(()=>{state.search=e.target.value; renderPlatforms(); observeReveals();},160);
  });

  // Keyboard ⌘K
  document.addEventListener('keydown',e=>{
    if((e.metaKey||e.ctrlKey) && e.key.toLowerCase()==='k'){ e.preventDefault(); $('#searchInput')?.focus(); }
  });

  // Board click
  $('#board')?.addEventListener('click',e=>{
    const sq=e.target.closest('.board__sq'); if(!sq) return;
    $$('.board__sq--sel').forEach(s=>s.classList.remove('board__sq--sel'));
    sq.classList.add('board__sq--sel');
  });
}

/* INIT */
function init(){
  renderStats(); renderPlatforms(); renderMatches(); renderBoard(); renderAcademy();
  bindSpotlight(); bindTilt(); bindEvents(); observeReveals();
  console.log('%cMiyuki Ultra-Premium — OKLCH · Mesh · Spotlight · 3D Tilt · :has() · @container · subgrid · 120FPS','background:oklch(0.72 0.20 280);color:white;padding:6px 12px;border-radius:8px;font-weight:600');
}
document.addEventListener('DOMContentLoaded',init);
