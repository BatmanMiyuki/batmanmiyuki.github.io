/* ------------------------------------------------------------------
   Comptes locaux : inscription, connexion, sauvegarde par compte.
   Les mots de passe ne sont jamais stockés en clair : on garde une
   empreinte SHA-256 salée. Aucune donnée ne quitte l'appareil.
------------------------------------------------------------------ */

export type Account = {
  handle: string;
  name: string;
  salt: string;
  hash: string; // "" => compte invité, sans mot de passe
  psnId?: string;
  psnLinkedAt?: number;
  createdAt: number;
  data: unknown;
};

const KEY = "platina:accounts";
const SESS = "platina:session";
export const GUEST = "invite";

function readAll(): Record<string, Account> {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, Account>;
    return p && typeof p === "object" ? p : {};
  } catch {
    return {};
  }
}

function writeAll(map: Record<string, Account>) {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* quota / mode privé */
  }
}

export function listAccounts(): Account[] {
  return Object.values(readAll()).sort((a, b) => b.createdAt - a.createdAt);
}

export function getAccount(handle: string): Account | undefined {
  return readAll()[handle.toLowerCase()];
}

export function saveAccount(a: Account) {
  const map = readAll();
  map[a.handle.toLowerCase()] = a;
  writeAll(map);
}

export function removeAccount(handle: string) {
  const map = readAll();
  delete map[handle.toLowerCase()];
  writeAll(map);
}

/* ----------------------------------------------------------- session */

export function sessionHandle(): string | null {
  try {
    const v = localStorage.getItem(SESS);
    return v && getAccount(v) ? v : null;
  } catch {
    return null;
  }
}

export function setSession(handle: string | null) {
  try {
    if (handle) localStorage.setItem(SESS, handle);
    else localStorage.removeItem(SESS);
  } catch {
    /* ignore */
  }
}

/* --------------------------------------------------------- empreinte */

async function digest(pw: string, salt: string): Promise<string> {
  const text = `${salt}::${pw}`;
  if (globalThis.crypto?.subtle) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  // repli (contexte non sécurisé) : empreinte simple, non cryptographique
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < text.length; i++) {
    h1 = (h1 ^ text.charCodeAt(i)) * 0x01000193;
    h2 = (h2 + text.charCodeAt(i) * (i + 7)) >>> 0;
  }
  return `f${(h1 >>> 0).toString(16)}${h2.toString(16)}`;
}

function saltFor() {
  const a = new Uint8Array(16);
  const rnd = globalThis.crypto;
  if (rnd && typeof rnd.getRandomValues === "function") rnd.getRandomValues(a);
  else for (let i = 0; i < a.length; i++) a[i] = Math.floor(Math.random() * 256);
  return Array.from(a)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/* ------------------------------------------------------------ règles */

export const HANDLE_RE = /^[A-Za-z0-9_-]{3,24}$/;

export function available(handle: string) {
  return !getAccount(handle);
}

/* ------------------------------------------------------------- APIs */

export async function signUp(
  name: string,
  handle: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const h = handle.trim();
  if (!HANDLE_RE.test(h))
    return { ok: false, error: "L'identifiant doit faire 3 à 24 caractères (lettres, chiffres, - ou _)." };
  if (name.trim().length < 2) return { ok: false, error: "Indique un nom affiché." };
  if (password.length < 4) return { ok: false, error: "Le mot de passe doit faire au moins 4 caractères." };
  if (!available(h)) return { ok: false, error: "Cet identifiant est déjà utilisé." };

  const salt = saltFor();
  const a: Account = {
    handle: h,
    name: name.trim(),
    salt,
    hash: await digest(password, salt),
    createdAt: Date.now(),
    data: null, // rempli par le store au premier enregistrement
  };
  saveAccount(a);
  setSession(h);
  return { ok: true };
}

export async function signIn(
  handle: string,
  password: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const a = getAccount(handle.trim());
  if (!a) return { ok: false, error: "Aucun compte à ce nom." };
  if (!a.hash) {
    setSession(a.handle);
    return { ok: true };
  }
  if ((await digest(password, a.salt)) !== a.hash)
    return { ok: false, error: "Mot de passe incorrect." };
  setSession(a.handle);
  return { ok: true };
}

export async function setPassword(handle: string, current: string, next: string): Promise<{ ok: boolean; error?: string }> {
  const a = getAccount(handle);
  if (!a) return { ok: false, error: "Compte introuvable." };
  if (a.hash && (await digest(current, a.salt)) !== a.hash)
    return { ok: false, error: "Mot de passe actuel incorrect." };
  if (next.length < 4) return { ok: false, error: "Le nouveau mot de passe est trop court." };
  a.salt = saltFor();
  a.hash = await digest(next, a.salt);
  saveAccount(a);
  return { ok: true };
}

export function continueAsGuest() {
  if (!getAccount(GUEST)) {
    saveAccount({
      handle: GUEST,
      name: "Invité",
      salt: "",
      hash: "",
      createdAt: Date.now(),
      data: null,
    });
  }
  setSession(GUEST);
}

export function signOut() {
  setSession(null);
}

export function deleteAccount(handle: string) {
  removeAccount(handle);
  setSession(null);
}
