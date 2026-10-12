-- ==============================================================================
-- Full Supabase Migration (Applied via Supabase MCP)
-- ==============================================================================

-- 1. Profiles & Roles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  role TEXT NOT NULL DEFAULT 'attendee' CHECK (role IN ('super_admin', 'organizer', 'gate_staff', 'attendee')),
  assigned_event_id TEXT,
  assigned_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles select policy') THEN
    CREATE POLICY "Profiles select policy" ON public.profiles FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles insert policy') THEN
    CREATE POLICY "Profiles insert policy" ON public.profiles FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'profiles' AND policyname = 'Profiles update policy') THEN
    CREATE POLICY "Profiles update policy" ON public.profiles FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
END $$;

-- Link super_admin shadieskafi@gmail.com
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'super_admin'
FROM auth.users
WHERE email = 'shadieskafi@gmail.com'
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  role = 'super_admin';

-- Backfill existing users
INSERT INTO public.profiles (id, email, role)
SELECT id, email, 'attendee'
FROM auth.users
WHERE email <> 'shadieskafi@gmail.com'
ON CONFLICT (id) DO NOTHING;

-- Auto create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    CASE WHEN NEW.email = 'shadieskafi@gmail.com' THEN 'super_admin' ELSE 'attendee' END
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    role = CASE WHEN EXCLUDED.email = 'shadieskafi@gmail.com' THEN 'super_admin' ELSE profiles.role END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT OR UPDATE ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- 2. Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_logs_select') THEN
    CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'audit_logs' AND policyname = 'audit_logs_insert') THEN
    CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- 3. Events extensions
ALTER TABLE IF EXISTS public.events
  ADD COLUMN IF NOT EXISTS date_time TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS venue_name TEXT DEFAULT 'Grand Symphony Hall',
  ADD COLUMN IF NOT EXISTS vip_price NUMERIC DEFAULT 150,
  ADD COLUMN IF NOT EXISTS regular_price NUMERIC DEFAULT 85,
  ADD COLUMN IF NOT EXISTS balcony_price NUMERIC DEFAULT 45,
  ADD COLUMN IF NOT EXISTS created_by UUID,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Concert',
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 4. Seats & Tickets extensions
ALTER TABLE IF EXISTS public.seats
  ADD COLUMN IF NOT EXISTS section TEXT;

ALTER TABLE public.seats REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'seats'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.seats;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.tickets
  ADD COLUMN IF NOT EXISTS scanned_by UUID;

-- 5. RPC Functions
CREATE OR REPLACE FUNCTION reserve_seats(
  p_event_id TEXT,
  p_seat_ids TEXT[],
  p_user_id TEXT,
  p_hold_duration_seconds INT DEFAULT 300
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_available_count INT;
  v_expires_at TIMESTAMPTZ;
BEGIN
  v_expires_at := NOW() + (p_hold_duration_seconds || ' seconds')::INTERVAL;

  PERFORM id FROM seats
  WHERE id = ANY(p_seat_ids)
    AND event_id = p_event_id
    AND (status = 'available' OR (status = 'reserved' AND reserved_until <= NOW()))
  FOR UPDATE;

  SELECT COUNT(*) INTO v_available_count
  FROM seats
  WHERE id = ANY(p_seat_ids)
    AND event_id = p_event_id
    AND (status = 'available' OR (status = 'reserved' AND reserved_until <= NOW()));

  IF v_available_count <> array_length(p_seat_ids, 1) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error_code', 'SEATS_UNAVAILABLE',
      'message', 'One or more requested seats are no longer available.'
    );
  END IF;

  UPDATE seats
  SET status = 'reserved',
      reserved_by = p_user_id,
      reserved_until = v_expires_at,
      updated_at = NOW()
  WHERE id = ANY(p_seat_ids)
    AND event_id = p_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'reserved_seat_ids', p_seat_ids,
    'reserved_until', v_expires_at
  );
END;
$$;

CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  released_count INT;
BEGIN
  UPDATE seats
  SET status = 'available', reserved_by = NULL, reserved_until = NULL, updated_at = NOW()
  WHERE status = 'reserved' AND reserved_until < NOW();
  GET DIAGNOSTICS released_count = ROW_COUNT;
  RETURN released_count;
END;
$$;

