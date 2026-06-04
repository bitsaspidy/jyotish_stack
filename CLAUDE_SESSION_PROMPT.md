# Jyotish Stack AI — Claude Cold-Start Prompt (Session 34+)

You are working on **Jyotish Stack AI** — a production Vedic astrology SaaS platform.
Read this entire prompt before doing anything. This is your complete project memory.

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
- **GitHub:** github.com/bitsaspidy/jyotish_stack | branch: codex/yogas-doshas-hindi-ui

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
npm run build:main     # Production build (26/26 pages)
```

---

## 🗄 Database State (as of Session 33)

* **18 migrations | 15 seed files | 27 tables**
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
    ephemeris.service.js       ← Meeus astronomical algorithms
                                  exports: julianDay, jCent, obliquity, GMST, LST,
                                  sunTropicalLongitude, moonTropicalLongitude,
                                  rahuTropicalLongitude, planetTropicalLongitude,
                                  tropicalAscendant, norm
    life-report.service.js     ← Atmakaraka, Isht Devata, Varga, Life Report
    varga-reference.service.js ← Varga chart reference data
    helpers/                   ← 17 focused modules:
      vedic-data.js            ← RASHIS, NAKSHATRAS, DIGNITY_MAP (incl Rahu/Ketu),
                                  NATURAL_FRIENDS (all 9 planets), DIGNITY_STRENGTH,
                                  BHAVA_CLASSIFICATION
      core-helpers.js          ← norm, lahiriAyanamsa, toSidereal, getPlanetDignity,
                                  getDignityStrength, getPlanetRelation, toDMS,
                                  siderealLongitudeForPlanet, signedAngleDelta,
                                  houseFromSign, rashiFromDeg, ordinal, formatDate
      varga-calc.js            ← All 18 Varga chart calculations
      dasha-calc.js            ← Vimshottari Mahadasha + Antardasha
      panchang.js              ← Tithi, Yoga, Karana, Vara, Sunrise/Sunset, Astro Details
      drishti-bhavkarak.js     ← Graha Drishti, Bhav Karak, Digbala
      drishti-life-impact.js   ← 7 life-area interpretation engine (S31)
      mangal-dosha.js          ← Mangal Dosha detection
      gochar.js                ← Gochar transit summary
      ashtakoot.js             ← Ashtakoot Guna Milan (36 gunas)
      prediction-data.js       ← All prediction reference data
      predictions-engine.js    ← Rule-based prediction generation
      detailed-reports.js      ← Planet assessment, Yoga+Dasha, Event timing
      yogas-doshas.js          ← 12 yogas + 13 dosha types detection
      life-guidance.js         ← Job/Business, Work Location, Business Timing,
                                  Relationships, Marriage, Parents, Children, Remedies (S33a)
      daily-horoscope.js       ← Transit-based 12-rashi daily horoscope engine (S33b)
                                  Moon-house themes, planet modifiers, Sade Sati detection
                                  1-hour in-memory cache per date
      varshphal.js             ← Annual Solar Return chart engine (S33c)
                                  Binary-search SR finder, Varsha Lagna, Varshesha,
                                  Mudda Dasha (7 Tajika periods), house readings,
                                  planet movement comparison (natal vs varsha)

  routes/
    kundli.routes.js           ← Kundli CRUD + all DB enrichment fetchers:
                                  fetchChartEnrichment(), fetchNakshatraInsight(),
                                  fetchDashaRemedies(), fetchBhavaLordReadings() (S32)
                                  generateLifeGuidance() → profile.life_guidance (S33a)
                                  generateVarshphal() → GET /:id/varshphal?year=YYYY (S33c)
    horoscope.routes.js        ← GET /api/horoscope/daily (public, no auth) (S33b)
                                  ?date=YYYY-MM-DD | ?rashi=1-12

ui-main/src/
  views/
    KundliDetail.jsx           ← Main Kundli detail page (very large)
    DailyHoroscope.jsx         ← Daily horoscope page view (S33b)
    Predictions.jsx            ← Predictions page (includes LifeGuidancePanel)
  components/
    KundliInsightPanel.jsx     ← Plain-language customer panel (4 tabs)
    PlanetImpactPanel.jsx      ← Planet life-area impact (S29)
    BhavaLordPanel.jsx         ← Bhava Lord readings (S32) 12 house cards
    LifeGuidancePanel.jsx      ← Life guidance (S33a) 4-tab panel
    VarshphalPanel.jsx         ← Annual Solar Return (S33c) 4-tab panel
    LifeReportPanel.jsx        ← 5-tab life report panel
  app/
    horoscope/page.jsx         ← /horoscope route (S33b)
```

---

## ✅ What Is Already Built (Sessions 1–33)

