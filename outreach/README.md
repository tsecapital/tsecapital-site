# Outreach

Everything for reaching local West LA businesses about AI automation: a script
that **builds a real, tiered prospect list**, a script that **finds public emails**,
and **human-sounding email templates** to reach out.

```
outreach/
├── contacts.csv          ← your list + tracker (one row per business)
├── scripts/              ← the data pipeline (plain Node, no npm install)
│   ├── config.js         ← WHO to target + how to tier — edit this
│   ├── fetch-places.js   ← builds contacts.csv from Google Places
│   ├── enrich-emails.js  ← fills in public emails from business websites
│   └── lib/              ← helpers (places API, scoring, geo, csv)
└── templates/            ← cold-email sequences (see templates/README.md)
```

> Lead lists are private: `.gitignore` keeps `outreach/*.csv` out of git. Your API
> key goes in an environment variable, never in a file.

---

## Quick start

### 1. Get a free Google Maps API key (~2 min)

The list comes from the **Google Places API (New)** — real businesses, real
addresses, phones, websites, ratings, review counts.

1. Go to <https://console.cloud.google.com/> → create a project.
2. Enable **Places API (New)**.
3. **Credentials → Create credentials → API key.** Copy it.
4. Google gives a large monthly free allotment; this whole run costs little or
   nothing. Tip: restrict the key to the Places API in the console.

### 2. Build the list

```bash
GOOGLE_MAPS_API_KEY=your_key node outreach/scripts/fetch-places.js
```

Pulls businesses within **5 miles of ZIP 90049**, dedupes, tiers them, and writes
up to **500 rows** to `contacts.csv`, **Tier A first**. Options:

```bash
... node outreach/scripts/fetch-places.js --limit 200   # fewer rows
... node outreach/scripts/fetch-places.js --dry         # preview, don't write
```

Re-running is safe — it **merges**, preserving any tracking you've added.

### 3. Find emails

```bash
node outreach/scripts/enrich-emails.js            # all rows missing an email
node outreach/scripts/enrich-emails.js --tier A   # just Tier A first
```

Visits each business's website and fills the `Email` column where one is public.
Expect ~30–50% to have a findable email — the rest stay in your list with a phone
+ website. (No API key needed for this step.)

### 4. Reach out

Open `templates/` and work the list top-down. `templates/README.md` covers the
sequence, cadence, **deliverability** (so you don't get marked as spam), and the
**CAN-SPAM** basics you need to follow.

---

## How tiering works

Each business gets a **fit × size** score and a tier, so you contact the best
prospects first:

- **fit** — how well AI automation fits the vertical (dental/medical/law/etc.
  score highest; set in `config.js`).
- **size** — review count, as a proxy for how established/able-to-pay they are.
- plus bonuses for having a real website and a strong rating.

| Tier | Meaning |
|---|---|
| **A** | High-fit + established (50+ reviews) + has a website. Email these first. |
| **B** | Decent fit, or solid mid-size signals. |
| **C** | Lower fit / smaller / no website. Volume tier. |

Change the targets, verticals, or weights anytime in `scripts/config.js`.

---

## `contacts.csv` columns

The list and your tracker are the same file. The script fills the data columns;
**you** fill the tracking columns as you work each lead.

| Column | Filled by | What it's for |
|---|---|---|
| **Business** | script | Business name |
| **Contact** | you | Person you reach / their name for `{{FirstName}}` |
| **Type** | script | Vertical (dentist / law firm / …) — drives the email Hook |
| **Email** | enrich script / you | Best email, where one is public |
| **Phone** | script | Listed phone |
| **Date contacted** | you | `YYYY-MM-DD` of first outreach |
| **Channel** | you | email / call / walk-in / referral |
| **Status** | you | Pipeline stage (below) |
| **Notes** | you | Anything useful for the next touch |
| **Tier** | script | A / B / C |
| **Score** | script | Fit × size score (higher = better prospect) |
| **Website**, **Address**, **Rating**, **Reviews** | script | Context for personalizing |
| **PlaceID** | script | Stable Google ID — lets re-runs merge without losing your notes |

### Status pipeline

```
contacted → replied → call booked → proposal sent → won / passed
```

- Sort by **Status** to see who needs a follow-up.
- Sort by **Tier** then **Score** to always work your best leads first.
- Mark anyone who opts out as **passed** and stop emailing them.
