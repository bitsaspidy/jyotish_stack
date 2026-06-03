# Jyotish Stack AI — Activity Log

> Chronological record of every task completed on this project.
> Safe to share with any AI agent as full context.
> Last updated: 2026-06-02 (Session 3)

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

*Last updated: 2026-06-03 | Agent: Claude Sonnet 4.6*
