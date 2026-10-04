import { useState } from "react";
import { Card, LinkButton, SectionLabel, useInView } from "../components/ui";
import { ActivityRow } from "../components/ActivityRow";
import { ChevronDown, ChevronRight, GearIcon, PSPlusMark, PSStoreIcon } from "../lib/icons";
import { ClockIcon, PlusIcon } from "../lib/icons2";
import { useStore, type State } from "../lib/store";
import { fmtDate, fmtMoney, fmtNum } from "../lib/util";
import { useSheet } from "../components/Sheet";
import { useNav } from "../lib/nav";
import {
  ActivitySheet,
  HistorySheet,
  PeriodSheet,
  PlusSheet,
  RANGE_LABEL,
  SessionSheet,
  type Range,
} from "../sheets/PlaySheets";
import { cn } from "../utils/cn";

const PLOT_H = 92;
const DAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const FULL_DAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type Point = { label: string; value: number };

function series(s: State, range: Range): Point[] {
  if (range === "week") return s.days.map((v, i) => ({ label: DAYS[i], value: v }));
  if (range === "weeks") {
    const cur = s.days.reduce((a, b) => a + b, 0);
    return [...s.prevWeeks, cur].map((v, i, a) => ({
      label: i === a.length - 1 ? "Cette sem." : `S-${a.length - 1 - i}`,
      value: Math.round(v * 10) / 10,
    }));
  }
  const now = new Date();
  return [...s.prevMonths, s.monthHours].map((v, i, a) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (a.length - 1 - i), 1);
    return {
      label: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      value: Math.round(v * 10) / 10,
    };
  });
}

function Chart({ data }: { data: Point[] }) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const [sel, setSel] = useState<number | null>(null);
  const max = Math.max(4, Math.ceil(Math.max(...data.map((d) => d.value)) / 4) * 4);
  const ticks = [1, 0.75, 0.5, 0.25, 0].map((k) => Math.round(max * k));

  const empty = data.every((d) => d.value <= 0);

  return (
    <div ref={ref} className="mt-[18px]">
      {empty && (
        <p className="mb-[10px] rounded-[10px] border border-dashed border-white/10 px-[11px] py-[8px] text-[11px] text-mut-2">
          Aucune session sur cette période. Enregistre ta première session pour voir le graphique se remplir.
        </p>
      )}
      <div className="flex gap-[8px]">
      <ul className="flex flex-col justify-between pt-[1px]" style={{ height: PLOT_H }} aria-hidden="true">
        {ticks.map((t) => (
          <li key={t} className="tnum text-[8.5px] leading-none text-mut">
            {t}h
          </li>
        ))}
      </ul>
      <div className="min-w-0 flex-1">
        <ul
          className="flex items-end justify-between gap-[9px]"
          style={{ height: PLOT_H }}
          onMouseLeave={() => setSel(null)}
        >
          {data.map((d, i) => {
            const h = (d.value / max) * PLOT_H;
            const on = sel === i;
            return (
              <li key={d.label} className="relative flex h-full flex-1 items-end">
                <button
                  type="button"
                  aria-label={`${d.label} : ${fmtNum(d.value, 1)} heures`}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => setSel(on ? null : i)}
                  className="flex h-full w-full items-end"
                >
                  <span
                    className="w-full rounded-t-[4px] transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                    style={{
                      height: inView ? h : 0,
                      transitionDelay: `${i * 60}ms`,
                      background:
                        "linear-gradient(180deg,var(--color-brand-2),var(--color-brand) 55%,color-mix(in srgb,var(--color-brand) 70%,#000))",
                      boxShadow: on ? "0 0 16px var(--color-brand-2)" : "0 0 0 transparent",
                      opacity: sel !== null && !on ? 0.55 : 1,
                    }}
                  />
                </button>
                <span
                  className={cn(
                    "tnum pointer-events-none absolute -top-[4px] left-1/2 -translate-x-1/2 rounded-[4px] bg-white px-[4px] py-[1px] text-[8.5px] leading-none font-semibold whitespace-nowrap text-black transition-opacity duration-200",
                    on ? "opacity-100" : "opacity-0",
                  )}
                >
                  {fmtNum(d.value, 1)}h
                </span>
              </li>
            );
          })}
        </ul>
        <ul className="mt-[6px] flex justify-between gap-[9px]">
          {data.map((d) => (
            <li key={d.label} className="flex-1 truncate text-center text-[8.5px] leading-none text-mut">
              {d.label}
            </li>
          ))}
        </ul>
        </div>
      </div>
    </div>
  );
}

