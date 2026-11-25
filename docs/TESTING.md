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

Integration e2e (PowerShell) — sets the three required variables from the running stack:

```powershell
$v=@{}; npx supabase status -o env | % { if ($_ -match '^([A-Z_]+)="?(.*?)"?$') { $v[$matches[1]]=$matches[2] } }
$env:VITE_SUPABASE_URL=$v.API_URL; $env:VITE_SUPABASE_ANON_KEY=$v.ANON_KEY; $env:MAILPIT_URL=$v.MAILPIT_URL
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

| Date       | Environment                                | Command                            | Tests | Passed | Failed | Skipped | Notes                                                                                                                                                                                                                                 |
| ---------- | ------------------------------------------ | ---------------------------------- | ----- | ------ | ------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-25 | Win 11, Node 26.13                         | `npm test` (Phase 1)               | 33    | 33     | 0      | 0       | Vitest 5.1.1                                                                                                                                                                                                                          |
| 2026-11-25 | Win 11, Chromium 159                       | `npm run test:e2e` (Phase 1)       | 10    | 9      | 0      | 1       | Skip intentional: keyboard test desktop-only                                                                                                                                                                                          |
| 2026-11-25 | Win 11, Supabase CLI 3.4.0, Postgres 17.12 | `supabase db reset`                | —     | —      | —      | —       | 3 migrations + seed applied from scratch                                                                                                                                                                                              |
| 2026-11-25 | same                                       | `npm run test:db`                  | 70    | 70     | 0      | 0       | First run 67/69: two assertions read the audit log as a moderator (correctly denied); tests fixed and a moderator-denied assertion added                                                                                              |
| 2026-11-25 | same                                       | `supabase db lint --level warning` | —     | —      | —      | —       | Clean after fixing one implicit enum cast                                                                                                                                                                                             |
| 2026-11-25 | Win 11, Node 26.13                         | `npm test` (Phase 2)               | 71    | 71     | 0      | 0       | 7 files                                                                                                                                                                                                                               |
| 2026-11-25 | Win 11, Chromium 159                       | `npm run test:e2e` (Phase 2)       | 10    | 9      | 0      | 1       | Same intentional skip                                                                                                                                                                                                                 |
| 2026-11-25 | Win 11 + local Supabase                    | `npm run test:e2e:integration`     | 1     | 1      | 0      | 0       | Register → unconfirmed sign-in refused → confirm → sign in → profile edit persisted → sign out/in → delete → deleted sign-in refused. First run failed on a 5 s assertion timeout (sign-up took ~5 s locally); timeout raised to 15 s |
| 2026-11-25 | Win 11                                     | `npm run build`                    | —     | —      | —      | —       | Initial JS 106.7 KB gzip; Supabase chunk 79.2 KB loaded lazily                                                                                                                                                                        |
| —          | GitHub Actions                             | CI workflow                        | —     | —      | —      | —       | **Not yet run** — push blocked (token lacks `workflow` scope)                                                                                                                                                                         |

## 5. Known limitations

- No automated axe-core accessibility scan yet (KI-008).
- E2E runs Chromium only; Firefox/WebKit before release.
- Password-reset email journey is covered by component tests only, not integration e2e.
- pgTAP tests use fixed UUIDs and run inside a rolled-back transaction; they do not
  exercise PostgREST/HTTP — the integration e2e covers that path for auth and profiles.
