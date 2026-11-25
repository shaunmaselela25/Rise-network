# RISE NETWORK — Security

> **Status:** Phase 2. Database authorisation (RLS, privileges, workflow functions, audit) and
> authentication are implemented and tested **locally**; nothing is deployed. Each item is
> marked **Implemented**, **Planned (phase N)** or **Open**. "Tested" refers to
> `supabase/tests/database/*` (pgTAP) unless stated. Last updated: 2026-11-25.

## 1. Security architecture

See [ARCHITECTURE.md §2](ARCHITECTURE.md#2-system-context) for trust boundaries. Core rule:
**the browser is untrusted; the database enforces authorisation** (ADR-0002).

## 2. Threat model (initial)

### Assets

Member accounts and personal data; integrity of opportunity listings (a fraudulent listing can
cause real financial harm to young people); admin/moderator privileges; audit log; platform
reputation.

### Threat actors

Scammers posting fake opportunities or impersonating providers; spammers and scrapers;
curious or malicious members attempting privilege escalation; compromised staff accounts;
automated credential-stuffing bots.

### Attack surfaces

SPA (XSS via rendered content and URLs); PostgREST API (broken access control); Supabase Auth
endpoints (enumeration, brute force); submission and report forms (spam, abuse); outbound
links (phishing links in listings); CI/CD and dependencies (supply chain).

### Abuse cases and mitigations

| #   | Abuse case                                           | Mitigation                                                                                     | Status                                                                                                              |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| T1  | Member edits request to grant themselves `admin`     | No client write path to `user_roles`; RLS deny; role changes only via admin RPC; tests         | Implemented, tested (02: insert to `user_roles` and `set_user_role` denied for members)                             |
| T2  | Member reads another member's profile or saved items | RLS `user_id = auth.uid()`; RLS tests                                                          | Implemented, tested (02, 03: profiles, saved items, reports, consent isolated)                                      |
| T3  | Submitter publishes own submission                   | Status transitions only via moderator RPC; check constraints                                   | Implemented in DB, tested (03: members cannot insert/update status or call review RPC); UI Phase 3                  |
| T4  | Fake opportunity with phishing application link      | Mandatory source, `https://` constraint, human review, verification labels, reports, unpublish | DB layer implemented, tested (https constraint, mandatory source, publish requires verification); review UI Phase 3 |
| T5  | Stored XSS through description fields                | Render as text or sanitised markdown only; no `dangerouslySetInnerHTML` without sanitiser; CSP | Planned (3); CSP Planned (7)                                                                                        |
| T6  | `javascript:` URLs in links                          | DB check `^https://`; UI renders only validated URLs                                           | DB check implemented, tested (03); UI rendering Phase 3                                                             |
| T7  | Account enumeration via sign-up / reset              | Generic responses; provider rate limits                                                        | Implemented, tested (component tests: generic sign-up, sign-in and reset messages)                                  |
| T8  | Credential stuffing                                  | Supabase Auth rate limits; strong password policy; optional CAPTCHA                            | Implemented: password ≥ 10 chars with letters + digits; Supabase Auth rate limits. CAPTCHA Open                     |
| T9  | Submission/report spam                               | Auth required (D-03/D-04), per-user rate limits in DB function, moderation queue               | Implemented, tested (03: 10 submissions / 24 h; reports 20 / 24 h; signed-in only)                                  |
| T10 | Audit log tampering                                  | No UPDATE/DELETE grants; insert only via `security definer` triggers                           | Implemented, tested (02: delete denied to admin; update rejected even for owner)                                    |
| T11 | Service-role key leaked to browser                   | Only `VITE_`-prefixed vars reach the bundle; service key never in `VITE_`; CI secret scanning  | Implemented (convention + `.env.example` warning); scanning Open                                                    |
| T12 | Vulnerable dependency                                | `npm audit --audit-level=high` in CI; minimal dependencies (ADR-0003)                          | Implemented in CI config (not yet run on GitHub)                                                                    |
| T13 | Error pages leaking internals                        | Route error page shows generic message only (tested)                                           | Implemented                                                                                                         |
| T14 | Reverse tabnabbing via external links                | `rel="noopener noreferrer"` on external links (tested)                                         | Implemented                                                                                                         |
| T16 | Open redirect via `?next=` after sign-in             | `safeNextPath()` only allows same-site paths                                                   | Implemented, tested (unit + component; mutation-checked)                                                            |
| T17 | Minor registers without safeguards (D-01)            | 18+ confirmation required in UI and enforced by the sign-up database trigger                   | Implemented, tested (02). Self-declared; cannot verify age                                                          |
| T15 | Clickjacking                                         | `frame-ancestors 'none'` / `X-Frame-Options: DENY` at host                                     | Planned (7)                                                                                                         |

### Residual risks

- Human reviewers can be deceived by sophisticated fake opportunities. Reports and
  re-verification reduce but do not remove this risk.
- Supabase and the host are third-party processors; their security is outside our control.

## 3. Authentication — Implemented (Phase 2)

Supabase Auth, email + password, PKCE flow. Configured in `supabase/config.jsonc`: email
confirmation required, password ≥ 10 characters with letters and digits, secure password
change, refresh-token rotation, 1-hour access tokens. UI messages are generic to avoid
account enumeration. Verified end-to-end against the local stack
(`e2e/auth.integration.spec.ts`): unconfirmed and deleted accounts cannot sign in.

**Hosted projects:** these settings must be mirrored in the Supabase dashboard for staging
and production (`config.jsonc` only configures the local stack) — Phase 7 checklist item.

## 4. Authorisation and RLS — Implemented (Phase 2)

Roles: `member` (implicit, no row), `moderator`, `admin` (D-03: no contributor role).
Helpers `private.has_role()` / `private.is_staff()` are `security definer` functions in a
schema not exposed by the API. RLS is enabled on every table; table and column privileges
are granted explicitly (`auto_expose_new_tables` is off); function `EXECUTE` is revoked from
`PUBLIC`. Status/verification columns are not client-writable — they change only via
`submit_opportunity` / `review_opportunity`. Anonymous users read listings only through the
`public_opportunities` view. Access matrix: [DATA_MODEL.md §5](DATA_MODEL.md#5-access-matrix-enforced-by-rls--privileges).
Baseline invariants (RLS everywhere, no anon writes, no anon RPC) are asserted by
`01_security_baseline.test.sql`.

**Known gap:** a moderator can review and publish their own submission (no separation of
duties). Acceptable for a small team; revisit before scaling moderation (KNOWN_ISSUES).

## 5. Secret management

- **Implemented:** `.env*` git-ignored except `.env.example`; `.env.example` contains names
  only and warns against `VITE_` secrets.
- **Planned:** CI secrets in GitHub Actions encrypted secrets; production secrets in host
  environment settings; key rotation procedure in OPERATIONS.md.

## 6. HTTP security headers — Planned (Phase 7, host-dependent)

See [DEPLOYMENT.md §4](DEPLOYMENT.md#4-security-headers).

## 7. Security checklist (per release)

- [ ] RLS enabled on every table; `npm run test:db` passes; `supabase db lint` clean
- [ ] No service-role key or secret in the client bundle (`grep` the `dist/` output)
- [ ] `npm audit --audit-level=high` clean or exceptions documented
- [ ] Security headers verified on the deployed URL
- [ ] Auth flows tested: enumeration, reset, expiry
- [ ] External links validated and `noopener`
- [ ] Admin actions produce audit entries

## 8. Accepted risks

None accepted yet.
