select
  to_regclass('public.profiles') as profiles,
  to_regclass('public.rooms') as rooms,
  to_regclass('public.room_members') as room_members,
  to_regclass('public.eggs') as eggs,
  to_regclass('public.pets') as pets,
  to_regclass('public.room_wallets') as room_wallets,
  to_regclass('public.missions') as missions,
  to_regclass('public.game_events') as game_events,
  to_regclass('public.quiz_sessions') as quiz_sessions,
  to_regclass('public.quiz_answers') as quiz_answers;

select tablename
from pg_publication_tables
where pubname = 'supabase_realtime'
  and schemaname = 'public'
  and tablename in (
    'eggs',
    'pets',
    'room_wallets',
    'pet_activities',
    'moods',
    'journals',
    'missions',
    'game_events',
    'quiz_sessions',
    'quiz_answers'
  )
order by tablename;
