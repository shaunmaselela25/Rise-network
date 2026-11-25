-- =============================================================================
-- RISE NETWORK — Migration 5: explicit privileges for service_role
-- Because new tables are not auto-exposed (supabase/config.jsonc), Supabase's
-- service_role — the trusted server-side role used by operators, scheduled jobs and
-- test tooling — has no table access unless granted. service_role bypasses RLS by
-- design; its key must never reach the browser (docs/SECURITY.md T11).
-- The audit log remains append-only for every role (enforced by trigger).
-- =============================================================================
grant usage on schema public to service_role;
grant select, insert, update, delete on all tables in schema public to service_role;
grant usage, select on all sequences in schema public to service_role;
grant execute on all functions in schema public to service_role;

alter default privileges in schema public
  grant select, insert, update, delete on tables to service_role;
alter default privileges in schema public
  grant usage, select on sequences to service_role;
alter default privileges in schema public
  grant execute on functions to service_role;
