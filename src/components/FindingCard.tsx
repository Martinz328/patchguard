import { Wrench, ShieldAlert, AlertTriangle, ShieldCheck } from "lucide-react";
import type { IFinding } from "@/types/scan";
import { SeverityBadge } from "./SeverityBadge";
import { ConsultationCTA } from "./ConsultationCTA";

interface IFindingCardProps {
  finding: IFinding;
}

const SEVERITY_STYLES = {
  CRITICAL: {
    border: "border-l-4 border-destructive",
    bg: "bg-destructive/5",
    Icon: ShieldAlert,
    iconColor: "text-destructive",
  },
  WARNING: {
    border: "border-l-4 border-warning",
    bg: "bg-warning/5",
    Icon: AlertTriangle,
    iconColor: "text-warning",
  },
  PASS: {
    border: "border-l-4 border-success",
    bg: "bg-success/5",
    Icon: ShieldCheck,
    iconColor: "text-success",
  },
} as const;

export function FindingCard({ finding }: IFindingCardProps): JSX.Element {
  const style = SEVERITY_STYLES[finding.severity];
  const { Icon } = style;

  return (
    <article
      className={`${style.border} ${style.bg} rounded-xl border border-gray-200 shadow-sm p-6 animate-fade-in`}
    >
      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0">
          <Icon className={`${style.iconColor} mt-1 shrink-0`} size={22} aria-hidden="true" />
          <h3 className="text-lg font-semibold text-gray-900">{finding.name}</h3>
        </div>
        <SeverityBadge severity={finding.severity} />
      </header>

      <p className="mt-4 text-base text-gray-700 leading-relaxed">{finding.explanation}</p>

      <div className="mt-4 flex items-start gap-2 rounded-lg bg-white/70 border border-gray-200 px-4 py-3">
        <Wrench size={16} className="mt-0.5 text-gray-500 shrink-0" aria-hidden="true" />
        <p className="text-sm text-gray-700 leading-relaxed">
          <span className="font-semibold text-gray-900">How to fix: </span>
          <code className="font-mono text-[13px] text-gray-800 break-words">{finding.recommendation}</code>
        </p>
      </div>

      {finding.severity === "CRITICAL" ? <ConsultationCTA findingName={finding.name} /> : null}
    </article>
  );
}
