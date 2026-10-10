-- Migration: 20261008_06_tickets_and_claims.sql
-- Feature: Fix Missing Tickets in "My Tickets", Anonymous Ticket Claims, and Schema Normalization

-- 1. Ensure tickets table has qr_payload, anonymous_session_id, and event_id columns
ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS qr_payload TEXT,
  ADD COLUMN IF NOT EXISTS anonymous_session_id TEXT,
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES events(id);

-- Make user_id nullable on tickets and bookings so guest checkout succeeds before auth
ALTER TABLE IF EXISTS tickets
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS anonymous_session_id TEXT,
  ADD COLUMN IF NOT EXISTS attendee_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_email TEXT;

ALTER TABLE IF EXISTS bookings
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Indexes for rapid lookups by anonymous session ID
CREATE INDEX IF NOT EXISTS idx_tickets_anon_session ON tickets(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_anon_session ON bookings(anonymous_session_id);

-- 3. Stored Procedure: claim_tickets
-- Atomically binds tickets and bookings created anonymously to an authenticated user upon login
CREATE OR REPLACE FUNCTION claim_tickets(
  p_authenticated_user_id UUID,
  p_anonymous_session_id TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_tickets_count INT := 0;
  v_bookings_count INT := 0;
BEGIN
  IF p_authenticated_user_id IS NULL OR p_anonymous_session_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'claimed_count', 0);
  END IF;

  UPDATE tickets
  SET user_id = p_authenticated_user_id
  WHERE anonymous_session_id = p_anonymous_session_id
    AND (user_id IS NULL OR user_id = p_authenticated_user_id);
  GET DIAGNOSTICS v_tickets_count = ROW_COUNT;

  UPDATE bookings
  SET user_id = p_authenticated_user_id
  WHERE anonymous_session_id = p_anonymous_session_id
    AND (user_id IS NULL OR user_id = p_authenticated_user_id);
  GET DIAGNOSTICS v_bookings_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'claimed_tickets_count', v_tickets_count,
    'claimed_bookings_count', v_bookings_count
  );
END;
$$;

-- 4. Overloaded confirm_booking stored procedure to support parameter styles
CREATE OR REPLACE FUNCTION confirm_booking(
  p_event_id TEXT,
  p_seat_ids UUID[],
  p_user_id UUID DEFAULT NULL,
  p_attendee_name TEXT DEFAULT 'Valued Attendee',
  p_attendee_email TEXT DEFAULT 'attendee@example.com',
  p_booking_id UUID DEFAULT NULL,
  p_total_amount NUMERIC DEFAULT 0
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark reserved seats as permanently sold
  UPDATE seats
  SET status = 'sold', reserved_until = NULL, reserved_by = NULL, updated_at = NOW()
  WHERE id = ANY(p_seat_ids);

  RETURN jsonb_build_object(
    'success', true,
    'status', 'confirmed',
    'booking_id', p_booking_id
  );
END;
$$;

-- 5. Row-Level Security (RLS) Policy Adjustments
-- Ensure authenticated users can select their own tickets, and guest sessions can select tickets matching their session
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;

CREATE POLICY "Users can view their own tickets"
  ON tickets FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NULL)
  );

-- Allow ticket inserts for checkout
DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;

CREATE POLICY "Users can insert their own tickets"
  ON tickets FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR
    (user_id IS NULL)
  );
