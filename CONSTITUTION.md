# CONSTITUTION.md

Version: 0.1 (draft)  
Updated: 2026-11-13  

## Mission
Empower university students in Uganda (starting with software engineering students) to discover, match with, and apply for verified internship and scholarship opportunities on time by consolidating scattered information into a single grounded, AI-guided hub.

## Confirmed principles
1. **Grounded Accuracy (Zero Hallucination of Listings):** The AI advisor chatbot must only recommend opportunities that exist in the active database. It must never invent listings, organizations, deadlines, eligibility criteria, or requirements. When no database opportunity matches, it must state so explicitly and offer skill-building advice.
2. **Server-Side API Security:** The Gemini API key (`GEMINI_API_KEY`) and database service credentials must remain strictly server-side. No client-side code may directly invoke the Google Gen AI API.
3. **Data Minimization:** Treat student profile data as personal. Collect only the minimum information needed for matching (course, year, skills, interests, general experience). Do not collect invasive personal identifiers or credentials.
4. **Frictionless Demo Readiness (3-Minute Rule):** Every feature built before the 5:00 PM deadline must serve a smooth 3-minute live demonstration. Eliminate login barriers with a lightweight profile and instant "Demo Student" preset.
5. **Mobile-First & Low Bandwidth:** The interface must be responsive, lightweight, and fast to load, reflecting the reality of university students accessing opportunities over mobile data connections in Uganda.

## Proposed principles (Awaiting Confirmation)
- *Proposed:* Automatic link health and domain verification on all extracted opportunity URLs prior to publication.
- *Proposed:* Progressive Web App (PWA) offline caching for viewing saved listings without an active internet connection.

## Scope and constraints
- **Target Deadline:** Today at 5:00 PM.
- **Budget:** Strict free-tier usage (Google AI Studio, Supabase, Vercel).
- **Confirmed In-Scope:**
  1. Student profile creation with instant demo loader.
  2. Grounded Gemini advisor chatbot (`gemini-2.5-flash`).
  3. In-app messy post parser extracting structured opportunity fields to the database.
  4. Opportunity feed with deadline countdowns, filters, and Save/Applied tracking.
  5. Pre-seeded database of realistic Ugandan tech opportunities.
- **Out of Scope:** User authentication/passwords, SMS/WhatsApp messaging, automated CV/cover letter generation, employer portals, payments.

## Quality expectations
- Chat advisor responses must explicitly cite database listing titles and deadlines.
- All Gemini API calls must include timeout handling and return user-friendly fallback notices on failure.
- In-app extractor must return structured JSON validated before saving to the database.

## Amendments
Record the reason for any principle change and update the version. Resolve conflicts with related project documents explicitly. This file does not override platform rules or explicit user instructions.

