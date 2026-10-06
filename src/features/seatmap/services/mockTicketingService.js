import { mockVenueLayout, generateSeats } from '../data/mockVenueLayout';
import { cryptoSigner } from '../../tickets/services/cryptoSigner';
import { parseQRPayload } from '../../tickets/utils/qrPayload';
import { generateTicketCode, generateBookingId } from '../../tickets/utils/ticketCodeGenerator';

export class MockTicketingService {
  constructor() {
    this.layout = mockVenueLayout;
    this.seats = generateSeats(mockVenueLayout);
    this.listeners = new Set();
    this.bookings = [];
    this.tickets = [];
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
  async releaseSeats(eventId, seatIds, _userId) {
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
   * Transfer hold ownership from an anonymous session ID to an authenticated user ID upon login
   */
  async transferHold(eventId, seatIds, authenticatedUserId, anonymousSessionId) {
    await new Promise((resolve) => setTimeout(resolve, 5));

    const updatedSeats = [];
    this.seats = this.seats.map((seat) => {
      if (
        seatIds.includes(seat.id) &&
        seat.status === 'reserved' &&
        (!seat.reservedBy || seat.reservedBy === anonymousSessionId)
      ) {
        const updated = {
          ...seat,
          reservedBy: authenticatedUserId,
        };
        updatedSeats.push(updated);
        return updated;
      }
      return seat;
    });

    if (updatedSeats.length > 0) {
      this.notifySeatListeners(updatedSeats);
    }

    return {
      success: true,
      transferred_seat_ids: updatedSeats.map((s) => s.id),
      new_owner: authenticatedUserId,
    };
  }

  /**
   * Finalizes booking, transitions seats permanently to 'sold' (#9CA3AF),
   * creates booking and signed tickets records, and broadcasts updates.
   */
  async confirmBooking({
    eventId = 'evt-symphony-2026',
    seatIds = [],
    userId,
    attendeeName = 'Valued Attendee',
    attendeeEmail = 'attendee@example.com',
    paymentDetails = {},
  }) {
    await new Promise((resolve) => setTimeout(resolve, 15));

    // Retrieve requested seats
    const bookedSeats = this.seats.filter((s) => seatIds.includes(s.id));
    if (bookedSeats.length === 0 || bookedSeats.length !== seatIds.length) {
      return {
        success: false,
        error_code: 'SEATS_NOT_FOUND',
        message: 'Could not find one or more selected seats.',
      };
    }

    const bookingId = generateBookingId();
    const totalAmount = bookedSeats.reduce((sum, s) => sum + (s.price || 0), 0);
    const nowISO = new Date().toISOString();

    // Mark seats as permanently 'sold'
    const updatedSeats = [];
    this.seats = this.seats.map((seat) => {
      if (seatIds.includes(seat.id)) {
        const updated = {
          ...seat,
          status: 'sold',
          reservedBy: null,
          reservedUntil: null,
          bookedBy: userId,
        };
        updatedSeats.push(updated);
        return updated;
      }
      return seat;
    });

    // Create unique ticket records with HMAC-SHA256 signatures
    const issuedTickets = [];
    for (const seat of bookedSeats) {
      const ticketCode = generateTicketCode();
      const rawTicket = {
        id: `tkt_${Math.random().toString(36).substring(2, 10)}`,
        booking_id: bookingId,
        event_id: eventId,
        seat_id: seat.id,
        user_id: userId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        ticket_code: ticketCode,
        category: seat.category || 'VIP',
        tier: seat.category || 'VIP',
        seat_number: seat.seatNumber,
        row_label: seat.rowLabel,
        price: seat.price,
        is_used: false,
        scanned_at: null,
        created_at: nowISO,
        event_title: 'Grand Symphony Concert',
        event_date: 'Saturday, Nov 14, 2026 • 8:00 PM',
        venue_name: 'Grand Symphony Hall, Auditorium',
      };

      const signedTicket = await cryptoSigner.signTicketRecord(rawTicket);
      issuedTickets.push(signedTicket);
      this.tickets.push(signedTicket);
    }

    const booking = {
      id: bookingId,
      event_id: eventId,
      user_id: userId,
      attendee_name: attendeeName,
      attendee_email: attendeeEmail,
      status: 'confirmed',
      total_amount: totalAmount,
      created_at: nowISO,
      payment_details: paymentDetails,
      seats: bookedSeats,
      tickets: issuedTickets,
    };
    this.bookings.push(booking);

    // Notify realtime listeners so seats turn Gray (#9CA3AF) on other connected screens
    this.notifySeatListeners(updatedSeats);

    return {
      success: true,
      status: 'confirmed',
      bookingId,
      booking,
      tickets: issuedTickets,
      seats: updatedSeats,
    };
  }

  /**
   * Retrieves all confirmed tickets for a given user
   */
  async getUserTickets(userId) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (!userId) return [];
    return this.tickets.filter((t) => t.user_id === userId);
  }

  /**
   * Simulates gate scanner validating a ticket QR signature and idempotency
   */
  async validateTicketScan(ticketCode, signature) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    const ticket = this.tickets.find((t) => t.ticket_code === ticketCode);
    if (!ticket) {
      return {
        valid: false,
        status: 'TICKET_NOT_FOUND',
        message: 'No ticket record found with this code.',
      };
    }

    const testSig = signature || ticket.qr_signature;
    const parsed = parseQRPayload(ticket.qr_payload);
    const dataFields = parsed ? {
      tid: parsed.tid,
      bid: parsed.bid,
      eid: parsed.eid,
      sid: parsed.sid,
      tier: parsed.tier,
      iat: parsed.iat,
    } : {
      tid: ticket.id,
      bid: ticket.booking_id,
      eid: ticket.event_id,
      sid: ticket.seat_id,
      tier: ticket.tier,
      iat: Math.floor(new Date(ticket.created_at).getTime() / 1000),
    };

    const isValidSignature = await cryptoSigner.verifyTicketPayload({ ...dataFields, sig: testSig });

    if (!isValidSignature) {
      return {
        valid: false,
        status: 'INVALID_SIGNATURE',
        message: 'Cryptographic signature mismatch.',
      };
    }

    if (ticket.is_used) {
      return {
        valid: false,
        status: 'ALREADY_USED',
        message: `Ticket already scanned at ${ticket.scanned_at}`,
        ticket,
      };
    }

    // Grant entry and set used
    ticket.is_used = true;
    ticket.scanned_at = new Date().toISOString();

    return {
      valid: true,
      status: 'ENTRY_GRANTED',
      scanned_at: ticket.scanned_at,
      ticket,
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
      } catch {
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
    this.bookings = [];
    this.tickets = [];
  }
}

export const mockTicketingService = new MockTicketingService();

