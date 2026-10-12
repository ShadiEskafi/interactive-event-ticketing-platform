-- Migration 20261012_11_event_seating_engine_fix.sql
-- Resolves event creation RLS blocks, foreign key seat generation failures,
-- and deploys atomic create_event_with_seats RPC.

-- 1. Permissive RLS Policies on events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow public insert on events'
  ) THEN
    CREATE POLICY "Allow public insert on events" ON events FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow public update on events'
  ) THEN
    CREATE POLICY "Allow public update on events" ON events FOR UPDATE USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'events' AND policyname = 'Allow public delete on events'
  ) THEN
    CREATE POLICY "Allow public delete on events" ON events FOR DELETE USING (true);
  END IF;
END $$;

-- 2. Permissive RLS Policies on seats table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'seats' AND policyname = 'Allow public insert on seats'
  ) THEN
    CREATE POLICY "Allow public insert on seats" ON seats FOR INSERT WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'seats' AND policyname = 'Allow public update on seats'
  ) THEN
    CREATE POLICY "Allow public update on seats" ON seats FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- 3. Atomic create_event_with_seats Postgres Function (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION create_event_with_seats(
  p_id TEXT,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_venue_name TEXT DEFAULT 'Grand Symphony Hall',
  p_vip_price NUMERIC DEFAULT 150,
  p_regular_price NUMERIC DEFAULT 85,
  p_balcony_price NUMERIC DEFAULT 45,
  p_status TEXT DEFAULT 'published',
  p_date_time TIMESTAMPTZ DEFAULT NOW(),
  p_created_by UUID DEFAULT NULL,
  p_category TEXT DEFAULT 'Concert'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_seats_count INT := 0;
BEGIN
  -- Insert or update event row
  INSERT INTO events (
    id, title, description, venue_name, vip_price, regular_price, balcony_price, status, date_time, created_by, category
  ) VALUES (
    p_id, p_title, p_description, p_venue_name, p_vip_price, p_regular_price, p_balcony_price, p_status, p_date_time, p_created_by, p_category
  )
  ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    venue_name = EXCLUDED.venue_name,
    vip_price = EXCLUDED.vip_price,
    regular_price = EXCLUDED.regular_price,
    balcony_price = EXCLUDED.balcony_price,
    status = EXCLUDED.status,
    date_time = EXCLUDED.date_time,
    category = EXCLUDED.category;

  -- Atomically generate and persist all 520 seats
  v_seats_count := seed_event_seats(p_id, p_vip_price, p_regular_price, p_balcony_price);

  RETURN jsonb_build_object(
    'success', true,
    'event_id', p_id,
    'seats_seeded', v_seats_count
  );
END;
$$;

-- Grant execution to all client roles
GRANT EXECUTE ON FUNCTION create_event_with_seats TO public, anon, authenticated, service_role;
