#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// find-names.js — fill the Contact column with a confident owner first name.
//
// Two sources, precision over recall (a WRONG name is worse than "Hi there"):
//   1. The business name itself, when it carries a personal credential
//      ("Dr. Steven Varkony", "Shamsah Amersi, MD").
//   2. A scrape of the site's About/Team pages for "Dr. First Last" / "First
//      Last, DDS" — accepted ONLY when the surname matches the business name or
//      domain (clearly the owner), or it's the single provider on the site.
//
// Writes the first name to Contact; render-emails.js then greets them by name.
//
// Usage:
//   node outreach/scripts/find-names.js                 # queued + contacted leads
//   node outreach/scripts/find-names.js --all           # every emailable lead
//   node outreach/scripts/find-names.js --limit 50
// ─────────────────────────────────────────────────────────────────────────────

const path = require("path");
const csv = require("./lib/csv");

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");
const CONCURRENCY = 6;
const TIMEOUT_MS = 9000;
const PAGES = ["", "/about", "/about-us", "/team", "/our-team", "/meet-the-team", "/meet-the-doctor", "/staff", "/doctors", "/attorneys", "/providers"];

const CRED = "DDS|DMD|D\\.D\\.S\\.|MD|M\\.D\\.|DO|OD|DC|DVM|VMD|DPM|Esq\\.?|JD|CPA|FACS|FAAD|FACOG";
const NAME_RES = [
  new RegExp(`\\bDr\\.?\\s+([A-Z][a-z]+)\\s+(?:[A-Z]\\.?\\s+)?([A-Z][a-z]+)\\b`, "g"),
  new RegExp(`\\b([A-Z][a-z]+)\\s+(?:[A-Z]\\.?\\s+)?([A-Z][a-z]+),?\\s+(?:${CRED})\\b`, "g"),
];

const STOP = new Set(["the","our","new","your","best","top","read","more","contact","patient","patients","office","hours","dental","dentist","medical","family","cosmetic","general","emergency","care","health","wellness","smile","smiles","center","centre","clinic","group","studio","spa","beverly","hills","santa","monica","los","angeles","west","hollywood","sherman","oaks","culver","city","marina","pacific","palisades","brentwood","encino","tarzana","calabasas","insurance","law","offices","associates","surgery","surgical","implant","implants","veneers","invisalign","botox","monday","tuesday","wednesday","thursday","friday","saturday","sunday","january","february","march","april","may","june","july","august","september","october","november","december","google","yelp","reviews","review","home","about","team","meet","doctor","doctors","welcome","schedule","appointment","appointments","book","call","today","services","service","gallery","forms","blog","news","privacy","terms","copyright","rights","reserved"]);

// Credential-gated name straight from the business name (no scrape needed).
function nameFromBusiness(biz) {
  const head = biz.split(/[|,]/)[0];
  const hasDr = /^\s*(dr|drs)\.?\s+/i.test(biz);
  const hasCred = new RegExp(`,\\s*(?:${CRED})\\b`, "i").test(biz);
  if (!hasDr && !hasCred) return null;
  if (/&|\band\b/i.test(head)) return null;
  const toks = head.replace(/^(dr|drs)\.?\s+/i, "").replace(/\./g, "").trim().split(/\s+/).filter(Boolean);
  if (toks.length < 2 || toks.length > 3) return null;
  if (!/^[A-Z][a-z]+$/.test(toks[0]) || !/^[A-Z][a-z]+$/.test(toks[toks.length - 1])) return null;
  if (STOP.has(toks[0].toLowerCase())) return null;
  return toks[0];
}

const hostCore = (url) => {
  try { return new URL(url).hostname.replace(/^www\./, "").split(".").slice(0, -1).join("").toLowerCase(); }
  catch { return ""; }
};
const bizWords = (biz) => new Set(biz.toLowerCase().replace(/[^a-z\s]/g, " ").split(/\s+/).filter(Boolean));

function visible(html) {
  return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ");
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: "follow", headers: { "User-Agent": "Mozilla/5.0 (compatible; outreach-research/1.0)" } });
    if (!res.ok) return "";
    if (!(res.headers.get("content-type") || "").includes("text/html")) return "";
    return await res.text();
  } catch { return ""; } finally { clearTimeout(timer); }
}

function candidates(text) {
  const found = [];
  for (const re of NAME_RES) {
    for (const m of text.matchAll(re)) {
      const first = m[1], last = m[2];
      if (STOP.has(first.toLowerCase()) || STOP.has(last.toLowerCase())) continue;
      found.push({ first, last });
    }
  }
  return found;
}

async function nameFromSite(website, biz) {
  const core = hostCore(website);
  const words = bizWords(biz);
  const base = website.replace(/\/+$/, "");
  const all = [];
  for (const p of PAGES) {
    const html = await fetchText(base + p);
    if (!html) continue;
    const cands = candidates(visible(html));
    // Strongest: surname matches the domain or a business-name word → the owner.
    for (const c of cands) {
      const last = c.last.toLowerCase();
      if (core.includes(last) || words.has(last)) return c.first;
    }
    all.push(...cands);
    if (all.length > 40) break; // enough signal
  }
  // Fallback: exactly one distinct person across the site → solo practice owner.
  const distinct = [...new Map(all.map((c) => [`${c.first} ${c.last}`.toLowerCase(), c])).values()];
  if (distinct.length === 1) return distinct[0].first;
  return null;
}

async function pool(items, worker, size) {
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, async function run() {
    while (next < items.length) { const i = next++; await worker(items[i], i); }
  }));
}

async function main() {
  const all = process.argv.includes("--all");
  const limArg = process.argv.indexOf("--limit");
  const limit = limArg > -1 ? parseInt(process.argv[limArg + 1], 10) : Infinity;

  const { headers, rows } = csv.readFile(CSV_PATH);
  if (!headers.includes("Contact")) { console.error("No Contact column."); process.exit(1); }

  const inPlay = (r) => all || ["queued", "contacted"].includes((r.Status || "").toLowerCase());
  const targets = rows.filter((r) => !(r.Contact || "").trim() && inPlay(r));

  // Pass 1: free names from the business name.
  let fromName = 0;
  for (const r of targets) {
    const n = nameFromBusiness(r.Business);
    if (n) { r.Contact = n; fromName++; }
  }

  // Pass 2: scrape sites for the rest that have a website.
  const toScrape = targets.filter((r) => !(r.Contact || "").trim() && (r.Website || "").trim()).slice(0, limit);
  console.log(`\nNames from business name: ${fromName}. Scraping ${toScrape.length} sites for the rest...\n`);

  let fromSite = 0, done = 0;
  await pool(toScrape, async (r) => {
    let n = "";
    try { n = await nameFromSite(r.Website, r.Business); } catch {}
    done++;
    if (n) { r.Contact = n; fromSite++; console.log(`  ✓ ${r.Business.slice(0, 38).padEnd(39)} → ${n}`); }
    if (done % 25 === 0) console.log(`  …${done}/${toScrape.length} checked, ${fromSite} found`);
  }, CONCURRENCY);

  csv.writeFile(CSV_PATH, headers, rows);
  const named = rows.filter((r) => (r.Contact || "").trim()).length;
  console.log(`\n✓ Names found this run: ${fromName + fromSite}  (${fromName} from name, ${fromSite} from site)`);
  console.log(`✓ Contact column now filled for ${named} leads total. Re-run render-emails to use them.\n`);
}

main().catch((e) => { console.error("Fatal:", e.message); process.exit(1); });
