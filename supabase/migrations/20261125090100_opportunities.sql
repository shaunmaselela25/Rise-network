-- =============================================================================
-- RISE NETWORK — Migration 2: opportunities, moderation, saved items, reports
-- Business rules: BR-01..BR-13 in docs/PRODUCT_REQUIREMENTS.md.
-- Decisions applied: D-02 (publish only reviewed), D-03 (any member submits),
--                    D-04 (signed-in reports), D-05 (detach author on deletion).
-- =============================================================================

create type public.opportunity_type as enum (
  'scholarship', 'bursary', 'internship', 'learnership', 'graduate_programme',
  'entry_level_job', 'training', 'skills_programme', 'apprenticeship',
  'education_programme', 'competition', 'entrepreneurship', 'grant',
  'volunteering', 'event', 'other'
);

create type public.delivery_mode as enum ('in_person', 'remote', 'hybrid');

create type public.opportunity_status as enum (
  'draft', 'pending_review', 'changes_requested', 'rejected', 'published', 'archived'
);

create type public.verification_status as enum (
  'unverified', 'source_checked', 'provider_confirmed', 'needs_recheck', 'disputed'
);

create type public.review_action as enum (
  'request_changes', 'reject', 'publish', 'unpublish', 'archive', 'set_verification'
);

create type public.tracking_status as enum ('interested', 'applying', 'applied', 'not_proceeding');

create type public.report_reason as enum ('suspicious', 'incorrect', 'expired', 'other');

create type public.report_status as enum ('open', 'dismissed', 'actioned');

-- https-only URL check used by several tables (BR-04, BR-05; blocks javascript: etc.)
create function private.is_https_url(_url text)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select _url ~ '^https://[^\s/$.?#][^\s]*$' and char_length(_url) <= 2048;
$$;

-- Today's date in South Africa (used for expiry; BR-03).
create function private.today_sast()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'Africa/Johannesburg')::date;
$$;

grant execute on function private.today_sast() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Categories (admin-maintained reference data). Initial set is a starting
-- point and can be changed by staff.
-- -----------------------------------------------------------------------------
create table public.opportunity_categories (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,40}$'),
  label text not null check (char_length(label) between 1 and 80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.opportunity_categories (code, label, sort_order) values
  ('agriculture', 'Agriculture', 10),
  ('arts_culture', 'Arts and culture', 20),
  ('business_commerce', 'Business and commerce', 30),
  ('education', 'Education and teaching', 40),
  ('engineering', 'Engineering', 50),
  ('health', 'Health', 60),
  ('ict', 'ICT and digital', 70),
  ('law', 'Law', 80),
  ('science', 'Science and research', 90),
  ('social_development', 'Social and community development', 100),
  ('trades', 'Trades and technical', 110),
  ('tourism_hospitality', 'Tourism and hospitality', 120),
  ('general', 'General / any field', 1000);

-- -----------------------------------------------------------------------------
-- opportunities
-- -----------------------------------------------------------------------------
create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null check (char_length(btrim(title)) between 5 and 160),
  summary text not null check (char_length(btrim(summary)) between 1 and 300),
  description text not null check (char_length(btrim(description)) between 1 and 10000),
  opportunity_type public.opportunity_type not null,
  category_code text not null references public.opportunity_categories (code),
  provider_name text not null check (char_length(btrim(provider_name)) between 2 and 160),
  provider_url text check (provider_url is null or private.is_https_url(provider_url)),
  source_url text not null check (private.is_https_url(source_url)),
  application_url text check (application_url is null or private.is_https_url(application_url)),
  application_instructions text check (application_instructions is null or char_length(application_instructions) <= 2000),
  location_text text check (location_text is null or char_length(location_text) <= 160),
  province public.province,
  municipality text check (municipality is null or char_length(municipality) <= 120),
  delivery_mode public.delivery_mode,
  eligibility text check (eligibility is null or char_length(eligibility) <= 5000),
  required_documents text check (required_documents is null or char_length(required_documents) <= 3000),
  required_skills text check (required_skills is null or char_length(required_skills) <= 3000),
  min_qualification public.qualification_level,
  age_min smallint check (age_min is null or age_min between 0 and 120),
  age_max smallint check (age_max is null or age_max between 0 and 120),
  opens_at date,
  closes_at date,
  duration_text text check (duration_text is null or char_length(duration_text) <= 160),
  financial_details text check (financial_details is null or char_length(financial_details) <= 2000),
  contact_info text check (contact_info is null or char_length(contact_info) <= 500),
  status public.opportunity_status not null default 'pending_review',
  verification_status public.verification_status not null default 'unverified',
  verification_notes text check (verification_notes is null or char_length(verification_notes) <= 2000),
  last_checked_at timestamptz,
  published_at timestamptz,
  submitted_by uuid default auth.uid() references public.profiles (id) on delete set null,
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(provider_name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(summary, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'C')
  ) stored,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint opportunities_age_range check (age_min is null or age_max is null or age_min <= age_max),
  constraint opportunities_date_order check (opens_at is null or closes_at is null or opens_at <= closes_at),
  -- BR-10 / D-02: unverified content is never published.
  constraint opportunities_published_is_reviewed check (
    status <> 'published' or (verification_status <> 'unverified' and published_at is not null)
  ),
  -- A published listing must tell people how to apply.
  constraint opportunities_published_has_application_route check (
    status <> 'published' or application_url is not null or application_instructions is not null
  )
);

