import { supabase } from './supabaseClient';
import { mockVenueLayout } from '../features/seatmap/data/mockVenueLayout';
import { cryptoSigner } from '../features/tickets/services/cryptoSigner';
import { parseQRPayload } from '../features/tickets/utils/qrPayload';
import { generateTicketCode, generateBookingId } from '../features/tickets/utils/ticketCodeGenerator';

/**
 * Production Supabase Ticketing Service
 * Executes atomic RPCs, Realtime PostgreSQL subscriptions, and queries against Supabase.
 */
class SupabaseTicketingService {
  constructor() {
    this.layout = mockVenueLayout;
  }

  async getVenueLayout(_venueId) {
    return this.layout;
  }

  /**
   * Fetches live seat availability directly from Supabase PostgreSQL
   */
  async getSeatAvailability(eventId = 'evt-symphony-2026') {
    const { data, error } = await supabase
      .from('seats')
      .select('*')
      .eq('event_id', eventId)
      .order('id', { ascending: true });

    if (error || !data) {
      console.error('Error fetching seats from Supabase:', error);
      throw error;
    }

    return data.map((s) => ({
      id: s.id,
      rowLabel: s.row_label,
      seatNumber: s.seat_number,
      category: s.category,
      price: parseFloat(s.price),
      status: s.status,
      reservedBy: s.reserved_by,
      reservedUntil: s.reserved_until,
      cx: parseFloat(s.cx),
      cy: parseFloat(s.cy),
      radius: 12,
    }));
  }

  /**
   * Invokes atomic reserve_seats stored procedure in PostgreSQL
   */
  async reserveSeats(eventId, seatIds, userId, holdDurationSeconds = 300) {
    const { data, error } = await supabase.rpc('reserve_seats', {
      p_event_id: eventId,
      p_seat_ids: seatIds,
      p_user_id: userId,
      p_hold_duration_seconds: holdDurationSeconds,
    });

    if (error) {
      return {
        success: false,
        error_code: 'SEATS_UNAVAILABLE',
        message: error.message || 'One or more requested seats are no longer available.',
      };
    }

    return data;
  }

