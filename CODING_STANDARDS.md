# CODING_STANDARDS.md

## Tooling
- **Language:** TypeScript 5+ (Strict mode enabled)
- **Framework:** Next.js 14 (App Router, React 18)
- **Styling:** Tailwind CSS (utility-first, mobile-responsive, dark/light theme classes)
- **Linter/Formatter:** ESLint (Next.js core web vitals config)
- **Commands:** See `AGENTS.md` for verified project commands

## Naming and structure
- **React Components:** PascalCase in `src/components/dashboard/` (e.g., `OpportunityCard.tsx`, `AdvisorDrawer.tsx`, `ExtractorModal.tsx`).
- **Route Handlers:** Next.js App Router convention `src/app/api/<feature>/route.ts`.
- **Utilities & Libraries:** camelCase in `src/lib/` (e.g., `gemini.ts`, `db.ts`, `auth.ts`, `rate-limit.ts`, `sanitize.ts`).
- **Types & Interfaces:** PascalCase in `src/types/index.ts` (e.g., `StudentProfile`, `Opportunity`, `ChatMessage`).

## Security & data standards
1. **Gemini Calls at Boundaries:**
   - Must execute strictly server-side in API Route Handlers. Never import `@google/genai` in client components (`'use client'`).
   - Use a 12-second AbortController timeout to prevent hanging connections.
   - Output from Gemini must be parsed and schema-validated before returning to the UI or saving to the database.
   - If Gemini fails (timeout, rate-limit 429, or network error), catch the exception and return a friendly fallback JSON message:
     ```json
     { "error": "Career advisor service encountered a brief delay. Showing active opportunities below.", "fallback": true }
     ```
2. **Secrets & Credentials:**
   - `GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY` must never be logged or transmitted in client network responses.
   - Only `NEXT_PUBLIC_` prefixed variables may appear in client code.
3. **Database & Queries:**
   - Always use Supabase PostgREST parameterized calls (`.from().select().eq()`). Never concatenate user input into raw SQL queries.
   - Gracefully fallback to pre-seeded static data if Supabase credentials are missing or unreachable.
4. **Input Sanitization & Length Boundaries:**
   - All text inputs from users or external sources must be sanitized using `src/lib/sanitize.ts` before processing or storage.
   - Truncate text extraction payloads to a maximum of 25,000 characters and chat messages to 2,000 characters.
5. **Anti-IDOR & Server-Side Authorization:**
   - Never accept user IDs or roles asserted by the client without server validation.
   - Verify resource ownership using `assertResourceOwnership(session, targetId)` before reading or updating personal profile data.
6. **Rate Limiting & Abuse Defense:**
   - Apply sliding-window rate limits (`src/lib/rate-limit.ts`) to public auth (10/min) and AI endpoints (20/min).
   - Use invisible honeypot fields (`_hp_verify`) on public forms to block automated bot submissions.
7. **Audit Logging:**
   - Log authentication events, rate limit breaches, honeypot triggers, and administrative actions via `src/lib/audit.ts`.

## Tests
- Verification relies on `npm run lint` and `npm run build` for strict compile-time TypeScript type checking.
- Automated API route smoke tests (TODO: configure test runner).

## Interface quality
- **Mobile-First Responsiveness:** All views must render cleanly on mobile viewports (minimum 360px width) typical of student smartphones in Uganda.
- **Visual Feedback:** All asynchronous actions (AI chat, extraction, authentication) must display a loading spinner or skeleton state.
- **Empty States:** Clear messaging when filters return zero listings or when no listings have been saved yet.
- **Deadline Formatting:** Display relative countdown badges (e.g., "Closes in 3 days", "Due today", "Expired") with color-coded urgency.
- **Dual Themes:** Support both dark emerald mode and crisp light mode with instant toggle and localStorage persistence.

## Proposed changes (Awaiting Post-MVP Confirmation)
- *Proposed:* Vitest and React Testing Library setup for component unit tests.
- *Proposed:* Zod schema validation library integration for runtime request decoding.
- *Proposed:* PWA offline service worker for caching loaded opportunities.
