import type { Activity } from "../lib/store";
import { useStore } from "../lib/store";
import { fmtMoney, fmtNum, tintFor, timeAgo } from "../lib/util";
import { CartIcon, GamepadTabIcon, TrophyCup } from "../lib/icons";

export function ActivityRow({ a }: { a: Activity }) {
  const { state } = useStore();

  if (a.kind === "trophy") {
    return (
      <div className="group flex items-center gap-[12px] p-[12px]">
        <span className="relative h-[42px] w-[42px] shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
          <img
            src="images/trophy-tile.jpg"
            alt=""
            loading="lazy"
            style={{ filter: tintFor(a.metal) }}
            className="h-full w-full object-cover opacity-85"
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[10px] leading-tight text-mut">Trophée obtenu</span>
          <span className="mt-[3px] block truncate text-[12.5px] font-semibold leading-tight text-white">
            {a.title}
          </span>
          <span className="mt-[2px] block truncate text-[11px] leading-tight text-mut-2">{a.sub}</span>
          <span className="mt-[2px] block text-[10px] leading-tight text-mut">{timeAgo(a.ts)}</span>
        </span>
        <TrophyCup tone={a.metal ?? "bronze"} className="h-[28px] w-[28px] shrink-0" />
      </div>
    );
  }

  const isPurchase = a.kind === "purchase";
  return (
    <div className="flex items-center gap-[12px] p-[12px]">
      <span className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border border-white/[0.09] bg-white/[0.05] text-white/85">
        {isPurchase ? <CartIcon className="h-[18px] w-[18px]" /> : <GamepadTabIcon className="h-[19px] w-[19px]" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] leading-tight text-mut">{isPurchase ? "Achat" : "Session de jeu"}</span>
        <span className="mt-[3px] block truncate text-[12.5px] font-semibold leading-tight text-white">
          {a.title}
        </span>
        <span className="mt-[3px] block text-[10px] leading-tight text-mut">{timeAgo(a.ts)}</span>
      </span>
      <span className="tnum shrink-0 text-[12px] font-medium text-white">
        {isPurchase
          ? `− ${fmtMoney(a.amount ?? 0, state.settings.currency).text}`
          : `+ ${fmtNum(a.hours ?? 0, 1)} h`}
      </span>
    </div>
  );
}
