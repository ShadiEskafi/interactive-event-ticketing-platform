import { useState } from 'react';
import { useLanguage } from '../../context';
import { useAdminData } from './hooks/useAdminData';
import { AdminHeader } from './components/AdminHeader';
import { SuperAdminOverview } from './components/SuperAdminOverview';
import { OrganizerOverview } from './components/OrganizerOverview';
import { EventsManagementTab } from './components/EventsManagementTab';
import { CreateEditEventModal } from './components/CreateEditEventModal';
import { EventDetailsModal } from './components/EventDetailsModal';
import { AttendeeRosterTab } from './components/AttendeeRosterTab';
import { UsersManagementTab } from './components/UsersManagementTab';
import { SystemHealthTab } from './components/SystemHealthTab';
import {
  BarChart3Icon,
  CalendarIcon,
  UsersIcon,
  ShieldIcon,
  ZapIcon,
  TentIcon,
  UserIcon,
  TicketIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
  QrCodeIcon,
  HomeIcon,
} from '../../components/common/Icons';
import './AdminDashboard.css';

/**
 * AdminDashboardPage Component
 * Centralized Super Admin & Event Organizer Control Panel.
 * Supports multi-tab operations,
 * event CRUD with standard 520-seat interactive venue enforcement,
 * attendee rosters with UTF-8 BOM CSV export, and concurrency health monitoring.
 * Pure SVG icons and zero emoji dependency.
 */
