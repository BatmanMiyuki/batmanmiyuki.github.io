import { useEffect, useRef, useState } from "react";
import { btnGhost, btnPrimary } from "./controls";
import { CheckIcon, DownloadIcon, RefreshIcon } from "../lib/icons2";
import type { ExportProgress, ProjectArchive } from "../lib/project-export";

type ReadyArchive = ProjectArchive & { url: string };

function sizeLabel(bytes: number) {
  const mb = bytes / 1024 / 1024;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(mb)} Mo`;
}

export function ProjectExport() {
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>({ percent: 0, label: "" });
  const [archive, setArchive] = useState<ReadyArchive | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const downloadUrl = useRef<string | null>(null);

  useEffect(() => () => {
    controller.current?.abort();
    controller.current = null;
    if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
  }, []);

  const prepare = async () => {
    if (busy) return;
    const current = new AbortController();
    controller.current = current;
    setBusy(true);
    setError(null);
    setProgress({ percent: 1, label: "Pr\u00e9paration du projet" });

    try {
      const { createProjectArchive } = await import("../lib/project-export");
      if (current.signal.aborted) return;
      const result = await createProjectArchive(current.signal, (update) => {
        if (!current.signal.aborted) setProgress(update);
      });
      if (current.signal.aborted) return;
      if (downloadUrl.current) URL.revokeObjectURL(downloadUrl.current);
      const url = URL.createObjectURL(result.file);
      downloadUrl.current = url;
      setArchive({ ...result, url });
    } catch (e) {
      if (!current.signal.aborted) {
        setError(e instanceof Error ? e.message : "Impossible de pr\u00e9parer le ZIP.");
        current.abort();
      }
    } finally {
      if (controller.current === current) {
        controller.current = null;
        setBusy(false);
      }
    }
  };

  const cancel = () => {
    controller.current?.abort();
    controller.current = null;
    setBusy(false);
    setProgress({ percent: 0, label: "" });
  };

  const share = async () => {
    if (!archive) return;
    try {
      await navigator.share({ files: [archive.file], title: "Projet Platina" });
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError")) {
        setError("Le partage n'est pas disponible. Utilise le bouton T\u00e9l\u00e9charger.");
      }
    }
  };

  let canShare = false;
  if (archive && typeof navigator !== "undefined" && navigator.canShare) {
    try {
      canShare = navigator.canShare({ files: [archive.file] });
    } catch {
      canShare = false;
    }
  }

  return (
    <div className="w-full space-y-3 text-left">
      <p className="text-[13px] leading-relaxed text-mut-2">
        Code React, CSS, images, fichiers PWA et d&eacute;ploiement GitHub Pages.
        L'archive ne contient ni comptes, ni jetons personnels, ni <code>node_modules</code>.
      </p>

      {!archive && (
        <button type="button" className={btnPrimary} disabled={busy} onClick={() => void prepare()}>
          {busy ? (
            <RefreshIcon className="h-[17px] w-[17px] animate-spin motion-reduce:animate-none" />
          ) : (
            <DownloadIcon className="h-[17px] w-[17px]" />
          )}
          {busy ? "Pr\u00e9paration en cours..." : error ? "R\u00e9essayer" : "Pr\u00e9parer le projet en ZIP"}
        </button>
      )}

      {busy && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-[11.5px] text-mut-2">
            <span role="status">{progress.label}</span>
            <span className="tnum shrink-0">{progress.percent}%</span>
          </div>
          <div
            role="progressbar"
            aria-label={"Pr\u00e9paration de l'archive"}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={progress.percent}
            className="h-[5px] overflow-hidden rounded-full bg-white/10"
          >
            <div
              className="h-full rounded-full bg-brand-2 transition-[width] duration-300 motion-reduce:transition-none"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <button type="button" onClick={cancel} className="text-[12px] text-mut-2 hover:text-white">
            Annuler
          </button>
        </div>
      )}

      {archive && (
        <div className="screen-in space-y-3">
          <p role="status" className="flex items-center gap-2 text-[12.5px] text-[#3ddc97]">
            <CheckIcon className="h-[16px] w-[16px] shrink-0" />
            {archive.count} fichiers v&eacute;rifi&eacute;s &middot; {sizeLabel(archive.file.size)}
          </p>
          <a className={btnPrimary} href={archive.url} download={archive.file.name}>
            <DownloadIcon className="h-[17px] w-[17px]" />
            T&eacute;l&eacute;charger le ZIP complet
          </a>
          {canShare && (
            <button type="button" className={btnGhost} onClick={() => void share()}>
              Partager ou enregistrer dans Fichiers
            </button>
          )}
          <p className="text-[11.5px] leading-relaxed text-mut-2">
            Clique sur T&eacute;l&eacute;charger pour enregistrer le fichier. Si l'aper&ccedil;u
            bloque le t&eacute;l&eacute;chargement, ouvre-le dans un nouvel onglet et r&eacute;essaie.
            Sur iPhone, utilise Partager puis Enregistrer dans Fichiers.
          </p>
        </div>
      )}

      {error && <p role="alert" className="text-[12px] leading-relaxed text-[#ff8a8e]">{error}</p>}

      {typeof window !== "undefined" && window.self !== window.top && (
        <a
          href={window.location.href}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-[12px] font-medium text-brand-2 underline-offset-4 hover:underline"
        >
          Ouvrir l'aper&ccedil;u dans un nouvel onglet
        </a>
      )}

      <details className="border-t border-white/[0.07] pt-3">
        <summary className="cursor-pointer text-[12px] font-medium text-mut-2 hover:text-white">
          Apr&egrave;s le t&eacute;l&eacute;chargement
        </summary>
        <ol className="mt-3 list-decimal space-y-2 pl-4 text-[12px] leading-relaxed text-mut-2">
          <li>D&eacute;compresse l'archive : tous les fichiers sont dans le dossier <code>platina</code>.</li>
          <li>Ouvre <code>GITHUB.md</code> pour publier dans ton d&eacute;p&ocirc;t sans effacer son historique.</li>
          <li>Pour tester en local, lance <code>npm install</code>, puis <code>npm run dev</code>.</li>
        </ol>
        <p className="mt-3 text-[11px] text-mut">
          Ne publie pas le ZIP tel quel : extrais ses fichiers. La sauvegarde de tes progr&egrave;s
          reste une op&eacute;ration s&eacute;par&eacute;e dans Sauvegarde &amp; Donn&eacute;es.
        </p>
      </details>
    </div>
  );
}