  /**
   * Invokes release_seats stored procedure in PostgreSQL
   */
  async releaseSeats(eventId, seatIds, userId) {
    const { data, error } = await supabase.rpc('release_seats', {
      p_event_id: eventId,
      p_seat_ids: seatIds,
      p_user_id: userId,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return data;
  }

  /**
   * Invokes transfer_hold stored procedure upon attendee login
   */
  async transferHold(eventId, seatIds, authenticatedUserId, anonymousSessionId) {
    const { data, error } = await supabase.rpc('transfer_hold', {
      p_event_id: eventId,
      p_seat_ids: seatIds,
      p_authenticated_user_id: authenticatedUserId,
      p_anonymous_session_id: anonymousSessionId,
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return data;
  }

  /**
   * Confirms payment, marks seats as 'sold' in DB, and issues signed ticket records
   */
  async confirmBooking({
    eventId = 'evt-symphony-2026',
    seatIds = [],
    userId,
    attendeeName = 'Valued Attendee',
    attendeeEmail = 'attendee@example.com',
    paymentDetails = {},
  }) {
    const bookingId = generateBookingId();

    // 1. Fetch booked seats to calculate total
    const { data: seatsData } = await supabase
      .from('seats')
      .select('*')
      .in('id', seatIds);

    const totalAmount = (seatsData || []).reduce((sum, s) => sum + parseFloat(s.price), 0);

    // 2. Atomic confirmation RPC in PostgreSQL
    const { error: rpcError } = await supabase.rpc('confirm_booking', {
      p_event_id: eventId,
      p_seat_ids: seatIds,
      p_user_id: userId,
      p_attendee_name: attendeeName,
      p_attendee_email: attendeeEmail,
      p_booking_id: bookingId,
      p_total_amount: totalAmount,
    });

    if (rpcError) {
      throw rpcError;
    }

    // 3. Issue and sign unique ticket records
    const issuedTickets = [];
    const nowISO = new Date().toISOString();

    for (const seat of seatsData || []) {
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
        seat_number: seat.seat_number,
        row_label: seat.row_label,
        price: parseFloat(seat.price),
        is_used: false,
        scanned_at: null,
        created_at: nowISO,
        event_title: 'Grand Symphony Concert',
        event_date: 'Saturday, Nov 14, 2026 • 8:00 PM',
        venue_name: 'Grand Symphony Hall, Auditorium',
      };

      const signedTicket = await cryptoSigner.signTicketRecord(rawTicket);
      issuedTickets.push(signedTicket);

      // Insert into Supabase tickets table
      await supabase.from('tickets').insert({
        id: signedTicket.id,
        booking_id: signedTicket.booking_id,
        seat_id: signedTicket.seat_id,
        user_id: userId && userId.length === 36 ? userId : null,
        ticket_code: signedTicket.ticket_code,
        qr_signature: signedTicket.qr_signature,
        qr_payload: signedTicket.qr_payload,
        is_used: false,
      });
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
      seats: seatsData,
      tickets: issuedTickets,
    };

    return {
      success: true,
      status: 'confirmed',
      bookingId,
      booking,
      tickets: issuedTickets,
    };
  }

  /**
   * Retrieves user's tickets from Supabase database
   */
  async getUserTickets(userId) {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('tickets')
      .select('*, seats(*), bookings(*)')
      .eq('user_id', userId);

    if (error || !data) {
      return [];
    }

    return data.map((t) => ({
      id: t.id,
      ticket_code: t.ticket_code,
      booking_id: t.booking_id,
      event_id: 'evt-symphony-2026',
      seat_id: t.seat_id,
      row_label: t.seats?.row_label || t.seat_id?.split('-')[0],
      seat_number: t.seats?.seat_number || t.seat_id?.split('-')[1],
      tier: t.seats?.category || 'VIP',
      category: t.seats?.category || 'VIP',
      price: t.seats?.price ? parseFloat(t.seats.price) : 150,
      attendee_name: t.bookings?.attendee_name || 'Valued Attendee',
      event_title: 'Grand Symphony Concert',
      event_date: 'Saturday, Nov 14, 2026 • 8:00 PM',
      venue_name: 'Grand Symphony Hall, Auditorium',
      qr_signature: t.qr_signature,
      qr_payload: t.qr_payload,
      is_used: t.is_used,
      scanned_at: t.scanned_at,
    }));
  }

  /**
   * Realtime Postgres Changes Subscription
   */
  subscribeToSeatChanges(eventId, onSeatUpdate) {
    const channel = supabase
      .channel(`public:seats:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'seats',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          if (payload.new) {
            const updatedSeat = {
              id: payload.new.id,
              rowLabel: payload.new.row_label,
              seatNumber: payload.new.seat_number,
              category: payload.new.category,
              price: parseFloat(payload.new.price),
              status: payload.new.status,
              reservedBy: payload.new.reserved_by,
              reservedUntil: payload.new.reserved_until,
              cx: parseFloat(payload.new.cx),
              cy: parseFloat(payload.new.cy),
              radius: 12,
              ...payload.new,
            };
            onSeatUpdate(updatedSeat);
          }
        }
      )
      .subscribe((status) => {
        console.log(`[Realtime] Seat sync status for ${eventId}:`, status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Validates ticket scan at the gate and updates database record idempotently
   */
  async validateTicketScan(ticketCode, signature) {
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('ticket_code', ticketCode)
      .single();

    if (error || !ticket) {
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
      eid: 'evt-symphony-2026',
      sid: ticket.seat_id,
      tier: 'VIP',
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

    // Update in Supabase
    const nowISO = new Date().toISOString();
    await supabase
      .from('tickets')
      .update({ is_used: true, scanned_at: nowISO })
      .eq('id', ticket.id);

    return {
      valid: true,
      status: 'ENTRY_GRANTED',
      scanned_at: nowISO,
      ticket: { ...ticket, is_used: true, scanned_at: nowISO },
    };
  }
}

export const supabaseTicketingService = new SupabaseTicketingService();
export { SupabaseTicketingService };
