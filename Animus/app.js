// ===================== STATE & STORAGE =====================
const DB_NAME = 'AnimeTrackerDB';
const DB_VERSION = 1;
let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => { db = req.result; resolve(db); };
    req.onupgradeneeded = (e) => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains('videos')) {
        d.createObjectStore('videos', { keyPath: 'episodeId' });
      }
    };
  });
}

function saveVideoFile(episodeId, file) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('videos', 'readwrite');
    const store = tx.objectStore('videos');
    const reader = new FileReader();
    reader.onload = () => {
      store.put({ episodeId, data: reader.result, type: file.type, name: file.name });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    };
    reader.readAsArrayBuffer(file);
  });
}

function getVideoFile(episodeId) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('videos', 'readonly');
    const store = tx.objectStore('videos');
    const req = store.get(episodeId);
    req.onsuccess = () => {
      if (req.result) {
        const blob = new Blob([req.result.data], { type: req.result.type });
        resolve(URL.createObjectURL(blob));
      } else resolve(null);
    };
    req.onerror = () => reject(req.error);
  });
}

function getState() {
  const raw = localStorage.getItem('animeTrackerState');
  if (raw) return JSON.parse(raw);
  return { animes: [], profile: { username: 'User', avatar: null }, nextId: 1 };
}

function setState(state) {
  localStorage.setItem('animeTrackerState', JSON.stringify(state));
}

function getNextId() {
  const state = getState();
  const id = state.nextId;
  state.nextId = id + 1;
  setState(state);
  return id;
}

// ===================== NAVIGATION =====================
function navigate(page, params = {}) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  window.scrollTo(0, 0);

  if (page === 'home') renderHome();
  if (page === 'add') resetAddForm();
  if (page === 'anime') renderAnimeDetail(params.animeId);
  if (page === 'watch') renderWatch(params.episodeId);
  if (page === 'profile') renderProfile();
}

