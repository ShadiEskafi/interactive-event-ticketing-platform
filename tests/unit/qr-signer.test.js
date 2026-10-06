import { describe, it, expect } from 'vitest';
import { cryptoSigner } from '../../src/features/tickets/services/cryptoSigner';
import { buildCanonicalString, parseQRPayload } from '../../src/features/tickets/utils/qrPayload';

describe('Web Crypto HMAC-SHA256 Signer (SPEC-04 / REQ-TICK-04.2)', () => {
  const mockTicketData = {
    tid: 'tkt_98765432-abcd',
    bid: 'bk_12345678-efgh',
    eid: '00000000-0000-0000-0000-000000000001',
    sid: 'seat_A12',
    tier: 'VIP',
    iat: 1790998800,
  };

  it('builds canonical string with deterministic delimiter format', () => {
    const canonical = buildCanonicalString(mockTicketData);
    expect(canonical).toBe('tkt_98765432-abcd:bk_12345678-efgh:00000000-0000-0000-0000-000000000001:seat_A12:VIP:1790998800');
  });

  it('generates a 64-character lowercase hexadecimal HMAC-SHA256 signature', async () => {
    const { signature } = await cryptoSigner.signTicketPayload(mockTicketData);
    expect(signature).toBeDefined();
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces deterministic signatures for identical input and secret', async () => {
    const res1 = await cryptoSigner.signTicketPayload(mockTicketData, 'my-test-secret');
    const res2 = await cryptoSigner.signTicketPayload(mockTicketData, 'my-test-secret');
    expect(res1.signature).toBe(res2.signature);
  });

  it('verifies valid payload successfully returns true', async () => {
    const { signature } = await cryptoSigner.signTicketPayload(mockTicketData);
    const payloadWithSig = {
      ...mockTicketData,
      sig: signature,
    };

    const isValid = await cryptoSigner.verifyTicketPayload(payloadWithSig);
    expect(isValid).toBe(true);
  });

  it('detects tampering in tier category and rejects verification', async () => {
    const { signature } = await cryptoSigner.signTicketPayload(mockTicketData);
    const tamperedPayload = {
      ...mockTicketData,
      tier: 'Regular', // Tampered!
      sig: signature,
    };

    const isValid = await cryptoSigner.verifyTicketPayload(tamperedPayload);
    expect(isValid).toBe(false);
  });

  it('detects tampering in seat ID and rejects verification', async () => {
    const { signature } = await cryptoSigner.signTicketPayload(mockTicketData);
    const tamperedPayload = {
      ...mockTicketData,
      sid: 'seat_A01', // Altered seat!
      sig: signature,
    };

    const isValid = await cryptoSigner.verifyTicketPayload(tamperedPayload);
    expect(isValid).toBe(false);
  });

  it('signs ticket entity and embeds valid parseable qr_payload', async () => {
    const ticketRecord = {
      id: 'tkt-test-1',
      booking_id: 'bk-test-1',
      event_id: 'evt-symphony-2026',
      seat_id: 'A-10',
      category: 'VIP',
      ticket_code: 'TKT-10029',
      created_at: new Date().toISOString(),
    };

    const signed = await cryptoSigner.signTicketRecord(ticketRecord);
    expect(signed.qr_signature).toMatch(/^[a-f0-9]{64}$/);
    expect(signed.qr_payload).toBeDefined();

    const parsed = parseQRPayload(signed.qr_payload);
    expect(parsed).not.toBeNull();
    expect(parsed.tid).toBe('tkt-test-1');
    expect(parsed.sig).toBe(signed.qr_signature);

    const verified = await cryptoSigner.verifyTicketPayload(parsed);
    expect(verified).toBe(true);
  });
});
