#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// send-emails.js — automated sender for the outreach queue (Gmail SMTP).
//
// Sends to emailable leads not yet contacted (Status blank/"queued"), throttled
// like a human, marking each "contacted" as it goes (saved after every send, so
// a crash never double-sends). Composition is shared with the drafter
// (lib/compose.js); the signature is appended from outreach/signature.html.
//
//   ⚠ Send cold mail from a DEDICATED mailbox on a separate domain, NOT your
//   product's email. Personal Gmail is fine for low volume (≤~30/day).
//
// Setup (one time):
//   1. Gmail → Account → Security → turn on 2-Step Verification.
//   2. https://myaccount.google.com/apppasswords → create an app password.
//   3. export GMAIL_USER="chauncey@tsecapital.co"
//      export GMAIL_APP_PASSWORD="the 16-char app password"
//      export GMAIL_MAILING_ADDRESS="123 Main St, Los Angeles, CA 90025"   # CAN-SPAM
//
// Usage:
//   node outreach/scripts/send-emails.js --test chauncey@tsecapital.co   # one test (lead #1)
//   node outreach/scripts/send-emails.js --test you@x.com --rank 30      # test using lead #30's content
//   node outreach/scripts/send-emails.js --dry --limit 5                 # preview, no send
//   node outreach/scripts/send-emails.js --limit 25 --delay 60           # send 25, ~60s apart
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const csv = require("./lib/csv");
const { composeEmail, ACTIONED } = require("./lib/compose");

let nodemailer;
try { nodemailer = require("nodemailer"); }
catch { console.error("\nMissing dependency. Run:  npm install --save-dev nodemailer\n"); process.exit(1); }

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");
const SIG_PATH = path.join(__dirname, "..", "signature.html");

// Load creds from a gitignored .env (outreach/.env or project root) so they live
// in a file both you and an agent can use — env vars set in another shell don't
// reach this process. Real environment vars still win over the file.
(function loadEnv() {
  for (const p of [path.join(__dirname, "..", ".env"), path.join(__dirname, "..", "..", ".env")]) {
    try {
      for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
        if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
      }
    } catch {}
  }
})();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const DEFAULT_SIG_HTML =
  `<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#555;">` +
  `<b style="color:#1a1a1a;">Chauncey Tse</b><br>` +
  `AI Automation for Local Business · West Los Angeles<br>` +
  `<a href="mailto:chauncey@tsecapital.co" style="color:#555;">chauncey@tsecapital.co</a> · ` +
  `<a href="https://tsecapital.co" style="color:#555;">tsecapital.co</a><br>` +
  `<a href="https://cal.com/chaunceytse/intro" style="color:#bd5a36;font-weight:bold;">Book a 15-minute call →</a><br>` +
  `<span style="font-size:11px;color:#999;">Previously at Google · American Express · KPMG</span></div>`;
const DEFAULT_SIG_TEXT =
  `Chauncey Tse\nAI Automation for Local Business · West Los Angeles\n` +
  `chauncey@tsecapital.co · tsecapital.co\nBook a call: cal.com/chaunceytse/intro\n` +
  `Previously at Google, American Express & KPMG`;

// Pull the signature table out of signature.html if present; else use the default.
function loadSignature() {
  try {
    const f = fs.readFileSync(SIG_PATH, "utf8");
    const m = f.match(/SIGNATURE START[\s\S]*?-->([\s\S]*?)<!--[\s\S]*?SIGNATURE END/);
    if (m && m[1].trim()) return { html: m[1].trim(), text: DEFAULT_SIG_TEXT };
  } catch {}
  return { html: DEFAULT_SIG_HTML, text: DEFAULT_SIG_TEXT };
}

function parseArgs(argv) {
  const out = { test: null, limit: 25, delay: 60, dry: false, date: null, rank: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--test") out.test = argv[++i];
    else if (a === "--rank") out.rank = parseInt(argv[++i], 10) || out.rank;
    else if (a === "--limit") out.limit = parseInt(argv[++i], 10) || out.limit;
    else if (a === "--delay") out.delay = parseInt(argv[++i], 10) || out.delay;
    else if (a === "--dry") out.dry = true;
    else if (a === "--date") out.date = argv[++i];
  }
  return out;
}

