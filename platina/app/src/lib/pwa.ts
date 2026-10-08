import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let ready = false;
const subs = new Set<(v: boolean) => void>();

function emit(v: boolean) {
  ready = v;
  subs.forEach((f) => f(v));
}

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit(true);
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    emit(false);
  });
}

/** Enregistre le service worker : l'app devient installable et hors ligne. */
export function registerServiceWorker() {
  if (!import.meta.env.PROD || typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
  const go = () => {
    const scope = new URL("./", document.baseURI);
    navigator.serviceWorker.register(new URL("sw.js", scope).href, {
      scope: scope.pathname,
      updateViaCache: "none",
    }).catch(() => undefined);
  };
  if (document.readyState === "complete") go();
  else window.addEventListener("load", go, { once: true });
}

export function useInstall() {
  const [available, setAvailable] = useState(ready);

  useEffect(() => {
    subs.add(setAvailable);
    return () => {
      subs.delete(setAvailable);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    emit(false);
  };

  return { available, install, standalone: isStandalone() };
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error – iOS Safari
    Boolean(window.navigator.standalone)
  );
}
