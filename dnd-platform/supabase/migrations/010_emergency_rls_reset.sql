-- Emergency RLS reset — run this in Supabase SQL editor if you see 500s on
-- campaign_members or campaigns. Drops all policies on all game tables and
-- recreates them from a clean, known-good state.

-- ── 1. Drop every policy on all affected tables ───────────────────────────
do $$
declare r record;
begin
  for r in
    select schemaname, tablename, policyname
    from pg_policies
    where schemaname = 'public'
      and tablename in (
        'campaign_members', 'campaigns', 'characters', 'messages',
        'combat_encounters', 'npcs', 'quests', 'world_memory_summaries'
      )
  loop
    execute format('drop policy if exists %I on %I.%I',
                   r.policyname, r.schemaname, r.tablename);
  end loop;
end $$;

-- ── 2. Recreate is_campaign_member (security definer bypasses RLS loop) ───
create or replace function public.is_campaign_member(p_campaign_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  return exists (
    select 1
    from public.campaign_members
    where campaign_id = p_campaign_id
      and user_id = auth.uid()
  );
end;
$$;

-- ── 3. campaign_members — simple equality only, NO function calls ─────────
create policy "Users can view their own membership"
  on public.campaign_members for select
  using (auth.uid() = user_id);

create policy "Users can join campaigns"
  on public.campaign_members for insert
  with check (auth.uid() = user_id);

-- ── 4. campaigns ──────────────────────────────────────────────────────────
create policy "Players can view their campaigns"
  on public.campaigns for select
  using (is_campaign_member(id));

create policy "Members can update campaign"
  on public.campaigns for update
  using (is_campaign_member(id));

create policy "Users can create campaigns"
  on public.campaigns for insert
  with check (auth.uid() is not null);

-- ── 5. characters ─────────────────────────────────────────────────────────
create policy "Players can view characters in their campaign"
  on public.characters for select
  using (is_campaign_member(campaign_id));

create policy "Players can update their own character"
  on public.characters for update
  using (auth.uid() = user_id);

create policy "Players can insert their own character"
  on public.characters for insert
  with check (auth.uid() = user_id);

-- ── 6. messages ───────────────────────────────────────────────────────────
create policy "Members can view campaign messages"
  on public.messages for select
  using (is_campaign_member(campaign_id));

create policy "Members can insert messages"
  on public.messages for insert
  with check (is_campaign_member(campaign_id));

-- ── 7. combat_encounters ──────────────────────────────────────────────────
create policy "Members can view combat"
  on public.combat_encounters for select
  using (is_campaign_member(campaign_id));

create policy "Members can insert combat"
  on public.combat_encounters for insert
  with check (is_campaign_member(campaign_id));

create policy "Members can update combat"
  on public.combat_encounters for update
  using (is_campaign_member(campaign_id));

-- ── 8. npcs ───────────────────────────────────────────────────────────────
create policy "Members can view NPCs"
  on public.npcs for select
  using (is_campaign_member(campaign_id));

create policy "Members can insert npcs"
  on public.npcs for insert
  with check (is_campaign_member(campaign_id));

-- ── 9. quests ─────────────────────────────────────────────────────────────
create policy "Members can view quests"
  on public.quests for select
  using (is_campaign_member(campaign_id));

create policy "Members can insert quests"
  on public.quests for insert
  with check (is_campaign_member(campaign_id));

-- ── 10. world_memory_summaries ────────────────────────────────────────────
create policy "Members can view summaries"
  on public.world_memory_summaries for select
  using (is_campaign_member(campaign_id));
