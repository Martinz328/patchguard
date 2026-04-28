# Add Missing `src/lib/supabase.ts`

## Problem
The previous build created the UI shell, types (`src/types/scan.ts`), and utility libs, but skipped `src/lib/supabase.ts`. The project knowledge base requires this file as the **single** initialization point for the Supabase client. Without it, the upcoming Supabase wiring (Edge Function invocation for `/scanning`, persisting scan results, fetching `/report/:scanId`) will have nowhere to import a client from.

Note: scan **type definitions** already live in their correct location (`src/types/scan.ts`) per the folder-structure rule — `supabase.ts` is strictly for the client, not types.

## What to build

### 1. Create `src/lib/supabase.ts`
- Import `createClient` and `SupabaseClient` type from `@supabase/supabase-js`.
- Read `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env`.
- Validate both env vars are present at module load; if missing, throw a clear developer-facing error (this runs at app boot, never reaches end users — and the `/error` route still catches runtime failures downstream).
- Export a single typed `supabase: SupabaseClient` instance.
- No service-role key. No hardcoded URLs. No re-initialization elsewhere in the codebase.

### 2. Ensure dependency is installed
- Confirm `@supabase/supabase-js` (v2) is in `package.json`. If absent, add it.

### 3. Add env var template
- Create `.env.local.example` documenting:
  - `VITE_SUPABASE_URL=`
  - `VITE_SUPABASE_ANON_KEY=`
- Do **not** commit a real `.env.local`.

## What is NOT in scope
- No Supabase calls wired into pages yet (HomePage/ScanningPage/ReportPage stay on placeholder data).
- No Edge Function created.
- No DB migration.
- No changes to existing components or types.

## Files touched
- **Created**: `src/lib/supabase.ts`, `.env.local.example`
- **Maybe edited**: `package.json` (only if `@supabase/supabase-js` missing)

## After approval
Switch to default mode, create the file, verify the import resolves, and report back what's ready for the next phase (Edge Function + real scan wiring).
