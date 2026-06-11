# Walk-in leave-behind + phone-only call cards — design

- **Date:** 2026-06-11
- **Status:** Approved (build)
- **Branch:** trading-bot-backtest

## Context

`outreach/contacts.csv` holds 500 leads within ~5 miles of West LA. Only 243 have a
public email; the other **257 have a phone + website + address but no email**, so the
existing email pipeline (`render-emails.js` / `send-emails.js`) can never reach them.
This work adds two assets to work those leads in person and by phone:

1. A printed **walk-in leave-behind**.
2. Per-lead **call cards** (a worklist generator).

Both reuse the existing per-vertical wording in `lib/compose.js` so messaging never
drifts between email, phone, and paper.

## Deliverable 1 — Walk-in leave-behind (print)

A self-contained HTML on the site palette (`--paper #f4eee2`, `--clay #bd5a36`,
`--brass`, Fraunces + Hanken), sized for **Save-as-PDF → cardstock**.

- **Design:** the hybrid chosen from mockups — A's broad, any-vertical copy; B's card
  layout (clay pill, cream panel, diamond bullets, italic pull-quote); C's QR.
- **QR:** real and scannable, baked in as inline SVG → `https://tsecapital.co`,
  black-on-white for reliable scanning (no brand-colored modules). Generated once via
  `npx qrcode`; stored at `outreach/leave-behind/qr.svg`.
- **Two sizes from the same content:** `leave-behind-halfletter.html` (5.5×8.5",
  primary) and `leave-behind-postcard.html` (5×7", easier hand-off / cheaper bulk).
- **Content:** headline, 4 example automations, "a real engineer — not an agency",
  free-call offer, footer (Book button + cal link + email + QR).
- `print-color-adjust: exact` so the warm background prints without toggling settings.

## Deliverable 2 — Call cards (`render-cards.js`)

A generator mirroring `render-emails.js`, reusing `lib/compose.js`.

- **New `composeCall(row)` in `lib/compose.js`:** reuses the per-vertical SNIPPET
  hook/example, `readable` type, review-proof, the finance-credibility branch, and
  name detection. Returns a spoken **opener** (gatekeeper-friendly) and a **voicemail**
  (~20s) so phone wording matches the emails.
- **Selection:** rows with **no Email**, a **Phone**, and Status not actioned. Sort by
  Tier (A→B→C) then Score desc. Flags: `--limit N`, `--tier A|B|C`.
- **Numbering:** "Call #N" in worklist order — kept separate from the email "Lead #N"
  (which counts emailable leads) to avoid collision.
- **Output:** one print HTML worklist, `outreach/cards/call-cards.html`, cards 2-up and
  page-breakable. Each card shows rank/tier/type/proof, business, phone/website/address,
  the opener, the voicemail, and a door note ("left out → leave the postcard, get
  name + email, log in contacts.csv").
- **Read-only:** does **not** mutate `contacts.csv`. Calling is manual; the user updates
  Status / Channel / Email as they work each lead (an email captured this way then joins
  the normal email queue).

## Non-goals

- No auto-dialer, CRM, or CSV mutation by the card generator.
- QR stays high-contrast (no styled modules) for scannability.
- Generated `outreach/cards/` holds lead phone numbers + addresses → gitignored, like
  `*.csv` and `drafts/`.

## Files touched

- `outreach/scripts/lib/compose.js` — add `composeCall` (+ export).
- `outreach/scripts/render-cards.js` — new generator.
- `outreach/leave-behind/leave-behind-halfletter.html`, `leave-behind-postcard.html`,
  `qr.svg` — new print assets.
- `.gitignore` — ignore `/outreach/cards/`.
