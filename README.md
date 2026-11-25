# RISE NETWORK

**Opportunity. Access. Progress.**

RISE NETWORK is a South African community opportunity platform that helps young people
discover, understand and act on legitimate opportunities for education, skills development,
careers, mentorship and community participation.

> **Project status: pre-release, Phase 2 (data and security foundation).** The public site,
> database schema with Row Level Security, and accounts (register, sign in, password reset,
> profile, account deletion) are built and tested locally. The opportunity directory UI,
> moderation screens and admin features are **not yet built**. Nothing is deployed.
> See [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md).

## Features

| Feature                                                                                       | Status                                                          |
| --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Responsive, accessible app shell (navigation, skip link, focus management, 404, error page)   | Implemented, tested                                             |
| Home, About, Contact, draft Privacy notice and Terms of use                                   | Implemented, tested                                             |
| Opportunities / Learning / Careers sections                                                   | Placeholder pages that state clearly they are not available yet |
| Accounts: register (18+), confirm email, sign in/out, password reset, profile, delete account | Implemented, tested (unit, component, integration e2e)          |
| Database: schema, RLS, roles, audit log, moderation/report/role functions                     | Implemented, tested (70 pgTAP tests)                            |
| Opportunity directory, submission and moderation screens; saved opportunities UI              | Not started (Phase 3) — database layer exists                   |
| Admin dashboard, reports and audit screens                                                    | Not started (Phase 5) — database layer exists                   |

## Architecture

A React + TypeScript single-page app (Vite) backed by Supabase (PostgreSQL, Auth, Row Level
Security). Authorisation and data integrity are enforced in the database. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DECISIONS/](docs/DECISIONS/).

## Technology stack

React 19 · TypeScript (strict) · Vite · React Router · plain CSS with design tokens ·
Vitest + Testing Library · Playwright · ESLint + Prettier · GitHub Actions ·
Supabase (PostgreSQL 17, Auth, RLS) · zod.

## Getting started

Requirements: Node.js 22+, npm, and Docker (for the local Supabase stack).

```bash
git clone https://github.com/shaunmaselela25/Rise-network.git
cd Rise-network
npm ci
npm run dev            # http://localhost:5173
```

Without environment variables the public site runs and accounts show as unavailable.
To run with accounts locally:

```bash
npx supabase start          # first run downloads images; applies migrations + seed
npx supabase status         # copy API_URL and ANON_KEY
cp .env.example .env.local  # paste them into VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
npm run dev
```

The local stack uses ports 55320–55329 (Studio: http://127.0.0.1:55323, test inbox
Mailpit: http://127.0.0.1:55324). Seed data is clearly marked `[SAMPLE]`. To make a local
user an administrator, see [docs/DATA_MODEL.md §7](docs/DATA_MODEL.md#7-seed-data-strategy).

## Development commands

| Command                           | Purpose                                                                  |
| --------------------------------- | ------------------------------------------------------------------------ |
| `npm run dev`                     | Start dev server                                                         |
| `npm run build`                   | Typecheck and build to `dist/`                                           |
| `npm run preview`                 | Serve the production build on :4173                                      |
| `npm run typecheck`               | TypeScript checks                                                        |
| `npm run lint`                    | ESLint (zero warnings)                                                   |
| `npm run format` / `format:check` | Prettier                                                                 |
| `npm test`                        | Unit and component tests                                                 |
| `npm run test:e2e`                | Playwright end-to-end tests (run `npx playwright install chromium` once) |
| `npm run test:db`                 | Database (pgTAP) tests against the local Supabase stack                  |
| `npm run test:e2e:integration`    | Auth journey against local Supabase (see docs/TESTING.md for env setup)  |
| `npm run check`                   | All gates except e2e                                                     |

## Project structure

```
src/
  app/          routing, layout, error boundary
  components/   shared UI
  features/     business capabilities (home, info, opportunities, learning, careers, …)
  lib/          cross-cutting utilities
  styles/       design tokens and global CSS
e2e/            Playwright tests (*.integration.spec.ts need a backend)
supabase/       config, migrations, seed (dev fixtures), database tests
docs/           product, architecture, security, privacy, testing, operations docs
```

## Deployment

Not deployed. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Known limitations

See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately — see
[SECURITY.md](SECURITY.md).
