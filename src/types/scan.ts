export type SeverityLevel = "CRITICAL" | "WARNING" | "PASS";
export type GradeType = "GOOD" | "MODERATE" | "AT_RISK";

export interface IFinding {
  id: string;
  name: string;
  severity: SeverityLevel;
  explanation: string;
  recommendation: string;
  learnMoreUrl?: string;
}

export interface IScanResult {
  scanId: string;
  url: string;
  scannedAt: string;
  score: number;
  grade: GradeType;
  findings: IFinding[];
  durationMs: number;
}

export interface IScanRequest {
  url: string;
}

export interface IScanError {
  error: true;
  errorType: "UNREACHABLE" | "TIMEOUT" | "INVALID_URL" | "UNKNOWN";
  message: string;
}

export type ScanResponse = IScanResult | IScanError;
