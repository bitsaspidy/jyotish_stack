# Jyotish Stack AI — Claude Cold-Start Prompt (Session 41+)

You are working on **Jyotish Stack AI** — a production Vedic astrology SaaS platform.
Read this entire prompt before doing anything. This is your complete project memory.

---

## Latest VPS Deployment Handoff - 2026-06-16

Read `MEMORY.md` and `ACTIVITY.md` first. The current live task is finishing Hostinger VPS deployment for `https://jyotishstack.com`.

Current known VPS state:
- Server user: `deploy`
- Repo path: `/var/www/jyotish-stack`
- GitHub branch: `main`
- Node verified: `v24.16.0`
- npm verified: `11.13.0`
- PM2 verified: `7.0.1`
- Apache is installed and active.
- MySQL is installed; Ubuntu root access is via `sudo mysql`, not `mysql -u root -p`.
- UFW is not used. Manual firewall should expose only TCP `22`, `80`, `443`.
- Keep MySQL `3306`, Next.js `3000`, Express `5000`, and phpMyAdmin `8081` private.
- phpMyAdmin must remain localhost-only via `apache/phpmyadmin-local.conf` and PuTTY tunnel.

Critical deployment rules:
- Do not use `npm ci`; this repo ignores `package-lock.json`. Use `npm install`.
- If `knex`, `next`, or PM2 cannot find scripts, dependencies did not install.
- If PM2 has a partial failed state, run `pm2 delete jyotish-api jyotish-ui-main || true`.
- `ProxyTimeout 120` belongs at Apache `VirtualHost` level, not inside `<Location>`.
- Do not paste secrets into docs/chat. Use the VPS `server/.env` for JWT, DB, SMTP, Razorpay, Anthropic keys.

Next recovery commands:

```bash
cd /var/www/jyotish-stack
git pull --ff-only origin main
pm2 delete jyotish-api jyotish-ui-main || true
npm install
cd server
NODE_ENV=production npm run migrate
NODE_ENV=production npm run seed
cd ..
NODE_ENV=production npm run build:main
pm2 startOrReload ecosystem.config.js --env production --update-env
pm2 save
pm2 status
curl http://127.0.0.1:5000/health
curl -I http://127.0.0.1:3000
```

Run Certbot only after DNS points to the VPS:

```bash
sudo certbot --apache -d jyotishstack.com -d www.jyotishstack.com --redirect
```

---

