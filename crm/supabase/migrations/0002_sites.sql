-- Potential sites (location, Google Maps link, people to contact). Run after 0001_schema.sql.
create table if not exists public.sites (
  id uuid primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  city text,
  data jsonb not null,            -- includes contacts[] (name, phone, role), mapsUrl, lat/lng, notes
  updated_at timestamptz not null default now()
);
create index if not exists sites_company_idx on public.sites (company_id);
create index if not exists sites_owner_city_idx on public.sites (owner_id, city);

drop trigger if exists touch_sites on public.sites;
create trigger touch_sites before update on public.sites for each row execute function public.touch_updated_at();

alter table public.sites enable row level security;
drop policy if exists "owner_select" on public.sites;
drop policy if exists "owner_insert" on public.sites;
drop policy if exists "owner_update" on public.sites;
drop policy if exists "owner_delete" on public.sites;
create policy "owner_select" on public.sites for select to authenticated using (owner_id = auth.uid());
create policy "owner_insert" on public.sites for insert to authenticated with check (owner_id = auth.uid());
create policy "owner_update" on public.sites for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "owner_delete" on public.sites for delete to authenticated using (owner_id = auth.uid());
revoke all on public.sites from anon;
grant select, insert, update, delete on public.sites to authenticated;
