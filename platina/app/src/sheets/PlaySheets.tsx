import { useState } from "react";
import { useStore } from "../lib/store";
import { CURRENCIES, fmtDate, fmtMoney, fmtNum } from "../lib/util";
import { useSheet } from "../components/Sheet";
import { Card } from "../components/ui";
import { ActivityRow } from "../components/ActivityRow";
import { Label, OptionRow, ToggleRow, btnPrimary } from "../components/controls";

import { MinusIcon, PlusIcon } from "../lib/icons2";
import { PSPlusMark } from "../lib/icons";
import { Cover } from "../components/Cover";

export type Range = "week" | "weeks" | "months";
export const RANGE_LABEL: Record<Range, string> = {
  week: "7 derniers jours",
  weeks: "4 dernières semaines",
  months: "6 derniers mois",
};

/* ------------------------------------------------------------------ period */

export function PeriodSheet({ value, onPick }: { value: Range; onPick: (r: Range) => void }) {
  const { close } = useSheet();
  return (
    <div className="space-y-[9px] pt-[4px]">
      {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
        <OptionRow
          key={r}
          label={RANGE_LABEL[r]}
          selected={r === value}
          onClick={() => {
            onPick(r);
            close();
          }}
        />
      ))}
    </div>
  );
}

/* ----------------------------------------------------------------- session */

export function SessionSheet({ gameId }: { gameId?: string }) {
  const { state, dispatch } = useStore();
  const { close, toast } = useSheet();
  const [id, setId] = useState(gameId ?? state.games.find((g) => g.counts[0] === 0)?.id ?? state.games[0]?.id ?? "");
  const [hours, setHours] = useState(1);

  if (state.games.length === 0) {
    return <p className="py-[20px] text-[13px] text-mut-2">Ajoute d'abord un jeu à ta bibliothèque.</p>;
  }

  return (
    <div className="pt-[4px]">
      <Label>Jeu</Label>
      <div className="no-bar -mx-[18px] flex gap-[10px] overflow-x-auto px-[18px] pb-[4px]">
        {state.games.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => setId(g.id)}
            aria-pressed={g.id === id}
            className={`group w-[84px] shrink-0 rounded-[13px] border p-[6px] text-left transition-all ${
              g.id === id ? "border-brand/70 bg-brand/[0.14]" : "border-white/[0.07] bg-white/[0.03] hover:border-white/20"
            }`}
          >
            <Cover game={g} className="aspect-square w-full rounded-[9px]" />
            <span className="mt-[6px] line-clamp-2 block text-[10.5px] leading-tight font-medium text-white">
              {g.title}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-[18px]">
        <Label>Durée</Label>
        <div className="flex items-center justify-between rounded-[14px] border border-white/10 bg-white/[0.04] p-[8px]">
          <button
            type="button"
            aria-label="Moins"
            onClick={() => setHours((h) => Math.max(0.5, h - 0.5))}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-white/[0.06] text-white transition-colors hover:bg-white/15"
          >
            <MinusIcon />
          </button>
          <div className="text-center">
            <div className="tnum text-[28px] font-bold leading-none tracking-[-0.02em] text-white">
              {fmtNum(hours, 1)} <span className="text-[16px] font-semibold text-mut-2">h</span>
            </div>
          </div>
          <button
            type="button"
            aria-label="Plus"
            onClick={() => setHours((h) => Math.min(12, h + 0.5))}
            className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] bg-white/[0.06] text-white transition-colors hover:bg-white/15"
          >
            <PlusIcon />
          </button>
        </div>
      </div>

      <button
        type="button"
        className={`${btnPrimary} mt-[20px]`}
        onClick={() => {
          dispatch({ type: "session", gameId: id, hours });
          toast(`Session enregistrée · +${fmtNum(hours, 1)} h`);
          close();
        }}
      >
        Enregistrer la session
      </button>
    </div>
  );
}

/* ----------------------------------------------------------------- history */

