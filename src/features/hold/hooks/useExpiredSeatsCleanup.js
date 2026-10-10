import { useEffect } from 'react';
import { ticketingService } from '../../../services';

/**
 * Defensive Resiliency Hook: useExpiredSeatsCleanup
 * Periodically sweeps server-side / mock expired seat holds in the background (default: every 30 seconds).
 * Ensures that if pg_cron is delayed or unavailable, active client sessions regularly purge stale locks.
 */
export function useExpiredSeatsCleanup(eventId, { intervalMs = 30000, enabled = true } = {}) {
  useEffect(() => {
    if (!enabled || !eventId || intervalMs <= 0) return;

    let isMounted = true;

    const intervalId = setInterval(async () => {
      if (isMounted) {
        try {
          await ticketingService.releaseExpiredSeats(eventId);
        } catch (err) {
          console.warn('[useExpiredSeatsCleanup] Background expired seats sweep failed:', err);
        }
      }
    }, intervalMs);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [eventId, intervalMs, enabled]);
}
