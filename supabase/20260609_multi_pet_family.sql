alter table public.pets
drop constraint if exists pets_room_id_key;

drop index if exists public.pets_room_id_key;

create index if not exists pets_room_id_idx
on public.pets(room_id);
