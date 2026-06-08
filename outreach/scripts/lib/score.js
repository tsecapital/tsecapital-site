// Fit × size scoring and A/B/C tiering.
//
// The score rewards three things, in priority order:
//   1. Vertical FIT     — how well AI automation fits the business (from config)
//   2. SIZE / establishment — review count as a revenue proxy (log-scaled)
//   3. A real website + a good rating — signals they're established & reachable
//
// Tier A = the businesses you email first: high-fit, established, can afford you.

// Review count → 0..7, log-scaled (diminishing returns).
//   10 reviews → 2.4   50 → 3.9   100 → 4.6   500 → 6.2   1000+ → ~7 (capped)
function sizeFactor(reviews) {
  if (!reviews || reviews <= 0) return 0;
  return Math.min(7, Math.log(reviews + 1));
}

// place: { fit, reviews, rating, website }  →  { score, tier }
function scoreAndTier(place) {
  const reviews = Number(place.reviews) || 0;
  const rating = Number(place.rating) || 0;
  const hasSite = !!place.website;

  const siteBonus = hasSite ? 2 : 0;
  const ratingBonus = rating >= 4.5 ? 2 : rating >= 4.0 ? 1 : 0;

  const score = Number(
    (place.fit * (sizeFactor(reviews) + siteBonus) + ratingBonus).toFixed(1)
  );

  let tier;
  if (place.fit >= 3 && reviews >= 50 && hasSite && score >= 15) {
    tier = "A"; // high-fit + established + reachable
  } else if (score >= 8 || (reviews >= 20 && hasSite)) {
    tier = "B"; // decent fit or solid mid-size signals
  } else {
    tier = "C"; // low fit / small / no website
  }

  return { score, tier };
}

const TIER_RANK = { A: 0, B: 1, C: 2, "": 3 };

// Sort comparator: Tier A first, then highest score within a tier.
function byTierThenScore(a, b) {
  const ta = TIER_RANK[a.Tier] ?? 3;
  const tb = TIER_RANK[b.Tier] ?? 3;
  if (ta !== tb) return ta - tb;
  return (Number(b.Score) || 0) - (Number(a.Score) || 0);
}

module.exports = { scoreAndTier, byTierThenScore, sizeFactor };
