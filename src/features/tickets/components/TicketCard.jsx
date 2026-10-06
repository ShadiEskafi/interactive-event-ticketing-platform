import { useTicketExport } from '../hooks/useTicketExport';
import { formatCurrency } from '../../seatmap/utils/formatters';

/**
 * Compact Ticket Card Component for Dashboard (SPEC-04 / REQ-TICK-04.5)
 */
export function TicketCard({
  ticket,
  onShowQr,
}) {
  const { isExportingPdf, isExportingPng, downloadPdf } = useTicketExport();

  if (!ticket) return null;

  const tier = ticket.tier || ticket.category || 'VIP';
  const tierColor =
    tier === 'VIP' ? '#EC4899' : tier === 'Premium' ? '#3B82F6' : tier === 'Balcony' ? '#8B5CF6' : '#10B981';

  return (
    <div className="ticket-card" data-testid="ticket-card">
      <div className="ticket-card-header">
        <div className="ticket-card-seat">
          <span className="seat-badge-title">
            Seat {ticket.row_label || 'A'}-{ticket.seat_number || ticket.seat_id}
          </span>
          <span
            className="seat-tier-pill"
            style={{ backgroundColor: `${tierColor}20`, color: tierColor, borderColor: `${tierColor}40` }}
          >
            {tier}
          </span>
        </div>
        <div className="ticket-card-price">{formatCurrency(ticket.price || 150)}</div>
      </div>

      <div className="ticket-card-meta">
        <span className="ticket-card-code">Code: {ticket.ticket_code}</span>
        {ticket.is_used ? (
          <span className="ticket-status-used">Used</span>
        ) : (
          <span className="ticket-status-valid">Valid Pass</span>
        )}
      </div>

      <div className="ticket-card-actions">
        <button
          type="button"
          className="btn-show-qr"
          data-testid="show-qr-pass-btn"
          onClick={() => onShowQr && onShowQr(ticket)}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
          </svg>
          Show QR Pass
        </button>

        <button
          type="button"
          className="btn-quick-export"
          data-testid="btn-quick-pdf"
          disabled={isExportingPdf || isExportingPng}
          onClick={() => downloadPdf(ticket)}
          title="Download PDF Ticket"
        >
          PDF
        </button>
      </div>
    </div>
  );
}
