# TASKS.md

## MVP goal
A university student in Uganda can load or configure their profile (course, year, skills), explore a verified feed of Ugandan tech internships with deadline countdowns, extract a new listing from a raw WhatsApp/LinkedIn post with Gemini 2.5 Flash, and receive personalized career advice from a grounded Gemini advisor citing exclusively real database listings.

## Current task
All MVP tasks completed and verified.

## Completed Tasks

### T-001: Project Scaffolding, Theme & Responsive Dashboard Shell (Phase 1)
- Priority: P0
- Status: Done
- Acceptance criteria:
  - [x] Next.js 14 App Router project initialized with TypeScript and Tailwind CSS.
  - [x] `@google/genai`, `@supabase/supabase-js`, and `lucide-react` installed.
  - [x] Core types (`src/types/index.ts`) and realistic Ugandan seed data (`src/lib/seed-data.ts`) configured.
  - [x] Dark emerald glassmorphic theme tokens implemented in `src/app/globals.css`.
  - [x] Responsive dashboard shell (Desktop Sidebar, TopBar with Demo Profile Switcher, Mobile Bottom Nav, Bento Grid with StatCards and ReadinessGauge).
  - [x] `npm run build` runs and passes with zero errors (verified).

### T-002: Opportunity Feed, Skill Match Filtering & Profile Editor (Phase 2)
- Priority: P0
- Status: Done
- Acceptance criteria:
  - [x] `src/components/dashboard/OpportunityCard.tsx` created with color-coded deadline countdown badges (emerald/amber/rose), skill matching tags, and direct apply links.
  - [x] `src/components/dashboard/OpportunityFeed.tsx` created supporting All, Best Match, Saved, and Applied filter tabs with category filters and live search.
  - [x] Save and Mark Applied state persisted via localStorage.
  - [x] `src/components/dashboard/ProfileEditor.tsx` provides interactive editing of skills, interests, and coursework with live demo persona switcher.

### T-003: Server-Side Gemini Extractor & Ingest UI (Phase 3)
- Priority: P1
- Status: Done
- Acceptance criteria:
  - [x] `src/lib/gemini.ts` implements `extractOpportunityFromText` with structured JSON schema, 12s timeout, and fallback resilience.
  - [x] `src/app/api/gemini/extract/route.ts` provides server-side POST endpoint validating payloads.
  - [x] `src/components/dashboard/ExtractorModal.tsx` provides text area, 1-click demo presets (WhatsApp campus forwards), structured preview card, and instant "Publish to Feed" action.

### T-004: Grounded Gemini Career Advisor & Slide-Over Drawer (Phase 4)
- Priority: P0
- Status: Done
- Acceptance criteria:
  - [x] `src/lib/gemini.ts` implements `adviseCareer` with strict anti-hallucination system prompt injecting database listings.
  - [x] `src/app/api/gemini/chat/route.ts` Route Handler created with 12s timeout and fallback advice.
  - [x] `src/components/dashboard/AdvisorDrawer.tsx` provides slide-over drawer and full tab view with 3 starter prompts and conversational interface.
  - [x] `npm run build` and `npm run lint` pass with zero errors (verified).

## Later (Post-Hackathon)
- SMS / WhatsApp deadline reminders via Africa's Talking API.
- Tailored CV bullet point and cover letter generator per listing.
- Automated web scraper for Ugandan university notice boards.
- Employer portal for posting verified internships directly.
