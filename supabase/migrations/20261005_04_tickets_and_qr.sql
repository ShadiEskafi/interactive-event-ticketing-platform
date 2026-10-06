-- Migration: 20261005_04_tickets_and_qr.sql
-- Feature: FEAT-TICK-04 Digital Ticket Issuance, Cryptographically Signed QR Codes & Gate Scanner Readiness

-- Create tickets table
CREATE TABLE IF NOT EXISTS tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ticket_code TEXT NOT NULL UNIQUE,
  qr_signature TEXT NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  scanned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user dashboard queries
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
-- Index for rapid gate scanning lookups
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);
-- Index for booking association
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);

-- Enable Row Level Security (RLS)
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Attendees can view only their own issued tickets
CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (auth.uid() = user_id);

-- Stored Procedure: confirm_booking
-- Atomically transitions booking to 'confirmed' and all associated reserved seats to 'sold' (#9CA3AF)
CREATE OR REPLACE FUNCTION confirm_booking(
  p_booking_id UUID,
  p_payment_payload JSONB
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking RECORD;
BEGIN
  SELECT * INTO v_booking FROM bookings WHERE id = p_booking_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'BOOKING_NOT_FOUND');
  END IF;

  -- Update booking status to confirmed
  UPDATE bookings
  SET status = 'confirmed', updated_at = NOW()
  WHERE id = p_booking_id;

  -- Permanently mark reserved seats as sold
  UPDATE seats
  SET status = 'sold', reserved_until = NULL, reserved_by = NULL, updated_at = NOW()
  WHERE id IN (SELECT seat_id FROM tickets WHERE booking_id = p_booking_id);

  RETURN jsonb_build_object('success', true, 'status', 'confirmed', 'booking_id', p_booking_id);
END;
$$;
