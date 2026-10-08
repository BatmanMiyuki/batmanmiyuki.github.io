import { useState } from "react";
import { Card, ProgressBar } from "../components/ui";
import { Cover } from "../components/Cover";
import { ChevronDown, CrownIcon, SearchIcon, SlidersIcon, TrophyCup } from "../lib/icons";
import { CloseIcon, PlusIcon } from "../lib/icons2";
import { earnedOf, progressOf, useStore, type Game, type Platform } from "../lib/store";
import { fmtDate } from "../lib/util";
import { useSheet } from "../components/Sheet";
import { AddGameSheet, GameSheet } from "../sheets/GameSheets";
import { cn } from "../utils/cn";

type Tab = "cours" | "plat" | "full";
type Sort = "date" | "name" | "trophies";
const SORT_LABEL: Record<Sort, string> = { date: "Date", name: "Nom", trophies: "Trophées" };
const NEXT_SORT: Record<Sort, Sort> = { date: "name", name: "trophies", trophies: "date" };
const TONES = ["plat", "gold", "silver", "bronze"] as const;
const COLORS = ["#dfe7f2", "#e9b431", "#c2c8d2", "#d9763a"];

function GameCard({ game, index }: { game: Game; index: number }) {
  const { open } = useSheet();
  const p = progressOf(game);
  return (
    <li>
      <button
        type="button"
        onClick={() => open(game.title, <GameSheet gameId={game.id} />)}
        className="group block w-full text-left"
      >
        <Card className="p-[11px] transition-all duration-300 group-hover:border-white/20 group-hover:bg-white/[0.02] group-active:scale-[0.99]">
          <div className="flex gap-[11px]">
            <Cover game={game} className="h-[70px] w-[70px] rounded-[10px]" />
            <div className="min-w-0 flex-1 pt-[3px]">
              <h3 className="truncate text-[14px] leading-tight font-semibold tracking-[-0.01em] text-white">
                {game.title}
              </h3>
              <div className="mt-[7px] flex items-center justify-between">
                <span className="inline-flex items-center rounded-[4px] border border-white/[0.09] bg-white/[0.04] px-[5px] py-[2px] text-[9px] leading-none font-medium tracking-[0.04em] text-mut-2">
                  {game.platform}
                </span>
                <span className="tnum text-[12px] leading-none font-medium text-white/90">{p}%</span>
              </div>
              <ProgressBar
                key={p}
                value={p}
                tone={p === 100 ? "violet" : "blue"}
                height={3}
                className="mt-[10px]"
                delay={index * 70}
              />
              <div className="mt-[10px] flex items-center justify-between">
                <ul className="flex items-center gap-[14px]">
                  {game.counts.map((n, i) => (
                    <li key={i} className="flex items-center gap-[4px]">
                      <TrophyCup tone={TONES[i]} className="h-[13px] w-[13px]" />
                      <span
                        className="tnum text-[11px] leading-none font-semibold"
                        style={{ color: COLORS[i] }}
                      >
                        {n}
                      </span>
                    </li>
                  ))}
                </ul>
                {game.platDate && (
                  <span className="tnum text-[10px] leading-none text-mut">{fmtDate(game.platDate)}</span>
                )}
              </div>
            </div>
          </div>
        </Card>
      </button>
    </li>
  );
}

function Empty({ children }: { children: string }) {
  return (
    <div className="rounded-[14px] border border-dashed border-white/10 px-[16px] py-[26px] text-center text-[12.5px] text-mut-2">
      {children}
    </div>
  );
}

