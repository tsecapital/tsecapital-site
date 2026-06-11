// Shared email composition — used by both render-emails.js (drafts) and
// send-emails.js (automated send), so the wording never drifts between them.

const CAL = "cal.com/chaunceytse/intro";
const FINANCE = new Set(["Accounting", "Financial advisor", "Insurance", "Mortgage"]);
// Statuses that mean "already worked" — never re-contact these.
const ACTIONED = new Set(["contacted", "replied", "call booked", "proposal sent", "won", "passed"]);

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
const title = (s) => (s ? s[0].toUpperCase() + s.slice(1).toLowerCase() : s);
const readable = (type) => READABLE[type] || "local business";
const snippet = (type) => SNIPPET[type] || DEFAULT_SNIPPET;
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
const art = (t) => (/^[aeiou]/i.test(t) ? "an" : "a");
const plural = (t) => (/[^aeiou]y$/.test(t) ? t.replace(/y$/, "ies") : t + "s");

// Strip Google/SEO suffixes from listing names, e.g.
// "Lasting Impressions Dental Spa | Dentist in Encino" → "Lasting Impressions Dental Spa".
const cleanBiz = (b) =>
  b.split("|")[0].replace(/\s[-–]\s[^-–]*\b(in|near|of|serving)\s.+$/i, "").trim();

// A first name we can TRUST — only when the business name carries a personal
// credential or "Dr." prefix, so we never greet "Earnest Homes" as "Earnest".
function nameFromBusiness(biz) {
  const head = biz.split(",")[0];
  const hasDr = /^\s*(dr|drs)\.?\s+/i.test(biz);
  const hasCred = /,\s*(DDS|DMD|MD|DO|OD|DC|DPM|DVM|VMD|Esq|JD|CPA|FACS|FAAD|FACOG)\b/i.test(biz);
  if (!hasDr && !hasCred) return null;
  if (/&|\band\b/i.test(head)) return null; // multi-partner → ambiguous
  const toks = head.replace(/^(dr|drs)\.?\s+/i, "").replace(/\./g, "").trim().split(/\s+/).filter(Boolean);
  if (toks.length < 2 || toks.length > 3) return null;
  if (!/^[A-Z][a-z]{1,}$/.test(toks[0]) || !/^[A-Z][a-z]{1,}$/.test(toks[toks.length - 1])) return null;
  return toks[0];
}

// Mailbox local-parts that carry no personal name — never greet someone "Hi Info".
const GENERIC_LOCAL = new Set([
  "info", "office", "admin", "hello", "contact", "contactus", "sales", "team", "support",
  "billing", "accounts", "accounting", "mail", "email", "reception", "frontdesk", "front",
  "desk", "appointments", "appts", "appt", "scheduling", "schedule", "booking", "bookings",
  "help", "service", "services", "customerservice", "care", "clinic", "staff", "general",
  "inquiries", "enquiries", "newpatients", "patients", "intake", "hr", "jobs", "careers",
  "marketing", "noreply", "webmaster", "postmaster", "taxes", "tax", "remodel", "quotes",
  "quote", "estimates", "leads", "biz", "business", "owner", "manager", "main", "frontoffice",
]);

// A first name is "plausible" if it reads like one: 3–9 letters, a vowel up front
// (so we reject initials+surname like "nsharp" and initial-blobs like "cja"), and
// not a generic mailbox word.
const isPlausibleName = (w) => /^[a-z]{3,9}$/.test(w) && /[aeiouy]/.test(w.slice(0, 2)) && !GENERIC_LOCAL.has(w);

// A first name from the email's local-part, only when we can TRUST it. Three ways:
//   (a) it appears verbatim in the business name      ross@rossweinstein → "Ross Weinstein"
//   (b) it's a clean firstname.lastname split         tom.homeseller     → Tom
//   (c) it's a plausible standalone first name         ramona@…           → Ramona
// Otherwise null — a wrong name is worse than "there", so we'd rather fall back.
function nameFromEmail(email, biz) {
  let local = String(email || "").split("@")[0].toLowerCase().trim();
  local = local.replace(/^(dr|drs)[._-]?/, ""); // drop a leading "dr" (drlorinvogel)
  const flat = local.replace(/[^a-z]/g, "");
  if (!flat || GENERIC_LOCAL.has(flat)) return null;
  // Don't mistake the business's own handle for a name (nailclubla@, hicbuildersinc@).
  const bizSlug = String(biz || "").toLowerCase().replace(/[^a-z]/g, "");
  if (flat.length > 4 && bizSlug && (bizSlug.includes(flat) || flat.includes(bizSlug))) return null;

  const tokens = local.split(/[._-]+/).filter(Boolean);
  const cand = tokens[0] || "";
  // (a) verbatim in the business name — highest confidence
  if (/^[a-z]{2,}$/.test(cand) && new RegExp("\\b" + cand + "\\b", "i").test(String(biz || ""))) return title(cand);
  // (b) clean first.last split, or (c) plausible standalone first name
  if (isPlausibleName(cand)) return title(cand);
  return null;
}

