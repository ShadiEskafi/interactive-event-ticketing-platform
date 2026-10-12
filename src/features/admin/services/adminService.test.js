import { describe, it, expect, beforeEach } from 'vitest';
import {
  adminService,
  STANDARD_VENUE_CAPACITY,
  STANDARD_VENUE_ID,
  CUSTOM_EVENTS_STORAGE_KEY,
  PLATFORM_USERS_STORAGE_KEY,
  AUDIT_LOGS_STORAGE_KEY,
  INITIAL_SUPER_ADMIN,
} from './adminService';
import { mockTicketingService } from '../../seatmap/services/mockTicketingService';

describe('AdminService', () => {
  beforeEach(() => {
    adminService.resetState();
    mockTicketingService.resetState();
  });

  it('exposes standard storage keys, audit logs key, and capacity limits', () => {
    expect(CUSTOM_EVENTS_STORAGE_KEY).toBe('ticketcraft_custom_events');
    expect(PLATFORM_USERS_STORAGE_KEY).toBe('ticketcraft_platform_users');
    expect(AUDIT_LOGS_STORAGE_KEY).toBe('ticketcraft_audit_logs');
    expect(STANDARD_VENUE_CAPACITY).toBe(520);
    expect(STANDARD_VENUE_ID).toBe('00000000-0000-0000-0000-000000000001');
  });

  describe('Clean Baseline & Super Admin Initialization', () => {
    it('initial users list contains exclusively the hardcoded Super Admin Shadi Askafi', () => {
      const users = adminService.getUsers();
      expect(Array.isArray(users)).toBe(true);
      expect(users.length).toBe(1);

      const superAdmin = users[0];
      expect(superAdmin.id).toBe('usr-super-admin');
      expect(superAdmin.name).toBe('Shadi Askafi');
      expect(superAdmin.name_ar).toBe('شادي الإسكافي');
      expect(superAdmin.email).toBe('shadieskafi@gmail.com');
      expect(superAdmin.role).toBe('super_admin');
      expect(superAdmin.status).toBe('active');
      expect(superAdmin.avatar).toBe('SA');
    });

    it('resetToCleanState purges custom data and restores only default Super Admin', () => {
      // 1. Create a custom event and gate staff user
      adminService.createEvent({ title: 'Temporary Concert' });
      adminService.createGateStaffUser({
        name: 'Gate Guard',
        email: 'guard@ticketcraft.io',
      });

      expect(adminService.getAllEvents().length).toBeGreaterThan(0);
      expect(adminService.getUsers().length).toBe(2);

      // 2. Perform clean state reset
      const resetResult = adminService.resetToCleanState();
      expect(resetResult.success).toBe(true);
      expect(resetResult.log).toBeDefined();
      expect(resetResult.log.action).toBe('CLEAN_STATE_RESET');

      // 3. Verify clean baseline
      const reloadedUsers = adminService.getUsers();
      expect(reloadedUsers.length).toBe(1);
      expect(reloadedUsers[0].email).toBe(INITIAL_SUPER_ADMIN.email);

      const auditLogs = adminService.getAuditLogs();
      expect(auditLogs.length).toBe(1);
      expect(auditLogs[0].action).toBe('CLEAN_STATE_RESET');
    });
  });

  describe('Events Management & 520 Seat Enforcement', () => {
    it('getAllEvents returns base featured events when no custom events exist', () => {
      const events = adminService.getAllEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('id');
      expect(events[0]).toHaveProperty('title');
      expect(events[0]).toHaveProperty('title_ar');
    });

    it('getEventById retrieves matching event', () => {
      const event = adminService.getEventById('evt-symphony-2026');
      expect(event).not.toBeNull();
      expect(event.id).toBe('evt-symphony-2026');
      expect(event.venueId).toBe(STANDARD_VENUE_ID);
    });

    it('createEvent binds to standard venue and 520 capacity with dynamic price range and logs audit', () => {
      const newEvent = adminService.createEvent({
        title: 'Future Tech Summit',
        title_ar: 'قمة تكنولوجيا المستقبل',
        category: 'Festivals',
        category_ar: 'مهرجانات',
        date: 'Sunday, Dec 20, 2026',
        date_ar: 'الأحد، ٢٠ ديسمبر ٢٠٢٦',
        venue: 'Acoustic Arena',
        venue_ar: 'الساحة الصوتية',
        description: 'Tech gathering',
        description_ar: 'تجمع تقني',
        vipPrice: 200,
        regularPrice: 100,
        balconyPrice: 50,
        status: 'published',
        organizerId: 'usr-super-admin',
      });

      expect(newEvent.id).toMatch(/^evt-custom-/);
      expect(newEvent.venueId).toBe(STANDARD_VENUE_ID);
      expect(newEvent.capacity).toBe('520 Seats');
      expect(newEvent.capacity_ar).toBe('٥٢٠ مقعداً');
      expect(newEvent.priceRange).toBe('$50 – $200');
      expect(newEvent.priceRange_ar).toBe('50$ – 200$');
      expect(newEvent.tierPricing.vip).toBe(200);

      // Verify it appears in getAllEvents
      const allEvents = adminService.getAllEvents();
      const found = allEvents.find((e) => e.id === newEvent.id);
      expect(found).toBeDefined();
      expect(found.title).toBe('Future Tech Summit');

      // Verify audit log
      const logs = adminService.getAuditLogs();
      const eventCreatedLog = logs.find((l) => l.action === 'EVENT_CREATED' && l.target === newEvent.id);
      expect(eventCreatedLog).toBeDefined();
    });

    it('updateEvent updates custom event details and recalculated prices', () => {
      const created = adminService.createEvent({
        title: 'Initial Event',
        vipPrice: 100,
        regularPrice: 50,
        balconyPrice: 25,
      });

      const updated = adminService.updateEvent(created.id, {
        title: 'Updated Event Title',
        vipPrice: 300,
        regularPrice: 150,
        balconyPrice: 75,
      });

      expect(updated.title).toBe('Updated Event Title');
      expect(updated.vipPrice).toBe(300);
      expect(updated.priceRange).toBe('$75 – $300');

      const reloaded = adminService.getEventById(created.id);
      expect(reloaded.title).toBe('Updated Event Title');

      const logs = adminService.getAuditLogs();
      expect(logs.some((l) => l.action === 'EVENT_UPDATED' && l.target === created.id)).toBe(true);
    });

    it('deleteEvent removes custom event and logs audit', () => {
      const created = adminService.createEvent({
        title: 'Event to Delete',
      });

      expect(adminService.getEventById(created.id)).toBeDefined();

      const result = adminService.deleteEvent(created.id);
      expect(result.success).toBe(true);
      expect(adminService.getEventById(created.id)).toBeNull();

      const logs = adminService.getAuditLogs();
      expect(logs.some((l) => l.action === 'EVENT_DELETED' && l.target === created.id)).toBe(true);
    });

    it('toggleEventFeatured sets isPrimary: true for the chosen event only', () => {
      const created = adminService.createEvent({
        title: 'Custom Featured',
      });

      adminService.toggleEventFeatured(created.id);

      const all = adminService.getAllEvents();
      const primaryEvents = all.filter((e) => e.isPrimary);
      expect(primaryEvents.length).toBe(1);
      expect(primaryEvents[0].id).toBe(created.id);
    });
  });

  describe('Admin Audit Log Tracking', () => {
    it('records and retrieves audit logs in descending timestamp order', () => {
      const log1 = adminService.recordAuditLog({
        action: 'ROLE_UPDATE',
        actorEmail: 'shadieskafi@gmail.com',
        target: 'usr-test-1',
        details: { oldRole: 'attendee', newRole: 'organizer' },
      });

      const log2 = adminService.recordAuditLog({
        action: 'HOLDS_FLUSHED',
        actorEmail: 'shadieskafi@gmail.com',
        target: 'all_events',
        details: { releasedCount: 5 },
      });

      const allLogs = adminService.getAuditLogs();
      expect(allLogs.length).toBeGreaterThanOrEqual(2);
      expect(allLogs[0].id).toBe(log2.id); // newest first
      expect(allLogs[1].id).toBe(log1.id);
    });

    it('supports all required action types', () => {
      const actions = [
        'ROLE_UPDATE',
        'GATE_STAFF_CREATED',
        'EVENT_CREATED',
        'EVENT_UPDATED',
        'EVENT_DELETED',
        'HOLDS_FLUSHED',
        'CLEAN_STATE_RESET',
        'USER_STATUS_TOGGLED',
      ];

      actions.forEach((act) => {
        const entry = adminService.recordAuditLog({
          action: act,
          actorEmail: 'shadieskafi@gmail.com',
          target: 'test-target',
          details: { sample: true },
        });
        expect(entry.action).toBe(act);
      });

      const savedLogs = adminService.getAuditLogs();
      const actionTypes = savedLogs.map((l) => l.action);
      actions.forEach((act) => {
        expect(actionTypes).toContain(act);
      });
    });
  });

  describe('Gate Staff Creation & Provisioning', () => {
    it('creates gate staff user with assigned event scoping and records audit log', () => {
      const staffUser = adminService.createGateStaffUser({
        name: 'Kareem Gate',
        name_ar: 'كريم البوابة',
        email: 'kareem.gate@ticketcraft.io',
        password: 'SecretPassword123!',
        assignedEventId: 'evt-symphony-2026',
        assignedDate: '2026-11-14',
      });

      expect(staffUser).toBeDefined();
      expect(staffUser.id).toMatch(/^usr-gate-/);
      expect(staffUser.role).toBe('gate_staff');
      expect(staffUser.status).toBe('active');
      expect(staffUser.assignedEventId).toBe('evt-symphony-2026');
      expect(staffUser.assignedDate).toBe('2026-11-14');

      const allUsers = adminService.getUsers();
      const found = allUsers.find((u) => u.email === 'kareem.gate@ticketcraft.io');
      expect(found).toBeDefined();
      expect(found.assignedEventId).toBe('evt-symphony-2026');

      const logs = adminService.getAuditLogs();
      const gateLog = logs.find((l) => l.action === 'GATE_STAFF_CREATED' && l.target === staffUser.email);
      expect(gateLog).toBeDefined();
      expect(gateLog.details.assignedEventId).toBe('evt-symphony-2026');
    });

    it('toggles user status and records audit log', () => {
      const staffUser = adminService.createGateStaffUser({
        name: 'Salma Gate',
        email: 'salma.gate@ticketcraft.io',
      });

      const updated = adminService.toggleUserStatus(staffUser.id);
      expect(updated.status).toBe('suspended');

      const restored = adminService.toggleUserStatus(staffUser.id);
      expect(restored.status).toBe('active');

      const logs = adminService.getAuditLogs();
      expect(logs.some((l) => l.action === 'USER_STATUS_TOGGLED' && l.target === staffUser.id)).toBe(true);
    });

    it('updateUserRole updates role and records audit log', () => {
      const staffUser = adminService.createGateStaffUser({
        name: 'Staff To Org',
        email: 'upgrade@ticketcraft.io',
      });

      const updated = adminService.updateUserRole(staffUser.id, 'organizer');
      expect(updated.role).toBe('organizer');

      const logs = adminService.getAuditLogs();
      const roleLog = logs.find((l) => l.action === 'ROLE_UPDATE' && l.target === staffUser.id);
      expect(roleLog).toBeDefined();
      expect(roleLog.details.oldRole).toBe('gate_staff');
      expect(roleLog.details.newRole).toBe('organizer');
    });
  });

  describe('Attendees & CSV Export (Clean State & Live Bookings)', () => {
    it('getEventAttendees returns empty array on clean initial state', () => {
      const attendees = adminService.getEventAttendees('evt-symphony-2026');
      expect(Array.isArray(attendees)).toBe(true);
      expect(attendees.length).toBe(0);
    });

    it('getEventAttendees returns booked tickets dynamically when booking occurs', async () => {
      await mockTicketingService.reserveSeats('evt-symphony-2026', ['A-1'], 'usr-attendee-01', 300);
      await mockTicketingService.confirmBooking({
        eventId: 'evt-symphony-2026',
        seatIds: ['A-1'],
        userId: 'usr-attendee-01',
        attendeeName: 'Layla Ahmed',
        attendeeEmail: 'layla@example.com',
      });

      const attendees = adminService.getEventAttendees('evt-symphony-2026');
      expect(attendees.length).toBe(1);
      expect(attendees[0].attendee_name).toBe('Layla Ahmed');
      expect(attendees[0].email).toBe('layla@example.com');
      expect(attendees[0].seat).toBe('A-1');
    });

    it('exportAttendeesCSV generates CSV with UTF-8 BOM and correct headers', async () => {
      await mockTicketingService.reserveSeats('evt-symphony-2026', ['B-5'], 'usr-attendee-02', 300);
      await mockTicketingService.confirmBooking({
        eventId: 'evt-symphony-2026',
        seatIds: ['B-5'],
        userId: 'usr-attendee-02',
        attendeeName: 'Omar Khaled',
        attendeeEmail: 'omar@example.com',
      });

      const csv = adminService.exportAttendeesCSV('evt-symphony-2026');
      expect(csv.startsWith('\uFEFF')).toBe(true);

      const lines = csv.replace('\uFEFF', '').split('\r\n');
      expect(lines[0]).toBe('Ticket Code,Attendee Name,Email,Seat,Tier,Price,Status,Scanned At');
      expect(lines.length).toBe(2);
      expect(lines[1]).toContain('Omar Khaled');
    });
  });

  describe('Concurrency & System Health', () => {
    it('getConcurrencyStats returns seat breakdown for standard venue', () => {
      const stats = adminService.getConcurrencyStats('evt-symphony-2026');
      expect(stats.total).toBe(STANDARD_VENUE_CAPACITY);
      expect(stats.available).toBeGreaterThan(0);
      expect(stats.available + stats.reserved + stats.sold).toBe(STANDARD_VENUE_CAPACITY);
    });

    it('flushExpiredSeatHolds invokes mock ticketing release and records audit log', async () => {
      const result = await adminService.flushExpiredSeatHolds('evt-symphony-2026');
      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('released_count');

      const logs = adminService.getAuditLogs();
      expect(logs.some((l) => l.action === 'HOLDS_FLUSHED')).toBe(true);
    });
  });
});
