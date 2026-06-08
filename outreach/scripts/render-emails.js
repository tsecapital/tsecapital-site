#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// render-emails.js — turn the next N emailable leads into ready-to-send drafts.
//
// Picks leads that (a) have an email and (b) haven't been queued/contacted yet,
// in list order (Tier A first), renders the right per-tier + per-vertical copy
// with all merge fields filled, writes one draft file per email, and marks each
// lead `queued` in contacts.csv so a later run never duplicates them.
//
// It does NOT send anything — cold email should go from your own Workspace inbox
// (best reply rate) or a warmed-up cold-email tool, not a transactional API.
//
// Usage:
//   node outreach/scripts/render-emails.js                 # next 30
//   node outreach/scripts/render-emails.js --limit 10
//   node outreach/scripts/render-emails.js --tier A --date 2026-06-08
// ─────────────────────────────────────────────────────────────────────────────

const fs = require("fs");
const path = require("path");
const csv = require("./lib/csv");

const CSV_PATH = path.join(__dirname, "..", "contacts.csv");
const DRAFTS_DIR = path.join(__dirname, "..", "drafts");

const CAL = "cal.com/chaunceytse/intro";
const ADDRESS = "[ADD YOUR MAILING ADDRESS — required on cold email]";
const FINANCE = new Set(["Accounting", "Financial advisor", "Insurance", "Mortgage"]);

// Readable form of the Type for use mid-sentence ("a dental practice").
const READABLE = {
  "Dentist": "dental practice", "Medical clinic": "medical practice",
  "Law firm": "law firm", "Accounting": "accounting firm",
  "Real estate": "real estate office", "Insurance": "insurance agency",
  "Med spa": "med spa", "Dermatology": "dermatology practice",
  "Cosmetic surgery": "cosmetic surgery practice", "Physical therapy": "physical therapy clinic",
  "Veterinary": "veterinary practice", "Optometry": "optometry practice",
  "Dental specialist": "dental specialty practice", "Salon / barber": "salon",
  "Auto repair": "auto shop", "Home services": "home-services business",
  "Remodeling": "remodeling company", "Mortgage": "mortgage office",
  "Financial advisor": "advisory practice", "Education": "learning center",
  "Fitness studio": "studio",
};

// Hook + Example per Type (mirrors templates/vertical-snippets.md).
const SNIPPET = {
  "Dentist": ["A busy front desk loses hours every week to reminders, rescheduling, and new-patient forms.", "new-patient intake that fills itself in, reminders and rebooking that go out on their own, and no-show follow-ups that happen without anyone remembering"],
  "Dental specialist": ["Referrals from general dentists and scheduling around them is a lot of manual back-and-forth.", "referral intake that lands organized in your system, automated scheduling, and follow-up that keeps referring offices in the loop"],
  "Medical clinic": ["New-patient intake, reminders, and referral follow-up quietly eat your front desk's day.", "intake forms that flow straight into your system, automatic reminders, and referral follow-ups that never slip"],
  "Dermatology": ["Booking, confirmations, and treatment questions are a constant phone-and-text juggle.", "online booking that confirms and reminds itself, instant replies to common questions, and rebooking nudges after each visit"],
  "Cosmetic surgery": ["Consultation requests need fast, careful follow-up — and most of it is still manual.", "consult-request intake, automated follow-up sequences, and reminders that keep your calendar full"],
  "Med spa": ["Booking, confirmations, and rebooking are a never-ending text-and-call juggle.", "online booking that confirms and reminds itself, rebooking nudges after each visit, and instant replies to treatment questions"],
  "Physical therapy": ["Scheduling recurring visits and chasing no-shows eats real front-desk time.", "recurring-visit scheduling, automatic reminders, and gentle re-engagement for patients who drop off"],
  "Veterinary": ["Appointment reminders, vaccine due-dates, and refill requests are all manual phone work.", "automatic reminders for visits and vaccines, refill requests handled online, and after-visit follow-ups"],
  "Optometry": ["Annual-exam recalls and frame/contact reorders are easy to let slip.", "automatic recall reminders, reorder nudges, and instant answers to insurance questions"],
  "Law firm": ["Client intake and document drafting eat hours your attorneys would rather spend on cases.", "intake summaries, first-draft letters and documents, and follow-up sequences that never slip through the cracks"],
  "Accounting": ["Tax season means the same client details typed into three systems and endless document chasing.", "automatic document requests and reminders, data pulled into your software without manual entry, and client updates that send themselves"],
  "Real estate": ["Leads go cold when no one replies fast enough, and follow-up depends on whoever remembers.", "instant, personalized replies to every inquiry, lead qualification, and follow-up that doesn't stop until they book"],
  "Insurance": ["Quotes, renewals, and routine policy questions pull your team off higher-value work.", "automated quote intake, renewal reminders, and first-line answers to common policy questions"],
  "Mortgage": ["Document collection and status updates are endless back-and-forth.", "automated document requests and reminders, status updates that send themselves, and instant replies to rate questions"],
  "Financial advisor": ["Client onboarding, meeting prep, and follow-up notes quietly eat billable time.", "automated onboarding and document collection, meeting-prep summaries, and follow-up notes drafted for you"],
  "Salon / barber": ["No-shows and last-minute cancellations are a constant drain.", "online booking with automatic reminders, waitlist fill when someone cancels, and rebooking nudges"],
  "Auto repair": ["Quoting, status updates, and service reminders are all manual calls.", "automatic “your car's ready” texts, service-due reminders, and online quote requests that arrive organized"],
  "Home services": ["A missed call is a missed job, and following up on estimates is hit-or-miss.", "instant replies to every inquiry, automated estimate follow-up, and scheduling that fills your calendar without phone tag"],
  "Remodeling": ["Leads are high-value but follow-up is slow and quoting takes forever.", "instant lead replies, organized project intake, and follow-up that keeps prospects warm through a long sales cycle"],
  "Education": ["Enrollment inquiries and scheduling assessments are a constant email load.", "instant replies to enrollment questions, automated scheduling, and reminders that cut no-shows"],
  "Fitness studio": ["Class booking, membership questions, and win-back outreach are all manual.", "online booking and waitlists, automatic membership reminders, and win-back messages for lapsed members"],
};
const DEFAULT_SNIPPET = ["The repetitive stuff — scheduling, intake, follow-ups, reporting — quietly eats your team's week.", "instant replies to inquiries, automatic reminders and follow-ups, and the manual data entry handled for you"];

