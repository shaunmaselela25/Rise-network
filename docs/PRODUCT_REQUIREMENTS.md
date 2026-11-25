# RISE NETWORK — Product Requirements

> **Status:** Draft v0.1 (Phase 0). Owner: Product owner (Ntokozo Maselala). Last updated: 2026-11-25.
> Product-owner decisions are recorded in §9.

## 1. Product vision

RISE NETWORK is a South African community opportunity platform that helps young people
**discover, understand and act on legitimate opportunities** for education, skills
development, career progression, mentorship and community participation.

**Positioning:** Opportunity. Access. Progress.

### 1.1 What RISE NETWORK is not

RISE NETWORK is not a recruitment agency, employer, job-placement service, accredited
education provider, funder, financial institution or general-purpose social network. It
does not guarantee bursaries, admission, employment or mentorship, and it does not claim
verification it has not performed. It facilitates discovery and links to the organisations
responsible for each opportunity.

### 1.2 Product principles

Accessibility · Credibility (traceable sources) · Transparency (eligibility, deadlines,
costs) · Relevance · Inclusion (low-end devices, slow connections) · Privacy (data
minimisation) · Safety · Accountability (audited admin actions) · Maintainability ·
Measurable, privacy-conscious impact.

## 2. Stakeholders and personas

| Role                         | Description                                                | Authentication                     |
| ---------------------------- | ---------------------------------------------------------- | ---------------------------------- |
| Visitor                      | Unregistered person browsing public content                | None                               |
| Member                       | Registered young person / community member                 | Required                           |
| Contributor                  | Any signed-in member who submits content for review (D-03) | Required (no separate role in MVP) |
| Moderator                    | Reviews submissions and reports; cannot manage roles       | Required + `moderator` role        |
| Administrator                | Full operational control incl. roles and configuration     | Required + `admin` role            |
| Mentor _(P1+)_               | Approved mentor (approval workflow required first)         | Required + approval                |
| Partner organisation _(P1+)_ | Approved organisation that may submit content              | Required + approval                |

**Personas (working assumptions, to be validated with real users):**

- **Thandi, 19, Gauteng** — matriculated, looking for bursaries and learnerships; uses a
  prepaid Android phone with limited data. Needs: fast pages, clear deadlines, clear
  eligibility, no forced sign-up.
- **Sipho, 23, Eastern Cape** — recent graduate seeking graduate programmes and entry-level
  work. Needs: filters by province and qualification, save-and-track.
- **Lerato, 31, NGO programme coordinator** — wants to list her organisation's skills
  programme. Needs: simple submission flow, visibility of review status.
- **Admin operator** — reviews submissions, checks sources, keeps listings fresh. Needs:
  efficient queue, audit trail, expiry reminders.

## 3. Scope

- **Priority 0 (MVP):** see §5 FR-001 – FR-020.
- **Priority 1:** personalised discovery, recommendations, mentorship requests, events,
  partner profiles, notification preferences and consented email, richer analytics.
- **Priority 2:** AI-assisted classification, eligibility assistance, external feeds,
  mobile app, advanced impact reporting.
- **Out of scope:** private messaging, job applications processed on-platform, payments,
  storing CVs or ID documents, scraping third-party sites, accreditation claims.

## 4. Requirement template

Each requirement records: ID · Name · Description · Rationale · Actor · Preconditions ·
Main flow · Alternative / exception flows · Acceptance criteria · Priority · Dependencies ·
Verification method (U = unit, C = component, I = integration/RLS, E = end-to-end,
R = review/inspection).

## 5. Functional requirements (Priority 0)

### FR-001 User registration

- **Description:** A visitor creates an account with email + password.
- **Rationale:** Needed for saving opportunities, submissions and profiles.
- **Actor:** Visitor. **Preconditions:** Not signed in.
- **Main flow:** Open Register → enter email, password, display name, confirm age eligibility
  (18+, per D-01), accept Terms and acknowledge Privacy Notice → submit → confirmation email
  sent → user confirms → profile row created with role `member`.
- **Alternative:** Email already registered → generic response ("check your email") to avoid
  account enumeration.
- **Exceptions:** Weak password, invalid email, rate limit hit, provider outage → clear
  error message, no data loss of entered fields (except password).
- **Acceptance:** account cannot sign in before email confirmation; profile is created
  automatically; role cannot be supplied by the client; consent timestamp and policy
  version recorded.
- **Priority:** P0. **Depends on:** FR-020, D-01. **Verify:** C, I, E.

### FR-002 User authentication

