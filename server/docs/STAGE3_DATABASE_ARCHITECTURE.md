# Stage 3 — Database-First Knowledge Architecture

_JyotishStack · single source of truth · no runtime knowledge in JavaScript_

## 1. Goal

After Stage 3, user-facing knowledge lives in the **database**, not in JavaScript
files. The database is authoritative; admin edits (after approval) change user
output with **no code deployment**. The legacy JS question bank and all QA
feature flags are gone, and the deterministic engine is unconditional.

```
Database
   ↓
Astrology Rule Engine  (facts: intent, life_area, planet, house, severity, timing, confidence)
   ↓
Deterministic Engine   (7-state + conflict + completeness → state + confidence)
   ↓
Humanizer              (DB templates / knowledge translations → language)
   ↓
Frontend
```

Calculation never mixes with presentation: the engine emits **structured facts +
a state/confidence**, and the humanizer (template-composer for QA; the knowledge
repository for managed knowledge) turns those into approved bilingual text pulled
from the database.

## 2. Data Flow

**Kundli question (deterministic QA):**
```
question_catalogue → question_requirements → (ownership-safe selective load)
  → strength proxy + dated transit → completeness gate → evidence → state engine
  → template-composer (answer_templates + answer_shared_blocks) → bilingual answer
```

**Managed knowledge (new, reusable):**
```
knowledge_items (approved + public) → knowledge_translations (lang, fallback en)
  → knowledge-repository (cached) → consumer / humanizer → frontend
```

## 3. Tables & Relationships

QA catalogue (Phase 2/Stage 1): `question_categories`, `question_catalogue`,
`question_requirements`, `question_legacy_alias`, `answer_templates`,
`answer_shared_blocks`, `rule_registry`, `qa_audit`.

Knowledge store (Stage 3, migration 049):

```
knowledge_categories (code PK-ish)
        │ 1
        ▼ N
knowledge_items ──1───N── knowledge_translations   (lang, title, body, summary)
   │  uuid, stable_key (immutable), status,          — one row per language
   │  visibility, priority, current_version,         — NO duplicated text
   │  source, search_keywords, *_by, approved_at
   ├──1───N── knowledge_item_versions (version, snapshot JSON)   — history + rollback
   └──1───N── knowledge_tags (tag_type, tag_value)               — search dimensions
```

- **No duplicated text**: body/title/summary live only in `knowledge_translations`.
  `knowledge_item_versions.snapshot` is an immutable JSON archive for rollback, not
  a live read source.
- **Stable identifiers**: `stable_key` and `uuid` never change; deleting an item
  means archiving it (`status='archived'`), never renumbering.

## 4. Item lifecycle (version workflow)

```
draft ──submit──▶ review ──approve──▶ approved ──archive──▶ archived
  ▲                                     │
  └──────────────── rollback(v) ────────┘   (restores a prior snapshot as a NEW version)
```

- Only `status = 'approved'` **and** `visibility = 'public'` items reach users.
- `approve()` writes an immutable snapshot into `knowledge_item_versions` and bumps
  `current_version`.
- `rollback(toVersion)` restores that snapshot's translations + tags and records a
  **new** append-only version (history is never rewritten).
- Admins can `previewDraft()` unapproved content; users never can.

## 5. Multilingual

`knowledge_translations` holds one row per language (`en`, `hi` now; `gu`, `mr`,
`ta`, `te`, `pa` are supported by simply adding rows — no code change). Reads take
a `lang` and fall back to `en`. Logic is never duplicated — only content is
translated.

## 6. Admin workflow (CMS API)

`/api/admin/knowledge` (admin/superadmin only):

| Method | Path | Action |
|---|---|---|
| GET  | `/search?q=&category=&status=&tagType=&tagValue=` | search / filter |
| GET  | `/item/:key` | full item (any status) |
| GET  | `/item/:key/preview?lang=` | preview draft content |
| GET  | `/item/:key/versions` | version history |
| POST | `/` | create draft |
| PATCH| `/item/:key` | edit (draft/review/approved; not archived) |
| POST | `/item/:key/clone` `{newKey}` | clone to a new key (draft) |
| POST | `/item/:key/submit` | draft → review |
| POST | `/item/:key/approve` | → approved (snapshots a version) |
| POST | `/item/:key/archive` | deactivate |
| POST | `/item/:key/rollback` `{toVersion}` | restore a prior version |

Public reads: `GET /api/knowledge/category/:code?lang=` and
`GET /api/knowledge/item/:key?lang=` (approved + public only).

## 7. Publishing workflow

1. Admin creates or clones a **draft** and edits bilingual content + tags.
2. Admin **submits for review**; a reviewer **approves**.
3. Approval snapshots a version and flips the item to `approved`.
4. The repository **invalidates its cache**, so the next public read returns the
   new content immediately — no deployment.

## 8. Caching

- In-process TTL cache (`KNOWLEDGE_CACHE_TTL_MS`, default 5 min) for approved reads
  (`getApproved`, `getApprovedByCategory`).
- **Every write** (`createDraft`, `updateItem`, `approve`, `archive`, `rollback`,
  `clone`, `setStatus`) calls `invalidate()`, so admin changes are visible at once.
- Never cached forever (TTL) and never stale after a write (invalidation).
- Multi-process note: each API process has its own cache; the TTL bounds staleness
  to ≤ 5 min across processes. A shared cache bus (e.g. Redis pub/sub invalidation)
  is the documented future upgrade if sub-TTL cross-process freshness is required.

## 9. Rollback

- **Content**: `POST /item/:key/rollback {toVersion}` restores that version's
  translations + tags as a new approved version.
- **Schema**: `knex migrate:down` reverts migration 049 (drops the 5 knowledge
  tables, FK-safe order) — validated on a disposable DB.
- **Feature**: `git revert` of the Stage-3 commit restores the prior state; the
  knowledge store is additive, so reverting it does not affect the QA engine.

## 10. Future expansion

The same tables host every future knowledge domain by adding a category + items:
yoga/dosha/house/planet interpretations, remedies, planet priorities, and per-area
advice (career/finance/health/relationships/education/spiritual). Migrating an
existing JS/text table into the store is: add a category, seed items +
translations + tags, point the consumer at `knowledge-repository`, delete the JS.
`knowledge_relationships` (linking items, e.g. yoga→remedy) is a natural next table
when cross-references are needed.

## 11. What Stage 3 delivered vs. deferred

**Delivered**: legacy catalogue + flags removed; DB catalogue + deterministic
engine unconditional; normalized versioned multilingual `knowledge_*` store;
cached repository; full admin CMS API; one seeded domain (`life_area_advice`) as
working proof; tests + this doc.

**Deferred (future stages, by design)**: migrating the remaining JS-resident text
(daily-prediction / horoscope tables) — those power features Stage 3 was told not
to modify; a rich admin CMS **front-end** (the API is complete; UI is a thin
follow-on); and consolidating the already-DB-backed reference tables
(zodiac_signs, planets, houses, nakshatras, remedy_*, yoga_dosha_library) under the
unified schema.