export function AdminDashboardPage({
  onNavigateToHome,
  onNavigateToScanner,
  initialRole = 'super_admin',
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const {
    activeRole,
    setRole,
    activeTab,
    setActiveTab,
    selectedEventId,
    setSelectedEventId,
    platformStats,
    organizerStats,
    events,
    attendees,
    users,
    concurrencyStats,
    isFlushing,
    notification,
    clearNotification,
    handleCreateEvent,
    handleUpdateEvent,
    handleDeleteEvent,
    handleToggleFeatured,
    handleExportCSV,
    handleFlushHolds,
    handleUpdateUserRole,
    handleCreateGateStaffUser,
    handleCreateUser,
  } = useAdminData({ initialRole });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
  const [eventForDetails, setEventForDetails] = useState(null);

  const selectedEvent =
    events.find((e) => e.id === selectedEventId) || events[0] || null;

  const handleOpenCreateModal = () => {
    setEventToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (event) => {
    setEventToEdit(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEventToEdit(null);
  };

  const handleOpenDetailsModal = (event) => {
    setEventForDetails(event);
    setEventDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setEventDetailsModalOpen(false);
    setEventForDetails(null);
  };

  const handleModalSubmit = (eventFormData) => {
    if (eventToEdit?.id) {
      handleUpdateEvent(eventToEdit.id, eventFormData);
    } else {
      handleCreateEvent(eventFormData);
    }
    handleCloseModal();
  };

  // Tab definitions with pure SVG icons and zero emojis
  const getTabs = () => {
    if (activeRole === 'organizer') {
      return [
        { id: 'my_events', labelEn: 'Organizer Workspace', labelAr: 'مساحة عمل المنظم', Icon: TentIcon },
        { id: 'events', labelEn: 'Events Management', labelAr: 'إدارة الفعاليات', Icon: CalendarIcon },
        { id: 'attendees', labelEn: 'Attendee Roster', labelAr: 'كشف الحضور', Icon: UsersIcon },
        { id: 'staff', labelEn: 'Gate Staff', labelAr: 'طاقم البوابات', Icon: ShieldIcon },
      ];
    }
    if (activeRole === 'gate_staff') {
      return [
        { id: 'attendees', labelEn: 'Gate Attendee Roster', labelAr: 'كشف حضور البوابة', Icon: UsersIcon },
        { id: 'system_health', labelEn: 'Concurrency Status', labelAr: 'حالة التزامن', Icon: ZapIcon },
      ];
    }
    if (activeRole === 'attendee') {
      return [
        { id: 'attendee_info', labelEn: 'Attendee Workspace', labelAr: 'مساحة الزائر', Icon: UserIcon },
      ];
    }

    // Default: super_admin
    return [
      { id: 'overview', labelEn: 'Platform Overview', labelAr: 'نظرة عامة على المنصة', Icon: BarChart3Icon },
      { id: 'events', labelEn: 'Events Governance', labelAr: 'حوكمة الفعاليات', Icon: CalendarIcon },
      { id: 'attendees', labelEn: 'Attendee Registry', labelAr: 'سجل الحضور والتذاكر', Icon: UsersIcon },
      { id: 'users', labelEn: 'Users & Roles', labelAr: 'المستخدمين والصلاحيات', Icon: ShieldIcon },
      { id: 'system_health', labelEn: 'System & Concurrency', labelAr: 'صحة النظام والتزامن', Icon: ZapIcon },
    ];
  };

  const tabs = getTabs();

  // If activeTab is not in current available tabs, switch to first tab
  const currentTabExists = tabs.some((t) => t.id === activeTab);
  const currentTab = currentTabExists ? activeTab : tabs[0].id;

  return (
    <div className="admin-dashboard-page" data-testid="admin-dashboard-page">
      {/* Toast Notification Banner with Pure SVG Icons */}
      {notification && (
        <div
          className={`admin-notification-toast toast-${notification.type}`}
          role="status"
          data-testid="admin-toast"
        >
          <span className="toast-icon">
            {notification.type === 'error' ? (
              <AlertTriangleIcon size={18} />
            ) : (
              <CheckCircleIcon size={18} />
            )}
          </span>
          <span className="toast-text">{notification.message}</span>
          <button
            type="button"
            className="toast-close"
            onClick={clearNotification}
            aria-label="Dismiss notification"
          >
            <XIcon size={14} />
          </button>
        </div>
      )}

      {/* Top Header */}
      <AdminHeader
        activeRole={activeRole}
        onRoleChange={setRole}
        events={events}
        selectedEventId={selectedEventId}
        onSelectEvent={setSelectedEventId}
        onCreateEventClick={handleOpenCreateModal}
        onFlushHolds={() => handleFlushHolds(selectedEventId)}
        isFlushing={isFlushing}
        onNavigateToHome={onNavigateToHome}
      />

      {/* Main Tab Navigation */}
      <nav
        className="admin-tabs-nav"
        role="tablist"
        aria-label={isAr ? 'أقسام لوحة التحكم' : 'Admin navigation tabs'}
      >
        <div className="admin-tabs-list">
          {tabs.map((tab) => {
            const TabIcon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={currentTab === tab.id}
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                className={`admin-tab-btn ${currentTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                data-testid={`tab-${tab.id}`}
              >
                <TabIcon size={16} className="tab-svg-icon" />
                <span>{isAr ? tab.labelAr : tab.labelEn}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Active Tab Content Panel */}
      <main
        className="admin-tab-content-container"
        id={`tabpanel-${currentTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${currentTab}`}
      >
        {/* Gate Staff Simulator Notice */}
        {activeRole === 'gate_staff' && (
          <div className="role-simulator-notice-card card-staff">
            <div className="notice-icon">
              <TicketIcon size={32} />
            </div>
            <div className="notice-content">
              <h3>{isAr ? 'وضع طاقم البوابات (Gate Staff)' : 'Gate Staff Operator Mode'}</h3>
              <p>
                {isAr
                  ? 'أنت تتصفح المنصة بصلاحيات طاقم البوابة. يمكنك مراجعة كشف الحضور فورياً أو تشغيل ماسح الكاميرا للتحقق من التذاكر.'
                  : 'You are viewing as gate staff. You have access to attendee check-in rosters and turnstile QR validation.'}
              </p>
            </div>
            <button
              type="button"
              className="admin-btn btn-primary"
              onClick={() => onNavigateToScanner?.(selectedEvent?.id)}
            >
              <QrCodeIcon size={16} />
              <span>{isAr ? 'فتح ماسح البوابات' : 'Launch Gate Scanner'}</span>
            </button>
          </div>
        )}

        {/* Attendee Simulator Notice */}
        {activeRole === 'attendee' && (
          <div className="role-simulator-notice-card card-attendee">
            <div className="notice-icon">
              <UserIcon size={32} />
            </div>
            <div className="notice-content">
              <h3>{isAr ? 'وضع استعراض الزائر (Attendee Mode)' : 'Standard Attendee Mode'}</h3>
              <p>
                {isAr
                  ? 'أنت تشاهد لوحة التحكم بحساب زائر. يمكنك العودة للصفحة الرئيسية واستعراض الفعاليات وحجز المقاعد التفاعلية.'
                  : 'You are previewing in attendee mode. Explore events and interact with the 520-seat venue.'}
              </p>
            </div>
            {onNavigateToHome && (
              <button
                type="button"
                className="admin-btn btn-secondary"
                onClick={onNavigateToHome}
              >
                <HomeIcon size={16} />
                <span>{isAr ? 'العودة للصفحة الرئيسية وحجز التذاكر' : 'Go to Home & Select Seats'}</span>
              </button>
            )}
          </div>
        )}

        {/* Tab 1: Super Admin Overview */}
        {currentTab === 'overview' && activeRole === 'super_admin' && (
          <SuperAdminOverview
            platformStats={platformStats}
            concurrencyStats={concurrencyStats}
            events={events}
            onFlushHolds={() => handleFlushHolds(selectedEventId)}
            isFlushing={isFlushing}
            onSelectEvent={setSelectedEventId}
            onViewDetails={handleOpenDetailsModal}
          />
        )}

        {/* Tab 2: Organizer Workspace Overview */}
        {currentTab === 'my_events' && (
          <OrganizerOverview
            organizerStats={organizerStats}
            selectedEvent={selectedEvent}
            attendees={attendees}
            onNavigateToScanner={onNavigateToScanner}
            onCreateEventClick={handleOpenCreateModal}
            onViewDetails={handleOpenDetailsModal}
          />
        )}

        {/* Tab 3: Events Management */}
        {currentTab === 'events' && (
          <EventsManagementTab
            events={events}
            onEditEvent={handleOpenEditModal}
            onDeleteEvent={handleDeleteEvent}
            onToggleFeatured={handleToggleFeatured}
            onCreateEventClick={handleOpenCreateModal}
            onViewDetails={handleOpenDetailsModal}
          />
        )}

        {/* Tab 4: Attendee Roster */}
        {currentTab === 'attendees' && (
          <AttendeeRosterTab
            attendees={attendees}
            selectedEventId={selectedEventId}
            onExportCSV={handleExportCSV}
          />
        )}

        {/* Tab 5: Users & Roles (Super Admin) or Gate Staff (Organizer) */}
        {((currentTab === 'users' && activeRole === 'super_admin') ||
          (currentTab === 'staff' && activeRole === 'organizer')) && (
          <UsersManagementTab
            users={activeRole === 'organizer' ? users.filter((u) => u.role === 'gate_staff') : users}
            events={events}
            activeRole={activeRole}
            selectedEventId={selectedEventId}
            onUpdateUserRole={handleUpdateUserRole}
            onCreateUser={handleCreateUser}
            onCreateGateStaff={handleCreateGateStaffUser}
          />
        )}

        {/* Tab 6: System & Concurrency Health */}
        {currentTab === 'system_health' && (
          <SystemHealthTab
            concurrencyStats={concurrencyStats}
            onFlushHolds={() => handleFlushHolds(selectedEventId)}
            isFlushing={isFlushing}
          />
        )}
      </main>

      {/* Create / Edit Event Modal */}
      <CreateEditEventModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        eventToEdit={eventToEdit}
        onSubmit={handleModalSubmit}
      />

      {/* Event Details Drilldown Modal */}
      <EventDetailsModal
        isOpen={eventDetailsModalOpen}
        onClose={handleCloseDetailsModal}
        event={eventForDetails}
        attendees={eventForDetails?.id === selectedEventId ? attendees : undefined}
        onEditEvent={(evt) => {
          handleCloseDetailsModal();
          handleOpenEditModal(evt);
        }}
      />
    </div>
  );
}

export default AdminDashboardPage;
