// Minimal Google Places API (New) Text Search client. Zero dependencies —
// uses Node's built-in fetch (Node 18+).
//
// Docs: https://developers.google.com/maps/documentation/places/web-service/text-search

const ENDPOINT = "https://places.googleapis.com/v1/places:searchText";

// Only the fields we actually use — keeps the request in the cheaper field tiers.
const FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.rating",
  "places.userRatingCount",
  "places.primaryType",
  "places.businessStatus",
  "places.location",
  "nextPageToken",
].join(",");

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// One Text Search request (one page of up to 20 results).
async function searchTextPage({ apiKey, textQuery, center, radiusMeters, pageToken }) {
  const body = {
    textQuery,
    pageSize: 20,
    locationBias: {
      circle: {
        center: { latitude: center.lat, longitude: center.lng },
        radius: radiusMeters,
      },
    },
  };
  if (pageToken) body.pageToken = pageToken;

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Places API ${res.status}: ${text.slice(0, 400)}`);
  }
  return res.json();
}

// Run a query through all available pages (max 3 pages = 60 results).
// Returns the raw `places` array (deduped/filtered by the caller).
async function searchAllPages(opts) {
  const all = [];
  let pageToken;
  for (let page = 0; page < 3; page++) {
    const data = await searchTextPage({ ...opts, pageToken });
    if (Array.isArray(data.places)) all.push(...data.places);
    pageToken = data.nextPageToken;
    if (!pageToken) break;
    await sleep(250); // be gentle; let the page token settle
  }
  return all;
}

module.exports = { searchAllPages, searchTextPage };
