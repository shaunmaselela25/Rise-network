# ADR-0003: Minimal dependency policy

- **Status:** Accepted
- **Date:** 2026-11-25

## Decision

A runtime dependency is added only when a feature that needs it is being built, and its
purpose is recorded in this table.

| Package                    | Added in | Purpose                                                        |
| -------------------------- | -------- | -------------------------------------------------------------- |
| react, react-dom           | Phase 1  | UI                                                             |
| react-router               | Phase 1  | Routing                                                        |
| @supabase/supabase-js      | Phase 2  | API/auth client (lazy-loaded chunk)                            |
| zod                        | Phase 2  | Form and config validation                                     |
| supabase (dev)             | Phase 2  | CLI: local stack, migrations, pgTAP tests (pinned per project) |
| @axe-core/playwright (dev) | Phase 3  | Automated WCAG checks in e2e (NFR-004)                         |

Not adopted for MVP: global state libraries (Redux/Zustand), UI component kits, CSS
frameworks, data-fetching libraries, date libraries. Styling uses plain CSS with design
tokens (custom properties); dates use `Intl`. A data-fetching library (e.g. TanStack Query)
may be reconsidered in Phase 3 if caching/invalidation needs justify it — via a new ADR.

## Consequences

Smaller bundles for low-end devices, smaller supply-chain surface, more hand-written
components (kept small and tested).
