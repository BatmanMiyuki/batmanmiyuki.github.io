import { useEffect, useState, type CSSProperties } from "react";
import { cn } from "../utils/cn";
import { PlatinaLogo } from "../lib/icons";
import type { ScreenId } from "../lib/data";
import { NavCtx } from "../lib/nav";
import { useStore } from "../lib/store";
import { SheetProvider, useSheet } from "./Sheet";
import { SCREENS, TABS } from "../lib/screens";
import { ACCENTS, ProfileSheet } from "../sheets/SettingsSheets";
import { useInstall } from "../lib/pwa";
import { DownloadIcon } from "../lib/icons2";
import Welcome from "../screens/Welcome";

function isTab(v: string | null): v is ScreenId {
  return v === "stats" || v === "games" || v === "play" || v === "settings";
}

function ProfileButton({ compact = false }: { compact?: boolean }) {
  const { state } = useStore();
  const { open } = useSheet();
  return (
    <button
      type="button"
      aria-label="Modifier le profil"
      onClick={() => open("Modifier le profil", <ProfileSheet />)}
      className={cn(
        "group flex items-center gap-[11px] border border-white/[0.07] bg-white/[0.03] transition-all duration-200 hover:border-white/20 hover:bg-white/[0.06]",
        compact
          ? "h-[38px] w-[38px] justify-center overflow-hidden rounded-full p-0"
          : "w-full rounded-[14px] p-[10px]",
      )}
    >
      <img
        src="images/avatar.jpg"
        alt=""
        className="h-[38px] w-[38px] shrink-0 rounded-full object-cover ring-1 ring-white/15"
      />
      {!compact && (
        <>
          <span className="min-w-0 flex-1 text-left">
            <span className="block truncate text-[13px] font-semibold text-white">
              {state.profile.name}
            </span>
            <span className="block truncate text-[11px] text-mut-2">@{state.profile.handle}</span>
          </span>
          <span className="text-[10px] font-medium text-brand-2 opacity-0 transition-opacity group-hover:opacity-100">
            Modifier
          </span>
        </>
      )}
    </button>
  );
}

