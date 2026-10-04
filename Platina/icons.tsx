import { useId } from "react";

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

const base = (className = "h-5 w-5") => className;

/* ---------------------------------------------------------------- status bar */

export function CellularIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 20 12" className={base(className)} aria-hidden="true">
      <rect x="0" y="7.5" width="3.2" height="4.5" rx="1" fill="currentColor" />
      <rect x="4.6" y="5.4" width="3.2" height="6.6" rx="1" fill="currentColor" />
      <rect x="9.2" y="3" width="3.2" height="9" rx="1" fill="currentColor" />
      <rect x="13.8" y="0.5" width="3.2" height="11.5" rx="1" fill="currentColor" />
    </svg>
  );
}

export function WifiIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 18 13" className={base(className)} aria-hidden="true">
      <path
        d="M9 11.6 6.9 9.3a3.1 3.1 0 0 1 4.2 0L9 11.6Z"
        fill="currentColor"
      />
      <path
        d="M4.3 6.7a6.9 6.9 0 0 1 9.4 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M1.4 3.5a11 11 0 0 1 15.2 0"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

export function BatteryIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 27 13" className={base(className)} aria-hidden="true">
      <rect
        x="0.6"
        y="0.6"
        width="22.6"
        height="11.8"
        rx="3.6"
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.4"
        strokeWidth="1.1"
      />
      <rect x="2.3" y="2.3" width="18.4" height="8.4" rx="2.2" fill="currentColor" />
      <path
        d="M25 4.4v4.2c1.1-.3 1.8-1.1 1.8-2.1S26.1 4.7 25 4.4Z"
        fill="currentColor"
        fillOpacity="0.45"
      />
    </svg>
  );
}

/* --------------------------------------------------------------- chrome bits */

export function BellIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} fill="none" aria-hidden="true">
      <path
        d="M12 3.2a5.6 5.6 0 0 0-5.6 5.6v3.1c0 .8-.3 1.6-.9 2.2l-.7.8c-.6.7-.1 1.8.8 1.8h12.8c.9 0 1.4-1.1.8-1.8l-.7-.8a3.2 3.2 0 0 1-.9-2.2V8.8A5.6 5.6 0 0 0 12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9.7 19.3a2.4 2.4 0 0 0 4.6 0"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} fill="none" aria-hidden="true">
      <circle cx="10.8" cy="10.8" r="6.6" stroke="currentColor" strokeWidth="1.7" />
      <path
        d="m15.8 15.8 4 4"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function SlidersIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} fill="none" aria-hidden="true">
      <path
        d="M4 8h9M17.5 8H20M4 16h3M11.5 16H20"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="15.3" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="9.3" cy="16" r="2.2" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function GearIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M12 2.8l1 2.2 2.4-.5 1 2.1 2.3.7-.5 2.4 1.7 1.7-1.7 1.7.5 2.4-2.3.7-1 2.1-2.4-.5-1 2.2-1-2.2-2.4.5-1-2.1-2.3-.7.5-2.4L4.1 12l1.7-1.7-.5-2.4 2.3-.7 1-2.1 2.4.5 1-2.2Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronRight({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} fill="none" aria-hidden="true">
      <path
        d="m9.5 5.5 6.5 6.5-6.5 6.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronDown({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} fill="none" aria-hidden="true">
      <path
        d="m5.5 9 6.5 6.5L18.5 9"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* --------------------------------------------------------------- tab bar */

export function SettingsTabIcon({ className }: IconProps) {
  return <GearIcon className={className} />;
}

export function StatsTabIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} aria-hidden="true">
      <rect x="3" y="10.5" width="4.2" height="10.5" rx="2.1" fill="currentColor" />
      <rect x="9.9" y="4" width="4.2" height="17" rx="2.1" fill="currentColor" />
      <rect x="16.8" y="7.6" width="4.2" height="13.4" rx="2.1" fill="currentColor" />
    </svg>
  );
}

export function GamepadTabIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} aria-hidden="true">
      <path
        d="M7.4 6.5h9.2c2.6 0 4.6 1.9 5.1 4.5l.7 4.2c.3 1.9-1.2 3.6-3.1 3.6-1.1 0-2.1-.6-2.7-1.5l-.9-1.5H8.3l-.9 1.5c-.6.9-1.6 1.5-2.7 1.5-1.9 0-3.4-1.7-3.1-3.6l.7-4.2c.5-2.6 2.5-4.5 5.1-4.5Z"
        fill="currentColor"
      />
      <path
        d="M8.4 10v3.4M6.7 11.7h3.4"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="16.1" cy="10.9" r="1.05" fill="#000" />
      <circle cx="18.2" cy="13" r="1.05" fill="#000" />
    </svg>
  );
}

