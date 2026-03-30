# Yummy Wellness Tracker
### Geolocation · Multilingual · Global Cross-Reference · Recipe & Manufacturing Comparison

A user opens the app in Tokyo. They see today's top health debates happening in Japan right now — in Japanese, sourced from Japanese media, scored against Japanese health authority guidance. Then with one tap they see how Germany, France, the US and Brazil view the exact same claim — including how the same ingredient is used differently in each country's cooking tradition, and whether the manufacturing process differs between regions.

The science verdict is universal. The cultural context is local. The comparison is global.

---

## How it works

```
User opens app
     ↓
Device asks: "Allow location?"
     ↓ yes                              ↓ no / denied
Get lat/lng via Expo Location     IP-based geolocation fallback
     ↓                                  ↓ (ipapi.co — free, no key)
     └────────────── country code ──────┘
                          ↓
            Load data/geo/[COUNTRY].json
                          ↓
        Display localised claims in device language
                          ↓
        User taps "Global view" on any claim
                          ↓
        Load data/geo/global.json → same claim across
        all countries with regional differences
```

---

## Repository structure

```
yummy-wellness-tracker/
  .github/workflows/
    daily-tracker.yml       ← cron 10:45 UTC daily
  scripts/
    fetch_reddit.py         ← public JSON, no key
    fetch_gdelt.py          ← 65 languages, no key
    fetch_youtube.py        ← YouTube Data API (free 10k/day)
    fetch_rss.py            ← WHO, NHS, CDC, BfR, ANSES
    deduplicate.py          ← merge + rank by geo + engagement
    score_claims.py         ← Claude AI: scores + 8 languages
    build_json.py           ← assemble geo-aware output files
    publish.py              ← git commit + push
  admin/
    index.html              ← editorial review dashboard
    review.js
    style.css
  src/
    services/
      geolocation.ts        ← GPS → IP → locale fallback chain
      dataLoader.ts         ← fetch regional JSON + cache
    components/
      GlobalView.tsx        ← country scores + cooking traditions UI
    theme/
      colors.ts
    data/
      fallbackClaims.ts     ← bundled data for offline/first-open
    App.tsx
  data/
    daily.json              ← full dataset (all regions, all languages)
    geo/
      US.json  GB.json  DE.json  JP.json  FR.json  BR.json
      global.json             ← cross-reference comparison file
    archive/                ← daily snapshots
  requirements.txt
  .env.example
```

---

## Setup

### 1. Secrets (GitHub → Settings → Secrets → Actions)

| Secret | Where to get it | Required |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com | Yes |
| `YOUTUBE_API_KEY` | console.cloud.google.com → YouTube Data API v3 | Optional |

Everything else (Reddit, GDELT, WHO/CDC/NHS RSS, ipapi.co) is completely free with no key.

### 2. Run the pipeline

**Automatic:** Runs every day at 10:45 UTC (5:45am EST) via GitHub Actions.

**Manual trigger:** GitHub → Actions → "Daily Nutrition Claim Tracker" → Run workflow.

**Dry run** (score but don't publish): Set `dry_run = true` in the workflow dispatch inputs.

### 3. Editorial review

After the pipeline runs, open `admin/index.html` in a browser to review scored claims before they go live. Approve or reject each claim, then download the updated `scored_claims.json` and commit it. Re-run `build_json.py` (or trigger the workflow) to publish.

---

## Supported regions & languages

| Region | Language | Primary health authority |
|---|---|---|
| US | English | CDC, NIH, USDA |
| GB | English | NHS, FSA, BNF |
| DE | German | BfR, DGE |
| JP | Japanese | NIBIOHN, National Cancer Center Japan |
| FR | French | ANSES, INSERM |
| BR | Portuguese | ASAE, Embrapa, SBD |
| AU | English | NHMRC, Heart Foundation |
| IN | Hindi | ICMR, NIN India |
| KR | Korean | NIFDS, Korean Nutrition Society |
| ES | Spanish | AESAN, CSIC |

---

## Scoring

| Score | Label | Meaning |
|---|---|---|
| 85–100 | Well supported | Strong, replicated peer-reviewed evidence |
| 40–84 | Nuanced | Partially true, overstated, context-dependent, or emerging |
| 0–39 | Misleading | False, unsupported, or conspiracy framing |

---

## Data pipeline cost

- Reddit, GDELT, WHO/CDC/NHS RSS, ipapi.co: **free**
- YouTube Data API: **free** (10,000 units/day; pipeline uses ~500)
- Claude AI scoring (20 claims × 8 languages): **~$0.50/day**

---

*Yummy Wellness Company · Global Nutrition Intelligence*
*Scanning 65 languages · Localised by geolocation · Science is universal · Culture is specific*
