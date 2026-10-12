import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { AdminDashboardPage } from '../../src/features/admin/AdminDashboardPage';
import { adminService, STANDARD_VENUE_CAPACITY } from '../../src/features/admin/services/adminService';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';
import { LanguageProvider, useLanguage } from '../../src/context';
import { AuthProvider } from '../../src/features/auth';
import { MockAuthService } from '../mocks/mockAuthService';
import { AppContent, MainNavbar } from '../../src/App';

describe('Centralized Super Admin & Event Organizer Control Panel (FEAT-ADMIN-05)', () => {
  let mockAuth;

  beforeEach(() => {
    adminService.resetState();
    mockTicketingService.resetState();
    mockAuth = new MockAuthService(null);
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';

    if (!window.URL.createObjectURL) {
      window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
      window.URL.revokeObjectURL = vi.fn();
    }
    HTMLAnchorElement.prototype.click = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  });

  const renderDashboard = (props = {}) => {
    return render(
      <LanguageProvider>
        <AdminDashboardPage {...props} />
      </LanguageProvider>
    );
  };

  // --------------------------------------------------------------------------
  // Test 1: Platform KPIs in Super Admin Dashboard
  // --------------------------------------------------------------------------
  it('Test 1: Renders Super Admin Dashboard with Platform KPIs (GMV, Bookings, Active Events)', () => {
    renderDashboard({ initialRole: 'super_admin' });

    // Root page and header
    expect(screen.getByTestId('admin-dashboard-page')).toBeInTheDocument();
    expect(screen.getByTestId('admin-header')).toBeInTheDocument();
    expect(screen.getByTestId('super-admin-overview')).toBeInTheDocument();

    // Role badge indicates Super Admin
    expect(screen.getByTestId('admin-role-badge')).toHaveTextContent(/الأدمن الأعلى|Super Admin/i);

    // Platform KPIs
    const gmvCard = screen.getByTestId('kpi-card-gmv');
    expect(gmvCard).toBeInTheDocument();
    expect(gmvCard).toHaveTextContent(/GMV/i);
    expect(gmvCard).toHaveTextContent(/\$145,050/i);

    const ticketsCard = screen.getByTestId('kpi-card-tickets');
    expect(ticketsCard).toBeInTheDocument();
    expect(ticketsCard).toHaveTextContent(/1,342/i);

    const eventsCard = screen.getByTestId('kpi-card-events');
    expect(eventsCard).toBeInTheDocument();
    expect(eventsCard).toHaveTextContent(/Active Events|الفعاليات/i);

    // Active holds alert banner
    expect(screen.getByTestId('concurrency-alert-banner')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 2: Role Switcher
  // --------------------------------------------------------------------------
  it('Test 2: Role Switcher allows viewing Super Admin or Organizer Workspace', () => {
    const { unmount } = renderDashboard({ initialRole: 'super_admin' });

    expect(screen.getByTestId('super-admin-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('organizer-overview')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-role-badge')).toHaveTextContent(/الأدمن الأعلى|Super Admin/i);
    unmount();

    // Render with organizer role
    renderDashboard({ initialRole: 'organizer' });

    // Now organizer view is mounted and super admin overview unmounted
    expect(screen.getByTestId('organizer-overview')).toBeInTheDocument();
    expect(screen.queryByTestId('super-admin-overview')).not.toBeInTheDocument();

    // Badge reflects Organizer
    expect(screen.getByTestId('admin-role-badge')).toHaveTextContent(/منشئ الحدث|Event Creator/i);
  });

  // --------------------------------------------------------------------------
  // Test 3: Organizer View & Seat Tier Breakdown
  // --------------------------------------------------------------------------
  it('Test 3: Organizer View renders organizer KPIs and seat tier breakdown', () => {
    renderDashboard({ initialRole: 'organizer' });

    expect(screen.getByTestId('organizer-overview')).toBeInTheDocument();

    // Organizer KPIs
    expect(screen.getByTestId('org-kpi-revenue')).toBeInTheDocument();
    expect(screen.getByTestId('org-kpi-sold')).toHaveTextContent(/520/);
    expect(screen.getByTestId('org-kpi-checkin')).toBeInTheDocument();

    // Seating Tier breakdown card
    const tierCard = screen.getByTestId('tier-breakdown-card');
    expect(tierCard).toBeInTheDocument();
    expect(tierCard).toHaveTextContent(/VIP/i);
    expect(tierCard).toHaveTextContent(/Regular|الدرجة العادية/i);
    expect(tierCard).toHaveTextContent(/Balcony|الشرفة/i);

    // Launch Gate Scanner CTA button
    expect(screen.getByTestId('btn-launch-gate-scanner')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 4: Fixed Capacity Cap enforcement in Event Wizard
  // --------------------------------------------------------------------------
  it('Test 4: Fixed Capacity Cap enforcement: Modal displays 520 seats cap and creates new event with tier pricing', () => {
    renderDashboard({ initialRole: 'organizer' });

    // Open create event modal
    fireEvent.click(screen.getByTestId('btn-create-event'));

    expect(screen.getByTestId('create-edit-event-modal')).toBeInTheDocument();

    // Verify 520 seats fixed capacity cap notice banner is displayed
    const noticeBanner = screen.getByTestId('capacity-notice-banner');
    expect(noticeBanner).toBeInTheDocument();
    expect(noticeBanner).toHaveTextContent(/520|٥٢٠/);
    expect(noticeBanner).toHaveTextContent(/٥٢٠ مقعداً|520 Interactive Seats/i);

    // Fill event fields
    const titleInput = screen.getByTestId('input-title');
    const titleArInput = screen.getByTestId('input-title-ar');
    fireEvent.change(titleInput, { target: { value: 'Symphony Under The Stars' } });
    fireEvent.change(titleArInput, { target: { value: 'سيمفونية تحت النجوم' } });

    // Fill tier pricing
    const vipInput = screen.getByTestId('input-price-vip');
    const regInput = screen.getByTestId('input-price-reg');
    const balInput = screen.getByTestId('input-price-bal');

    fireEvent.change(vipInput, { target: { value: '180' } });
    fireEvent.change(regInput, { target: { value: '85' } });
    fireEvent.change(balInput, { target: { value: '50' } });

    // Submit form
    fireEvent.click(screen.getByTestId('btn-modal-submit'));

    // Modal closed and toast alert shown
    expect(screen.queryByTestId('create-edit-event-modal')).not.toBeInTheDocument();
    expect(screen.getByTestId('admin-toast')).toBeInTheDocument();

    // Verify event in adminService has 520 fixed capacity and correct pricing
    const allEvents = adminService.getAllEvents();
    const createdEvent = allEvents.find((e) => e.title === 'Symphony Under The Stars');
    expect(createdEvent).toBeDefined();
    expect(createdEvent.capacity).toBe(`${STANDARD_VENUE_CAPACITY} Seats`);
    expect(createdEvent.tierPricing).toEqual({
      vip: 180,
      regular: 85,
      balcony: 50,
    });
  });

  // --------------------------------------------------------------------------
  // Test 5: Attendee Roster & UTF-8 BOM CSV Export
  // --------------------------------------------------------------------------
  it('Test 5: Attendee Roster renders ticket holders and triggers UTF-8 BOM CSV export', () => {
    // Seed attendee ticket in mockTicketingService for clean runtime testing
    mockTicketingService.tickets = [
      {
        id: 'att-sym-01',
        ticket_code: 'TC-SYM-9011',
        attendee_name: 'Tariq Mansoor',
        attendee_email: 'tariq.m@example.com',
        seat_id: 'A-1',
        tier: 'VIP',
        price: 150,
        is_used: true,
        scanned_at: '2026-11-14T19:35:10Z',
        event_id: 'evt-symphony-2026',
      },
    ];

    // Spy on exportAttendeesCSV
    const exportSpy = vi.spyOn(adminService, 'exportAttendeesCSV');

    renderDashboard({ initialRole: 'super_admin' });

    // Navigate to Attendees tab
    fireEvent.click(screen.getByTestId('tab-attendees'));
    expect(screen.getByTestId('attendee-roster-tab')).toBeInTheDocument();

    // Verify attendee rows
    expect(screen.getByText('Tariq Mansoor')).toBeInTheDocument();
    expect(screen.getByText('TC-SYM-9011')).toBeInTheDocument();

    // Trigger CSV export
    const exportBtn = screen.getByTestId('btn-export-csv');
    fireEvent.click(exportBtn);

    expect(exportSpy).toHaveBeenCalled();

    // Verify CSV content structure with UTF-8 BOM (\uFEFF)
    const rawCSV = exportSpy.mock.results[0].value;
    expect(rawCSV.startsWith('\uFEFF')).toBe(true);
    expect(rawCSV).toContain('Ticket Code,Attendee Name,Email,Seat,Tier,Price,Status,Scanned At');
    expect(rawCSV).toContain('Tariq Mansoor');

    // Toast alert shown
    expect(screen.getByTestId('admin-toast')).toBeInTheDocument();
  });

  // --------------------------------------------------------------------------
  // Test 6: System Concurrency Flush
  // --------------------------------------------------------------------------
  it('Test 6: System Concurrency Flush: clicking flush button calls releaseExpiredSeats and shows success alert', async () => {
    const releaseSpy = vi.spyOn(mockTicketingService, 'releaseExpiredSeats');

    renderDashboard({ initialRole: 'super_admin' });

    const flushBtn = screen.getByTestId('btn-flush-holds');
    fireEvent.click(flushBtn);

    expect(releaseSpy).toHaveBeenCalled();

    // Notification toast alert appears
    const toast = await screen.findByTestId('admin-toast');
    expect(toast).toBeInTheDocument();
    expect(toast).toHaveTextContent(/Holds flushed successfully|تم تحرير المقاعد المعلقة بنجاح/i);
  });

  // --------------------------------------------------------------------------
  // Test 7: Bilingual Support (Arabic RTL & English LTR)
  // --------------------------------------------------------------------------
  it('Test 7: Bilingual Support: Dashboard renders correctly in Arabic and switches to English', () => {
    function BilingualTestHost() {
      const { toggleLanguage } = useLanguage();
      return (
        <div>
          <button data-testid="test-toggle-lang" onClick={toggleLanguage}>
            Toggle Language
          </button>
          <AdminDashboardPage initialRole="super_admin" />
        </div>
      );
    }

    render(
      <LanguageProvider>
        <BilingualTestHost />
      </LanguageProvider>
    );

    // Initial default language is Arabic (RTL)
    expect(screen.getByTestId('admin-header')).toHaveTextContent('مركز التحكم وإدارة المنصة');
    expect(screen.getByTestId('admin-role-badge')).toHaveTextContent(/الأدمن الأعلى/);

    // Toggle language to English
    act(() => {
      fireEvent.click(screen.getByTestId('test-toggle-lang'));
    });

    // Content switches to English (LTR)
    expect(screen.getByTestId('admin-header')).toHaveTextContent('Centralized Control Panel');
    expect(screen.getByTestId('admin-role-badge')).toHaveTextContent(/Super Admin/);
    expect(screen.getByTestId('kpi-card-gmv')).toHaveTextContent('Platform GMV');
  });

  // --------------------------------------------------------------------------
  // Test 8: MainNavbar Integration & Routing
  // --------------------------------------------------------------------------
  it('Test 8: Navbar integration: MainNavbar renders Admin Hub link and navigates to admin view', async () => {
    mockAuth = new MockAuthService({
      id: 'usr-super-admin',
      email: 'shadieskafi@gmail.com',
      role: 'super_admin',
      user_metadata: { full_name: 'Shadi Askafi', role: 'super_admin' },
    });

    render(
      <LanguageProvider>
        <AuthProvider customAuthService={mockAuth}>
          <AppContent />
        </AuthProvider>
      </LanguageProvider>
    );

    // Wait for auth initialization to complete
    await screen.findByTestId('user-profile-badge');

    // Admin link exists in MainNavbar
    const adminNavLink = screen.getByTestId('nav-link-admin');
    expect(adminNavLink).toBeInTheDocument();
    expect(adminNavLink).toHaveTextContent(/لوحة التحكم|لوحة الإدارة|Admin Hub/i);

    // Initially on landing page
    expect(screen.queryByTestId('admin-dashboard-page')).not.toBeInTheDocument();

    // Click Admin Hub navigation link
    await act(async () => {
      fireEvent.click(adminNavLink);
    });

    // Admin dashboard page view is now mounted
    expect(await screen.findByTestId('admin-dashboard-page')).toBeInTheDocument();
    expect(adminNavLink).toHaveClass('active');

    // Also test standalone MainNavbar with onSelectView prop
    const mockSelectView = vi.fn();
    render(
      <LanguageProvider>
        <AuthProvider customAuthService={mockAuth}>
          <MainNavbar activeView="admin" onSelectView={mockSelectView} />
        </AuthProvider>
      </LanguageProvider>
    );

    const isolatedAdminBtn = screen.getAllByTestId('nav-link-admin')[1];
    expect(isolatedAdminBtn).toHaveClass('active');
    fireEvent.click(isolatedAdminBtn);
    expect(mockSelectView).toHaveBeenCalledWith('admin');
  });
});