// Does this email land in a ROLE/shared inbox (read by staff) rather than the
// named person's own inbox? If so we greet "Hi there," — addressing the owner by
// first name reads oddly when a front-desk person opens it. Personal handles
// (ross@, cja@, drlorinvogel@, tom.homeseller@) are NOT role inboxes.
function isRoleInbox(email, biz) {
  let local = String(email || "").split("@")[0].toLowerCase().trim();
  local = local.replace(/^(dr|drs)[._-]?/, "");
  const flat = local.replace(/[^a-z]/g, "");
  if (!flat || GENERIC_LOCAL.has(flat)) return true;                 // info@, sales@, team@…
  const bizSlug = String(biz || "").toLowerCase().replace(/[^a-z]/g, "");
  if (flat.length > 4 && bizSlug && (bizSlug.includes(flat) || flat.includes(bizSlug))) return true; // business catch-all
  const tokens = local.split(/[._-]+/).filter(Boolean);
  if (GENERIC_LOCAL.has(tokens[0])) return true;
  // single-token handles: personal only if short (an initial-blob or one name);
  // long single tokens are business/location descriptors (reviveshermanoaks@).
  if (tokens.length === 1 && tokens[0].length > 11) return true;
  return false;
}

// row → { subject, body, to, first }. Body ends with "— Chauncey"; the signature
// (Gmail's, or the one send-emails.js appends) goes after that.
function composeEmail(row) {
  const biz = cleanBiz(row.Business);
  const type = readable(row.Type);
  const [hook, example] = snippet(row.Type);

  const reviews = parseInt(String(row.Reviews || "").replace(/[^0-9]/g, ""), 10) || 0;
  const rating = String(row.Rating || "").trim();
  const proof = reviews >= 40 && rating ? `${reviews.toLocaleString()} reviews at ${rating}★` : null;

  // Personalize the greeting only when the email reaches the person directly; a
  // role/shared inbox (info@, sales@, a business catch-all) gets "Hi there,".
  const first = isRoleInbox(row.Email, row.Business)
    ? "there"
    : ((row.Contact || "").trim() || nameFromBusiness(biz) || nameFromEmail(row.Email, row.Business) || "there");
  const subject = `a quick idea for ${biz}`;

  let intro;
  if (FINANCE.has(row.Type)) {
    intro = `I spent years in accounting and business intelligence at Google, American Express, and KPMG, so I know how much of your week disappears into reporting, reconciliations, and data entry — exactly what I now automate for firms like ${biz} here in West LA.`;
    if (proof) intro += ` (${proof} — your clients clearly trust you; this just gives your team their time back.)`;
  } else {
    const proofClause = proof ? ` — ${proof} is hard to miss` : "";
    intro = `I help local businesses here in West LA automate their busywork with AI. I came across ${biz} while looking at ${plural(type)} in the area${proofClause}, and ${lcFirst(hook)}`;
  }

  const body =
`Hi ${first},

I'm Chauncey — ${intro}

For ${art(type)} ${type}, that usually looks like ${example} — running quietly in the background, wired into the tools you already use, with nothing new for your team to learn.

I take on a small number of local businesses directly — I'm the one who builds it, not an agency. I'd be glad to do a free 15-minute call and point out the one or two things in your workflow most worth automating. If there's nothing worth doing, I'll tell you on the call.

Worth a look? My calendar's here: ${CAL} — or just reply and I'll find a time.

— Chauncey`;

  return { subject, body, to: row.Email, first };
}

// row → spoken call + voicemail script for phone-only leads (no public email).
// Reuses the same per-vertical hook/example + proof logic as composeEmail, so the
// phone wording never drifts from the email wording.
function composeCall(row) {
  const biz = cleanBiz(row.Business);
  const type = readable(row.Type);
  const types = plural(type);
  const [hook, example] = snippet(row.Type);

  const reviews = parseInt(String(row.Reviews || "").replace(/[^0-9]/g, ""), 10) || 0;
  const rating = String(row.Rating || "").trim();
  const proof = reviews >= 40 && rating ? `${reviews.toLocaleString()} reviews at ${rating}★` : null;

  const first = (row.Contact || "").trim() || nameFromBusiness(biz) || nameFromEmail(row.Email, row.Business) || null;
  const ask = first || "the owner or office manager";

  let opener;
  if (FINANCE.has(row.Type)) {
    opener =
      `Hi — is ${first || "the owner"} in? I'm Chauncey, I'm local here in West LA. ` +
      `I spent years in accounting and business intelligence at Google, American Express, and KPMG, ` +
      `and I now automate the reporting, reconciliations, and data entry that quietly eat a firm's week. ` +
      `Could I borrow two minutes — or grab the best email to send a short note?`;
  } else {
    opener =
      `Hi — is ${ask} around? I'm Chauncey, I'm local here in West LA and I help ${types} ` +
      `automate the front-desk busywork with AI. ${hook} I build the kind of thing that handles ` +
      `that quietly in the background. Could I borrow two minutes — or grab the best email to send a short note?`;
  }

  const voicemail =
    `Hi, this is Chauncey — I'm local in West LA and I help ${types} automate the repetitive ` +
    `busywork, things like ${example}. No pressure: if it's useful my calendar's at ${CAL}, ` +
    `or I'll try you back. Thanks!`;

  return { biz, type, types, first, proof, hook, example, opener, voicemail };
}

module.exports = { composeEmail, composeCall, cleanBiz, nameFromBusiness, nameFromEmail, slug, ACTIONED, CAL };