## 📁 Project Location
Monorepo: `E:\2026\satsai-projects\jyotish-stack`
Memory files: `C:\Users\Asus Vivobook\.claude\projects\E--2026-satsai-projects-jyotish-stack\memory\`

---

## 🛠 Tech Stack
- **Backend:** Node.js + Express 4 + Knex.js + MySQL 8 → port 5000
- **Frontend:** Next.js 14 App Router with `src/` directory → port 3000
- **DB:** MySQL | host=localhost | user=root | password=bitsaspidy | db=jyotish_stack_ai_db
- **Payments:** Razorpay | **Email:** Nodemailer SMTP | **PDFs:** PDFKit
- **GitHub:** github.com/bitsaspidy/jyotish_stack | branch: main

---

## 🌐 Domains / Ports
| Domain | Package | Port |
|--------|---------|------|
| jyotishstack.com | ui-main | 3000 |
| jyotishstack.in | ui-in | 3001 (Hindi/Saffron theme) |
| jyotishstackai.com | ui-ai-com | 3002 (AI/Cyan theme) |
| jyotishstackai.in | ui-ai-in | 3003 (Hybrid theme) |
| API | server | 5000 |

---

## ⚡ Run Commands

```bash
npm run migrate        # Apply all 18 Knex migrations
npm run seed           # Run all 15 seed files
npm run dev:server     # API on :5000
npm run dev:main       # ui-main on :3000
npm run test:server    # 14 server tests (Node built-in runner)
npm run build:main     # Production build (38/38 pages)
```

---

## 🗄 Database State (as of Session 37, unchanged through Session 40)

* **18 migrations | 15 seed files | 27 tables** (unchanged through Session 37)
* Key fix: `knexfile.js` has `typeCast` — DATE columns return as "YYYY-MM-DD" strings
* `house_lord_interpretations` — 144 bilingual rows (12 lords × 12 placements, BPHS)
  Columns: `house_lord`, `placed_in_house`, `title`, `title_hi`, `interpretation_en`, `interpretation_hi`,
  `lord_name_en`, `lord_name_hi`, `house_signification_en`, `house_signification_hi`, `overall_effect`, `forms_viparita_yoga`
* `planet_naisargika_maitri` — 9×9 permanent friendship matrix incl. Rahu/Ketu

---

## 🔧 Architecture — Key Files

```
server/src/
  services/
    vedic-calc.service.js      ← 181-line orchestrator (DO NOT bloat)
    ephemeris.service.js       ← astronomy-engine (VSOP87, MIT) — Sun<1", Moon<1", Planets<5"
    life-report.service.js     ← Atmakaraka, Isht Devata, Varga, Life Report
    varga-reference.service.js ← Varga chart reference data
    kundli-admin.service.js    ← Admin mirror of kundli helpers (no user-ownership check) (NEW S37)
    helpers/                   ← 19 focused modules:
      vedic-data.js            ← RASHIS, NAKSHATRAS, DIGNITY_MAP, NATURAL_FRIENDS,
                                  DIGNITY_STRENGTH, BHAVA_CLASSIFICATION
      core-helpers.js          ← norm, lahiriAyanamsa, toSidereal, getPlanetDignity,
                                  getDignityStrength, getPlanetRelation, toDMS,
                                  siderealLongitudeForPlanet, signedAngleDelta,
                                  houseFromSign, rashiFromDeg, ordinal, formatDate
      varga-calc.js            ← All 18 Varga chart calculations
      dasha-calc.js            ← Vimshottari Mahadasha + Antardasha
      panchang.js              ← Tithi, Yoga, Karana, Vara, Sunrise/Sunset,
                                  Moonrise/Moonset, Ritu, Ayana, Chaughadiya,
                                  Hora (equal 60-min slots — FIXED S40),
                                  computeEndTimes() — exact end time for tithi/nak/yoga/karana
                                  calculateDailyPanchang() — full daily muhurta
      drishti-bhavkarak.js     ← Graha Drishti, Bhav Karak, Digbala
      drishti-life-impact.js   ← 7 life-area interpretation engine
      mangal-dosha.js          ← Mangal Dosha: houses 1,2,4,7,8,12; 3 types
                                  (Anshik/Poorna/Double); 4 cancellations; bilingual
                                  effects_en/hi; manglik_type/manglik_type_hi
      gochar.js                ← Gochar transit summary
      ashtakoot.js             ← Ashtakoot Guna Milan + Rajju-Vedha (Dashakoot):
                                  all 8 kootas with name_hi, description_en/hi,
                                  has_dosha, dosha_name/hi, status_en/hi,
                                  verdict_en/hi, mangal_note_en/hi, summary_hi,
                                  active_dosha_count.
                                  PLUS: rajju{has_dosha, group, status_en/hi},
                                        vedha{has_dosha, nak_nums, status_en/hi}
      prediction-data.js       ← All prediction reference data
      predictions-engine.js    ← Rule-based prediction generation
      detailed-reports.js      ← Planet assessment, Yoga+Dasha, Event timing
      yogas-doshas.js          ← 12 yogas + 13 dosha types detection
      life-guidance.js         ← Job/Business, Work Location, Business Timing,
                                  Relationships, Marriage, Parents, Children, Remedies
      daily-horoscope.js       ← Transit-based 12-rashi daily horoscope engine
                                  1-hour in-memory cache per date
      varshphal.js             ← Annual Solar Return engine:
                                  generateVarshphal() — full analysis incl. life_areas
                                  compactVarshphal() — compact multi-year summary
                                  buildLifeAreas() — 11 life domains + cautions + advice
      kundli-strength.js       ← computeKundliStrength() — 0-100 score across
                                  planets, yogas, 8 life domains, dasha
      varga-insights.js        ← Deep planet-by-planet analysis for all 18 Varga charts.
                                  computeVargaInsights() returns 9 planet readings per chart
                                  with: impact rating, positives[], negatives[], remedy{en,hi}.
                                  VARGA_HOUSE_DOMAIN: 18×12 domain descriptions.
                                  PLANET_REMEDY: complete EN+HI for all 9 planets.
                                  getChartRemedy(): per-chart overall remedy.

  routes/
    kundli.routes.js           ← Kundli CRUD + enrichment + all endpoints:
                                  GET /:id/varshphal?year=YYYY
                                  GET /:id/varshphal-years?from=YYYY&count=5
                                  GET /:id/strength
    admin.routes.js            ← All admin endpoints (NEW S37: kundli viewer added):
                                  GET /admin/kundlis        (paginated list, search, gender)
                                  GET /admin/kundlis/:uuid  (full kundli detail)
                                  GET /admin/kundlis/:uuid/strength
                                  GET /admin/kundlis/:uuid/varshphal?year=YYYY
                                  All async handlers wrapped with ah() asyncHandler
    horoscope.routes.js        ← GET /api/horoscope/daily (public, no auth)
    panchang.routes.js         ← GET /api/panchang/daily (public, no auth) (NEW S40)

