# Jyotish Stack AI

A full-stack Vedic astrology SaaS platform with bilingual (English + Hindi) support. Built with Node.js, Express, MySQL, and Next.js 14 App Router.

---

## Overview

Jyotish Stack AI provides a complete Vedic astrology engine covering kundli (birth chart) calculation, divisional charts (D1–D60), Vimshottari Dasha, Panchang, Yogas & Doshas, matchmaking (Ashtakoot), predictions, life reports, and remedies — all with plain-language explanations in both English and Hindi.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Node.js + Express 4 |
| Database ORM | Knex.js + MySQL 8 |
| Frontend | Next.js 14 App Router |
| Auth | JWT (access + refresh tokens) |
| Payments | Razorpay (keys managed via admin DB) |
| Email | Nodemailer (SMTP) |
| PDF Reports | PDFKit |
| Geocoding | Nominatim (free, no API key) |

---

## Project Structure

```
jyotish-stack/
├── server/                        # Express API — port 5000
│   └── src/
│       ├── config/                # Knex DB connection + typecasts
│       ├── middleware/            # Auth JWT, maintenance mode guard
│       ├── migrations/            # 27 Knex migrations (001–027)
│       ├── routes/                # auth, kundli, admin, users, subscriptions, settings
│       ├── seeds/                 # 18 seed files — reference data + defaults
│       ├── services/
│       │   ├── helpers/           # 25 Vedic calculation helper modules
│       │   ├── vedic-calc.service.js     # Calculation orchestrator
│       │   ├── life-report.service.js    # Atmakaraka, Isht Devata, varga analysis
│       │   ├── ephemeris.service.js      # Astronomical algorithms (Meeus 2nd Ed.)
│       │   ├── razorpay.service.js       # Razorpay — keys read from DB with env fallback
│       │   ├── report.service.js         # PDFKit report generation
│       │   └── email.service.js          # Nodemailer + HTML templates
│       └── utils/                 # Response helpers, token utils
│
├── ui-main/                       # Main website — jyotishstack.com — port 3000
│   └── src/
│       ├── app/                   # Next.js App Router pages (36 routes)
│       ├── admin-components/      # AdminShell, Sidebar (dark cosmos theme)
│       ├── admin-views/           # Admin section components
│       ├── components/            # 32 reusable UI panel components
│       ├── context/               # AdminAuthContext, AuthContext, LangContext
│       ├── lib/                   # adminApi, api, i18n helpers
│       └── views/                 # Page-level view components
│
├── ui-in/                         # jyotishstack.in — Hindi-first — port 3001
├── ui-ai-com/                     # jyotishstackai.com — AI tech theme — port 3002
├── ui-ai-in/                      # jyotishstackai.in — Hybrid Hindi+AI — port 3003
│
├── ACTIVITY.md                    # Chronological development log (all sessions)
└── package.json                   # npm workspaces root
```

---

## Domains & Ports

