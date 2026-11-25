# ADR-0001: Technology stack

- **Status:** Accepted (engineering); hosting choice pending D-07
- **Date:** 2026-11-25

## Context

The repository was empty. We need a stack that a small team can maintain, that performs on
low-end Android devices, and that gives strong, testable access control without building
custom authentication.

## Decision

| Concern              | Choice                                                      | Reason                                                                       |
| -------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| UI                   | React 19 + TypeScript (strict)                              | Widely known, large talent pool, strong typing                               |
| Build                | Vite                                                        | Fast, simple, static output that any CDN can host                            |
| Routing              | React Router (data router, `createBrowserRouter`)           | Route-level error boundaries; lazy routes later                              |
| Data/API             | Supabase (PostgreSQL + PostgREST)                           | Relational model, RLS for database-enforced authorisation, migrations in git |
| Auth                 | Supabase Auth                                               | Mature provider; avoids custom auth                                          |
| Validation           | Zod (from Phase 2)                                          | One validation library shared by forms and data parsing                      |
| Unit/component tests | Vitest + React Testing Library + jest-dom                   | Native Vite integration                                                      |
| E2E                  | Playwright                                                  | Cross-browser, mobile viewports, reliable                                    |
| Quality              | ESLint (typescript-eslint, react-hooks, jsx-a11y), Prettier | Static checks, accessibility linting                                         |
| CI                   | GitHub Actions                                              | Repository is on GitHub                                                      |

## Alternatives considered

- **Next.js / SSR:** better SEO for listing pages, but adds a Node server runtime to operate
  and secure. Public opportunity pages benefit from SEO, so we revisit this if search
  traffic becomes a priority (pre-rendering of public routes is a lighter option).
- **Custom Node/Express API + ORM:** more control, but duplicates what PostgREST + RLS give
  us and increases the attack surface and ops burden.
- **Firebase:** document model fits the relational opportunity/review/audit data poorly.

## Consequences

- Authorisation must be written as Postgres RLS policies and `security definer` functions,
  and those must be tested directly (Phase 2).
- Local backend development requires Docker for the Supabase CLI stack.
- SPA means security headers are configured at the static host.
