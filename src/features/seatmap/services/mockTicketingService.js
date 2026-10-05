import { mockVenueLayout, generateSeats } from '../data/mockVenueLayout';

export class MockTicketingService {
  constructor() {
    this.layout = mockVenueLayout;
    this.seats = generateSeats(mockVenueLayout);
    this.listeners = new Set();
  }

  async getVenueLayout(_venueId) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return this.layout;
  }

  async getSeatAvailability(_eventId) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    return [...this.seats];
  }

  /**
   * Atomic seat reservation simulating the PostgreSQL reserve_seats RPC
   */
  async reserveSeats(eventId, seatIds, userId, holdDurationSeconds = 300) {
    await new Promise((resolve) => setTimeout(resolve, 10));

    const requestedSeats = this.seats.filter((s) => seatIds.includes(s.id));

    // Check if any requested seat is not available (collision check)
    const unavailableSeats = requestedSeats.filter((s) => s.status !== 'available');

    if (unavailableSeats.length > 0 || requestedSeats.length !== seatIds.length) {
      return {
        success: false,
        error_code: 'SEATS_UNAVAILABLE',
        message: 'One or more requested seats are no longer available.',
        unavailable_seat_ids: unavailableSeats.map((s) => s.id),
      };
    }

    const expiresAt = new Date(Date.now() + holdDurationSeconds * 1000).toISOString();

    // Atomic update
    const updatedSeats = [];
    this.seats = this.seats.map((seat) => {
      if (seatIds.includes(seat.id)) {
        const updated = {
          ...seat,
          status: 'reserved',
          reservedBy: userId,
          reservedUntil: expiresAt,
        };
        updatedSeats.push(updated);
        return updated;
      }
      return seat;
    });

    // Notify realtime listeners
    this.notifySeatListeners(updatedSeats);

    return {
      success: true,
      reserved_seat_ids: seatIds,
      reserved_until: expiresAt,
    };
  }

  /**
   * Release reserved seats back to available simulating release_seats RPC
   */
  async releaseSeats(eventId, seatIds, userId) {
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updatedSeats = [];
    this.seats = this.seats.map((seat) => {
      if (seatIds.includes(seat.id) && seat.status === 'reserved') {
        const updated = {
          ...seat,
          status: 'available',
          reservedBy: null,
          reservedUntil: null,
        };
        updatedSeats.push(updated);
        return updated;
      }
      return seat;
    });

    this.notifySeatListeners(updatedSeats);

    return {
      success: true,
      released_seat_ids: seatIds,
    };
  }

  /**
   * Realtime change listener subscription simulating Supabase Realtime channel
   */
  subscribeToSeatChanges(_eventId, callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifySeatListeners(updatedSeats) {
    this.listeners.forEach((callback) => {
      try {
        callback(updatedSeats);
      } catch (err) {
        // Safe listener failure isolation
      }
    });
  }

  /**
   * Helper to reset test mock state
   */
  resetState() {
    this.seats = generateSeats(mockVenueLayout);
    this.listeners.clear();
  }
}

export const mockTicketingService = new MockTicketingService();
