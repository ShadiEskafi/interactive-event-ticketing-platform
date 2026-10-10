import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyTicketsPage } from '../../src/features/tickets/MyTicketsPage';
import { AuthProvider } from '../../src/features/auth';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';
import { SupabaseTicketingService } from '../../src/services/supabaseTicketingService';

describe('"My Tickets" Dashboard & Gate Scan Idempotency (SPEC-04 / Scenarios 4.4 & 4.5)', () => {
  const testUserId = 'usr_attendee_456';
  const authedUser = {
    id: testUserId,
    email: 'attendee@example.com',
    user_metadata: { full_name: 'Jane Doe' },
  };

  const mockAuthService = {
    currentUser: authedUser,
    listeners: new Set(),
    async getSession() {
      return { session: { user: authedUser }, user: authedUser };
    },
    onAuthStateChange(cb) {
      this.listeners.add(cb);
      return () => this.listeners.delete(cb);
    },
    async signOut() {
      return { error: null };
    },
  };

  beforeEach(() => {
    mockTicketingService.resetState();
  });

  it('renders empty state when attendee has no issued tickets', async () => {
    render(
      <AuthProvider customAuthService={mockAuthService}>
        <MyTicketsPage userId={testUserId} />
      </AuthProvider>
    );

    const emptyState = await screen.findByTestId('empty-tickets-state');
    expect(emptyState).toBeInTheDocument();
    expect(screen.getByText('No Tickets Found')).toBeInTheDocument();
  });

  it('retrieves confirmed tickets, groups by event, and renders ticket cards', async () => {
    // Seed 2 confirmed tickets
    await mockTicketingService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['A-1', 'A-2'],
      userId: testUserId,
      attendeeName: 'Jane Doe',
      attendeeEmail: 'attendee@example.com',
    });

    render(
      <AuthProvider customAuthService={mockAuthService}>
        <MyTicketsPage userId={testUserId} />
      </AuthProvider>
    );

    // Wait for tickets to load
    const eventGroup = await screen.findByTestId('event-ticket-group');
    expect(eventGroup).toBeInTheDocument();
    expect(screen.getByText('Grand Symphony Concert')).toBeInTheDocument();

    const ticketCards = screen.getAllByTestId('ticket-card');
    expect(ticketCards).toHaveLength(2);
    expect(screen.getByText(/Seat A-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Seat A-2/i)).toBeInTheDocument();
  });

  it('opens full-screen QR modal with brightness boost when "Show QR Pass" is clicked', async () => {
    await mockTicketingService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['A-1'],
      userId: testUserId,
      attendeeName: 'Jane Doe',
    });

    render(
      <AuthProvider customAuthService={mockAuthService}>
        <MyTicketsPage userId={testUserId} />
      </AuthProvider>
    );

    const showQrBtn = await screen.findByTestId('show-qr-pass-btn');
    fireEvent.click(showQrBtn);

    // Modal dialog is opened
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute('aria-modal', 'true');

    // Container has brightness-boost class for physical scanner contrast
    const container = screen.getByTestId('full-screen-qr-container');
    expect(container).toHaveClass('brightness-boost');

    // Large QR SVG is rendered
    expect(screen.getByTestId('qr-code-svg')).toBeInTheDocument();

    // Dismiss modal on Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('enforces idempotent gate scanning: accepts initial scan, rejects duplicate scans, rejects tampered signatures', async () => {
    const bookingResult = await mockTicketingService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['A-5'],
      userId: testUserId,
      attendeeName: 'Jane Doe',
    });

    const issuedTicket = bookingResult.tickets[0];
    const ticketCode = issuedTicket.ticket_code;

    // 1. Initial valid gate scan
    const firstScan = await mockTicketingService.validateTicketScan(ticketCode);
    expect(firstScan.valid).toBe(true);
    expect(firstScan.status).toBe('ENTRY_GRANTED');
    expect(firstScan.scanned_at).toBeDefined();

    // 2. Duplicate gate scan attempt (must be rejected idempotently)
    const secondScan = await mockTicketingService.validateTicketScan(ticketCode);
    expect(secondScan.valid).toBe(false);
    expect(secondScan.status).toBe('ALREADY_USED');
    expect(secondScan.message).toMatch(/Ticket already scanned at/);

    // 3. Tampered cryptographic signature
    const tamperedScan = await mockTicketingService.validateTicketScan(
      ticketCode,
      '0000000000000000000000000000000000000000000000000000000000000000'
    );
    expect(tamperedScan.valid).toBe(false);
    expect(tamperedScan.status).toBe('INVALID_SIGNATURE');
  });

  it('persists tickets across page reload / service re-instantiation via localStorage', async () => {
    // 1. Confirm booking
    await mockTicketingService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['B-1'],
      userId: testUserId,
      attendeeName: 'Jane Doe',
    });

    // 2. Verify stored in localStorage
    const rawStored = window.localStorage.getItem('ticketcraft_mock_tickets');
    expect(rawStored).toBeTruthy();
    const parsed = JSON.parse(rawStored);
    expect(parsed.some((t) => t.user_id === testUserId)).toBe(true);

    // 3. Render MyTicketsPage and verify ticket is visible
    const { unmount } = render(
      <AuthProvider customAuthService={mockAuthService}>
        <MyTicketsPage userId={testUserId} />
      </AuthProvider>
    );

    expect(await screen.findByText(/Seat B-1/i)).toBeInTheDocument();
    unmount();

    // 4. Simulate page reload by re-rendering with fresh component mount
    render(
      <AuthProvider customAuthService={mockAuthService}>
        <MyTicketsPage userId={testUserId} />
      </AuthProvider>
    );

    expect(await screen.findByText(/Seat B-1/i)).toBeInTheDocument();
  });

  it('claims anonymous session tickets when guest logs in and hydrates in My Tickets', async () => {
    const guestAnonId = 'anon_session_guest_xyz';
    window.sessionStorage.setItem('ticketcraft_anon_session_id', guestAnonId);

    // 1. Guest books tickets anonymously
    await mockTicketingService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['C-1', 'C-2'],
      userId: guestAnonId,
      attendeeName: 'Guest Purchaser',
    });

    // 2. Attendee logs in (testUserId) and views My Tickets
    render(
      <AuthProvider customAuthService={mockAuthService}>
        <MyTicketsPage userId={testUserId} />
      </AuthProvider>
    );

    // Tickets originally booked under anon session are claimed and visible under testUserId
    expect(await screen.findByText(/Seat C-1/i)).toBeInTheDocument();
    expect(screen.getByText(/Seat C-2/i)).toBeInTheDocument();

    // Verify tickets in storage were re-bound to authenticated user ID
    const userTickets = await mockTicketingService.getUserTickets(testUserId);
    expect(userTickets.some((t) => t.seat_id === 'C-1' && t.user_id === testUserId)).toBe(true);
  });

  it('renders tickets for unauthenticated guest using anonymous session ID in sessionStorage', async () => {
    const guestAnonId = 'anon_session_guest_777';
    window.sessionStorage.setItem('ticketcraft_anon_session_id', guestAnonId);

    const guestAuthService = {
      currentUser: null,
      listeners: new Set(),
      async getSession() {
        return { session: null, user: null };
      },
      onAuthStateChange(cb) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
      },
      async signOut() {
        return { error: null };
      },
    };

    // 1. Guest books a ticket
    await mockTicketingService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['D-1'],
      userId: guestAnonId,
      attendeeName: 'Anonymous Guest',
    });

    // 2. Render MyTicketsPage without explicit userId prop as guest
    render(
      <AuthProvider customAuthService={guestAuthService}>
        <MyTicketsPage />
      </AuthProvider>
    );

    expect(await screen.findByText(/Seat D-1/i)).toBeInTheDocument();
  });

  it('survives tab closure / session wipe: renders guest tickets persisted in localStorage when sessionStorage is empty', async () => {
    const guestAnonId = 'anon_session_survivable_999';
    window.localStorage.setItem('ticketcraft_anon_session_id', guestAnonId);
    window.sessionStorage.clear(); // Simulate tab close / reopen where sessionStorage is wiped

    const guestAuthService = {
      currentUser: null,
      listeners: new Set(),
      async getSession() {
        return { session: null, user: null };
      },
      onAuthStateChange(cb) {
        this.listeners.add(cb);
        return () => this.listeners.delete(cb);
      },
      async signOut() {
        return { error: null };
      },
    };

    // 1. Guest booked ticket
    await mockTicketingService.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: ['E-1'],
      userId: guestAnonId,
      attendeeName: 'Persistent Guest',
    });

    // Wipe sessionStorage again to ensure lookup succeeds strictly from localStorage
    window.sessionStorage.clear();

    // 2. Render MyTicketsPage in fresh tab
    render(
      <AuthProvider customAuthService={guestAuthService}>
        <MyTicketsPage />
      </AuthProvider>
    );

    expect(await screen.findByText(/Seat E-1/i)).toBeInTheDocument();
  });

  it('normalizes Supabase ticket records defensively whether nested or flat', () => {
    const service = new SupabaseTicketingService();
    const rawNested = {
      id: 'tkt_123',
      ticket_code: 'TKT-10001',
      booking_id: 'bkg_456',
      event_id: 'evt-symphony-2026',
      seat_id: 'A-10',
      user_id: 'usr_789',
      seats: { id: 'A-10', row_label: 'A', seat_number: 10, category: 'VIP', price: 150 },
      bookings: {
        id: 'bkg_456',
        attendee_name: 'Alice Smith',
        attendee_email: 'alice@example.com',
        events: { id: 'evt-symphony-2026', title: 'Grand Symphony Concert', date_time: '2026-11-14' },
      },
    };

    const normalized = service.normalizeSupabaseTicket(rawNested);
    expect(normalized.ticket_code).toBe('TKT-10001');
    expect(normalized.row_label).toBe('A');
    expect(normalized.seat_number).toBe(10);
    expect(normalized.attendee_name).toBe('Alice Smith');
    expect(normalized.event_title).toBe('Grand Symphony Concert');

    // Flat record fallback without nested relation
    const rawFlat = {
      id: 'tkt_999',
      ticket_code: 'TKT-99999',
      seat_id: 'B-5',
      user_id: 'anon_guest',
      category: 'Standard',
      price: 95,
      attendee_name: 'Bob Guest',
    };
    const normalizedFlat = service.normalizeSupabaseTicket(rawFlat);
    expect(normalizedFlat.ticket_code).toBe('TKT-99999');
    expect(normalizedFlat.row_label).toBe('B');
    expect(normalizedFlat.seat_number).toBe('5');
    expect(normalizedFlat.price).toBe(95);
  });

  it('executes Supabase confirmBooking without throwing ReferenceError for nowISO', async () => {
    const service = new SupabaseTicketingService();
    const result = await service.confirmBooking({
      eventId: 'evt-symphony-2026',
      seatIds: [],
      userId: 'test_user_iso',
      attendeeName: 'ISO Test Attendee',
      attendeeEmail: 'iso@example.com',
    });
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.bookingId).toBeDefined();
    expect(result.booking.created_at).toBeDefined();
  });

  it('safely handles events date field variations (start_time, date, created_at) when date_time is absent', () => {
    const service = new SupabaseTicketingService();
    const withStartTime = {
      id: 'tkt_v1',
      ticket_code: 'TKT-V1',
      bookings: {
        events: { title: 'Varied Event', start_time: '2026-12-01T20:00:00Z' },
      },
    };
    expect(service.normalizeSupabaseTicket(withStartTime).event_date).toBe('2026-12-01T20:00:00Z');

    const withDate = {
      id: 'tkt_v2',
      ticket_code: 'TKT-V2',
      bookings: {
        events: { title: 'Varied Event', date: 'Sunday, Dec 20, 2026' },
      },
    };
    expect(service.normalizeSupabaseTicket(withDate).event_date).toBe('Sunday, Dec 20, 2026');

    const withCreatedAt = {
      id: 'tkt_v3',
      ticket_code: 'TKT-V3',
      bookings: {
        events: { title: 'Varied Event', created_at: '2026-11-10T12:00:00Z' },
      },
    };
    expect(service.normalizeSupabaseTicket(withCreatedAt).event_date).toBe('2026-11-10T12:00:00Z');
  });
});