| Domain | Package | Port | Theme |
|--------|---------|------|-------|
| jyotishstack.com | ui-main | 3000 | Royal Cosmos (navy + gold) |
| jyotishstack.in | ui-in | 3001 | Devotional Saffron (Hindi-first) |
| jyotishstackai.com | ui-ai-com | 3002 | AI Tech (cyan + violet) |
| jyotishstackai.in | ui-ai-in | 3003 | Hybrid Saffron + Cyan |
| API | server | 5000 | — |
| Admin Panel | ui-main | 3000/admin/* | Dark Cosmos (navy + gold) |

---

## Getting Started

### Prerequisites

- Node.js 18+
- MySQL 8.0
- npm 9+

### 1. Clone & Install

```bash
git clone https://github.com/bitsaspidy/jyotish_stack.git
cd jyotish-stack
npm install
```

### 2. Create the Database

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS jyotish_stack_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3. Configure Environment

Copy `server/.env.example` to `server/.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=jyotish_stack_ai_db

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret

# SMTP (for emails)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
SMTP_FROM=Jyotish Stack AI <noreply@jyotishstack.com>

# Razorpay — optional fallback (keys can be set via admin Settings panel instead)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_key_secret

# CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

> **Razorpay keys** can also be stored directly in the admin panel under **Settings → Payments** — no `.env` change or server restart needed. DB values take priority over env vars.

### 4. Run Migrations & Seeds

```bash
npm run migrate   # Creates all 34 tables across 27 migrations
npm run seed      # Seeds defaults, plans, all Vedic reference data
```

### 5. Start Development

```bash
npm run dev:server   # API on http://localhost:5000
npm run dev:main     # Main UI on http://localhost:3000
```

---

## Default Credentials

After seeding:

| Role | Email | Password | URL |
|------|-------|----------|-----|
| Superadmin | admin@jyotishstack.com | Admin@2026! | /admin/login |
| Test User | client@jyotishstack.com | Client@2026! | /login |

> **Change both passwords before any production deployment.**

---

## Available Scripts

```bash
# Development
npm run dev:server        # API server (nodemon)
npm run dev:main          # Main website

# Database
npm run migrate           # Apply all pending migrations
npm run migrate:rollback  # Rollback last batch
npm run seed              # Run all seed files

# Build
npm run build:main        # Production build (Next.js)

# Testing
npm run test:server       # Server unit tests (Node built-in runner)
```

---

## Vedic Calculation Engine

Built on Meeus *Astronomical Algorithms* (2nd Ed.) with Lahiri (Chitra-paksha) ayanamsa. All logic is in 25 helper modules under `server/src/services/helpers/`.

| Calculation | Notes |
|-------------|-------|
| 9 Grahas | Sidereal longitude, rashi, nakshatra, dignity, retrograde, daily motion |
| Ascendant | Whole-sign house system (1–12) |
| Ayanamsa | Lahiri — 23.85317° at J2000 + 50.2796″/yr |
| Divisional charts | 18 Varga charts — D1 through D60 |
| Dasha | Vimshottari Mahadasha + all 9 Antardasha sequences (81 narratives) |
| Panchang | Tithi, Yoga, Karana, Vara, Masa, Nakshatra, Sunrise/Sunset, Pahar |
| Avakahada | Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya |
| Ashtakoot | 8-factor Guna Milan (36 points), matchmaking PDF report |
| Gochar | Sade Sati tracker, Jupiter transit, Rahu-Ketu axis |
| Yogas & Doshas | 12 yoga types + 13 dosha types with cancellation detection |
| Atmakaraka | Parashara BPHS method → Isht Devata derivation |
| Asta Vakri | Retrograde strength scoring per planet |
| Drishti | Graha Drishti + Bhav Karak + Digbala |
| Varshphal | Solar return chart (annual) |
| Kundli Strength | Composite strength score with verdict + domain ratings |
| Marriage Timing | Window detection with rating and reason |
| Mangal Dosha | Detection with cancellation rules |

**Helper modules (25):**
`core-helpers`, `dasha-calc`, `panchang`, `varga-calc`, `varga-insights`, `ashtakoot`, `yogas-doshas`, `mangal-dosha`, `gochar`, `drishti-bhavkarak`, `drishti-life-impact`, `life-guidance`, `life-report-narrative`, `placement-narratives`, `predictions-engine`, `cosmic-extras`, `cosmic-insights`, `kundli-strength`, `prediction-data`, `today-prediction`, `vedic-data`, `varshphal`, `daily-horoscope`, `favourite-days`, `detailed-reports`

---

## Database Schema

34 tables across 27 migrations:

| Category | Tables |
|----------|--------|
| Users & Auth | `users`, `user_sessions` |
| App Config | `app_settings` |
| Kundli | `kundli_profiles`, `matchmaking_requests`, `predictions` |
| Subscriptions | `subscription_plans`, `user_subscriptions` |
| Communication | `notifications`, `newsletter_subscribers`, `email_logs` |
| Vedic Reference | `planets`, `zodiac_signs`, `houses`, `nakshatras`, `planet_dignity` |
| House Interpretations | `house_lord_interpretations`, `house_lord_examples`, `bhava_lord_readings` |
| Varga Charts | `varga_charts`, `varga_chart_relationships`, `varga_family_references` |
| Yogas & Doshas | `yogas_library`, `doshas_library` |
| Remedies | `remedy_planets`, `remedy_problems`, `remedy_puja_steps`, `remedy_class1` |
| Jyotish Fundamentals | `jyotish_basics`, `asta_vakri_library` |
| CMS | `blog_categories`, `blog_posts`, `testimonials`, `inquiries`, `team_members` |
| Audit | `activity_logs` |

---

## UI Features (ui-main)

### Public Pages
- **Home** — bilingual landing with plans, testimonials, features
- **Pricing** — 3-tier plans (Basic ₹0 · Premium ₹499/mo · Yearly ₹3,999/yr) with bilingual features
- Register / Login / Email Verification / Forgot Password / Reset Password

### Authenticated User

**Dashboard** — quick-access links to Kundli, Matchmaking, Predictions, Panchang

**Kundli Detail** — full chart with tabbed layout:

| Tab | Panels |
|-----|--------|
| Overview | D1 chart (North/South Indian toggle), Planet table, Dasha timeline, House grid |
| Panchang | Tithi, Yoga, Vara, Nakshatra, Ghat Chakra, Avakahada, Astro details |
| Insights | Personality Insights, Life Portrait (Who You Are / Current Period) |
| Life Report | Soul Profile, Finance, Family, Health, Problems — detailed BPHS narratives |
| Kundli Insight | Plain-language summary (planets, houses, health guide) |
| Planet Impact | How each graha affects 6 life areas (money, career, family, relationships, education, health) |
| Charts & Doshas | Mangal Dosha, Gochar (Sade Sati), Digbala, Bhav Karak, Graha Drishti, Yogas & Doshas |
| Varga Charts | D1–D60 with plain-language readings; D60 past-life, D20 spiritual path |
| Reports | General, Planet detail, Varga matrix, Cusp table |
| More | Mahadasha Journey (81 antardasha narratives), AstaVakri, BhavaLord, Today's Prediction, Favourite Days |
| Remedies | Dasha remedy, Lagna remedy, Manual remedy guide, Puja sequence |
| Results | **Kundli Synthesis** — strength verdict, dominant themes, key life domains, marriage timing, key remedies |

Additional features:
- PDF export (premium-gated) — full kundli report via PDFKit
- Edit birth details with Nominatim geocoding (free, no API key)
- Varshphal (Solar Return) chart
- Bilingual toggle (EN / HI) — every panel renders in English or Hindi

**Matchmaking** — Ashtakoot Guna Milan (36-point score), compatibility breakdown, PDF report

**Daily Horoscope** — rashi-based forecast for all 12 signs

**Panchang / Muhurta** — today's Panchang with Tithi, Yoga, Karana, auspicious hour finder

**Predictions** — full narrative engine (Identity, Life Areas, Gochar, Remedies, Isht Devata)

---

### Admin Panel (`/admin/*`)

Dark cosmos theme (navy `#06070F` + gold `#D4AF37`). 15 sections:

| Section | Description |
|---------|-------------|
| **Dashboard** | User count, subscriber count, revenue summary |
| **Users** | Full user list — activate/deactivate, change role, view subscriptions |
| **Plans** | Subscription plan management (price, duration, features) |
| **Kundli Profiles** | Browse all user kundlis, admin detail view |
| **Knowledge Base** | Jyotish reference data viewer |
| **Newsletter** | Subscriber list with export |
| **Email Blast** | Send bulk email to all subscribers |
| **Email Logs** | History of all sent emails |
| **Notifications** | Push notifications to users |
| **Blog** | Create/edit articles with categories, SEO fields, draft/publish status |
| **Testimonials** | Customer reviews — star rating, featured toggle |
| **Team** | Team member cards shown on website |
| **Inquiries** | Contact form inbox with new/read/replied status + admin notes |
| **Panchang Muhurta** | Admin view of today's Panchang |
| **Activity Log** | Audit trail of all admin actions (entity, action, IP) |
| **Settings** | Site config, maintenance mode, **Razorpay API keys (Key ID + Secret)** |
| **My Profile** | Admin account details + password change |

---

## API Reference

Base URL: `http://localhost:5000/api`

| Module | Prefix | Auth |
|--------|--------|------|
| Authentication | `/auth` | Partial |
| User Profile | `/users` | Required |
| Kundli | `/kundli` | Required |
| Subscriptions | `/subscriptions` | Partial |
| Newsletter | `/newsletter` | Public |
| Public Settings | `/settings/public` | Public |
| Admin | `/admin` | Admin only |

Key endpoints:

```
# Kundli
POST   /api/kundli                            Create + auto-calculate chart
GET    /api/kundli                            List (with chart_summary)
GET    /api/kundli/:uuid                      Full chart (auto-recalculates if stale)
POST   /api/kundli/:uuid/recalculate          Force fresh calculation
PATCH  /api/kundli/:uuid                      Update birth details
GET    /api/kundli/:uuid/report.pdf           PDF export (premium only)
POST   /api/kundli/matchmaking/request        Calculate Ashtakoot Guna Milan
GET    /api/kundli/matchmaking/list           List matchmaking requests

# Subscriptions
POST   /api/subscriptions/order              Create Razorpay order
POST   /api/subscriptions/verify             Verify payment + activate plan

# Admin — Settings
GET    /api/admin/settings                   All settings (secret masked as [SET])
PATCH  /api/admin/settings                   Upsert any setting including Razorpay keys

# Admin — Blog
GET    /api/admin/blog                       List posts (paginated, status filter)
POST   /api/admin/blog                       Create post
GET/PUT/DELETE /api/admin/blog/:id           Get / update / delete post
GET    /api/admin/blog/categories            List categories
POST   /api/admin/blog/categories            Create category

# Admin — Inquiries
GET    /api/admin/inquiries                  List (paginated, status filter)
GET    /api/admin/inquiries/stats            new / read / replied counts
PATCH  /api/admin/inquiries/:id              Update status + admin note
```

---

## Payment Flow

1. Admin sets **Razorpay Key ID** and **Key Secret** in admin panel → **Settings → Payments**
2. Keys are stored in `app_settings` table; `razorpay.service.js` reads from DB with `process.env` as fallback
3. Enabling the **Enable Payments** toggle shows the payment UI to users
4. User selects a plan → `POST /api/subscriptions/order` → Razorpay checkout opens
5. On payment success → `POST /api/subscriptions/verify` validates HMAC signature → plan activated

---

## Design System

**Theme:** Royal Cosmos — deep navy with gold accents

| Token | Value | Use |
|-------|-------|-----|
| `#0A0C18` | cosmos-800 | Page background |
| `#111428` | cosmos-700 | Card / panel background |
| `#D4AF37` | gold | Primary accent, headings |
| `#F5F0E8` | ivory | Body text |
| `#FF9933` | saffron | Hindi accent |

**Fonts:** Georgia / Playfair Display (headings) · Inter (body) · Noto Sans Devanagari (Hindi)

**Bilingual pattern:** All user-facing DB columns carry `_en` and `_hi` variants. Frontend uses `LangContext` to pick the right one. The language toggle is available on every authenticated page.

---

## Data Sources

All Vedic reference content sourced from the **AstroAnsh** course series by Saiansh Arya:

| Class | Content |
|-------|---------|
| Class 1 | Vedas, Vedangas, Jyotish Angas, Karma Theory, BPHS Graha attributes |
| Class 2 | Nine Grahas — bilingual attributes |
| Class 3 & 4 | Gunas, Rashis, Bhavas (BPHS) |
| Class 7 | Bhava lord readings — house-lord combinations |
| Class 8 | Nakshatra table (27 nakshatras with Gandmool) |
| Class 9 | Detailed Nakshatra notes (characteristics, professions, health) |
| Class 11 & 12 | Yogas & Doshas — 12 yogas + 13 dosha types |
| Class 13 | Asta Vakri (retrograde library) |
| Remedy Class 1 | Ishta Devata, mantras, puja sequence, planet remedies |
| Divisional Charts | Shodash Varga reference (D1–D60) |
| Drishti reference | Graha Drishti, Bhav Karak, Digbala |

Astronomical algorithms: Meeus *Astronomical Algorithms* (2nd Ed.).

---

## Development Notes

- **House system:** Whole-sign throughout (no cusp system)
- **Ayanamsa:** Lahiri (Chitra-paksha)
- **DATE typecast:** MySQL2 returns DATE columns as JS Date objects — fixed via `typeCast` in `knexfile.js` to return plain `"YYYY-MM-DD"` strings
- **Calculation freshness:** `ensureCalculatedChart()` checks for marker fields added each session — stale charts auto-recalculate on next API access without user action
- **Razorpay secret:** Never exposed via API — masked as `[SET]` sentinel in admin settings GET. Raw value lives only in the DB and never crosses the wire after initial save
- **Service helpers:** `vedic-calc.service.js` is a lean orchestrator; all domain logic is split across 25 independent helper modules for testability
- **Admin audit:** Every create/update/delete action in admin routes calls `logActivity()` — a non-fatal fire-and-forget that writes to `activity_logs`
- **Settings upsert:** Admin settings PATCH uses `onConflict('key').merge()` — new keys are created on first save without needing a seed re-run

---

## Roadmap

- [x] Varshphal (Solar Return) chart
- [x] Bilingual UI (EN + HI) throughout
- [x] Razorpay live key management via admin panel
- [x] PDF export (premium-gated)
- [x] Kundli Synthesis / Results tab
- [x] Admin CMS — Blog, Testimonials, Inquiries, Team
- [x] Activity audit log
- [ ] Swiss Ephemeris integration for production-grade accuracy verification
- [ ] Dashakoot compatibility scoring
- [ ] AI-generated personalised predictions (Claude API)
- [ ] Public blog frontend (render `blog_posts` table)
- [ ] Public testimonials / team sections on homepage
- [ ] Contact form wired to `inquiries` table
- [ ] Production deployment (VPS / cloud)
- [ ] SMTP production configuration
- [ ] ui-in, ui-ai-com, ui-ai-in full feature builds

---

## License

Private — all rights reserved. Not open for public use or redistribution.
