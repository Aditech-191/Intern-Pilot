# InternPilot — AI-Guided Career Hub for Uganda 🇺🇬

> Empowering Ugandan university students to discover, track, and apply to verified local tech internships and scholarships on time.

InternPilot solves a critical pain point for students across Uganda (starting with software engineering undergraduates at Makerere, Kyambogo, and other institutions): high-value opportunities are constantly missed because they are scattered across noisy WhatsApp groups, LinkedIn forwards, and physical campus notice boards.

---

## Key Features

- **Messy Post Extractor (Gemini 2.5 Flash):** Paste unstructured WhatsApp forwards or LinkedIn posts. Gemini extracts clean structured JSON (title, organization, deadline, eligibility, requirements) and publishes it directly to the feed.
- **Personalized Opportunity Feed:** Filterable by Best Match, Saved, and Applied with real-time deadline countdowns (color-coded urgency) and skill matching percentages.
- **Grounded AI Career Advisor:** Server-side conversational advisor grounded exclusively in verified database listings. Delivers honest match evaluations (Strong / Partial / Weak) with zero hallucinated links or fake deadlines.
- **Instant Demo Switcher & Real Auth:** Seamless 1-click persona switching (Makerere & Kyambogo presets) for instant 3-minute hackathon demos, alongside production-ready Glassy Split-Panel authentication with session cookies.
- **Dual Theme Support:** Deep forest dark glassmorphism (`#0B1210`) and crisp high-contrast light mode (`#F0FBF6`) with instant toggle and local persistence.
- **Zero-Trust Security Architecture:**
  - PostgreSQL Row Level Security (RLS) schema (`supabase/schema.sql`).
  - Strict server-side auth guards on all API routes.
  - Anti-IDOR assertions preventing cross-user profile tampering.
  - Sliding-window rate limiting on auth (10/min) and AI endpoints (20/min).
  - Anti-bot honeypot traps on public forms.
  - HTTP security headers (HSTS, CSP, X-Frame-Options, nosniff) & disabled framework fingerprinting.
  - Constant-time HMAC signature checks and PDF magic-byte validation.

---

## Tech Stack

- **Framework:** Next.js 14 (App Router, Server Route Handlers)
- **Language:** TypeScript 5 (Strict Mode)
- **Styling & UI:** Tailwind CSS, Lucide React, Glassmorphism
- **AI Engine:** Google Gemini 2.5 Flash (`@google/genai` via secure server endpoints)
- **Database & Auth:** Supabase (PostgreSQL with RLS) + in-memory resilient fallback
- **Hosting:** Vercel

---

## Quickstart

### 1. Clone & Install
```bash
git clone https://github.com/Aditech-191/Intern-Pilot.git
cd Intern-Pilot
npm install
```

### 2. Configure Environment
Create a `.env.local` file:
```env
# Gemini API Key (Required for live AI advice and extraction; app runs with fallback if omitted)
GEMINI_API_KEY="your-gemini-api-key"

# Supabase (Optional; in-memory fallback enabled by default)
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### 3. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application dashboard or [http://localhost:3000/login](http://localhost:3000/login) for authentication.

---

## Verification & Commands

```bash
npm run lint    # ESLint check (passes with zero warnings)
npm run build   # Next.js production build & typecheck (passes with zero errors)
```

---

## Project Governance

- [`AGENTS.md`](./AGENTS.md): Architecture map and shared rules
- [`CONSTITUTION.md`](./CONSTITUTION.md): Core mission, confirmed principles (v0.3), and quality bars
- [`DECISIONS.md`](./DECISIONS.md): Architectural Decision Records (ADR-001 through ADR-007)
- [`PROGRESS.md`](./PROGRESS.md): Verified chronological build log
- [`TASKS.md`](./TASKS.md): Task status and completed acceptance criteria
