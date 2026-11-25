-- =============================================================================
-- RISE NETWORK — Migration 3: learning & career resources, account deletion
-- =============================================================================

grant execute on function private.is_https_url(text) to authenticated;

create type public.resource_status as enum ('draft', 'published', 'archived');
create type public.learning_level as enum ('beginner', 'intermediate', 'advanced', 'all_levels');
create type public.learning_format as enum ('online_self_paced', 'online_live', 'in_person', 'blended');
create type public.cost_type as enum ('free', 'paid', 'funded', 'unknown');
create type public.career_topic as enum (
  'cv', 'interview', 'workplace_readiness', 'communication', 'career_exploration',
  'career_pathways', 'portfolio', 'job_search', 'professional_skills'
);

-- -----------------------------------------------------------------------------
-- Learning resource categories (admin-maintained; initial set may be changed)
-- -----------------------------------------------------------------------------
create table public.learning_categories (
  code text primary key check (code ~ '^[a-z][a-z0-9_]{1,40}$'),
  label text not null check (char_length(label) between 1 and 80),
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.learning_categories (code, label, sort_order) values
  ('digital_literacy', 'Digital literacy', 10),
  ('technical_skills', 'Technical skills', 20),
  ('professional_development', 'Professional development', 30),
  ('certifications', 'Certifications', 40),
  ('study_resources', 'Study resources', 50),
  ('entrepreneurship', 'Entrepreneurship', 60),
  ('other', 'Other', 1000);

-- -----------------------------------------------------------------------------
-- learning_resources (FR-011). RISE NETWORK does not accredit courses.
-- -----------------------------------------------------------------------------
create table public.learning_resources (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  description text not null check (char_length(btrim(description)) between 1 and 3000),
  provider_name text not null check (char_length(btrim(provider_name)) between 2 and 160),
  category_code text not null references public.learning_categories (code),
  level public.learning_level not null default 'all_levels',
  format public.learning_format not null,
  cost public.cost_type not null default 'unknown',
  duration_text text check (duration_text is null or char_length(duration_text) <= 120),
  requirements text check (requirements is null or char_length(requirements) <= 2000),
  url text not null check (private.is_https_url(url)),
  status public.resource_status not null default 'draft',
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index learning_resources_published_idx on public.learning_resources (category_code)
  where status = 'published';

-- -----------------------------------------------------------------------------
-- career_resources (FR-012)
-- -----------------------------------------------------------------------------
create table public.career_resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 100),
  title text not null check (char_length(btrim(title)) between 3 and 160),
  summary text not null check (char_length(btrim(summary)) between 1 and 300),
  body text check (body is null or char_length(body) <= 20000),
  topic public.career_topic not null,
  external_url text check (external_url is null or private.is_https_url(external_url)),
  status public.resource_status not null default 'draft',
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint career_resources_has_content check (body is not null or external_url is not null)
);

create index career_resources_published_idx on public.career_resources (topic)
  where status = 'published';

create trigger learning_resources_set_updated_at
  before update on public.learning_resources
  for each row execute function private.set_updated_at();
create trigger career_resources_set_updated_at
  before update on public.career_resources
  for each row execute function private.set_updated_at();

create trigger learning_resources_audit
  after insert or update or delete on public.learning_resources
  for each row execute function private.audit_row_change();
create trigger career_resources_audit
  after insert or update or delete on public.career_resources
  for each row execute function private.audit_row_change();
create trigger learning_categories_audit
  after insert or update or delete on public.learning_categories
  for each row execute function private.audit_row_change();

-- -----------------------------------------------------------------------------
-- RLS: public reads published; staff manage everything.
-- -----------------------------------------------------------------------------
alter table public.learning_categories enable row level security;
alter table public.learning_resources enable row level security;
alter table public.career_resources enable row level security;

revoke all on public.learning_categories, public.learning_resources, public.career_resources
  from anon, authenticated;

grant select on public.learning_categories, public.learning_resources, public.career_resources
  to anon, authenticated;
grant insert, update, delete on public.learning_categories, public.learning_resources,
  public.career_resources to authenticated;

create policy learning_categories_select on public.learning_categories
  for select to anon, authenticated using (is_active or (select private.is_staff()));
create policy learning_categories_write_staff on public.learning_categories
  for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy learning_resources_select on public.learning_resources
  for select to anon, authenticated
  using (status = 'published' or (select private.is_staff()));
create policy learning_resources_write_staff on public.learning_resources
  for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

create policy career_resources_select on public.career_resources
  for select to anon, authenticated
  using (status = 'published' or (select private.is_staff()));
create policy career_resources_write_staff on public.career_resources
  for all to authenticated
  using ((select private.is_staff())) with check ((select private.is_staff()));

-- -----------------------------------------------------------------------------
-- Account deletion (FR-019, BR-09, D-05).
-- Deleting the auth user cascades to profile, roles, saved items and consent records;
-- submitted opportunities and reports are kept with the author link set to NULL.
-- The last administrator cannot delete their account (prevents lock-out).
-- -----------------------------------------------------------------------------
create function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _uid uuid := (select auth.uid());
begin
  if _uid is null then
    raise exception 'Not signed in' using errcode = '42501';
  end if;
  if exists (select 1 from public.user_roles where user_id = _uid and role = 'admin')
     and (select count(*) from public.user_roles where role = 'admin') <= 1 then
    raise exception 'The last administrator cannot delete their account' using errcode = '42501';
  end if;
  perform private.write_audit('delete_account', 'profiles', _uid::text);
  delete from auth.users where id = _uid;
end;
$$;

revoke execute on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
