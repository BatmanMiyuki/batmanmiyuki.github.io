import { useState } from "react";
import { PlatinaLogo, PlatinumBadge, ChevronRight } from "../lib/icons";
import { useStore } from "../lib/store";
import { Label, btnPrimary, btnGhost } from "../components/controls";
import { RefreshIcon, CheckIcon } from "../lib/icons2";
import { continueAsGuest, signIn, signUp, listAccounts } from "../lib/auth";

type Mode = "signin" | "signup";

export default function Welcome() {
  const { dispatch } = useStore();
  const [mode, setMode] = useState<Mode>("signup");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [pw, setPw] = useState("");
  const [psn, setPsn] = useState("");
  const [linkPsn, setLinkPsn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const known = listAccounts().length > 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    if (mode === "signup") {
      const r = await signUp(name, handle, pw);
      if (!r.ok) {
        setErr(r.error);
        setBusy(false);
        return;
      }
      dispatch({
        type: "sessionStart",
        name: name.trim(),
        handle: handle.trim(),
        psnId: linkPsn && psn.trim() ? psn.trim() : undefined,
      });
      return;
    }
    const r = await signIn(handle, pw);
    if (!r.ok) {
      setErr(r.error);
      setBusy(false);
      return;
    }
    // les données sauvegardées sont rechargées par le store au montage suivant
    window.location.reload();
  };

  return (
    <div className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden px-5 py-[calc(env(safe-area-inset-top)+40px)]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-[120px] left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-[10px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb,var(--color-brand) 38%, transparent), transparent 68%)",
        }}
      />

      <div className="relative w-full max-w-[400px]">
        {/* -------------------------------------------------- marque */}
        <div className="screen-in flex flex-col items-center text-center">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-brand/30 blur-[26px]" />
            <PlatinumBadge className="relative h-[104px] w-[104px] drop-shadow-[0_10px_30px_rgba(79,140,255,0.45)]" />
          </div>
          <div className="mt-[20px] flex items-center gap-[10px]">
            <PlatinaLogo className="h-[28px] w-[32px]" />
            <h1 className="text-[30px] leading-none font-extrabold tracking-[-0.04em] text-white">
              Platina
            </h1>
          </div>
          <p className="mt-[10px] text-[14px] text-mut-2">Tes trophées, ta légende.</p>
        </div>

        {/* -------------------------------------------------- formulaire */}
        <form onSubmit={submit} className="screen-in mt-[26px]" style={{ animationDelay: "90ms" }}>
          <div className="mb-[16px] grid grid-cols-2 gap-[6px] rounded-[13px] border border-white/[0.07] bg-white/[0.03] p-[4px]">
            {(
              [
                { id: "signup", label: "Créer un compte" },
                { id: "signin", label: "Se connecter" },
              ] as { id: Mode; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setMode(t.id);
                  setErr(null);
                }}
                aria-pressed={mode === t.id}
                className={
                  mode === t.id
                    ? "rounded-[10px] bg-brand py-[9px] text-[13px] font-semibold text-white shadow-[0_0_18px_-6px_var(--color-brand)]"
                    : "rounded-[10px] py-[9px] text-[13px] font-medium text-mut-2 transition-colors hover:text-white"
                }
              >
                {t.label}
              </button>
            ))}
          </div>

          {mode === "signup" && (
            <div className="mb-[14px]">
              <Label>Nom affiché</Label>
              <input
                className="field"
                placeholder="Ex : Batman Miyuki"
                maxLength={30}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="mb-[14px]">
            <Label>Identifiant</Label>
            <input
              className="field"
              placeholder="Ex : batman_miyuki"
              autoCapitalize="none"
              maxLength={24}
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
            />
          </div>

          {mode === "signin" && known && (
            <p className="-mt-[6px] mb-[12px] text-[11.5px] text-mut">
              {listAccounts().length} compte(s) sur cet appareil.
            </p>
          )}

          <div className="mb-[16px]">
            <Label>Mot de passe</Label>
            <input
              className="field"
              type="password"
              placeholder="••••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
            />
          </div>

          {/* ------------------------------------------ liaison PSN */}
          {mode === "signup" && (
            <div className="rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-[13px]">
              <button
                type="button"
                onClick={() => setLinkPsn((v) => !v)}
                className="flex w-full items-center gap-[10px] text-left"
                aria-pressed={linkPsn}
              >
                <span
                  className={
                    linkPsn
                      ? "flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] bg-brand text-white"
                      : "flex h-[20px] w-[20px] shrink-0 items-center justify-center rounded-[6px] border border-white/20 text-transparent"
                  }
                >
                  <CheckIcon className="h-[13px] w-[13px]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-white">
                    Lier mon compte PlayStation
                  </span>
                  <span className="block text-[11px] leading-snug text-mut-2">
                    Renseigne ton Online ID pour l'afficher sur ton profil.
                  </span>
                </span>
              </button>
              {linkPsn && (
                <input
                  className="field mt-[11px]"
                  placeholder="Online ID PlayStation"
                  autoCapitalize="none"
                  maxLength={24}
                  value={psn}
                  onChange={(e) => setPsn(e.target.value)}
                />
              )}
            </div>
          )}

          {err && (
            <p role="alert" className="mt-[12px] text-[12px] font-medium text-[#ff6166]">
              {err}
            </p>
          )}

          <button type="submit" disabled={busy} className={`${btnPrimary} mt-[18px]`}>
            {busy && <RefreshIcon className="h-[17px] w-[17px] animate-spin" />}
            {busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : "Se connecter"}
          </button>

          <button
            type="button"
            className={`${btnGhost} mt-[10px]`}
            onClick={() => {
              continueAsGuest();
              dispatch({ type: "sessionStart", name: "Invité", handle: "invite" });
            }}
          >
            Continuer sans compte
          </button>

          <p className="mt-[16px] text-center text-[10.5px] leading-relaxed text-mut">
            Tes données restent sur cet appareil. Aucune information n'est envoyée à un serveur.
            PlayStation est une marque de Sony Interactive Entertainment — Platina n'y est pas affilié.
          </p>
        </form>
      </div>

      <a
        href="#/"
        className="relative mt-[22px] flex items-center gap-[3px] text-[12px] font-medium text-mut-2 transition-colors hover:text-white"
      >
        Retour à la présentation
        <ChevronRight className="h-[12px] w-[12px]" />
      </a>

    </div>
  );
}
