# Jyotish Stack AI

A full-stack Vedic astrology SaaS platform with bilingual (English + Hindi) support. Built with Node.js, Express, MySQL, and Next.js 14 App Router.

---

## Overview

Jyotish Stack AI provides a complete Vedic astrology engine covering kundli (birth chart) calculation, divisional charts (D1–D60), Vimshottari Dasha, Panchang, Yogas & Doshas, matchmaking (Ashtakoot + Dashakoot supplements), predictions, life reports, and remedies — all with plain-language explanations in English and Hindi. A public blog, testimonials, team, and contact form are served from the same backend. AI-generated personalised readings are powered by Claude Sonnet.

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
| AI Readings | Anthropic Claude Sonnet (`@anthropic-ai/sdk`) |
| Process Manager | PM2 |
| Web Server | Apache 2 (mod_proxy) |

---

## Project Structure

```
jyotish-stack/
├── server/                        # Express API — port 5000
│   └── src/
│       ├── config/                # Knex DB connection + typecasts
│       ├── middleware/            # Auth JWT, maintenance mode guard
│       ├── migrations/            # 23 Knex migrations (001–023)
│       ├── routes/                # auth, kundli, admin, users, subscriptions, public
│       ├── seeds/                 # 18 seed files — reference data + defaults
│       └── services/
│           ├── helpers/           # 25 Vedic calculation helper modules
│           ├── vedic-calc.service.js     # Calculation orchestrator
│           ├── life-report.service.js    # Atmakaraka, Isht Devata, varga analysis
│           ├── ephemeris.service.js      # Astronomical algorithms (Meeus 2nd Ed.)
│           ├── razorpay.service.js       # Razorpay — keys read from DB with env fallback
│           ├── ai-prediction.service.js  # Claude Sonnet AI personalised reading
│           ├── report.service.js         # PDFKit report generation
│           └── email.service.js          # Nodemailer + HTML templates
│
├── ui-main/                       # Main website — jyotishstack.com — port 3000
│   └── src/
│       ├── app/                   # Next.js App Router pages (40 routes)
│       │   ├── blog/              # Public blog listing + article detail ([slug])
│       │   └── admin/             # 16 admin sections
│       ├── admin-components/      # AdminShell, Sidebar (dark cosmos theme)
│       ├── admin-views/           # Admin section components (Blog, Testimonials, Team, Inquiries, Activity, Profile…)
│       ├── components/            # 33 reusable UI panel components
│       ├── context/               # AdminAuthContext, AuthContext, LangContext
│       ├── lib/                   # adminApi, api, i18n helpers
│       └── views/                 # Page-level view components
│
├── ui-in/                         # jyotishstack.in — Hindi-first — port 3001
├── ui-ai-com/                     # jyotishstackai.com — AI tech theme — port 3002
├── ui-ai-in/                      # jyotishstackai.in — Hybrid Hindi+AI — port 3003
│
├── apache/jyotish.conf            # Apache virtual host config (mod_proxy)
├── ecosystem.config.js            # PM2 process manager config
├── deploy.sh                      # One-command deployment script
├── .env.production.example        # Production environment template (SMTP, Razorpay, AI)
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

# Anthropic — required for AI Personalised Reading (optional; shows stub if not set)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxxxxxxxxx

# CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

> **Razorpay keys** can also be stored in the admin panel under **Settings → Payments** — no `.env` change or server restart needed. DB values take priority over env vars.

> **ANTHROPIC_API_KEY** enables the AI Reading tab in every Kundli. Without it the tab shows a graceful "coming soon" stub — no errors.

### 4. Run Migrations & Seeds

```bash
npm run migrate   # Creates all 28 tables across 23 migrations
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
| Dashakoot supplements | Mahendra check + Stree Deergha check (non-scoring, like Rajju/Vedha) |
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

28 tables across 23 migrations:

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

- **Home** — bilingual landing: hero, features, pricing, testimonials (live from DB), team (live from DB), contact form (submits to inquiries table)
- **Blog** (`/blog`) — article listing with category pills, search, pagination; article detail at `/blog/[slug]` with HTML content rendering
- **Pricing** — 3-tier plans (Basic ₹200/mo (no PDF) · Premium ₹499/mo (PDF) · Yearly ₹3,999/yr (PDF, up to 50 profiles)) with bilingual features
- Register / Login / Email Verification / Forgot Password / Reset Password