export function PlayTabIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} aria-hidden="true">
      <path
        d="M4.2 9.6c0-1.7 1.4-3.1 3.1-3.1h9.4c1.7 0 3.1 1.4 3.1 3.1v5.2a2.6 2.6 0 0 1-4.5 1.8l-1-1.1H9.7l-1 1.1a2.6 2.6 0 0 1-4.5-1.8V9.6Z"
        fill="currentColor"
      />
      <path
        d="M10.4 9.4v3M8.9 10.9h3"
        stroke="#000"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <circle cx="15.4" cy="10.4" r=".95" fill="#000" />
      <circle cx="17.3" cy="12.3" r=".95" fill="#000" />
    </svg>
  );
}

export function CrownIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} aria-hidden="true">
      <path
        d="M2.6 7.4 6 11l4.2-5.6a2.2 2.2 0 0 1 3.6 0L18 11l3.4-3.6c.7-.7 1.9-.1 1.7.9l-1.9 8.3a1.6 1.6 0 0 1-1.6 1.3H4.4a1.6 1.6 0 0 1-1.6-1.3L.9 8.3c-.2-1 1-1.6 1.7-.9Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* --------------------------------------------------------------- logo */

export function PlatinaLogo({ className }: IconProps) {
  return (
    <svg viewBox="0 0 44 40" className={base(className)} aria-hidden="true">
      <defs>
        <linearGradient id="platinaA" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7fb0ff" />
          <stop offset="55%" stopColor="#2f6bff" />
          <stop offset="100%" stopColor="#1a3fd0" />
        </linearGradient>
        <linearGradient id="platinaB" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#3d7dff" />
          <stop offset="100%" stopColor="#9dc4ff" />
        </linearGradient>
      </defs>
      <path d="M4 4h15l8.5 15.5L19 34 4 4Z" fill="url(#platinaA)" />
      <path d="M24.5 4H40L25 34l-4-7.6L28.6 12 24.5 4Z" fill="url(#platinaB)" />
      <path d="M19.6 14.6h4.8L22 22.6l-2.4-8Z" fill="#c9dcff" />
    </svg>
  );
}

/* --------------------------------------------------------------- trophies */

type Metal = "plat" | "gold" | "silver" | "bronze";

const METAL: Record<Metal, { a: string; b: string; c: string }> = {
  plat: { a: "#eaf6ff", b: "#8ec9ff", c: "#3f7fe0" },
  gold: { a: "#ffe9a3", b: "#e9b431", c: "#b07a12" },
  silver: { a: "#f4f7fb", b: "#c2c8d2", c: "#8d95a3" },
  bronze: { a: "#f0c39c", b: "#d9763a", c: "#9d4d1c" },
};