### Backend
* Full auth (JWT, refresh tokens, email verify, password reset)
* Admin routes (users, settings, notifications, email blast, plans, logs)
* Kundli CRUD + auto-calculation on create
* Vedic calculation engine:
  * 9 Grahas: sidereal longitude, rashi, dignity, dignity_strength (%), sign_lord_relation, retrograde
  * Ascendant + whole-sign houses (1–12)
  * 18 Varga charts (D1–D60)
  * Vimshottari Mahadasha + Antardasha (9 periods, is_current)
  * Panchang (Tithi, Yoga, Karana, Vara, Masa, Sunrise/Sunset, Pahar)
  * Astro Details (Varna, Vashya, Yoni, Gana, Nadi, Tatva, Yunja, Naam Akshar, Paya)
  * Graha Drishti + 7 Life-Area Impact per aspected house
  * Bhav Karak + Digbala
  * Mangal Dosha | Ashtakoot | Gochar transits
  * Rule-based predictions (portrait, dasha, life areas)
  * Yoga & Dosha detection (12 yogas, 13 dosha types + cancellation)
  * Upcoming Antardasha Signals (Yoga+Dasha forecast)
  * Life Report (Atmakaraka, Isht Devata, Varga Analysis, 5 sections)
  * D60 Past Life Reading + D20 Spiritual Path
  * Planet Assessments (positive/negative/mixed with score)
  * Event Timing (5 life areas with dasha+gochar windows)
  * Remedy system (Ishta Devata, mantras, puja steps)
  * Chart enrichment from DB (guna/varna/deity + house bhava data)
  * **Bhava Lord Readings (S32)** — 144 BPHS bilingual interpretations
  * **Life Guidance (S33a)** — Job/Business, Work Location, Business Timing, Relationships, Marriage, Parents, Children, Remedies — all from chart data, no extra DB queries
  * **Daily Horoscope (S33b)** — GET /api/horoscope/daily, 12 rashis, transit-based, cached
  * **Varshphal (S33c)** — GET /api/kundli/:id/varshphal?year=YYYY, Solar Return chart, Varshesha, Mudda Dasha, house analysis

### DB Tables (27 total)
users, user_sessions, app_settings, kundli_profiles, matchmaking_requests, predictions,
subscription_plans, user_subscriptions, newsletter_subscribers, notifications, email_logs,
zodiac_signs, planets, planet_dignity, nakshatras, houses,
house_lord_interpretations *(144 rows, bilingual, BPHS — S32)*,
varga_charts, varga_family_references, varga_chart_relationships,
graha_drishti_rules, bhav_karak, digbala_rules,
remedy_planets, remedy_problems, remedy_puja_steps,
nakshatra_notes (via migrations), yogas_library, doshas_library,
jyotish_basics, planet_naisargika_maitri *(S30 — 9×9 friendship matrix)*

### Frontend (ui-main) — 26 pages / 20+ panels in KundliDetail
* Full auth flow + Dashboard
* Kundli Manager (list, create, open)
* D1 + D9 charts (North/South Indian toggle)
* Planet table with EDOFEN strength % + sign-lord relation
* Dasha timeline + House grid
* Basic Details / Panchang / Astro Details (tabbed)
* Personality Insights (Traits / Career / Health from nakshatra DB)
* Life Portrait (Who You Are / Current Period)
* Mangal Dosha | Gochar | Digbala | Bhav Karak
* Graha Drishti with 🔍 7 Life-Area accordion (S31)
* Yogas & Doshas panel (with cancellation status)
* Varga Charts (D1–D60) with plain-language guidance
* D60 Past Life Reading | D20 Spiritual Path
* Life Report (5 tabs: Soul Profile / Finance / Family / Health / Problems)
* KundliInsightPanel (4 tabs with EDOFEN badges + bhava type badges)
* PlanetImpactPanel (9 planets × life areas)
* **BhavaLordPanel (S32)** — 12 house lord cards, filter tabs, quality/VRY badges, bilingual
* **LifeGuidancePanel (S33a)** — 4-tab: Career · Relationships · Family · Remedies
* **VarshphalPanel (S33c)** — 4-tab: Year Overview · Varsha Chart · House Readings · Mudda Dasha
* Detailed Reports (General / Planet / Varga Matrix / Planet Details / Cusps)
* Matchmaking (Ashtakoot + PDF export)
* Predictions page (full narrative engine with Isht Devata + LifeGuidancePanel)
* **Daily Horoscope page /horoscope (S33b)** — 12-rashi grid, transit strip, 5-tab detail
* Admin panel at /admin/*

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
7. Build must pass: `npm run build:main` → 26/26 pages before committing
8. MySQL only (not SQLite/Postgres) | Next.js 14 App Router (not Vite/Pages)
9. DATE columns return as strings via `typeCast` in `knexfile.js`
10. Whole-sign house system | Lahiri ayanamsa throughout
11. Communication: short direct instructions — owner trusts agent to know patterns
12. No pdftoppm on this machine — PDFs are read directly via Claude's Read tool
13. Push to GitHub after each session: branch `codex/yogas-doshas-hindi-ui`

---

## 🔮 What Is Pending

* Dashakoot compatibility (beyond Ashtakoot)
* Swiss Ephemeris / astronomy-engine integration for higher planet accuracy
* AI-generated personalized predictions (Claude API integration)
* SMTP + Razorpay live key configuration
* Production deployment
* More AstroAnsh PDFs (Class 5, 6, 10, etc.)
* Navbar links for /horoscope page
* User location for Varshphal (currently uses birthplace; should use current residence)

---

## 🚀 Next Migration Number: 019
## 🌱 Next Seed Number: 016
## 📄 Pages Count: 26
## 🔧 Helper Modules: 17
