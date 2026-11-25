# ADR-0002: Modular monolith with database-enforced rules

- **Status:** Accepted
- **Date:** 2026-11-25

## Decision

One deployable SPA, organised by business capability under `src/features/*`, backed by one
Supabase project. Rules that protect data are enforced in PostgreSQL:

- **Constraints** for required fields, enums, URL format, date ordering.
- **RLS policies** for ownership and role-based read/write.
- **`security definer` functions (RPC)** for multi-step privileged workflows (review,
  publish, role changes) so they run in one transaction and write audit records.
- **Triggers** for `updated_at` and audit logging.

Frontend checks exist only for usability (hiding controls, early validation feedback).

## Consequences

- No microservices, message queues or caching layers until measured need.
- Every privileged workflow needs an integration test that runs against a real Postgres
  with RLS enabled.
- Role checks are centralised in SQL helper functions (`has_role()`), mirrored by a small
  TypeScript permission module used only for UI hints.
