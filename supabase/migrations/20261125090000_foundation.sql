-- =============================================================================
-- RISE NETWORK — Migration 1: identity, roles, consent and audit foundation
-- See docs/DATA_MODEL.md and docs/SECURITY.md.
--
-- Security model:
--   * RLS is enabled on every table; default deny.
--   * Table privileges are granted explicitly (no blanket grants to anon/authenticated).
--   * Privileged helpers live in the `private` schema, which is not exposed by the API.
--   * Function EXECUTE is revoked from PUBLIC and granted explicitly.
-- =============================================================================

-- Functions must not be executable by everyone by default.
alter default privileges in schema public revoke execute on functions from public;
alter default privileges in schema public revoke all on tables from anon, authenticated;

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;
alter default privileges in schema private revoke execute on functions from public;

-- -----------------------------------------------------------------------------
-- Enumerations
-- -----------------------------------------------------------------------------
create type public.app_role as enum ('moderator', 'admin');

create type public.province as enum (
  'eastern_cape', 'free_state', 'gauteng', 'kwazulu_natal', 'limpopo',
  'mpumalanga', 'north_west', 'northern_cape', 'western_cape',
  'national', 'online'
);

create type public.qualification_level as enum (
  'none', 'grade_9', 'matric', 'certificate', 'diploma', 'degree', 'postgraduate'
);

create type public.policy_document as enum ('terms', 'privacy');

-- -----------------------------------------------------------------------------
-- Generic helpers
-- -----------------------------------------------------------------------------
create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on sign-up
-- -----------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null
    check (char_length(btrim(display_name)) between 1 and 80),
  province public.province,
  education_level public.qualification_level,
  interests text[] not null default '{}'
    check (cardinality(interests) <= 20),
  -- D-01: registration is 18+; the user self-declares at sign-up.
  age_confirmed_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.profiles is
  'Member profile (1:1 with auth.users). Private: readable only by the owner and admins.';

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function private.set_updated_at();

-- -----------------------------------------------------------------------------
-- user_roles: elevated roles only. Members have no row.
-- -----------------------------------------------------------------------------
create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.app_role not null,
  granted_by uuid,
  granted_at timestamptz not null default now(),
  primary key (user_id, role)
);

comment on table public.user_roles is
  'Elevated role assignments. No client write access; changed only via public.set_user_role().';

-- -----------------------------------------------------------------------------
-- consent_records: history of terms/privacy acceptance
-- -----------------------------------------------------------------------------
create table public.consent_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  document public.policy_document not null,
  version text not null check (char_length(version) between 1 and 32),
  accepted_at timestamptz not null default now()
);

create index consent_records_user_id_idx on public.consent_records (user_id);

-- -----------------------------------------------------------------------------
-- audit_logs: append-only record of important actions
-- actor_id deliberately has no FK so the record survives account deletion
-- as a non-identifying reference (docs/PRIVACY.md).
-- -----------------------------------------------------------------------------
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null check (char_length(action) between 1 and 64),
  entity_type text not null check (char_length(entity_type) between 1 and 64),
  entity_id text not null,
  old_data jsonb,
  new_data jsonb,
  note text check (note is null or char_length(note) <= 2000),
  created_at timestamptz not null default now()
);

create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_actor_created_idx on public.audit_logs (actor_id, created_at desc);

create function private.prevent_audit_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'audit_logs is append-only' using errcode = '42501';
end;
$$;

create trigger audit_logs_append_only
  before update or delete on public.audit_logs
  for each row execute function private.prevent_audit_mutation();

create trigger audit_logs_no_truncate
  before truncate on public.audit_logs
  for each statement execute function private.prevent_audit_mutation();

create function private.write_audit(
  _action text,
  _entity_type text,
  _entity_id text,
  _old jsonb default null,
  _new jsonb default null,
  _note text default null
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, old_data, new_data, note)
  values ((select auth.uid()), _action, _entity_type, _entity_id, _old, _new, _note);
$$;

-- Generic row-level audit trigger: records INSERT/UPDATE/DELETE with before/after images.
create function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    perform private.write_audit(lower(tg_op), tg_table_name, (to_jsonb(new) ->> 'id'), null, to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    if to_jsonb(new) - 'updated_at' is distinct from to_jsonb(old) - 'updated_at' then
      perform private.write_audit(lower(tg_op), tg_table_name, (to_jsonb(new) ->> 'id'), to_jsonb(old), to_jsonb(new));
    end if;
    return new;
  else
    perform private.write_audit(lower(tg_op), tg_table_name, (to_jsonb(old) ->> 'id'), to_jsonb(old), null);
    return old;
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Role helpers (used by RLS policies)
-- -----------------------------------------------------------------------------
create function private.has_role(_role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role = _role
  );
$$;

-- Staff = moderator or admin. Admins have all moderator capabilities.
create function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = (select auth.uid()) and role in ('moderator', 'admin')
  );
