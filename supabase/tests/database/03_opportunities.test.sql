-- Opportunity submission, moderation, publication, expiry, saving and reporting.
-- FR-003..FR-010, FR-014, FR-015; BR-01, BR-03..BR-05, BR-10..BR-13; D-02, D-03, D-04.
begin;
select plan(33);

-- Fixtures -------------------------------------------------------------------
insert into auth.users (id, email, aud, role, raw_user_meta_data) values
  ('11111111-1111-1111-1111-111111111111', 'a@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Member A","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}'),
  ('22222222-2222-2222-2222-222222222222', 'b@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Member B","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}'),
  ('33333333-3333-3333-3333-333333333333', 'mod@test.local', 'authenticated', 'authenticated',
   '{"display_name":"Moderator","age_confirmed":true,"terms_version":"0.1","privacy_version":"0.1"}');
insert into public.user_roles (user_id, role) values ('33333333-3333-3333-3333-333333333333', 'moderator');

-- Member A submits -----------------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select lives_ok(
  $$ insert into public.opportunities
       (title, summary, description, opportunity_type, category_code, provider_name, source_url, application_url, closes_at)
     values ('TEST Bursary Alpha', 'Summary', 'Description', 'bursary', 'engineering', 'Test Provider',
             'https://provider.test/alpha', 'https://provider.test/alpha/apply', current_date + 30) $$,
  'any signed-in member can submit an opportunity for review (D-03)');

select is(
  (select status::text from public.opportunities where title = 'TEST Bursary Alpha'),
  'pending_review', 'a new submission defaults to pending_review');

select is(
  (select submitted_by from public.opportunities where title = 'TEST Bursary Alpha'),
  '11111111-1111-1111-1111-111111111111'::uuid, 'submitted_by is set from the session, not the client');

select throws_ok(
  $$ insert into public.opportunities
       (title, summary, description, opportunity_type, category_code, provider_name, source_url, status)
     values ('TEST Self Published', 'S', 'D', 'bursary', 'engineering', 'Test Provider',
             'https://provider.test/x', 'published') $$,
  '42501', null, 'a member cannot insert a published opportunity (BR-01)');

select throws_ok(
  $$ insert into public.opportunities
       (title, summary, description, opportunity_type, category_code, provider_name, source_url, verification_status)
     values ('TEST Self Verified', 'S', 'D', 'bursary', 'engineering', 'Test Provider',
             'https://provider.test/x', 'provider_confirmed') $$,
  '42501', null, 'a member cannot set verification status');

select throws_ok(
  $$ insert into public.opportunities
       (title, summary, description, opportunity_type, category_code, provider_name, source_url)
     values ('TEST Bad URL', 'S', 'D', 'bursary', 'engineering', 'Test Provider', 'javascript:alert(1)') $$,
  '23514', null, 'non-https source URLs are rejected by the database (BR-04, BR-05)');

select throws_ok(
  $$ update public.opportunities set status = 'published' where title = 'TEST Bursary Alpha' $$,
  '42501', null, 'a member cannot change status directly');

select throws_ok(
  $$ select public.review_opportunity(
       (select id from public.opportunities where title = 'TEST Bursary Alpha'), 'publish', null, 'source_checked') $$,
  '42501', null, 'a member cannot call the moderation function');

-- Visibility before publication ---------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is_empty($$ select id from public.opportunities where title = 'TEST Bursary Alpha' $$,
  'another member cannot see a pending submission');

reset role;
set local role anon;
select is_empty($$ select id from public.public_opportunities where title = 'TEST Bursary Alpha' $$,
  'the public cannot see a pending submission');
reset role;
set local role authenticated;

-- Moderation -----------------------------------------------------------------
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

select throws_ok(
  $$ select public.review_opportunity((select id from public.opportunities where title = 'TEST Bursary Alpha'), 'publish') $$,
  '22023', null, 'an unverified opportunity cannot be published (D-02, BR-10)');

select throws_ok(
  $$ select public.review_opportunity((select id from public.opportunities where title = 'TEST Bursary Alpha'), 'reject') $$,
  '22023', null, 'rejecting requires a reason');

select is(
  public.review_opportunity((select id from public.opportunities where title = 'TEST Bursary Alpha'),
                            'publish', 'Checked against provider site', 'source_checked')::text,
  'published', 'a moderator can publish a source-checked opportunity');

select is(
  (select count(*)::int from public.opportunity_reviews r
   join public.opportunities o on o.id = r.opportunity_id
   where o.title = 'TEST Bursary Alpha' and r.action = 'publish'
     and r.reviewer_id = '33333333-3333-3333-3333-333333333333'),
  1, 'the publish decision is recorded in opportunity_reviews (BR-11)');

select is_empty($$ select id from public.audit_logs $$,
  'a moderator cannot read the audit log (admin only)');

reset role;
select ok(
  exists (select 1 from public.audit_logs a join public.opportunities o on a.entity_id = o.id::text
          where o.title = 'TEST Bursary Alpha' and a.entity_type = 'opportunities'
            and a.actor_id = '33333333-3333-3333-3333-333333333333'),
  'the status change is audited with the moderator as actor');
set local role authenticated;

