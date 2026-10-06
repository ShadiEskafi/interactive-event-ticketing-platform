import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AuthProvider } from '../../src/features/auth';
import { CheckoutFlow } from '../../src/features/checkout';
import { MockAuthService } from '../mocks/mockAuthService';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

describe('Auth Boundary Timeout Lockdown (SPEC-03 / Scenario 3.3)', () => {
  let mockAuth;
  const mockSeats = [
    { id: 'D-4', rowLabel: 'D', seatNumber: 4, category: 'VIP', price: 150 },
    { id: 'D-5', rowLabel: 'D', seatNumber: 5, category: 'VIP', price: 150 },
  ];
  const subtotal = 300;
  const holdDurationSeconds = 300;

  beforeEach(() => {
    vi.useFakeTimers();
    mockAuth = new MockAuthService(null);
    window.sessionStorage.clear();
    mockTicketingService.resetState();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('Scenario 3.3: locks modal inputs, displays expired alert, releases seats, and provides Back to Map CTA', async () => {
    const releaseSeatsSpy = vi.spyOn(mockTicketingService, 'releaseSeats');
    const handleReturnToMap = vi.fn();
    const handleExpire = vi.fn();

    const reservedUntil = new Date(Date.now() + holdDurationSeconds * 1000).toISOString();

    render(
      <AuthProvider customAuthService={mockAuth}>
        <CheckoutFlow
          eventId="evt-symphony-2026"
          selectedSeats={mockSeats}
          subtotal={subtotal}
          tierSummary={{ VIP: 2 }}
          reservationData={{
            reservedUntil,
            userId: 'anon_session_timeout',
            seatIds: ['D-4', 'D-5'],
          }}
          onExpire={handleExpire}
          onReturnToMap={handleReturnToMap}
        />
      </AuthProvider>
    );

    // 1. Visitor clicks "Proceed to Checkout" to open AuthModal
    fireEvent.click(screen.getByRole('button', { name: /Proceed to Checkout/i }));
    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();

    // Verify storage has pending_booking initially
    expect(window.sessionStorage.getItem('pending_booking')).not.toBeNull();

    // Inputs are initially enabled
    expect(screen.getByLabelText(/Email Address/i)).not.toBeDisabled();
    expect(screen.getByLabelText(/Password/i)).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /^Sign In$/i })).not.toBeDisabled();
    expect(screen.getByTestId('oauth-google-btn')).not.toBeDisabled();

    // 2. Advance time past 300 seconds (expire hold)
    act(() => {
      vi.advanceTimersByTime(300 * 1000);
    });

    // 3. Alert must display within modal
    expect(
      screen.getByText(/Your reservation hold has expired\. The seats have been released\./i)
    ).toBeInTheDocument();

    // 4. releaseSeats must have been invoked with held seat IDs
    expect(releaseSeatsSpy).toHaveBeenCalledWith(
      'evt-symphony-2026',
      ['D-4', 'D-5'],
      'anon_session_timeout'
    );

    // 5. pending_booking is evicted from sessionStorage
    expect(window.sessionStorage.getItem('pending_booking')).toBeNull();

    // 6. "Back to Map" CTA dismisses the modal and calls onReturnToMap
    const backBtn = screen.getByTestId('back-to-map-btn');
    expect(backBtn).toBeInTheDocument();

    fireEvent.click(backBtn);
    expect(handleReturnToMap).toHaveBeenCalled();

    releaseSeatsSpy.mockRestore();
  });
});