function buildMessage(row, sig, address) {
  const { subject, body } = composeEmail(row);
  const footerHtml = address ? `<br><br><span style="font-size:11px;color:#999;">${esc(address)} · Prefer not to hear from me? Just reply and say so.</span>` : "";
  const footerText = address ? `\n\n${address} · Prefer not to hear from me? Just reply and say so.` : "";
  const htmlBody = body.split("\n").map(esc).join("<br>");
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.5;color:#1a1a1a;">${htmlBody}<br><br>${sig.html}${footerHtml}</div>`;
  const text = `${body}\n\n${sig.text}${footerText}`;
  return { subject, html, text };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const replyTo = process.env.GMAIL_REPLY_TO || user;
  const fromName = process.env.GMAIL_FROM_NAME || "Chauncey Tse";
  const address = process.env.GMAIL_MAILING_ADDRESS || "";
  const sig = loadSignature();

  if (!args.dry && (!user || !pass)) {
    console.error("\nMissing GMAIL_USER / GMAIL_APP_PASSWORD env vars. See setup at top of this file.\n");
    process.exit(1);
  }

  const { headers, rows } = csv.readFile(CSV_PATH);
  const transporter = args.dry ? null : nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  if (transporter) {
    try { await transporter.verify(); console.log(`✓ Authenticated as ${user}\n`); }
    catch (e) { console.error(`\nGmail auth failed: ${e.message}\n(2-Step Verification on? App password correct?)\n`); process.exit(1); }
  }

  // ── Test mode: one email to you, from a real lead's content ────────────────
  if (args.test) {
    // Emailable leads in CSV order share the same numbering as the drafts
    // (render-emails.js global rank). --rank N picks the Nth one as the sample.
    const emailable = rows.filter((r) => (r.Email || "").trim());
    let sample;
    if (args.rank) {
      sample = emailable[args.rank - 1];
      if (!sample) { console.error(`\nNo emailable lead at rank ${args.rank} (only ${emailable.length} have emails).\n`); process.exit(1); }
    } else {
      sample = emailable[0];
    }
    sample = sample || { Business: "Sample Dental", Type: "Dentist", Reviews: "1206", Rating: "4.9", Email: args.test };
    const { subject, html, text } = buildMessage(sample, sig, address || "123 Example St, Los Angeles, CA 90025");
    console.log(`Sending TEST${args.rank ? ` (lead #${args.rank})` : ""} (sample: ${sample.Business}) → ${args.test} ...`);
    if (args.dry) { console.log(`\nSubject: [TEST] ${subject}\n\n${text}\n`); return; }
    const info = await transporter.sendMail({ from: `"${fromName}" <${user}>`, to: args.test, replyTo, subject: `[TEST] ${subject}`, text, html });
    console.log(`✓ Sent. messageId ${info.messageId}\n  Check ${args.test} (and your Spam folder, just in case).\n`);
    return;
  }

  // ── Real mode: send the queue ──────────────────────────────────────────────
  if (!args.dry && !address) {
    console.warn("⚠ GMAIL_MAILING_ADDRESS not set — emails will omit the CAN-SPAM postal address. Set it before a real campaign.\n");
  }
  let queue = rows.filter((r) => (r.Email || "").trim() && !ACTIONED.has((r.Status || "").trim().toLowerCase())).slice(0, args.limit);
  // Never email the same inbox twice in one run (e.g. two locations sharing a
  // billing@ address) — it reads as spam. Keep the first, drop later dupes.
  const seenEmails = new Set();
  const skippedDupes = [];
  queue = queue.filter((r) => {
    const e = (r.Email || "").trim().toLowerCase();
    if (seenEmails.has(e)) { skippedDupes.push(`${r.Business} <${r.Email}>`); return false; }
    seenEmails.add(e);
    return true;
  });
  if (skippedDupes.length) console.log(`Skipping ${skippedDupes.length} duplicate-inbox lead(s): ${skippedDupes.join("; ")}\n`);
  if (queue.length === 0) { console.log("\nNothing to send (queue empty / all contacted).\n"); return; }

  console.log(`${args.dry ? "DRY RUN — would send" : "Sending"} ${queue.length} emails${args.dry ? "" : `, ~${args.delay}s apart`}...\n`);
  let sent = 0, failed = 0;
  for (let i = 0; i < queue.length; i++) {
    const row = queue[i];
    const { subject, html, text } = buildMessage(row, sig, address);
    if (args.dry) { console.log(`  [${i + 1}] → ${row.Email}  |  ${subject}`); continue; }
    try {
      await transporter.sendMail({ from: `"${fromName}" <${user}>`, to: row.Email, replyTo, subject, text, html });
      row.Status = "contacted";
      row["Date contacted"] = args.date || row["Date contacted"] || "";
      row.Channel = "email";
      csv.writeFile(CSV_PATH, headers, rows); // persist after each send
      sent++;
      console.log(`  ✓ [${i + 1}/${queue.length}] ${row.Business.slice(0, 34).padEnd(35)} → ${row.Email}`);
    } catch (e) {
      failed++;
      row.Notes = ((row.Notes || "").trim() ? row.Notes + " · " : "") + `send failed: ${e.message.slice(0, 60)}`;
      csv.writeFile(CSV_PATH, headers, rows);
      console.log(`  ✗ [${i + 1}/${queue.length}] ${row.Business.slice(0, 34)} — ${e.message.slice(0, 50)}`);
    }
    if (i < queue.length - 1) await sleep(args.delay * 1000 * (0.6 + Math.random() * 0.8)); // jittered
  }
  console.log(`\n${args.dry ? "DRY RUN complete." : `✓ Sent ${sent}, failed ${failed}. Marked contacted in contacts.csv.`}\n`);
}

main().catch((e) => { console.error("\nFatal:", e.message, "\n"); process.exit(1); });
