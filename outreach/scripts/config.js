// ─────────────────────────────────────────────────────────────────────────────
// Targeting config for the West LA (ZIP 90049) AI-automation outreach pipeline.
//
// Edit this file to change WHO you target and HOW the list is tiered.
// fetch-places.js reads everything here.
// ─────────────────────────────────────────────────────────────────────────────

// Center of ZIP 90049 (Brentwood / West Los Angeles) + a 5-mile radius.
const CENTER = { lat: 34.0917, lng: -118.476 };
const RADIUS_MILES = 5;
const RADIUS_METERS = Math.round(RADIUS_MILES * 1609.344); // 8047 m

// Stop pulling once we have this many businesses (after dedupe + distance filter).
const TARGET_COUNT = 500;

// Cap per vertical so the 500 spans all your verticals instead of being 200
// dentists. Bigger verticals can fill more; smaller ones still get a seat.
const PER_VERTICAL_CAP = 40;

// ── Verticals to target ──────────────────────────────────────────────────────
// fit  : how well AI automation fits this vertical (3 = best, 2 = good, 1 = ok).
//        Drives both the tier score and which email hook/example to use.
// type : label written to the CSV "Type" column.
// queries : natural-language Google Places Text Search queries. More queries per
//        vertical = wider coverage. Each query pulls up to 60 results.
const VERTICALS = [
  // ── High-fit professional services ─────────────────────────────────────────
  { type: "Dentist",           fit: 3, group: "Pro services",   queries: ["dentist", "dental clinic", "orthodontist", "cosmetic dentist"] },
  { type: "Medical clinic",    fit: 3, group: "Pro services",   queries: ["medical clinic", "doctor office", "urgent care", "pediatrician", "OB-GYN"] },
  { type: "Law firm",          fit: 3, group: "Pro services",   queries: ["law firm", "personal injury lawyer", "family law attorney", "estate planning attorney"] },
  { type: "Accounting",        fit: 3, group: "Pro services",   queries: ["accountant", "cpa firm", "bookkeeping service", "tax preparation"] },
  { type: "Real estate",       fit: 3, group: "Pro services",   queries: ["real estate agency", "real estate agent", "property management company"] },
  { type: "Insurance",         fit: 3, group: "Pro services",   queries: ["insurance agency", "insurance broker"] },

  // ── Appointment-heavy local ─────────────────────────────────────────────────
  { type: "Med spa",           fit: 3, group: "Appointment",    queries: ["med spa", "medical spa", "botox clinic", "laser hair removal"] },
  { type: "Dermatology",       fit: 3, group: "Appointment",    queries: ["dermatologist", "skin clinic"] },
  { type: "Cosmetic surgery",  fit: 3, group: "Appointment",    queries: ["plastic surgeon", "cosmetic surgery center"] },
  { type: "Physical therapy",  fit: 3, group: "Appointment",    queries: ["physical therapy clinic", "chiropractor", "sports rehab"] },
  { type: "Veterinary",        fit: 3, group: "Appointment",    queries: ["veterinarian", "animal hospital", "vet clinic"] },
  { type: "Optometry",         fit: 2, group: "Appointment",    queries: ["optometrist", "eye doctor"] },
  { type: "Dental specialist", fit: 2, group: "Appointment",    queries: ["endodontist", "periodontist", "oral surgeon"] },
  { type: "Salon / barber",    fit: 2, group: "Appointment",    queries: ["hair salon", "barber shop", "nail salon"] },
  { type: "Auto repair",       fit: 2, group: "Appointment",    queries: ["auto repair shop", "car mechanic", "auto body shop"] },
  { type: "Home services",     fit: 2, group: "Appointment",    queries: ["hvac contractor", "plumber", "electrician", "pest control"] },

  // ── Higher-ticket B2C ───────────────────────────────────────────────────────
  { type: "Remodeling",        fit: 3, group: "Higher-ticket",  queries: ["home remodeling contractor", "general contractor", "kitchen remodeling", "bathroom remodeling"] },
  { type: "Mortgage",          fit: 3, group: "Higher-ticket",  queries: ["mortgage broker", "mortgage lender"] },
  { type: "Financial advisor", fit: 3, group: "Higher-ticket",  queries: ["financial advisor", "wealth management firm"] },
  { type: "Education",         fit: 2, group: "Higher-ticket",  queries: ["tutoring center", "test prep", "private school"] },
  { type: "Fitness studio",    fit: 2, group: "Higher-ticket",  queries: ["pilates studio", "yoga studio", "personal training gym"] },
];

module.exports = { CENTER, RADIUS_MILES, RADIUS_METERS, TARGET_COUNT, PER_VERTICAL_CAP, VERTICALS };
