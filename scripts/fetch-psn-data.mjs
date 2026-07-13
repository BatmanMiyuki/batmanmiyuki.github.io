import fs from "node:fs";
import path from "node:path";
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserTitles,
  getTitleTrophies,
  getUserTrophiesEarnedForTitle,
  getTitleTrophyGroups,
  getUserPlayedGames,
  getProfileFromAccountId,
  getPurchasedGames
} from "psn-api";

const NPSSO = cleanNpsso(process.env.NPSSO || "");
const MAX_GAMES = normalizeMaxGames(process.env.MAX_GAMES || "0");
const OUT_FILE = path.join(process.cwd(), "Platina", "psn-data.json");
const LOCALE = "fr-FR";
const FR_HEADERS = { "Accept-Language": LOCALE };

const GRADS = [
  ["#1a3a5c", "#0a1e30"], ["#3a0a0a", "#220404"], ["#0a3a10", "#041506"],
  ["#2d0a3a", "#130418"], ["#3a200a", "#160b04"], ["#0a1e3a", "#040b18"],
  ["#2a0a20", "#10040c"], ["#1a3a0a", "#0a1604"], ["#3a2a0a", "#150f04"],
  ["#0a2a3a", "#041018"]
];

function cleanNpsso(value) {
  return String(value || "")
    .trim()
    .replace(/^\{"npsso":"/i, "")
    .replace(/"\}$/i, "")
    .replace(/^"|"$/g, "")
    .trim();
}

function normalizeMaxGames(value) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 800);
}

function npOptionsFor(title) {
  // PlayStation renvoie la localisation française officielle lorsqu'elle existe.
  // Si le jeu n'a pas de ressources FR, l'API conserve sa langue d'origine.
  const opts = { headerOverrides: FR_HEADERS };
  if (title.npServiceName) opts.npServiceName = title.npServiceName;
  else if (!String(title.trophyTitlePlatform || "").includes("PS5")) opts.npServiceName = "trophy";
  return opts;
}

async function authorize() {
  if (!NPSSO || NPSSO.length < 20) throw new Error("Secret GitHub PSN_NPSSO manquant ou invalide.");
  const accessCode = await exchangeNpssoForAccessCode(NPSSO);
  return await exchangeAccessCodeForAuthTokens(accessCode);
}

async function getTitles(authorization) {
  const all = [];
  const limit = 100;
  let offset = 0;
  while (true) {
    const res = await getUserTitles(authorization, "me", { limit, offset, headerOverrides: FR_HEADERS });
    const titles = Array.isArray(res?.trophyTitles) ? res.trophyTitles : [];
    all.push(...titles);
    if (MAX_GAMES > 0 && all.length >= MAX_GAMES) return all.slice(0, MAX_GAMES);
    const total = res?.totalItemCount ? Number(res.totalItemCount) : null;
    if (!titles.length || titles.length < limit || (total && all.length >= total)) break;
    offset += limit;
    if (offset > 1000) break;
  }
  return MAX_GAMES > 0 ? all.slice(0, MAX_GAMES) : all;
}

function parseIsoDuration(value) {
  const match = String(value || "").match(/^P(?:(\d+(?:\.\d+)?)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:(\d+(?:\.\d+)?)S)?)?$/i);
  if (!match) return 0;
  return Math.round(
    Number(match[1] || 0) * 86400 +
    Number(match[2] || 0) * 3600 +
    Number(match[3] || 0) * 60 +
    Number(match[4] || 0)
  );
}

function playedPlatform(title) {
  const category = String(title?.category || "").toLowerCase();
  if (category.includes("ps5")) return "PS5";
  if (category.includes("ps4")) return "PS4";
  if (category.includes("ps3")) return "PS3";
  if (category.includes("vita")) return "PS Vita";
  if (category.includes("pc")) return "PC";
  return "Autre";
}

function bestPlayedCover(title) {
  if (title?.localizedImageUrl) return title.localizedImageUrl;
  if (title?.imageUrl) return title.imageUrl;
  const images = Array.isArray(title?.concept?.media?.images) ? title.concept.media.images : [];
  const preferred = images.find(image => ["FOUR_BY_THREE_BANNER", "GAMEHUB_COVER_ART", "PORTRAIT_BANNER"].includes(image?.type));
  return preferred?.url || images[0]?.url || "";
}

function normalizePlayedTitle(title) {
  const durationSeconds = parseIsoDuration(title?.playDuration);
  return {
    titleId: title?.titleId || "",
    conceptId: title?.concept?.id ?? null,
    name: title?.localizedName || title?.name || title?.concept?.name || "Jeu sans nom",
    originalName: title?.name || "",
    coverUrl: bestPlayedCover(title),
    platform: playedPlatform(title),
    category: title?.category || "unknown",
    service: title?.service || "unknown",
    playCount: Number(title?.playCount || 0),
    playDuration: title?.playDuration || "PT0S",
    durationSeconds,
    firstPlayedDateTime: title?.firstPlayedDateTime || null,
    lastPlayedDateTime: title?.lastPlayedDateTime || null
  };
}