comment on column public.opportunities.closes_at is
  'Application deadline (inclusive, SAST). NULL = rolling / no fixed deadline. Expiry is derived, never stored.';

create index opportunities_published_closes_idx on public.opportunities (closes_at)
  where status = 'published';
create index opportunities_search_idx on public.opportunities using gin (search_vector);
create index opportunities_type_idx on public.opportunities (opportunity_type);
create index opportunities_category_idx on public.opportunities (category_code);
create index opportunities_province_idx on public.opportunities (province);
create index opportunities_submitted_by_idx on public.opportunities (submitted_by);
create index opportunities_status_idx on public.opportunities (status, created_at);

create trigger opportunities_set_updated_at
  before update on public.opportunities
  for each row execute function private.set_updated_at();

-- Slug: readable prefix from the title + 8 chars of the id (stable, unique).
create function private.opportunities_set_slug()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.slug := trim(both '-' from left(regexp_replace(lower(new.title), '[^a-z0-9]+', '-', 'g'), 80))
              || '-' || left(replace(new.id::text, '-', ''), 8);
  return new;
end;
$$;

create trigger opportunities_set_slug
  before insert on public.opportunities
  for each row execute function private.opportunities_set_slug();

-- Insert guard for members: force safe defaults and rate-limit submissions (T9).
create function private.opportunities_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is not null and not private.is_staff() then
    if (select count(*) from public.opportunities
        where submitted_by = (select auth.uid()) and created_at > now() - interval '24 hours') >= 10 then
      raise exception 'Submission limit reached. Please try again tomorrow.' using errcode = '54000';
    end if;
  end if;
  return new;
end;
$$;

create trigger opportunities_before_insert
  before insert on public.opportunities
  for each row execute function private.opportunities_before_insert();

create trigger opportunities_audit
  after update or delete on public.opportunities
  for each row execute function private.audit_row_change();

-- -----------------------------------------------------------------------------
-- opportunity_reviews: append-only moderation history (BR-11)
-- -----------------------------------------------------------------------------
create table public.opportunity_reviews (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete restrict,
  reviewer_id uuid,
  action public.review_action not null,
  from_status public.opportunity_status not null,
  to_status public.opportunity_status not null,
  verification_status public.verification_status not null,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index opportunity_reviews_opportunity_idx on public.opportunity_reviews (opportunity_id, created_at);

-- -----------------------------------------------------------------------------
-- saved_opportunities
-- -----------------------------------------------------------------------------
create table public.saved_opportunities (
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  tracking_status public.tracking_status not null default 'interested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, opportunity_id)
);

create index saved_opportunities_opportunity_idx on public.saved_opportunities (opportunity_id);

create trigger saved_opportunities_set_updated_at
  before update on public.saved_opportunities
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- reports
-- -----------------------------------------------------------------------------
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  opportunity_id uuid not null references public.opportunities (id) on delete restrict,
  reporter_id uuid default auth.uid() references public.profiles (id) on delete set null,
  reason public.report_reason not null,
  details text check (details is null or char_length(details) <= 1000),
  status public.report_status not null default 'open',
  resolved_by uuid,
  resolved_at timestamptz,
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 2000),
  created_at timestamptz not null default now(),
  constraint reports_resolution_consistent check (
    (status = 'open' and resolved_at is null) or (status <> 'open' and resolved_at is not null)
  )
);

