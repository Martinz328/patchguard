import type { GradeType, IFinding } from "@/types/scan";

export function calculateScore(findings: IFinding[]): number {
  const baseScore: number = 100;
  const penalty: number = findings.reduce((acc: number, finding: IFinding) => {
    if (finding.severity === "CRITICAL") return acc + 20;
    if (finding.severity === "WARNING") return acc + 8;
    return acc;
  }, 0);

  const raw: number = baseScore - penalty;
  return Math.max(0, Math.min(100, raw));
}

export function getGrade(score: number): GradeType {
  const clamped: number = Math.max(0, Math.min(100, score));
  if (clamped >= 80) return "GOOD";
  if (clamped >= 50) return "MODERATE";
  return "AT_RISK";
}

export function getScoreColor(grade: GradeType): string {
  if (grade === "GOOD") return "#16A34A";
  if (grade === "MODERATE") return "#D97706";
  return "#DC2626";
}

export function getScoreMessage(grade: GradeType): string {
  if (grade === "GOOD") return "Your website has good security foundations.";
  if (grade === "MODERATE") return "Your website has some security gaps that need attention.";
  return "Your website has critical security vulnerabilities that attackers can exploit.";
}
/**
 * Helper to get all score-related metadata in one object
 * This satisfies the 'getScoreMeta' import error in components
 */
export const getScoreMeta = (score: number) => {
  const grade = getGrade(score);
  return {
    grade,
    color: getScoreColor(grade),
    message: getScoreMessage(grade),
  };
};