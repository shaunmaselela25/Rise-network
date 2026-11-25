# RISE NETWORK

**Opportunity. Access. Progress.**

RISE NETWORK is a South African community opportunity platform that helps young people
discover, understand and act on legitimate opportunities for education, skills development,
careers, mentorship and community participation.

> **Project status: pre-release, Phase 1 (engineering foundation).** The public site shell is
> built and tested. The opportunity directory, accounts, moderation and admin features are
> **not yet implemented**. See [docs/PRODUCT_ROADMAP.md](docs/PRODUCT_ROADMAP.md).

## Features

| Feature                                                                                     | Status                                                          |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| Responsive, accessible app shell (navigation, skip link, focus management, 404, error page) | Implemented, tested                                             |
| Home, About, Contact, draft Privacy notice and Terms of use                                 | Implemented, tested                                             |
| Opportunities / Learning / Careers sections                                                 | Placeholder pages that state clearly they are not available yet |
| Accounts, profiles, saved opportunities                                                     | Not started (Phase 2–3)                                         |
| Opportunity submission, moderation, publishing                                              | Not started (Phase 3)                                           |
| Admin dashboard, reports, audit log                                                         | Not started (Phase 5)                                           |

## Architecture

A React + TypeScript single-page app (Vite) backed by Supabase (PostgreSQL, Auth, Row Level
Security). Authorisation and data integrity are enforced in the database. See
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) and [docs/DECISIONS/](docs/DECISIONS/).

## Technology stack

React 19 · TypeScript (strict) · Vite · React Router · plain CSS with design tokens ·
Vitest + Testing Library · Playwright · ESLint + Prettier · GitHub Actions ·
Supabase (planned, Phase 2).

## Getting started

Requirements: Node.js 22+ and npm. (Phase 2 will additionally need Docker for the local
Supabase stack.)

```bash
git clone https://github.com/shaunmaselela25/Rise-network.git
cd Rise-network
npm ci
npm run dev            # http://localhost:5173
```

No environment variables are needed yet. `.env.example` lists those planned for Phase 2.

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
| `npm run check`                   | All gates except e2e                                                     |

## Project structure

```
src/
  app/          routing, layout, error boundary
  components/   shared UI
  features/     business capabilities (home, info, opportunities, learning, careers, …)
  lib/          cross-cutting utilities
  styles/       design tokens and global CSS
e2e/            Playwright tests
docs/           product, architecture, security, privacy, testing, operations docs
```

## Deployment

Not deployed. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Known limitations

See [docs/KNOWN_ISSUES.md](docs/KNOWN_ISSUES.md).

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md). Report vulnerabilities privately — see
[SECURITY.md](SECURITY.md).
