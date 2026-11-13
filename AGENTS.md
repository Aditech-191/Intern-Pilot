# AGENTS.md

## Project
- **App:** InternPilot
- **Purpose and users:** AI-guided career hub empowering university students in Uganda to discover and apply to verified local tech internships and scholarships on time.
- **Stack:** Next.js (App Router, TypeScript, Tailwind CSS), `@google/genai` (Gemini 2.5 Flash), Supabase (PostgreSQL), hosted on Vercel.

## Start here
Read `TASKS.md` and `PROGRESS.md` before starting any work. Consult `DECISIONS.md`, `CODING_STANDARDS.md`, and `CONSTITUTION.md` for relevant project architecture and governance rules.

## Commands
- **Install:** `npm install` (TODO: verify after package.json creation)
- **Run locally:** `npm run dev` (TODO: verify)
- **Lint:** `npm run lint` (TODO: verify)
- **Build / Typecheck:** `npm run build` (TODO: verify)
- **Test:** `npm test` (TODO: configure and verify test runner)

## Structure
- `app/`: Next.js App Router root
  - `app/layout.tsx`: Root layout, fonts, and global metadata
  - `app/page.tsx`: Main single-page application dashboard (Header, Profile Bar, Feed, Advisor Drawer, Extractor Modal)
  - `app/api/chat/route.ts`: Server-side Gemini career advisor endpoint (grounded prompt)
  - `app/api/extract/route.ts`: Server-side Gemini raw text extractor endpoint (structured JSON)
  - `app/api/listings/route.ts`: Listings fetch and mutation endpoint (Supabase + fallback)
- `components/`: Modular React UI components
  - `components/StudentProfileModal.tsx`: Profile editor with "Load Sample Student" preset
  - `components/OpportunityFeed.tsx`: Filterable cards with countdowns and Save/Applied toggles
  - `components/OpportunityCard.tsx`: Individual listing card with tags, deadline badge, and apply link
  - `components/ChatAdvisor.tsx`: Sliding/expandable chat drawer connected to `/api/chat`
  - `components/ExtractorModal.tsx`: Raw text paste interface with extracted JSON preview and save
- `lib/`: Shared core logic and static fixtures
  - `lib/gemini.ts`: Server-side Google Gen AI client initialization and helper functions
  - `lib/supabase.ts`: Supabase client initialization with graceful offline fallback
  - `lib/types.ts`: TypeScript definitions (`StudentProfile`, `OpportunityListing`, `ChatMessage`)
  - `lib/sampleData.ts`: Realistic pre-seeded Ugandan tech opportunities (Outbox, Andela, Stanbic, Innovation Village, etc.)

## Working rules
1. **Never invent listings:** The career advisor must only recommend opportunities present in the database feed.
2. **Server-side only AI:** Never call the Gemini API from the client. Keep `GEMINI_API_KEY` strictly on the server.
3. **Handle failures gracefully:** Always catch AI and database errors, returning human-friendly fallback responses.
4. **Single task focus:** Keep changes confined to the current task active in `TASKS.md`.
5. **Record decisions:** Document significant architectural adjustments in `DECISIONS.md`.

## Completion
- Run `npm run build` and `npm run lint` to verify zero compile or type errors.
- Confirm `GEMINI_API_KEY` is not exposed in network payloads or client bundles.
- Update task status in `TASKS.md` and record verified changes in `PROGRESS.md`.

