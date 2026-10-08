import { useState } from "react";
import {
  METALS,
  METAL_LABEL,
  XP,
  earnedOf,
  progressOf,
  useStore,
  type Metal,
  type Platform,
} from "../lib/store";
import { fmtDate } from "../lib/util";
import { useSheet } from "../components/Sheet";
import { ProgressBar } from "../components/ui";
import { Cover } from "../components/Cover";
import { Label, btnDanger, btnGhost, btnPrimary } from "../components/controls";
import { ClockIcon, TrashIcon } from "../lib/icons2";
import { TrophyCup } from "../lib/icons";
import { SessionSheet } from "./PlaySheets";
import { cn } from "../utils/cn";

export function GameSheet({ gameId }: { gameId: string }) {
  const { state, dispatch } = useStore();
  const { close, open, toast } = useSheet();
  const [confirm, setConfirm] = useState(false);
  const g = state.games.find((x) => x.id === gameId);
  if (!g) return null;

  const earned = earnedOf(g);
  const progress = progressOf(g);
  const hasPlat = g.counts[0] > 0;

  const can = (m: Metal) =>
    m === "plat" ? !hasPlat && earned >= g.total - 1 : !hasPlat && earned < g.total - 1;

  const unlock = (m: Metal) => {
    if (!can(m)) return;
    const before = Math.floor(state.xp / 100);
    const after = Math.floor((state.xp + XP[m]) / 100);
    dispatch({ type: "unlock", gameId: g.id, metal: m });
    toast(
      after > before
        ? `Niveau ${after} atteint !`
        : m === "plat"
          ? `Platine obtenu · +${XP[m]} XP`
          : `Trophée ${METAL_LABEL[m].toLowerCase()} · +${XP[m]} XP`,
    );
  };

  const order: Metal[] = ["bronze", "silver", "gold", "plat"];

  return (
    <div className="pt-[2px]">
      <div className="flex items-center gap-[14px]">
        <Cover game={g} className="h-[84px] w-[84px] rounded-[14px]" />
        <div className="min-w-0 flex-1">
          <div className="text-[17px] leading-tight font-bold tracking-[-0.01em] text-white">{g.title}</div>
          <div className="mt-[7px] flex items-center gap-[8px]">
            <span className="rounded-[4px] border border-white/[0.09] bg-white/[0.04] px-[5px] py-[2px] text-[9.5px] font-medium tracking-[0.04em] text-mut-2">
              {g.platform}
            </span>
            {g.platDate && (
              <span className="tnum text-[11px] text-mut-2">Platiné le {fmtDate(g.platDate)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-[18px]">
        <div className="mb-[8px] flex items-baseline justify-between">
          <span className="tnum text-[12px] text-mut-2">
            {earned} / {g.total} trophées
          </span>
          <span className="tnum text-[20px] font-bold text-white">{progress}%</span>
        </div>
        <ProgressBar value={progress} tone={progress === 100 ? "violet" : "blue"} height={7} />
      </div>

      <div className="mt-[22px]">
        <Label>Débloquer un trophée</Label>
        <div className="grid grid-cols-4 gap-[8px]">
          {order.map((m) => {
            const ok = can(m);
            return (
              <button
                key={m}
                type="button"
                disabled={!ok}
                onClick={() => unlock(m)}
                className={cn(
                  "group flex flex-col items-center gap-[6px] rounded-[14px] border py-[12px] transition-all duration-200",
                  ok
                    ? "border-white/10 bg-white/[0.04] hover:-translate-y-[2px] hover:border-brand/60 hover:bg-brand/[0.1] active:scale-95"
                    : "cursor-not-allowed border-white/[0.05] bg-white/[0.02] opacity-45",
                )}
              >
                <TrophyCup tone={m} className="h-[28px] w-[28px]" />
                <span className="tnum text-[16px] leading-none font-bold text-white">
                  {g.counts[METALS.indexOf(m)]}
                </span>
                <span className="text-[10px] leading-none text-mut-2">{METAL_LABEL[m]}</span>
              </button>
            );
          })}
        </div>
        <p className="mt-[10px] text-[11.5px] leading-snug text-mut">
          {hasPlat
            ? "Ce jeu est platiné. Bravo !"
            : earned >= g.total - 1
              ? "Il ne reste que la platine : débloque-la pour finir à 100 %."
              : `La platine se débloque quand il ne reste qu'un trophée (${g.total - 1 - earned} à obtenir avant).`}
        </p>
      </div>

      <div className="mt-[20px] space-y-[10px]">
        <button
          type="button"
          className={btnGhost}
          onClick={() => open("Enregistrer une session", <SessionSheet gameId={g.id} />)}
        >
          <ClockIcon className="h-[17px] w-[17px]" />
          Enregistrer une session
        </button>
        <button
          type="button"
          className={confirm ? btnDanger : "flex h-[40px] w-full items-center justify-center gap-[7px] text-[12.5px] font-medium text-mut-2 transition-colors hover:text-[#ff6166]"}
          onClick={() => {
            if (!confirm) {
              setConfirm(true);
              return;
            }
            dispatch({ type: "removeGame", gameId: g.id });
            toast("Jeu retiré de la bibliothèque");
            close();
          }}
        >
          <TrashIcon className="h-[15px] w-[15px]" />
          {confirm ? "Confirmer la suppression" : "Retirer de ma bibliothèque"}
        </button>
      </div>
    </div>
  );
}

export function AddGameSheet() {
  const { dispatch } = useStore();
  const { close, toast } = useSheet();
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<Platform>("PS5");
  const [total, setTotal] = useState("40");

  const n = Math.round(Number(total));
  const valid = title.trim().length > 1 && Number.isFinite(n) && n >= 5 && n <= 200;

  return (
    <form
      className="pt-[4px]"
      onSubmit={(e) => {
        e.preventDefault();
        if (!valid) return;
        dispatch({ type: "addGame", title: title.trim(), platform, total: n });
        toast("Jeu ajouté à ta bibliothèque");
        close();
      }}
    >
      <Label>Titre du jeu</Label>
      <input
        className="field"
        autoFocus
        placeholder="Ex : Astro Bot"
        maxLength={60}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />

      <div className="mt-[16px]">
        <Label>Plateforme</Label>
        <div className="grid grid-cols-2 gap-[9px]">
          {(["PS5", "PS4"] as Platform[]).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatform(p)}
              aria-pressed={platform === p}
              className={cn(
                "h-[44px] rounded-[12px] border text-[14px] font-semibold transition-all",
                platform === p
                  ? "border-brand/70 bg-brand/[0.15] text-white"
                  : "border-white/10 bg-white/[0.03] text-mut-2 hover:border-white/25 hover:text-white",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-[16px]">
        <Label>Nombre de trophées (5 – 200)</Label>
        <input
          className="field tnum"
          inputMode="numeric"
          value={total}
          onChange={(e) => setTotal(e.target.value.replace(/[^\d]/g, ""))}
        />
      </div>

      <button type="submit" disabled={!valid} className={`${btnPrimary} mt-[22px]`}>
        Ajouter le jeu
      </button>
    </form>
  );
}