create index reports_status_created_idx on public.reports (status, created_at);
create index reports_opportunity_idx on public.reports (opportunity_id);
create index reports_reporter_idx on public.reports (reporter_id);

create function private.reports_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select count(*) from public.reports
      where reporter_id = (select auth.uid()) and created_at > now() - interval '24 hours') >= 20 then
    raise exception 'Report limit reached. Please try again tomorrow.' using errcode = '54000';
  end if;
  return new;
end;
$$;

create trigger reports_before_insert
  before insert on public.reports
  for each row execute function private.reports_before_insert();

-- -----------------------------------------------------------------------------
-- Public read model (BR-12): only published listings, only public columns.
-- Runs with the view owner's rights so anon never needs table access;
-- the WHERE clause is the access rule.
-- -----------------------------------------------------------------------------
create view public.public_opportunities
with (security_barrier = true)
as
select
  o.id, o.slug, o.title, o.summary, o.description, o.opportunity_type, o.category_code,
  o.provider_name, o.provider_url, o.source_url, o.application_url, o.application_instructions,
  o.location_text, o.province, o.municipality, o.delivery_mode, o.eligibility,
  o.required_documents, o.required_skills, o.min_qualification, o.age_min, o.age_max,
  o.opens_at, o.closes_at, o.duration_text, o.financial_details, o.contact_info,
  o.verification_status, o.last_checked_at, o.published_at, o.updated_at, o.search_vector,
  (o.closes_at is not null and o.closes_at < private.today_sast()) as is_closed
from public.opportunities o
where o.status = 'published';

comment on view public.public_opportunities is
  'Public listing read model. Filter is_closed = false for active listings (BR-03).';

-- -----------------------------------------------------------------------------
-- Workflow RPCs
-- -----------------------------------------------------------------------------

-- Member submits own draft / changes-requested item for review.
create function public.submit_opportunity(opportunity uuid)
returns public.opportunity_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  _row public.opportunities;
begin
  select * into _row from public.opportunities where id = opportunity for update;
  if not found or _row.submitted_by is distinct from (select auth.uid()) then
    raise exception 'Opportunity not found' using errcode = 'P0002';
  end if;
  if _row.status not in ('draft', 'changes_requested') then
    raise exception 'Only drafts or items with requested changes can be submitted' using errcode = '22023';
  end if;
  update public.opportunities set status = 'pending_review' where id = opportunity;
  return 'pending_review'::public.opportunity_status;
end;
$$;

-- Staff moderation (FR-009, FR-010). One transaction: state change + review record + audit.
create function public.review_opportunity(
  opportunity uuid,
  review public.review_action,
  note text default null,
  new_verification public.verification_status default null
)
returns public.opportunity_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  _row public.opportunities;
  _to public.opportunity_status;
  _verification public.verification_status;
  _note text := nullif(btrim(note), '');
