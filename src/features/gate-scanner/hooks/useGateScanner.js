import { useState, useCallback } from 'react';
import { gateValidationService } from '../services/gateValidationService';
import { useAudioFeedback } from './useAudioFeedback';
import { useOfflineSync } from './useOfflineSync';

const STORAGE_GATE_KEY = 'tc_gate_scanner_checkpoint';

/**
 * Main coordinator hook for the Gate Scanner feature
 */
export function useGateScanner(initialEventId = 'evt-symphony-2026') {
  const [eventId, setEventId] = useState(initialEventId);
  const [gateName, setGateName] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(STORAGE_GATE_KEY) || 'Gate A (North Entrance)';
    }
    return 'Gate A (North Entrance)';
  });

  const [lastResult, setLastResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const [stats, setStats] = useState({
    admitted: 0,
    rejected: 0,
    total: 0,
  });

  const { notifyFeedback } = useAudioFeedback();
  const offlineSync = useOfflineSync();

  const changeGate = useCallback((newGate) => {
    setGateName(newGate);
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_GATE_KEY, newGate);
    }
  }, []);

  const dismissResult = useCallback(() => {
    setLastResult(null);
    setIsPaused(false);
  }, []);

  const processScan = useCallback(
    async (rawCode) => {
      if (!rawCode || isValidating || isPaused) return null;

      setIsValidating(true);
      setIsPaused(true);

      try {
        const result = await gateValidationService.validateTicket({
          rawScan: rawCode,
          eventId,
          gateName,
        });

        setLastResult(result);

        // Update session stats
        setStats((prev) => ({
          admitted: result.valid ? prev.admitted + 1 : prev.admitted,
          rejected: !result.valid ? prev.rejected + 1 : prev.rejected,
          total: prev.total + 1,
        }));

        // Fire audio and haptic feedback
        notifyFeedback(result.status);

        return result;
      } catch (err) {
        const fallbackResult = {
          success: false,
          valid: false,
          status: 'ERROR',
          message: err.message || 'Validation error occurred.',
        };
        setLastResult(fallbackResult);
        notifyFeedback('ERROR');
        return fallbackResult;
      } finally {
        setIsValidating(false);
      }
    },
    [eventId, gateName, isPaused, isValidating, notifyFeedback]
  );

  return {
    eventId,
    setEventId,
    gateName,
    changeGate,
    lastResult,
    isValidating,
    isPaused,
    stats,
    processScan,
    dismissResult,
    offlineSync,
  };
}
