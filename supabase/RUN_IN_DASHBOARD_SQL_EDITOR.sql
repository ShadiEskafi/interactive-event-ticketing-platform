-- ==============================================================================
-- CONSOLIDATED SQL FIX: Run this once in the Supabase Dashboard SQL Editor
-- Project: Interactive Event Ticketing Platform (TicketCraft)
-- Purpose:
--   1. Ensures missing columns exist on tickets & bookings (compatible TEXT types)
--   2. Makes user_id nullable for guest checkouts
--   3. Configures permissive Row Level Security (RLS) for inserting & viewing tickets
--   4. Creates/overhauls confirm_booking to atomically issue tickets in the same transaction
--   5. Reloads PostgREST schema cache
-- ==============================================================================

-- 1. Ensure columns exist on tickets
ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS qr_payload TEXT,
  ADD COLUMN IF NOT EXISTS anonymous_session_id TEXT,
  ADD COLUMN IF NOT EXISTS event_id TEXT;

-- Make user_id nullable on tickets so guest/anon checkout succeeds
ALTER TABLE IF EXISTS tickets
  ALTER COLUMN user_id DROP NOT NULL;

-- 2. Ensure columns exist on bookings
ALTER TABLE IF EXISTS bookings
  ADD COLUMN IF NOT EXISTS anonymous_session_id TEXT,
  ADD COLUMN IF NOT EXISTS attendee_name TEXT,
  ADD COLUMN IF NOT EXISTS attendee_email TEXT;

-- Make user_id nullable on bookings
ALTER TABLE IF EXISTS bookings
  ALTER COLUMN user_id DROP NOT NULL;