// ===================== HOME =====================
function renderHome() {
  const state = getState();
  const grid = document.getElementById('anime-grid');
  const empty = document.getElementById('home-empty');

  if (state.animes.length === 0) {
    grid.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  grid.innerHTML = state.animes.map(anime => {
    const { total, completed, percent } = getAnimeProgress(anime);
    return `
      <div class="anime-card" onclick="navigate('anime', {animeId: ${anime.id}})">
        <div class="cover">
          ${anime.coverImage ? `<img src="${anime.coverImage}" alt="">` : `<div class="placeholder">▶️</div>`}
        </div>
        <div class="info">
          <h3>${escapeHtml(anime.title)}</h3>
          <span class="badge badge-${anime.status}">${statusLabel(anime.status)}</span>
          <div class="progress-bar"><div class="fill" style="width:${percent}%"></div></div>
          <div class="progress-text"><span>Progression</span><span>${completed}/${total}</span></div>
        </div>
      </div>
    `;
  }).join('');
}

function getAnimeProgress(anime) {
  let total = 0, completed = 0;
  anime.seasons.forEach(s => s.episodes.forEach(e => {
    total++;
    if (e.progress?.completed) completed++;
  }));
  return { total, completed, percent: total ? Math.round((completed / total) * 100) : 0 };
}

function statusLabel(s) {
  return { watching: 'En cours', completed: 'Terminé', planned: 'À voir', dropped: 'Abandonné' }[s] || s;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===================== ADD ANIME =====================
let addAnimeId = null;
let addSeasonId = null;
let addSeasons = [];
let addEpisodes = [];

function resetAddForm() {
  addAnimeId = null;
  addSeasonId = null;
  addSeasons = [];
  addEpisodes = [];
  document.getElementById('step1').classList.remove('hidden');
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.add('hidden');
  document.getElementById('step1-label').classList.add('active');
  document.getElementById('step2-label').classList.remove('active');
  document.getElementById('step3-label').classList.remove('active');
  document.getElementById('add-title').value = '';
  document.getElementById('add-synopsis').value = '';
  document.getElementById('add-cover').value = '';
  document.getElementById('add-status').value = 'planned';
  document.getElementById('add-season-num').value = '1';
  document.getElementById('add-season-title').value = '';
  document.getElementById('add-ep-num').value = '1';
  document.getElementById('add-ep-title').value = '';
  document.getElementById('add-ep-url').value = '';
  document.getElementById('add-ep-file').value = '';
  document.getElementById('add-ep-duration').value = '';
  document.getElementById('seasons-list').innerHTML = '';
  document.getElementById('episodes-list').innerHTML = '';
  setVideoSource('url');
}

function createAnime() {
  const title = document.getElementById('add-title').value.trim();
  if (!title) return alert('Le titre est requis');
  const state = getState();
  const anime = {
    id: getNextId(),
    title,
    synopsis: document.getElementById('add-synopsis').value.trim(),
    coverImage: document.getElementById('add-cover').value.trim(),
    status: document.getElementById('add-status').value,
    seasons: []
  };
  state.animes.push(anime);
  setState(state);
  addAnimeId = anime.id;
  document.getElementById('step1').classList.add('hidden');
  document.getElementById('step2').classList.remove('hidden');
  document.getElementById('step1-label').classList.remove('active');
  document.getElementById('step2-label').classList.add('active');
  renderSeasonsList();
}

function renderSeasonsList() {
  const container = document.getElementById('seasons-list');
  container.innerHTML = addSeasons.map(s => `
    <div onclick="selectSeason(${s.id})" style="padding:0.75rem;border:1px solid ${addSeasonId === s.id ? 'var(--primary)' : 'var(--border)'};border-radius:0.5rem;cursor:pointer;background:${addSeasonId === s.id ? 'rgba(99,102,241,0.1)' : 'transparent'};">
      Saison ${s.number}${s.title ? ' - ' + escapeHtml(s.title) : ''}
    </div>
  `).join('');
}

function createSeason() {
  const num = parseInt(document.getElementById('add-season-num').value);
  const title = document.getElementById('add-season-title').value.trim();
  const season = { id: getNextId(), number: num, title, episodes: [] };
  addSeasons.push(season);
  addSeasonId = season.id;
  document.getElementById('add-season-num').value = num + 1;
  document.getElementById('add-season-title').value = '';
  renderSeasonsList();
  // Auto switch to episodes
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
  document.getElementById('step2-label').classList.remove('active');
  document.getElementById('step3-label').classList.add('active');
  document.getElementById('ep-season-num').textContent = num;
  renderEpisodesList();
}

function selectSeason(id) {
  addSeasonId = id;
  const season = addSeasons.find(s => s.id === id);
  renderSeasonsList();
  document.getElementById('step2').classList.add('hidden');
  document.getElementById('step3').classList.remove('hidden');
  document.getElementById('step2-label').classList.remove('active');
  document.getElementById('step3-label').classList.add('active');
  document.getElementById('ep-season-num').textContent = season.number;
  addEpisodes = season.episodes;
  renderEpisodesList();
}

function renderEpisodesList() {
  const container = document.getElementById('episodes-list');
  container.innerHTML = addEpisodes.map(e => `
    <div style="padding:0.75rem;border:1px solid var(--border);border-radius:0.5rem;">
      Épisode ${e.number}${e.title ? ' - ' + escapeHtml(e.title) : ''}
    </div>
  `).join('');
}

function setVideoSource(type) {
  document.getElementById('btn-url').classList.toggle('active', type === 'url');
  document.getElementById('btn-file').classList.toggle('active', type === 'file');
  document.getElementById('input-url-group').classList.toggle('hidden', type !== 'url');
  document.getElementById('input-file-group').classList.toggle('hidden', type !== 'file');
}

async function createEpisode() {
  const num = parseInt(document.getElementById('add-ep-num').value);
  const title = document.getElementById('add-ep-title').value.trim();
  const duration = parseInt(document.getElementById('add-ep-duration').value) || null;
  const isUrl = document.getElementById('btn-url').classList.contains('active');
  let videoUrl = '';
  let videoType = 'url';

  if (isUrl) {
    videoUrl = document.getElementById('add-ep-url').value.trim();
    if (!videoUrl) return alert('URL requise');
  } else {
    const file = document.getElementById('add-ep-file').files[0];
    if (!file) return alert('Fichier requis');
    videoType = 'file';
  }

  const episode = {
    id: getNextId(),
    number: num,
    title,
    videoUrl,
    videoType,
    duration,
    progress: null
  };

  if (videoType === 'file') {
    const file = document.getElementById('add-ep-file').files[0];
    await saveVideoFile(episode.id, file);
  }

  addEpisodes.push(episode);
  document.getElementById('add-ep-num').value = num + 1;
  document.getElementById('add-ep-title').value = '';
  document.getElementById('add-ep-url').value = '';
  document.getElementById('add-ep-file').value = '';
  document.getElementById('add-ep-duration').value = '';
  renderEpisodesList();
}

function finishAdd() {
  const state = getState();
  const anime = state.animes.find(a => a.id === addAnimeId);
  if (anime) {
    anime.seasons = addSeasons;
    setState(state);
  }
  navigate('home');
}

// ===================== ANIME DETAIL =====================
function renderAnimeDetail(animeId) {
  const state = getState();
  const anime = state.animes.find(a => a.id === animeId);
  if (!anime) return navigate('home');

  const totalEp = anime.seasons.reduce((a, s) => a + s.episodes.length, 0);
  const completedEp = anime.seasons.reduce((a, s) => a + s.episodes.filter(e => e.progress?.completed).length, 0);

  let seasonsTabs = `<div class="tabs">`;
  anime.seasons.forEach((s, i) => {
    seasonsTabs += `<button class="tab-btn ${i === 0 ? 'active' : ''}" onclick="switchSeasonTab(this, ${i})">Saison ${s.number}</button>`;
  });
  seasonsTabs += `</div>`;

  let seasonsContent = '';
  anime.seasons.forEach((season, i) => {
    const eps = season.episodes.map(ep => `
      <div class="episode-item">
        <button class="play-btn" onclick="navigate('watch', {episodeId: ${ep.id}})">▶</button>
        <div class="episode-info">
          <div class="title">Épisode ${ep.number}${ep.title ? ' : ' + escapeHtml(ep.title) : ''}</div>
          <div class="meta">
            ${ep.duration ? `<span>⏱ ${Math.floor(ep.duration/60)}m${ep.duration%60}s</span>` : ''}
            ${ep.progress && !ep.progress.completed ? `<span class="resume">Reprendre à ${formatTime(ep.progress.currentTime)}</span>` : ''}
            ${ep.progress?.completed ? '<span style="color:var(--green)">✓ Terminé</span>' : ''}
          </div>
        </div>
      </div>
    `).join('');
    seasonsContent += `<div class="season-panel ${i === 0 ? '' : 'hidden'}" data-index="${i}">${eps || '<p style="color:var(--text-muted);padding:1rem;">Aucun épisode</p>'}</div>`;
  });

  document.getElementById('anime-detail-content').innerHTML = `
    <div class="anime-header">
      <div class="cover-large">
        ${anime.coverImage ? `<img src="${anime.coverImage}" alt="">` : `<div class="placeholder" style="height:100%;">▶️</div>`}
      </div>
      <div style="flex:1;">
        <h1>${escapeHtml(anime.title)}</h1>
        ${anime.synopsis ? `<p style="color:var(--text-muted);margin-bottom:1rem;">${escapeHtml(anime.synopsis)}</p>` : ''}
        <div class="anime-meta">
          <span class="badge badge-${anime.status}">${statusLabel(anime.status)}</span>
          <span class="badge badge-planned">${completedEp}/${totalEp} épisodes</span>
        </div>
        <div class="status-btns">
          ${['watching','completed','planned','dropped'].map(s => `
            <button class="btn btn-sm btn-outline ${anime.status === s ? 'active' : ''}" onclick="updateAnimeStatus(${anime.id}, '${s}')">${statusLabel(s)}</button>
          `).join('')}
        </div>
        <button class="btn btn-danger btn-sm" style="margin-top:1rem;" onclick="deleteAnime(${anime.id})">🗑 Supprimer cet anime</button>
      </div>
    </div>
    ${seasonsTabs}
    <div class="episode-list">${seasonsContent}</div>
  `;
}

function switchSeasonTab(btn, index) {
  btn.parentElement.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  document.querySelectorAll('.season-panel').forEach(p => p.classList.add('hidden'));
  document.querySelector(`.season-panel[data-index="${index}"]`).classList.remove('hidden');
}

function updateAnimeStatus(id, status) {
  const state = getState();
  const anime = state.animes.find(a => a.id === id);
  if (anime) { anime.status = status; setState(state); renderAnimeDetail(id); }
}

function deleteAnime(id) {
  if (!confirm('Supprimer cet anime ?')) return;
  const state = getState();
  state.animes = state.animes.filter(a => a.id !== id);
  setState(state);
  navigate('home');
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

// ===================== WATCH =====================
let saveTimer = null;

async function renderWatch(episodeId) {
  const state = getState();
  let episode = null, season = null, anime = null;
  for (const a of state.animes) {
    for (const s of a.seasons) {
      const ep = s.episodes.find(e => e.id === episodeId);
      if (ep) { episode = ep; season = s; anime = a; break; }
    }
    if (episode) break;
  }
  if (!episode) return navigate('home');

  // Find next episode
  const allEps = season.episodes.slice().sort((a, b) => a.number - b.number);
  const idx = allEps.findIndex(e => e.id === episodeId);
  const nextEp = allEps[idx + 1] || null;

  let videoSrc = episode.videoUrl;
  if (episode.videoType === 'file') {
    videoSrc = await getVideoFile(episode.id);
  }

  document.getElementById('watch-content').innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
      <a href="#" class="back-link" onclick="navigate('anime', {animeId: ${anime.id}})">← ${escapeHtml(anime.title)}</a>
      ${nextEp ? `<button class="btn btn-outline btn-sm" onclick="navigate('watch', {episodeId: ${nextEp.id}})">Épisode suivant →</button>` : ''}
    </div>
    <h2 style="margin-bottom:1rem;">Saison ${season.number} — Épisode ${episode.number}${episode.title ? ' : ' + escapeHtml(episode.title) : ''}</h2>
    <div class="video-wrapper">
      <video id="player" controls autoplay style="width:100%;height:100%;">
        <source src="${videoSrc}" type="video/mp4">
      </video>
    </div>
    <div class="episode-nav">
      ${anime.seasons.map(s => s.episodes.map(ep => `
        <button class="btn btn-sm ${ep.id === episode.id ? 'btn-primary' : 'btn-outline'}" onclick="navigate('watch', {episodeId: ${ep.id}})">
          S${s.number}E${ep.number}
        </button>
      `).join('')).join('')}
    </div>
  `;

  const player = document.getElementById('player');
  if (player) {
    if (episode.progress && !episode.progress.completed) {
      player.currentTime = episode.progress.currentTime;
    }
    player.addEventListener('timeupdate', () => {
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const completed = player.duration > 0 && (player.currentTime / player.duration) > 0.9;
        saveProgress(episode.id, player.currentTime, completed);
      }, 3000);
    });
    player.addEventListener('ended', () => {
      saveProgress(episode.id, player.duration || 0, true);
      if (nextEp) setTimeout(() => navigate('watch', {episodeId: nextEp.id}), 2000);
    });
  }
}

function saveProgress(episodeId, currentTime, completed) {
  const state = getState();
  for (const a of state.animes) {
    for (const s of a.seasons) {
      const ep = s.episodes.find(e => e.id === episodeId);
      if (ep) {
        ep.progress = { currentTime: Math.floor(currentTime), completed };
        setState(state);
        return;
      }
    }
  }
}

// ===================== PROFILE =====================
function renderProfile() {
  const state = getState();
  const animes = state.animes;

  const stats = {
    total: animes.length,
    watching: animes.filter(a => a.status === 'watching').length,
    completed: animes.filter(a => a.status === 'completed').length,
    planned: animes.filter(a => a.status === 'planned').length,
    dropped: animes.filter(a => a.status === 'dropped').length,
    totalEp: animes.reduce((a, anime) => a + anime.seasons.reduce((b, s) => b + s.episodes.length, 0), 0),
    watchedEp: animes.reduce((a, anime) => a + anime.seasons.reduce((b, s) => b + s.episodes.filter(e => e.progress?.completed).length, 0), 0),
    watchTime: animes.reduce((a, anime) => a + anime.seasons.reduce((b, s) => b + s.episodes.reduce((c, e) => {
      if (e.progress?.completed) return c + (e.duration || 0);
      return c + (e.progress?.currentTime || 0);
    }, 0), 0), 0)
  };

  const globalPercent = stats.totalEp ? Math.round((stats.watchedEp / stats.totalEp) * 100) : 0;

  function fmtTime(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  document.getElementById('profile-content').innerHTML = `
    <div class="profile-header">
      <div class="avatar">${state.profile.username[0]?.toUpperCase() || 'U'}</div>
      <div>
        <h1>${escapeHtml(state.profile.username)}</h1>
        <p style="color:var(--text-muted);">Membre depuis le début</p>
      </div>
    </div>

    <div class="stats-grid">
      <div class="stat-card"><div class="icon">🎬</div><div class="value">${stats.total}</div><div class="label">Animes</div></div>
      <div class="stat-card"><div class="icon">📺</div><div class="value">${stats.watchedEp}</div><div class="label">Épisodes vus</div></div>
      <div class="stat-card"><div class="icon">⏱</div><div class="value">${fmtTime(stats.watchTime)}</div><div class="label">Temps de visionnage</div></div>
      <div class="stat-card"><div class="icon">✅</div><div class="value">${stats.completed}</div><div class="label">Terminés</div></div>
    </div>

    <div class="profile-sections">
      <div class="form-card">
        <h2 style="margin-bottom:1rem;">Répartition par status</h2>
        ${['watching','completed','planned','dropped'].map(s => {
          const count = animes.filter(a => a.status === s).length;
          const pct = stats.total ? Math.round((count / stats.total) * 100) : 0;
          return `
            <div style="margin-bottom:0.75rem;">
              <div style="display:flex;justify-content:space-between;font-size:0.875rem;margin-bottom:0.25rem;">
                <span style="color:var(--${s === 'watching' ? 'green' : s === 'completed' ? 'blue' : s === 'planned' ? 'yellow' : 'red'})">${statusLabel(s)}</span>
                <span>${count}</span>
              </div>
              <div class="progress-bar"><div class="fill" style="width:${pct}%"></div></div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="form-card" style="text-align:center;">
        <h2 style="margin-bottom:1rem;">Progression globale</h2>
        <div style="font-size:3rem;font-weight:700;margin-bottom:0.5rem;">${globalPercent}%</div>
        <p style="color:var(--text-muted);font-size:0.875rem;margin-bottom:1rem;">${stats.watchedEp} / ${stats.totalEp} épisodes</p>
        <div class="progress-bar" style="height:10px;"><div class="fill" style="width:${globalPercent}%"></div></div>
      </div>
    </div>

    <h2 style="margin-top:2rem;margin-bottom:1rem;">Animes en cours</h2>
    <div class="card-grid">
      ${animes.filter(a => a.status === 'watching').map(anime => {
        const { total, completed, percent } = getAnimeProgress(anime);
        return `
          <div class="anime-card" onclick="navigate('anime', {animeId: ${anime.id}})">
            <div class="cover" style="aspect-ratio:16/9;">
              ${anime.coverImage ? `<img src="${anime.coverImage}" alt="">` : `<div class="placeholder">▶️</div>`}
            </div>
            <div class="info">
              <h3>${escapeHtml(anime.title)}</h3>
              <p style="font-size:0.75rem;color:var(--text-muted);">${completed}/${total} épisodes</p>
              <div class="progress-bar"><div class="fill" style="width:${percent}%"></div></div>
            </div>
          </div>
        `;
      }).join('') || '<p style="color:var(--text-muted);">Aucun anime en cours</p>'}
    </div>
  `;
}

// ===================== INIT =====================
openDB().then(() => {
  renderHome();
}).catch(err => {
  console.error('IndexedDB error:', err);
  renderHome();
});
