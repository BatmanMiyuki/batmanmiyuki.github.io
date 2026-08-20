/* ============================================================
   KIOKU · 記憶 — Anime Tracker
   Application autonome (localStorage, aucune dépendance).
   ============================================================ */
'use strict';

/* ------------------------------------------------------------
   1. Persistance
------------------------------------------------------------ */
const KEY = 'kioku.v1';
const DEFAULT_DUR = 22;

const Store = {
  data: { animes: [], settings: { newsCache: null, newsCachedAt: 0 } },

  load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        this.data.animes = Array.isArray(parsed.animes) ? parsed.animes : [];
        this.data.settings = Object.assign(this.data.settings, parsed.settings || {});
      }
    } catch (e) { console.warn('[KIOKU] lecture impossible', e); }
    this.data.animes.forEach(normalize);
    return this.data;
  },

  save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(this.data));
    } catch (e) {
      toast('Stockage plein — impossible de sauvegarder', 'err');
    }
  },

  all()      { return this.data.animes; },
  get(id)    { return this.data.animes.find(a => a.id === id) || null; },
  add(a)     { this.data.animes.unshift(a); this.save(); },
  remove(id) { this.data.animes = this.data.animes.filter(a => a.id !== id); this.save(); },
};

function normalize(a) {
  a.id        = a.id        || uid();
  a.title     = a.title     || 'Sans titre';
  a.jp        = a.jp        || '';
  a.banner    = a.banner    || '';
  a.cover     = a.cover     || '';
  a.synopsis  = a.synopsis  || '';
  a.status    = a.status    || 'watching';
  a.genres    = Array.isArray(a.genres) ? a.genres : [];
  a.favorite  = !!a.favorite;
  a.rating    = typeof a.rating === 'number' ? a.rating : null;
  a.release   = a.release   || '';
  a.addedAt   = a.addedAt   || Date.now();
  a.seasons   = Array.isArray(a.seasons) ? a.seasons : [];
  a.seasons.forEach((s, i) => {
    s.id       = s.id || uid();
    s.name     = s.name || `Saison ${i + 1}`;
    s.episodes = Math.max(0, parseInt(s.episodes, 10) || 0);
    s.duration = Math.max(1, parseInt(s.duration, 10) || DEFAULT_DUR);
    s.watched  = Array.isArray(s.watched) ? s.watched.filter(n => n >= 1 && n <= s.episodes) : [];
  });
  return a;
}

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

/* ------------------------------------------------------------
   2. Calculs
------------------------------------------------------------ */
const Calc = {
  totalEps:   a => a.seasons.reduce((n, s) => n + s.episodes, 0),
  watchedEps: a => a.seasons.reduce((n, s) => n + s.watched.length, 0),
  totalMin:   a => a.seasons.reduce((n, s) => n + s.episodes * s.duration, 0),
  watchedMin: a => a.seasons.reduce((n, s) => n + s.watched.length * s.duration, 0),
  pct(a) {
    const t = Calc.totalEps(a);
    return t ? Math.round(Calc.watchedEps(a) / t * 100) : 0;
  },
  remainingMin: a => Calc.totalMin(a) - Calc.watchedMin(a),
};

/** 1937 → "1 j 8 h 17 min" */
function fmtDuration(min) {
  min = Math.max(0, Math.round(min));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  const out = [];
  if (d) out.push(`${d} j`);
  if (h) out.push(`${h} h`);
  if (m || !out.length) out.push(`${m} min`);
  return out.join(' ');
}
function fmtHours(min) {
  const h = min / 60;
  return h >= 10 ? Math.round(h).toLocaleString('fr-FR') : h.toFixed(1).replace('.', ',');
}
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const STATUS = {
  watching:  { label: 'En cours',      ico: '▶️' },
  completed: { label: 'Terminé',       ico: '✅' },
  planned:   { label: 'À regarder',    ico: '🔖' },
  dropped:   { label: 'Abandonné',     ico: '⏸️' },
  soon:      { label: 'Prochainement', ico: '🗓️' },
};

/* ------------------------------------------------------------
   3. Toasts
------------------------------------------------------------ */
function toast(msg, kind = 'ok') {
  const box = document.getElementById('toasts');
  const el = document.createElement('div');
  el.className = `toast ${kind}`;
  el.innerHTML = `<span>${kind === 'err' ? '⚠️' : '✨'}</span><span>${esc(msg)}</span>`;
  box.appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 300); }, 2400);
}

/* ------------------------------------------------------------
   4. Rendu : cartes
------------------------------------------------------------ */
function mediaHTML(a, useCover) {
  const src = useCover ? (a.cover || a.banner) : (a.banner || a.cover);
  // Le fallback est toujours posé en dessous : si l'image casse, elle se retire
  // et le dégradé décoratif apparaît sans trou visuel.
  return `<div class="card-fallback">🌸</div>` +
    (src ? `<img class="card-img" src="${esc(src)}" alt="" loading="lazy" onerror="this.remove()" />` : '');
}

function cardHTML(a, i, opts = {}) {
  const total = Calc.totalEps(a), done = Calc.watchedEps(a), pct = Calc.pct(a);
  const st = STATUS[a.status] || STATUS.watching;
  const time = opts.plan ? Calc.totalMin(a) : Calc.watchedMin(a);
  return `
  <article class="card" style="animation-delay:${Math.min(i * 45, 400)}ms" onclick="Router.go('anime/${a.id}')">
    <div class="card-media">
      ${mediaHTML(a, opts.cover)}
      <span class="badge ${a.status}">${st.ico} ${st.label}</span>
      <button class="fav-star ${a.favorite ? 'on' : ''}" title="Favori"
              onclick="event.stopPropagation();UI.toggleFav('${a.id}')">${a.favorite ? '⭐' : '☆'}</button>
    </div>
    <div class="card-body">
      <h3 class="card-title">${esc(a.title)}</h3>
      <div class="card-meta">
        <span>📼 <b>${done}</b>/${total} ép.</span>
        <span>⏱️ ${fmtDuration(time)}</span>
        ${a.rating != null ? `<span>⭐ <b>${a.rating}</b>/10</span>` : ''}
      </div>
      <div class="progress ${pct === 100 ? 'done' : ''}"><i style="width:${pct}%"></i></div>
    </div>
  </article>`;
}

