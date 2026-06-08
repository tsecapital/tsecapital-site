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
const { CENTER, RADIUS_MILES, RADIUS_METERS, TARGET_COUNT, PER_VERTICAL_CAP, VERTICALS } = require("./config");
const { searchAllPages } = require("./lib/places");
const { haversineMiles } = require("./lib/geo");
const { computeScore, assignTiers, byTierThenScore } = require("./lib/score");
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
  }

  // Score every candidate.
  const scored = [...byId.values()].map((b) => ({ ...b, score: computeScore(b) }));

  // Balance across verticals with a round-robin by score rank: take each
  // vertical's best, then everyone's 2nd-best, and so on until we hit the
  // target. Every requested vertical gets fair representation (up to what's
  // available, bounded by PER_VERTICAL_CAP) instead of the densest few crowding
  // the rest out. Tiering later still surfaces the best prospects first.
  const byType = new Map();
  for (const b of scored) {
    if (!byType.has(b.type)) byType.set(b.type, []);
    byType.get(b.type).push(b);
  }
  const lists = [...byType.values()];
  for (const list of lists) list.sort((a, b) => b.score - a.score);

  const selected = [];
  for (let rank = 0; selected.length < args.limit; rank++) {
    let added = 0;
    for (const list of lists) {
      if (rank < Math.min(list.length, PER_VERTICAL_CAP)) {
        selected.push(list[rank]);
        added++;
        if (selected.length >= args.limit) break;
      }
    }
    if (added === 0) break; // every vertical exhausted or capped
  }

  const newRows = selected.map((b) => ({
    Business: b.name,
    Contact: "",
    Type: b.type,
    Email: "",
    Phone: b.phone,
    "Date contacted": "",
    Channel: "",
    Status: "",
    Notes: "",
    Tier: "",
    Score: b.score,
    Website: b.website,
    Address: b.address,
    Rating: b.rating,
    Reviews: b.reviews,
    PlaceID: b.id,
  }));
  assignTiers(newRows); // A = best ~20%, B = next ~40%, C = rest
  newRows.sort(byTierThenScore);
  const trimmed = newRows;

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
  // Previously-saved businesses not in this pull: keep ONLY the ones you've
  // started working (have tracking). Untracked rows from a past fetch are just
  // stale output — let this run replace them cleanly.
  const isTracked = (r) =>
    (r.Status || "").trim() ||
    (r.Contact || "").trim() ||
    (r.Notes || "").trim() ||
    ((r.Email || "").trim() && !(r.Email || "").includes("example.com"));
  const leftover = [...prevById.values()].filter(isTracked);
  const finalRows = [...trimmed, ...leftover, ...manualRows];

  // ── Summary ────────────────────────────────────────────────────────────────
  const counts = { A: 0, B: 0, C: 0 };
  const byTypeCount = {};
  let withSite = 0, withPhone = 0;
  for (const r of trimmed) {
    counts[r.Tier] = (counts[r.Tier] || 0) + 1;
    byTypeCount[r.Type] = (byTypeCount[r.Type] || 0) + 1;
    if (r.Website) withSite++;
    if (r.Phone) withPhone++;
  }
  console.log(`\n──────────────────────────────────────────────`);
  console.log(`API calls: ${apiCalls} · unique businesses found: ${byId.size}`);
  console.log(`Written:   ${trimmed.length}  (Tier A ${counts.A} · B ${counts.B} · C ${counts.C})`);
  console.log(`Have website: ${withSite}/${trimmed.length} · have phone: ${withPhone}/${trimmed.length}`);
  console.log(`By vertical:`);
  for (const [type, n] of Object.entries(byTypeCount).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${String(n).padStart(3)}  ${type}`);
  }
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
