import { useEffect, useRef, useState } from "react";
import { useInView } from "./ui";
import { fmtNum } from "../lib/util";

export function CountUp({
  value,
  duration = 1600,
  delay = 0,
  className,
}: {
  value: number;
  duration?: number;
  delay?: number;
  className?: string;
}) {
  const { ref, inView } = useInView<HTMLSpanElement>(0.35);
  const [n, setN] = useState(0);
  const started = useRef(false);
  const target = useRef(value);
  target.current = value;

  useEffect(() => {
    if (!inView) return;
    started.current = true;
    let raf = 0;
    const from = 0;
    const to = target.current;
    const t0 = performance.now() + delay;
    const tick = (now: number) => {
      if (now < t0) {
        raf = requestAnimationFrame(tick);
        return;
      }
      const t = Math.min(1, (now - t0) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setN(to);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, duration, delay, value]);

  return (
    <span ref={ref} className={className}>
      {fmtNum(Math.round(n))}
    </span>
  );
}
