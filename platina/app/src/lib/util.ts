import type { Currency, Metal } from "./store";

export function timeAgo(ts: number, now = Date.now()) {
  const s = Math.max(0, (now - ts) / 1000);
  if (s < 60) return "À l'instant";
  const m = Math.floor(s / 60);
  if (m < 60) return `Il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Il y a ${h} ${h > 1 ? "heures" : "heure"}`;
  const d = Math.floor(h / 24);
  if (d < 30) return `Il y a ${d} ${d > 1 ? "jours" : "jour"}`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `Il y a ${mo} mois`;
  const y = Math.floor(mo / 12);
  return `Il y a ${y} ${y > 1 ? "ans" : "an"}`;
}

export const fmtDate = (ts: number) =>
  new Date(ts).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

export const fmtNum = (n: number, digits = 0) =>
  n
    .toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: digits })
    .replace(/[\u202f\u00a0]/g, "\u00a0");

export const CURRENCIES: Record<Currency, { symbol: string; rate: number; label: string }> = {
  EUR: { symbol: "€", rate: 1, label: "Euro (€)" },
  USD: { symbol: "$", rate: 1.08, label: "Dollar US ($)" },
  GBP: { symbol: "£", rate: 0.85, label: "Livre sterling (£)" },
};

export function fmtMoney(eur: number, cur: Currency) {
  const c = CURRENCIES[cur];
  const v = (eur * c.rate).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  const [int, dec] = v.replace(/[\u202f\u00a0]/g, "\u00a0").split(",");
  return { symbol: c.symbol, int, dec, text: `${c.symbol}${int},${dec}` };
}

export function tintFor(metal?: Metal) {
  if (metal === "gold") return "hue-rotate(-152deg) saturate(1.35) brightness(0.95)";
  if (metal === "bronze") return "hue-rotate(-118deg) saturate(0.95) brightness(1.05)";
  if (metal === "silver") return "grayscale(1) brightness(1.1)";
  return undefined;
}

export function hueOf(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

export function initials(s: string) {
  return s
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
