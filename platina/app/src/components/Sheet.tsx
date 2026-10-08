import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CloseIcon } from "../lib/icons2";

type SheetApi = {
  open: (title: string, content: ReactNode) => void;
  close: () => void;
  toast: (msg: string) => void;
};

const Ctx = createContext<SheetApi | null>(null);

export function useSheet() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSheet must be used inside SheetProvider");
  return c;
}

export function SheetProvider({ children }: { children: ReactNode }) {
  const [sheet, setSheet] = useState<{ title: string; content: ReactNode } | null>(null);
  const [shown, setShown] = useState(false);
  const [toastMsg, setToastMsg] = useState<{ id: number; msg: string } | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const toastTimer = useRef<number | undefined>(undefined);

  const open = useCallback((title: string, content: ReactNode) => {
    window.clearTimeout(closeTimer.current);
    setSheet({ title, content });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => setShown(true)));
  }, []);

  const close = useCallback(() => {
    setShown(false);
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setSheet(null), 320);
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg({ id: Date.now(), msg });
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToastMsg(null), 2600);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet, close]);

  const api = useMemo(() => ({ open, close, toast }), [open, close, toast]);

  return (
    <Ctx.Provider value={api}>
      {children}

      {sheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={sheet.title}
          className="fixed inset-0 z-[90]"
        >
          <button
            type="button"
            aria-label="Fermer"
            onClick={close}
            className={`absolute inset-0 bg-black/70 backdrop-blur-[2px] transition-opacity duration-300 ${
              shown ? "opacity-100" : "opacity-0"
            }`}
          />
          <div
            className={`absolute inset-x-0 bottom-0 flex max-h-[92%] flex-col rounded-t-[26px] border-t border-white/10 bg-[var(--card-b)] shadow-[0_-30px_80px_-20px_rgba(0,0,0,0.9)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] md:inset-y-0 md:left-auto md:right-0 md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-[26px] md:border-t-0 md:border-l ${
              shown
                ? "translate-y-0 md:translate-x-0"
                : "translate-y-full md:translate-y-0 md:translate-x-full"
            }`}
          >
            <div className="mx-auto mt-[9px] h-[4px] w-[38px] shrink-0 rounded-full bg-white/20 md:hidden" />
            <div className="flex shrink-0 items-center justify-between border-b border-white/[0.07] px-[18px] pt-[12px] pb-[12px] md:px-[22px] md:pt-[22px]">
              <h2 className="text-[19px] font-bold tracking-[-0.02em] text-white">{sheet.title}</h2>
              <button
                type="button"
                onClick={close}
                aria-label="Fermer"
                className="flex h-[32px] w-[32px] items-center justify-center rounded-full bg-white/[0.07] text-white/80 transition-colors hover:bg-white/15 hover:text-white"
              >
                <CloseIcon className="h-[16px] w-[16px]" />
              </button>
            </div>
            <div
              key={sheet.title}
              className="no-bar screen-in min-h-0 flex-1 overflow-y-auto px-[18px] pt-[14px] pb-[calc(env(safe-area-inset-bottom)+26px)] md:px-[22px]"
            >
              {sheet.content}
            </div>
          </div>
        </div>
      )}

      {toastMsg && (
        <div className="pointer-events-none fixed inset-x-0 top-[calc(env(safe-area-inset-top)+14px)] z-[120] flex justify-center px-[18px]">
          <div
            key={toastMsg.id}
            className="screen-in rounded-full bg-white px-[16px] py-[9px] text-[12.5px] font-semibold text-black shadow-[0_12px_40px_-8px_rgba(0,0,0,0.8)]"
          >
            {toastMsg.msg}
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