function emptyHTML(ico, title, text, btn) {
  return `<div class="empty">
    <div class="empty-ico">${ico}</div>
    <h3>${esc(title)}</h3>
    <p>${esc(text)}</p>
    ${btn || ''}
  </div>`;
}

/* ------------------------------------------------------------
   5. Page « Vus »
------------------------------------------------------------ */
const Seen = {
  render() {
    const q = (document.getElementById('seen-search').value || '').toLowerCase().trim();
    const sort = document.getElementById('seen-sort').value;
    let list = Store.all().filter(a => a.status !== 'planned' && a.status !== 'soon');

    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) || a.jp.toLowerCase().includes(q) ||
      a.genres.join(' ').toLowerCase().includes(q));

    const cmp = {
      recent:   (x, y) => y.addedAt - x.addedAt,
      title:    (x, y) => x.title.localeCompare(y.title, 'fr'),
      time:     (x, y) => Calc.watchedMin(y) - Calc.watchedMin(x),
      progress: (x, y) => Calc.pct(y) - Calc.pct(x),
      rating:   (x, y) => (y.rating ?? -1) - (x.rating ?? -1),
    }[sort];
    list.sort(cmp);

    const el = document.getElementById('seen-grid');
    if (!list.length) {
      el.className = '';
      el.innerHTML = Store.all().length
        ? emptyHTML('🔍', 'Aucun résultat', 'Aucun anime ne correspond à cette recherche.')
        : emptyHTML('🌸', 'Ta collection est vide', 'Ajoute ton premier anime : titre, bannière, saisons et durée des épisodes.',
            `<button class="btn btn-primary" onclick="UI.openForm()">＋ Ajouter un anime</button>`);
    } else {
      el.className = 'grid';
      el.innerHTML = list.map((a, i) => cardHTML(a, i)).join('');
    }
  }
};

/* ------------------------------------------------------------
   6. Page « À regarder »
------------------------------------------------------------ */
const Plan = {
  render() {
    const q = (document.getElementById('plan-search').value || '').toLowerCase().trim();
    const sort = document.getElementById('plan-sort').value;
    let list = Store.all().filter(a => a.status === 'planned');
    if (q) list = list.filter(a =>
      a.title.toLowerCase().includes(q) || a.genres.join(' ').toLowerCase().includes(q));

    list.sort({
      recent: (x, y) => y.addedAt - x.addedAt,
      title:  (x, y) => x.title.localeCompare(y.title, 'fr'),
      short:  (x, y) => Calc.totalMin(x) - Calc.totalMin(y),
      long:   (x, y) => Calc.totalMin(y) - Calc.totalMin(x),
    }[sort]);

    const mins = list.reduce((n, a) => n + Calc.totalMin(a), 0);
    const eps  = list.reduce((n, a) => n + Calc.totalEps(a), 0);
    document.getElementById('plan-summary').innerHTML = list.length ? `
      <div class="hero-stat" style="padding:22px;margin-bottom:20px">
        <div class="hero-time" style="font-size:clamp(26px,5vw,40px)"><span>${fmtDuration(mins)}</span></div>
        <div class="hero-sub">${list.length} anime${list.length > 1 ? 's' : ''} · ${eps} épisodes en attente
          ${mins ? `· soit ${fmtHours(mins)} h de visionnage` : ''}</div>
      </div>` : '';

    const el = document.getElementById('plan-grid');
    if (!list.length) {
      el.className = '';
      el.innerHTML = emptyHTML('🔖', 'Watchlist vide', 'Ajoute un anime avec le statut « À regarder » pour le retrouver ici.',
        `<button class="btn btn-primary" onclick="UI.openForm(null,'planned')">＋ Ajouter à la watchlist</button>`);
    } else {
      el.className = 'grid';
      el.innerHTML = list.map((a, i) => cardHTML(a, i, { plan: true })).join('');
    }
  }
};

