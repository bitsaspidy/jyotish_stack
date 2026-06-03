# Jyotish Stack AI

A full-stack Vedic astrology SaaS platform with bilingual (English + Hindi) support. Built with Node.js, Express, MySQL, and Next.js 14.

---

## Overview

Jyotish Stack AI provides a complete Vedic astrology engine covering kundli (birth chart) calculation, divisional charts (D1–D60), Vimshottari Dasha, Panchang, Yogas & Doshas, matchmaking (Ashtakoot), predictions, and remedies — all with plain-language explanations for normal users in both English and Hindi.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend API | Node.js + Express 4 |
| Database ORM | Knex.js + MySQL 8 |
| Frontend (main) | Next.js 14 App Router |
| Payments | Razorpay |
| Email | Nodemailer (SMTP) |
| PDF Reports | PDFKit |
| Auth | JWT (access + refresh tokens) |

---

## Project Structure

```
jyotish-stack/
├── server/                  # Express API (port 5000)
│   ├── src/
│   │   ├── config/          # DB connection (Knex)
│   │   ├── middleware/      # Auth, maintenance mode
│   │   ├── migrations/      # 16 Knex migrations (001–016)
│   │   ├── routes/          # auth, kundli, admin, users, subscriptions, etc.
│   │   ├── seeds/           # 13 seed files
│   │   ├── services/
│   │   │   ├── helpers/     # 13 vedic calculation helper modules
│   │   │   ├── vedic-calc.service.js   # Main calculation orchestrator
│   │   │   ├── life-report.service.js  # Atmakaraka, Isht Devata, Varga analysis
│   │   │   ├── ephemeris.service.js    # Astronomical algorithms (Meeus 2nd Ed.)
│   │   │   ├── report.service.js       # PDF generation
│   │   │   └── email.service.js        # Nodemailer templates
│   │   └── utils/           # Response helpers, token utils
│   └── tests/
│
├── ui-main/                 # Main website — jyotishstack.com (port 3000)
│   └── src/
│       ├── app/             # Next.js App Router pages
│       ├── components/      # Reusable UI components
│       ├── context/         # AuthContext, LangContext
│       ├── lib/             # API client, i18n helpers
│       └── views/           # Page-level view components
│
├── ui-in/                   # jyotishstack.in — Hindi-first (port 3001)
├── ui-ai-com/               # jyotishstackai.com — AI tech theme (port 3002)
├── ui-ai-in/                # jyotishstackai.in — Hybrid Hindi+AI (port 3003)
├── ui-admin/                # Admin panel stub (merged into ui-main at /admin/*)
│
├── ACTIVITY.md              # Chronological development log (all sessions)
└── package.json             # npm workspaces root
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
| Admin Panel | ui-main | 3000/admin/* | — |

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

Copy `server/.env.example` to `server/.env` and fill in your values:

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

# Razorpay (payments)
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret

# CORS origins
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Run Migrations & Seeds

```bash
npm run migrate   # Creates all 16 tables
npm run seed      # Seeds default admin, plans, reference data
```

### 5. Start Development

```bash
npm run dev:server   # API on http://localhost:5000
npm run dev:main     # Main UI on http://localhost:3000
```

---

## Default Credentials

After seeding, a superadmin account is created:

| Field | Value |
|-------|-------|
| Email | admin@jyotishstack.com |
| Password | Admin@2026! |
| Admin URL | http://localhost:3000/admin/login |

> **Change these before any production deployment.**

---

## Available Scripts

```bash
# Development
npm run dev:server      # API server
npm run dev:main        # Main website
npm run dev:in          # Hindi website
npm run dev:ai-com      # AI .com website
npm run dev:ai-in       # AI .in website

# Database
npm run migrate         # Apply all pending migrations
npm run migrate:rollback  # Rollback last migration batch
npm run seed            # Run all seed files

