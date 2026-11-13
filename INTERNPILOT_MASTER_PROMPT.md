# InternPilot Master Prompt & Architecture Specification

## 1. Execution & Token-Efficiency Constraints (CRITICAL)
- **Quota Conservation:** Work strictly in modular phases. Do not regenerate entire files when editing; output only complete new files or targeted diffs. Keep explanations concise (under 3 sentences per step).
- **Zero Hallucination:** Do not invent mock external APIs, unrequested pages, or complex auth flows that break the 3-minute live demo.
- **Security & Reliability:** All Gemini API calls (@google/genai, using gemini-2.5-flash) MUST run exclusively on the server side. Never expose GEMINI_API_KEY to the client. Enforce a timeout and graceful fallback message on all AI requests.

## 2. UI/UX Architecture & Visual Direction
- **Theme & Palette:** Deep forest/charcoal dark background (`#0B1210` / `#111A17`) with elevated translucent glassmorphism cards (`glass-card`, subtle 1px solid `rgba(255,255,255,0.08)` borders, `rounded-2xl`) and high-contrast emerald green accents (`#10B981` / `emerald-400`).
- **Navigation Shell:**
  - Desktop: Slim collapsible left sidebar (InternPilot branding, nav links: Overview, Opportunities, AI Advisor, Ingest Post, Profile) + top utility bar (quick search input, active student profile switcher pill for effortless demoing).
  - Mobile: Bottom navigation bar + compact top header.
- **Dashboard Layout:**
  - Greeting Header with course/year badge and quick CTA (+ Paste Opportunity).
  - Top Bento Row: Opportunity Match & Activity Card + Application Readiness / Goal Gauge (radial progress + summary pills).
  - Bottom Metric Strip: StatCards (Active Matches, Closing Soon, Saved Listings, Applications Sent).

## 3. Core MVP Features
1. **Student Profile & Instant Demo Switcher:** 2 realistic Ugandan CS/SE student profiles + profile editor.
2. **Seeded + Structured Opportunity Feed:** Realistic Ugandan tech internships (MTN, SafeBoda, Andela, Makerere AI Lab, etc.) with countdowns and filters.
3. **Messy Post Extractor:** Ingest raw WhatsApp/LinkedIn post -> Gemini 2.5 Flash structured output -> preview & publish.
4. **Grounded AI Career Advisor:** Chat grounded strictly in database listings context; no hallucinations.

## 4. Phased Execution Order
- **Phase 1:** Types, seed data, dark-emerald theme tokens in globals.css, responsive dashboard shell (Sidebar, TopBar, Overview bento grid, StatCards, Gauge).
- **Phase 2:** Opportunities feed with skill matching, countdowns, Save/Applied toggles.
- **Phase 3:** /api/gemini/extract + Ingest UI.
- **Phase 4:** /api/gemini/chat + Grounded Advisor UI.

