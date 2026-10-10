import { useState, useRef, useEffect } from 'react';

/**
 * Manual Ticket Entry Modal
 * Fallback dialog for attendees with cracked screens, damaged QR codes, or printed paper issues.
 */
export function ManualEntryModal({ isOpen, onClose, onSubmit, isLoading = false }) {
  const [ticketInput, setTicketInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const inputRef = useRef(null);

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setTicketInput('');
      setErrorMsg('');
    }
  }

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const code = ticketInput.trim();
    if (!code) {
      setErrorMsg('Please enter a ticket code.');
      return;
    }

    if (onSubmit) {
      onSubmit(code);
    }
  };

  return (
    <div
      className="manual-entry-backdrop"
      data-testid="manual-entry-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="manual-entry-title"
    >
      <div className="manual-entry-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-badge">⌨️</div>
          <div>
            <h3 id="manual-entry-title" className="modal-title">Manual Ticket Entry</h3>
            <p className="modal-subtitle">Enter ticket code directly (e.g., TKT-10029 or UUID)</p>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="ticket-code-input" className="form-label">
              Ticket Code / Serial Number
            </label>
            <input
              id="ticket-code-input"
              ref={inputRef}
              type="text"
              className="form-input font-mono"
              placeholder="e.g. TKT-10029"
              value={ticketInput}
              onChange={(e) => {
                setTicketInput(e.target.value);
                if (errorMsg) setErrorMsg('');
              }}
              autoComplete="off"
              autoCapitalize="characters"
              data-testid="input-manual-ticket-code"
            />
            {errorMsg && <p className="form-error-msg">{errorMsg}</p>}
          </div>

          <div className="modal-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={isLoading || !ticketInput.trim()}
              data-testid="btn-submit-manual-code"
            >
              {isLoading ? 'Verifying...' : 'Validate Entry ➔'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
