# Jyotish Stack AI — Project Memory

> This file is the single source of truth for any AI agent working on this project.
> Always read this file first before making any changes.

---

## 1. Project Overview

**Product Name:** Jyotish Stack AI  
**Hindi Name:** ज्योतिष स्टैक AI  
**Tagline:** Ancient Wisdom. Modern Intelligence.  
**Hindi Tagline:** प्राचीन ज्ञान। आधुनिक बुद्धि।  
**Purpose:** Vedic astrology platform offering Kundli generation, Bhavishya Vani (predictions), Kundli matchmaking, Dasha/Nakshatra analysis — powered by AI calculations.  
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
| Admin panel | `ui-admin` | 3004 | Internal only, no public domain |
| API server | `server` | 5000 | Single backend for all 4 UIs |

All UIs call the same Express API server. They differ in design theme, language default, and content focus. Core features are identical.

---

## 3. Repository Structure

```
jyotish-stack/
├── MEMORY.md                  ← YOU ARE HERE
├── package.json               ← npm workspaces root
├── server/                    ← Express + Knex backend
│   ├── .env                   ← environment variables
│   ├── knexfile.js
│   ├── src/
│   │   ├── index.js           ← main entry (port 5000)
│   │   ├── config/db.js       ← Knex instance
│   │   ├── middleware/
│   │   │   ├── auth.js        ← JWT authenticate, requireRole
│   │   │   └── maintenance.js ← Coming Soon guard (30s cache)
│   │   ├── migrations/        ← run: npm run migrate --workspace=server
│   │   │   ├── 001_create_users.js
│   │   │   ├── 002_create_app_settings.js
│   │   │   ├── 003_create_kundli.js
│   │   │   └── 004_create_subscriptions_notifications.js
│   │   ├── seeds/001_defaults.js  ← default admin + settings + plans
│   │   ├── routes/
│   │   │   ├── auth.routes.js        ← /api/auth/*
│   │   │   ├── admin.routes.js       ← /api/admin/* (admin/superadmin only)
│   │   │   ├── user.routes.js        ← /api/users/*
│   │   │   ├── kundli.routes.js      ← /api/kundli/*
│   │   │   ├── subscription.routes.js ← /api/subscriptions/*
│   │   │   ├── newsletter.routes.js  ← /api/newsletter/*
│   │   │   └── settings.routes.js    ← /api/settings/public
│   │   ├── services/
│   │   │   ├── email.service.js      ← Nodemailer + template system
│   │   │   └── razorpay.service.js   ← Order creation + signature verify
│   │   └── utils/
│   │       ├── response.js           ← ok(), fail() helpers
│   │       └── token.js              ← JWT sign/verify + randomToken
├── ui-main/                   ← React (Vite + Tailwind) — jyotishstack.com
│   └── src/
│       ├── App.jsx            ← Router + maintenance check + lang toggle
│       ├── main.jsx
│       ├── index.css          ← Tailwind + custom classes
│       ├── lib/api.js         ← Axios instance with auto-refresh
│       ├── context/AuthContext.jsx
│       ├── components/
│       │   ├── StarField.jsx  ← Canvas animated starfield (royal bg)
│       │   ├── Logo.jsx       ← SVG yantra-inspired JS logo
│       │   ├── Navbar.jsx     ← Sticky, glass, bilingual, mobile menu
│       │   └── Footer.jsx     ← Newsletter subscribe + links
│       └── pages/
│           ├── ComingSoon.jsx ← Countdown timer + notify me
│           ├── Home.jsx       ← Hero + Features + Pricing sections
│           ├── Login.jsx
│           ├── Register.jsx
│           └── Dashboard.jsx  ← Protected user dashboard
├── ui-admin/                  ← Admin Panel (Vite + Tailwind, port 3004)
│   └── src/
│       ├── App.jsx            ← Protected admin router
│       ├── lib/api.js
│       ├── components/Sidebar.jsx
│       └── pages/
│           ├── AdminLogin.jsx
│           ├── Dashboard.jsx   ← Stats: users, subscribers, kundlis, subs
│           ├── Users.jsx       ← List, search, activate/deactivate
│           ├── Settings.jsx    ← Maintenance toggle, site info, payments
│           ├── Newsletter.jsx  ← Subscriber list + blast
│           ├── Notifications.jsx ← Send targeted/broadcast notifications
│           ├── EmailBlast.jsx  ← Send custom email to all/specific users
│           ├── Plans.jsx       ← Subscription plan management
│           └── EmailLogs.jsx   ← Email send history
├── ui-in/                     ← Stub (port 3001) — to be built
├── ui-ai-com/                 ← Stub (port 3002) — to be built
└── ui-ai-in/                  ← Stub (port 3003) — to be built
```

