import { useEffect } from 'react';
import { mockTicketingService } from '../../seatmap/services/mockTicketingService';

/**
 * Custom hook subscribing to Realtime seat updates (simulating Supabase Realtime channel)
 */
export function useRealtimeSeats(eventId, onSeatsUpdated) {
  useEffect(() => {
    if (!eventId || !onSeatsUpdated) return;

    const unsubscribe = mockTicketingService.subscribeToSeatChanges(
      eventId,
      (updatedSeats) => {
        onSeatsUpdated(updatedSeats);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [eventId, onSeatsUpdated]);
}
