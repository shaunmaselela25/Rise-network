# RISE NETWORK — Privacy Engineering

> **Status:** Phase 1. The current build **collects no personal information** (no accounts,
> forms, cookies, analytics or tracking scripts). This document records the planned data
> inventory for review. It is not legal advice; POPIA compliance requires review by a
> qualified person. Last updated: 2026-11-25.

## 1. Planned data inventory (Phase 2+)

| Data                                  | Purpose                                                   | Justification (POPIA s11) | Collected at           | Stored in                          | Access                          | Retention (proposed)                                 | Deletion                                       | Shared with                          |
| ------------------------------------- | --------------------------------------------------------- | ------------------------- | ---------------------- | ---------------------------------- | ------------------------------- | ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| Email address                         | Account login, auth emails                                | Contract / consent        | Registration           | Supabase Auth                      | User; admins (support only)     | Life of account                                      | On account deletion                            | Supabase (processor), SMTP provider  |
| Password hash                         | Authentication                                            | Contract                  | Registration           | Supabase Auth (hashed by provider) | Nobody (hashed)                 | Life of account                                      | On account deletion                            | Supabase                             |
| Display name                          | Personalisation; attribution of submissions to moderators | Consent                   | Registration / profile | `profiles`                         | User; moderators/admins         | Life of account                                      | On account deletion                            | —                                    |
| Province (optional)                   | Relevant opportunities                                    | Consent                   | Profile                | `profiles`                         | User; aggregate only for admins | Life of account                                      | On deletion or when cleared                    | —                                    |
| Education level (optional)            | Relevant opportunities                                    | Consent                   | Profile                | `profiles`                         | User                            | Life of account                                      | On deletion or when cleared                    | —                                    |
| Interests (optional)                  | Relevant opportunities                                    | Consent                   | Profile                | `profiles`                         | User                            | Life of account                                      | On deletion or when cleared                    | —                                    |
| Saved opportunities & tracking status | Member feature                                            | Contract                  | Save action            | `saved_opportunities`              | User only                       | Life of account                                      | On deletion                                    | —                                    |
| Submissions                           | Content contribution                                      | Legitimate interest       | Submission form        | `opportunities`                    | Submitter, moderators           | Content retained; author detached on deletion (D-05) | Author link removed                            | Public once published (content only) |
| Reports                               | Safety moderation                                         | Legitimate interest       | Report form            | `reports`                          | Moderators                      | 24 months (proposed)                                 | Reporter link removed on deletion              | —                                    |
| Consent records                       | Proof of consent                                          | Legal obligation          | Registration           | `consent_records`                  | Admins                          | Life of account + period TBD by legal review         | Per legal advice                               | —                                    |
| Audit log actor ID                    | Accountability of staff actions                           | Legitimate interest       | Admin actions          | `audit_logs`                       | Admins                          | TBD                                                  | Actor reference retained as non-identifying ID | —                                    |
| Server/technical logs                 | Security, operations                                      | Legitimate interest       | Every request          | Host + Supabase logs               | Operators                       | Provider default                                     | Provider-managed                               | Host, Supabase                       |

**Not collected:** identity numbers, financial information, health information, race,
religion, biometric data, precise location, CVs or documents.

## 2. Children (open decision D-01)

POPIA defines a child as under 18 and requires consent from a competent person to process a
child's personal information. Recommendation: allow browsing without an account for all ages;
restrict account registration to 18+ for MVP until a legally reviewed approach for minors
exists. Registration will not ship until D-01 is decided.

## 3. Cross-border processing (open decision D-08)

Supabase and hosting providers may store data outside South Africa. POPIA s72 restricts
transfers; the chosen region and the providers' data-protection terms must be recorded here
before launch.

## 4. Data-subject requests (planned)

- Access and correction: profile page (self-service) plus contact channel (D-09).
- Deletion: self-service account deletion (FR-019).
- Objection/complaints: contact channel; Information Regulator details in the privacy notice.

## 5. Breach response (planned)

See OPERATIONS.md §3. POPIA s22 requires notification to the Information Regulator and
affected data subjects as soon as reasonably possible after discovery.

## 6. Information Officer

To be designated by the product owner (D-11).
