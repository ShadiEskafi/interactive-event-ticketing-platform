import { useEffect } from 'react';
import { useLanguage } from '../../context';
import { AlertTriangleIcon, ShieldAlertIcon, XIcon, Trash2Icon } from '../common/Icons';
import './ConfirmModal.css';

/**
 * ConfirmDestructiveModal Component
 * Modal for confirming high-impact destructive operations (e.g., event deletion, hold flush, account suspension).
 * Pure SVG icons and Slate dark theme. Zero emojis.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the modal is visible
 * @param {string} [props.title] - Modal title heading
 * @param {string} [props.message] - Core warning message
 * @param {string} [props.itemName] - Name of target entity displayed prominently
 * @param {string} [props.consequences] - Explanatory consequence description
 * @param {Function} props.onConfirm - Confirm callback
 * @param {Function} props.onCancel - Cancel/dismiss callback
 * @param {string} [props.confirmText] - Label for confirm action button
 * @param {string} [props.cancelText] - Label for cancel action button
 * @param {boolean} [props.isDangerous=true] - Red critical style (true) or amber warning (false)
 */
export function ConfirmDestructiveModal({
  isOpen,
  title,
  message,
  itemName,
  consequences,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  isDangerous = true,
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

  const defaultTitle = isDangerous
    ? isAr
      ? 'تأكيد الحذف النهائي'
      : 'Confirm Permanent Deletion'
    : isAr
    ? 'تأكيد العملية'
    : 'Confirm Critical Action';

  const defaultMessage = isAr
    ? 'هل أنت متأكد من المتابعة وتنفيذ هذا الإجراء؟'
    : 'Are you sure you want to proceed with this action?';

  const defaultConsequences = isDangerous
    ? isAr
      ? 'هذا الإجراء لا يمكن التراجع عنه وسيتم مسح كافة البيانات المرتبطة به نهائياً.'
      : 'This action is irreversible and all associated records will be permanently removed.'
    : isAr
    ? 'يرجى مراجعة تبعات هذا الإجراء قبل المتابعة.'
    : 'Please review the consequences before continuing.';

  const defaultConfirmText = isDangerous
    ? isAr
      ? 'حذف نهائياً'
      : 'Delete Permanently'
    : isAr
    ? 'تأكيد'
    : 'Confirm';

  const defaultCancelText = isAr ? 'إلغاء' : 'Cancel';

  return (
    <div
      className="confirm-modal-backdrop"
      onClick={onCancel}
      role="presentation"
      data-testid="confirm-destructive-modal"
    >
      <div
        className={`confirm-modal-window ${isDangerous ? 'theme-destructive' : 'theme-warning'}`}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="destructive-modal-title"
        aria-describedby="destructive-modal-desc"
        data-testid="destructive-modal-window"
      >
        {/* Close Button */}
        <button
          type="button"
          className="confirm-modal-close"
          onClick={onCancel}
          aria-label={isAr ? 'إغلاق النافذة' : 'Close modal'}
          data-testid="btn-destructive-close"
        >
          <XIcon size={18} />
        </button>

        {/* Alert Icon & Header */}
        <div className="confirm-modal-header">
          <div className="alert-icon-badge">
            {isDangerous ? (
              <AlertTriangleIcon size={28} className="icon-destructive" />
            ) : (
              <ShieldAlertIcon size={28} className="icon-warning" />
            )}
          </div>
          <div className="header-text-block">
            <h3 id="destructive-modal-title" className="confirm-modal-title">
              {title || defaultTitle}
            </h3>
            <p id="destructive-modal-desc" className="confirm-modal-message">
              {message || defaultMessage}
            </p>
          </div>
        </div>

        {/* Target Item Name Banner */}
        {itemName && (
          <div className="confirm-target-banner" data-testid="destructive-item-name">
            <span className="target-label">{isAr ? 'العنصر المستهدف:' : 'Target item:'}</span>
            <strong className="target-name">{itemName}</strong>
          </div>
        )}

        {/* Consequence Description Box */}
        <div className="consequences-alert-box" data-testid="destructive-consequences">
          <div className="consequence-icon-wrap">
            <ShieldAlertIcon size={16} />
          </div>
          <p className="consequence-text">
            {consequences || defaultConsequences}
          </p>
        </div>

        {/* Actions Footer */}
        <div className="confirm-modal-actions">
          <button
            type="button"
            className="confirm-btn btn-cancel"
            onClick={onCancel}
            data-testid="btn-destructive-cancel"
          >
            {cancelText || defaultCancelText}
          </button>
          <button
            type="button"
            className={`confirm-btn ${isDangerous ? 'btn-danger' : 'btn-warn'}`}
            onClick={onConfirm}
            autoFocus
            data-testid="btn-destructive-confirm"
          >
            <Trash2Icon size={16} />
            <span>{confirmText || defaultConfirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDestructiveModal;
