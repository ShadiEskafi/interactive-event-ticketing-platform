import { mockVenueLayout, generateSeats } from '../data/mockVenueLayout';
import { cryptoSigner } from '../../tickets/services/cryptoSigner';
import { parseQRPayload } from '../../tickets/utils/qrPayload';
import { generateTicketCode, generateBookingId } from '../../tickets/utils/ticketCodeGenerator';

export const MOCK_TICKETS_STORAGE_KEY = 'ticketcraft_mock_tickets';
export const MOCK_BOOKINGS_STORAGE_KEY = 'ticketcraft_mock_bookings';

/**
 * Normalizes ticket object to predictable model for UI consumers
 */
export function normalizeTicket(t) {
  if (!t) return null;
  const seatId = t.seat_id || t.id || '';
  const seatParts = typeof seatId === 'string' && seatId.includes('-') ? seatId.split('-') : [];

  return {
    id: t.id,
    ticket_code: t.ticket_code,
    booking_id: t.booking_id,
    event_id: t.event_id || 'evt-symphony-2026',
    seat_id: seatId,
    user_id: t.user_id || null,
    anonymous_session_id:
      t.anonymous_session_id ||
      (typeof t.user_id === 'string' && t.user_id.startsWith('anon_') ? t.user_id : null),
    row_label: t.row_label || (seatParts.length > 0 ? seatParts[0] : 'A'),
    seat_number: t.seat_number ?? (seatParts.length > 1 ? seatParts[1] : 1),
    tier: t.tier || t.category || 'VIP',
    category: t.category || t.tier || 'VIP',
    price: typeof t.price === 'number' ? t.price : parseFloat(t.price || 150),
    attendee_name: t.attendee_name || 'Valued Attendee',
    attendee_email: t.attendee_email || 'attendee@example.com',
    event_title: t.event_title || 'Grand Symphony Concert',
    event_date: t.event_date || 'Saturday, Nov 14, 2026 • 8:00 PM',
    venue_name: t.venue_name || 'Grand Symphony Hall, Auditorium',
    qr_signature: t.qr_signature,
    qr_payload: t.qr_payload,
    is_used: Boolean(t.is_used),
    scanned_at: t.scanned_at || null,
    created_at: t.created_at || new Date().toISOString(),
  };
}

export class MockTicketingService {
  constructor() {
    this.layout = mockVenueLayout;
    this.seats = generateSeats(mockVenueLayout);
    this.listeners = new Set();
    this.bookings = [];
    this.tickets = [];
    this._loadFromStorage();
  }

  _loadFromStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      const storedTickets = window.localStorage.getItem(MOCK_TICKETS_STORAGE_KEY);
      if (storedTickets) {
        const parsed = JSON.parse(storedTickets);
        if (Array.isArray(parsed)) {
          const map = new Map();
          this.tickets.forEach((t) => map.set(t.id || t.ticket_code, t));
          parsed.forEach((t) => map.set(t.id || t.ticket_code, t));
          this.tickets = Array.from(map.values());
        }
      }

