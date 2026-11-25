# RISE NETWORK — Product Roadmap

> Last updated: 2026-11-25. Status values: Not started · In progress · Implemented but
> unverified · Verified · Blocked · Deferred.

## Phases, dependencies and acceptance gates

| Phase                        | Scope                                                                                                           | Depends on                                        | Acceptance gate                                                                            | Status                                                                      |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| 0 Discovery                  | Repo inspection, requirements, assumptions, architecture, data model, plan                                      | —                                                 | Docs committed; open decisions listed                                                      | Implemented — decisions D-01..D-06, D-10 approved 2026-11-25                |
| 1 Engineering foundation     | Vite/React/TS strict, lint, format, tests, design tokens, app shell, routing, error handling, CI, docs          | 0                                                 | typecheck, lint, format, unit/component tests, e2e smoke, build all pass locally and in CI | Verified — CI green on PR #1, merged 2026-11-25                             |
| 2 Data & security foundation | Supabase project config, migrations, auth, profiles, roles, RLS, audit triggers, seed                           | 1, D-01, D-03, D-05, D-08; Docker running locally | Migrations apply from scratch; RLS tests prove role/ownership rules                        | Verified — CI green on PR #1 (70 pgTAP, integration e2e), merged 2026-11-25 |
| 3 Opportunities              | Directory, search, filters, detail, submission, moderation, publishing, expiry, saved                           | 2, D-02                                           | E2E journeys 1–3, 6–11 pass                                                                | Verified — CI green on PR #2 (incl. lifecycle e2e); awaiting merge approval |
| 4 Learning & career          | Resource directories + admin management                                                                         | 2                                                 | Component + RLS tests; e2e browse                                                          | Not started                                                                 |
| 5 Member & admin experience  | Dashboard, profile, submissions tracking, admin dashboard, users/roles, reports, audit viewer, account deletion | 3, 4, D-04                                        | E2E journeys 4, 5, 12; audit tests                                                         | Not started                                                                 |
| 6 Community (P1)             | Mentorship, events, partner profiles                                                                            | 5 + approved safeguarding policy                  | Defined per feature                                                                        | Deferred                                                                    |
| 7 Release preparation        | Regression, security/a11y/perf review, staging, backup/restore drill                                            | 5, D-07, D-09, D-11                               | Release checklist signed off                                                               | Not started                                                                 |
| 8 Production release         | Production deploy                                                                                               | 7 + explicit PO approval                          | Smoke tests in production; rollback verified                                               | Not started                                                                 |

## Key risks

| Risk                                         | Impact       | Mitigation                                                                    |
| -------------------------------------------- | ------------ | ----------------------------------------------------------------------------- |
| Fraudulent or stale listings damage trust    | High         | Mandatory source, human review, verification labels, reports, freshness flags |
| Minors using the platform without safeguards | High (legal) | D-01 before registration ships                                                |
| Moderation workload exceeds capacity         | Medium       | Submission rate limits; D-03; admin dashboard surfacing stale items           |
| RLS misconfiguration leaks data              | High         | RLS on every table, automated policy tests, security review gate              |
| Low-end devices / data costs                 | Medium       | Bundle budget, no heavy imagery, system fonts                                 |
| Single maintainer / bus factor               | Medium       | ADRs, docs, CI, conventional commits                                          |
