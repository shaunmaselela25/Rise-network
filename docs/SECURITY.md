# RISE NETWORK — Security

> **Status:** Phase 1. The application currently has **no backend, no accounts and no data
> storage**, so most controls below are designed but not yet implemented. Each item is marked
> **Implemented**, **Planned (phase N)** or **Open**. Last updated: 2026-11-25.

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

| #   | Abuse case                                           | Mitigation                                                                                     | Status                                                           |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| T1  | Member edits request to grant themselves `admin`     | No client write path to `user_roles`; RLS deny; role changes only via admin RPC; tests         | Planned (2)                                                      |
| T2  | Member reads another member's profile or saved items | RLS `user_id = auth.uid()`; RLS tests                                                          | Planned (2)                                                      |
| T3  | Contributor publishes own submission                 | Status transitions only via moderator RPC; check constraints                                   | Planned (3)                                                      |
| T4  | Fake opportunity with phishing application link      | Mandatory source, `https://` constraint, human review, verification labels, reports, unpublish | Planned (3)                                                      |
| T5  | Stored XSS through description fields                | Render as text or sanitised markdown only; no `dangerouslySetInnerHTML` without sanitiser; CSP | Planned (3); CSP Planned (7)                                     |
| T6  | `javascript:` URLs in links                          | DB check `^https://`; UI renders only validated URLs                                           | Planned (3)                                                      |
| T7  | Account enumeration via sign-up / reset              | Generic responses; provider rate limits                                                        | Planned (2)                                                      |
| T8  | Credential stuffing                                  | Supabase Auth rate limits; strong password policy; optional CAPTCHA                            | Planned (2)                                                      |
| T9  | Submission/report spam                               | Auth required (D-03/D-04), per-user rate limits in DB function, moderation queue               | Planned (3/5)                                                    |
| T10 | Audit log tampering                                  | No UPDATE/DELETE grants; insert only via `security definer` triggers                           | Planned (2)                                                      |
| T11 | Service-role key leaked to browser                   | Only `VITE_`-prefixed vars reach the bundle; service key never in `VITE_`; CI secret scanning  | Implemented (convention + `.env.example` warning); scanning Open |
| T12 | Vulnerable dependency                                | `npm audit --audit-level=high` in CI; minimal dependencies (ADR-0003)                          | Implemented in CI config (not yet run on GitHub)                 |
| T13 | Error pages leaking internals                        | Route error page shows generic message only (tested)                                           | Implemented                                                      |
| T14 | Reverse tabnabbing via external links                | `rel="noopener noreferrer"` on external links (tested)                                         | Implemented                                                      |
| T15 | Clickjacking                                         | `frame-ancestors 'none'` / `X-Frame-Options: DENY` at host                                     | Planned (7)                                                      |

### Residual risks

- Human reviewers can be deceived by sophisticated fake opportunities. Reports and
  re-verification reduce but do not remove this risk.
- Supabase and the host are third-party processors; their security is outside our control.

## 3. Authentication — Planned (Phase 2)

Supabase Auth, email + password, email confirmation required, generic error messages,
password reset via single-use expiring link, session refresh handled by supabase-js.

## 4. Authorisation and RLS — Planned (Phase 2)

Roles: `member` (implicit), `contributor`, `moderator`, `admin`. Helper `has_role(role)` as a
`security definer` SQL function. RLS enabled on every table with default deny. Policy matrix
in [DATA_MODEL.md §4](DATA_MODEL.md#4-data-ownership-and-access-summary--full-policies-in-securitymd-once-written).

## 5. Secret management

- **Implemented:** `.env*` git-ignored except `.env.example`; `.env.example` contains names
  only and warns against `VITE_` secrets.
- **Planned:** CI secrets in GitHub Actions encrypted secrets; production secrets in host
  environment settings; key rotation procedure in OPERATIONS.md.

## 6. HTTP security headers — Planned (Phase 7, host-dependent)

See [DEPLOYMENT.md §4](DEPLOYMENT.md#4-security-headers).

## 7. Security checklist (per release)

- [ ] RLS enabled on every table; policy tests pass
- [ ] No service-role key or secret in the client bundle (`grep` the `dist/` output)
- [ ] `npm audit --audit-level=high` clean or exceptions documented
- [ ] Security headers verified on the deployed URL
- [ ] Auth flows tested: enumeration, reset, expiry
- [ ] External links validated and `noopener`
- [ ] Admin actions produce audit entries

## 8. Accepted risks

None accepted yet.
