#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// render-emails.js — turn leads into ready-to-send drafts (for hand-sending).
//
// Drafts every emailable lead not yet actually contacted (Status blank/"queued"),
// Tier A first, up to --limit. One file per email named by global rank; the
// drafts/ folder is cleared each run, so it always reflects your to-send queue.
// Marks each "queued". Composition lives in lib/compose.js (shared with the
// automated sender). Ends each with "— Chauncey" (Gmail signature appends rest).
//
// Usage:
//   node outreach/scripts/render-emails.js --limit 100
//   node outreach/scripts/render-emails.js --tier A --date 2026-06-08
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const csv = require("./lib/csv");
const { composeEmail, slug, ACTIONED } = require("./lib/compose");

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");
const DRAFTS_DIR = path.join(__dirname, "..", "drafts");

function parseArgs(argv) {
  const out = { limit: 30, tier: null, date: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") out.limit = parseInt(argv[++i], 10) || out.limit;
    else if (argv[i] === "--tier") out.tier = (argv[++i] || "").toUpperCase();
    else if (argv[i] === "--date") out.date = argv[++i];
  }
  return out;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { headers, rows } = csv.readFile(CSV_PATH);
  if (rows.length === 0) {
    console.error("\nNo rows in contacts.csv. Run fetch-places.js first.\n");
    process.exit(1);
  }

  // Stable global rank among all emailable leads, so draft filenames never
  // collide between runs / batches.
  let rank = 0;
  const rankOf = new Map();
  for (const r of rows) if ((r.Email || "").trim()) rankOf.set(r, ++rank);

  const queue = rows.filter(
    (r) =>
      (r.Email || "").trim() &&
      !ACTIONED.has((r.Status || "").trim().toLowerCase()) &&
      (!args.tier || r.Tier === args.tier)
  ).slice(0, args.limit);

  if (queue.length === 0) {
    console.log("\nNothing left to draft (every emailable lead is already contacted).\n");
    return;
  }

  // Fresh drafts folder = your current to-send queue.
  if (fs.existsSync(DRAFTS_DIR)) {
    for (const f of fs.readdirSync(DRAFTS_DIR)) if (f.endsWith(".txt")) fs.unlinkSync(path.join(DRAFTS_DIR, f));
  }
  fs.mkdirSync(DRAFTS_DIR, { recursive: true });

  const index = [];
  const stamp = args.date ? ` ${args.date}` : "";
  queue.forEach((row) => {
    const { subject, body, to } = composeEmail(row);
    const n = String(rankOf.get(row)).padStart(3, "0");
    fs.writeFileSync(path.join(DRAFTS_DIR, `${n}-${slug(row.Business)}.txt`), `To: ${to}\nSubject: ${subject}\n\n${body}\n`);
    index.push(`${n}. ${row.Business}  <${to}>  [Tier ${row.Tier}]`);

    row.Status = "queued";
    if (!/draft generated/.test(row.Notes || "")) {
      row.Notes = ((row.Notes || "").trim() ? row.Notes + " · " : "") + `draft generated${stamp} — send, then set Status=contacted`;
    }
  });

  fs.writeFileSync(path.join(DRAFTS_DIR, "_index.txt"), index.join("\n") + "\n");
  csv.writeFile(CSV_PATH, headers, rows);

  const byTier = queue.reduce((a, r) => ((a[r.Tier] = (a[r.Tier] || 0) + 1), a), {});
  console.log(`\n✓ Rendered ${queue.length} drafts → ${path.relative(process.cwd(), DRAFTS_DIR)}/  (Tier A ${byTier.A || 0} · B ${byTier.B || 0} · C ${byTier.C || 0})`);
  console.log(`✓ Marked them Status=queued in contacts.csv.`);
  console.log(`\nEach ends with "— Chauncey" — your Gmail signature fills in the rest.`);
  console.log(`Add a first name where you can, then send ~20–30/day. Reply in → set Status=contacted.\n`);
}

main();
