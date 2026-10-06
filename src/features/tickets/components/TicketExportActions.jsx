/**
 * Ticket Export Actions Component (SPEC-04 / REQ-TICK-04.4)
 * Provides Download PDF and Download PNG controls with loading states.
 */
export function TicketExportActions({
  onDownloadPdf,
  onDownloadPng,
  isExportingPdf = false,
  isExportingPng = false,
  className = '',
}) {
  return (
    <div className={`ticket-export-actions ${className}`}>
      <button
        type="button"
        className="btn-export btn-export-pdf"
        data-testid="download-pdf-btn"
        disabled={isExportingPdf || isExportingPng}
        onClick={onDownloadPdf}
        aria-label="Download Printable PDF Ticket"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="12" y1="18" x2="12" y2="12" />
          <line x1="9" y1="15" x2="12" y2="18" />
          <line x1="15" y1="15" x2="12" y2="18" />
        </svg>
        <span>{isExportingPdf ? 'Exporting PDF...' : 'Download PDF'}</span>
      </button>

      <button
        type="button"
        className="btn-export btn-export-png"
        data-testid="download-png-btn"
        disabled={isExportingPdf || isExportingPng}
        onClick={onDownloadPng}
        aria-label="Download High-Resolution PNG Pass"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>{isExportingPng ? 'Saving PNG...' : 'Download PNG'}</span>
      </button>
    </div>
  );
}