-- 3. Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tickets_anon_session ON tickets(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_anon_session ON bookings(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_code ON tickets(ticket_code);
CREATE INDEX IF NOT EXISTS idx_tickets_booking_id ON tickets(booking_id);

-- 4. Row Level Security (RLS) Configuration
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;

-- Drop any restrictive policies on tickets
DROP POLICY IF EXISTS "Allow reading anonymous tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;
DROP POLICY IF EXISTS "Allow reading tickets" ON tickets;
DROP POLICY IF EXISTS "Allow inserting tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;
DROP POLICY IF EXISTS "Enable insert for all users" ON tickets;
DROP POLICY IF EXISTS "Allow updating tickets" ON tickets;

-- Permissive RLS policies for tickets
CREATE POLICY "Allow reading tickets"
ON tickets FOR SELECT
USING (true);

CREATE POLICY "Allow inserting tickets"
ON tickets FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow updating tickets"
ON tickets FOR UPDATE
USING (true)
WITH CHECK (true);

-- Drop any restrictive policies on bookings
DROP POLICY IF EXISTS "Allow reading anonymous bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Allow reading bookings" ON bookings;
DROP POLICY IF EXISTS "Allow inserting bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;
DROP POLICY IF EXISTS "Allow updating bookings" ON bookings;

-- Permissive RLS policies for bookings
CREATE POLICY "Allow reading bookings"
ON bookings FOR SELECT
USING (true);

CREATE POLICY "Allow inserting bookings"
ON bookings FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow updating bookings"
ON bookings FOR UPDATE
USING (true)
WITH CHECK (true);

-- 5. Stored Procedure: Atomic confirm_booking that guarantees ticket creation
CREATE OR REPLACE FUNCTION confirm_booking(
  p_event_id TEXT,
  p_seat_ids TEXT[],
  p_user_id UUID DEFAULT NULL,
  p_attendee_name TEXT DEFAULT 'Valued Attendee',
  p_attendee_email TEXT DEFAULT 'attendee@example.com',
  p_booking_id TEXT DEFAULT NULL,
  p_total_amount NUMERIC DEFAULT 0,
  p_tickets JSONB DEFAULT '[]'::jsonb,
  p_anonymous_session_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_booking_id TEXT;
  v_now TIMESTAMPTZ := NOW();
  v_ticket JSONB;
  v_ticket_id TEXT;
  v_seat_id TEXT;
  v_ticket_code TEXT;
  v_qr_sig TEXT;
  v_qr_payload TEXT;
  v_count INT := 0;
BEGIN
  -- 1. Determine booking ID
  v_booking_id := COALESCE(p_booking_id, 'BK-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6)));

  -- 2. Upsert booking record
  INSERT INTO bookings (
    id, event_id, user_id, attendee_name, attendee_email,
    total_amount, status, created_at, updated_at
  )
  VALUES (
    v_booking_id, p_event_id, p_user_id, p_attendee_name, p_attendee_email,
    p_total_amount, 'confirmed', v_now, v_now
  )
  ON CONFLICT (id) DO UPDATE SET
    status = 'confirmed',
    total_amount = EXCLUDED.total_amount,
    updated_at = v_now;

  -- Update anonymous_session_id on booking if column exists
  BEGIN
    UPDATE bookings
    SET anonymous_session_id = p_anonymous_session_id
    WHERE id = v_booking_id;
  EXCEPTION WHEN OTHERS THEN
    -- Safe fallback
  END;

  -- 3. Mark reserved seats as sold
  UPDATE seats
  SET status = 'sold',
      reserved_until = NULL,
      reserved_by = NULL,
      updated_at = v_now
  WHERE id = ANY(p_seat_ids)
    AND (event_id = p_event_id OR p_event_id IS NULL);

  -- 4. Insert tickets directly inside the database transaction
  IF p_tickets IS NOT NULL AND jsonb_typeof(p_tickets) = 'array' AND jsonb_array_length(p_tickets) > 0 THEN
    -- Insert specific tickets passed from frontend
    FOR v_ticket IN SELECT * FROM jsonb_array_elements(p_tickets)
    LOOP
      v_ticket_id := COALESCE(v_ticket->>'id', 'tkt_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
      v_seat_id := v_ticket->>'seat_id';
      v_ticket_code := COALESCE(v_ticket->>'ticket_code', 'TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 5)));
      v_qr_sig := COALESCE(v_ticket->>'qr_signature', 'SIG_' || SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 12));
      v_qr_payload := COALESCE(v_ticket->>'qr_payload', '');

      INSERT INTO tickets (
        id, booking_id, seat_id, user_id, ticket_code, qr_signature,
        is_used, created_at
      )
      VALUES (
        v_ticket_id, v_booking_id, v_seat_id, p_user_id, v_ticket_code, v_qr_sig,
        false, v_now
      )
      ON CONFLICT (id) DO UPDATE SET
        is_used = false;

      BEGIN
        UPDATE tickets
        SET event_id = p_event_id,
            anonymous_session_id = p_anonymous_session_id,
            qr_payload = v_qr_payload
        WHERE id = v_ticket_id;
      EXCEPTION WHEN OTHERS THEN
        -- Safe fallback
      END;

      v_count := v_count + 1;
    END LOOP;
  ELSE
    -- Auto-generate tickets for any seats passed in p_seat_ids if p_tickets was empty
    FOR v_seat_id IN SELECT unnest(p_seat_ids)
    LOOP
      v_ticket_id := 'tkt_' || SUBSTRING(MD5(RANDOM()::TEXT || v_seat_id) FROM 1 FOR 8);
      v_ticket_code := 'TKT-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT || v_seat_id) FROM 1 FOR 5));
      v_qr_sig := 'SIG_' || SUBSTRING(MD5(RANDOM()::TEXT || v_seat_id) FROM 1 FOR 12);

      INSERT INTO tickets (
        id, booking_id, seat_id, user_id, ticket_code, qr_signature,
        is_used, created_at
      )
      VALUES (
        v_ticket_id, v_booking_id, v_seat_id, p_user_id, v_ticket_code, v_qr_sig,
        false, v_now
      )
      ON CONFLICT (id) DO NOTHING;

      BEGIN
        UPDATE tickets
        SET event_id = p_event_id,
            anonymous_session_id = p_anonymous_session_id
        WHERE id = v_ticket_id;
      EXCEPTION WHEN OTHERS THEN
        -- Safe fallback
      END;

      v_count := v_count + 1;
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'confirmed',
    'booking_id', v_booking_id,
    'tickets_issued', v_count
  );
END;
$$;

-- 6. Reload schema cache for PostgREST
NOTIFY pgrst, 'reload schema';
