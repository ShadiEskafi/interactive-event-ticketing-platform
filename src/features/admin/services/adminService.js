import { FEATURED_EVENTS } from '../../landing/featuredEvents';
import { ticketingService, authService } from '../../../services';
import { supabase } from '../../../services/supabaseClient';
import { cryptoSigner } from '../../tickets/services/cryptoSigner';

export const STANDARD_VENUE_CAPACITY = 520;
export const STANDARD_VENUE_ID = '00000000-0000-0000-0000-000000000001';

export const CUSTOM_EVENTS_STORAGE_KEY = 'ticketcraft_custom_events';
export const EVENT_OVERRIDES_STORAGE_KEY = 'ticketcraft_event_overrides';
export const PLATFORM_USERS_STORAGE_KEY = 'ticketcraft_platform_users';
export const AUDIT_LOGS_STORAGE_KEY = 'ticketcraft_audit_logs';

/**
 * Single hardcoded Super Admin for initial clean state
 */
export const INITIAL_SUPER_ADMIN = {
  id: 'usr-super-admin',
  name: 'Shadi Askafi',
  name_ar: 'شادي الإسكافي',
  email: 'shadieskafi@gmail.com',
  role: 'super_admin',
  status: 'active',
  avatar: 'SA',
  createdAt: new Date().toISOString(),
};

/**
 * Initial baseline platform users containing exclusively the Super Admin
 */
const INITIAL_USERS = [INITIAL_SUPER_ADMIN];

/**
 * Escapes a single CSV cell value according to RFC 4180
 */
