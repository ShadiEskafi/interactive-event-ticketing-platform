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
} from '../../../components/common/Icons';

/**
 * AdminHeader Component
 * Top bar featuring:
 * - Active Role badge with pure SVG indicator
 * - Event drilldown selector dropdown with MapPin SVG
 * - Action buttons: "+ Create Event", "Flush Holds" (with animated SVG spinner state), and Return to Home.
 * Zero emojis dependency.
 */
export function AdminHeader({
  activeRole,
  _onRoleChange,
  events = [],
  selectedEventId,
  onSelectEvent,
  onCreateEventClick,
  onFlushHolds,
  isFlushing = false,
  onNavigateToHome,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const getRoleBadge = () => {
    switch (activeRole) {
      case 'super_admin':
        return { label: isAr ? 'الأدمن الأعلى' : 'Super Admin', Icon: CrownIcon, className: 'badge-super' };
      case 'organizer':
        return { label: isAr ? 'منشئ الحدث' : 'Event Creator', Icon: TentIcon, className: 'badge-org' };
      case 'gate_staff':
        return { label: isAr ? 'طاقم البوابة' : 'Gate Staff', Icon: TicketIcon, className: 'badge-staff' };
      default:
        return { label: isAr ? 'الزائر' : 'Attendee', Icon: UserIcon, className: 'badge-user' };
    }
  };

  const currentBadge = getRoleBadge();
  const RoleBadgeIcon = currentBadge.Icon;

  return (
    <header className="admin-header" data-testid="admin-header">
      <div className="admin-header-main">
        {/* Title & Role Badge */}
        <div className="admin-header-title-group">
          <div className="admin-title-row">
            <h1 className="admin-header-title">
              {isAr ? 'مركز التحكم وإدارة المنصة' : 'Centralized Control Panel'}
            </h1>
            <span
              className={`admin-role-badge ${currentBadge.className}`}
              data-testid="admin-role-badge"
            >
              <span className="role-icon">
                <RoleBadgeIcon size={16} />
              </span>
              <span className="role-text">{currentBadge.label}</span>
            </span>
          </div>
          <p className="admin-header-subtitle">
            {activeRole === 'super_admin'
              ? isAr
                ? 'حوكمة شاملة، مراقبة التزامن اللحظي، مؤشرات الأداء الحيوية لكامل المنصة'
                : 'Platform governance, realtime concurrency monitor, and platform-wide metrics'
              : isAr
              ? 'إدارة فعالياتك، تذاكر القاعة القياسية (٥٢٠ مقعداً)، وكشوفات الحضور'
              : 'Event operations, fixed 520-seat interactive venue, and attendee roster'}
          </p>
        </div>

        {/* Global Controls & Actions */}
        <div className="admin-header-controls">
          {/* Active Event Selector */}
          <div className="control-item event-selector-control">
            <label htmlFor="event-select" className="control-label">
              <span className="label-icon">
                <MapPinIcon size={14} />
              </span>
              {isAr ? 'الفعالية الحالية:' : 'Active Event:'}
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

          {/* Action Buttons */}
          <div className="admin-header-buttons">
            {(activeRole === 'super_admin' || activeRole === 'organizer') && (
              <button
                type="button"
                className="admin-btn btn-primary btn-create-event"
                onClick={onCreateEventClick}
                data-testid="btn-create-event"
              >
                <span className="btn-icon">
                  <PlusIcon size={16} />
                </span>
                <span>{isAr ? 'إنشاء فعالية جديدة' : 'Create Event'}</span>
              </button>
            )}

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
              <span className={`btn-icon ${isFlushing ? 'spin' : ''}`}>
                <ZapIcon size={16} />
              </span>
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

            {onNavigateToHome && (
              <button
                type="button"
                className="admin-btn btn-secondary btn-home"
                onClick={onNavigateToHome}
                data-testid="btn-back-home"
              >
                <span className="btn-icon">
                  <HomeIcon size={16} />
                </span>
                <span>{isAr ? 'الرئيسية' : 'Home'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default AdminHeader;
