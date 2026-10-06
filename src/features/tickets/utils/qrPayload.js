/**
 * QR Payload Serialization and Canonical Formatting (SPEC-04 / REQ-TICK-04.2)
 * Ensures deterministic string representation for HMAC-SHA256 signing and validation.
 */

/**
 * Builds a canonical pipe/colon-delimited message for cryptographic signing.
 * Format: tid:bid:eid:sid:tier:iat
 *
 * @param {Object} payload
 * @param {string} payload.tid - Ticket ID
 * @param {string} payload.bid - Booking ID
 * @param {string} payload.eid - Event ID
 * @param {string} payload.sid - Seat ID
 * @param {string} payload.tier - Tier category (e.g. VIP, Regular, Balcony)
 * @param {number} payload.iat - Issued at timestamp (epoch seconds)
 * @returns {string} Normalized canonical string
 */
export function buildCanonicalString({ tid, bid, eid, sid, tier, iat }) {
  return `${tid}:${bid}:${eid}:${sid}:${tier}:${iat}`;
}

/**
 * Serializes standard verifiable QR payload embedding HMAC signature.
 *
 * @param {Object} payload - Core ticket metadata
 * @param {string} signature - 64-char hex HMAC-SHA256 signature
 * @returns {string} JSON-serialized QR payload
 */
export function serializeQRPayload(payload, signature) {
  return JSON.stringify({
    tid: payload.tid,
    bid: payload.bid,
    eid: payload.eid,
    sid: payload.sid,
    tier: payload.tier,
    iat: payload.iat,
    sig: signature,
  });
}

/**
 * Parses and deserializes a scanned QR code payload string.
 *
 * @param {string} qrRawString
 * @returns {Object|null} Deserialized payload or null if invalid JSON
 */
export function parseQRPayload(qrRawString) {
  try {
    const parsed = JSON.parse(qrRawString);
    if (!parsed.tid || !parsed.sig || !parsed.iat) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}
