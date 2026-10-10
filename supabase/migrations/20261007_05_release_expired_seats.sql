-- Migration: 20261007_05_release_expired_seats.sql
-- Feature: Automatic Seat Expiration via RPC & Background Cleanup (pg_cron)

-- 1. Create or replace stored procedure release_expired_seats
-- Atomically sweeps seats where status = 'reserved' and reserved_until <= NOW()
-- Supports optional scoping by event_id (or all events when NULL).
CREATE OR REPLACE FUNCTION release_expired_seats(
  p_event_id TEXT DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_released_count INT := 0;
BEGIN
  -- Pessimistic row-level lock and atomic transition of expired holds back to available
  WITH expired_seats AS (
    SELECT id
    FROM seats
    WHERE status = 'reserved'
      AND reserved_until <= NOW()
      AND (p_event_id IS NULL OR event_id = p_event_id)
    FOR UPDATE
  ),
  updated AS (
    UPDATE seats
    SET status = 'available',
        reserved_by = NULL,
        reserved_until = NULL,
        updated_at = NOW()
    WHERE id IN (SELECT id FROM expired_seats)
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released_count FROM updated;

  RETURN jsonb_build_object(
    'success', true,
    'released_count', v_released_count
  );
END;
$$;

-- 2. Idempotent scheduling / cron support using pg_cron (if extension available)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_available_extensions WHERE name = 'pg_cron'
  ) THEN
    CREATE EXTENSION IF NOT EXISTS pg_cron;

    -- Unschedule existing job if already registered to guarantee idempotency
    IF EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'release-expired-seats-job'
    ) THEN
      PERFORM cron.unschedule('release-expired-seats-job');
    END IF;

    -- Schedule cron to run every minute (* * * * *)
    PERFORM cron.schedule(
      'release-expired-seats-job',
      '* * * * *',
      'SELECT release_expired_seats();'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Graceful notice for restricted environments where pg_cron cannot be scheduled
  RAISE NOTICE 'pg_cron background scheduler could not be registered: %', SQLERRM;
END;
$$;
