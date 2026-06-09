alter table public.pets
alter column name set default 'Unnamed Pet';

update public.pets
set name = 'Unnamed Pet'
where lower(name) = 'moci';
