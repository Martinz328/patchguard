import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Globe, Clock, CheckCircle2 } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SecurityScoreBadge } from "@/components/SecurityScoreBadge";
import { FindingCard } from "@/components/FindingCard";
import { supabase } from "@/lib/supabase";
import { getScoreMessage } from "@/lib/scoreUtils";
import type { GradeType, IFinding, SeverityLevel } from "@/types/scan";

const SEVERITY_ORDER: Record<SeverityLevel, number> = { CRITICAL: 0, WARNING: 1, PASS: 2 };

interface IScanResultRow {
  id: string;
  url: string;
  score: number;
  grade: GradeType;
  findings: unknown;
  duration_ms: number | null;
  created_at: string;
}

function isFinding(value: unknown): value is IFinding {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.name === "string" &&
    (v.severity === "CRITICAL" || v.severity === "WARNING" || v.severity === "PASS") &&
    typeof v.explanation === "string" &&
    typeof v.recommendation === "string"
  );
}

function parseFindings(value: unknown): IFinding[] | null {
  const parsed: unknown =
    typeof value === "string"
      ? (() => {
          try {
            return JSON.parse(value) as unknown;
          } catch {
            return null;
          }
        })()
      : value;

  if (!Array.isArray(parsed)) return null;
  const findings: IFinding[] = parsed.filter(isFinding);
  return findings.length === parsed.length ? findings : null;
}

export default function ReportPage(): JSX.Element {
  const navigate = useNavigate();
  const { scanId } = useParams<{ scanId: string }>();

  const [loading, setLoading] = useState<boolean>(true);
  const [row, setRow] = useState<IScanResultRow | null>(null);

  useEffect(() => {
    if (!scanId) {
      navigate("/error", { state: { errorType: "UNKNOWN" } });
      return;
    }

    let active = true;

    const run = async (): Promise<void> => {
      setLoading(true);
      const { data, error } = await supabase
        .from("scan_results")
        .select("*")
        .eq("id", scanId)
        .single<IScanResultRow>();

      if (!active) return;

      if (error || !data) {
        navigate("/error", { state: { errorType: "UNKNOWN" } });
        return;
      }

      const findings = parseFindings(data.findings);
      if (!findings) {
        navigate("/error", { state: { errorType: "UNKNOWN" } });
        return;
      }

      setRow(data);
      setLoading(false);
    };

    void run();

    return () => {
      active = false;
    };
  }, [navigate, scanId]);

  const parsedFindings = useMemo<IFinding[] | null>(() => {
    if (!row) return null;
    return parseFindings(row.findings);
  }, [row]);

  const sortedFindings = useMemo<IFinding[]>(() => {
    if (!parsedFindings) return [];
    return [...parsedFindings].sort((a: IFinding, b: IFinding) => {
      const sev = SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
      return sev !== 0 ? sev : a.name.localeCompare(b.name);
    });
  }, [parsedFindings]);

  const allPass = sortedFindings.every((f) => f.severity === "PASS");
  const formattedTime = row?.created_at ? new Date(row.created_at).toLocaleString() : "";

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

        {loading ? (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-10 text-center">
            <div className="mx-auto w-36 h-36 rounded-full bg-gray-200 animate-pulse" />
            <div className="mt-6 h-4 w-3/4 mx-auto rounded bg-gray-200 animate-pulse" />
            <div className="mt-3 h-4 w-2/3 mx-auto rounded bg-gray-200 animate-pulse" />
          </section>
        ) : row && parsedFindings ? (
          <section className="mt-6 rounded-2xl border border-gray-200 bg-white shadow-sm p-6 sm:p-10 text-center">
            <SecurityScoreBadge score={row.score} grade={row.grade} />

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5">
                <Globe size={14} aria-hidden="true" />
                <span className="font-mono text-gray-700 break-all">{row.url}</span>
              </span>
              <span className="hidden sm:inline text-gray-300">•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock size={14} aria-hidden="true" />
                {formattedTime}
              </span>
            </div>

            <p className="mt-6 text-lg sm:text-xl font-semibold text-gray-900 max-w-2xl mx-auto">
              {getScoreMessage(row.grade)}
            </p>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Findings <span className="text-gray-400 font-medium">({sortedFindings.length})</span>
          </h2>

          {loading ? (
            <div className="space-y-4">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
                <div className="h-5 w-2/3 bg-gray-200 rounded" />
                <div className="mt-4 h-4 w-full bg-gray-200 rounded" />
                <div className="mt-2 h-4 w-5/6 bg-gray-200 rounded" />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
                <div className="h-5 w-1/2 bg-gray-200 rounded" />
                <div className="mt-4 h-4 w-full bg-gray-200 rounded" />
                <div className="mt-2 h-4 w-4/6 bg-gray-200 rounded" />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm animate-pulse">
                <div className="h-5 w-3/5 bg-gray-200 rounded" />
                <div className="mt-4 h-4 w-full bg-gray-200 rounded" />
                <div className="mt-2 h-4 w-2/3 bg-gray-200 rounded" />
              </div>
            </div>
          ) : allPass ? (
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
          <button
            type="button"
            onClick={() => navigate("/")}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg border-2 border-primary text-primary font-semibold transition-colors hover:bg-primary hover:text-primary-foreground focus:outline-none focus:ring-4 focus:ring-primary/20"
          >
            Scan Another URL
          </button>
        </div>
      </main>
    </div>
  );
}