- **Description:** Sign in, sign out, password reset, session expiry.
- **Actor:** Member. **Preconditions:** Confirmed account.
- **Main flow:** Enter credentials → session established → redirected to intended page.
- **Alternative:** Forgot password → reset email (generic response) → set new password.
- **Exceptions:** Wrong credentials → generic error; repeated failures → provider rate limit.
- **Acceptance:** protected routes redirect to sign-in; sign-out revokes the session
  locally and with the provider; reset links are single-use and expire.
- **Priority:** P0. **Depends on:** FR-001. **Verify:** C, I, E.

### FR-003 Browse opportunities

- **Description:** Paginated list of published, non-expired opportunities.
- **Actor:** Visitor/Member. **Preconditions:** None.
- **Main flow:** Open Opportunities → see cards (title, provider, type, province, deadline,
  verification label) → paginate.
- **Exceptions:** Network/API error → error state with retry; no results → empty state.
- **Acceptance:** only `published` items whose deadline has not passed are listed as active;
  loading, empty and error states exist; works without an account.
- **Priority:** P0. **Depends on:** schema, RLS. **Verify:** U (expiry), C, I, E.

### FR-004 Search opportunities

- **Description:** Keyword search across title, provider and descriptions.
- **Main flow:** Enter keywords → server-side full-text search → results update; query is
  reflected in the URL so it can be shared.
- **Acceptance:** search is performed server-side (PostgreSQL full-text); empty query shows
  all; special characters cannot break the query.
- **Priority:** P0. **Depends on:** FR-003. **Verify:** U, I, E.

### FR-005 Filter and sort opportunities

- **Description:** Filter by type, category, province, remote/in-person, closing-date range,
  minimum qualification; sort by closing date or newest.
- **Acceptance:** filters combine with AND; reflected in URL; server-side; filter controls
  are keyboard accessible and labelled.
- **Priority:** P0. **Depends on:** FR-003. **Verify:** C, I, E.

### FR-006 View opportunity details

- **Description:** Detail page with full description, eligibility, required documents,
  dates, costs/benefits, provider, source URL, application URL, verification status and
  date last checked.
- **Exceptions:** Not found / unpublished → 404 page; expired → shown with a clear
  "Closed" banner and no "Apply" call to action.
- **Acceptance:** source is always shown; external links open the provider's page with
  `rel="noopener noreferrer"`; no guarantee language.
- **Priority:** P0. **Verify:** C, E.

### FR-007 Save opportunity

- **Description:** Member saves/unsaves an opportunity and views their saved list, with an
  optional personal tracking status (interested, applying, applied, not proceeding).
- **Preconditions:** Signed in. Visitors clicking Save are asked to sign in.
- **Acceptance:** a member can only read/write their own saved rows (RLS-verified); saving
  is idempotent (unique per member + opportunity).
- **Priority:** P0. **Verify:** I (RLS), E.

### FR-008 Submit opportunity

- **Description:** Any signed-in member (D-03) submits an
  opportunity for review with mandatory source URL.
- **Main flow:** Fill form → client and server validation → saved as `pending_review`
  → contributor sees status in "My submissions".
- **Alternative:** Save as `draft`; edit own draft or own `changes_requested` item.
- **Acceptance:** submitter cannot set status to `published`; URLs must be `https://`;
  required fields enforced by database constraints, not only the form.
- **Priority:** P0. **Verify:** U (validation), I (RLS), E.

### FR-009 Moderate opportunity

- **Description:** Moderator/admin reviews pending items: approve, reject (with reason) or
  request changes (with note); sets verification status.
- **Acceptance:** every decision creates an immutable review record and an audit-log entry
  with actor, previous and new state, and note; history is never erased.
- **Priority:** P0. **Verify:** I, E.

### FR-010 Publish / unpublish / archive opportunity

- **Description:** Authorised roles publish approved items, unpublish or archive them.
- **Business rules:** BR-01, BR-03, BR-04, BR-05.
- **Acceptance:** publishing requires source URL, application URL (or documented reason) and
  a future or absent deadline; non-authorised roles are rejected by the database.
- **Priority:** P0. **Verify:** I, E.

### FR-011 Manage learning resources

- **Description:** Public directory of learning resources (title, provider, category, level,
  format, cost classification free/paid/funded, duration, requirements, URL, last
  reviewed); admin CRUD with draft/published states.
- **Acceptance:** public sees only published items; filter by category, level, cost, format;
  no accreditation claims.
- **Priority:** P0. **Verify:** C, I, E.

