// Fit × size scoring and tiering.
//
// SCORE rewards, in priority order:
//   1. Vertical FIT     — how well AI automation fits the business (from config)
//   2. SIZE / establishment — review count as a revenue proxy (log-scaled)
//   3. A real website + a good rating — established & reachable
//
// TIERS are assigned by PERCENTILE of score across the final list, not by fixed
// thresholds. In a dense, affluent area like West LA almost every established
// business clears any absolute bar, so fixed thresholds put ~everyone in Tier A.
// Percentiles always give you a usable gradient: A = your best ~20%, etc.

// Review count → 0..7, log-scaled (diminishing returns).
//   10 reviews → 2.4   50 → 3.9   100 → 4.6   500 → 6.2   1000+ → ~7 (capped)
function sizeFactor(reviews) {
  if (!reviews || reviews <= 0) return 0;
  return Math.min(7, Math.log(reviews + 1));
}

// place: { fit, reviews, rating, website } → numeric score
function computeScore(place) {
  const reviews = Number(place.reviews) || 0;
  const rating = Number(place.rating) || 0;
  const siteBonus = place.website ? 2 : 0;
  const ratingBonus = rating >= 4.5 ? 2 : rating >= 4.0 ? 1 : 0;
  return Number(
    (place.fit * (sizeFactor(reviews) + siteBonus) + ratingBonus).toFixed(1)
  );
}

// Assign A/B/C across a set of CSV-shaped rows (need .Score, .Website, .Reviews).
// Top `aPct` by score = A, next `bPct` = B, rest = C — with guardrails so an
// "A" always has a website + real traction.
function assignTiers(rows, aPct = 0.2, bPct = 0.4) {
  const sorted = [...rows].sort(
    (a, b) => (Number(b.Score) || 0) - (Number(a.Score) || 0)
  );
  const n = sorted.length;
  const aCut = Math.round(n * aPct);
  const bCut = Math.round(n * (aPct + bPct));

  sorted.forEach((r, i) => {
    let tier = i < aCut ? "A" : i < bCut ? "B" : "C";
    // Guardrail: Tier A must be reachable + established.
    if (tier === "A" && (!r.Website || (Number(r.Reviews) || 0) < 50)) tier = "B";
    r.Tier = tier;
  });
}

const TIER_RANK = { A: 0, B: 1, C: 2, "": 3 };

// Sort comparator: Tier A first, then highest score within a tier.
function byTierThenScore(a, b) {
  const ta = TIER_RANK[a.Tier] ?? 3;
  const tb = TIER_RANK[b.Tier] ?? 3;
  if (ta !== tb) return ta - tb;
  return (Number(b.Score) || 0) - (Number(a.Score) || 0);
}

module.exports = { computeScore, assignTiers, byTierThenScore, sizeFactor };
