# Staged migrations (not yet active)

Files here are PREPARED but must not run yet. `knex migrate:latest` only reads
`src/migrations/`, so nothing in this folder executes.

| File | Purpose | Activate when |
|---|---|---|
| `048_drop_kundli_ai_answers.js` | Drops the Ollama per-kundli answer-cache table (`kundli_ai_answers`, created by migration 045 — 045 itself is never deleted). | **Stage 2** of the Ollama removal: after the Stage 1 deterministic UI + bilingual pilot-template flow is reviewed and approved, and after verifying no runtime code still reads or writes the table (in Stage 1 `kundli-ai-cache.service.js` and the legacy ai-stream/prewarm routes still reference it — they are deleted in Stage 2 first). |

To activate: `git mv src/migrations-staged/048_drop_kundli_ai_answers.js src/migrations/` then deploy with `npm run migrate`.
