# CODING_STANDARDS.md

## Tooling
- **Language:** TypeScript 5+ (Strict mode enabled)
- **Framework:** Next.js (App Router, React 19)
- **Styling:** Tailwind CSS (utility-first, mobile-responsive)
- **Linter/Formatter:** ESLint (Next.js core web vitals config)
- **Commands:** See `AGENTS.md` for verified project commands

## Naming and structure
- **React Components:** PascalCase in `components/` (e.g., `OpportunityCard.tsx`, `ChatAdvisor.tsx`, `ExtractorModal.tsx`).
- **Route Handlers:** Next.js App Router convention `app/api/<feature>/route.ts`.
- **Utilities & Libraries:** camelCase in `lib/` (e.g., `lib/gemini.ts`, `lib/supabase.ts`, `lib/types.ts`).
- **Types & Interfaces:** PascalCase prefixed or suffixed clearly (e.g., `StudentProfile`, `OpportunityListing`).

## Data and errors
1. **Gemini Calls at Boundaries:**
   - Must execute strictly server-side in API Route Handlers. Never import `@google/genai` in client components (`'use client'`).
   - Use a 15-second AbortController timeout to prevent hanging connections.
   - Output from Gemini must be parsed and schema-validated before returning to the UI or saving to the database.
   - If Gemini fails (timeout, rate-limit 429, or network error), catch the exception and return a friendly fallback JSON message:
     ```json
     { "message": "Career advisor is momentarily offline. Showing current open listings below.", "fallback": true }
     ```
2. **Secrets & Credentials:**
   - `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` must never be logged or transmitted in client network responses.
   - Only `NEXT_PUBLIC_` prefixed variables may appear in client code.
3. **Database Interactions:**
   - Check all query results for errors before returning data.
   - Gracefully fallback to pre-seeded static data if Supabase credentials are missing or unreachable.

## Tests
- Verification relies on `npm run lint` and `npm run build` for strict compile-time TypeScript type checking.
- Automated API route smoke tests (TODO: configure test runner).

## Interface quality
- **Mobile-First Responsiveness:** All views must render cleanly on mobile viewports (minimum 360px width) typical of student smartphones in Uganda.
- **Visual Feedback:** All asynchronous AI actions (sending chat message, extracting raw post) must display a loading spinner or skeleton state.
- **Empty States:** Clear messaging when filters return zero listings or when no listings have been saved yet.
- **Deadline Formatting:** Display relative countdown badges (e.g., "Closes in 3 days", "Due today", "Expired") with color-coded urgency.

## Proposed changes (Awaiting Post-MVP Confirmation)
- *Proposed:* Vitest and React Testing Library setup for component unit tests.
- *Proposed:* Zod schema validation library integration for runtime request decoding.
- *Proposed:* PWA offline service worker for caching loaded opportunities.

