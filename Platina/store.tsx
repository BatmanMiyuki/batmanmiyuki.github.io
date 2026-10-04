import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { getAccount, saveAccount, sessionHandle, signOut as authSignOut } from "./auth";

/* ------------------------------------------------------------------ types */

export type Metal = "plat" | "gold" | "silver" | "bronze";
export const METALS: Metal[] = ["plat", "gold", "silver", "bronze"];
export const METAL_LABEL: Record<Metal, string> = {
  plat: "Platine",
  gold: "Or",
  silver: "Argent",
  bronze: "Bronze",
};
export const XP: Record<Metal, number> = { plat: 40, gold: 20, silver: 8, bronze: 3 };

export type Platform = "PS5" | "PS4";
export type Counts = [number, number, number, number];

export type Game = {
  id: string;
  title: string;
  platform: Platform;
  cover?: string;
  /** nombre de trophées que le jeu contient */
  total: number;
  counts: Counts;
  platDate?: number;
};

export type Activity = {
  id: string;
  kind: "trophy" | "purchase" | "session";
  title: string;
  sub: string;
  ts: number;
  metal?: Metal;
  amount?: number;
  hours?: number;
};

export type Accent = "blue" | "violet" | "green" | "pink";
export type Theme = "dark" | "midnight" | "amoled";
export type Currency = "EUR" | "USD" | "GBP";

export type Psn = {
  id: string | null;
  accountId: string | null;
  linkedAt: number | null;
  autoImport: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  accessExp: number | null;
  refreshExp: number | null;
};

export type PsnImport = {
  onlineId: string;
  accountId: string;
  level: number;
  progress: number;
  account: Counts;
  games: Game[];
  totalHours: number;
  sessions: number;
  activities: Activity[];
  tokens: {
    accessToken: string;
    refreshToken: string;
    accessExp: number;
    refreshExp: number;
  };
};

export type Settings = {
  notifications: { trophies: boolean; platinum: boolean; reminders: boolean; weekly: boolean };
  privacy: { publicProfile: boolean; showPlaytime: boolean };
  linked: { psn: boolean; twitch: boolean; discord: boolean };
  theme: Theme;
  accent: Accent;
  currency: Currency;
};

export type State = {
  v: 2;
  loggedIn: boolean;
  unread: boolean;
  profile: { name: string; handle: string };
  psn: Psn;
  games: Game[];
  activities: Activity[];
  xp: number;
  account: Counts;
  extraTotal: number;
  totalHours: number;
  monthHours: number;
  sessions: number;
  days: number[];
  prevWeeks: number[];
  prevMonths: number[];
  spend: { total: number; year: number; transactions: number };
  plus: { next: number | null; auto: boolean; plan: string | null };
  lastSync: number | null;
  settings: Settings;
};

/* ------------------------------------------------------------------ zéro */

export function blank(profile?: { name: string; handle: string }): State {
  return {
    v: 2,
    loggedIn: true,
    unread: false,
    profile: profile ?? { name: "Joueur", handle: "joueur" },
    psn: {
      id: null,
      accountId: null,
      linkedAt: null,
      autoImport: true,
      accessToken: null,
      refreshToken: null,
      accessExp: null,
      refreshExp: null,
    },
    games: [],
    activities: [],
    xp: 0,
    account: [0, 0, 0, 0],
    extraTotal: 0,
    totalHours: 0,
    monthHours: 0,
    sessions: 0,
    days: [0, 0, 0, 0, 0, 0, 0],
    prevWeeks: [0, 0, 0],
    prevMonths: [0, 0, 0, 0, 0],
    spend: { total: 0, year: 0, transactions: 0 },
    plus: { next: null, auto: false, plan: null },
    lastSync: null,
    settings: {
      notifications: { trophies: true, platinum: true, reminders: false, weekly: true },
      privacy: { publicProfile: true, showPlaytime: true },
      linked: { psn: false, twitch: false, discord: false },
      theme: "dark",
      accent: "blue",
      currency: "EUR",
    },
  };
}

/* ------------------------------------------------------------- calculs */

export const earnedOf = (g: Game) => g.counts.reduce((a, b) => a + b, 0);
export const progressOf = (g: Game) =>
  g.total ? Math.min(100, Math.round((earnedOf(g) / g.total) * 100)) : 0;

export const totalTrophies = (s: State) =>
  s.games.reduce((a, g) => a + g.total, 0) + s.extraTotal;
export const earnedTrophies = (s: State) => s.games.reduce((a, g) => a + earnedOf(g), 0);
export const levelOf = (s: State) => Math.floor(s.xp / 100) + 1;
export const levelPct = (s: State) => s.xp % 100;
export const globalPct = (s: State) => {
  const t = totalTrophies(s);
  return t ? Math.min(100, Math.round((earnedTrophies(s) / t) * 100)) : 0;
};

/* ------------------------------------------------------- aide au remplissage */

