# RealmForge — AI-Powered D&D 5e

Play Dungeons & Dragons 5th Edition online with an AI Dungeon Master. No prep, no scheduling around a human DM required. Pick up and play a full campaign with friends tonight.

---

## Features

- **AI Dungeon Master** — Groq Llama 3.3 70B narrates the story, enforces 5e rules, and reacts to anything you do.
- **Human DM mode** — Run the game yourself with an AI copilot suggesting narration in real time.
- **Full D&D 5e** — All 12 core classes, 8 races, combat with initiative and attack rolls, spell slots, XP and leveling.
- **Real-time multiplayer** — All players see every action, dice roll, and story update the moment it happens.
- **Persistent campaigns** — NPCs, quests, world state, and characters are saved across sessions.

---

## Stack

Next.js 16 · React 19 · TypeScript · Tailwind CSS · Supabase (Postgres + Auth + Realtime) · Groq · Anthropic · Vercel

---

## Local setup

```bash
cd dnd-platform
npm install
cp .env.example .env.local   # fill in your keys
npm run dev
```

### Environment variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GROQ_API_KEY=
ANTHROPIC_API_KEY=
```

---

## License

MIT
