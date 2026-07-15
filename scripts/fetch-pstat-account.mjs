import fs from "node:fs";
import path from "node:path";
import {
  exchangeNpssoForAccessCode,
  exchangeAccessCodeForAuthTokens,
  getUserPlayedGames,
  getProfileFromAccountId,
  getPurchasedGames
} from "psn-api";

const NPSSO = cleanNpsso(process.env.NPSSO || "");
const ACCOUNT_KEY = String(process.env.PSTAT_ACCOUNT_KEY || "account").trim().toLowerCase();
const FALLBACK_ONLINE_ID = String(process.env.PSTAT_FALLBACK_ONLINE_ID || ACCOUNT_KEY).trim();
const OUT_FILE = path.join(process.cwd(), "Platina", "pstat-accounts.json");
const LOCALE = "fr-FR";
const FR_HEADERS = { "Accept-Language": LOCALE };

function cleanNpsso(value) {
  return String(value || "")
    .trim()
    .replace(/^\{"npsso":"/i, "")
    .replace(/"\}$/i, "")
    .replace(/^"|"$/g, "")
    .trim();
}

async function authorize() {
  if (!NPSSO || NPSSO.length < 20) throw new Error(`NPSSO absent pour le compte ${ACCOUNT_KEY}.`);
  const code = await exchangeNpssoForAccessCode(NPSSO);
  return exchangeAccessCodeForAuthTokens(code);
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

function platformFor(title) {
  const category = String(title?.category || "").toLowerCase();
  if (category.includes("ps5")) return "PS5";
  if (category.includes("ps4")) return "PS4";
  if (category.includes("ps3")) return "PS3";
  if (category.includes("vita")) return "PS Vita";
  if (category.includes("pc")) return "PC";
  return "Autre";
}

function bestCover(title) {
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
    coverUrl: bestCover(title),
    platform: platformFor(title),
    category: title?.category || "unknown",
    service: title?.service || "unknown",
    playCount: Number(title?.playCount || 0),
    playDuration: title?.playDuration || "PT0S",
    durationSeconds,
    firstPlayedDateTime: title?.firstPlayedDateTime || null,
    lastPlayedDateTime: title?.lastPlayedDateTime || null
  };
}

async function fetchPlayedGames(authorization) {
  const all = [];
  const limit = 200;
  let offset = 0;
  let total = null;
  while (true) {
    const response = await getUserPlayedGames(authorization, "me", { limit, offset });
    const titles = Array.isArray(response?.titles) ? response.titles : [];
    all.push(...titles);
    total = Number.isFinite(Number(response?.totalItemCount)) ? Number(response.totalItemCount) : total;
    if (!titles.length || (total !== null && all.length >= total)) break;
    if (total === null && titles.length < limit) break;
    offset += titles.length;
    if (offset > 3000) break;
  }
  const games = all.map(normalizePlayedTitle);
  return {
    totalTitles: total ?? games.length,
    totalDurationSeconds: games.reduce((sum, game) => sum + game.durationSeconds, 0),
    totalPlayCount: games.reduce((sum, game) => sum + game.playCount, 0),
    games
  };
}

async function fetchLibrary(authorization) {
  const raw = [];
  const size = 100;
  let start = 0;
  while (true) {
    const response = await getPurchasedGames(authorization, { size, start });
    const games = Array.isArray(response?.data?.purchasedTitlesRetrieve?.games)
      ? response.data.purchasedTitlesRetrieve.games
      : [];
    raw.push(...games);
    if (!games.length || games.length < size) break;
    start += games.length;
    if (start > 3000) break;
  }
  const unique = new Map();
  raw.forEach(game => {
    const key = game?.titleId || game?.conceptId || game?.entitlementId;
    if (key && !unique.has(key)) unique.set(key, game);
  });
  const games = Array.from(unique.values());
  return {
    total: games.length,
    owned: games.filter(game => game?.membership === "NONE").length,
    psPlus: games.filter(game => game?.membership === "PS_PLUS").length
  };
}

function normalizeProfile(profile) {
  const avatars = Array.isArray(profile?.avatars) ? profile.avatars : [];
  const avatar = avatars.find(item => String(item?.size || "").toLowerCase().includes("xl")) || avatars.at(-1) || avatars[0];
  return {
    onlineId: profile?.onlineId || FALLBACK_ONLINE_ID,
    avatarUrl: avatar?.url || "",
    isPlus: Boolean(profile?.isPlus)
  };
}

function readManifest() {
  try {
    const parsed = JSON.parse(fs.readFileSync(OUT_FILE, "utf8"));
    return parsed && Array.isArray(parsed.accounts) ? parsed : { version: 1, accounts: [] };
  } catch {
    return { version: 1, accounts: [] };
  }
}

async function main() {
  const authorization = await authorize();
  const [profileResult, playStatsResult, libraryResult] = await Promise.allSettled([
    getProfileFromAccountId(authorization, "me", { headerOverrides: FR_HEADERS }),
    fetchPlayedGames(authorization),
    fetchLibrary(authorization)
  ]);

  if (playStatsResult.status === "rejected") throw playStatsResult.reason;
  const warnings = [];
  const profile = profileResult.status === "fulfilled"
    ? normalizeProfile(profileResult.value)
    : (warnings.push({ scope: "profile", message: profileResult.reason?.message || "Profil indisponible" }), { onlineId: FALLBACK_ONLINE_ID, avatarUrl: "", isPlus: false });
  const library = libraryResult.status === "fulfilled"
    ? libraryResult.value
    : (warnings.push({ scope: "library", message: libraryResult.reason?.message || "Bibliothèque indisponible" }), null);

  const account = {
    key: ACCOUNT_KEY,
    label: profile.onlineId || FALLBACK_ONLINE_ID,
    version: 1,
    locale: LOCALE,
    generatedAt: new Date().toISOString(),
    profile,
    playStats: playStatsResult.value,
    library,
    warnings,
    errors: []
  };

  const manifest = readManifest();
  manifest.version = 1;
  manifest.generatedAt = new Date().toISOString();
  manifest.accounts = manifest.accounts.filter(item => item?.key !== ACCOUNT_KEY);
  manifest.accounts.push(account);
  manifest.accounts.sort((a, b) => (a.key === "batman" ? -1 : b.key === "batman" ? 1 : String(a.label).localeCompare(String(b.label), "fr")));

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2));
  console.log(`PStat ${profile.onlineId}: ${account.playStats.totalTitles} jeux · ${Math.round(account.playStats.totalDurationSeconds / 3600)} h`);
  console.log(`Écrit ${OUT_FILE}`);
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