# Testing & Build
npm run test:server     # Server unit tests (Node built-in runner)
npm run build:main      # Production build for ui-main
npm run build:admin     # Production build for ui-admin
```

---

## Vedic Calculation Engine

Built on Meeus *Astronomical Algorithms* (2nd Ed.) with Lahiri ayanamsa.

| Calculation | Accuracy |
|-------------|----------|
| Sun longitude | ~0.01° |
| Moon longitude | ~0.1° |
| Rahu (mean node) | ~0.1° |
| Mars / Mercury / Jupiter / Venus / Saturn | ~0.5–2° |
| Ascendant | ~0.1° |
| Ayanamsa | Lahiri — 23.85317° at J2000 + 50.2796″/yr |

**Outputs per chart:**
- 9 grahas — sidereal longitude, rashi, dignity, retrograde, daily motion
- Ascendant + whole-sign house system (1–12)
- 18 Varga / Divisional charts (D1–D60)
- Vimshottari Mahadasha + Antardasha (full 9-period sequence)
- Panchang — Tithi, Yoga, Karana, Vara, Masa, Sunrise/Sunset, Pahar
- Astro details — Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya
- Graha Drishti, Bhav Karak, Digbala
- Mangal Dosha detection
- Ashtakoot Guna Milan (36 points matchmaking)
- Gochar transit summary (Sade Sati, Jupiter, Rahu-Ketu axis)
- Yoga & Dosha detection (12 yogas, 13 dosha types)
- Atmakaraka + Isht Devata (Parashara BPHS method)
- D60 Past Life Reading + D20 Spiritual Path analysis
- Rule-based life area predictions

---

## Database Schema

26 tables across 16 migrations:

| Category | Tables |
|----------|--------|
| Users & Auth | users, user_sessions |
| App Config | app_settings |
| Kundli | kundli_profiles, matchmaking_requests, predictions |
| Subscriptions | subscription_plans, user_subscriptions |
| Communication | notifications, newsletter_subscribers, email_logs |
| Vedic Reference | planets, zodiac_signs, houses, nakshatras, planet_dignity |
| House Interpretations | house_lord_interpretations |
| Varga Charts | varga_charts, varga_chart_relationships, varga_family_references |
| Yogas & Doshas | yogas_library, doshas_library |
| Remedies | remedy_planets, remedy_problems, remedy_puja_steps |
| Jyotish Fundamentals | jyotish_basics |
| Kundli Indexing | (index on kundli_profiles) |

---

## UI Features (ui-main)

### Public Pages
- Home, Pricing, About
- Register / Login / Email Verification / Password Reset

### Authenticated User
- **Dashboard** — overview with links to Kundli, Matchmaking, Predictions
- **Kundli Manager** — create, list, open profiles
- **Kundli Detail** — full chart with:
  - D1 + D9 charts (North / South Indian toggle)
  - Planet table, Dasha timeline, House grid
  - Panchang / Ghat Chakra / Astro Details
  - Personality Insights (nakshatra-based traits, career, health)
  - Life Portrait (Who You Are / Current Period)
  - Life Report (Soul Profile, Finance, Family, Health, Problems)
  - Kundli Insight — plain-language guide (Summary, Planets, Houses, Health Guide)
  - **Planet Life Impact** — how each graha affects money, career, family, relationships, education, health
  - Mangal Dosha, Gochar, Digbala, Bhav Karak, Graha Drishti
  - Yogas & Doshas panel (with cancellation status)
  - Varga / Divisional Charts (D1–D60 with plain-language readings, D60 past-life, D20 spiritual path)
  - Detailed Reports (General, Planet, Varga Matrix, Planet Details, Cusps)
  - Event Timing + Upcoming Antardasha Signals
  - Vedic Remedies (Dasha remedy, Lagna remedy, Puja sequence)
  - PDF export
  - Edit birth details with Nominatim geocoding (free, no API key)
- **Matchmaking** — Ashtakoot Guna Milan + PDF report
- **Predictions** — full narrative engine (Identity, Life Areas, Gochar, Remedies, Isht Devata)

### Admin Panel (`/admin/*`)
- Dashboard (user stats, subscribers, revenue)
- User management (activate/deactivate, roles)
- Subscription plan management
- App settings + maintenance mode toggle
- Newsletter subscriber list + email blast
- Notification sender
- Email logs

---

## API Reference

Base URL: `http://localhost:5000/api`

| Module | Prefix | Auth |
|--------|--------|------|
| Authentication | `/auth` | Partial |
| User Profile | `/users` | Required |
| Kundli | `/kundli` | Required |
| Subscriptions | `/subscriptions` | Partial |
| Newsletter | `/newsletter` | — |
| Settings | `/settings` | — |
| Admin | `/admin` | Admin only |

Key kundli endpoints:

```
POST   /api/kundli                        Create + auto-calculate
GET    /api/kundli                        List (with chart_summary)
GET    /api/kundli/:uuid                  Full chart (auto-recalculates if stale)
POST   /api/kundli/:uuid/recalculate      Force fresh calculation
PATCH  /api/kundli/:uuid                  Update birth details
GET    /api/kundli/:uuid/report.pdf       Download PDF report
POST   /api/kundli/matchmaking/request    Calculate Ashtakoot
GET    /api/kundli/matchmaking/list       List matchmaking requests
GET    /api/kundli/reference/varga        Varga chart reference data
```

---

## Design System

**Theme:** Royal Cosmos — deep navy cosmos with gold accents

| Token | Value | Use |
|-------|-------|-----|
| cosmos-800 | #0B0D1A | Page background |
| cosmos-700 | #111428 | Card background |
| gold | #D4AF37 | Primary accent |
| ivory | #F5F0E8 | Body text |
| saffron | #FF9933 | Hindi / accent |

**Fonts:** Playfair Display (headings) · Inter (body) · Noto Sans Devanagari (Hindi)

---

## Data Sources

All Vedic reference data is sourced from the **AstroAnsh** course series by Saiansh Arya:

- Class 1 — Vedas, Vedangas, Jyotish Angas, Karma Theory, BPHS Graha attributes
- Class 2 — Nine Grahas (bilingual)
- Class 3 & 4 — Gunas, Rashis, Bhavas (BPHS)
- Class 8 — Nakshatra table (27 nakshatras with Gandmool)
- Class 9 — Detailed Nakshatra notes (characteristics, professions, health)
- Class 11 & 12 — Yogas & Doshas (BPHS-based, 12 yogas + 13 dosha types)
- Remedy Class 1 — Ishta Devata, mantras, puja sequence
- Divisional Charts reference — Shodash Varga (D1–D60)
- Drishti, Bhav Karak, Digbala reference

Astronomical calculations follow Meeus *Astronomical Algorithms* (2nd Ed.).

---

## Development Notes

- **House system:** Whole-sign throughout
- **Ayanamsa:** Lahiri (Chitra-paksha)
- **DATE typeCast:** MySQL2 returns DATE as JS Date objects by default — fixed via `typeCast` in `knexfile.js` to return plain `"YYYY-MM-DD"` strings
- **Calculation service:** `vedic-calc.service.js` is a 181-line orchestrator; all logic lives in `server/src/services/helpers/` (13 modules)
- **Chart freshness:** `ensureCalculatedChart` checks for specific fields added in each session — stale charts auto-recalculate on next API access
- **Bilingual pattern:** Every DB table with user-facing content has `_en` and `_hi` columns; UI uses `lang` context to pick the right one

---

## Roadmap

- [ ] Swiss Ephemeris integration for production-grade accuracy verification
- [ ] Dashakoot compatibility scoring
- [ ] Daily Rashi horoscope engine
- [ ] Annual Varshphal (Solar Return) chart
- [ ] AI-generated personalised predictions (Claude API)
- [ ] SMTP configuration (production)
- [ ] Razorpay live keys
- [ ] Production deployment (VPS / cloud)
- [ ] ui-in, ui-ai-com, ui-ai-in full feature builds

---

## License

Private — all rights reserved. Not open for public use or redistribution.
