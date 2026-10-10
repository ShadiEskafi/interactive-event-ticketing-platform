import { useCallback } from 'react';
import { playSuccessSound, playDuplicateSound, playInvalidSound } from '../utils/soundEffects';

/**
 * Custom hook to provide multi-sensory feedback (sound + vibration) for gate scanning
 */
export function useAudioFeedback() {
  const triggerHaptic = useCallback((pattern) => {
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {
        // Ignore vibration errors on unsupported environments
      }
    }
  }, []);

  const notifySuccess = useCallback(() => {
    playSuccessSound();
    triggerHaptic([100]);
  }, [triggerHaptic]);

  const notifyDuplicate = useCallback(() => {
    playDuplicateSound();
    triggerHaptic([200, 100, 200]);
  }, [triggerHaptic]);

  const notifyInvalid = useCallback(() => {
    playInvalidSound();
    triggerHaptic([400]);
  }, [triggerHaptic]);

  const notifyFeedback = useCallback((status) => {
    switch (status) {
      case 'ENTRY_GRANTED':
        notifySuccess();
        break;
      case 'ALREADY_USED':
        notifyDuplicate();
        break;
      case 'INVALID_SIGNATURE':
      case 'EVENT_MISMATCH':
      case 'TICKET_NOT_FOUND':
      default:
        notifyInvalid();
        break;
    }
  }, [notifySuccess, notifyDuplicate, notifyInvalid]);

  return {
    notifySuccess,
    notifyDuplicate,
    notifyInvalid,
    notifyFeedback,
  };
}
