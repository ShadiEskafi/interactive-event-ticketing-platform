import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HoldTimer } from '../../src/features/hold/HoldTimer';
import { HoldCheckoutView } from '../../src/features/hold/HoldCheckoutView';

describe('Hold Countdown Timer & Expiration (SPEC-02 / REQ-HOLD-02.3, REQ-HOLD-02.4)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats initial 300s countdown as 05:00 and ticks down every second', () => {
    const reservedUntil = new Date(Date.now() + 300 * 1000).toISOString();
    const handleExpire = vi.fn();

    render(<HoldTimer reservedUntil={reservedUntil} onExpire={handleExpire} />);

    expect(screen.getByTestId('timer-display')).toHaveTextContent('05:00');

    // Advance 60 seconds
    act(() => {
      vi.advanceTimersByTime(60 * 1000);
    });

    expect(screen.getByTestId('timer-display')).toHaveTextContent('04:00');
    expect(handleExpire).not.toHaveBeenCalled();
  });

  it('triggers warning style text-rose-600 and accessible announcement at <= 60 seconds', () => {
    const reservedUntil = new Date(Date.now() + 61 * 1000).toISOString();
    const handleExpire = vi.fn();

    render(<HoldTimer reservedUntil={reservedUntil} onExpire={handleExpire} />);

    const timer = screen.getByTestId('hold-countdown');
    expect(timer).not.toHaveClass('text-rose-600');

    // Advance 2 seconds (now 59 seconds left)
    act(() => {
      vi.advanceTimersByTime(2 * 1000);
    });

    expect(timer).toHaveClass('text-rose-600');
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveTextContent(/1 minute remaining/i);
  });

  it('disables form inputs and mounts SessionExpiredModal when timer reaches 00:00', () => {
    const reservedUntil = new Date(Date.now() + 5 * 1000).toISOString();
    const handleExpire = vi.fn();
    const handleReturnToMap = vi.fn();

    const { rerender } = render(
      <HoldCheckoutView
        selectedSeats={[{ id: 'A-1', rowLabel: 'A', seatNumber: 1, category: 'VIP', price: 150 }]}
        reservationData={{ reservedUntil }}
        isExpired={false}
        onExpire={handleExpire}
        onReturnToMap={handleReturnToMap}
      />
    );

    // Advance 5 seconds to expire
    act(() => {
      vi.advanceTimersByTime(5 * 1000);
    });

    expect(handleExpire).toHaveBeenCalled();

    // Rerender with isExpired = true (simulating state transition in parent)
    rerender(
      <HoldCheckoutView
        selectedSeats={[{ id: 'A-1', rowLabel: 'A', seatNumber: 1, category: 'VIP', price: 150 }]}
        reservationData={{ reservedUntil }}
        isExpired={true}
        onExpire={handleExpire}
        onReturnToMap={handleReturnToMap}
      />
    );

    // Form inputs must be disabled
    expect(screen.getByLabelText(/Full Name/i)).toBeDisabled();
    expect(screen.getByLabelText(/Email Address/i)).toBeDisabled();
    expect(screen.getByRole('button', { name: /Pay/i })).toBeDisabled();

    // Session Expired modal must be displayed
    const modal = screen.getByRole('dialog');
    expect(modal).toBeInTheDocument();
    expect(modal).toHaveTextContent(/Reservation Expired/i);
  });
});
