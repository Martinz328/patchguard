import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type SeverityLevel = "CRITICAL" | "WARNING" | "PASS";
type GradeType = "GOOD" | "MODERATE" | "AT_RISK";

interface IFinding {
  id: string;
  name: string;
  severity: SeverityLevel;
  explanation: string;
  recommendation: string;
  learnMoreUrl?: string;
}

interface IScanResult {
  scanId: string;
  url: string;
  scannedAt: string;
  score: number;
  grade: GradeType;
  findings: IFinding[];
  durationMs: number;
}

interface IScanError {
  error: true;
  errorType: "UNREACHABLE" | "TIMEOUT" | "INVALID_URL" | "UNKNOWN";
  message: string;
}

type ScanResponse = IScanResult | IScanError;

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

const FETCH_TIMEOUT_MS: number = 5000;

function jsonResponse(body: ScanResponse): Response {
  return new Response(JSON.stringify(body), { status: 200, headers: CORS_HEADERS });
}

function getClientIp(req: Request): string | null {
  const forwardedFor: string | null = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first: string = forwardedFor.split(",")[0]?.trim() ?? "";
    if (first) return first;
  }
  const realIp: string | null = req.headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  return null;
}

function parseAndNormalizeUrl(raw: unknown): URL | null {
  if (typeof raw !== "string") return null;
  const trimmed: string = raw.trim();
  if (!trimmed) return null;
  try {
    const u: URL = new URL(trimmed);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname) return null;
    return u;
  } catch {
    return null;
  }
}

function createFinding(params: {
  id: string;
  name: string;
  severity: SeverityLevel;
  explanation: string;
  recommendation: string;
}): IFinding {
  return {
    id: params.id,
    name: params.name,
    severity: params.severity,
    explanation: params.explanation,
    recommendation: params.recommendation,
  };
}

function calculateScore(findings: IFinding[]): number {
  const baseScore: number = 100;
  const penalty: number = findings.reduce((acc: number, finding: IFinding) => {
    if (finding.severity === "CRITICAL") return acc + 20;
    if (finding.severity === "WARNING") return acc + 8;
    return acc;
  }, 0);
  const raw: number = baseScore - penalty;
  return Math.max(0, Math.min(100, raw));
}

function getGrade(score: number): GradeType {
  const clamped: number = Math.max(0, Math.min(100, score));
  if (clamped >= 80) return "GOOD";
  if (clamped >= 50) return "MODERATE";
  return "AT_RISK";
}

function sortFindings(findings: IFinding[]): IFinding[] {
  const severityRank: Record<SeverityLevel, number> = { CRITICAL: 0, WARNING: 1, PASS: 2 };
  return [...findings].sort((a: IFinding, b: IFinding) => {
    const sr: number = severityRank[a.severity] - severityRank[b.severity];
    if (sr !== 0) return sr;
    return a.name.localeCompare(b.name);
  });
}

function withTimeout(init: RequestInit, timeoutMs: number): RequestInit & { signal: AbortSignal } {
  const controller: AbortController = new AbortController();
  const id: number = setTimeout(() => controller.abort(), timeoutMs) as unknown as number;
  const originalSignal: AbortSignal | null = init.signal ?? null;

  if (originalSignal) {
    if (originalSignal.aborted) controller.abort();
    else {
      originalSignal.addEventListener(
        "abort",
        () => controller.abort(),
        { once: true },
      );
    }
  }

  controller.signal.addEventListener(
    "abort",
    () => clearTimeout(id),
    { once: true },
  );

  return { ...init, signal: controller.signal };
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const timed: RequestInit & { signal: AbortSignal } = withTimeout(init, timeoutMs);
  return await fetch(url, timed);
}

function isIpv4(ip: string): boolean {
  return /^(\d{1,3}\.){3}\d{1,3}$/.test(ip);
}