async function getAllPlayedGames(authorization) {
  const all = [];
  const limit = 200;
  let offset = 0;
  let reportedTotal = null;
  while (true) {
    const res = await getUserPlayedGames(authorization, "me", { limit, offset });
    const titles = Array.isArray(res?.titles) ? res.titles : [];
    all.push(...titles);
    reportedTotal = Number.isFinite(Number(res?.totalItemCount)) ? Number(res.totalItemCount) : reportedTotal;
    if (!titles.length || (reportedTotal !== null && all.length >= reportedTotal)) break;
    if (reportedTotal === null && titles.length < limit) break;
    offset += titles.length;
    if (offset > 3000) break;
  }
  const games = all.map(normalizePlayedTitle);
  return {
    totalTitles: reportedTotal ?? games.length,
    totalDurationSeconds: games.reduce((sum, game) => sum + game.durationSeconds, 0),
    totalPlayCount: games.reduce((sum, game) => sum + game.playCount, 0),
    games
  };
}

function normalizeLibraryGame(game) {
  return {
    titleId: game?.titleId || "",
    conceptId: game?.conceptId || null,
    name: game?.name || "Jeu sans nom",
    platform: game?.platform || "Autre",
    coverUrl: game?.image?.url || "",
    membership: game?.membership || "NONE",
    isActive: Boolean(game?.isActive),
    isDownloadable: Boolean(game?.isDownloadable),
    isPreOrder: Boolean(game?.isPreOrder)
  };
}

async function getLibrary(authorization) {
  const all = [];
  const size = 100;
  let start = 0;
  while (true) {
    const res = await getPurchasedGames(authorization, { size, start });
    const games = Array.isArray(res?.data?.purchasedTitlesRetrieve?.games)
      ? res.data.purchasedTitlesRetrieve.games
      : [];
    all.push(...games);
    if (!games.length || games.length < size) break;
    start += games.length;
    if (start > 3000) break;
  }
  const unique = new Map();
  all.forEach(game => {
    const key = game?.titleId || game?.conceptId || game?.entitlementId;
    if (key && !unique.has(key)) unique.set(key, normalizeLibraryGame(game));
  });
  const games = Array.from(unique.values());
  // On publie uniquement les totaux nécessaires à PStat, pas le détail des
  // licences de la bibliothèque dans le dépôt GitHub public.
  return {
    total: games.length,
    owned: games.filter(game => game.membership === "NONE").length,
    psPlus: games.filter(game => game.membership === "PS_PLUS").length
  };
}

function normalizeProfile(profile) {
  const avatars = Array.isArray(profile?.avatars) ? profile.avatars : [];
  const avatar = avatars.find(item => String(item?.size || "").toLowerCase().includes("xl")) || avatars.at(-1) || avatars[0];
  return {
    onlineId: profile?.onlineId || "",
    avatarUrl: avatar?.url || "",
    isPlus: Boolean(profile?.isPlus)
  };
}

async function getGroupNames(authorization, title, opts) {
  try {
    const res = await getTitleTrophyGroups(authorization, title.npCommunicationId, opts);
    const groups = Array.isArray(res?.trophyGroups) ? res.trophyGroups : [];
    return Object.fromEntries(groups.map(g => [g.trophyGroupId, g.trophyGroupName || g.trophyGroupId]));
  } catch (err) {
    console.warn(`Groupes ignorés pour ${title.trophyTitleName}: ${err.message}`);
    return {};
  }
}

function trophyToPlatina(trophy, titleId) {
  const type = ["bronze", "silver", "gold", "platinum"].includes(trophy.trophyType) ? trophy.trophyType : "bronze";
  const earned = Boolean(trophy.earned);
  return {
    id: `psn_${titleId}_${trophy.trophyId}`,
    psnTrophyId: trophy.trophyId,
    psnGroupId: trophy.trophyGroupId || "default",
    name: trophy.trophyName || "Trophée masqué",
    desc: trophy.trophyDetail || "",
    type,
    earned,
    at: earned && trophy.earnedDateTime ? new Date(trophy.earnedDateTime).getTime() : null,
    rarity: trophy.trophyRare ?? null,
    earnedRate: trophy.trophyEarnedRate ? Number(trophy.trophyEarnedRate) : null,
    iconUrl: trophy.trophyIconUrl || ""
  };
}

