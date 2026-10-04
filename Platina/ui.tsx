import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "../utils/cn";

export function useInView<T extends HTMLElement>(threshold = 0.18) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setInView(true)),
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

export function Card({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={style}
      className={cn(
        "rounded-[14px] border border-white/[0.07] bg-[linear-gradient(180deg,var(--card-a),var(--card-b))]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SectionLabel({
  children,
  action,
  className,
}: {
  children: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-baseline justify-between", className)}>
      <h2 className="text-[9.5px] font-semibold tracking-[0.11em] text-mut uppercase">
        {children}
      </h2>
      {action}
    </div>
  );
}

export function LinkButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-[1px] text-[11px] font-medium text-brand-2 transition-colors hover:text-white"
    >
      {children}
    </button>
  );
}

export function ProgressBar({
  value,
  tone = "blue",
  className,
  height = 6,
  delay = 0,
}: {
  value: number;
  tone?: "blue" | "violet";
  className?: string;
  height?: number;
  delay?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  return (
    <div
      ref={ref}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("w-full overflow-hidden rounded-full bg-white/[0.09]", className)}
      style={{ height }}
    >
      <div
        className="bar-fill h-full rounded-full"
        style={{
          width: `${inView ? value : 0}%`,
          transitionDelay: `${delay}ms`,
          background:
            tone === "violet"
              ? "linear-gradient(90deg,#7c5cff,#a78bfa)"
              : "linear-gradient(90deg,color-mix(in srgb,var(--color-brand) 78%,#000),var(--color-brand-2))",
        }}
      />
    </div>
  );
}

export function Ring({
  value,
  size = 78,
  thickness = 7,
}: {
  value: number;
  size?: number;
  thickness?: number;
}) {
  const { ref, inView } = useInView<HTMLDivElement>(0.3);
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div ref={ref} className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--color-brand)" }} />
            <stop offset="100%" style={{ stopColor: "var(--color-plat)" }} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.09)"
          strokeWidth={thickness}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="url(#ringGrad)"
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={inView ? c - (c * value) / 100 : c}
          style={{ transition: "stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1) 0.15s" }}
        />
      </svg>
      <span className="tnum absolute inset-0 flex items-center justify-center text-[21px] font-bold tracking-[-0.02em] text-white">
        {value}%
      </span>
    </div>
  );
}
