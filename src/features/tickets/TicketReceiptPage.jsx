import { TicketPassView } from './components/TicketPassView';
import { formatCurrency } from '../seatmap/utils/formatters';
import './Tickets.css';

/**
 * Ticket Receipt / Booking Confirmation Page (SPEC-04 / REQ-TICK-04.1)
 * Rendered immediately following successful payment completion.
 */
export function TicketReceiptPage({
  booking,
  onNavigateToDashboard,
  onReturnToMap,
}) {
  if (!booking) return null;

  const bookingId = booking.id || booking.bookingId || 'BK-CONFIRMED';
  const tickets = booking.tickets || [];
  const totalAmount = booking.total_amount || tickets.reduce((sum, t) => sum + (t.price || 0), 0);

  return (
    <div className="receipt-page-container" data-testid="ticket-receipt-page">
      {/* Success Header Banner */}
      <header className="receipt-banner">
        <div className="receipt-success-icon" aria-hidden="true">🎉</div>
        <h1 className="receipt-title">Booking Confirmed!</h1>
        <p className="receipt-subtitle">
          Your digital passes have been issued and cryptographically signed.
        </p>
        <div className="receipt-ref-badge" data-testid="booking-reference-badge">
          REFERENCE: {bookingId} &bull; {formatCurrency(totalAmount)}
        </div>
      </header>

      {/* Itemized Pass List */}
      <section className="receipt-passes-section" aria-label="Digital Ticket Passes">
        <div className="receipt-passes-grid">
          {tickets.map((ticket) => (
            <TicketPassView
              key={ticket.id || ticket.ticket_code}
              ticket={ticket}
              showExportActions={true}
            />
          ))}
        </div>
      </section>

      {/* Post-Purchase Actions */}
      <footer className="receipt-navigation-actions">
        {onNavigateToDashboard && (
          <button
            type="button"
            className="btn-receipt-dashboard"
            data-testid="btn-view-my-tickets"
            onClick={onNavigateToDashboard}
          >
            View in &quot;My Tickets&quot;
          </button>
        )}
        {onReturnToMap && (
          <button
            type="button"
            className="btn-receipt-back-map"
            data-testid="btn-receipt-back-map"
            onClick={onReturnToMap}
          >
            Book More Seats
          </button>
        )}
      </footer>
    </div>
  );
}