export default function GamesScreen() {
  const { state } = useStore();
  const { open } = useSheet();
  const [tab, setTab] = useState<Tab>("cours");
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [filters, setFilters] = useState(false);
  const [platform, setPlatform] = useState<"all" | Platform>("all");
  const [sort, setSort] = useState<Sort>("date");

  const query = q.trim().toLowerCase();
  const all = state.games.filter(
    (g) => g.title.toLowerCase().includes(query) && (platform === "all" || g.platform === platform),
  );
  const current = all.filter((g) => g.counts[0] === 0);
  const plat = all
    .filter((g) => g.counts[0] > 0)
    .sort((a, b) =>
      sort === "name"
        ? a.title.localeCompare(b.title, "fr")
        : sort === "trophies"
          ? earnedOf(b) - earnedOf(a)
          : (b.platDate ?? 0) - (a.platDate ?? 0),
    );
  const full = all.filter((g) => progressOf(g) === 100);
  const platTotal = state.games.filter((g) => g.counts[0] > 0).length;

  const grid = "mt-[12px] grid gap-[11px] sm:grid-cols-2 xl:grid-cols-3";

  const platSection = (
    <>
      <div className="mt-[22px] flex items-center justify-between gap-3">
        <div className="flex items-center gap-[7px]">
          <CrownIcon className="h-[12px] w-[15px] text-[#7c8cff]" />
          <h2 className="text-[12px] font-bold tracking-[0.07em] text-[#7c8cff]">PLATINÉS ({platTotal})</h2>
        </div>
        <button
          type="button"
          onClick={() => setSort(NEXT_SORT[sort])}
          className="flex shrink-0 items-center gap-[4px] text-[11px] text-mut-2 transition-colors hover:text-white"
        >
          Trier par : {SORT_LABEL[sort]}
          <ChevronDown className="h-[11px] w-[11px]" />
        </button>
      </div>
      <ul className={grid}>
        {plat.map((g, i) => (
          <GameCard key={g.id} game={g} index={i} />
        ))}
      </ul>
      {plat.length === 0 && <Empty>Aucun jeu platiné pour ce filtre.</Empty>}
    </>
  );

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-[27px] leading-none font-bold tracking-[-0.03em] text-white sm:text-[32px]">
          Jeux
        </h1>
        <div className="flex items-center gap-[16px] text-white">
          <button
            type="button"
            aria-label="Ajouter un jeu"
            onClick={() => open("Ajouter un jeu", <AddGameSheet />)}
            className="transition-colors hover:text-brand-2"
          >
            <PlusIcon className="h-[21px] w-[21px]" />
          </button>
          <button
            type="button"
            aria-label="Rechercher"
            aria-pressed={searching}
            onClick={() => {
              setSearching((v) => !v);
              if (searching) setQ("");
            }}
            className={cn("transition-colors hover:text-brand-2", searching && "text-brand-2")}
          >
            <SearchIcon className="h-[20px] w-[20px]" />
          </button>
          <button
            type="button"
            aria-label="Filtrer"
            aria-pressed={filters}
            onClick={() => setFilters((v) => !v)}
            className={cn(
              "transition-colors hover:text-brand-2",
              (filters || platform !== "all") && "text-brand-2",
            )}
          >
            <SlidersIcon className="h-[20px] w-[20px]" />
          </button>
        </div>
      </header>

      <div className="mt-[18px] flex flex-wrap items-center gap-[10px]">
        {searching && (
          <div className="screen-in relative min-w-[220px] flex-1">
            <input
              autoFocus
              className="field pr-[38px]"
              placeholder="Rechercher un jeu…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
            {q && (
              <button
                type="button"
                aria-label="Effacer la recherche"
                onClick={() => setQ("")}
                className="absolute top-1/2 right-[10px] -translate-y-1/2 text-mut-2 hover:text-white"
              >
                <CloseIcon className="h-[16px] w-[16px]" />
              </button>
            )}
          </div>
        )}
        {filters && (
          <div className="screen-in flex items-center gap-[8px]">
            {(["all", "PS5", "PS4"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPlatform(p)}
                aria-pressed={platform === p}
                className={cn(
                  "rounded-full border px-[14px] py-[6px] text-[12px] font-semibold transition-all",
                  platform === p
                    ? "border-brand/70 bg-brand/[0.16] text-white"
                    : "border-white/10 text-mut-2 hover:border-white/25 hover:text-white",
                )}
              >
                {p === "all" ? "Toutes plateformes" : p}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-[22px] flex flex-wrap items-center gap-[8px]" role="tablist">
        {(
          [
            { id: "cours", label: "En cours" },
            { id: "plat", label: "Platinés" },
            { id: "full", label: "100%" },
          ] as { id: Tab; label: string }[]
        ).map((t) => {
          const on = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={on}
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-[11px] px-[17px] py-[9px] text-[14px] transition-all duration-300",
                on
                  ? "bg-brand text-[13px] font-semibold text-white shadow-[0_0_20px_-4px_var(--color-brand)]"
                  : "font-medium text-white/80 hover:text-white",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      <div key={tab} className="screen-in">
        {tab === "cours" && (
          <>
            <ul className={grid}>
              {current.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} />
              ))}
            </ul>
            {current.length === 0 && <Empty>Aucun jeu en cours. Ajoute-en un avec le bouton +.</Empty>}
            {platSection}
          </>
        )}
        {tab === "plat" && platSection}
        {tab === "full" && (
          <>
            <ul className={grid}>
              {full.map((g, i) => (
                <GameCard key={g.id} game={g} index={i} />
              ))}
            </ul>
            {full.length === 0 && <Empty>Aucun jeu à 100 % pour le moment.</Empty>}
          </>
        )}
      </div>

      <button
        type="button"
        onClick={() => open("Ajouter un jeu", <AddGameSheet />)}
        className="mt-[18px] flex h-[48px] w-full items-center justify-center gap-[8px] rounded-[14px] border border-dashed border-white/15 text-[13px] font-semibold text-mut-2 transition-all hover:border-brand/60 hover:bg-brand/[0.07] hover:text-white"
      >
        <PlusIcon className="h-[16px] w-[16px]" />
        Ajouter un jeu
      </button>
    </div>
  );
}
