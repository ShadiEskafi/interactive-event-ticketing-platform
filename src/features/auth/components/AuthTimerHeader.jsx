import { useHoldTimer } from '../../hold/hooks/useHoldTimer';

/**
 * Live Hold Countdown Display inside Auth Modal Header (SPEC-03 / Scenario 3.1)
 */
export function AuthTimerHeader({ reservedUntil, onExpire }) {
  const { formattedTime, isWarning } = useHoldTimer({
    reservedUntil,
    onExpire,
  });

  return (
    <div
      className={`auth-modal-timer-badge ${isWarning ? 'is-warning' : ''}`}
      data-testid="auth-modal-timer"
      aria-label={`Time remaining to complete booking: ${formattedTime}`}
    >
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="auth-timer-text">Hold expires in:</span>
      <strong className="auth-timer-clock">{formattedTime}</strong>
    </div>
  );
}
