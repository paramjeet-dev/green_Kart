// Donors (many of them households) enter a precise geocoded pickup address so
// the app can plot it on a map. That's fine once someone has actually claimed
// the listing and needs to go pick it up — but showing an exact home pin +
// full address to every other logged-in user just browsing is an unnecessary
// safety risk. These helpers fuzz/mask location for anyone who isn't the
// donor, the claimer, or an admin.

// Deterministic string hash -> a number in [0, 1). Seeded by listing id so the
// same listing always gets the same fuzzed pin instead of jumping around
// between requests (which would be confusing and would also let someone
// triangulate the real location by averaging multiple fuzzed readings).
function seededRandom(seed) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (Math.imul(31, h) + seed.charCodeAt(i)) | 0;
  }
  return ((h >>> 0) % 100000) / 100000;
}

// Nudges a coordinate 120–300m in a random-but-stable direction.
function fuzzCoordinates(lat, lng, seed) {
  if (lat == null || lng == null) return { lat, lng };

  const radiusMeters = 120 + seededRandom(`${seed}:r`) * 180;
  const angle = seededRandom(`${seed}:a`) * 2 * Math.PI;
  const dLat = (radiusMeters * Math.cos(angle)) / 111320;
  const dLng = (radiusMeters * Math.sin(angle)) / (111320 * Math.cos((lat * Math.PI) / 180));

  return { lat: +(lat + dLat).toFixed(6), lng: +(lng + dLng).toFixed(6) };
}

// Best-effort masking of a Nominatim-style "house number, street, area, city, ..."
// address down to the area/city level by dropping the first couple of
// (most specific) comma-separated segments.
function maskAddress(address) {
  if (!address) return address;
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 3) return address; // too short to safely trim further
  return parts.slice(2).join(", ");
}

// True if `requesterId` may see this listing's exact location: the donor
// themselves, whoever claimed it, or an admin.
function canSeeExactLocation({ donorId, claimedById, requesterId, isAdmin }) {
  if (isAdmin) return true;
  if (donorId && requesterId === donorId.toString()) return true;
  if (claimedById && requesterId === claimedById.toString()) return true;
  return false;
}

// Mutates a plain listing object's `location`, replacing it with a fuzzed/masked
// version unless the requester is authorized to see the exact one. Expects a
// plain object (call `.toObject()` on the Mongoose doc first).
function applyLocationPrivacy(listingObj, { requesterId, isAdmin }) {
  if (!listingObj?.location) return listingObj;

  const donorId = listingObj.donor?._id || listingObj.donor;
  const claimedById = listingObj.claimedBy?._id || listingObj.claimedBy;

  if (canSeeExactLocation({ donorId, claimedById, requesterId, isAdmin })) {
    return listingObj;
  }

  const { lat, lng } = fuzzCoordinates(listingObj.location.lat, listingObj.location.lng, listingObj._id.toString());
  listingObj.location = {
    ...listingObj.location,
    address: maskAddress(listingObj.location.address),
    lat,
    lng,
    approximate: true,
  };
  return listingObj;
}

module.exports = { fuzzCoordinates, maskAddress, canSeeExactLocation, applyLocationPrivacy };