/* ------------------------------------------------------------
   7. Page « Nouveautés »
------------------------------------------------------------ */
const News = {
  filter: 'mine',
  loading: false,

  setFilter(f) {
    this.filter = f;
    document.querySelectorAll('#news-chips .chip').forEach(c => c.classList.toggle('active', c.dataset.f === f));
    this.render();
  },

  render() {
    const box = document.getElementById('news-content');
    if (this.filter === 'mine') return this.renderMine(box);
    const cache = Store.data.settings.newsCache;
    if (!cache) { this.load(); box.innerHTML = this.loaderHTML(); return; }
    this.renderRemote(box, this.filter === 'season' ? cache.season : cache.upcoming);
  },

  loaderHTML() {
    return `<div class="loader"><div class="spinner"></div><p>Connexion à AniList…</p></div>`;
  },

  renderMine(box) {
    const list = Store.all().filter(a => a.status === 'soon')
      .sort((x, y) => (x.release || '9999').localeCompare(y.release || '9999'));
    if (!list.length) {
      box.innerHTML = emptyHTML('🔔', 'Aucune sortie surveillée',
        'Ajoute manuellement un anime attendu avec sa date de sortie, ou pioche dans la saison en cours.',
        `<button class="btn btn-primary" onclick="UI.openForm(null,'soon')">＋ Sortie à surveiller</button>
         <button class="btn" onclick="News.setFilter('season')" style="margin-left:8px">🔥 Voir la saison</button>`);
      return;
    }
    box.innerHTML = `<div class="grid">${list.map((a, i) => this.mineCard(a, i)).join('')}</div>`;
  },

  mineCard(a, i) {
    let cd = '';
    if (a.release) {
      const diff = Math.ceil((new Date(a.release + 'T00:00:00') - new Date()) / 86400000);
      cd = diff > 0 ? `<span class="countdown">J-${diff}</span>`
         : diff === 0 ? `<span class="countdown">Aujourd'hui !</span>`
         : `<span class="countdown" style="color:var(--green)">Sorti</span>`;
    }
    const date = a.release
      ? new Date(a.release + 'T00:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
      : 'Date inconnue';
    return `
    <article class="card" style="animation-delay:${i * 45}ms" onclick="Router.go('anime/${a.id}')">
      <div class="card-media">
        ${mediaHTML(a)}
        <span class="badge soon">🗓️ Prochainement</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${esc(a.title)}</h3>
        <div class="news-date">📅 ${esc(date)} ${cd}</div>
        <div class="card-meta" style="margin-top:8px"><span>📼 ${Calc.totalEps(a)} ép. prévus</span></div>
      </div>
    </article>`;
  },

  renderRemote(box, items) {
    if (!items || !items.length) {
      box.innerHTML = emptyHTML('📡', 'Rien à afficher',
        'AniList n\'a rien renvoyé. Vérifie ta connexion puis actualise.',
        `<button class="btn btn-primary" onclick="News.load(true)">🔄 Réessayer</button>`);
      return;
    }
    const when = Store.data.settings.newsCachedAt;
    box.innerHTML = `
      <div class="section-title">${this.filter === 'season' ? '🔥 Saison en cours' : '🗓️ Prochaines sorties'}
        <span class="count">${items.length}</span></div>
      <p class="muted" style="font-size:13px;margin:-8px 0 16px">Données AniList · mises à jour ${new Date(when).toLocaleString('fr-FR')}</p>
      <div class="grid">${items.map((m, i) => this.remoteCard(m, i)).join('')}</div>`;
  },

  remoteCard(m, i) {
    const img = m.cover || m.banner || '';
    const owned = Store.all().some(a => a.anilistId === m.id);
    let sub = m.startDate || '';
    if (m.nextEp) {
      const d = Math.floor(m.nextEp.timeUntilAiring / 86400);
      const h = Math.floor((m.nextEp.timeUntilAiring % 86400) / 3600);
      sub = `Ép. ${m.nextEp.episode} dans ${d > 0 ? d + ' j ' : ''}${h} h`;
    }
    return `
    <article class="card news-card" style="animation-delay:${Math.min(i * 35, 400)}ms">
      <div class="card-media">
        ${img ? `<img src="${esc(img)}" alt="" loading="lazy" />` : '<div class="card-fallback">🌸</div>'}
        ${m.score ? `<span class="badge" style="background:var(--gold);color:#2a1c00;border-color:transparent">★ ${m.score / 10}</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${esc(m.title)}</h3>
        <div class="news-date">${sub ? '📅 ' + esc(sub) : '📺 ' + (m.episodes || '?') + ' ép.'}</div>
        <div class="card-meta" style="margin-top:6px"><span>${esc((m.genres || []).slice(0, 2).join(' · '))}</span></div>
        <div class="card-actions">
          <button class="btn btn-sm ${owned ? '' : 'btn-primary'}" ${owned ? 'disabled style="opacity:.55"' : ''}
                  onclick="News.import(${i})">${owned ? '✓ Dans ma liste' : '＋ Ajouter'}</button>
        </div>
      </div>
    </article>`;
  },

  import(idx) {
    const cache = Store.data.settings.newsCache;
    const items = this.filter === 'season' ? cache.season : cache.upcoming;
    const m = items[idx];
    if (!m) return;
    const planned = this.filter === 'season';
    Store.add(normalize({
      id: uid(),
      anilistId: m.id,
      title: m.title,
      jp: m.jp || '',
      banner: m.banner || m.cover || '',
      cover: m.cover || '',
      synopsis: m.description || '',
      genres: m.genres || [],
      status: planned ? 'planned' : 'soon',
      release: m.startDateISO || '',
      addedAt: Date.now(),
      seasons: [{ id: uid(), name: 'Saison 1', episodes: m.episodes || 12, duration: m.duration || DEFAULT_DUR, watched: [] }],
    }));
    toast(`${m.title} ajouté à ${planned ? 'ta watchlist' : 'tes sorties'}`);
    this.render();
  },

  async load(force) {
    if (this.loading) return;
    const age = Date.now() - (Store.data.settings.newsCachedAt || 0);
    if (!force && Store.data.settings.newsCache && age < 6 * 3600e3) return this.render();

    this.loading = true;
    const box = document.getElementById('news-content');
    if (this.filter !== 'mine') box.innerHTML = this.loaderHTML();

    const now = new Date();
    const m = now.getMonth();
    const season = m < 3 ? 'WINTER' : m < 6 ? 'SPRING' : m < 9 ? 'SUMMER' : 'FALL';
    const nextSeason = { WINTER: 'SPRING', SPRING: 'SUMMER', SUMMER: 'FALL', FALL: 'WINTER' }[season];
    const year = now.getFullYear();
    const nextYear = season === 'FALL' ? year + 1 : year;

    const frag = `
      id
      title { romaji english native }
      description(asHtml: false)
      bannerImage
      coverImage { extraLarge large }
      episodes duration genres averageScore
      startDate { year month day }
      nextAiringEpisode { episode timeUntilAiring }`;

    const query = `query {
      season: Page(page:1, perPage:30) {
        media(season:${season}, seasonYear:${year}, type:ANIME, sort:POPULARITY_DESC, isAdult:false) { ${frag} }
      }
      upcoming: Page(page:1, perPage:30) {
        media(season:${nextSeason}, seasonYear:${nextYear}, type:ANIME, sort:POPULARITY_DESC, isAdult:false) { ${frag} }
      }
    }`;

    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const json = await res.json();
      const map = mm => ({
        id: mm.id,
        title: mm.title.english || mm.title.romaji,
        jp: mm.title.native || '',
        description: (mm.description || '').replace(/<[^>]+>/g, '').slice(0, 600),
        banner: mm.bannerImage || '',
        cover: mm.coverImage?.extraLarge || mm.coverImage?.large || '',
        episodes: mm.episodes, duration: mm.duration,
        genres: mm.genres || [], score: mm.averageScore,
        startDate: fmtAniDate(mm.startDate),
        startDateISO: isoAniDate(mm.startDate),
        nextEp: mm.nextAiringEpisode,
      });
      Store.data.settings.newsCache = {
        season: (json.data.season.media || []).map(map),
        upcoming: (json.data.upcoming.media || []).map(map),
      };
      Store.data.settings.newsCachedAt = Date.now();
      Store.save();
      if (force) toast('Nouveautés actualisées');
    } catch (e) {
      console.warn('[KIOKU] AniList', e);
      if (this.filter !== 'mine') {
        box.innerHTML = emptyHTML('📡', 'AniList injoignable',
          'Impossible de récupérer les nouveautés. Vérifie ta connexion internet.',
          `<button class="btn btn-primary" onclick="News.load(true)">🔄 Réessayer</button>`);
      }
      this.loading = false;
      return;
    }
    this.loading = false;
    this.render();
  }
};

function fmtAniDate(d) {
  if (!d || !d.year) return '';
  if (!d.month) return String(d.year);
  const dt = new Date(d.year, d.month - 1, d.day || 1);
  return dt.toLocaleDateString('fr-FR', d.day
    ? { day: 'numeric', month: 'long', year: 'numeric' }
    : { month: 'long', year: 'numeric' });
}
function isoAniDate(d) {
  if (!d || !d.year || !d.month) return '';
  return `${d.year}-${String(d.month).padStart(2, '0')}-${String(d.day || 1).padStart(2, '0')}`;
}

/* ------------------------------------------------------------
   8. Page « Stats »
------------------------------------------------------------ */
const Stats = {
  render() {
    const all = Store.all();
    const seen      = all.filter(a => a.status !== 'planned' && a.status !== 'soon');
    const planned   = all.filter(a => a.status === 'planned');
    const soon      = all.filter(a => a.status === 'soon');

    const epsWatched = all.reduce((n, a) => n + Calc.watchedEps(a), 0);
    const minWatched = all.reduce((n, a) => n + Calc.watchedMin(a), 0);
    const minPlanned = planned.reduce((n, a) => n + Calc.totalMin(a), 0);
    const seasons    = all.reduce((n, a) => n + a.seasons.length, 0);
    const rated      = all.filter(a => a.rating != null);
    const avg        = rated.length ? (rated.reduce((n, a) => n + a.rating, 0) / rated.length) : null;

    const box = document.getElementById('stats-content');
    if (!all.length) {
      box.innerHTML = emptyHTML('📊', 'Pas encore de données',
        'Ajoute des animes et coche tes épisodes : les statistiques se construiront toutes seules.',
        `<button class="btn btn-primary" onclick="UI.openForm()">＋ Ajouter un anime</button>`);
      return;
    }

    const days = minWatched / 1440;
    box.innerHTML = `
      <div class="hero-stat">
        <div class="eyebrow">Temps passé devant un anime</div>
        <div class="hero-time"><span>${fmtDuration(minWatched)}</span></div>
        <div class="hero-sub">
          ${minWatched.toLocaleString('fr-FR')} minutes · ${fmtHours(minWatched)} heures
          ${days >= 1 ? ` · l'équivalent de ${days.toFixed(1).replace('.', ',')} jours non-stop` : ''}
        </div>
      </div>

      <div class="stat-grid">
        ${this.stat('📺', seen.length, 'Animes vus')}
        ${this.stat('🔖', planned.length, 'À regarder')}
        ${this.stat('🎞️', epsWatched.toLocaleString('fr-FR'), 'Épisodes vus')}
        ${this.stat('🗂️', seasons, 'Saisons suivies')}
        ${this.stat('🗓️', soon.length, 'Sorties suivies')}
      </div>

      <div class="panel">
        <h3>Répartition de la collection</h3>
        <div class="donut-wrap">
          ${this.donut([
            ['Animes vus',    seen.length,    '#ff3d8b'],
            ['À regarder',    planned.length, '#35e6ff'],
            ['Prochainement', soon.length,    '#ffce4f'],
          ], all.length)}
        </div>
      </div>

      <div class="stat-grid" style="margin-top:18px">
        ${this.stat('📚', fmtDuration(minPlanned), 'Watchlist à venir')}
        ${this.stat('⭐', avg != null ? avg.toFixed(1).replace('.', ',') + '/10' : '—', 'Note moyenne')}
        ${this.stat('🎬', epsWatched ? Math.round(minWatched / epsWatched) + ' min' : '—', 'Durée moyenne / ép.')}
      </div>

      ${this.topPanel(all)}
      ${this.genrePanel(all)}
      ${this.ratingPanel(rated)}

      <div class="panel">
        <h3>Données</h3>
        <div style="display:flex;flex-wrap:wrap;gap:10px">
          <button class="btn" onclick="Data.export()">⬇️ Exporter (JSON)</button>
          <button class="btn" onclick="Data.importPrompt()">⬆️ Importer</button>
          <button class="btn btn-danger" onclick="Data.reset()">🗑️ Tout effacer</button>
        </div>
        <p class="hint muted" style="margin-top:12px;font-size:12.5px">
          Tes données restent dans ce navigateur (localStorage). Exporte-les pour les sauvegarder ou les transférer.
        </p>
      </div>`;
  },

  stat(ico, val, lab) {
    return `<div class="stat"><div class="stat-ico">${ico}</div>
      <div class="stat-val">${val}</div><div class="stat-lab">${lab}</div></div>`;
  },

  donut(rows, total) {
    const parts = rows.filter(r => r[1] > 0);
    if (!total || !parts.length) return '<p class="muted">Aucune donnée.</p>';
    let acc = 0;
    const stops = parts.map(([, v, c]) => {
      const from = acc / total * 100;
      acc += v;
      return `${c} ${from}% ${acc / total * 100}%`;
    }).join(', ');
    return `
      <div class="donut" style="background:conic-gradient(${stops})">
        <div class="donut-mid"><div><b>${total}</b><span>Animes</span></div></div>
      </div>
      <div class="legend">
        ${rows.map(([n, v, c]) => `
          <div class="legend-row">
            <i class="legend-dot" style="background:${c}"></i>
            <span>${n}</span><span>${v} · ${total ? Math.round(v / total * 100) : 0} %</span>
          </div>`).join('')}
      </div>`;
  },

  topPanel(all) {
    const top = all.filter(a => Calc.watchedMin(a) > 0)
      .sort((x, y) => Calc.watchedMin(y) - Calc.watchedMin(x)).slice(0, 6);
    if (!top.length) return '';
    const max = Calc.watchedMin(top[0]) || 1;
    return `<div class="panel"><h3>Top temps de visionnage</h3>
      ${top.map(a => `
        <div class="bar-row">
          <div class="bar-head"><b>${esc(a.title)}</b><span>${fmtDuration(Calc.watchedMin(a))}</span></div>
          <div class="bar"><i style="width:${Calc.watchedMin(a) / max * 100}%"></i></div>
        </div>`).join('')}
    </div>`;
  },

  genrePanel(all) {
    const map = {};
    all.forEach(a => a.genres.forEach(g => { map[g] = (map[g] || 0) + 1; }));
    const rows = Object.entries(map).sort((x, y) => y[1] - x[1]).slice(0, 18);
    if (!rows.length) return '';
    return `<div class="panel"><h3>Genres favoris</h3>
      <div class="tag-cloud">${rows.map(([g, n]) => `<span class="tag">${esc(g)} <b>${n}</b></span>`).join('')}</div>
    </div>`;
  },

  ratingPanel(rated) {
    if (rated.length < 2) return '';
    const buckets = [0, 0, 0, 0, 0];
    rated.forEach(a => { buckets[Math.min(4, Math.floor(a.rating / 2))]++; });
    const labels = ['0–2', '2–4', '4–6', '6–8', '8–10'];
    const max = Math.max(...buckets) || 1;
    return `<div class="panel"><h3>Mes notes</h3>
      ${buckets.map((v, i) => `
        <div class="bar-row">
          <div class="bar-head"><b>${labels[i]}</b><span>${v} anime${v > 1 ? 's' : ''}</span></div>
          <div class="bar"><i style="width:${v / max * 100}%"></i></div>
        </div>`).join('')}
    </div>`;
  }
};

/* ------------------------------------------------------------
   9. Page « Détail »
------------------------------------------------------------ */
const Detail = {
  id: null,
  open: {},

  render(id) {
    this.id = id;
    const a = Store.get(id);
    const box = document.getElementById('page-detail');
    if (!a) {
      box.innerHTML = emptyHTML('🫥', 'Anime introuvable', 'Cet anime a peut-être été supprimé.',
        `<button class="btn btn-primary" onclick="Router.go('seen')">← Retour</button>`);
      return;
    }
    const total = Calc.totalEps(a), done = Calc.watchedEps(a), pct = Calc.pct(a);
    const st = STATUS[a.status] || STATUS.watching;
    const img = a.banner || a.cover;

    box.innerHTML = `
      <button class="btn btn-sm" onclick="history.length>1?history.back():Router.go('seen')" style="margin-bottom:16px">← Retour</button>

      <div class="detail-hero">
        <div class="detail-banner">
          ${img ? `<img src="${esc(img)}" alt="" onerror="this.remove()" />` : ''}
        </div>
        <div class="detail-info">
          <span class="badge ${a.status}" style="position:static;display:inline-block;margin-bottom:10px">${st.ico} ${st.label}</span>
          <h1 class="detail-title">${esc(a.title)}</h1>
          ${a.jp ? `<div class="detail-jp">${esc(a.jp)}</div>` : ''}
          ${a.genres.length ? `<div class="detail-tags">${a.genres.map(g => `<span class="tag">${esc(g)}</span>`).join('')}</div>` : ''}
          ${a.synopsis ? `<p class="detail-syn">${esc(a.synopsis)}</p>` : ''}

          <div class="kpis">
            <div class="kpi"><b>${done}/${total}</b><span>Épisodes</span></div>
            <div class="kpi"><b>${pct} %</b><span>Progression</span></div>
            <div class="kpi"><b>${fmtDuration(Calc.watchedMin(a))}</b><span>Temps vu</span></div>
            <div class="kpi"><b>${fmtDuration(Calc.remainingMin(a))}</b><span>Restant</span></div>
            ${a.rating != null ? `<div class="kpi"><b>${a.rating}/10</b><span>Ma note</span></div>` : ''}
            ${a.release ? `<div class="kpi"><b>${new Date(a.release + 'T00:00:00').toLocaleDateString('fr-FR')}</b><span>Sortie</span></div>` : ''}
          </div>

          <div class="progress ${pct === 100 ? 'done' : ''}" style="margin-top:16px"><i style="width:${pct}%"></i></div>

          <div class="detail-actions">
            <button class="btn btn-primary" onclick="Detail.nextEp()">▶️ Épisode suivant</button>
            <button class="btn" onclick="UI.openForm('${a.id}')">✏️ Modifier</button>
            <button class="btn" onclick="UI.toggleFav('${a.id}',true)">${a.favorite ? '⭐ Retirer des favoris' : '☆ Ajouter aux favoris'}</button>
            <select class="input" style="width:auto" onchange="Detail.setStatus(this.value)">
              ${Object.entries(STATUS).map(([k, v]) =>
                `<option value="${k}" ${a.status === k ? 'selected' : ''}>${v.ico} ${v.label}</option>`).join('')}
            </select>
          </div>
        </div>
      </div>

      <div class="section-title">Saisons <span class="count">${a.seasons.length}</span></div>
      ${a.seasons.length
        ? a.seasons.map((s, i) => this.seasonHTML(a, s, i)).join('')
        : `<p class="muted">Aucune saison enregistrée. <button class="btn btn-sm" onclick="UI.openForm('${a.id}')">Ajouter une saison</button></p>`}

      <div class="panel" style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <span class="muted" style="margin-right:auto">Ajouté le ${new Date(a.addedAt).toLocaleDateString('fr-FR')}</span>
        <button class="btn btn-danger" onclick="UI.deleteAnime('${a.id}')">🗑️ Supprimer cet anime</button>
      </div>`;
  },

  seasonHTML(a, s, idx) {
    const pct = s.episodes ? Math.round(s.watched.length / s.episodes * 100) : 0;
    const isOpen = this.open[s.id] ?? (pct < 100);
    const eps = [];
    for (let n = 1; n <= s.episodes; n++) {
      const on = s.watched.includes(n);
      eps.push(`<button class="ep ${on ? 'on' : ''}" onclick="Detail.toggleEp('${s.id}',${n})"
                 title="Épisode ${n}${on ? ' — vu' : ''}">${n}</button>`);
    }
    return `
    <div class="season ${isOpen ? 'open' : ''}" id="season-${s.id}">
      <div class="season-head" onclick="Detail.toggleSeason('${s.id}')">
        <div>
          <div class="season-name">${esc(s.name)}</div>
          <div class="season-sub">${s.episodes} ép. × ${s.duration} min · ${fmtDuration(s.episodes * s.duration)}</div>
        </div>
        <div class="season-right">
          <span class="season-pct">${s.watched.length}/${s.episodes} · ${pct} %</span>
          <span class="caret">▾</span>
        </div>
      </div>
      <div class="season-body">
        <div class="progress ${pct === 100 ? 'done' : ''}" style="margin:0 0 14px"><i style="width:${pct}%"></i></div>
        <div class="ep-grid">${eps.join('') || '<p class="muted">Aucun épisode.</p>'}</div>
        <div class="season-tools">
          <button class="btn btn-sm" onclick="Detail.markSeason('${s.id}',true)">✅ Tout marquer vu</button>
          <button class="btn btn-sm" onclick="Detail.markSeason('${s.id}',false)">↺ Tout décocher</button>
        </div>
      </div>
    </div>`;
  },

  toggleSeason(sid) {
    const el = document.getElementById('season-' + sid);
    const open = el.classList.toggle('open');
    this.open[sid] = open;
  },

  toggleEp(sid, n) {
    const a = Store.get(this.id); if (!a) return;
    const s = a.seasons.find(x => x.id === sid); if (!s) return;
    const i = s.watched.indexOf(n);
    if (i >= 0) s.watched.splice(i, 1);
    else s.watched.push(n);
    s.watched.sort((x, y) => x - y);
    this.open[sid] = true;          // ne pas replier la saison sous les doigts
    this.autoStatus(a);
    Store.save();
    this.render(this.id);
  },

  markSeason(sid, all) {
    const a = Store.get(this.id); if (!a) return;
    const s = a.seasons.find(x => x.id === sid); if (!s) return;
    s.watched = all ? Array.from({ length: s.episodes }, (_, i) => i + 1) : [];
    this.open[sid] = true;
    this.autoStatus(a);
    Store.save();
    this.render(this.id);
    toast(all ? `${s.name} marquée comme vue` : `${s.name} réinitialisée`);
  },

  nextEp() {
    const a = Store.get(this.id); if (!a) return;
    for (const s of a.seasons) {
      for (let n = 1; n <= s.episodes; n++) {
        if (!s.watched.includes(n)) {
          s.watched.push(n); s.watched.sort((x, y) => x - y);
          this.autoStatus(a); Store.save();
          this.open[s.id] = true;
          this.render(this.id);
          toast(`${s.name} · épisode ${n} coché (+${s.duration} min)`);
          return;
        }
      }
    }
    toast('Tous les épisodes sont déjà vus 🎉');
  },

  setStatus(v) {
    const a = Store.get(this.id); if (!a) return;
    a.status = v; Store.save(); this.render(this.id);
    toast(`Statut : ${STATUS[v].label}`);
  },

  /** Passe automatiquement en « terminé » / « en cours ». */
  autoStatus(a) {
    // « À regarder » / « Prochainement » basculent en cours dès le 1er épisode.
    // « Abandonné » est un choix explicite : on n'y touche pas.
    if (a.status === 'planned' || a.status === 'soon') {
      if (Calc.watchedEps(a) > 0) a.status = 'watching';
    }
    if (a.status === 'dropped') return;
    const t = Calc.totalEps(a);
    if (t && Calc.watchedEps(a) === t) a.status = 'completed';
    else if (a.status === 'completed') a.status = 'watching';
  }
};

/* ------------------------------------------------------------
   10. Formulaire
------------------------------------------------------------ */
const UI = {
  editing: null,

  openForm(id = null, presetStatus = null) {
    this.editing = id;
    const a = id ? Store.get(id) : null;
    document.getElementById('form-title').textContent = a ? 'Modifier l\'anime' : 'Ajouter un anime';
    document.getElementById('f-delete').style.display = a ? 'inline-flex' : 'none';

    const v = (el, val) => { document.getElementById(el).value = val ?? ''; };
    v('f-title', a?.title); v('f-jp', a?.jp); v('f-banner', a?.banner);
    v('f-syn', a?.synopsis); v('f-genres', (a?.genres || []).join(', '));
    v('f-rating', a?.rating); v('f-release', a?.release);
    document.getElementById('f-status').value = a?.status || presetStatus || 'completed';
    document.getElementById('assist-q').value = '';
    document.getElementById('assist-res').innerHTML = '';
    this._cover = a?.cover || '';
    this._anilistId = a?.anilistId || null;

    const box = document.getElementById('f-seasons');
    box.innerHTML = '';
    if (a && a.seasons.length) a.seasons.forEach(s => this.addSeasonRow(s));
    else this.addSeasonRow();

    this.syncStatusFields();
    this.previewBanner();
    document.getElementById('form-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  },

  closeForm() {
    document.getElementById('form-modal').classList.remove('open');
    document.body.style.overflow = '';
    this.editing = null;
  },

  syncStatusFields() {
    const s = document.getElementById('f-status').value;
    document.getElementById('f-release-wrap').style.display = (s === 'soon' || s === 'planned') ? 'block' : 'none';
  },

  previewBanner() {
    const url = document.getElementById('f-banner').value.trim() || this._cover;
    const box = document.getElementById('f-banner-prev');
    box.innerHTML = url
      ? `<img src="${esc(url)}" alt="" onerror="this.parentNode.textContent='Image introuvable'" />`
      : 'Aperçu de la bannière';
  },

  addSeasonRow(s) {
    const box = document.getElementById('f-seasons');
    const n = box.children.length + 1;
    const row = document.createElement('div');
    row.className = 'season-edit';
    row.dataset.sid = s?.id || '';
    row.dataset.watched = JSON.stringify(s?.watched || []);
    row.innerHTML = `
      <div class="field"><label>Nom</label>
        <input class="s-name" value="${esc(s?.name || 'Saison ' + n)}" placeholder="Saison ${n}" /></div>
      <div class="field"><label>Épisodes</label>
        <input class="s-eps" type="number" min="0" max="9999" value="${s?.episodes ?? 12}" /></div>
      <div class="field"><label>Min/ép.</label>
        <input class="s-dur" type="number" min="1" max="600" value="${s?.duration ?? DEFAULT_DUR}" /></div>
      <button class="mini-del" title="Supprimer" onclick="this.closest('.season-edit').remove()">🗑️</button>`;
    box.appendChild(row);
  },

  saveForm() {
    const g = id => document.getElementById(id).value.trim();
    const title = g('f-title');
    if (!title) { toast('Le titre est obligatoire', 'err'); document.getElementById('f-title').focus(); return; }

    const seasons = [...document.querySelectorAll('#f-seasons .season-edit')].map((row, i) => {
      const eps = Math.max(0, parseInt(row.querySelector('.s-eps').value, 10) || 0);
      let watched = [];
      try { watched = JSON.parse(row.dataset.watched || '[]').filter(n => n <= eps); } catch (e) {}
      return {
        id: row.dataset.sid || uid(),
        name: row.querySelector('.s-name').value.trim() || `Saison ${i + 1}`,
        episodes: eps,
        duration: Math.max(1, parseInt(row.querySelector('.s-dur').value, 10) || DEFAULT_DUR),
        watched,
      };
    });
    if (!seasons.length) { toast('Ajoute au moins une saison', 'err'); return; }

    const ratingRaw = g('f-rating');
    const payload = {
      title,
      jp: g('f-jp'),
      banner: g('f-banner'),
      cover: this._cover || '',
      synopsis: g('f-syn'),
      genres: g('f-genres').split(',').map(x => x.trim()).filter(Boolean),
      status: document.getElementById('f-status').value,
      rating: ratingRaw === '' ? null : Math.min(10, Math.max(0, parseFloat(ratingRaw))),
      release: g('f-release'),
      seasons,
    };
    if (this._anilistId) payload.anilistId = this._anilistId;

    if (this.editing) {
      const a = Store.get(this.editing);
      Object.assign(a, payload);
      normalize(a);
      Store.save();
      toast('Modifications enregistrées');
    } else {
      Store.add(normalize(Object.assign({ id: uid(), addedAt: Date.now(), favorite: false }, payload)));
      toast(`${title} ajouté à ta collection`);
    }
    this.closeForm();
    Router.refresh();
  },

  deleteCurrent() { if (this.editing) this.deleteAnime(this.editing); },

  deleteAnime(id) {
    const a = Store.get(id); if (!a) return;
    if (!confirm(`Supprimer « ${a.title} » et toute sa progression ?`)) return;
    Store.remove(id);
    this.closeForm();
    toast('Anime supprimé');
    if (location.hash.includes(id)) Router.go('seen'); else Router.refresh();
  },

  toggleFav(id, redraw) {
    const a = Store.get(id); if (!a) return;
    a.favorite = !a.favorite;
    Store.save();
    toast(a.favorite ? '⭐ Ajouté aux favoris' : 'Retiré des favoris');
    redraw ? Detail.render(id) : Router.refresh();
  },

  /* -------- Recherche AniList dans le formulaire -------- */
  async assistSearch() {
    const q = document.getElementById('assist-q').value.trim();
    const box = document.getElementById('assist-res');
    if (!q) return;
    box.innerHTML = `<p class="muted" style="font-size:13px">Recherche…</p>`;
    const query = `query($q:String){ Page(page:1,perPage:8){ media(search:$q,type:ANIME,sort:SEARCH_MATCH,isAdult:false){
      id title{romaji english native} description(asHtml:false) bannerImage coverImage{extraLarge large}
      episodes duration genres startDate{year month day} format seasonYear } } }`;
    try {
      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ query, variables: { q } }),
      });
      const json = await res.json();
      const list = json.data?.Page?.media || [];
      if (!list.length) { box.innerHTML = `<p class="muted" style="font-size:13px">Aucun résultat.</p>`; return; }
      this._results = list;
      box.innerHTML = list.map((m, i) => `
        <button class="assist-item" onclick="UI.assistPick(${i})">
          <img src="${esc(m.coverImage?.large || '')}" alt="" />
          <span>
            <b>${esc(m.title.english || m.title.romaji)}</b>
            <small>${esc(m.title.native || '')} · ${m.episodes || '?'} ép. · ${m.duration || DEFAULT_DUR} min · ${m.seasonYear || '—'}</small>
          </span>
        </button>`).join('');
    } catch (e) {
      box.innerHTML = `<p class="muted" style="font-size:13px">AniList injoignable — remplis les champs à la main.</p>`;
    }
  },

  assistPick(i) {
    const m = this._results?.[i]; if (!m) return;
    const set = (id, val) => { document.getElementById(id).value = val ?? ''; };
    set('f-title', m.title.english || m.title.romaji);
    set('f-jp', m.title.native || '');
    set('f-banner', m.bannerImage || m.coverImage?.extraLarge || '');
    set('f-syn', (m.description || '').replace(/<[^>]+>/g, '').trim());
    set('f-genres', (m.genres || []).join(', '));
    const iso = isoAniDate(m.startDate);
    if (iso) set('f-release', iso);
    this._cover = m.coverImage?.extraLarge || m.coverImage?.large || '';
    this._anilistId = m.id;

    const box = document.getElementById('f-seasons');
    box.innerHTML = '';
    this.addSeasonRow({ id: uid(), name: 'Saison 1', episodes: m.episodes || 12, duration: m.duration || DEFAULT_DUR, watched: [] });

    this.previewBanner();
    document.getElementById('assist-res').innerHTML = '';
    toast('Champs pré-remplis — ajuste tes saisons');
  }
};

/* ------------------------------------------------------------
   11. Import / export
------------------------------------------------------------ */
const Data = {
  export() {
    const blob = new Blob([JSON.stringify({ animes: Store.all() }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `kioku-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast('Sauvegarde exportée');
  },

  importPrompt() {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          const json = JSON.parse(r.result);
          const list = Array.isArray(json) ? json : json.animes;
          if (!Array.isArray(list)) throw new Error('format');
          if (!confirm(`Importer ${list.length} anime(s) ? Les entrées actuelles seront conservées.`)) return;
          list.forEach(a => { a.id = uid(); Store.data.animes.push(normalize(a)); });
          Store.save(); Router.refresh();
          toast(`${list.length} anime(s) importé(s)`);
        } catch (e) { toast('Fichier invalide', 'err'); }
      };
      r.readAsText(f);
    };
    inp.click();
  },

  reset() {
    if (!confirm('Effacer TOUTES tes données KIOKU ? Cette action est irréversible.')) return;
    Store.data.animes = [];
    Store.save(); Router.refresh();
    toast('Données effacées');
  }
};

