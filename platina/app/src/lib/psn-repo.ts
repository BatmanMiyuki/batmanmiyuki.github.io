/* ------------------------------------------------------------------
   Synchronisation depuis le dépôt GitHub (méthode recommandée).

   Le workflow .github/workflows/update-psn.yml échange le NPSSO gardé
   dans les secrets GitHub contre des jetons PlayStation, importe les
   trophées côté serveur, puis publie `platina/psn-data.json`.
   L'application ne fait que lire ce fichier : aucun jeton PSN, aucun
   mot de passe et aucun relais CORS tiers dans le navigateur.
------------------------------------------------------------------ */

import {
  METALS,
  XP,
  type Activity,
  type Counts,
  type Game,
  type Metal,
  type Platform,
  type PsnImport,
} from "./store";

export type RepoTrophy = {
  psnTrophyId?: number;
  name?: string;
  desc?: string;
  type?: string;
  earned?: boolean;
  at?: number | null;
};

export type RepoGame = {
  id?: string;
  psnNpCommunicationId?: string;
  name?: string;
  platform?: string;
  coverUrl?: string;
  trophies?: RepoTrophy[];
  dlcs?: { trophies?: RepoTrophy[] }[];
  psnProgress?: number | null;
  psnLastUpdatedDateTime?: string | null;
  addedAt?: number;
};

export type RepoPayload = {
  version?: number;
  source?: string;
  generatedAt?: string;
  gamesImported?: number;
  profile?: { onlineId?: string; avatarUrl?: string; isPlus?: boolean } | null;
  playStats?: {
    totalDurationSeconds?: number;
    totalPlayCount?: number;
    games?: { titleId?: string; name?: string; durationSeconds?: number; playCount?: number }[];
  } | null;
  library?: { total?: number; owned?: number; psnPlus?: number } | null;
  games?: RepoGame[];
};

/** Nom du fichier publié par le workflow, servi à côté de la page. */
export const DATA_FILE = "psn-data.json";

export const dataFileUrl = () => new URL(DATA_FILE, document.baseURI).href;

const METAL_BY_PSN: Record<string, Metal> = {
  platinum: "plat",
  gold: "gold",
  silver: "silver",
  bronze: "bronze",
};

const emptyCounts = (): Counts => [0, 0, 0, 0];

const platformOf = (value?: string): Platform => (String(value).includes("PS4") ? "PS4" : "PS5");

/** Tous les trophées d'un jeu, DLC compris. */
function allTrophies(game: RepoGame): RepoTrophy[] {
  const main = Array.isArray(game.trophies) ? game.trophies : [];
  const dlc = (Array.isArray(game.dlcs) ? game.dlcs : []).flatMap((group) =>
    Array.isArray(group?.trophies) ? group.trophies : [],
  );
  return [...main, ...dlc];
}

function trophyCounts(trophies: RepoTrophy[]): Counts {
  const counts = emptyCounts();
  for (const trophy of trophies) {
    if (!trophy?.earned) continue;
    const metal = METAL_BY_PSN[String(trophy.type).toLowerCase()];
    if (!metal) continue;
    counts[METALS.indexOf(metal)] += 1;
  }
  return counts;
}

const xpOf = (counts: Counts) => counts.reduce((sum, value, index) => sum + value * XP[METALS[index]], 0);

const addCounts = (a: Counts, b: Counts): Counts => [a[0] + b[0], a[1] + b[1], a[2] + b[2], a[3] + b[3]];

export type RepoSummary = {
  onlineId: string;
  generatedAt: string | null;
  games: number;
  trophies: number;
  isPlus: boolean;
};

export function summarize(payload: RepoPayload): RepoSummary {
  const games = Array.isArray(payload.games) ? payload.games : [];
  return {
    onlineId: payload.profile?.onlineId?.trim() || "Compte PlayStation",
    generatedAt: payload.generatedAt ?? null,
    games: games.length,
    trophies: games.reduce((sum, game) => sum + allTrophies(game).length, 0),
    isPlus: Boolean(payload.profile?.isPlus),
  };
}

