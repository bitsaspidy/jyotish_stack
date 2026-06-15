# Jyotish Stack AI — Activity Log

> Chronological record of every task completed on this project.
> Safe to share with any AI agent as full context.
> Last updated: 2026-06-15 (Session 43)

---

## Session 43 - 2026-06-15 | Hostinger VPS Production Deployment Kit

### What was done

**Deployment runbook:**
- Added `docs/HOSTINGER_VPS_DEPLOYMENT.md` with step-by-step Hostinger VPS setup for Ubuntu 24.04, Node.js 24 LTS, MySQL, Apache, PM2, Certbot, GitHub pull, DNS, backups, and scaling.
- Documented that `jyotishstackai.com` will serve the full `ui-main` app for launch, while `ui-ai-com` remains a lighter AI-branded landing package until it reaches feature parity.
- Added secure phpMyAdmin access through a PuTTY SSH tunnel only, with Apache listening on `127.0.0.1:8081`.

**Production config:**
- Updated `ecosystem.config.js` so PM2 runs the API from `server/` and the full `ui-main` Next app from `ui-main/`, with optional `API_INSTANCES` and `UI_INSTANCES` scaling.
- Rebuilt `deploy.sh` around `git pull --ff-only`, `npm ci`, server migrations, `build:main`, PM2 start/reload, and Apache reload.
- Updated `.env.production.example` for the real production env variables used by the app: `APP_URL`, `ALLOWED_ORIGINS`, `JWT_REFRESH_SECRET`, and localhost MySQL.
- Updated `apache/jyotish.conf` for `jyotishstackai.com` and added `apache/phpmyadmin-local.conf` for local-only phpMyAdmin.
- Updated `server/knexfile.js` so production MySQL SSL is opt-in via `DB_SSL=true`, instead of forcing SSL for a local VPS MySQL socket.

### Verification

```bash
node --check ecosystem.config.js
node --check server/knexfile.js
git diff --check
npm.cmd run test:server   # 14/14 passed
npm.cmd run build:main    # compiled successfully; 38/38 pages generated
```

### Notes

- `bash -n deploy.sh` could not run locally because Windows Subsystem for Linux has no installed distro in this machine.
- `pdf-map.txt` and `test-report.pdf` remain local generated/reference artifacts and should not be committed.

---

## Session 42 - 2026-06-12 | GitHub Visibility Check + Latest Feature Push Prep

### What was found

- GitHub default branch is `main`, while the latest Codex work was on `origin/codex/yogas-doshas-hindi-ui`.
- `origin/main` had merge commit `7ca534f`, but it did not contain the newest branch commits including `509ea82 Add Asta Vakri analysis`.
- The local workspace also had newer uncommitted work after the previous push, so those files were not visible on GitHub yet.

### What was done

**Backend:**
- Added `buildPlacementNarratives()` integration so Kundli detail, admin detail, and PDF extras include per-planet Graha Phal placement narratives.
- Added Samvat calculation in `server/src/services/helpers/panchang.js` for Vikram, Shaka, Kali, and Samvatsara.
- Added Samvat output to daily Panchang and Kundli Panchang data.
- Extended premium Kundli PDF with Avakahada Chakra fields and Graha Phal placement narratives.

**Frontend:**
- Added `AvakahadaPanel` to user and admin Kundli detail views.
- Added `PlacementNarrativesPanel` to user and admin Kundli detail views.
- Panchang Muhurta page now shows Vikram Samvat, Shaka Samvat, Samvatsara, and Kali Samvat.

**Build stability:**
- Updated `ui-main/next.config.js` with serialized build settings (`experimental.cpus = 1`, `experimental.webpackBuildWorker = false`) after Next generated an incomplete `app-paths-manifest.json` on Windows and failed page-data collection.

### Verification

```bash
git fetch origin --prune
git ls-remote origin refs/heads/main refs/heads/codex/yogas-doshas-hindi-ui
node --check server/src/routes/kundli.routes.js
node --check server/src/services/helpers/panchang.js
node --check server/src/services/helpers/placement-narratives.js
node --check server/src/services/kundli-admin.service.js
node --check server/src/services/pdf/kundli-report.js
git diff --check
npm.cmd run test:server   # 14/14 passed
npm.cmd run build:main    # compiled successfully; 31/31 pages generated after serialized Next build config
```

### Git/worktree note
- `pdf-map.txt` and `test-report.pdf` remain local generated/reference artifacts and should not be committed.

---

## Session 41 - 2026-06-12 | Asta/Vakri Analysis + GitHub Upload Prep

### What was done

**Backend - Asta/Vakri library and chart enrichment:**
- Added migration `server/src/migrations/019_asta_vakri_library.js` for `asta_vakri_library`.
- Added seed `server/src/seeds/016_asta_vakri_class13.js` with Class 13 combustion and retrograde reference content, rules, remedies, misconceptions, and strength rankings.
- `server/src/services/vedic-calc.service.js` now stores `sun_distance` and `combust_level` (`mild`/`deep`) for combust planets.
- `server/src/services/helpers/kundli-strength.js` now increases strength for non-shadow retrograde planets and applies combustion penalties.
- `server/src/services/helpers/yogas-doshas.js` now treats retrograde debilitated planets as Vakri Neechabhanga.
- `server/src/services/kundli-admin.service.js` now exposes `fetchAstaVakriAnalysis()` and attaches `profile.asta_vakri` for user detail, admin detail, and report extras.
- `server/src/routes/kundli.routes.js` returns `asta_vakri` from `GET /api/kundli/:id` and recalculate responses.
- `server/src/services/pdf/kundli-report.js` adds a Combustion & Retrograde Analysis section to premium Kundli PDFs when applicable.

**Frontend - user/admin panels:**
- Added `ui-main/src/components/AstaVakriPanel.jsx` for bilingual combustion and retrograde analysis.
- Wired the panel into `ui-main/src/views/KundliDetail.jsx`.
- Wired the panel into `ui-main/src/admin-views/KundliAdminDetail.jsx`.

### Verification

```bash
git diff --check
node --check server/src/routes/kundli.routes.js
node --check server/src/services/helpers/kundli-strength.js
node --check server/src/services/helpers/yogas-doshas.js
node --check server/src/services/kundli-admin.service.js
node --check server/src/services/pdf/kundli-report.js
node --check server/src/services/vedic-calc.service.js
node --check server/src/migrations/019_asta_vakri_library.js
node --check server/src/seeds/016_asta_vakri_class13.js
npm.cmd run test:server   # 14/14 passed
npm.cmd run build:main    # compiled successfully; 31/31 pages generated
```

### Git/worktree note
- `pdf-map.txt` and `test-report.pdf` are local generated/reference artifacts and were intentionally excluded from the GitHub upload.

---

## Session 40 — 2026-06-10 | Panchang Muhurta — Hora System, End Times, Public Page

### What was done

**Backend — `server/src/services/helpers/panchang.js`:**
- **Fixed `calculateHora()`**: Changed from variable-length proportional horas (dayspan/12) to equal 60-minute fixed horas (BPHS: 1 Hora = ~60 min, 24 Horas = 24 hours). Day horas 1–12 start from sunrise; night horas 13–24 start 12 hrs after sunrise.
- **Added `nature` / `nature_hi`** fields per hora (Powerful, Artistic, Intelligent, Emotional, Disciplined, Auspicious, Active + Hindi)
- **Added `hora_num`**, `start_mins`, `end_mins` fields to every hora entry (for client-side "current hora" detection)
- **Added `jdToLocalHMS(jd, tz)`** helper — converts Julian Day to local HH:MM:SS string
- **Added `computeEndTimes(year, month, day, tz)`** — computes exact end times for Tithi, Nakshatra, Yoga, Karana via 10-min forward scan + 25-iter binary search on ephemeris (< 5 ms total, accuracy ≈ 1 second)
- **Updated `calculateDailyPanchang()`** — now attaches `end_time` to tithi/nakshatra/yoga/karana objects in the response
- Updated `module.exports` to expose `computeEndTimes` and `jdToLocalHMS`

**Backend — `server/src/routes/panchang.routes.js` (NEW):**
- Public `GET /api/panchang/daily?lat=&lon=&date=YYYY-MM-DD&tz=&place=` endpoint (no auth required)
- Returns full panchang including end times, chaughadiya, hora

**Backend — `server/src/index.js`:**
- Registered `app.use('/api/panchang', panchangRoutes)`

**Frontend — `ui-main/src/views/PanchangMuhurta.jsx` (NEW):**
- Full public Panchang Muhurta page
- **Location search with autocomplete**: Nominatim debounced search (400 ms), dropdown of up to 6 suggestions, click to select — auto-fills lat/lon, auto-detects timezone from longitude
- **Date selection**: separate Day / Month / Year dropdowns (handles leap years / month-end correctly)
- **Timezone selector**: 8 common zones (IST, PKT, NPT, BST, UTC, UAE, CET, EST) auto-selected from longitude
- **Results layout** matching BPHS Panchang format:
  - Result header: Day, formatted date, location name, Masa + Paksha + Ayana pills
  - Celestial times: 4 cards (Sunrise / Sunset / Moonrise / Moonset)
  - 5 Panchang elements (Tithi, Nakshatra, Yoga, Karana, Paksha) — each with `End: HH:MM:SS`
  - 4 Astro details (Ritu, Sun Sign, Moon Sign, Ayana)
  - Special Yogas (Sarvartha Siddhi, Amrit Siddhi, Ravi Yog, Dwipushkar, Tripushkar) — if present
  - **Chaughadiya** tab: Day/Night sub-toggle, 8 periods each with auspicious/inauspicious color, start–end times
  - **Hora** tab: Day/Night sub-toggle, 24 one-hour horas with planet icon, color, nature, time range, "NOW" badge for current hora
- Bilingual EN/HI toggle throughout
- BPHS attribution footer

**Frontend — `ui-main/src/app/panchang-muhurat/page.jsx` (NEW):**
- `/panchang-muhurat` page route

**Frontend — `ui-main/src/components/Navbar.jsx`:**
- Added `{ href: '/panchang-muhurat', en: 'Muhurta', hi: 'मुहूर्त' }` between Horoscope and Varshphal

### Counts
- 18 migrations · 15 seeds · 27 tables · **30 pages** · 19 helpers
- **14/14 tests ✓ | 30/30 build pages ✓**

---

## Session 39 — 2026-06-07 | Dashakoot: Rajju + Vedha Compatibility

### What was done

**Backend — `server/src/services/helpers/ashtakoot.js`:**
- Added `RAJJU_GROUP` map: all 27 nakshatras → 5 body-zone groups (Pada/Kati/Udara/Kantha/Sira)
- Added `RAJJU_LABEL` + `RAJJU_EFFECT`: bilingual EN+HI names and dosha effects per group
- Added `VEDHA_PAIRS` set: all 26 BPHS-standard bidirectional piercing nakshatra pairs
  (1↔18, 2↔17, 3↔16, 4↔15, 5↔14, 6↔13, 7↔12, 8↔11, 9↔10, 19↔27, 20↔26, 21↔25, 22↔24; nak 23 exempt)
- `calculateAshtakoot()` now computes and returns `rajju` + `vedha` objects:
  - `rajju`: group for each partner, `has_dosha` (same group = dosha), bilingual status, dosha severity notes
  - `vedha`: nakshatra numbers, `has_dosha`, bilingual status with nakshatra names
- `system` field updated: `'Ashtakoot Guna Milan + Rajju-Vedha'`

**Tests — `server/tests/vedic-calc.test.js`:**
- Updated Ashtakoot test: relaxed `system` to `includes('Ashtakoot')`, added assertions for `rajju` + `vedha` presence and type

**Frontend — `ui-main/src/views/Matchmaking.jsx`:**
- Added `RajjuVedhaSection` component: 2-card grid (Rajju + Vedha)
  - Each card: name, description, group detail, pass/fail badge, bilingual status text
  - Dosha: red border + "Dosha" badge; Clear: green border + "✓ Clear" badge
- Inserted `RajjuVedhaSection` between 8-koot grid and MangalSection
- Header label updated to "Ashtakoot + Rajju-Vedha (Dashakoot)" / "अष्टकूट + राज्जु-वेध (दशकूट)"

### Counts (unchanged)
- 18 migrations · 15 seeds · 27 tables · 29 pages · 19 helpers
- **14/14 tests ✓ | 29/29 build pages ✓**

---

## Session 36 — 2026-06-05 | Full Planet Position Table + Pratyantardasha + Sookshmadasha

### What was done

**Backend — `vedic-calc.service.js`:**
- Added `computeAvastha(rashiNum, degreeInSign)` — Baladi Avastha (Bala/Kumara/Yuva/Vridha/Mrit) per odd/even sign rule
- Added combust detection: `COMBUST_ORB` (Moon:12, Mars:17, Mercury:14, Jupiter:11, Venus:10, Saturn:15), retrograde-adjusted for Mercury(12)/Venus(8)
- Each planet in `planetDetails` now carries: `nakshatra_en`, `nakshatra_hi`, `nakshatra_lord`, `nakshatra_num`, `nakshatra_pada`, `awastha`, `awastha_hi`, `is_combust`

**Backend — `dasha-calc.js`:**
- Extracted shared `_buildSubPeriods(lord, start, end, currentDate)` helper
- Added `buildPratyantardasha(antardasha, currentDate)` — 9 sub-periods, adds `sookshmadasha[]` only to the currently running period
- Added `buildSookshmadasha(pratyantardasha, currentDate)` — 9 finest sub-periods
- Modified `buildAntardasha` to include `pratyantardasha[]` on every antardasha period
- All 3 new functions exported

**Frontend — `KundliDetail.jsx` planet table:**
- Replaced 5-col planet table with full 13-col comprehensive table (horizontal scroll)
- Columns: Planet | Full Degree | Norm. Degree | Speed°/d | Retro | Sign | Sign Lord | Nakshatra | Nak. Lord | Pada | House | Combust | Awastha
- Ascendant included as first row
- Color-coded Awastha badges, retrograde speed in orange, combust in red, Nak/SignLord in planet color

**Frontend — `KundliDetail.jsx` dasha section:**
- Antardasha redesigned as compact 5-col grid with planet icon + color
- Added Pratyantardasha section (violet theme) — all 9 periods of current Antardasha lord
- Added Sookshmadasha section (green theme) — all 9 periods of current Pratyantardasha lord
- Each section: current period badge, dates, heading shows current lord name

