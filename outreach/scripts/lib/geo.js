// Great-circle distance helper. Used to enforce the 5-mile radius client-side,
// so the list is correct no matter how the Places API interprets locationBias.

const EARTH_RADIUS_MILES = 3958.7613;

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Distance in miles between two {lat, lng} points.
function haversineMiles(a, b) {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.min(1, Math.sqrt(h)));
}

module.exports = { haversineMiles };
