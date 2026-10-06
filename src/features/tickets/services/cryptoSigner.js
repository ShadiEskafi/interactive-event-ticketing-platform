import { buildCanonicalString, serializeQRPayload } from '../utils/qrPayload';

const DEFAULT_HMAC_SECRET = 'mock-ticketing-secret-key-2026';

/**
 * Native Web Crypto HMAC-SHA256 Signer & Verifier (SPEC-04 / REQ-TICK-04.2)
 * Pure client-side implementation using SubtleCrypto with zero external crypto dependencies.
 */
class CryptoSigner {
  constructor(defaultSecret = DEFAULT_HMAC_SECRET) {
    this.defaultSecret = defaultSecret;
  }

  /**
   * Imports raw secret key into a CryptoKey suitable for HMAC-SHA256
   * @private
   */
  async _getKey(secretKeyString, usages = ['sign', 'verify']) {
    const cryptoSubtle = globalThis.crypto?.subtle;
    if (!cryptoSubtle) {
      throw new Error('Web Crypto API (crypto.subtle) is not supported in this runtime environment.');
    }

    const keyBytes = new TextEncoder().encode(secretKeyString || this.defaultSecret);
    return await cryptoSubtle.importKey(
      'raw',
      keyBytes,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      usages
    );
  }

  /**
   * Signs ticket canonical payload with HMAC-SHA256
   *
   * @param {Object|string} data - Ticket payload object or pre-built canonical string
   * @param {string} [secret] - Secret key (defaults to mock secret)
   * @returns {Promise<{ signature: string, canonicalString: string }>} 64-character lowercase hex digest
   */
  async signTicketPayload(data, secret = this.defaultSecret) {
    const cryptoSubtle = globalThis.crypto?.subtle;
    const canonicalString = typeof data === 'string' ? data : buildCanonicalString(data);
    const dataBytes = new TextEncoder().encode(canonicalString);

    const key = await this._getKey(secret, ['sign']);
    const signatureBuffer = await cryptoSubtle.sign('HMAC', key, dataBytes);

    const signature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    return { signature, canonicalString };
  }

  /**
   * Verifies ticket canonical payload against its HMAC-SHA256 signature
   *
   * @param {Object} payloadWithSig - Payload containing { tid, bid, eid, sid, tier, iat, sig }
   * @param {string} [secret] - Secret key
   * @returns {Promise<boolean>} True if signature matches, false if tampered or invalid
   */
  async verifyTicketPayload(payloadWithSig, secret = this.defaultSecret) {
    if (!payloadWithSig || !payloadWithSig.sig) {
      return false;
    }

    try {
      const { sig, ...dataFields } = payloadWithSig;
      const { signature: expectedSignature } = await this.signTicketPayload(dataFields, secret);
      return expectedSignature.toLowerCase() === sig.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Signs a ticket entity and attaches `qr_signature` and `qr_payload`
   *
   * @param {Object} ticket - Raw ticket entity
   * @param {string} [secret]
   * @returns {Promise<Object>} Augmented ticket entity
   */
  async signTicketRecord(ticket, secret = this.defaultSecret) {
    const iat = ticket.created_at ? Math.floor(new Date(ticket.created_at).getTime() / 1000) : Math.floor(Date.now() / 1000);
    const payload = {
      tid: ticket.id || ticket.ticket_code,
      bid: ticket.booking_id,
      eid: ticket.event_id || '00000000-0000-0000-0000-000000000001',
      sid: ticket.seat_id,
      tier: ticket.tier || ticket.category || 'Standard',
      iat,
    };

    const { signature } = await this.signTicketPayload(payload, secret);
    const qrPayload = serializeQRPayload(payload, signature);

    return {
      ...ticket,
      qr_signature: signature,
      qr_payload: qrPayload,
    };
  }
}

export const cryptoSigner = new CryptoSigner();
export { CryptoSigner };
