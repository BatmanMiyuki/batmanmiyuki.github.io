import { useRef, useState } from "react";
import {
  normalizeBackup,
  useStore,
  type Accent,
  type Currency,
  type Settings,
  type Theme,
} from "../lib/store";
import { CURRENCIES, fmtDate, timeAgo } from "../lib/util";
import { deleteAccount, GUEST, setPassword, signOut as authSignOut } from "../lib/auth";
import { useSheet } from "../components/Sheet";
import { Card, ProgressBar } from "../components/ui";
import {
  Label,
  OptionRow,
  ToggleRow,
  btnDanger,
  btnGhost,
  btnPrimary,
} from "../components/controls";
import { RefreshIcon } from "../lib/icons2";
import { PlatinaLogo } from "../lib/icons";

function useSetting() {
  const { dispatch } = useStore();
  return (fn: (s: Settings) => Settings) => dispatch({ type: "settings", fn });
}

/* ----------------------------------------------------------------- profile */

export function ProfileSheet() {
  const { state, dispatch } = useStore();
  const { close, toast } = useSheet();
  const [name, setName] = useState(state.profile.name);
  const [handle, setHandle] = useState(state.profile.handle);
  const valid = name.trim().length > 1 && handle.trim().length > 1;
  return (
    <form
      className="pt-[4px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        dispatch({ type: "profile", name: name.trim(), handle: handle.trim().replace(/^@/, "") });
        toast("Profil mis à jour");
        close();
      }}
    >
      <div className="mb-[18px] flex justify-center">
        <img
          src="images/avatar.jpg"
          alt="Avatar"
          className="h-[84px] w-[84px] rounded-full object-cover ring-2 ring-brand/50"
        />
      </div>
      <Label>Nom affiché</Label>
      <input className="field" value={name} maxLength={30} onChange={(e) => setName(e.target.value)} />
      <div className="mt-[16px]">
        <Label>Identifiant PSN</Label>
        <input className="field" value={handle} maxLength={24} onChange={(e) => setHandle(e.target.value)} />
      </div>
      <button type="submit" disabled={!valid} className={`${btnPrimary} mt-[22px]`}>
        Enregistrer
      </button>
    </form>
  );
}

/* -------------------------------------------------------- compte Platina */