/* ------------------------------------------------------------
   11b. Signature (photo de signature)
------------------------------------------------------------ */
const Signature = {
  KEY: 'kioku.signature',

  init() {
    const saved = localStorage.getItem(this.KEY);
    this.update(saved || 'signature.png');
  },

  handleImgError(img) {
    const badge = img.closest('.signature-badge');
    const hero = img.closest('.hero-signature');
    if (badge) badge.classList.add('no-img');
    if (hero) hero.classList.add('no-img');
  },

  openModal() {
    document.getElementById('sig-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
    const current = localStorage.getItem(this.KEY) || '';
    const isData = current.startsWith('data:');
    document.getElementById('sig-url').value = isData ? '' : current;
    this.previewUrl(current || 'signature.png');
  },

  closeModal() {
    document.getElementById('sig-modal').classList.remove('open');
    document.body.style.overflow = '';
  },

  previewUrl(url) {
    const box = document.getElementById('sig-prev');
    if (!box) return;
    const clean = (url || '').trim();
    box.innerHTML = clean
      ? `<img src="${esc(clean)}" alt="" style="max-height:100%;max-width:100%;object-fit:contain" onerror="this.parentNode.textContent='Image introuvable'" />`
      : 'Aperçu de la signature';
  },

  saveUrl() {
    const url = document.getElementById('sig-url').value.trim();
    if (url) {
      localStorage.setItem(this.KEY, url);
      this.update(url);
      toast('Photo de signature enregistrée');
    } else {
      localStorage.removeItem(this.KEY);
      this.update('signature.png');
      toast('Photo de signature réinitialisée');
    }
    this.closeModal();
  },

  uploadFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      try {
        localStorage.setItem(this.KEY, dataUrl);
        this.update(dataUrl);
        toast('Photo de signature importée');
        this.closeModal();
      } catch (e) {
        toast('Image trop volumineuse pour le stockage local', 'err');
      }
    };
    reader.readAsDataURL(file);
  },

  reset() {
    localStorage.removeItem(this.KEY);
    this.update('signature.png');
    this.closeModal();
    toast('Signature réinitialisée');
  },

  update(src) {
    document.querySelectorAll('.signature-badge, .hero-signature').forEach(el => {
      el.classList.remove('no-img');
    });
    document.querySelectorAll('.signature-img-el').forEach(img => {
      img.style.display = 'block';
      img.src = src;
    });
  }
};

