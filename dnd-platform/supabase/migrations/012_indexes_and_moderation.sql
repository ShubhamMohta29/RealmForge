-- 012: Performance indexes + moderation_queue table
-- Run this against your Supabase project via the SQL editor or supabase db push.

-- ── Performance indexes ───────────────────────────────────────────────────────
-- These cover the most common WHERE clauses across the app.

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id
  ON public.campaigns(dm_user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_members_user_id
  ON public.campaign_members(user_id);

CREATE INDEX IF NOT EXISTS idx_campaign_members_campaign_id
  ON public.campaign_members(campaign_id);

CREATE INDEX IF NOT EXISTS idx_characters_campaign_id
  ON public.characters(campaign_id);

CREATE INDEX IF NOT EXISTS idx_characters_user_id
  ON public.characters(user_id);

-- messages already has messages_campaign_created (campaign_id, created_at desc)
-- Add a plain campaign_id index for point lookups without an ORDER BY
CREATE INDEX IF NOT EXISTS idx_messages_campaign_id
  ON public.messages(campaign_id);

CREATE INDEX IF NOT EXISTS idx_world_memory_summaries_campaign_id
  ON public.world_memory_summaries(campaign_id);

CREATE INDEX IF NOT EXISTS idx_npcs_campaign_id
  ON public.npcs(campaign_id);

CREATE INDEX IF NOT EXISTS idx_quests_campaign_id
  ON public.quests(campaign_id);

CREATE INDEX IF NOT EXISTS idx_combat_encounters_campaign_id
  ON public.combat_encounters(campaign_id);


-- ── moderation_queue ──────────────────────────────────────────────────────────
-- Stores user-flagged AI responses for review.

CREATE TABLE IF NOT EXISTS public.moderation_queue (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id    uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  reported_by   uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason        text NOT NULL CHECK (char_length(reason) BETWEEN 1 AND 500),
  status        text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'dismissed')),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.moderation_queue ENABLE ROW LEVEL SECURITY;

-- Users can insert their own flags
CREATE POLICY "Users can flag messages"
  ON public.moderation_queue
  FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Users can see flags they submitted
CREATE POLICY "Users see own flags"
  ON public.moderation_queue
  FOR SELECT
  USING (auth.uid() = reported_by);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_message_id
  ON public.moderation_queue(message_id);

CREATE INDEX IF NOT EXISTS idx_moderation_queue_status
  ON public.moderation_queue(status) WHERE status = 'pending';