async function convertTitle(authorization, title, index) {
  const titleId = title.npCommunicationId;
  const opts = npOptionsFor(title);
  const [titleRes, earnedRes, groupNames] = await Promise.all([
    getTitleTrophies(authorization, titleId, "all", opts),
    getUserTrophiesEarnedForTitle(authorization, "me", titleId, "all", opts),
    getGroupNames(authorization, title, opts)
  ]);

  const titleTrophies = Array.isArray(titleRes?.trophies) ? titleRes.trophies : [];
  const earnedTrophies = Array.isArray(earnedRes?.trophies) ? earnedRes.trophies : [];
  const earnedById = new Map(earnedTrophies.map(t => [String(t.trophyId), t]));
  const merged = titleTrophies.map(t => {
    const earned = earnedById.get(String(t.trophyId));
    return { ...t, ...(earned || {}), earned: Boolean(earned?.earned) };
  });

  const all = merged.map(t => trophyToPlatina(t, titleId));
  const main = all.filter(t => !t.psnGroupId || t.psnGroupId === "default");
  const dlcGroups = new Map();
  for (const t of all) {
    if (!t.psnGroupId || t.psnGroupId === "default") continue;
    if (!dlcGroups.has(t.psnGroupId)) {
      dlcGroups.set(t.psnGroupId, {
        id: `psn_${titleId}_${t.psnGroupId}`,
        psnGroupId: t.psnGroupId,
        name: groupNames[t.psnGroupId] || `DLC ${t.psnGroupId}`,
        trophies: []
      });
    }
    dlcGroups.get(t.psnGroupId).trophies.push(t);
  }

  const platformRaw = String(title.trophyTitlePlatform || "PS5");
  const platform = platformRaw.includes("PS5") ? "PS5" : platformRaw.includes("PS4") ? "PS4" : "PS3";
  return {
    id: `psn_${titleId}`,
    source: "psn",
    psnNpCommunicationId: titleId,
    name: title.trophyTitleName || titleId,
    platform,
    platformRaw,
    coverUrl: title.trophyTitleIconUrl || "",
    grad: GRADS[index % GRADS.length],
    trophies: main,
    dlcs: Array.from(dlcGroups.values()),
    addedAt: title.lastUpdatedDateTime ? new Date(title.lastUpdatedDateTime).getTime() : Date.now(),
    psnProgress: title.progress ?? null,
    psnLastUpdatedDateTime: title.lastUpdatedDateTime || null
  };
}

async function main() {
  const authorization = await authorize();

  // Les statistiques de compte sont indépendantes des trophées. Une panne d'un
  // endpoint secondaire ne doit donc pas empêcher la mise à jour de Platina.
  const [titlesResult, profileResult, playStatsResult, libraryResult] = await Promise.allSettled([
    getTitles(authorization),
    getProfileFromAccountId(authorization, "me", { headerOverrides: FR_HEADERS }),
    getAllPlayedGames(authorization),
    getLibrary(authorization)
  ]);

  if (titlesResult.status === "rejected") throw titlesResult.reason;
  const titles = titlesResult.value;
  const warnings = [];
  const settledValue = (result, label, fallback) => {
    if (result.status === "fulfilled") return result.value;
    const message = result.reason?.message || String(result.reason || "Erreur inconnue");
    console.warn(`${label} indisponible: ${message}`);
    warnings.push({ scope: label, message });
    return fallback;
  };

  const rawProfile = settledValue(profileResult, "profile", null);
  const profile = rawProfile ? normalizeProfile(rawProfile) : null;
  const playStats = settledValue(playStatsResult, "playStats", null);
  const library = settledValue(libraryResult, "library", null);

  console.log(`Titres PSN trouvés/importés: ${titles.length}`);
  if (playStats) console.log(`Statistiques de jeu: ${playStats.games.length} titres · ${Math.round(playStats.totalDurationSeconds / 3600)} h`);
  if (library) console.log(`Bibliothèque: ${library.total} jeux`);

  const games = [];
  const errors = [];
  let trophiesImported = 0;
  for (let i = 0; i < titles.length; i++) {
    const title = titles[i];
    try {
      console.log(`[${i + 1}/${titles.length}] ${title.trophyTitleName}`);
      const game = await convertTitle(authorization, title, i);
      trophiesImported += (game.trophies || []).length + (game.dlcs || []).reduce((s, d) => s + (d.trophies || []).length, 0);
      games.push(game);
    } catch (err) {
      console.warn(`Jeu ignoré: ${title.trophyTitleName} — ${err.message}`);
      errors.push({ name: title.trophyTitleName || "Jeu inconnu", message: err.message || String(err) });
    }
  }

  const payload = {
    version: 4,
    source: "psn-github-actions",
    locale: LOCALE,
    localizationPolicy: "official-playstation-or-original",
    generatedAt: new Date().toISOString(),
    maxGames: MAX_GAMES,
    gamesImported: games.length,
    trophiesImported,
    profile,
    playStats,
    library,
    warnings,
    errors,
    games
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`Écrit ${OUT_FILE}`);
  console.log(`${games.length} jeux à trophées, ${trophiesImported} trophées, ${errors.length} erreurs, ${warnings.length} avertissements`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