/* ------------------------------------------------------------
   12. Routage
------------------------------------------------------------ */
const Router = {
  current: 'seen',

  go(route) { location.hash = '#' + route; },

  handle() {
    const raw = (location.hash || '#seen').slice(1);
    const [page, param] = raw.split('/');
    // Raccourci PWA « Ajouter » : on ouvre le formulaire par-dessus la page Vus.
    if (page === 'add') { location.replace('#seen'); setTimeout(() => UI.openForm(), 60); return; }

    const known = ['seen', 'plan', 'news', 'stats', 'anime'];
    const p = known.includes(page) ? page : 'seen';
    this.current = p; this.param = param;

    document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
    const target = p === 'anime' ? 'page-detail' : 'page-' + p;
    document.getElementById(target).classList.add('active');

    const tabKey = p === 'anime' ? 'seen' : p;
    document.querySelectorAll('.tab, .mtab').forEach(t =>
      t.classList.toggle('active', (t.getAttribute('href') || '') === '#' + tabKey));

    this.refresh();
    window.scrollTo(0, 0);
  },

  refresh() {
    switch (this.current) {
      case 'seen':  Seen.render(); break;
      case 'plan':  Plan.render(); break;
      case 'news':  News.render(); break;
      case 'stats': Stats.render(); break;
      case 'anime': Detail.render(this.param); break;
    }
  }
};

