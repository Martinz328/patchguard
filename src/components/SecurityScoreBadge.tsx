import { useEffect, useState, type CSSProperties } from "react";
import type { GradeType } from "@/types/scan";
import { getScoreColor, getScoreMeta } from "@/lib/scoreUtils";

interface ISecurityScoreBadgeProps {
  score: number;
  grade: GradeType;
}

export function SecurityScoreBadge({ score, grade }: ISecurityScoreBadgeProps): JSX.Element {
  const meta = getScoreMeta(score);
  const scoreColor = getScoreColor(grade);
  const [display, setDisplay] = useState<number>(0);

  const ringStyle = {
    "--tw-ring-color": scoreColor,
  } as CSSProperties;

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
        style={ringStyle}
        role="img"
        aria-label={`Security score ${score} out of 100, ${meta.label}`}
      >
        <span className="text-6xl font-black tabular-nums" style={{ color: scoreColor }}>
          {display}
        </span>
      </div>
      <span className={`mt-4 text-sm font-bold uppercase tracking-widest ${meta.colorClass}`}>
        {meta.label}
      </span>
    </div>
  );
}
