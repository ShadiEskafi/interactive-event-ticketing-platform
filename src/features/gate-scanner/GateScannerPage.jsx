import { useState } from 'react';
import { CameraScanner } from './components/CameraScanner';
import { ScanResultOverlay } from './components/ScanResultOverlay';
import { GateStatsBar } from './components/GateStatsBar';
import { ManualEntryModal } from './components/ManualEntryModal';
import { GateSelectorModal } from './components/GateSelectorModal';
import { useGateScanner } from './hooks/useGateScanner';
import { useLanguage } from '../../context';
import './GateScanner.css';

/**
 * Gate Scanner Page (FEAT-GATE-SCANNER-05)
 * PWA Gate validation dashboard for event staff and turnstiles.
 */
export function GateScannerPage({
  eventId = 'evt-symphony-2026',
  eventName = 'Grand Symphony Concert',
  onBackToApp,
}) {
  const { t } = useLanguage();
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);

  const {
    gateName,
    changeGate,
    lastResult,
    isPaused,
    stats,
    processScan,
    dismissResult,
    offlineSync,
  } = useGateScanner(eventId);

  const handleManualSubmit = async (code) => {
    setIsManualModalOpen(false);
    await processScan(code);
  };

  return (
    <div className="gate-scanner-page" data-testid="gate-scanner-page">
      {/* Top Header Bar */}
      <header className="scanner-top-bar" role="banner">
        <div className="top-bar-left">
          {onBackToApp && (
            <button
              type="button"
              className="btn-exit-scanner"
              onClick={onBackToApp}
              data-testid="btn-exit-scanner"
              title="Return to main app"
            >
              ← {t('scanner.back', 'Exit Scanner')}
            </button>
          )}
          <div className="event-info-pill">
            <span className="event-badge-icon">🎵</span>
            <span className="event-title-text" data-testid="scanner-event-title">
              {eventName}
            </span>
          </div>
        </div>

        <div className="top-bar-right">
          {/* Offline Warning Banner Pill */}
          {!offlineSync.isOnline && (
            <div className="persistent-offline-warning" data-testid="persistent-offline-warning">
              <span className="warning-icon">⚠️</span>
              <span className="warning-text">
                {offlineSync.offlineWarning || 'Offline Mode - Visual ID Verification Advised'}
              </span>
            </div>
          )}

          <div className="scanner-badge-pwa">
            <span className="pwa-dot" />
            <span>PWA Active</span>
          </div>
        </div>
      </header>

      {/* Main Scanner Viewport Area */}
      <main className="scanner-viewport-section">
        <CameraScanner
          onScan={processScan}
          isPaused={isPaused || isManualModalOpen || isGateModalOpen}
          autoResetDelay={1500}
        />
      </main>

      {/* Bottom Bar: Stats, Gate Switcher, Manual Code */}
      <footer className="scanner-bottom-section">
        <GateStatsBar
          gateName={gateName}
          onChangeGate={() => setIsGateModalOpen(true)}
          onOpenManualEntry={() => setIsManualModalOpen(true)}
          stats={stats}
          isOnline={offlineSync.isOnline}
          pendingSyncCount={offlineSync.pendingCount}
          onSyncNow={offlineSync.syncNow}
          isSyncing={offlineSync.isSyncing}
        />
      </footer>

      {/* Popups & Dialogs */}
      {lastResult && (
        <ScanResultOverlay
          result={lastResult}
          onClose={dismissResult}
          autoDismissDelay={1800}
        />
      )}

      <ManualEntryModal
        isOpen={isManualModalOpen}
        onClose={() => setIsManualModalOpen(false)}
        onSubmit={handleManualSubmit}
      />

      <GateSelectorModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        currentGate={gateName}
        onSelectGate={changeGate}
      />
    </div>
  );
}
