import { useState } from 'react';
import { HoldTimer } from '../../hold/HoldTimer';
import { formatCurrency } from '../../seatmap/utils/formatters';
import { ticketingService as mockTicketingService } from '../../../services';
import '../CheckoutFlow.css';

/**
 * Step 2: Payment and Order Confirmation (SPEC-03 / Scenario 3.2, SPEC-04 / Scenario 4.1)
 * Renders attendee details pre-filled from user, retained seat list, subtotal, and running countdown timer.
 */
export function PaymentStep({
  user,
  selectedSeats = [],
  subtotal = 0,
  reservedUntil,
  isExpired = false,
  onExpire,
  onReturnToMap,
  onPaymentSuccess,
}) {
  const [formData, setFormData] = useState({
    name: user?.user_metadata?.full_name || 'Valued Attendee',
    email: user?.email || '',
    cardNumber: '•••• •••• •••• 4242',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isExpired || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const seatIds = selectedSeats.map((s) => s.id);
      const result = await mockTicketingService.confirmBooking({
        eventId: 'evt-symphony-2026',
        seatIds,
        userId: user?.id,
        attendeeName: formData.name || 'Valued Attendee',
        attendeeEmail: formData.email || 'attendee@example.com',
        paymentDetails: { cardNumber: formData.cardNumber },
      });

      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="payment-step-container" data-testid="checkout-step-payment">
      {/* Top Header with Continuing Countdown Timer */}
      <header className="payment-step-header">
        <div className="payment-header-info">
          <h2 className="payment-title">Payment & Confirmation</h2>
          <p className="payment-subtitle">
            Review your order and complete payment for your reserved tickets.
          </p>
        </div>

        <HoldTimer reservedUntil={reservedUntil} onExpire={onExpire} />
      </header>

      <div className="payment-grid">
        {/* Attendee & Payment Form */}
        <section className="payment-form-card" aria-label="Payment Form">
          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-group">
              <label htmlFor="attendee-name">Attendee Name</label>
              <input
                id="attendee-name"
                type="text"
                disabled={isExpired || isSubmitting}
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
                disabled={isExpired || isSubmitting}
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
                disabled={isExpired || isSubmitting}
                value={formData.cardNumber}
                onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-pay-confirm"
              data-testid="btn-confirm-payment"
              disabled={isExpired || isSubmitting}
            >
              {isSubmitting
                ? 'Processing Payment...'
                : `Confirm & Pay ${formatCurrency(subtotal)}`}
            </button>
          </form>
        </section>

        {/* Retained Order Summary */}
        <aside className="payment-summary-card" aria-label="Reserved Order Summary">
          <h3 className="summary-title">Reserved Seats ({selectedSeats.length})</h3>

          <div className="payment-seat-tags">
            {selectedSeats.map((seat) => (
              <div key={seat.id} className="payment-seat-row" data-testid={`retained-seat-${seat.id}`}>
                <div className="seat-badge-info">
                  <span className="seat-code">{seat.rowLabel ? `Seat ${seat.rowLabel}-${seat.seatNumber}` : seat.id}</span>
                  <span className="seat-tier"> ({seat.category || 'Standard'})</span>
                </div>
                <span className="seat-price">{formatCurrency(seat.price)}</span>
              </div>
            ))}
          </div>

          <div className="payment-divider" />

          <div className="payment-subtotal-row">
            <span>Subtotal</span>
            <strong className="payment-subtotal-val" data-testid="cart-subtotal">
              {formatCurrency(subtotal)}
            </strong>
          </div>

          <button
            type="button"
            className="btn-change-seats"
            onClick={onReturnToMap}
            disabled={isSubmitting}
          >
            Change Seats
          </button>
        </aside>
      </div>
    </div>
  );
}
