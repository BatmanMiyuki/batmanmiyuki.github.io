/* ------------------------------------------------------------------
   Archive « Projet ZIP » : reconstitue le projet complet (sources,
   fichiers racine, PWA, images) dans une archive téléchargeable.

   Les fichiers texte sont embarqués au build par le plugin Vite
   `platina-project-files` ; les images sont récupérées depuis le site
   pour ne pas alourdir la page.
------------------------------------------------------------------ */

import { strToU8, zipSync } from "fflate";
import projectFiles from "virtual:project-files";

export type ExportProgress = { percent: number; label: string };
export type ProjectArchive = { file: File; count: number };

/** Images servies à côté de la page, ajoutées dans public/images/ du ZIP. */
const IMAGES = [
  "avatar.jpg",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-512.png",
  "g-ghost.jpg",
  "g-elden.jpg",
  "g-gow.jpg",
  "g-hogwarts.jpg",
  "g-rdr.jpg",
  "g-spider.jpg",
  "g-tlou.jpg",
  "ps5.png",
  "trophy-tile.jpg",
  "argent.png",
  "bronze.png",
  "or.png",
  "platine.png",
];

function abortIfNeeded(signal: AbortSignal) {
  if (signal.aborted) throw new DOMException("Préparation annulée.", "AbortError");
}

/** Prépare l'archive complète du projet, prête à publier. */
export async function createProjectArchive(
  signal: AbortSignal,
  onProgress: (update: ExportProgress) => void,
): Promise<ProjectArchive> {
  const files = Object.entries(projectFiles);
  const total = files.length + IMAGES.length;
  const entries: Record<string, Uint8Array> = {};
  let done = 0;

  const step = (label: string) => {
    done += 1;
    onProgress({
      percent: Math.min(96, Math.round((done / Math.max(total, 1)) * 96)),
      label,
    });
  };

  for (const [path, content] of files) {
    abortIfNeeded(signal);
    entries[`platina/${path}`] = strToU8(content);
    step(`Ajout de ${path}`);
  }

  for (const image of IMAGES) {
    abortIfNeeded(signal);
    const url = new URL(`images/${image}`, document.baseURI);
    const response = await fetch(url, { signal, cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Fichier public inaccessible : images/${image} (HTTP ${response.status}).`);
    }
    entries[`platina/public/images/${image}`] = new Uint8Array(await response.arrayBuffer());
    step(`Ajout de public/images/${image}`);
  }

  abortIfNeeded(signal);
  onProgress({ percent: 98, label: "Compression de l'archive…" });
  const zipped = zipSync(entries, { level: 6 });
  abortIfNeeded(signal);

  const bytes = zipped.buffer.slice(
    zipped.byteOffset,
    zipped.byteOffset + zipped.byteLength,
  ) as ArrayBuffer;
  const date = new Date().toISOString().slice(0, 10);
  const file = new File([bytes], `platina-source-${date}.zip`, { type: "application/zip" });

  onProgress({ percent: 100, label: "Archive prête." });
  return { file, count: Object.keys(entries).length };
}
