import { useEffect } from 'react';
import { useLanguage } from '../../context';
import {
  Edit3Icon,
  CheckIcon,
  XIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
} from '../common/Icons';
import './ConfirmModal.css';

/**
 * ConfirmModificationModal Component
 * Interactive modal for reviewing diff summary before saving modifications
 * (e.g. role changes, ticket price adjustments, event status changes).
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is open
 * @param {string} [props.title] - Modal heading
 * @param {string} [props.description] - Introductory text
 * @param {Array<{ label: string, oldValue: any, newValue: any }>} [props.changes=[]] - Array of diff items
 * @param {Function} props.onConfirm - Confirm/Save callback
 * @param {Function} props.onCancel - Cancel callback
 * @param {string} [props.confirmText] - Label for confirm action button
 * @param {string} [props.cancelText] - Label for cancel action button
 */
export function ConfirmModificationModal({
  isOpen,
  title,
  description,
  changes = [],
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const defaultTitle = isAr ? 'مراجعة وتأكيد التغييرات' : 'Review & Confirm Changes';
  const defaultDescription = isAr
    ? 'يرجى مراجعة التعديلات أدناه قبل تطبيقها وحفظها:'
    : 'Please review the following modifications before saving:';
  const defaultConfirmText = isAr ? 'تأكيد وحفظ التغييرات' : 'Save Changes';
  const defaultCancelText = isAr ? 'إلغاء' : 'Cancel';

  const ArrowIcon = isAr ? ArrowLeftIcon : ArrowRightIcon;

  return (
    <div
      className="confirm-modal-backdrop"
      onClick={onCancel}
      role="presentation"
      data-testid="confirm-modification-modal"
    >
      <div
        className="confirm-modal-window theme-modification"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modification-modal-title"
        aria-describedby="modification-modal-desc"
        data-testid="modification-modal-window"
      >
        {/* Close Button */}
        <button
          type="button"
          className="confirm-modal-close"
          onClick={onCancel}
          aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
          data-testid="btn-modification-close"
        >
          <XIcon size={18} />
        </button>

        {/* Modal Header */}
        <div className="confirm-modal-header">
          <div className="alert-icon-badge badge-modification">
            <Edit3Icon size={24} className="icon-mod" />
          </div>
          <div className="header-text-block">
            <h3 id="modification-modal-title" className="confirm-modal-title">
              {title || defaultTitle}
            </h3>
            <p id="modification-modal-desc" className="confirm-modal-message">
              {description || defaultDescription}
            </p>
          </div>
        </div>

        {/* Changes Diff Summary Table / List */}
        <div className="modification-diff-container" data-testid="modification-diff-list">
          {changes.length === 0 ? (
            <div className="empty-diff-note">
              {isAr ? 'لا توجد تغييرات معلقة' : 'No changes detected.'}
            </div>
          ) : (
            <div className="diff-items-list">
              {changes.map((change, idx) => (
                <div key={idx} className="diff-item-row" data-testid={`diff-row-${idx}`}>
                  <div className="diff-label-column">
                    <span className="diff-field-name">{change.label}</span>
                  </div>
                  <div className="diff-values-column">
                    <div className="diff-val-badge val-old" title="Current value">
                      <span className="val-text">{String(change.oldValue ?? '—')}</span>
                    </div>
                    <span className="diff-arrow" aria-hidden="true">
                      <ArrowIcon size={14} />
                    </span>
                    <div className="diff-val-badge val-new" title="New value">
                      <span className="val-text">{String(change.newValue ?? '—')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-btn btn-cancel"
            onClick={onCancel}
            data-testid="btn-modification-cancel"
          >
            {cancelText || defaultCancelText}
          </button>
          <button
            type="button"
            className="confirm-btn btn-save"
            onClick={onConfirm}
            autoFocus
            data-testid="btn-modification-confirm"
          >
            <CheckIcon size={16} />
            <span>{confirmText || defaultConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModificationModal;
