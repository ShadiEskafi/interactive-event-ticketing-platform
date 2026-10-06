import { useState } from 'react';
import { HoldTimer } from './HoldTimer';
import { SessionExpiredModal } from './SessionExpiredModal';
import { useHoldLifecycle } from './hooks/useHoldLifecycle';
import { formatCurrency } from '../seatmap/utils/formatters';

/**
 * Hold Checkout View Container
 * Displays the 300s countdown timer, order summary, and payment inputs.
 * Freezes all inputs upon session expiration and guards against tab teardown.
 */
export function HoldCheckoutView({
  eventId = 'evt-symphony-2026',
  selectedSeats = [],
  reservationData,
  isExpired,
  onExpire,
  onReturnToMap,
  onPaymentSuccess,
  user = null,
}) {
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    cardNumber: '•••• •••• •••• 4242',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tab closure & sudden navigation guard (beacon / beforeunload safe release)
  useHoldLifecycle({
    eventId,
    seatIds: reservationData?.seatIds || selectedSeats.map((s) => s.id),
    userId: reservationData?.userId,
    isActive: !isExpired && Boolean(reservationData?.seatIds?.length),
  });

  const subtotal = selectedSeats.reduce((sum, s) => sum + (s.price || 0), 0);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isExpired || isSubmitting) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    }, 500);
  };

  return (
    <div className="hold-checkout-container" data-testid="hold-checkout-view">
      {/* Checkout Header with Countdown Timer */}
      <header className="checkout-top-header">
        <div className="checkout-header-info">
          <h2 className="checkout-step-title">Express Checkout</h2>
          <p className="checkout-step-subtitle">
            Complete your purchase before your reservation hold expires.
          </p>
        </div>

        <HoldTimer
          reservedUntil={reservationData?.reservedUntil}
          onExpire={onExpire}
        />
      </header>

      <div className="checkout-main-grid">
        {/* Payment & Attendee Form */}
        <section className="checkout-form-section" aria-label="Payment Information" data-testid="checkout-step-payment">
          <form onSubmit={handleSubmit} className="checkout-form">
            <div className="form-group">
              <label htmlFor="attendee-name">Full Name</label>
              <input
                id="attendee-name"
                type="text"
                disabled={isExpired}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="attendee-email">Email Address</label>
              <input
                id="attendee-email"
                type="email"
                disabled={isExpired}
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="card-number">Payment Details</label>
              <input
                id="card-number"
                type="text"
                disabled={isExpired}
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-pay-now"
              disabled={isExpired || isSubmitting}
            >
              {isSubmitting ? 'Processing Payment...' : `Confirm & Pay ${formatCurrency(subtotal)}`}
            </button>
          </form>
        </section>

        {/* Order Summary Sidebar */}
        <aside className="checkout-order-summary" aria-label="Reserved Order Summary">
          <h3 className="summary-title">Reserved Seats ({selectedSeats.length})</h3>

          <div className="checkout-seat-list">
            {selectedSeats.map((seat) => (
              <div key={seat.id} className="checkout-seat-row" data-testid={`retained-seat-${seat.id}`}>
                <div>
                  <strong>Seat {seat.rowLabel}-{seat.seatNumber}</strong>
                  <span className="checkout-seat-tier"> ({seat.category})</span>
                </div>
                <span>{formatCurrency(seat.price)}</span>
              </div>
            ))}
          </div>

          <div className="checkout-price-divider" />

          <div className="checkout-total-row">
            <span>Total Amount</span>
            <strong className="checkout-total-val">{formatCurrency(subtotal)}</strong>
          </div>
        </aside>
      </div>

      {/* Blocking Session Expired Modal */}
      <SessionExpiredModal
        isOpen={isExpired}
        onReturnToMap={onReturnToMap}
      />
    </div>
  );
}
