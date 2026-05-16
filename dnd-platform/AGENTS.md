<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

---

# Mandatory Coding Standards

These rules apply to every file added or modified in this repo. They exist because we learned the hard way — follow them exactly.

## API Routes

Every new `route.ts` must:

1. **Validate the request body with Zod** using `parseBody` from `@/lib/validation`:
   ```ts
   import { parseBody } from '@/lib/validation'
   import { z } from 'zod'
   const Schema = z.object({ campaignId: z.string().uuid(), ... })
   const body = await parseBody(req, Schema)
   if (body instanceof NextResponse) return body   // validation failed — already a 422
   ```

2. **Authenticate before doing anything** using `getAuthenticatedUser` from `@/lib/supabaseServer`:
   ```ts
   const user = await getAuthenticatedUser(req)
   if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
   ```

3. **Apply rate limiting** on every route that calls an AI model, using `checkRateLimit` from `@/lib/rateLimiter`. For new AI routes use the Upstash-backed version from `@/lib/upstashRateLimit` when `UPSTASH_REDIS_REST_URL` is set. The AI layer also implements automatic fallback to faster models when rate limits are hit (see **AI & Model Strategy** below).

4. **Never trust `user_id` from the request body** — always derive it from the verified JWT via `getAuthenticatedUser`.

5. **Return consistent error shapes**: `{ error: string }` with an appropriate HTTP status. Never expose raw DB or Prisma error messages to the client.

6. **Never use the service role key on the client side.** `supabaseAdmin` (service role) is for server-only API routes. Never import it from a `'use client'` file.

## React Components

1. **Wrap every component that calls an AI API in `<DMErrorBoundary>`** from `@/components/ui/DMErrorBoundary`. If Claude/Groq goes down, users must see a friendly message, not a crash.

2. **Dark mode only.** Do not add `light:` Tailwind variants or a ThemeProvider. The `<html>` element has `class="dark"` hardcoded — rely on CSS variables.

3. **Amber accent only.** Use `text-amber-highlight`, `border-amber-main`, `bg-amber-main/20` etc. Do not introduce blue, green, or purple as primary accent colors.

4. **Glass panels** for card-like surfaces: use the `.glass` utility class instead of raw `bg-white/10 backdrop-blur` — it keeps card styles consistent.

## Database

1. **Every new table needs RLS enabled** the moment it's created:
   ```sql
   ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
   CREATE POLICY "Users see own rows" ON your_table FOR ALL USING (auth.uid() = user_id);
   ```

2. **Add an index on every foreign key** used in a WHERE clause. Use `CREATE INDEX IF NOT EXISTS idx_<table>_<column> ON <table>(<column>)`.

3. **New migrations go in `supabase/migrations/`** as `NNN_description.sql` (next number in sequence). Never run raw SQL against production without a migration file.

## Security

1. **All secrets come from `process.env`**. Never hardcode a key, URL, or token in source. If a new external service is added, document its env var in `.env.example`.

2. **Input length limits on all string fields**: no user-supplied string should be passed to the DB or an AI model without a max-length check (Zod's `.max()` handles this).

3. **Content Security Policy is set in `next.config.ts`**. If a new external resource (CDN, font, script) is needed, add its origin to the relevant CSP directive — do not use `'unsafe-inline'` or `*`.

## AI & Model Strategy

**Groq Models**: The app uses Groq as the primary AI backend with automatic fallback on rate limits.

1. **Primary model**: `llama-3.3-70b-versatile` (better narrative quality, higher token limit per response)
2. **Fallback model**: `llama-3.1-8b-instant` (10× higher rate limit quota, lower latency)

When a request to the primary model receives a 429 (rate limit) response from Groq's API:
- The request is automatically retried with the fallback model
- If the fallback also fails, the error is returned to the client
- All of this is transparent to the user — they don't see a rate limit error unless both models are exhausted

**Why two models?**
- Free tier Groq limits are strict (~14.4k tokens/min for 70B). Multi-user scenarios hit this quickly.
- The 8B model has much higher rate limits, trades narrative quality for availability.
- Automatic fallback ensures users can play even during demand spikes.

**Do not switch models manually** in API routes — call `callGroq()` which handles fallback automatically. `callGroqFast()` is only for intentionally using the fast model (no fallback).


