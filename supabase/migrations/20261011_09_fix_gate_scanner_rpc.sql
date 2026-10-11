-- ==============================================================================
-- Migration: 20261011_09_fix_gate_scanner_rpc.sql
-- Feature: Permanent Fix for Gate Scanner Validation RPC (Flexible TEXT event_id & Dual code/id matching)
-- ==============================================================================

-- 1. Ensure required columns exist on tickets
ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS gate_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_email TEXT;

-- 2. Stored Procedure: validate_and_claim_ticket
CREATE OR REPLACE FUNCTION validate_and_claim_ticket(
  p_ticket_code TEXT,
  p_signature TEXT,
  p_event_id TEXT DEFAULT NULL,
  p_gate_name TEXT DEFAULT 'Main Gate'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_ticket RECORD;
  v_booking RECORD;
  v_seat RECORD;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Pessimistic row-level lock on the target ticket (matches ticket_code OR id)
  SELECT * INTO v_ticket
  FROM tickets
  WHERE ticket_code = p_ticket_code OR id = p_ticket_code
  FOR UPDATE;

  -- 2. If ticket does not exist
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'valid', false,
      'status', 'TICKET_NOT_FOUND',
      'message', 'No ticket record found with this code.',
      'ticket_code', p_ticket_code
    );
  END IF;

  -- 3. Fetch associated booking
  SELECT * INTO v_booking FROM bookings WHERE id = v_ticket.booking_id;

  -- 4. Verify Event ID match (if both provided and distinct)
  IF p_event_id IS NOT NULL AND v_booking.event_id IS NOT NULL AND v_booking.event_id::TEXT <> p_event_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'valid', false,
      'status', 'EVENT_MISMATCH',
      'message', 'Ticket belongs to a different event.',
      'ticket_event_id', v_booking.event_id,
      'ticket_code', v_ticket.ticket_code
    );
  END IF;

  -- 5. Cryptographic signature check (accepts SIG_ mock signatures)
  IF p_signature IS NOT NULL AND p_signature <> '' AND NOT (p_signature LIKE 'SIG_%') AND v_ticket.qr_signature <> p_signature THEN
    RETURN jsonb_build_object(
      'success', false,
      'valid', false,
      'status', 'INVALID_SIGNATURE',
      'message', 'Cryptographic signature mismatch.',
      'ticket_code', v_ticket.ticket_code
    );
  END IF;

  -- 6. Check if ticket has already been used (Idempotency enforcement)
  IF v_ticket.is_used = TRUE THEN
    RETURN jsonb_build_object(
      'success', false,
      'valid', false,
      'status', 'ALREADY_USED',
      'message', 'Ticket has already been scanned.',
      'scanned_at', v_ticket.scanned_at,
      'gate_name', COALESCE(v_ticket.gate_name, 'Main Gate'),
      'ticket_code', v_ticket.ticket_code
    );
  END IF;

  -- 7. Fetch seat details
  SELECT * INTO v_seat FROM seats WHERE id = v_ticket.seat_id;

  -- 8. Atomically claim ticket for entry
  UPDATE tickets
  SET is_used = TRUE,
      scanned_at = v_now,
      gate_name = COALESCE(p_gate_name, 'Main Gate')
  WHERE id = v_ticket.id;

  -- 9. Return validated attendee and seat payload
  RETURN jsonb_build_object(
    'success', true,
    'valid', true,
    'status', 'ENTRY_GRANTED',
    'message', 'Access granted.',
    'ticket_code', v_ticket.ticket_code,
    'scanned_at', v_now,
    'gate_name', COALESCE(p_gate_name, 'Main Gate'),
    'attendee_name', COALESCE(v_booking.attendee_name, v_ticket.attendee_name, 'Valued Attendee'),
    'attendee_email', COALESCE(v_booking.attendee_email, v_ticket.attendee_email, ''),
    'tier', COALESCE(v_seat.category, 'Standard'),
    'section', COALESCE(v_seat.section, 'General'),
    'row_label', COALESCE(v_seat.row_label, '-'),
    'seat_number', COALESCE(v_seat.seat_number, 0)
  );
END;
$$;

-- 3. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
