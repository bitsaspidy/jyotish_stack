# Jyotish Stack AI — Claude Cold-Start Prompt (Session 36+)

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
npm run build:main     # Production build (27/27 pages)
```

---

## 🗄 Database State (as of Session 34)

* **18 migrations | 15 seed files | 27 tables** (unchanged through Session 34)
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
    life-report.service.js     ← Atmakaraka, Isht Devata, Varga, Life Report
    varga-reference.service.js ← Varga chart reference data
    helpers/                   ← 19 focused modules:
      vedic-data.js            ← RASHIS, NAKSHATRAS, DIGNITY_MAP, NATURAL_FRIENDS,
                                  DIGNITY_STRENGTH, BHAVA_CLASSIFICATION
      core-helpers.js          ← norm, lahiriAyanamsa, toSidereal, getPlanetDignity,
                                  getDignityStrength, getPlanetRelation, toDMS,
                                  siderealLongitudeForPlanet, signedAngleDelta,
                                  houseFromSign, rashiFromDeg, ordinal, formatDate
      varga-calc.js            ← All 18 Varga chart calculations
      dasha-calc.js            ← Vimshottari Mahadasha + Antardasha
      panchang.js              ← Tithi, Yoga, Karana, Vara, Sunrise/Sunset
      drishti-bhavkarak.js     ← Graha Drishti, Bhav Karak, Digbala
      drishti-life-impact.js   ← 7 life-area interpretation engine (S31)
      mangal-dosha.js          ← Mangal Dosha: houses 1,2,4,7,8,12; 3 types
                                  (Anshik/Poorna/Double); 4 cancellations; bilingual
                                  effects_en/hi; manglik_type/manglik_type_hi (S35)
      gochar.js                ← Gochar transit summary
      ashtakoot.js             ← Ashtakoot Guna Milan: all 8 kootas with name_hi,
                                  description_en/hi, has_dosha, dosha_name/hi,
                                  status_en/hi, verdict_en/hi, mangal_note_en/hi,
                                  summary_hi, active_dosha_count (S35)
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
      kundli-strength.js       ← Kundli overall strength report (S34, fixed S35)
                                  computeKundliStrength() — 0-100 score across
                                  planets, yogas, 8 life domains, dasha
      varga-insights.js        ← NEW (S35): Deep planet-by-planet analysis for all
                                  18 Varga charts. computeVargaInsights() returns 9
                                  planet readings per chart with: impact rating,
                                  positives[], negatives[], remedy{en,hi}.
                                  VARGA_HOUSE_DOMAIN: 18×12 domain descriptions.
                                  PLANET_REMEDY: complete EN+HI for all 9 planets.
                                  getChartRemedy(): per-chart overall remedy.

  routes/
    kundli.routes.js           ← Kundli CRUD + enrichment + all new endpoints:
                                  GET /:id/varshphal?year=YYYY
                                  GET /:id/varshphal-years?from=YYYY&count=5
                                  GET /:id/strength
    horoscope.routes.js        ← GET /api/horoscope/daily (public, no auth)

ui-main/src/
  app/
    horoscope/page.jsx         ← /horoscope route
    varshphal/page.jsx         ← /varshphal route (NEW S34)
  views/
    KundliDetail.jsx           ← Main Kundli detail page (very large)
    DailyHoroscope.jsx         ← 7-tab horoscope page (S34: +Transits +Remedies tabs)
    Predictions.jsx            ← Predictions page
    VarshphalPage.jsx          ← NEW (S34): dedicated /varshphal page with kundli selector
  components/
    Navbar.jsx                 ← Nav links incl. /horoscope + /varshphal (added S34)
    KundliStrengthPanel.jsx    ← NEW (S34): collapsible 0-100 strength report
                                  conic-gradient ring, 8 life domains, planet table,
                                  strengths/challenges — auto-loads on mount
    KundliInsightPanel.jsx     ← Plain-language customer panel (4 tabs)
    PlanetImpactPanel.jsx      ← Planet life-area impact (S29)
    BhavaLordPanel.jsx         ← Bhava Lord readings (S32) 12 house cards
    LifeGuidancePanel.jsx      ← Life guidance (S33) 4-tab panel
    VarshphalPanel.jsx         ← Annual Solar Return (S33/S34):
                                  5 tabs: Year Overview | Life Guide | Varsha Chart |
                                  House Readings | Mudda Dasha
                                  5-Year Journey Strip (always visible)
                                  YearAtGlanceTable (11 areas in Overview)
    LifeReportPanel.jsx        ← 5-tab life report panel
```

---