### FR-012 Manage career resources

- **Description:** Public directory/articles for CV guidance, interviews, workplace
  readiness, etc.; admin CRUD with draft/published states.
- **Priority:** P0. **Verify:** C, I, E.

### FR-013 Manage member profile

- **Description:** Member views and edits display name, province (optional), interests,
  education level (optional); views consent history.
- **Acceptance:** only own profile is readable/editable; role fields are not editable by
  the member; optional fields are genuinely optional.
- **Priority:** P0. **Verify:** I (RLS), E.

### FR-014 Submit report

- **Description:** Any user reports a listing as suspicious, incorrect, expired or other.
  Signed-in users only (D-04).
- **Acceptance:** reports go to a moderation queue; reporters cannot read other reports;
  rate limited.
- **Priority:** P0. **Verify:** I, E.

### FR-015 Handle reports

- **Description:** Moderators triage reports: dismiss, action (unpublish, mark disputed,
  edit), with notes. Audited.
- **Priority:** P0. **Verify:** I, E.

### FR-016 Manage roles

- **Description:** Admins grant/revoke roles. Users cannot change their own roles; the last
  admin cannot be removed.
- **Acceptance:** privilege escalation via API payload is impossible (RLS + function checks);
  every change is audited.
- **Priority:** P0. **Verify:** I, E.

### FR-017 Admin dashboard

- **Description:** Aggregate counts: published, pending, expiring in 14 days, expired,
  open reports, stale listings (not checked in 30 days, D-06), member count.
- **Acceptance:** aggregates only; no personal data beyond what the role needs.
- **Priority:** P0. **Verify:** I, C.

### FR-018 Audit history

- **Description:** Admins view audit log filtered by actor, entity and date.
- **Acceptance:** audit rows are append-only (no update/delete for any client role).
- **Priority:** P0. **Verify:** I.

### FR-019 Account deletion

- **Description:** Member requests deletion from settings; account and personal data are
  deleted or anonymised per retention rules; submitted public content is retained with
  author detached (D-05).
- **Acceptance:** after deletion the user cannot sign in; saved items and profile are removed;
  audit entries keep a non-identifying actor reference.
- **Priority:** P0. **Verify:** I, E.

### FR-020 Public information pages

- **Description:** Home, About, Contact, Privacy Notice, Terms of Use, 404.
- **Acceptance:** no fake statistics, testimonials or partner logos; legal pages labelled
  as drafts pending legal review until approved.
- **Priority:** P0. **Verify:** C, E.

## 6. Non-functional requirements

| ID      | Name            | Requirement                                                                                                                                                | Verify                             |
| ------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| NFR-001 | Performance     | Initial JS ≤ 200 KB gzipped for public routes; LCP ≤ 2.5 s on simulated mid-range mobile / 4G (Lighthouse); list queries p95 ≤ 300 ms at 10k opportunities | Lighthouse, bundle report, EXPLAIN |
| NFR-002 | Security        | OWASP Top 10 assessed; RLS on every table; no privileged keys in browser; security headers at host                                                         | Review, RLS tests, header scan     |
| NFR-003 | Availability    | Best-effort; no SLA promised. Health of hosting and Supabase monitored                                                                                     | Ops review                         |
| NFR-004 | Accessibility   | WCAG 2.2 AA: semantic HTML, keyboard navigation, visible focus, 4.5:1 text contrast, labelled forms                                                        | axe checks in tests, manual review |
| NFR-005 | Maintainability | TypeScript strict; lint/format gates; feature-based modules; documented ADRs                                                                               | CI                                 |
| NFR-006 | Privacy         | Data minimisation; POPIA-aligned data inventory; deletion supported; no third-party tracking without consent                                               | Review                             |
| NFR-007 | Observability   | Client errors captured without personal data; Supabase logs reviewed; audit log for admin actions                                                          | Ops review                         |
| NFR-008 | Compatibility   | Last 2 versions of evergreen browsers; usable at 320 px width; works on 3G (degraded)                                                                      | E2E at mobile viewport             |
| NFR-009 | Data integrity  | DB constraints enforce required fields, enums and state transitions                                                                                        | Integration tests                  |

## 7. Business rules

