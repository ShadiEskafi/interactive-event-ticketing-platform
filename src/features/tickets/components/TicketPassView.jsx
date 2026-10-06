import { useRef } from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';
import { TicketExportActions } from './TicketExportActions';
import { useTicketExport } from '../hooks/useTicketExport';
import { formatCurrency } from '../../seatmap/utils/formatters';

/**
 * Visual Ticket Pass Container Component (SPEC-04 / REQ-TICK-04.4)
 * Styled physical event pass card with perforated styling, seat specs, signed QR, and export triggers.
 */
export function TicketPassView({
  ticket,
  showExportActions = true,
  className = '',
}) {
  const passCardRef = useRef(null);
  const { isExportingPdf, isExportingPng, downloadPdf, downloadPng } = useTicketExport();

  if (!ticket) return null;

  const handlePdfClick = () => {
    downloadPdf(ticket, passCardRef.current);
  };

  const handlePngClick = () => {
    downloadPng(passCardRef.current, ticket.ticket_code || 'PASS');
  };

  const tier = ticket.tier || ticket.category || 'VIP';
  const tierColor =
    tier === 'VIP' ? '#EC4899' : tier === 'Premium' ? '#3B82F6' : tier === 'Balcony' ? '#8B5CF6' : '#10B981';

  return (
    <div className={`ticket-pass-container ${className}`} data-testid={`ticket-pass-${ticket.ticket_code || ticket.id}`}>
      {/* Visual Ticket Pass Card (Captured for PNG/PDF) */}
      <div ref={passCardRef} className="ticket-pass-card" data-testid="ticket-pass-card">
        {/* Pass Top Banner */}
        <div className="pass-header">
          <div className="pass-brand-row">
            <span className="pass-brand-logo">🎟️ TicketCraft</span>
            <span
              className="pass-tier-badge"
              style={{ backgroundColor: `${tierColor}20`, color: tierColor, borderColor: `${tierColor}50` }}
            >
              {tier} Pass
            </span>
          </div>

          <h3 className="pass-event-title">{ticket.event_title || 'Grand Symphony Concert'}</h3>
          <p className="pass-event-date">{ticket.event_date || 'Saturday, Nov 14, 2026 • 8:00 PM'}</p>
          <p className="pass-venue-name">{ticket.venue_name || 'Grand Symphony Hall, Auditorium'}</p>
        </div>

        {/* Perforated Tear Line */}
        <div className="pass-perforation" aria-hidden="true">
          <div className="notch notch-left" />
          <div className="dash-line" />
          <div className="notch notch-right" />
        </div>

        {/* Pass Details & Seat Grid */}
        <div className="pass-body">
          <div className="pass-grid">
            <div className="pass-grid-col">
              <span className="pass-label">Seat</span>
              <strong className="pass-val">
                Row {ticket.row_label || 'A'} &bull; Seat {ticket.seat_number || ticket.seat_id}
              </strong>
            </div>

            <div className="pass-grid-col">
              <span className="pass-label">Tier / Price</span>
              <strong className="pass-val">
                {tier} ({formatCurrency(ticket.price || 150)})
              </strong>
            </div>

            <div className="pass-grid-col">
              <span className="pass-label">Attendee</span>
              <strong className="pass-val">{ticket.attendee_name || 'Valued Attendee'}</strong>
            </div>

            <div className="pass-grid-col">
              <span className="pass-label">Booking Ref</span>
              <strong className="pass-val">{ticket.booking_id || 'BK-CONFIRMED'}</strong>
            </div>
          </div>

          {/* Cryptographic QR Section */}
          <div className="pass-qr-section">
            <QRCodeDisplay
              value={ticket.qr_payload || ticket.qr_signature}
              size={140}
              className="pass-qr-code"
            />
            <div className="pass-code-container">
              <span className="pass-code-label">TICKET CODE</span>
              <strong className="pass-code-value">{ticket.ticket_code || 'TKT-PENDING'}</strong>
              <span className="pass-signature-tag">HMAC-SHA256 SIGNED &bull; LEVEL H</span>
            </div>
          </div>
        </div>
      </div>

      {/* Client-Side Export Controls */}
      {showExportActions && (
        <TicketExportActions
          onDownloadPdf={handlePdfClick}
          onDownloadPng={handlePngClick}
          isExportingPdf={isExportingPdf}
          isExportingPng={isExportingPng}
        />
      )}
    </div>
  );
}
