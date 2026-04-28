import { useEffect, useState } from "react";
import type { Grade } from "@/types/scan";
import { getScoreMeta } from "@/lib/scoreUtils";

interface ISecurityScoreBadgeProps {
  score: number;
  grade: Grade;
}

export function SecurityScoreBadge({ score, grade }: ISecurityScoreBadgeProps): JSX.Element {
  const meta = getScoreMeta(score, grade);
  const [display, setDisplay] = useState<number>(0);

  useEffect(() => {
    const duration = 900;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(score * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [score]);

  return (
    <div className="flex flex-col items-center">
      <div
        className={`relative flex items-center justify-center w-36 h-36 rounded-full ${meta.bgClass} ring-8 ${meta.ringClass} shadow-md`}
        role="img"
        aria-label={`Security score ${score} out of 100, ${meta.label}`}
      >
        <span className={`text-6xl font-black tabular-nums ${meta.colorClass}`}>{display}</span>
      </div>
      <span className={`mt-4 text-sm font-bold uppercase tracking-widest ${meta.colorClass}`}>
        {meta.label}
      </span>
    </div>
  );
}