begin
  if (select auth.uid()) is null or not private.is_staff() then
    raise exception 'Only moderators and administrators can review opportunities' using errcode = '42501';
  end if;

  select * into _row from public.opportunities where id = opportunity for update;
  if not found then
    raise exception 'Opportunity not found' using errcode = 'P0002';
  end if;

  _verification := coalesce(new_verification, _row.verification_status);
  _to := _row.status;

  case review
    when 'request_changes' then
      if _row.status <> 'pending_review' then
        raise exception 'Changes can only be requested on pending items' using errcode = '22023';
      end if;
      if _note is null then
        raise exception 'A note is required when requesting changes' using errcode = '22023';
      end if;
      _to := 'changes_requested';
    when 'reject' then
      if _row.status <> 'pending_review' then
        raise exception 'Only pending items can be rejected' using errcode = '22023';
      end if;
      if _note is null then
        raise exception 'A reason is required when rejecting' using errcode = '22023';
      end if;
      _to := 'rejected';
    when 'publish' then
      if _row.status <> 'pending_review' then
        raise exception 'Only pending items can be published' using errcode = '22023';
      end if;
      -- D-02: must be source checked or provider confirmed at publication.
      if _verification not in ('source_checked', 'provider_confirmed') then
        raise exception 'Verify the source (source_checked or provider_confirmed) before publishing'
          using errcode = '22023';
      end if;
      if _row.closes_at is not null and _row.closes_at < private.today_sast() then
        raise exception 'Cannot publish an opportunity whose closing date has passed' using errcode = '22023';
      end if;
      _to := 'published';
    when 'unpublish' then
      if _row.status <> 'published' then
        raise exception 'Only published items can be unpublished' using errcode = '22023';
      end if;
      if _note is null then
        raise exception 'A reason is required when unpublishing' using errcode = '22023';
      end if;
      _to := 'pending_review';
    when 'archive' then
      if _row.status not in ('published', 'rejected', 'pending_review', 'changes_requested') then
        raise exception 'This item cannot be archived' using errcode = '22023';
      end if;
      _to := 'archived';
    when 'set_verification' then
      if new_verification is null then
        raise exception 'A verification status is required' using errcode = '22023';
      end if;
      if _row.status = 'published' and new_verification = 'unverified' then
        raise exception 'A published listing cannot be marked unverified; unpublish it instead'
          using errcode = '22023';
      end if;
  end case;

  update public.opportunities set
    status = _to,
    verification_status = _verification,
    verification_notes = coalesce(_note, verification_notes),
    last_checked_at = case
      when new_verification in ('source_checked', 'provider_confirmed') then now()
      else last_checked_at end,
    published_at = case when _to = 'published' then now() else published_at end
  where id = opportunity;

  insert into public.opportunity_reviews
    (opportunity_id, reviewer_id, action, from_status, to_status, verification_status, note)
  values (opportunity, (select auth.uid()), review, _row.status, _to, _verification, _note);

  return _to;
end;
$$;

-- Staff resolve a report (FR-015). Audited.
create function public.resolve_report(report uuid, outcome public.report_status, note text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _old public.reports;
begin
  if (select auth.uid()) is null or not private.is_staff() then
    raise exception 'Only moderators and administrators can resolve reports' using errcode = '42501';
  end if;
  if outcome = 'open' then
    raise exception 'Outcome must be dismissed or actioned' using errcode = '22023';
  end if;
  select * into _old from public.reports where id = report for update;
  if not found then
    raise exception 'Report not found' using errcode = 'P0002';
  end if;
  if _old.status <> 'open' then
    raise exception 'Report already resolved' using errcode = '22023';
  end if;
  update public.reports
    set status = outcome, resolved_by = (select auth.uid()), resolved_at = now(),
        resolution_note = nullif(btrim(note), '')
    where id = report;
  perform private.write_audit('resolve_report', 'reports', report::text,
    jsonb_build_object('status', _old.status), jsonb_build_object('status', outcome), note);
end;
$$;

revoke execute on function public.submit_opportunity(uuid) from public, anon;
revoke execute on function public.review_opportunity(uuid, public.review_action, text, public.verification_status) from public, anon;
revoke execute on function public.resolve_report(uuid, public.report_status, text) from public, anon;
grant execute on function public.submit_opportunity(uuid) to authenticated;
grant execute on function public.review_opportunity(uuid, public.review_action, text, public.verification_status) to authenticated;
grant execute on function public.resolve_report(uuid, public.report_status, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Row Level Security and privileges
-- -----------------------------------------------------------------------------
alter table public.opportunity_categories enable row level security;
alter table public.opportunities enable row level security;
alter table public.opportunity_reviews enable row level security;
alter table public.saved_opportunities enable row level security;
alter table public.reports enable row level security;

revoke all on public.opportunity_categories, public.opportunities, public.opportunity_reviews,
  public.saved_opportunities, public.reports, public.public_opportunities
  from anon, authenticated;

-- Categories: everyone reads active ones; staff manage.
grant select on public.opportunity_categories to anon, authenticated;
grant insert, update on public.opportunity_categories to authenticated;

create policy categories_select on public.opportunity_categories
  for select to anon, authenticated
  using (is_active or (select private.is_staff()));
create policy categories_insert_staff on public.opportunity_categories
  for insert to authenticated with check ((select private.is_staff()));
create policy categories_update_staff on public.opportunity_categories
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));

