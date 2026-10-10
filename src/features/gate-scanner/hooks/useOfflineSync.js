import { useState, useEffect, useCallback } from 'react';
import { offlineStorage } from '../services/offlineStorage';
import { gateValidationService } from '../services/gateValidationService';

/**
 * Custom hook for offline detection and automatic background synchronization
 */
export function useOfflineSync() {
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState(null);

  const refreshPendingCount = useCallback(async () => {
    try {
      const pending = await offlineStorage.getPendingScans();
      setPendingCount(pending.length);
    } catch {
      setPendingCount(0);
    }
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      const result = await gateValidationService.flushOfflineQueue();
      setLastSyncResult(result);
      await refreshPendingCount();
    } catch (err) {
      console.warn('Sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  }, [isSyncing, refreshPendingCount]);

  useEffect(() => {
    let isMounted = true;
    offlineStorage.getPendingScans().then((pending) => {
      if (isMounted) setPendingCount(pending.length);
    }).catch(() => {});

    const handleOnline = () => {
      setIsOnline(true);
      // Auto-flush queue upon reconnection
      syncNow();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Periodic check every 15 seconds
    const interval = setInterval(() => {
      refreshPendingCount();
      if (navigator.onLine && pendingCount > 0) {
        syncNow();
      }
    }, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [pendingCount, refreshPendingCount, syncNow]);

  return {
    isOnline,
    pendingCount,
    isSyncing,
    syncNow,
    refreshPendingCount,
    lastSyncResult,
    offlineWarning: !isOnline ? 'Offline Mode - Visual ID Verification Advised' : null,
  };
}
