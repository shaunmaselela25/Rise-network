-- Security baseline: RLS everywhere, no anonymous write paths, no anonymous RPCs.
begin;
select plan(5);

select is_empty(
  $$ select tablename::text from pg_tables where schemaname = 'public' and not rowsecurity $$,
  'RLS is enabled on every table in the public schema'
);

select is_empty(
  $$ select table_name::text || ':' || privilege_type from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public'
       and privilege_type in ('INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'TRIGGER', 'REFERENCES') $$,
  'anon has no write privileges on any public table'
);

select is_empty(
  $$ select table_name::text || ':' || privilege_type from information_schema.role_table_grants
     where grantee = 'authenticated' and table_schema = 'public'
       and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES') $$,
  'authenticated has no TRUNCATE/TRIGGER/REFERENCES privileges'
);

select is_empty(
  $$ select p.proname::text from pg_proc p join pg_namespace n on n.oid = p.pronamespace
     where n.nspname = 'public' and p.prokind = 'f'
       and has_function_privilege('anon', p.oid, 'execute') $$,
  'anon cannot execute any function in the public schema'
);

select is_empty(
  $$ select table_name::text from information_schema.role_table_grants
     where grantee = 'anon' and table_schema = 'public' and privilege_type = 'SELECT'
       and table_name in ('profiles', 'user_roles', 'consent_records', 'audit_logs',
                          'opportunities', 'opportunity_reviews', 'saved_opportunities', 'reports') $$,
  'anon cannot read private tables (public listings go through public_opportunities)'
);

select * from finish();
rollback;
