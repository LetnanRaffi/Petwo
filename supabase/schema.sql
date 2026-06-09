-- Petwo MVP schema for Supabase.
-- Prototype policies favor velocity. TODO: tighten RLS before public launch.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  display_name text,
  avatar_url text,
  avatar_type text not null default 'blue',
  email text,
  relationship_type text,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_type text not null default 'blue';
alter table public.profiles add column if not exists relationship_type text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(),
  invite_code text not null unique,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  partner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  constraint room_partner_not_owner check (partner_id is null or partner_id <> owner_id)
);

create table if not exists public.room_members (
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (room_id, user_id)
);

create unique index if not exists room_members_one_room_per_user on public.room_members(user_id);

create table if not exists public.eggs (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  egg_type text not null default 'mystery_common',
  status text not null default 'hatching' check (status in ('unhatched', 'hatching', 'hatched')),
  hatch_progress int not null default 0 check (hatch_progress between 0 and 100),
  hatch_started_at timestamptz,
  hatch_ready_at timestamptz,
  hatched_at timestamptz,
  pet_id uuid,
  created_at timestamptz not null default now()
);

create table if not exists public.pets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  name text not null default 'Unnamed Pet',
  pet_type text not null default 'cat',
  hunger int not null default 80 check (hunger between 0 and 100),
  thirst int not null default 80 check (thirst between 0 and 100),
  cleanliness int not null default 80 check (cleanliness between 0 and 100),
  energy int not null default 80 check (energy between 0 and 100),
  happiness int not null default 80 check (happiness between 0 and 100),
  level int not null default 1 check (level >= 1),
  xp int not null default 0 check (xp between 0 and 100),
  updated_at timestamptz not null default now()
);

alter table public.pets add column if not exists thirst int not null default 80 check (thirst between 0 and 100);
alter table public.pets drop constraint if exists pets_room_id_key;
drop index if exists public.pets_room_id_key;
create index if not exists pets_room_id_idx on public.pets(room_id);
do $$
begin
  alter table public.eggs add constraint eggs_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete set null not valid;
exception when duplicate_object then null;
end $$;

create table if not exists public.room_wallets (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null unique references public.rooms(id) on delete cascade,
  coins int not null default 0 check (coins >= 0),
  total_earned int not null default 0 check (total_earned >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.pet_activities (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.moods (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  mood text not null,
  mood_date date not null default current_date,
  created_at timestamptz not null default now(),
  unique (room_id, user_id, mood_date)
);

create table if not exists public.journals (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) <= 2000),
  created_at timestamptz not null default now()
);

create table if not exists public.missions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  assigned_to uuid references public.profiles(id) on delete set null,
  task_type text not null,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  date date not null default current_date,
  completed_at timestamptz,
  reward_coins int not null default 0,
  reward_hatch_progress int not null default 0,
  reward_xp int not null default 0,
  created_at timestamptz not null default now(),
  unique (room_id, assigned_to, task_type, date)
);

