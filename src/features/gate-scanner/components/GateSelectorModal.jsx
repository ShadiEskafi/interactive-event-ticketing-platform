import { useState } from 'react';

const STANDARD_GATES = [
  { id: 'gate-a', name: 'Gate A (North Entrance)' },
  { id: 'gate-b', name: 'Gate B (South Entrance)' },
  { id: 'gate-c', name: 'Gate C (East Entrance)' },
  { id: 'gate-vip', name: 'VIP & Press Turnstile' },
  { id: 'gate-balcony', name: 'Balcony Mezzanine Gate' },
];

/**
 * Gate Selection Modal
 * Allows validator staff to configure their current entry checkpoint.
 */
export function GateSelectorModal({ isOpen, onClose, currentGate, onSelectGate }) {
  const [selected, setSelected] = useState(currentGate || 'Gate A (North Entrance)');
  const [customGate, setCustomGate] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    const finalGate = customGate.trim() || selected;
    if (onSelectGate) {
      onSelectGate(finalGate);
    }
    if (onClose) onClose();
  };

  return (
    <div
      className="gate-selector-backdrop"
      data-testid="gate-selector-modal"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-selector-title"
    >
      <div className="gate-selector-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-icon-badge">🚪</div>
          <div>
            <h3 id="gate-selector-title" className="modal-title">Select Entry Gate</h3>
            <p className="modal-subtitle">Choose the checkpoint you are currently operating</p>
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

        <div className="gate-options-list">
          {STANDARD_GATES.map((g) => (
            <button
              key={g.id}
              type="button"
              className={`gate-option-item ${selected === g.name && !customGate ? 'selected' : ''}`}
              onClick={() => {
                setSelected(g.name);
                setCustomGate('');
              }}
              data-testid={`gate-option-${g.id}`}
            >
              <span className="gate-radio-indicator">
                {selected === g.name && !customGate ? '●' : '○'}
              </span>
              <span className="gate-opt-name">{g.name}</span>
            </button>
          ))}
        </div>

        <div className="custom-gate-input-box">
          <label htmlFor="custom-gate-field" className="form-label">
            Or Custom Gate Name:
          </label>
          <input
            id="custom-gate-field"
            type="text"
            className="form-input"
            placeholder="e.g. Turnstile 04"
            value={customGate}
            onChange={(e) => setCustomGate(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-cancel" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn-submit"
            onClick={handleConfirm}
            data-testid="btn-confirm-gate"
          >
            Confirm Gate
          </button>
        </div>
      </div>
    </div>
  );
}
