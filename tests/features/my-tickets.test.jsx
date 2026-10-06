import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyTicketsPage } from '../../src/features/tickets/MyTicketsPage';
import { AuthProvider } from '../../src/features/auth';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

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
});
