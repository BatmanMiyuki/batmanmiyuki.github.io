/**
 * Récupère les sources du projet Platina embarquées dans la page construite
 * (section « Projet ZIP ») et les écrit sur le disque, dans l'arborescence
 * d'un projet Vite standard (src/, public/, fichiers racine).
 *
 * La page construite déclare les fichiers dans une chaîne de littéraux :
 *   index.html, package.json, package-lock.json, tsconfig.json, vite.config.ts,
 *   README.md, GITHUB.md, .gitignore, .github/workflows/pages.yml,
 *   public/icon.svg, public/manifest.webmanifest, public/sw.js, puis src/**.
 * On parcourt donc les candidats dans l'ordre, en validant le contenu de
 * chaque fichier (le bundle réutilise les mêmes noms courts ailleurs).
 *
 * Sert à récupérer une version antérieure (page autonome). Les sources à jour
 * sont versionnées dans platina/app/ : ce script ne remplace pas le dépôt.
 *
 * Usage : node scripts/extract-platina-source.mjs <index.html> <dossier-sortie>
 */
import fs from "node:fs";
import path from "node:path";

const [, , indexPath, outDir] = process.argv;
if (!indexPath || !outDir) {
  console.error("Usage : node scripts/extract-platina-source.mjs <index.html> <dossier-sortie>");
  process.exit(1);
}

const html = fs.readFileSync(indexPath, "utf8");
const script = html.match(/<script type="module"[^>]*>([\s\S]*?)<\/script>/);
if (!script) throw new Error("Script module introuvable.");
const code = script[1];

const srcMap = code.match(/k2=Object\.assign\(\{([\s\S]*?)\}\)/);
if (!srcMap) {
  throw new Error(
    "Cette page n'embarque pas la table de sources (format des builds Platina 1.0 " +
      "antérieurs au passage à Vite dans platina/app/). Rien à extraire.",
  );
}
const rootMap = code.match(/Xf=\{([\s\S]*?)\},Jf=\[/);
if (!rootMap) throw new Error("Table des fichiers racine (Xf) introuvable.");

const srcPos = srcMap.index;
void srcPos;
const srcEnd = srcPos + srcMap[0].length;

const table = (m) =>
  [...m[1].matchAll(/"((?:[^"\\]|\\.)*)":([A-Za-z0-9_$]+)/g)].map((e) => [
    JSON.parse(`"${e[1]}"`),
    e[2],
  ]);

const srcFiles = table(srcMap);
const rootFiles = table(rootMap);

/** `../App.tsx` → `src/App.tsx`, `./store.tsx` → `src/lib/store.tsx`. */
function mapSource(rel) {
  if (rel.startsWith("../")) return `src/${rel.slice(3)}`;
  if (rel.startsWith("./")) return `src/lib/${rel.slice(2)}`;
  return `src/${rel}`;
}

