import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { adminService } from '../../src/features/admin/services/adminService';
import {
  mockTicketingService,
  EVENT_SEATS_STORAGE_KEY_PREFIX,
} from '../../src/features/seatmap/services/mockTicketingService';
import { EventBookingPage } from '../../src/features/seatmap/EventBookingPage';
import { AuthProvider } from '../../src/features/auth';
import { LanguageProvider } from '../../src/context';
import { MockAuthService } from '../mocks/mockAuthService';

describe('DB Persistence & 520-Seat Seeding Engine for New Events', () => {
  beforeEach(() => {
    adminService.resetState();
    mockTicketingService.resetState();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
  });

  afterEach(() => {
    adminService.resetState();
    mockTicketingService.resetState();
    if (typeof window !== 'undefined') {
      window.localStorage.clear();
      window.sessionStorage.clear();
    }
    vi.restoreAllMocks();
  });

  it('Test 1: Creating a new custom event via adminService automatically generates 520 seats with tier pricing', () => {
    const newEvent = adminService.createEvent({
      title: 'Neon Electronic Music Festival',
      category: 'Festivals',
      vipPrice: 195,
      regularPrice: 95,
      balconyPrice: 55,
      date: 'Friday, Dec 18, 2026 • 9:00 PM',
      venue: 'Grand Symphony Hall • Auditorium',
    });

    // 1. Event metadata validation
    expect(newEvent).toBeDefined();
    expect(newEvent.id).toMatch(/^evt-custom-/);
    expect(newEvent.capacity).toBe('520 Seats');
    expect(newEvent.vipPrice).toBe(195);
    expect(newEvent.regularPrice).toBe(95);
    expect(newEvent.balconyPrice).toBe(55);
    expect(newEvent.tierPricing).toEqual({ vip: 195, regular: 95, balcony: 55 });

    // 2. Event is persisted in ticketcraft_custom_events
    const rawEvents = window.localStorage.getItem('ticketcraft_custom_events');
    expect(rawEvents).toBeTruthy();
    const storedEvents = JSON.parse(rawEvents);
    expect(storedEvents.some((e) => e.id === newEvent.id)).toBe(true);

    // 3. Exactly 520 seats are seeded into storage under ticketcraft_seats_${eventId}
    const rawSeats = window.localStorage.getItem(`${EVENT_SEATS_STORAGE_KEY_PREFIX}${newEvent.id}`);
    expect(rawSeats).toBeTruthy();
    const storedSeats = JSON.parse(rawSeats);
    expect(storedSeats).toHaveLength(520);

    // 4. Verify tier pricing breakdown across all sections
    const vipSeats = storedSeats.filter((s) => s.category === 'VIP');
    const regularSeats = storedSeats.filter((s) => s.category === 'Regular');
    const balconySeats = storedSeats.filter((s) => s.category === 'Balcony');

    expect(vipSeats).toHaveLength(120); // Rows A-E: 5 * 24 = 120
    expect(regularSeats).toHaveLength(240); // Rows F-M: 8 * 30 = 240
    expect(balconySeats).toHaveLength(160); // Rows N-R: 5 * 32 = 160

    vipSeats.forEach((s) => {
      expect(s.price).toBe(195);
      expect(s.status).toBe('available');
      expect(s.eventId).toBe(newEvent.id);
    });

    regularSeats.forEach((s) => {
      expect(s.price).toBe(95);
      expect(s.status).toBe('available');
      expect(s.eventId).toBe(newEvent.id);
    });

    balconySeats.forEach((s) => {
      expect(s.price).toBe(55);
      expect(s.status).toBe('available');
      expect(s.eventId).toBe(newEvent.id);
    });

    // 5. In-memory cache is populated
    const cachedSeats = mockTicketingService.getSeatsForEvent(newEvent.id);
    expect(cachedSeats).toHaveLength(520);
  });

  it('Test 2: Booking page / getSeatAvailability returns all 520 seats with the event configured tier pricing and renders map', async () => {
    const festivalEvent = adminService.createEvent({
      title: 'Cosmic Jazz Symphony 2026',
      vipPrice: 220,
      regularPrice: 110,
      balconyPrice: 60,
      date: 'Saturday, Dec 20, 2026 • 7:30 PM',
      venue: 'Metropolitan Amphitheater',
    });

    // 1. getSeatAvailability returns all 520 seats with exact tier pricing
    const availableSeats = await mockTicketingService.getSeatAvailability(festivalEvent.id);
    expect(availableSeats).toHaveLength(520);

    const seatA1 = availableSeats.find((s) => s.id === 'A-1');
    const seatF1 = availableSeats.find((s) => s.id === 'F-1');
    const seatN1 = availableSeats.find((s) => s.id === 'N-1');

    expect(seatA1.price).toBe(220);
    expect(seatA1.category).toBe('VIP');
    expect(seatA1.status).toBe('available');

    expect(seatF1.price).toBe(110);
    expect(seatF1.category).toBe('Regular');
    expect(seatF1.status).toBe('available');

    expect(seatN1.price).toBe(60);
    expect(seatN1.category).toBe('Balcony');
    expect(seatN1.status).toBe('available');

    // 2. Render EventBookingPage for the custom event
    const mockAuth = new MockAuthService(null);
    render(
      <AuthProvider authService={mockAuth}>
        <LanguageProvider>
          <EventBookingPage eventId={festivalEvent.id} requireAuth={false} />
        </LanguageProvider>
      </AuthProvider>
    );

    // Verify event title rendered from event data
    expect(await screen.findByText('Cosmic Jazz Symphony 2026')).toBeInTheDocument();

    // Verify all 520 SVG seats rendered with zero blank screens
    const renderedSeats = await screen.findAllByRole('gridcell');
    expect(renderedSeats).toHaveLength(520);

    // 3. Select VIP seat A-1 and Regular seat F-1 and verify cart reflects event pricing
    const renderedA1 = await screen.findByTestId('A-1');
    fireEvent.click(renderedA1);

    await waitFor(() => {
      expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('1');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$220.00');
    });

    const renderedF1 = await screen.findByTestId('F-1');
    fireEvent.click(renderedF1);

    await waitFor(() => {
      expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$330.00');
    });
  });

  it('Test 3: Reserving seats and flushing expired holds updates the event seat inventory in memory and storage', async () => {
    const operaEvent = adminService.createEvent({
      title: 'Royal Opera Gala',
      vipPrice: 250,
      regularPrice: 120,
      balconyPrice: 70,
    });

    // 1. Reserve seats A-5 and A-6
    const reserveResult = await mockTicketingService.reserveSeats(
      operaEvent.id,
      ['A-5', 'A-6'],
      'user-opera-attendee',
      300
    );

    expect(reserveResult.success).toBe(true);
    expect(reserveResult.reserved_seat_ids).toEqual(['A-5', 'A-6']);

    // Check inventory in memory
    const seatsAfterReserve = await mockTicketingService.getSeatAvailability(operaEvent.id);
    const seatA5 = seatsAfterReserve.find((s) => s.id === 'A-5');
    const seatA6 = seatsAfterReserve.find((s) => s.id === 'A-6');

    expect(seatA5.status).toBe('reserved');
    expect(seatA5.reservedBy).toBe('user-opera-attendee');
    expect(seatA6.status).toBe('reserved');
    expect(seatA6.reservedBy).toBe('user-opera-attendee');

    // Check inventory in localStorage
    const storedAfterReserve = JSON.parse(
      window.localStorage.getItem(`${EVENT_SEATS_STORAGE_KEY_PREFIX}${operaEvent.id}`)
    );
    expect(storedAfterReserve.find((s) => s.id === 'A-5').status).toBe('reserved');
    expect(storedAfterReserve.find((s) => s.id === 'A-6').status).toBe('reserved');

    // Concurrency stats reflect held seats
    const stats = adminService.getConcurrencyStats(operaEvent.id);
    expect(stats.reserved).toBe(2);
    expect(stats.available).toBe(518);
    expect(stats.total).toBe(520);

    // 2. Simulate expired hold by winding back reservedUntil
    const pastTime = new Date(Date.now() - 10000).toISOString();
    const currentSeats = mockTicketingService.getSeatsForEvent(operaEvent.id);
    const expiredSeats = currentSeats.map((s) => {
      if (s.id === 'A-5' || s.id === 'A-6') {
        return {
          ...s,
          reservedUntil: pastTime,
        };
      }
      return s;
    });
    mockTicketingService._saveEventSeats(operaEvent.id, expiredSeats);

    // 3. Flush expired holds via adminService
    const flushResult = await adminService.flushExpiredSeatHolds(operaEvent.id);
    expect(flushResult.success).toBe(true);
    expect(flushResult.released_count).toBe(2);

    // 4. Verify seats reverted to 'available' in memory and localStorage
    const seatsAfterFlush = await mockTicketingService.getSeatAvailability(operaEvent.id);
    const flushedA5 = seatsAfterFlush.find((s) => s.id === 'A-5');
    const flushedA6 = seatsAfterFlush.find((s) => s.id === 'A-6');

    expect(flushedA5.status).toBe('available');
    expect(flushedA5.reservedBy).toBeNull();
    expect(flushedA5.reservedUntil).toBeNull();

    expect(flushedA6.status).toBe('available');
    expect(flushedA6.reservedBy).toBeNull();
    expect(flushedA6.reservedUntil).toBeNull();

    const storedAfterFlush = JSON.parse(
      window.localStorage.getItem(`${EVENT_SEATS_STORAGE_KEY_PREFIX}${operaEvent.id}`)
    );
    expect(storedAfterFlush.find((s) => s.id === 'A-5').status).toBe('available');
    expect(storedAfterFlush.find((s) => s.id === 'A-6').status).toBe('available');

    const statsAfterFlush = adminService.getConcurrencyStats(operaEvent.id);
    expect(statsAfterFlush.reserved).toBe(0);
    expect(statsAfterFlush.available).toBe(520);
  });
});
