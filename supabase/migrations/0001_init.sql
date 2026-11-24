-- Reliable Developers: initial schema. Run in the Supabase SQL editor (or `supabase db push`).
create extension if not exists pgcrypto;

create type app_role as enum ('admin','editor','sales');
create type lead_status as enum ('new','contacted','qualified','site_visit_requested','site_visit_done','negotiation','won','lost','spam');

create table public.profiles(
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text, role app_role not null default 'sales', created_at timestamptz not null default now());

create table public.properties(
  id text primary key, ref text unique, title text not null, type text not null, location text not null,
  price bigint, area numeric, unit text, beds int, status text not null default 'Available',
  published boolean not null default false, archived boolean not null default false, demo boolean not null default false,
  description text, amenities text[] default '{}', images text[] default '{}', lat numeric, lng numeric, featured boolean default false,
  confidence jsonb not null default '{}', created_at timestamptz not null default now(), updated_at timestamptz not null default now());

create table public.leads(
  id uuid primary key default gen_random_uuid(), ref text unique not null, type text not null,
  name text not null, phone_cc text not null, phone text not null, message text,
  property_ref text, preferred_date date, preferred_slot text, property_type text, location text, budget text, contact_method text, finder jsonb,
  consent boolean not null, consent_text text, consent_at timestamptz,
  lang text, page text, landing_page text, referrer text, utm_source text, utm_medium text, utm_campaign text, utm_term text, utm_content text, gclid text, fbclid text, event_id text,
  status lead_status not null default 'new', assigned_to uuid references public.profiles(id), follow_up_on date, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now());
create index leads_status_idx on public.leads(status, created_at desc);
create index leads_phone_idx on public.leads(phone);

create table public.audit_log(
  id bigserial primary key, at timestamptz not null default now(), actor uuid, action text not null, table_name text not null, row_id text, old_row jsonb, new_row jsonb);

-- helper: current user's role (security definer so policies can read profiles safely)
create or replace function public.current_role_name() returns text language sql stable security definer set search_path=public as
$$ select role::text from public.profiles where id=auth.uid() $$;

create or replace function public.touch_updated() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
create trigger t_leads_touch before update on public.leads for each row execute function public.touch_updated();
create trigger t_props_touch before update on public.properties for each row execute function public.touch_updated();

create or replace function public.audit() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.audit_log(actor,action,table_name,row_id,old_row,new_row)
 values(auth.uid(),tg_op,tg_table_name,coalesce((to_jsonb(new)->>'id'),(to_jsonb(old)->>'id')),case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
 return coalesce(new,old); end $$;
create trigger t_leads_audit after update or delete on public.leads for each row execute function public.audit();
create trigger t_props_audit after insert or update or delete on public.properties for each row execute function public.audit();
create trigger t_prof_audit after update or delete on public.profiles for each row execute function public.audit();

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.leads enable row level security;
alter table public.audit_log enable row level security;

-- Leads: NO anonymous insert. The API function inserts with the service-role key (which bypasses RLS).
create policy leads_read on public.leads for select to authenticated using (public.current_role_name() in ('admin','sales'));
create policy leads_update on public.leads for update to authenticated using (public.current_role_name() in ('admin','sales')) with check (public.current_role_name() in ('admin','sales'));
create policy leads_delete on public.leads for delete to authenticated using (public.current_role_name()='admin');

-- Properties: public can read only published, non-demo, non-archived rows. Editors and admins manage.
create policy props_public on public.properties for select to anon, authenticated using (published and not archived and not demo);
create policy props_staff_read on public.properties for select to authenticated using (public.current_role_name() in ('admin','editor','sales'));
create policy props_write on public.properties for all to authenticated using (public.current_role_name() in ('admin','editor')) with check (public.current_role_name() in ('admin','editor'));

-- Profiles: users read their own; admins manage. Nobody can promote themselves.
create policy prof_self on public.profiles for select to authenticated using (id=auth.uid() or public.current_role_name()='admin');
create policy prof_admin on public.profiles for all to authenticated using (public.current_role_name()='admin') with check (public.current_role_name()='admin');

create policy audit_admin on public.audit_log for select to authenticated using (public.current_role_name()='admin');

-- New auth users get a least-privilege profile; an admin raises the role manually.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into public.profiles(id,full_name,role) values(new.id,new.raw_user_meta_data->>'full_name','sales') on conflict do nothing; return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();
-- To make yourself admin once: update public.profiles set role='admin' where id='<your auth user id>';
