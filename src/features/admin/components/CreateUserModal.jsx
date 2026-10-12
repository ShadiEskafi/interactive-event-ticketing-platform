import { useState, useEffect } from 'react';
import { useLanguage } from '../../../context';
import {
  UserIcon,
  XIcon,
  ShieldIcon,
  AlertTriangleIcon,
} from '../../../components/common/Icons';

/**
 * CreateUserModal Component
 * Provisioning modal for Super Admin to create users of any platform role:
 * attendee, organizer, gate_staff.
 * Pure SVG icons and zero emoji dependency.
 */
export function CreateUserModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [name, setName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('TicketCraft2026!');
  const [role, setRole] = useState('attendee');
  const [validationError, setValidationError] = useState('');

  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setName('');
      setNameAr('');
      setEmail('');
      setPassword('TicketCraft2026!');
      setRole('attendee');
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

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!name.trim()) {
      setValidationError(
        isAr ? 'يرجى إدخال اسم المستخدم' : 'Please enter user name'
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
          ? 'يجب ألا تقل كلمة المرور عن ٦ أحرف'
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
      role,
    });
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="user-modal-title"
      data-testid="create-user-modal"
    >
      <div
        className="modal-window admin-event-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="create-user-modal-window"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-title-box">
            <span className="modal-icon">
              <UserIcon size={20} />
            </span>
            <h2 id="user-modal-title" className="modal-title">
              {isAr ? 'إضافة وتعيين مستخدم جديد' : 'Provision Platform User'}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            data-testid="btn-close-user-modal"
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
              {isAr ? 'إدارة الصلاحيات وحوكمة الحسابات' : 'Role-Based Access Provisioning'}
            </h4>
            <p className="notice-body">
              {isAr
                ? 'يمكنك إنشاء حسابات مستخدمين بالصلاحية المطلوبة (زائر، منظم فعاليات، أو طاقم بوابة). ستسري الصلاحيات فورياً.'
                : 'Provision users directly with the designated RBAC permissions (Attendee, Organizer, or Gate Staff). Access is effective immediately.'}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-modal-form" data-testid="create-user-form">
          {validationError && (
            <div className="form-error-alert" role="alert">
              <AlertTriangleIcon size={16} />
              <span>{validationError}</span>
            </div>
          )}

          <div className="form-grid">
            {/* User Name (English) */}
            <div className="form-group">
              <label htmlFor="user-name" className="form-label">
                {isAr ? 'اسم المستخدم (بالإنجليزية) *' : 'User Name (English) *'}
              </label>
              <input
                id="user-name"
                type="text"
                className="admin-input"
                placeholder="e.g. Faisal Al-Rashid"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                data-testid="input-user-name"
              />
            </div>

            {/* User Name (Arabic) */}
            <div className="form-group">
              <label htmlFor="user-name-ar" className="form-label">
                {isAr ? 'اسم المستخدم (بالعربية)' : 'User Name (Arabic)'}
              </label>
              <input
                id="user-name-ar"
                type="text"
                dir="rtl"
                className="admin-input"
                placeholder="مثال: فيصل الراشد"
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                data-testid="input-user-name-ar"
              />
            </div>

            {/* Email */}
            <div className="form-group">
              <label htmlFor="user-email" className="form-label">
                {isAr ? 'البريد الإلكتروني *' : 'Email Address *'}
              </label>
              <input
                id="user-email"
                type="email"
                className="admin-input"
                placeholder="user@ticketcraft.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                data-testid="input-user-email"
              />
            </div>

            {/* Password */}
            <div className="form-group">
              <label htmlFor="user-password" className="form-label">
                {isAr ? 'كلمة المرور المؤقتة *' : 'Temporary Password *'}
              </label>
              <input
                id="user-password"
                type="text"
                className="admin-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-user-password"
              />
            </div>

            {/* Role Selection */}
            <div className="form-group">
              <label htmlFor="user-role" className="form-label">
                {isAr ? 'الصلاحية الممنوحة *' : 'Assigned Role *'}
              </label>
              <select
                id="user-role"
                className="admin-select"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                data-testid="select-user-role"
              >
                <option value="attendee">
                  {isAr ? 'الزائر العادي (Attendee)' : 'Attendee'}
                </option>
                <option value="organizer">
                  {isAr ? 'منشئ الفعالية / منظم (Organizer)' : 'Organizer'}
                </option>
                <option value="gate_staff">
                  {isAr ? 'طاقم البوابة (Gate Staff)' : 'Gate Staff'}
                </option>
              </select>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="modal-footer-actions">
            <button
              type="button"
              className="admin-btn btn-secondary"
              onClick={onClose}
              data-testid="btn-user-cancel"
            >
              {isAr ? 'إلغاء' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="admin-btn btn-primary"
              data-testid="btn-user-submit"
            >
              {isAr ? 'إنشاء حساب المستخدم' : 'Create User Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUserModal;
