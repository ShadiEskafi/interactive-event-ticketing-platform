/**
 * Time formatting utilities for the hold countdown timer
 */

export function formatTimeRemaining(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds) || seconds <= 0) {
    return '00:00';
  }
  const clamped = Math.floor(seconds);
  const minutes = Math.floor(clamped / 60);
  const remainingSeconds = clamped % 60;

  const paddedMinutes = String(minutes).padStart(2, '0');
  const paddedSeconds = String(remainingSeconds).padStart(2, '0');

  return `${paddedMinutes}:${paddedSeconds}`;
}

export function computeRemainingSeconds(reservedUntilIso) {
  if (!reservedUntilIso) return 0;
  const expiryEpoch = Date.parse(reservedUntilIso);
  if (isNaN(expiryEpoch)) return 0;

  const nowEpoch = Date.now();
  const diffMs = expiryEpoch - nowEpoch;
  return Math.max(0, Math.floor(diffMs / 1000));
}
