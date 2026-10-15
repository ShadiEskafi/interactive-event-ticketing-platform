import { useState, useMemo } from 'react';
import { useLanguage } from '../../context';
import { useAuth, getUserRole } from '../auth';
import { useAdminData } from './hooks/useAdminData';
import { DashboardLayout } from './components/DashboardLayout';
import { WorkspaceControls } from './components/WorkspaceControls';
import { WorkspaceTabs } from './components/WorkspaceTabs';
import { DashboardFooter } from './components/DashboardFooter';
import { SuperAdminOverview } from './components/SuperAdminOverview';
import { OrganizerOverview } from './components/OrganizerOverview';
import { EventsManagementTab } from './components/EventsManagementTab';
import { AttendeeRosterTab } from './components/AttendeeRosterTab';
import { UsersManagementTab } from './components/UsersManagementTab';
import { SystemHealthTab } from './components/SystemHealthTab';
import { AdminAuditLogTab } from './components/AdminAuditLogTab';
import { CreateEditEventModal } from './components/CreateEditEventModal';
import { EventDetailsModal } from './components/EventDetailsModal';
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  XIcon,
  TicketIcon,
} from '../../components/common/Icons';
import './AdminDashboard.css';

/**
 * AdminDashboardPage Component - Complete Figma Mihwar Rebuild (1:1 Pixel-Perfect)
 * Lead Orchestration Shell:
 * - Phase 1 Foundation: DashboardLayout with clean Flexbox & CSS Grid slot architecture
 * - Phase 2 Sub-Agents: DashboardNavbar, WorkspaceControls, WorkspaceTabs, DashboardFooter,
 *   KpiMetricsGrid, StatusBadges, InventoryAnalyticsCard, EventPerformanceChart,
 *   EventPerformanceTable, RecentActivityFeed
 * - Phase 3 Integration: Full state synchronization, modal control, and cross-tab compatibility
 */