create trigger opportunity_categories_audit
  after insert or update or delete on public.opportunity_categories
  for each row execute function private.audit_row_change();

-- Public view.
grant select on public.public_opportunities to anon, authenticated;

-- Opportunities: content columns only. Status/verification/publication columns are
-- never directly writable by clients; they change only through the RPCs above.
grant select on public.opportunities to authenticated;
grant insert (
  title, summary, description, opportunity_type, category_code, provider_name, provider_url,
  source_url, application_url, application_instructions, location_text, province, municipality,
  delivery_mode, eligibility, required_documents, required_skills, min_qualification,
  age_min, age_max, opens_at, closes_at, duration_text, financial_details, contact_info, status
) on public.opportunities to authenticated;
grant update (
  title, summary, description, opportunity_type, category_code, provider_name, provider_url,
  source_url, application_url, application_instructions, location_text, province, municipality,
  delivery_mode, eligibility, required_documents, required_skills, min_qualification,
  age_min, age_max, opens_at, closes_at, duration_text, financial_details, contact_info
) on public.opportunities to authenticated;
grant delete on public.opportunities to authenticated;

-- Read: own submissions or staff. (Public reads go through public_opportunities.)
create policy opportunities_select_own_or_staff on public.opportunities
  for select to authenticated
  using (submitted_by = (select auth.uid()) or (select private.is_staff()));

-- Insert: any signed-in member (D-03), only as draft or pending review, as themselves.
create policy opportunities_insert_member on public.opportunities
  for insert to authenticated
  with check (
    submitted_by = (select auth.uid())
    and status in ('draft', 'pending_review')
  );

-- Update content: owner while draft/changes requested; staff any time.
create policy opportunities_update_owner on public.opportunities
  for update to authenticated
  using (submitted_by = (select auth.uid()) and status in ('draft', 'changes_requested'))
  with check (submitted_by = (select auth.uid()) and status in ('draft', 'changes_requested'));
create policy opportunities_update_staff on public.opportunities
  for update to authenticated
  using ((select private.is_staff()))
  with check ((select private.is_staff()));

-- Delete: owner may delete own unsubmitted drafts only. Staff archive instead (BR-11).
create policy opportunities_delete_own_draft on public.opportunities
  for delete to authenticated
  using (submitted_by = (select auth.uid()) and status = 'draft');

-- Reviews: staff read all; submitters read reviews of their own items.
grant select on public.opportunity_reviews to authenticated;
create policy reviews_select on public.opportunity_reviews
  for select to authenticated
  using (
    (select private.is_staff())
    or exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.submitted_by = (select auth.uid())
    )
  );

-- Saved: strictly own rows; only published items can be saved.
grant select, delete on public.saved_opportunities to authenticated;
grant insert (opportunity_id, tracking_status) on public.saved_opportunities to authenticated;
grant update (tracking_status) on public.saved_opportunities to authenticated;

create policy saved_select_own on public.saved_opportunities
  for select to authenticated using (user_id = (select auth.uid()));
create policy saved_insert_own on public.saved_opportunities
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.public_opportunities p where p.id = opportunity_id)
  );
create policy saved_update_own on public.saved_opportunities
  for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy saved_delete_own on public.saved_opportunities
  for delete to authenticated using (user_id = (select auth.uid()));

-- Reports: signed-in users report published items (D-04); reporter sees own; staff see all.
grant select on public.reports to authenticated;
grant insert (opportunity_id, reason, details) on public.reports to authenticated;

create policy reports_insert_member on public.reports
  for insert to authenticated
  with check (
    reporter_id = (select auth.uid())
    and status = 'open'
    and exists (select 1 from public.public_opportunities p where p.id = opportunity_id)
  );
create policy reports_select_own_or_staff on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select private.is_staff()));
