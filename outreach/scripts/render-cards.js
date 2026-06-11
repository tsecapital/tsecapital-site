#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// render-cards.js — turn PHONE-ONLY leads into printable call / walk-in cards.
//
// Targets leads with a phone but NO public email (the email pipeline can't reach
// them), not yet actioned, Tier A first. Writes one print-ready HTML worklist of
// cards — each with a spoken opener + voicemail keyed to the lead's vertical,
// reusing lib/compose.js so the phone wording matches the emails.
//
// Read-only: never edits contacts.csv. As you work a lead, update the CSV
// yourself (Channel=call/walk-in, Status, and add the Email if you capture one —
// it then joins the normal email queue).
//
// Usage:
//   node outreach/scripts/render-cards.js                 # all phone-only leads
//   node outreach/scripts/render-cards.js --tier A         # just Tier A
//   node outreach/scripts/render-cards.js --limit 40       # first 40 (Tier A first)
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const csv = require("./lib/csv");
const { composeCall, ACTIONED } = require("./lib/compose");

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");
const OUT_DIR = path.join(__dirname, "..", "cards");
const OUT_FILE = path.join(OUT_DIR, "call-cards.html");

const TIER_ORDER = { A: 0, B: 1, C: 2 };

function parseArgs(argv) {
  const out = { limit: Infinity, tier: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--limit") out.limit = parseInt(argv[++i], 10) || out.limit;
    else if (argv[i] === "--tier") out.tier = (argv[++i] || "").toUpperCase();
  }
  return out;
}

