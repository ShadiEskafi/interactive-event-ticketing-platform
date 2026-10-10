import { describe, it, expect, beforeAll } from 'vitest';
import { supabase } from '../../src/services/supabaseClient';
import { supabaseTicketingService } from '../../src/services/supabaseTicketingService';

describe('Live Supabase Integration (Production Project)', () => {
  let isLiveConnected = false;

  beforeAll(async () => {
    try {
      const res = await supabase.from('seats').select('id').limit(1);
      isLiveConnected = !res.error && Boolean(res.data);
    } catch {
      isLiveConnected = false;
    }
  });

  it('connects to Supabase and queries 520 seats from PostgreSQL', async () => {
    if (!isLiveConnected) {
      console.warn('[Integration Test] Live Supabase unreachable; skipping test.');
      return;
    }
    const seats = await supabaseTicketingService.getSeatAvailability('evt-symphony-2026');
    expect(seats).toBeDefined();
    expect(seats.length).toBe(520);

    const seatA1 = seats.find((s) => s.id === 'A-1');
    expect(seatA1).toBeDefined();
    expect(seatA1.category).toBe('VIP');
    expect(seatA1.price).toBe(150);
  });

  it('executes atomic reserve_seats RPC and release_seats RPC on PostgreSQL', async () => {
    if (!isLiveConnected) {
      console.warn('[Integration Test] Live Supabase unreachable; skipping test.');
      return;
    }
    const testSeatId = 'A-24';
    const testUserId = 'anon_session_test_integration';

    // 1. Reserve seat via Supabase RPC
    const reserveResult = await supabaseTicketingService.reserveSeats(
      'evt-symphony-2026',
      [testSeatId],
      testUserId,
      120
    );

    expect(reserveResult).toBeDefined();
    expect(reserveResult.success).toBe(true);
    expect(reserveResult.reserved_seat_ids).toContain(testSeatId);

    // Verify seat is now reserved in database
    const { data: seatInDb } = await supabase
      .from('seats')
      .select('status, reserved_by')
      .eq('id', testSeatId)
      .single();

    expect(seatInDb.status).toBe('reserved');
    expect(seatInDb.reserved_by).toBe(testUserId);

    // 2. Release seat via Supabase RPC
    const releaseResult = await supabaseTicketingService.releaseSeats(
      'evt-symphony-2026',
      [testSeatId],
      testUserId
    );

    expect(releaseResult).toBeDefined();
    expect(releaseResult.success).toBe(true);

    // Verify seat is restored to available in database
    const { data: releasedSeat } = await supabase
      .from('seats')
      .select('status, reserved_by')
      .eq('id', testSeatId)
      .single();

    expect(releasedSeat.status).toBe('available');
    expect(releasedSeat.reserved_by).toBeNull();
  });

  it('executes release_expired_seats RPC on PostgreSQL', async () => {
    if (!isLiveConnected) {
      console.warn('[Integration Test] Live Supabase unreachable; skipping test.');
      return;
    }
    const sweepResult = await supabaseTicketingService.releaseExpiredSeats('evt-symphony-2026');
    expect(sweepResult).toBeDefined();
    expect(sweepResult.success).toBe(true);
    expect(typeof sweepResult.released_count).toBe('number');
  });
});
