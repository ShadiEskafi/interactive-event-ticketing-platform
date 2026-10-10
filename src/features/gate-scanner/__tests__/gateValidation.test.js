import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GateValidationService } from '../services/gateValidationService';
import { MockTicketingService } from '../../seatmap/services/mockTicketingService';
import { offlineStorage } from '../services/offlineStorage';

describe('PWA Gate Scanner Validation Engine (FEAT-GATE-SCANNER-05)', () => {
  let mockService;
  let validationService;
  let testTicket;
  let validQRPayloadString;

  beforeEach(async () => {
    await offlineStorage.clearAll();
    mockService = new MockTicketingService();
    validationService = new GateValidationService({
      primaryService: mockService,
      mockService: mockService,
      useMock: true,
    });

    // 1. Prepare an issued ticket in mockService
    const reserveRes = await mockService.reserveSeats('evt-symphony-2026', ['A-1'], 'user-attendee-01', 300);
    expect(reserveRes.success).toBe(true);

    const bookingRes = await mockService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['A-1'],
      userId: 'user-attendee-01',
      attendeeName: 'Jane Doe',
      attendeeEmail: 'jane.doe@example.com',
    });
    expect(bookingRes.success).toBe(true);
    expect(bookingRes.tickets.length).toBe(1);

    testTicket = bookingRes.tickets[0];
    validQRPayloadString = testTicket.qr_payload;
  });

  it('Scenario 1: Valid scan verifies signature, claims seat, and returns metadata within <300ms', async () => {
    const startTime = performance.now();

    const result = await validationService.validateTicket({
      rawScan: validQRPayloadString,
      eventId: 'evt-symphony-2026',
      gateName: 'Gate A (North Entrance)',
    });

    const elapsed = performance.now() - startTime;

    expect(elapsed).toBeLessThan(300);
    expect(result).toBeDefined();
    expect(result.valid).toBe(true);
    expect(result.status).toBe('ENTRY_GRANTED');
    expect(result.ticket_code).toBe(testTicket.ticket_code);
    expect(result.attendee_name).toBe('Jane Doe');
    expect(result.gate_name).toBe('Gate A (North Entrance)');
    expect(result.scanned_at).toBeDefined();
    expect(result.isOffline).toBe(false);
  });

  it('Scenario 2: Duplicate scan rejects with ALREADY_USED and original scan timestamp', async () => {
    // First scan succeeds
    const firstScan = await validationService.validateTicket({
      rawScan: validQRPayloadString,
      eventId: 'evt-symphony-2026',
      gateName: 'Gate A',
    });
    expect(firstScan.valid).toBe(true);
    expect(firstScan.status).toBe('ENTRY_GRANTED');
    const firstScanTime = firstScan.scanned_at;

    // Second scan at another gate (Gate B) attempts entry
    const duplicateScan = await validationService.validateTicket({
      rawScan: validQRPayloadString,
      eventId: 'evt-symphony-2026',
      gateName: 'Gate B',
    });

    expect(duplicateScan.valid).toBe(false);
    expect(duplicateScan.status).toBe('ALREADY_USED');
    expect(duplicateScan.message).toContain('Ticket already scanned');
    expect(duplicateScan.scanned_at).toBe(firstScanTime);
    expect(duplicateScan.gate_name).toBe('Gate A');
  });

  it('Scenario 3: Tampered payload rejects with INVALID_SIGNATURE', async () => {
    const tamperedPayload = JSON.parse(validQRPayloadString);
    // Attacker modifies tier from Regular to VIP or alters signature
    tamperedPayload.sig = 'ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const tamperedString = JSON.stringify(tamperedPayload);

    const result = await validationService.validateTicket({
      rawScan: tamperedString,
      eventId: 'evt-symphony-2026',
      gateName: 'Gate A',
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe('INVALID_SIGNATURE');
    expect(result.message).toContain('signature mismatch');
  });

  it('Scenario 4: Rejects ticket if event ID does not match current gate event (EVENT_MISMATCH)', async () => {
    const result = await validationService.validateTicket({
      rawScan: validQRPayloadString,
      eventId: 'different-concert-2026',
      gateName: 'Gate A',
    });

    expect(result.valid).toBe(false);
    expect(result.status).toBe('EVENT_MISMATCH');
    expect(result.message).toContain('different event');
  });

  it('Scenario 5: Manual code input functions identically to camera scanning', async () => {
    // Manual entry passes plain ticket code (e.g., TKT-10029)
    const result = await validationService.validateTicket({
      rawScan: testTicket.ticket_code,
      eventId: 'evt-symphony-2026',
      gateName: 'Turnstile 02',
    });

    expect(result.valid).toBe(true);
    expect(result.status).toBe('ENTRY_GRANTED');
    expect(result.ticket_code).toBe(testTicket.ticket_code);
    expect(result.attendee_name).toBe('Jane Doe');
    expect(result.gate_name).toBe('Turnstile 02');
  });

  it('Scenario 6: Graceful offline fallback validates cryptographic HMAC and enqueues sync item', async () => {
    // Mock navigator.onLine as false
    const originalNavigator = globalThis.navigator;
    vi.stubGlobal('navigator', {
      ...originalNavigator,
      onLine: false,
    });

    // Cache ticket locally before disconnect
    await offlineStorage.cacheTickets([
      {
        id: testTicket.id,
        ticket_code: testTicket.ticket_code,
        qr_signature: testTicket.qr_signature,
        is_used: false,
        attendee_name: 'Jane Doe',
        tier: 'VIP',
        section: 'Orchestra',
        row_label: 'A',
        seat_number: 1,
      },
    ]);

    const result = await validationService.validateTicket({
      rawScan: validQRPayloadString,
      eventId: 'evt-symphony-2026',
      gateName: 'Offline Gate X',
    });

    expect(result.valid).toBe(true);
    expect(result.isOffline).toBe(true);
    expect(result.offlineWarning).toBe('Offline Mode - Visual ID Verification Advised');
    expect(result.status).toBe('ENTRY_GRANTED');

    // Verify scan was enqueued in offline queue
    const queue = await offlineStorage.getPendingScans();
    expect(queue.length).toBeGreaterThanOrEqual(1);
    const queuedItem = queue.find((q) => q.ticket_code === testTicket.ticket_code);
    expect(queuedItem).toBeDefined();
    expect(queuedItem.gate_name).toBe('Offline Gate X');

    // Second scan while offline should be blocked locally as ALREADY_USED
    const duplicateOffline = await validationService.validateTicket({
      rawScan: validQRPayloadString,
      eventId: 'evt-symphony-2026',
      gateName: 'Offline Gate X',
    });
    expect(duplicateOffline.valid).toBe(false);
    expect(duplicateOffline.status).toBe('ALREADY_USED');

    vi.unstubAllGlobals();
  });
});
