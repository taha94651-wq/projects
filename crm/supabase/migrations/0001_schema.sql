-- Fit-Out CRM — Supabase / PostgreSQL schema + Row Level Security
-- Run once in the Supabase SQL editor (or `supabase db push`).
--
-- Design: every table holds real, indexed / foreign-key columns (integrity, SQL reporting) plus the full
-- record in `data jsonb`, which the app reads back. `owner_id` defaults to auth.uid(), and RLS makes each
-- signed-in user see and change ONLY their own rows. The service-role key is never needed by the app.

create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------- configuration tables
create table if not exists public.settings (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  parent_id uuid references public.categories(id) on delete restrict,   -- null = group (A/B/C/D), else subcategory
  sort int not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.stages (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  sort int not null default 0,
  kind text not null check (kind in ('open','won','lost','hold')),
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- generic editable dropdown lists: source, priority, clientType, assignee, companySize, industry,
-- relationship, projectType, projectStatus, activityType, lossReason, city
create table if not exists public.options (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  list text not null,
  sort int not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_fields (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  entity text not null default 'lead',
  sort int not null default 0,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------- business tables
create table if not exists public.companies (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  is_demo boolean not null default false,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.contacts (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  is_demo boolean not null default false,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  code text not null,
  company_id uuid references public.companies(id) on delete set null,
  stage_id uuid references public.stages(id) on delete restrict,       -- in-use stages cannot be dropped
  priority_id uuid references public.options(id) on delete restrict,
  source_id uuid references public.options(id) on delete restrict,
  assignee_id uuid references public.options(id) on delete restrict,
  next_follow_up date,
  est_value numeric(16,2),
  is_demo boolean not null default false,
  data jsonb not null,
  updated_at timestamptz not null default now(),
  unique (owner_id, code)
);

create table if not exists public.projects (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  status_id uuid references public.options(id) on delete restrict,
  probability numeric(5,2) not null default 0 check (probability between 0 and 100),
  is_demo boolean not null default false,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.activities (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  due_at timestamptz,
  done boolean not null default false,
  is_demo boolean not null default false,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------- indexes
create index if not exists leads_owner_stage_idx   on public.leads (owner_id, stage_id);
create index if not exists leads_owner_follow_idx  on public.leads (owner_id, next_follow_up);
create index if not exists leads_company_idx       on public.leads (company_id);
create index if not exists contacts_company_idx    on public.contacts (company_id);
create index if not exists activities_lead_idx     on public.activities (lead_id);
create index if not exists activities_due_idx      on public.activities (owner_id, done, due_at);
create index if not exists projects_company_idx    on public.projects (company_id);
create index if not exists options_list_idx        on public.options (owner_id, list);
create index if not exists categories_parent_idx   on public.categories (parent_id);

-- ----------------------------------------------------------------------------- updated_at trigger
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  foreach t in array array['settings','categories','stages','options','custom_fields','companies','contacts','leads','projects','activities']
  loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------- Row Level Security
-- Each signed-in user can only read / write rows they own. Anonymous (not signed-in) requests get nothing.
do $$
declare t text;
begin
  foreach t in array array['settings','categories','stages','options','custom_fields','companies','contacts','leads','projects','activities']
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists "owner_select" on public.%I', t);
    execute format('drop policy if exists "owner_insert" on public.%I', t);
    execute format('drop policy if exists "owner_update" on public.%I', t);
    execute format('drop policy if exists "owner_delete" on public.%I', t);
    execute format('create policy "owner_select" on public.%I for select to authenticated using (owner_id = auth.uid())', t);
    execute format('create policy "owner_insert" on public.%I for insert to authenticated with check (owner_id = auth.uid())', t);
    execute format('create policy "owner_update" on public.%I for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid())', t);
    execute format('create policy "owner_delete" on public.%I for delete to authenticated using (owner_id = auth.uid())', t);
    execute format('revoke all on public.%I from anon', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- TEAM WORKSPACE (optional): to let several staff accounts share one data set, replace the four policies
-- above with `using (true) with check (true)` for role `authenticated`, and disable public sign-ups in
-- Authentication -> Providers -> Email so only users you invite can sign in.