create table if not exists public.game_events (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  actor_id uuid references public.profiles(id) on delete set null,
  game_type text not null,
  result text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.rooms enable row level security;
alter table public.room_members enable row level security;
alter table public.eggs enable row level security;
alter table public.pets enable row level security;
alter table public.room_wallets enable row level security;
alter table public.pet_activities enable row level security;
alter table public.moods enable row level security;
alter table public.journals enable row level security;
alter table public.missions enable row level security;
alter table public.game_events enable row level security;

create or replace function public.is_room_member(target_room_id uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_members
    where room_id = target_room_id and user_id = auth.uid()
  );
$$;

create or replace function public.increment_room_wallet(target_room_id uuid, amount int)
returns public.room_wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_wallet public.room_wallets;
begin
  if amount <= 0 then
    raise exception 'amount must be positive';
  end if;

  if not public.is_room_member(target_room_id) then
    raise exception 'not a room member';
  end if;

  insert into public.room_wallets (room_id, coins, total_earned)
  values (target_room_id, amount, amount)
  on conflict (room_id) do update
    set coins = public.room_wallets.coins + excluded.coins,
        total_earned = public.room_wallets.total_earned + excluded.total_earned,
        updated_at = now()
  returning * into updated_wallet;

  return updated_wallet;
end;
$$;

drop policy if exists "profiles are readable by authenticated users" on public.profiles;
create policy "profiles are readable by authenticated users" on public.profiles
for select to authenticated using (true);

drop policy if exists "users can upsert own profile" on public.profiles;
create policy "users can upsert own profile" on public.profiles
for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "members can read their rooms" on public.rooms;
create policy "members can read their rooms" on public.rooms
for select to authenticated
using (owner_id = auth.uid() or partner_id = auth.uid() or public.is_room_member(id) or partner_id is null);

drop policy if exists "users can create owned rooms" on public.rooms;
create policy "users can create owned rooms" on public.rooms
for insert to authenticated with check (owner_id = auth.uid());

drop policy if exists "users can join available rooms" on public.rooms;
create policy "users can join available rooms" on public.rooms
for update to authenticated
using (partner_id is null and owner_id <> auth.uid())
with check (partner_id = auth.uid());

drop policy if exists "members can read room members" on public.room_members;
create policy "members can read room members" on public.room_members
for select to authenticated using (public.is_room_member(room_id) or user_id = auth.uid());

drop policy if exists "users can add themselves as members" on public.room_members;
create policy "users can add themselves as members" on public.room_members
for insert to authenticated
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.rooms
    where rooms.id = room_members.room_id
      and (rooms.owner_id = auth.uid() or rooms.partner_id = auth.uid())
  )
);

drop policy if exists "members can read eggs" on public.eggs;
create policy "members can read eggs" on public.eggs for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can write eggs" on public.eggs;
create policy "members can write eggs" on public.eggs for all to authenticated using (public.is_room_member(room_id)) with check (public.is_room_member(room_id));

drop policy if exists "members can read pets" on public.pets;
create policy "members can read pets" on public.pets for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can write pets" on public.pets;
create policy "members can write pets" on public.pets for all to authenticated using (public.is_room_member(room_id)) with check (public.is_room_member(room_id));

drop policy if exists "members can read wallets" on public.room_wallets;
create policy "members can read wallets" on public.room_wallets for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can write wallets" on public.room_wallets;
create policy "members can write wallets" on public.room_wallets for all to authenticated using (public.is_room_member(room_id)) with check (public.is_room_member(room_id));

drop policy if exists "members can read activities" on public.pet_activities;
create policy "members can read activities" on public.pet_activities for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can create activities" on public.pet_activities;
create policy "members can create activities" on public.pet_activities for insert to authenticated with check (public.is_room_member(room_id));

drop policy if exists "members can read moods" on public.moods;
create policy "members can read moods" on public.moods for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can upsert own mood" on public.moods;
create policy "members can upsert own mood" on public.moods for all to authenticated using (public.is_room_member(room_id) and user_id = auth.uid()) with check (public.is_room_member(room_id) and user_id = auth.uid());

drop policy if exists "members can read journals" on public.journals;
create policy "members can read journals" on public.journals for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can create own journals" on public.journals;
create policy "members can create own journals" on public.journals for insert to authenticated with check (public.is_room_member(room_id) and author_id = auth.uid());

drop policy if exists "members can read missions" on public.missions;
create policy "members can read missions" on public.missions for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can write missions" on public.missions;
create policy "members can write missions" on public.missions for all to authenticated using (public.is_room_member(room_id)) with check (public.is_room_member(room_id));

drop policy if exists "members can read game events" on public.game_events;
create policy "members can read game events" on public.game_events for select to authenticated using (public.is_room_member(room_id));
drop policy if exists "members can create game events" on public.game_events;
create policy "members can create game events" on public.game_events for insert to authenticated with check (public.is_room_member(room_id));

do $$
begin
  alter publication supabase_realtime add table public.eggs;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.pets;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.room_wallets;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.pet_activities;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.moods;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.journals;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.missions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.game_events;
exception when duplicate_object then null;
end $$;
