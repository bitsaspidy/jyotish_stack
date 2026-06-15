# Jyotish Stack AI — Project Memory

> This file is the single source of truth for any AI agent working on this project.
> Always read this file first before making any changes.
> Last updated: 2026-06-15 (Session 46)

---

## 1. Project Overview

**Product Name:** Jyotish Stack AI  
**Hindi Name:** ज्योतिष स्टैक AI  
**Tagline:** Ancient Wisdom. Modern Intelligence.  
**Hindi Tagline:** प्राचीन ज्ञान। आधुनिक बुद्धि।  
**Purpose:** Vedic astrology platform offering Kundli generation, Bhavishya Vani (predictions), Kundli matchmaking, Dasha/Nakshatra analysis — powered by real astronomical calculations.  
**Languages:** Hindi (`hi`) + English (`en`) — all user-facing content must support both.  
**Target Year:** 2026 — design must be royal, premium, AI-era aesthetic.

---

## 2. Domains

| Domain | UI Package | Port (dev) | Notes |
|--------|-----------|------------|-------|
| `jyotishstack.com` | `ui-main` | 3000 | **Primary** — English-focused, premium |
| `jyotishstack.in` | `ui-in` | 3001 | India-focused, Hindi-first |
| `jyotishstackai.com` | `ui-ai-com` | 3002 | AI-branded variant |
| `jyotishstackai.in` | `ui-ai-in` | 3003 | AI-branded India variant |
| Admin panel | merged into ui-main | `/admin/*` | Accessible at jyotishstack.com/admin/login |
| API server | `server` | 5000 | Single backend for all 4 UIs |

**Note:** `ui-admin` package still exists but is NOT the primary admin panel. The admin is merged into `ui-main` at `/admin/*` routes.

---

## 3. Repository Structure

```
jyotish-stack/
├── MEMORY.md                  ← YOU ARE HERE
├── ACTIVITY.md                ← Full task-by-task log of all sessions
├── package.json               ← npm workspaces root (6 packages)
├── server/                    ← Express + Knex backend (port 5000)
│   ├── .env                   ← DB, JWT, SMTP, Razorpay, CORS env vars
│   ├── knexfile.js            ← Knex config (dev + prod); DATE/DATETIME typeCast fix
│   ├── src/
│   │   ├── index.js           ← main entry (port 5000)
│   │   ├── config/db.js       ← Knex instance
│   │   ├── data/
│   │   │   └── varga-reference.js   ← 18 Varga chart definitions (VARGA_DEFINITIONS)
│   │   ├── middleware/
│   │   │   ├── auth.js        ← JWT authenticate, requireRole
│   │   │   └── maintenance.js ← Coming Soon guard (30s cache)
│   │   ├── migrations/        ← 013 files total (run: npm run migrate)
│   │   │   ├── 001_create_users.js
│   │   │   ├── 002_create_app_settings.js
│   │   │   ├── 003_create_kundli.js
│   │   │   ├── 004_create_subscriptions_notifications.js
│   │   │   ├── 005_vedic_reference_data.js      ← zodiac_signs, planets, planet_dignity, nakshatras, houses
│   │   │   ├── 006_house_lord_interpretations.js ← 144 combinations (12×12)
│   │   │   ├── 007_varga_reference_data.js       ← varga_charts, varga_family_references, varga_chart_relationships
│   │   │   ├── 008_kundli_list_index.js           ← composite index (user_id, created_at)
│   │   │   ├── 009_drishti_bhavkarak_digbala.js   ← 3 reference tables
│   │   │   ├── 010_nakshatra_gandmool.js          ← adds is_gandmool column
│   │   │   ├── 011_nakshatra_detailed_notes.js    ← 12 new columns for EN+HI notes
│   │   │   ├── 012_remedy_data.js                 ← remedy_planets, remedy_problems, remedy_puja_steps
│   │   │   └── 013_yogas_doshas.js                ← yogas_library, doshas_library
│   │   ├── seeds/             ← 010 seed files
│   │   │   ├── 001_defaults.js          ← superadmin, app_settings, plans
│   │   │   ├── 002_planets.js           ← 9 Navagrahas
│   │   │   ├── 003_zodiac_signs.js      ← 12 Rashis + 12 Bhavas
│   │   │   ├── 004_planet_dignity.js    ← Exalt/Debil/Mool from PDF
│   │   │   ├── 005_nakshatras.js        ← 27 Nakshatras (full EN+HI detailed notes)
│   │   │   ├── 006_house_lord_interpretations.js ← 144 EN interpretations
│   │   │   ├── 007_varga_reference_data.js
│   │   │   ├── 008_drishti_bhavkarak_digbala.js
│   │   │   ├── 009_remedy_data.js       ← 9 planets, 7 problems, 5 puja steps
│   │   │   └── 010_yogas_doshas.js      ← 12 yogas, 14 dosha rows
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── admin.routes.js
│   │   │   ├── user.routes.js
│   │   │   ├── kundli.routes.js    ← includes recalculate, PDF export, nakshatra insight, remedy data
│   │   │   ├── subscription.routes.js
│   │   │   ├── newsletter.routes.js
│   │   │   └── settings.routes.js
│   │   ├── services/
│   │   │   ├── ephemeris.service.js    ← Meeus astronomical algorithms
│   │   │   ├── vedic-calc.service.js   ← All Vedic calculations (see Section 11)
│   │   │   ├── report.service.js       ← PDF report generation (PDFKit)
│   │   │   ├── email.service.js        ← Nodemailer + 6 HTML templates
│   │   │   └── razorpay.service.js     ← Order creation + HMAC verification
│   │   ├── tests/
│   │   │   └── vedic-calc.test.js      ← 12 tests (Node built-in runner)
│   │   └── utils/
│   │       ├── response.js             ← ok(), fail() helpers
│   │       └── token.js                ← JWT sign/verify + randomToken
├── ui-main/                   ← Next.js 14 App Router — jyotishstack.com (port 3000)
│   └── src/
│       ├── app/
│       │   ├── layout.jsx           ← server component, loads fonts
│       │   ├── globals.css          ← Tailwind + custom classes
│       │   ├── providers.jsx        ← LangProvider > AuthProvider > maintenance check
│       │   ├── page.jsx             → Home
│       │   ├── login/page.jsx
│       │   ├── register/page.jsx
│       │   ├── dashboard/page.jsx
│       │   ├── verify-email/page.jsx
│       │   ├── forgot-password/page.jsx
│       │   ├── reset-password/page.jsx
│       │   ├── kundli/
│       │   │   ├── page.jsx         → KundliManager (list + create)
│       │   │   ├── new/page.jsx     → New Kundli form
│       │   │   └── [uuid]/page.jsx  → KundliDetail (full chart view)
│       │   ├── matchmaking/page.jsx → Ashtakoot + Mangal + PDF export
│       │   ├── predictions/page.jsx → Full prediction page
│       │   ├── pricing/page.jsx
│       │   └── admin/               → Admin panel at /admin/* routes
│       │       ├── layout.jsx
│       │       ├── login/page.jsx
│       │       └── dashboard/ ... email-logs/  (8 protected pages)
│       ├── components/
│       │   ├── StarField.jsx        ← canvas starfield
│       │   ├── Logo.jsx             ← SVG yantra logo
│       │   ├── Navbar.jsx           ← bilingual, sticky
│       │   ├── Footer.jsx           ← newsletter subscribe
│       │   └── ComingSoonPage.jsx
│       ├── admin-components/        ← AdminShell, Sidebar (for /admin/* routes)
│       ├── admin-views/             ← 8 admin page components
│       ├── context/
│       │   ├── AuthContext.jsx      ← useAuth()
│       │   ├── LangContext.jsx      ← useLang() — hi/en toggle
│       │   └── AdminAuthContext.jsx ← useAdminAuth()
│       └── views/
│           ├── KundliDetail.jsx     ← main chart detail (all panels)
│           ├── KundliManager.jsx    ← list + create
│           ├── Matchmaking.jsx
│           └── Predictions.jsx      ← full prediction page
├── ui-in/                     ← Next.js 14, port 3001 — Hindi-first full design ✅
├── ui-ai-com/                 ← Next.js 14, port 3002 — AI tech design ✅
├── ui-ai-in/                  ← Next.js 14, port 3003 — Hybrid saffron+cyan design ✅
└── ui-admin/                  ← Legacy standalone admin (port 3004) — NOT primary
```

