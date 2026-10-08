/* ------------------------------------------------------------------
   Client PlayStation Network (NPSSO → jetons → trophées & temps de jeu)

   Flux de la communauté (psn-api) :
   1. NPSSO (cookie de session, 64 car.)
   2. GET  /oauth/authorize → code v3.…
   3. POST /oauth/token     → access + refresh tokens
   4. GET  trophySummary / trophyTitles / played games

   Le navigateur interdit l'en-tête Cookie et Sony ne renvoie aucun
   header CORS : chaque appel passe donc par un relais. On enchaîne
   plusieurs relais, dont certains acceptent les en-têtes interdits via
   `x-cors-headers` et exposent les en-têtes reçus via
   `cors-received-headers`. En cas d'échec total, le mode manuel permet
   de coller le code d'autorisation obtenu à la main.
------------------------------------------------------------------ */

import type { Activity, Counts, Game, Platform, PsnImport } from "./store";

export type PsnProgress = (label: string, pct: number) => void;

const AUTH = "https://ca.account.sony.com/api/authz/v3/oauth";
const TROPHY = "https://m.np.playstation.com/api/trophy/v1/users";
const GAMES = "https://m.np.playstation.com/api/gamelist/v2/users";
const CLIENT_ID = "09515159-7237-4370-9b40-3806e67c0891";
const BASIC = "Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=";
const REDIRECT = "com.scee.psxandroid.scecompcall://redirect";
const SCOPE = "psn:mobile.v2.core psn:clientapp";

const uid = () => Math.random().toString(36).slice(2, 10);
const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : "");

/* -------------------------------------------------------------- relais */

type Relay = {
  name: string;
  send: (url: string, init: RequestInit, cookie?: string) => Promise<Response>;
};

function toObject(headers?: HeadersInit) {
  const out: Record<string, string> = {};
  new Headers(headers).forEach((v, k) => (out[k] = v));
  return out;
}

/** HTMLDriven : proxy JSON qui transmet méthode, en-têtes et corps. */
async function htmldriven(url: string, init: RequestInit, cookie?: string) {
  const res = await fetch("https://cors-proxy.htmldriven.com/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      method: (init.method ?? "GET").toUpperCase(),
      headers: { ...toObject(init.headers), ...(cookie ? { Cookie: `npsso=${cookie}` } : {}) },
      data: typeof init.body === "string" ? init.body : "",
    }),
  });
  const j = (await res.json().catch(() => ({}))) as {
    status?: number;
    content?: unknown;
    headers?: Record<string, string>;
  };
  const content = typeof j.content === "string" ? j.content : JSON.stringify(j.content ?? {});
  return new Response(content, {
    status: j.status && j.status >= 100 ? j.status : 200,
    headers: {
      "content-type": "application/json",
      "x-received-headers": JSON.stringify(j.headers ?? {}),
    },
  });
}

/** cloudflare-cors-anywhere : en-têtes interdits + en-têtes reçus exposés. */
function workers(url: string, init: RequestInit, cookie?: string) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("x-cors-headers", JSON.stringify({ Cookie: `npsso=${cookie}` }));
  return fetch(`https://test.cors.workers.dev/?${url}`, { ...init, headers, redirect: "follow" });
}

/** Corsfix : en-têtes interdits via x-corsfix-headers. */
function corsfix(url: string, init: RequestInit, cookie?: string) {
  const headers = new Headers(init.headers);
  if (cookie) headers.set("x-corsfix-headers", JSON.stringify({ Cookie: `npsso=${cookie}` }));
  return fetch(`https://proxy.corsfix.com/?${url}`, { ...init, headers, redirect: "follow" });
}

/** corsproxy.io : en-têtes de requête surchargés dans la query. */
function corsproxy(url: string, init: RequestInit, cookie?: string) {
  const q = new URLSearchParams({ url });
  if (cookie) q.append("reqHeaders", `cookie:npsso=${cookie}`);
  return fetch(`https://corsproxy.io/?${q.toString()}`, {
    ...init,
    headers: new Headers(init.headers),
    redirect: "follow",
  });
}

/** cors.lol : relais simple. */
function corslol(url: string, init: RequestInit) {
  return fetch(`https://api.cors.lol/?url=${encodeURIComponent(url)}`, {
    ...init,
    headers: new Headers(init.headers),
    redirect: "follow",
  });
}