function TabBar({ active, onNavigate }: { active: ScreenId; onNavigate: (id: ScreenId) => void }) {
  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.07] bg-[color-mix(in_srgb,var(--app-bg)_92%,transparent)] pt-[9px] pb-[max(env(safe-area-inset-bottom),14px)] backdrop-blur-xl md:hidden"
    >
      <ul className="mx-auto flex max-w-[560px] items-start justify-around px-[6px]">
        {TABS.map(({ id, label, Icon }) => {
          const on = active === id;
          return (
            <li key={id} className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onNavigate(id)}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "group mx-auto flex w-full max-w-[92px] flex-col items-center gap-[5px] rounded-xl py-[3px] transition-colors duration-200",
                  on ? "text-brand-2" : "text-mut hover:text-white/75",
                )}
              >
                <span className="relative flex h-[24px] items-center justify-center">
                  <Icon
                    className={cn(
                      "h-[22px] w-[22px] transition-transform duration-300 group-active:scale-90",
                      on ? "scale-100" : "scale-[0.96]",
                    )}
                  />
                  {on && (
                    <span className="pointer-events-none absolute -inset-2 -z-10 rounded-full bg-brand/25 blur-[10px]" />
                  )}
                </span>
                <span className={cn("text-[10.5px] leading-none", on ? "font-semibold" : "font-medium")}>
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

function AppBody() {
  const { available: installable, install: installApp } = useInstall();
  const [tab, setTab] = useState<ScreenId>(() => {
    try {
      const v = localStorage.getItem("platina:tab");
      return isTab(v) ? v : "stats";
    } catch {
      return "stats";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("platina:tab", tab);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  }, [tab]);

  const Active = SCREENS[tab];

  return (
    <NavCtx.Provider value={{ tab, setTab }}>
      <div className="flex min-h-dvh">
        {/* -------------------------------------------- barre latérale */}
        <aside className="sticky top-0 hidden h-dvh w-[252px] shrink-0 flex-col border-r border-white/[0.07] bg-[color-mix(in_srgb,var(--app-bg)_88%,transparent)] px-[18px] py-[26px] backdrop-blur-xl md:flex">
          <a href="#/" className="group flex items-center gap-[10px] px-[6px]">
            <PlatinaLogo className="h-[28px] w-[31px] transition-transform duration-500 group-hover:rotate-[-6deg]" />
            <span className="text-[19px] font-bold tracking-[-0.03em] text-white">Platina</span>
          </a>

          <nav className="mt-[30px] space-y-[4px]" aria-label="Sections">
            {TABS.map(({ id, label, Icon }) => {
              const on = tab === id;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  aria-current={on ? "page" : undefined}
                  className={cn(
                    "group relative flex w-full items-center gap-[12px] rounded-[13px] px-[13px] py-[11px] text-[14px] transition-all duration-200",
                    on
                      ? "bg-brand/[0.14] font-semibold text-white"
                      : "font-medium text-mut-2 hover:bg-white/[0.05] hover:text-white",
                  )}
                >
                  {on && (
                    <span className="absolute top-1/2 -left-[18px] h-[22px] w-[3px] -translate-y-1/2 rounded-full bg-brand-2 shadow-[0_0_12px_2px_var(--color-brand-2)]" />
                  )}
                  <Icon
                    className={cn(
                      "h-[19px] w-[19px] transition-colors",
                      on ? "text-brand-2" : "text-mut group-hover:text-white/80",
                    )}
                  />
                  {label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto space-y-[12px]">
            {installable && (
              <button
                type="button"
                onClick={() => void installApp()}
                className="flex w-full items-center gap-[9px] rounded-[13px] border border-brand/40 bg-brand/[0.12] px-[13px] py-[10px] text-[12.5px] font-semibold text-white transition-colors hover:border-brand/70 hover:bg-brand/[0.2]"
              >
                <DownloadIcon className="h-[15px] w-[15px]" />
                Installer l'application
              </button>
            )}
            <a
              href="#/"
              className="flex items-center gap-[9px] rounded-[13px] border border-white/[0.07] px-[13px] py-[10px] text-[12.5px] font-medium text-mut-2 transition-colors hover:border-white/20 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-[15px] w-[15px]" fill="none" aria-hidden="true">
                <path
                  d="M15 5.5 8.5 12l6.5 6.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Retour au site
            </a>
            <ProfileButton />
          </div>
        </aside>

        {/* ---------------------------------------------------- contenu */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-40 flex h-[62px] items-center justify-between border-b border-white/[0.07] bg-[color-mix(in_srgb,var(--app-bg)_92%,transparent)] px-[18px] backdrop-blur-xl md:hidden">
            <a href="#/" className="flex items-center gap-[9px]">
              <PlatinaLogo className="h-[25px] w-[28px]" />
              <span className="text-[18px] font-bold tracking-[-0.03em]">Platina</span>
            </a>
            <ProfileButton compact />
          </header>

          <main className="min-w-0 flex-1 pb-[104px] pt-[18px] md:pb-[56px] md:pt-[34px]">
            <div key={tab} className="screen-in">
              <Active />
            </div>
          </main>
        </div>

        <TabBar active={tab} onNavigate={setTab} />
      </div>
    </NavCtx.Provider>
  );
}

export default function Shell() {
  const { state } = useStore();
  const accent = ACCENTS[state.settings.accent];
  const vars = {
    "--color-brand": accent.a,
    "--color-brand-2": accent.b,
  } as CSSProperties;

  return (
    <SheetProvider>
      <div
        data-theme={state.settings.theme}
        style={vars}
        className="relative min-h-dvh bg-[var(--app-bg)] text-white transition-colors duration-500"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0"
          style={{
            background:
              "radial-gradient(900px 520px at 12% -10%, color-mix(in srgb,var(--color-brand) 16%,transparent), transparent 62%), radial-gradient(900px 560px at 90% 110%, color-mix(in srgb,var(--color-brand-2) 13%,transparent), transparent 65%)",
          }}
        />
        <div className="relative">{state.loggedIn ? <AppBody /> : <Welcome />}</div>
      </div>
    </SheetProvider>
  );
}