export function TrophyCup({
  tone,
  className,
}: {
  tone: Metal;
  className?: string;
}) {
  const id = useId().replace(/:/g, "");
  const m = METAL[tone];
  const gid = `cup-${id}`;
  return (
    <svg viewBox="0 0 24 24" className={base(className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${gid}-b`} x1="0.2" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stopColor={m.a} />
          <stop offset="45%" stopColor={m.b} />
          <stop offset="100%" stopColor={m.c} />
        </linearGradient>
      </defs>
      <g fill={`url(#${gid}-b)`}>
        <path d="M6.6 3h10.8v4.4a5.4 5.4 0 0 1-10.8 0V3Z" />
        <path d="M6.6 4.6H4.2a.6.6 0 0 0-.6.6v.3a4.3 4.3 0 0 0 3.6 4.2l-.3-1.6a2.9 2.9 0 0 1-1.7-2.1h1.4V4.6Z" />
        <path d="M17.4 4.6h2.4a.6.6 0 0 1 .6.6v.3a4.3 4.3 0 0 1-3.6 4.2l.3-1.6a2.9 2.9 0 0 0 1.7-2.1h-1.4V4.6Z" />
        <path d="M11.1 12.9h1.8v3.4h-1.8z" />
        <path d="M8 19.4h8a1.4 1.4 0 0 1 1.4 1.4v.9H6.6v-.9A1.4 1.4 0 0 1 8 19.4Z" />
        <path d="M9.9 16.3h4.2v3.1H9.9z" />
      </g>
      <path
        d="M7.6 4.1h2.2v6.4a5.4 5.4 0 0 1-2.2-.9V4.1Z"
        fill="#fff"
        fillOpacity="0.32"
      />
    </svg>
  );
}

export function PlatinumBadge({ className }: IconProps) {
  const id = useId().replace(/:/g, "");
  const gid = `pb-${id}`;
  return (
    <svg viewBox="0 0 100 100" className={base(className)} aria-hidden="true">
      <defs>
        <linearGradient id={`${gid}-ring`} x1="0.1" y1="0" x2="0.9" y2="1">
          <stop offset="0%" stopColor="#8f7dff" />
          <stop offset="45%" stopColor="#4f8cff" />
          <stop offset="100%" stopColor="#a8c9ff" />
        </linearGradient>
        <linearGradient id={`${gid}-gem`} x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#cfe6ff" />
          <stop offset="100%" stopColor="#6ba6ff" />
        </linearGradient>
        <filter id={`${gid}-blur`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.2" />
        </filter>
      </defs>
      {/* glow */}
      <path
        d="M50 8 86 29v42L50 92 14 71V29L50 8Z"
        fill="none"
        stroke="#5b95ff"
        strokeWidth="11"
        opacity="0.5"
        filter={`url(#${gid}-blur)`}
      />
      {/* hexagon */}
      <path
        d="M50 8 86 29v42L50 92 14 71V29L50 8Z"
        fill="rgba(12,18,32,0.85)"
        stroke={`url(#${gid}-ring)`}
        strokeWidth="3.4"
        strokeLinejoin="round"
      />
      <path
        d="M50 8 86 29v42L50 92 14 71V29L50 8Z"
        fill="none"
        stroke="#a8c9ff"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
      {/* inner diamond */}
      <path
        d="M50 26 68 50 50 74 32 50 50 26Z"
        fill={`url(#${gid}-gem)`}
        opacity="0.96"
      />
      <path d="M50 26 68 50H32L50 26Z" fill="#ffffff" fillOpacity="0.55" />
      <path
        d="M50 32 62 50H38L50 32Z"
        fill="none"
        stroke="#0b1220"
        strokeOpacity="0.22"
        strokeWidth="1.4"
      />
    </svg>
  );
}

/* --------------------------------------------------------------- settings */

function Row({
  children,
  d,
  className,
}: {
  children?: React.ReactNode;
  d: string;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className ?? "h-[15px] w-[15px]"}
      fill="none"
      aria-hidden="true"
    >
      <path d={d} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      {children}
    </svg>
  );
}

export function UsersIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M9.5 11.2a3.4 3.4 0 1 0 0-6.8 3.4 3.4 0 0 0 0 6.8ZM3.4 20c0-3 2.7-5.3 6.1-5.3s6.1 2.3 6.1 5.3M16.6 11.6a3 3 0 0 0 .3-6M18.4 14.9c1.4.7 2.2 2 2.2 3.6"
    />
  );
}

export function LinkIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M10.2 13.8a4.2 4.2 0 0 0 6 0l2.6-2.6a4.2 4.2 0 0 0-6-6L11.6 6.4M13.8 10.2a4.2 4.2 0 0 0-6 0l-2.6 2.6a4.2 4.2 0 0 0 6 6l1.2-1.2"
    />
  );
}

export function LockIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M6.4 10.4h11.2a1.4 1.4 0 0 1 1.4 1.4v7A1.4 1.4 0 0 1 17.6 20H6.4A1.4 1.4 0 0 1 5 18.8v-7a1.4 1.4 0 0 1 1.4-1.4ZM8.2 10.4V7.9a3.8 3.8 0 0 1 7.6 0v2.5"
    />
  );
}

export function BellSmallIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M12 3.6a4.8 4.8 0 0 0-4.8 4.8v2.8c0 .8-.3 1.5-.8 2.1l-.5.6c-.5.6-.1 1.5.6 1.5h11c.7 0 1.1-.9.6-1.5l-.5-.6a3.2 3.2 0 0 1-.8-2.1V8.4A4.8 4.8 0 0 0 12 3.6ZM10.2 18.6a1.9 1.9 0 0 0 3.6 0"
    />
  );
}

