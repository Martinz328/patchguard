# PatchGuard — Security Made Accessible

**Free real-time website security scanner for African SMEs.**

🔗 **Live:** [patchguard.vercel.app](https://patchguard.vercel.app)

---

## What It Does

PatchGuard lets any business owner scan their website for security vulnerabilities in under 10 seconds, no technical knowledge required. Enter a URL, get a plain-English security report with severity ratings and actionable fix recommendations.

**Checks performed:**
- SSL/HTTPS certificate validity
- HTTP → HTTPS redirect
- HTTP Strict Transport Security (HSTS)
- Content Security Policy (CSP)
- Clickjacking Protection (X-Frame-Options)
- Content Type Protection (X-Content-Type-Options)
- Referrer Policy

**Scoring:** Each scan returns a score from 0–100 with a grade (GOOD / MODERATE / AT RISK). Critical findings include a direct link to book a fix consultation.

---

## Who It's For

Small and medium businesses in Cameroon and Central Africa that are digitizing without access to affordable cybersecurity expertise. PatchGuard makes security assessment accessible to any business owner — not just developers.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Backend | Supabase Edge Functions (Deno) |
| Database | Supabase PostgreSQL |
| Deployment | Vercel |

---

## Project Structure

```
patchguard/
├── supabase/
│   ├── functions/scan-url/index.ts   ← Scan engine (Edge Function)
│   └── migrations/                   ← Database schema
└── src/
    ├── components/                   ← UI components
    ├── pages/                        ← 4 pages: Home, Scanning, Report, Error
    ├── lib/                          ← Supabase client, URL validation, scoring
    └── types/                        ← TypeScript interfaces
```

---

## Running Locally

```bash
git clone https://github.com/Martinz328/patchguard.git
cd patchguard
npm install --legacy-peer-deps
```

Create `.env.local` in the project root:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

```bash
npm run dev
```

---

## Security Notes

PatchGuard is built securely by design:
- All scans run server-side via Supabase Edge Functions — no external fetches from the browser
- SSRF protection blocks private IP ranges in the scan engine
- No user accounts or personal data collected
- Scan results stored by UUID only — not linked to any identity
- RLS enabled on all database tables


---

## Roadmap (Post-MVP)

- PDF report export
- Scheduled recurring scans with email alerts
- API access for developers
- Multi-page deep scan
- Full Security-as-a-Service platform

---

## Built By

**Martinz** — Buea, Cameroon  
Founded 2026 | Cybersecurity for African SMEs

*Submitted to the Orange Social Venture Prize (OSVP) 2026*