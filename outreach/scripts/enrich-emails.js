#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// enrich-emails.js — fill in public email addresses.
//
// For every row in contacts.csv that has a Website but no Email, this fetches
// the homepage and a few common contact pages, extracts the best public email
// it can find, and writes it back into the Email column.
//
// Reality check: only ~30–50% of small local businesses publish an email. Many
// use a contact form instead. Rows left without an email are still in your list
// with a phone + website — just not reachable by the email templates.
//
// Zero dependencies. Polite: short timeouts, small concurrency, skips on error.
//
// Usage:
//   node outreach/scripts/enrich-emails.js
//   node outreach/scripts/enrich-emails.js --tier A      # only Tier A rows
//   node outreach/scripts/enrich-emails.js --limit 100   # first 100 missing
// ─────────────────────────────────────────────────────────────────────────────

const path = require("path");
const csv = require("./lib/csv");

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");
const CONCURRENCY = 6;
const TIMEOUT_MS = 9000;
const CONTACT_PATHS = ["", "/contact", "/contact-us", "/about", "/about-us"];

const EMAIL_RE = /[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}/g;
// A candidate must match this exactly — rejects template junk like `${email}`,
// trailing punctuation, and other garbage that the loose scan can pick up.
const VALID_EMAIL = /^[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$/;

// Substrings that mean "not a real human contact address" — file assets, CDNs,
// and (importantly) third-party analytics/marketing/vendor emails that live in
// page scripts, not the business itself.
const BLOCKLIST = [
  "example.com", "yourdomain", "domain.com", "email.com", "sentry", "wixpress",
  "godaddy", "squarespace", "cloudflare", "schema.org", "w3.org", "googleapis",
  "gstatic", "jquery", "bootstrap", "fontawesome", "@2x", "@3x", "core-js",
  ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js",
  // vendor / analytics / platform addresses (not the business's own inbox)
  "keen.io", "segment", "mixpanel", "hotjar", "intercom", "fullstory", "amplitude",
  "optimizely", "newrelic", "datadog", "bugsnag", "doubleclick", "cloudfront",
  "akamai", "shopify", "myshopify", "wordpress.com", "wp.com", "elementor",
  "gravatar", "stripe", "paypalobjects", "facebook", "fbcdn", "linkedin",
  "instagram", "youtube", "vimeo", "twitter", "cdn.", "sentry.io", "wix.com",
  "calendly", "hubspot", "mailchimp", "constantcontact", "godaddysites",
];

function parseArgs(argv) {
  const out = { tier: null, limit: Infinity };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--tier") out.tier = (argv[++i] || "").toUpperCase();
    else if (argv[i] === "--limit") out.limit = parseInt(argv[++i], 10) || Infinity;
  }
  return out;
}

function hostOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

async function fetchText(url) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; outreach-research/1.0)" },
    });
    if (!res.ok) return "";
    const ct = res.headers.get("content-type") || "";
    if (!ct.includes("text/html") && !ct.includes("text/plain")) return "";
    return await res.text();
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

function pickEmail(candidates, siteHost) {
  const cleaned = [...new Set(candidates.map((e) => e.toLowerCase()))].filter((e) => {
    if (!VALID_EMAIL.test(e)) return false; // strict shape — kills `${email}` etc.
    if (BLOCKLIST.some((b) => e.includes(b))) return false;
    if (e.length > 60) return false;
    return true;
  });
  if (cleaned.length === 0) return "";

  const score = (e) => {
    let s = 0;
    const domain = e.split("@")[1] || "";
    if (siteHost && domain.includes(siteHost)) s += 5; // same-domain = real
    if (/^(info|hello|contact|office|admin|reception|frontdesk|appointments)@/.test(e)) s += 2;
    if (/^(noreply|no-reply|donotreply|mailer|postmaster|webmaster)@/.test(e)) s -= 4;
    if (/gmail|yahoo|hotmail|outlook|aol/.test(domain)) s -= 1; // ok, but weaker
    return s;
  };
  cleaned.sort((a, b) => score(b) - score(a));
  return cleaned[0];
}

// Drop <script>/<style>/comments so we never scrape vendor or template emails
// embedded in page JavaScript.
function visibleHtml(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ");
}

async function findEmail(website) {
  const host = hostOf(website);
  const base = website.replace(/\/+$/, "");
  const found = [];
  for (const p of CONTACT_PATHS) {
    const html = await fetchText(base + p);
    if (!html) continue;
    const visible = visibleHtml(html);
    // mailto: links are the most reliable signal — but take them from the
    // visible markup, strip any ?subject=… query, and let pickEmail validate.
    const mailtos = [...visible.matchAll(/mailto:([^"'>?\s]+)/gi)].map((m) => {
      const raw = m[1].split("?")[0];
      try {
        return decodeURIComponent(raw); // %20 etc.
      } catch {
        return raw; // malformed % escapes — keep raw, validator will judge it
      }
    });
    found.push(...mailtos);
    found.push(...(visible.match(EMAIL_RE) || []));
    const best = pickEmail(found, host);
    if (best) return best; // stop at the first page that yields a good email
  }
  return pickEmail(found, host);
}

// Simple promise pool.
async function pool(items, worker, size) {
  const results = new Array(items.length);
  let next = 0;
  async function run() {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i], i);
    }
  }
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, run));
  return results;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const { headers, rows } = csv.readFile(CSV_PATH);
  if (rows.length === 0) {
    console.error(`\nNo rows in ${CSV_PATH}. Run fetch-places.js first.\n`);
    process.exit(1);
  }
  if (!headers.includes("Email")) {
    console.error("\ncontacts.csv has no Email column.\n");
    process.exit(1);
  }

  const targets = rows.filter(
    (r) =>
      (r.Website || "").trim() &&
      !(r.Email || "").trim() &&
      (!args.tier || r.Tier === args.tier)
  );
  const slice = targets.slice(0, args.limit);

  console.log(`\nLooking for emails on ${slice.length} sites${args.tier ? ` (Tier ${args.tier})` : ""}...\n`);

  let done = 0;
  let filled = 0;
  await pool(
    slice,
    async (row) => {
      let email = "";
      try {
        email = await findEmail(row.Website);
      } catch {
        email = ""; // one bad site never aborts the batch
      }
      done++;
      if (email) {
        row.Email = email;
        filled++;
        console.log(`  ✓ ${row.Business.slice(0, 40).padEnd(40)} ${email}`);
      }
      if (done % 25 === 0) console.log(`  …${done}/${slice.length} checked, ${filled} found`);
      return email;
    },
    CONCURRENCY
  );

  csv.writeFile(CSV_PATH, headers, rows);
  console.log(`\n✓ Found ${filled} emails across ${slice.length} sites.`);
  console.log(`  Saved → ${path.relative(process.cwd(), CSV_PATH)}\n`);
}

main().catch((err) => {
  console.error("\nFatal:", err.message, "\n");
  process.exit(1);
});
