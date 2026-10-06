import { useEffect, useRef } from 'react';
import { QRCodeDisplay } from './QRCodeDisplay';

/**
 * Full-Screen QR Modal Component (SPEC-04 / REQ-TICK-04.5)
 * Maximizes screen contrast with brightness boost for seamless physical gate scanner validation.
 */
export function FullScreenQRModal({
  isOpen = false,
  ticket = null,
  onClose,
}) {
  const modalRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on close button
    const closeBtn = modalRef.current?.querySelector('button');
    if (closeBtn) {
      closeBtn.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !ticket) return null;

  return (
    <div
      className="qr-modal-backdrop"
      data-testid="qr-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="qr-modal-title"
        className="full-screen-qr-container brightness-boost"
        data-testid="full-screen-qr-container"
      >
        <header className="qr-modal-header">
          <div className="qr-modal-title-row">
            <h2 id="qr-modal-title" className="qr-modal-title">
              Gate Entry Pass
            </h2>
            {onClose && (
              <button
                type="button"
                className="btn-qr-modal-close"
                aria-label="Close pass modal"
                onClick={onClose}
              >
                &times;
              </button>
            )}
          </div>
          <p className="qr-modal-event">{ticket.event_title || 'Grand Symphony Concert'}</p>
        </header>

        <div className="qr-modal-body">
          <div className="qr-modal-seat-info">
            <span className="qr-modal-seat-tag">
              Seat {ticket.row_label || 'A'}-{ticket.seat_number || ticket.seat_id} ({ticket.tier || ticket.category || 'VIP'})
            </span>
            <span className="qr-modal-attendee">{ticket.attendee_name || 'Valued Attendee'}</span>
          </div>

          {/* Large High-Contrast QR Code */}
          <div className="qr-modal-code-wrapper">
            <QRCodeDisplay
              value={ticket.qr_payload || ticket.qr_signature}
              size={260}
              className="qr-modal-qr"
            />
          </div>

          <div className="qr-modal-meta">
            <strong className="qr-modal-ticket-code">{ticket.ticket_code}</strong>
            <span className="qr-modal-hint">
              Present this high-contrast QR code to the gate validator scanner.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