const lcFirst = (s) => (s ? s[0].toLowerCase() + s.slice(1) : s);
const readable = (type) => READABLE[type] || "local business";
const snippet = (type) => SNIPPET[type] || DEFAULT_SNIPPET;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

const SIG_FULL = `— Chauncey Tse
AI automation · West Los Angeles
Previously at Google, American Express & KPMG
chauncey.tse@gmail.com · tsecapital.co`;
const SIG_SHORT = `— Chauncey Tse · previously at Google, Amex & KPMG
chauncey.tse@gmail.com · tsecapital.co`;
const optOut = `${ADDRESS} · Not useful? Reply "no thanks" and I won't write again.`;

function render(row) {
  const first = (row.Contact || "").trim() || "there";
  const biz = row.Business;
  const type = readable(row.Type);
  const [hook, example] = snippet(row.Type);
  const tier = row.Tier || "B";

  const subject = `a quick idea for ${biz}`;

  let intro;
  if (FINANCE.has(row.Type)) {
    intro = `I spent years in accounting and business intelligence at Google, American Express, and KPMG, so I know how much of your week disappears into reporting, reconciliations, and data entry. That's exactly what I now automate for firms like ${biz} here in West LA.`;
  } else if (tier === "A") {
    intro = `I help local businesses here in West LA automate their busywork with AI. I came across ${biz} while looking at ${type}s in the area, and ${lcFirst(hook)}\n\nThat's the kind of thing I automate.`;
  } else {
    intro = `I build AI automations for ${type}s here in West LA. ${hook}`;
  }

  const body =
`Hi ${first},

I'm Chauncey — ${intro}

For a ${type}, it usually looks like ${example} — running quietly in the background, wired into the tools you already use, with nothing new for your team to learn.

I take on a small number of local businesses directly — I'm the one who builds it, not an agency. I'd be glad to do a free 20-minute call and point out the one or two things in your workflow most worth automating. If there's nothing worth doing, I'll tell you on the call.

Worth a look? My calendar's here: ${CAL} — or just reply and I'll find a time.

${tier === "A" ? SIG_FULL : SIG_SHORT}

${optOut}`;

  return { subject, body, to: row.Email, first };
}

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

  const queue = rows.filter(
    (r) => (r.Email || "").trim() && !(r.Status || "").trim() && (!args.tier || r.Tier === args.tier)
  ).slice(0, args.limit);

  if (queue.length === 0) {
    console.log("\nNo un-queued leads with an email left to draft. Nothing to do.\n");
    return;
  }

  fs.mkdirSync(DRAFTS_DIR, { recursive: true });
  const index = [];
  queue.forEach((row, i) => {
    const { subject, body, to } = render(row);
    const n = String(i + 1).padStart(2, "0");
    const file = path.join(DRAFTS_DIR, `${n}-${slug(row.Business)}.txt`);
    fs.writeFileSync(file, `To: ${to}\nSubject: ${subject}\n\n${body}\n`);
    index.push(`${n}. ${row.Business}  <${to}>  [Tier ${row.Tier}]`);

    // Mark queued so the next run skips it — prevents duplicate sends.
    row.Status = "queued";
    const stamp = args.date ? ` ${args.date}` : "";
    row.Notes = ((row.Notes || "").trim() ? row.Notes + " · " : "") + `draft generated${stamp} — send, then set Status=contacted`;
  });

  fs.writeFileSync(path.join(DRAFTS_DIR, "_index.txt"), index.join("\n") + "\n");
  csv.writeFile(CSV_PATH, headers, rows);

  console.log(`\n✓ Rendered ${queue.length} ready-to-send drafts → ${path.relative(process.cwd(), DRAFTS_DIR)}/`);
  console.log(`✓ Marked those ${queue.length} leads Status=queued in contacts.csv (won't be re-drafted).`);
  console.log(`\nBefore sending: replace ${ADDRESS} with your real address, and add a first name where you can.`);
  console.log(`Send from your Workspace/Gmail inbox, ~20–30/day. Reply received → set Status=contacted (or replied).\n`);
}

main();