### Authenticated User

**Dashboard** — quick-access links to Kundli, Matchmaking, Predictions, Panchang

**Kundli Detail** — full chart with 16-tab layout:

| Tab | Content |
|-----|---------|
| Kundli | Today's prediction + D1 chart (North/South toggle), planet table, dasha timeline, house grid |
| Life Report | Soul Profile (Atmakaraka + Isht Devata), Finance, Family, Health, Problems — BPHS narratives |
| Strength | Composite kundli strength score, domain ratings, verdict |
| Planet Impact | How each graha affects 6 life areas (money, career, family, relationships, education, health) |
| Bhava Lords | Bhava lord placements with effects and strength |
| Guidance | Personalised life guidance by domain |
| Varshphal | Solar return chart (annual) |
| GRB Report | General, Planet detail, Varga matrix, Cusp table |
| Varga | D1–D60 with plain-language readings; D60 past-life, D20 spiritual path |
| Digbala | Directional strength per planet |
| Bhav Karak | Karaka lord placements |
| Drishti | Graha Drishti aspects on life areas |
| Yogas | Yoga & Dosha detection with cancellation |
| Fav Days | Auspicious days and nakshatras for the native |
| Final Results | Kundli Synthesis — strength verdict, dominant themes, marriage timing, key remedies |
| AI Reading | Claude Sonnet personalised 4-section Vedic reading (stub shown if no API key) |

Additional features:
- PDF export (premium-gated) — full kundli report via PDFKit
- Edit birth details with Nominatim geocoding (free, no API key)
- Bilingual toggle (EN / HI) — every panel renders in English or Hindi
- Plan badge (🔒 Basic / ⭐ Premium / 👑 Admin) in header

**Matchmaking** — Ashtakoot Guna Milan (36-point score) + Dashakoot supplements (Mahendra, Stree Deergha), compatibility breakdown, PDF report

**Daily Horoscope** — rashi-based forecast for all 12 signs

**Panchang / Muhurta** — today's Panchang with Tithi, Yoga, Karana, auspicious hour finder

**Predictions** — full narrative engine (Identity, Life Areas, Gochar, Remedies, Isht Devata)

---

### Admin Panel (`/admin/*`)

Dark cosmos theme (navy `#06070F` + gold `#D4AF37`). 17 sections:

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
| **Blog** | Create/edit articles with categories, SEO fields, tags, draft/publish, cover image |
| **Testimonials** | Customer reviews — name, role, location, avatar, star rating, featured toggle |
| **Team** | Team member cards with avatar, bio, LinkedIn, Twitter — shown on homepage |
| **Inquiries** | Contact form inbox — new/read/replied status, admin notes, stats bar |
| **Panchang Muhurta** | Admin view of today's Panchang |
| **Activity Log** | Audit trail of all admin actions (entity, action, IP, timestamp) |
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
| Public | `/public` | None |
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
POST   /api/kundli/:uuid/ai-reading           Claude Sonnet AI personalised reading
POST   /api/kundli/matchmaking/request        Calculate Ashtakoot + Dashakoot
GET    /api/kundli/matchmaking/list           List matchmaking requests

# Subscriptions
POST   /api/subscriptions/order              Create Razorpay order
POST   /api/subscriptions/verify             Verify payment + activate plan

# Public — no auth required
GET    /api/public/blog                      Paginated blog posts (category + search filter)
GET    /api/public/blog-categories           All blog categories
GET    /api/public/blog/:slug                Single post by slug (increments view_count)
GET    /api/public/testimonials              Featured testimonials (is_featured=true)
GET    /api/public/team                      Active team members (is_active=true)
POST   /api/public/contact                   Submit contact form → inquiries table (rate-limited 5/hr)

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
3. DB value takes priority; singleton instance is reset (`resetInstance()`) whenever keys are updated
4. User selects a plan → `POST /api/subscriptions/order` → Razorpay checkout opens
5. On payment success → `POST /api/subscriptions/verify` validates HMAC signature → `users.plan` is updated to match the purchased tier → plan activated

