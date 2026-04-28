import type { Grade } from "@/types/scan";

export interface IScoreMeta {
  label: string;
  sentence: string;
  colorClass: string;
  bgClass: string;
  ringClass: string;
}

export function getScoreMeta(score: number, grade: Grade): IScoreMeta {
  if (score >= 80 || grade === "SECURE") {
    return {
      label: "Secure",
      sentence: "Your website has good security foundations.",
      colorClass: "text-success",
      bgClass: "bg-success/10",
      ringClass: "ring-success/30",
    };
  }
  if (score >= 50 || grade === "NEEDS_ATTENTION") {
    return {
      label: "Needs Attention",
      sentence: "Your website has some security gaps that need attention.",
      colorClass: "text-warning",
      bgClass: "bg-warning/10",
      ringClass: "ring-warning/30",
    };
  }
  return {
    label: "At Risk",
    sentence: "Your website has critical security vulnerabilities that attackers can exploit.",
    colorClass: "text-destructive",
    bgClass: "bg-destructive/10",
    ringClass: "ring-destructive/30",
  };
}
