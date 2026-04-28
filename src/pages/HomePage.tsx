import { ShieldCheck, Zap, UserX } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { ScanForm } from "@/components/ScanForm";

interface ITrustItem {
  icon: typeof ShieldCheck;
  label: string;
}

const TRUST_ITEMS: ITrustItem[] = [
  { icon: ShieldCheck, label: "Free Scan" },
  { icon: Zap, label: "Under 10 Seconds" },
  { icon: UserX, label: "No Signup Required" },
];

export default function HomePage(): JSX.Element {
  return (
    <div className="min-h-screen flex flex-col bg-secondary/40">
      <Navbar />

      <main className="flex-1">
        <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 sm:pt-24 pb-16 text-center">
          <span className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold uppercase tracking-wider">
            Security Made Accessible for African SMEs
          </span>
          <h1 className="mt-6 text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-gray-900 max-w-3xl mx-auto leading-[1.05]">
            Know Your Vulnerabilities Before Attackers Do.
          </h1>
          <p className="mt-5 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto">
            Free real-time security scan. No signup required.
          </p>

          <div className="mt-10">
            <ScanForm />
          </div>

          <ul className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            {TRUST_ITEMS.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-gray-500">
                <Icon size={18} className="text-primary" aria-hidden="true" />
                <span className="font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-gray-400">
          © 2026 PatchGuard. Security Made Accessible.
        </div>
      </footer>
    </div>
  );
}
