import { useEffect } from 'react';
import { ticketingService } from '../../../services';

/**
 * Lifecycle hook guarding active holds against sudden tab closures or navigation away.
 * Employs navigator.sendBeacon or emergency release call to ticketingService.
 */
export function useHoldLifecycle({ eventId, seatIds, userId, isActive = true }) {
  useEffect(() => {
    if (!isActive || !seatIds || seatIds.length === 0) return;

    const handleBeforeUnload = () => {
      // 1. Attempt navigator.sendBeacon for remote API endpoints
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          const payload = JSON.stringify({ eventId, seatIds, userId });
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon('/api/seats/release', blob);
        } catch {
          // Ignore beacon serialization errors on unload
        }
      }

      // 2. Immediate cleanup call to mock ticketing service
      try {
        ticketingService.releaseSeats(eventId, seatIds, userId);
      } catch {
        // Safe unload fallback
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [eventId, seatIds, userId, isActive]);
}
