// Decodes a JWT's payload without verifying the signature. That's fine here —
// we only read the non-sensitive `exp` claim to schedule a refresh; the
// server remains the source of truth for actually trusting the token.
export function decodeJwtPayload(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join("")
    );
    return JSON.parse(json);
  } catch {
    return null;
  }
}

// Returns the token's expiry as an epoch-ms timestamp, or null if it can't be read.
export function getTokenExpiryMs(token) {
  const payload = decodeJwtPayload(token);
  return payload?.exp ? payload.exp * 1000 : null;
}