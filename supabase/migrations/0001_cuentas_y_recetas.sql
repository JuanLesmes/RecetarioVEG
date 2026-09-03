-- Recetario VEG · esquema para cuentas, sincronización y recetas de la comunidad.
-- Ejecuta este archivo en el SQL Editor de tu proyecto de Supabase (o con `supabase db push`).

-- ---------------------------------------------------------------------------
-- Perfiles públicos (uno por usuario, creado automáticamente al registrarse)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: lectura pública" on public.profiles;
create policy "profiles: lectura pública" on public.profiles
  for select using (true);

drop policy if exists "profiles: el dueño edita" on public.profiles;
create policy "profiles: el dueño edita" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "profiles: el dueño inserta" on public.profiles;
create policy "profiles: el dueño inserta" on public.profiles
  for insert with check (auth.uid() = id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Estado personal sincronizado: favoritos, despensa, lista de mercado y plan
-- ---------------------------------------------------------------------------
create table if not exists public.user_state (
  user_id uuid primary key references auth.users (id) on delete cascade,
  favorites jsonb not null default '[]'::jsonb,
  pantry jsonb not null default '[]'::jsonb,
  shopping jsonb not null default '[]'::jsonb,
  plan jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint user_state_size check (pg_column_size(shopping) < 200000 and pg_column_size(favorites) < 50000)
);

alter table public.user_state enable row level security;

drop policy if exists "user_state: solo el dueño" on public.user_state;
create policy "user_state: solo el dueño" on public.user_state
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Recetas creadas por usuarios (privadas o publicadas a la comunidad)
-- ---------------------------------------------------------------------------
create table if not exists public.user_recipes (
  id text primary key,
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  status text not null default 'privada' check (status in ('privada', 'publicada')),
  data jsonb not null,
  author_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint user_recipes_size check (pg_column_size(data) < 60000),
  constraint user_recipes_id_format check (id ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create index if not exists user_recipes_published_idx on public.user_recipes (status, updated_at desc);
create index if not exists user_recipes_owner_idx on public.user_recipes (user_id, updated_at desc);

alter table public.user_recipes enable row level security;

drop policy if exists "user_recipes: publicadas o propias" on public.user_recipes;
create policy "user_recipes: publicadas o propias" on public.user_recipes
  for select using (status = 'publicada' or auth.uid() = user_id);

drop policy if exists "user_recipes: el dueño inserta" on public.user_recipes;
create policy "user_recipes: el dueño inserta" on public.user_recipes
  for insert with check (auth.uid() = user_id);

drop policy if exists "user_recipes: el dueño edita" on public.user_recipes;
create policy "user_recipes: el dueño edita" on public.user_recipes
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user_recipes: el dueño borra" on public.user_recipes;
create policy "user_recipes: el dueño borra" on public.user_recipes
  for delete using (auth.uid() = user_id);

-- Mantiene updated_at al día en cada cambio.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists user_recipes_touch on public.user_recipes;
create trigger user_recipes_touch
  before update on public.user_recipes
  for each row execute procedure public.touch_updated_at();

drop trigger if exists user_state_touch on public.user_state;
create trigger user_state_touch
  before update on public.user_state
  for each row execute procedure public.touch_updated_at();
