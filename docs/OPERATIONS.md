# RISE NETWORK — Operations

> **Status:** Pre-launch. Nothing is running in production. Last updated: 2026-11-25.

## 1. Monitoring (planned)

- Host uptime/deploy status and Supabase project health dashboards.
- Client-side error reporting: to be chosen in Phase 7; must strip personal data and
  requires a PRIVACY.md update before adoption.
- Admin dashboard (FR-017) surfaces content-health signals: pending queue, stale listings,
  open reports.

## 2. Logging

- No personal data (emails, names, tokens) in application logs.
- The route error boundary logs errors to the browser console only.
- Admin actions are recorded in `audit_logs` (Phase 2).

## 3. Incident response (draft)

1. Detect and record (time, reporter, symptoms).
2. Contain (e.g. unpublish a fraudulent listing, revoke a compromised account, rotate keys).
3. Assess whether personal information was compromised. If so, POPIA s22 notification to the
   Information Regulator and affected people as soon as reasonably possible.
4. Recover and verify.
5. Post-incident review and KNOWN_ISSUES / CHANGELOG update.

## 4. Routine maintenance

- Weekly: review report queue and stale listings.
- Monthly: `npm audit`, dependency updates via PR, review admin role assignments.
- Quarterly: restore drill from backup into staging; review privacy inventory.

## 5. Troubleshooting

| Symptom                                                         | Likely cause                       | Action                                      |
| --------------------------------------------------------------- | ---------------------------------- | ------------------------------------------- |
| Deep link returns 404 on host                                   | SPA fallback not configured        | Configure rewrite to `/index.html`          |
| `npm run …` fails in Git Bash with `'"node"' is not recognized` | Local shell configuration (KI-001) | Run npm scripts from PowerShell or cmd      |
| E2E fails: port 4173 in use                                     | Previous preview server running    | Stop it, or let Playwright reuse it locally |
