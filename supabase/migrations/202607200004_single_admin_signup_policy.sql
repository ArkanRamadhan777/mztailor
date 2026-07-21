-- The first Auth user is the only automatic admin; later signups are staff.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('admin','staff'));

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name,role)
  values(
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),
    case when not exists(select 1 from public.profiles where role='admin') then 'admin' else 'staff' end
  );
  return new;
end; $$;