---

## 4. Database

**Engine:** MySQL 8  
**Host:** localhost | **Port:** 3306 | **User:** root | **Password:** bitsaspidy  
**Database:** `jyotish_stack_ai_db` | **Charset:** utf8mb4 | **ORM:** Knex.js

### All Tables (25 total)

| Table | Purpose | Migration |
|-------|---------|-----------|
| `users` | All users — role: user/admin/superadmin | 001 |
| `user_sessions` | Refresh token storage per device | 001 |
| `app_settings` | Key-value runtime config | 002 |
| `kundli_profiles` | Birth chart data + calculated_data JSON | 003 |
| `matchmaking_requests` | Pair of kundlis + Ashtakoot result | 003 |
| `predictions` | Stored prediction records | 003 |
| `subscription_plans` | Plan definitions | 004 |
| `user_subscriptions` | User ↔ plan + Razorpay IDs | 004 |
| `newsletter_subscribers` | Email-only subscribers | 004 |
| `notifications` | In-app notifications (NULL user_id = broadcast) | 004 |
| `email_logs` | Outbound email history | 004 |
| `zodiac_signs` | 12 Rashis with attributes | 005 |
| `planets` | 9 Navagrahas with full attributes | 005 |
| `planet_dignity` | Exaltation/Debilitation/Moolatrikona degrees | 005 |
| `nakshatras` | 27 Nakshatras — full data + detailed EN+HI notes (migrations 005, 010, 011) | 005/010/011 |
| `houses` | 12 Bhavas with significations | 005 |
| `house_lord_interpretations` | 144 combinations (12×12) with EN+HI | 006 |
| `varga_charts` | 18 Varga chart definitions (D1–D60) | 007 |
| `varga_family_references` | Family/relationship topics per varga | 007 |
| `varga_chart_relationships` | Chart-specific family references | 007 |
| `graha_drishti_rules` | 19 aspect rules | 009 |
| `bhav_karak` | 17 house significator rows | 009 |
| `digbala_rules` | 7 directional strength rows | 009 |
| `remedy_planets` | 9 planets — Ishta Devata + mantras EN+HI | 012 |
| `remedy_problems` | 7 life problems + mantras | 012 |
| `remedy_puja_steps` | 5 daily puja steps | 012 |
| `yogas_library` | 12 yogas — full EN+HI definitions, rules, effects | 013 |
| `doshas_library` | 14 dosha rows (13 types) — full EN+HI + technical notes | 013 |

### Important `nakshatras` columns (after all migrations)
All standard fields + `is_gandmool` (010) + 12 detailed note columns (011):
`characteristics_en/hi`, `negative_traits_en/hi`, `professions_en/hi` (JSON), `health_issues_en/hi`, `health_root_cause_en/hi`, `health_guidance_en/hi`

---

## 5. API Reference

**Base URL:** `http://localhost:5000/api`

### Auth (`/api/auth/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register + send welcome email + auto-login |
| POST | `/login` | — | Login, returns accessToken + refreshToken |
| POST | `/refresh` | — | Token refresh |
| POST | `/logout` | ✓ | Delete session |
| GET | `/verify-email?token=` | — | Verify email |
| POST | `/forgot-password` | — | Send reset link |
| POST | `/reset-password` | — | Reset with token |
| GET | `/me` | ✓ | Return current user |

### Kundli (`/api/kundli/`) — auth required
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create kundli (auto-calculates chart) |
| GET | `/` | List user's kundlis (lightweight, no calculated_data) |
| GET | `/:id` | Full kundli + chart + nakshatra_insight + remedy_data |
| PATCH | `/:id` | Update birth details |
| DELETE | `/:id` | Delete kundli |
| POST | `/:id/recalculate` | Recalculate chart + returns nakshatra_insight + remedy_data |
| GET | `/:id/report.pdf` | Download PDF report |
| POST | `/matchmaking/request` | Create Ashtakoot matchmaking |
| GET | `/matchmaking/list` | List user's matchmaking requests |
| GET | `/matchmaking/:id/report.pdf` | Download matchmaking PDF |

### Admin (`/api/admin/`) — admin/superadmin only
| Endpoint | Description |
|----------|-------------|
| GET `/dashboard` | Stats |
| GET/POST `/users` | List/create users |
| PATCH `/users/:id/toggle-active` | Activate/deactivate |
| PATCH `/users/:id/role` | Change role |
| POST `/send-email` | Email blast |
| GET/POST `/notifications` | Notifications |
| GET/PATCH `/settings` | App settings |
| GET `/newsletter` | Subscriber list |
| POST `/newsletter/blast` | Newsletter blast |
| GET/POST/PATCH `/plans` | Subscription plans |
| GET `/email-logs` | Email history |

