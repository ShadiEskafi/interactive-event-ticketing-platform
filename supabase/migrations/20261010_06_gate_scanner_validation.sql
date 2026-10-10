-- Migration: 20261010_06_gate_scanner_validation.sql
-- Feature: FEAT-GATE-SCANNER-05 PWA Gate Scanner Validation Engine & Anti-Collision RPC

-- Add gate tracking and attendee metadata columns if missing
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS gate_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attendee_name TEXT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS attendee_email TEXT;

-- Create index for quick gate lookup and usage statistics
CREATE INDEX IF NOT EXISTS idx_tickets_is_used ON tickets(is_used);
CREATE INDEX IF NOT EXISTS idx_tickets_gate_name ON tickets(gate_name);

-- Stored Procedure: validate_and_claim_ticket
-- Atomically validates signature, verifies event, checks idempotency, and claims ticket with FOR UPDATE pessimistic lock
CREATE OR REPLACE FUNCTION validate_and_claim_ticket(
  p_ticket_code TEXT,
  p_signature TEXT,
  p_event_id UUID DEFAULT NULL,
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
  -- 1. Pessimistic row-level lock on the target ticket
  SELECT * INTO v_ticket
  FROM tickets
  WHERE ticket_code = p_ticket_code
  FOR UPDATE;

  -- 2. If ticket does not exist
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'valid', false,
      'status', 'TICKET_NOT_FOUND',
      'message', 'No ticket record found with this code.'
    );
  END IF;

  -- 3. Fetch associated booking
  SELECT * INTO v_booking FROM bookings WHERE id = v_ticket.booking_id;

  -- 4. Verify Event ID match (if provided)
  IF p_event_id IS NOT NULL AND v_booking.event_id IS NOT NULL AND v_booking.event_id <> p_event_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'valid', false,
      'status', 'EVENT_MISMATCH',
      'message', 'Ticket belongs to a different event.',
      'ticket_event_id', v_booking.event_id
    );
  END IF;

  -- 5. Cryptographic signature check
  IF p_signature IS NOT NULL AND p_signature <> '' AND v_ticket.qr_signature <> p_signature THEN
    RETURN jsonb_build_object(
      'success', false,
      'valid', false,
      'status', 'INVALID_SIGNATURE',
      'message', 'Cryptographic signature mismatch.'
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
      'gate_name', v_ticket.gate_name,
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
    'attendee_name', COALESCE(v_ticket.attendee_name, 'Valued Attendee'),
    'attendee_email', COALESCE(v_ticket.attendee_email, ''),
    'tier', COALESCE(v_seat.category, 'Standard'),
    'section', COALESCE(v_seat.section, 'General'),
    'row_label', COALESCE(v_seat.row_label, '-'),
    'seat_number', COALESCE(v_seat.seat_number, 0)
  );
END;
$$;
