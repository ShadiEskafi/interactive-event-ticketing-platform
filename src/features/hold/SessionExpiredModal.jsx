import { useEffect, useRef } from 'react';
import { useLanguage } from '../../context';

/**
 * Blocking Session Expired Modal (Triggered when hold reaches 00:00)
 */
export function SessionExpiredModal({ isOpen, onReturnToMap }) {
  const { t } = useLanguage();
  const returnBtnRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      returnBtnRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="session-expired-overlay p-4 sm:p-6 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="expired-modal-title"
      aria-describedby="expired-modal-desc"
    >
      <div className="session-expired-card w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
        <div className="expired-icon-wrap" aria-hidden="true">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#E11D48" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>

        <h2 id="expired-modal-title" className="expired-modal-title">
          {t('hold.expired_title', 'انتهت صلاحية الحجز')}
        </h2>

        <p id="expired-modal-desc" className="expired-modal-description">
          {t(
            'hold.expired_desc',
            'انتهت فترة الـ 300 ثانية للحجز المؤقت وتم تحرير المقاعد للجمهور مرة أخرى.'
          )}
        </p>

        <div className="expired-modal-actions">
          <button
            ref={returnBtnRef}
            type="button"
            className="btn-return-map"
            onClick={onReturnToMap}
          >
            {t('hold.back_to_map', 'العودة إلى خريطة المقاعد')}
          </button>
        </div>
      </div>
    </div>
  );
}
