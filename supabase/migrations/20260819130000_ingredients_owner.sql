-- Give every ingredient an owner. Until now public.ingredients was one global,
-- ownerless catalogue: the app read it unfiltered and reused whatever anyone had
-- typed. Two problems follow from that (launch checklist A-6): free-text names
-- outlive the account that entered them (Art. 17 DSGVO), and every name is
-- user-generated content shown to other users (App Store Guideline 1.2).
--
-- The fix is isolation, not just attribution: one row per (owner, name). That is
-- also what makes the cascade below safe - a shared row cannot be deleted with
-- its author while other people's recipes still point at it.

-- 1. The column itself. It already exists (added via the dashboard); this makes
--    the repo the source of truth for it. The delete rule is verified rather
--    than assumed: with a shared catalogue a wrong rule here breaks account
--    deletion for everyone else, so it is worth checking instead of trusting.
alter table public.ingredients
  add column if not exists created_by uuid references auth.users (id) on delete cascade;

do $$
declare
  v_conname text;
  v_deltype "char";
begin
  select c.conname, c.confdeltype
    into v_conname, v_deltype
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
  where c.conrelid = 'public.ingredients'::regclass
    and c.contype = 'f'
    and a.attname = 'created_by'
  limit 1;

  if v_conname is null then
    alter table public.ingredients
      add constraint ingredients_created_by_fkey
      foreign key (created_by) references auth.users (id) on delete cascade;
  elsif v_deltype <> 'c' then
    execute format('alter table public.ingredients drop constraint %I', v_conname);
    alter table public.ingredients
      add constraint ingredients_created_by_fkey
      foreign key (created_by) references auth.users (id) on delete cascade;
  end if;
end $$;

-- 2. Split the shared rows: every author that uses a name gets their own copy.
--    distinct on collapses "Tomato"/"tomato" to a single row per author, matching
--    the case-insensitive comparison the client already does in JS.
insert into public.ingredients (name, created_by)
select distinct on (r.author, lower(trim(i.name))) i.name, r.author
from public.recipe_ingredients ri
join public.recipes r on r.id = ri.recipe_id
join public.ingredients i on i.id = ri.ingredient_id
where r.author is not null
  and not exists (
    select 1 from public.ingredients i2
    where i2.created_by = r.author
      and lower(trim(i2.name)) = lower(trim(i.name))
  );

-- 3. Point every recipe at the copy its own author owns. This has to happen
--    before RLS goes on in step 6, otherwise the reads below it would resolve to
--    rows the reader can no longer see and ingredient names would render empty.
update public.recipe_ingredients ri
set ingredient_id = owned.id
from public.recipes r,
     public.ingredients old,
     public.ingredients owned
where r.id = ri.recipe_id
  and old.id = ri.ingredient_id
  and owned.created_by = r.author
  and lower(trim(owned.name)) = lower(trim(old.name))
  and ri.ingredient_id <> owned.id;

-- 4. What is left without an owner is the old shared catalogue, now unreferenced.
delete from public.ingredients where created_by is null;

-- 5. Collapse any same-owner duplicates before the unique index can be created.
--    Rows written between the dashboard change and this migration may already
--    carry an owner, so step 2 is not guaranteed to have been the only writer.
with ranked as (
  select id,
         min(id) over (partition by created_by, lower(trim(name))) as keep_id
  from public.ingredients
)
update public.recipe_ingredients ri
set ingredient_id = ranked.keep_id
from ranked
where ri.ingredient_id = ranked.id
  and ranked.id <> ranked.keep_id;

delete from public.ingredients i
using (
  select id,
         min(id) over (partition by created_by, lower(trim(name))) as keep_id
  from public.ingredients
) d
where i.id = d.id
  and d.id <> d.keep_id;

-- 6. Lock the shape in. Same lower(trim(...)) expression as the client's
--    normalizeIngredientName, so both agree on what "the same ingredient" means.
alter table public.ingredients
  alter column created_by set not null;

create unique index if not exists ingredients_owner_name_unique_ci
  on public.ingredients (created_by, lower(trim(name)));

-- 7. The actual guarantee behind A-6: nobody reads anyone else's free text.
--    No update/delete policy - the app does neither, so both stay denied.
alter table public.ingredients enable row level security;

drop policy if exists ingredients_select_own on public.ingredients;
create policy ingredients_select_own on public.ingredients
  for select to authenticated
  using (auth.uid() = created_by);

drop policy if exists ingredients_insert_own on public.ingredients;
create policy ingredients_insert_own on public.ingredients
  for insert to authenticated
  with check (auth.uid() = created_by);

-- 8. Deleting an account now fires two cascades off the same auth.users row: one
--    through recipes, one through ingredients. If recipe_ingredients does not
--    cascade from ingredients too, the second one can fail on a still-referenced
--    row and take the whole account deletion down with it.
do $$
declare
  v_conname text;
  v_deltype "char";
begin
  select c.conname, c.confdeltype
    into v_conname, v_deltype
  from pg_constraint c
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any (c.conkey)
  where c.conrelid = 'public.recipe_ingredients'::regclass
    and c.contype = 'f'
    and a.attname = 'ingredient_id'
  limit 1;

  if v_conname is not null and v_deltype <> 'c' then
    execute format('alter table public.recipe_ingredients drop constraint %I', v_conname);
    alter table public.recipe_ingredients
      add constraint recipe_ingredients_ingredient_id_fkey
      foreign key (ingredient_id) references public.ingredients (id) on delete cascade;
  end if;
end $$;
