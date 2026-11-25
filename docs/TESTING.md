# RISE NETWORK — Testing

Last updated: 2026-11-25.

## 1. Strategy

| Layer             | Tool                                    | What it covers                                                        | Location                    |
| ----------------- | --------------------------------------- | --------------------------------------------------------------------- | --------------------------- |
| Unit              | Vitest                                  | Pure functions, business rules, status transitions, date/expiry logic | `src/**/*.test.ts`          |
| Component         | Vitest + Testing Library (jsdom)        | Rendering, routing, accessibility semantics, user interaction         | `src/**/*.test.tsx`         |
| Integration / RLS | Vitest against local Supabase (Phase 2) | Policies, ownership, privileged RPCs, constraints                     | `supabase/tests/` (planned) |
| End-to-end        | Playwright (desktop + mobile Chromium)  | Critical user journeys against a production build                     | `e2e/`                      |

Queries in component tests use accessible roles and names, so tests double as accessibility
checks for labelling.

## 2. Commands

```bash
npm run typecheck      # TypeScript strict
npm run lint           # ESLint, zero warnings allowed
npm run format:check   # Prettier
npm test               # unit + component
npm run test:e2e       # builds, serves on :4173, runs Playwright
npm run check          # all of the above except e2e
```

First-time e2e setup: `npx playwright install chromium`.

## 3. Release gates

All of: typecheck, lint, format, unit/component, e2e, build, `npm audit --audit-level=high`;
from Phase 2 also migrations-from-scratch and RLS tests. Enforced in `.github/workflows/ci.yml`.

## 4. Test evidence log

| Date       | Environment                                                | Command            | Files | Tests | Passed | Failed | Skipped | Notes                                                                     |
| ---------- | ---------------------------------------------------------- | ------------------ | ----- | ----- | ------ | ------ | ------- | ------------------------------------------------------------------------- |
| 2026-11-25 | Windows 11, Node 26.13, local                              | `npm test`         | 4     | 33    | 33     | 0      | 0       | Vitest 5.1.1                                                              |
| 2026-11-25 | Windows 11, Node 26.13, local, Chromium headless shell 159 | `npm run test:e2e` | 1     | 10    | 9      | 0      | 1       | Skip is intentional: keyboard skip-link test runs on desktop project only |
| 2026-11-25 | Windows 11, Node 26.13, local                              | `npm run build`    | —     | —     | —      | —      | —       | Success; JS 104.6 KB gzip                                                 |
| —          | GitHub Actions                                             | CI workflow        | —     | —     | —      | —      | —       | **Not yet run** (branch not pushed)                                       |

## 5. Known limitations

- No automated axe-core accessibility scan yet (KI-008).
- No integration tests yet — there is no backend (Phase 2).
- E2E runs Chromium only; Firefox/WebKit to be added before release.