function Money({ eur, big, small }: { eur: number; big: string; small: string }) {
  const { state } = useStore();
  const m = fmtMoney(eur, state.settings.currency);
  return (
    <span className="tnum">
      <span className={big}>
        {m.symbol}
        {m.int}
      </span>
      <span className={small}>,{m.dec}</span>
    </span>
  );
}

export default function PlayScreen() {
  const { state } = useStore();
  const { open } = useSheet();
  const { setTab } = useNav();
  const [range, setRange] = useState<Range>("week");

  const cur = state.settings.currency;
  const data = series(state, range);
  const best = state.days.indexOf(Math.max(...state.days));
  const diffGames = state.games.length;
  const feed = state.activities.slice(0, 3);

  return (
    <div className="mx-auto w-full max-w-[1180px] px-5 pb-16 sm:px-8">
      <header className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[27px] leading-none font-bold tracking-[-0.03em] text-white sm:text-[32px]">
            Play
          </h1>
          <p className="mt-[7px] text-[11.5px] leading-none text-mut-2 sm:text-[13px]">
            Statistiques de ta PlayStation
          </p>
        </div>
        <div className="flex shrink-0 items-start gap-[10px]">
          <div className="pointer-events-none relative -mr-[10px] w-[122px] md:w-[168px]">
            <div className="absolute inset-x-[6px] top-[10px] h-[92px] rounded-full bg-[radial-gradient(circle,rgba(120,170,255,0.28),transparent_68%)] blur-[10px]" />
            <img src="images/ps5.png" alt="" className="relative w-full mix-blend-screen" />
          </div>
          <button
            type="button"
            aria-label="Paramètres"
            onClick={() => setTab("settings")}
            className="mt-[2px] text-white/90 transition-colors hover:text-brand-2"
          >
            <GearIcon className="h-[21px] w-[21px]" />
          </button>
        </div>
      </header>

      <div className="mt-[20px] grid gap-[26px] lg:grid-cols-[1.18fr_1fr] lg:items-start">
        {/* ------------------------------------------- temps de jeu */}
        <section>
          <SectionLabel>Temps de jeu</SectionLabel>

          <div className="relative mt-[9px]">
            <Card
              className="p-[15px] pb-[16px]"
              style={{ clipPath: "polygon(0 0, 60% 0, 100% 27%, 100% 100%, 0 100%)" }}
            >
              <div className="flex items-start justify-between pr-[6px]">
                <div>
                  <div className="text-[11px] leading-none text-mut-2">Temps de jeu total</div>
                  <div className="tnum mt-[5px] text-[27px] leading-none font-bold tracking-[-0.02em] text-white">
                    {fmtNum(state.totalHours, 1)} h
                  </div>
                  <div className="mt-[6px] text-[11px] leading-none text-mut-2">
                    Soit {Math.round(state.totalHours / 24)} jours
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => open("Période", <PeriodSheet value={range} onPick={setRange} />)}
                  className="mt-[48px] flex shrink-0 items-center gap-[4px] rounded-[7px] border border-white/[0.12] bg-white/[0.05] px-[8px] py-[5px] text-[10px] font-medium text-white/90 transition-colors hover:border-white/25 hover:bg-white/[0.1]"
                >
                  {range === "week"
                    ? "7 derniers jours"
                    : RANGE_LABEL[range].replace("dernières ", "").replace("derniers ", "")}
                  <ChevronDown className="h-[10px] w-[10px]" />
                </button>
              </div>
              <Chart key={range} data={data} />
            </Card>
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <line
                x1="60"
                y1="0"
                x2="100"
                y2="27"
                stroke="rgba(255,255,255,0.14)"
                strokeWidth="1"
                vectorEffect="non-scaling-stroke"
              />
            </svg>
          </div>

          <ul className="mt-[11px] grid grid-cols-3 gap-[8px]">
            {[
              { label: "Sessions", value: fmtNum(state.sessions), accent: false, small: false },
              { label: "Jeux différents", value: fmtNum(diffGames), accent: true, small: false },
              { label: "Jour le plus actif", value: FULL_DAYS[best], accent: false, small: true },
            ].map((s) => (
              <li key={s.label}>
                <Card className="flex h-[70px] flex-col justify-between px-[11px] py-[11px]">
                  <div className={cn("text-[10px] leading-tight", s.accent ? "text-brand-2" : "text-mut")}>
                    {s.label}
                  </div>
                  <div
                    className={cn(
                      "tnum truncate text-white",
                      s.small
                        ? "text-[14.5px] leading-none font-semibold"
                        : "text-[20px] leading-none font-bold",
                    )}
                  >
                    {s.value}
                  </div>
                </Card>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => open("Enregistrer une session", <SessionSheet />)}
            className="mt-[11px] flex h-[44px] w-full items-center justify-center gap-[8px] rounded-[13px] border border-brand/40 bg-brand/[0.12] text-[13px] font-semibold text-white transition-all duration-200 hover:border-brand/70 hover:bg-brand/[0.2] active:scale-[0.99]"
          >
            <ClockIcon className="h-[16px] w-[16px] text-brand-2" />
            Enregistrer une session de jeu
          </button>
        </section>

        {/* --------------------------------- dépenses, abonnements, activité */}
        <section>
          <SectionLabel>Dépenses</SectionLabel>
          <div className="mt-[9px] grid grid-cols-[1.72fr_1fr] gap-[9px]">
            <Card className="relative overflow-hidden p-[13px]">
              <div className="text-[10.5px] leading-tight text-brand-2">Total dépensé sur le PS Store</div>
              <div className="mt-[8px] leading-none font-bold tracking-[-0.02em] text-white">
                <Money eur={state.spend.total} big="text-[24px]" small="text-[17px]" />
              </div>
              <div className="mt-[8px] text-[10.5px] leading-none text-mut-2">
                Cette année : {fmtMoney(state.spend.year, cur).text}
              </div>
              <span className="absolute top-[13px] right-[12px] text-brand-2">
                <PSStoreIcon className="h-[26px] w-[26px]" />
              </span>
            </Card>
            <Card className="p-[13px]">
              <div className="text-[10.5px] leading-tight text-brand-2">Transactions</div>
              <div className="tnum mt-[8px] text-[24px] leading-none font-bold text-white">
                {state.spend.transactions}
              </div>
              <button
                type="button"
                onClick={() => open("Historique des achats", <HistorySheet />)}
                className="mt-[9px] flex items-center gap-[2px] text-[10.5px] leading-none font-medium text-brand-2 transition-colors hover:text-white"
              >
                Voir l'historique
                <ChevronRight className="h-[9px] w-[9px]" />
              </button>
            </Card>
          </div>

          <SectionLabel className="mt-[20px]">Abonnements</SectionLabel>
          <button
            type="button"
            onClick={() => open("PlayStation Plus", <PlusSheet />)}
            className="group mt-[9px] block w-full text-left"
          >
            <Card className="flex items-center gap-[11px] p-[11px] transition-all duration-300 group-hover:border-white/20 group-active:scale-[0.99]">
              <span className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[9px] border border-white/[0.08] bg-white/[0.05] text-mut-2">
                <PlusIcon className="h-[17px] w-[17px]" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[13px] leading-tight font-semibold text-white">
                  PlayStation Plus Extra
                </span>
                <span className="mt-[4px] block truncate text-[11px] leading-tight text-mut-2">
                  {state.plus.plan
                    ? `${state.plus.auto ? "Prochain paiement" : "Se termine le"} : ${
                        state.plus.next ? fmtDate(state.plus.next) : "—"
                      }`
                    : "Aucun abonnement · touche pour choisir"}
                </span>
              </span>
              <PSPlusMark className="h-[32px] w-[32px] shrink-0 drop-shadow-[0_3px_8px_rgba(240,169,12,0.35)] transition-transform duration-300 group-hover:scale-110" />
            </Card>
          </button>

          <SectionLabel
            className="mt-[20px]"
            action={
              <LinkButton onClick={() => open("Activité récente", <ActivitySheet />)}>
                Tout voir
              </LinkButton>
            }
          >
            Activité récente
          </SectionLabel>
          <div className="mt-[9px] space-y-[9px]">
            {feed.map((a) => (
              <Card key={a.id}>
                <ActivityRow a={a} />
              </Card>
            ))}
            {feed.length === 0 && (
              <Card className="px-[16px] py-[22px] text-center text-[12px] text-mut-2">
                Aucune activité récente.
              </Card>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