/** codetabs : relais simple (GET/POST). */
function codetabs(url: string, init: RequestInit) {
  return fetch(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`, {
    ...init,
    headers: new Headers(init.headers),
    redirect: "follow",
  });
}

const RELAYS: Relay[] = [
  { name: "workers", send: workers },
  { name: "htmldriven", send: htmldriven },
  { name: "corsfix", send: corsfix },
  { name: "corsproxy", send: corsproxy },
  { name: "cors.lol", send: corslol },
  { name: "codetabs", send: codetabs },
];

async function relay(url: string, init: RequestInit = {}, cookie?: string): Promise<Response> {
  const errors: string[] = [];
  for (const r of RELAYS) {
    try {
      const res = await r.send(url, init, cookie);
      if (res.status === 0) continue;
      if (res.status === 403 || res.status === 429 || res.status >= 500) {
        errors.push(`${r.name}: HTTP ${res.status}`);
        continue;
      }
      return res;
    } catch (e) {
      errors.push(`${r.name}: ${e instanceof Error ? e.message : "échec"}`);
    }
  }
  throw new Error(`Aucun relais n'a pu joindre PlayStation (${errors.slice(0, 3).join(" · ")}).`);
}

/* ------------------------------------------------------------- headers */

function receivedHeaders(res: Response): Record<string, string> {
  const out: Record<string, string> = {};
  for (const name of ["cors-received-headers", "x-cors-headers", "x-received-headers"]) {
    const raw = res.headers.get(name);
    if (!raw) continue;
    try {
      const j = JSON.parse(raw) as Record<string, string>;
      for (const [k, v] of Object.entries(j)) out[k.toLowerCase()] = String(v);
    } catch {
      /* not json */
    }
  }
  for (const name of ["location", "x-final-url", "x-corsfix-location", "x-redirect-url", "x-url"]) {
    const v = res.headers.get(name);
    if (v) out[name] = v;
  }
  return out;
}

function codeFrom(text: string) {
  const m = text.match(/code=([A-Za-z0-9._~%+/-]+)/);
  return m ? decodeURIComponent(m[1]) : "";
}

function extractCode(res: Response, body: string) {
  const hdrs = receivedHeaders(res);
  for (const [k, v] of Object.entries(hdrs)) {
    if (k.includes("location") || k.includes("url") || k.includes("final")) {
      const c = codeFrom(v);
      if (c) return c;
    }
  }
  const fromUrl = codeFrom(res.url || "");
  if (fromUrl) return fromUrl;
  const fromBody = codeFrom(body);
  if (fromBody) return fromBody;
  try {
    const j = JSON.parse(body) as Record<string, unknown>;
    for (const v of Object.values(j)) {
      const s = str(v);
      if (s && (s.includes("code=") || s.startsWith("v3."))) {
        const c = s.startsWith("v3.") ? s : codeFrom(s);
        if (c) return c;
      }
    }
  } catch {
    /* not json */
  }
  return "";
}

/* ---------------------------------------------------------------- JWT */

function decodeJwt(token: string): Record<string, unknown> {
  try {
    const payload = token.split(".")[1] ?? "";
    const b64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const pad = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(pad)) as Record<string, unknown>;
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------- NPSSO */

export function normalizeNpsso(raw: string) {
  const t = raw.trim();
  const json = t.match(/"npsso"\s*:\s*"([A-Za-z0-9_-]{32,128})"/);
  if (json) return json[1];
  const m = t.match(/[A-Za-z0-9_-]{32,128}/);
  return m ? m[0] : t;
}

export function authorizeUrl() {
  return `${AUTH}/authorize?${new URLSearchParams({
    access_type: "offline",
    client_id: CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: "code",
    scope: SCOPE,
  }).toString()}`;
}

/** Normalise ce que l'utilisateur colle dans le mode manuel : code brut ou URL complète. */
export function normalizeCode(raw: string) {
  const t = raw.trim();
  if (!t) return "";
  const fromUrl = codeFrom(t);
  if (fromUrl) return fromUrl;
  const m = t.match(/^(v3\.[A-Za-z0-9._~%+/-]+)/);
  return m ? m[1] : t;
}

async function exchangeNpsso(npsso: string): Promise<string> {
  const res = await relay(authorizeUrl(), { method: "GET" }, npsso);
  const body = await res.text();
  const code = extractCode(res, body);
  if (!code) {
    throw new Error(
      "Code d'accès introuvable après échange du NPSSO. Le relais n'a pas transmis la redirection, ou le NPSSO est expiré. Utilise le mode manuel ci-dessous.",
    );
  }
  return code;
}

async function exchangeCode(code: string) {
  const body = new URLSearchParams({
    code,
    redirect_uri: REDIRECT,
    grant_type: "authorization_code",
    token_format: "jwt",
  });
  const res = await relay(`${AUTH}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: BASIC,
    },
    body: body.toString(),
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!str(raw.access_token)) {
    const desc = str(raw.error_description) || str(raw.error) || `HTTP ${res.status}`;
    const code4102 = String(raw.error_code ?? "") === "4102" || /bad client credentials/i.test(desc);
    throw new Error(
      code4102
        ? `Sony bloque l'échange de jeton des outils tiers (erreur 4102). Ce n'est pas ton NPSSO : colle un access_token dans le mode manuel, ou réessaie plus tard.`
        : `Sony a refusé l'échange de jeton (${desc}).`,
    );
  }
  return tokensFrom(raw);
}

function tokensFrom(raw: Record<string, unknown>) {
  const now = Date.now();
  return {
    accessToken: str(raw.access_token),
    refreshToken: str(raw.refresh_token),
    idToken: str(raw.id_token),
    accessExp: now + (Number(raw.expires_in) || 3600) * 1000,
    refreshExp: now + (Number(raw.refresh_token_expires_in) || 5184000) * 1000,
  };
}

export async function refreshTokens(refreshToken: string) {
  const body = new URLSearchParams({
    refresh_token: refreshToken,
    grant_type: "refresh_token",
    token_format: "jwt",
    scope: SCOPE,
  });
  const res = await relay(`${AUTH}/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: BASIC,
    },
    body: body.toString(),
  });
  const raw = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!str(raw.access_token)) throw new Error("Jeton de rafraîchissement expiré. Recolle un NPSSO.");
  return { ...tokensFrom(raw), refreshToken: str(raw.refresh_token) || refreshToken };
}

async function apiGet<T>(path: string, token: string): Promise<T> {
  const res = await relay(path, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}`, "Accept-Language": "fr-FR" },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`API PSN ${res.status} — ${text.slice(0, 160)}`);
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("Réponse PlayStation illisible (relais probablement bloqué).");
  }
}