const TITLES: Record<Metal, string[]> = {
  bronze: ["Premiers pas", "Collectionneur", "Explorateur", "Persévérant"],
  silver: ["Chasseur de primes", "Stratège", "Maître de l'ombre"],
  gold: ["Légende vivante", "Sans faute"],
  plat: ["Platine"],
};

const todayIdx = () => (new Date().getDay() + 6) % 7;
const uid = () => Math.random().toString(36).slice(2, 10);

/* -------------------------------------------------------------- reducer */

export type Action =
  | { type: "sessionStart"; name: string; handle: string; psnId?: string }
  | { type: "restore"; state: State }
  | { type: "logout" }
  | { type: "readNotifs" }
  | { type: "sync" }
  | { type: "reset" }
  | { type: "profile"; name: string; handle: string }
  | { type: "psnLink"; id: string }
  | { type: "psnUnlink" }
  | { type: "psnAuto"; auto: boolean }
  | { type: "importPsn"; payload: PsnImport }
  | { type: "unlock"; gameId: string; metal: Metal }
  | { type: "addGame"; title: string; platform: Platform; total: number }
  | { type: "editGame"; gameId: string; title: string; total: number }
  | { type: "removeGame"; gameId: string }
  | { type: "purchase"; title: string; amount: number }
  | { type: "session"; gameId: string; hours: number }
  | { type: "settings"; fn: (s: Settings) => Settings }
  | { type: "plusSet"; plan: string | null; next: number | null; auto: boolean };

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case "sessionStart":
      return { ...blank({ name: a.name, handle: a.handle }), psn: { ...s.psn, id: a.psnId ?? null, linkedAt: a.psnId ? Date.now() : null } };
    case "restore":
      return { ...a.state, loggedIn: true };
    case "logout":
      return { ...s, loggedIn: false };
    case "readNotifs":
      return { ...s, unread: false };
    case "sync":
      return { ...s, lastSync: Date.now() };
    case "reset":
      return { ...blank({ name: s.profile.name, handle: s.profile.handle }) };
    case "profile":
      return { ...s, profile: { name: a.name, handle: a.handle } };
    case "psnLink":
      return {
        ...s,
        psn: { ...s.psn, id: a.id, linkedAt: s.psn.linkedAt ?? Date.now() },
        settings: { ...s.settings, linked: { ...s.settings.linked, psn: true } },
        lastSync: Date.now(),
      };
    case "psnUnlink":
      return {
        ...s,
        psn: {
          ...s.psn,
          id: null,
          accountId: null,
          linkedAt: null,
          accessToken: null,
          refreshToken: null,
          accessExp: null,
          refreshExp: null,
        },
        settings: { ...s.settings, linked: { ...s.settings.linked, psn: false } },
      };
    case "importPsn": {
      const p = a.payload;
      return {
        ...s,
        psn: {
          ...s.psn,
          id: p.onlineId,
          accountId: p.accountId,
          linkedAt: s.psn.linkedAt ?? Date.now(),
          accessToken: p.tokens.accessToken,
          refreshToken: p.tokens.refreshToken,
          accessExp: p.tokens.accessExp,
          refreshExp: p.tokens.refreshExp,
        },
        settings: { ...s.settings, linked: { ...s.settings.linked, psn: true } },
        games: p.games,
        extraTotal: 0,
        account: p.account,
        xp: Math.max(0, (p.level - 1) * 100 + p.progress),
        totalHours: Math.round(p.totalHours * 10) / 10,
        sessions: p.sessions || s.sessions,
        activities: [...p.activities, ...s.activities].slice(0, 80),
        lastSync: Date.now(),
        unread: true,
      };
    }
    case "psnAuto":
      return { ...s, psn: { ...s.psn, autoImport: a.auto } };
    case "plusSet":
      return { ...s, plus: { plan: a.plan, next: a.next, auto: a.auto } };
    case "settings":
      return { ...s, settings: a.fn(s.settings) };
    case "unlock": {
      const g = s.games.find((x) => x.id === a.gameId);
      if (!g) return s;
      const earned = earnedOf(g);
      const hasPlat = g.counts[0] > 0;
      if (hasPlat) return s;
      if (a.metal === "plat" && earned < g.total - 1) return s;
      if (a.metal !== "plat" && earned >= g.total - 1) return s;

      const i = METALS.indexOf(a.metal);
      const counts = [...g.counts] as Counts;
      counts[i] += 1;
      const now = Date.now();
      const account = [...s.account] as Counts;
      account[i] += 1;
      const list = TITLES[a.metal];
      const act: Activity = {
        id: uid(),
        kind: "trophy",
        title: list[earned % list.length],
        sub: g.title,
        ts: now,
        metal: a.metal,
      };
      return {
        ...s,
        games: s.games.map((x) =>
          x.id === g.id ? { ...x, counts, platDate: a.metal === "plat" ? now : x.platDate } : x,
        ),
        account,
        xp: s.xp + XP[a.metal],
        activities: [act, ...s.activities],
        unread: true,
      };
    }
    case "addGame": {
      const g: Game = {
        id: uid(),
        title: a.title,
        platform: a.platform,
        total: a.total,
        counts: [0, 0, 0, 0],
      };
      return { ...s, games: [g, ...s.games], extraTotal: s.extraTotal + a.total };
    }
    case "editGame": {
      const g = s.games.find((x) => x.id === a.gameId);
      if (!g) return s;
      const delta = a.total - g.total;
      const earned = earnedOf(g);
      const safe = Math.max(earned + (g.counts[0] > 0 ? 1 : 0), a.total);
      return {
        ...s,
        extraTotal: Math.max(0, s.extraTotal + delta),
        games: s.games.map((x) => (x.id === g.id ? { ...x, title: a.title, total: safe } : x)),
      };
    }
    case "removeGame": {
      const g = s.games.find((x) => x.id === a.gameId);
      if (!g) return s;
      return {
        ...s,
        games: s.games.filter((x) => x.id !== a.gameId),
        extraTotal: Math.max(0, s.extraTotal - g.total),
        activities: s.activities.filter((x) => !(x.kind === "trophy" && x.sub === g.title)),
      };
    }
    case "purchase": {
      const act: Activity = {
        id: uid(),
        kind: "purchase",
        title: a.title,
        sub: "Achat",
        ts: Date.now(),
        amount: a.amount,
      };
      return {
        ...s,
        activities: [act, ...s.activities],
        spend: {
          total: s.spend.total + a.amount,
          year: s.spend.year + a.amount,
          transactions: s.spend.transactions + 1,
        },
      };
    }
    case "session": {
      const g = s.games.find((x) => x.id === a.gameId);
      const days = [...s.days];
      days[todayIdx()] = Math.round((days[todayIdx()] + a.hours) * 10) / 10;
      const act: Activity = {
        id: uid(),
        kind: "session",
        title: g ? g.title : "Session de jeu",
        sub: "Session de jeu",
        ts: Date.now(),
        hours: a.hours,
      };
      return {
        ...s,
        days,
        totalHours: Math.round((s.totalHours + a.hours) * 10) / 10,
        monthHours: Math.round((s.monthHours + a.hours) * 10) / 10,
        sessions: s.sessions + 1,
        activities: [act, ...s.activities],
      };
    }
    default:
      return s;
  }
}

