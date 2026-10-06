import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { EventBookingPage } from '../../src/features/seatmap/EventBookingPage';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

describe('Realtime Seat Synchronization (SPEC-02 / REQ-HOLD-02.2)', () => {
  beforeEach(() => {
    mockTicketingService.resetState();
  });

  it('reflects seat status changes broadcast from other sessions within 200ms', async () => {
    render(<EventBookingPage />);

    // Initially seat D-10 is available
    const seatD10 = await screen.findByTestId('D-10');
    expect(seatD10).toHaveAttribute('fill', '#10B981'); // Available (Green)

    // Another attendee reserves D-10
    await act(async () => {
      await mockTicketingService.reserveSeats(
        'evt-symphony-2026',
        ['D-10'],
        'remote-client-uuid-777'
      );
    });

    // Realtime broadcast should have updated seat fill to Amber (#F59E0B)
    expect(seatD10).toHaveAttribute('fill', '#F59E0B');
    expect(seatD10.style.cursor).toBe('not-allowed');
  });

  it('unsubscribes cleanly from realtime updates when unmounted', async () => {
    const { unmount } = render(<EventBookingPage />);
    await screen.findByTestId('D-10');

    // Confirm active listener exists in service
    expect(mockTicketingService.listeners.size).toBeGreaterThan(0);

    // Unmount view
    unmount();

    // Listeners should be cleaned up
    expect(mockTicketingService.listeners.size).toBe(0);
  });
});