/** Retire les commentaires d'un JSONC sans toucher aux chaînes (ex. "@/*"). */
function stripJsonComments(text) {
  let out = "";
  let inString = false;
  for (let i = 0; i < text.length; i += 1) {
    const ch = text[i];
    const next = text[i + 1];
    if (inString) {
      out += ch;
      if (ch === "\\") {
        out += next ?? "";
        i += 1;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }
    if (ch === '"') {
      inString = true;
      out += ch;
      continue;
    }
    if (ch === "/" && next === "/") {
      while (i < text.length && text[i] !== "\n") i += 1;
      out += "\n";
      continue;
    }
    if (ch === "/" && next === "*") {
      i += 2;
      while (i < text.length && !(text[i] === "*" && text[i + 1] === "/")) i += 1;
      i += 1;
      continue;
    }
    out += ch;
  }
  return out;
}

const jsonHas = (...keys) => (text) => {
  try {
    const parsed = JSON.parse(stripJsonComments(text));
    return keys.every((key) => key in parsed);
  } catch {
    return false;
  }
};

/** Contenu attendu pour chaque fichier racine, dans l'ordre de déclaration. */
const ROOT_SPECS = [
  { rel: "index.html", id: "m2", test: (t) => /<!doctype html/i.test(t) && t.includes("<div id=\"root\">") },
  { rel: "package.json", id: "f2", test: jsonHas("dependencies", "devDependencies") },
  { rel: "package-lock.json", id: "x2", test: jsonHas("lockfileVersion") },
  { rel: "tsconfig.json", id: "h2", test: jsonHas("compilerOptions") },
  { rel: "vite.config.ts", id: "g2", test: (t) => t.includes("defineConfig") },
  { rel: "README.md", id: "b2", test: (t) => t.startsWith("# ") && t.length > 400 },
  { rel: "GITHUB.md", id: "v2", test: (t) => t.startsWith("# ") && t.length > 400 },
  { rel: ".gitignore", id: "y2", test: (t) => t.startsWith("#") && t.includes("node_modules") },
  {
    rel: ".github/workflows/pages.yml",
    id: "w2",
    test: (t) => t.includes("runs-on") && t.includes("actions/"),
  },
  { rel: "public/icon.svg", id: "N2", test: (t) => t.includes("<svg") && t.includes("</svg>") },
  { rel: "public/manifest.webmanifest", id: "j2", test: jsonHas("icons") },
  { rel: "public/sw.js", id: "S2", test: (t) => t.includes("addEventListener") },
];

const codeFileTest = (rel) => (text) => {
  if (!text) return false;
  if (rel.endsWith(".css")) return text.includes("{") && text.includes("}");
  if (rel.endsWith(".d.ts")) return text.includes("reference") || text.includes("interface");
  return /(^|\n)\s*(import|export)\b/.test(text);
};

/** Collecte tous les candidats `nom=` + littéral, avec leur étendue. */
function candidates(name) {
  const re = new RegExp(`(?:^|[,;{}(\\s])${name}=([\`"'])`, "g");
  const out = [];
  let m;
  while ((m = re.exec(code)) !== null) {
    const quote = m[1];
    const start = m.index;
    let i = re.lastIndex;
    let raw = "";
    let closed = false;
    for (; i < code.length; i += 1) {
      const ch = code[i];
      if (ch === "\\") {
        raw += ch + code[i + 1];
        i += 1;
        continue;
      }
      if (ch === quote) {
        closed = true;
        break;
      }
      if (quote === "`" && ch === "$" && code[i + 1] === "{") break;
      raw += ch;
    }
    if (closed) {
      // Le moteur JS fait le dé-échappement exact de la source.
      out.push({ name, start, end: i, value: new Function(`return ${quote}${raw}${quote};`)() });
    }
  }
  return out;
}

/** Parcourt les candidats dans l'ordre du code et retient le premier valide. */
function readChain(specs, from) {
  const pool = [];
  for (const spec of specs) {
    for (const item of candidates(spec.id)) {
      if (item.start >= from && item.end <= code.length) pool.push({ ...item, spec });
    }
  }
  pool.sort((a, b) => a.start - b.start);

  const values = new Map();
  const rejected = new Map();
  let cursor = from;
  for (const item of pool) {
    if (values.has(item.spec.id)) continue;
    if (item.start < cursor) {
      rejected.set(item.spec.id, `contenu imbriqué (position ${item.start} < curseur ${cursor})`);
      continue;
    }
    if (!item.spec.test(item.value)) {
      rejected.set(item.spec.id, `contenu inattendu : ${JSON.stringify(item.value.slice(0, 40))}`);
      continue;
    }
    values.set(item.spec.id, item.value);
    cursor = item.end + 1;
  }
  const missing = specs.filter((s) => !values.has(s.id));
  if (missing.length) {
    const detail = missing
      .map((s) => `${s.rel} [${s.id}] : ${rejected.get(s.id) ?? "aucun candidat"}`)
      .join("\n  ");
    throw new Error(`Fichiers non récupérés :\n  ${detail}`);
  }
  return values;
}

const srcSpecs = srcFiles.map(([rel, id]) => {
  const target = mapSource(rel);
  const isCode = codeFileTest(target);
  return { rel: target, id, test: (text) => text.length > 30 && isCode(text) };
});

// Les littéraux sont déclarés dans une seule chaîne : sources puis fichiers
// racine. On les parcourt dans l'ordre du code.
const allValues = readChain([...srcSpecs, ...ROOT_SPECS], 0);
const rootValues = new Map(ROOT_SPECS.map((s) => [s.id, allValues.get(s.id)]));
const srcValues = new Map(srcSpecs.map((s) => [s.id, allValues.get(s.id)]));

const written = [];
const write = (rel, content) => {
  const target = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  written.push(rel);
};

for (const spec of ROOT_SPECS) write(spec.rel, rootValues.get(spec.id));
for (const spec of srcSpecs) write(spec.rel, srcValues.get(spec.id));

const images = JSON.parse(code.match(/Jf=\[([\s\S]*?)\]/)[0].replace(/^Jf=/, ""));

console.log(`${written.length} fichiers écrits dans ${outDir}`);
console.log(`${images.length} images attendues dans public/images/ :`);
console.log(images.join(", "));