/* ------------------------------------------------------------ persistance */

const KEY = "platina:data:v2";

function migrate(raw: unknown): State | null {
  if (!raw || typeof raw !== "object") return null;
  const p = raw as Partial<State>;
  if (p.v !== 2 || !Array.isArray(p.games)) return null;
  const base = blank();
  return {
    ...base,
    ...p,
    account: Array.isArray(p.account) && p.account.length === 4 ? p.account : base.account,
    days: Array.isArray(p.days) && p.days.length === 7 ? p.days : base.days,
    prevWeeks: Array.isArray(p.prevWeeks) ? p.prevWeeks : base.prevWeeks,
    prevMonths: Array.isArray(p.prevMonths) ? p.prevMonths : base.prevMonths,
    settings: {
      ...base.settings,
      ...p.settings,
      notifications: { ...base.settings.notifications, ...p.settings?.notifications },
      privacy: { ...base.settings.privacy, ...p.settings?.privacy },
      linked: { ...base.settings.linked, ...p.settings?.linked },
    },
    psn: { ...base.psn, ...(p.psn ?? {}) },
    plus: { ...base.plus, ...p.plus },
  } as State;
}

/** Données de démarrage : compte connecté => sa sauvegarde, sinon écran de connexion. */
function load(): State {
  const h = sessionHandle();
  if (!h) return { ...blank(), loggedIn: false };
  const acc = getAccount(h);
  if (!acc) {
    authSignOut();
    return { ...blank(), loggedIn: false };
  }
  const restored = migrate(acc.data);
  const base = restored ?? blank({ name: acc.name, handle: acc.handle });
  return {
    ...base,
    profile: { name: acc.name, handle: acc.handle },
    psn: { ...base.psn, id: acc.psnId ?? base.psn.id, linkedAt: acc.psnLinkedAt ?? base.psn.linkedAt },
    loggedIn: true,
  };
}

export function normalizeBackup(raw: unknown): State | null {
  return migrate(raw);
}

const Ctx = createContext<{ state: State; dispatch: Dispatch<Action> } | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load);

  // Sauvegarde automatique dans le compte courant.
  useEffect(() => {
    const h = sessionHandle();
    if (!h || !state.loggedIn) return;
    const acc = getAccount(h);
    if (!acc) return;
    saveAccount({
      ...acc,
      name: state.profile.name,
      handle: state.profile.handle,
      data: state,
      psnId: state.psn.id ?? undefined,
      psnLinkedAt: state.psn.linkedAt ?? undefined,
    });
  }, [state]);

  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used inside StoreProvider");
  return c;
}

/** Clé de stockage utilisée par l'export / l'import de sauvegarde. */
export const DATA_KEY = KEY;
