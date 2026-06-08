// ─────────────────────────────────────────────────────────────────────────────
// SINGLE SOURCE OF TRUTH for the site's copy, prices, and config.
// Edit values here to tune the page — components just render this.
// Bracketed [REPLACE: ...] notes mark things only Chauncey can fill in.
// ─────────────────────────────────────────────────────────────────────────────

export const site = {
  name: "Chauncey Tse",
  tagline: "AI automation for local business",
  email: "chauncey@tsecapital.co",
  // Your real Cal.com link, e.g. "chauncey-tse/intro".
  // While this starts with "your-", the booking section shows an email
  // fallback instead of the live calendar embed.
  calLink: "chaunceytse/intro",
  area: "Brentwood & West LA",
  zip: "90049",
  url: "https://tsecapital.co",
};

export function isCalConfigured(): boolean {
  return !!site.calLink && !site.calLink.startsWith("your-");
}

export const nav = [
  { label: "How it works", href: "#process" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

export const hero = {
  eyebrow: `AI automation · ${"Brentwood & West LA"}`,
  lead: "I’m Chauncey — I put today’s most capable AI to work on the repetitive tasks that eat your week: intake, scheduling, follow-ups, data entry, and reporting. You stay focused on your clients; the busywork runs itself.",
  primaryCta: { label: "Book a free intro call", href: "#book" },
  secondaryCta: { label: "See how it works", href: "#process" },
  note: "Fixed prices. No jargon. A real engineer — not an agency.",
};

export const problem = {
  heading: "The busywork is quietly costing you a hire.",
  sub: "Every week your team loses hours to work a computer should handle. Death by a thousand small tasks:",
  items: [
    "Typing the same client details into three different systems.",
    "Phone tag and email chains just to book one appointment.",
    "Chasing leads and following up — whenever someone remembers.",
    "Copy-pasting between your CRM, calendar, and spreadsheets.",
    "Rebuilding the same report by hand, every single month.",
  ],
  closer: "None of it grows your business. Almost all of it can be automated.",
};

export const services = {
  heading: "I build the AI that handles the repetitive work.",
  sub: "Practical automations wired into the tools you already use — not a science project.",
  items: [
    {
      audience: "For dental & medical practices",
      title: "Smart intake & scheduling",
      body: "New-patient forms, reminders, and rebooking that run without your front desk lifting a finger.",
    },
    {
      audience: "For law & professional firms",
      title: "Document & client automation",
      body: "Intake summaries, first-draft documents, and follow-up sequences that never slip through the cracks.",
    },
    {
      audience: "For real estate & local services",
      title: "Lead response that never sleeps",
      body: "Instant replies, qualification, and follow-up so no inquiry ever goes cold.",
    },
  ],
  closer:
    "Don’t see yours? If the work is repetitive, it can probably be automated. That’s what the first call is for.",
};

export const process = {
  heading: "How it works",
  sub: "A low-risk path from “maybe” to running on its own.",
  steps: [
    {
      n: "01",
      name: "Audit",
      body: "We spend 90 minutes mapping where your time actually goes. You get a short, ranked report of your best automation opportunities — yours to keep, and credited toward a build.",
    },
    {
      n: "02",
      name: "Sprint",
      body: "I build one automation end-to-end in 2–3 weeks: wired into your tools, tested on your real workflow, with your team trained to run it.",
    },
    {
      n: "03",
      name: "Ongoing",
      body: "Once it’s working, I keep it sharp and build the next one — on a simple month-to-month retainer. Only if you want it.",
    },
  ],
};

export const pricing = {
  heading: "Straightforward pricing.",
  sub: "Flat fees, quoted up front. You always know the number before we start.",
  tiers: [
    {
      name: "AI Opportunity Audit",
      price: "$1,500",
      cadence: "one-time",
      highlight: false,
      tagline: "Find the highest-ROI automations in your business.",
      points: [
        "90-minute deep-dive into where your time goes",
        "A short, ranked roadmap of your 3–5 best automations",
        "Plain-English — yours to keep",
        "Credited toward a Sprint if you move forward",
      ],
      cta: { label: "Start with an audit", href: "#book" },
    },
    {
      name: "Automation Sprint",
      price: "$7,500",
      cadence: "per build",
      highlight: true,
      badge: "Most popular",
      tagline: "One automation, built end-to-end.",
      points: [
        "Scoped, built, and tested on your real workflow",
        "Wired into the tools you already use",
        "Your team trained to run it",
        "2–3 weeks · larger scopes quoted up front",
      ],
      cta: { label: "Book a call", href: "#book" },
    },
    {
      name: "Ongoing AI Partner",
      price: "$3,000",
      cadence: "per month",
      highlight: false,
      tagline: "A standing partner for what’s next.",
      points: [
        "Tuning and support for everything that’s live",
        "Your next automation, built as you go",
        "Priority access to me directly",
        "Month-to-month — cancel anytime",
      ],
      cta: { label: "Book a call", href: "#book" },
    },
  ],
  footnote:
    "Need something small or one-off? Ad-hoc work is billed at $300/hr — see the FAQ.",
};

export const about = {
  kicker: "A note from me",
  heading: "You’ll work with the person doing the work.",
  paragraphs: [
    "I’m Chauncey Tse — an engineer who builds with AI for a living. Right now I’m building SignalSnitch.io, an intelligence platform that tracks how accurate influencers’ stock and crypto calls really are. Working on a real AI product every day means I know what these tools can genuinely do for a business — and, just as importantly, what they can’t.",
    "Before this, I spent years building data and reporting systems at Google, American Express, and KPMG — where I kept seeing the same thing: sharp teams losing hours every week to work that’s highly repetitive, yet often surprisingly technical. That’s the problem I fix. Most small businesses are sitting on automations worth thousands a year; they just don’t have an engineer to build them.",
    "So I’m taking on a small number of local businesses directly. No account managers, no offshore team, no six-month contracts — you work with the person actually building the thing. And if I look at your workflow and don’t find anything worth automating, I’ll tell you on the first call, before you’ve paid a cent.",
  ],
  signature: "— Chauncey",
};

export const faq = {
  heading: "Questions, answered.",
  items: [
    {
      q: "What does an “automation” actually look like?",
      a: "A new patient fills out a form and it lands in your system, books them, and texts a reminder — no staff time. Or a new lead emails you and gets an instant, personalized reply that schedules a call. Real workflows, wired into the tools you already use.",
    },
    {
      q: "Which tools do you work with?",
      a: "Whatever you already use — your calendar, CRM, email, practice- or case-management software, spreadsheets, and forms. I build around your stack; you don’t switch systems.",
    },
    {
      q: "Is my client and patient data safe?",
      a: "Yes. I use enterprise AI tooling that doesn’t train on your data, scope access to only what’s needed, and I’m glad to sign a confidentiality agreement before we start.",
    },
    {
      q: "How long does it take?",
      a: "An Audit is done within a week. Each automation Sprint is 2–3 weeks, depending on how quickly we can get access and your feedback.",
    },
    {
      q: "Do you work on-site or remotely?",
      a: "Both. I’m local to Brentwood and West LA, so I’m glad to meet in person for the kickoff and work remotely from there.",
    },
    {
      q: "What about small, one-off tasks?",
      a: "If something doesn’t fit a package, I bill ad-hoc work at $300/hour. Most clients start with an Audit so we can see the whole picture first.",
    },
    {
      q: "What if there’s nothing worth automating?",
      a: "Then I’ll tell you on the intro call, before you’ve paid anything. I’d rather pass than sell you something you don’t need.",
    },
  ],
};

export const booking = {
  heading: "Let’s give your team back an hour a day.",
  sub: "Grab a free 20-minute intro call. We’ll talk through your busywork and whether automation makes sense for you — no pressure, no jargon.",
};

export const footer = {
  blurb: "AI automation for local business.",
  building: "Currently building SignalSnitch.io.",
};
