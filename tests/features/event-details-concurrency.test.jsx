import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EventDetailsModal } from '../../src/features/admin/components/EventDetailsModal';
import { EventsManagementTab } from '../../src/features/admin/components/EventsManagementTab';
import { SuperAdminOverview } from '../../src/features/admin/components/SuperAdminOverview';
import { OrganizerOverview } from '../../src/features/admin/components/OrganizerOverview';
import { SystemHealthTab } from '../../src/features/admin/components/SystemHealthTab';
import { AdminDashboardPage } from '../../src/features/admin/AdminDashboardPage';
import { adminService, STANDARD_VENUE_CAPACITY } from '../../src/features/admin/services/adminService';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';
import { LanguageProvider } from '../../src/context';

describe('Event Details Modal, Concurrency & Hold Flusher (Subagent 2)', () => {
  const sampleEvent = {
    id: 'evt-test-modal-1',
    title: 'Galactic Symphonic Night',
    title_ar: 'ليلة السيمفونية المجرية',
    category: 'Classical',
    category_ar: 'كلاسيكي',
    date: 'Friday, Oct 30, 2026 • 8:30 PM',
    date_ar: 'الجمعة، ٣٠ أكتوبر ٢٠٢٦ • ٨:٣٠ م',
    venue: 'Royal Acoustics Auditorium',
    venue_ar: 'قاعة الصوتيات الملكية',
    description: 'An ethereal journey through celestial orchestral arrangements.',
    description_ar: 'رحلة أوركسترالية استثنائية عبر روائع الموسيقى الكونية.',
    status: 'published',
    vipPrice: 175,
    regularPrice: 85,
    balconyPrice: 50,
    tierPricing: {
      vip: 175,
      regular: 85,
      balcony: 50,
    },
    imageGradient: 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)',
  };

  const sampleAttendees = [
    {
      id: 'att-1',
      ticket_code: 'TC-101',
      attendee_name: 'Alice Johnson',
      email: 'alice@example.com',
      seat: 'A-1',
      tier: 'VIP',
      price: 175,
      is_used: true,
      event_id: 'evt-test-modal-1',
    },
    {
      id: 'att-2',
      ticket_code: 'TC-102',
      attendee_name: 'Bob Smith',
      email: 'bob@example.com',
      seat: 'E-10',
      tier: 'Regular',
      price: 85,
      is_used: false,
      event_id: 'evt-test-modal-1',
    },
  ];

  beforeEach(() => {
    adminService.resetState();
    mockTicketingService.resetState();
    window.sessionStorage.clear();
    window.localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderWithLang = (ui, lang = 'en') => {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem('ticketcraft_lang', lang);
    }
    return render(<LanguageProvider initialLanguage={lang}>{ui}</LanguageProvider>);
  };

  // --------------------------------------------------------------------------
  // 1. EventDetailsModal Unit Tests
  // --------------------------------------------------------------------------
  it('renders EventDetailsModal with complete bilingual details, pricing, and metrics', () => {
    const handleClose = vi.fn();
    const handleEdit = vi.fn();

    renderWithLang(
      <EventDetailsModal
        isOpen={true}
        onClose={handleClose}
        event={sampleEvent}
        attendees={sampleAttendees}
        onEditEvent={handleEdit}
      />,
      'en'
    );

    // Modal is open
    expect(screen.getByTestId('event-details-modal')).toBeInTheDocument();
    expect(screen.getByText('Galactic Symphonic Night')).toBeInTheDocument();
    expect(screen.getByText('ليلة السيمفونية المجرية')).toBeInTheDocument();

    // Venue & Date & Capacity
    expect(screen.getByText(/Royal Acoustics Auditorium/i)).toBeInTheDocument();
    expect(screen.getByText(/Friday, Oct 30, 2026 • 8:30 PM/i)).toBeInTheDocument();
    expect(screen.getByText(/520 Fixed Capacity/i)).toBeInTheDocument();

    // Tier pricing breakdown
    expect(screen.getByTestId('tier-price-vip')).toHaveTextContent('$175');
    expect(screen.getByTestId('tier-price-regular')).toHaveTextContent('$85');
    expect(screen.getByTestId('tier-price-balcony')).toHaveTextContent('$50');

    // Realtime Occupancy metrics (2 sold out of 520, $260 revenue)
    expect(screen.getByTestId('detail-metric-capacity')).toHaveTextContent('520');
    expect(screen.getByTestId('detail-metric-sold')).toHaveTextContent('2');
    expect(screen.getByTestId('detail-metric-sold')).toHaveTextContent('518 remaining available seats');
    expect(screen.getByTestId('detail-metric-revenue')).toHaveTextContent('$260');

    // Status pill
    expect(screen.getByTestId('event-details-status')).toHaveTextContent(/Live Interactive Map/i);

    // Edit button click
    const editBtn = screen.getByTestId('btn-modal-details-edit');
    fireEvent.click(editBtn);
    expect(handleEdit).toHaveBeenCalledWith(sampleEvent);
    expect(handleClose).toHaveBeenCalled();
  });

  it('renders Draft status and handles escape key close', () => {
    const handleClose = vi.fn();
    const draftEvent = { ...sampleEvent, status: 'draft' };

    renderWithLang(
      <EventDetailsModal
        isOpen={true}
        onClose={handleClose}
        event={draftEvent}
        attendees={[]}
      />,
      'en'
    );

    expect(screen.getByTestId('event-details-status')).toHaveTextContent(/Draft/i);

    // Escape key
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalled();
  });

  // --------------------------------------------------------------------------
  // 2. Wiring Up Across Tabs
  // --------------------------------------------------------------------------
  it('EventsManagementTab provides Details button that triggers onViewDetails', () => {
    const handleViewDetails = vi.fn();

    renderWithLang(
      <EventsManagementTab
        events={[sampleEvent]}
        onViewDetails={handleViewDetails}
      />,
      'en'
    );

    const detailsBtn = screen.getByTestId(`btn-details-${sampleEvent.id}`);
    expect(detailsBtn).toBeInTheDocument();
    fireEvent.click(detailsBtn);
    expect(handleViewDetails).toHaveBeenCalledWith(sampleEvent);
  });

  it('SuperAdminOverview provides Drilldown button that triggers onViewDetails', () => {
    const handleViewDetails = vi.fn();

    renderWithLang(
      <SuperAdminOverview
        events={[sampleEvent]}
        onViewDetails={handleViewDetails}
      />,
      'en'
    );

    const drilldownBtn = screen.getByTestId(`btn-drilldown-${sampleEvent.id}`);
    expect(drilldownBtn).toBeInTheDocument();
    fireEvent.click(drilldownBtn);
    expect(handleViewDetails).toHaveBeenCalledWith(sampleEvent);
  });

  it('OrganizerOverview provides View Event Details button in focused header', () => {
    const handleViewDetails = vi.fn();

    renderWithLang(
      <OrganizerOverview
        selectedEvent={sampleEvent}
        attendees={sampleAttendees}
        onViewDetails={handleViewDetails}
      />,
      'en'
    );

    const viewDetailsBtn = screen.getByTestId('btn-view-event-details');
    expect(viewDetailsBtn).toBeInTheDocument();
    fireEvent.click(viewDetailsBtn);
    expect(handleViewDetails).toHaveBeenCalledWith(sampleEvent);
  });

  it('AdminDashboardPage manages details modal open and close flow', () => {
    renderWithLang(
      <AdminDashboardPage initialRole="super_admin" />,
      'en'
    );

    // On overview tab, click drilldown on first event
    const firstEventId = adminService.getAllEvents()[0].id;
    const drilldownBtn = screen.getByTestId(`btn-drilldown-${firstEventId}`);
    fireEvent.click(drilldownBtn);

    // Details modal opens
    expect(screen.getByTestId('event-details-modal')).toBeInTheDocument();

    // Close modal
    const closeBtn = screen.getByTestId('btn-modal-details-close');
    fireEvent.click(closeBtn);
    expect(screen.queryByTestId('event-details-modal')).not.toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // 3. Concurrency Stats & Expired Holds Flusher
  // --------------------------------------------------------------------------
  it('adminService.getConcurrencyStats correctly calculates expiredHolds count', () => {
    // Clear any seeded reservations for clean isolation
    mockTicketingService.seats.forEach((s) => {
      s.status = 'available';
      s.reservedUntil = null;
    });

    const initialStats = adminService.getConcurrencyStats('evt-symphony-2026');
    expect(initialStats.expiredHolds).toBe(0);
    expect(initialStats.reserved).toBe(0);
    expect(initialStats.total).toBe(STANDARD_VENUE_CAPACITY);

    // Simulate 3 reserved seats, 2 of which have expired hold timestamps (> 300s ago)
    const pastTimestamp = new Date(Date.now() - 360000).toISOString(); // 6 minutes ago
    const futureTimestamp = new Date(Date.now() + 200000).toISOString(); // Future

    mockTicketingService.seats[0].status = 'reserved';
    mockTicketingService.seats[0].reservedUntil = pastTimestamp;
    mockTicketingService.seats[0].eventId = 'evt-symphony-2026';

    mockTicketingService.seats[1].status = 'reserved';
    mockTicketingService.seats[1].reservedUntil = pastTimestamp;
    mockTicketingService.seats[1].eventId = 'evt-symphony-2026';

    mockTicketingService.seats[2].status = 'reserved';
    mockTicketingService.seats[2].reservedUntil = futureTimestamp;
    mockTicketingService.seats[2].eventId = 'evt-symphony-2026';

    const updatedStats = adminService.getConcurrencyStats('evt-symphony-2026');
    expect(updatedStats.reserved).toBe(3);
    expect(updatedStats.expiredHolds).toBe(2);
  });

  it('flushExpiredSeatHolds returns released_count and records audit log', async () => {
    const pastTimestamp = new Date(Date.now() - 360000).toISOString();
    mockTicketingService.seats[0].status = 'reserved';
    mockTicketingService.seats[0].reservedUntil = pastTimestamp;
    mockTicketingService.seats[0].eventId = 'evt-symphony-2026';

    const result = await adminService.flushExpiredSeatHolds('evt-symphony-2026');
    expect(result.success).toBe(true);
    expect(typeof result.released_count).toBe('number');
    expect(result.released_count).toBe(1);

    // Seat is released back to available
    expect(mockTicketingService.seats[0].status).toBe('available');
    expect(mockTicketingService.seats[0].reservedUntil).toBeNull();
  });

  it('SystemHealthTab explicitly displays 0 expired holds when none exist and displays freed count without [object Object]', async () => {
    const mockFlush = vi.fn().mockResolvedValue({ success: true, released_count: 5 });

    renderWithLang(
      <SystemHealthTab
        concurrencyStats={{ available: 515, reserved: 5, sold: 0, total: 520, expiredHolds: 0 }}
        onFlushHolds={mockFlush}
      />,
      'en'
    );

    // Shows 0 expired holds explicitly
    expect(screen.getByTestId('expired-holds-count')).toHaveTextContent('0');
    expect(screen.getByTestId('expired-holds-sub')).toHaveTextContent(/0 expired holds|0 مقاعد منتهية الصلاحية/i);

    // Click flush button
    const flushBtn = screen.getByTestId('btn-flush-system-health');
    fireEvent.click(flushBtn);

    expect(mockFlush).toHaveBeenCalled();

    // Verify feedback message contains exact number without [object Object]
    const feedback = await screen.findByTestId('flush-status-feedback');
    expect(feedback).toBeInTheDocument();
    expect(feedback).toHaveTextContent(/released 5|تم تحرير 5/i);
    expect(feedback.textContent).not.toContain('[object Object]');
  });
});