| ID    | Rule                                                                                             | Enforcement                                                     |
| ----- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| BR-01 | Only moderators/admins can publish opportunities                                                 | RLS + DB function                                               |
| BR-02 | Users cannot grant themselves roles                                                              | RLS on `user_roles`; no client write path                       |
| BR-03 | An expired opportunity is never presented as active                                              | Query filter on deadline + UI "Closed" state + scheduled expiry |
| BR-04 | Application links validated before publication (https, well-formed; reviewer checks it resolves) | DB check constraint + review checklist                          |
| BR-05 | Every opportunity has a traceable source URL                                                     | NOT NULL + check constraint                                     |
| BR-06 | No guarantee language; opportunities are provided by third parties                               | Content guidelines + review                                     |
| BR-07 | Users access/modify only their own private data unless authorised                                | RLS                                                             |
| BR-08 | Admin actions are attributable to an authenticated actor                                         | Audit triggers using `auth.uid()`                               |
| BR-09 | Users can request account deletion                                                               | FR-019                                                          |
| BR-10 | Unverified content is visibly labelled as such                                                   | UI component + required verification field                      |
| BR-11 | Moderation never silently erases submission history                                              | Append-only review records                                      |
| BR-12 | Public API responses never include private member data                                           | Separate public views; RLS                                      |
| BR-13 | Verification status and publication status are independent fields                                | Schema                                                          |

## 8. Assumptions register

### 8.1 Verified facts (2026-11-25)

- GitHub repository `shaunmaselela25/Rise-network` exists and is **public**. It was empty at
  inspection; `main` now holds a single empty initial commit (pushed 2026-11-25).
- Work proceeds on `feature/rise-network-foundation`.
- Tooling available locally: Node 26.13, npm 11.20, git 2.55, GitHub CLI (authenticated).
- Docker is installed but the daemon was not running; the local Supabase stack is therefore
  not yet available.

### 8.2 Working assumptions (reversible; change if the product owner disagrees)

- A-01: English-only UI for MVP; copy written in plain language. Other SA languages later.
- A-02: Email + password auth via Supabase Auth for MVP; social login deferred.
- A-03: Opportunity content is entered by humans (contributors/admins); no scraping.
- A-04: Single content-moderation team; `moderator` and `admin` roles are sufficient for MVP.
- A-05: Hosting will be a static host with security-header support (Vercel, Netlify or
  Cloudflare Pages) — final choice is D-07.
- A-06: Supabase project region chosen closest to South Africa that is available (see D-08).
- A-07: No file uploads in MVP (avoids storing documents/CVs); logos deferred.
- A-08: Province list = the nine South African provinces plus "National" and "Online/Remote".

### 8.3 Decisions requiring product-owner approval

See §9.

## 9. Product-owner decisions

On **2026-11-25** the product owner instructed: "go with the recommendations". Decisions
D-01 to D-06 and D-10 are therefore **approved as recommended**. D-07, D-08, D-09 and D-11
need information or action only the product owner can provide and remain **open**.

| ID   | Decision                                | Status                                      | Outcome                                                                                                                                                               |
| ---- | --------------------------------------- | ------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D-01 | May minors register?                    | Approved 2026-11-25                         | Browsing open to all ages. Account registration 18+ for MVP (self-declared age confirmation at sign-up). Revisit with legal advice before allowing minors.            |
| D-02 | Publish unverified listings?            | Approved 2026-11-25                         | Publish only after human review. `verification_status` must be `source_checked` or `provider_confirmed` at the moment of publishing; `unverified` is never published. |
| D-03 | Who can submit opportunities?           | Approved 2026-11-25                         | Any signed-in member may submit for review; only moderators/admins publish. The `contributor` role is not needed for MVP and is not created.                          |
| D-04 | Anonymous reports?                      | Approved 2026-11-25                         | Signed-in reports only for MVP; public contact channel once D-09 is decided.                                                                                          |
| D-05 | Contributor content on account deletion | Approved 2026-11-25                         | Keep content; set `submitted_by` to null.                                                                                                                             |
| D-06 | Freshness interval                      | Approved 2026-11-25                         | Flag published listings not checked in 30 days.                                                                                                                       |
| D-07 | Hosting provider and domain             | Open                                        | Needed before Phase 7.                                                                                                                                                |
| D-08 | Supabase account ownership and region   | Open (recommendation accepted in principle) | Product owner creates and owns the Supabase account; region to be recorded in PRIVACY.md. Not needed for local development.                                           |
| D-09 | Official contact email                  | Open                                        | Needed before public launch.                                                                                                                                          |
| D-10 | Brand colours / logo                    | Approved 2026-11-25                         | Interim palette (ADR-0004) until a brand is designed.                                                                                                                 |
| D-11 | POPIA Information Officer               | Open                                        | Product owner to designate before launch.                                                                                                                             |
