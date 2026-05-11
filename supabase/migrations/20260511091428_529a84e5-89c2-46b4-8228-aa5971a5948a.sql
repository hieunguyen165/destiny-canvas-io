
create table public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now(),
  updated_by uuid
);

alter table public.app_settings enable row level security;

-- Anyone (including anon) can read settings (key is public, value is a shared admin-provided API key)
create policy "anyone can read settings" on public.app_settings
  for select to anon, authenticated using (true);

create policy "admins can insert settings" on public.app_settings
  for insert to authenticated with check (public.has_role(auth.uid(), 'admin'));

create policy "admins can update settings" on public.app_settings
  for update to authenticated using (public.has_role(auth.uid(), 'admin'));

create policy "admins can delete settings" on public.app_settings
  for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

-- Enable realtime so all clients sync when admin updates the key
alter publication supabase_realtime add table public.app_settings;
