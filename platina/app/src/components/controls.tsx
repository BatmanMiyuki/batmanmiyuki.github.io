import type { ReactNode } from "react";
import { cn } from "../utils/cn";
import { CheckIcon } from "../lib/icons2";

export const btnPrimary =
  "flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[13px] bg-brand text-[14px] font-semibold text-white shadow-[0_0_24px_-8px_var(--color-brand)] transition-all duration-200 hover:bg-brand-2 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none";

export const btnGhost =
  "flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[13px] border border-white/10 bg-white/[0.04] text-[14px] font-semibold text-white transition-all duration-200 hover:border-white/25 hover:bg-white/[0.08] active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-40";

export const btnDanger =
  "flex h-[46px] w-full items-center justify-center gap-[8px] rounded-[13px] border border-[#e5484d]/35 bg-[#e5484d]/[0.12] text-[14px] font-semibold text-[#ff6166] transition-all duration-200 hover:bg-[#e5484d]/[0.22] active:scale-[0.985]";

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-[26px] w-[44px] shrink-0 rounded-full transition-colors duration-300",
        checked ? "bg-brand" : "bg-white/15",
      )}
    >
      <span
        className={cn(
          "absolute top-[3px] left-[3px] h-[20px] w-[20px] rounded-full bg-white shadow-md transition-transform duration-300",
          checked && "translate-x-[18px]",
        )}
      />
    </button>
  );
}

export function ToggleRow({
  title,
  sub,
  checked,
  onChange,
}: {
  title: string;
  sub?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-[14px] py-[13px]">
      <div className="min-w-0 flex-1">
        <div className="text-[14px] font-semibold text-white">{title}</div>
        {sub && <div className="mt-[3px] text-[12px] leading-snug text-mut-2">{sub}</div>}
      </div>
      <Switch checked={checked} onChange={onChange} label={title} />
    </div>
  );
}

export function OptionRow({
  label,
  sub,
  selected,
  disabled,
  leading,
  onClick,
}: {
  label: string;
  sub?: string;
  selected?: boolean;
  disabled?: boolean;
  leading?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-pressed={selected}
      className={cn(
        "flex w-full items-center gap-[12px] rounded-[13px] border px-[14px] py-[12px] text-left transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        selected
          ? "border-brand/60 bg-brand/[0.12]"
          : "border-white/[0.07] bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]",
      )}
    >
      {leading}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-semibold text-white">{label}</span>
        {sub && <span className="mt-[2px] block text-[12px] text-mut-2">{sub}</span>}
      </span>
      {selected && <CheckIcon className="h-[18px] w-[18px] text-brand-2" />}
    </button>
  );
}

export function Label({ children }: { children: ReactNode }) {
  return (
    <label className="mb-[7px] block text-[11px] font-semibold tracking-[0.06em] text-mut uppercase">
      {children}
    </label>
  );
}