export function HistorySheet() {
  const { state, dispatch } = useStore();
  const { toast } = useSheet();
  const cur = state.settings.currency;
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");

  const purchases = state.activities.filter((a) => a.kind === "purchase");
  const value = Number(price.replace(",", "."));
  const valid = title.trim().length > 1 && Number.isFinite(value) && value > 0;

  return (
    <div className="pt-[4px]">
      <Card className="p-[14px]">
        <div className="text-[11px] font-semibold tracking-[0.06em] text-mut uppercase">Ajouter un achat</div>
        <input
          className="field mt-[10px]"
          placeholder="Nom du jeu ou du contenu"
          value={title}
          maxLength={60}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="mt-[9px] flex gap-[9px]">
          <input
            className="field"
            placeholder={`Prix (${CURRENCIES[cur].symbol})`}
            inputMode="decimal"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <button
            type="button"
            disabled={!valid}
            onClick={() => {
              dispatch({ type: "purchase", title: title.trim(), amount: value / CURRENCIES[cur].rate });
              toast("Achat ajouté");
              setTitle("");
              setPrice("");
            }}
            className="h-[44px] shrink-0 rounded-[12px] bg-brand px-[18px] text-[13px] font-semibold text-white transition-all hover:bg-brand-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>
      </Card>

      <div className="mt-[16px] mb-[6px] flex items-baseline justify-between">
        <span className="text-[11px] font-semibold tracking-[0.06em] text-mut uppercase">
          Derniers achats
        </span>
        <span className="tnum text-[11px] text-mut-2">{state.spend.transactions} transactions</span>
      </div>
      <Card className="divide-y divide-white/[0.05] overflow-hidden">
        {purchases.map((a) => (
          <ActivityRow key={a.id} a={a} />
        ))}
      </Card>
      <p className="mt-[12px] text-[11.5px] text-mut">
        Total dépensé : {fmtMoney(state.spend.total, cur).text}
      </p>
    </div>
  );
}

/* -------------------------------------------------------------------- plus */

const PLANS: { id: string; label: string; price: number }[] = [
  { id: "Essential", label: "PlayStation Plus Essential", price: 8.99 },
  { id: "Extra", label: "PlayStation Plus Extra", price: 13.99 },
  { id: "Premium", label: "PlayStation Plus Premium", price: 16.99 },
];

export function PlusSheet() {
  const { state, dispatch } = useStore();
  const { toast } = useSheet();
  const cur = state.settings.currency;
  const { plan, next, auto } = state.plus;
  const current = PLANS.find((p) => p.id === plan) ?? null;

  return (
    <div className="pt-[4px]">
      <Card className="flex items-center gap-[14px] p-[16px]">
        <PSPlusMark className="h-[48px] w-[48px] shrink-0 drop-shadow-[0_4px_14px_rgba(240,169,12,0.4)]" />
        <div className="min-w-0 flex-1">
          <div className="text-[16px] font-bold text-white">
            {current ? current.label : "Aucun abonnement"}
          </div>
          <div className="mt-[3px] text-[12px] text-mut-2">
            {current ? `${fmtMoney(current.price, cur).text} / mois` : "Choisis une formule ci-dessous"}
          </div>
        </div>
      </Card>

      <Label >Formule</Label>
      <div className="space-y-[9px]">
        {PLANS.map((p) => (
          <OptionRow
            key={p.id}
            label={p.label.replace("PlayStation Plus ", "")}
            sub={`${fmtMoney(p.price, cur).text} / mois`}
            selected={plan === p.id}
            onClick={() => {
              const n = new Date();
              n.setMonth(n.getMonth() + 1);
              dispatch({ type: "plusSet", plan: p.id, next: n.getTime(), auto });
              toast(`${p.label.replace("PlayStation Plus ", "")} activé`);
            }}
          />
        ))}
        <OptionRow
          label="Aucun abonnement"
          sub="Supprime l'abonnement de ton profil."
          selected={plan === null}
          onClick={() => dispatch({ type: "plusSet", plan: null, next: null, auto: false })}
        />
      </div>

      {current && (
        <Card className="mt-[14px] divide-y divide-white/[0.05] px-[14px]">
          <div className="flex items-center justify-between py-[13px]">
            <span className="text-[13px] text-mut-2">
              {auto ? "Prochain paiement" : "Se termine le"}
            </span>
            <span className="tnum text-[13px] font-semibold text-white">
              {next ? fmtDate(next) : "—"}
            </span>
          </div>
          <ToggleRow
            title="Renouvellement automatique"
            sub="Désactive-le pour ne pas être prélevé à la prochaine échéance."
            checked={auto}
            onChange={(v) => dispatch({ type: "plusSet", plan, next, auto: v })}
          />
        </Card>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- activity */

export function ActivitySheet({ only }: { only?: "trophy" }) {
  const { state } = useStore();
  const list = only ? state.activities.filter((a) => a.kind === only) : state.activities;
  return (
    <div className="pt-[4px]">
      {list.length === 0 ? (
        <p className="py-[24px] text-center text-[13px] text-mut-2">Rien à afficher pour le moment.</p>
      ) : (
        <Card className="divide-y divide-white/[0.05] overflow-hidden">
          {list.map((a) => (
            <ActivityRow key={a.id} a={a} />
          ))}
        </Card>
      )}
    </div>
  );
}