export function AdminDashboardPage({
  _onNavigateToHome,
  onNavigateToScanner,
  initialRole = 'super_admin',
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const { user } = useAuth();
  const authUserRole = user ? getUserRole(user) : null;
  const isRoleLocked = Boolean(authUserRole && authUserRole !== 'super_admin');

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
    auditLogs = [],
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
    handleResetCleanState,
  } = useAdminData({ initialRole });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [eventToEdit, setEventToEdit] = useState(null);
  const [eventDetailsModalOpen, setEventDetailsModalOpen] = useState(false);
  const [eventForDetails, setEventForDetails] = useState(null);

  const selectedEvent = useMemo(() => {
    return events.find((e) => e.id === selectedEventId) || events[0] || null;
  }, [events, selectedEventId]);

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

  const handleModalSubmit = async (eventFormData) => {
    if (eventToEdit?.id) {
      await handleUpdateEvent(eventToEdit.id, eventFormData);
    } else {
      handleCreateEvent(eventFormData);
    }
    handleCloseModal();
  };

  // Active Tab Normalization
  const currentTab = activeTab || 'overview';

  return (
    <div
      className="admin-dashboard-page tc-dashboard-shell"
      data-testid="admin-dashboard-page"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Toast Notification Alert */}
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

      {/* Structural Layout Shell - navbar is null to avoid duplicate navbar since App.jsx renders MainNavbar globally */}
      <DashboardLayout
        dir={isAr ? 'rtl' : 'ltr'}
        navbar={null}
        controls={
          <WorkspaceControls
            activeRole={activeRole}
            onSelectRole={setRole}
            onResetCleanState={handleResetCleanState}
            onCreateEvent={handleOpenCreateModal}
            language={language}
            canSwitchRole={!isRoleLocked}
          />
        }
        tabs={
          <WorkspaceTabs
            activeTab={currentTab}
            onSelectTab={setActiveTab}
            language={language}
            activeRole={activeRole}
          />
        }
        footer={<DashboardFooter language={language} />}
      >
        {/* Gate Staff Notice */}
        {activeRole === 'gate_staff' && (
          <div
            className="tc-notice-box"
            style={{
              backgroundColor: 'var(--tc-surface-dark, #101813)',
              borderRadius: 'var(--tc-radius-lg, 16px)',
              padding: '24px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
            }}
          >
            <TicketIcon size={32} style={{ color: 'var(--tc-accent-lime, #d2fa69)' }} />
            <div>
              <h3 style={{ margin: '0 0 6px 0', color: 'var(--tc-text-primary-dark, #f4f3eb)' }}>
                {isAr ? 'وضع طاقم البوابات (Gate Staff)' : 'Gate Staff Operator Mode'}
              </h3>
              <p style={{ margin: 0, color: 'var(--tc-text-muted-dark, #a5b2a8)', fontSize: '13px' }}>
                {isAr
                  ? 'أنت تتصفح المنصة بصلاحيات طاقم البوابة. يمكنك مراجعة كشف الحضور فورياً أو تشغيل ماسح الكاميرا للتحقق من التذاكر.'
                  : 'You are viewing as gate staff. You have access to attendee check-in rosters and turnstile QR validation.'}
              </p>
            </div>
          </div>
        )}

        {/* Tab 1: Platform Overview */}
        {(currentTab === 'overview' || currentTab === 'my_events') && (
          <>
            {activeRole === 'organizer' ? (
              <OrganizerOverview
                organizerStats={organizerStats}
                selectedEvent={selectedEvent}
                events={events}
                selectedEventId={selectedEventId}
                onSelectEvent={setSelectedEventId}
                onCreateEvent={handleOpenCreateModal}
                onCreateEventClick={handleOpenCreateModal}
                onOpenCreateModal={handleOpenCreateModal}
                onViewDetails={handleOpenDetailsModal}
                onLaunchScanner={(eventId) => onNavigateToScanner?.(eventId || selectedEventId)}
              />
            ) : (
              <SuperAdminOverview
                platformStats={platformStats}
                concurrencyStats={concurrencyStats}
                events={events}
                auditLogs={auditLogs}
                onFlushHolds={() => handleFlushHolds(selectedEventId)}
                isFlushing={isFlushing}
                onSelectEvent={setSelectedEventId}
                onViewDetails={handleOpenDetailsModal}
              />
            )}
          </>
        )}

        {/* Tab 2: Events Management / Governance */}
        {currentTab === 'events' && (
          <EventsManagementTab
            events={events}
            onCreateEventClick={handleOpenCreateModal}
            onOpenCreateModal={handleOpenCreateModal}
            onEditEvent={handleOpenEditModal}
            onOpenEditModal={handleOpenEditModal}
            onDeleteEvent={handleDeleteEvent}
            onToggleFeatured={handleToggleFeatured}
            onViewDetails={handleOpenDetailsModal}
          />
        )}

        {/* Tab 3: Attendee Registry / Roster */}
        {currentTab === 'attendees' && (
          <AttendeeRosterTab
            attendees={attendees}
            events={events}
            selectedEventId={selectedEventId}
            onSelectEvent={setSelectedEventId}
            onExportCSV={() => handleExportCSV(selectedEventId)}
          />
        )}

        {/* Tab 4: Users & Roles Governance */}
        {(currentTab === 'users' || currentTab === 'staff') && (
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

        {/* Tab 5: System & Concurrency Health */}
        {(currentTab === 'concurrency' || currentTab === 'system_health') && (
          <SystemHealthTab
            concurrencyStats={concurrencyStats}
            onFlushHolds={() => handleFlushHolds(selectedEventId)}
            isFlushing={isFlushing}
          />
        )}

        {/* Tab 6: Immutable Audit Logs */}
        {currentTab === 'audit_logs' && (
          <AdminAuditLogTab
            logs={auditLogs}
            onRefresh={() => handleFlushHolds(selectedEventId)}
          />
        )}
      </DashboardLayout>

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
