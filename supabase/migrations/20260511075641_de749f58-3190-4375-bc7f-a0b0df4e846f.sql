
-- Roles
create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "users can view own roles" on public.user_roles
  for select to authenticated using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "view own profile or admin" on public.profiles
  for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(),'admin'));
create policy "update own profile" on public.profiles
  for update to authenticated using (auth.uid() = id);
create policy "insert own profile" on public.profiles
  for insert to authenticated with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  -- Auto-grant admin to predefined email
  if lower(new.email) = 'xuanhieufi@gmail.com' then
    insert into public.user_roles(user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles(user_id, role) values (new.id, 'user') on conflict do nothing;
  end if;
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger profiles_touch before update on public.profiles
for each row execute function public.touch_updated_at();

-- La so history
create table public.la_so_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  ho_ten text not null,
  input jsonb not null,
  result jsonb not null,
  created_at timestamptz not null default now()
);
alter table public.la_so_history enable row level security;

create policy "view own history or admin" on public.la_so_history
  for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));
create policy "insert own history" on public.la_so_history
  for insert to authenticated with check (auth.uid() = user_id);
create policy "delete own history or admin" on public.la_so_history
  for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(),'admin'));

create index la_so_history_user_idx on public.la_so_history(user_id, created_at desc);