function parseIpv4ToInt(ip: string): number | null {
  if (!isIpv4(ip)) return null;
  const parts: number[] = ip.split(".").map((p: string) => Number(p));
  if (parts.length !== 4) return null;
  if (parts.some((n: number) => !Number.isInteger(n) || n < 0 || n > 255)) return null;
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isIpv4InCidr(ip: string, base: string, prefix: number): boolean {
  const ipInt: number | null = parseIpv4ToInt(ip);
  const baseInt: number | null = parseIpv4ToInt(base);
  if (ipInt === null || baseInt === null) return false;
  const mask: number = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

function normalizeIpv6(ip: string): string {
  return ip.trim().toLowerCase();
}

function isIpv6(ip: string): boolean {
  const v: string = normalizeIpv6(ip);
  if (!v.includes(":")) return false;
  // Deno's DNS will typically return canonical IPv6 strings. We'll keep checks prefix-based.
  return true;
}

function isRoutableIp(ip: string): boolean {
  if (isIpv4(ip)) {
    if (ip === "0.0.0.0") return false;
    if (isIpv4InCidr(ip, "127.0.0.0", 8)) return false; // loopback
    if (isIpv4InCidr(ip, "10.0.0.0", 8)) return false; // private
    if (isIpv4InCidr(ip, "172.16.0.0", 12)) return false; // private
    if (isIpv4InCidr(ip, "192.168.0.0", 16)) return false; // private
    if (isIpv4InCidr(ip, "169.254.0.0", 16)) return false; // link-local
    if (isIpv4InCidr(ip, "100.64.0.0", 10)) return false; // carrier-grade NAT
    if (isIpv4InCidr(ip, "192.0.0.0", 24)) return false; // IETF protocol assignments
    if (isIpv4InCidr(ip, "192.0.2.0", 24)) return false; // TEST-NET-1
    if (isIpv4InCidr(ip, "198.18.0.0", 15)) return false; // benchmarking
    if (isIpv4InCidr(ip, "198.51.100.0", 24)) return false; // TEST-NET-2
    if (isIpv4InCidr(ip, "203.0.113.0", 24)) return false; // TEST-NET-3
    if (isIpv4InCidr(ip, "224.0.0.0", 4)) return false; // multicast
    if (isIpv4InCidr(ip, "240.0.0.0", 4)) return false; // reserved
    return true;
  }

  if (isIpv6(ip)) {
    const v: string = normalizeIpv6(ip);
    if (v === "::" || v === "::0") return false; // unspecified
    if (v === "::1") return false; // loopback
    if (v.startsWith("fe80:")) return false; // link-local
    if (v.startsWith("fc") || v.startsWith("fd")) return false; // unique local fc00::/7
    if (v.startsWith("ff")) return false; // multicast
    // documentation ranges 2001:db8::/32
    if (v.startsWith("2001:db8:")) return false;
    return true;
  }

  return false;
}

async function resolveAndValidateHostname(hostname: string): Promise<
  | { ok: true }
  | { ok: false; errorType: "INVALID_URL" | "UNREACHABLE"; message: string }
> {
  const lower: string = hostname.trim().toLowerCase();
  if (!lower) return { ok: false, message: "Please enter a valid website address." };
  if (lower === "localhost") {
    return { ok: false, errorType: "INVALID_URL", message: "That website address is not allowed." };
  }

  if (isIpv4(lower) || isIpv6(lower)) {
    if (!isRoutableIp(lower)) {
      return { ok: false, errorType: "INVALID_URL", message: "That website address is not allowed." };
    }
    return { ok: true };
  }

  const ips: string[] = [];
  try {
    const aRecords: string[] = await Deno.resolveDns(lower, "A");
    ips.push(...aRecords);
  } catch {
    // ignore; some hosts only have AAAA
  }

  try {
    const aaaaRecords: string[] = await Deno.resolveDns(lower, "AAAA");
    ips.push(...aaaaRecords);
  } catch {
    // ignore
  }

  if (ips.length === 0) {
    return {
      ok: false,
      errorType: "UNREACHABLE",
      message: "We couldn't reach that website. Please double-check the address and try again.",
    };
  }

  const allRoutable: boolean = ips.every((ip: string) => isRoutableIp(ip));
  if (!allRoutable) {
    return { ok: false, errorType: "INVALID_URL", message: "That website address is not allowed." };
  }

  return { ok: true };
}

async function fetchHeaders(url: string): Promise<Response> {
  const head: Response = await fetchWithTimeout(
    url,
    { method: "HEAD", redirect: "follow" },
    FETCH_TIMEOUT_MS,
  );

  if (head.status === 405 || head.status === 501) {
    return await fetchWithTimeout(
      url,
      { method: "GET", redirect: "follow" },
      FETCH_TIMEOUT_MS,
    );
  }

  return head;
}

function isTimeoutError(err: unknown): boolean {
  return err instanceof DOMException && err.name === "AbortError";
}

async function runCheckSslCertificate(inputUrl: URL): Promise<IFinding> {
  const name: string = "SSL Certificate";
  const isHttps: boolean = inputUrl.protocol === "https:";
  if (!isHttps) {
    return createFinding({
      id: "ssl_https",
      name,
      severity: "CRITICAL",
      explanation:
        "Your website does not use HTTPS. All data sent between your visitors and your site is unencrypted and visible to attackers.",
      recommendation:
        "Switch to HTTPS immediately. Contact your hosting provider to install a free SSL certificate via Let's Encrypt.",
    });
  }

  try {
    await fetchWithTimeout(inputUrl.toString(), { method: "HEAD", redirect: "follow" }, FETCH_TIMEOUT_MS);
    return createFinding({
      id: "ssl_https",
      name,
      severity: "PASS",
      explanation: "Your website uses HTTPS — data between your visitors and your site is encrypted.",
      recommendation: "Keep your SSL certificate up to date and renew it before it expires.",
    });
  } catch {
    return createFinding({
      id: "ssl_https",
      name,
      severity: "WARNING",
      explanation: "We couldn't fully verify your SSL certificate. It may be expired or misconfigured.",
      recommendation: "Check your SSL certificate expiry date and ensure it's properly installed.",
    });
  }
}

async function runCheckHsts(inputUrl: URL): Promise<IFinding> {
  const name: string = "HTTP Strict Transport Security (HSTS)";
  try {
    const res: Response = await fetchHeaders(inputUrl.toString());
    const hsts: string | null = res.headers.get("strict-transport-security");
    if (hsts && hsts.trim()) {
      return createFinding({
        id: "hsts_header",
        name,
        severity: "PASS",
        explanation:
          "Your website tells browsers to always use a secure connection. This prevents attackers from downgrading your connection to HTTP.",
        recommendation: "Keep HSTS enabled and review it whenever you change hosting or CDN settings.",
      });
    }
    return createFinding({
      id: "hsts_header",
      name,
      severity: "WARNING",
      explanation:
        "Your website doesn't tell browsers to always use a secure connection. Attackers could intercept traffic on first visit.",
      recommendation:
        "Add this header to your server: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    });
  } catch {
    return createFinding({
      id: "hsts_header",
      name,
      severity: "WARNING",
      explanation:
        "We couldn't check this setting right now. Your website may still be fine, but we couldn't confirm it.",
      recommendation:
        "If you manage your hosting, add: Strict-Transport-Security: max-age=31536000; includeSubDomains",
    });
  }
}

async function runCheckXFrameOptions(inputUrl: URL): Promise<IFinding> {
  const name: string = "Clickjacking Protection";
  try {
    const res: Response = await fetchHeaders(inputUrl.toString());
    const xfo: string | null = res.headers.get("x-frame-options");
    const v: string = (xfo ?? "").trim().toUpperCase();
    if (v === "DENY" || v === "SAMEORIGIN") {
      return createFinding({
        id: "x_frame_options",
        name,
        severity: "PASS",
        explanation:
          "Your website is protected against clickjacking attacks where attackers trick users into clicking hidden buttons.",
        recommendation: "Keep this protection enabled for all pages, especially admin and checkout pages.",
      });
    }
    return createFinding({
      id: "x_frame_options",
      name,
      severity: "WARNING",
      explanation:
        "Your website could be embedded in a hidden frame on an attacker's website, tricking your customers into performing unintended actions.",
      recommendation: "Add this header to your server: X-Frame-Options: SAMEORIGIN",
    });
  } catch {
    return createFinding({
      id: "x_frame_options",
      name,
      severity: "WARNING",
      explanation:
        "We couldn't check this setting right now. Your website may still be fine, but we couldn't confirm it.",
      recommendation: "Add this header to your server: X-Frame-Options: SAMEORIGIN",
    });
  }
}

async function runCheckXContentTypeOptions(inputUrl: URL): Promise<IFinding> {
  const name: string = "Content Type Protection";
  try {
    const res: Response = await fetchHeaders(inputUrl.toString());
    const xcto: string | null = res.headers.get("x-content-type-options");
    const v: string = (xcto ?? "").trim().toLowerCase();
    if (v === "nosniff") {
      return createFinding({
        id: "x_content_type_options",
        name,
        severity: "PASS",
        explanation: "Your website prevents browsers from guessing file types, reducing the risk of certain attacks.",
        recommendation: "Keep this protection enabled across your site.",
      });
    }
    return createFinding({
      id: "x_content_type_options",
      name,
      severity: "WARNING",
      explanation:
        "Browsers may try to guess the type of files your website sends, which can lead to security vulnerabilities.",
      recommendation: "Add this header: X-Content-Type-Options: nosniff",
    });
  } catch {
    return createFinding({
      id: "x_content_type_options",
      name,
      severity: "WARNING",
      explanation:
        "We couldn't check this setting right now. Your website may still be fine, but we couldn't confirm it.",
      recommendation: "Add this header: X-Content-Type-Options: nosniff",
    });
  }
}

async function runCheckCsp(inputUrl: URL): Promise<IFinding> {
  const name: string = "Content Security Policy (CSP)";
  try {
    const res: Response = await fetchHeaders(inputUrl.toString());
    const csp: string | null = res.headers.get("content-security-policy");
    if (csp && csp.trim()) {
      return createFinding({
        id: "content_security_policy",
        name,
        severity: "PASS",
        explanation:
          "Your website has a Content Security Policy that restricts what code can run on your pages, protecting against script injection attacks.",
        recommendation: "Review your CSP whenever you add new scripts, analytics, or third-party tools.",
      });
    }
    return createFinding({
      id: "content_security_policy",
      name,
      severity: "CRITICAL",
      explanation:
        "Your website has no Content Security Policy. Attackers who find a vulnerability can inject malicious scripts that steal your customers' data or passwords.",
      recommendation:
        "Add a Content-Security-Policy header. Start with: Content-Security-Policy: default-src 'self' — then work with a developer to customize it for your site.",
    });
  } catch {
    return createFinding({
      id: "content_security_policy",
      name,
      severity: "CRITICAL",
      explanation:
        "We couldn't confirm if your website has a Content Security Policy. If it’s missing, attackers can inject malicious scripts on your pages.",
      recommendation:
        "Add a Content-Security-Policy header. Start with: Content-Security-Policy: default-src 'self' — then customize it with a developer.",
    });
  }
}

async function runCheckHttpToHttpsRedirect(inputUrl: URL): Promise<IFinding> {
  const name: string = "HTTP to HTTPS Redirect";
  const httpUrl: URL = new URL(inputUrl.toString());
  httpUrl.protocol = "http:";

  try {
    const res: Response = await fetchWithTimeout(
      httpUrl.toString(),
      { method: "GET", redirect: "follow" },
      FETCH_TIMEOUT_MS,
    );
    const finalUrl: string = res.url || httpUrl.toString();
    const final: URL = new URL(finalUrl);
    if (final.protocol === "https:") {
      return createFinding({
        id: "http_to_https_redirect",
        name,
        severity: "PASS",
        explanation:
          "Your website automatically redirects visitors from HTTP to HTTPS, ensuring all traffic is encrypted.",
        recommendation: "Keep the redirect in place and ensure it applies to every page on your site.",
      });
    }

    return createFinding({
      id: "http_to_https_redirect",
      name,
      severity: "CRITICAL",
      explanation:
        "Your website does not automatically redirect visitors to the secure version. Some visitors may use the unencrypted version without knowing.",
      recommendation:
        "Configure your server to redirect all HTTP traffic to HTTPS automatically. This is usually a one-line change in your server configuration.",
    });
  } catch {
    return createFinding({
      id: "http_to_https_redirect",
      name,
      severity: "CRITICAL",
      explanation:
        "Your website does not automatically redirect visitors to the secure version. Some visitors may use the unencrypted version without knowing.",
      recommendation:
        "Configure your server to redirect all HTTP traffic to HTTPS automatically. This is usually a one-line change in your server configuration.",
    });
  }
}

async function runCheckReferrerPolicy(inputUrl: URL): Promise<IFinding> {
  const name: string = "Referrer Policy";
  try {
    const res: Response = await fetchHeaders(inputUrl.toString());
    const rp: string | null = res.headers.get("referrer-policy");
    if (rp && rp.trim()) {
      return createFinding({
        id: "referrer_policy",
        name,
        severity: "PASS",
        explanation: "Your website controls how much information is shared when visitors click links to other websites.",
        recommendation: "Review this policy if you change analytics or third-party integrations.",
      });
    }
    return createFinding({
      id: "referrer_policy",
      name,
      severity: "WARNING",
      explanation:
        "When visitors leave your website by clicking a link, their browser may share your full page URL with the destination site, potentially leaking sensitive information.",
      recommendation: "Add this header: Referrer-Policy: strict-origin-when-cross-origin",
    });
  } catch {
    return createFinding({
      id: "referrer_policy",
      name,
      severity: "WARNING",
      explanation:
        "We couldn't check this setting right now. Your website may still be fine, but we couldn't confirm it.",
      recommendation: "Add this header: Referrer-Policy: strict-origin-when-cross-origin",
    });
  }
}

function mapUnknownToScanError(err: unknown): IScanError {
  if (isTimeoutError(err)) {
    return { error: true, errorType: "TIMEOUT", message: "The scan took too long. Please try again." };
  }
  return { error: true, errorType: "UNKNOWN", message: "Something went wrong. Please try again." };
}

async function insertScanResult(params: {
  scanId: string;
  url: string;
  score: number;
  grade: GradeType;
  findings: IFinding[];
  durationMs: number;
  ipAddress: string | null;
}): Promise<void> {
  const supabaseUrl: string | undefined = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey: string | undefined = Deno.env.get("PG_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) return;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  await supabase.from("scan_results").insert({
    id: params.scanId,
    url: params.url,
    score: params.score,
    grade: params.grade,
    findings: params.findings,
    duration_ms: params.durationMs,
    ip_address: params.ipAddress,
  });
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { status: 200, headers: CORS_HEADERS });
  }

  if (req.method !== "POST") {
    return jsonResponse({
      error: true,
      errorType: "UNKNOWN",
      message: "Please send a POST request to scan a website.",
    });
  }

  const startedAt: number = Date.now();
  const scanId: string = crypto.randomUUID();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonResponse({
      error: true,
      errorType: "INVALID_URL",
      message: "Please enter a valid website address.",
    });
  }

  const submittedUrl: unknown = (body as Record<string, unknown> | null)?.url;
  const normalizedUrl: URL | null = parseAndNormalizeUrl(submittedUrl);
  if (!normalizedUrl) {
    return jsonResponse({
      error: true,
      errorType: "INVALID_URL",
      message: "Please enter a valid website address (example: https://yourbusiness.com).",
    });
  }

  const hostnameCheck = await resolveAndValidateHostname(normalizedUrl.hostname);
  if (!hostnameCheck.ok) {
    return jsonResponse({
      error: true,
      errorType: hostnameCheck.errorType,
      message: hostnameCheck.message,
    });
  }

  try {
    const checkPromises: Promise<IFinding>[] = [
      runCheckSslCertificate(normalizedUrl),
      runCheckHsts(normalizedUrl),
      runCheckXFrameOptions(normalizedUrl),
      runCheckXContentTypeOptions(normalizedUrl),
      runCheckCsp(normalizedUrl),
      runCheckHttpToHttpsRedirect(normalizedUrl),
      runCheckReferrerPolicy(normalizedUrl),
    ];

    const settled: PromiseSettledResult<IFinding>[] = await Promise.allSettled(checkPromises);
    const findings: IFinding[] = settled.flatMap((r: PromiseSettledResult<IFinding>) => {
      if (r.status === "fulfilled") return [r.value];
      const err: IScanError = mapUnknownToScanError(r.reason);
      const fallback: IFinding = createFinding({
        id: crypto.randomUUID(),
        name: "Scan Check",
        severity: err.errorType === "TIMEOUT" ? "WARNING" : "WARNING",
        explanation: "We couldn't complete one of the checks. Your report may be missing some details.",
        recommendation: "Please try scanning again in a moment.",
      });
      return [fallback];
    });

    const ordered: IFinding[] = sortFindings(findings);
    const score: number = calculateScore(ordered);
    const grade: GradeType = getGrade(score);
    const durationMs: number = Date.now() - startedAt;

    const result: IScanResult = {
      scanId,
      url: normalizedUrl.toString(),
      scannedAt: new Date().toISOString(),
      score,
      grade,
      findings: ordered,
      durationMs,
    };

    const ipAddress: string | null = getClientIp(req);
    await insertScanResult({
      scanId: result.scanId,
      url: result.url,
      score: result.score,
      grade: result.grade,
      findings: result.findings,
      durationMs: result.durationMs,
      ipAddress,
    });

    return jsonResponse(result);
  } catch (err: unknown) {
    const e: IScanError = mapUnknownToScanError(err);
    return jsonResponse(e);
  }
});

