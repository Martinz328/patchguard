import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

type ErrorType = "UNREACHABLE" | "TIMEOUT" | "INVALID_URL" | "UNKNOWN";

interface IErrorLocationState {
  errorType?: ErrorType;
  message?: string;
}

const HEADLINES: Record<ErrorType, string> = {
  UNREACHABLE: "We Couldn't Reach That Website.",
  TIMEOUT: "The Scan Took Too Long.",
  INVALID_URL: "That Doesn't Look Like a Valid URL.",
  UNKNOWN: "Something Went Wrong.",
};

const BODIES: Record<ErrorType, string> = {
  UNREACHABLE:
    "The website you entered isn't responding. It may be offline, or the URL might have a typo. Double-check the address and try again.",
  TIMEOUT:
    "The scan is taking longer than expected. This can happen with slow websites. Please try again.",
  INVALID_URL: "Please check the URL you entered and make sure it starts with https:// or http://.",
  UNKNOWN: "We hit an unexpected issue. Please try again. If this keeps happening, contact us.",
};

export default function ErrorPage(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? {}) as IErrorLocationState;
  const errorType: ErrorType = state.errorType ?? "UNKNOWN";
  const message: string | undefined = state.message;

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-warning/10 mb-6">
          <AlertTriangle size={48} className="text-[#D97706]" aria-hidden="true" />
        </div>
        <h1 className="text-3xl font-black text-gray-900">{HEADLINES[errorType]}</h1>
        <p className="mt-4 text-base text-gray-600 leading-relaxed">{message ?? BODIES[errorType]}</p>

        <button
          type="button"
          onClick={() => navigate("/")}
          className="mt-8 inline-flex w-full sm:w-auto items-center justify-center px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold transition-colors hover:bg-[hsl(var(--primary-hover))] focus:outline-none focus:ring-4 focus:ring-primary/30"
        >
          Try Again
        </button>

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
