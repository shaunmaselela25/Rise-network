-- Learning/career resources (FR-011, FR-012) and account deletion (FR-019, BR-09, D-05).
begin;
select plan(13);

insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Member A","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}'),
  ('33333333-3333-3333-3333-333333333333', 'mod@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Moderator","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}'),
  ('44444444-4444-4444-4444-444444444444', 'admin@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Admin","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}');
insert into public.user_roles (user_id, role) values
  ('33333333-3333-3333-3333-333333333333', 'moderator'),
  ('44444444-4444-4444-4444-444444444444', 'admin');

insert into public.learning_resources (title, description, provider_name, category_code, format, url, status) values
  ('TEST Published Course', 'D', 'Test Provider', 'digital_literacy', 'online_self_paced', 'https://provider.test/c1', 'published'),
  ('TEST Draft Course', 'D', 'Test Provider', 'digital_literacy', 'online_self_paced', 'https://provider.test/c2', 'draft');

-- Resources ------------------------------------------------------------------
set local role anon;
select results_eq(
  $$ select title from public.learning_resources where title like 'TEST %' $$,
  $$ values ('TEST Published Course'::text) $$,
  'the public sees published learning resources only');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select throws_ok(
  $$ insert into public.learning_resources (title, description, provider_name, category_code, format, url)
     values ('TEST Member Course', 'D', 'X', 'other', 'in_person', 'https://provider.test/m') $$,
  '42501', null, 'a member cannot create learning resources');

select throws_ok(
  $$ insert into public.career_resources (slug, title, summary, body, topic)
     values ('test-member-guide', 'TEST Guide', 'S', 'B', 'cv') $$,
  '42501', null, 'a member cannot create career resources');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select lives_ok(
  $$ insert into public.career_resources (slug, title, summary, body, topic, status)
     values ('test-staff-guide', 'TEST Staff Guide', 'S', 'B', 'interview', 'published') $$,
  'a moderator can create career resources');

reset role;
select ok(
  exists (select 1 from public.audit_logs where entity_type = 'career_resources' and action = 'insert'
          and actor_id = '33333333-3333-3333-3333-333333333333'),
  'resource changes are audited');
set local role authenticated;

select is(
  (select count(*)::int from public.learning_resources where title like 'TEST %'),
  2, 'staff can see draft resources');

-- Account deletion -----------------------------------------------------------
reset role;
insert into public.opportunities
  (title, summary, description, opportunity_type, category_code, provider_name, source_url, application_url,
   status, verification_status, published_at, submitted_by)
values ('TEST Contributed Listing', 'S', 'D', 'training', 'general', 'Test Provider',
        'https://provider.test/t', 'https://provider.test/t/apply', 'published', 'source_checked', now(),
        '11111111-1111-1111-1111-111111111111');
insert into public.saved_opportunities (user_id, opportunity_id)
values ('11111111-1111-1111-1111-111111111111',
        (select id from public.opportunities where title = 'TEST Contributed Listing'));

set local role anon;
select throws_ok($$ select public.delete_my_account() $$, '42501', null, 'anon cannot call delete_my_account');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select lives_ok($$ select public.delete_my_account() $$, 'a member can delete their own account');
reset role;

select is_empty($$ select id from auth.users where id = '11111111-1111-1111-1111-111111111111' $$,
  'the auth user is removed');
select is_empty($$ select id from public.profiles where id = '11111111-1111-1111-1111-111111111111' $$,
  'the profile is removed');
select is_empty($$ select 1 from public.saved_opportunities where user_id = '11111111-1111-1111-1111-111111111111' $$,
  'saved opportunities are removed');
select ok(
  (select submitted_by is null from public.opportunities where title = 'TEST Contributed Listing'),
  'contributed listings are kept with the author detached (D-05)');

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"44444444-4444-4444-4444-444444444444","role":"authenticated"}', true);
select throws_ok($$ select public.delete_my_account() $$, '42501', null,
  'the last administrator cannot delete their account');
reset role;

select * from finish();
rollback;
