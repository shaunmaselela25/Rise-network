# RISE NETWORK — Testing

Last updated: 2026-11-25.

## 1. Strategy

| Layer                    | Tool                                  | What it covers                                                                                                              | Location                    |
| ------------------------ | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| Unit                     | Vitest                                | Validation schemas, redirect safety, config parsing, formatting                                                             | `src/**/*.test.ts`          |
| Component                | Vitest + Testing Library (jsdom)      | Rendering, routing, auth forms (mocked Supabase client), accessibility semantics                                            | `src/**/*.test.tsx`         |
| Database                 | pgTAP via `supabase test db`          | RLS, privileges, constraints, workflow functions, audit, rate limits, account deletion — run as anon/member/moderator/admin | `supabase/tests/database/`  |
| End-to-end (smoke)       | Playwright, desktop + mobile Chromium | Public site without a backend                                                                                               | `e2e/*.spec.ts`             |
| End-to-end (integration) | Playwright against local Supabase     | Real auth + database journeys (email confirmation via Mailpit)                                                              | `e2e/*.integration.spec.ts` |

Component tests query by accessible role and name, so they double as labelling checks.
Security-critical logic is mutation-checked where practical (e.g. weakening
`safeNextPath` made 5 tests fail — 2026-11-25).

## 2. Commands

```bash
npm run typecheck      # TypeScript strict
npm run lint           # ESLint, zero warnings allowed
npm run format:check   # Prettier
npm test               # unit + component
npm run test:e2e       # smoke e2e (builds, serves on :4173)
npm run check          # typecheck + lint + format + unit + build

# Backend (Docker required)
npx supabase start                      # applies migrations + seed
npm run test:db                         # pgTAP database tests
npx supabase db lint --level warning    # Postgres function lint
```

Integration e2e (PowerShell) — sets the required variables from the running local stack:

```powershell
$v=@{}; npx supabase status -o env | % { if ($_ -match '^([A-Z_]+)="?(.*?)"?$') { $v[$matches[1]]=$matches[2] } }
$env:VITE_SUPABASE_URL=$v.API_URL; $env:VITE_SUPABASE_ANON_KEY=$v.ANON_KEY; $env:MAILPIT_URL=$v.MAILPIT_URL
$env:SUPABASE_SERVICE_ROLE_KEY=$v.SERVICE_ROLE_KEY   # test process only; never a VITE_ variable
npm run test:e2e:integration
```

Bash equivalent: `set -a; . <(npx supabase status -o env); set +a;
VITE_SUPABASE_URL=$API_URL VITE_SUPABASE_ANON_KEY=$ANON_KEY npm run test:e2e:integration`.

First-time e2e setup: `npx playwright install chromium`.

## 3. Release gates

Typecheck, lint, format, unit/component, smoke e2e, build, `npm audit --audit-level=high`,
migrations from scratch, pgTAP, db lint, integration e2e. All are in
`.github/workflows/ci.yml` (jobs `quality`, `e2e`, `database`).

## 4. Test evidence log

| Date       | Environment                                | Command                                           | Tests | Passed | Failed | Skipped | Notes                                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------ | ------------------------------------------------- | ----- | ------ | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-25 | Win 11, Node 26.13                         | `npm test` (Phase 1)                              | 33    | 33     | 0      | 0       | Vitest 5.1.1                                                                                                                                                                                                                          |
| 2026-11-25 | Win 11, Chromium 159                       | `npm run test:e2e` (Phase 1)                      | 10    | 9      | 0      | 1       | Skip intentional: keyboard test desktop-only                                                                                                                                                                                          |
| 2026-11-25 | Win 11, Supabase CLI 3.4.0, Postgres 17.12 | `supabase db reset`                               | —     | —      | —      | —       | 3 migrations + seed applied from scratch                                                                                                                                                                                              |
| 2026-11-25 | same                                       | `npm run test:db`                                 | 70    | 70     | 0      | 0       | First run 67/69: two assertions read the audit log as a moderator (correctly denied); tests fixed and a moderator-denied assertion added                                                                                              |
| 2026-11-25 | same                                       | `supabase db lint --level warning`                | —     | —      | —      | —       | Clean after fixing one implicit enum cast                                                                                                                                                                                             |
| 2026-11-25 | Win 11, Node 26.13                         | `npm test` (Phase 2)                              | 71    | 71     | 0      | 0       | 7 files                                                                                                                                                                                                                               |
| 2026-11-25 | Win 11, Chromium 159                       | `npm run test:e2e` (Phase 2)                      | 10    | 9      | 0      | 1       | Same intentional skip                                                                                                                                                                                                                 |
| 2026-11-25 | Win 11 + local Supabase                    | `npm run test:e2e:integration`                    | 1     | 1      | 0      | 0       | Register → unconfirmed sign-in refused → confirm → sign in → profile edit persisted → sign out/in → delete → deleted sign-in refused. First run failed on a 5 s assertion timeout (sign-up took ~5 s locally); timeout raised to 15 s |
| 2026-11-25 | Win 11                                     | `npm run build`                                   | —     | —      | —      | —       | Initial JS 106.7 KB gzip; Supabase chunk 79.2 KB loaded lazily                                                                                                                                                                        |
| 2026-11-25 | GitHub Actions (ubuntu-latest)             | CI on PR #1                                       | —     | —      | 0      | —       | All jobs green: quality (71 unit), e2e (9 + 1 intentional skip), database (70 pgTAP, lint clean, integration e2e 1/1)                                                                                                                 |
| 2026-11-25 | Win 11 + local Supabase                    | `supabase db reset` + `npm run test:db` (Phase 3) | 70    | 70     | 0      | 0       | 5 migrations applied from scratch; db lint clean                                                                                                                                                                                      |
| 2026-11-25 | Win 11, Node 26.13                         | `npm test` (Phase 3)                              | 115   | 115    | 0      | 0       | 12 files. First run 114/115: a test queried the optional "Note" field by its exact name; fixed the query                                                                                                                              |
| 2026-11-25 | Win 11, Chromium 159                       | `npm run test:e2e` (Phase 3, incl. axe)           | 30    | 29     | 0      | 1       | Smoke + axe scans of 10 public pages on desktop and mobile; same intentional skip                                                                                                                                                     |
| 2026-11-25 | Win 11 + local Supabase                    | `npm run test:e2e:integration` (Phase 3)          | 3     | 3      | 0      | 0       | Auth journey; full opportunity lifecycle with axe scans of submit, moderation, directory, detail and saved screens; bundle service-key check. First lifecycle run failed: `service_role` had no table privileges → migration 5        |
| 2026-11-25 | Win 11                                     | axe sanity check (temporary test)                 | 1     | 1      | 0      | 0       | Injected unlabelled image and button were detected; temporary test then deleted                                                                                                                                                       |
| 2026-11-25 | Win 11                                     | `npm run build` (Phase 3)                         | —     | —      | —      | —       | Initial JS 107.5 KB gzip; Supabase chunk 80.5 KB loaded lazily                                                                                                                                                                        |

## 5. Known limitations

- axe-core detects only a subset of WCAG issues; manual keyboard and screen-reader review is
  still required before release.
- E2E runs Chromium only; Firefox/WebKit before release.
- Password-reset email journey is covered by component tests only, not integration e2e.
- pgTAP tests use fixed UUIDs and run inside a rolled-back transaction; they do not
  exercise PostgREST/HTTP — the integration e2e covers that path.
- The integration suite needs `SUPABASE_SERVICE_ROLE_KEY` (local stack key) for the lifecycle
  journey; without it that test is skipped, not passed.