ui-main/src/
  app/
    horoscope/page.jsx              ← /horoscope route
    panchang-muhurat/page.jsx       ← /panchang-muhurat route (NEW S40)
    varshphal/page.jsx              ← /varshphal route
    admin/kundlis/page.jsx          ← /admin/kundlis (NEW S37)
    admin/kundlis/[uuid]/page.jsx   ← /admin/kundlis/:uuid (NEW S37)
  views/
    KundliDetail.jsx           ← Main Kundli detail page (very large)
    DailyHoroscope.jsx         ← 7-tab horoscope page
    PanchangMuhurta.jsx        ← Public panchang page: location autocomplete, date pickers, full muhurta display (NEW S40)
    Predictions.jsx            ← Predictions page
    VarshphalPage.jsx          ← Dedicated /varshphal page with kundli selector
    Kundlis.jsx                ← Admin Kundli list: search + gender filter + pagination (NEW S37)
    KundliAdminDetail.jsx      ← Admin 13-tab kundli detail + AdminGuide panels (NEW S37)
  components/
    Navbar.jsx                 ← Nav links incl. /horoscope + /varshphal
    KundliStrengthPanel.jsx    ← Collapsible 0-100 strength report (conic-gradient ring)
    KundliInsightPanel.jsx     ← Plain-language customer panel (4 tabs)
    PlanetImpactPanel.jsx      ← Planet life-area impact
    BhavaLordPanel.jsx         ← Bhava Lord readings: 12 house cards
    LifeGuidancePanel.jsx      ← Life guidance 4-tab panel
    VarshphalPanel.jsx         ← Annual Solar Return: 5 tabs + 5-year journey strip
    LifeReportPanel.jsx        ← 5-tab life report panel
  admin-views/
    Users.jsx                  ← Admin user list (persistent error state + retry)
    Kundlis.jsx                ← Admin kundli list (NEW S37)
    KundliAdminDetail.jsx      ← Admin kundli detail, 13 tabs (NEW S37)
  admin-components/
    Sidebar.jsx                ← Admin sidebar (includes ◈ Kundli Profiles link)
    AdminShell.jsx             ← Admin shell wrapper (PAGE_TITLES incl. kundlis/[uuid])
```

---

## 🔐 Admin Panel
- URL: `http://localhost:3000/admin`
- Login: `admin@jyotishstack.com` / `Admin@2026!`
- Kundli Profiles: `http://localhost:3000/admin/kundlis`
- Uses `adminApi` axios instance — reads `adminToken` from localStorage
- Pure inline styles (no Tailwind in admin-specific code)
- `'use client'` directive on all admin-views

---

## ✅ What Is Already Built (Sessions 1–37)

