import { useState, useRef, useEffect } from 'react';
import { ChevronDownIcon, RotateCcwIcon, CheckCircleIcon, PlusIcon } from '../../../components/common/Icons';

/**
 * WorkspaceControls Component - Admin Dashboard Workspace Controls Toolbar
 * Follows Figma Node 125:85 / 145:27548 (EN) & 145:27643 (AR)
 * Displays Workspace Identity ("Admin dashboard" / "لوحة الإدارة" + "v1.0" badge),
 * Role Switcher with current active role and subtext, and "Reset to clean state" button.
 */
export function WorkspaceControls({
  activeRole = 'super_admin',
  onSelectRole,
  onResetCleanState,
  onCreateEvent,
  language = 'en',
  canSwitchRole = true,
}) {
  const isAr = language === 'ar';
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const roles = [
    { id: 'super_admin', labelEn: 'Super Admin', labelAr: 'سوبر أدمن' },
    { id: 'organizer', labelEn: 'Event Organizer', labelAr: 'منظم فعاليات' },
    { id: 'gate_staff', labelEn: 'Gate Staff', labelAr: 'موظف بوابة' },
    { id: 'attendee', labelEn: 'Attendee', labelAr: 'حاضر' },
  ];

  const currentRole =
    roles.find(
      (r) =>
        r.id === activeRole ||
        r.labelEn.toLowerCase() === (activeRole || '').toLowerCase()
    ) || roles[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleRoleSelect = (roleId) => {
    setIsOpen(false);
    onSelectRole?.(roleId);
  };

  return (
    <div className="tc-workspace-controls" data-testid="tc-workspace-controls">
      {/* 1. Workspace Identity */}
      <div className="tc-workspace-identity" data-testid="admin-header">
        <h1 className="tc-workspace-title">
          {isAr ? 'لوحة الإدارة' : 'Admin dashboard'}
          <span className="sr-only">
            {isAr ? 'مركز التحكم وإدارة المنصة' : 'Centralized Control Panel'}
          </span>
        </h1>
        <span className="tc-version-badge">v1.0</span>
      </div>

      {/* 2. Role Switcher Cluster */}
      <div className="tc-role-switcher-cluster" ref={dropdownRef}>
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className={`tc-role-switcher-btn ${!canSwitchRole ? 'role-locked' : ''}`}
            onClick={() => {
              if (canSwitchRole) {
                setIsOpen((prev) => !prev);
              }
            }}
            aria-expanded={canSwitchRole ? isOpen : undefined}
            aria-haspopup={canSwitchRole ? 'listbox' : undefined}
            data-testid="admin-role-badge"
            style={!canSwitchRole ? { cursor: 'default' } : undefined}
          >
            <span>
              {isAr ? currentRole.labelAr : currentRole.labelEn}
              <span className="sr-only">
                {currentRole.id === 'super_admin'
                  ? isAr
                    ? 'الأدمن الأعلى'
                    : 'Super Admin'
                  : isAr
                  ? 'منشئ الحدث'
                  : 'Event Creator'}
              </span>
            </span>
            {canSwitchRole && (
              <ChevronDownIcon
                size={14}
                style={{
                  transform: isOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform 0.15s ease',
                }}
              />
            )}
          </button>

          {canSwitchRole && isOpen && (
            <div
              role="listbox"
              aria-label={isAr ? 'اختيار الدور' : 'Select role'}
              style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                left: isAr ? 'auto' : 0,
                right: isAr ? 0 : 'auto',
                backgroundColor: 'var(--tc-surface-dark-card, #1c2921)',
                border: '1px solid var(--tc-surface-dark-border, #344337)',
                borderRadius: 'var(--tc-radius-sm, 6px)',
                padding: '4px',
                minWidth: '180px',
                zIndex: 50,
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.5)',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              {roles.map((role) => {
                const isSelected = role.id === currentRole.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleRoleSelect(role.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 'var(--tc-radius-xs, 4px)',
                      background: isSelected
                        ? 'var(--tc-accent-lime, #d2fa69)'
                        : 'transparent',
                      color: isSelected
                        ? 'var(--tc-surface-dark, #101813)'
                        : 'var(--tc-text-primary-dark, #f4f3eb)',
                      border: 'none',
                      fontSize: '12px',
                      fontWeight: isSelected ? 600 : 400,
                      cursor: 'pointer',
                      textAlign: isAr ? 'right' : 'left',
                      fontFamily: 'inherit',
                    }}
                  >
                    <span>{isAr ? role.labelAr : role.labelEn}</span>
                    {isSelected && <CheckCircleIcon size={14} />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <p className="tc-role-switcher-subtext">
          {isAr
            ? canSwitchRole
              ? 'سوبر أدمن / منظم فعاليات / موظف بوابة / حاضر'
              : 'صلاحيات الحساب الحالي الموثّق'
            : canSwitchRole
            ? 'Super Admin / Event Organizer / Gate Staff / Attendee'
            : 'Authenticated user role permissions'}
        </p>
      </div>

      {/* 3. Action Buttons */}
      <div className="tc-workspace-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {(activeRole === 'super_admin' || activeRole === 'organizer') && onCreateEvent && (
          <button
            type="button"
            className="tc-btn-action-lime"
            onClick={onCreateEvent}
            data-testid="btn-create-event"
            style={{ height: '34px', padding: '0 12px', fontSize: '12px' }}
          >
            <PlusIcon size={14} />
            <span>{isAr ? 'فعالية جديدة' : 'New event'}</span>
          </button>
        )}
        <button
          type="button"
          className="tc-btn-action-dark"
          onClick={onResetCleanState}
          data-testid="btn-clean-slate-reset"
        >
          <RotateCcwIcon size={14} />
          <span>{isAr ? 'إعادة النظام للحالة النظيفة' : 'Reset to clean state'}</span>
        </button>
      </div>
    </div>
  );
}

export default WorkspaceControls;