const esc = (s) =>
  String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function cardHtml(row, n) {
  const c = composeCall(row);
  const tier = (row.Tier || "—").trim();
  const phone = (row.Phone || "").trim() || "—";
  const website = (row.Website || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const address = (row.Address || "").trim();
  const proof = c.proof || (row.Rating ? `${String(row.Rating).trim()}★` : "");

  return `
    <article class="card">
      <header class="ch">
        <span class="rank">Call #${n}</span>
        <span class="tier t${esc(tier)}">Tier ${esc(tier)}</span>
        <span class="type">${esc(c.type)}</span>
        ${proof ? `<span class="proof">${esc(proof)}</span>` : ""}
      </header>
      <h2>${esc(c.biz)}</h2>
      <div class="meta">
        <span class="ph">☎ <b>${esc(phone)}</b></span>
        ${website ? `<span>${esc(website)}</span>` : ""}
      </div>
      ${address ? `<div class="addr">${esc(address)}</div>` : ""}
      <div class="block">
        <span class="lbl">Opener</span>
        <p>${esc(c.opener)}</p>
      </div>
      <div class="block vm">
        <span class="lbl">No answer → voicemail · ~20s</span>
        <p>${esc(c.voicemail)}</p>
      </div>
      <div class="door">Walk-in &amp; they're out → leave the postcard, get a <b>name + email</b>, then log it in contacts.csv (Channel=walk-in).</div>
    </article>`;
}

function pageHtml(cards, count, byTier) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Call cards — ${count} phone-only leads</title>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,600;1,9..144,400&family=Hanken+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>
  :root{
    --paper:#f4eee2; --cream:#f9f4ec; --ink:#221d16; --ink2:#5c5446;
    --clay:#bd5a36; --clay-deep:#9c4527; --brass:#b58e54; --rule:#d8cbb2;
    --display:"Fraunces",Georgia,serif; --sans:"Hanken Grotesk",ui-sans-serif,system-ui,sans-serif;
  }
  *{box-sizing:border-box;}
  html,body{margin:0;}
  body{background:#e7ddc9;color:var(--ink);font-family:var(--sans);font-size:12px;
    -webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .bar{position:sticky;top:0;background:#221d16;color:#f4eee2;padding:11px 18px;
    display:flex;align-items:center;gap:14px;font-size:13px;}
  .bar b{font-family:var(--display);font-weight:600;}
  .bar .sp{flex:1;}
  .bar button{background:var(--clay);color:#fff;border:0;border-radius:7px;
    padding:7px 14px;font-weight:600;font-size:12px;cursor:pointer;font-family:var(--sans);}
  .hint{padding:10px 18px 0;color:var(--ink2);font-size:11.5px;max-width:60em;}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:.26in;padding:18px;}
  .card{background:#fff;border:1px solid var(--rule);border-radius:11px;padding:13px 15px;
    break-inside:avoid;page-break-inside:avoid;}
  .ch{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:10.5px;margin-bottom:7px;}
  .rank{font-weight:700;color:var(--ink);}
  .tier{font-weight:700;letter-spacing:.04em;padding:2px 7px;border-radius:999px;color:#fff;background:var(--ink2);}
  .tier.tA{background:var(--clay);} .tier.tB{background:var(--brass);} .tier.tC{background:#8c8270;}
  .type{color:var(--clay-deep);font-weight:700;text-transform:uppercase;letter-spacing:.06em;}
  .proof{color:var(--ink2);margin-left:auto;}
  h2{font-family:var(--display);font-weight:600;font-size:17px;line-height:1.1;margin:0 0 5px;color:var(--ink);}
  .meta{display:flex;gap:12px;flex-wrap:wrap;font-size:12px;color:var(--ink2);}
  .meta .ph b{color:var(--ink);font-size:13px;}
  .addr{font-size:11px;color:var(--ink2);margin-top:2px;}
  .block{margin-top:9px;}
  .lbl{display:block;font-size:9px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;
    color:var(--clay-deep);margin-bottom:3px;}
  .block p{margin:0;font-size:11.5px;line-height:1.4;color:var(--ink);}
  .vm{background:var(--cream);border:1px solid var(--rule);border-radius:8px;padding:8px 10px;}
  .vm .lbl{color:var(--ink2);}
  .door{margin-top:9px;border-top:1px dashed var(--rule);padding-top:7px;
    font-size:10px;line-height:1.35;color:var(--ink2);}
  .door b{color:var(--ink);}
  @media print{
    body{background:#fff;}
    .bar,.hint{display:none;}
    .grid{padding:0;gap:.22in;}
    @page{size:letter;margin:.45in;}
  }
</style>
</head>
<body>
  <div class="bar">
    <b>Call cards</b>
    <span>${count} phone-only leads · Tier A ${byTier.A || 0} · B ${byTier.B || 0} · C ${byTier.C || 0}</span>
    <span class="sp"></span>
    <button onclick="window.print()">Print →</button>
  </div>
  <div class="hint">Phone-only leads (no public email). Work them top-down — Tier A first. As you go, update
    <b>contacts.csv</b>: Channel = call / walk-in, Status, and add the Email if you capture one (it then joins the email queue).</div>
  <div class="grid">
${cards}
  </div>
</body>
</html>
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const { rows } = csv.readFile(CSV_PATH);
  if (!rows.length) {
    console.error("\nNo rows in contacts.csv. Run fetch-places.js first.\n");
    process.exit(1);
  }

  let queue = rows.filter(
    (r) =>
      !(r.Email || "").trim() &&
      (r.Phone || "").trim() &&
      !ACTIONED.has((r.Status || "").trim().toLowerCase()) &&
      (!args.tier || (r.Tier || "").trim() === args.tier)
  );
  queue.sort(
    (a, b) =>
      (TIER_ORDER[(a.Tier || "").trim()] ?? 9) - (TIER_ORDER[(b.Tier || "").trim()] ?? 9) ||
      (Number(b.Score) || 0) - (Number(a.Score) || 0)
  );
  if (Number.isFinite(args.limit)) queue = queue.slice(0, args.limit);

  if (!queue.length) {
    console.log("\nNo phone-only leads to card (every phone-only lead is filtered out or already actioned).\n");
    return;
  }

  const cards = queue.map((row, i) => cardHtml(row, i + 1)).join("\n");
  const byTier = queue.reduce((a, r) => ((a[(r.Tier || "").trim()] = (a[(r.Tier || "").trim()] || 0) + 1), a), {});

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_FILE, pageHtml(cards, queue.length, byTier));

  console.log(`\n✓ ${queue.length} call cards → ${path.relative(process.cwd(), OUT_FILE)}  (Tier A ${byTier.A || 0} · B ${byTier.B || 0} · C ${byTier.C || 0})`);
  console.log(`Open it in a browser and File → Print (or Save as PDF). These have no public email — phone / walk-in only.`);
  console.log(`As you work each lead, update contacts.csv: Channel, Status, and the Email if you get one.\n`);
}

main();
