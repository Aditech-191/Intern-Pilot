# TASKS.md

## MVP goal
A university student in Uganda can load or configure their profile (course, year, skills), explore a verified feed of Ugandan tech internships with deadline countdowns, extract a new listing from a raw WhatsApp/LinkedIn post, and receive personalized career advice from a Gemini-powered advisor grounded exclusively in real database listings.

## Current task
T-002: Opportunities Feed & Filtering (Phase 2)

## Backlog

### T-001: Project Scaffolding, Theme & Responsive Dashboard Shell (Phase 1)
- Priority: P0
- Status: Done
- Depends on: None
- Acceptance criteria:
  - [x] Next.js App Router project initialized with TypeScript and Tailwind CSS.
  - [x] `@google/genai`, `@supabase/supabase-js`, and `lucide-react` installed.
  - [x] Core types (`src/types/index.ts`) and realistic Ugandan seed data (`src/lib/seed-data.ts`) configured.
  - [x] Dark emerald glassmorphic theme tokens implemented in `src/app/globals.css`.
  - [x] Responsive dashboard shell (Desktop Sidebar, TopBar with Demo Profile Switcher, Mobile Bottom Nav, Bento Grid with StatCards and ReadinessGauge).
  - [x] `npm run build` runs and passes with zero errors (verified).

### T-002: Core Types & Realistic Ugandan Opportunities Dataset
- Priority: P0
- Status: Todo
- Depends on: T-001
- Acceptance criteria:
  - [ ] `lib/types.ts` defines `StudentProfile`, `OpportunityListing`, and `ChatMessage`.
  - [ ] `lib/sampleData.ts` contains at least 8 verified, realistic Ugandan tech listings (e.g., Outbox Africa, Innovation Village, Stanbic Bank Graduate Trainee, Andela, Refactory Uganda, Makerere AI Lab).
  - [ ] Listings include title, organization, deadline, location, eligibility, requirements, tags, and apply links.

### T-003: Lightweight Profile State & Demo Student Preset
- Priority: P0
- Status: Todo
- Depends on: T-002
- Acceptance criteria:
  - [ ] Client state management for student profile (course, university, year, skills, interests).
  - [ ] 1-click "Load Sample Student" button instantly populates a 3rd-year Makerere software engineering profile.
  - [ ] Profile persists across browser refreshes via localStorage.

### T-004: Server-Side Gemini Advisor API Route (/api/chat)
- Priority: P0
- Status: Todo
- Depends on: T-002
- Acceptance criteria:
  - [ ] Next.js Route Handler `app/api/chat/route.ts` created using `@google/genai` (`gemini-2.5-flash`).
  - [ ] System prompt injects student profile and active database listings with strict zero-hallucination constraint.
  - [ ] API key kept strictly server-side.
  - [ ] Includes 15s timeout and returns human-friendly fallback message on rate-limit or network failure.

### T-005: Interactive Chat Advisor Interface (Milestone: End-to-End Core Demo)
- Priority: P0
- Status: Todo
- Depends on: T-003, T-004
- Acceptance criteria:
  - [ ] `components/ChatAdvisor.tsx` provides an interactive chat interface.
  - [ ] Displays conversational recommendations citing specific database listing titles and deadlines.
  - [ ] Includes loading indicator while Gemini generates responses.
  - [ ] Clicking a recommended listing in chat highlights or links to the listing details.

### T-006: Opportunity Feed with Countdown Badges & Filters
- Priority: P1
- Status: Todo
- Depends on: T-002, T-003
- Acceptance criteria:
  - [ ] `components/OpportunityFeed.tsx` renders listing cards.
  - [ ] Dynamic deadline countdown badges calculate days remaining and flag urgent deadlines (< 7 days).
  - [ ] Filter by skill match, eligibility year, and search keywords.
  - [ ] Save and Mark as Applied toggles persist state locally.

### T-007: Server-Side Gemini Listing Extractor Route (/api/extract)
- Priority: P1
- Status: Todo
- Depends on: T-002
- Acceptance criteria:
  - [ ] Next.js Route Handler `app/api/extract/route.ts` parses raw messy text into structured JSON.
  - [ ] Extracted fields include: title, organization, deadline (ISO), eligibility, requirements, location, and apply link.
  - [ ] Schema validation guarantees required fields before returning to client.

### T-008: In-App Extractor UI Modal
- Priority: P1
- Status: Todo
- Depends on: T-006, T-007
- Acceptance criteria:
  - [ ] `components/ExtractorModal.tsx` provides text area to paste unstructured announcements (WhatsApp/LinkedIn).
  - [ ] "Extract with Gemini" button triggers `/api/extract` and shows structured preview card.
  - [ ] "Add to Live Listings" button appends newly extracted listing to active feed and advisor context.

### T-009: Supabase Persistence Layer with Graceful Fallback
- Priority: P1
- Status: Todo
- Depends on: T-006, T-008
- Acceptance criteria:
  - [ ] `app/api/listings/route.ts` provides GET and POST endpoints.
  - [ ] If Supabase credentials are configured, reads and writes to Supabase `listings` table.
  - [ ] If Supabase credentials are unconfigured or fail, seamlessly falls back to in-memory/sample data with zero crashes.

### T-010: End-to-End Verification & 3-Minute Demo Polish
- Priority: P0
- Status: Todo
- Depends on: T-005, T-008, T-009
- Acceptance criteria:
  - [ ] Full 3-minute demo flow verified end-to-end: Profile Load -> Feed Inspection -> In-app Extractor -> Grounded Chat Advice.
  - [ ] Mobile viewport tested and validated.
  - [ ] `npm run build` passes with zero errors and zero warnings.

## Later (Post-Hackathon)
- SMS / WhatsApp deadline reminders via Africa's Talking API.
- Tailored CV bullet point and cover letter generator per listing.
- Automated web scraper for Ugandan university notice boards.
- Employer portal for posting verified internships directly.

## Done
No verified completed work yet.

