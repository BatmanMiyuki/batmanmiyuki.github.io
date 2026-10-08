/**
 * Publie le build dans le dossier servi par GitHub Pages.
 *
 * Deux contextes possibles :
 *  - dans le dépôt du site (platina/app/) : le résultat est recopié dans
 *    platina/, à côté des sources, sans toucher à psn-data.json ;
 *  - dans un dépôt Platina autonome : rien à recopier, le workflow
 *    .github/workflows/pages.yml déploie dist/ tel quel.
 *
 * Usage : node scripts/publish.mjs  (ou npm run build)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(here, "..");
const dist = path.join(project, "dist");
const parent = path.resolve(project, "..");

if (!fs.existsSync(path.join(dist, "index.html"))) {
  console.error("dist/index.html introuvable : lance d'abord `vite build`.");
  process.exit(1);
}

// Le dépôt du site héberge le projet dans platina/app/.
const isSiteRepo = path.basename(project) === "app" && path.basename(parent) === "platina";
const target = process.env.PUBLISH_DIR
  ? path.resolve(project, process.env.PUBLISH_DIR)
  : isSiteRepo
    ? parent
    : null;

if (!target) {
  console.log("Build terminé dans dist/ : déploie ce dossier (GitHub Pages, voir GITHUB.md).");
  process.exit(0);
}

let copied = 0;

function copy(from, to) {
  const stat = fs.statSync(from);
  if (stat.isDirectory()) {
    fs.mkdirSync(to, { recursive: true });
    for (const entry of fs.readdirSync(from)) copy(path.join(from, entry), path.join(to, entry));
    return;
  }
  fs.copyFileSync(from, to);
  copied += 1;
}

// Uniquement les fichiers produits par le build : index.html, images/,
// manifest.webmanifest, sw.js, icon.svg.
for (const entry of fs.readdirSync(dist)) {
  copy(path.join(dist, entry), path.join(target, entry));
}

console.log(`${copied} fichiers publiés dans ${path.relative(process.cwd(), target) || "."}/`);
