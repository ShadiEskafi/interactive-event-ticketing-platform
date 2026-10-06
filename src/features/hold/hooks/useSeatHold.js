import { useState, useCallback } from 'react';
import { mockTicketingService } from '../../seatmap/services/mockTicketingService';

const PENDING_BOOKING_STORAGE_KEY = 'pending_booking';

/**
 * Retrieve or generate a client-side anonymous session UUID
 */
export function getOrCreateAnonymousSessionId() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return `anon_session_${Math.random().toString(36).substring(2, 9)}`;
  }

  try {
    const stored = window.sessionStorage.getItem(PENDING_BOOKING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.anonymousSessionId) {
        return parsed.anonymousSessionId;
      }
    }
  } catch {
    // Fallback on JSON parse error
  }

  const generatedId = `anon_session_${
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
  }`;

  return generatedId;
}

/**
 * Persist pending booking details in sessionStorage
 */
export function persistPendingBooking(data) {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.setItem(PENDING_BOOKING_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Ignore sessionStorage quota errors
    }
  }
}

/**
 * Remove pending booking from sessionStorage upon release or completion
 */
export function clearPendingBooking() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(PENDING_BOOKING_STORAGE_KEY);
    } catch {
      // Safe fallback
    }
  }
}

/**
 * Custom hook orchestrating atomic seat reservation, anonymous session anchor, and release.
 */
export function useSeatHold() {
  const [isLocking, setIsLocking] = useState(false);
  const [holdError, setHoldError] = useState(null);
  const [reservationData, setReservationData] = useState(null);
  const [isExpired, setIsExpired] = useState(false);
  const [sessionId, setSessionId] = useState(() => getOrCreateAnonymousSessionId());

  const reserve = useCallback(async (eventId, seatIds, userId) => {
    if (!seatIds || seatIds.length === 0) {
      return { success: false, error: 'NO_SEATS_SELECTED' };
    }

    setIsLocking(true);
    setHoldError(null);

    // Anchor hold to authenticated userId if present, otherwise use anonymous session ID
    const effectiveUserId = userId || sessionId || getOrCreateAnonymousSessionId();
    setSessionId(effectiveUserId);

    try {
      const result = await mockTicketingService.reserveSeats(
        eventId,
        seatIds,
        effectiveUserId,
        300 // 5 minutes (300 seconds)
      );

      if (!result.success) {
        setHoldError(result.message || 'One or more requested seats are no longer available.');
        return result;
      }

      // Persist pending booking into sessionStorage
      persistPendingBooking({
        anonymousSessionId: effectiveUserId,
        eventId,
        seatIds: result.reserved_seat_ids,
        reservedUntil: result.reserved_until,
      });

      setReservationData({
        seatIds: result.reserved_seat_ids,
        reservedUntil: result.reserved_until,
        userId: effectiveUserId,
      });
      setIsExpired(false);
      return result;
    } catch {
      const msg = 'Failed to acquire seat hold. Please try again.';
      setHoldError(msg);
      return { success: false, message: msg };
    } finally {
      setIsLocking(false);
    }
  }, [sessionId]);

  const release = useCallback(async (eventId, seatIds, userId) => {
    const effectiveUserId = userId || sessionId;
    try {
      const result = await mockTicketingService.releaseSeats(eventId, seatIds, effectiveUserId);
      setReservationData(null);
      clearPendingBooking();
      return result;
    } catch (err) {
      return { success: false, error: err };
    }
  }, [sessionId]);

  const handleExpire = useCallback(() => {
    setIsExpired(true);
    clearPendingBooking();
  }, []);

  const clearHoldError = useCallback(() => {
    setHoldError(null);
  }, []);

  return {
    isLocking,
    holdError,
    reservationData,
    isExpired,
    sessionId,
    reserve,
    release,
    handleExpire,
    clearHoldError,
  };
}