---

## 4. Database

**Engine:** MySQL  
**Host:** localhost  
**Port:** 3306  
**User:** root  
**Password:** bitsaspidy  
**Database name:** jyotish_stack_ai_db  
**Charset:** utf8mb4  
**ORM:** Knex.js  

### Tables

| Table | Purpose |
|-------|---------|
| `users` | All users — role: user / admin / superadmin |
| `user_sessions` | Refresh token storage per device |
| `app_settings` | Key-value store for runtime config |
| `kundli_profiles` | Birth chart data per person |
| `matchmaking_requests` | Pair of kundlis + result |
| `predictions` | AI-generated predictions per kundli |
| `subscription_plans` | Plan definitions (Basic free, Premium ₹499/mo, Yearly ₹3999) |
| `user_subscriptions` | User → plan mapping + Razorpay IDs |
| `newsletter_subscribers` | Email-only subscribers |
| `notifications` | In-app notifications (user_id NULL = broadcast) |
| `email_logs` | Track all outbound emails |

### Key `app_settings` keys

| Key | Default | Description |
|-----|---------|-------------|
| `maintenance_mode` | `false` | `true` = show Coming Soon to all non-admin |
| `maintenance_title` | `Coming Soon` | Title on maintenance page |
| `maintenance_message` | ... | English message |
| `maintenance_message_hi` | ... | Hindi message |
| `site_name` | `Jyotish Stack AI` | |
| `site_tagline` | `Ancient Wisdom. Modern Intelligence.` | |
| `site_tagline_hi` | `प्राचीन ज्ञान। आधुनिक बुद्धि।` | |
| `contact_email` | `contact@jyotishstack.com` | |
| `razorpay_enabled` | `false` | Enable payment flow |

### Migrations commands
```bash
cd server
npx knex migrate:latest --knexfile knexfile.js
npx knex seed:run --knexfile knexfile.js
```

---

## 4b. UI Framework

**All 5 UIs use Next.js 14 (App Router)** — NOT Vite.  
Old Vite files (`vite.config.js`, `index.html`, `src/main.jsx`, `src/App.jsx`) still exist in the repo but are unused. `next.config.js` and `src/app/` are the active entrypoints.

### Next.js Key Patterns Used
- `src/app/layout.jsx` — root HTML + font loading via `next/font/google`
- `src/app/providers.jsx` — `'use client'` wrapper with AuthProvider + LangProvider + maintenance check
- `src/app/page.jsx` (and sub-routes) — thin server wrappers that import page components
- All interactive components have `'use client'` directive at top
- Navigation: `next/link` (Link) + `next/navigation` (useRouter, usePathname, useSearchParams)
- API proxy: `next.config.js` → `rewrites` → `http://localhost:5000/api/:path*`

### ui-main Contexts
- `AuthContext` — JWT auth state (`useAuth()`)
- `LangContext` — hi/en language preference (`useLang()`) — persisted to localStorage

### ui-admin Pattern
- `AdminAuthContext` — separate admin auth state (`useAdminAuth()`)
- `AdminShell` component — wraps every protected page, checks auth, renders Sidebar
- Each admin route page: `export default function XPage() { return <AdminShell><X /></AdminShell>; }`

---

## 5. API Reference

**Base URL:** `http://localhost:5000/api`

