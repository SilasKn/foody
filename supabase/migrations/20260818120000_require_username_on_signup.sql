-- Make the username a required field: drop the email-local-part fallback and
-- enforce a non-empty username at the column level.

-- 1. Backfill missing/blank usernames so the NOT NULL constraint can be applied.
--    Existing email-prefix usernames are intentionally left untouched.
update public.profiles
set username = 'user_' || substr(user_id::text, 1, 8)
where username is null or trim(username) = '';

-- 2. Require display_name on signup instead of falling back to the email.
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

  insert into public.profiles (user_id, username)
  values (new.id, v_username)
  on conflict (user_id) do update
  set username = excluded.username;

  return new;
end;
$$;

-- 3. Enforce the same rule on the column itself.
alter table public.profiles
alter column username set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_username_not_blank'
      and conrelid = 'public.profiles'::regclass
  ) then
    alter table public.profiles
    add constraint profiles_username_not_blank
    check (length(trim(username)) > 0);
  end if;
end
$$;