select throws_ok(
  $$ select public.review_opportunity((select id from public.opportunities where title = 'TEST Bursary Alpha'),
                                      'set_verification', null, 'unverified') $$,
  '22023', null, 'a published listing cannot be downgraded to unverified');

-- Public visibility after publication ---------------------------------------
reset role;
set local role anon;
select is(
  (select is_closed from public.public_opportunities where title = 'TEST Bursary Alpha'),
  false, 'the published opportunity is visible to the public and active');

select throws_ok(
  $$ select submitted_by from public.public_opportunities $$,
  '42703', null, 'the public view does not expose submitter identity (BR-12)');

select throws_ok(
  $$ select verification_notes from public.public_opportunities $$,
  '42703', null, 'the public view does not expose internal verification notes');
reset role;

-- Expiry (BR-03) -------------------------------------------------------------
insert into public.opportunities
  (title, summary, description, opportunity_type, category_code, provider_name, source_url, application_url,
   opens_at, closes_at, status, verification_status, published_at)
values ('TEST Closed Programme', 'S', 'D', 'graduate_programme', 'general', 'Test Provider',
        'https://provider.test/closed', 'https://provider.test/closed/apply',
        current_date - 30, current_date - 1, 'published', 'source_checked', now());

insert into public.opportunities
  (title, summary, description, opportunity_type, category_code, provider_name, source_url, application_url,
   closes_at, status)
values ('TEST Pending Expired', 'S', 'D', 'internship', 'general', 'Test Provider',
        'https://provider.test/late', 'https://provider.test/late/apply', current_date - 1, 'pending_review');

set local role anon;
select is(
  (select is_closed from public.public_opportunities where title = 'TEST Closed Programme'),
  true, 'an opportunity past its closing date is flagged as closed');
reset role;

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select throws_ok(
  $$ select public.review_opportunity((select id from public.opportunities where title = 'TEST Pending Expired'),
                                      'publish', null, 'source_checked') $$,
  '22023', null, 'an opportunity whose closing date has passed cannot be published');

-- Owner cannot edit or delete after publication -----------------------------
select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
update public.opportunities set title = 'TEST Changed By Owner' where title = 'TEST Bursary Alpha';
delete from public.opportunities where title = 'TEST Bursary Alpha';
reset role;
select is(
  (select count(*)::int from public.opportunities where title = 'TEST Bursary Alpha'),
  1, 'the submitter cannot edit or delete an opportunity once it is published');
set local role authenticated;

-- Saved opportunities (FR-007) -----------------------------------------------
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select lives_ok(
  $$ insert into public.saved_opportunities (opportunity_id)
     values ((select id from public.public_opportunities where title = 'TEST Bursary Alpha')) $$,
  'a member can save a published opportunity');

select throws_ok(
  $$ insert into public.saved_opportunities (opportunity_id)
     values ((select id from public.public_opportunities where title = 'TEST Bursary Alpha')) $$,
  '23505', null, 'saving the same opportunity twice is rejected');

reset role;
set local role authenticated;
select throws_ok(
  $$ insert into public.saved_opportunities (opportunity_id)
     values ('00000000-0000-0000-0000-000000000000') $$,
  '42501', null, 'a member cannot save an opportunity that is not published');

select set_config('request.jwt.claims', '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}', true);
select is_empty($$ select opportunity_id from public.saved_opportunities $$,
  'a member cannot see another member''s saved opportunities');

-- Reports (FR-014, FR-015) ----------------------------------------------------
select lives_ok(
  $$ insert into public.reports (opportunity_id, reason, details)
     values ((select id from public.public_opportunities where title = 'TEST Bursary Alpha'), 'incorrect', 'Deadline differs') $$,
  'a signed-in member can report a published opportunity');

select throws_ok(
  $$ select public.resolve_report((select id from public.reports limit 1), 'dismissed') $$,
  '42501', null, 'a member cannot resolve reports');

select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
select is_empty($$ select id from public.reports $$, 'a member cannot see other members'' reports');

select set_config('request.jwt.claims', '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}', true);
select lives_ok(
  $$ select public.resolve_report((select id from public.reports limit 1), 'actioned', 'Deadline corrected') $$,
  'a moderator can resolve a report');

reset role;
set local role anon;
select throws_ok(
  $$ insert into public.reports (opportunity_id, reason) values ('00000000-0000-0000-0000-000000000000', 'other') $$,
  '42501', null, 'anonymous visitors cannot submit reports (D-04)');
reset role;

-- Submission rate limit (T9) -------------------------------------------------
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}', true);
do $$
begin
  for i in 1..10 loop
    insert into public.opportunities (title, summary, description, opportunity_type, category_code, provider_name, source_url)
    values ('TEST Flood ' || i, 'S', 'D', 'other', 'general', 'Test Provider', 'https://provider.test/flood');
  end loop;
end;
$$;
select throws_ok(
  $$ insert into public.opportunities (title, summary, description, opportunity_type, category_code, provider_name, source_url)
     values ('TEST Flood 11', 'S', 'D', 'other', 'general', 'Test Provider', 'https://provider.test/flood') $$,
  '54000', null, 'members are limited to 10 submissions per 24 hours');

select * from finish();
rollback;
