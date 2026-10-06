import { useHoldTimer } from './hooks/useHoldTimer';

/**
 * 300-Second Hold Countdown Display
 * Features clock-drift protection, 60s warning styling (text-rose-600), and screen reader announcements.
 */
export function HoldTimer({ reservedUntil, onExpire, children }) {
  const {
    remainingSeconds,
    formattedTime,
    isWarning,
    isExpired,
    warningAnnouncement,
  } = useHoldTimer({
    reservedUntil,
    onExpire,
  });

  return (
    <>
      <div
        className={`hold-timer ${isWarning ? 'hold-timer-warning text-rose-600' : ''}`}
      data-testid="hold-countdown"
      aria-label={`Time remaining to complete booking: ${formattedTime}`}
    >
      <div className="hold-timer-icon" aria-hidden="true">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>

      <div className="hold-timer-content">
        <span className="hold-timer-label">Time Remaining:</span>
        <span className="hold-timer-digits" data-testid="timer-display">
          {formattedTime}
        </span>
      </div>

      {/* Screen reader live announcement region */}
      <div
        role="status"
        aria-live="polite"
        className="sr-only"
        style={{
          position: 'absolute',
          width: '1px',
          height: '1px',
          padding: 0,
          margin: '-1px',
          overflow: 'hidden',
          clip: 'rect(0, 0, 0, 0)',
          whiteSpace: 'nowrap',
          borderWidth: 0,
        }}
      >
        {warningAnnouncement}
      </div>
    </div>
    {typeof children === 'function'
      ? children({ isExpired, remainingSeconds, formattedTime })
      : children}
  </>
);
}