/* ------------------------------------------------------------- modèles */

type TrophyCounts = { bronze?: number; silver?: number; gold?: number; platinum?: number };

type TrophyTitle = {
  npCommunicationId: string;
  npServiceName?: string;
  trophyTitleName: string;
  trophyTitleIconUrl?: string;
  trophyTitlePlatform?: string;
  progress?: number;
  definedTrophies?: TrophyCounts;
  earnedTrophies?: TrophyCounts;
  lastUpdatedDateTime?: string;
  hiddenFlag?: boolean;
};

type PlayedTitle = {
  name?: string;
  localizedName?: string;
  imageUrl?: string;
  localizedImageUrl?: string;
  category?: string;
  playCount?: number;
  playDuration?: string;
};

const hoursOf = (iso?: string) => {
  if (!iso) return 0;
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?/i);
  return m ? Number(m[1] || 0) + Number(m[2] || 0) / 60 + Number(m[3] || 0) / 3600 : 0;
};
const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const countsOf = (c?: TrophyCounts): Counts => [c?.platinum ?? 0, c?.gold ?? 0, c?.silver ?? 0, c?.bronze ?? 0];
const totalOf = (c?: TrophyCounts) =>
  (c?.platinum ?? 0) + (c?.gold ?? 0) + (c?.silver ?? 0) + (c?.bronze ?? 0);
const platformOf = (raw?: string, category?: string): Platform =>
  `${raw ?? ""} ${category ?? ""}`.toUpperCase().includes("PS5") ? "PS5" : "PS4";

async function allTitles(token: string) {
  const out: TrophyTitle[] = [];
  let offset = 0;
  for (let i = 0; i < 8; i++) {
    const page = await apiGet<{ trophyTitles?: TrophyTitle[]; nextOffset?: number }>(
      `${TROPHY}/me/trophyTitles?limit=800&offset=${offset}`,
      token,
    );
    const list = page.trophyTitles ?? [];
    out.push(...list);
    if (!page.nextOffset || list.length === 0) break;
    offset = page.nextOffset;
  }
  return out;
}

async function allPlayed(token: string) {
  const out: PlayedTitle[] = [];
  let offset = 0;
  for (let i = 0; i < 10; i++) {
    const page = await apiGet<{ titles?: PlayedTitle[]; nextOffset?: number }>(
      `${GAMES}/me/titles?limit=200&offset=${offset}`,
      token,
    );
    const list = page.titles ?? [];
    out.push(...list);
    if (!page.nextOffset || list.length === 0) break;
    offset = page.nextOffset;
  }
  return out;
}

/* --------------------------------------------------------------- sync */

