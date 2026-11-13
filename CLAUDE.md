# CLAUDE.md

Use `AGENTS.md` for shared project instructions, architecture map, and verified commands.  
Read `TASKS.md` and `PROGRESS.md` before resuming or starting any work.  
Consult `CODING_STANDARDS.md`, `CONSTITUTION.md`, and `DECISIONS.md` when proposing architectural or convention changes.

## Claude-specific guidance
- **Strict Server Boundary:** Never import or invoke `@google/genai` inside client components. Always route GenAI interactions through `app/api/*` Route Handlers.
- **Grounded AI Guardrails:** System prompts passed to Gemini must explicitly instruct the model never to fabricate listings, deadlines, or contact info, relying solely on the provided database listings JSON.
- **Single Task Discipline:** Focus exclusively on the active task specified in `TASKS.md`. Do not start subsequent tasks until current acceptance criteria are verified.
- **No Unverified Claims:** Do not claim a build, typecheck, or test passed without executing the command and inspecting the output.

## Session handoff
When concluding an implementation session:
1. Run `npm run build` and `npm run lint`.
2. Update task completion status and acceptance checkmarks in `TASKS.md`.
3. Record exact changes, checks executed, blockers, and the next immediate step in `PROGRESS.md`.

