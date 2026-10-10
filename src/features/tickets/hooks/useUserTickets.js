import { useState, useEffect, useCallback } from 'react';
import { ticketingService as mockTicketingService } from '../../../services';

/**
 * Custom hook retrieving and organizing user's issued tickets (SPEC-04 / REQ-TICK-04.5)
 */
export function useUserTickets(userId) {
  const resolveEffectiveUserId = useCallback(() => {
    if (userId) return userId;
    if (typeof window !== 'undefined') {
      return (
        window.localStorage?.getItem('ticketcraft_anon_session_id') ||
        window.sessionStorage?.getItem('ticketcraft_anon_session_id') ||
        null
      );
    }
    return null;
  }, [userId]);

  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(() => Boolean(resolveEffectiveUserId()));
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    const effectiveId = resolveEffectiveUserId();
    if (!effectiveId) {
      setTickets([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const userTickets = await mockTicketingService.getUserTickets(effectiveId);
      setTickets(userTickets || []);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setIsLoading(false);
    }
  }, [resolveEffectiveUserId]);

  useEffect(() => {
    let isMounted = true;
    const effectiveId = resolveEffectiveUserId();
    if (!effectiveId) {
      return;
    }

    mockTicketingService
      .getUserTickets(effectiveId)
      .then((userTickets) => {
        if (isMounted) {
          setTickets(userTickets || []);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load tickets');
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [resolveEffectiveUserId]);

  // Group tickets by event_id or event_title
  const groupedTickets = tickets.reduce((acc, ticket) => {
    const key = ticket.event_id || ticket.event_title || 'default';
    if (!acc[key]) {
      acc[key] = {
        eventId: ticket.event_id,
        eventTitle: ticket.event_title || 'Grand Symphony Concert',
        eventDate: ticket.event_date || 'Saturday, Nov 14, 2026 • 8:00 PM',
        venueName: ticket.venue_name || 'Grand Symphony Hall, Auditorium',
        tickets: [],
      };
    }
    acc[key].tickets.push(ticket);
    return acc;
  }, {});

  return {
    tickets,
    groupedTickets: Object.values(groupedTickets),
    isLoading,
    error,
    refreshTickets: fetchTickets,
  };
}
