-- ==============================================================================
-- CONSOLIDATED SQL FIX: Run this once in the Supabase Dashboard SQL Editor
-- Project: Interactive Event Ticketing Platform (TicketCraft)
-- Purpose:
--   1. Adds missing columns (event_id, anonymous_session_id, qr_payload) to tickets & bookings
--   2. Makes user_id nullable for guest checkouts
--   3. Creates the claim_tickets stored procedure (with parameter order overloads)
--   4. Configures Row Level Security (RLS) for anonymous guest reading/inserting
--   5. Backfills legacy ticket records with parent booking data
--   6. Reloads PostgREST schema cache
-- ==============================================================================

-- 1. Ensure columns exist on tickets
ALTER TABLE IF EXISTS tickets
  ADD COLUMN IF NOT EXISTS qr_payload TEXT,
  ADD COLUMN IF NOT EXISTS anonymous_session_id TEXT;

-- Safely add event_id (try UUID referencing events table; fallback to TEXT if events.id is TEXT or table not present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'tickets' AND column_name = 'event_id'
  ) THEN
    BEGIN
      ALTER TABLE tickets ADD COLUMN event_id UUID REFERENCES events(id);
    EXCEPTION WHEN OTHERS THEN
      ALTER TABLE tickets ADD COLUMN event_id TEXT;
    END;
  END IF;
END $$;

-- Make user_id nullable on tickets so guest checkout succeeds before auth
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

-- 3. Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_tickets_anon_session ON tickets(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_bookings_anon_session ON bookings(anonymous_session_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets(user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);

-- 4. Backfill event_id, anonymous_session_id, and user_id for existing tickets from parent bookings
UPDATE tickets t
SET event_id = b.event_id
FROM bookings b
WHERE t.booking_id = b.id
  AND t.event_id IS NULL;

UPDATE tickets t
SET anonymous_session_id = b.anonymous_session_id
FROM bookings b
WHERE t.booking_id = b.id
  AND t.anonymous_session_id IS NULL
  AND b.anonymous_session_id IS NOT NULL;

UPDATE tickets t
SET user_id = b.user_id
FROM bookings b
WHERE t.booking_id = b.id
  AND t.user_id IS NULL
  AND b.user_id IS NOT NULL;

-- 5. Stored Procedure: claim_tickets (primary signature)
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

-- Parameter-order overload so PostgREST resolves in either order
CREATE OR REPLACE FUNCTION claim_tickets(
  p_anonymous_session_id TEXT,
  p_authenticated_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN claim_tickets(p_authenticated_user_id, p_anonymous_session_id);
END;
$$;

-- 6. Overloaded confirm_booking stored procedure to support parameter styles
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

-- 7. Row-Level Security (RLS) Policy Adjustments
ALTER TABLE IF EXISTS tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bookings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow reading anonymous tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view their own tickets" ON tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON tickets;

CREATE POLICY "Allow reading anonymous tickets"
ON tickets FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (anonymous_session_id IS NOT NULL)
  OR
  (user_id IS NULL)
);

DROP POLICY IF EXISTS "Allow inserting tickets" ON tickets;
DROP POLICY IF EXISTS "Users can insert their own tickets" ON tickets;

CREATE POLICY "Allow inserting tickets"
ON tickets FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (anonymous_session_id IS NOT NULL)
  OR
  (user_id IS NULL)
);

DROP POLICY IF EXISTS "Allow reading anonymous bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;

CREATE POLICY "Allow reading anonymous bookings"
ON bookings FOR SELECT
USING (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (anonymous_session_id IS NOT NULL)
  OR
  (user_id IS NULL)
);

DROP POLICY IF EXISTS "Allow inserting bookings" ON bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON bookings;

CREATE POLICY "Allow inserting bookings"
ON bookings FOR INSERT
WITH CHECK (
  (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  OR
  (anonymous_session_id IS NOT NULL)
  OR
  (user_id IS NULL)
);

-- 8. Reload schema cache for PostgREST to recognize updated foreign keys and procedures
NOTIFY pgrst, 'reload schema';
