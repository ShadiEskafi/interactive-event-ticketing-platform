import { useEffect, useState } from 'react';
import { getThemeForStatus } from '../scanResultThemes';

/**
 * Scan Result Overlay Component (Refactored)
 * Status-aware, theme-driven visual feedback with contextual content,
 * distinct animations, and accessibility-first design.
 */
export function ScanResultOverlay({ result, onClose, autoDismissDelay }) {
  const [progress, setProgress] = useState(100);

  const status = result?.status || 'UNKNOWN';
  const theme = getThemeForStatus(status);

  // Use theme-specific delay if not explicitly passed
  const effectiveDelay = autoDismissDelay ?? theme.autoDismissDelay;

  useEffect(() => {
    if (!result) return;

    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / effectiveDelay) * 100);
      setProgress(remainingPct);

      if (elapsed >= effectiveDelay) {
        clearInterval(interval);
        if (onClose) onClose();
      }
    }, 40);

    return () => clearInterval(interval);
  }, [result, effectiveDelay, onClose]);

  if (!result) return null;

  const isSuccess = status === 'ENTRY_GRANTED';
  const isDuplicate = status === 'ALREADY_USED';
  const isSecurity = status === 'INVALID_SIGNATURE';
  const isMismatch = status === 'EVENT_MISMATCH';
  const isNotFound = status === 'TICKET_NOT_FOUND';

  return (
    <div
      className={`scan-result-overlay ${theme.cssClass} ${theme.animationClass} p-4 sm:p-6 flex items-center justify-center`}
      data-testid="scan-result-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-label={theme.ariaLabel}
      aria-live={theme.ariaLive}
      onClick={onClose}
    >
      <div
        className="scan-result-card w-full max-w-[92vw] sm:max-w-md max-h-[85vh] flex flex-col overflow-y-auto rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        data-testid="scan-result-card"
      >
        {/* Progress bar countdown — themed */}
        <div
          className={`auto-dismiss-progress-bar ${theme.progressBarClass}`}
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

        {/* ── Result Header & Status Icon ── */}
        <div className="result-header">
          <div className={`result-status-icon-wrapper ${theme.iconBgClass}`} aria-hidden="true">
            <span className="result-status-icon" data-testid="result-icon">
              {theme.icon}
            </span>
          </div>

          <h2 className="result-title" data-testid="result-title">
            {theme.title}
          </h2>

          <p className="result-subtitle" data-testid="result-message">
            {result.message}
          </p>
        </div>

        {/* ── Contextual Details Body ── */}
        <div className="result-details-body">

          {/* ═══ SUCCESS: Attendee + Seat Info ═══ */}
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

          {/* ═══ DUPLICATE: Previous scan details ═══ */}
          {isDuplicate && (
            <div className="duplicate-alert-box" data-testid="duplicate-details">
              <div className="duplicate-alert-header">
                <span className="duplicate-alert-icon" aria-hidden="true">⛔</span>
                <span className="duplicate-alert-label">Duplicate Entry Attempt</span>
              </div>
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

          {/* ═══ SECURITY: Tampered ticket alert ═══ */}
          {isSecurity && (
            <div className="security-alert-box" data-testid="security-details">
              <div className="security-alert-header">
                <span className="security-alert-icon" aria-hidden="true">🚨</span>
                <span className="security-alert-label">Cryptographic Verification Failed</span>
              </div>
              <p className="security-notice">
                HMAC signature mismatch detected. This ticket may be forged or digitally manipulated.
                Verify attendee identity manually.
              </p>
              {result.ticket_code && (
                <div className="detail-row font-mono">
                  <span className="detail-label">Suspect Code:</span>
                  <span className="detail-value">{result.ticket_code}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══ MISMATCH: Wrong event info ═══ */}
          {isMismatch && (
            <div className="mismatch-alert-box" data-testid="mismatch-details">
              <div className="mismatch-alert-header">
                <span className="mismatch-alert-icon" aria-hidden="true">🎫✗</span>
                <span className="mismatch-alert-label">Event Mismatch</span>
              </div>
              <p className="mismatch-notice">
                This ticket is valid but belongs to a different event schedule. Please direct the attendee to the correct venue or entry.
              </p>
              {result.ticket_event_id && (
                <div className="detail-row">
                  <span className="detail-label">Ticket Event:</span>
                  <span className="detail-value font-mono">{result.ticket_event_id}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══ NOT FOUND: Unknown ticket ═══ */}
          {isNotFound && (
            <div className="notfound-alert-box" data-testid="notfound-details">
              <div className="notfound-alert-header">
                <span className="notfound-alert-icon" aria-hidden="true">🔍</span>
                <span className="notfound-alert-label">No Matching Record</span>
              </div>
              <p className="notfound-notice">
                This ticket code does not exist in event registration records. Verify the code and try again, or ask the attendee for an alternative proof of purchase.
              </p>
              {result.ticket_code && (
                <div className="detail-row font-mono">
                  <span className="detail-label">Code:</span>
                  <span className="detail-value">{result.ticket_code}</span>
                </div>
              )}
            </div>
          )}

          {/* ═══ GENERIC ERROR / FALLBACK ═══ */}
          {!isSuccess && !isDuplicate && !isSecurity && !isMismatch && !isNotFound && (
            <div className="generic-alert-box" data-testid="generic-error-details">
              <p className="generic-notice">
                {result.message || 'An unexpected error occurred during ticket validation.'}
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

        {/* ── Footer Action — themed button ── */}
        <div
          className="result-footer"
          style={{ paddingBottom: 'env(safe-area-inset-bottom, 1rem)' }}
        >
          <button
            type="button"
            className={`btn-next-scan ${theme.btnClass}`}
            onClick={onClose}
            data-testid="btn-dismiss-result"
          >
            {theme.btnLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
