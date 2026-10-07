import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider } from '../../src/features/auth';
import { CheckoutFlow } from '../../src/features/checkout';
import { EventBookingPage } from '../../src/features/seatmap/EventBookingPage';
import { AppContent } from '../../src/App';
import { MockAuthService } from '../mocks/mockAuthService';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

describe('Smart Frictionless Auth & Retention (SPEC-03 / Scenarios 3.1 & 3.2)', () => {
  let mockAuth;
  const mockSeats = [
    { id: 'C-1', rowLabel: 'C', seatNumber: 1, category: 'VIP', price: 150 },
    { id: 'C-2', rowLabel: 'C', seatNumber: 2, category: 'VIP', price: 150 },
  ];
  const subtotal = 300;
  let reservedUntil;

  beforeEach(() => {
    reservedUntil = new Date(Date.now() + 298 * 1000).toISOString(); // ~04:58 left
    mockAuth = new MockAuthService(null); // Unauthenticated guest
    window.sessionStorage.clear();
    mockTicketingService.resetState();
  });

  it('Scenario 3.1: prompts unauthenticated guest only at checkout boundary with active timer and options', async () => {
    render(
      <AuthProvider customAuthService={mockAuth}>
        <CheckoutFlow
          eventId="evt-symphony-2026"
          selectedSeats={mockSeats}
          subtotal={subtotal}
          tierSummary={{ VIP: 2 }}
          reservationData={{
            reservedUntil,
            userId: 'anon_session_test',
            seatIds: ['C-1', 'C-2'],
          }}
        />
      </AuthProvider>
    );

    // Initial state: Step 1 (Review) is visible, modal is NOT open
    expect(screen.getByTestId('checkout-step-review')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    // Visitor clicks "Proceed to Checkout"
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    fireEvent.click(checkoutBtn);

    // Modal must open with accessible dialog semantics
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Sign In to Complete Booking')).toBeInTheDocument();

    // Verify tabs and OAuth buttons
    expect(screen.getByRole('tab', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /Sign Up/i })).toBeInTheDocument();
    expect(screen.getByTestId('oauth-google-btn')).toBeInTheDocument();
    expect(screen.getByTestId('oauth-github-btn')).toBeInTheDocument();

    // Verify hold timer countdown badge in modal header (e.g. 04:58)
    const modalTimer = screen.getByTestId('auth-modal-timer');
    expect(modalTimer).toBeInTheDocument();
    expect(modalTimer).toHaveTextContent(/04:\d\d/);

    // Verify storage persistence of pending_booking
    const storedRaw = window.sessionStorage.getItem('pending_booking');
    expect(storedRaw).not.toBeNull();
    const stored = JSON.parse(storedRaw);
    expect(stored.seatIds).toEqual(['C-1', 'C-2']);
    expect(stored.subtotal).toBe(300);
    expect(stored.reservedUntil).toBe(reservedUntil);
  });

  it('Scenario 3.2: attendee logs in, transfers hold ownership, and advances to Step 2 without seat or timer loss', async () => {
    const transferHoldSpy = vi.spyOn(mockTicketingService, 'transferHold');

    render(
      <AuthProvider customAuthService={mockAuth}>
        <CheckoutFlow
          eventId="evt-symphony-2026"
          selectedSeats={mockSeats}
          subtotal={subtotal}
          tierSummary={{ VIP: 2 }}
          reservationData={{
            reservedUntil,
            userId: 'anon_session_test',
            seatIds: ['C-1', 'C-2'],
          }}
        />
      </AuthProvider>
    );

    // Open Auth modal
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Checkout/i }));
    await screen.findByRole('dialog');

    // Fill credentials in LoginForm
    const emailInput = screen.getByLabelText(/Email Address/i);
    const passInput = screen.getByLabelText(/Password/i);
    fireEvent.change(emailInput, { target: { value: 'attendee@example.com' } });
    fireEvent.change(passInput, { target: { value: 'password123' } });

    // Submit Sign In
    const signInBtn = screen.getByRole('button', { name: /^Sign In$/i });
    await act(async () => {
      fireEvent.click(signInBtn);
    });

    // 1. Modal must close automatically
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 2. Transfer hold ownership must be called with authenticated user ID
    expect(transferHoldSpy).toHaveBeenCalledWith(
      'evt-symphony-2026',
      ['C-1', 'C-2'],
      expect.stringMatching(/^usr_/),
      'anon_session_test'
    );

    // 3. Lands on Step 2 (Payment Step)
    const paymentStep = screen.getByTestId('checkout-step-payment');
    expect(paymentStep).toBeInTheDocument();

    // 4. Retained seat tags, subtotal, and pre-filled email
    expect(screen.getByTestId('retained-seat-C-1')).toBeInTheDocument();
    expect(screen.getByTestId('retained-seat-C-2')).toBeInTheDocument();
    expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$300.00');
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('attendee@example.com');

    // 5. Timer continues without reset to 300s
    expect(screen.getByTestId('timer-display')).toHaveTextContent(/04:\d\d/);

    transferHoldSpy.mockRestore();
  });

  it('supports modal dismissal on Escape key while timer is active', async () => {
    render(
      <AuthProvider customAuthService={mockAuth}>
        <CheckoutFlow
          eventId="evt-symphony-2026"
          selectedSeats={mockSeats}
          subtotal={subtotal}
          tierSummary={{ VIP: 2 }}
          reservationData={{
            reservedUntil,
            userId: 'anon_session_test',
            seatIds: ['C-1', 'C-2'],
          }}
        />
      </AuthProvider>
    );

    // Open modal
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Checkout/i }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(window, { key: 'Escape' });

    // Modal dismisses, back on Step 1 review
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('checkout-step-review')).toBeInTheDocument();
  });

  it('Scenario 3.4: guest on EventBookingPage selects seats, clicks proceed to checkout, opens AuthModal with countdown, logs in, and lands on PaymentStep', async () => {
    const transferHoldSpy = vi.spyOn(mockTicketingService, 'transferHold');

    render(
      <AuthProvider customAuthService={mockAuth}>
        <EventBookingPage requireAuth={true} />
      </AuthProvider>
    );

    // 1. Select seat A-10 as a guest
    const seatA10 = await screen.findByTestId('A-10');
    fireEvent.click(seatA10);
    expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('1');

    // 2. Click "Proceed to Checkout"
    const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
    await act(async () => {
      fireEvent.click(checkoutBtn);
    });

    // 3. Guest must be intercepted by AuthModal with countdown badge
    const dialog = await screen.findByRole('dialog', {}, { timeout: 4000 });
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByText('Sign In to Complete Booking')).toBeInTheDocument();
    expect(screen.getByTestId('auth-modal-timer')).toBeInTheDocument();

    // 4. Fill credentials in LoginForm and submit
    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'guest_promoted@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /^Sign In$/i }));
    });

    // 5. Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // 6. Hold ownership is transferred to authenticated user
    expect(transferHoldSpy).toHaveBeenCalledWith(
      'evt-symphony-2026',
      ['A-10'],
      expect.stringMatching(/^usr_/),
      expect.stringMatching(/^anon_session_/)
    );

    // 7. Lands on PaymentStep view with pre-filled email and retained seat
    expect(screen.getByTestId('hold-checkout-view')).toBeInTheDocument();
    expect(screen.getByTestId('checkout-step-payment')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toHaveValue('guest_promoted@example.com');
    expect(screen.getByTestId('retained-seat-A-10')).toBeInTheDocument();

    transferHoldSpy.mockRestore();
  });

  it('Scenario 3.5: header navbar reflects Guest status when user is null, and user profile with Sign Out button when authenticated', async () => {
    // 1. Initially guest
    render(
      <AuthProvider customAuthService={mockAuth}>
        <AppContent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-guest-badge')).toBeInTheDocument();
    expect(screen.getByTestId('btn-nav-signin')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-signout')).not.toBeInTheDocument();

    // 2. Sign in via navbar button
    fireEvent.click(screen.getByTestId('btn-nav-signin'));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Email Address/i), {
      target: { value: 'navbar_user@example.com' },
    });
    fireEvent.change(screen.getByLabelText(/Password/i), {
      target: { value: 'password123' },
    });

    await act(async () => {
      fireEvent.click(screen.getByTestId('btn-signin-submit'));
    });

    // Modal closes
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Header now reflects logged in user
    expect(screen.getByTestId('user-profile-badge')).toHaveTextContent('navbar_user');
    const signOutBtn = screen.getByTestId('btn-signout');
    expect(signOutBtn).toBeInTheDocument();

    // 3. Click Sign Out
    await act(async () => {
      fireEvent.click(signOutBtn);
    });

    // Reverts to Guest
    expect(screen.getByTestId('user-guest-badge')).toBeInTheDocument();
    expect(screen.getByTestId('btn-nav-signin')).toBeInTheDocument();
    expect(screen.queryByTestId('btn-signout')).not.toBeInTheDocument();
  });
});