/** Convertit le fichier publié par le workflow en import Platina. */
export function toImport(payload: RepoPayload): PsnImport {
  const repoGames = Array.isArray(payload.games) ? payload.games : [];
  const summary = summarize(payload);

  const games: Game[] = [];
  const activities: Activity[] = [];
  let account = emptyCounts();
  let xp = 0;

  for (const repoGame of repoGames) {
    const trophies = allTrophies(repoGame);
    const counts = trophyCounts(trophies);
    if (!counts.some(Boolean)) continue;

    const title = repoGame.name?.trim() || repoGame.psnNpCommunicationId || "Jeu sans nom";
    account = addCounts(account, counts);
    xp += xpOf(counts);

    const platinum = trophies.find(
      (trophy) => trophy.earned && String(trophy.type).toLowerCase() === "platinum",
    );

    games.push({
      id: repoGame.psnNpCommunicationId || repoGame.id || title,
      title,
      platform: platformOf(repoGame.platform),
      cover: repoGame.coverUrl || undefined,
      total: trophies.length,
      counts,
      platDate: platinum?.at ?? undefined,
    });

    for (const trophy of trophies) {
      if (!trophy.earned || !trophy.at) continue;
      activities.push({
        id: `${repoGame.psnNpCommunicationId ?? title}_${trophy.psnTrophyId ?? activities.length}`,
        kind: "trophy",
        title: trophy.name?.trim() || "Trophée obtenu",
        sub: title,
        ts: trophy.at,
        metal: METAL_BY_PSN[String(trophy.type).toLowerCase()] ?? "bronze",
      });
    }
  }

  activities.sort((a, b) => b.ts - a.ts);

  const played = Array.isArray(payload.playStats?.games) ? payload.playStats?.games ?? [] : [];
  const totalHours = Math.round(
    (played.reduce((sum, game) => sum + (Number(game?.durationSeconds) || 0), 0) / 3600) * 10,
  ) / 10;
  const sessions = played.reduce((sum, game) => sum + (Number(game?.playCount) || 0), 0);

  const level = Math.floor(xp / 100) + 1;

  return {
    onlineId: summary.onlineId,
    accountId: "github-actions",
    level,
    progress: xp % 100,
    account,
    games,
    totalHours,
    sessions,
    activities: activities.slice(0, 80),
  };
}

/** Télécharge le fichier publié par le workflow. */
export async function fetchRepoData(signal?: AbortSignal): Promise<RepoPayload> {
  const response = await fetch(dataFileUrl(), { signal, cache: "no-store" });
  if (response.status === 404) {
    throw new Error(
      `Aucune donnée publiée (${DATA_FILE} absent). Lance le workflow « Update PlayStation data » dans l'onglet Actions.`,
    );
  }
  if (!response.ok) throw new Error(`Lecture de ${DATA_FILE} impossible (HTTP ${response.status}).`);
  try {
    return (await response.json()) as RepoPayload;
  } catch {
    throw new Error(`${DATA_FILE} est illisible : le workflow a-t-il bien terminé ?`);
  }
}

/** Import complet : lecture du fichier publié + conversion. */
export async function importFromRepo(onProgress: (label: string, pct: number) => void = () => {}) {
  onProgress("Lecture des données du dépôt…", 30);
  const payload = await fetchRepoData();
  if (!Array.isArray(payload.games) || payload.games.length === 0) {
    throw new Error("Le fichier publié ne contient aucun jeu pour le moment.");
  }
  onProgress("Conversion des trophées…", 70);
  const snapshot = toImport(payload);
  onProgress("Terminé", 100);
  return { snapshot, summary: summarize(payload) };
}

/** Lit seulement l'état du fichier publié (sans importer). */
export async function readRepoSummary(signal?: AbortSignal): Promise<RepoSummary | null> {
  try {
    const payload = await fetchRepoData(signal);
    return summarize(payload);
  } catch {
    return null;
  }
}
