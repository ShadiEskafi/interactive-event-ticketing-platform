import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EventBookingPage } from '../../src/features/seatmap/EventBookingPage';

describe('Cart Selection & 5-Seat Limit (SPEC-01 Scenarios 1.2, 1.3, 1.4)', () => {
  it('aggregates multi-seat selection and subtotal correctly', async () => {
    render(<EventBookingPage />);

    // Wait for layout and seats to load
    const seatA1 = await screen.findByTestId('A-1');
    const seatF5 = await screen.findByTestId('F-5');

    // Click VIP seat A-1 ($150.00)
    fireEvent.click(seatA1);
    expect(seatA1).toHaveAttribute('fill', '#2563EB');

    // Click Regular seat F-5 ($85.00)
    fireEvent.click(seatF5);
    expect(seatF5).toHaveAttribute('fill', '#2563EB');

    // Verify cart count and subtotal ($150 + $85 = $235.00)
    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$235.00');

    // Proceed to Checkout button should be enabled
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    expect(checkoutBtn).toBeEnabled();
  });

  it('enforces 5-seat hard limit and renders accessible alert banner', async () => {
    render(<EventBookingPage />);

    // Select 5 seats (e.g. A-3, A-4, A-5, A-6, A-7)
    const seatsToSelect = ['A-3', 'A-4', 'A-5', 'A-6', 'A-7'];
    for (const seatId of seatsToSelect) {
      const el = await screen.findByTestId(seatId);
      fireEvent.click(el);
    }

    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('5');

    // Attempt to click 6th available seat (A-8)
    const seat6 = await screen.findByTestId('A-8');
    fireEvent.click(seat6);

    // 6th seat must NOT be selected
    expect(seat6).toHaveAttribute('fill', '#10B981');
    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('5');

    // Accessible alert banner must be visible
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Maximum of 5 seats allowed per booking.');
  });

  it('supports deselecting an already selected seat', async () => {
    render(<EventBookingPage />);

    // Select B-3 ($150) and B-4 ($150)
    const seatB3 = await screen.findByTestId('B-3');
    const seatB4 = await screen.findByTestId('B-4');

    fireEvent.click(seatB3);
    fireEvent.click(seatB4);

    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('2');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$300.00');

    // Deselect B-4
    fireEvent.click(seatB4);

    expect(seatB4).toHaveAttribute('fill', '#10B981');
    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('1');
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$150.00');
  });
});