export function PaletteIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M12 20.4a8.4 8.4 0 1 1 8.4-8.4c0 2.1-1.6 3.2-3.4 3.2h-1.5c-1 0-1.8.8-1.8 1.8 0 .5.2.9.4 1.3.2.4.3.7.3 1a1.2 1.2 0 0 1-1.2 1.1Z"
    >
      <circle cx="8.4" cy="10.4" r="1.1" fill="currentColor" />
      <circle cx="12" cy="7.8" r="1.1" fill="currentColor" />
      <circle cx="15.6" cy="9.6" r="1.1" fill="currentColor" />
    </Row>
  );
}

export function GlobeIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8ZM3.7 9.4h16.6M3.7 14.6h16.6M12 3.6c-4 4.6-4 12.2 0 16.8 4-4.6 4-12.2 0-16.8Z"
    />
  );
}

export function CurrencyIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8ZM14.4 9.2a2.8 2.8 0 0 0-4.4 1.1v3.4a2.8 2.8 0 0 0 4.4 1.1M8.6 11.2h4.2M8.6 13.4h4.2"
    />
  );
}

export function AppearanceIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M4 8.4h5M13.6 8.4H20M4 15.6h9M17.6 15.6H20"
    >
      <circle cx="11.2" cy="8.4" r="2" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="15.4" cy="15.6" r="2" stroke="currentColor" strokeWidth="1.6" />
    </Row>
  );
}

export function UploadIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M12 15.6V4.4M8.2 8.2 12 4.4l3.8 3.8M5 14.6v3.2A1.8 1.8 0 0 0 6.8 19.6h10.4a1.8 1.8 0 0 0 1.8-1.8v-3.2"
    />
  );
}

export function SaveIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M6.6 4.4h8.2L19.6 9.2v8.6a1.8 1.8 0 0 1-1.8 1.8H6.6a1.8 1.8 0 0 1-1.8-1.8V6.2a1.8 1.8 0 0 1 1.8-1.8ZM8.4 4.4v4.8h6.4V4.4M7.6 19.6v-5.4h8.8v5.4"
    />
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M12 20.4a8.4 8.4 0 1 0 0-16.8 8.4 8.4 0 0 0 0 16.8ZM12 11v5"
    >
      <circle cx="12" cy="8.1" r="1" fill="currentColor" />
    </Row>
  );
}

export function MailIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M4 6.8h16a1.2 1.2 0 0 1 1.2 1.2v8a1.2 1.2 0 0 1-1.2 1.2H4A1.2 1.2 0 0 1 2.8 16V8A1.2 1.2 0 0 1 4 6.8ZM3.2 8.2 12 13.6l8.8-5.4"
    />
  );
}

export function CartIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M3 4.6h2.2l2.4 10.2h9.8l2.2-7.6H6.4M9.4 19.4a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6ZM17 19.4a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6Z"
    />
  );
}

export function PSStoreIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={base(className)} fill="none" aria-hidden="true">
      <path
        d="M5.6 8.4h12.8a1.2 1.2 0 0 1 1.2 1.2v9.2a1.2 1.2 0 0 1-1.2 1.2H5.6a1.2 1.2 0 0 1-1.2-1.2V9.6a1.2 1.2 0 0 1 1.2-1.2Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8.8 8.4V6.8a3.2 3.2 0 0 1 6.4 0v1.6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 12.2c1.6.4 2.8.9 2.8 1.5 0 .8-1.9 1.3-4.2 1.3H9.4v1.1h1.2c3 0 5.4-.9 5.4-2.4 0-1.2-1.6-2-4-2.5v1Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function PSPlusMark({ className }: IconProps) {
  return (
    <svg viewBox="0 0 40 40" className={base(className)} aria-hidden="true">
      <defs>
        <linearGradient id="psp" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffd84d" />
          <stop offset="100%" stopColor="#f0a90c" />
        </linearGradient>
      </defs>
      <g fill="url(#psp)">
        <path d="M20 3.5 25 12l-9 5-5-8.5 9-5Z" />
        <path d="M27.5 15.5 37 21l-9 5.2-5-8.6 4.5-2.1Z" opacity="0.92" />
        <path d="M12.5 22.5l9 5-5 8.6-9-5.2 5-8.4Z" opacity="0.92" />
        <path d="M20 27.5l5-3 5 8.6-9 5-1-10.6Z" opacity="0.8" />
      </g>
    </svg>
  );
}

export function PowerIcon({ className }: IconProps) {
  return (
    <Row
      className={className}
      d="M12 3.6v7.2M7.4 6.2a7 7 0 1 0 9.2 0"
    />
  );
}
