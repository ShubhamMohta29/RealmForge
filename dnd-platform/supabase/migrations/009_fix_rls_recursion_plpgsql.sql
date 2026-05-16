-- Final fix for RLS infinite recursion (42P17)
-- Re-defining the helper function as PL/pgSQL to prevent inlining and recursion.

-- 1. Redefine the membership check function
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

-- 2. Clean up and re-apply policies for campaign_members
-- This table is the base of all other RLS checks, so it must be clean.
drop policy if exists "Members can view campaign members" on public.campaign_members;
drop policy if exists "Users can join campaigns" on public.campaign_members;

create policy "Users can view their own membership"
  on public.campaign_members for select
  using (auth.uid() = user_id);

create policy "Users can join campaigns"
  on public.campaign_members for insert
  with check (auth.uid() = user_id);

-- 3. Re-apply policies for campaigns
drop policy if exists "Players can view their campaigns" on public.campaigns;
drop policy if exists "Members can update campaign" on public.campaigns;
drop policy if exists "Users can create campaigns" on public.campaigns;
drop policy if exists "DM can update their campaign" on public.campaigns;

create policy "Players can view their campaigns"
  on public.campaigns for select
  using (is_campaign_member(id));

create policy "Members can update campaign"
  on public.campaigns for update
  using (is_campaign_member(id));

create policy "Users can create campaigns"
  on public.campaigns for insert
  with check (auth.uid() is not null);

-- 4. Re-apply policies for other tables to ensure they use the new function
drop policy if exists "Players can view characters in their campaign" on public.characters;
create policy "Players can view characters in their campaign"
  on public.characters for select
  using (is_campaign_member(campaign_id));

drop policy if exists "Members can view campaign messages" on public.messages;
create policy "Members can view campaign messages"
  on public.messages for select
  using (is_campaign_member(campaign_id));

drop policy if exists "Members can insert messages" on public.messages;
create policy "Members can insert messages"
  on public.messages for insert
  with check (is_campaign_member(campaign_id));

drop policy if exists "Members can view combat" on public.combat_encounters;
create policy "Members can view combat"
  on public.combat_encounters for select
  using (is_campaign_member(campaign_id));

drop policy if exists "Members can view NPCs" on public.npcs;
create policy "Members can view NPCs"
  on public.npcs for select
  using (is_campaign_member(campaign_id));

drop policy if exists "Members can view quests" on public.quests;
create policy "Members can view quests"
  on public.quests for select
  using (is_campaign_member(campaign_id));

drop policy if exists "Members can view summaries" on public.world_memory_summaries;
create policy "Members can view summaries"
  on public.world_memory_summaries for select
  using (is_campaign_member(campaign_id));
