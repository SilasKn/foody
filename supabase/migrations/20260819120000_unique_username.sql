-- Make the username unique, case-insensitively: "Silas" and "silas" are the
-- same name. Uniqueness is enforced by an index; the trigger check exists only
-- to fail early with a clearer message.

-- 1. Deduplicate existing rows so the unique index can be created. The oldest
--    row (lowest user_id) for each name keeps it; the rest get a short suffix.
with ranked as (
  select user_id,
         username,
         row_number() over (
           partition by lower(trim(username))
           order by user_id
         ) as rn
  from public.profiles
)
update public.profiles p
set username = p.username || '_' || substr(p.user_id::text, 1, 4)
from ranked r
where p.user_id = r.user_id
  and r.rn > 1;

-- 2. The actual guarantee. lower(trim(...)) matches what the trigger and the
--    availability RPC below compare on, so all three agree on what "same" means.
create unique index if not exists profiles_username_unique_ci
  on public.profiles (lower(trim(username)));

-- 3. Reject duplicate usernames on signup, alongside the existing empty check.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
begin
  v_username := nullif(trim(new.raw_user_meta_data ->> 'display_name'), '');

  if v_username is null then
    raise exception 'username is required for signup'
      using errcode = '23514';
  end if;

  if exists (
    select 1 from public.profiles
    where lower(trim(username)) = lower(v_username)
      and user_id <> new.id
  ) then
    raise exception 'username % is already taken', v_username
      using errcode = '23505';
  end if;

  insert into public.profiles (user_id, username)
  values (new.id, v_username)
  on conflict (user_id) do update
  set username = excluded.username;

  return new;
end;
$$;

-- 4. Let the signup form ask whether a username is free before submitting.
--    GoTrue swallows the trigger's error message (it returns a generic 500), so
--    the client cannot learn the reason from a failed signup and has to ask
--    separately. security definer because the form has no session and RLS would
--    block an anonymous read of profiles; it returns a bare boolean, never rows.
create or replace function public.is_username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select nullif(trim(p_username), '') is not null
     and not exists (
       select 1 from public.profiles
       where lower(trim(username)) = lower(trim(p_username))
     );
$$;

revoke execute on function public.is_username_available(text) from public;
grant execute on function public.is_username_available(text) to anon, authenticated;
