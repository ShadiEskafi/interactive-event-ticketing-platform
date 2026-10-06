import { useMemo } from 'react';
import { formatCurrency } from '../utils/formatters';

/**
 * Live Cart Summary Component
 * Displays selected seat count, itemized tier breakdown, subtotal, and checkout CTA.
 * Dynamically computes seatCount, subtotal, and tierSummary directly from selectedSeats.
 */
export function CartSummary({
  selectedSeats = [],
  tierSummary: propTierSummary,
  subtotal: propSubtotal,
  onDeselectSeat,
  onCheckout,
}) {
  const seatCount = selectedSeats.length;

  // Dynamically compute subtotal from selectedSeats
  const computedSubtotal = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  }, [selectedSeats]);

  const subtotal = propSubtotal !== undefined ? propSubtotal : computedSubtotal;

  // Dynamically compute tier breakdown from selectedSeats if not passed
  const computedTierSummary = useMemo(() => {
    if (propTierSummary) return propTierSummary;
    const summary = { VIP: 0, Regular: 0, Balcony: 0 };
    selectedSeats.forEach((seat) => {
      const cat = seat.category || 'Regular';
      summary[cat] = (summary[cat] || 0) + 1;
    });
    return summary;
  }, [selectedSeats, propTierSummary]);

  const activeTiers = Object.entries(computedTierSummary).filter(([, count]) => count > 0);
  const tierBreakdownText = activeTiers
    .map(([tier, count]) => `${tier} (${count})`)
    .join(', ');

  return (
    <aside className="cart-summary" aria-label="Order Cart Summary">
      <div className="cart-header">
        <h2 className="cart-title">Your Selection</h2>
        <span className="cart-badge" data-testid="cart-seat-count">
          {seatCount}
        </span>
      </div>

      <div className="cart-content">
        {seatCount === 0 ? (
          <p className="cart-empty-message">
            No seats selected yet. Click available seats on the map to add them to your cart.
          </p>
        ) : (
          <>
            <div className="selected-seats-list" aria-label="Selected seats list">
              {selectedSeats.map((seat) => (
                <div
                  key={seat.id}
                  className="selected-seat-item"
                  data-testid={`selected-seat-${seat.id}`}
                >
                  <div className="seat-item-info">
                    <span className="seat-item-code">Seat {seat.rowLabel}-{seat.seatNumber}</span>
                    <span className="seat-item-category">{seat.category}</span>
                  </div>
                  <div className="seat-item-pricing">
                    <span className="seat-item-price">{formatCurrency(seat.price)}</span>
                    {onDeselectSeat && (
                      <button
                        type="button"
                        className="btn-remove-seat"
                        aria-label={`Remove seat ${seat.rowLabel}-${seat.seatNumber}`}
                        onClick={() => onDeselectSeat(seat)}
                      >
                        &times;
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {tierBreakdownText && (
              <div className="cart-tier-breakdown">
                <span className="tier-breakdown-label">Tier Breakdown:</span>
                <span className="tier-breakdown-value">{tierBreakdownText}</span>
              </div>
            )}

            <div className="cart-divider" />

            <div className="cart-subtotal-row">
              <span className="subtotal-label">Subtotal</span>
              <span className="subtotal-amount" data-testid="cart-subtotal">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="cart-tax-notice">Taxes and service fees calculated at checkout</p>
          </>
        )}
      </div>

      <div className="cart-footer">
        <button
          type="button"
          className="btn-checkout"
          disabled={seatCount === 0}
          aria-label="Proceed to Checkout"
          onClick={onCheckout}
        >
          Proceed to Checkout
        </button>
        {seatCount > 0 && (
          <p className="cart-limit-notice">
            {seatCount}/5 seats selected
          </p>
        )}
      </div>
    </aside>
  );
}
