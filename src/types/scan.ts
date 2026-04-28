export type Severity = "CRITICAL" | "WARNING" | "PASS";

export type Grade = "SECURE" | "NEEDS_ATTENTION" | "AT_RISK";

export interface IFinding {
  id: string;
  name: string;
  severity: Severity;
  explanation: string;
  recommendation: string;
}

export interface IScanReport {
  scanId: string;
  url: string;
  scannedAt: string;
  score: number;
  grade: Grade;
  findings: IFinding[];
}

export type ErrorReason = "UNREACHABLE" | "TIMEOUT" | "UNKNOWN";
