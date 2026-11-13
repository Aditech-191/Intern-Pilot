---
name: verify-change
description: Verifies changes in the InternPilot Next.js app before handoff or commit. Use when checking code modifications, verifying type safety, validating builds, or concluding a task in TASKS.md.
---

# Verify Change

Use this skill to check code modifications for errors, TypeScript type mismatches, and build failures.

## 01 Workflow

1. **Identify changed files:**
   Inspect git working directory state:
   ```bash
   git status --short
   ```

2. **Select and run relevant checks:**
   - **Typecheck & Build:** Run the Next.js compiler to ensure all TypeScript interfaces, server boundaries, and imports are valid:
     ```bash
     npm run build
     ```
   - **Linting:** Run ESLint to enforce project standards:
     ```bash
     npm run lint
     ```
   - **Route Sanity Check (if API routes were modified):**
     Verify server routes compile cleanly and environment variables are properly referenced.

3. **Inspect results:**
   - If any command fails with errors, inspect the exact file and line number.
   - Do not claim a check passed unless the command executed and returned an exit code of `0`.

4. **Report & Update:**
   - Report actual terminal command outputs.
   - Note any unrun checks (e.g. unit tests if test framework is not yet installed).
   - Update `PROGRESS.md` with observed results.

## 02 Guardrails
- Never mark a task `Done` in `TASKS.md` if `npm run build` fails.
- Never deploy or publish to production within this verification skill.
- Never output raw environment secrets (`GEMINI_API_KEY`, Supabase keys) to terminal output or logs.

