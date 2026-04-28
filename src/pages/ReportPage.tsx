import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Clock, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SecurityScoreBadge } from "@/components/SecurityScoreBadge";
import { FindingCard } from "@/components/FindingCard";
import { getScoreMeta } from "@/lib/scoreUtils";
import type { IScanReport, Severity } from "@/types/scan";

const SEVERITY_ORDER: Record<Severity, number> = { CRITICAL: 0, WARNING: 1, PASS: 2 };

interface IReportLocationState {
  url?: string;
}

function getMockReport(scanId: string, url: string): IScanReport {
  return {
    scanId,
    url,
    scannedAt: new Date().toISOString(),
    score: 45,
    grade: "AT_RISK",
    findings: [
      {
        id: "csp",
        name: "Content-Security-Policy Missing",
        severity: "CRITICAL",
        explanation:
          "Your website has no Content-Security-Policy header. Attackers can inject malicious scripts that steal customer data.",
        recommendation: "Add to your server: Content-Security-Policy: default-src 'self'",
      },
      {
        id: "hsts",
        name: "HTTP Strict Transport Security Missing",
        severity: "CRITICAL",
        explanation:
          "Without HSTS, attackers can trick browsers into using an unencrypted connection even if your site supports HTTPS.",
        recommendation: "Add: Strict-Transport-Security: max-age=31536000",
      },
      {
        id: "xframe",
        name: "X-Frame-Options Missing",
        severity: "WARNING",
        explanation:
          "Without this, attackers can embed your site in a hidden iframe to trick users — a clickjacking attack.",
        recommendation: "Add: X-Frame-Options: DENY",
      },
      {
        id: "ssl",
        name: "SSL Certificate",
        severity: "PASS",
        explanation: "Your website uses HTTPS with a valid certificate.",
        recommendation: "No action needed. Certificate expires in 245 days.",
      },
    ],
  };
}

export default function ReportPage(): JSX.Element {
  const { scanId = "demo-id" } = useParams<{ scanId: string }>();
  const location = useLocation();
  const state = (location.state ?? {}) as IReportLocationState;
  const url = state.url ?? "https://yourbusiness.com";

  const report = useMemo<IScanReport>(() => getMockReport(scanId, url), [scanId, url]);
  const meta = getScoreMeta(report.score, report.grade);

  const sortedFindings = useMemo(
    () =>
      [...report.findings].sort((a, b) => {
        const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        return sev !== 0 ? sev : a.name.localeCompare(b.name);
      }),
    [report.findings]
  );

  const allPass = sortedFindings.every((f) => f.severity === "PASS");
  const formattedTime = new Date(report.scannedAt).toLocaleString();

  return (
    <div className="min-h-screen bg-secondary/40">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <Link
          to="/"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-primary transition-colors"
        >
          <ArrowLeft size={16} aria-hidden="true" />
          Back to home
        </Link>

        <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-10 text-center">
          <SecurityScoreBadge score={report.score} grade={report.grade} />

          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-500">
            <span className="inline-flex items-center gap-1.5">
              <Globe size={14} aria-hidden="true" />
              <span className="font-mono text-gray-700 break-all">{report.url}</span>
            </span>
            <span className="hidden sm:inline text-gray-300">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock size={14} aria-hidden="true" />
              {formattedTime}
            </span>
          </div>

          <p className={`mt-6 text-lg sm:text-xl font-semibold ${meta.colorClass} max-w-2xl mx-auto`}>
            {meta.sentence}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Findings <span className="text-gray-400 font-medium">({sortedFindings.length})</span>
          </h2>

          {allPass ? (
            <div className="rounded-xl border border-success/30 bg-success/5 p-8 text-center">
              <CheckCircle2 className="mx-auto text-success" size={40} aria-hidden="true" />
              <p className="mt-3 text-lg font-semibold text-gray-900">
                Excellent! No critical issues found.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedFindings.map((f) => (
                <FindingCard key={f.id} finding={f} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-12 flex justify-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-primary text-primary font-semibold transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            Scan Another URL
          </Link>
        </div>
      </main>
    </div>
  );
}
