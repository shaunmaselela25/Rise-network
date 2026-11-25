# Changelog

All notable changes are recorded here. Format based on
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/); versions follow
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added — Phase 3 (opportunities)

- Opportunity directory: full-text search, filters (type, field, province, qualification,
  closing window, include closed), sorting, pagination, shareable URLs.
- Opportunity detail: verification explanation, source and last-checked date, closed banner,
  https-only apply link, save and report.
- Submissions: submit, save draft, edit, resubmit, delete draft, review history and notes.
- Moderation: review queue, publish/request changes/reject/unpublish/archive, verification
  updates, freshness flag (D-06), reports queue.
- Saved opportunities with progress tracking.
- Migrations 4 (slug default) and 5 (service_role privileges).
- axe-core accessibility scans; lifecycle integration e2e; bundle secret check.

### Added

- Phase 2: Supabase local stack configuration (hardened auth settings, explicit API grants,
  unused services disabled, ports 55320–55329).
- Database migrations: profiles, roles, consent records, append-only audit log;
  opportunities with moderation workflow, saved opportunities, reports, public read model;
  learning and career resources; account deletion. RLS on every table.
- 70 pgTAP database tests; database CI job; integration e2e for the account journey.
- Accounts UI: register (18+, consent), sign in/out, password reset, profile, delete account.
- Product-owner decisions D-01..D-06 and D-10 recorded as approved.

### Changed

- Privacy notice draft now describes account data actually collected.
- Auth and account pages and the Supabase client are code-split from the initial bundle.

- Phase 0 documentation: product requirements catalogue, assumptions register, open
  decisions, architecture, proposed data model, roadmap, ADR-0001 to ADR-0005.
- Phase 1 foundation: Vite + React + TypeScript (strict), ESLint, Prettier, Vitest,
  Testing Library, Playwright.
- Accessible, responsive application shell with interim design tokens.
- Public pages: Home, About, Contact, draft Privacy notice, draft Terms of use, 404 and
  error page; honest placeholder pages for Opportunities, Learning and Careers.
- GitHub Actions CI workflow, issue and PR templates, security policy.
- Security, privacy, content governance, testing, deployment and operations documentation.
