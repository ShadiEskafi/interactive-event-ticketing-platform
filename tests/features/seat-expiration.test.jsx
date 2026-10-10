import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { EventBookingPage } from '../../src/features/seatmap/EventBookingPage';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';
import { ticketingService } from '../../src/services';
import { LanguageProvider } from '../../src/context';
import { AuthProvider } from '../../src/features/auth';
import { MockAuthService } from '../mocks/mockAuthService';

describe('Server-Side Automatic Seat Expiration & Background Cleanup (RPC & Resiliency)', () => {
  beforeEach(() => {
    mockTicketingService.resetState();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    mockTicketingService.resetState();
    window.sessionStorage.clear();
  });

  it('Test 1: releaseExpiredSeats sweeps expired seat holds and restores them to available', async () => {
    const pastTime = new Date(Date.now() - 30000).toISOString();

    // Setup: Mark Row E seats as reserved with expired timestamps
    mockTicketingService.seats = mockTicketingService.seats.map((seat) => {
      if (seat.id === 'E-5' || seat.id === 'E-6') {
        return {
          ...seat,
          status: 'reserved',
          reservedBy: 'abandoned-session-123',
          reservedUntil: pastTime,
          eventId: 'evt-symphony-2026',
        };
      }
      return seat;
    });

    const result = await ticketingService.releaseExpiredSeats('evt-symphony-2026');

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.released_count).toBe(2);

    const seatE5 = mockTicketingService.seats.find((s) => s.id === 'E-5');
    const seatE6 = mockTicketingService.seats.find((s) => s.id === 'E-6');

    expect(seatE5.status).toBe('available');
    expect(seatE5.reservedBy).toBeNull();
    expect(seatE5.reservedUntil).toBeNull();

    expect(seatE6.status).toBe('available');
    expect(seatE6.reservedBy).toBeNull();
    expect(seatE6.reservedUntil).toBeNull();
  });

  it('Test 2: Active seat holds with reserved_until in the future remain untouched', async () => {
    const futureTime = new Date(Date.now() + 240000).toISOString();
    const pastTime = new Date(Date.now() - 15000).toISOString();

    mockTicketingService.seats = mockTicketingService.seats.map((seat) => {
      if (seat.id === 'E-7') {
        return {
          ...seat,
          status: 'reserved',
          reservedBy: 'active-attendee-user',
          reservedUntil: futureTime,
          eventId: 'evt-symphony-2026',
        };
      }
      if (seat.id === 'E-8') {
        return {
          ...seat,
          status: 'reserved',
          reservedBy: 'stale-user-456',
          reservedUntil: pastTime,
          eventId: 'evt-symphony-2026',
        };
      }
      return seat;
    });

    const result = await ticketingService.releaseExpiredSeats('evt-symphony-2026');

    expect(result.success).toBe(true);
    expect(result.released_count).toBe(1);

    const seatE7 = mockTicketingService.seats.find((s) => s.id === 'E-7');
    const seatE8 = mockTicketingService.seats.find((s) => s.id === 'E-8');

    // E-7 must remain reserved
    expect(seatE7.status).toBe('reserved');
    expect(seatE7.reservedBy).toBe('active-attendee-user');
    expect(seatE7.reservedUntil).toBe(futureTime);

    // E-8 must be released
    expect(seatE8.status).toBe('available');
    expect(seatE8.reservedBy).toBeNull();
    expect(seatE8.reservedUntil).toBeNull();
  });

  it('Test 3: Event-specific scoping (p_event_id) cleans only matching event seats', async () => {
    const pastTime = new Date(Date.now() - 20000).toISOString();

    mockTicketingService.seats = mockTicketingService.seats.map((seat) => {
      if (seat.id === 'E-9') {
        return {
          ...seat,
          status: 'reserved',
          reservedBy: 'user-symphony',
          reservedUntil: pastTime,
          eventId: 'evt-symphony-2026',
        };
      }
      if (seat.id === 'E-10') {
        return {
          ...seat,
          status: 'reserved',
          reservedBy: 'user-cyberpunk',
          reservedUntil: pastTime,
          eventId: 'evt-cyberpunk-2026',
        };
      }
      return seat;
    });

    // Clean only symphony event
    const scopedResult = await ticketingService.releaseExpiredSeats('evt-symphony-2026');
    expect(scopedResult.released_count).toBe(1);

    const seatE9 = mockTicketingService.seats.find((s) => s.id === 'E-9');
    const seatE10 = mockTicketingService.seats.find((s) => s.id === 'E-10');

    expect(seatE9.status).toBe('available');
    expect(seatE10.status).toBe('reserved');

    // Global cleanup (null eventId) cleans all remaining expired seats across events
    const globalResult = await ticketingService.releaseExpiredSeats(null);
    expect(globalResult.released_count).toBe(1);

    const seatE10AfterGlobal = mockTicketingService.seats.find((s) => s.id === 'E-10');
    expect(seatE10AfterGlobal.status).toBe('available');
  });

  it('Test 4: Frontend EventBookingPage calls releaseExpiredSeats on load and recovers stale seats', async () => {
    const pastTime = new Date(Date.now() - 50000).toISOString();

    // Stale seat before mounting
    mockTicketingService.seats = mockTicketingService.seats.map((seat) => {
      if (seat.id === 'E-14') {
        return {
          ...seat,
          status: 'reserved',
          reservedBy: 'abandoned-browser-tab',
          reservedUntil: pastTime,
          eventId: 'evt-symphony-2026',
        };
      }
      return seat;
    });

    const releaseSpy = vi.spyOn(mockTicketingService, 'releaseExpiredSeats');
    const mockAuth = new MockAuthService(null);

    render(
      <AuthProvider authService={mockAuth}>
        <LanguageProvider>
          <EventBookingPage requireAuth={false} eventId="evt-symphony-2026" />
        </LanguageProvider>
      </AuthProvider>
    );

    // Verify spy was invoked on mount
    await waitFor(() => {
      expect(releaseSpy).toHaveBeenCalled();
    });

    // Seat E-14 should now be rendered as available (green #10B981) instead of amber (#F59E0B)
    const seatE14 = await screen.findByTestId('E-14');
    expect(seatE14).toHaveAttribute('fill', '#10B981');

    const dbSeatE14 = mockTicketingService.seats.find((s) => s.id === 'E-14');
    expect(dbSeatE14.status).toBe('available');
  });

  it('Test 5: Realtime listeners are broadcasted to when seats are released by expiration sweep', async () => {
    const pastTime = new Date(Date.now() - 10000).toISOString();
    mockTicketingService.seats = mockTicketingService.seats.map((seat) => {
      if (seat.id === 'E-22') {
        return {
          ...seat,
          status: 'reserved',
          reservedBy: 'stale-user-realtime',
          reservedUntil: pastTime,
          eventId: 'evt-symphony-2026',
        };
      }
      return seat;
    });

    const listener = vi.fn();
    const unsubscribe = mockTicketingService.subscribeToSeatChanges('evt-symphony-2026', listener);

    await ticketingService.releaseExpiredSeats('evt-symphony-2026');

    expect(listener).toHaveBeenCalled();
    const updatedBatch = listener.mock.calls[0][0];
    expect(updatedBatch.some((s) => s.id === 'E-22' && s.status === 'available')).toBe(true);

    unsubscribe();
  });
});