### Backend
* Full auth (JWT, refresh tokens, email verify, password reset)
* Admin routes (users, settings, notifications, email blast, plans, logs, **kundli viewer S37**)
* All async admin route handlers wrapped: `const ah = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next)`
* Kundli CRUD + auto-calculation on create
* Vedic calculation engine (astronomy-engine VSOP87):
  * 9 Grahas: sidereal longitude, rashi, dignity, dignity_strength (%), sign_lord_relation, retrograde
  * Ascendant + whole-sign houses (1–12)
  * 18 Varga charts (D1–D60) with planet_readings[] per chart (9 planets each)
  * Vimshottari Mahadasha + Antardasha (9 periods, is_current)
  * Panchang (Tithi, Yoga, Karana, Vara, Masa, Sunrise/Sunset, Pahar)
  * Astro Details (Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya)
  * Graha Drishti + 7 Life-Area Impact per aspected house
  * Bhav Karak + Digbala
  * Mangal Dosha — houses 1,2,4,7,8,12; Anshik/Poorna/Double types; 4 cancellations; bilingual
  * Ashtakoot Guna Milan — all 8 kootas, bilingual, has_dosha, dosha_name, verdict, summary_hi
  * Gochar transits | Rule-based predictions (portrait, dasha, life areas)
  * Yoga & Dosha detection (12 yogas, 13 dosha types + cancellation)
  * Life Report (Atmakaraka, Isht Devata, Varga Analysis, 5 sections)
  * D60 Past Life Reading + D20 Spiritual Path
  * Bhava Lord Readings — 144 BPHS bilingual interpretations
  * Life Guidance — Job/Business, Work Location, Relationships, Marriage, Remedies
  * Daily Horoscope — GET /api/horoscope/daily, 12 rashis, transit-based, 1-hr cache
  * Varshphal — Solar Return chart, Varshesha, Mudda Dasha, 11 life domains, 5-year compact
  * Kundli Strength Report — 0-100 score, 8 life domains, planet breakdown, dasha rating
  * Varga Deep Insights — all 18 Varga charts: planet_readings[] + chart_remedy
  * **Admin Kundli Viewer (S37)** — paginated list + full 13-tab detail for any user's kundli

### Critical Pattern: MySQL Sort Buffer Fix (Session 37)
**NEVER SELECT `calculated_data` in ORDER BY / paginated queries.**
`kundli_profiles.calculated_data` is 50–300 KB JSON per row — including it in sorted queries causes MySQL `Out of sort memory` crash.

Correct pattern:
```js
// Step 1: paginated sorted query WITHOUT the blob column
const profiles = await db('kundli_profiles as kp')
  .join('users as u', ...)
  .select('kp.id', 'kp.name', ...)  // NO calculated_data
  .orderBy('kp.created_at', 'desc').limit(limit).offset(offset);

// Step 2: fetch blobs by PK for current page only (no ORDER BY — PK scan, fast)
const pageIds = profiles.map(p => p.id);
const calcRows = pageIds.length
  ? await db('kundli_profiles').whereIn('id', pageIds).select('id', 'calculated_data')
  : [];
const calcMap = Object.fromEntries(calcRows.map(r => [r.id, r.calculated_data]));

// Step 3: merge
const result = profiles.map(p => ({
  ...p,
  chart_summary: buildSummary(parseJsonMaybe(calcMap[p.id])),
}));
```
Also applies to any other large JSON/blob column in sorted queries.

### Admin Kundli Viewer — 13 Tabs (Session 37)
`KundliAdminDetail.jsx` tabs (each with collapsible AdminGuide panel):
Basic Info · Planets · Dasha · Houses · Yogas & Doshas · Varga Charts · Life Report ·
Gochar · Strength · Varshphal · Life Guidance · Matching · Predictions

Inline helper components inside KundliAdminDetail.jsx:
- `AdminGuide({ title, children, defaultOpen })` — collapsible gold-bordered guidance panel
- `AdminStrengthSection({ uuid })` — fetches `/admin/kundlis/:uuid/strength`
- `AdminVarshphalSection({ uuid })` — fetches `/admin/kundlis/:uuid/varshphal` (fully correct field names)
- `OwnerBanner({ owner })` — blue banner showing owner name/email/active status

### Actual Varshphal API Response Structure (for AdminVarshphalSection)
```
/admin/kundlis/:uuid/varshphal?year=YYYY → {
  target_year, natal_sun_long,
  varsha_chart: {
    ascendant: { rashi_en, rashi_lord, dms },
    planets: { Sun/Moon/Mars/Mercury/Jupiter/Venus/Saturn/Rahu/Ketu:
               { rashi_en, house, house_label, is_retrograde, dms } },
    sr_date, sr_local, sr_weekday
  },
  varshesha, varshesha_hi,
  mudda_dasha: [{ planet, planet_hi, days, start_date, end_date, is_current }],
  analysis: {
    score, target_year, year_summary_en,
    varshesha, varshesha_house, varshesha_desc_en,
    indicators_en[],
    house_readings: { "1".."12": { house, theme, occupants[], tone, reading_en } },
    planet_movement: { planet: { natal_house, natal_rashi, varsha_house, varsha_rashi, moved, movement_en } },
    life_areas: {
      finance/luck/family/spouse/parents/children/siblings/
      education/job/business/health/cautions/key_advice:
        { title_en, title_hi, icon, tone, score, reading_en, reading_hi, planets_involved }
    }
  }
}
```