$$;

grant execute on function private.has_role(public.app_role) to anon, authenticated;
grant execute on function private.is_staff() to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Sign-up hook: create profile + consent records from sign-up metadata.
-- Rejects sign-up if age confirmation or policy versions are missing (D-01, FR-001).
-- -----------------------------------------------------------------------------
create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  _meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  _display_name text := btrim(coalesce(_meta ->> 'display_name', ''));
  _terms_version text := _meta ->> 'terms_version';
  _privacy_version text := _meta ->> 'privacy_version';
begin
  if coalesce((_meta ->> 'age_confirmed')::boolean, false) is not true then
    raise exception 'Registration requires confirmation that the user is 18 or older'
      using errcode = '22023';
  end if;
  if _terms_version is null or _privacy_version is null then
    raise exception 'Registration requires acceptance of the terms of use and privacy notice'
      using errcode = '22023';
  end if;
  if char_length(_display_name) = 0 then
    _display_name := 'Member';
  end if;

  insert into public.profiles (id, display_name, age_confirmed_at)
  values (new.id, left(_display_name, 80), now());

  insert into public.consent_records (user_id, document, version)
  values (new.id, 'terms', _terms_version), (new.id, 'privacy', _privacy_version);

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- -----------------------------------------------------------------------------
-- Role management RPC (FR-016). Admin only; cannot change own roles;
-- cannot remove the last admin. Audited.
-- -----------------------------------------------------------------------------
create function public.set_user_role(target_user uuid, target_role public.app_role, should_have boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  _actor uuid := (select auth.uid());
begin
  if _actor is null or not private.has_role('admin') then
    raise exception 'Only administrators can change roles' using errcode = '42501';
  end if;
  if target_user = _actor then
    raise exception 'Administrators cannot change their own roles' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = target_user) then
    raise exception 'User not found' using errcode = 'P0002';
  end if;

  if should_have then
    insert into public.user_roles (user_id, role, granted_by)
    values (target_user, target_role, _actor)
    on conflict (user_id, role) do nothing;
    if found then
      perform private.write_audit('grant_role', 'user_roles', target_user::text, null,
        jsonb_build_object('role', target_role));
    end if;
  else
    if target_role = 'admin'
       and (select count(*) from public.user_roles where role = 'admin') <= 1
       and exists (select 1 from public.user_roles where user_id = target_user and role = 'admin') then
      raise exception 'Cannot remove the last administrator' using errcode = '42501';
    end if;
    delete from public.user_roles where user_id = target_user and role = target_role;
    if found then
      perform private.write_audit('revoke_role', 'user_roles', target_user::text,
        jsonb_build_object('role', target_role), null);
    end if;
  end if;
end;
$$;

revoke execute on function public.set_user_role(uuid, public.app_role, boolean) from public, anon;
grant execute on function public.set_user_role(uuid, public.app_role, boolean) to authenticated;

-- -----------------------------------------------------------------------------
-- Profile change audit is limited to admin-relevant events; ordinary member
-- profile edits are not audited (data minimisation).
-- -----------------------------------------------------------------------------

-- -----------------------------------------------------------------------------
-- Row Level Security
-- -----------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.consent_records enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles, public.user_roles, public.consent_records, public.audit_logs
  from anon, authenticated;

-- profiles: owner reads/updates own; admins read all. Only listed columns are updatable.
grant select on public.profiles to authenticated;
grant update (display_name, province, education_level, interests) on public.profiles to authenticated;

create policy profiles_select_own_or_admin on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select private.has_role('admin')));

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- user_roles: user reads own roles; admins read all. No write grants.
grant select on public.user_roles to authenticated;

create policy user_roles_select_own_or_admin on public.user_roles
  for select to authenticated
  using (user_id = (select auth.uid()) or (select private.has_role('admin')));

-- consent_records: owner reads own. No write grants (written by sign-up hook).
grant select on public.consent_records to authenticated;

create policy consent_records_select_own on public.consent_records
  for select to authenticated
  using (user_id = (select auth.uid()));

-- audit_logs: admins read. No write grants (written by security definer functions).
grant select on public.audit_logs to authenticated;

create policy audit_logs_select_admin on public.audit_logs
  for select to authenticated
  using ((select private.has_role('admin')));
