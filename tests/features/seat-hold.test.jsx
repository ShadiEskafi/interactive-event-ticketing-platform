import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { EventBookingPage } from '../../src/features/seatmap/EventBookingPage';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

describe('Seat Hold & Concurrency Control (SPEC-02 / REQ-HOLD-02.1)', () => {
  beforeEach(() => {
    mockTicketingService.resetState();
  });

  it('atomically locks selected seats and transitions to checkout on success', async () => {
    render(<EventBookingPage requireAuth={false} />);

    // Select available seat A-10
    const seatA10 = await screen.findByTestId('A-10');
    fireEvent.click(seatA10);
    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('1');

    // Click Proceed to Checkout
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(checkoutBtn);

    // Should transition to checkout view with countdown timer
    await waitFor(() => {
      expect(screen.getByTestId('hold-checkout-view')).toBeInTheDocument();
      expect(screen.getByTestId('hold-countdown')).toBeInTheDocument();
    });
  });

  it('rejects reservation with SEATS_UNAVAILABLE if seat is already locked by another attendee', async () => {
    // Simulate another user reserving A-11 beforehand
    await mockTicketingService.reserveSeats('evt-symphony-2026', ['A-11'], 'other-attendee-999');

    render(<EventBookingPage requireAuth={false} />);

    // Attempt to select A-11
    const seatA11 = await screen.findByTestId('A-11');
    expect(seatA11).toHaveAttribute('fill', '#F59E0B'); // Already reserved (Amber)

    // User selects A-12
    const seatA12 = await screen.findByTestId('A-12');
    fireEvent.click(seatA12);

    // Another user locks A-12 right before this user proceeds
    await mockTicketingService.reserveSeats('evt-symphony-2026', ['A-12'], 'competitor-attendee');

    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(checkoutBtn);

    // Must block transition, remain on map, and display CollisionAlert banner
    await waitFor(() => {
      expect(screen.queryByTestId('hold-checkout-view')).not.toBeInTheDocument();
      const collisionAlert = screen.getByRole('alert');
      expect(collisionAlert).toBeInTheDocument();
      expect(collisionAlert).toHaveTextContent(/no longer available/i);
    });
  });
});
