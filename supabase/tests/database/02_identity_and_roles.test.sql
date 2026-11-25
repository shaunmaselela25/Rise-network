-- Identity, profiles, roles and audit (FR-001, FR-013, FR-016, FR-018, BR-02, BR-07, BR-08, D-01).
begin;
select plan(19);

-- Fixtures (as table owner) -------------------------------------------------
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Member A","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Member B","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}'),
  ('44444444-4444-4444-4444-444444444444', 'admin@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Admin","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}');
insert into public.user_roles (user_id, role) values ('44444444-4444-4444-4444-444444444444', 'admin');

-- Sign-up hook ---------------------------------------------------------------
select is(
  (select count(*)::int from public.profiles where id in (
    '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222',
    '44444444-4444-4444-4444-444444444444')),
  3, 'a profile is created for every new auth user');

select is(
  (select count(*)::int from public.consent_records where user_id = '11111111-1111-1111-1111-111111111111'),
  2, 'terms and privacy consent are recorded at sign-up');

select throws_ok(
  $$ insert into auth.users (id, email, aud, role, raw_user_meta_data) values
     ('55555555-5555-5555-5555-555555555555', 'young@test.local', 'authenticated', 'authenticated',
      '{"terms_version":"0.1","privacy_version":"0.1"}') $$,
  '22023', null, 'sign-up is rejected without 18+ confirmation (D-01)');

select throws_ok(
  $$ insert into auth.users (id, email, aud, role, raw_user_meta_data) values
     ('66666666-6666-6666-6666-666666666666', 'noconsent@test.local', 'authenticated', 'authenticated',
      '{"age_confirmed":true}') $$,
  '22023', null, 'sign-up is rejected without terms and privacy acceptance');

-- As member A ----------------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select results_eq(
  $$ select id from public.profiles $$,
  $$ values ('11111111-1111-1111-1111-111111111111'::uuid) $$,
  'a member can read only their own profile');

select lives_ok(
  $$ update public.profiles set display_name = 'Member A2', province = 'gauteng'
     where id = '11111111-1111-1111-1111-111111111111' $$,
  'a member can update their own profile');

-- Attempt to modify another member: RLS filters the row, so nothing changes.
update public.profiles set display_name = 'hacked' where id = '22222222-2222-2222-2222-222222222222';

select throws_ok(
  $$ update public.profiles set age_confirmed_at = now() where id = '11111111-1111-1111-1111-111111111111' $$,
  '42501', null, 'a member cannot change protected profile columns');

select throws_ok(
  $$ insert into public.user_roles (user_id, role) values ('11111111-1111-1111-1111-111111111111', 'admin') $$,
  '42501', null, 'a member cannot grant themselves a role by writing to user_roles (BR-02)');

select throws_ok(
  $$ select public.set_user_role('11111111-1111-1111-1111-111111111111', 'admin', true) $$,
  '42501', null, 'a member cannot call set_user_role');

select is_empty($$ select id from public.audit_logs $$, 'a member cannot read the audit log');

select is_empty($$ select user_id from public.user_roles $$, 'a member cannot see other users'' roles');

select is_empty($$ select id from public.consent_records where user_id <> '11111111-1111-1111-1111-111111111111' $$,
  'a member cannot see other users'' consent records');

-- As admin -------------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);

select is(
  (select display_name from public.profiles where id = '22222222-2222-2222-2222-222222222222'),
  'Member B', 'another member''s profile was not changed by member A (BR-07)');

select lives_ok(
  $$ select public.set_user_role('22222222-2222-2222-2222-222222222222', 'moderator', true) $$,
  'an admin can grant the moderator role');

select is(
  (select count(*)::int from public.audit_logs
   where action = 'grant_role' and entity_id = '22222222-2222-2222-2222-222222222222'
     and actor_id = '44444444-4444-4444-4444-444444444444'),
  1, 'role grants are audited with the acting admin (BR-08)');

select throws_ok(
  $$ select public.set_user_role('44444444-4444-4444-4444-444444444444', 'admin', false) $$,
  '42501', null, 'an admin cannot change their own roles');

select throws_ok(
  $$ delete from public.audit_logs $$,
  '42501', null, 'an admin cannot delete audit records');

-- As anon --------------------------------------------------------------------
reset role;
set local role anon;
select throws_ok($$ select id from public.profiles $$, '42501', null, 'anon cannot read profiles');

-- As table owner: audit log is append-only even for the owner ----------------
reset role;
select throws_ok(
  $$ update public.audit_logs set action = 'tampered' $$,
  '42501', null, 'audit_logs rejects updates even from the table owner');

select * from finish();
rollback;
