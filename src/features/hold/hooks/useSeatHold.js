import { useState, useCallback, useEffect, useRef } from 'react';
import { ticketingService as mockTicketingService } from '../../../services';

export const ANON_SESSION_KEY = 'ticketcraft_anon_session_id';
export const PENDING_BOOKING_STORAGE_KEY = 'pending_booking';

/**
 * Retrieve or generate a client-side anonymous session UUID, persisted in sessionStorage.
 */
export function getOrCreateAnonymousSessionId() {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return `anon_session_${Math.random().toString(36).substring(2, 9)}`;
  }

  try {
    const existing = window.sessionStorage.getItem(ANON_SESSION_KEY);
    if (existing) {
      return existing;
    }

    const stored = window.sessionStorage.getItem(PENDING_BOOKING_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed?.anonymousSessionId) {
        window.sessionStorage.setItem(ANON_SESSION_KEY, parsed.anonymousSessionId);
        return parsed.anonymousSessionId;
      }
    }
  } catch {
    // Storage read error fallback
  }

  const generatedId = `anon_session_${
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).substring(2, 11) + Date.now().toString(36)
  }`;

  try {
    window.sessionStorage.setItem(ANON_SESSION_KEY, generatedId);
  } catch {
    // Storage quota fallback
  }

  return generatedId;
}

/**
 * Safely parse and retrieve pending booking details from sessionStorage.
 */
export function getStoredPendingBooking() {
  if (typeof window === 'undefined' || !window.sessionStorage) return null;
  try {
    const raw = window.sessionStorage.getItem(PENDING_BOOKING_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Persist pending booking details in sessionStorage and anchor the anonymous session ID.
 */
export function persistPendingBooking(data) {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      if (data?.anonymousSessionId) {
        window.sessionStorage.setItem(ANON_SESSION_KEY, data.anonymousSessionId);
      }
      window.sessionStorage.setItem(PENDING_BOOKING_STORAGE_KEY, JSON.stringify(data));
    } catch {
      // Storage quota fallback
    }
  }
}

/**
 * Remove pending booking from sessionStorage upon release or completion.
 */
export function clearPendingBooking() {
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      window.sessionStorage.removeItem(PENDING_BOOKING_STORAGE_KEY);
    } catch {
      // Storage remove error fallback
    }
  }
}

/**
 * Custom hook orchestrating atomic seat reservation, anonymous session anchor,
 * page refresh recovery, and beforeunload teardown release.
 */
export function useSeatHold() {
  const [isLocking, setIsLocking] = useState(false);
  const [holdError, setHoldError] = useState(null);
  const [sessionId, setSessionId] = useState(() => getOrCreateAnonymousSessionId());

  // Restore reservation data on mount if active hold exists in sessionStorage
  const [reservationData, setReservationData] = useState(() => {
    const stored = getStoredPendingBooking();
    if (stored && stored.reservedUntil) {
      const untilMs = new Date(stored.reservedUntil).getTime();
      if (untilMs > Date.now()) {
        return {
          seatIds: stored.seatIds || [],
          reservedUntil: stored.reservedUntil,
          userId: stored.anonymousSessionId || stored.userId,
        };
      }
    }
    return null;
  });

  const [isExpired, setIsExpired] = useState(() => {
    const stored = getStoredPendingBooking();
    if (stored && stored.reservedUntil) {
      const untilMs = new Date(stored.reservedUntil).getTime();
      return untilMs <= Date.now();
    }
    return false;
  });

  const eventIdRef = useRef(getStoredPendingBooking()?.eventId || 'evt-symphony-2026');

  // Check expired hold on mount: clear storage and release if past expiry
  useEffect(() => {
    const stored = getStoredPendingBooking();
    if (stored && stored.reservedUntil) {
      const untilMs = new Date(stored.reservedUntil).getTime();
      if (untilMs <= Date.now()) {
        clearPendingBooking();
        if (stored.seatIds && stored.seatIds.length > 0) {
          const effectiveUser = stored.anonymousSessionId || stored.userId || sessionId;
          mockTicketingService.releaseSeats(
            stored.eventId || eventIdRef.current,
            stored.seatIds,
            effectiveUser
          );
        }
      }
    }
  }, [sessionId]);

  // Teardown on Window Unload: safely release seats if user closes tab before completing checkout
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (reservationData?.seatIds?.length && !isExpired) {
        const eventId = eventIdRef.current || 'evt-symphony-2026';
        const userId = reservationData.userId || sessionId;

        if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
          try {
            const payload = JSON.stringify({ eventId, seatIds: reservationData.seatIds, userId });
            const blob = new Blob([payload], { type: 'application/json' });
            navigator.sendBeacon('/api/seats/release', blob);
          } catch {
            // Ignore beacon serialization errors
          }
        }

        try {
          mockTicketingService.releaseSeats(eventId, reservationData.seatIds, userId);
        } catch {
          // Safe unload fallback
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [reservationData, isExpired, sessionId]);

  const reserve = useCallback(async (eventId, seatIds, userId) => {
    if (!seatIds || seatIds.length === 0) {
      return { success: false, error: 'NO_SEATS_SELECTED' };
    }

    setIsLocking(true);
    setHoldError(null);
    eventIdRef.current = eventId;

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
    setReservationData,
    isExpired,
    setIsExpired,
    sessionId,
    reserve,
    release,
    handleExpire,
    clearHoldError,
  };
}