      const storedBookings = window.localStorage.getItem(MOCK_BOOKINGS_STORAGE_KEY);
      if (storedBookings) {
        const parsed = JSON.parse(storedBookings);
        if (Array.isArray(parsed)) {
          const map = new Map();
          this.bookings.forEach((b) => map.set(b.id, b));
          parsed.forEach((b) => map.set(b.id, b));
          this.bookings = Array.from(map.values());
        }
      }
    } catch {
      // Safe storage fallback
    }
  }

  _saveToStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    try {
      window.localStorage.setItem(MOCK_TICKETS_STORAGE_KEY, JSON.stringify(this.tickets));
      window.localStorage.setItem(MOCK_BOOKINGS_STORAGE_KEY, JSON.stringify(this.bookings));
    } catch {
      // Safe storage quota fallback
    }
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
          eventId: eventId || seat.eventId || 'evt-symphony-2026',
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
   * Release expired seat holds simulating PostgreSQL release_expired_seats RPC.
   * Scans in-memory seats, finds any seat where status === 'reserved' and reservedUntil <= now,
   * resets them to 'available', reservedBy = null, reservedUntil = null,
   * notifies realtime listeners, and returns count of released seats.
   */
  async releaseExpiredSeats(eventId = null) {
    await new Promise((resolve) => setTimeout(resolve, 5));

    const now = Date.now();
    const updatedSeats = [];

    this.seats = this.seats.map((seat) => {
      const isReserved = seat.status === 'reserved';
      const isExpired = seat.reservedUntil && new Date(seat.reservedUntil).getTime() <= now;
      const isTargetEvent = !eventId || !seat.eventId || seat.eventId === eventId;

      if (isReserved && isExpired && isTargetEvent) {
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

    if (updatedSeats.length > 0) {
      this.notifySeatListeners(updatedSeats);
    }

    return {
      success: true,
      released_count: updatedSeats.length,
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

    // Also transfer tickets/bookings if any existed for this anon session
    if (anonymousSessionId && authenticatedUserId) {
      await this.claimTickets(authenticatedUserId, anonymousSessionId);
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
    this._loadFromStorage();

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

    const storedAnonId =
      typeof window !== 'undefined'
        ? window.localStorage?.getItem('ticketcraft_anon_session_id') ||
          window.sessionStorage?.getItem('ticketcraft_anon_session_id')
        : null;
    const effectiveUserId = userId || storedAnonId || 'anon_guest';
    const anonSessionId =
      (typeof effectiveUserId === 'string' && effectiveUserId.startsWith('anon_'))
        ? effectiveUserId
        : storedAnonId;

    if (typeof window !== 'undefined' && anonSessionId) {
      try {
        window.localStorage?.setItem('ticketcraft_anon_session_id', anonSessionId);
        window.sessionStorage?.setItem('ticketcraft_anon_session_id', anonSessionId);
      } catch {
        // Safe fallback
      }
    }

    // Mark seats as permanently 'sold'
    const updatedSeats = [];
    this.seats = this.seats.map((seat) => {
      if (seatIds.includes(seat.id)) {
        const updated = {
          ...seat,
          status: 'sold',
          reservedBy: null,
          reservedUntil: null,
          bookedBy: effectiveUserId,
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
        user_id: effectiveUserId,
        anonymous_session_id: anonSessionId,
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
      user_id: effectiveUserId,
      anonymous_session_id: anonSessionId,
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
    this._saveToStorage();

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
   * Retrieves all confirmed tickets for a given user.
   * Hydrates from localStorage, handles anonymous session mapping and ticket claims.
   */
  async getUserTickets(userId) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    this._loadFromStorage();

    const storedAnonId =
      typeof window !== 'undefined'
        ? window.localStorage?.getItem('ticketcraft_anon_session_id') ||
          window.sessionStorage?.getItem('ticketcraft_anon_session_id')
        : null;

    const targetUserId = userId || storedAnonId;
    if (!targetUserId) return [];

    // If an authenticated userId is provided and differs from stored anonymous session ID,
    // automatically claim any anonymous tickets previously issued
    if (userId && storedAnonId && userId !== storedAnonId) {
      let claimedAny = false;
      this.tickets = this.tickets.map((t) => {
        if (
          t.user_id === storedAnonId ||
          t.anonymous_session_id === storedAnonId
        ) {
          claimedAny = true;
          return {
            ...t,
            user_id: userId,
          };
        }
        return t;
      });

      this.bookings = this.bookings.map((b) => {
        if (b.user_id === storedAnonId || b.anonymous_session_id === storedAnonId) {
          claimedAny = true;
          return { ...b, user_id: userId };
        }
        return b;
      });

      if (claimedAny) {
        this._saveToStorage();
      }
    }

    const matchedTickets = this.tickets.filter((t) => {
      if (t.user_id === targetUserId) return true;
      if (t.anonymous_session_id === targetUserId) return true;
      if (userId && (t.user_id === storedAnonId || t.anonymous_session_id === storedAnonId)) {
        return true;
      }
      return false;
    });

    return matchedTickets.map(normalizeTicket);
  }

  /**
   * Claims tickets issued to an anonymous session identifier, binding them to an authenticated user ID
   */
  async claimTickets(authenticatedUserId, anonymousSessionId) {
    await new Promise((resolve) => setTimeout(resolve, 5));
    if (!authenticatedUserId || !anonymousSessionId) {
      return { success: false, claimed_count: 0 };
    }

    this._loadFromStorage();
    let claimedCount = 0;
    this.tickets = this.tickets.map((t) => {
      if (t.user_id === anonymousSessionId || t.anonymous_session_id === anonymousSessionId) {
        claimedCount++;
        return { ...t, user_id: authenticatedUserId };
      }
      return t;
    });

    this.bookings = this.bookings.map((b) => {
      if (b.user_id === anonymousSessionId || b.anonymous_session_id === anonymousSessionId) {
        return { ...b, user_id: authenticatedUserId };
      }
      return b;
    });

    if (claimedCount > 0) {
      this._saveToStorage();
    }

    return {
      success: true,
      claimed_count: claimedCount,
    };
  }

  /**
   * Atomically validates and claims a ticket for entry (simulating validate_and_claim_ticket RPC)
   */
  async validateAndClaimTicket({ ticketCode, signature, eventId, gateName = 'Main Gate' }) {
    await new Promise((resolve) => setTimeout(resolve, 10));
    const ticket = this.tickets.find(
      (t) => t.ticket_code === ticketCode || t.id === ticketCode
    );
    if (!ticket) {
      return {
        success: false,
        valid: false,
        status: 'TICKET_NOT_FOUND',
        message: 'No ticket record found with this code.',
      };
    }

    if (eventId && ticket.event_id && ticket.event_id !== eventId) {
      return {
        success: false,
        valid: false,
        status: 'EVENT_MISMATCH',
        message: 'Ticket belongs to a different event.',
        ticket_event_id: ticket.event_id,
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
      eid: ticket.event_id || 'evt-symphony-2026',
      sid: ticket.seat_id,
      tier: ticket.tier || ticket.category || 'VIP',
      iat: Math.floor(new Date(ticket.created_at).getTime() / 1000),
    };

    const isValidSignature = await cryptoSigner.verifyTicketPayload({ ...dataFields, sig: testSig });

    if (!isValidSignature) {
      return {
        success: false,
        valid: false,
        status: 'INVALID_SIGNATURE',
        message: 'Cryptographic signature mismatch.',
      };
    }

    if (ticket.is_used) {
      return {
        success: false,
        valid: false,
        status: 'ALREADY_USED',
        message: `Ticket already scanned at ${ticket.scanned_at}`,
        scanned_at: ticket.scanned_at,
        gate_name: ticket.gate_name || 'Main Gate',
        ticket_code: ticket.ticket_code,
        ticket,
      };
    }

    // Grant entry and set used
    const nowISO = new Date().toISOString();
    ticket.is_used = true;
    ticket.scanned_at = nowISO;
    ticket.gate_name = gateName;

    return {
      success: true,
      valid: true,
      status: 'ENTRY_GRANTED',
      message: 'Access granted.',
      ticket_code: ticket.ticket_code,
      scanned_at: nowISO,
      gate_name: gateName,
      attendee_name: ticket.attendee_name || 'Valued Attendee',
      attendee_email: ticket.attendee_email || '',
      tier: ticket.tier || ticket.category || 'Standard',
      section: ticket.section || 'General',
      row_label: ticket.row_label || ticket.rowLabel || '-',
      seat_number: ticket.seat_number || ticket.seatNumber || 0,
      ticket,
    };
  }

  /**
   * Simulates gate scanner validating a ticket QR signature and idempotency (legacy wrapper)
   */
  async validateTicketScan(ticketCode, signature) {
    const res = await this.validateAndClaimTicket({ ticketCode, signature });
    return res;
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
    if (typeof window !== 'undefined') {
      if (window.sessionStorage) {
        window.sessionStorage.clear();
      }
      if (window.localStorage) {
        window.localStorage.removeItem(MOCK_TICKETS_STORAGE_KEY);
        window.localStorage.removeItem(MOCK_BOOKINGS_STORAGE_KEY);
        window.localStorage.removeItem('ticketcraft_anon_session_id');
      }
    }
  }
}

export const mockTicketingService = new MockTicketingService();

