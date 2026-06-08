#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// fetch-places.js — build the tiered prospect list.
//
// Pulls real businesses within 5 miles of ZIP 90049 from the Google Places API
// (New) Text Search across every vertical in config.js, dedupes them, enforces
// the 5-mile radius, scores each by fit × size, assigns Tier A/B/C, and writes
// the result to outreach/contacts.csv (Tier A first).
//
// Re-running is safe: it MERGES with the existing file, preserving any tracking
// you've added (Contact, Status, Notes, dates, manually-found emails).
//
// Usage:
//   GOOGLE_MAPS_API_KEY=xxxx node outreach/scripts/fetch-places.js
//   GOOGLE_MAPS_API_KEY=xxxx node outreach/scripts/fetch-places.js --limit 200
//   ... --dry        # fetch + print summary, but don't write the CSV
// ─────────────────────────────────────────────────────────────────────────────

const path = require("path");
const { CENTER, RADIUS_MILES, RADIUS_METERS, TARGET_COUNT, VERTICALS } = require("./config");
const { searchAllPages } = require("./lib/places");
const { haversineMiles } = require("./lib/geo");
const { scoreAndTier, byTierThenScore } = require("./lib/score");
const csv = require("./lib/csv");

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");
const COLUMNS = [
  "Business", "Contact", "Type", "Email", "Phone", "Date contacted",
  "Channel", "Status", "Notes", "Tier", "Score", "Website", "Address",
  "Rating", "Reviews", "PlaceID",
];

function parseArgs(argv) {
  const out = { limit: TARGET_COUNT, dry: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") out.limit = parseInt(argv[++i], 10) || out.limit;
    else if (argv[i] === "--dry") out.dry = true;
  }
  return out;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.error(
      "\n  Missing GOOGLE_MAPS_API_KEY.\n" +
      "  Get a free key (2 min): https://developers.google.com/maps/documentation/places/web-service/get-api-key\n" +
      "  Then run:  GOOGLE_MAPS_API_KEY=your_key node outreach/scripts/fetch-places.js\n"
    );
    process.exit(1);
  }

  console.log(`\nFetching businesses within ${RADIUS_MILES} miles of ZIP 90049...`);
  console.log(`Verticals: ${VERTICALS.length} · target: ${args.limit}\n`);

  const byId = new Map(); // place id → normalized record (best fit wins on dupes)
  let apiCalls = 0;

  for (const v of VERTICALS) {
    for (const query of v.queries) {
      let places;
      try {
        places = await searchAllPages({ apiKey, textQuery: query, center: CENTER, radiusMeters: RADIUS_METERS });
        apiCalls++;
      } catch (err) {
        console.warn(`  ! "${query}" failed: ${err.message}`);
        continue;
      }

      let kept = 0;
      for (const p of places) {
        if (!p.id || !p.location) continue;
        if (p.businessStatus && p.businessStatus !== "OPERATIONAL") continue;

        const loc = { lat: p.location.latitude, lng: p.location.longitude };
        const miles = haversineMiles(CENTER, loc);
        if (miles > RADIUS_MILES) continue; // enforce the radius ourselves

        const existing = byId.get(p.id);
        // On a duplicate, keep whichever vertical labels it with the higher fit.
        if (existing && existing.fit >= v.fit) continue;

        byId.set(p.id, {
          id: p.id,
          name: p.displayName?.text || "",
          type: v.type,
          fit: v.fit,
          phone: p.nationalPhoneNumber || "",
          website: p.websiteUri || "",
          address: p.formattedAddress || "",
          rating: p.rating || "",
          reviews: p.userRatingCount || 0,
          miles: Math.round(miles * 10) / 10,
        });
        kept++;
      }
      console.log(`  ${v.type.padEnd(18)} "${query}" → +${kept} (total ${byId.size})`);
    }
    if (byId.size >= args.limit * 1.6) break; // plenty of candidates; stop early
  }

  // Score, tier, sort, trim to the target.
  const scored = [...byId.values()].map((b) => {
    const { score, tier } = scoreAndTier(b);
    return { ...b, score, tier };
  });

  const newRows = scored.map((b) => ({
    Business: b.name,
    Contact: "",
    Type: b.type,
    Email: "",
    Phone: b.phone,
    "Date contacted": "",
    Channel: "",
    Status: "",
    Notes: "",
    Tier: b.tier,
    Score: b.score,
    Website: b.website,
    Address: b.address,
    Rating: b.rating,
    Reviews: b.reviews,
    PlaceID: b.id,
  }));
  newRows.sort(byTierThenScore);
  const trimmed = newRows.slice(0, args.limit);

  // ── Merge with the existing file so manual tracking survives a re-run ───────
  const existing = csv.readFile(CSV_PATH);
  const prevById = new Map();
  const manualRows = []; // hand-added rows that have no PlaceID
  for (const r of existing.rows) {
    if ((r.Email || "").includes("example.com")) continue; // drop seed examples
    if (r.PlaceID) prevById.set(r.PlaceID, r);
    else if ((r.Status || "").trim() || (r.Contact || "").trim()) manualRows.push(r);
  }

  const TRACK_FIELDS = ["Contact", "Date contacted", "Channel", "Status", "Notes"];
  for (const row of trimmed) {
    const prev = prevById.get(row.PlaceID);
    if (!prev) continue;
    for (const f of TRACK_FIELDS) if ((prev[f] || "").trim()) row[f] = prev[f];
    if ((prev.Email || "").trim()) row.Email = prev.Email; // keep a found/edited email
    prevById.delete(row.PlaceID);
  }
  // Previously-saved businesses not in this pull: keep them at the end.
  const leftover = [...prevById.values()];
  const finalRows = [...trimmed, ...leftover, ...manualRows];

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = { A: 0, B: 0, C: 0 };
  let withSite = 0, withPhone = 0;
  for (const r of trimmed) {
    counts[r.Tier] = (counts[r.Tier] || 0) + 1;
    if (r.Website) withSite++;
    if (r.Phone) withPhone++;
  }
  console.log(`\n──────────────────────────────────────────────`);
  console.log(`API calls: ${apiCalls} · unique businesses found: ${byId.size}`);
  console.log(`Written:   ${trimmed.length}  (Tier A ${counts.A} · B ${counts.B} · C ${counts.C})`);
  console.log(`Have website: ${withSite}/${trimmed.length} · have phone: ${withPhone}/${trimmed.length}`);
  if (leftover.length || manualRows.length)
    console.log(`Preserved:  ${leftover.length + manualRows.length} previously-tracked rows`);
  console.log(`──────────────────────────────────────────────`);

  if (args.dry) {
    console.log("\n--dry: nothing written.\n");
    return;
  }

  csv.writeFile(CSV_PATH, COLUMNS, finalRows);
  console.log(`\n✓ Wrote ${finalRows.length} rows → ${path.relative(process.cwd(), CSV_PATH)}`);
  console.log(`  Next: GOOGLE_MAPS_API_KEY=… node outreach/scripts/enrich-emails.js  (find public emails)\n`);
}

main().catch((err) => {
  console.error("\nFatal:", err.message, "\n");
  process.exit(1);
});
