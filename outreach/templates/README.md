# Outreach email templates

Polite, human, email-only sequences for the West LA prospect list. Three tiers,
matched to the `Tier` column in `contacts.csv`. The whole design goal: read like
a real person sending one real email — because that's what actually gets replies.

| File | Use for | Touches |
|---|---|---|
| `tier-a.md` | Tier A — best prospects | intro + 2 follow-ups |
| `tier-b.md` | Tier B — solid prospects | intro + 1 follow-up |
| `tier-c.md` | Tier C — broad/volume | intro + 1 optional follow-up |
| `subject-lines.md` | Subject options per tier | — |
| `vertical-snippets.md` | `{{Hook}}` + `{{Example}}` per business Type | — |

## Merge fields

Replace these per recipient (mail-merge tool, or by hand for Tier A):

| Field | Source | Notes |
|---|---|---|
| `{{FirstName}}` | the `Contact` column | If unknown, use **"there"** — never guess a name |
| `{{Business}}` | `Business` | |
| `{{TypeReadable}}` | from `Type` | e.g. Dentist → "dental practice", Law firm → "law firm" |
| `{{Hook}}` / `{{Example}}` | `vertical-snippets.md`, by `Type` | falls back to the `_default_` row |
| `{{Proof}}` | `Rating` + `Reviews` | optional opener, Tier A/B — real data only |
| `{{CalLink}}` | `cal.com/chaunceytse/intro` | your live booking link |

> Emails now end with a simple **`— Chauncey`**; your **Gmail signature** supplies
> name, contact, and booking link (set it up from `outreach/signature.html`).
> The signature must also carry your physical address + opt-out — see CAN-SPAM below.

## Sending sequence

1. Work the list **top-down** — it's already sorted Tier A first. Best prospects
   get your freshest energy and most personalization.
2. Send the **intro**. Log it: set `Date contacted`, `Channel` = `email`,
   `Status` = `contacted` in `contacts.csv`.
3. No reply? Send the next touch on the **same thread** (blank subject), on the
   cadence noted in each file (~3–5 business days apart).
4. Reply comes in → `Status` = `replied`, then move them along the pipeline
   (`call booked` → `proposal sent` → `won`/`passed`).
5. Anyone who says no / "no thanks" → `Status` = `passed`, and **stop**. Don't
   email them again.

## Deliverability — don't torch your domain

Sending 500 cold emails the wrong way gets `tsecapital.co` flagged as spam, and
then even your real client email stops landing. Do it slowly and properly:

- **Warm up.** Start at ~10–20/day from a real inbox for a week or two, then ramp.
  Never blast 500 at once.
- **Use a separate sending domain** if you can (e.g. `gotsecapital.co`), so a
  spam hit never touches your primary `tsecapital.co` mailbox. Set up SPF, DKIM,
  and DMARC on it.
- **Plain text, one link.** No images, no tracking pixels, no five links. The
  templates already do this.
- **Personalize the first line.** Identical mass mail is what filters catch.
- **Send from a real person's address** (`chauncey@…`), not `noreply@` or `sales@`.
- A tool like Instantly, Smartlead, or lemlist handles the merge, throttling, and
  reply detection. Or for Tier A, just send by hand from Gmail — it converts best.

## The legal part (CAN-SPAM + California)

Cold B2B email is legal in the US, but you must:

- **Tell the truth in the subject and "from".** The templates do.
- **Include a valid physical postal address.** Since the body now ends with just
  `— Chauncey`, put the address in your **Gmail signature** (a PO box or
  registered-agent address is fine). This is not optional.
- **Offer a clear opt-out and honor it within 10 days.** Add a short opt-out line
  to your Gmail signature (e.g. "Prefer not to hear from me? Just reply and say so").
  When someone opts out, mark them `passed` and never re-email.
- Don't use deceptive headers or scraped-and-spammed personal addresses. Stick to
  business/role addresses (`info@`, `office@`), which the enrichment script prefers.

This is practical guidance, not legal advice — if you scale this up a lot, run it
past a lawyer.
