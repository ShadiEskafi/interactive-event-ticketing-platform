import { useEffect } from 'react';
import { ticketingService } from '../../../services';

/**
 * Custom hook subscribing to Realtime seat updates (Supabase Realtime channel or mock fallback)
 */
export function useRealtimeSeats(eventId, onSeatsUpdated) {
  useEffect(() => {
    if (!eventId || !onSeatsUpdated) return;

    const unsubscribe = ticketingService.subscribeToSeatChanges(
      eventId,
      (updatedSeats) => {
        onSeatsUpdated(updatedSeats);
      }
    );

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [eventId, onSeatsUpdated]);
}
