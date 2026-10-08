import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";
import { viteSingleFile } from "vite-plugin-singlefile";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Dossiers jamais inclus dans l'archive du projet. */
const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage"]);
/** Fichiers binaires : ils sont récupérés depuis le site au moment du ZIP. */
const BINARY = /\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp[34]|zip|pdf)$/i;

/**
 * Fichiers du dépôt du site qui complètent le projet : scripts d'import PSN et
 * workflows de données. Absents si le projet vit seul dans son dépôt.
 */
function listSharedFiles(): Record<string, string> {
  const repo = path.resolve(__dirname, "../..");
  const out: Record<string, string> = {};
  const additions = [
    "scripts/fetch-psn-data.mjs",
    "scripts/fetch-pstat-account.mjs",
    ".github/workflows/update-psn.yml",
    ".github/workflows/update-pstat-accounts.yml",
  ];
  for (const rel of additions) {
    const full = path.join(repo, rel);
    if (fs.existsSync(full)) out[rel] = fs.readFileSync(full, "utf8");
  }
  return out;
}

function listProjectFiles(root: string, dir = root, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith(".") && entry.name !== ".gitignore" && entry.name !== ".github") continue;
    const full = path.join(dir, entry.name);
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      Object.assign(out, listProjectFiles(root, full, rel));
      continue;
    }
    if (BINARY.test(entry.name)) continue;
    out[rel] = fs.readFileSync(full, "utf8");
  }
  return out;
}

/**
 * Expose les sources du projet à `src/lib/project-export.ts` pour que la
 * section « Projet ZIP » de la page puisse reconstituer un projet complet.
 */
function projectFilesPlugin(): Plugin {
  const VIRTUAL = "virtual:project-files";
  const RESOLVED = `\0${VIRTUAL}`;

  return {
    name: "platina-project-files",
    resolveId: (id) => (id === VIRTUAL ? RESOLVED : null),
    load: (id) =>
      id === RESOLVED
        ? `export default ${JSON.stringify({ ...listProjectFiles(__dirname), ...listSharedFiles() })};`
        : null,
  };
}

export default defineConfig({
  // Des URL relatives permettent au même build de fonctionner à /, /platina/ ou /Platina/.
  base: "./",
  plugins: [react(), tailwindcss(), projectFilesPlugin(), viteSingleFile()],
  build: {
    // Le build va dans dist/ ; `npm run build` publie ensuite le résultat
    // dans platina/ via scripts/publish.mjs.
    target: "es2022",
    cssCodeSplit: false,
  },
  server: {
    allowedHosts: [".e2b.app"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
