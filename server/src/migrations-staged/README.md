# Staged migrations (not yet active)

Files here are PREPARED but must not run yet. `knex migrate:latest` only reads
`src/migrations/`, so nothing in this folder executes.

_Currently empty._ Migration `048_drop_kundli_ai_answers.js` was moved into
`src/migrations/` during **Stage 2** of the Ollama removal (after the Stage 1
deterministic UI was approved and all runtime readers/writers of
`kundli_ai_answers` were deleted).
