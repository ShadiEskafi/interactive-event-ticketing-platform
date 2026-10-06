import { mockTicketingService } from '../features/seatmap/services/mockTicketingService';

/**
 * Domain Ticketing Service Wrapper
 * Conforms to ITicketingService for seat reservations, hold transfers, and releases.
 */
class TicketingService {
  async getVenueLayout(venueId) {
    return mockTicketingService.getVenueLayout(venueId);
  }

  async getSeatAvailability(eventId) {
    return mockTicketingService.getSeatAvailability(eventId);
  }

  async reserveSeats(eventId, seatIds, userId, holdDurationSeconds = 300) {
    return mockTicketingService.reserveSeats(eventId, seatIds, userId, holdDurationSeconds);
  }

  async releaseSeats(eventId, seatIds, userId) {
    return mockTicketingService.releaseSeats(eventId, seatIds, userId);
  }

  async transferHold(eventId, seatIds, userId, anonymousSessionId) {
    // Supports object signature: transferHold({ eventId, seatIds, userId, anonymousSessionId })
    if (typeof eventId === 'object' && eventId !== null) {
      const params = eventId;
      return mockTicketingService.transferHold(
        params.eventId,
        params.seatIds,
        params.userId,
        params.anonymousSessionId
      );
    }

    return mockTicketingService.transferHold(eventId, seatIds, userId, anonymousSessionId);
  }

  subscribeToSeatChanges(eventId, callback) {
    return mockTicketingService.subscribeToSeatChanges(eventId, callback);
  }

  resetState() {
    return mockTicketingService.resetState();
  }
}

export const ticketingService = new TicketingService();
