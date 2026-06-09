import fs from "node:fs";
import path from "node:path";
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserTitles,
  getTitleTrophies,
  getUserTrophiesEarnedForTitle,
  getTitleTrophyGroups
} from "psn-api";

const NPSSO = cleanNpsso(process.env.NPSSO || "");
const MAX_GAMES = normalizeMaxGames(process.env.MAX_GAMES || "50");
const OUT_FILE = path.join(process.cwd(), "Platina", "psn-data.json");

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
  if (!Number.isFinite(n) || n < 0) return 50;
  return Math.min(Math.floor(n), 800);
}

function npOptionsFor(title) {
  const opts = {};
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
    const res = await getUserTitles(authorization, "me", { limit, offset });
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
  const titles = await getTitles(authorization);
  console.log(`Titres PSN trouvés/importés: ${titles.length}`);

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
    version: 3,
    source: "psn-github-actions",
    generatedAt: new Date().toISOString(),
    maxGames: MAX_GAMES,
    gamesImported: games.length,
    trophiesImported,
    errors,
    games
  };

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2));
  console.log(`Écrit ${OUT_FILE}`);
  console.log(`${games.length} jeux, ${trophiesImported} trophées, ${errors.length} erreurs`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
