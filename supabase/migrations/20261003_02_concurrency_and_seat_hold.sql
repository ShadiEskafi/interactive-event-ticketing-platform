-- Migration: 20261003_02_concurrency_and_seat_hold.sql
-- Description: Concurrency Control, Atomic Locking RPCs, and Realtime Seats Configuration

-- 1. Ensure seats table has reservation tracking columns
ALTER TABLE IF EXISTS seats
  ADD COLUMN IF NOT EXISTS reserved_by UUID,
  ADD COLUMN IF NOT EXISTS reserved_until TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Indexes for quick lookups on event, status, and expired hold sweeps
CREATE INDEX IF NOT EXISTS idx_seats_event_status ON seats(event_id, status);
CREATE INDEX IF NOT EXISTS idx_seats_reserved_until ON seats(reserved_until) WHERE status = 'reserved';

-- Schema verification index:
-- Ensures queries that treat expired holds (status = 'reserved' AND reserved_until <= NOW())
-- as available or sweepable for cleanup are index-supported without full table scans under high concurrency.
CREATE INDEX IF NOT EXISTS idx_seats_status_reserved_until ON seats(event_id, status, reserved_until);

-- 3. Atomic reserve_seats RPC with row-level locking
CREATE OR REPLACE FUNCTION reserve_seats(
  p_event_id UUID,
  p_seat_ids UUID[],
  p_user_id UUID,
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

  -- 1. Pessimistic row-level lock on available seats matching IDs
  -- Notice: If expired holds are present, release_seats or inline expiration treats them as reclaimable.
  PERFORM id FROM seats
  WHERE id = ANY(p_seat_ids)
    AND event_id = p_event_id
    AND (status = 'available' OR (status = 'reserved' AND reserved_until <= NOW()))
  FOR UPDATE;

  -- 2. Verify all requested seats were successfully locked
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

  -- 3. Atomic state transition to reserved
  UPDATE seats
  SET status = 'reserved',
      reserved_by = p_user_id,
      reserved_until = v_expires_at,
      updated_at = NOW()
  WHERE id = ANY(p_seat_ids);

  RETURN jsonb_build_object(
    'success', true,
    'reserved_seat_ids', p_seat_ids,
    'reserved_until', v_expires_at
  );
END;
$$;

-- 4. Explicit release_seats RPC
CREATE OR REPLACE FUNCTION release_seats(
  p_event_id UUID,
  p_seat_ids UUID[],
  p_user_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE seats
  SET status = 'available',
      reserved_by = NULL,
      reserved_until = NULL,
      updated_at = NOW()
  WHERE id = ANY(p_seat_ids)
    AND event_id = p_event_id
    AND status = 'reserved'
    AND (reserved_by = p_user_id OR reserved_until <= NOW());

  RETURN jsonb_build_object(
    'success', true,
    'released_seat_ids', p_seat_ids
  );
END;
$$;