CREATE OR REPLACE FUNCTION seed_event_seats(
  p_event_id TEXT,
  p_vip_price NUMERIC DEFAULT 150,
  p_regular_price NUMERIC DEFAULT 85,
  p_balcony_price NUMERIC DEFAULT 45
) RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted_count INT := 0;
  r RECORD;
  i INT;
  v_seat_id TEXT;
  v_cx NUMERIC;
  v_cy NUMERIC;
  v_spacing NUMERIC := 40;
BEGIN
  FOR r IN (
    SELECT 'A' AS rlabel, 160 AS sy, 220 AS sx UNION ALL
    SELECT 'B', 200, 220 UNION ALL
    SELECT 'C', 240, 220 UNION ALL
    SELECT 'D', 280, 220 UNION ALL
    SELECT 'E', 320, 220
  ) LOOP
    FOR i IN 1..24 LOOP
      v_seat_id := r.rlabel || '-' || i;
      v_cx := r.sx + (i - 1) * v_spacing;
      v_cy := r.sy;
      INSERT INTO seats (
        id, event_id, section, category, row_label, seat_number, price, status, cx, cy, updated_at
      )
      VALUES (
        v_seat_id, p_event_id, 'VIP', 'VIP', r.rlabel, i, p_vip_price, 'available', v_cx, v_cy, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        event_id = EXCLUDED.event_id,
        section = EXCLUDED.section,
        category = EXCLUDED.category,
        price = EXCLUDED.price;
      v_inserted_count := v_inserted_count + 1;
    END LOOP;
  END LOOP;

  FOR r IN (
    SELECT 'F' AS rlabel, 400 AS sy, 100 AS sx UNION ALL
    SELECT 'G', 440, 100 UNION ALL
    SELECT 'H', 480, 100 UNION ALL
    SELECT 'I', 520, 100 UNION ALL
    SELECT 'J', 560, 100 UNION ALL
    SELECT 'K', 600, 100 UNION ALL
    SELECT 'L', 640, 100 UNION ALL
    SELECT 'M', 680, 100
  ) LOOP
    FOR i IN 1..30 LOOP
      v_seat_id := r.rlabel || '-' || i;
      v_cx := r.sx + (i - 1) * v_spacing;
      v_cy := r.sy;
      INSERT INTO seats (
        id, event_id, section, category, row_label, seat_number, price, status, cx, cy, updated_at
      )
      VALUES (
        v_seat_id, p_event_id, 'Regular', 'Regular', r.rlabel, i, p_regular_price, 'available', v_cx, v_cy, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        event_id = EXCLUDED.event_id,
        section = EXCLUDED.section,
        category = EXCLUDED.category,
        price = EXCLUDED.price;
      v_inserted_count := v_inserted_count + 1;
    END LOOP;
  END LOOP;

  FOR r IN (
    SELECT 'N' AS rlabel, 760 AS sy, 60 AS sx UNION ALL
    SELECT 'O', 800, 60 UNION ALL
    SELECT 'P', 840, 60 UNION ALL
    SELECT 'Q', 880, 60 UNION ALL
    SELECT 'R', 920, 60
  ) LOOP
    FOR i IN 1..32 LOOP
      v_seat_id := r.rlabel || '-' || i;
      v_cx := r.sx + (i - 1) * v_spacing;
      v_cy := r.sy;
      INSERT INTO seats (
        id, event_id, section, category, row_label, seat_number, price, status, cx, cy, updated_at
      )
      VALUES (
        v_seat_id, p_event_id, 'Balcony', 'Balcony', r.rlabel, i, p_balcony_price, 'available', v_cx, v_cy, NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        event_id = EXCLUDED.event_id,
        section = EXCLUDED.section,
        category = EXCLUDED.category,
        price = EXCLUDED.price;
      v_inserted_count := v_inserted_count + 1;
    END LOOP;
  END LOOP;

  RETURN v_inserted_count;
END;
$$;

-- Trigger to seed seats on new event creation
CREATE OR REPLACE FUNCTION trigger_seed_event_seats()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM seed_event_seats(
    NEW.id,
    COALESCE(NEW.vip_price, 150),
    COALESCE(NEW.regular_price, 85),
    COALESCE(NEW.balcony_price, 45)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_seed_event_seats') THEN
    CREATE TRIGGER trg_seed_event_seats
      AFTER INSERT ON public.events
      FOR EACH ROW
      EXECUTE FUNCTION trigger_seed_event_seats();
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
