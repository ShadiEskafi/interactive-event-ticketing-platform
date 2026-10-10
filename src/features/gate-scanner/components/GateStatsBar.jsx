/**
 * Gate Stats Bar Component
 * Displays live throughput metrics, current gate selector, and connectivity status.
 */
export function GateStatsBar({
  gateName = 'Main Gate',
  onChangeGate,
  onOpenManualEntry,
  stats = { admitted: 0, rejected: 0, total: 0 },
  isOnline = true,
  pendingSyncCount = 0,
  onSyncNow,
  isSyncing = false,
}) {
  return (
    <div className="gate-stats-bar" data-testid="gate-stats-bar">
      <div className="stats-left">
        {/* Gate Name Selector Badge */}
        <button
          type="button"
          className="gate-badge-btn"
          onClick={onChangeGate}
          data-testid="btn-select-gate"
          title="Click to change gate"
        >
          <span className="gate-icon">🚪</span>
          <span className="gate-title">{gateName}</span>
          <span className="gate-edit-hint">▾</span>
        </button>

        {/* Connectivity Pill */}
        <div
          className={`connectivity-pill ${isOnline ? 'online' : 'offline'}`}
          data-testid="connectivity-pill"
        >
          <span className="status-dot" />
          <span className="status-label">{isOnline ? 'LIVE CLOUD' : 'OFFLINE'}</span>
          {pendingSyncCount > 0 && (
            <button
              type="button"
              className="sync-queue-badge"
              onClick={onSyncNow}
              disabled={isSyncing}
              title="Click to sync offline queue"
              data-testid="btn-sync-queue"
            >
              {isSyncing ? '⏳ Syncing...' : `📤 ${pendingSyncCount} queued`}
            </button>
          )}
        </div>
      </div>

      <div className="stats-center">
        {/* Admitted Counter */}
        <div className="stat-metric admitted" data-testid="metric-admitted">
          <span className="metric-val">{stats.admitted}</span>
          <span className="metric-lbl">Admitted</span>
        </div>

        {/* Rejected Counter */}
        <div className="stat-metric rejected" data-testid="metric-rejected">
          <span className="metric-val">{stats.rejected}</span>
          <span className="metric-lbl">Declined</span>
        </div>
      </div>

      <div className="stats-right">
        {/* Manual Code Fallback Button */}
        <button
          type="button"
          className="btn-manual-entry"
          onClick={onOpenManualEntry}
          data-testid="btn-manual-entry-modal"
          title="Search or enter ticket code manually"
        >
          <span className="btn-icon">⌨️</span>
          <span className="btn-text">Manual Code</span>
        </button>
      </div>
    </div>
  );
}
