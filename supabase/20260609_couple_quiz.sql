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

create index if not exists quiz_answers_session_idx
on public.quiz_answers(session_id);

create index if not exists quiz_answers_room_idx
on public.quiz_answers(room_id);

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
