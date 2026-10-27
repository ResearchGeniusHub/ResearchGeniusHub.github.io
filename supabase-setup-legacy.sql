-- Research Genius Hub: sample document database

create table if not exists public.rgh_samples (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  subject text not null,
  level text not null,
  referencing_style text not null default 'Harvard',
  page_count integer not null check (page_count > 0),
  price_per_page numeric(10,2) not null default 2.00,
  free_intro text not null default '',
  full_file_path text not null,
  full_file_name text not null,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.rgh_samples enable row level security;

-- Visitors can view published sample details only.
create policy "Visitors read published samples"
on public.rgh_samples
for select
to anon, authenticated
using (published = true);

-- Only an admin can add sample records.
create policy "Admins insert sample records"
on public.rgh_samples
for insert
to authenticated
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Only an admin can update sample records.
create policy "Admins update sample records"
on public.rgh_samples
for update
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Only an admin can delete sample records.
create policy "Admins delete sample records"
on public.rgh_samples
for delete
to authenticated
using (
  (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Create a private storage bucket for documents.
insert into storage.buckets (id, name, public)
values ('rgh-private-samples', 'rgh-private-samples', false)
on conflict (id) do nothing;

-- Admins can upload, view, update and delete files in this bucket.
create policy "Admins upload sample files"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'rgh-private-samples'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admins view sample files"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'rgh-private-samples'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admins update sample files"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'rgh-private-samples'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
)
with check (
  bucket_id = 'rgh-private-samples'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

create policy "Admins delete sample files"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'rgh-private-samples'
  and (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);
