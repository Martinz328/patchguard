import { useLocation, Link } from "react-router-dom";
import { AlertTriangle } from "lucide-react";
import type { ErrorReason } from "@/types/scan";

interface IErrorLocationState {
  reason?: ErrorReason;
}

const HEADLINES: Record<ErrorReason, string> = {
  UNREACHABLE: "We Couldn't Reach That Website.",
  TIMEOUT: "The Scan Took Too Long.",
  UNKNOWN: "Something Went Wrong.",
};

const BODIES: Record<ErrorReason, string> = {
  UNREACHABLE:
    "We tried to connect but your website didn't respond. Double-check the address is correct and that the site is online, then try again.",
  TIMEOUT:
    "Your website took too long to respond. This sometimes happens with slow connections — please try again in a moment.",
  UNKNOWN:
    "An unexpected problem stopped the scan. It's not your fault — please try again, and let us know if it keeps happening.",
};

export default function ErrorPage(): JSX.Element {
  const location = useLocation();
  const state = (location.state ?? {}) as IErrorLocationState;
  const reason: ErrorReason = state.reason ?? "UNREACHABLE";

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/10 text-warning mb-6">
          <AlertTriangle size={32} aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">{HEADLINES[reason]}</h1>
        <p className="mt-4 text-base text-gray-600 leading-relaxed">{BODIES[reason]}</p>

        <Link
          to="/"
          className="mt-8 inline-flex items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-colors hover:bg-[hsl(var(--primary-hover))] focus:outline-none focus:ring-4 focus:ring-primary/30"
        >
          Try Again
        </Link>

        <p className="mt-6 text-sm text-gray-400">
          If this keeps happening,{" "}
          <a href="mailto:support@patchguard.io" className="text-primary hover:underline">
            contact us
          </a>
          .
        </p>
      </div>
    </div>
  );
}
