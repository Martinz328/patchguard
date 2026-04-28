import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

export function Navbar(): JSX.Element {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group" aria-label="PatchGuard home">
          <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
            <Shield size={18} aria-hidden="true" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-primary">PatchGuard</span>
        </Link>
        <span className="hidden sm:inline text-sm text-gray-500">Security Made Accessible</span>
      </div>
    </header>
  );
}
