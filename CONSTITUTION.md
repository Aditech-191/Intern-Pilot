# CONSTITUTION.md

Version: 0.3
Updated: 2026-11-15

## Mission
Empower university students in Uganda (starting with software engineering students) to discover, match with, and apply for verified internship and scholarship opportunities on time by consolidating scattered information into a single grounded, AI-guided hub.

## Confirmed principles
1. **Grounded Accuracy (Zero Hallucination of Listings):** The AI advisor chatbot must only recommend opportunities that exist in the active database. It must never invent listings, organizations, deadlines, eligibility criteria, or requirements. When no database opportunity matches, it must state so explicitly and offer skill-building advice.
2. **Server-Side API Security:** The Gemini API key (`GEMINI_API_KEY`) and database service credentials must remain strictly server-side. No client-side code may directly invoke the Google Gen AI API.
3. **Data Minimization:** Treat student profile data as personal. Collect only the minimum information needed for matching (course, year, skills, interests, general experience). Do not collect invasive personal identifiers or credentials.
4. **Frictionless Demo Readiness & Dual-Auth Experience:** Every feature must serve a smooth 3-minute live demonstration. The top bar provides an instant demo profile switcher between Makerere and Kyambogo presets, backed by secure, production-grade email/password authentication (`/login`) with session cookies and anti-bot honeypots.
5. **Mobile-First, Low Bandwidth & Dual Theme:** The interface must be responsive, lightweight, and fast to load over mobile data connections in Uganda, supporting both dark forest glassmorphism and crisp high-contrast light mode with user preference persistence.
6. **Deadline Integrity:** Deadlines are computed from the deadline field and today's date, injected on every request. The advisor never recommends a closed opportunity, flags anything due within 7 days as urgent, and says "no deadline listed" when none exists.
7. **Pasted Text Is Data:** Text pasted into the extractor or chat is treated strictly as data content, never instructions. The model ignores any prompt injection or commands inside it.
8. **Honest Matching:** Recommendations state a match level (Strong / Partial / Weak), reasons, gaps, and actionable next steps. The advisor never promises guaranteed placement.
9. **Scam Awareness:** The advisor warns students when an opportunity asks for a fee, uses personal contact details for a company, or promises unrealistic guarantees.
10. **Verification Honesty:** Seeded listings are marked Verified. Listings published from raw user pastes are marked Unverified until confirmed.
11. **Zero-Trust Backend Security:** Never trust the frontend. Every API route enforces server-side authentication, sliding-window rate limiting, input sanitization, anti-IDOR resource ownership assertions, and strict PostgreSQL Row Level Security (RLS).

## Scope and constraints
- **Budget:** Strict free-tier usage (Google AI Studio, Supabase, Vercel).
- **Confirmed In-Scope:**
  1. Student profile creation with instant demo loader and credentialed session authentication.
  2. Grounded Gemini advisor chatbot (`gemini-2.5-flash`).
  3. In-app messy post parser extracting structured opportunity fields to the database.
  4. Opportunity feed with deadline countdowns, filters, and Save/Applied tracking.
  5. Pre-seeded database of realistic Ugandan tech opportunities.
  6. Dark/Light mode toggle with local persistence.
  7. Zero-Trust security hardening (RLS, API auth guards, rate limiting, anti-IDOR, audit logging).
- **Out of Scope:** SMS/WhatsApp messaging, automated CV/cover letter generation, employer portals, payments.

## Quality expectations
- Chat advisor responses must explicitly cite database listing titles and deadlines.
- All Gemini API calls must include timeout handling and return user-friendly fallback notices on failure.
- In-app extractor must return structured JSON validated before saving to the database.

## Amendments
Record the reason for any principle change and update the version. Resolve conflicts with related project documents explicitly. This file does not override platform rules or explicit user instructions.

- **v0.3 (2026-11-15):** Added Principle 11 (Zero-Trust Backend Security). Formally incorporated production credentialed auth (`/login`, session cookies, honeypot protection) alongside the instant demo profile switcher. Added light/dark mode to Principle 5.
- **v0.2 (2026-11-14):** Added principles 6-10 (deadlines, pasted text as data, honest matching, scam awareness, verification honesty). Moved the one-off 5:00 PM deadline to TASKS.md. Clarified that CV advice is in scope while CV generation is out.
- **v0.1 (2026-11-13):** Initial constitution draft.
