type P = { className?: string };

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function PlusIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 5v14M5 12h14" {...stroke} />
    </svg>
  );
}

export function MinusIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M5 12h14" {...stroke} />
    </svg>
  );
}

export function CloseIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="m6 6 12 12M18 6 6 18" {...stroke} />
    </svg>
  );
}

export function CheckIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" {...stroke} strokeWidth={2.2} />
    </svg>
  );
}

export function ClockIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="8.4" {...stroke} />
      <path d="M12 7.6V12l3 1.8" {...stroke} />
    </svg>
  );
}

export function RefreshIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M20 11a8 8 0 0 0-14.3-4.4L4 8.4M4 4v4.4h4.4M4 13a8 8 0 0 0 14.3 4.4l1.7-1.8M20 20v-4.4h-4.4" {...stroke} />
    </svg>
  );
}

export function DownloadIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 4v11M7.5 10.5 12 15l4.5-4.5M5 19h14"
        {...stroke}
      />
    </svg>
  );
}

export function TrashIcon({ className = "h-5 w-5" }: P) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M4.5 7h15M9.5 7V4.8h5V7M6.8 7l.8 12h8.8l.8-12M10 11v5M14 11v5" {...stroke} />
    </svg>
  );
}
