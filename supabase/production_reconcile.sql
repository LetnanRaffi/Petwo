-- Safe to run more than once after a partial schema paste.
-- Use this when the base Petwo tables already exist, but production needs
-- the latest multi-pet and Couple Quiz additions.

create extension if not exists "pgcrypto";

alter table public.profiles add column if not exists display_name text;
alter table public.profiles add column if not exists avatar_type text not null default 'blue';
alter table public.profiles add column if not exists relationship_type text;
alter table public.profiles add column if not exists onboarding_completed boolean not null default false;

alter table public.pets add column if not exists thirst int not null default 80 check (thirst between 0 and 100);
alter table public.pets alter column name set default 'Unnamed Pet';
alter table public.pets drop constraint if exists pets_room_id_key;
drop index if exists public.pets_room_id_key;
create index if not exists pets_room_id_idx on public.pets(room_id);

do $$
begin
  alter table public.eggs add column if not exists pet_id uuid;
  alter table public.eggs add constraint eggs_pet_id_fkey foreign key (pet_id) references public.pets(id) on delete set null not valid;
exception when duplicate_object then null;
end $$;

create table if not exists public.quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms(id) on delete cascade,
  host_id uuid not null references public.profiles(id) on delete cascade,
  player_one_id uuid not null references public.profiles(id) on delete cascade,
  player_two_id uuid references public.profiles(id) on delete set null,
  status text not null default 'lobby' check (status in ('lobby', 'active', 'completed', 'expired')),
  current_question_index int not null default 0 check (current_question_index >= 0),
  question_ids text[] not null,
  started_at timestamptz,
  question_started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null default (now() + interval '5 minutes'),
  reward_claimed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.quiz_sessions add column if not exists host_id uuid references public.profiles(id) on delete cascade;
alter table public.quiz_sessions add column if not exists player_one_id uuid references public.profiles(id) on delete cascade;
alter table public.quiz_sessions add column if not exists player_two_id uuid references public.profiles(id) on delete set null;
alter table public.quiz_sessions add column if not exists current_question_index int not null default 0 check (current_question_index >= 0);
alter table public.quiz_sessions add column if not exists question_ids text[] not null default '{}';
alter table public.quiz_sessions add column if not exists started_at timestamptz;
alter table public.quiz_sessions add column if not exists question_started_at timestamptz;
alter table public.quiz_sessions add column if not exists completed_at timestamptz;
alter table public.quiz_sessions add column if not exists expires_at timestamptz not null default (now() + interval '5 minutes');
alter table public.quiz_sessions add column if not exists reward_claimed boolean not null default false;
alter table public.quiz_sessions add column if not exists updated_at timestamptz not null default now();

create index if not exists quiz_sessions_room_status_idx
on public.quiz_sessions(room_id, status, created_at desc);

create table if not exists public.quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.quiz_sessions(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  question_id text not null,
  selected_index int check (selected_index is null or selected_index between 0 and 3),
  is_correct boolean not null default false,
  score int not null default 0 check (score >= 0),
  response_ms int check (response_ms is null or response_ms >= 0),
  answered_at timestamptz not null default now(),
  unique (session_id, user_id, question_id)
);

alter table public.quiz_answers add column if not exists selected_index int check (selected_index is null or selected_index between 0 and 3);
alter table public.quiz_answers add column if not exists is_correct boolean not null default false;
alter table public.quiz_answers add column if not exists score int not null default 0 check (score >= 0);
alter table public.quiz_answers add column if not exists response_ms int check (response_ms is null or response_ms >= 0);
alter table public.quiz_answers add column if not exists answered_at timestamptz not null default now();

create index if not exists quiz_answers_session_idx on public.quiz_answers(session_id);
create index if not exists quiz_answers_room_idx on public.quiz_answers(room_id);

alter table public.quiz_sessions enable row level security;
alter table public.quiz_answers enable row level security;

drop policy if exists "members can read quiz sessions" on public.quiz_sessions;
create policy "members can read quiz sessions" on public.quiz_sessions
for select to authenticated using (public.is_room_member(room_id));

drop policy if exists "members can write quiz sessions" on public.quiz_sessions;
create policy "members can write quiz sessions" on public.quiz_sessions
for all to authenticated
using (public.is_room_member(room_id))
with check (public.is_room_member(room_id));

drop policy if exists "members can read quiz answers" on public.quiz_answers;
create policy "members can read quiz answers" on public.quiz_answers
for select to authenticated using (public.is_room_member(room_id));

drop policy if exists "players can create own quiz answers" on public.quiz_answers;
create policy "players can create own quiz answers" on public.quiz_answers
for insert to authenticated
with check (
  public.is_room_member(room_id)
  and user_id = auth.uid()
  and exists (
    select 1 from public.quiz_sessions
    where quiz_sessions.id = quiz_answers.session_id
      and quiz_sessions.room_id = quiz_answers.room_id
      and auth.uid() in (quiz_sessions.player_one_id, quiz_sessions.player_two_id)
  )
);

do $$
begin
  alter publication supabase_realtime add table public.quiz_sessions;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.quiz_answers;
exception when duplicate_object then null;
end $$;
