import { useState, useEffect, useRef, useMemo } from 'react';
import { computeRemainingSeconds, formatTimeRemaining } from '../utils/timeFormatters';

/**
 * Precision 300-Second Hold Countdown Hook
 * Recalculates from Date.now() on every tick to eliminate client clock drift and tab throttling skew.
 * Accepts external reservedUntil ISO string and preserves continuity across re-renders.
 */
export function useHoldTimer({ reservedUntil, onExpire }) {
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    computeRemainingSeconds(reservedUntil)
  );
  const [prevReservedUntil, setPrevReservedUntil] = useState(reservedUntil);
  const [warningAnnouncement, setWarningAnnouncement] = useState('');

  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Adjust state during render when reservedUntil changes (React recommended pattern)
  if (reservedUntil !== prevReservedUntil) {
    setPrevReservedUntil(reservedUntil);
    setRemainingSeconds(computeRemainingSeconds(reservedUntil));
  }

  const hasAnnouncedWarningRef = useRef(false);
  const hasExpiredRef = useRef(false);

  useEffect(() => {
    if (!reservedUntil) {
      return;
    }

    const currentRemaining = computeRemainingSeconds(reservedUntil);

    // If already expired at initialization
    if (currentRemaining <= 0) {
      if (!hasExpiredRef.current) {
        hasExpiredRef.current = true;
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      }
      return;
    }

    // Reset guards for a valid active hold
    hasAnnouncedWarningRef.current = currentRemaining <= 60;
    hasExpiredRef.current = false;

    const tick = () => {
      const remaining = computeRemainingSeconds(reservedUntil);
      setRemainingSeconds(remaining);

      // Trigger 60s warning screen reader announcement once
      if (remaining <= 60 && remaining > 0 && !hasAnnouncedWarningRef.current) {
        hasAnnouncedWarningRef.current = true;
        setWarningAnnouncement('1 minute remaining to complete your booking');
      }

      // Trigger expiration handshake
      if (remaining <= 0) {
        if (!hasExpiredRef.current) {
          hasExpiredRef.current = true;
          if (onExpireRef.current) {
            onExpireRef.current();
          }
        }
      }
    };

    const intervalId = setInterval(tick, 1000);

    return () => {
      clearInterval(intervalId);
    };
  }, [reservedUntil]);

  const formattedTime = useMemo(
    () => formatTimeRemaining(remainingSeconds),
    [remainingSeconds]
  );

  const isWarning = remainingSeconds <= 60 && remainingSeconds > 0;
  const isExpired = remainingSeconds <= 0;

  return {
    remainingSeconds,
    formattedTime,
    isWarning,
    isExpired,
    warningAnnouncement,
  };
}
