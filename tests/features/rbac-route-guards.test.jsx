import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { authService } from '../../src/services/authService';
import { MockAuthService } from '../mocks/mockAuthService';
import {
  canAccessRoute,
  getDefaultRouteForRole,
  RouteGuard,
  AuthProvider,
  useAuth,
} from '../../src/features/auth';

describe('RBAC, Super Admin, Route Guards & Session Invalidation', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  // =========================================================================
  // 1. Hardcoded Super Admin Credentials
  // =========================================================================
  describe('Task 1: Hardcoded Super Admin Credentials', () => {
    it('authenticates shadieskafi@gmail.com with 1234567899 as super_admin in authService', async () => {
      const result = await authService.signInWithPassword({
        email: 'shadieskafi@gmail.com',
        password: '1234567899',
      });

      expect(result.error).toBeNull();
      expect(result.user).not.toBeNull();
      expect(result.user.email).toBe('shadieskafi@gmail.com');
      expect(result.user.role).toBe('super_admin');
      expect(result.user.user_metadata).toEqual({
        full_name: 'Shadi Askafi',
        role: 'super_admin',
      });
    });

    it('authenticates shadieskafi@gmail.com with 1234567899 as super_admin in MockAuthService', async () => {
      const mockAuth = new MockAuthService(null);
      const result = await mockAuth.signInWithPassword({
        email: 'shadieskafi@gmail.com',
        password: '1234567899',
      });

      expect(result.error).toBeNull();
      expect(result.user).not.toBeNull();
      expect(result.user.email).toBe('shadieskafi@gmail.com');
      expect(result.user.role).toBe('super_admin');
      expect(result.user.user_metadata).toEqual({
        full_name: 'Shadi Askafi',
        role: 'super_admin',
      });
    });

    it('rejects shadieskafi@gmail.com with wrong password with Invalid email or password error', async () => {
      // In authService
      const resReal = await authService.signInWithPassword({
        email: 'shadieskafi@gmail.com',
        password: 'wrong_password_999',
      });
      expect(resReal.user).toBeNull();
      expect(resReal.error).not.toBeNull();
      expect(resReal.error.message).toBe('Invalid email or password.');

      // In mockAuthService
      const mockAuth = new MockAuthService(null);
      const resMock = await mockAuth.signInWithPassword({
        email: 'shadieskafi@gmail.com',
        password: 'wrong_password_999',
      });
      expect(resMock.user).toBeNull();
      expect(resMock.error).not.toBeNull();
      expect(resMock.error.message).toBe('Invalid email or password.');
    });

    it('ensures regular attendees register with role: attendee', async () => {
      const resReal = await authService.signUp({
        email: 'regular_attendee@test.com',
        password: 'password123',
        fullName: 'John Doe',
      });
      expect(resReal.error).toBeNull();
      expect(resReal.user.role).toBe('attendee');
      expect(resReal.user.user_metadata.role).toBe('attendee');

      const mockAuth = new MockAuthService(null);
      const resMock = await mockAuth.signUp({
        email: 'regular_attendee_mock@test.com',
        password: 'password123',
        fullName: 'Jane Doe',
      });
      expect(resMock.error).toBeNull();
      expect(resMock.user.role).toBe('attendee');
      expect(resMock.user.user_metadata.role).toBe('attendee');
    });
  });

  // =========================================================================
  // 2. Route Guards & Smart Redirection
  // =========================================================================
  describe('Task 2: Route Guards & Smart Redirection', () => {
    const superAdminUser = { id: 'usr-1', role: 'super_admin' };
    const organizerUser = { id: 'usr-2', role: 'organizer' };
    const gateStaffUser = { id: 'usr-3', role: 'gate_staff' };
    const attendeeUser = { id: 'usr-4', role: 'attendee' };
    const guestUser = null;

    it('strictly enforces /admin access exclusively to super_admin', () => {
      expect(canAccessRoute(superAdminUser, '/admin')).toBe(true);
      expect(canAccessRoute(superAdminUser, 'admin')).toBe(true);
      expect(canAccessRoute(superAdminUser, '/admin/settings')).toBe(true);

      expect(canAccessRoute(organizerUser, '/admin')).toBe(false);
      expect(canAccessRoute(gateStaffUser, '/admin')).toBe(false);
      expect(canAccessRoute(attendeeUser, '/admin')).toBe(false);
      expect(canAccessRoute(guestUser, '/admin')).toBe(false);
    });

    it('enforces /organizer access for organizer and super_admin', () => {
      expect(canAccessRoute(superAdminUser, '/organizer')).toBe(true);
      expect(canAccessRoute(organizerUser, '/organizer')).toBe(true);
      expect(canAccessRoute(organizerUser, 'organizer')).toBe(true);

      expect(canAccessRoute(gateStaffUser, '/organizer')).toBe(false);
      expect(canAccessRoute(attendeeUser, '/organizer')).toBe(false);
      expect(canAccessRoute(guestUser, '/organizer')).toBe(false);
    });

    it('enforces /scanner access for gate_staff and super_admin', () => {
      expect(canAccessRoute(superAdminUser, '/scanner')).toBe(true);
      expect(canAccessRoute(gateStaffUser, '/scanner')).toBe(true);
      expect(canAccessRoute(gateStaffUser, 'scanner')).toBe(true);

      expect(canAccessRoute(organizerUser, '/scanner')).toBe(false);
      expect(canAccessRoute(attendeeUser, '/scanner')).toBe(false);
      expect(canAccessRoute(guestUser, '/scanner')).toBe(false);
    });

    it('allows all users to access /tickets, /booking, and /', () => {
      const testUsers = [superAdminUser, organizerUser, gateStaffUser, attendeeUser, guestUser];
      const publicRoutes = ['/tickets', 'tickets', '/booking', 'booking', '/', '/landing'];

      for (const u of testUsers) {
        for (const r of publicRoutes) {
          expect(canAccessRoute(u, r)).toBe(true);
        }
      }
    });

    it('resolves smart role redirection correctly', () => {
      expect(getDefaultRouteForRole('super_admin')).toBe('admin');
      expect(getDefaultRouteForRole('organizer')).toBe('organizer');
      expect(getDefaultRouteForRole('gate_staff')).toBe('scanner');
      expect(getDefaultRouteForRole('attendee')).toBe('tickets');
      expect(getDefaultRouteForRole('attendee', 'landing')).toBe('landing');
      expect(getDefaultRouteForRole(null)).toBe('landing');

      // Also accepts user object
      expect(getDefaultRouteForRole(superAdminUser)).toBe('admin');
      expect(getDefaultRouteForRole(organizerUser)).toBe('organizer');
      expect(getDefaultRouteForRole(gateStaffUser)).toBe('scanner');
      expect(getDefaultRouteForRole(attendeeUser)).toBe('tickets');
    });

    it('renders children when route access is permitted in <RouteGuard>', () => {
      render(
        <RouteGuard user={superAdminUser} route="/admin">
          <div data-testid="admin-panel">Admin Controls</div>
        </RouteGuard>
      );

      expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
      expect(screen.queryByTestId('route-guard-denied')).not.toBeInTheDocument();
    });

    it('renders denied fallback and triggers callback when unauthorized', () => {
      const handleUnauthorized = vi.fn();
      render(
        <RouteGuard
          user={attendeeUser}
          route="/admin"
          onUnauthorized={handleUnauthorized}
        >
          <div data-testid="admin-panel">Admin Controls</div>
        </RouteGuard>
      );

      expect(screen.queryByTestId('admin-panel')).not.toBeInTheDocument();
      expect(screen.getByTestId('route-guard-denied')).toBeInTheDocument();
      expect(handleUnauthorized).toHaveBeenCalledWith('/admin', attendeeUser);
    });

    it('triggers redirection callback when redirectToDefault is true', () => {
      const handleNavigate = vi.fn();
      render(
        <RouteGuard
          user={organizerUser}
          route="/admin"
          redirectToDefault={true}
          onNavigate={handleNavigate}
        >
          <div data-testid="admin-panel">Admin Controls</div>
        </RouteGuard>
      );

      expect(handleNavigate).toHaveBeenCalledWith('organizer');
    });
  });

  // =========================================================================
  // 3. Session Invalidation
  // =========================================================================
  describe('Task 3: Session Invalidation', () => {
    it('invalidates active session when ticketcraft_invalidated_user_${userId} is set in localStorage', async () => {
      const testUser = {
        id: 'usr_target_123',
        email: 'victim@example.com',
        role: 'attendee',
      };
      const mockAuth = new MockAuthService(testUser);
      const signOutSpy = vi.spyOn(mockAuth, 'signOut');

      // Set invalidation flag in storage
      window.localStorage.setItem('ticketcraft_invalidated_user_usr_target_123', Date.now().toString());

      // Attempt getSession
      const sessionResult = await mockAuth.getSession();

      expect(signOutSpy).toHaveBeenCalled();
      expect(sessionResult.invalidated).toBe(true);
      expect(sessionResult.user).toBeNull();
      expect(sessionResult.session).toBeNull();
      expect(window.localStorage.getItem('ticketcraft_invalidated_user_usr_target_123')).toBeNull();
    });

    it('signs out user and notifies re-authentication in AuthProvider on invalidation', async () => {
      const testUser = {
        id: 'usr_target_456',
        email: 'attendee_promoted@example.com',
        role: 'attendee',
      };
      const mockAuth = new MockAuthService(testUser);

      // Invalidate the user
      window.localStorage.setItem('ticketcraft_invalidated_user_usr_target_456', Date.now().toString());

      function TestConsumer() {
        const { user, authError } = useAuth();
        return (
          <div>
            <div data-testid="user-state">{user ? user.email : 'logged-out'}</div>
            <div data-testid="auth-error">{authError || 'none'}</div>
          </div>
        );
      }

      render(
        <AuthProvider customAuthService={mockAuth}>
          <TestConsumer />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('user-state')).toHaveTextContent('logged-out');
        expect(screen.getByTestId('auth-error')).toHaveTextContent(/privileges were updated/i);
      });
    });

    it('invalidateUser helper sets storage flag and signs out current user if matching', () => {
      const testUser = { id: 'usr_self_inv', email: 'me@example.com', role: 'attendee' };
      const mockAuth = new MockAuthService(testUser);
      const signOutSpy = vi.spyOn(mockAuth, 'signOut');

      mockAuth.invalidateUser('usr_self_inv');

      expect(signOutSpy).toHaveBeenCalled();
    });
  });
});