### Plan Tiers & Feature Gating

| Plan | Price | Billing | Kundli Profiles | PDF Export |
|------|-------|---------|------------------|------------|
| Basic | ₹200 | Monthly | 1 | ❌ |
| Premium | ₹499 | Monthly | 5 | ✅ |
| Yearly | ₹3,999 | Annual | 50 | ✅ |

- `users.plan` enum: `'basic' \| 'premium' \| 'yearly'` (migration 023)
- Profile limit enforced server-side in `POST /api/kundli` (`PLAN_PROFILE_LIMITS` in `kundli.routes.js`)
- PDF export blocked for `plan === 'basic'` in `GET /api/kundli/:id/report.pdf` (admins always bypass)
- Admin role always has full access regardless of `plan` value

---

## Production Deployment

### Required modules (Apache)

```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite ssl headers
sudo cp apache/jyotish.conf /etc/apache2/sites-available/jyotish.conf
# Edit ServerName in jyotish.conf, then:
sudo a2ensite jyotish
sudo certbot --apache -d yourdomain.com   # free SSL via Let's Encrypt
```

### Deploy script

```bash
# First time only — install PM2 globally
npm install -g pm2

# Copy and fill in production env
cp .env.production.example server/.env
# Edit server/.env with real DB password, JWT secret, SMTP, Razorpay, Anthropic key

# Deploy (run from /var/www/jyotish-stack)
bash deploy.sh
```

`deploy.sh` performs: `git pull` → `npm install` → DB migrations → Next.js build → `pm2 reload` → `apache2 reload`.

### SMTP options

See `.env.production.example` for setup instructions for **Gmail App Password**, **Brevo** (free tier), or **SendGrid**.

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
- **AI reading:** `ai-prediction.service.js` returns `{ available: false, stub: true }` when `ANTHROPIC_API_KEY` is absent — no errors, graceful UI fallback
- **Service helpers:** `vedic-calc.service.js` is a lean orchestrator; all domain logic is split across 25 independent helper modules for testability
- **Admin audit:** Every create/update/delete action in admin routes calls `logActivity()` — a non-fatal fire-and-forget that writes to `activity_logs`
- **Settings upsert:** Admin settings PATCH uses `onConflict('key').merge()` — new keys are created on first save without needing a seed re-run
- **Contact rate limit:** `POST /api/public/contact` is limited to 5 requests per IP per hour via `express-rate-limit`
- **Hindi date formatting:** Raw `YYYY-MM-DD` strings from the backend (e.g. `meta.date` in Today's Prediction) are localized client-side with `toLocaleDateString('hi-IN', { dateStyle: 'medium' })` rather than shown verbatim — keeps dates fully translated alongside surrounding Hindi text

---

## Roadmap

- [x] Varshphal (Solar Return) chart
- [x] Bilingual UI (EN + HI) throughout
- [x] Razorpay live key management via admin panel
- [x] PDF export (premium-gated)
- [x] Kundli Synthesis / Final Results tab
- [x] Admin CMS — Blog, Testimonials, Inquiries, Team, Activity Log
- [x] Dashakoot compatibility supplements (Mahendra + Stree Deergha)
- [x] AI-generated personalised predictions (Claude Sonnet)
- [x] Public blog frontend (`/blog` + `/blog/[slug]`)
- [x] Public testimonials + team sections on homepage
- [x] Contact form wired to inquiries table
- [x] Production deployment config (Apache, PM2, deploy.sh)
- [x] SMTP production configuration documented
- [x] Three-tier paid pricing (Basic ₹200 no-PDF · Premium ₹499 PDF · Yearly ₹3,999 up to 50 profiles)
- [ ] Swiss Ephemeris integration for production-grade accuracy verification
- [ ] Matchmaking view: display Mahendra + Stree Deergha fields
- [ ] Admin users page: plan management column (set user plan)
- [ ] ui-in, ui-ai-com, ui-ai-in full feature builds

---

## License

Private — all rights reserved. Not open for public use or redistribution.
