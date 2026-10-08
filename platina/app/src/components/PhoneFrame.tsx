import { useEffect, useRef, useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { BatteryIcon, CellularIcon, WifiIcon } from "../lib/icons";
import { TABS } from "../lib/screens";
import type { ScreenId } from "../lib/data";

export const PHONE_W = 360;
export const PHONE_H = 1024;

function useScale(designWidth: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / designWidth);
    update();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [designWidth]);

  return { ref, scale };
}

function StatusBar() {
  return (
    <div className="absolute inset-x-0 top-0 z-30 flex h-[46px] items-center justify-between px-[24px] text-white">
      <span className="tnum text-[15px] font-semibold tracking-[-0.01em]">9:41</span>
      <div className="flex items-center gap-[6px]">
        <CellularIcon className="h-[11px] w-[18px]" />
        <WifiIcon className="h-[12px] w-[17px]" />
        <BatteryIcon className="h-[12px] w-[26px]" />
      </div>
    </div>
  );
}

function TabBar({
  active,
  onNavigate,
}: {
  active: ScreenId;
  onNavigate: (id: ScreenId) => void;
}) {
  return (
    <nav
      aria-label="Navigation de la maquette"
      className="absolute inset-x-0 bottom-0 z-30 border-t border-white/[0.06] bg-[#05070a]/95 pt-[11px] pb-[38px] backdrop-blur-xl"
    >
      <ul className="flex items-start justify-around px-[6px]">
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <li key={id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "group mx-auto flex w-full max-w-[76px] flex-col items-center gap-[5px] rounded-xl py-[3px] transition-colors duration-200",
                  on ? "text-brand-2" : "text-mut hover:text-white/75",
                )}
              >
                <span className="relative flex h-[22px] items-center justify-center">
                  <Icon
                    className={cn(
                      "h-[21px] w-[21px] transition-transform duration-300 group-active:scale-90",
                      on ? "scale-100" : "scale-[0.96]",
                    )}
                  />
                  {on && (
                    <span className="pointer-events-none absolute -inset-2 -z-10 rounded-full bg-brand/25 blur-[10px]" />
                  )}
                </span>
                <span className={cn("text-[10px] leading-none", on ? "font-semibold" : "font-medium")}>
                  {label}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Aperçu d'écran d'application dans un châssis de téléphone (maquette). */
export function PhoneFrame({
  active,
  onNavigate,
  children,
}: {
  active: ScreenId;
  onNavigate: (id: ScreenId) => void;
  children: ReactNode;
}) {
  const { ref, scale } = useScale(PHONE_W);

  return (
    <div
      ref={ref}
      className="relative w-full select-none"
      style={{ aspectRatio: `${PHONE_W} / ${PHONE_H}` }}
    >
      <div
        style={{ width: PHONE_W, height: PHONE_H, transform: `scale(${scale})`, transformOrigin: "top left" }}
        className="absolute left-0 top-0"
      >
        <div className="relative h-full w-full rounded-[46px] bg-[#0a0a0c] p-[3px] shadow-[0_40px_90px_-30px_rgba(0,0,0,0.95),0_0_0_1px_rgba(255,255,255,0.06)]">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-[46px] bg-[linear-gradient(150deg,rgba(255,255,255,0.12),transparent_35%,transparent_65%,rgba(79,140,255,0.14))]"
          />
          <div className="relative h-full w-full overflow-hidden rounded-[43px] bg-black">
            <StatusBar />
            <div className="no-bar absolute inset-x-0 top-[46px] bottom-[88px] overflow-hidden">
              <div key={active} className="screen-in pointer-events-none h-full overflow-hidden">
                {children}
              </div>
            </div>
            <TabBar active={active} onNavigate={onNavigate} />
          </div>
        </div>
      </div>
    </div>
  );
}
