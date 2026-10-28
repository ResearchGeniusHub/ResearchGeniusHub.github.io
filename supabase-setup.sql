-- ============================================================================
-- Research Genius Hub: RUN THIS ONCE in Supabase > SQL Editor (safe to re-run).
-- THIS VERSION ALSO: fixes the "all_levels column" error, lets you add staff and confirm sample
-- payments with NO Edge Function, and reloads Supabase so the changes are seen straight away.
-- Adds: sample upload (PDF with images), rates, levels, access codes, staff admin.
-- BEFORE RUNNING: change the admin email in the line marked  <-- YOUR ADMIN EMAIL
-- ============================================================================

-- 0. Who is admin ------------------------------------------------------------
create table if not exists public.rgh_admins (email text primary key);
insert into public.rgh_admins(email) values ('researchgeniushub@gmail.com')   -- <-- YOUR ADMIN EMAIL (the one you sign in with)
on conflict do nothing;

-- 1. Staff profiles (this is what was missing, so your staff list was empty) ----
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  full_name text,
  services text[] not null default '{}',
  active boolean not null default true,
  must_confirm boolean not null default true,
  contact_email text, contact_phone text,
  contact_approved boolean not null default false,
  pending_email text, pending_phone text,
  created_at timestamptz not null default now()
);
alter table public.staff_profiles enable row level security;

