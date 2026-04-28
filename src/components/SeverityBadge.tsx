import type { Severity } from "@/types/scan";

interface ISeverityBadgeProps {
  severity: Severity;
}

const STYLES: Record<Severity, { label: string; cls: string }> = {
  CRITICAL: { label: "Critical", cls: "bg-destructive/10 text-destructive" },
  WARNING: { label: "Warning", cls: "bg-warning/10 text-warning" },
  PASS: { label: "Pass", cls: "bg-success/10 text-success" },
};

export function SeverityBadge({ severity }: ISeverityBadgeProps): JSX.Element {
  const { label, cls } = STYLES[severity];
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${cls}`}>
      {label}
    </span>
  );
}
