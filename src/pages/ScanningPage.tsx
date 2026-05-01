import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Shield, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { ScanResponse } from "@/types/scan";

const STATUS_MESSAGES: string[] = [
  "Checking SSL certificate...",
  "Analyzing security headers...",
  "Testing redirect configuration...",
  "Compiling your report...",
];

interface IScanLocationState {
  url?: string;
}

interface IScanResultSuccess {
  scanId: string;
}

interface IScanResultError {
  error: true;
  errorType: "UNREACHABLE" | "TIMEOUT" | "INVALID_URL" | "UNKNOWN";
  message: string;
}

function isScanError(data: unknown): data is IScanResultError {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return d.error === true && typeof d.errorType === "string" && typeof d.message === "string";
}

function isScanSuccess(data: unknown): data is IScanResultSuccess {
  if (!data || typeof data !== "object") return false;
  const d = data as Record<string, unknown>;
  return typeof d.scanId === "string" && d.scanId.length > 0;
}

export default function ScanningPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as IScanLocationState;
  const url = state.url ?? "";

  const [statusIndex, setStatusIndex] = useState<number>(0);
  const [longRunning, setLongRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!url) {
      navigate("/", { replace: true });
    }
  }, [url, navigate]);

  useEffect(() => {
    const id = window.setInterval(() => {
      setStatusIndex((i) => (i + 1) % STATUS_MESSAGES.length);
    }, 2000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const slow = window.setTimeout(() => setLongRunning(true), 12000);
    const controller = new AbortController();

    const run = async (): Promise<void> => {
      if (!url) return;
      try {
        const { data, error } = await supabase.functions.invoke<ScanResponse>("scan-url", {
          body: { url },
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        if (error) {
          navigate("/error", {
            replace: true,
            state: { errorType: "UNKNOWN", message: "An unexpected error occurred." },
          });
          return;
        }

        if (isScanError(data)) {
          navigate("/error", {
            replace: true,
            state: { errorType: data.errorType, message: data.message },
          });
          return;
        }

        if (isScanSuccess(data)) {
          navigate(`/report/${data.scanId}`, { replace: true });
          return;
        }

        navigate("/error", {
          replace: true,
          state: { errorType: "UNKNOWN", message: "An unexpected error occurred." },
        });
      } catch {
        if (controller.signal.aborted) return;
        navigate("/error", {
          replace: true,
          state: { errorType: "UNKNOWN", message: "An unexpected error occurred." },
        });
      }
    };

    void run();
    return () => {
      window.clearTimeout(slow);
      controller.abort();
    };
  }, [navigate, url]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mb-6">
          <Shield size={28} aria-hidden="true" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Scanning your website</h1>

        {url ? (
          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary text-gray-700 text-sm max-w-full">
            <Globe size={14} className="text-gray-500 shrink-0" aria-hidden="true" />
            <span className="truncate font-mono">{url}</span>
          </div>
        ) : null}

        <div
          className="mt-8 relative h-2 w-full overflow-hidden rounded-full bg-primary/10"
          role="progressbar"
          aria-label="Scan in progress"
        >
          <div className="absolute top-0 h-full w-2/5 rounded-full bg-primary animate-indeterminate" />
        </div>

        <p
          key={statusIndex}
          className="mt-6 text-base text-gray-600 animate-fade-in min-h-[1.5rem]"
          aria-live="polite"
        >
          {STATUS_MESSAGES[statusIndex]}
        </p>

        {longRunning ? (
          <p className="mt-3 text-sm text-gray-400">This is taking longer than usual. Hang tight...</p>
        ) : null}
      </div>
    </div>
  );
}
