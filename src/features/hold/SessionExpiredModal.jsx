import { useEffect, useRef } from 'react';

/**
 * Blocking Session Expired Modal (Triggered when hold reaches 00:00)
 */
export function SessionExpiredModal({ isOpen, onReturnToMap }) {
  const returnBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      returnBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="session-expired-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expired-modal-title"
      aria-describedby="expired-modal-desc"
    >
      <div className="session-expired-card">
        <div className="expired-icon-wrap" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 id="expired-modal-title" className="expired-modal-title">
          Reservation Expired
        </h2>

        <p id="expired-modal-desc" className="expired-modal-description">
          Your 5-minute hold on the selected seats has expired. To give other attendees a fair chance, these seats have been released back to the general pool.
        </p>

        <div className="expired-modal-actions">
          <button
            ref={returnBtnRef}
            type="button"
            className="btn-return-map"
            onClick={onReturnToMap}
          >
            Return to Seat Map
          </button>
        </div>
      </div>
    </div>
  );
}
