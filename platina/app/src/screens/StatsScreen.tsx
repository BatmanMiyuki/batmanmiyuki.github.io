import { Card, LinkButton, ProgressBar, Ring, SectionLabel } from "../components/ui";
import { BellIcon, ChevronRight, PlatinumBadge, PlatinaLogo, TrophyCup } from "../lib/icons";
import {
  METALS,
  METAL_LABEL,
  earnedOf,
  earnedTrophies,
  globalPct as globalPctOf,
  levelOf,
  levelPct,
  progressOf,
  totalTrophies,
  useStore,
} from "../lib/store";
import { fmtNum, fmtDate, tintFor, timeAgo } from "../lib/util";
import { useSheet } from "../components/Sheet";
import { useNav } from "../lib/nav";
import { ActivitySheet } from "../sheets/PlaySheets";
import { GameSheet } from "../sheets/GameSheets";
import { Cover } from "../components/Cover";

export default function StatsScreen() {
  const { state, dispatch } = useStore();
  const { open } = useSheet();
  const { setTab } = useNav();

  const level = levelOf(state);
  const pct = levelPct(state);
  const obtained = earnedTrophies(state);
  const total = totalTrophies(state);
  const globalPct = globalPctOf(state);
  const platGames = state.games.filter((g) => g.counts[0] > 0).length;
  const played = state.games.length;
  const recents = state.activities.filter((a) => a.kind === "trophy").slice(0, 3);
  const platinized = state.games.filter((g) => g.counts[0] > 0).slice(0, 3);

  const rows = [
    { label: "Jeux joués", value: fmtNum(played) },
    { label: "Jeux platinés", value: fmtNum(platGames) },
    { label: "Trophées obtenus", value: fmtNum(obtained), muted: `/ ${fmtNum(total)}` },
  ];

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 sm:px-8">
      <header className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-[10px]">
          <PlatinaLogo className="mt-[2px] h-[30px] w-[34px]" />
          <div>
            <h1 className="text-[24px] leading-[1.15] font-bold tracking-[-0.025em] text-white sm:text-[27px]">
              Platina
            </h1>
            <p className="mt-[1px] text-[11px] leading-none text-mut-2 sm:text-[12.5px]">
              Tes trophées, ta légende.
            </p>
          </div>
        </div>
        <button
          type="button"
          aria-label="Notifications"
          onClick={() => {
            dispatch({ type: "readNotifs" });
            open("Notifications", <ActivitySheet />);
          }}
          className="group relative mt-[6px] rounded-full p-[4px] text-white transition-colors hover:text-brand-2"
        >
          <BellIcon className="h-[21px] w-[21px] transition-transform duration-300 group-hover:-rotate-12" />
          {state.unread && (
            <span className="absolute top-[5px] right-[5px] h-[8px] w-[8px] rounded-full bg-brand-2 ring-2 ring-[var(--app-bg)]" />
          )}
        </button>
      </header>

      {played === 0 && (
        <Card className="screen-in mt-[18px] p-[16px]">
          <div className="flex flex-col gap-[12px] sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-bold text-white">Ta collection commence ici</h2>
              <p className="mt-[4px] text-[12.5px] leading-relaxed text-mut-2">
                Ajoute ton premier jeu, puis débloque ses trophées au fil de ta progression.
                Niveau, platinés et statistiques se calculeront automatiquement.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setTab("games")}
              className="flex h-[42px] shrink-0 items-center justify-center gap-[7px] rounded-[12px] bg-brand px-[18px] text-[13px] font-semibold text-white transition-all hover:bg-brand-2"
            >
              Ajouter un jeu
              <ChevronRight className="h-[13px] w-[13px]" />
            </button>
          </div>
        </Card>
      )}

      <div className="mt-[26px] grid gap-[26px] lg:grid-cols-[1.06fr_1fr] lg:items-start">
        {/* --------------------------------------------- colonne aperçu */}
        <section>
          <SectionLabel
            action={
              <LinkButton onClick={() => setTab("games")}>
                Tout voir
                <ChevronRight className="h-[11px] w-[11px]" />
              </LinkButton>
            }
          >
            Aperçu rapide
          </SectionLabel>

          <Card className="relative mt-[9px] overflow-hidden p-[16px] lg:p-[20px]">
            <div className="pointer-events-none absolute top-[6px] -left-[14px] h-[160px] w-[160px] rounded-full bg-[radial-gradient(circle,color-mix(in_srgb,var(--color-brand-2)_32%,transparent),transparent_68%)] blur-[6px]" />
            <div className="relative flex items-center gap-[14px] lg:gap-[22px]">
              <div className="relative shrink-0">
                <div className="absolute inset-0 rounded-full bg-brand/25 blur-[16px]" />
                <PlatinumBadge className="relative h-[108px] w-[108px] drop-shadow-[0_6px_18px_rgba(79,140,255,0.35)] lg:h-[128px] lg:w-[128px]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-semibold tracking-[0.16em] text-mut uppercase">Niveau</div>
                <div className="tnum -mt-[2px] text-[42px] leading-[1.05] font-bold tracking-[-0.03em] text-[#d7e3f8] lg:text-[52px]">
                  {level}
                </div>
                <div className="tnum mt-[6px] text-[13px] font-medium text-white">{pct}%</div>
                <ProgressBar key={state.xp} value={pct} className="mt-[6px]" height={6} />
                <div className="mt-[7px] flex items-baseline justify-between gap-[6px]">
                  <span className="text-[10px] text-mut">Prochain niveau : {level + 1}</span>
                  <span className="tnum text-[11px] font-semibold text-brand-2">{100 - pct} XP</span>
                </div>
              </div>
            </div>
          </Card>

          <Card className="mt-[12px] px-[6px] py-[18px]">
            <ul className="grid grid-cols-4">
              {METALS.map((m, i) => (
                <li key={m} className="group flex flex-col items-center gap-[5px]">
                  <TrophyCup
                    tone={m}
                    className="h-[30px] w-[30px] drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:-translate-y-[2px]"
                  />
                  <span className="tnum text-[16px] leading-none font-bold text-white">
                    {fmtNum(state.account[i])}
                  </span>
                  <span className="text-[10px] leading-none text-mut">{METAL_LABEL[m]}</span>
                </li>
              ))}
            </ul>
          </Card>

          <SectionLabel className="mt-[20px]">Progression globale</SectionLabel>
          <Card className="mt-[9px] flex items-center gap-[19px] p-[19px]">
            <Ring key={globalPct} value={globalPct} size={92} thickness={7.5} />
            <ul className="min-w-0 flex-1 space-y-[13px]">
              {rows.map((r) => (
                <li key={r.label}>
                  <div className="text-[11px] leading-none text-mut">{r.label}</div>
                  <div className="tnum mt-[4px] text-[15px] leading-none font-semibold text-white">
                    {r.value}
                    {r.muted && <span className="font-normal text-mut"> {r.muted}</span>}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>

        {/* --------------------------------------------- colonne activité */}
        <section>
          <SectionLabel
            action={
              <LinkButton onClick={() => open("Trophées récents", <ActivitySheet only="trophy" />)}>
                Tout voir
                <ChevronRight className="h-[11px] w-[11px]" />
              </LinkButton>
            }
          >
            Récemment obtenus
          </SectionLabel>

          <Card className="mt-[9px] overflow-hidden">
            <ul className="divide-y divide-white/[0.05]">
              {recents.map((t) => (
                <li
                  key={t.id}
                  className="group flex items-center gap-[13px] px-[11px] py-[14px] transition-colors hover:bg-white/[0.035]"
                >
                  <span className="relative h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                    <img
                      src="images/trophy-tile.jpg"
                      alt=""
                      loading="lazy"
                      style={{ filter: tintFor(t.metal) }}
                      className="h-full w-full object-cover opacity-80 transition-transform duration-500 group-hover:scale-110"
                    />
                    <span className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(255,255,255,0.16),transparent_60%)]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] leading-tight font-semibold text-white">
                      {t.title}
                    </span>
                    <span className="mt-[2px] block truncate text-[11px] leading-tight text-mut-2">{t.sub}</span>
                    <span className="mt-[2px] block text-[10px] leading-tight text-mut">{timeAgo(t.ts)}</span>
                  </span>
                  <TrophyCup
                    tone={t.metal ?? "bronze"}
                    className="h-[30px] w-[30px] shrink-0 drop-shadow-[0_3px_8px_rgba(0,0,0,0.6)] transition-transform duration-300 group-hover:scale-110"
                  />
                </li>
              ))}
              {recents.length === 0 && (
                <li className="px-[16px] py-[22px] text-center text-[12px] text-mut-2">
                  Aucun trophée récent pour l'instant.
                </li>
              )}
            </ul>
          </Card>

          <SectionLabel className="mt-[20px]">Tes platinés</SectionLabel>
          <Card className="mt-[9px] overflow-hidden">
            <ul className="divide-y divide-white/[0.05]">
              {platinized.map((g) => (
                <li key={g.id}>
                  <button
                    type="button"
                    onClick={() => open(g.title, <GameSheet gameId={g.id} />)}
                    className="group flex w-full items-center gap-[12px] px-[11px] py-[11px] text-left transition-colors hover:bg-white/[0.035]"
                  >
                    <Cover game={g} className="h-[42px] w-[42px] rounded-[9px]" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[12.5px] leading-tight font-semibold text-white">
                        {g.title}
                      </span>
                      <span className="tnum mt-[3px] block text-[10.5px] leading-none text-mut">
                        {earnedOf(g)} trophées · {progressOf(g)}%
                        {g.platDate ? ` · ${fmtDate(g.platDate)}` : ""}
                      </span>
                    </span>
                    <ChevronRight className="h-[13px] w-[13px] shrink-0 text-mut transition-transform duration-300 group-hover:translate-x-[2px] group-hover:text-white" />
                  </button>
                </li>
              ))}
              {platinized.length === 0 && (
                <li className="px-[16px] py-[22px] text-center text-[12px] text-mut-2">
                  Aucun platine pour l'instant — continue comme ça.
                </li>
              )}
            </ul>
          </Card>
        </section>
      </div>
    </div>
  );
}