### Subscriptions, Newsletter, Settings — same as before (see ACTIVITY.md)

---

## 6. Vedic Calculation Engine (`vedic-calc.service.js`)

The core calculation service. `calculateVedicChart(p)` accepts `{ year, month, day, hour, minute, second, timezone, latitude, longitude }` and returns a complete chart object.

### chart object structure
```javascript
chart = {
  meta:            { julian_day, ayanamsa, ayanamsa_dms, system, calculation, accuracy },
  ascendant:       { longitude, rashi_num, rashi_en, rashi_hi, rashi_lord, degree_in_sign_dms },
  planets: {
    Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn/Rahu/Ketu: {
      longitude, rashi_num, rashi_en, rashi_hi, rashi_lord, degree_in_sign, dignity,
      daily_motion, is_retrograde
    }
  },
  nakshatra:       { num, en, hi, lord, pada, degree_in_nakshatra, deity_en, deity_hi, is_gandmool },
  houses:          { H1..H12: { rashi_num, lord, planets[] } },
  dasha:           [ { lord, start, end, years, is_current, antardasha: [...] } ],
  varga_charts:    { d1..d60 },    // 18 Varga charts
  navamsha:        chart.varga_charts.d9,
  mangal_dosha:    { has_dosha, severity, checks[], cancellations[], summary_en/hi },
  yogas_doshas:    { yogas[], doshas[], yoga_count, dosha_count },
  gochar:          { transit summary },
  predictions:     { portrait, current_period, life_areas, gochar_narrative, remedies, ... },
  drishti:         { by_planet, by_house },
  bhav_karak:      { H1..H12: { karakas[], signification_en/hi, karaka_positions[] } },
  digbala:         { Sun/Moon/..: { has_digbala, has_digbala_loss, strength_percent } },
  panchang:        { masa, tithi, vara, yoga, karana, pahar, moon_phase, sunrise, sunset },
  astro_details:   { varna, vashya, yoni, gana, nadi, tatva, yunja, naam_akshar, paya, ... },
  reports:         { general_report, planet_report, varga_matrix, planet_details, cusp_details }
}
```

