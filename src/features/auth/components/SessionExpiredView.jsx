/**
 * Session Expired Lockdown View inside AuthModal (SPEC-03 / Scenario 3.3)
 */
export function SessionExpiredView({ onReturnToMap }) {
  return (
    <div className="auth-expired-view" data-testid="auth-expired-view">
      <div className="auth-expired-banner" role="alert">
        <div className="expired-icon" aria-hidden="true">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <div className="expired-text">
          <strong>Reservation Expired</strong>
          <p>Your reservation hold has expired. The seats have been released.</p>
        </div>
      </div>

      <div className="auth-expired-actions">
        <button
          type="button"
          className="btn-back-to-map"
          data-testid="back-to-map-btn"
          onClick={onReturnToMap}
        >
          Back to Map
        </button>
      </div>
    </div>
  );
}
