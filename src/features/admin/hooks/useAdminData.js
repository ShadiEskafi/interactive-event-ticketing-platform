import { useState, useCallback, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { supabase } from '../../../services/supabaseClient';

/**
 * useAdminData Hook
 * Centralizes state and actions for the Admin & Organizer Dashboard.
 * Supports dual-role toggling (super_admin / organizer / gate_staff / attendee),
 * event drilldowns, attendee rostering, user roles governance, and concurrency health.
 */
export function useAdminData({
  initialRole = 'super_admin',
  initialEventId = 'evt-symphony-2026',
} = {}) {
  const [activeRole, setActiveRole] = useState(initialRole);
  const [activeTab, setActiveTab] = useState(
    initialRole === 'organizer' ? 'my_events' : 'overview'
  );
  const [selectedEventId, setSelectedEventIdState] = useState(initialEventId);

  const [platformStats, setPlatformStats] = useState(() => adminService.getPlatformStats());
  const [organizerStats, setOrganizerStats] = useState(() =>
    adminService.getOrganizerStats(null, initialEventId)
  );
  const [events, setEvents] = useState(() => adminService.getAllEvents());
  const [attendees, setAttendees] = useState(() =>
    adminService.getEventAttendees(initialEventId)
  );
  const [users, setUsers] = useState(() => adminService.getUsers());
  const [auditLogs, setAuditLogs] = useState(() => adminService.getAuditLogs());
  const [concurrencyStats, setConcurrencyStats] = useState(() =>
    adminService.getConcurrencyStats(initialEventId)
  );
  const [isFlushing, setIsFlushing] = useState(false);
  const [notification, setNotification] = useState(null);

  // Synchronize data when an event or action updates
  const refreshData = useCallback(
    (targetEventId = selectedEventId) => {
      try {
        const allEvents = adminService.getAllEvents();
        setEvents(allEvents);

        let currentEventId = targetEventId;
        if (!allEvents.some((e) => e.id === currentEventId) && allEvents.length > 0) {
          currentEventId = allEvents[0].id;
          setSelectedEventIdState(currentEventId);
        }

        setPlatformStats(adminService.getPlatformStats());
        setOrganizerStats(adminService.getOrganizerStats(null, currentEventId));
        setAttendees(adminService.getEventAttendees(currentEventId));
        setUsers(adminService.getUsers());
        setAuditLogs(adminService.getAuditLogs());
        setConcurrencyStats(adminService.getConcurrencyStats(currentEventId));

        // Background asynchronous sync with Supabase events
        if (typeof adminService.fetchEventsFromSupabase === 'function') {
          adminService
            .fetchEventsFromSupabase()
            .then((syncedEvents) => {
              if (Array.isArray(syncedEvents)) {
                setEvents(syncedEvents);
                setPlatformStats(adminService.getPlatformStats());
              }
            })
            .catch(() => {});
        }

        // Background asynchronous sync with Supabase profiles
        if (typeof adminService.fetchUsersFromSupabase === 'function') {
          adminService
            .fetchUsersFromSupabase()
            .then((synced) => {
              if (Array.isArray(synced) && synced.length > 0) {
                setUsers(synced);
              }
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error('[useAdminData] refreshData failed:', err);
      }
    },
    [selectedEventId]
  );

  // On mount, load events and users from Supabase
  useEffect(() => {
    let isMounted = true;

    if (typeof adminService.fetchEventsFromSupabase === 'function') {
      adminService
        .fetchEventsFromSupabase()
        .then((syncedEvents) => {
          if (isMounted && Array.isArray(syncedEvents)) {
            setEvents(syncedEvents);
            setPlatformStats(adminService.getPlatformStats());
          }
        })
        .catch(() => {});
    }

    if (typeof adminService.fetchUsersFromSupabase === 'function') {
      adminService
        .fetchUsersFromSupabase()
        .then((synced) => {
          if (isMounted && Array.isArray(synced) && synced.length > 0) {
            setUsers(synced);
          }
        })
        .catch(() => {});
    }

    return () => {
      isMounted = false;
    };
  }, []);

  // Multi-tab sync & Supabase Realtime channel for live updates
  useEffect(() => {
    let channel = null;

    if (typeof supabase !== 'undefined' && supabase && typeof supabase.channel === 'function') {
      try {
        channel = supabase
          .channel('public:events:dashboard')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'events' },
            () => {
              refreshData();
            }
          )
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles' },
            () => {
              refreshData();
            }
          )
          .subscribe();
      } catch {
        // Safe Realtime subscription fallback
      }
    }

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        refreshData();
      }
    };

    const handleStorage = (e) => {
      if (
        e.key &&
        (e.key.includes('event') || e.key.includes('user') || e.key.includes('ticketcraft'))
      ) {
        refreshData();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      if (channel && typeof supabase !== 'undefined' && typeof supabase.removeChannel === 'function') {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Safe cleanup
        }
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, [refreshData]);

  const setSelectedEventId = useCallback(
    (eventId) => {
      setSelectedEventIdState(eventId);
      setOrganizerStats(adminService.getOrganizerStats(null, eventId));
      setAttendees(adminService.getEventAttendees(eventId));
      setConcurrencyStats(adminService.getConcurrencyStats(eventId));
    },
    []
  );

  // Adjust activeTab when role changes if tab is incompatible
  const setRole = useCallback((newRole) => {
    setActiveRole(newRole);
    if (newRole === 'organizer') {
      setActiveTab((prev) => (prev === 'users' || prev === 'system_health' ? 'my_events' : prev));
    } else if (newRole === 'super_admin') {
      setActiveTab((prev) => (prev === 'my_events' ? 'overview' : prev));
    }
  }, []);

  // Event handlers
  const handleCreateEvent = useCallback(
    (eventData) => {
      const created = adminService.createEvent(eventData);
      const newId = created?.id || selectedEventId;
      if (created?.id) {
        setSelectedEventIdState(created.id);
      }
      setNotification({
        type: 'success',
        message: 'Event created successfully / تم إنشاء الفعالية بنجاح',
      });
      refreshData(newId);
      return created;
    },
    [refreshData, selectedEventId]
  );

  const handleUpdateEvent = useCallback(
    async (eventId, eventData) => {
      const updated = adminService.updateEvent(eventId, eventData);
      if (updated) {
        setEvents((prev) =>
          prev.map((e) => (e.id === eventId ? { ...e, ...updated } : e))
        );
        if (typeof adminService._syncEventToSupabase === 'function') {
          await adminService._syncEventToSupabase(eventId, updated);
        }
        refreshData(eventId);
        setNotification({
          type: 'success',
          message: 'Event updated successfully / تم تحديث الفعالية بنجاح',
        });
      }
      return updated;
    },
    [refreshData]
  );

  const handleDeleteEvent = useCallback(
    (eventId) => {
      const res = adminService.deleteEvent(eventId);
      refreshData();
      setNotification({
        type: 'info',
        message: 'Event deleted / تم حذف الفعالية',
      });
      return res;
    },
    [refreshData]
  );

  const handleToggleFeatured = useCallback(
    (eventId) => {
      const updated = adminService.toggleEventFeatured(eventId);
      refreshData(eventId);
      setNotification({
        type: 'success',
        message: 'Featured event updated / تم تحديث الفعالية المميزة',
      });
      return updated;
    },
    [refreshData]
  );

  const handleExportCSV = useCallback(
    (eventId) => {
      const targetId = eventId || selectedEventId;
      const csv = adminService.exportAttendeesCSV(targetId);
      setNotification({
        type: 'success',
        message: 'Attendees CSV exported / تم تصدير كشف الحضور بنجاح',
      });
      return csv;
    },
    [selectedEventId]
  );

  const handleFlushHolds = useCallback(
    async (eventId) => {
      setIsFlushing(true);
      try {
        const count = await adminService.flushExpiredSeatHolds(eventId || selectedEventId);
        const releasedCount =
          typeof count === 'object' && count !== null
            ? (count.released_count ?? 0)
            : (Number(count) || 0);

        refreshData(eventId || selectedEventId);
        setNotification({
          type: 'success',
          message: `Holds flushed successfully (${releasedCount} seats released) / تم تحرير ${releasedCount} مقعداً معلقاً بنجاح`,
        });
        return count;
      } catch (err) {
        setNotification({
          type: 'error',
          message: 'Failed to flush holds / فشل تحرير المقاعد المعلقة',
        });
        throw err;
      } finally {
        setIsFlushing(false);
      }
    },
    [refreshData, selectedEventId]
  );

  const handleUpdateUserRole = useCallback(
    (userId, newRole) => {
      const updated = adminService.updateUserRole(userId, newRole);
      refreshData();
      setNotification({
        type: 'success',
        message: 'User role updated / تم تحديث صلاحية المستخدم بنجاح',
      });
      return updated;
    },
    [refreshData]
  );

  const handleCreateGateStaffUser = useCallback(
    (staffData) => {
      const created = adminService.createGateStaffUser(staffData);
      setUsers(adminService.getUsers());
      refreshData();
      setNotification({
        type: 'success',
        message: 'Gate staff account created / تم إنشاء حساب موظف البوابة بنجاح',
      });
      return created;
    },
    [refreshData]
  );

  const handleCreateUser = useCallback(
    (userData) => {
      const created = adminService.createUser(userData);
      setUsers(adminService.getUsers());
      refreshData();
      setNotification({
        type: 'success',
        message: 'User created successfully / تم إنشاء المستخدم بنجاح',
      });
      return created;
    },
    [refreshData]
  );

  const handleToggleUserStatus = useCallback(
    (userId) => {
      const updated = adminService.toggleUserStatus(userId);
      refreshData();
      setNotification({
        type: 'success',
        message: 'User status updated / تم تحديث حالة المستخدم بنجاح',
      });
      return updated;
    },
    [refreshData]
  );

  const handleResetCleanState = useCallback(() => {
    const res = adminService.resetToCleanState();
    refreshData();
    setNotification({
      type: 'info',
      message: 'System reset to clean state / تم تصفير النظام وإعادته للحالة النظيفة',
    });
    return res;
  }, [refreshData]);

  const handleRefreshAuditLogs = useCallback(() => {
    setAuditLogs(adminService.getAuditLogs());
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  return {
    activeRole,
    setRole,
    setActiveRole: setRole,
    activeTab,
    setActiveTab,
    selectedEventId,
    setSelectedEventId,
    platformStats,
    organizerStats,
    events,
    attendees,
    users,
    auditLogs,
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
    handleToggleUserStatus,
    handleResetCleanState,
    handleRefreshAuditLogs,
    refreshData,
  };
}