### Algorithms (Meeus Astronomical Algorithms 2nd Ed.)
| Body | Method | Accuracy |
|------|--------|----------|
| Sun | equation of center | ~0.01° |
| Moon | 60 perturbation terms | ~0.1° |
| Rahu (mean node) | Meeus Ch.47 | ~0.1° |
| Mars/Mercury/Jupiter/Venus/Saturn | Keplerian + helio→geo | ~0.5–2° |
| Ascendant | LST + obliquity | ~0.1° |
| Ayanamsa | Lahiri (23.85317° at J2000 + 50.2796"/yr) | ~0.1° |

### Yogas & Doshas Detection (`detectYogasAndDoshas(chart)`)
Returns `chart.yogas_doshas = { yogas[], doshas[], yoga_count, dosha_count }`.
Each entry: `{ name, name_hi, strength/severity, trigger_en, trigger_hi, planets_involved[] }`.

**12 Yogas detected:** Gajakesari, Budh-Aditya, Neech Bhanga Raj, Saraswati, Kalaneedhi, Chandra-Mangal Laxmi, Dhan Yoga group (Laxmi/Adhi/Dhan), Raj Yoga, Vipreet Raj Yoga (Harsha/Sarala/Vimala), Parivartan (Raj/Dhan/Dusthana), Guru-Aditya, Shatru Hanta.

**13 Dosha types detected:** Pitru, Surya-Shani Vish, Mangal-Shani Vish, Moon-Shani Vish, Amavasya, Angarak (Mars+Rahu), Shaapit (Saturn+Rahu), Surya Grahan, Chandra Grahan, Guru Chandaal, Venus-Mangal Vish, Venus-Rahu Vish, Kemdrum, Paap Kartari.

---

## 7. Design System

**Theme:** Royal Cosmos — deep navy cosmos background, gold accents.  
**Fonts:** Playfair Display (headings), Inter (body), Noto Sans Devanagari (Hindi)

| Token | Hex | Use |
|-------|-----|-----|
| `cosmos-800` | `#0B0D1A` | Page background |
| `cosmos-700` | `#111428` | Card background |
| `gold` | `#D4AF37` | Primary accent |
| `ivory` | `#F5F0E8` | Body text |
| `saffron` | `#FF9933` | Hindi / accent |
| `indigo` | `#3D3580` | Secondary |
| `crimson` | `#8B0000` | Error/danger |

**CSS classes:** `.btn-gold`, `.btn-outline-gold`, `.card-royal`, `.input-royal`, `.section-title`, `.text-gradient-gold`, `.starfield-bg`, `.glass`

---

## 8. Default Credentials

| Role | Email | Password |
|------|-------|---------|
| Superadmin | admin@jyotishstack.com | Admin@2026! |

---

## 9. Environment Variables (server/.env)

```
DB_HOST=localhost | DB_PORT=3306 | DB_USER=root | DB_PASSWORD=bitsaspidy
DB_NAME=jyotish_stack_ai_db
JWT_SECRET=jyotish_stack_super_secret_jwt_key_2026
JWT_REFRESH_SECRET=jyotish_stack_refresh_secret_2026
SMTP_HOST=smtp.gmail.com | SMTP_PORT=587 | SMTP_USER=<email> | SMTP_PASS=<app password>
RAZORPAY_KEY_ID=<key> | RAZORPAY_KEY_SECRET=<secret>
ALLOWED_ORIGINS=http://localhost:3000,...
APP_URL=https://jyotishstack.com
```

---

## 10. How to Run

```bash
# Install all deps
npm install

# Create DB
"C:/Program Files/MySQL/MySQL Server 8.0/bin/mysql.exe" -u root -pbitsaspidy \
  -e "CREATE DATABASE IF NOT EXISTS jyotish_stack_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run migrations + seeds
npm run migrate
npm run seed

# Start dev servers
npm run dev:server   # API on :5000
npm run dev:main     # jyotishstack.com on :3000

# Run all server tests (12 tests)
npm run test:server

# Build ui-main for production
npm run build:main
```

---

## 11. Key Decisions & Architecture Notes

- **UUIDs everywhere** for public-facing IDs. Integer IDs are internal only.
- **Maintenance mode** cached 30s server-side. `maintenanceGuard.invalidate()` called after admin updates setting.
- **Auth bypass** for `/api/admin` and `/api/auth` routes from maintenance guard.
- **Email is fire-and-forget** — logged to `email_logs`, errors swallowed.
- **Razorpay** — Free plans activate instantly. Paid: create order → Razorpay SDK → verify HMAC.
- **CORS** — from `ALLOWED_ORIGINS` env var (comma-separated).
- **Admin merged** into `ui-main` at `/admin/*` — `ui-admin` standalone still exists but is legacy.
- **DATE typeCast fix** in `knexfile.js` — MySQL2 returns DATE as JS Date with UTC timezone shift. Fixed with `typeCast` option so DATE/DATETIME columns return as plain "YYYY-MM-DD" strings.
- **Retrograde status** — computed from apparent sidereal daily motion (JD ±0.5). Sun/Moon forced non-retrograde.
- **Whole-sign house system** — `houseFromSign(ascRashi, planetRashi)` = `((planet - asc + 12) % 12) + 1`.
- **Dasha calculation** — `vimshottariDasha()` computes from Moon's Nakshatra. Returns full 9-period sequence with `is_current` flag. Each period has `antardasha[]` sub-periods.
- **Nakshatra insight** — `GET /api/kundli/:id` and `POST /:id/recalculate` both return `profile.nakshatra_insight` (characteristics, professions JSON, health EN+HI) queried live from `nakshatras` table using Moon's nakshatra num.
- **Remedy data** — `GET /api/kundli/:id` returns `profile.remedy_data` with `dasha_planet`, `lagna_planet`, and `puja_sequence` from `remedy_planets` + `remedy_puja_steps` tables.
- **Yogas & Doshas** — `calculateVedicChart()` wires in `detectYogasAndDoshas(chart)` and returns `chart.yogas_doshas`. Reference data stored in `yogas_library` + `doshas_library` tables.
- **PDF reports** — `report.service.js` generates lightweight PDFKit reports. No external binary required. Routes: `GET /:id/report.pdf` and `GET /matchmaking/:id/report.pdf`.
- **Stale `.next` cache** — after major multi-file changes, delete `ui-main/.next` before `npm run build:main`.
- **Detailed reports** — `calculateVedicChart()` returns `chart.reports` with Graha-Rashi-Bhav general report, planet report, Varga rashi matrix, KP-style Nakshatra sub/sub-sub lord rows, and equal-house cusp rows. Older saved Kundlis are auto-refreshed by `GET /api/kundli/:id` when report data is missing.
- **Test runner** — Node built-in (`node --test`). Run `npm run test:server`. Currently 14/14 passing.

---

## 12. Feature Roadmap

### Phase 1 — Foundation ✅ DONE
Auth, admin panel, main UI, subscription/payments, email, maintenance mode, design system.

### Phase 2 — Kundli Engine ✅ DONE
- [x] Real astronomical calculations (Meeus 2nd Ed.)
- [x] 9 grahas: longitude, rashi, dignity, retrograde, daily motion
- [x] Ascendant, whole-sign houses
- [x] 18 Varga charts (D1–D60)
- [x] Vimshottari Mahadasha + Antardasha
- [x] Panchang engine (Tithi, Yoga, Karana, Vara, Masa, Pahar, Sunrise/Sunset)
- [x] Astro details (Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya)
- [x] Graha Drishti (aspects), Bhav Karak, Digbala
- [x] Nakshatra detailed report (characteristics, professions, health EN+HI from DB)
- [x] Life Portrait panel (Lagna, Moon, Nakshatra soul, Dasha period)
- [x] Yogas & Doshas detection (12 yogas, 13 dosha types)
- [x] Graha-Rashi-Bhav detailed reports: General Report, Planet Report, Varga Matrix, Planet Detail table, Cusp table
- [x] North Indian + South Indian chart toggle (D1, D9, and selected Varga panel)
- [x] Varga reference API + KundliDetail Varga panel (seeded D1-D60 reference, relationship/family maps, EN/HI UI fallback)
- [x] Atmakaraka calculation (highest-degree planet, 7 Grahas, Parashara BPHS method)
- [x] Isht Devata derivation (AK in D9 → sign lord → Devata + primary mantra)
- [x] Varga practical readings per tab — "Your Reading" showing Lagna lord + karakas + D2 Hora type + AK in D9
- [x] Life Report panel (5 tabs: Soul Profile, Finance, Family, Health, Problems & Solutions)
- [x] Migration 014 + Seed 011: `jyotish_basics` table with AstroAnsh Class 1 data (4 Vedas, 6 Vedangas, 6 Jyotish Angas, 5 Uses, 3 Karma types, Hora system, Graha BPHS attributes for all 9 planets)
- [x] `life-report.service.js` — standalone service for all life-report computations
- [x] Edit birth details modal with Nominatim geocoding

### Phase 3 — Matchmaking ✅ DONE
- [x] Ashtakoot Guna Milan (36 gunas, 8 Kootas)
- [x] Mangal Dosha detection
- [x] Matchmaking PDF export
- [ ] Dashakoot compatibility

### Phase 4 — Predictions ✅ MOSTLY DONE
- [x] Rule-based prediction engine (Lagna portrait, Moon portrait, Nakshatra soul)
- [x] Dasha/Antardasha predictions (9 planet meanings × 5 life areas)
- [x] Transit predictions (Gochar) — Sade Sati, Jupiter, Rahu-Ketu
- [x] Remedy system (Ishta Devata, mantras, puja steps from PDF)
- [ ] Daily Rashi horoscope
- [ ] Annual predictions (Varshphal)
- [ ] AI-generated personalised predictions

### Phase 5 — Other UIs ✅ DONE (full designs built)
- [x] ui-in (jyotishstack.in) — Devotional Saffron, Hindi-first
- [x] ui-ai-com (jyotishstackai.com) — AI Tech, English, cyan+violet
- [x] ui-ai-in (jyotishstackai.in) — Hybrid Saffron+Cyan, bilingual

### Pending
- [ ] Dashakoot compatibility
- [ ] Swiss Ephemeris certification / reference chart validation
- [ ] Daily horoscope by Rashi
- [ ] Annual Varshphal
- [ ] AI-generated predictions
- [ ] SMTP + Razorpay live key configuration
- [ ] Production deployment

---

## 13. Nakshatra Reference (AstroAnsh Class 8 + 9)

**Gandmool nakshatras (6 of 27):**
- Ketu's 3: Ashwini (1), Magha (10), Mula (19)
- Mercury's 3: Ashlesha (9), Jyeshtha (18), Revati (27)

**`nakshatras` table columns (after migrations 005, 010, 011):**
Standard fields + `is_gandmool` + `characteristics_en/hi` + `negative_traits_en/hi` + `professions_en/hi` (JSON) + `health_issues_en/hi` + `health_root_cause_en/hi` + `health_guidance_en/hi`

---

## 14. Drishti / Bhav Karak / Digbala (AstroAnsh Class — Drishti PDF)

**Drishti rules:** Sun/Moon/Mercury/Venus aspect 7th only. Mars: 4th, 7th, 8th. Jupiter: 5th, 7th, 9th. Saturn: 3rd, 7th, 10th. Rahu/Ketu: 5th, 7th, 9th.

**Digbala (directional strength):**
| Planet | Strong House | Direction |
|--------|-------------|-----------|
| Jupiter, Mercury | 1st | East |
| Sun, Mars | 10th | South |
| Saturn | 7th | West |
| Moon, Venus | 4th | North |

**DB tables:** `graha_drishti_rules` (19 rows), `bhav_karak` (17 rows), `digbala_rules` (7 rows)

---

## 15. Remedy System (AstroAnsh Remedy Class 1 — May 2026)

**DB tables:**
- `remedy_planets` (9 rows) — each planet → Ishta Devata, mantras EN+HI, special notes
- `remedy_problems` (7 rows) — Diseases, Debts, Miscarriage, Anger, Vastu Dosh, Wealth, Intelligence
- `remedy_puja_steps` (5 steps) — daily puja sequence (Ganesh → Ishta Devata → Lagna Lord → Atmakarak → Shakti Pujan)

**Planet → Ishta Devata mapping:**
Sun→Rama/SuryaNarayan, Moon→Krishna/Shiva, Mars→Hanuman/Kartikeya, Mercury→Vishnu, Jupiter→Vishnu/Brihaspati, Venus→Lakshmi/Parvati, Saturn→Shani/Bhairava/Rudra, Rahu→Durga/Kali, Ketu→Ganesha

**API:** `GET /api/kundli/:id` returns `profile.remedy_data = { dasha_planet, lagna_planet, puja_sequence }`.

**Note:** When owner provides Remedy Class 2, 3 etc. — add rows to existing tables via new seed files. No migration changes needed.

---

## 16. Yogas & Doshas Reference (AstroAnsh Class 11 & 12 — BPHS)

**DB tables:** `yogas_library` (12 rows), `doshas_library` (14 rows)

**12 Yogas (category):**
Gajakesari (power), Budh-Aditya (intellect), Neech Bhanga Raj (power), Saraswati (wisdom), Kalaneedhi (wealth), Chandra-Mangal Laxmi (wealth), Dhan Yoga group (wealth), Raj Yoga (power), Vipreet Raj Yoga/Harsha/Sarala/Vimala (power), Parivartan (general), Guru-Aditya (wisdom), Shatru Hanta (victory)

**14 Dosha rows / 13 types (category):**
Pitru (karmic), Surya-Shani Vish (vish), Mangal-Shani Vish (vish), Moon-Shani Vish (vish), Amavasya (luminary), Angarak/Mars+Rahu (vish), Shaapit/Saturn+Rahu (karmic), Surya Grahan (grahan), Chandra Grahan (grahan), Guru Chandaal (karmic), Venus-Mangal Vish (vish), Venus-Rahu Vish (vish), Kemdrum (luminary), Paap Kartari (general)

**Detection:** `detectYogasAndDoshas(chart)` in `vedic-calc.service.js`. Returns only present yogas/doshas with strength/severity and trigger descriptions.

**UI:** `YogasAndDoshasPanel` in `KundliDetail.jsx` — tabbed Yogas/Doshas view with strength badges, category chips, chart-specific triggers, formation rules, likely results, balancing guidance, and translated planet chips.

**Hindi/i18n update (Session 13):** `ui-main/src/lib/astroI18n.js` centralizes EN/HI helpers for planet names, house labels, dignity/status badges, Nitya Yoga/Karana names, prediction fallbacks, Yoga/Dosha detail text, and list-item localization. `KundliDetail.jsx` and `Predictions.jsx` use it so Hindi mode covers chart labels, edit modal, basic details, dasha panels, Mangal/Gochar summaries, prediction narratives, remedies, and Yoga/Dosha detail cards.

---

## 17. Varga Reference UI (Session 14)

**Seed status:** Existing seed is already present at `server/src/seeds/007_varga_reference_data.js`; no duplicate seed was created. It loads `server/src/data/varga-reference.js` into:
- `varga_charts` (18 rows)
- `varga_family_references` (15 rows)
- `varga_chart_relationships` (62 rows)

**API:** `GET /api/kundli/reference/varga` returns normalized seeded Varga reference data through `server/src/services/varga-reference.service.js`.

**UI:** `KundliDetail.jsx` now renders `VargaChartsPanel` below the main Kundli detail grid. It provides D1-D60 selector pills, selected divisional chart rendering in the current North/South style, Lagna/planet placements, description, key uses, calculation rule, precision note, relationship reading references, and family reference map.

**Hindi support:** `ui-main/src/lib/vargaI18n.js` adds Hindi fallback names/domains/descriptions/key uses/topics because the canonical seed source currently has nullable Hindi fields but no Hindi values in `server/src/data/varga-reference.js`.

**Verification:** `npm.cmd run test:server` passed 13/13 tests; `npm.cmd run build:main` passed with 25/25 pages generated.

---

## 18. Graha Rashi Bhav Reports (Session 15)

**Engine:** `calculateDetailedReports(chart)` in `server/src/services/vedic-calc.service.js` builds `chart.reports`:
- `general_report` — Lagna, Moon, Sun, and current Dasha narrative in EN+HI
- `planet_report` — 9 planet interpretations using Graha karakatva + Rashi + Bhav
- `varga_matrix` — sample-style rashi-number matrix for Birth, Navamsha, Chalit, Sun, Moon, Hora, Drekkana, D4, D5, D7, D8, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60
- `planet_assessments` — positive/mixed/negative score for each Navagraha using dignity, house, natural nature, retrograde state, and current Dasha activation
- `yoga_dasha_report` — detected Yoga/Dosha activation language through current Mahadasha and Antardasha lords
- `event_timing` — rule-based timing windows from current Vimshottari Dasha plus Gochar highlights
- `planet_details` — Sun through Ketu plus Ascendant with degree, retrograde, normalized degree, house, zodiac sign, sign lord, nakshatra, nakshatra lord, charan, sub lord, sub-sub lord
- `cusp_details` — 12 equal-house cusps from exact Lahiri Lagna degree with sign/nakshatra/sub-lord fields

**Compatibility:** `ensureCalculatedChart()` now refreshes older saved Kundli JSON when `reports`, the Varga matrix, planet assessments, Yoga+Dasha report, or event timing windows are missing.

**UI:** `DetailedReportsPanel` in `KundliDetail.jsx` renders tabs: Yoga + Dasha, Event Timing, General Report, Planet Report, Varga Matrix, Planet Details, Cusps. Planet cards show EN/HI positive/mixed/negative advice and the technical planet-details table includes the assessment score.

**Verification:** `npm.cmd run test:server` passed 14/14 tests; `npm.cmd run build:main` passed with 25/25 pages generated; fresh `ui-main` dev smoke on `http://localhost:3008` returned 200 for `/login` and `/kundli`.

---

## 19. KundliDetail UI Panels (ui-main/src/views/KundliDetail.jsx)

Current panels in render order:
1. Header (name, birth details, edit button, PDF export, recalculate)
2. Chart style toggle (North/South Indian)
3. D1 Lagna Chart (North or South Indian SVG)
4. D9 Navamsha Chart (same style as D1)
5. Planet Table (sign, DMS, house, dignity badge)
6. Vimshottari Dasha timeline (current highlighted)
7. 12-House Grid (lord + planets)
8. Basic Details Panel (tabbed: Basic Details / Ghat Chakra / Astro Details)
9. Personality Insights Panel (tabbed: Traits / Career / Health — from nakshatra DB)
10. Life Portrait Panel (tabbed: Who You Are / Current Period)
11. Mangal Dosha card
12. Gochar (transit) card
13. **Graha Rashi Bhav Detailed Report panel** (Yoga + Dasha, Event Timing, General Report, Planet Report, Varga Matrix, Planet Details, Cusps)
14. **Varga / Divisional Charts panel** (D1-D60 selector, selected chart, seeded reference details, relationship/family maps, EN/HI fallback text)
15. Digbala panel
16. Bhav Karak panel
17. Graha Drishti panel
18. **Yogas & Doshas panel** (tabbed: Yogas / Doshas — from detectYogasAndDoshas; expanded detail cards with formation/result/guidance in EN+HI)
19. Bottom navigation

---

---

## 20. Life Report + Isht Devata + Varga Readings + Fundamentals Seed (Session 17)

**New service:** `server/src/services/life-report.service.js`
- `calculateAtmakaraka(planets)` — highest-degree planet (Sun–Saturn) = Atmakaraka
- `calculateIshtaDevata(akInfo, d9Chart)` — AK in D9 → sign → sign lord → Devata + mantra
- `generateVargaAnalysis(chart)` — per-varga practical readings for D1-D60 (Lagna lord + karakas per domain, D2 Hora type, AK in D9)
- `generateLifeReport(chart)` — 5 sections: profile, finance, family, health, problems

**Wired into `calculateVedicChart()`:** adds `chart.life_report` and `chart.varga_analysis`

**New DB:**
- Migration `014_jyotish_fundamentals.js` → `jyotish_basics` table (category, item_key, name_en, name_hi, description_en, description_hi, admin_only, extra_data)
- Seed `011_jyotish_fundamentals.js` → 35 rows: 4 Vedas, 6 Vedangas, 6 Jyotish Angas, 5 Uses of Jyotish, 3 Karma types (Sanchit/Prarabdha/Kriyaman), 2 Hora rules, 9 Graha BPHS attribute rows

**New UI:**
- `ui-main/src/components/LifeReportPanel.jsx` — 5-tab panel (Soul Profile + Isht Devata / Finance / Family / Health / Problems)
- Injected into `KundliDetail.jsx` after Life Portrait, before Detailed Reports
- Varga panel gets "Your Reading — Practical Results" section per chart tab showing actual planet readings with impact colors

**`ensureCalculatedChart()`** now also checks for `life_report.sections` and `varga_analysis` — older saved Kundlis auto-recalculate.

**Tests:** 14/14 pass | Build: 25/25 pages

*Last updated: 2026-06-03 (Session 17) | Agent: Claude Sonnet 4.6*

---

## 21. vedic-calc.service.js Refactor — Helper Modules (Session 18)

**Problem:** `vedic-calc.service.js` had grown to 3,009 lines — a hard-to-navigate monolith.

**Solution:** Extracted into 13 focused helper files under `server/src/services/helpers/`. The main file is now a 181-line orchestrator that imports and re-exports everything.

### File Map

| File | Lines | Responsibility |
|------|-------|----------------|
| `vedic-calc.service.js` | **181** | Main entry — wires helpers, exports public API |
| `helpers/vedic-data.js` | 105 | Static data: RASHIS, NAKSHATRAS, DIGNITY_MAP, NAK_EXTRA, NATURAL_FRIENDS |
| `helpers/core-helpers.js` | 182 | Core math utilities: norm, lahiriAyanamsa, toSidereal, rashiFromDeg, nakshatraFromDeg, houseFromSign, toDMS, ordinal, nakExtra, etc. |
| `helpers/varga-calc.js` | 140 | Varga/Divisional chart calculations (D1–D60): trimshamshaFromDegree, vargaPlacementFromDeg, buildWholeSignHouses, calculateAllVargaCharts |
| `helpers/dasha-calc.js` | 105 | Vimshottari Dasha: DASHA_SEQ, buildAntardasha, vimshottariDasha, dashaSequenceFrom, kpSubLordsFromLongitude |
| `helpers/mangal-dosha.js` | 42 | analyzeMangalDosha |
| `helpers/panchang.js` | 178 | Panchang (Tithi, Yoga, Karana, Vara, Masa, Pahar, Sunrise/Sunset) + calculateAstroDetails |
| `helpers/drishti-bhavkarak.js` | 98 | calculateGrahaDrishti, calculateBhavKarak, calculateDigbala + their data constants |
| `helpers/gochar.js` | 38 | calculateTransitSummary |
| `helpers/ashtakoot.js` | 74 | calculateAshtakoot |
| `helpers/prediction-data.js` | 239 | All large static constants: LAGNA_PORTRAIT, MOON_SIGN_PORTRAIT, DASHA_LORD_MEANINGS, SADE_SATI_DESC, HOUSE_REPORT, PLANET_REPORT, EVENT_AREA_CONFIG, VARGA_MATRIX_ROWS, etc. |
| `helpers/predictions-engine.js` | 120 | generateRuleBasedPredictions, planets_house_desc, planetNameHi |
| `helpers/detailed-reports.js` | 253 | All 9 detailed report functions: planetPositiveNegativeAssessment, calculateYogaDashaReport, calculateEventTiming, calculateDetailedReports, etc. |
| `helpers/yogas-doshas.js` | 126 | detectYogasAndDoshas (12 yogas, 13 doshas, all private helpers) |

### Dependency Chain
```
vedic-data.js  ← core-helpers.js ← varga-calc.js
                                  ← dasha-calc.js
                                  ← panchang.js
                                  ← drishti-bhavkarak.js
                                  ← gochar.js
                                  ← ashtakoot.js
prediction-data.js ← predictions-engine.js
                   ← detailed-reports.js (also imports dasha-calc)
core-helpers.js + vedic-data.js ← yogas-doshas.js
All helpers ← vedic-calc.service.js (main orchestrator)
```

### Zero Regressions
- All public exports preserved (`dailyMotionForPlanet`, `planetPositiveNegativeAssessment`, `calculateEventTiming`, `calculateDetailedReports`, `isRetrogradePlanet`, `kpSubLordsFromLongitude`, etc.)
- **Tests:** 14/14 pass | **Build:** 25/25 pages

*Last updated: 2026-06-03 (Session 18) | Agent: Claude Sonnet 4.6*

---

## 22. Kundli Bug-Fix Pass (Session 22)

**Agent:** Alex / Codex
**Date:** 2026-06-03

### Fixed user-facing bugs
- `GET /api/kundli` now returns a lightweight `chart_summary` so Meri Kundli cards can show Lagna, Nakshatra, and current Dasha without loading the full `calculated_data` JSON in the sorted list query.
- `KundliManager.jsx` reads `chart_summary` and falls back to parsed chart data only when present.
- Hindi prediction/life portrait UI ignores short saved Hindi snippets and uses richer generated Hindi fallbacks.
- Life Report Hindi profile text was expanded for Lagna, Moon, Nakshatra, current Dasha, and Atmakaraka.
- Predictions page now separates **Chart Isht Devata** from Dasha/Lagna **Remedy Devata**, using `chart.life_report.ishta_devata` to match Life Report.
- Varga analysis now exposes `role`, `user_summary`, `benefits`, `watch_points`, and `remedies`; the Varga UI hides calculation rules/reference maps from the customer view.
- Digbala, Bhav Karak, and Graha Drishti now include practical effects, benefits, cautions, and remedies.
- Yogas/Doshas now include `cancellation_status`, `is_cancelled`, and relief text; Yoga + Dasha and Event Timing tabs now render inside the Yogas & Doshas panel.
- Global readability improved by lightening royal card backgrounds and raising low-opacity `text-ivory/*` contrast.

### Important files
- `server/src/routes/kundli.routes.js`
- `server/src/services/life-report.service.js`
- `server/src/services/helpers/drishti-bhavkarak.js`
- `server/src/services/helpers/yogas-doshas.js`
- `server/src/services/helpers/detailed-reports.js`
- `ui-main/src/views/KundliManager.jsx`
- `ui-main/src/views/KundliDetail.jsx`
- `ui-main/src/views/Predictions.jsx`
- `ui-main/src/lib/astroI18n.js`
- `ui-main/src/app/globals.css`

### Verification
```bash
node --check server/src/routes/kundli.routes.js
node --check server/src/services/helpers/drishti-bhavkarak.js
node --check server/src/services/helpers/yogas-doshas.js
node --check server/src/services/life-report.service.js
npm.cmd run test:server   # 14/14 passed
npm.cmd run build:main    # compiled successfully, 25/25 static pages
```

### Browser smoke caveat
Browser smoke was attempted but local runtime was not clean: an existing dev server on port 3000 returned stale `.next` chunk errors, `next start` on 3001 returned generic 500 for all routes, and dev server on 3002 timed out during startup. The extra 3001/3002 processes started by Codex were stopped. Build and server tests passed.

### Git/worktree note
The worktree already contained Claude/Codex changes and untracked helper/component files before this session. Do not assume all dirty files are from Session 22, and do not revert unrelated dirty files.

---

## 23. Kundli Summary Undefined Placement Fix (Session 23)

**Agent:** Alex / Codex
**Date:** 2026-06-03

### Fixed
- `ui-main/src/components/KundliInsightPanel.jsx` no longer renders `House undefined (undefined)` in the **Summary** tab of **Your Kundli — Explained in Plain Language**.
- The component now derives planet house placement from `chart.ascendant.rashi_num` and each planet's `rashi_num` when saved chart JSON does not include `planet.house`.
- The Lagna lord display now prefers backend `chart.ascendant.rashi_lord`, with a corrected local sign-lord fallback map.
- Summary, Your Planets, Your Houses, and Health Guide all use normalized planet placements.
- Rare missing placement cases now show `Pending` / `House pending` instead of leaking `undefined`.

### Verification
```bash
npm.cmd run build:main    # compiled successfully; 25/25 static pages generated
```

---

## 24. Predictions Page Kundli Selection Fix (Session 24)

**Agent:** Alex / Codex
**Date:** 2026-06-03

### Fixed
- Prediction links now carry the intended Kundli UUID with `?kundli=<uuid>` using `ui-main/src/lib/kundliLinks.js`.
- `ui-main/src/views/Predictions.jsx` reads that URL parameter and selects the matching profile before falling back to the newest Kundli.
- `ui-main/src/views/KundliDetail.jsx` bottom Predictions button now opens predictions for the currently viewed Kundli.
- `ui-main/src/views/KundliManager.jsx` has a per-profile Predictions button.
- `ui-main/src/views/Dashboard.jsx` links the Predictions card to the latest Kundli from the newest-first Kundli list.
- Predictions profile selector updates the URL when a different profile is selected, preventing stale previously viewed profiles from sticking.

### Verification
```bash
npm.cmd run build:main    # compiled successfully; 25/25 static pages generated
```

---

## 25. Asta/Vakri Analysis and GitHub Upload Prep (Session 41)

**Agent:** Alex / Codex
**Date:** 2026-06-12

### Added
- Migration `server/src/migrations/019_asta_vakri_library.js` and seed `server/src/seeds/016_asta_vakri_class13.js` for combustion (Asta/Maudhya) and retrograde (Vakri) reference content.
- `calculateVedicChart()` now includes `sun_distance` and `combust_level` for combust planets.
- Kundli strength and Neech Bhanga logic now treat retrograde planets as stronger per the Class 13/BPHS rule, while combustion applies a penalty.
- `fetchAstaVakriAnalysis()` enriches Kundli detail, admin Kundli detail, and PDF report payloads with combust/retrograde analysis.
- `ui-main/src/components/AstaVakriPanel.jsx` renders the analysis in user and admin Kundli views.
- Premium Kundli PDF reports include a Combustion & Retrograde Analysis section when applicable.

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
`pdf-map.txt` and `test-report.pdf` were local generated/reference artifacts and were intentionally left untracked for the GitHub upload.

---

## 26. GitHub Visibility Check, Graha Phal, Avakahada, and Samvat (Session 42)

**Agent:** Alex / Codex
**Date:** 2026-06-12

### Findings
- GitHub default branch is `main`; the newest Codex commits were on `origin/codex/yogas-doshas-hindi-ui`, so viewing the default GitHub branch could look stale.
- `origin/main` had merge commit `7ca534f`, but it did not include the newest branch commits such as `509ea82 Add Asta Vakri analysis`.
- Additional local feature files existed after the previous push and were not yet uploaded.

### Added
- `server/src/services/helpers/placement-narratives.js` builds bilingual Graha Phal narratives from planet sign and house placement.
- Kundli detail, admin detail, and PDF extras now include `placement_narratives`.
- `ui-main/src/components/PlacementNarrativesPanel.jsx` renders per-planet Graha Phal.
- `ui-main/src/components/AvakahadaPanel.jsx` renders the classical birth-summary table.
- Panchang now includes Vikram, Shaka, Kali, and Samvatsara via `calculateSamvat()`.
- Panchang Muhurta and premium Kundli PDF output show Samvat/Avakahada information.
- `ui-main/next.config.js` serializes the Next build (`experimental.cpus = 1`, `experimental.webpackBuildWorker = false`) after Windows builds generated an incomplete app-path manifest.

### Verification
```bash
node --check server/src/routes/kundli.routes.js
node --check server/src/services/helpers/panchang.js
node --check server/src/services/helpers/placement-narratives.js
node --check server/src/services/kundli-admin.service.js
node --check server/src/services/pdf/kundli-report.js
git diff --check
npm.cmd run test:server   # 14/14 passed
npm.cmd run build:main    # compiled successfully; 31/31 pages generated
```

### Git/worktree note
Keep `pdf-map.txt` and `test-report.pdf` untracked unless the owner explicitly asks to commit generated reference artifacts.

---

## 28. Hostinger DNS www Record Fallback (Session 45)

**Agent:** Alex / Codex
**Date:** 2026-06-15

### DNS note
- For `jyotishstack.com`, root `@` should be an A record pointing to the VPS public IP.
- `www` can be either an A record pointing to the VPS public IP or a CNAME pointing to `jyotishstack.com`.
- If Hostinger refuses a `www` A record, check for an existing `www` CNAME. Delete it before adding the A record, or edit/keep it as `CNAME www -> jyotishstack.com`.
- Remove old/conflicting `@` or `www` A, AAAA, or CNAME records that point to website builder, parking, CDN, or old hosting before waiting for propagation.

---

## 29. Manual Firewall Deployment Path (Session 46)

**Agent:** Alex / Codex
**Date:** 2026-06-15

### Firewall note
- The Hostinger VPS deployment runbook does not use UFW after Session 46.
- Firewall permissions are managed manually by the owner.
- Public inbound access should be limited to TCP `22`, `80`, and `443`.
- Do not expose MySQL `3306`, Next.js `3000`, Express `5000`, or phpMyAdmin `8081` publicly.
- Apache site commands use `jyotishstack.conf` and `sudo a2ensite jyotishstack`.

---

## 27. Hostinger VPS Production Deployment Kit (Sessions 43-44)

**Agent:** Alex / Codex
**Date:** 2026-06-15

### Deployment target
- Launch target is `jyotishstack.com` on a 16 GB Hostinger VPS.
- The production runbook serves the full `ui-main` app on port 3000 through Apache. `ui-ai-com`/`jyotishstackai.com` is still a lightweight AI-branded landing surface and should not replace `ui-main` for launch until it has feature parity.
- Express API stays on localhost port 5000 behind Apache `/api/`.
- MySQL stays bound to `127.0.0.1:3306`.
- phpMyAdmin stays bound to `127.0.0.1:8081` and is accessed only through a PuTTY SSH tunnel.

### Files added/updated
- `docs/HOSTINGER_VPS_DEPLOYMENT.md`: step-by-step Hostinger VPS runbook covering firewall, DNS, PuTTY, Node.js 24 LTS, MySQL, Apache, phpMyAdmin, GitHub clone/pull, env setup, migrations, PM2, Certbot, validation, hardening, scaling, and backups.
- `apache/phpmyadmin-local.conf`: localhost-only Apache vhost for phpMyAdmin.
- `apache/jyotish.conf`: HTTP vhost for `jyotishstack.com`; Certbot should be run after DNS propagation to create HTTPS and redirects.
- `ecosystem.config.js`: PM2 production process config for `jyotish-api` and `jyotish-ui-main`, with optional `API_INSTANCES` and `UI_INSTANCES` scaling.
- `deploy.sh`: repeatable production pull/build/migrate/reload script.
- `.env.production.example`: production template aligned with app env names.
- `server/knexfile.js`: production DB SSL is opt-in via `DB_SSL=true`, so local VPS MySQL works without forced TLS.

### Verification
```bash
node --check ecosystem.config.js
node --check server/knexfile.js
git diff --check
npm.cmd run test:server   # 14/14 passed
npm.cmd run build:main    # compiled successfully; 38/38 pages generated
```

### Git/worktree note
Keep `pdf-map.txt` and `test-report.pdf` untracked unless the owner explicitly asks to commit generated reference artifacts.