## ✅ What Is Already Built (Sessions 1–35)

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
  * **Mangal Dosha (S35 enhanced)** — houses 1,2,4,7,8,12; Anshik/Poorna/Double types; 4 cancellations (Jupiter aspect, Venus aspect, own/exalt sign, Kumbh Lagna); bilingual effects_en/hi; manglik_type_hi
  * **Ashtakoot Guna Milan (S35 enhanced)** — all 8 kootas with name_hi, description_en/hi, has_dosha flag, dosha_name/hi, status_en/hi; verdict_en/hi; summary_hi; mangal_note_en/hi; mutual-Manglik cancellation; active_dosha_count
  * Gochar transits | Rule-based predictions (portrait, dasha, life areas)
  * Yoga & Dosha detection (12 yogas, 13 dosha types + cancellation)
  * Upcoming Antardasha Signals (Yoga+Dasha forecast)
  * Life Report (Atmakaraka, Isht Devata, Varga Analysis, 5 sections)
  * D60 Past Life Reading + D20 Spiritual Path
  * Planet Assessments (positive/negative/mixed with score)
  * Event Timing (5 life areas with dasha+gochar windows)
  * Remedy system (Ishta Devata, mantras, puja steps)
  * Chart enrichment from DB (guna/varna/deity + house bhava data)
  * **Bhava Lord Readings (S32)** — 144 BPHS bilingual interpretations
  * **Life Guidance (S33)** — Job/Business, Work Location, Business Timing, Relationships, Marriage, Parents, Children, Remedies
  * **Daily Horoscope (S33)** — GET /api/horoscope/daily, 12 rashis, transit-based, cached
  * **Varshphal (S33/S34)** — Solar Return chart, Varshesha, Mudda Dasha, 11 life domains, cautions, key advice, 5-year compact endpoint
  * **Kundli Strength Report (S34/S35)** — GET /api/kundli/:id/strength, 0-100 score, 8 life domains, planet breakdown, strengths/challenges, dasha rating; bugs fixed S35
  * **Varga Deep Insights (S35)** — all 18 Varga charts now have planet_readings[] (9 planets each) + chart_remedy in varga_analysis; `varga-insights.js` 19th helper

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

### Frontend (ui-main) — **27 pages**
* Full auth flow + Dashboard
* Kundli Manager (list, create, open)
* D1 + D9 charts (North/South Indian toggle)
* Planet table with EDOFEN strength % + sign-lord relation
* Dasha timeline + House grid
* Basic Details / Panchang / Astro Details (tabbed)
* Personality Insights (Traits / Career / Health from nakshatra DB)
* Life Portrait (Who You Are / Current Period)
* **Mangal Dosha (S35)** — type badge (Anshik/Poorna/Double), H-number check cards, effects list, cancellations list, proper Hindi summary
* Gochar | Digbala | Bhav Karak
* Graha Drishti with 🔍 7 Life-Area accordion
* Yogas & Doshas panel (with cancellation status)
* **Varga Charts (D1–D60, S35)** — now shows Planet-by-Planet Analysis for every chart: 9 planet cards with impact badge, positives (◈), negatives (▸), planet-specific remedy box, overall chart remedy
* D60 Past Life Reading | D20 Spiritual Path
* Life Report (5 tabs: Soul Profile / Finance / Family / Health / Problems)
* KundliInsightPanel (4 tabs with EDOFEN badges + bhava type badges)
* PlanetImpactPanel (9 planets × life areas)
* BhavaLordPanel (S32) — 12 house lord cards, filter tabs, quality/VRY badges
* LifeGuidancePanel (S33) — 4-tab: Career · Relationships · Family · Remedies
* **KundliStrengthPanel (S34/S35)** — collapsible strength report with 0-100 ring, 8 life domains, planet table, strengths/challenges (bugs fixed S35)
* **VarshphalPanel (S33/S34)** — 5 tabs + 5-year journey strip + life guide + year-at-a-glance
* Detailed Reports (General / Planet / Varga Matrix / Planet Details / Cusps)
* **Matchmaking (S35)** — redesigned ResultPanel: conic ring, 8 koot cards (EN+HI name, description, dosha badge, status), MangalSection with type+cancellations; all bilingual
* Predictions page (full narrative engine with Isht Devata + LifeGuidancePanel)
* **Daily Horoscope /horoscope (S33/S34)** — 12-rashi grid, transit strip, 7-tab detail (Overview/Career/Love/Health/Finance/Transits/Remedies)
* **Dedicated Varshphal /varshphal (S34)** — kundli selector + full VarshphalPanel
* Admin panel at /admin/*
* **UI readability (S35)** — North/South Indian charts: bright text with SVG drop-shadow filters, lighter cell fills; globals.css: card-royal lighter, all text-ivory/* utilities boosted

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
7. Build must pass: `npm run build:main` → 27/27 pages before committing
8. MySQL only (not SQLite/Postgres) | Next.js 14 App Router (not Vite/Pages)
9. DATE columns return as strings via `typeCast` in `knexfile.js`
10. Whole-sign house system | Lahiri ayanamsa throughout
11. Communication: short direct instructions — owner trusts agent to know patterns
12. No pdftoppm on this machine — PDFs are read directly via Claude's Read tool
13. Push to GitHub after each session: branch `codex/yogas-doshas-hindi-ui`
14. SVG text rotation is unreliable — use CSS `conic-gradient` for circular meters instead

---

## 🔮 What Is Pending

* Dashakoot compatibility (beyond Ashtakoot)
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
## 📄 Pages Count: 27
## 🔧 Helper Modules: 19
