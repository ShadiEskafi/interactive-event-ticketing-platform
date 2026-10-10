import { useEffect, useState } from 'react';

/**
 * Scan Result Overlay Component
 * High-contrast, color-coded visual feedback with auto-dismiss progress indicator.
 */
export function ScanResultOverlay({ result, onClose, autoDismissDelay = 2000 }) {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!result) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / autoDismissDelay) * 100);
      setProgress(remainingPct);

      if (elapsed >= autoDismissDelay) {
        clearInterval(interval);
        if (onClose) onClose();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [result, autoDismissDelay, onClose]);

  if (!result) return null;

  const status = result.status || 'UNKNOWN';
  const isSuccess = status === 'ENTRY_GRANTED';
  const isDuplicate = status === 'ALREADY_USED';
  const isInvalid = !isSuccess && !isDuplicate;

  const cardThemeClass = isSuccess
    ? 'result-success'
    : isDuplicate
    ? 'result-duplicate'
    : 'result-invalid';

  return (
    <div
      className={`scan-result-overlay ${cardThemeClass}`}
      data-testid="scan-result-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Scan Result"
      onClick={onClose}
    >
      <div
        className="scan-result-card"
        onClick={(e) => e.stopPropagation()}
        data-testid="scan-result-card"
      >
        {/* Progress bar countdown */}
        <div
          className="auto-dismiss-progress-bar"
          style={{ width: `${progress}%` }}
          aria-hidden="true"
        />

        {/* Offline Warning Pill */}
        {result.isOffline && (
          <div className="offline-badge-pill" data-testid="scan-offline-pill">
            <span className="pill-dot">⚠️</span>
            <span>{result.offlineWarning || 'Offline Mode - Visual ID Verification Advised'}</span>
          </div>
        )}

        {/* Result Header & Icon */}
        <div className="result-header">
          <div className="result-status-icon" aria-hidden="true">
            {isSuccess && '✅'}
            {isDuplicate && '⛔'}
            {isInvalid && '🚨'}
          </div>

          <h2 className="result-title" data-testid="result-title">
            {isSuccess && 'ENTRY GRANTED'}
            {isDuplicate && 'ALREADY USED'}
            {status === 'INVALID_SIGNATURE' && 'TAMPERED TICKET'}
            {status === 'EVENT_MISMATCH' && 'WRONG EVENT'}
            {status === 'TICKET_NOT_FOUND' && 'TICKET NOT FOUND'}
            {isInvalid && status !== 'INVALID_SIGNATURE' && status !== 'EVENT_MISMATCH' && status !== 'TICKET_NOT_FOUND' && 'INVALID TICKET'}
          </h2>

          <p className="result-subtitle" data-testid="result-message">
            {result.message}
          </p>
        </div>

        {/* Ticket Details Body */}
        <div className="result-details-body">
          {isSuccess && (
            <>
              <div className="detail-row highlight-name">
                <span className="detail-label">Attendee:</span>
                <span className="detail-value attendee-name" data-testid="result-attendee-name">
                  {result.attendee_name || 'Valued Attendee'}
                </span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <span className="detail-label">Tier</span>
                  <span className="detail-value tier-badge" data-testid="result-tier">
                    {result.tier || 'Standard'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Section</span>
                  <span className="detail-value" data-testid="result-section">
                    {result.section || 'General'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Row</span>
                  <span className="detail-value" data-testid="result-row">
                    {result.row_label || '-'}
                  </span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Seat</span>
                  <span className="detail-value" data-testid="result-seat">
                    {result.seat_number || '-'}
                  </span>
                </div>
              </div>
            </>
          )}

          {isDuplicate && (
            <div className="duplicate-alert-box">
              <div className="detail-row">
                <span className="detail-label">First Scanned At:</span>
                <span className="detail-value scanned-time" data-testid="result-scanned-at">
                  {result.scanned_at ? new Date(result.scanned_at).toLocaleTimeString() : 'Earlier'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Entry Gate:</span>
                <span className="detail-value gate-name" data-testid="result-gate-name">
                  {result.gate_name || 'Main Gate'}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-label">Ticket Code:</span>
                <span className="detail-value font-mono">{result.ticket_code}</span>
              </div>
            </div>
          )}

          {isInvalid && (
            <div className="invalid-alert-box">
              <p className="security-notice">
                {status === 'INVALID_SIGNATURE'
                  ? 'Cryptographic HMAC mismatch. This ticket may be forged or manipulated.'
                  : status === 'EVENT_MISMATCH'
                  ? 'This ticket is valid for a different event schedule.'
                  : 'Ticket code does not exist in event registration records.'}
              </p>
              {result.ticket_code && (
                <div className="detail-row font-mono">
                  <span className="detail-label">Code:</span>
                  <span className="detail-value">{result.ticket_code}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Action */}
        <div className="result-footer">
          <button
            type="button"
            className="btn-next-scan"
            onClick={onClose}
            data-testid="btn-dismiss-result"
          >
            Scan Next Attendee ➔
          </button>
        </div>
      </div>
    </div>
  );
}