function escapeCSV(val) {
  if (val === null || val === undefined) return '';
  const str = String(val);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export class AdminService {
  constructor() {
    this.capacity = STANDARD_VENUE_CAPACITY;
    this.cryptoSigner = cryptoSigner;
    this._customEvents = [];
    this._overrides = {};
    this._users = this._loadUsers();
    this._auditLogs = [];
  }

  // -------------------------------------------------------------
  // STORAGE HELPERS
  // -------------------------------------------------------------

  _loadUsers() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(PLATFORM_USERS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const hasAdmin = parsed.some(
              (u) => u.email?.toLowerCase() === INITIAL_SUPER_ADMIN.email.toLowerCase()
            );
            return hasAdmin ? parsed : [INITIAL_SUPER_ADMIN, ...parsed];
          }
        }
      } catch {
        // Safe fallback
      }
    }
    return Array.isArray(this._users) && this._users.length > 0
      ? this._users
      : [...INITIAL_USERS];
  }

  _saveUsers(users) {
    this._users = Array.isArray(users) ? users : [...INITIAL_USERS];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(PLATFORM_USERS_STORAGE_KEY, JSON.stringify(this._users));
      } catch {
        // Safe fallback
      }
    }
  }

  _loadCustomEvents() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(CUSTOM_EVENTS_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) return parsed;
        }
      } catch {
        // Safe fallback
      }
    }
    return Array.isArray(this._customEvents) ? this._customEvents : [];
  }

  _saveCustomEvents(events) {
    this._customEvents = Array.isArray(events) ? events : [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(CUSTOM_EVENTS_STORAGE_KEY, JSON.stringify(events));
      } catch {
        // Safe fallback
      }
    }
  }

  _loadOverrides() {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const stored = window.localStorage.getItem(EVENT_OVERRIDES_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (typeof parsed === 'object' && parsed !== null) return parsed;
        }
      } catch {
        // Safe fallback
      }
    }
    return typeof this._overrides === 'object' && this._overrides !== null ? this._overrides : {};
  }

  _saveOverrides(overrides) {
    this._overrides = typeof overrides === 'object' && overrides !== null ? overrides : {};
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(EVENT_OVERRIDES_STORAGE_KEY, JSON.stringify(overrides));
      } catch {
        // Safe fallback
      }
    }
  }

  // -------------------------------------------------------------
  // AUDIT LOG MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Appends an audit log entry to memory and persists to Supabase audit_logs table
   */
  recordAuditLog({ action, actorEmail, target, details }) {
    const timestamp = new Date().toISOString();
    const entry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      timestamp,
      action: action || 'UNKNOWN_ACTION',
      actorEmail: actorEmail || INITIAL_SUPER_ADMIN.email,
      target: target ? String(target) : 'platform',
      details: typeof details === 'object' && details !== null ? details : { raw: details },
    };

    this._auditLogs = [entry, ...(this._auditLogs || [])];

    try {
      supabase
        .from('audit_logs')
        .insert({
          action: entry.action,
          entity_type: 'platform',
          entity_id: entry.target,
          details: entry.details,
        })
        .then(() => {});
    } catch {
      // Safe fallback
    }

    return entry;
  }

  /**
   * Retrieves all recorded audit logs sorted descending by timestamp
   * @returns {Array} List of audit logs
   */
  getAuditLogs() {
    return (this._auditLogs || []).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  // -------------------------------------------------------------
  // EVENTS MANAGEMENT
  // -------------------------------------------------------------

  /**
   * Combines FEATURED_EVENTS and custom events from localStorage, applying any overrides.
   * @returns {Array} List of all available events
   */
  getAllEvents() {
    const overrides = this._loadOverrides();
    const customEvents = this._loadCustomEvents();

    const baseEvents = FEATURED_EVENTS.map((evt) => {
      const override = overrides[evt.id];
      if (override) {
        return { ...evt, ...override };
      }
      return evt;
    }).filter((evt) => !evt.deleted);

    const validCustomEvents = customEvents.filter((evt) => !evt.deleted);

    return [...baseEvents, ...validCustomEvents];
  }

  /**
   * Retrieves an event by its unique ID
   * @param {string} eventId
   * @returns {Object|null}
   */
  getEventById(eventId) {
    if (!eventId) return null;
    const events = this.getAllEvents();
    return events.find((e) => e.id === eventId) || null;
  }

  /**
   * Creates a new event, binds it to standard venue, sets capacity to 520, and persists to localStorage.
   */
  createEvent({
    title,
    title_ar,
    category,
    category_ar,
    date,
    date_ar,
    venue,
    venue_ar,
    description,
    description_ar,
    vipPrice,
    regularPrice,
    balconyPrice,
    imageGradient,
    status = 'published',
    organizerId = 'usr-super-admin',
  }) {
    const id = `evt-custom-${Date.now()}`;
    const pVip = Number(vipPrice) || 150;
    const pReg = Number(regularPrice) || 75;
    const pBal = Number(balconyPrice) || 45;

    const minPrice = Math.min(pVip, pReg, pBal);
    const maxPrice = Math.max(pVip, pReg, pBal);
    const priceRange = minPrice === maxPrice ? `$${minPrice}` : `$${minPrice} – $${maxPrice}`;
    const priceRange_ar = minPrice === maxPrice ? `${minPrice}$` : `${minPrice}$ – ${maxPrice}$`;

    const newEvent = {
      id,
      venueId: STANDARD_VENUE_ID,
      title: title || 'New Interactive Event',
      title_ar: title_ar || title || 'فعالية تفاعلية جديدة',
      category: category || 'Festivals',
      category_ar: category_ar || category || 'مهرجانات',
      date: date || 'Saturday, Dec 12, 2026 • 8:00 PM',
      date_ar: date_ar || date || 'السبت، ١٢ ديسمبر ٢٠٢٦ • ٨:٠٠ م',
      venue: venue || 'Grand Symphony Hall • Auditorium',
      venue_ar: venue_ar || venue || 'قاعة السيمفونية الكبرى • المسرح الرئيسي',
      description:
        description ||
        'Exciting interactive live performance in our certified 520-seat acoustic auditorium.',
      description_ar:
        description_ar ||
        'أداء حي وتفاعلي استثنائي في مسرحنا الصوتي المعتمد والمجهز بـ ٥٢٠ مقعداً تفاعلياً.',
      priceRange,
      priceRange_ar,
      vipPrice: pVip,
      regularPrice: pReg,
      balconyPrice: pBal,
      tierPricing: {
        vip: pVip,
        regular: pReg,
        balcony: pBal,
      },
      capacity: `${STANDARD_VENUE_CAPACITY} Seats`,
      capacity_ar: '٥٢٠ مقعداً',
      statusPill: status === 'draft' ? 'Draft' : 'Live Interactive Map',
      statusPill_ar: status === 'draft' ? 'مسودة' : 'خريطة تفاعلية حية',
      status: status || 'published',
      isPrimary: false,
      organizerId: organizerId || 'usr-super-admin',
      highlights: [
        'Interactive 520-Seat Topology',
        'Standard Venue Layout',
        'Cryptographic Digital Passes',
      ],
      highlights_ar: [
        'خريطة تفاعلية لـ ٥٢٠ مقعداً',
        'تخطيط القاعة القياسي',
        'تذاكر رقمية مشفرة',
      ],
      imageGradient:
        imageGradient ||
        'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
      ctaText: 'Select Seats →',
      ctaText_ar: 'اختر المقاعد ←',
      createdAt: new Date().toISOString(),
    };

    const customEvents = this._loadCustomEvents();
    customEvents.push(newEvent);
    this._saveCustomEvents(customEvents);

    // Persist new event and generate 520 seats in Supabase
    try {
      if (typeof ticketingService.createEventWithSeats === 'function') {
        ticketingService.createEventWithSeats(newEvent);
      } else {
        ticketingService.seedEventSeats?.(newEvent);
      }
    } catch {
      // Safe fallback
    }

    this.recordAuditLog({
      action: 'EVENT_CREATED',
      actorEmail: INITIAL_SUPER_ADMIN.email,
      target: newEvent.id,
      details: { title: newEvent.title, capacity: STANDARD_VENUE_CAPACITY },
    });

    return newEvent;
  }

  /**
   * Updates an existing event in localStorage or overrides FEATURED_EVENTS.
   */
  updateEvent(eventId, updates = {}) {
    if (!eventId) return null;

    let customEvents = this._loadCustomEvents();
    const customIdx = customEvents.findIndex((e) => e.id === eventId);
    let updatedEvent = null;

    if (customIdx !== -1) {
      const existing = customEvents[customIdx];
      const pVip = updates.vipPrice !== undefined ? Number(updates.vipPrice) : existing.vipPrice;
      const pReg = updates.regularPrice !== undefined ? Number(updates.regularPrice) : existing.regularPrice;
      const pBal = updates.balconyPrice !== undefined ? Number(updates.balconyPrice) : existing.balconyPrice;

      let priceUpdates = {};
      if (pVip !== undefined && pReg !== undefined && pBal !== undefined) {
        const minP = Math.min(pVip, pReg, pBal);
        const maxP = Math.max(pVip, pReg, pBal);
        priceUpdates = {
          priceRange: minP === maxP ? `$${minP}` : `$${minP} – $${maxP}`,
          priceRange_ar: minP === maxP ? `${minP}$` : `${minP}$ – ${maxP}$`,
          vipPrice: pVip,
          regularPrice: pReg,
          balconyPrice: pBal,
          tierPricing: { vip: pVip, regular: pReg, balcony: pBal },
        };
      }

      updatedEvent = {
        ...existing,
        ...updates,
        ...priceUpdates,
        updatedAt: new Date().toISOString(),
      };
      customEvents[customIdx] = updatedEvent;
      this._saveCustomEvents(customEvents);
    } else {
      const overrides = this._loadOverrides();
      const existingFeatured = FEATURED_EVENTS.find((e) => e.id === eventId);
      if (existingFeatured) {
        const currentOverride = overrides[eventId] || {};
        const merged = { ...existingFeatured, ...currentOverride, ...updates };

        const pVip = updates.vipPrice !== undefined ? Number(updates.vipPrice) : merged.vipPrice;
        const pReg = updates.regularPrice !== undefined ? Number(updates.regularPrice) : merged.regularPrice;
        const pBal = updates.balconyPrice !== undefined ? Number(updates.balconyPrice) : merged.balconyPrice;

        let priceUpdates = {};
        if (pVip !== undefined && pReg !== undefined && pBal !== undefined) {
          const minP = Math.min(pVip, pReg, pBal);
          const maxP = Math.max(pVip, pReg, pBal);
          priceUpdates = {
            priceRange: minP === maxP ? `$${minP}` : `$${minP} – $${maxP}`,
            priceRange_ar: minP === maxP ? `${minP}$` : `${minP}$ – ${maxP}$`,
            vipPrice: pVip,
            regularPrice: pReg,
            balconyPrice: pBal,
            tierPricing: { vip: pVip, regular: pReg, balcony: pBal },
          };
        }

        updatedEvent = {
          ...merged,
          ...priceUpdates,
          updatedAt: new Date().toISOString(),
        };
        overrides[eventId] = updatedEvent;
        this._saveOverrides(overrides);
      }
    }

    if (updatedEvent) {
      this.recordAuditLog({
        action: 'EVENT_UPDATED',
        actorEmail: INITIAL_SUPER_ADMIN.email,
        target: eventId,
        details: updates,
      });
    }

    return updatedEvent;
  }

  /**
   * Deletes a custom event or marks a featured event as deleted
   */
  deleteEvent(eventId) {
    if (!eventId) return { success: false };

    let customEvents = this._loadCustomEvents();
    const existsInCustom = customEvents.some((e) => e.id === eventId);

    if (existsInCustom) {
      customEvents = customEvents.filter((e) => e.id !== eventId);
      this._saveCustomEvents(customEvents);
    } else {
      const overrides = this._loadOverrides();
      overrides[eventId] = { ...(overrides[eventId] || {}), deleted: true };
      this._saveOverrides(overrides);
    }

    this.recordAuditLog({
      action: 'EVENT_DELETED',
      actorEmail: INITIAL_SUPER_ADMIN.email,
      target: eventId,
      details: {},
    });

    return { success: true, eventId };
  }

  /**
   * Sets isPrimary: true for the selected event and false for all others
   */
  toggleEventFeatured(eventId) {
    if (!eventId) return null;

    const customEvents = this._loadCustomEvents();
    const overrides = this._loadOverrides();

    customEvents.forEach((evt) => {
      evt.isPrimary = evt.id === eventId;
    });
    this._saveCustomEvents(customEvents);

    FEATURED_EVENTS.forEach((evt) => {
      const prev = overrides[evt.id] || {};
      overrides[evt.id] = {
        ...prev,
        isPrimary: evt.id === eventId,
      };
    });
    this._saveOverrides(overrides);

    return this.getEventById(eventId);
  }

  // -------------------------------------------------------------
  // PLATFORM & ORGANIZER ANALYTICS
  // -------------------------------------------------------------

  /**
   * Calculates platform-wide metrics: total GMV, bookings count, tickets sold, active events, occupancy, fees
   */
  getPlatformStats() {
    const events = this.getAllEvents();
    const activeEvents = events.filter((e) => e.status !== 'draft');

    const liveTickets = ticketingService.tickets || [];
    const liveBookings = ticketingService.bookings || [];

    const liveTicketRevenue = liveTickets.reduce((sum, t) => sum + (Number(t.price) || 0), 0);
    const liveBookingRevenue = liveBookings.reduce(
      (sum, b) => sum + (Number(b.total_amount) || 0),
      0
    );

    const totalGmv = liveTicketRevenue || liveBookingRevenue || 0;
    const totalBookings = liveBookings.length;
    const totalTicketsSold = liveTickets.length;
    const activeEventsCount = activeEvents.length;

    const capacityTotal = events.length * STANDARD_VENUE_CAPACITY;
    const rawOccupancy = capacityTotal > 0 ? Math.round((totalTicketsSold / capacityTotal) * 100) : 0;
    const occupancyRate = Math.min(rawOccupancy, 100);

    const platformFees = Math.round(totalGmv * 0.08 * 100) / 100;

    return {
      totalGmv,
      totalBookings,
      totalTicketsSold,
      activeEventsCount,
      occupancyRate,
      platformFees,
    };
  }

  /**
   * Calculates organizer specific metrics: organizerRevenue, ticketsSold, totalCapacity (520), attendanceRate, checkedInCount
   */
  getOrganizerStats(organizerId, eventId) {
    const events = this.getAllEvents();
    const targetEventId = eventId || (events[0] ? events[0].id : 'evt-symphony-2026');
    const attendees = this.getEventAttendees(targetEventId);

    const ticketsSold = attendees.length;
    const checkedInCount = attendees.filter((a) => a.is_used).length;
    const attendanceRate = ticketsSold > 0 ? Math.round((checkedInCount / ticketsSold) * 100) : 0;
    const organizerRevenue = attendees.reduce((sum, a) => sum + (Number(a.price) || 0), 0);

    const organizerEvents = events.filter(
      (e) => !organizerId || e.organizerId === organizerId || !e.organizerId
    );

    return {
      organizerRevenue,
      ticketsSold,
      totalCapacity: STANDARD_VENUE_CAPACITY,
      attendanceRate,
      checkedInCount,
      activeEventsCount: organizerEvents.filter((e) => e.status !== 'draft').length,
    };
  }

  // -------------------------------------------------------------
  // ATTENDEES ROSTER & CSV EXPORT
  // -------------------------------------------------------------

  /**
   * Returns ticket records for this event from ticketingService.
   * Starts clean with zero mock attendees.
   */
  getEventAttendees(eventId) {
    const targetId = eventId || 'evt-symphony-2026';
    const liveTickets = ticketingService.tickets || [];
    const eventLiveTickets = liveTickets.filter((t) => t.event_id === targetId);

    // Any real runtime tickets
    return eventLiveTickets.map((t) => ({
      id: t.id || t.ticket_code,
      ticket_code: t.ticket_code || t.id,
      attendee_name: t.attendee_name || 'Valued Attendee',
      email: t.attendee_email || 'attendee@example.com',
      seat: t.seat_id || `${t.row_label || 'A'}-${t.seat_number || 1}`,
      tier: t.tier || t.category || 'VIP',
      price: typeof t.price === 'number' ? t.price : parseFloat(t.price || 150),
      status: t.is_used ? 'scanned' : 'confirmed',
      is_used: Boolean(t.is_used),
      scanned_at: t.scanned_at || null,
      event_id: t.event_id || targetId,
      created_at: t.created_at || new Date().toISOString(),
    }));
  }

  /**
   * Generates a CSV string containing attendee data prepended with UTF-8 BOM (\uFEFF)
   * for perfect Arabic rendering in Excel and Google Sheets, and triggers a browser download.
   * @param {string} eventId
   * @returns {string} CSV content
   */
  exportAttendeesCSV(eventId) {
    const attendees = this.getEventAttendees(eventId);
    const header = 'Ticket Code,Attendee Name,Email,Seat,Tier,Price,Status,Scanned At';

    const rows = attendees.map((a) => {
      const statusLabel = a.is_used ? 'Scanned' : 'Pending';
      const scannedAtLabel = a.scanned_at ? new Date(a.scanned_at).toLocaleString() : 'N/A';
      return [
        escapeCSV(a.ticket_code),
        escapeCSV(a.attendee_name),
        escapeCSV(a.email),
        escapeCSV(a.seat),
        escapeCSV(a.tier),
        `$${a.price}`,
        escapeCSV(statusLabel),
        escapeCSV(scannedAtLabel),
      ].join(',');
    });

    // Prepend UTF-8 Byte Order Mark (\uFEFF) so Excel displays Arabic flawlessly
    const csvContent = '\uFEFF' + [header, ...rows].join('\r\n');

    if (
      typeof window !== 'undefined' &&
      typeof document !== 'undefined' &&
      typeof URL !== 'undefined' &&
      typeof URL.createObjectURL === 'function'
    ) {
      try {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `attendees-${eventId || 'all'}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      } catch (err) {
        console.error('Failed to trigger CSV download:', err);
      }
    }

    return csvContent;
  }

  // -------------------------------------------------------------
  // USERS & ROLES
  // -------------------------------------------------------------

  /**
   * Returns list of platform users. Initially contains only hardcoded Super Admin.
   */
  getUsers() {
    if (!this._users || this._users.length === 0) {
      this._users = this._loadUsers();
    }
    return [...this._users];
  }

  /**
   * Fetches all registered users/profiles directly from Supabase profiles table
   * and merges them into memory & localStorage.
   */
  async fetchUsersFromSupabase() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: true });

      if (error || !Array.isArray(data)) {
        return this.getUsers();
      }

      const currentUsers = this.getUsers();
      const localMap = new Map();
      currentUsers.forEach((u) => {
        if (u.email) localMap.set(u.email.toLowerCase(), u);
      });

      const merged = data.map((profile) => {
        const emailLower = (profile.email || '').toLowerCase();
        const existing = localMap.get(emailLower);
        const isSuperAdmin =
          emailLower === INITIAL_SUPER_ADMIN.email.toLowerCase() ||
          profile.role === 'super_admin';

        const role = isSuperAdmin ? 'super_admin' : (profile.role || 'attendee');
        const defaultName = isSuperAdmin
          ? INITIAL_SUPER_ADMIN.name
          : (role === 'gate_staff' ? 'Gate Staff' : (emailLower.split('@')[0] || 'Platform User'));
        const defaultNameAr = isSuperAdmin
          ? INITIAL_SUPER_ADMIN.name_ar
          : (role === 'gate_staff' ? 'موظف بوابة' : defaultName);

        return {
          id: profile.id || existing?.id || `usr-${role}-${Date.now()}`,
          name: existing?.name || defaultName,
          name_ar: existing?.name_ar || defaultNameAr,
          email: profile.email,
          role,
          status: existing?.status || 'active',
          avatar: existing?.avatar || (existing?.name || defaultName).slice(0, 2).toUpperCase(),
          assignedEventId: profile.assigned_event_id || existing?.assignedEventId || null,
          assignedDate: profile.assigned_date || existing?.assignedDate || null,
          createdAt: profile.created_at || existing?.createdAt || new Date().toISOString(),
        };
      });

      // Also preserve any in-flight local users that haven't been indexed by Supabase yet
      const mergedEmails = new Set(merged.map((m) => m.email.toLowerCase()));
      currentUsers.forEach((u) => {
        if (u.email && !mergedEmails.has(u.email.toLowerCase())) {
          merged.push(u);
        }
      });

      // Ensure Super Admin is always present
      if (!merged.some((u) => u.email.toLowerCase() === INITIAL_SUPER_ADMIN.email.toLowerCase())) {
        merged.unshift(INITIAL_SUPER_ADMIN);
      }

      this._saveUsers(merged);
      return [...merged];
    } catch (err) {
      console.warn('[AdminService] fetchUsersFromSupabase exception:', err);
      return this.getUsers();
    }
  }

  /**
   * Updates user role in memory & Supabase profiles and records audit log
   * @param {string} userId
   * @param {'super_admin'|'organizer'|'gate_staff'|'attendee'} newRole
   * @param {string} [actorEmail]
   */
  updateUserRole(userId, newRole, actorEmail = INITIAL_SUPER_ADMIN.email) {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return null;

    const oldRole = users[userIndex].role;
    users[userIndex] = {
      ...users[userIndex],
      role: newRole,
      updatedAt: new Date().toISOString(),
    };
    this._saveUsers(users);

    try {
      supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)
        .then(() => {});
    } catch {
      // Safe fallback
    }

    this.recordAuditLog({
      action: 'ROLE_UPDATE',
      actorEmail,
      target: userId,
      details: { oldRole, newRole },
    });

    return users[userIndex];
  }

  /**
   * Creates a dedicated gate staff user scoped optionally to an event and date
   * @param {Object} params
   * @param {string} params.name
   * @param {string} [params.name_ar]
   * @param {string} params.email
   * @param {string} [params.password]
   * @param {string} [params.assignedEventId]
   * @param {string} [params.assignedDate]
   * @param {string} [params.actorEmail]
   */
  createGateStaffUser({
    name,
    name_ar,
    email,
    password,
    assignedEventId,
    assignedDate,
    actorEmail = INITIAL_SUPER_ADMIN.email,
  }) {
    if (!email) {
      throw new Error('Email is required to create gate staff user');
    }

    const users = this.getUsers();
    const staffId = `usr-gate-${Date.now()}`;
    const staffName = name || 'Gate Staff';
    const staffNameAr = name_ar || staffName;

    const newStaffUser = {
      id: staffId,
      name: staffName,
      name_ar: staffNameAr,
      email: email.trim(),
      password: password || 'GateStaffPass2026!',
      role: 'gate_staff',
      status: 'active',
      avatar: staffName.slice(0, 2).toUpperCase(),
      assignedEventId: assignedEventId || null,
      assignedDate: assignedDate || null,
      createdAt: new Date().toISOString(),
    };

    const existingIndex = users.findIndex((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...newStaffUser };
    } else {
      users.push(newStaffUser);
    }

    this._saveUsers(users);

    // Persist and provision user in Supabase auth.users and profiles
    try {
      authService.provisionUser?.({
        email: newStaffUser.email,
        password: newStaffUser.password,
        role: 'gate_staff',
        fullName: newStaffUser.name,
        assignedEventId: newStaffUser.assignedEventId,
        assignedDate: newStaffUser.assignedDate,
      }).then(() => {
        this.fetchUsersFromSupabase().catch(() => {});
      }).catch(() => {});
    } catch {
      // Safe fallback
    }

    this.recordAuditLog({
      action: 'GATE_STAFF_CREATED',
      actorEmail,
      target: newStaffUser.email,
      details: {
        userId: newStaffUser.id,
        name: newStaffUser.name,
        assignedEventId: newStaffUser.assignedEventId,
        assignedDate: newStaffUser.assignedDate,
      },
    });

    return newStaffUser;
  }

  /**
   * Creates a platform user with specified role, status: 'active', and records audit log.
   */
  createUser({
    name,
    name_ar,
    email,
    password,
    role = 'attendee',
    actorEmail = INITIAL_SUPER_ADMIN.email,
  }) {
    if (!email) {
      throw new Error('Email is required to create a user');
    }

    const users = this.getUsers();
    const effectiveRole = role || 'attendee';
    const userId = `usr-${effectiveRole}-${Date.now()}`;
    const userName = name || email.split('@')[0] || 'Platform User';
    const userNameAr = name_ar || userName;

    const newUser = {
      id: userId,
      name: userName,
      name_ar: userNameAr,
      email: email.trim().toLowerCase(),
      password: password || 'TicketCraft2026!',
      role: effectiveRole,
      status: 'active',
      avatar: userName.slice(0, 2).toUpperCase(),
      createdAt: new Date().toISOString(),
    };

    const existingIndex = users.findIndex(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (existingIndex !== -1) {
      users[existingIndex] = { ...users[existingIndex], ...newUser };
    } else {
      users.push(newUser);
    }

    this._saveUsers(users);

    // Persist and provision user in Supabase auth.users and profiles
    try {
      authService.provisionUser?.({
        email: newUser.email,
        password: newUser.password,
        role: newUser.role,
        fullName: newUser.name,
      }).then(() => {
        this.fetchUsersFromSupabase().catch(() => {});
      }).catch(() => {});
    } catch {
      // Safe fallback
    }

    this.recordAuditLog({
      action: 'USER_CREATED',
      actorEmail,
      target: newUser.email,
      details: {
        userId: newUser.id,
        name: newUser.name,
        role: newUser.role,
      },
    });

    return newUser;
  }

  /**
   * Toggles active / suspended status for a user
   */
  toggleUserStatus(userId, actorEmail = INITIAL_SUPER_ADMIN.email) {
    const users = this.getUsers();
    const userIndex = users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return null;

    const currentStatus = users[userIndex].status || 'active';
    const newStatus = currentStatus === 'active' ? 'suspended' : 'active';

    users[userIndex] = {
      ...users[userIndex],
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    this._saveUsers(users);

    this.recordAuditLog({
      action: 'USER_STATUS_TOGGLED',
      actorEmail,
      target: userId,
      details: {
        previousStatus: currentStatus,
        newStatus,
      },
    });

    return users[userIndex];
  }

  // -------------------------------------------------------------
  // SYSTEM HEALTH & CONCURRENCY
  // -------------------------------------------------------------

  /**
   * Calls ticketingService.releaseExpiredSeats() to flush seats where hold has elapsed
   */
  async flushExpiredSeatHolds(eventId = null, actorEmail = INITIAL_SUPER_ADMIN.email) {
    const result = await ticketingService.releaseExpiredSeats(eventId);
    const released_count =
      typeof result === 'object' && result !== null
        ? Number(result.released_count ?? 0)
        : Number(result || 0);

    this.recordAuditLog({
      action: 'HOLDS_FLUSHED',
      actorEmail,
      target: eventId || 'all_events',
      details: { releasedCount: released_count },
    });

    return {
      success: true,
      released_count,
    };
  }

  /**
   * Returns current seat status breakdown (available, reserved/held, sold, expiredHolds)
   */
  getConcurrencyStats(eventId = null) {
    const seats = eventId && typeof ticketingService.getSeatsForEvent === 'function'
      ? ticketingService.getSeatsForEvent(eventId)
      : (ticketingService.seats || []);
    let available = 0;
    let reserved = 0;
    let sold = 0;
    let expiredHolds = 0;
    const now = Date.now();

    seats.forEach((seat) => {
      if (eventId && seat.eventId && seat.eventId !== eventId) return;
      if (seat.status === 'reserved') {
        reserved++;
        const isExpired = seat.reservedUntil && new Date(seat.reservedUntil).getTime() <= now;
        if (isExpired) {
          expiredHolds++;
        }
      } else if (seat.status === 'sold') {
        sold++;
      } else {
        available++;
      }
    });

    const total = seats.length || STANDARD_VENUE_CAPACITY;
    return {
      available,
      reserved,
      sold,
      total,
      expiredHolds,
    };
  }

  /**
   * Resets entire platform to pristine clean baseline:
   * Clears custom events, event overrides, audit logs, held/sold seats,
   * attendees, and restores only the default Super Admin user.
   */
  resetToCleanState(actorEmail = INITIAL_SUPER_ADMIN.email) {
    this._customEvents = [];
    this._overrides = {};
    this._users = [...INITIAL_USERS];
    this._auditLogs = [];

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(CUSTOM_EVENTS_STORAGE_KEY);
        window.localStorage.removeItem(EVENT_OVERRIDES_STORAGE_KEY);
        window.localStorage.setItem(PLATFORM_USERS_STORAGE_KEY, JSON.stringify([INITIAL_SUPER_ADMIN]));
        window.localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
      } catch {
        // Safe fallback
      }
    }

    // Reset ticketing inventory, seats, holds, and bookings
    ticketingService.resetState?.();

    // Record the clean reset event
    const log = this.recordAuditLog({
      action: 'CLEAN_STATE_RESET',
      actorEmail,
      target: 'platform',
      details: {
        timestamp: new Date().toISOString(),
        message: 'System purged and reset to clean state with Super Admin Shadi Askafi',
      },
    });

    return {
      success: true,
      timestamp: new Date().toISOString(),
      log,
    };
  }

  /**
   * Reset in-memory state for clean test isolation
   */
  resetState() {
    this._customEvents = [];
    this._overrides = {};
    this._users = [...INITIAL_USERS];
    this._auditLogs = [];
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(CUSTOM_EVENTS_STORAGE_KEY);
        window.localStorage.removeItem(EVENT_OVERRIDES_STORAGE_KEY);
        window.localStorage.removeItem(PLATFORM_USERS_STORAGE_KEY);
        window.localStorage.removeItem(AUDIT_LOGS_STORAGE_KEY);
      } catch {
        // Safe fallback
      }
    }
    ticketingService.resetState?.();
  }
}

export const adminService = new AdminService();

// Standalone functional exports
export const recordAuditLog = (params) => adminService.recordAuditLog(params);
export const getAuditLogs = () => adminService.getAuditLogs();
export const getUsers = () => adminService.getUsers();
export const fetchUsersFromSupabase = () => adminService.fetchUsersFromSupabase();
export const createGateStaffUser = (params) => adminService.createGateStaffUser(params);
export const createUser = (params) => adminService.createUser(params);
export const resetToCleanState = (actorEmail) => adminService.resetToCleanState(actorEmail);
