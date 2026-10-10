import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventBookingPage } from '../../src/features/seatmap/EventBookingPage';
import { AuthProvider } from '../../src/features/auth';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

describe('Ticket Issuance & Sold Status Transition (SPEC-04 / Scenario 4.1)', () => {
  const authedUser = {
    id: 'usr_buyer_123',
    email: 'buyer@example.com',
    user_metadata: {
      full_name: 'John Musiclover',
    },
  };

  const mockAuthService = {
    currentUser: authedUser,
    listeners: new Set(),
    async getSession() {
      return { session: { user: authedUser }, user: authedUser };
    },
    onAuthStateChange(cb) {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
    },
    async signOut() {
      return { error: null };
    },
  };

  beforeEach(() => {
    mockTicketingService.resetState();
    window.sessionStorage.clear();
  });

  afterEach(() => {
    mockTicketingService.resetState();
    window.sessionStorage.clear();
  });

  it('permanently marks seats as sold (#9CA3AF) upon payment confirmation and renders receipt', async () => {
    const confirmBookingSpy = vi.spyOn(mockTicketingService, 'confirmBooking');

    render(
      <AuthProvider customAuthService={mockAuthService}>
        <EventBookingPage requireAuth={false} />
      </AuthProvider>
    );

    // 1. Wait for seat map to load
    const seatA1 = await screen.findByTestId('A-1');
    expect(seatA1).toBeInTheDocument();
    expect(seatA1).toHaveAttribute('fill', '#10B981'); // Available

    // 2. Select seats A-1 and A-2
    fireEvent.click(seatA1);
    const seatA2 = screen.getByTestId('A-2');
    fireEvent.click(seatA2);

    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('2');

    // 3. Click Proceed to Checkout (authenticated user bypasses modal directly to checkout)
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(checkoutBtn);

    // 4. Verify checkout view is mounted
    const checkoutView = await screen.findByTestId('hold-checkout-view');
    expect(checkoutView).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('buyer@example.com');

    // 5. Submit Payment Form
    const payBtn = screen.getByRole('button', { name: /Confirm & Pay/i });
    fireEvent.click(payBtn);

    // 6. Verify confirmBooking RPC is called with correct parameters
    await waitFor(() => {
      expect(confirmBookingSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          eventId: 'evt-symphony-2026',
          seatIds: ['A-1', 'A-2'],
          userId: 'usr_buyer_123',
          attendeeEmail: 'buyer@example.com',
        })
      );
    });

    // 7. Verify Receipt Page mounts with confirmation message and reference badge
    const receiptPage = await screen.findByTestId('ticket-receipt-page');
    expect(receiptPage).toBeInTheDocument();
    expect(screen.getByText('Booking Confirmed!')).toBeInTheDocument();
    expect(screen.getByTestId('booking-reference-badge')).toBeInTheDocument();

    // 8. Verify ticket records generated
    const issuedTickets = mockTicketingService.tickets;
    expect(issuedTickets).toHaveLength(2);
    expect(issuedTickets[0].ticket_code).toMatch(/^TKT-/);
    expect(issuedTickets[0].is_used).toBe(false);
    expect(issuedTickets[0].scanned_at).toBeNull();
    expect(issuedTickets[0].qr_signature).toMatch(/^[a-f0-9]{64}$/);

    // 9. Verify seats in service are permanently 'sold'
    const updatedA1 = mockTicketingService.seats.find((s) => s.id === 'A-1');
    const updatedA2 = mockTicketingService.seats.find((s) => s.id === 'A-2');
    expect(updatedA1.status).toBe('sold');
    expect(updatedA2.status).toBe('sold');

    confirmBookingSpy.mockRestore();
  });
});
