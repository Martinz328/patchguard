import { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Search, AlertCircle } from "lucide-react";
import { validateUrl } from "@/lib/validateUrl";

export function ScanForm(): JSX.Element {
  const navigate = useNavigate();
  const [url, setUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: ChangeEvent<HTMLInputElement>): void => {
    setUrl(e.target.value);
    if (error) setError(null);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    const result = validateUrl(url);
    if (!result.isValid) {
      setError(result.error);
      return;
    }
    navigate("/scanning", { state: { url: result.normalizedUrl } });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto" noValidate>
      <div className="relative">
        <Search
          className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          size={20}
          aria-hidden="true"
        />
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          value={url}
          onChange={handleChange}
          placeholder="https://yourbusiness.com"
          aria-label="Website URL to scan"
          aria-invalid={!!error}
          className="w-full h-16 pl-12 pr-36 sm:pr-40 rounded-xl border-2 border-primary/20 bg-white text-base sm:text-lg text-gray-900 placeholder:text-gray-400 shadow-sm transition-colors focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        />
        <button
          type="submit"
          className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center h-12 px-5 sm:px-6 rounded-lg bg-primary text-primary-foreground font-semibold text-sm sm:text-base shadow-sm transition-colors hover:bg-[hsl(var(--primary-hover))] focus:outline-none focus:ring-4 focus:ring-primary/30"
        >
          Scan Now
        </button>
      </div>
      {error ? (
        <div className="mt-3 flex items-center gap-2 text-sm text-destructive" role="alert">
          <AlertCircle size={16} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
    </form>
  );
}
