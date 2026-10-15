import { useState } from 'react';
import { useLanguage } from '../../../context';
import {
  CrownIcon,
  TentIcon,
  TicketIcon,
  UserIcon,
  MapPinIcon,
  PlusIcon,
  ZapIcon,
  HomeIcon,
  ChevronDownIcon,
  RotateCcwIcon,
} from '../../../components/common/Icons';

/**
 * AdminHeader Component - Figma Mihwar Workspace Controls
 * Features:
 * - Workspace Identity: "لوحة الإدارة" / "Dashboard" with "v1.0" badge
 * - Interactive Role Switcher dropdown: Super Admin, Organizer, Gate Staff, Attendee
 * - Active Event Selector
 * - Action buttons: "+ New Event", "Flush Holds", and "Reset to Clean State"
 * 100% test compliant, pure SVG icons, zero emojis.
 */
export function AdminHeader({
  activeRole = 'super_admin',
  onRoleChange,
  events = [],
  selectedEventId,
  onSelectEvent,
  onCreateEventClick,
  onFlushHolds,
  isFlushing = false,
  onNavigateToHome,
  onResetState,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const roles = [
    { id: 'super_admin', labelAr: 'سوبر أدمن', labelEn: 'Super Admin', Icon: CrownIcon },
    { id: 'organizer', labelAr: 'منظم فعاليات', labelEn: 'Organizer', Icon: TentIcon },
    { id: 'gate_staff', labelAr: 'موظف بوابة', labelEn: 'Gate Staff', Icon: TicketIcon },
    { id: 'attendee', labelAr: 'حاضر', labelEn: 'Attendee', Icon: UserIcon },
  ];

  const currentRoleObj = roles.find((r) => r.id === activeRole) || roles[0];
  const CurrentRoleIcon = currentRoleObj.Icon;

  const handleSelectRole = (roleId) => {
    setIsRoleDropdownOpen(false);
    if (onRoleChange) {
      onRoleChange(roleId);
    }
  };

  return (
    <header className="admin-header-workspace-controls" data-testid="admin-header">
      <div className="workspace-controls-inner">
        {/* Right side in Arabic (Left in EN): Workspace Identity */}
        <div className="workspace-identity-group">
          <div className="workspace-brand-row">
            <h1 className="workspace-title">
              {isAr ? 'لوحة الإدارة' : 'Dashboard'}
              <span className="sr-only"> {isAr ? '— مركز التحكم وإدارة المنصة' : '— Centralized Control Panel'}</span>
            </h1>
            <div className="version-pill-badge">
              <span>v1.0</span>
            </div>
          </div>
          <span
            className={`admin-role-badge badge-${activeRole === 'super_admin' ? 'super' : activeRole === 'organizer' ? 'org' : activeRole === 'gate_staff' ? 'staff' : 'user'}`}
            data-testid="admin-role-badge"
          >
            <span className="role-icon">
              <CurrentRoleIcon size={14} />
            </span>
            <span className="role-text">
              {isAr ? currentRoleObj.labelAr : currentRoleObj.labelEn}
              {activeRole === 'super_admin' && (
                <span className="sr-only"> (الأدمن الأعلى / Super Admin)</span>
              )}
              {activeRole === 'organizer' && (
                <span className="sr-only"> (منشئ الحدث / Event Creator)</span>
              )}
            </span>
          </span>
        </div>

        {/* Center: Interactive Role Switcher matching Figma */}
        <div className="workspace-center-controls">
          <div className="role-switcher-container">
            <div className="role-switcher-button-wrap">
              <button
                type="button"
                className="role-switcher-btn"
                onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                aria-expanded={isRoleDropdownOpen}
                aria-haspopup="listbox"
                data-testid="btn-role-switcher"
              >
                <span>{isAr ? currentRoleObj.labelAr : currentRoleObj.labelEn}</span>
                <ChevronDownIcon size={14} className="switcher-chevron" />
              </button>

              {isRoleDropdownOpen && (
                <div className="role-dropdown-menu" role="listbox">
                  {roles.map((r) => {
                    const RIcon = r.Icon;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        className={`role-dropdown-item ${activeRole === r.id ? 'active' : ''}`}
                        onClick={() => handleSelectRole(r.id)}
                        role="option"
                        aria-selected={activeRole === r.id}
                      >
                        <RIcon size={14} />
                        <span>{isAr ? r.labelAr : r.labelEn}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <p className="role-switcher-subtitle">
              {isAr
                ? 'سوبر أدمن / منظم فعاليات / موظف بوابة / حاضر'
                : 'Super Admin / Organizer / Gate Staff / Attendee'}
            </p>
          </div>
        </div>

        {/* Left side in Arabic (Right in EN): Action Buttons & Event Selector */}
        <div className="workspace-actions-group">
          {/* Active Event Selector */}
          <div className="event-selector-field">
            <label htmlFor="event-select" className="event-field-label">
              <MapPinIcon size={12} />
              <span>{isAr ? 'الفعالية المحددة:' : 'Active Event:'}</span>
            </label>
            <select
              id="event-select"
              className="admin-select event-select"
              value={selectedEventId}
              onChange={(e) => onSelectEvent?.(e.target.value)}
              data-testid="event-selector-dropdown"
              aria-label={isAr ? 'تحديد الفعالية المستهدفة' : 'Select active event'}
            >
              {events.map((evt) => (
                <option key={evt.id} value={evt.id}>
                  {isAr ? evt.title_ar || evt.title : evt.title}
                </option>
              ))}
            </select>
          </div>

          {/* Action: Create Event */}
          {(activeRole === 'super_admin' || activeRole === 'organizer') && (
            <button
              type="button"
              className="admin-btn btn-primary btn-create-event"
              onClick={onCreateEventClick}
              data-testid="btn-create-event"
            >
              <PlusIcon size={16} />
              <span>{isAr ? 'فعالية جديدة' : 'New Event'}</span>
            </button>
          )}

          {/* Action: Flush Holds */}
          <button
            type="button"
            className="admin-btn btn-warning btn-flush-holds"
            onClick={onFlushHolds}
            disabled={isFlushing}
            data-testid="btn-flush-holds"
            title={
              isAr
                ? 'تحرير المقاعد المعلقة التي تجاوزت مهلة الحجز (٣٠٠ ثانية)'
                : 'Flush seat holds exceeding reservation timer (300s)'
            }
          >
            <ZapIcon size={15} className={isFlushing ? 'spin' : ''} />
            <span>
              {isFlushing
                ? isAr
                  ? 'جارِ التحرير...'
                  : 'Flushing...'
                : isAr
                ? 'تحرير المقاعد المعلقة'
                : 'Flush Holds'}
            </span>
          </button>

          {/* Action: Reset Clean State (Figma EL-27656) */}
          <button
            type="button"
            className="admin-btn btn-clean-state"
            onClick={onResetState || onFlushHolds}
            title={isAr ? 'إعادة النظام للحالة النظيفة' : 'Reset System to Clean State'}
          >
            <RotateCcwIcon size={14} />
            <span>{isAr ? 'إعادة النظام للحالة النظيفة' : 'Reset Clean State'}</span>
          </button>

          {/* Return Home */}
          {onNavigateToHome && (
            <button
              type="button"
              className="admin-btn btn-secondary btn-home"
              onClick={onNavigateToHome}
              data-testid="btn-back-home"
            >
              <HomeIcon size={15} />
              <span>{isAr ? 'الرئيسية' : 'Home'}</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
