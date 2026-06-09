#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// verify-emails.js — drop emails whose domain can't receive mail.
//
// Enrichment validates an address's SHAPE, not whether its domain actually
// exists. Scraped sites have typos and lapsed domains, which bounce — and
// bounces wreck sender reputation. This does a DNS lookup on each email's domain
// (MX, then A/AAAA as a fallback) and clears any address whose domain doesn't
// resolve, stashing the removed address in Notes so you can fix it by hand.
//
// It does NOT verify the mailbox itself (does `support@` exist) — that needs an
// SMTP probe or a service like NeverBounce. But killing dead DOMAINS removes the
// hard-bounce class you just hit.
//
// Usage:
//   node outreach/scripts/verify-emails.js
//   node outreach/scripts/verify-emails.js --dry      # report only, don't edit
// ─────────────────────────────────────────────────────────────────────────────

const path = require("path");
const dns = require("dns").promises;
const csv = require("./lib/csv");

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");

const domainOf = (email) => (email.split("@")[1] || "").trim().toLowerCase();

async function domainDeliverable(domain) {
  try {
    const mx = await dns.resolveMx(domain);
    if (mx && mx.length && mx.some((r) => r.exchange)) return true;
  } catch {}
  // No MX? Some domains still accept mail on their A/AAAA record.
  try {
    const a = await dns.resolve4(domain);
    if (a && a.length) return true;
  } catch {}
  try {
    const a6 = await dns.resolve6(domain);
    if (a6 && a6.length) return true;
  } catch {}
  return false;
}

async function pool(items, worker, size) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
  return results;
}

async function main() {
  const dry = process.argv.includes("--dry");
  const { headers, rows } = csv.readFile(CSV_PATH);

  const withEmail = rows.filter((r) => (r.Email || "").trim());
  const domains = [...new Set(withEmail.map((r) => domainOf(r.Email)).filter(Boolean))];
  console.log(`\nChecking ${domains.length} unique domains across ${withEmail.length} emails...\n`);

  const verdict = new Map();
  await pool(domains, async (d) => verdict.set(d, await domainDeliverable(d)), 12);

  const dead = domains.filter((d) => !verdict.get(d));
  let cleared = 0;
  const clearedList = [];
  for (const r of rows) {
    const email = (r.Email || "").trim();
    if (!email) continue;
    if (verdict.get(domainOf(email)) === false) {
      clearedList.push(`${r.Business}  <${email}>  [Tier ${r.Tier}, ${r.Status || "not queued"}]`);
      if (!dry) {
        r.Notes = ((r.Notes || "").trim() ? r.Notes + " · " : "") + `bad email removed (domain unresolvable): ${email}`;
        r.Email = "";
      }
      cleared++;
    }
  }

  console.log(`Dead domains: ${dead.length}${dead.length ? "  → " + dead.join(", ") : ""}`);
  console.log(`Emails ${dry ? "that WOULD be" : ""} cleared: ${cleared}\n`);
  clearedList.forEach((l) => console.log("  ✗ " + l));

  if (dry) {
    console.log("\n--dry: nothing changed.\n");
    return;
  }
  if (cleared > 0) {
    csv.writeFile(CSV_PATH, headers, rows);
    console.log(`\n✓ Cleared ${cleared} undeliverable emails (kept in Notes). Saved.\n`);
  } else {
    console.log("✓ All email domains resolve. Nothing to clear.\n");
  }
}

main().catch((e) => {
  console.error("\nFatal:", e.message, "\n");
  process.exit(1);
});