/* ------------------------------------------------------------
   13. Décor : pétales
------------------------------------------------------------ */
function spawnPetals(n = 14) {
  const box = document.getElementById('petals');
  for (let i = 0; i < n; i++) {
    const p = document.createElement('i');
    p.className = 'petal';
    p.style.left = Math.random() * 100 + 'vw';
    p.style.animationDuration = (11 + Math.random() * 14) + 's';
    p.style.animationDelay = (-Math.random() * 20) + 's';
    const s = 7 + Math.random() * 10;
    p.style.width = s + 'px'; p.style.height = s + 'px';
    p.style.opacity = .25 + Math.random() * .35;
    box.appendChild(p);
  }
}

/* ------------------------------------------------------------
   14. Démarrage
------------------------------------------------------------ */
function boot() {
  Store.load();
  Signature.init();
  spawnPetals();

  window.addEventListener('hashchange', () => Router.handle());
  Router.handle();

  // Filtres & recherches
  const seenChips = document.getElementById('seen-chips');
  if (seenChips) {
    seenChips.addEventListener('click', e => {
      const c = e.target.closest('.chip'); if (!c) return;
      document.querySelectorAll('#seen-chips .chip').forEach(x => x.classList.toggle('active', x === c));
      Seen.filter = c.dataset.f; Seen.render();
    });
  }
  document.getElementById('news-chips').addEventListener('click', e => {
    const c = e.target.closest('.chip'); if (!c) return;
    News.setFilter(c.dataset.f);
    if (c.dataset.f !== 'mine') News.load();
  });
  ['seen-search', 'seen-sort'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => Seen.render()));
  ['plan-search', 'plan-sort'].forEach(id =>
    document.getElementById(id).addEventListener('input', () => Plan.render()));

  // Formulaire & Signature
  document.getElementById('f-status').addEventListener('change', () => UI.syncStatusFields());
  document.getElementById('f-banner').addEventListener('input', () => UI.previewBanner());
  document.getElementById('assist-btn').addEventListener('click', () => UI.assistSearch());
  document.getElementById('assist-q').addEventListener('keydown', e => {
    if (e.key === 'Enter') { e.preventDefault(); UI.assistSearch(); }
  });
  document.getElementById('form-modal').addEventListener('mousedown', e => {
    if (e.target.id === 'form-modal') UI.closeForm();
  });
  document.getElementById('sig-modal').addEventListener('mousedown', e => {
    if (e.target.id === 'sig-modal') Signature.closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { UI.closeForm(); Signature.closeModal(); }
    const formOpen = document.getElementById('form-modal').classList.contains('open');
    const sigOpen = document.getElementById('sig-modal').classList.contains('open');
    if (e.key === 'n' && !formOpen && !sigOpen && !/input|textarea|select/i.test(document.activeElement.tagName)) UI.openForm();
  });

  // PWA
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}

document.addEventListener('DOMContentLoaded', boot);
