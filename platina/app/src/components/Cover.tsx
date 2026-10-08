import type { Game } from "../lib/store";
import { hueOf, initials } from "../lib/util";
import { cn } from "../utils/cn";

export function Cover({ game, className }: { game: Pick<Game, "title" | "cover">; className?: string }) {
  if (game.cover) {
    return (
      <div className={cn("relative shrink-0 overflow-hidden ring-1 ring-white/10", className)}>
        <img
          src={game.cover}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <span className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.14),transparent_45%)]" />
      </div>
    );
  }
  const h = hueOf(game.title);
  return (
    <div
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden text-[20px] font-extrabold tracking-[-0.03em] text-white/90 ring-1 ring-white/10",
        className,
      )}
      style={{
        background: `linear-gradient(145deg,hsl(${h} 70% 38%),hsl(${(h + 50) % 360} 70% 16%))`,
      }}
    >
      {initials(game.title)}
      <span className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.18),transparent_50%)]" />
    </div>
  );
}
