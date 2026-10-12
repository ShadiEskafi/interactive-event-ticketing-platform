import { useState, useEffect, useCallback } from 'react';
import { useLanguage } from '../../../context';
import {
  TicketIcon,
  XIcon,
  ShieldIcon,
  AlertTriangleIcon,
  ZapIcon,
} from '../../../components/common/Icons';

/**
 * CreateGateStaffModal Component
 * Provisioning modal for Super Admin and Event Organizers to create dedicated gate staff operator accounts
 * scoped optionally to a specific event and date.
 * Features 1-click Quick Templates for Gate 1, Gate 2, and VIP Gate operators.
 * Pure SVG icons and zero emoji dependency.
 */
export function CreateGateStaffModal({
  isOpen,
  onClose,
  events = [],
  initialEventId = '',
  onSubmit,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [assignedEventId, setAssignedEventId] = useState('');
  const [assignedDate, setAssignedDate] = useState('');
  const [validationError, setValidationError] = useState('');

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setName('');
      setNameAr('');
      setEmail('');
      setPassword('GateStaffPass2026!');
      setAssignedEventId(initialEventId || events[0]?.id || '');
      setAssignedDate(new Date().toISOString().split('T')[0]);
      setValidationError('');
    }
  }

  // Handle ESC key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const getEventSlug = useCallback((evtId) => {
    const targetEvt = events.find((e) => e.id === evtId) || events[0];
    if (!targetEvt) return 'event';
    if (targetEvt.id && targetEvt.id.startsWith('evt-')) {
      return targetEvt.id.replace(/^evt-/, '');
    }
    if (targetEvt.title) {
      return targetEvt.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    return targetEvt.id || 'event';
  }, [events]);

  const handleApplyTemplate = (type) => {
    const targetId = assignedEventId || initialEventId || events[0]?.id || '';
    const slug = getEventSlug(targetId);
    const today = new Date().toISOString().split('T')[0];

    if (!assignedEventId && targetId) {
      setAssignedEventId(targetId);
    }
    setAssignedDate(today);
    setValidationError('');

    if (type === 'gate1') {
      setName('Gate 1 Operator');
      setNameAr('مشغل بوابة 1');
      setEmail(`gate1.${slug || 'event'}@ticketcraft.com`);
      setPassword('GatePass1!');
    } else if (type === 'gate2') {
      setName('Gate 2 Operator');
      setNameAr('مشغل بوابة 2');
      setEmail(`gate2.${slug || 'event'}@ticketcraft.com`);
      setPassword('GatePass2!');
    } else if (type === 'vip') {
      setName('VIP Gate Operator');
      setNameAr('مشغل بوابة كبار الشخصيات');
      setEmail(`vipgate.${slug || 'event'}@ticketcraft.com`);
      setPassword('VIPPass2026!');
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setValidationError(
        isAr ? 'يرجى إدخال اسم موظف البوابة' : 'Please enter gate staff name'
      );
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setValidationError(
        isAr ? 'يرجى إدخال بريد إلكتروني صالح' : 'Please enter a valid email address'
      );
      return;
    }

    if (!password.trim() || password.length < 6) {
      setValidationError(
        isAr
          ? 'يجب أن لا تقل كلمة المرور عن ٦ أحرف'
          : 'Password must be at least 6 characters'
      );
      return;
    }

    setValidationError('');
    onSubmit?.({
      name: name.trim(),
      name_ar: nameAr.trim() || name.trim(),
      email: email.trim().toLowerCase(),
      password: password.trim(),
      assignedEventId: assignedEventId || null,
      assignedDate: assignedDate || null,
    });
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="gate-staff-modal-title"
      data-testid="create-gate-staff-modal"
    >
      <div
        className="modal-window admin-event-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="gate-staff-modal-window"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-title-box">
            <span className="modal-icon">
              <TicketIcon size={20} />
            </span>
            <h2 id="gate-staff-modal-title" className="modal-title">
              {isAr ? 'تعيين طاقم بوابة جديد' : 'Provision Gate Staff Account'}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            data-testid="btn-close-gate-staff-modal"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Notice Card */}
        <div className="venue-capacity-notice-banner" style={{ borderLeftColor: '#3b82f6' }}>
          <div className="notice-icon">
            <ShieldIcon size={24} />
          </div>
          <div className="notice-content">
            <h4 className="notice-heading">
              {isAr ? 'تقييد الصلاحيات على الفعالية المحددة' : 'Event-Scoped Turnstile Security'}
            </h4>
            <p className="notice-body">
              {isAr
                ? 'يمكن تقييد حساب موظف البوابة بفعالية محددة. سيقوم ماسح البوابة فورياً برفض أي تذكرة لا تنتمي لهذه الفعالية.'
                : 'Scoping staff to a designated event enforces gate turnstile validation. Tickets for mismatched events will be automatically rejected.'}
            </p>
          </div>
        </div>

        {/* Gate Staff Quick Templates */}
        <div
          className="quick-templates-section"
          data-testid="gate-staff-quick-templates"
          style={{
            marginBottom: '1.25rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#0f172a',
            borderRadius: '8px',
            border: '1px solid #334155',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '0.6rem',
              fontSize: '0.85rem',
              fontWeight: '600',
              color: '#38bdf8',
            }}
          >
            <ZapIcon size={15} />
            <span>
              {isAr
                ? 'نماذج سريعة لطاقم البوابات (ملء بنقرة واحدة):'
                : 'Gate Staff Quick Templates (1-Click Fill):'}
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            <button
              type="button"
              className="admin-btn btn-secondary template-btn"
              data-testid="template-gate-1"
              onClick={() => handleApplyTemplate('gate1')}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <TicketIcon size={14} />
              <span>{isAr ? 'نموذج بوابة 1' : 'Gate 1 Template'}</span>
            </button>
            <button
              type="button"
              className="admin-btn btn-secondary template-btn"
              data-testid="template-gate-2"
              onClick={() => handleApplyTemplate('gate2')}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <TicketIcon size={14} />
              <span>{isAr ? 'نموذج بوابة 2' : 'Gate 2 Template'}</span>
            </button>
            <button
              type="button"
              className="admin-btn btn-secondary template-btn"
              data-testid="template-gate-vip"
              onClick={() => handleApplyTemplate('vip')}
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.75rem' }}
            >
              <ShieldIcon size={14} />
              <span>{isAr ? 'نموذج بوابة VIP' : 'VIP Gate Template'}</span>
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-modal-form" data-testid="gate-staff-form">
          {validationError && (
            <div className="form-error-alert" role="alert">
              <AlertTriangleIcon size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <div className="form-grid">
            {/* Staff Name (English) */}
            <div className="form-group">
              <label htmlFor="staff-name" className="form-label">
                {isAr ? 'اسم موظف البوابة (بالإنجليزية) *' : 'Gate Staff Name (English) *'}
              </label>
              <input
                id="staff-name"
                type="text"
                className="admin-input"
                placeholder="e.g. Omar Farooq"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-staff-name"
              />
            </div>

            {/* Staff Name (Arabic) */}
            <div className="form-group">
              <label htmlFor="staff-name-ar" className="form-label">
                {isAr ? 'اسم موظف البوابة (بالعربية)' : 'Gate Staff Name (Arabic)'}
              </label>
              <input
                id="staff-name-ar"
                type="text"
                dir="rtl"
                className="admin-input"
                placeholder="مثال: عمر فاروق"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                data-testid="input-staff-name-ar"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="staff-email" className="form-label">
                {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
              </label>
              <input
                id="staff-email"
                type="email"
                className="admin-input"
                placeholder="gate.staff@ticketcraft.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-staff-email"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="staff-password" className="form-label">
                {isAr ? 'كلمة المرور المؤقتة *' : 'Temporary Password *'}
              </label>
              <input
                id="staff-password"
                type="text"
                className="admin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-staff-password"
              />
            </div>

            {/* Assigned Event */}
            <div className="form-group">
              <label htmlFor="staff-event" className="form-label">
                {isAr ? 'الفعالية المعينة (نطاق الصلاحية)' : 'Assigned Event Scope'}
              </label>
              <select
                id="staff-event"
                className="admin-select"
                value={assignedEventId}
                onChange={(e) => setAssignedEventId(e.target.value)}
                data-testid="select-staff-event"
              >
                <option value="">
                  {isAr ? '— جميع الفعاليات (غير مقيد) —' : '— All Events (Unrestricted) —'}
                </option>
                {events.map((evt) => (
                  <option key={evt.id} value={evt.id}>
                    {isAr ? evt.title_ar || evt.title : evt.title} ({evt.id})
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned Date */}
            <div className="form-group">
              <label htmlFor="staff-date" className="form-label">
                {isAr ? 'تاريخ الوردية / الفعالية' : 'Assigned Shift Date'}
              </label>
              <input
                id="staff-date"
                type="date"
                className="admin-input"
                value={assignedDate}
                onChange={(e) => setAssignedDate(e.target.value)}
                data-testid="input-staff-date"
              />
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-footer-actions">
            <button
              type="button"
              className="admin-btn btn-secondary"
              onClick={onClose}
              data-testid="btn-staff-cancel"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="admin-btn btn-primary"
              data-testid="btn-staff-submit"
            >
              {isAr ? 'إنشاء حساب موظف البوابة' : 'Create Gate Staff Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateGateStaffModal;