### DB Tables (27 total)
users, user_sessions, app_settings, kundli_profiles, matchmaking_requests, predictions,
subscription_plans, user_subscriptions, newsletter_subscribers, notifications, email_logs,
zodiac_signs, planets, planet_dignity, nakshatras, houses,
house_lord_interpretations *(144 rows, bilingual, BPHS)*,
varga_charts, varga_family_references, varga_chart_relationships,
graha_drishti_rules, bhav_karak, digbala_rules,
remedy_planets, remedy_problems, remedy_puja_steps,
nakshatra_notes, yogas_library, doshas_library,
jyotish_basics, planet_naisargika_maitri *(9×9 friendship matrix)*

### Frontend (ui-main) — **29 pages**
* Full auth flow + Dashboard
* Kundli Manager (list, create, open)
* D1 + D9 charts (North/South Indian toggle) — bright text, SVG drop-shadow
* Planet table with EDOFEN strength % + sign-lord relation
* Dasha timeline + House grid
* Basic Details / Panchang / Astro Details (tabbed)
* Personality Insights | Life Portrait
* Mangal Dosha — type badge (Anshik/Poorna/Double), H-number check cards, bilingual
* Gochar | Digbala | Bhav Karak
* Graha Drishti with 7 Life-Area accordion
* Yogas & Doshas panel (with cancellation status)
* Varga Charts (D1–D60) — Planet-by-Planet Analysis: 9 planet cards per chart + chart remedy
* D60 Past Life Reading | D20 Spiritual Path
* Life Report (5 tabs: Soul Profile / Finance / Family / Health / Problems)
* KundliInsightPanel (4 tabs with EDOFEN badges + bhava type badges)
* PlanetImpactPanel (9 planets × life areas)
* BhavaLordPanel — 12 house lord cards, filter tabs, quality/VRY badges
* LifeGuidancePanel — 4-tab: Career · Relationships · Family · Remedies
* KundliStrengthPanel — 0-100 conic ring, 8 life domains, planet table, strengths/challenges
* VarshphalPanel — 5 tabs + 5-year journey strip + life guide + year-at-a-glance
* Detailed Reports (General / Planet / Varga Matrix / Planet Details / Cusps)
* Matchmaking — conic ring, 8 koot cards (EN+HI), MangalSection with type+cancellations
* Predictions page
* Daily Horoscope /horoscope — 12-rashi grid, transit strip, 7-tab detail
* Dedicated Varshphal /varshphal — kundli selector + full VarshphalPanel
* Admin panel /admin/* (login, dashboard, users, settings, plans, notifications)
* **Admin Kundli Profiles /admin/kundlis (NEW S37)** — paginated list, search, gender filter
* **Admin Kundli Detail /admin/kundlis/[uuid] (NEW S37)** — 13 tabs + AdminGuides

---

## 📚 PDFs Processed (15 total)

| PDF | Session | Key data extracted |
|-----|---------|-------------------|
| mooltrikone-and-actual-ed-sign.pdf | 3 | Planet dignity → seed 004 |
| 12_HOUSE_LORD.md (text) | 3 | 144 house lord EN interpretations → seed 006 |
| Pasted Varga PDF text | 7 | 18 Varga chart definitions → migration 007, seed 007 |
| Drishti, Bhav Karak and Digbala.pdf | 8 | Aspect rules + significators → migration 009, seed 008 |
| AstroAnsh Class 8 — Nakshatra Table Sheet.pdf | 8 | Deity names + Gandmool → migration 010 |
| DETAILED_NAKSHATRA_NOTES.md | 9 | EN notes for 27 nakshatras → migration 011 |
| AstroAnsh Class 9 - Detailed Nakshatra Notes Hindi.pdf | 9 | Hindi nakshatra notes |
| Remedy Class 1 Notes.pdf | 11 | 9 planet remedies → migration 012, seed 009 |
| AstroAnsh Class 11 & 12 — Yogas and Doshas.pdf | 12 | 12 yogas + 13 doshas → migration 013, seed 010 |
| AstroAnsh Class 1 Premium Notes.pdf | 17 | Vedic fundamentals → migration 014, seed 011 |
| AstroAnsh Class 2 Premium Notes.pdf | 19 | Nine Grahas bilingual → migration 015, seed 012 |
| AstroAnsh Class 3,4 Premium Notes.pdf | 20 | Gunas, Rashis, Bhavas → migration 016, seed 013 |
| Name of Bhavas and EDOFEN.pdf | 30 | Bhava types, EDOFEN strength, 9×9 friendship → migration 017, seed 014 |
| AstroAnsh Class 7 Premium Notes.pdf | 32 | 144 bilingual Bhava Lord interpretations (BPHS) → migration 018, seed 015 |

---

## ⚙️ Key Coding Rules (Owner Preferences)

1. All data bilingual EN+HI — every DB table, every UI panel
2. Seeds are safe to re-run — DELETE then INSERT pattern (no data loss)
3. Migration numbering: sequential 019, 020, ... (next = **019**)
4. Large service files → helpers/ subdirectory (validated Session 18)
   * `vedic-calc.service.js` stays as ≤200-line orchestrator
   * New logic goes into focused helper files in `helpers/`
5. After every session: update ACTIVITY.md (project root) + all memory files
6. Tests must pass: `npm run test:server` → 14/14 before committing
7. Build must pass: `npm run build:main` -> 38/38 pages before committing
8. MySQL only (not SQLite/Postgres) | Next.js 14 App Router (not Vite/Pages)
9. DATE columns return as strings via `typeCast` in `knexfile.js`
10. Whole-sign house system | Lahiri ayanamsa throughout
11. Communication: short direct instructions — owner trusts agent to know patterns
12. No pdftoppm on this machine — PDFs are read directly via Claude's Read tool
13. Push to GitHub after each session: branch `main`
14. SVG text rotation is unreliable — use CSS `conic-gradient` for circular meters instead
15. **Never SELECT `calculated_data` in ORDER BY queries** — fetch blob by PK separately (see MySQL fix above)
16. **All Express async route handlers must use `ah()` wrapper** — prevents Node.js v24 process crash on unhandled promise rejection

---

## 🔮 What Is Pending

* ~~Dashakoot compatibility (beyond Ashtakoot)~~ **DONE Session 39 — Rajju + Vedha added**
* ~~Hora System implementation~~ **DONE Session 40 — equal 60-min horas + end times + public page**
* Swiss Ephemeris / astronomy-engine integration for higher planet accuracy
* AI-generated personalized predictions (Claude API integration)
* SMTP + Razorpay live key configuration
* Production deployment
* More AstroAnsh PDFs (Class 5, 6, 10, etc.)
* User location for Varshphal (currently uses birthplace; should use current residence)
* Varga chart planet_readings are computed at chart-generation time — old cached charts in DB won't have them until "Recalculate" is triggered

---

## 🚀 Next Migration Number: 019
## 🌱 Next Seed Number: 016
## 📄 Pages Count: 30
## 🔧 Helper Modules: 19
## 🎨 Brand / Logo (added Session 38)
- Icon name: **"Jyot Chakra"** — shatkona (r=160) + Jyot flame in a cosmic disc
- `ui-main/src/components/Logo.jsx` — new Jyot Chakra (replaced JS monogram)
- `ui-main/public/logo-icon.svg` — 512×512 standalone icon (copyright + favicon)
- `ui-main/public/logo.svg` — 800×220 full horizontal logo (dark bg)
- `ui-main/public/logo-preview.html` — brand identity preview (serve at :4000)
- Favicon wired: `layout.jsx` icons → `/logo-icon.svg` + OG image → `/logo.svg`
- Copyright folder: `E:\2026\satsai-projects\jyotish-stack\ui-main\public\`
- `.claude/launch.json` at repo root: ui-main (:3000) + logo-preview (:4000)

## 🔖 Last GitHub Commit: `516f063` — "Session 37: Admin panel complete + Admin Kundli Viewer"
## 📝 Sessions 38–40 changes NOT yet committed
- Session 38: admin toast fix + full Jyot Chakra logo system
- Session 39: Dashakoot (Rajju + Vedha) in ashtakoot.js + Matchmaking.jsx
- Session 40: Hora fix (equal 60-min) + end times + public /api/panchang/daily + PanchangMuhurta page + Navbar Muhurta link
