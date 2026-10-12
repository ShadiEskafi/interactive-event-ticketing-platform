/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import {
  canAccessRoute,
  getDefaultRouteForRole,
  getUserRole,
  normalizeRoute,
  ROUTE_PERMISSIONS,
} from './routeGuardUtils';
import { ShieldAlertIcon } from '../../../components/common/Icons';

// Re-export utility functions so RouteGuard.jsx satisfies helper export requirements
export {
  canAccessRoute,
  getDefaultRouteForRole,
  getUserRole,
  normalizeRoute,
  ROUTE_PERMISSIONS,
};

/**
 * Custom Hook to evaluate access for the current authenticated user
 * @param {string} route
 */
export function useRouteGuard(route) {
  const { user } = useAuth();
  const hasAccess = canAccessRoute(user, route);
  const role = getUserRole(user);
  const defaultRoute = getDefaultRouteForRole(role);

  return {
    hasAccess,
    user,
    role,
    defaultRoute,
  };
}

/**
 * RouteGuard Component
 * Wraps view components and enforces strict RBAC based on user role.
 */
export function RouteGuard({
  user: propUser,
  route,
  children,
  fallback = null,
  redirectToDefault = false,
  onUnauthorized = null,
  onNavigate = null,
}) {
  const authContext = useAuth();
  const effectiveUser = propUser !== undefined ? propUser : authContext?.user;

  const isAllowed = canAccessRoute(effectiveUser, route);

  useEffect(() => {
    if (!isAllowed) {
      if (onUnauthorized) {
        onUnauthorized(route, effectiveUser);
      }
      if (redirectToDefault && onNavigate) {
        const dest = getDefaultRouteForRole(effectiveUser);
        onNavigate(dest);
      }
    }
  }, [isAllowed, route, effectiveUser, redirectToDefault, onUnauthorized, onNavigate]);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback !== null) {
    return <>{fallback}</>;
  }

  return (
    <section
      className="route-guard-denied-container"
      data-testid="route-guard-denied"
      role="alert"
      aria-live="assertive"
      style={{
        padding: '3rem 1.5rem',
        textAlign: 'center',
        maxWidth: '560px',
        margin: '2rem auto',
        backgroundColor: '#1e293b',
        color: '#f8fafc',
        borderRadius: '12px',
        border: '1px solid #ef4444',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem', color: '#ef4444' }}>
        <ShieldAlertIcon size={48} />
      </div>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#f87171' }}>
        Access Restricted / غير مصرح بالدخول
      </h2>
      <p style={{ color: '#cbd5e1', lineHeight: '1.6', marginBottom: '1.5rem' }}>
        You do not have the required permissions to view the <code>{route}</code> view.
        <br />
        هذه الصفحة مخصصة لذوي الصلاحيات المحددة فقط.
      </p>
      {onNavigate && (
        <button
          type="button"
          onClick={() => onNavigate(getDefaultRouteForRole(effectiveUser))}
          data-testid="route-guard-fallback-btn"
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          Return to Permitted View / العودة للصفحة المسموحة
        </button>
      )}
    </section>
  );
}

export default RouteGuard;