### Auth (`/api/auth/`)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register new user |
| POST | `/login` | — | Login, returns accessToken + refreshToken |
| POST | `/refresh` | — | Exchange refreshToken for new accessToken |
| POST | `/logout` | ✓ | Invalidate session |
| GET | `/verify-email?token=` | — | Verify email |
| POST | `/forgot-password` | — | Send reset link |
| POST | `/reset-password` | — | Reset with token |
| GET | `/me` | ✓ | Get current user |

### Admin (`/api/admin/`) — requires `admin` or `superadmin` role
| Endpoint | Description |
|----------|-------------|
| GET `/dashboard` | Stats overview |
| GET/POST `/users` | List / create users |
| PATCH `/users/:id/toggle-active` | Activate / deactivate |
| PATCH `/users/:id/role` | Change role |
| POST `/send-email` | Blast email to users |
| GET/POST `/notifications` | List / send notifications |
| GET/PATCH `/settings` | Read / update app_settings |
| GET `/newsletter` | List subscribers |
| POST `/newsletter/blast` | Send newsletter |
| GET/POST/PATCH `/plans` | Manage subscription plans |
| GET `/email-logs` | Email send history |

### Kundli (`/api/kundli/`) — requires auth
| Endpoint | Description |
|----------|-------------|
| POST `/` | Create kundli profile |
| GET `/` | List user's kundlis |
| GET `/:id` | Get single kundli (by UUID) |
| PATCH `/:id` | Update kundli |
| DELETE `/:id` | Delete kundli |
| POST `/matchmaking/request` | Create matchmaking request |
| GET `/matchmaking/list` | List user's matchmaking requests |

### Subscriptions (`/api/subscriptions/`)
| Endpoint | Auth | Description |
|----------|------|-------------|
| GET `/plans` | — | List active plans |
| POST `/order` | ✓ | Create Razorpay order |
| POST `/verify` | ✓ | Verify payment + activate |

### Newsletter (`/api/newsletter/`)
| Endpoint | Description |
|----------|-------------|
| POST `/subscribe` | Subscribe email |
| GET `/unsubscribe?token=` | Unsubscribe via token |

### Settings (`/api/settings/`)
| Endpoint | Description |
|----------|-------------|
| GET `/public` | Public site settings (maintenance, tagline, etc.) |

---

## 6. Design System

**Theme:** Royal Cosmos — deep navy/indigo cosmos background, gold accents, saffron highlights.  
**Fonts:** Playfair Display (headings/serif), Inter (body), Noto Sans Devanagari (Hindi)

### Color Palette (Tailwind custom)
| Token | Hex | Use |
|-------|-----|-----|
| `cosmos-800` | `#0B0D1A` | Page background |
| `cosmos-700` | `#111428` | Card background |
| `cosmos-900` | `#06070F` | Deepest bg / footer |
| `gold` | `#D4AF37` | Primary accent, borders, CTAs |
| `gold-light` | `#F0D060` | Hover states |
| `gold-dark` | `#A88B20` | Gradient end |
| `ivory` | `#F5F0E8` | Body text |
| `saffron` | `#FF9933` | Accent / Hindi text |
| `indigo` | `#3D3580` | Secondary accent |
| `crimson` | `#8B0000` | Danger / error |

### CSS utility classes (ui-main)
- `.btn-gold` — primary CTA button
- `.btn-outline-gold` — secondary outlined button
- `.card-royal` — glassmorphism card with gold border
- `.input-royal` — form input
- `.section-title` — serif gold heading
- `.text-gradient-gold` — gold gradient text
- `.starfield-bg` — radial cosmos background
- `.glass` — backdrop-blur glass panel

---

## 7. Default Credentials

| Role | Email | Password |
|------|-------|---------|
| Superadmin | admin@jyotishstack.com | Admin@2026! |

⚠️ **Change password immediately in production.**

---

## 8. Environment Variables (server/.env)