create or replace function public.my_role() returns text
language plpgsql stable security definer set search_path = public as $$
declare em text := lower(coalesce(auth.jwt() ->> 'email','')); p public.staff_profiles;
begin
  if auth.uid() is null then return 'student'; end if;
  if (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' or exists (select 1 from public.rgh_admins a where lower(a.email) = em) then return 'admin'; end if;
  select * into p from public.staff_profiles where user_id = auth.uid();
  if found then
    if not p.active then return 'student'; end if;
    if p.must_confirm or not p.contact_approved then return 'staff_pending'; end if;
    return 'staff';
  end if;
  return 'student';
end $$;

drop policy if exists "staff read own profile" on public.staff_profiles;
create policy "staff read own profile" on public.staff_profiles for select to authenticated using (user_id = auth.uid() or public.my_role() = 'admin');

create or replace function public.my_staff_profile() returns setof public.staff_profiles
language sql stable security definer set search_path = public as $$ select * from public.staff_profiles where user_id = auth.uid() $$;

create or replace function public.staff_set_contact(p_email text, p_phone text) returns text
language plpgsql security definer set search_path = public as $$
declare p public.staff_profiles;
begin
  select * into p from public.staff_profiles where user_id = auth.uid(); if not found then raise exception 'Not a staff account'; end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or coalesce(trim(p_phone),'') = '' then raise exception 'Enter a valid email and phone number'; end if;
  if p.contact_email is null then   -- first time: activate straight away
    update public.staff_profiles set contact_email = lower(trim(p_email)), contact_phone = trim(p_phone), contact_approved = true, must_confirm = false where user_id = auth.uid();
    return 'active';
  elsif lower(trim(p_email)) = lower(p.contact_email) and trim(p_phone) = p.contact_phone then
    update public.staff_profiles set contact_approved = true, must_confirm = false, pending_email = null, pending_phone = null where user_id = auth.uid(); return 'active';
  else
    update public.staff_profiles set pending_email = lower(trim(p_email)), pending_phone = trim(p_phone), contact_approved = false where user_id = auth.uid(); return 'pending';
  end if;
end $$;

drop function if exists public.admin_list_staff();
create function public.admin_list_staff() returns setof public.staff_profiles
language plpgsql stable security definer set search_path = public as $$
begin if public.my_role() <> 'admin' then raise exception 'Admin only'; end if;
  return query select * from public.staff_profiles order by created_at desc; end $$;

create or replace function public.admin_set_services(p_user uuid, p_services text[]) returns void
language plpgsql security definer set search_path = public as $$
begin if public.my_role() <> 'admin' then raise exception 'Admin only'; end if; update public.staff_profiles set services = p_services where user_id = p_user; end $$;

create or replace function public.admin_set_active(p_user uuid, p_active boolean) returns void
language plpgsql security definer set search_path = public as $$
begin if public.my_role() <> 'admin' then raise exception 'Admin only'; end if; update public.staff_profiles set active = p_active where user_id = p_user; end $$;

create or replace function public.admin_review_contact(p_user uuid, p_approve boolean) returns void
language plpgsql security definer set search_path = public as $$
begin if public.my_role() <> 'admin' then raise exception 'Admin only'; end if;
  if p_approve then update public.staff_profiles set contact_email = coalesce(pending_email, contact_email), contact_phone = coalesce(pending_phone, contact_phone), pending_email = null, pending_phone = null, contact_approved = true, must_confirm = false where user_id = p_user;
  else update public.staff_profiles set pending_email = null, pending_phone = null, contact_approved = false, must_confirm = true where user_id = p_user; end if; end $$;

-- 2. Samples: levels, rate per page (min 2), PDF file, free pages ---------------
create table if not exists public.samples (
  id uuid primary key default gen_random_uuid(),
  title text not null, subject text, level text, style text default 'Harvard',
  pages integer not null default 1, intro text default '', created_at timestamptz not null default now()
);
alter table public.samples add column if not exists levels text[] not null default '{}';
alter table public.samples add column if not exists all_levels boolean not null default false;
alter table public.samples add column if not exists price_per_page numeric(10,2) not null default 2.00;
alter table public.samples add column if not exists free_pages integer not null default 1;
alter table public.samples add column if not exists file_path text;
alter table public.samples add column if not exists file_name text;
alter table public.samples add column if not exists published boolean not null default true;
alter table public.samples add column if not exists words_per_page integer default 275;
update public.samples set price_per_page = 2 where price_per_page < 2;
alter table public.samples drop constraint if exists samples_rate_min;
alter table public.samples add constraint samples_rate_min check (price_per_page >= 2);
alter table public.samples enable row level security;
create table if not exists public.sample_full (sample_id uuid primary key references public.samples(id) on delete cascade, body text not null default '');
alter table public.sample_full enable row level security;

drop policy if exists "rgh public read samples" on public.samples;
create policy "rgh public read samples" on public.samples for select to anon, authenticated using (published = true or public.my_role() in ('admin','staff'));
drop policy if exists "rgh admin write samples" on public.samples;
create policy "rgh admin write samples" on public.samples for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');
drop policy if exists "rgh admin sample_full" on public.sample_full;
create policy "rgh admin sample_full" on public.sample_full for all to authenticated using (public.my_role() = 'admin') with check (public.my_role() = 'admin');

-- 3. Access requests and codes ------------------------------------------------
create table if not exists public.sample_access (
  id uuid primary key default gen_random_uuid(),
  sample_id uuid not null references public.samples(id) on delete cascade,
  email text not null, pages integer not null default 1, format text, reference text,
  code text, status text not null default 'requested', created_at timestamptz not null default now()
);
alter table public.sample_access add column if not exists user_id uuid;
alter table public.sample_access add column if not exists open_limit integer not null default 2;
alter table public.sample_access add column if not exists opens_used integer not null default 0;
alter table public.sample_access add column if not exists download_limit integer not null default 1;
alter table public.sample_access add column if not exists download_used integer not null default 0;
alter table public.sample_access add column if not exists last_session text;
alter table public.sample_access add column if not exists amount numeric(10,2);
alter table public.sample_access add column if not exists approved_at timestamptz;
update public.sample_access set status = 'approved' where status = 'granted';
alter table public.sample_access add column if not exists pay_option text not null default 'full';
alter table public.sample_access add column if not exists due_now numeric(10,2);
alter table public.sample_access add column if not exists paid_amount numeric(10,2);
alter table public.sample_access add column if not exists unlocked_pages integer;
alter table public.sample_access enable row level security;

drop policy if exists "rgh staff manage access" on public.sample_access;
create policy "rgh staff manage access" on public.sample_access for all to authenticated using (public.my_role() in ('admin','staff')) with check (public.my_role() in ('admin','staff'));
drop policy if exists "rgh student reads own access" on public.sample_access;
create policy "rgh student reads own access" on public.sample_access for select to authenticated using (lower(email) = lower(coalesce(auth.jwt() ->> 'email','')));

-- students (not signed in) request through this function only; the code is created when staff confirm payment
drop function if exists public.request_sample(uuid, text, integer, text, text);
drop function if exists public.request_sample(uuid, text, integer, text, text, text);
create function public.request_sample(p_sample uuid, p_email text, p_pages integer, p_format text, p_reference text, p_pay text default 'full') returns uuid
language plpgsql security definer set search_path = public as $$
declare s public.samples; rid uuid; maxp integer;
begin
  select * into s from public.samples where id = p_sample and published = true; if not found then raise exception 'Sample not found'; end if;
  if p_email is null or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Enter a valid email'; end if;
  maxp := greatest(1, s.pages - coalesce(s.free_pages,1));
  if p_pages < 1 or p_pages > maxp then raise exception 'Choose between 1 and % pages', maxp; end if;
  insert into public.sample_access(sample_id, email, pages, format, reference, status, amount, user_id, pay_option, due_now)
  values (p_sample, lower(trim(p_email)), p_pages, p_format, left(coalesce(p_reference,''),120), 'requested', p_pages * s.price_per_page, auth.uid(),
          case when p_pay = 'part' then 'part' else 'full' end, case when p_pay = 'part' then round(p_pages * s.price_per_page / 2, 2) else p_pages * s.price_per_page end)
  returning id into rid;
  return rid;
end $$;
grant execute on function public.request_sample(uuid, text, integer, text, text, text) to anon, authenticated;

-- 4. Private storage for sample files (PDFs keep images, figures, tables) -----
insert into storage.buckets (id, name, public) values ('samples', 'samples', false) on conflict (id) do nothing;
drop policy if exists "rgh admin samples files" on storage.objects;
create policy "rgh admin samples files" on storage.objects for all to authenticated
  using (bucket_id = 'samples' and public.my_role() = 'admin') with check (bucket_id = 'samples' and public.my_role() = 'admin');


-- 5. NEW: confirm a sample payment WITHOUT any Edge Function ---------------------
create or replace function public.admin_approve_sample(p_access uuid, p_amount numeric) returns json
language plpgsql security definer set search_path = public as $$
declare a public.sample_access; s public.samples; c text := ''; i int; ch text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; unl int; tot numeric;
begin
  if public.my_role() not in ('admin','staff') then raise exception 'Staff only'; end if;
  select * into a from public.sample_access where id = p_access; if not found then raise exception 'Request not found'; end if;
  if a.status <> 'requested' then raise exception 'This request is already %.', a.status; end if;
  select * into s from public.samples where id = a.sample_id;
  if p_amount is null or p_amount <= 0 then raise exception 'Enter the amount received'; end if;
  for i in 1..8 loop c := c || substr(ch, 1 + floor(random() * length(ch))::int, 1); end loop;
  tot := coalesce(a.amount, a.pages * coalesce(s.price_per_page, 2));
  unl := least(a.pages, greatest(1, floor(p_amount / greatest(coalesce(s.price_per_page, 2), 0.01))::int));
  if p_amount >= tot then unl := a.pages; end if;
  update public.sample_access set status = 'approved', code = c, approved_at = now(), opens_used = 0, download_used = 0, last_session = null, paid_amount = p_amount, unlocked_pages = unl where id = p_access;
  return json_build_object('code', c, 'email', a.email, 'title', s.title, 'unlocked', unl);
end $$;
grant execute on function public.admin_approve_sample(uuid, numeric) to authenticated;

create or replace function public.admin_sample_code(p_access uuid) returns json
language plpgsql security definer set search_path = public as $$
declare a public.sample_access; t text;
begin
  if public.my_role() not in ('admin','staff') then raise exception 'Staff only'; end if;
  select * into a from public.sample_access where id = p_access; if not found then raise exception 'Request not found'; end if;
  if a.status <> 'approved' or a.code is null then raise exception 'Only an approved code can be sent. Confirm payment first.'; end if;
  select title into t from public.samples where id = a.sample_id;
  return json_build_object('code', a.code, 'email', a.email, 'title', t, 'unlocked', coalesce(a.unlocked_pages, a.pages));
end $$;
grant execute on function public.admin_sample_code(uuid) to authenticated;

-- 6. NEW: add staff and reset staff passwords WITHOUT any Edge Function ----------
create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_create_staff(p_username text, p_full_name text, p_password text, p_services text[]) returns uuid
language plpgsql security definer set search_path = public, auth, extensions as $$
declare u text := lower(regexp_replace(coalesce(p_username,''), '[^a-zA-Z0-9]', '', 'g')); em text; uid uuid := gen_random_uuid();
begin
  if public.my_role() <> 'admin' then raise exception 'Admin only'; end if;
  if length(u) < 3 then raise exception 'Username must be at least 3 letters or numbers'; end if;
  if length(coalesce(p_password,'')) < 6 or p_password !~ '[0-9]' then raise exception 'Password must be at least 6 characters and include one number'; end if;
  if p_services is null or cardinality(p_services) = 0 then raise exception 'Choose at least one service'; end if;
  if exists (select 1 from public.staff_profiles where username = u) then raise exception 'That username is already taken'; end if;
  em := 'researchgeniushub+' || u || '@gmail.com';
  if exists (select 1 from auth.users where lower(email) = em) then raise exception 'That username is already taken'; end if;
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em, extensions.crypt(p_password, extensions.gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', uid::text, now(), now(), now());
  insert into public.staff_profiles (user_id, username, full_name, services, active, must_confirm, contact_approved)
  values (uid, u, nullif(trim(p_full_name),''), p_services, true, true, false);
  return uid;
end $$;
grant execute on function public.admin_create_staff(text, text, text, text[]) to authenticated;

create or replace function public.admin_reset_staff_password(p_user uuid, p_password text) returns void
language plpgsql security definer set search_path = public, auth, extensions as $$
begin
  if public.my_role() <> 'admin' then raise exception 'Admin only'; end if;
  if not exists (select 1 from public.staff_profiles where user_id = p_user) then raise exception 'Not a staff account'; end if;
  if length(coalesce(p_password,'')) < 6 or p_password !~ '[0-9]' then raise exception 'Password must be at least 6 characters and include one number'; end if;
  update auth.users set encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')), updated_at = now() where id = p_user;
  update public.staff_profiles set must_confirm = true where user_id = p_user;
end $$;
grant execute on function public.admin_reset_staff_password(uuid, text) to authenticated;

-- 7. Make Supabase notice all of the above straight away -------------------------
notify pgrst, 'reload schema';
