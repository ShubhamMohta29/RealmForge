# Code Review Issues — PRs #2 and #3

> ShubhamMohta29/AgenticDungeonMaster  
> Reviewed: 2026-05-10  
> Issues with confidence score ≥ 80 were posted as PR comments. All others listed here for reference.

---

## PR #2 — "fixed the game screen so that the story log and sidebar is being shown"

| # | Score | Issue | File(s) |
|---|-------|-------|---------|
| A | 75 | **Race condition: duplicate/lost messages.** `loadData()` and the realtime subscription `SUBSCRIBED` callback both call `setMessages()`. Messages received via `addMessage` between the two calls can be overwritten when `SUBSCRIBED` fires. | `app/(game)/campaign/[id]/play/page.tsx` lines 31–113 |
| B | 0 | ~~Nested scroll bug: StoryLog inside a double overflow-y-auto parent.~~ False positive — the flex layout is correct. | `app/(game)/campaign/[id]/play/page.tsx`, `components/game/StoryLog.tsx` |
| C | 75 | **Privilege escalation in migration 009.** Drops "DM can update their campaign" and replaces with "Members can update campaign" using `is_campaign_member()`, allowing any campaign member to update campaign-level data (name, setting, dm_mode). | `supabase/migrations/009_fix_rls_recursion_plpgsql.sql` line 44–46 |
| D | 75 | **Message ordering inconsistency.** `play/page.tsx` fetches `ascending: false` then reverses; `dm-console/page.tsx` fetches `ascending: true` without reversing. Both write to the same Zustand store — the last page to load sets the order for both. | `app/(game)/campaign/[id]/play/page.tsx` line 45, `app/(game)/campaign/[id]/dm-console/page.tsx` line 44 |
| E | 50 | Migration 009 incomplete: claims to "re-apply policies for other tables to ensure they use the new function" but does not drop/recreate INSERT/UPDATE policies for `combat_encounters`, `npcs`, and `quests` from migrations 007/008. | `supabase/migrations/009_fix_rls_recursion_plpgsql.sql` |
| F | 0 | ~~use_item reads stale name after mutation.~~ False positive — name field is unchanged by `applyHealing`. | `app/api/combat/action/route.ts` |
| **G** | **100** | **`stable` volatility marker dropped from `is_campaign_member`.** Migration 008 declared it `stable`; migration 009 rewrites it as `language plpgsql` without `stable`, defaulting to `volatile`. PostgreSQL re-evaluates it per row instead of per statement, degrading RLS performance. **Posted to PR.** | `supabase/migrations/009_fix_rls_recursion_plpgsql.sql` lines 5–19 |

---

## PR #3 — "added a bunch of features to make the UX better"

| # | Score | Issue | File(s) |
|---|-------|-------|---------|
| **H** | **100** | **`lib/middleware.ts` exports deprecated `middleware` function name.** Next.js 16 requires a `proxy` export from `proxy.ts`. Root `middleware.ts` was correctly deleted and `proxy.ts` added, but `lib/middleware.ts` was modified without being deleted or renamed. It is dead code (not imported anywhere) but violates the AGENTS.md rule to heed deprecation notices. **Posted to PR.** | `lib/middleware.ts` line 5 |
| I | 75 | **Double message load race** (same as PR #2 issue A, still present). `loadData()` and the realtime `SUBSCRIBED` callback both call `setMessages()`, risking overwriting live messages. | `app/(game)/campaign/[id]/play/page.tsx` lines 31–113 |
| J | 50 | `XPBar` always renders "Level {level+1}" as the target label. A level 20 character sees "Level 21" (invalid in D&D 5e). Visual only, affects max-level characters. | `components/ui/XPBar.tsx` lines 15–16 |
| K | 75 | **`condition_add` crashes on null `conditions` column.** `target.conditions.includes()` is called without a null guard, but `condition_remove` uses `(target.conditions \|\| [])`. If `conditions` is null in the DB (e.g., fresh character), throws `TypeError`. | `lib/gameEventApplier.ts` line 93 |
| L | 50 | Dice roll results are not fed back to the AI. When the AI response contains `<roll_request/>` tags, rolls are resolved and saved, but a second AI call is never made with the outcomes. The narration doesn't reflect success or failure. | `app/api/dm/route.ts` lines 96–119 |
| M | 75 | **`narrationDraft` state is set but never consumed.** `setNarrationDraft` is passed to `AICopilot` as `onInsert`, but `narrationDraft` is never passed to `DMNarrationInput`. The AI copilot "Insert" feature silently does nothing. | `app/(game)/campaign/[id]/dm-console/page.tsx` lines 24, 183 |
| N | 0 | ~~Root `middleware.ts` deleted = auth broken.~~ False positive — `proxy.ts` was correctly added with a `proxy` export. | `proxy.ts`, `middleware.ts` |
| O | 50 | `XP_THRESHOLDS` defined separately in `gameEventApplier.ts` and `XPBar.tsx` instead of importing from `lib/dnd5e/leveling.ts`. Future edits to the canonical file won't update the copies. | `lib/gameEventApplier.ts` lines 3–15, `components/ui/XPBar.tsx` lines 3–6 |
| P | 75 | **`ThemeToggle` shows wrong icon when OS theme is dark.** Checks `theme === 'dark'` but `next-themes` returns `"system"` (not `"dark"`) when following the OS default. Should use `resolvedTheme` from `useTheme()`. | `components/ui/ThemeToggle.tsx` line 19 |
| Q | 75 | Player `player_action` message is inserted to the DB before the narration. Players see their action flash in the log with no DM response before narration arrives via realtime. | `app/api/dm/route.ts` lines 122–139 |
| R | 0 | ~~`DiceRollModal.tsx` broken by removed store fields.~~ False positive — the component was deleted as part of the PR and is no longer imported. | `components/game/DiceRollModal.tsx` |
| S | 75 | **Short rest incorrectly restores full HP.** The `rest` event handler sets `target.hp = target.max_hp` for both short and long rests. D&D 5e: short rest does not restore HP (only spending hit dice). | `lib/gameEventApplier.ts` lines 142–156 |
| T | 0 | ~~Two `getProficiencyBonus` implementations.~~ False positive — `Math.floor((level-1)/4)+2` and `Math.ceil(level/4)+1` are mathematically equivalent at all levels 1–20. | `lib/gameEventApplier.ts` line 18, `lib/dnd5e/abilities.ts` line 8 |

---

## Summary

| PR | Total flagged | Score ≥ 80 (posted) | Score 50–79 (not posted) | False positives (score < 25) |
|----|--------------|---------------------|--------------------------|------------------------------|
| #2 | 7 | 1 (G) | 3 (A, C, D) | 3 (B, E, F) |
| #3 | 13 | 1 (H) | 8 (I, J, K, L, M, O, P, Q, S) | 4 (N, R, T) + E=50 |