```
NODE_ENV=development
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=bitsaspidy
DB_NAME=jyotish_stack_ai_db
JWT_SECRET=jyotish_stack_super_secret_jwt_key_2026
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=jyotish_stack_refresh_secret_2026
JWT_REFRESH_EXPIRES_IN=30d
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=<your email>
SMTP_PASS=<app password>
SMTP_FROM=no-reply@jyotishstack.com
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
ALLOWED_ORIGINS=http://localhost:3000,...
APP_URL=https://jyotishstack.com
```

---

## 9. Feature Roadmap

### Phase 1 — Foundation ✅ DONE
- [x] Monorepo setup (npm workspaces)
- [x] Express server with all core routes
- [x] MySQL schema (7 migration files)
- [x] JWT auth (register/login/refresh/logout/verify email/password reset)
- [x] Admin panel UI (users, settings, notifications, email blast, newsletter, plans, logs)
- [x] Main UI (ui-main) — Home, Login, Register, Dashboard
- [x] Coming Soon / Maintenance page with countdown
- [x] Language toggle (Hindi/English) saved to localStorage
- [x] Newsletter subscribe/unsubscribe
- [x] Razorpay payment integration (order + verify)
- [x] Email templates (welcome, verify, reset, subscription, newsletter, custom)
- [x] Maintenance mode toggle from admin panel (30-second server cache)
- [x] StarField canvas background
- [x] Royal design system (Tailwind custom palette + components)

### Phase 2 — Kundli Engine (pending PDFs from owner)
- [x] Vedic planetary position calculations (degrees, Rashi, Nakshatra, Pada, retrograde status)
- [x] Lagna chart generation (D1)
- [x] Extended Varga charts (D1, D2, D3, D4, D5, D7, D8, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60)
- [x] Dasha/Antardasha calculations (Vimshottari)
- [x] Kundli chart SVG rendering — North Indian + South Indian toggle (applies to D1 and D9)
- [x] Panchang engine — Tithi, Nitya Yoga, Karana, Vara, Hindu Masa, Sunrise/Sunset, Pahar
- [x] Astro details — Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya
- [x] Nakshatra detailed report — characteristics, professions, health (EN + HI, from DB)

### Phase 3 — Matchmaking
- [x] Ashtakoot Guna Milan (36 gunas)
- [x] Mangal Dosha detection
- [ ] Dashakoot compatibility
- [x] PDF export of match report

### Phase 4 — Predictions (Bhavishya Vani)
- [ ] Daily horoscope by Rashi
- [x] Transit predictions (Gochar)
- [x] Rule-based personalized prediction engine
- [ ] Annual predictions (Varshphal)
- [ ] AI-generated personalised predictions

### Phase 5 — Other UIs
- [ ] ui-in (jyotishstack.in) — Hindi-first design
- [ ] ui-ai-com (jyotishstackai.com) — AI-branded variant
- [ ] ui-ai-in (jyotishstackai.in) — AI-branded India

---

## 10. How to Run

### Install dependencies
```bash
# From repo root
npm install
```

