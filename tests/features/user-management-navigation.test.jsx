import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MainNavbar } from '../../src/App';
import { AuthProvider } from '../../src/features/auth';
import { LanguageProvider } from '../../src/context';
import { MockAuthService } from '../mocks/mockAuthService';
import {
  adminService,
  INITIAL_SUPER_ADMIN,
} from '../../src/features/admin';
import { UsersManagementTab } from '../../src/features/admin/components/UsersManagementTab';
import { CreateUserModal } from '../../src/features/admin/components/CreateUserModal';
import { CreateGateStaffModal } from '../../src/features/admin/components/CreateGateStaffModal';

describe('Navigation Role-Based Visibility & User Management Security', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
    adminService.resetState();
    vi.clearAllMocks();
  });

  // =========================================================================
  // 1. Conditional Navbar & Strict Role-Based Visibility
  // =========================================================================
  describe('1. Conditional Navbar & Strict Role-Based Visibility', () => {
    it('Unauthenticated Visitor: strictly shows Home, Featured Events, and Sign In button; hides sensitive links', () => {
      const mockAuth = new MockAuthService(null);

      render(
        <LanguageProvider>
          <AuthProvider customAuthService={mockAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      // Visible links
      expect(screen.getByTestId('nav-link-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-events')).toBeInTheDocument();
      expect(screen.getByTestId('btn-nav-signin')).toBeInTheDocument();

      // Strictly hidden sensitive links
      expect(screen.queryByTestId('nav-link-my-tickets')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-scanner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-organizer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-admin')).not.toBeInTheDocument();
    });

    it('Authenticated Attendee: shows Home, Featured Events, and My Tickets only (+ Sign Out)', async () => {
      const attendeeUser = {
        id: 'usr-att-1',
        email: 'attendee@ticketcraft.com',
        role: 'attendee',
        user_metadata: { full_name: 'Regular Attendee', role: 'attendee' },
      };
      const mockAuth = new MockAuthService(attendeeUser);

      render(
        <LanguageProvider>
          <AuthProvider customAuthService={mockAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      await screen.findByTestId('user-profile-badge');

      // Permitted
      expect(screen.getByTestId('nav-link-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-events')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-my-tickets')).toBeInTheDocument();
      expect(screen.getByTestId('btn-signout')).toBeInTheDocument();

      // Forbidden
      expect(screen.queryByTestId('nav-link-scanner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-organizer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-admin')).not.toBeInTheDocument();
      expect(screen.queryByTestId('btn-nav-signin')).not.toBeInTheDocument();
    });

    it('Authenticated Gate Staff: shows Home and Gate Scanner only (+ Sign Out)', async () => {
      const gateStaffUser = {
        id: 'usr-gate-1',
        email: 'gatestaff@ticketcraft.com',
        role: 'gate_staff',
        user_metadata: { full_name: 'Gate 1 Operator', role: 'gate_staff' },
      };
      const mockAuth = new MockAuthService(gateStaffUser);

      render(
        <LanguageProvider>
          <AuthProvider customAuthService={mockAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      await screen.findByTestId('user-profile-badge');

      // Permitted
      expect(screen.getByTestId('nav-link-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-scanner')).toBeInTheDocument();
      expect(screen.getByTestId('btn-signout')).toBeInTheDocument();

      // Forbidden
      expect(screen.queryByTestId('nav-link-events')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-my-tickets')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-organizer')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-admin')).not.toBeInTheDocument();
    });

    it('Authenticated Organizer: shows Home, Featured Events, and Organizer Hub only (+ Sign Out)', async () => {
      const organizerUser = {
        id: 'usr-org-1',
        email: 'organizer@ticketcraft.com',
        role: 'organizer',
        user_metadata: { full_name: 'Festival Producer', role: 'organizer' },
      };
      const mockAuth = new MockAuthService(organizerUser);

      render(
        <LanguageProvider>
          <AuthProvider customAuthService={mockAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      await screen.findByTestId('user-profile-badge');

      // Permitted
      expect(screen.getByTestId('nav-link-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-events')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-organizer')).toBeInTheDocument();
      expect(screen.getByTestId('btn-signout')).toBeInTheDocument();

      // Forbidden
      expect(screen.queryByTestId('nav-link-my-tickets')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-scanner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-admin')).not.toBeInTheDocument();
    });

    it('Authenticated Super Admin: shows Home, Featured Events, and Admin Hub only (+ Sign Out)', async () => {
      const superAdminUser = {
        id: 'usr-admin-1',
        email: 'shadieskafi@gmail.com',
        role: 'super_admin',
        user_metadata: { full_name: 'Shadi Askafi', role: 'super_admin' },
      };
      const mockAuth = new MockAuthService(superAdminUser);

      render(
        <LanguageProvider>
          <AuthProvider customAuthService={mockAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      await screen.findByTestId('user-profile-badge');

      // Permitted
      expect(screen.getByTestId('nav-link-home')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-events')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-admin')).toBeInTheDocument();
      expect(screen.getByTestId('btn-signout')).toBeInTheDocument();

      // Forbidden
      expect(screen.queryByTestId('nav-link-my-tickets')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-scanner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-organizer')).not.toBeInTheDocument();
    });

    it('Mobile menu drawer strictly respects role-based gating when opened', () => {
      const guestAuth = new MockAuthService(null);

      render(
        <LanguageProvider>
          <AuthProvider customAuthService={guestAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      const toggleBtn = screen.getByTestId('mobile-menu-toggle');
      fireEvent.click(toggleBtn);

      const navCenter = screen.getByRole('navigation', { name: /Main Navigation/i });
      expect(navCenter.className).toContain('mobile-open');

      // Unauthenticated visitor in mobile drawer still cannot see sensitive links
      expect(screen.queryByTestId('nav-link-my-tickets')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-scanner')).not.toBeInTheDocument();
      expect(screen.queryByTestId('nav-link-admin')).not.toBeInTheDocument();
    });
  });

  // =========================================================================
  // 2. Purge Mock Users in adminService.js
  // =========================================================================
  describe('2. Super Admin Initial Baseline & Mock User Purge', () => {
    it('getUsers() contains ONLY the hardcoded Super Admin upon fresh start', () => {
      const users = adminService.getUsers();
      expect(users).toHaveLength(1);
      expect(users[0].email).toBe('shadieskafi@gmail.com');
      expect(users[0].role).toBe('super_admin');
      expect(users[0].id).toBe(INITIAL_SUPER_ADMIN.id);
    });

    it('resetToCleanState() purges all users and restores exclusively Super Admin', () => {
      // Create test runtime users
      adminService.createUser({
        name: 'Event Host',
        email: 'host@test.com',
        role: 'organizer',
      });
      adminService.createGateStaffUser({
        name: 'Gate Marshal',
        email: 'gate@test.com',
      });

      expect(adminService.getUsers()).toHaveLength(3);

      // Perform clean reset
      const resetRes = adminService.resetToCleanState();
      expect(resetRes.success).toBe(true);

      const usersAfterReset = adminService.getUsers();
      expect(usersAfterReset).toHaveLength(1);
      expect(usersAfterReset[0].email).toBe('shadieskafi@gmail.com');
      expect(usersAfterReset[0].role).toBe('super_admin');
    });
  });

  // =========================================================================
  // 3. User & Gate Staff Management
  // =========================================================================
  describe('3. User & Gate Staff Provisioning', () => {
    it('adminService.createUser provisions users of attendee, organizer, and gate_staff roles with audit logs', () => {
      const newOrganizer = adminService.createUser({
        name: 'Sara Organizer',
        name_ar: 'سارة المنظمة',
        email: 'sara@organizer.io',
        role: 'organizer',
      });

      expect(newOrganizer.id).toMatch(/^usr-organizer-/);
      expect(newOrganizer.role).toBe('organizer');
      expect(newOrganizer.status).toBe('active');

      const allUsers = adminService.getUsers();
      expect(allUsers.some((u) => u.email === 'sara@organizer.io')).toBe(true);

      const auditLogs = adminService.getAuditLogs();
      const userLog = auditLogs.find((l) => l.action === 'USER_CREATED');
      expect(userLog).toBeDefined();
      expect(userLog.target).toBe('sara@organizer.io');
    });

    it('CreateUserModal allows provisioning a new user with role selector', () => {
      const onSubmit = vi.fn();
      const onClose = vi.fn();

      render(
        <LanguageProvider>
          <CreateUserModal isOpen={true} onClose={onClose} onSubmit={onSubmit} />
        </LanguageProvider>
      );

      fireEvent.change(screen.getByTestId('input-user-name'), {
        target: { value: 'Karim Zaid' },
      });
      fireEvent.change(screen.getByTestId('input-user-email'), {
        target: { value: 'karim@test.com' },
      });
      fireEvent.change(screen.getByTestId('select-user-role'), {
        target: { value: 'organizer' },
      });

      fireEvent.click(screen.getByTestId('btn-user-submit'));

      expect(onSubmit).toHaveBeenCalledWith({
        name: 'Karim Zaid',
        name_ar: 'Karim Zaid',
        email: 'karim@test.com',
        password: 'TicketCraft2026!',
        role: 'organizer',
      });
    });

    it('CreateGateStaffModal quick templates fill Gate 1, Gate 2, and VIP Gate with 1 click', () => {
      const events = [
        { id: 'evt-symphony-2026', title: 'Grand Symphony Concert' },
      ];
      const onSubmit = vi.fn();

      render(
        <LanguageProvider>
          <CreateGateStaffModal
            isOpen={true}
            onClose={vi.fn()}
            events={events}
            onSubmit={onSubmit}
          />
        </LanguageProvider>
      );

      // 1. Click Gate 1 Template
      fireEvent.click(screen.getByTestId('template-gate-1'));
      expect(screen.getByTestId('input-staff-name')).toHaveValue('Gate 1 Operator');
      expect(screen.getByTestId('input-staff-email')).toHaveValue('gate1.symphony-2026@ticketcraft.com');
      expect(screen.getByTestId('input-staff-password')).toHaveValue('GatePass1!');

      // 2. Click Gate 2 Template
      fireEvent.click(screen.getByTestId('template-gate-2'));
      expect(screen.getByTestId('input-staff-name')).toHaveValue('Gate 2 Operator');
      expect(screen.getByTestId('input-staff-email')).toHaveValue('gate2.symphony-2026@ticketcraft.com');
      expect(screen.getByTestId('input-staff-password')).toHaveValue('GatePass2!');

      // 3. Click VIP Gate Template
      fireEvent.click(screen.getByTestId('template-gate-vip'));
      expect(screen.getByTestId('input-staff-name')).toHaveValue('VIP Gate Operator');
      expect(screen.getByTestId('input-staff-email')).toHaveValue('vipgate.symphony-2026@ticketcraft.com');
      expect(screen.getByTestId('input-staff-password')).toHaveValue('VIPPass2026!');

      // Submit VIP template
      fireEvent.click(screen.getByTestId('btn-staff-submit'));
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'VIP Gate Operator',
          email: 'vipgate.symphony-2026@ticketcraft.com',
          password: 'VIPPass2026!',
          assignedEventId: 'evt-symphony-2026',
        })
      );
    });

    it('UsersManagementTab renders "+ Add User" and "+ Add Gate Staff" buttons and opens provisioning modals', () => {
      const mockUsers = [
        INITIAL_SUPER_ADMIN,
        {
          id: 'usr-gate-test',
          name: 'Gate 1 Operator',
          email: 'gate1@ticketcraft.com',
          role: 'gate_staff',
          status: 'active',
        },
      ];
      const events = [{ id: 'evt-symphony-2026', title: 'Grand Symphony' }];
      const handleCreateUser = vi.fn();
      const handleCreateGateStaff = vi.fn();

      render(
        <LanguageProvider>
          <UsersManagementTab
            users={mockUsers}
            events={events}
            activeRole="super_admin"
            onCreateUser={handleCreateUser}
            onCreateGateStaff={handleCreateGateStaff}
          />
        </LanguageProvider>
      );

      // Verify buttons exist
      const addUserBtn = screen.getByTestId('btn-add-user');
      const addGateStaffBtn = screen.getByTestId('btn-add-gate-staff');
      expect(addUserBtn).toBeInTheDocument();
      expect(addGateStaffBtn).toBeInTheDocument();

      // Open Add User modal
      fireEvent.click(addUserBtn);
      expect(screen.getByTestId('create-user-modal')).toBeInTheDocument();

      // Close modal
      fireEvent.click(screen.getByTestId('btn-user-cancel'));
      expect(screen.queryByTestId('create-user-modal')).not.toBeInTheDocument();

      // Open Add Gate Staff modal
      fireEvent.click(addGateStaffBtn);
      expect(screen.getByTestId('create-gate-staff-modal')).toBeInTheDocument();
      expect(screen.getByTestId('gate-staff-quick-templates')).toBeInTheDocument();
    });

    it('UsersManagementTab allows Event Organizer to add Gate Staff pre-filtered to their events', () => {
      const mockUsers = [
        {
          id: 'usr-gate-test',
          name: 'Gate Marshal',
          email: 'marshal@ticketcraft.com',
          role: 'gate_staff',
          status: 'active',
        },
      ];
      const organizerEvents = [{ id: 'evt-cyberpunk-2026', title: 'Cyberpunk Night' }];

      render(
        <LanguageProvider>
          <UsersManagementTab
            users={mockUsers}
            events={organizerEvents}
            activeRole="organizer"
            selectedEventId="evt-cyberpunk-2026"
            onCreateGateStaff={vi.fn()}
          />
        </LanguageProvider>
      );

      // Organizers should see '+ Add Gate Staff' but not '+ Add User'
      expect(screen.getByTestId('btn-add-gate-staff')).toBeInTheDocument();
      expect(screen.queryByTestId('btn-add-user')).not.toBeInTheDocument();

      // Opening modal scopes events to organizer's events
      fireEvent.click(screen.getByTestId('btn-add-gate-staff'));
      expect(screen.getByTestId('create-gate-staff-modal')).toBeInTheDocument();

      // Quick template uses organizer event slug
      fireEvent.click(screen.getByTestId('template-gate-1'));
      expect(screen.getByTestId('input-staff-email')).toHaveValue('gate1.cyberpunk-2026@ticketcraft.com');
    });
  });
});
