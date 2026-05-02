import { Calendar } from "lucide-react";

interface IConsultationCTAProps {
  findingName?: string;
}

const CALENDLY_URL = "https://calendly.com/patchguard/30min";

export function ConsultationCTA({ findingName }: IConsultationCTAProps): JSX.Element {
  const handleClick = (): void => {
    window.open(CALENDLY_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={findingName ? `Book a consultation to fix ${findingName}` : "Book a fix consultation"}
      className="mt-4 w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-destructive text-destructive-foreground font-semibold shadow-sm transition-colors hover:bg-destructive/90 focus:outline-none focus:ring-4 focus:ring-destructive/30"
    >
      <Calendar size={18} aria-hidden="true" />
      <span>Book a Fix Consultation</span>
    </button>
  );
}