### Setup MySQL database
```bash
mysql -u root -pbitsaspidy -e "CREATE DATABASE IF NOT EXISTS jyotish_stack_ai_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### Run migrations + seeds
```bash
npm run migrate     # runs knex migrate:latest in server/
npm run seed        # runs knex seed:run in server/
```

### Start development servers
```bash
npm run dev:server   # Express API on :5000
npm run dev:main     # ui-main on :3000
npm run dev:admin    # ui-admin on :3004
```

---

## 11. Key Decisions & Notes

- **UUIDs everywhere for public-facing IDs** — integer IDs are internal only. API consumers always use UUID fields.
- **Maintenance mode** is server-side cached for 30s to avoid DB hit on every request. Call `maintenanceGuard.invalidate()` after admin updates the setting — already done in `admin.routes.js`.
- **Auth bypass for admin routes** — `/api/admin` and `/api/auth` are excluded from the maintenance guard.
- **Email is fire-and-forget** — `sendEmail()` logs to `email_logs` table regardless of success/failure. Errors are swallowed to not block API responses.
- **Razorpay** — Free plans skip payment and activate immediately. Paid plans: create order → frontend calls Razorpay SDK → verify signature on server.
- **CORS** — Origins list comes from `ALLOWED_ORIGINS` env var (comma-separated). Add new domains there.
- **All 4 UIs share one API** — no per-domain backend logic. Domain differentiation is frontend-only.
- **Calculations** — All Vedic astrology calculations (Kundli, Dasha, Nakshatra, Guna Milan) will be implemented in server-side JS after the owner provides calculation PDFs. Placeholder DB columns (`calculated_data` JSON) are already in schema.
- **Retrograde status** — `server/src/services/vedic-calc.service.js` now computes apparent sidereal daily motion for every graha. Sun/Moon are forced non-retrograde; Mercury/Venus/Mars/Jupiter/Saturn/Rahu/Ketu use negative daily motion to set `is_retrograde`. Each planet also exposes `daily_motion` for audit/debug.
- **Calculation expansion** — `calculateVedicChart()` now returns D1 plus the 18-chart Varga set (D1, D2, D3, D4, D5, D7, D8, D9, D10, D12, D16, D20, D24, D27, D30, D40, D45, D60), Vimshottari Mahadasha + Antardasha, Mangal Dosha, Gochar transit highlights, and rule-based prediction summaries. `calculateAshtakoot()` provides 36-guna matching with Mangal compatibility.
- **Varga database reference** — Migration/seed `007_varga_reference_data.js` creates and populates `varga_charts`, `varga_family_references`, and `varga_chart_relationships` from the owner-provided pasted PDF text. Local seed verification: 18 chart definitions, 15 family reference rows, and 62 chart relationship rows.
- **PDF exports** — `server/src/services/report.service.js` generates lightweight authenticated PDF reports without external dependencies. Routes: `GET /api/kundli/:id/report.pdf` and `GET /api/kundli/matchmaking/:id/report.pdf`.
- **Product UI flows** — `ui-main` now has real `/kundli`, `/kundli/new`, `/kundli/:uuid`, `/matchmaking`, and `/predictions` flows. Detail view includes D1, D9, planets, dasha/antardasha, dosha, gochar, predictions, and PDF export.
- **Calculation tests** — Run `npm run test:server` from repo root. Current tests validate the documented Rahul Sharma reference chart, retrograde flags, D9/Navamsha, complete Varga set, Varga boundary rules, seed reference data, Antardasha, Mangal Dosha, Gochar, Ashtakoot, PDF report buffers, and rashi/nakshatra boundaries using Node's built-in test runner.
- **Panchang engine** — `calculateVedicChart()` now also returns `chart.panchang` (Hindu Masa, Tithi, Nitya Yoga, Karana, Vara, Pahar, Moon Phase, Sunrise, Sunset) and `chart.astro_details` (Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya). Verified against Jodhpur 23-Jan-1989 — all 14 fields match reference values.
- **Nakshatra Insight API** — `GET /api/kundli/:id` returns `profile.nakshatra_insight` (characteristics, professions JSON, health EN+HI) fetched live from `nakshatras` table using Moon's nakshatra num.
- **KundliDetail UI** — North/South Indian toggle now applies to both D1 and D9 Navamsha charts. New `BasicDetailsPanel` (tabbed: Basic Details, Ghat Chakra, Astro Details). New `PersonalityInsights` panel (tabbed: Traits, Career, Health) from nakshatra DB data.
- **Stale cache** — After multi-file changes, delete `ui-main/.next` and rebuild to fix webpack `'call'` errors.

---

## 12. When the Owner Provides PDFs

1. Read PDFs carefully for calculation formulas.
2. Create a new migration file after the current latest migration (`007_varga_reference_data.js`) if new columns or tables are needed.
3. Implement calculation logic in `server/src/services/astro/` directory.
4. Wire calculations into `kundli.routes.js` (on create and on `GET /:id` if `calculated_data` is null).
5. Update this MEMORY.md with the new formulas and column details.

---

---

## 13. Nakshatra Reference Data (AstroAnsh Class 8 PDF)

**Source:** `AstroAnsh Class 8 — Nakshatra Table Sheet.pdf`  
**Migration:** `010_nakshatra_gandmool.js` — adds `is_gandmool` column to `nakshatras` table  
**Seed:** `005_nakshatras.js` — re-seeded with deity and gandmool data

### Nakshatra → Lord → Deity → Gandmool

| # | Nakshatra | Lord | Deity | Gandmool |
|---|-----------|------|-------|----------|
| 1 | Ashwini | Ketu | Ashwini Kumars | ✅ Yes |
| 2 | Bharani | Venus | Yama | No |
| 3 | Krittika | Sun | Agni | No |
| 4 | Rohini | Moon | Brahma | No |
| 5 | Mrigashira | Mars | Soma / Chandra | No |
| 6 | Ardra | Rahu | Rudra | No |
| 7 | Punarvasu | Jupiter | Aditi | No |
| 8 | Pushya | Saturn | Brihaspati | No |
| 9 | Ashlesha | Mercury | Nagas | ✅ Yes |
| 10 | Magha | Ketu | Pitris (Ancestors) | ✅ Yes |
| 11 | Purva Phalguni | Venus | Bhaga | No |
| 12 | Uttara Phalguni | Sun | Aryaman | No |
| 13 | Hasta | Moon | Savitar | No |
| 14 | Chitra | Mars | Tvashtar / Vishwakarma | No |
| 15 | Swati | Rahu | Vayu | No |
| 16 | Vishakha | Jupiter | Indra & Agni | No |
| 17 | Anuradha | Saturn | Mitra | No |
| 18 | Jyeshtha | Mercury | Indra | ✅ Yes |
| 19 | Mula | Ketu | Nirriti | ✅ Yes |
| 20 | Purva Ashadha | Venus | Apas (Water) | No |
| 21 | Uttara Ashadha | Sun | Vishwadeva | No |
| 22 | Shravana | Moon | Vishnu | No |
| 23 | Dhanishtha | Mars | Vasus | No |
| 24 | Shatabhisha | Rahu | Varuna | No |
| 25 | Purva Bhadrapada | Jupiter | Aja Ekapada | No |
| 26 | Uttara Bhadrapada | Saturn | Ahirbudhnya | No |
| 27 | Revati | Mercury | Pushan | ✅ Yes |

### Gandmool Rule (from PDF)

- **Ketu's 3 nakshatras** = ALL Gandmool: Ashwini (1), Magha (10), Mula (19)
- **Mercury's 3 nakshatras** = ALL Gandmool: Ashlesha (9), Jyeshtha (18), Revati (27)
- **All other planets' nakshatras** = NOT Gandmool
- Total Gandmool: **6 out of 27** nakshatras

### Planet → Nakshatra Mapping (Vimshottari sequence)

| Planet | Nakshatra 1 | Nakshatra 2 | Nakshatra 3 | Dasha Years | Gandmool |
|--------|-------------|-------------|-------------|-------------|---------|
| Ketu | Ashwini | Magha | Mula | 7 | ✅ All 3 |
| Venus | Bharani | Purva Phalguni | Purva Ashadha | 20 | No |
| Sun | Krittika | Uttara Phalguni | Uttara Ashadha | 6 | No |
| Moon | Rohini | Hasta | Shravana | 10 | No |
| Mars | Mrigashira | Chitra | Dhanishtha | 7 | No |
| Rahu | Ardra | Swati | Shatabhisha | 18 | No |
| Jupiter | Punarvasu | Vishakha | Purva Bhadrapada | 16 | No |
| Saturn | Pushya | Anuradha | Uttara Bhadrapada | 19 | No |
| Mercury | Ashlesha | Jyeshtha | Revati | 17 | ✅ All 3 |

### New fields added to `NAKSHATRAS` (vedic-calc.service.js)
- `deity_en` — English deity name
- `deity_hi` — Hindi deity name
- `is_gandmool` — boolean (true for 6 nakshatras)

### New DB column added to `nakshatras` table
- `is_gandmool` BOOLEAN DEFAULT false (migration 010)

---

*Last updated: 2026-06-02 | Agent: Claude Sonnet 4.6*
