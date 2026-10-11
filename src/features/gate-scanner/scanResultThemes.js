/**
 * Scan Result Theme Definitions
 * Centralized visual theme configuration for each scan result status.
 * Each theme controls: icon, colors, animation, auto-dismiss timing, and ARIA semantics.
 */

// ─── Status Themes ───────────────────────────────────────────────

export const SCAN_RESULT_THEMES = {
  ENTRY_GRANTED: {
    key: 'success',
    cssClass: 'result-success',
    icon: '✅',
    iconBgClass: 'icon-bg-success',
    title: 'ENTRY GRANTED',
    animationClass: 'anim-success-glow',
    autoDismissDelay: 1800,
    ariaLabel: 'Success: Entry Granted',
    ariaLive: 'polite',
    progressBarClass: 'progress-success',
    btnClass: 'btn-next-success',
    btnLabel: 'Scan Next Attendee ➔',
  },

  ALREADY_USED: {
    key: 'duplicate',
    cssClass: 'result-duplicate',
    icon: '⚠️',
    iconBgClass: 'icon-bg-duplicate',
    title: 'ALREADY SCANNED',
    animationClass: 'anim-warning-shake',
    autoDismissDelay: 4000,
    ariaLabel: 'Warning: Ticket Already Used',
    ariaLive: 'assertive',
    progressBarClass: 'progress-duplicate',
    btnClass: 'btn-next-duplicate',
    btnLabel: 'Dismiss & Scan Next ➔',
  },

  INVALID_SIGNATURE: {
    key: 'security',
    cssClass: 'result-security',
    icon: '🛡️',
    iconBgClass: 'icon-bg-security',
    title: 'SECURITY ALERT',
    animationClass: 'anim-danger-flash',
    autoDismissDelay: 6000,
    ariaLabel: 'Danger: Tampered Ticket Detected',
    ariaLive: 'assertive',
    progressBarClass: 'progress-security',
    btnClass: 'btn-next-security',
    btnLabel: 'Acknowledge & Continue ➔',
  },

  EVENT_MISMATCH: {
    key: 'mismatch',
    cssClass: 'result-mismatch',
    icon: '🎫',
    iconBgClass: 'icon-bg-mismatch',
    title: 'WRONG EVENT',
    animationClass: 'anim-slide-in',
    autoDismissDelay: 3000,
    ariaLabel: 'Notice: Ticket belongs to a different event',
    ariaLive: 'polite',
    progressBarClass: 'progress-mismatch',
    btnClass: 'btn-next-mismatch',
    btnLabel: 'Scan Next Attendee ➔',
  },

  TICKET_NOT_FOUND: {
    key: 'notfound',
    cssClass: 'result-notfound',
    icon: '❓',
    iconBgClass: 'icon-bg-notfound',
    title: 'TICKET NOT FOUND',
    animationClass: 'anim-slide-in',
    autoDismissDelay: 2500,
    ariaLabel: 'Error: Ticket not found in records',
    ariaLive: 'assertive',
    progressBarClass: 'progress-notfound',
    btnClass: 'btn-next-notfound',
    btnLabel: 'Scan Next Attendee ➔',
  },

  // Fallback for ERROR, UNKNOWN, INVALID_PAYLOAD, OFFLINE_UNVERIFIED, etc.
  FALLBACK: {
    key: 'error',
    cssClass: 'result-error',
    icon: '⚙️',
    iconBgClass: 'icon-bg-error',
    title: 'INVALID TICKET',
    animationClass: 'anim-fade-in',
    autoDismissDelay: 3000,
    ariaLabel: 'Error: Invalid ticket',
    ariaLive: 'assertive',
    progressBarClass: 'progress-error',
    btnClass: 'btn-next-error',
    btnLabel: 'Scan Next Attendee ➔',
  },
};

// ─── Theme Resolver ──────────────────────────────────────────────

/**
 * Resolves the theme object for a given scan result status.
 * Falls back to the generic FALLBACK theme for unrecognized statuses.
 *
 * @param {string} status - The scan result status string (e.g. 'ENTRY_GRANTED')
 * @returns {object} The full theme configuration object
 */
export function getThemeForStatus(status) {
  return SCAN_RESULT_THEMES[status] || SCAN_RESULT_THEMES.FALLBACK;
}

/**
 * Returns the auto-dismiss delay in milliseconds for a given status.
 * Use this in the parent page to pass the correct delay per result.
 *
 * @param {string} status - The scan result status string
 * @returns {number} Auto-dismiss delay in ms
 */
export function getAutoDismissDelay(status) {
  const theme = getThemeForStatus(status);
  return theme.autoDismissDelay;
}