async function buildSnapshot(
  tokens: ReturnType<typeof tokensFrom>,
  onProgress: PsnProgress,
): Promise<PsnImport> {
  const claims = decodeJwt(tokens.idToken);

  onProgress("Lecture du profil trophées…", 38);
  const summary = await apiGet<{
    trophyLevel?: string | number;
    progress?: number;
    earnedTrophies?: TrophyCounts;
    accountId?: string;
  }>(`${TROPHY}/me/trophySummary`, tokens.accessToken);

  onProgress("Import de la bibliothèque…", 58);
  const titles = await allTitles(tokens.accessToken);

  onProgress("Import du temps de jeu…", 80);
  let played: PlayedTitle[] = [];
  try {
    played = await allPlayed(tokens.accessToken);
  } catch {
    played = [];
  }

  const playByName = new Map<string, PlayedTitle>();
  for (const p of played) {
    const n = norm(p.localizedName || p.name || "");
    if (n) playByName.set(n, p);
  }

  const games: Game[] = titles
    .filter((t) => !t.hiddenFlag)
    .map((t) => {
      const earned = countsOf(t.earnedTrophies);
      const play = playByName.get(norm(t.trophyTitleName));
      return {
        id: t.npCommunicationId || uid(),
        title: t.trophyTitleName,
        platform: platformOf(t.trophyTitlePlatform, play?.category),
        cover: t.trophyTitleIconUrl || play?.localizedImageUrl || play?.imageUrl,
        total: Math.max(totalOf(t.definedTrophies), earned.reduce((a, b) => a + b, 0)),
        counts: earned,
        platDate:
          earned[0] > 0 && t.lastUpdatedDateTime ? Date.parse(t.lastUpdatedDateTime) : undefined,
      };
    });

  const recent = [...titles]
    .filter((t) => t.lastUpdatedDateTime && totalOf(t.earnedTrophies) > 0)
    .sort((a, b) => Date.parse(b.lastUpdatedDateTime!) - Date.parse(a.lastUpdatedDateTime!))
    .slice(0, 8);

  const activities: Activity[] = recent.map((t) => {
    const earned = countsOf(t.earnedTrophies);
    const metal = earned[0] > 0 ? "plat" : earned[1] > 0 ? "gold" : earned[2] > 0 ? "silver" : "bronze";
    return {
      id: uid(),
      kind: "trophy" as const,
      title: earned[0] > 0 ? "Platine" : "Progression",
      sub: t.trophyTitleName,
      ts: Date.parse(t.lastUpdatedDateTime!),
      metal,
    };
  });

  const level = Math.max(1, Number(summary.trophyLevel) || 1);
  const progress = Math.max(0, Math.min(99, Number(summary.progress) || 0));

  onProgress("Terminé", 100);

  return {
    onlineId:
      str(claims.online_id) || str(claims.onlineId) || str(claims.username) || "Compte PlayStation",
    accountId: str(summary.accountId) || str(claims.sub) || "me",
    level,
    progress,
    account: countsOf(summary.earnedTrophies),
    games,
    totalHours: Math.round(played.reduce((a, p) => a + hoursOf(p.playDuration), 0) * 10) / 10,
    sessions: played.reduce((a, p) => a + (p.playCount ?? 0), 0),
    activities,
    tokens: {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExp: tokens.accessExp,
      refreshExp: tokens.refreshExp,
    },
  };
}

export async function importFromNpsso(npssoRaw: string, onProgress: PsnProgress = () => {}) {
  const npsso = normalizeNpsso(npssoRaw);
  if (npsso.length < 32) throw new Error("Ce NPSSO ne ressemble pas à un jeton valide (64 caractères).");

  onProgress("Échange du NPSSO…", 10);
  const code = await exchangeNpsso(npsso);
  return importFromCode(code, onProgress);
}

export async function importFromCode(codeRaw: string, onProgress: PsnProgress = () => {}) {
  const code = normalizeCode(codeRaw);
  if (!code) throw new Error("Aucun code d'autorisation fourni.");

  onProgress("Récupération du jeton d'accès…", 22);
  const tokens = await exchangeCode(code);
  return buildSnapshot(tokens, onProgress);
}

export async function importFromRefresh(refreshToken: string, onProgress: PsnProgress = () => {}) {
  onProgress("Rafraîchissement du jeton…", 14);
  const tokens = await refreshTokens(refreshToken);
  return buildSnapshot(tokens, onProgress);
}

/** Porte de sortie : un access_token déjà obtenu (outil PSN, export, etc.). */
export async function importFromToken(accessToken: string, onProgress: PsnProgress = () => {}) {
  const token = accessToken.trim().replace(/^Bearer\s+/i, "");
  if (token.length < 30) throw new Error("Ce jeton ne ressemble pas à un access_token.");
  return buildSnapshot(tokensFrom({ access_token: token }), onProgress);
}

/** Vrai si la valeur collée est un jeton JWT plutôt qu'un code d'autorisation. */
export const looksLikeJwt = (v: string) => v.trim().split(".").length === 3 && v.trim().length > 60;