**Ephemeris Engine Upgrade (later in Session 36):**
- `server/package.json`: added `astronomy-engine` dependency (MIT, Don Cross, VSOP87)
- `ephemeris.service.js`: replaced Meeus Keplerian planet calculations with `astronomy-engine`:
  - Sun: `SunPosition(date).elon` (apparent tropical, <1" accuracy)
  - Moon + planets: `GeoVector(body, date, true)` → `Ecliptic(gv).elon` (geocentric J2000, <5" accuracy)
  - Rahu: kept Meeus mean node formula (~0.1°, astronomy-engine has no direct API)
  - Sunrise/Sunset: `SearchRiseSet()` replaces simplified EoT formula (accurate to ±30s)
- `panchang.js`: delegates `sunriseSunset` to `eph.sunriseSunset` (removed simplified formula)
- `vedic-calc.service.js`: updated meta.calculation/accuracy strings
- All 14 tests pass with new engine; planet accuracy improved from 0.5–2° to <5"

### Counts unchanged
- 18 migrations | 15 seeds | 27 tables | 27 pages | 19 helpers
- **14/14 tests ✓ | 27/27 build pages ✓**

---

## Session 35 — 2026-06-05 | Kundli Strength Fix + Guna Milan + Manglik Dosha (Class 17 PDF)

### What was done

**Bug Fixes:**
- `kundli-strength.js`: 4 field-name bugs fixed (dasha_periods→dasha, .planet→.lord, antardashas→antardasha, end_date→end) + yogas_doshas flat-array parsing bug + 2× `.present`→`.has_dosha` silent bug
- `KundliStrengthPanel` now correctly loads, computes yoga score properly, and shows Mangal Dosha in challenges

**Class 17 PDF processed — `mangal-dosha.js` enhanced:**
- Added house 2 to trigger houses (was missing; PDF: 1,2,4,7,8,12)
- 3 Manglik types: Anshik (1 activation), Poorna (2), Double (3)
- 4 cancellations: own/exalted sign, Jupiter aspect, Venus aspect, Kumbh Lagna H8 exception
- Bilingual cancellations `{en, hi}`, effects_en/hi, proper summary_hi
- Test updated: reference chart Jupiter aspects Mars → severity mild (correct per PDF)

**`ashtakoot.js` enhanced:**
- All 8 kootas: name_hi, description_en/hi, details_hi, status/status_en/status_hi
- Dosha flags: Nadi Dosha, Bhakoot Dosha, Gana Dosha, Yoni Vairam with Hindi names
- Both-Manglik cancellation logic, mangal_note_en/hi, verdict_en/hi, summary_hi, active_dosha_count

**`report.service.js`:** Matchmaking PDF includes manglik_type, koot doshas, verdict_en, section headers

**`Matchmaking.jsx`** — full redesign:
- Conic-gradient score ring (96px)
- Bilingual verdict + dosha count pills
- 8 koot cards with name (EN·HI), description, score bar, status text, dosha badge
- MangalSection: compatibility verdict, type badge, active check chips, cancellations
- All labels fully bilingual, history shows colour-coded scores + verdict

**`KundliDetail.jsx` Mangal section:**
- Manglik type badge, H-number checks, effects list, cancellations list, proper Hindi summary

### Result: 14/14 tests ✓ | 27/27 pages ✓ | 16 PDFs processed

**UI Readability overhaul (later in Session 35):**
- North Indian SVG chart: SVG `feDropShadow` filter, house numbers full gold, sign/planet text near-white, lighter cell fills
- South Indian grid: lighter backgrounds, sign labels 90%+ opacity, house numbers 85%+ opacity
- `globals.css`: card-royal lighter; all text-ivory/* utilities boosted system-wide
- `KundliInsightPanel.jsx`, `KundliDetail.jsx`, `Predictions.jsx`: all low-opacity inline text fixed

**Varga Charts Deep Insights (later in Session 35):**
- New `varga-insights.js` (19th helper): 216 house domain descriptions, per-chart planet roles, 9-planet remedy table, `computeVargaInsights()`, `getChartRemedy()`
- `life-report.service.js`: attaches `planet_readings[]` + `chart_remedy` to every Varga reading in `generateVargaAnalysis()`
- `KundliDetail.jsx` VargaChartsPanel: new Planet-by-Planet Analysis section — 9 sorted planet cards with positives/negatives/remedies + overall chart remedy

### Final Result: 14/14 tests ✓ | 27/27 pages ✓ | 19 helper modules

---

## Session 1 — 2026-06-02 | Foundation Build

### Objective
Bootstrap the complete Jyotish Stack AI monorepo from scratch.

---

### ✅ TASK-001 — Monorepo Setup
**Status:** Done
**Files:**
- `package.json` — npm workspaces root defining 6 packages: `server`, `ui-main`, `ui-in`, `ui-ai-com`, `ui-ai-in`, `ui-admin`
- Root-level scripts: `dev:server`, `dev:main`, `dev:admin`, `migrate`, `seed`

**Decision:** npm workspaces chosen over Turborepo/Nx for simplicity. Single `node_modules` at root.

---

### ✅ TASK-002 — Express Server Bootstrap
**Status:** Done
**Package:** `server` (port 5000)  
**Tech:** Node.js + Express 4 + Knex.js + MySQL2  
**Files created:**
- `server/package.json` — deps: express, knex, mysql2, bcryptjs, jsonwebtoken, nodemailer, razorpay, express-validator, express-rate-limit, helmet, compression, cors, uuid, multer
- `server/.env` — all environment variables (DB, JWT, SMTP, Razorpay, CORS origins)
- `server/knexfile.js` — Knex config for development + production environments

**Features:**
- CORS with whitelist from env (all 4 domains + localhost ports)
- Helmet security headers
- Gzip compression
- Global rate limit: 300 req/15min
- Auth rate limit: 20 req/15min
- `GET /health` endpoint — returns DB connectivity status

---

### ✅ TASK-003 — Database Schema (4 Migrations)
**Status:** Done  
**DB:** MySQL 8 · `jyotish_stack_ai_db` · root/bitsaspidy · utf8mb4  
**Migration runner:** Knex.js  
**Files:**

#### `001_create_users.js`
Tables: `users`, `user_sessions`
- `users`: id, uuid, name, email, phone, password_hash, role (user/admin/superadmin), is_active, email_verified, email_verification_token, password_reset_token, password_reset_expires, avatar_url, preferred_language (hi/en), meta (JSON), timestamps
- `user_sessions`: id, user_id (FK), refresh_token, device_info, ip_address, expires_at, timestamps

#### `002_create_app_settings.js`
Table: `app_settings`
- Key-value runtime config store (maintenance_mode, site_name, taglines, contact_email, razorpay_enabled, etc.)

#### `003_create_kundli.js`
Tables: `kundli_profiles`, `matchmaking_requests`, `predictions`
- `kundli_profiles`: uuid, user_id, name, DOB, TOB, place, lat/lng, timezone, gender, calculated_data (JSON), is_public
- `matchmaking_requests`: uuid, user_id, kundli_boy_id, kundli_girl_id, result (JSON), status
- `predictions`: uuid, kundli_id, user_id, type (daily/weekly/monthly/yearly/dasha/transit/custom), content_en, content_hi, meta, valid_from/until

#### `004_create_subscriptions_notifications.js`
Tables: `subscription_plans`, `user_subscriptions`, `newsletter_subscribers`, `notifications`, `email_logs`
- `subscription_plans`: name, price, currency, duration_days, features (JSON), is_active
- `user_subscriptions`: uuid, user_id, plan_id, razorpay IDs, status, amount_paid, starts_at, expires_at
- `newsletter_subscribers`: email, name, preferred_language, is_active, unsubscribe_token
- `notifications`: user_id (nullable=broadcast), title, body, type, is_read, action_url, sent_at
- `email_logs`: to_email, subject, template, status (queued/sent/failed), error_message

**Total tables:** 12 + `knex_migrations` + `knex_migrations_lock`

---

### ✅ TASK-004 — Database Seed
**Status:** Done  
**File:** `server/src/seeds/001_defaults.js`

**Seeded data:**
- Default superadmin: `admin@jyotishstack.com` / `Admin@2026!`
- 9 `app_settings` rows (maintenance_mode=false, site info, etc.)
- 3 subscription plans: Basic (₹0/30d), Premium (₹499/30d), Yearly (₹3,999/365d)

---

### ✅ TASK-005 — Server Middleware
**Status:** Done

#### `server/src/middleware/auth.js`
- `authenticate` — verifies JWT Bearer token, loads user from DB, checks `is_active`
- `requireRole(...roles)` — factory middleware for role-based access

#### `server/src/middleware/maintenance.js`
- Reads `maintenance_mode` from `app_settings`
- **30-second in-memory cache** to avoid DB hit on every request
- Returns 503 + title/message (EN+HI) when enabled
- Bypass: `/api/admin` and `/api/auth` routes skip this guard
- `maintenanceGuard.invalidate()` — clears cache (called by admin settings route)

---

### ✅ TASK-006 — Server Utilities
**Status:** Done

#### `server/src/utils/response.js`
- `ok(res, data, message, status)` — standard success response
- `fail(res, message, status, errors)` — standard error response

#### `server/src/utils/token.js`
- `signAccess(payload)` — JWT access token (7d default)
- `signRefresh(payload)` — JWT refresh token (30d default)
- `verifyRefresh(token)` — verify + decode refresh token
- `randomToken(bytes)` — crypto-secure random hex string (for email verification, password reset, newsletter unsubscribe)

---

### ✅ TASK-007 — Email Service
**Status:** Done  
**File:** `server/src/services/email.service.js`  
**Transport:** Nodemailer (SMTP — configurable for Gmail, SendGrid, etc.)

**Templates (HTML, royal dark-gold design):**
| Template | Use |
|----------|-----|
| `welcome` | New user registration |
| `verify_email` | Email verification link |
| `reset_password` | Password reset link |
| `subscription_confirm` | Payment success |
| `newsletter` | Newsletter blast (with unsubscribe link) |
| `custom` | Admin email blast |

All emails logged to `email_logs` table (queued → sent/failed).  
Fire-and-forget pattern — errors are swallowed to not block API responses.

---

### ✅ TASK-008 — Razorpay Service
**Status:** Done  
**File:** `server/src/services/razorpay.service.js`
- `createOrder({ amount, currency, receipt, notes })` — creates Razorpay order (amount in ₹, auto-converts to paise)
- `verifySignature({ orderId, paymentId, signature })` — HMAC SHA256 verification of Razorpay webhook/callback

---

### ✅ TASK-009 — API Routes (7 modules)
**Status:** Done

#### `/api/auth` — `auth.routes.js`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register + send welcome email + auto-login |
| POST | `/login` | — | Login, returns accessToken + refreshToken |
| POST | `/refresh` | — | Token refresh |
| POST | `/logout` | ✓ | Delete session |
| GET | `/verify-email?token=` | — | Verify email address |
| POST | `/forgot-password` | — | Send reset link (silent if email not found) |
| POST | `/reset-password` | — | Reset password with token |
| GET | `/me` | ✓ | Return current user |

#### `/api/admin` — `admin.routes.js` (admin/superadmin only)
| Endpoint | Description |
|----------|-------------|
| GET `/dashboard` | Stats: users, subscribers, kundlis, subs, emails |
| GET/POST `/users` | List (paginated+search) / create user |
| PATCH `/users/:id/toggle-active` | Activate/deactivate user |
| PATCH `/users/:id/role` | Change user role |
| POST `/send-email` | Blast to all users or specific IDs |
| GET/POST `/notifications` | List / broadcast or targeted notification |
| GET/PATCH `/settings` | Read/write all app_settings |
| GET `/newsletter` | Paginated subscriber list |
| POST `/newsletter/blast` | Send newsletter to all active subscribers |
| GET/POST/PATCH `/plans` | CRUD subscription plans |
| GET `/email-logs` | Paginated email send history |

#### `/api/users` — `user.routes.js` (auth required)
- GET/PATCH `/profile` — read/update own profile
- PATCH `/password` — change password (verifies current)
- GET `/notifications` — own + broadcast notifications (paginated)
- PATCH `/notifications/:id/read` — mark read
- GET `/subscriptions` — own subscriptions with plan details

#### `/api/kundli` — `kundli.routes.js` (auth required)
- CRUD on `/` and `/:id` (UUID-based)
- POST `/matchmaking/request` — create matchmaking (boy+girl kundli UUIDs)
- GET `/matchmaking/list` — own matchmaking requests

#### `/api/subscriptions` — `subscription.routes.js`
- GET `/plans` — public list of active plans
- POST `/order` — create Razorpay order (or activate free plan instantly)
- POST `/verify` — verify payment + activate subscription + send confirmation email

#### `/api/newsletter` — `newsletter.routes.js`
- POST `/subscribe` — subscribe (re-subscribe if previously unsubscribed)
- GET `/unsubscribe?token=` — token-based unsubscribe

#### `/api/settings` — `settings.routes.js`
- GET `/public` — maintenance_mode, site_name, taglines, contact_email, razorpay_enabled

---

### ✅ TASK-010 — React UI Bootstrap (ui-main — Vite version, superseded by Next.js)
**Status:** Superseded — rebuilt as Next.js in Session 1 Task 013  
**Original:** Vite + React + Tailwind CSS + React Router DOM

---

### ✅ TASK-011 — Design System
**Status:** Done (defined in `ui-main/tailwind.config.js`)

**Theme:** Royal Cosmos — deep navy cosmos with gold accents  
**Color palette:**
| Token | Hex | Purpose |
|-------|-----|---------|
| `cosmos-800` | `#0B0D1A` | Page background |
| `cosmos-700` | `#111428` | Card background |
| `cosmos-900` | `#06070F` | Footer/deepest bg |
| `gold` | `#D4AF37` | Primary accent |
| `gold-light` | `#F0D060` | Hover gold |
| `gold-dark` | `#A88B20` | Gradient end |
| `ivory` | `#F5F0E8` | Body text |
| `ivory-muted` | `#C8BFA8` | Muted text |
| `saffron` | `#FF9933` | Accent/Hindi |
| `indigo` | `#3D3580` | Secondary accent |
| `crimson` | `#8B0000` | Error/danger |

**Fonts:** Playfair Display (headings) · Inter (body) · Noto Sans Devanagari (Hindi)  
**Custom animations:** starFloat, pulseGold, glow, shimmer, float  
**Reusable CSS classes:** `.btn-gold`, `.btn-outline-gold`, `.card-royal`, `.input-royal`, `.section-title`, `.text-gradient-gold`, `.glass`, `.starfield-bg`

---

### ✅ TASK-012 — Admin Panel UI (ui-admin — Vite version, superseded by Next.js)
**Status:** Superseded — rebuilt as Next.js in Session 1 Task 014  
**Original:** Vite + React + Tailwind + React Router DOM  
**Pages built:** Login, Dashboard, Users, Settings, Newsletter, Notifications, Email Blast, Plans, Email Logs  
**Components:** Sidebar with nav links + user badge + logout

---

### ✅ TASK-013 — ui-main Converted to Next.js 14 (App Router)
**Status:** Done  
**Framework:** Next.js 14 with App Router + `src/` directory  
**Port:** 3000  

**Structure:**
```
src/
├── app/
│   ├── layout.jsx           Root HTML layout (server component)
│   ├── globals.css          Global CSS (imports Tailwind + custom classes)
│   ├── providers.jsx        Client providers (AuthProvider + Toaster)
│   ├── page.jsx             → Home page
│   ├── login/page.jsx       → Login page
│   ├── register/page.jsx    → Register page
│   ├── dashboard/page.jsx   → Protected dashboard
│   ├── verify-email/page.jsx
│   ├── forgot-password/page.jsx
│   ├── reset-password/page.jsx
│   ├── kundli/page.jsx      → Stub (awaiting PDF calculations)
│   ├── matchmaking/page.jsx → Stub
│   ├── predictions/page.jsx → Stub
│   └── pricing/page.jsx     → Pricing section
├── components/
│   ├── StarField.jsx        'use client' — canvas animated starfield
│   ├── Logo.jsx             SVG yantra-inspired JS octagram logo
│   ├── Navbar.jsx           'use client' — sticky, bilingual, mobile menu
│   └── Footer.jsx           'use client' — newsletter subscribe + links
├── context/
│   └── AuthContext.jsx      'use client' — JWT auth state + login/register/logout
└── lib/
    └── api.js               Axios instance with Bearer token + auto-refresh on 401
```

**Key changes vs Vite:**
- `react-router-dom` → `next/link` + `next/navigation`
- `main.jsx` + `App.jsx` → `app/layout.jsx` + `app/providers.jsx`
- `vite.config.js` → `next.config.js` (with `/api` proxy rewrites)
- Fonts loaded via `next/font/google` (Inter + Playfair Display + Noto Sans Devanagari)
- Maintenance check moved to `providers.jsx` (client-side on mount)
- Protected pages use `ProtectedPage` wrapper that redirects to `/login`

---

### ✅ TASK-014 — ui-admin Converted to Next.js 14 (App Router)
**Status:** Done  
**Port:** 3004  

**Structure:**
```
src/
├── app/
│   ├── layout.jsx           Root HTML layout
│   ├── globals.css
│   ├── page.jsx             → Redirect to /dashboard
│   ├── login/page.jsx       → Admin login
│   ├── dashboard/page.jsx   → Stats overview
│   ├── users/page.jsx       → User management
│   ├── settings/page.jsx    → App settings + maintenance toggle
│   ├── newsletter/page.jsx  → Subscriber list + blast
│   ├── notifications/page.jsx → Send notifications
│   ├── email-blast/page.jsx → Email blast to users
│   ├── plans/page.jsx       → Subscription plan management
│   └── email-logs/page.jsx  → Email history
├── components/
│   └── Sidebar.jsx          'use client' — admin sidebar with nav + logout
├── context/
│   └── AdminAuthContext.jsx 'use client' — admin auth state
└── lib/
    └── api.js               Axios with adminToken auto-attach
```

**Key changes:** Same pattern as ui-main. Admin pages wrapped in `AdminShell` ('use client') that checks auth and renders Sidebar + main content.

---

### ✅ TASK-015 — UI Stubs (ui-in, ui-ai-com, ui-ai-in)
**Status:** Done (stubs with Next.js setup, same design system)  
**Ports:** ui-in:3001 · ui-ai-com:3002 · ui-ai-in:3003  
**Content:** Minimal Next.js app with Coming Soon page + newsletter subscribe  
**Note:** Full builds pending — will be designed differently per domain's audience

---

### ✅ TASK-016 — Project Documentation
**Status:** Done

#### `MEMORY.md`
Complete project bible covering:
- Project overview, domains, ports
- Full repository structure
- Database schema (all 12 tables)
- API reference (all endpoints)
- Design system (colors, fonts, classes)
- Default credentials
- Environment variables
- Feature roadmap (Phase 1–5)
- Instructions for when owner provides calculation PDFs

#### `ACTIVITY.md` (this file)
Chronological task log — every file created/modified with reasons.

---

## Run Commands Reference

```bash
# Install all deps
npm install

# Create DB (MySQL must be running)
"C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" -u root -pbitsaspidy \
  -e "CREATE DATABASE IF NOT EXISTS jyotish_stack_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations
npm run migrate

# Run seeds (default admin + plans + settings)
npm run seed

# Start development
npm run dev:server    # API on :5000
npm run dev:main      # jyotishstack.com on :3000
npm run dev:admin     # Admin panel on :3004

# Install deps for Next.js UIs after converting
npm install --workspace=ui-main
npm install --workspace=ui-admin
```

---

---

## Session 2 — 2026-06-02 | Next.js Migration + Activity Log

### ✅ TASK-016b — ACTIVITY.md Created
**Status:** Done  
**File:** `ACTIVITY.md` (this file)  
**Purpose:** Comprehensive task-by-task log safe to share with any AI agent.

---

### ✅ TASK-017-PRE — All UIs Migrated from Vite → Next.js 14 (App Router)
**Status:** Done  
**Next.js version:** 14.2.35  
**Pattern:** App Router with `src/` directory

#### Changes per UI package

**`ui-main` (jyotishstack.com, port 3000):**
- `package.json` → removed vite deps, added `next`
- Created `next.config.js` → `/api/*` proxy to `http://localhost:5000`
- Created `src/app/layout.jsx` → server component, loads fonts via `next/font/google` (Inter, Playfair Display, Noto Sans Devanagari), sets metadata
- Created `src/app/globals.css` → Tailwind directives + all custom classes
- Created `src/app/providers.jsx` → `'use client'` shell: LangProvider > AuthProvider > maintenance check > Navbar + Footer layout
- Created `src/app/page.jsx` and sub-routes: `/login`, `/register`, `/dashboard`, `/verify-email`, `/forgot-password`, `/reset-password`, `/kundli`, `/matchmaking`, `/predictions`, `/pricing`
- Created `src/context/LangContext.jsx` → `useLang()` hook, hi/en toggle, localStorage persist
- Updated `src/context/AuthContext.jsx` → added `'use client'`
- Updated `src/components/StarField.jsx` → added `'use client'`
- Updated `src/components/Navbar.jsx` → replaced `react-router-dom` with `next/link` + `usePathname` for active state, `useRouter` for logout redirect; uses `useLang()`
- Updated `src/components/Footer.jsx` → replaced `react-router-dom` with `next/link`; uses `useLang()`
- Created `src/components/ComingSoonPage.jsx` → reusable stub page component
- Updated all pages (`Home`, `Login`, `Register`, `Dashboard`, `ComingSoon`) → added `'use client'`, replaced `react-router-dom` with `next/link` + `useRouter`

**`ui-admin` (port 3004):**
- `package.json` → Vite → Next.js
- Created `next.config.js`, `src/app/layout.jsx`, `src/app/globals.css`
- Created `src/context/AdminAuthContext.jsx` → `useAdminAuth()` — separate from main app auth
- Created `src/components/AdminShell.jsx` → `'use client'` wrapper, checks auth + redirects to `/login`, renders Sidebar + main content
- Updated `src/components/Sidebar.jsx` → `next/link` + `usePathname` + `useAdminAuth`
- Created `src/app/page.jsx` → server redirect to `/dashboard`
- Created `src/app/login/page.jsx` → standalone (wraps its own `AdminAuthProvider`)
- Created `src/app/dashboard/page.jsx` through `email-logs/page.jsx` → each wraps `<AdminShell><PageComponent /></AdminShell>`
- Updated all 8 page components → added `'use client'`; `Dashboard.jsx` uses `next/link`

**`ui-in` (jyotishstack.in, port 3001):**
- Full Next.js setup with Coming Soon page (Hindi-first, countdown, subscribe)

**`ui-ai-com` (jyotishstackai.com, port 3002):**
- Full Next.js setup with English Coming Soon page

**`ui-ai-in` (jyotishstackai.in, port 3003):**
- Full Next.js setup with Hindi Coming Soon page

#### Key Next.js patterns used
| Vite/React Router | Next.js equivalent |
|-------------------|--------------------|
| `<Link to="/path">` | `<Link href="/path">` (from `next/link`) |
| `useNavigate()` + `navigate('/path')` | `useRouter()` + `router.push('/path')` |
| `<NavLink>` (active class) | `<Link>` + `usePathname()` comparison |
| `<Routes><Route path>` | File-based routing in `src/app/` |
| `useParams()` | `useParams()` from `next/navigation` |
| `useSearchParams()` | `useSearchParams()` from `next/navigation` |
| `main.jsx` + `App.jsx` | `layout.jsx` + `providers.jsx` |
| Google Fonts `<link>` in HTML | `next/font/google` in `layout.jsx` |
| `vite.config.js` proxy | `next.config.js` rewrites |

---

## Pending / Next Steps

| Task | Description | Trigger |
|------|-------------|---------|
| TASK-017 | Vedic planet position calculations | Owner provides PDF |
| TASK-018 | Lagna / D1 chart rendering (SVG) | Owner provides PDF |
| TASK-019 | Navamsha (D9) chart | Owner provides PDF |
| TASK-020 | Vimshottari Dasha calculation | Owner provides PDF |
| TASK-021 | Nakshatra calculation (27 stars) | Owner provides PDF |
| TASK-022 | Ashtakoot Guna Milan (matchmaking) | Owner provides PDF |
| TASK-023 | Mangal Dosha detection | Owner provides PDF |
| TASK-024 | Daily/Weekly/Monthly prediction engine | After Kundli engine |
| TASK-025 | Transit (Gochar) predictions | After Kundli engine |
| TASK-026 | Kundli UI pages (create/view/chart) | After Kundli engine |
| TASK-027 | Matchmaking UI | After Guna Milan |
| TASK-028 | ui-in full design (Hindi-first) | Owner direction |
| TASK-029 | ui-ai-com full design (AI-branded) | Owner direction |
| TASK-030 | ui-ai-in full design (AI-branded India) | Owner direction |
| TASK-031 | SMTP configuration for email | Owner provides SMTP creds |
| TASK-032 | Razorpay live key configuration | Owner provides keys |
| TASK-033 | Production deployment (VPS/cloud) | Owner decision |

---

---

## Session 3 — 2026-06-02 | PDF Analysis + Admin Merge + 3 UIs

### ✅ TASK-018 — Vedic Reference Data (PDF: mooltrikone-and-actual-ed-sign.pdf)
**Status:** Done  
**Source:** PDF image provided by owner — full table scanned.

**Migration 005 — `server/src/migrations/005_vedic_reference_data.js`**  
New tables: `zodiac_signs`, `planets`, `planet_dignity`, `nakshatras`, `houses`

**Seed 002 — `server/src/seeds/002_planets.js`**  
9 Navagrahas: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn, Rahu, Ketu  
Fields: name, name_hi, nature, gender, weekday, color, gemstone, metal, direction, body_part, vimshottari_years, characteristics

**Seed 003 — `server/src/seeds/003_zodiac_signs.js`**  
12 Rashis (Aries–Pisces) with element, quality, gender, lord, degrees  
12 Bhavas (Houses) with significations, quality (kendra/trikona/dusthana), karaka

**Seed 004 — `server/src/seeds/004_planet_dignity.js`** ← FROM PDF  
Planet dignity data exactly as per PDF:
| Planet | Exaltation | Debilitation | Mool Trikona |
|--------|-----------|--------------|--------------|
| Sun | Aries 10° | Libra 10° | Leo 0°–20° |
| Moon | Taurus 3° | Scorpio 3° | Taurus 4°–20° |
| Mars | Capricorn 28° | Cancer 28° | Aries 0°–12° |
| Mercury | Virgo 15° | Pisces 15° | Virgo 16°–20° |
| Jupiter | Cancer 5° | Capricorn 5° | Sagittarius 0°–10° |
| Venus | Pisces 27° | Virgo 27° | Libra 0°–15° |
| Saturn | Libra 20° | Aries 20° | Aquarius 0°–20° |

**Seed 005 — `server/src/seeds/005_nakshatras.js`**  
27 Nakshatras with lord, zodiac sign, degrees (sign + absolute 0–360°), deity, deity_hi, guna, gender, caste, varna, animal, tree, vimshottari years

---

### ✅ TASK-019 — House Lord Interpretations (Lord of every house in 12 houses.pdf)
**Status:** Partial — structure done, 1st and 2nd lord fully seeded, placeholders for lords 3-12  
**Note:** PDF could not be read (pdftoppm not installed). 2 lords fully done from classical knowledge. Owner to paste PDF content to complete remaining 120 combinations.

**Migration 006 — `server/src/migrations/006_house_lord_interpretations.js`**  
Table: `house_lord_interpretations` (144 rows, 12 × 12 combinations)  
Fields: house_lord, placed_in_house, title, title_hi, interpretation_en, interpretation_hi, key_results_en (JSON), overall_effect, source

**Seed 006 — `server/src/seeds/006_house_lord_interpretations.js`**  
- 1st house lord × 12 positions: fully written with EN+HI interpretations and key results
- 2nd house lord × 12 positions: fully written
- Lords 3–12: placeholder rows with `[Interpretation pending — update from PDF]`
- **TO UPDATE:** Paste PDF content and replace placeholders

---

### ✅ TASK-020 — Admin Merged into jyotishstack.com
**Status:** Done  
**Access URL:** `jyotishstack.com/admin/login`  
**Approach:** Admin routes added under `ui-main/src/app/admin/` — separate from public routes.

**Key files in ui-main:**
- `src/app/admin/layout.jsx` — imports `AdminShell` (no public Navbar/Footer)
- `src/app/admin/login/page.jsx` — standalone admin login (wraps own AdminAuthProvider)
- `src/app/admin/dashboard/page.jsx` through `email-logs/page.jsx` — 8 protected pages
- `src/admin-components/AdminShell.jsx` — auth guard + Sidebar layout
- `src/admin-components/Sidebar.jsx` — fixed nav links to `/admin/*`
- `src/admin-views/` — 8 page components (Dashboard, Users, Settings, Newsletter, Notifications, EmailBlast, Plans, EmailLogs)
- `src/context/AdminAuthContext.jsx` — admin auth state (separate from user auth)
- `src/app/providers.jsx` — updated to skip Navbar/Footer for `/admin/*` routes
- `src/app/globals.css` — added admin CSS classes (`.admin-card`, `.admin-btn`, `.badge-*`)

**Build result:** 24/24 static pages ✅ (was 14 before)

---

### ✅ TASK-021 — ui-in Full Design Built (jyotishstack.in)
**Status:** Done  
**Theme:** Devotional Saffron — deep maroon background, saffron/gold accents, Devanagari-first  
**Language:** Hindi first, English toggle  
**Features:** Full Home page with Mandala animation, live Rashi carousel, features grid, newsletter

Design elements:
- Background: deep maroon radial gradient (`#2C1510 → #1A0D08 → #120A06`)
- Primary accent: Saffron `#FF9933`
- Fonts: Noto Sans Devanagari, Inter, Playfair Display
- Animated rotating Mandala SVG
- 12-Rashi cycling carousel with live highlight
- All text Hindi-first with `t(hi, en)` language switch

---

### ✅ TASK-022 — ui-ai-com Full Design Built (jyotishstackai.com)
**Status:** Done  
**Theme:** AI Tech — dark navy with electric cyan + violet accents, grid lines  
**Language:** English primary  
**Features:** Animated typewriter headline, stats counter row, features grid, CTA section

Design elements:
- Background: near-black tech dark (`#040810`)
- Primary accent: Cyan `#00D4FF`, secondary: Violet `#7B2FBE`
- Grid SVG background overlay
- Animated glowing orbs
- Typewriter effect on hero subheading
- AI badge with pulsing dot
- Font: Inter + Space Grotesk

---

### ✅ TASK-023 — ui-ai-in Full Design Built (jyotishstackai.in)
**Status:** Done  
**Theme:** Hybrid Saffron + Cyan — combining traditional Indian warmth with AI tech look  
**Language:** Hindi/English toggle (bilingual `t(hi, en)` function throughout)  
**Features:** Hindi-first branding, gradient hero, hybrid feature grid (alternating saffron/cyan)

Design elements:
- Background: deep tech dark (`#060810`) with warm/cool glow orbs
- Primary: Saffron `#FF9933` (Indian), Secondary: Cyan `#00D4FF` (AI)
- Hero gradient spanning both colors
- Feature cards alternating saffron/cyan borders
- All text uses `t(hi, en)` bilingual function

---

### ✅ TASK-024 — House Lord Interpretations COMPLETE (12_HOUSE_LORD.md)
**Status:** Done  
**Source:** `12_HOUSE_LORD.md` (full English text extracted, Hindi ignored as instructed)

**All 144 combinations fully seeded:**
- Lords 1-12, each placed in houses 1-12
- Each entry: `title`, `interpretation_en`, `key_results_en` (JSON array), `overall_effect`
- Viparita Raja Yoga positions correctly marked `positive`:
  - 6th lord in 8th, 6th lord in 12th
  - 8th lord in 6th, 8th lord in 12th
  - 12th lord in 6th, 12th lord in 8th
- Re-run with: `npm run seed`

---

## Session 4 — 2026-06-02 | Vedic Calculation Engine

### ✅ TASK-025 — Planet Calculation Engine Built
**Status:** Done — real astronomical data, not placeholders

**Files created:**
- `server/src/services/ephemeris.service.js` — Astronomical algorithms (Meeus 2nd Ed.)
- `server/src/services/vedic-calc.service.js` — Vedic wrapper (Lahiri, Nakshatra, Dasha)
- `server/src/routes/kundli.routes.js` — Updated with auto-calc + `/recalculate` endpoint

**Algorithms implemented:**
| Function | Source | Accuracy |
|----------|--------|----------|
| Sun longitude | Meeus Ch.25 (equation of center) | ~0.01° |
| Moon longitude | Meeus Ch.47 (60 perturbation terms) | ~0.1° |
| Rahu (mean node) | Meeus Ch.47 | ~0.1° |
| Planets (Mars/Merc/Jup/Ven/Sat) | Meeus Ch.33 Keplerian + helio→geo | ~0.5–2° |
| Ascendant | LST + obliquity formula | ~0.1° |
| Ayanamsa | Lahiri (23.85317° at J2000 + 50.2796"/yr) | ~0.1° |

**Vedic outputs per chart:**
- Sidereal longitudes for all 9 grahas (Sun–Ketu)
- Rashi (sign), degree in sign, DMS format
- Dignity: Exaltation / Moolatrikona / Own Sign / Debilitation / Neutral
- Ascendant rashi + degree
- Nakshatra (27) + Pada (1–4) from Moon's longitude
- Whole-sign house placements (1–12) with planet list per house
- Vimshottari Dasha: full 9-period sequence with start/end dates

**Bug fixed:** MySQL2 returns DATE columns as JS Date objects with UTC timezone shift.
Fix: `typeCast` option added to `knexfile.js` — DATE/DATETIME columns now return as plain "YYYY-MM-DD" strings.

**Test run — Rahul Sharma (1990-05-15, 10:30 IST, New Delhi):**
```
Ascendant:  Cancer (कर्क)         · 99°53'
Sun:        Taurus (वृषभ)         · 0°24'  — Neutral
Moon:       Sagittarius (धनु)     · 29°50' — Neutral (Nakshatra: Uttara Ashadha, Pada 1)
Mars:       Aquarius (कुम्भ)      · 24°30' — Neutral
Mercury:    Aries (मेष)           · 14°28' — Neutral
Jupiter:    Gemini (मिथुन)        · 15°54' — Neutral
Venus:      Pisces (मीन)          · 18°54' — Exaltation (उच्च) ✓
Saturn:     Capricorn (मकर)       · 1°43'  — Own Sign (स्वगृह) ✓
Rahu:       Capricorn             · 17°37' — shadow
Ketu:       Cancer                · 17°37' — shadow
Current Dasha: Sun (1990 → 1994-12)
```

**UI updated:** `KundliDetail.jsx` now shows:
- South Indian 4×4 chart with real planets in houses
- Planet table: sign, DMS degree, house, dignity badge
- Vimshottari Dasha timeline (9 periods, current highlighted)
- 12-house grid with lord and planets in each house
- Recalculate button

*Maintained by: AI Agent (Claude Sonnet 4.6) · Project: Jyotish Stack AI*

---

## Session 5 - 2026-06-02 | Calculation Verification

### Done TASK-026 - Retrograde Motion + Server Tests
**Status:** Done
**Agent:** Alex (Codex)

**Files updated:**
- `server/src/services/vedic-calc.service.js`
- `server/tests/vedic-calc.test.js`
- `server/package.json`
- `package.json`
- `MEMORY.md`

**Changes:**
- Replaced hardcoded `is_retrograde: false` with apparent sidereal daily-motion detection.
- Added `daily_motion` to each planet output for audit/debug.
- Sun and Moon are forced non-retrograde.
- Mercury, Venus, Mars, Jupiter, Saturn, Rahu, and Ketu use negative daily motion to determine retrograde state.
- Exported calculation helpers: `tropicalLongitudeForPlanet`, `siderealLongitudeForPlanet`, `dailyMotionForPlanet`, `isRetrogradePlanet`.
- Added Node built-in test runner coverage for the documented Rahul Sharma chart, retrograde flags, daily motion helper consistency, and rashi/nakshatra boundaries.

**Reference note:**
- A temporary `swisseph` install was attempted for one-time Swiss Ephemeris reference output, but failed on Windows during npm execution. No Swiss package was added to production or dev dependencies.
- Current tests lock the documented project reference chart from Session 4. Exact Swiss/Panchang certification still requires owner-approved reference values or a licensed reference workflow.

**Verification:**
```bash
node --check server/src/services/vedic-calc.service.js
node --check server/tests/vedic-calc.test.js
npm run test:server
```

Result: 4/4 server calculation tests passed.

---

## Session 6 - 2026-06-02 | Product Completion Slice

### Done TASK-027 - D9, Antardasha, Matchmaking, Gochar, Predictions, PDF, UI Flows
**Status:** Done
**Agent:** Alex (Codex)

**Files updated/created:**
- `server/src/services/vedic-calc.service.js`
- `server/src/services/report.service.js`
- `server/src/routes/kundli.routes.js`
- `server/tests/vedic-calc.test.js`
- `ui-main/src/views/KundliManager.jsx`
- `ui-main/src/views/Matchmaking.jsx`
- `ui-main/src/views/Predictions.jsx`
- `ui-main/src/views/KundliDetail.jsx`
- `ui-main/src/app/kundli/page.jsx`
- `ui-main/src/app/kundli/new/page.jsx`
- `ui-main/src/app/matchmaking/page.jsx`
- `ui-main/src/app/predictions/page.jsx`
- `MEMORY.md`
- `ACTIVITY.md`

**Calculation changes:**
- Added D9/Navamsha chart generation for ascendant, planets, and whole-sign D9 houses.
- Added Vimshottari Antardasha under every Mahadasha and deterministic current-period marking.
- Added Mangal Dosha checks from Lagna, Moon, and Venus with severity/cancellation summary.
- Added Ashtakoot Guna Milan scoring with 8 kootas, total out of 36, verdict, and Mangal compatibility.
- Added Gochar transit summary with current graha positions, Sade Sati, Jupiter support, and Rahu-Ketu axis.
- Added rule-based prediction summaries and category guidance from dasha, gochar, and Mangal Dosha.

**API changes:**
- `POST /api/kundli/matchmaking/request` now calculates and stores completed Ashtakoot results.
- `GET /api/kundli/matchmaking/list` now sits before `/:id`, fixing route shadowing.
- Matchmaking now checks ownership for both Kundli profiles.
- Added authenticated PDF exports:
  - `GET /api/kundli/:id/report.pdf`
  - `GET /api/kundli/matchmaking/:id/report.pdf`

**UI changes:**
- Replaced Coming Soon pages with real flows for `/kundli`, `/kundli/new`, `/matchmaking`, and `/predictions`.
- Kundli detail now shows D9/Navamsha, Antardasha, Mangal Dosha, Gochar, prediction summaries, and PDF export.
- Kundli manager supports create/list/open/report export.
- Matchmaking supports select profiles, calculate Ashtakoot, view history, and export PDF.
- Predictions page shows current Mahadasha/Antardasha, gochar highlights, categories, remedies, and export.

**Verification:**
```bash
node --check server/src/services/vedic-calc.service.js
node --check server/src/routes/kundli.routes.js
node --check server/src/services/report.service.js
node --check server/tests/vedic-calc.test.js
npm run test:server
npm run build:main
```

Result:
- Server tests: 9/9 passed.
- `ui-main` production build: passed, 25/25 pages generated.

**Still pending:**
- Owner-approved Panchang/Swiss Ephemeris certification values for production trust.
- Dashakoot compatibility.
- Detailed Nakshatra report.
- Daily Rashi horoscope and annual Varshphal.
- True AI-generated personalized predictions beyond the current rule engine.

---

## Session 7 - 2026-06-02 | Varga Reference Tables + Extended Divisional Calculations

### Done TASK-028 - Owner PDF Varga Data, Database Seed, Calculation Upgrade
**Status:** Done
**Agent:** Alex (Codex)

**Source provided:**
- `C:\Users\Asus Vivobook\.codex\attachments\e7cfcb97-d802-4794-8cc3-829c19e68760\pasted-text.txt`
- Copied PDF text covering Shodash/extended Varga charts, master family references, and relationship/family chart usage.

**Files updated/created:**
- `server/src/data/varga-reference.js`
- `server/src/migrations/007_varga_reference_data.js`
- `server/src/seeds/007_varga_reference_data.js`
- `server/src/services/vedic-calc.service.js`
- `server/tests/vedic-calc.test.js`
- `MEMORY.md`
- `ACTIVITY.md`

**Database changes:**
- Added `varga_charts` for D1, D2, D3, D4, D5, D7, D8, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, and D60 definitions.
- Added `varga_family_references` for master relationship/family topics from the pasted PDF text.
- Added `varga_chart_relationships` for chart-specific family, spouse, parents, siblings, children, health, karma, and spiritual references.
- Seeded reference data with 18 chart definitions, 15 family reference rows, and 62 chart relationship rows.

**Calculation changes:**
- `calculateVedicChart()` now returns `varga_charts` and `divisional_charts` for all 18 supported Varga charts.
- Existing `chart.navamsha` and `chart.divisional_charts.d9` are preserved for UI/API compatibility.
- Added reusable helpers: `vargaPlacementFromDeg()`, `calculateVargaChart()`, and `calculateAllVargaCharts()`.
- Added special rules for D2 Hora and D30 Trimshamsha, plus standard sequence rules for supported equal-division Vargas.

**Important accuracy note:**
- High divisional charts, especially D16, D20, D24, D27, D40, D45, and D60, are highly birth-time-sensitive.
- These formulas are implemented from the owner-provided pasted Varga reference plus standard rule variants, but production trust still needs owner-approved classical references and Panchang/Swiss Ephemeris case validation.

**Verification:**
```bash
node --check server/src/services/vedic-calc.service.js
node --check server/src/data/varga-reference.js
node --check server/src/migrations/007_varga_reference_data.js
node --check server/src/seeds/007_varga_reference_data.js
node --check server/tests/vedic-calc.test.js
npm run test:server
npm run migrate
node node_modules/knex/bin/cli.js --knexfile server/knexfile.js seed:run --specific=007_varga_reference_data.js
npm run build:main
git diff --check
```

Result:
- Server tests: 12/12 passed.
- Migration 007 applied successfully after fixing a MySQL constraint-name length issue.
- Local DB seed counts verified: `varga_charts=18`, `varga_family_references=15`, `varga_chart_relationships=62`.
- `ui-main` production build: passed, 25/25 pages generated.
- `git diff --check`: no whitespace errors; only expected LF/CRLF warnings on Windows.

---

## Session 8 — 2026-06-02 | Bug Fixes + Drishti/BhavKarak/Digbala + Edit Modal + Nakshatra PDF

### ✅ TASK-029 — MySQL Sort Memory Crash Fix
**Status:** Done  
**Files:** `server/src/routes/kundli.routes.js`, `server/src/migrations/008_kundli_list_index.js`

**Problem:** `GET /api/kundli` crashed with `ER_OUT_OF_SORTMEMORY` because `SELECT *` fetched huge `calculated_data` JSON blobs and MySQL exhausted its sort buffer executing `ORDER BY created_at DESC`.

**Fix 1:** List endpoint now selects 12 lightweight columns explicitly, excluding `calculated_data` (which is only needed in `GET /:id`).  
**Fix 2:** Migration 008 added composite index `(user_id, created_at)` so MySQL can satisfy the WHERE filter and ORDER BY from the index alone — no filesort.

---

### ✅ TASK-030 — toDMS Carry-over Bug Fix
**Status:** Done  
**File:** `server/src/services/vedic-calc.service.js`

**Problem:** `toDMS()` did not carry over when `Math.round()` pushed seconds to 60 (or minutes to 60), producing invalid strings like `22°59'60"` or display anomalies.

**Fix:** Added carry-over after rounding:
```js
if (s >= 60) { s -= 60; m += 1; }
if (m >= 60) { m -= 60; d += 1; }
```
Verified: `toDMS(29.9999999)` → `30°00'00"` ✓

---

### ✅ TASK-031 — Graha Drishti, Bhav Karak, Digbala
**Status:** Done  
**Source:** `Drishti, Bhav Karak and Digbala.pdf`

**Files created/updated:**
- `server/src/services/vedic-calc.service.js` — 3 new functions + wired into `calculateVedicChart()`
- `server/src/migrations/009_drishti_bhavkarak_digbala.js` — 3 new reference tables
- `server/src/seeds/008_drishti_bhavkarak_digbala.js` — full seed for all rules
- `ui-main/src/views/KundliDetail.jsx` — 3 new panels in Kundli detail page

**New functions:**

| Function | Description |
|----------|-------------|
| `calculateGrahaDrishti(ascRashiNum, planets)` | Returns `by_planet` (each planet → houses it aspects) and `by_house` (each house → planets aspecting it). Full aspect offsets from PDF. |
| `calculateBhavKarak(ascRashiNum, planets)` | For each of 12 houses: karak planets + their live placement quality (trikona/kendra/other) + Karako Bhava Nashaya flag. |
| `calculateDigbala(ascRashiNum, planets)` | Directional strength for 7 planets: `has_digbala`, `has_digbala_loss`, `strength_percent` (0–100 linear from strong house). |

**Drishti aspect rules (from PDF):**
| Planet | Aspects |
|--------|---------|
| Sun, Moon, Mercury, Venus | 7th only |
| Mars | 4th, 7th, 8th (aggressive) |
| Jupiter | 5th, 7th, 9th (auspicious) |
| Saturn | 3rd, 7th, 10th (restricting) |
| Rahu, Ketu | 5th, 7th, 9th (karmic) |

**Digbala strong houses (from PDF):**
| Planet | Strong House | Direction |
|--------|-------------|-----------|
| Jupiter, Mercury | 1st | East |
| Sun, Mars | 10th | South |
| Saturn | 7th | West |
| Moon, Venus | 4th | North |

**DB tables added:** `graha_drishti_rules` (19 rows), `bhav_karak` (17 rows), `digbala_rules` (7 rows).  
**UI panels added:** Digbala (strength bars), Bhav Karak (12-house grid), Graha Drishti (by-planet + by-house views).

---

### ✅ TASK-032 — Edit Birth Details + Location Picker
**Status:** Done  
**File:** `ui-main/src/views/KundliDetail.jsx`

**Feature:** `✏️ Edit Details` button opens a modal with full birth detail editing.

**Location picker:** Nominatim (OpenStreetMap) geocoding — completely free, no API key.  
- Type city name → search → dropdown of results → select → auto-fills latitude, longitude, timezone (IST heuristic for India).  
- OpenStreetMap iframe embed shows live map pin at selected coordinates.  
- `timezone_offset` dropdown covers all standard UTC offsets (half-hour granularity).

**Save flow:** `PATCH /api/kundli/:id` → `POST /api/kundli/:id/recalculate` → `fetchKundli()` re-loads fresh chart.

**Stale cache cleared:** 2 existing kundli `calculated_data` nulled so they recalculate on next visit.

---

### ✅ TASK-033 — Nakshatra Table Data (AstroAnsh Class 8 PDF)
**Status:** Done  
**Source:** `AstroAnsh Class 8 — Nakshatra Table Sheet.pdf`

**Files updated/created:**
- `server/src/migrations/010_nakshatra_gandmool.js` — adds `is_gandmool` BOOLEAN column to `nakshatras`
- `server/src/seeds/005_nakshatras.js` — re-seeded with exact deity names + `is_gandmool` for all 27
- `server/src/services/vedic-calc.service.js` — `NAKSHATRAS` array updated with `deity_en`, `deity_hi`, `is_gandmool`
- `MEMORY.md` — Section 13 added with full nakshatra reference table
- `ACTIVITY.md` — This entry

**Data added per nakshatra:**
- `deity_en` — English deity name (from PDF, e.g. "Tvashtar / Vishwakarma" for Chitra)
- `deity_hi` — Hindi deity name
- `is_gandmool` — boolean (true for 6 nakshatras)

**Gandmool nakshatras (6 of 27):**
- Ketu's 3 (ALL gandmool): Ashwini (1), Magha (10), Mula (19)
- Mercury's 3 (ALL gandmool): Ashlesha (9), Jyeshtha (18), Revati (27)

**Corrections from PDF:**
- Chitra deity updated from "Vishwakarma" → "Tvashtar / Vishwakarma" (PDF shows both names)
- Dhanishtha deity corrected from "Ashtavasus" → "Vasus" (PDF text)
- Purva Ashadha deity clarified as "Apas (Water)" / "आपः / जल"

**DB verification:**
```
Total rows: 27
Gandmool nakshatras (6): 1-Ashwini, 9-Ashlesha, 10-Magha, 18-Jyeshtha, 19-Mula, 27-Revati
```

**Service verification:** `nakshatraFromDeg()` now returns `deity_en`, `deity_hi`, `is_gandmool` in every nakshatra object.

---

---

## Session 9 — 2026-06-03 | Detailed Nakshatra Notes (EN + HI)

### ✅ TASK-034 — Nakshatra Detailed Notes Added to Database
**Status:** Done
**Source:**
- `DETAILED_NAKSHATRA_NOTES.md` — English detailed notes (all 27 nakshatras, AstroAnsh Class 9)
- `AstroAnsh Class 9 - Detailed Nakshtra Notes Hindi.pdf` — Hindi translation (PDF text extraction unavailable on this machine; Hindi content written from classical Jyotish knowledge)

**Files created/updated:**
- `server/src/migrations/011_nakshatra_detailed_notes.js` — adds 12 new columns to `nakshatras` table
- `server/src/seeds/005_nakshatras.js` — re-seeded with full EN + HI detailed notes for all 27

**12 new columns added to `nakshatras`:**
| Column | Type | Description |
|--------|------|-------------|
| `characteristics_en` | TEXT | Core personality traits (English) |
| `characteristics_hi` | TEXT | Core personality traits (Hindi) |
| `negative_traits_en` | TEXT | Negative tendencies (English) |
| `negative_traits_hi` | TEXT | Negative tendencies (Hindi) |
| `professions_en` | LONGTEXT (JSON) | Array of {category, roles[]} (English) |
| `professions_hi` | LONGTEXT (JSON) | Array of {category, roles[]} (Hindi) |
| `health_issues_en` | TEXT | Common health issues (English) |
| `health_issues_hi` | TEXT | Common health issues (Hindi) |
| `health_root_cause_en` | TEXT | Root causes of health issues (English) |
| `health_root_cause_hi` | TEXT | Root causes of health issues (Hindi) |
| `health_guidance_en` | TEXT | Health guidance (English) |
| `health_guidance_hi` | TEXT | Health guidance (Hindi) |

**Data coverage per nakshatra:**
- 4–6 core characteristics (EN + HI)
- 3–4 negative traits (EN + HI)
- 4 profession categories × 4–7 roles each (EN + HI, JSON)
- Health issues, root causes, and guidance (EN + HI)

**DB verification:**
```
Total rows: 27
Spot checks: Punarvasu (7), Revati (27) — all 12 new fields populated ✓
Gandmool flag: Revati is_gandmool = 1 ✓
```

**Run commands:**
```bash
npm run migrate                    # applies 011_nakshatra_detailed_notes
node node_modules/knex/bin/cli.js --knexfile server/knexfile.js seed:run --specific=005_nakshatras.js
```

---

---

## Session 10 — 2026-06-03 | Kundli UI Upgrade: Navamsha Toggle + Basic Details + Personality Insights

### ✅ TASK-035 — Panchang + Astro Details Engine
**Status:** Done  
**File:** `server/src/services/vedic-calc.service.js`

**New functions added:**
| Function | Returns |
|----------|---------|
| `hinduMasa(sunSidLon)` | Lunar month name (EN + HI) |
| `calculateNityaYoga(sun, moon)` | 27 Nitya Yogas from Sun+Moon |
| `calculateTithi(sun, moon)` | Paksha + tithi name EN/HI |
| `calculateKarana(sun, moon)` | Karana name (movable/fixed) |
| `calculateVara(y,m,d,h,min,tz)` | Day of week EN + HI |
| `calculatePahar(hour, min, sunriseMins)` | Watch of day (1-8) |
| `sunriseSunset(lat, lon, y, m, d, tz)` | Sunrise/sunset HH:MM AM/PM |
| `calculateAstroDetails(...)` | Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya |
| `calculatePanchang(...)` | Combined panchang bundle |

**New lookup tables:** `NAK_AKSHAR` (syllables per nakshatra/pada), `MASA_NAMES`, `NITYA_YOGA_NAMES`, Vara names, Karana names.

**Calculation accuracy verified against Jodhpur 23/01/1989:**
| Field | Calculated | Expected |
|-------|-----------|----------|
| Masa | Pausa ✓ | Pausa |
| Tithi | Krishna Dwitiya ✓ | Krishna Dwitiya |
| Yoga | Ayushman ✓ | Ayushman |
| Karana | Taitila ✓ | Taitila |
| Sunrise | 07:27 AM ✓ | ~07:25 AM |
| Sunset | 06:15 PM ✓ | ~06:13 PM |
| Varna | Brahmin/Vipra ✓ | Vipra |
| Vashya | Jalachara ✓ | Jalchar |
| Gana | Rakshasa ✓ | Rakshasa |
| Nadi | Antya ✓ | Ant |
| Tatva | Water ✓ | Water |
| Yunja | Madhya ✓ | Madhya |
| Naam Akshar | Du ✓ | Du |
| Paya | Silver ✓ | Silver |

**`calculateVedicChart()` now returns:**
- `chart.panchang` — masa, tithi, vara, yoga, karana, pahar, moon_phase, sunrise, sunset
- `chart.astro_details` — all 14 astro fields (varna through paya)

---

### ✅ TASK-036 — Nakshatra Insight from DB (Route Update)
**Status:** Done  
**File:** `server/src/routes/kundli.routes.js`

**Changes:**
- Added `fetchNakshatraInsight(nakNum)` helper — queries `nakshatras` table for Moon's nakshatra (1-27), returns characteristics, professions (parsed JSON), health data in EN + HI
- `GET /api/kundli/:id` — now includes `profile.nakshatra_insight` in response
- `POST /api/kundli/:id/recalculate` — now includes `profile.nakshatra_insight` in response

---

### ✅ TASK-037 — KundliDetail UI: 3 Feature Upgrades
**Status:** Done  
**File:** `ui-main/src/views/KundliDetail.jsx`

#### 1. Navamsha Chart — North/South Style Toggle
- Navamsha (D9) now mirrors the D1 Lagna chart style (North or South Indian)
- Toggling "◇ North Indian / ◈ South Indian" applies to **both** charts simultaneously
- Default changed to **North Indian** (was South Indian before)

#### 2. Basic Details Panel — Tabbed Card (3 sections)
Replaced flat "Birth Details" card with a tabbed panel:

| Tab | Fields |
|-----|--------|
| **Basic Details** | Name, Place, Date, Time, Lat, Lon, Timezone, Sunrise, Sunset, Ayanamsha |
| **Ghat Chakra** | Month (Masa), Tithi, Day (Vara), Nakshatra, Nitya Yoga, Karana, Pahar, Moon Phase |
| **Astro Details** | Ascendant, Ascendant Lord, Varna, Vashya, Yoni, Gan, Nadi, Sign Lord, Sign, Nakshatra, Nakshatra Lord, Charan, Yoga, Karan, Tithi, Yunja, Tatva, Name Alphabet, Paya |

#### 3. Personality Insights Panel — Nakshatra-Based (3 tabs)

| Tab | Content |
|-----|---------|
| **Traits** | Core characteristics + What to Avoid (negative traits) — EN or HI from DB |
| **Career** | 4 profession categories as pill-tag chips — EN or HI from DB |
| **Health** | Common health issues, root causes, guidance — EN or HI from DB |

Data source: `nakshatras` table detailed notes (seeded in Session 9, migration 011).

**Bug fix:** Cleared stale `.next` webpack cache after multiple file changes — fresh build runs clean (25/25 pages ✓).

**Server tests:** 12/12 passing.

---

---

## Session 11 — 2026-06-03 | Life Portrait + Rich Prediction Engine

### ✅ TASK-038 — Life Portrait Panel + Expanded Prediction Engine
**Status:** Done
**Files updated:**
- `server/src/services/vedic-calc.service.js`
- `ui-main/src/views/KundliDetail.jsx`
- `ui-main/src/views/Predictions.jsx`

#### Server — `generateRuleBasedPredictions()` fully rewritten

**New reference data added:**
- `LAGNA_PORTRAIT` — 12 lagna portrait paragraphs (who you are, outer personality)
- `MOON_SIGN_PORTRAIT` — 12 moon sign emotional portraits
- `DASHA_LORD_MEANINGS` — 9 planets with full paragraphs for: career, relationships, health, finance, spirituality, opportunities, cautions
- `SADE_SATI_DESC` — 4 phase descriptions (rising, peak, setting, none)

**New prediction output structure:**
```javascript
predictions: {
  portrait: {
    lagna_en,       // paragraph: who you are from Lagna
    moon_en,        // paragraph: your emotional world from Moon
    nakshatra_en,   // paragraph: your soul nature from Nakshatra
    combined_en,    // 2-sentence overall identity summary
  },
  current_period: {
    mahadasha: { lord, end, nature },
    antardasha: { lord, end, nature },
    combined_en,    // full paragraph: what this dasha combination means
  },
  life_areas: {
    career:        { outlook, description_en, keywords },
    relationships: { outlook, description_en, keywords },
    health:        { outlook, description_en, keywords },
    finance:       { outlook, description_en, keywords },
    spirituality:  { outlook, description_en, keywords },
  },
  gochar_narrative: {
    sade_sati: { active, phase, description_en },
    jupiter:   { favorable, description_en },
    rahu_ketu: { axis, description_en },
    overall_en,
  },
  current_challenges: [],  // list of things to watch
  current_opportunities: [],  // list of things going well
  remedies: [],            // dasha-based remedies (placeholder for PDF)
  summary_en: [],          // legacy 5-line format (backwards compat)
  categories: {},          // legacy field (backwards compat)
}
```

#### KundliDetail — `LifePortraitPanel` component added
- New panel with 2 tabs: **Who You Are** | **Current Period**
- "Who You Are" tab: Lagna portrait, Moon portrait, Nakshatra soul paragraphs (narrative, not raw data)
- "Current Period" tab: Mahadasha + Antardasha badges with dates, combined meaning paragraph, mahadasha nature
- Inserted after PersonalityInsights panel in the right column
- Data sourced from `chart.predictions.portrait` and `chart.predictions.current_period`

#### Predictions page — fully rebuilt
- **Identity Banner**: Name, Lagna, Moon, Nakshatra + combined portrait sentence
- **Who You Are**: Lagna portrait, Moon portrait, Nakshatra soul — all rich paragraphs
- **What This Period Means**: Dasha badges + detailed combined meaning paragraph
- **Life Area Readings** (5 collapsible cards): Career, Relationships, Health, Finance, Spirituality — each with outlook badge and detailed paragraph
- **Opportunities & Challenges**: Tabbed card with bullet items
- **Transit Influences**: Sade Sati (active/inactive with phase description), Jupiter transit, Rahu-Ketu axis — all with detailed paragraphs
- **Remedies**: Dasha-appropriate remedies (placeholder for PDF; will be enhanced when owner provides remedy PDF)

**Remedy structure is ready** — `predictions.remedies[]` in the API, `<RemediesCard>` in the UI. When the owner provides the remedy PDF, populate this array from the DB.

**Verification:**
```
node --check server/src/services/vedic-calc.service.js  ✓
npm run test:server  → 12/12 passed
npm run build:main   → 25/25 pages
```

---

## Session 11 (continued) — Remedy PDF Integration

### ✅ TASK-039 — Vedic Jyotish Remedial Manual → DB + UI
**Status:** Done
**Source:** `Remedy Class 1 Notes - 4th May 2026.pdf` (AstroAnsh by Saiansh Arya)
**Files created/updated:**
- `server/src/migrations/012_remedy_data.js`
- `server/src/seeds/009_remedy_data.js`
- `server/src/routes/kundli.routes.js`
- `ui-main/src/views/Predictions.jsx`

#### 4 subtasks completed:

**A — Migration (012_remedy_data.js)**
3 new tables:
- `remedy_planets` — 9 Navagrahas with Ishta Devata, mantras EN+HI, special notes EN+HI
- `remedy_problems` — 7 specific life problems with prescribed mantras from Section 7 of PDF
- `remedy_puja_steps` — 5 steps of the daily puja sequence from Section 6 of PDF

**B — Seed (009_remedy_data.js)**
From PDF — all data bilingual (EN + HI):
- 9 rows in `remedy_planets`:
  Sun→Rama/SuryaNarayan, Moon→Krishna/Shiva, Mars→Hanuman/Kartikeya/Narsimha,
  Mercury→Vishnu, Jupiter→Vishnu/Brihaspati, Venus→Lakshmi/Parvati,
  Saturn→Shani/Bhairava/Rudra, Rahu→Durga/Kali, Ketu→Ganesha
- 7 rows in `remedy_problems`:
  Diseases, Debts, Miscarriage, Anger/Aggression, Vastu Dosh, Wealth, Intelligence/Learning
- 5 rows in `remedy_puja_steps`:
  Step 0 (Ganesh invocation), 1 (Ishta Devata), 2 (Lagna Lord), 3 (Atmakarak), T&C (Shakti Pujan)

**C — Server (kundli.routes.js)**
- Added `fetchDashaRemedies(dashaLord, lagnaLord)` helper
- Queries `remedy_planets` for current Mahadasha lord + Lagna lord
- Includes complete `puja_sequence` from `remedy_puja_steps`
- Returns `remedy_data: { dasha_planet, lagna_planet, puja_sequence }` in both:
  - `GET /api/kundli/:id`
  - `POST /api/kundli/:id/recalculate`

**D — UI (Predictions.jsx)**
`RemediesCard` component rebuilt with 3 tabs:
- **Dasha Remedy** — Current Mahadasha planet: Ishta Devata (EN+HI), prescribed mantras (EN+HI), special notes (EN+HI)
- **Lagna Remedy** — Lagna lord planet: same structure
- **Puja Sequence** — Step-by-step daily puja with step number circles, action EN+HI, description EN+HI, conditional step marked orange

**DB verification:**
```
remedy_planets: 9 ✓
remedy_problems: 7 ✓
remedy_puja_steps: 5 ✓
```
**Build:** 25/25 pages ✓

**Note for next PDF uploads:** When owner provides Remedy Class 2, 3, etc., add new rows to `remedy_problems` and `remedy_planets` via new seed files without touching the migration. The UI picks them up automatically.

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 22 — 2026-06-03 | Kundli Bug-Fix Pass: Hindi Depth, Remedies Alignment, Practical Interpretation UI

### ✅ TASK-053 — Fix Kundli List Pending Lagna/Nakshatra/Dasha
**Status:** Done
**Agent:** Alex / Codex

**Files updated:**
- `server/src/routes/kundli.routes.js`
- `ui-main/src/views/KundliManager.jsx`

**Change:** `GET /api/kundli` still avoids returning the full `calculated_data` blob in the sorted list query, but now attaches a lightweight `chart_summary` containing Lagna, Nakshatra, current Mahadasha, current Antardasha, and calculated status. `KundliManager` reads this summary so cards no longer show `Pending` for already-calculated Kundlis.

---

### ✅ TASK-054 — Improve Hindi Prediction and Life Portrait Depth
**Status:** Done

**Files updated:**
- `ui-main/src/lib/astroI18n.js`
- `server/src/services/life-report.service.js`

**Change:** Hindi UI now ignores short saved Hindi snippets and falls back to richer generated Hindi paragraphs for portrait, current period, and prediction summary. Life Report profile Hindi summaries were expanded for Lagna, Moon sign, Nakshatra, current Dasha, and Atmakaraka.

---

### ✅ TASK-055 — Align Isht Devata Between Life Report and Predictions
**Status:** Done

**File updated:**
- `ui-main/src/views/Predictions.jsx`

**Change:** Predictions now shows a separate **Chart Isht Devata** tab sourced from `chart.life_report.ishta_devata`, matching Life Report. Dasha/Lagna remedy devatas are now labelled as **Remedy Devata**, avoiding confusion with the personal Isht Devata calculation.

---

### ✅ TASK-056 — Practical Varga, Digbala, Bhav Karak, and Drishti Interpretation
**Status:** Done

**Files updated:**
- `server/src/services/life-report.service.js`
- `server/src/services/helpers/drishti-bhavkarak.js`
- `ui-main/src/views/KundliDetail.jsx`

**Change:**
- Varga analysis now includes role, practical summary, benefits, watch points, and remedies per divisional chart.
- Varga UI removes calculation-rule/reference clutter from the user-facing panel and focuses on practical chart role and results.
- Digbala now explains effect, benefit, caution, and remedy per planet.
- Bhav Karak now explains benefits, danger signals, and remedies per house.
- Graha Drishti now has a plain-language house-by-house explanation for aspects on planets, empty houses, and signs.

---

### ✅ TASK-057 — Yoga/Dosha Cancellation and Missing Tabs
**Status:** Done

**Files updated:**
- `server/src/services/helpers/yogas-doshas.js`
- `server/src/services/helpers/detailed-reports.js`
- `ui-main/src/views/KundliDetail.jsx`

**Change:**
- Yoga/Dosha detection now adds `cancellation_status`, `is_cancelled`, `relief_en`, and `relief_hi`.
- Yoga cards show whether the result is active, modified, relieved, or active with relief.
- Yogas & Doshas panel now renders the previously empty **Yoga + Dasha** and **Event Timing** tabs using `chart.reports`.

---

### ✅ TASK-058 — Improve UI Readability
**Status:** Done

**Files updated:**
- `ui-main/src/app/globals.css`
- `ui-main/src/views/KundliDetail.jsx`
- `ui-main/src/views/Predictions.jsx`

**Change:** Lightened page/card backgrounds, strengthened low-opacity ivory text classes, improved Devanagari readability, and raised several inline text colors in the updated panels.

---

### Verification
```bash
node --check server/src/routes/kundli.routes.js
node --check server/src/services/helpers/drishti-bhavkarak.js
node --check server/src/services/helpers/yogas-doshas.js
node --check server/src/services/life-report.service.js
npm.cmd run test:server   # 14/14 passed
npm.cmd run build:main    # Next build compiled; 25/25 static pages generated
```

**Browser smoke note:** attempted local browser smoke after build. Existing dev server on port 3000 had stale `.next` runtime errors, production `next start` on port 3001 returned generic 500 for all routes, and clean dev server on 3002 timed out during local startup. The extra 3001/3002 processes started by Codex were stopped. Compile/test validation passed.

*Last updated: 2026-06-03 | Agent: Alex / Codex*

---

## Session 23 — 2026-06-03 | Kundli Summary Undefined Placement Fix

### ✅ TASK-059 — Fix `undefined` Lagna Lord House Text in Plain-Language Kundli Summary
**Status:** Done
**Agent:** Alex / Codex

**Files updated:**
- `ui-main/src/components/KundliInsightPanel.jsx`

**Change:**
- Fixed the Summary tab sentence that could render: `House undefined (undefined)` and `core life energy flows toward undefined`.
- Added shared house-normalization helpers that derive a planet's house from Lagna rashi + planet rashi when saved chart JSON does not contain `planet.house`.
- Updated Summary, Your Planets, Your Houses, and Health Guide in `KundliInsightPanel` to use normalized placements.
- Corrected the local fallback sign-lord map and now prefers backend `chart.ascendant.rashi_lord` for Lagna lord display.
- Added safe `Pending` display text for rare cases where a house cannot be derived.

**Verification:**
```bash
npm.cmd run build:main    # Next build compiled; 25/25 static pages generated
```

*Last updated: 2026-06-03 | Agent: Alex / Codex*

---

## Session 24 — 2026-06-03 | Predictions Page Kundli Selection Fix

### ✅ TASK-060 — Open Predictions for the Clicked/Latest Kundli
**Status:** Done
**Agent:** Alex / Codex

**Files updated:**
- `ui-main/src/lib/kundliLinks.js`
- `ui-main/src/views/Predictions.jsx`
- `ui-main/src/views/KundliDetail.jsx`
- `ui-main/src/views/KundliManager.jsx`
- `ui-main/src/views/Dashboard.jsx`

**Change:**
- Added a shared `predictionHref(uuid)` helper so prediction links can carry the target Kundli UUID as `?kundli=<uuid>`.
- Predictions page now reads the URL Kundli parameter and selects that profile before falling back to the newest profile from `/api/kundli`.
- Kundli detail bottom Predictions button now opens predictions for the current Kundli, not a previously viewed/default profile.
- Meri Kundli cards now include a per-profile Predictions button.
- Dashboard Predictions card now links to the latest Kundli from the newest-first Kundli list.
- Profile selector on the Predictions page updates the URL when the user switches profiles, keeping refresh/back behavior aligned.

**Verification:**
```bash
npm.cmd run build:main    # Next build compiled; 25/25 static pages generated
```

*Last updated: 2026-06-03 | Agent: Alex / Codex*

---

## Session 12 — 2026-06-03 | Yogas & Doshas — Reference DB + Live Detection + UI Panel

### ✅ TASK-040 — Yogas & Doshas from AstroAnsh Class 11 & 12 PDF
**Status:** Done
**Source:** `AstroAnsh Class 11 and 12 Premium Notes - Yogas and Doshas.pdf` (31 pages, BPHS-based)

**Files created/updated:**
- `server/src/migrations/013_yogas_doshas.js`
- `server/src/seeds/010_yogas_doshas.js`
- `server/src/services/vedic-calc.service.js`
- `ui-main/src/views/KundliDetail.jsx`
- `ACTIVITY.md`

#### A — Migration (013_yogas_doshas.js)
2 new reference tables:
- `yogas_library` — 12 yogas with EN+HI definitions, formation rules, symptoms, effects, cancellation conditions
- `doshas_library` — 14 dosha rows (13 types; Grahan split into Surya + Chandra) with same structure + technical_note

#### B — Seed (010_yogas_doshas.js)
Complete bilingual data from PDF:

**12 Yogas seeded:**
| Yoga | Category |
|------|----------|
| Gajakesari Yoga | power |
| Budh-Aditya Yoga | intellect |
| Neech Bhanga Raj Yoga | power |
| Saraswati Yoga | wisdom |
| Kalaneedhi Yoga | wealth |
| Chandra-Mangal Laxmi Yoga | wealth |
| Dhan Yoga (incl. Laxmi, Adhi, Maha Dhan) | wealth |
| Raj Yoga | power |
| Vipreet Raj Yoga (Harsha/Sarala/Vimala) | power |
| Parivartan Yoga (Raj/Dhan/Dusthana) | general |
| Guru-Aditya Yoga | wisdom |
| Shatru Hanta Yoga | victory |

**14 Dosha rows seeded:**
| Dosha | Category |
|-------|----------|
| Pitru Dosha | karmic |
| Surya-Shani Vish Dosha | vish |
| Mangal-Shani Vish Dosha | vish |
| Moon-Shani Vish Dosha | vish |
| Amavasya Dosha | luminary |
| Angarak Dosha (Mars+Rahu) | vish |
| Shaapit Dosha (Saturn+Rahu) | karmic |
| Surya Grahan Dosha | grahan |
| Chandra Grahan Dosha | grahan |
| Guru Chandaal Dosha | karmic |
| Venus-Mangal Vish Dosha | vish |
| Venus-Rahu Vish Dosha | vish |
| Kemdrum Dosha | luminary |
| Paap Kartari Dosha | general |

#### C — Detection Engine (`vedic-calc.service.js`)
New `detectYogasAndDoshas(chart)` function added. Wired into `calculateVedicChart()` → `chart.yogas_doshas`.

**Private helpers added:** `_signAdd()`, `_getAspects()`, `_aspects()`, `_isConjunct()`, `_mutuallyRelated()`, `_isParivartana()`, `_houseSignNum()`, `_houseLord()`, `_planetHouse()`

**All 12 yogas detected with live chart rules:**
- Gajakesari: Moon-Jupiter Kendra from each other
- Budh-Aditya: Sun-Mercury conjunct (checks combust threshold)
- Neech Bhanga: debilitated planet + any 1 of 3 cancellation conditions
- Saraswati: Jupiter+Venus+Mercury all in Kendra/Trikona/2nd AND mutually related
- Kalaneedhi: Venus/Jupiter in H2 or H5 with Mercury aspect/conjunction
- Chandra-Mangal: Moon and Mars conjunct or in mutual aspect
- Dhan Yoga group: Laxmi (9th lord exalted in Kendra/Trikona), Adhi (benefics 6/7/8 from Moon), Dhan (wealth lord pairs connected)
- Raj Yoga: Kendra lord ↔ Trikona lord mutual relation
- Vipreet Raj Yoga: Harsha (6th lord in 8/12), Sarala (8th lord in 6/12), Vimala (12th lord in 6/8)
- Parivartan: sign exchange pairs with Raj/Dhan/Dusthana classification
- Guru-Aditya: Sun-Jupiter conjunct
- Shatru Hanta: multiple conditions (6th lord in 12, Mars in H6 strong, Sun in H6 Leo, etc.)

**All 13 dosha types detected:**
- Pitru: Rahu/Ketu/malefics in 9th or Sun debilitated
- Vish Doshas (Sun-Shani, Mangal-Shani, Moon-Shani): same-house conjunction
- Amavasya: Sun-Moon within 12° same sign (checks Jupiter aspect relief)
- Angarak: Mars-Rahu same house
- Shaapit: Saturn-Rahu same house
- Grahan: Sun/Moon eclipsed by Rahu or Ketu
- Guru Chandaal: Jupiter + Rahu or Ketu
- Venus-Mangal / Venus-Rahu Vish
- Kemdrum: Moon alone (no planets in 2nd or 12th from it)
- Paap Kartari: Kendra houses hemmed by malefics on both sides

Each detected yoga/dosha includes: `name`, `name_hi`, `strength/severity`, `trigger_en`, `trigger_hi`, `planets_involved`.

**Test — Rahul Sharma (1990-05-15, 10:30 IST, New Delhi):**
```
Yogas (5): Gajakesari(weak), Dhan Yoga(moderate), Raj Yoga(strong), Vipreet Raj Yoga(moderate), Shatru Hanta(strong)
Doshas (1): Shaapit Dosha (strong) — Saturn+Rahu in Capricorn H7
```

#### D — UI (KundliDetail.jsx)
New `YogasAndDoshasPanel` component added. Renders below Graha Drishti panel.
- Header shows yoga count (green) and dosha count (red/amber)
- Two tabs: Yogas | Doshas
- **Yogas tab:** Each yoga card shows name (EN+HI), strength badge (green/amber/red), trigger description, planet chips
- **Doshas tab:** Each dosha card shows with severity-colored border, severity badge, trigger description, planet chips
- Empty state message for both tabs
- Planet chips colored with PLANET_META colors for instant identification

**DB verification:**
```
yogas_library:  12 rows ✓
doshas_library: 14 rows ✓
```
**Tests:** 12/12 server tests passing ✓
**Build:** 25/25 pages ✓

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 13 — 2026-06-03 | Kundli Yogas/Doshas Detail Expansion + Hindi UI Coverage

### ✅ TASK-041 — Expanded Yogas & Doshas UI and Hindi Translation Coverage
**Status:** Done  
**Agent:** Alex (Codex GPT-5)

**Objective:** Improve the Kundli Yogas & Doshas panel from a compact trigger list into a more descriptive interpretation surface, and fix Hindi mode so major Kundli/Predictions UI areas no longer remain English-only.

**Files created/updated:**
- `ui-main/src/lib/astroI18n.js` — new shared astrology i18n helper module
- `ui-main/src/views/KundliDetail.jsx` — richer Yogas/Doshas cards + broader Hindi labels/values
- `ui-main/src/views/Predictions.jsx` — Hindi-aware prediction, gochar, remedy, opportunity/challenge rendering
- `MEMORY.md` — updated Session 13 memory notes
- `ACTIVITY.md` — this entry

#### A — Shared i18n helper (`astroI18n.js`)
Added centralized helpers for:
- Planet names EN/HI
- House labels and `until` text
- Chart style labels (North/South Indian)
- Strength/severity/outlook badges
- Dignity labels
- Nitya Yoga and Karana Hindi names
- Yoga/Dosha detail lookup with category, formation rule, likely result, and guidance in EN+HI
- Hindi fallback text for Life Portrait, Current Period, Life Areas, Gochar, summary lines, and list items

#### B — KundliDetail UI
Improved Hindi coverage across:
- Chart loading captions and chart explanatory captions
- Chart style toggle labels
- Edit Birth Details modal labels, placeholders, search/save/cancel/error/success messages
- Basic Details / Ghat Chakra / Astro Details row labels
- Nitya Yoga and Karana values in Hindi
- Planet table planet names, house labels, and dignity status
- Dasha and Antardasha timeline labels
- Mangal Dosha, Gochar, and Prediction Engine summary cards
- House grid, Digbala, Bhav Karak, and Graha Drishti planet/house/status labels

#### C — Yogas & Doshas panel
Rebuilt each detected Yoga/Dosha card to show:
- Primary name in selected language + secondary name
- Strength/severity badge translated
- Category badge (power, wealth, karmic, vish, etc.)
- "Detected in this chart" trigger
- Formation rule
- Likely result / likely pressure
- Practical guidance / balancing guidance
- Planet chips translated in Hindi mode

#### D — Predictions page
Improved Hindi coverage for:
- Active period sidebar
- Identity banner
- Life Portrait paragraphs using Hindi fallback generation
- Current period interpretation
- Life area cards and keyword chips
- Opportunities and challenges list text
- Gochar cards
- Vedic remedy tabs, mantras, notes, and puja sequence with Hindi-first rendering in Hindi mode

**Verification:**
```bash
npm.cmd run test:server   # 12/12 tests passed
npm.cmd run build:main    # Next.js production build passed, 25/25 pages generated
```

**Browser smoke check:**
- Existing `localhost:3000` dev process had stale/missing Next assets after `.next` was rebuilt.
- Started a fresh `ui-main` dev server on `http://localhost:3005`.
- `GET /kundli` returned 200 and API `GET /health` returned `{"success":true,"status":"ok"}`.
- Playwright smoke check reached the protected `/kundli` route and redirected to `/login` as expected.
- Fresh browser console on port 3005 showed only `favicon.ico` 404; no runtime errors from changed UI code were observed before auth.
- Default documented admin login returned `403` in the current local DB, so protected Kundli detail visual inspection was not completed through the browser.

---

## Session 14 — 2026-06-03 | Varga Reference API + Kundli UI Integration

### ✅ TASK-042 — Seeded Varga Reference Implemented in Kundli UI
**Status:** Done
**Agent:** Alex (Codex GPT-5)

**Objective:** Check whether `server/src/data/varga-reference.js` already has seed support, create it if missing, and properly implement the Varga reference in the Kundli UI with Hindi coverage.

**Seed finding:**
- Existing seed already present: `server/src/seeds/007_varga_reference_data.js`
- Existing migration already present: `server/src/migrations/007_varga_reference_data.js`
- Existing seed loads `server/src/data/varga-reference.js` into `varga_charts`, `varga_family_references`, and `varga_chart_relationships`
- No duplicate seed was created

**Files created/updated:**
- `server/src/services/varga-reference.service.js` — normalizes Varga chart, relationship, and family reference rows for UI consumption
- `server/src/routes/kundli.routes.js` — added authenticated `GET /api/kundli/reference/varga`
- `server/tests/vedic-calc.test.js` — added Varga reference normalization test
- `ui-main/src/lib/vargaI18n.js` — Hindi fallback names, domains, descriptions, key uses, relationship topics, and common reference text localization
- `ui-main/src/views/KundliDetail.jsx` — added non-blocking Varga reference fetch and `VargaChartsPanel`
- `MEMORY.md` — updated Session 14 memory notes
- `ACTIVITY.md` — this entry

#### A — Backend API
Added `fetchVargaReferenceData(knex)` and `normalizeVargaReferenceRows()` so the API returns:
- 18 Varga chart definitions
- Parsed `key_uses_en` / `key_uses_hi` arrays
- Per-chart relationship reading references grouped under each chart
- Family reference map rows

The endpoint returns `404` if the seed tables exist but have no Varga rows, and `500` on DB/runtime failure with server-side logging.

#### B — Kundli UI
Added a full Varga panel below the main Kundli detail grid:
- D1-D60 selector pills
- Selected Varga chart rendered using the current North/South chart style
- Selected chart Lagna and planet sign placements
- Description, signifies, key uses, division note, calculation rule, and precision note
- Relationship reading reference cards
- Family reference map
- Graceful fallback for older saved Kundlis that need recalculation to populate the complete Varga chart set

#### C — Hindi Coverage
Added `vargaI18n.js` because the canonical Varga seed source currently has nullable Hindi fields but no Hindi values. The UI now has Hindi fallback text for:
- Varga chart names
- Primary domains
- Signifies text
- Descriptions
- Key uses
- Relationship/family topics
- Common reference phrases

**Verification:**
```bash
npm.cmd run test:server   # 13/13 tests passed
npm.cmd run build:main    # Next.js production build passed, 25/25 pages generated
```

*Last updated: 2026-06-03 | Agent: Alex (Codex GPT-5)*

---

## Session 15 — 2026-06-03 | Graha Rashi Bhav Reports + Matrix Tables

### ✅ TASK-043 — Detailed General, Planet, Varga Matrix, Planet Detail, and Cusp Reports
**Status:** Done
**Agent:** Alex (Codex GPT-5)

**Objective:** Implement detailed General Report and Planet Report using Graha, Rashi, and Bhav, plus sample-style Varga matrix, planet detail table, and cusp table.

**Files created/updated:**
- `server/src/services/vedic-calc.service.js` — added `chart.reports` derivation and exports
- `server/src/routes/kundli.routes.js` — auto-refreshes older saved Kundli JSON when new report payload is missing
- `server/tests/vedic-calc.test.js` — added report matrix/detail/cusp/sub-lord coverage
- `ui-main/src/views/KundliDetail.jsx` — added `DetailedReportsPanel` with report tabs and tables
- `MEMORY.md` — updated Session 15 memory notes
- `ACTIVITY.md` — this entry

#### A — Backend Report Payload
`calculateVedicChart()` now returns:
- `reports.general_report` — Lagna, Moon, Sun, current Dasha narrative in EN+HI
- `reports.planet_report` — 9 planet interpretations using Graha karakatva + Rashi + Bhav
- `reports.varga_matrix` — rashi-number matrix for Birth, Navamsha, Chalit, Sun, Moon, Hora, Drekkana, D4, D5, D7, D8, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60
- `reports.planet_details` — Sun through Ketu plus Ascendant with degree, retrograde, normalized degree, house, zodiac sign, sign lord, nakshatra, nakshatra lord, charan, sub lord, sub-sub lord
- `reports.cusp_details` — 12 cusp rows with sign/nakshatra/sub-lord fields

#### B — Calculation Notes
- Natal report houses use existing whole-sign house logic.
- Chalit matrix row and cusp rows use equal-house cusps from the exact Lahiri Lagna degree.
- Sub lord and sub-sub lord use KP-style Vimshottari proportional subdivision inside each Nakshatra.
- Older stored Kundli JSON is recalculated automatically by `GET /api/kundli/:id` if `reports.planet_details` or `reports.varga_matrix` is missing.

#### C — Kundli UI
Added `DetailedReportsPanel` below the main Kundli detail grid with tabs:
- General Report
- Planet Report
- Varga Matrix
- Planet Details
- Cusps

The tables follow the provided sample structure while preserving the existing North/South chart UI and Varga reference panel.

**Verification:**
```bash
npm.cmd run test:server   # 14/14 tests passed
npm.cmd run build:main    # Next.js production build passed, 25/25 pages generated
```

*Last updated: 2026-06-03 | Agent: Alex (Codex GPT-5)*

---

## Session 16 — 2026-06-03 | Planet Assessment + Yoga/Dasha Language + Dasha/Gochar Event Timing

### ✅ TASK-044 — Positive/Negative Planet Assessment and Timing Reports
**Status:** Done
**Agent:** Alex (Codex GPT-5)

**Objective:** Add planet positive/negative checks, improve Yoga+Dasha language, and derive event timing from Dasha plus Gochar.

**Files updated:**
- `server/src/services/vedic-calc.service.js` — added structured planet assessment, Yoga+Dasha activation report, and Dasha+Gochar event timing windows
- `server/src/routes/kundli.routes.js` — auto-refreshes older saved Kundli JSON when new report fields are missing
- `server/tests/vedic-calc.test.js` — added assertions for planet assessment, Yoga+Dasha, and event timing report fields
- `ui-main/src/views/KundliDetail.jsx` — added report tabs, badges, cards, and technical-table assessment column
- `MEMORY.md` — updated Session 16 memory notes
- `ACTIVITY.md` — this entry

#### A — Planet Positive/Negative
`reports.planet_assessments` now scores each Navagraha with:
- dignity strength
- house placement from Lagna
- natural benefic/malefic nature
- retrograde handling
- current Dasha/Antardasha activation flag

The Kundli UI shows this in the Planet Report cards and the Planet Details table as Positive, Mixed, or Negative/needs care, with EN+HI advice and reasons.

#### B — Yoga + Dasha Language
`reports.yoga_dasha_report` now explains which detected Yogas/Doshas are directly activated by the running Mahadasha/Antardasha lords. The report includes EN+HI summary, guidance, active/background labels, activated planets, and timing language.

#### C — Dasha + Gochar Event Timing
`reports.event_timing` now creates rule-based timing windows for:
- career/authority
- money/gains/assets
- relationships/family
- health/routine/recovery
- education/dharma/spiritual growth

Each window combines current Vimshottari Dasha, natal house placement of running lords, current Jupiter support, Sade Sati state, and Rahu-Ketu axis. The UI renders current window, event cards, triggers, and upcoming Antardasha signals.

**Verification:**
```bash
npm.cmd run test:server   # 14/14 tests passed
npm.cmd run build:main    # Next.js production build passed, 25/25 pages generated
git diff --check          # clean except LF->CRLF warnings
```

**Smoke:**
- Old `localhost:3007` dev server returned stale 500 after build.
- Started fresh `ui-main` dev server on `http://localhost:3008`.
- `GET /login` returned 200.
- `GET /kundli` returned 200.

*Last updated: 2026-06-03 | Agent: Alex (Codex GPT-5)*

---

## Session 17 — 2026-06-03 | Life Report + Isht Devata + Varga Practical Readings + AstroAnsh Class 1

### ✅ TASK-045 — Atmakaraka & Isht Devata Calculation
**Status:** Done
**Agent:** Claude Sonnet 4.6

**Source:** AstroAnsh Class 1 Premium Notes (Ch. 4–5 Karma Theory, Ch. 7–8 Graha BPHS) + Parashara BPHS tradition

**Files created/updated:**
- `server/src/services/life-report.service.js` — NEW standalone service
- `server/src/services/vedic-calc.service.js` — wired life_report + varga_analysis
- `server/src/routes/kundli.routes.js` — ensureCalculatedChart now checks life_report.sections

**Logic:**
- `calculateAtmakaraka(planets)` — planet with highest degree (0–30°) among Sun–Saturn = Atmakaraka (Parashara BPHS)
- `calculateIshtaDevata(akInfo, d9Chart)` — AK in D9 Navamsha → sign → sign lord → Ishta Devata + primary mantra
- Full mapping: Sun→Rama/SuryaNarayan, Moon→Krishna/Shiva, Mars→Hanuman/Kartikeya, Mercury→Vishnu, Jupiter→Vishnu/Brihaspati, Venus→Lakshmi/Parvati, Saturn→Shiva/Bhairava, Rahu→Durga/Kali, Ketu→Ganesha
- `chart.life_report.atmakaraka` + `chart.life_report.ishta_devata` added to all chart objects

---

### ✅ TASK-046 — Varga Chart Practical Readings ("Your Reading" tab)
**Status:** Done

**Logic:** `generateVargaAnalysis(chart)` creates per-Varga practical readings for D1–D60:
- Each Varga slug gets: topic_en/hi, findings[], overall_status
- Each finding: Lagna lord in that Varga chart → house + dignity → impact badge (very_favorable / favorable / neutral / challenging)
- Key karakas per domain (e.g. D2=Venus, D7=Jupiter, D10=Sun+Saturn)
- D2 special: Sun Hora vs Moon Hora type (paternal/maternal wealth)
- D9 special: Atmakaraka placement shown

**UI:** `VargaChartsPanel` in `KundliDetail.jsx` now shows "Your Reading — Practical Results" section per chart tab with colored impact cards.

---

### ✅ TASK-047 — Life Report Panel (5-section practical kundli analysis)
**Status:** Done

**Files created:**
- `ui-main/src/components/LifeReportPanel.jsx` — NEW 5-tab panel
- `server/src/services/life-report.service.js` — 5 section generators

**5 Tabs:**
| Tab | What it shows |
|-----|--------------|
| Soul Profile | Lagna + Moon sign + Nakshatra + current Dasha + **Atmakaraka + Isht Devata card** |
| Finance | 2nd/11th lord analysis, D2 Hora type, Venus strength, active wealth yogas, problems + remedies |
| Family | 4th/7th/5th lord + Mangal Dosha + problems + spouse/children remedies |
| Health | Lagna lord vitality, 6th lord disease indicator, Moon state, nakshatra health + remedies |
| Problems | All detected doshas, Sade Sati status, Navgraha Suktam as universal remedy |

Injected into `KundliDetail.jsx` after Life Portrait panel, before Detailed Reports panel.

---

### ✅ TASK-048 — Migration 014 + Seed 011: AstroAnsh Class 1 Data
**Status:** Done

**Source:** `AstroAnsh Class 1 Premium Notes.pdf` (567KB)
**Chapters covered:** Ch.1 Vedas & Vedangas, Ch.2 6 Angas of Jyotish, Ch.3 5 Uses of Jyotish, Ch.4-5 Karma Theory, Ch.6 Hora System & Weekdays, Ch.7-8 Graha BPHS Attributes

**Files created:**
- `server/src/migrations/014_jyotish_fundamentals.js` — creates `jyotish_basics` table
- `server/src/seeds/011_jyotish_fundamentals.js` — 35 rows across 7 categories

**New Table: `jyotish_basics`**
- Columns: id, category, item_key, name_en, name_hi, description_en, description_hi, parent_key, admin_only, sort_order, extra_data (JSON), timestamps
- Categories: `veda` | `vedanga` | `jyotish_anga` | `jyotish_use` | `karma_type` | `hora_rule` | `graha_bphs`

**35 rows seeded:**
- 4 Vedas (Rigveda, Samaveda, Yajurveda, Atharvaveda) — admin_only: true
- 6 Vedangas (Shiksha, Kalpa, Vyakarana, Nirukta, Chhandas, Jyotish) — admin_only: true
- 6 Jyotish Angas (Gola, Ganita, Jataka, Prashna, Muhurta, Nimitta) — Jataka & Muhurta: admin_only: false
- 5 Uses of Jyotish (Trikaal Darshan, Karma Understanding, Muhurta, Prashna, Nimitta) — first 3: admin_only: false
- 3 Karma types (Sanchit/Prarabdha/Kriyaman with D1/D60 Jyotish house mapping) — admin_only: false
- 2 Hora rules (overview + effects per planet) — admin_only: false
- 9 Graha BPHS attribute rows (full karakatva, friends/enemies, digbala, exalt/debil, vimshottari years) — admin_only: false

**Verification:**
```bash
npm run migrate   # Batch 10 run: 1 migration
npm run seed      # Ran 11 seed files
npm run test:server   # 14/14 tests passed
npm run build:main    # 25/25 pages
```

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 18 — 2026-06-03 | vedic-calc.service.js Modular Refactor

### ✅ TASK-049 — Refactor vedic-calc.service.js into Helper Modules
**Status:** Done
**Agent:** Claude Sonnet 4.6

**Objective:** Break the 3,009-line `vedic-calc.service.js` monolith into focused helper modules without breaking any existing functionality.

**Files created — `server/src/services/helpers/`:**

| File | Lines | Responsibility |
|------|-------|----------------|
| `vedic-data.js` | 105 | RASHIS, NAKSHATRAS, DIGNITY_MAP, NAK_EXTRA, NATURAL_FRIENDS |
| `core-helpers.js` | 182 | norm, lahiriAyanamsa, toSidereal, rashiFromDeg, nakshatraFromDeg, getPlanetDignity, houseFromSign, toDMS, ordinal, nakExtra, varnaForRashi, vashyaForRashi, formatDate, addYears, etc. |
| `varga-calc.js` | 140 | trimshamshaFromDegree, vargaPlacementFromDeg, buildWholeSignHouses, calculateVargaChart, calculateNavamshaChart, calculateAllVargaCharts |
| `dasha-calc.js` | 105 | DASHA_SEQ, LORD_IDX, buildAntardasha, vimshottariDasha, legacyVimshottariDasha, dashaSequenceFrom, proportionalLord, kpSubLordsFromLongitude |
| `mangal-dosha.js` | 42 | analyzeMangalDosha |
| `panchang.js` | 178 | hinduMasa, calculateNityaYoga, calculateTithi, calculateKarana, calculateVara, calculatePahar, sunriseSunset, calculatePanchang, calculateAstroDetails |
| `drishti-bhavkarak.js` | 98 | DRISHTI_OFFSETS, BHAV_KARAK, DIGBALA_STRONG_HOUSE, calculateGrahaDrishti, calculateBhavKarak, calculateDigbala |
| `gochar.js` | 38 | calculateTransitSummary |
| `ashtakoot.js` | 74 | calculateAshtakoot |
| `prediction-data.js` | 239 | LAGNA_PORTRAIT, MOON_SIGN_PORTRAIT, DASHA_LORD_MEANINGS, SADE_SATI_DESC, HOUSE_REPORT, PLANET_REPORT, PLANET_NAME_HI, NATURAL_PLANET_NATURE, REPORT_PLANET_ORDER, VARGA_MATRIX_ROWS, EVENT_AREA_CONFIG |
| `predictions-engine.js` | 120 | generateRuleBasedPredictions, planets_house_desc, planetNameHi |
| `detailed-reports.js` | 253 | planetPositiveNegativeAssessment, calculatePlanetAssessmentMap, calculateYogaDashaReport, calculateEventTiming, calculateVargaSignMatrix, reportRowForPoint, calculatePlanetDetailRows, calculateCuspDetailRows, sentenceForPlanet, sentenceForPlanetWithAssessment, calculateGeneralReport, calculateDetailedReports |
| `yogas-doshas.js` | 126 | detectYogasAndDoshas (all 12 yogas + 13 dosha types + private helpers) |

**Files modified:**
- `server/src/services/vedic-calc.service.js` — rewritten as 181-line orchestrator (imports helpers, contains calculateVedicChart, re-exports all public functions)

**No regressions:**
- All exports previously used by tests and routes preserved: `dailyMotionForPlanet`, `isRetrogradePlanet`, `calculateEventTiming`, `calculateDetailedReports`, `planetPositiveNegativeAssessment`, `kpSubLordsFromLongitude`, `calculateAshtakoot`, `calculateTransitSummary`, `generateRuleBasedPredictions`, etc.

**Size reduction:**
- Main file: 3,009 lines → **181 lines** (94% reduction)
- Total across all helpers: ~1,700 lines (each file 38–253 lines, avg ~130)

**Verification:**
```bash
npm run test:server   # 14/14 tests passed
npm run build:main    # 25/25 pages — zero compile errors
```

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*


---

## Session 19 — 2026-06-03 | AstroAnsh Class 2 — Nine Grahas DB Corrections + Enrichment

### ✅ TASK-050 — Class 2 PDF Processed: Graha Data Corrected & Enriched
**Status:** Done
**Source:** `AstroAnsh Class 2 Premium Notes.pdf` (797KB, 34 pages) — "A Comprehensive Bilingual Study Guide on the Nine Grahas"

**Files created:**
- `server/src/migrations/015_graha_class2_enhancements.js` — adds 10 new columns to `planets` table
- `server/src/seeds/012_graha_class2.js` — UPDATE corrections + INSERT rich new data (no DELETE)

**Corrections applied (9 errors fixed):**
| Planet | Field | Was | Now |
|--------|-------|-----|-----|
| Rahu | direction | South-West | North-West |
| Ketu | direction | North-East | South-West |
| Ketu | color | Grey/Spotted | Multi-colored |
| Ketu | metal | Mixed Metals | Iron |
| Ketu | element | Fire | Fire & Earth |
| Rahu | weekday | null | Saturday |
| Ketu | weekday | null | Tuesday |
| Sun | color | Copper/Red-Orange | Golden/Saffron |
| Venus | metal | Silver/Platinum | Silver |
| Mercury | metal | Brass/Bronze | Bronze/Kansa |
| Saturn | metal | Iron | Iron/Lead |

**New columns + data:** season, health_conditions_en/hi, professions_en/hi, key_relations_en/hi, physical_manifestations_en/hi — all 9 planets seeded with rich bilingual data from PDF.

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 20 — 2026-06-03 | AstroAnsh Class 3 & 4 — Bhavas, Rashis, and Planetary Classification

### ✅ TASK-051 — Class 3 & 4 PDF Processed: Gunas, Planet Classification, Zodiac Signs, House Details
**Status:** Done
**Source:** `AstroAnsh Class 3,4 and characteristics of Bhavas Premium Notes.pdf` (708KB, 21 pages, BPHS-based)

**Files created:**
- `server/src/migrations/016_class3_enhancements.js` — adds new columns to `planets`, `zodiac_signs`, `houses`
- `server/src/seeds/013_class3_data.js` — UPDATE all 9 planets + 12 signs + 12 houses (no DELETE)

#### Migration 016 — New Columns Added

| Table | New Columns |
|-------|-------------|
| `planets` | `guna`, `guna_hi`, `varna`, `varna_hi`, `court_role`, `court_role_hi`, `deity`, `deity_hi` |
| `zodiac_signs` | `key_traits_en`, `key_traits_hi`, `detailed_description_en`, `detailed_description_hi` |
| `houses` | `keywords_en`, `keywords_hi`, `topics_en`, `topics_hi`, `health_organs_en`, `health_organs_hi`, `detailed_notes_en`, `detailed_notes_hi` |

#### Seed 013 — Data Seeded

**Part 1: Planet Classification (Section 3 of PDF) — all 9 Navagrahas:**
| Planet | Guna | Varna | Court Role | Deity |
|--------|------|-------|------------|-------|
| Sun | Satvik | Kshatriya | King | Agni |
| Moon | Satvik | Vaishya | Queen | Varun |
| Mars | Tamsik | Kshatriya | Commander | Kartikeya |
| Mercury | Rajsik | Vaishya | Prince | Vishnu |
| Jupiter | Satvik | Brahmin | Minister | Indra |
| Venus | Rajsik | Brahmin | Minister | Indrani |
| Saturn | Tamsik | Shudra | Servant | Brahma |
| Rahu | Tamsik | Malechha | Army | Brahma / Laxmi / Ganesh |
| Ketu | Tamsik | Malechha | Army | Ganesh |

**Part 2: Zodiac Signs (Section 4) — all 12 Rashis:**
- `key_traits_en/hi` — 5-6 word trait summaries per sign
- `detailed_description_en/hi` — full paragraphs: symbol, element, quality, personality, strengths, challenges

**Part 3: Houses (Part 4, pages 15–20) — all 12 Bhavas:**
- `keywords_en/hi` — brief house keywords (Self/Wealth/Courage etc.)
- `topics_en/hi` — all topics covered by each house (modern context included)
- `health_organs_en/hi` — specific organs governed by each house (with laterality: Left Eye, Right Ear etc.)
- `detailed_notes_en/hi` — rich per-house description with BPHS rules, modern insights, planet-specific effects

**Three Gunas from PDF (Section 1):**
- Satvik (Sun, Moon, Jupiter): purity, wisdom, dharmic living
- Rajsik (Mercury, Venus): passion, activity, worldly success
- Tamsik (Mars, Saturn, Rahu, Ketu): challenges, karmic lessons, transformation

**DB verification:**
```
planets:      9 rows — guna/varna/court_role/deity ✓
zodiac_signs: 12 rows — key_traits + detailed descriptions ✓
houses:       12 rows — keywords + topics + health_organs + detailed_notes ✓
```

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 21 — 2026-06-03 | KundliInsightPanel — Plain Language Customer Guide

### ✅ TASK-052 — Customer-Friendly Kundli Reading Panel
**Status:** Done

**Files created:**
- `ui-main/src/components/KundliInsightPanel.jsx` — NEW 4-tab plain-language panel

**Files updated:**
- `server/src/routes/kundli.routes.js` — added `fetchChartEnrichment()` + wired into GET /:id and recalculate
- `ui-main/src/views/KundliDetail.jsx` — `chartEnrichment` state + import + panel insertion

#### Server: `fetchChartEnrichment(ascRashiNum, moonRashiNum)`
Queries zodiac_signs (key_traits + detailed_description), planets (guna/varna/court_role/deity), houses (keywords/topics/health_organs/detailed_notes). Returns `profile.chart_enrichment` in the API response.

#### KundliInsightPanel — 4 Tabs:
| Tab | What Customer Sees |
|-----|-------------------|
| **📋 Summary** | Lagna sign meaning + key traits · Moon sign emotional nature · Current Dasha in plain language · Strong Planets ✅ / Needs Attention ⚠️ split |
| **🪐 Your Planets** | 9 planet cards with deity (🙏 Agni/Varun etc.), guna badge (Satvik=Pure/Rajsik=Active/Tamsik=Intense), court role with plain meaning, position, dignity in plain terms (★ Excellent / ▼ Needs Care) |
| **🏠 Your Houses** | 12 house cards with keywords, topics, health organs, planets present + "activate this life area" |
| **🏥 Health Guide** | Body organ per house, planet influence, Watch/Protected color badges |

**Verification:**
```bash
node --check server/src/routes/kundli.routes.js  ✓
npm run test:server   # 14/14 passed ✓
npm run build:main    # 25/25 pages ✓
```

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 25 — 2026-06-03 | Upcoming Antardasha Signals — Yoga + Dasha Forecast

### ✅ TASK-061 — Predict Yoga + Dasha for Upcoming Antardasha Periods
**Status:** Done
**Agent:** Claude Sonnet 4.6

**Files updated:**
- `server/src/services/helpers/detailed-reports.js`
- `ui-main/src/views/KundliDetail.jsx`

#### Backend changes (`detailed-reports.js`)

**New private helpers added:**

| Helper | Purpose |
|--------|---------|
| `_scoreEventAreasForPlanets(activePlanets, chart, gochar, mahadashLord)` | Scores all 5 EVENT_AREA_CONFIG areas for any set of active planets (reusable) |
| `_predictUpcomingAntardasha(dashaLord, uLord, chart, gochar)` | Full Yoga+Dasha prediction for one upcoming antardasha period |

**`_predictUpcomingAntardasha` returns:**
- `activated_yogas[]` — yogas from chart's `yogas_doshas.yogas` whose `planets_involved` includes dashaLord or uLord (with `is_cancelled` flag)
- `activated_doshas[]` — doshas activated by the same pair
- `life_area_windows[]` — all 5 event areas scored and sorted by score descending, each with tone (favorable/moderate/caution) and trigger notes
- `nature_en/hi` — DASHA_LORD_MEANINGS[uLord].nature
- `key_themes[]` — top 3 opportunities from DASHA_LORD_MEANINGS
- `cautions[]` — top 2 cautions from DASHA_LORD_MEANINGS
- `focus_en/hi` — rich summary combining top life area + nature + yoga/dosha suffixes

**`calculateEventTiming` updated:** `upcoming_antardashas` now spread the full `_predictUpcomingAntardasha` result per period (replacing the old single-line generic focus text).

**Exported:** `predictUpcomingAntardasha` (public alias to the private helper) added to module.exports.

#### UI changes (`KundliDetail.jsx`)

Replaced the minimal 3-card grid in the Event Timing → Upcoming Antardasha section with rich expanded cards:

| Section in each card | Content |
|----------------------|---------|
| **Planet header** | Icon + colored planet name + date range (border tinted to planet color) |
| **Focus paragraph** | Rich bilingual summary sentence |
| **Life Areas** | Top 3 scored areas as tone-colored rows (↑ favorable / ⚠ caution / ~ moderate) |
| **Yogas That Activate** | Green chips for active (non-cancelled) yogas |
| **Doshas to Watch** | Amber chips for activated doshas |
| **Key Themes** | Gold bullet list of up to 3 opportunities |
| **Cautions** | Saffron warning list of up to 2 cautions |

Section heading updated to: "Upcoming Antardasha Signals — Yoga + Dasha Forecast"

**Verification:**
```bash
node --check server/src/services/helpers/detailed-reports.js  ✓
npm run test:server   # 14/14 passed ✓
npm run build:main    # 25/25 pages ✓
```

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 26 — 2026-06-03 | Varga Charts — Plain-Language User Summary

### ✅ TASK-062 — Rewrite Varga Panel for Normal Users (Remove Technical Jargon)
**Status:** Done
**Agent:** Claude Sonnet 4.6

**Files updated:**
- `server/src/services/life-report.service.js`
- `ui-main/src/views/KundliDetail.jsx`

#### Problem
The Varga / Divisional Charts panel was showing highly technical astrological data directly to users:
- "Marriage, dharma — Lagna Lord (Jupiter) in Taurus (house 11) · Neutral"
- "Key significator — Venus in Gemini (house 12) · Neutral"
- Generic role text like "This divisional chart shows how wealth actually works in the native's life, beyond the surface promise of D1."

Normal users could not understand what any of this meant for their life.

#### Backend changes (`life-report.service.js`)

Rewrote `buildVargaGuidance()` to produce plain-language output:

| Old field | Before | After |
|-----------|--------|-------|
| `role_en` | "This divisional chart shows how X works in the native's life..." | "Your X chart looks supportive — you have natural strength here." |
| `user_summary_en` | Referenced "strongest visible factor is Jupiter in Taurus (house 11)..." | Full plain paragraph with zero planet/house jargon |
| `benefits[]` | "D9 Lagna Lord (Jupiter) in Gemini (house 7) · Neutral. Generally positive..." | "This is one of the stronger areas of your chart. When you put effort in here..." |
| `watch_points[]` | "Venus in Gemini (house 12) · Neutral. Treat this as the main area..." | "This area may go through phases of delay... patience works better than pushing hard." |
| `remedies[]` | "Strengthen the weak karaka with mantra..." | "Strengthen this area through regular mantra, acts of service, and clean daily habits..." |

Added new fields: `verdict_en/hi` ("Looking Good" / "Mixed Picture" / "Needs Attention") and plain `role_en/hi`.

#### Frontend changes (`KundliDetail.jsx`)

Replaced the right-panel layout entirely:

| Removed | Added |
|---------|-------|
| "Signifies" + "Role in Your Kundli" 2-column jargon grid | **Verdict banner** — colored badge (Looking Good / Mixed / Needs Attention) + plain "what this chart tells you" sentence |
| `findings` cards (technical planet/house rows) | **Plain answer paragraph** — 2–3 sentences in everyday language |
| Generic "Benefits / Watch Points / Remedies" labels | **3 cards**: "What It Means For You" ✓ · "What To Watch" ⚠ · "What To Do" ✦ |
| "Good For" section label | **"Use This Chart To Check"** with bullet dots |

**Verification:**
```bash
node --check server/src/services/life-report.service.js  ✓
npm run test:server   # 14/14 passed ✓
npm run build:main    # 25/25 pages ✓
```

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*


---

## Session 27 — 2026-06-03 | D60 Past Life Reading + D20 Spiritual Path

### TASK-063 — D60 Past Life Deep Reading Engine
Files: server/src/services/life-report.service.js, ui-main/src/views/KundliDetail.jsx

New generateD60PastLifeReading(d60Chart): D60 Lagna=personality, 10H=profession, 9H=father, 4H=mother, 7H=spouse, 12H=moksha karma. Lookup tables: D60_LAGNA_PAST_LIFE, D60_PLANET_PROFESSION, D60_PLANET_FATHER, D60_PLANET_MOTHER, D60_PLANET_SPOUSE, D60_PLANET_PAST_MOKSHA. Helpers: signOfHouse, planetsInHouseList, primaryPlanetForHouse.

### TASK-064 — D20 Spiritual Path Analysis Engine
New generateD20SpiritualReading(d20Chart, ishtaDevata): D20_LAGNA_SPIRITUAL (12 entries), D20_PLANET_PRACTICE (9 planets), Jupiter+Ketu favorability, 9H grace path, 12H moksha indicator, Isht Devata from chart._ishtaDevata. generateLifeReport now stashes chart._ishtaDevata.

### TASK-065 — D60/D20 Special UI Panels in VargaChartsPanel
D60 panel: karma badge, personality paragraph, 5 cards (Profession/Father/Mother/Spouse/Spiritual). D20 panel: spirit verdict, temperament, core practice, Jupiter+Ketu, grace path, Isht Devata, moksha indicator. Fully bilingual.

Verification: 14/14 tests, 25/25 pages.

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*

---

## Session 28 — 2026-06-03 | Bug Fix: Webpack Cache + Varga Reading Blank Fields

### ✅ TASK-066 — Webpack Cache Error Fix
**Status:** Done
**File:** `ui-main/.next/` (deleted)

**Problem:** `[webpack.cache.PackFileCacheStrategy] Caching failed for pack: Error: ENOENT: no such file or directory, stat '...\.next\cache\webpack\client-development\5.pack.gz'`
**Fix:** Deleted the stale `.next` directory. Webpack rebuilds fresh cache on next `dev:main` start.

---

### ✅ TASK-067 — Varga/Divisional Chart Reading Panel Blank Fields
**Status:** Done
**File:** `server/src/routes/kundli.routes.js`

**Root cause:** `ensureCalculatedChart` only checked `existing?.varga_analysis` (truthy object), so charts saved in Sessions 17–25 passed the check even though they were missing:
- `role_en`, `role_hi`, `verdict_en`, `verdict_hi`, `user_summary_en`, `user_summary_hi` — added in Session 26 plain-language rewrite of `buildVargaGuidance()`
- `past_life_reading` (D60) and `spiritual_reading` (D20) — added in Session 27

**Symptom:** "What this chart tells you" showed a blank header, the summary paragraph was empty. D60 Past Life and D20 Spiritual Path special panels didn't appear.

**Fix:** Two new checks in `ensureCalculatedChart`:
```js
&& existing?.varga_analysis?.d1?.role_en              // Session 26: plain-language Varga fields
&& existing?.varga_analysis?.d60?.past_life_reading   // Session 27: D60 past-life reading
```
Any stale chart failing either check is recalculated on next API access.

**Verification:**
```bash
node --check server/src/routes/kundli.routes.js  ✓
npm run test:server   # 14/14 passed ✓
npm run build:main    # 25/25 pages ✓
```

---

## Session 29 — 2026-06-04 | Planet Life Impact Panel

### ✅ TASK-068 — Planet Life Impact: How Each Planet Affects Your Life Areas
**Status:** Done
**Files created:** `ui-main/src/components/PlanetImpactPanel.jsx`
**Files updated:** `ui-main/src/views/KundliDetail.jsx` — import + panel after KundliInsightPanel

**Feature:** For each of the 9 Navagrahas, shows a plain-language card explaining how the planet affects specific life areas (money, career, family, relationships, education, health, spirituality etc.) based on whether it is positive, mixed, or negative in the chart.

**Data:** Pure frontend — reads existing `chart.reports.planet_assessments` + `chart.planets`. No server changes, no new DB fields.

**Each card shows:** planet name/icon, assessment badge, house placement + domain, active-in-dasha badge, 5 life-area impact items with area chips and plain-language text (EN + HI), and a "What to do" advice line.

**Filter tabs:** All 9 Planets / Strong / Needs Attention

**Planet → life areas:**
Sun → Career, Confidence, Father, Status, Eye/Heart health
Moon → Mind/Emotions, Mother/Home, Wealth, Memory, Mental/Gut health
Mars → Energy/Drive, Property, Technical career, Siblings, Physical vitality
Mercury → Intelligence, Education, Business/Trade, Communication, Nervous system
Jupiter → Wealth, Education, Children/Family, Marriage, Luck/Blessings
Venus → Love/Romance, Marriage, Luxury/Wealth, Arts, Reproductive health
Saturn → Career/Goals, Discipline, Justice/Karma, Delays, Bone/Joint health
Rahu → Ambition, Technology/Innovation, Sudden fortune, Material gains, Foreign
Ketu → Spirituality, Past-life gifts, Research, Detachment, Viral/Immune health

**Verification:**
```bash
npm run build:main    # 25/25 pages ✓
```

*Last updated: 2026-06-04 | Agent: Claude Sonnet 4.6*

---

## Session 30 — 2026-06-04 | Bhava Names + EDOFEN Full Implementation

### ✅ TASK-069 — "Name of Bhavas and EDOFEN.pdf" Processed (3 pages)
**Status:** Done
**Source:** `C:\Users\Asus Vivobook\Downloads\Name of Bhavas and EDOFEN.pdf`

**PDF Content:**
- **Page 1** — Bhava type classifications: Kendra(1,4,7,10) · Trikona(1,5,9) · Upachaya(3,6,10,11) · Dusthana/Trik(6,8,12) · Maarak(2,7) with nature labels (Very Auspicious / Auspicious / Grows with Age / Evil / Death Causing)
- **Page 2** — EDOFEN table: Exaltation=100% · Own=70% · Debilitation=10% + Rahu/Ketu dignity (Rahu exalted Taurus/debil Scorpio; Ketu exalted Scorpio/debil Taurus)
- **Page 3** — Complete 9×9 Permanent Friendship (Naisargika Maitri) table including Rahu & Ketu

---

#### A — Migration 017 (`server/src/migrations/017_bhava_edofen.js`)
- `houses` table: +7 columns (`bhava_type`, `bhava_groups` JSON, `bhava_nature_en/hi`, `is_kendra`, `is_trikona`, `is_dusthana`, `is_upachaya`, `is_maarak`)
- New table `planet_naisargika_maitri`: 9 rows — complete friendship/enmity matrix

#### B — Seed 014 (`server/src/seeds/014_bhava_edofen.js`)
**Part 1 — Bhava classification:** UPDATE all 12 houses with bhava_type, bhava_groups, bhava_nature_en/hi, boolean flags
**Part 2 — Rahu/Ketu dignity:** INSERT 4 rows into `planet_dignity` (Rahu: exalt=Taurus, debil=Scorpio; Ketu: exalt=Scorpio, debil=Taurus)
**Part 3 — Friendship table:** INSERT 9 rows into `planet_naisargika_maitri` with full JSON friend/enemy/neutral arrays

#### C — vedic-data.js (`server/src/services/helpers/vedic-data.js`)
- `DIGNITY_MAP`: Added Rahu + Ketu entries (exalt/debil signs)
- `NATURAL_FRIENDS`: Updated all 7 existing planets with Rahu/Ketu in their relationship lists + added Rahu/Ketu rows
- New constant `DIGNITY_STRENGTH`: { Exaltation:100, Moolatrikona:85, Own:70, Neutral:50, Debilitation:10 }
- New constant `BHAVA_CLASSIFICATION`: 12-house lookup with all groups/flags/nature labels

#### D — core-helpers.js (`server/src/services/helpers/core-helpers.js`)
- `getPlanetDignity`: Now handles Rahu/Ketu (no longer returns 'shadow' — returns proper Exaltation/Debilitation/Neutral)
- New `getDignityStrength(dignityLabel)`: Returns % number (0–100)
- New `getPlanetRelation(planet, otherPlanet)`: Returns 'friend'/'enemy'/'neutral'/'self' from NATURAL_FRIENDS

#### E — vedic-calc.service.js
- `planetDetails` now includes `dignity_strength` (number) and `sign_lord_relation` (string) per planet
- Re-exports `BHAVA_CLASSIFICATION`, `DIGNITY_STRENGTH`

#### F — kundli.routes.js
- `fetchChartEnrichment()` now returns bhava classification fields from DB per house

#### G — UI: KundliInsightPanel.jsx
- **Your Planets tab**: Each planet card shows EDOFEN strength % badge (100%/85%/70%/50%/10%) + sign-lord relation badge (Friend's Sign / Enemy's Sign / Neutral Sign)
- **Your Houses tab**: Each house card shows colored bhava type badges (Kendra/Trikona/Upachaya/Dusthana/Maarak) with nature label from DB; card border/background tinted by bhava type

#### H — UI: KundliDetail.jsx Planet Table
- "Status" column renamed "Status (EDOFEN)"
- Shows dignity label + EDOFEN strength % below it (green ≥70%, red ≤15%)
- Sign column shows sign-lord relation label (Friend's sign / Enemy's sign) in color

**DB verification:**
```
houses: all 12 rows have bhava_type, bhava_groups, flags ✓
planet_dignity Rahu/Ketu: 4 rows (exalt+debil for each) ✓
planet_naisargika_maitri: 9 rows ✓
```
**Tests:** 14/14 ✓ | **Build:** 25/25 pages ✓

*Last updated: 2026-06-04 | Agent: Claude Sonnet 4.6*
---

## Session 31 — 2026-06-04 | Graha Drishti — Detailed 7 Life-Area Impact Engine

### TASK-070 — Graha Drishti Life-Area Interpretation (Self / Family / Spouse / Money / Career / Health / Spirituality)
**Status:** Done

**Problem:** Graha Drishti showed only a generic one-line summary. Example:
*"Ketu aspects house 12, where Venus, Saturn is placed. Those planets express Loss, Moksha through a karmic tone."*

**Solution:** Built a full interpretation engine that explains HOW each aspecting planet affects each life area through aspected planets in the house.

#### A — New file: server/src/services/helpers/drishti-life-impact.js
- PLANET_KARAKATVA: 9 planets x 7 life areas = 63 entries (what each planet governs per area)
- ASPECT_EFFECT: 9 planets x 7 life areas = 63 entries (how aspecting planet modifies each area)
- HOUSE_MODIFIER: 12 houses x 7 areas = 84 entries (house context per life area)
- generateDrishtiLifeImpact(): combines all 3 tables into 7-area paragraphs per aspecting planet

#### B — drishti-bhavkarak.js
- drishtiHouseReading() now calls generateDrishtiLifeImpact()
- Adds planet_impacts[] to by_house_detail[house] output
- Works for both occupied and empty houses

#### C — KundliDetail.jsx UI
- New DrishtiHouseCard component with expand/collapse state
- New DrishtiAreaRow component: 7 collapsible life-area rows per aspecting planet
- Icons: Self/Family/Spouse/Money/Career/Health/Spirituality
- Bold **planet names** render with emphasis
- EN + HI bilingual support

**Tests:** 14/14 | **Build:** 25/25 pages

*Last updated: 2026-06-04 | Agent: Claude Sonnet 4.6 (Session 31)*

---

## Session 34 — 2026-06-04 | Varshphal → Full Life Coach Guide

### Objective
Expand Varshphal (Annual Solar Return) from a basic 4-tab panel into a comprehensive life coach guide covering all major life domains.

---

### ✅ TASK — Varshphal Life Guide Engine
**Status:** Done
**Files:**
- `server/src/services/helpers/varshphal.js`
- `ui-main/src/components/VarshphalPanel.jsx`

#### Backend (varshphal.js)
- Added `RASHI_LORD` array (12 rashis → natural lords) for whole-sign house lord computation
- Added `getHouseLordPlanet(ascRashiNum, houseNum)` — computes which planet lords any house in the Varsha chart
- Added `buildLifeAreas(varshaChart, houseMap, varshesha)` — comprehensive bilingual engine:

**11 Life Domains with tone + score + detailed reading + planets:**
1. Finance & Wealth (धन और वित्त) — houses 2, 11, 8
2. Luck & Fortune (भाग्य और किस्मत) — houses 9, 5
3. Family & Home (परिवार और घर) — houses 2, 4
4. Spouse & Marriage (जीवनसाथी और विवाह) — house 7
5. Parents (माता-पिता) — houses 4 (mother), 9 (father)
6. Children / Sons & Daughters (संतान) — house 5
7. Siblings / Brothers & Sisters (भाई-बहन) — house 3
8. Education & Learning (शिक्षा और विद्या) — houses 4, 5, 9
9. Job & Service (नौकरी और सेवा) — houses 10, 6
10. Business & Trade (व्यापार और कारोबार) — houses 7, 10, 11
11. Health & Vitality (स्वास्थ्य) — houses 1, 6, 8

**Dynamic Cautions (chart-based):**
- Saturn/Rahu in 8th → sudden events warning
- Multiple malefics in 6th → legal/health alert
- Multiple malefics in 12th → hidden expenses warning
- Saturn/Mars in 7th → partnership caution
- Malefics in 4th → property/home caution
- Lagna lord in trik (6/8/12) → personal energy warning

**Key Advice (5 points, always generated):**
- Varshesha alignment — how to live the year's energy (7 planets each have specific EN+HI guidance)
- Best houses to focus on (top 3 benefic-occupied houses)
- Benefics in trik houses — redirect their energy
- Mudda Dasha timing guidance (when to act)
- Spiritual practice tailored to each of 7 Varshesha planets

- `analyzeVarshaChart` now returns `life_areas` in the payload

#### Frontend (VarshphalPanel.jsx)
- Added 5th tab: "Life Guide / जीवन मार्गदर्शन"
- `LifeAreaCard`: expandable card — icon, tone badge (✦/◆/▲), 1-5 star score, bilingual reading, planet chips
- `CautionCard`: red-tinted card for dynamic chart-based warnings
- `KeyAdviceCard`: gold-tinted card for pre-action guidance
- `LIFE_AREA_ORDER` constant for consistent domain ordering
- Tab order: Year Overview → **Life Guide** → Varsha Chart → House Readings → Mudda Dasha

**Tests:** 14/14 | **Build:** 26/26 pages

*Last updated: 2026-06-04 | Agent: Claude Sonnet 4.6 (Session 34)*

---

## Session 34b–34d (continued) — 2026-06-04

### ✅ Varshphal 5-Year Journey Strip
- `varshphal.js`: Added `compactVarshphal()` — compact per-year summary (score, varshesha, lagna, 11 area tones/scores, caution count)
- New route: `GET /api/kundli/:id/varshphal-years?from=YYYY&count=5` — computes 5 years in one call
- `VarshphalPanel.jsx`: `FiveYearStrip` — always-visible horizontal card strip (year, stars, Varshesha, Lagna, SR date, 6 colored dots, caution badge, "Now" tag). Replaced old 4-button YearSelector.
- `YearAtGlanceTable` added to Overview tab — 11 life area scores at a glance

### ✅ Navbar — Horoscope + Varshphal links
- `Navbar.jsx`: Added `/horoscope` (राशिफल) and `/varshphal` (वर्षफल) to desktop + mobile nav

### ✅ Kundli Strength Report
- NEW `server/src/services/helpers/kundli-strength.js` (18th helper):
  `computeKundliStrength(chart)` — 0-100 score from planets/yogas/life-domains/dasha
  8 life domains (wealth/career/health/marriage/family/children/fortune/spirituality)
  6-tier label (Exceptional→Needs Remedies), top 5 strengths, top 4 challenges
- New route: `GET /api/kundli/:id/strength`
- NEW `KundliStrengthPanel.jsx`: auto-loads on mount, conic-gradient ring, category bars, life domain grid, planet table, strengths/challenges cards
- Added to `KundliDetail.jsx` above KundliInsightPanel

### ✅ Dedicated /varshphal page
- NEW `VarshphalPage.jsx` + `app/varshphal/page.jsx` (page 27)
- Sticky sidebar kundli selector + full VarshphalPanel on right

### ✅ Daily Horoscope — 7 tabs
- `DailyHoroscope.jsx`: Added "Transits" tab (9 planets + house positions + effect descriptions)
- Added "Remedies" tab (rashi-lord based mantra, color, gem, puja, do's & don'ts)
- `PLANET_REMEDY` data for all 9 planets | `RASHI_LORD_MAP` for auto lookup

### ✅ KundliStrengthPanel display fix
- Replaced broken SVG text rotation with `conic-gradient` CSS meter
- Auto-load on mount (was broken lazy-load)
- Fixed category score display (/100 instead of %)
- Coloured card tiles for strengths/challenges

**Tests:** 14/14 | **Build:** 27/27 pages (+1 /varshphal)

*Last updated: 2026-06-04 | Agent: Claude Sonnet 4.6 (Sessions 34b–34d)*