export function AccountSheet() {
  const { state } = useStore();
  const { toast } = useSheet();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const isGuest = state.profile.handle === GUEST;

  const change = async () => {
    const r = await setPassword(state.profile.handle, cur, next);
    if (!r.ok) return setMsg(r.error ?? "Erreur");
    setMsg("Mot de passe mis à jour.");
    setCur("");
    setNext("");
    toast("Mot de passe modifié");
  };

  return (
    <div className="pt-[4px]">
      <Card className="flex items-center gap-[13px] p-[14px]">
        <img src="images/avatar.jpg" alt="" className="h-[46px] w-[46px] rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-white">{state.profile.name}</div>
          <div className="mt-[2px] truncate text-[12px] text-mut-2">@{state.profile.handle}</div>
        </div>
        <span className="rounded-full bg-[#3ddc97]/15 px-[9px] py-[4px] text-[10.5px] font-semibold text-[#3ddc97]">
          {isGuest ? "Invité" : "Connecté"}
        </span>
      </Card>

      {isGuest ? (
        <p className="mt-[16px] text-[12.5px] leading-relaxed text-mut-2">
          Tu utilises Platina en invité : tes données restent sur cet appareil et ne sont pas
          protégées par un mot de passe. Crée un compte pour les sécuriser.
        </p>
      ) : (
        <>
          <div className="mt-[18px]">
            <Label>Changer de mot de passe</Label>
            <input
              className="field"
              type="password"
              placeholder="Mot de passe actuel"
              value={cur}
              onChange={(e) => setCur(e.target.value)}
            />
            <input
              className="field mt-[9px]"
              type="password"
              placeholder="Nouveau mot de passe"
              value={next}
              onChange={(e) => setNext(e.target.value)}
            />
          </div>
          {msg && <p className="mt-[10px] text-[12px] text-mut-2">{msg}</p>}
          <button
            type="button"
            disabled={!cur || !next}
            onClick={() => void change()}
            className={`${btnPrimary} mt-[14px]`}
          >
            Mettre à jour
          </button>

          <div className="mt-[22px]">
            <button
              type="button"
              onClick={() => {
                if (!confirm) return setConfirm(true);
                deleteAccount(state.profile.handle);
                window.location.hash = "#/";
                window.location.reload();
              }}
              className={
                confirm
                  ? btnDanger
                  : "h-[40px] w-full text-[12.5px] font-medium text-mut-2 transition-colors hover:text-[#ff6166]"
              }
            >
              {confirm ? "Confirmer la suppression du compte" : "Supprimer mon compte et mes données"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------- liaison PlayStation */

export function PsnSheet() {
  const { state, dispatch } = useStore();
  const { toast } = useSheet();
  const [npsso, setNpsso] = useState("");
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [step, setStep] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const linked = Boolean(state.psn.id);
  const canRefresh = Boolean(state.psn.refreshToken);

  const [manual, setManual] = useState(false);
  const [code, setCode] = useState("");

  const run = async (mode: "npsso" | "refresh" | "code") => {
    setErr(null);
    setBusy(true);
    setPct(4);
    setStep("Connexion à PlayStation…");
    try {
      const { importFromNpsso, importFromRefresh, importFromCode, importFromToken, looksLikeJwt } =
        await import("../lib/psn");
      const onProg = (label: string, p: number) => {
        setStep(label);
        setPct(p);
      };
      const snap =
        mode === "code"
          ? looksLikeJwt(code)
            ? await importFromToken(code, onProg)
            : await importFromCode(code, onProg)
          : mode === "refresh" && state.psn.refreshToken
            ? await importFromRefresh(state.psn.refreshToken, onProg)
            : await importFromNpsso(npsso, onProg);
      dispatch({ type: "importPsn", payload: snap });
      setNpsso("");
      setCode("");
      toast(`${snap.games.length} jeux importés · ${snap.onlineId}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Échec de la synchronisation PSN.");
    } finally {
      setBusy(false);
      setPct(0);
      setStep("");
    }
  };

  return (
    <div className="pt-[4px]">
      <Card className="divide-y divide-white/[0.05] px-[14px]">
        <div className="flex items-center justify-between py-[13px]">
          <span className="text-[13px] text-mut-2">Statut</span>
          <span
            className={
              linked
                ? "rounded-full bg-[#3ddc97]/15 px-[9px] py-[4px] text-[10.5px] font-semibold text-[#3ddc97]"
                : "rounded-full bg-white/[0.07] px-[9px] py-[4px] text-[10.5px] font-semibold text-mut-2"
            }
          >
            {linked ? "Lié" : "Non lié"}
          </span>
        </div>
        {linked && (
          <>
            <div className="flex items-center justify-between py-[13px]">
              <span className="text-[13px] text-mut-2">Online ID</span>
              <span className="truncate pl-[12px] text-[13px] font-semibold text-white">{state.psn.id}</span>
            </div>
            <div className="flex items-center justify-between py-[13px]">
              <span className="text-[13px] text-mut-2">Jeux importés</span>
              <span className="tnum text-[13px] font-semibold text-white">{state.games.length}</span>
            </div>
            <div className="flex items-center justify-between py-[13px]">
              <span className="text-[13px] text-mut-2">Lié le</span>
              <span className="tnum text-[13px] font-semibold text-white">
                {state.psn.linkedAt ? fmtDate(state.psn.linkedAt) : "—"}
              </span>
            </div>
            <div className="flex items-center justify-between py-[13px]">
              <span className="text-[13px] text-mut-2">Dernière synchro</span>
              <span className="tnum text-[13px] font-semibold text-white">
                {state.lastSync ? timeAgo(state.lastSync) : "Jamais"}
              </span>
            </div>
          </>
        )}
      </Card>

      <ol className="mt-[16px] space-y-[10px] rounded-[14px] border border-white/[0.07] bg-white/[0.03] p-[14px] text-[12.5px] leading-relaxed text-mut-2">
        <li>
          <span className="font-semibold text-white">1.</span> Connecte-toi sur{" "}
          <a
            href="https://www.playstation.com/fr-fr/"
            target="_blank"
            rel="noreferrer"
            className="text-brand-2 underline-offset-2 hover:underline"
          >
            playstation.com
          </a>
          .
        </li>
        <li>
          <span className="font-semibold text-white">2.</span> Dans le{" "}
          <em className="not-italic text-white">même navigateur</em>, ouvre{" "}
          <a
            href="https://ca.account.sony.com/api/v1/ssocookie"
            target="_blank"
            rel="noreferrer"
            className="text-brand-2 underline-offset-2 hover:underline"
          >
            la page NPSSO
          </a>
          .
        </li>
        <li>
          <span className="font-semibold text-white">3.</span> Copie la valeur{" "}
          <code className="rounded bg-white/[0.06] px-[5px] py-[1px] text-[11px] text-white">npsso</code>{" "}
          (64 caractères) et colle-la ci-dessous.
        </li>
      </ol>

      <div className="mt-[14px]">
        <Label>Jeton NPSSO</Label>
        <input
          className="field font-mono text-[13px]"
          placeholder="Colle ici ton NPSSO"
          autoCapitalize="none"
          autoComplete="off"
          spellCheck={false}
          value={npsso}
          onChange={(e) => setNpsso(e.target.value)}
        />
      </div>

      <p className="mt-[10px] text-[11.5px] leading-relaxed text-mut">
        Le NPSSO équivaut à un mot de passe de session. Il n'est pas enregistré : seuls les
        jetons d'accès (renouvelables ~60 jours) restent sur cet appareil.
      </p>

      {busy && (
        <div className="mt-[14px]">
          <div className="mb-[6px] flex items-baseline justify-between gap-3">
            <span className="truncate text-[12px] text-mut-2">{step}</span>
            <span className="tnum text-[11px] text-mut">{Math.round(pct)}%</span>
          </div>
          <ProgressBar value={Math.round(pct)} height={6} />
        </div>
      )}

      {err && (
        <p role="alert" className="mt-[12px] rounded-[12px] border border-[#e5484d]/30 bg-[#e5484d]/10 p-[12px] text-[12px] leading-relaxed text-[#ff8a8e]">
          {err}
        </p>
      )}

      {/* ------------------------------------------- mode manuel */}
      <details
        open={manual}
        onToggle={(e) => setManual((e.target as HTMLDetailsElement).open)}
        className="mt-[16px] rounded-[14px] border border-white/[0.08] bg-white/[0.03] px-[14px] py-[12px]"
      >
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-[13px] font-semibold text-white">
          Mode manuel (si le relais est bloqué)
          <span className="text-brand-2">{manual ? "–" : "+"}</span>
        </summary>
        <div className="mt-[12px]">
          <p className="text-[12px] leading-relaxed text-mut-2">
            Ouvre le lien d'autorisation dans un nouvel onglet (tu dois être connecté à
            playstation.com). Sony tente d'ouvrir une applis externe : ignore-le, puis copie
            l'adresse complète affichée dans la barre d'adresse — elle contient{" "}
            <code className="rounded bg-white/[0.06] px-[5px] py-[1px] text-[11px] text-white">code=v3.…</code>.
          </p>
          <a
            href="https://ca.account.sony.com/api/authz/v3/oauth/authorize?access_type=offline&client_id=09515159-7237-4370-9b40-3806e67c0891&redirect_uri=com.scee.psxandroid.scecompcall%3A%2F%2Fredirect&response_type=code&scope=psn%3Amobile.v2.core%20psn%3Aclientapp"
            target="_blank"
            rel="noreferrer"
            className={`${btnGhost} mt-[12px]`}
          >
            Ouvrir le lien d'autorisation
          </a>
          <div className="mt-[12px]">
            <Label>Code, URL de redirection ou access_token</Label>
            <input
              className="field font-mono text-[12.5px]"
              placeholder="…/redirect?code=v3.eyJhbGci…  ou  eyJhbGci…"
              autoCapitalize="none"
              autoComplete="off"
              spellCheck={false}
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <p className="mt-[8px] text-[11px] leading-relaxed text-mut">
              Le champ détecte tout seul ce que tu colles : code d'autorisation{" "}
              <code className="rounded bg-white/[0.06] px-[4px] text-[10px] text-white">v3.…</code>,
              URL complète de redirection, ou access_token JWT (si tu en as un depuis un outil PSN).
            </p>
          </div>
          <button
            type="button"
            disabled={busy || code.trim().length < 8}
            className={`${btnPrimary} mt-[12px]`}
            onClick={() => void run("code")}
          >
            Importer avec ce code
          </button>
        </div>
      </details>

      <div className="mt-[16px] space-y-[10px]">
        <button
          type="button"
          disabled={busy || npsso.trim().length < 16}
          className={btnPrimary}
          onClick={() => void run("npsso")}
        >
          <RefreshIcon className={`h-[17px] w-[17px] ${busy ? "animate-spin" : ""}`} />
          {busy ? "Synchronisation…" : linked ? "Re-lier avec un nouveau NPSSO" : "Lier et importer mes trophées"}
        </button>
        {canRefresh && (
          <button
            type="button"
            disabled={busy}
            className={btnGhost}
            onClick={() => void run("refresh")}
          >
            Resynchroniser sans NPSSO
          </button>
        )}
        {linked && (
          <button
            type="button"
            disabled={busy}
            className="h-[40px] w-full text-[12.5px] font-medium text-mut-2 transition-colors hover:text-[#ff6166]"
            onClick={() => {
              dispatch({ type: "psnUnlink" });
              toast("Compte PlayStation délié");
            }}
          >
            Délier mon compte
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- synchro */

export function SyncSheet({ mode }: { mode: "account" | "import" }) {
  const { state } = useStore();
  const { open } = useSheet();
  const nbGames = state.games.length;

  if (mode === "import") return <PsnSheet />;

  return (
    <div className="pt-[4px]">
      <Card className="flex items-center gap-[13px] p-[14px]">
        <img src="images/avatar.jpg" alt="" className="h-[46px] w-[46px] rounded-full object-cover" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-bold text-white">{state.profile.name}</div>
          <div className="mt-[2px] truncate text-[12px] text-mut-2">@{state.profile.handle}</div>
        </div>
        <span className="rounded-full bg-[#3ddc97]/15 px-[9px] py-[4px] text-[10.5px] font-semibold text-[#3ddc97]">
          Connecté
        </span>
      </Card>

      <ul className="mt-[16px] space-y-[8px] text-[12.5px] text-mut-2">
        <li>• Tes progrès sont enregistrés automatiquement après chaque action.</li>
        <li>• {nbGames} jeu{nbGames > 1 ? "x" : ""} dans ta bibliothèque.</li>
        <li>• PlayStation : {state.psn.id ? `lié à ${state.psn.id}` : "non lié"}.</li>
      </ul>

      <button
        type="button"
        className={`${btnPrimary} mt-[18px]`}
        onClick={() => open("PlayStation Network", <PsnSheet />)}
      >
        Gérer la liaison PlayStation
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ linked */

export function LinkedSheet() {
  const { state } = useStore();
  const set = useSetting();
  const l = state.settings.linked;
  return (
    <Card className="mt-[4px] divide-y divide-white/[0.05] px-[14px]">
      <ToggleRow title="PlayStation Network" sub="Compte principal, requis pour la synchronisation." checked={l.psn} onChange={(v) => set((s) => ({ ...s, linked: { ...s.linked, psn: v } }))} />
      <ToggleRow title="Twitch" sub="Affiche tes platines en direct sur ta chaîne." checked={l.twitch} onChange={(v) => set((s) => ({ ...s, linked: { ...s.linked, twitch: v } }))} />
      <ToggleRow title="Discord" sub="Partage tes trophées dans ton serveur." checked={l.discord} onChange={(v) => set((s) => ({ ...s, linked: { ...s.linked, discord: v } }))} />
    </Card>
  );
}

/* ----------------------------------------------------------------- privacy */

export function PrivacySheet() {
  const { state } = useStore();
  const set = useSetting();
  const p = state.settings.privacy;
  return (
    <Card className="mt-[4px] divide-y divide-white/[0.05] px-[14px]">
      <ToggleRow title="Profil public" sub="Les autres joueurs peuvent voir ta collection." checked={p.publicProfile} onChange={(v) => set((s) => ({ ...s, privacy: { ...s.privacy, publicProfile: v } }))} />
      <ToggleRow title="Afficher le temps de jeu" sub="Rend ton temps de jeu visible sur ton profil." checked={p.showPlaytime} onChange={(v) => set((s) => ({ ...s, privacy: { ...s.privacy, showPlaytime: v } }))} />
    </Card>
  );
}

/* ----------------------------------------------------------- notifications */

export function NotificationsSheet() {
  const { state } = useStore();
  const set = useSetting();
  const n = state.settings.notifications;
  const upd = (k: keyof typeof n) => (v: boolean) =>
    set((s) => ({ ...s, notifications: { ...s.notifications, [k]: v } }));
  return (
    <Card className="mt-[4px] divide-y divide-white/[0.05] px-[14px]">
      <ToggleRow title="Nouveaux trophées" sub="Une alerte à chaque trophée débloqué." checked={n.trophies} onChange={upd("trophies")} />
      <ToggleRow title="Platines" sub="Célèbre chaque platine obtenue." checked={n.platinum} onChange={upd("platinum")} />
      <ToggleRow title="Rappels de jeu" sub="Reprends un jeu en cours de progression." checked={n.reminders} onChange={upd("reminders")} />
      <ToggleRow title="Bilan hebdomadaire" sub="Ton résumé chaque lundi matin." checked={n.weekly} onChange={upd("weekly")} />
    </Card>
  );
}

/* --------------------------------------------------------------- pickers */

export const THEME_LABEL: Record<Theme, string> = {
  dark: "Sombre",
  midnight: "Minuit",
  amoled: "AMOLED",
};

export function ThemeSheet() {
  const { state } = useStore();
  const set = useSetting();
  const subs: Record<Theme, string> = {
    dark: "Noir profond, par défaut.",
    midnight: "Bleu nuit, plus doux pour les yeux.",
    amoled: "Noir pur, économise la batterie.",
  };
  return (
    <div className="space-y-[9px] pt-[4px]">
      {(Object.keys(THEME_LABEL) as Theme[]).map((t) => (
        <OptionRow
          key={t}
          label={THEME_LABEL[t]}
          sub={subs[t]}
          selected={state.settings.theme === t}
          onClick={() => set((s) => ({ ...s, theme: t }))}
        />
      ))}
    </div>
  );
}

export function LanguageSheet() {
  return (
    <div className="space-y-[9px] pt-[4px]">
      <OptionRow label="Français" selected />
      <OptionRow label="English" sub="Bientôt disponible" disabled />
      <OptionRow label="Español" sub="Bientôt disponible" disabled />
    </div>
  );
}

export function CurrencySheet() {
  const { state } = useStore();
  const set = useSetting();
  return (
    <div className="space-y-[9px] pt-[4px]">
      {(Object.keys(CURRENCIES) as Currency[]).map((c) => (
        <OptionRow
          key={c}
          label={CURRENCIES[c].label}
          sub={c === "EUR" ? "Devise de référence" : `1 € ≈ ${CURRENCIES[c].rate.toString().replace(".", ",")} ${CURRENCIES[c].symbol}`}
          selected={state.settings.currency === c}
          onClick={() => set((s) => ({ ...s, currency: c }))}
        />
      ))}
    </div>
  );
}

export const ACCENTS: Record<Accent, { label: string; a: string; b: string }> = {
  blue: { label: "Bleu PlayStation", a: "#2f6bff", b: "#4f8cff" },
  violet: { label: "Violet platine", a: "#7c5cff", b: "#9b82ff" },
  green: { label: "Vert émeraude", a: "#1fb26b", b: "#3ddc97" },
  pink: { label: "Rose néon", a: "#e5459a", b: "#ff6db8" },
};

export function AccentSheet() {
  const { state } = useStore();
  const set = useSetting();
  return (
    <div className="space-y-[9px] pt-[4px]">
      {(Object.keys(ACCENTS) as Accent[]).map((k) => (
        <OptionRow
          key={k}
          label={ACCENTS[k].label}
          selected={state.settings.accent === k}
          leading={
            <span
              className="h-[26px] w-[26px] shrink-0 rounded-full ring-2 ring-white/20"
              style={{ background: `linear-gradient(135deg,${ACCENTS[k].a},${ACCENTS[k].b})` }}
            />
          }
          onClick={() => set((s) => ({ ...s, accent: k }))}
        />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ backup */

export function BackupSheet() {
  const { state, dispatch } = useStore();
  const { close, toast } = useSheet();
  const file = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);

  const exportData = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `platina-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Sauvegarde exportée");
  };

  const importData = async (f: File) => {
    try {
      const restored = normalizeBackup(JSON.parse(await f.text()));
      if (!restored) throw new Error("invalid");
      dispatch({ type: "restore", state: restored });
      toast("Données restaurées");
      close();
    } catch {
      toast("Fichier de sauvegarde invalide");
    }
  };

  return (
    <div className="space-y-[10px] pt-[4px]">
      <p className="mb-[8px] text-[12.5px] leading-relaxed text-mut-2">
        Tes données sont stockées sur cet appareil. Exporte-les pour les conserver ou les transférer.
      </p>
      <button type="button" className={btnPrimary} onClick={exportData}>
        Exporter mes données
      </button>
      <button type="button" className={btnGhost} onClick={() => file.current?.click()}>
        Restaurer une sauvegarde
      </button>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void importData(f);
          e.target.value = "";
        }}
      />
      <div className="pt-[10px]">
        <button
          type="button"
          className={confirm ? btnDanger : "h-[40px] w-full text-[12.5px] font-medium text-mut-2 transition-colors hover:text-[#ff6166]"}
          onClick={() => {
            if (!confirm) return setConfirm(true);
            dispatch({ type: "reset" });
            toast("Données réinitialisées");
            close();
          }}
        >
          {confirm ? "Confirmer la réinitialisation" : "Réinitialiser toutes les données"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- about/contact */

export function AboutSheet() {
  return (
    <div className="pt-[8px] text-center">
      <PlatinaLogo className="mx-auto h-[54px] w-[60px]" />
      <div className="mt-[12px] text-[22px] font-bold tracking-[-0.03em] text-white">Platina</div>
      <div className="mt-[3px] text-[12px] text-mut-2">Version 1.0.0</div>
      <p className="mx-auto mt-[18px] max-w-[34ch] text-[12.5px] leading-relaxed text-mut-2">
        Tes trophées, ta légende. Suis tes platines, ton temps de jeu et tes dépenses PS Store dans une seule application.
      </p>
      <p className="mx-auto mt-[18px] max-w-[38ch] text-[11px] leading-relaxed text-mut">
        PlayStation, PS Store et PlayStation Plus sont des marques de Sony Interactive Entertainment. Platina n'est pas affilié à Sony.
      </p>
    </div>
  );
}

const FAQ = [
  ["Comment sont calculés les niveaux ?", "Chaque trophée rapporte de l'XP : bronze 3, argent 8, or 20 et platine 40. Un niveau = 100 XP."],
  ["Comment débloquer une platine ?", "Obtiens tous les autres trophées d'un jeu : la platine se débloque en dernier et le jeu passe à 100 %."],
  ["Où sont stockées mes données ?", "Localement sur cet appareil. Utilise Sauvegarde & Données pour les exporter."],
];

export function ContactSheet() {
  return (
    <div className="pt-[4px]">
      <a href="mailto:support@platina.app" className={btnPrimary}>
        Écrire au support
      </a>
      <div className="mt-[18px] mb-[8px] text-[11px] font-semibold tracking-[0.06em] text-mut uppercase">FAQ</div>
      <div className="space-y-[8px]">
        {FAQ.map(([q, a]) => (
          <details key={q} className="group rounded-[13px] border border-white/[0.07] bg-white/[0.03] px-[14px] py-[12px]">
            <summary className="cursor-pointer list-none text-[13.5px] font-semibold text-white marker:hidden">
              {q}
            </summary>
            <p className="mt-[8px] text-[12.5px] leading-relaxed text-mut-2">{a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ logout */

export function LogoutSheet() {
  const { dispatch } = useStore();
  const { close } = useSheet();
  return (
    <div className="pt-[4px]">
      <p className="mb-[18px] text-[13px] leading-relaxed text-mut-2">
        Tu seras déconnecté de ton compte. Tes données restent enregistrées sur cet appareil :
        reconnecte-toi pour les retrouver.
      </p>
      <div className="space-y-[10px]">
        <button
          type="button"
          className={btnDanger}
          onClick={() => {
            close();
            window.setTimeout(() => {
              authSignOut();
              dispatch({ type: "logout" });
            }, 250);
          }}
        >
          Me déconnecter
        </button>
        <button type="button" className={btnGhost} onClick={close}>
          Annuler
        </button>
      </div>
    </div>
  );
}
