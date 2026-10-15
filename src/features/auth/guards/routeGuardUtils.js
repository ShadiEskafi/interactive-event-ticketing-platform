/**
 * Route Permission Definitions & RBAC Rules
 * - /admin: strictly super_admin
 * - /organizer: organizer and super_admin
 * - /scanner: gate_staff and super_admin
 * - /tickets, /booking, /: all users
 */
export const ROUTE_PERMISSIONS = {
  ADMIN: { path: '/admin', roles: ['super_admin'] },
  ORGANIZER: { path: '/organizer', roles: ['organizer', 'super_admin'] },
  SCANNER: { path: '/scanner', roles: ['gate_staff', 'super_admin'] },
  PUBLIC: ['/tickets', '/booking', '/', '/landing'],
};

const VALID_APP_ROLES = ['super_admin', 'organizer', 'gate_staff', 'attendee'];

/**
 * Safely extracts user role from user object
 * @param {Object|null} user
 * @returns {string|null}
 */
export function getUserRole(user) {
  if (!user) return null;

  // Primary super admin override - shadieskafi@gmail.com is ALWAYS super_admin
  const email = (user.email || user.user_metadata?.email || '').trim().toLowerCase();
  if (email === 'shadieskafi@gmail.com') {
    return 'super_admin';
  }

  // Check valid application role on user.role (ignore internal Supabase roles like 'authenticated' or 'anon')
  if (user.role && VALID_APP_ROLES.includes(user.role)) {
    return user.role;
  }

  // Check metadata roles
  const metaRole = user.user_metadata?.role || user.app_metadata?.role;
  if (metaRole && VALID_APP_ROLES.includes(metaRole)) {
    return metaRole;
  }

  // Check attached profile role
  if (user.profile?.role && VALID_APP_ROLES.includes(user.profile.role)) {
    return user.profile.role;
  }

  // If user is authenticated in Supabase but no specific role was assigned, default to attendee
  if (user.role === 'authenticated' || user.aud === 'authenticated') {
    return 'attendee';
  }

  return user.role || null;
}

/**
 * Normalizes route path (handles /admin, admin, subpaths, trailing slashes)
 * @param {string} route
 * @returns {string}
 */
export function normalizeRoute(route) {
  if (!route) return '/';
  let cleaned = String(route).trim().split('?')[0].split('#')[0];
  if (!cleaned.startsWith('/')) {
    cleaned = '/' + cleaned;
  }
  if (cleaned.length > 1 && cleaned.endsWith('/')) {
    cleaned = cleaned.slice(0, -1);
  }
  return cleaned.toLowerCase();
}

/**
 * Strict RBAC Route Access Evaluation
 * - /admin: strictly super_admin. Non-admins cannot access.
 * - /organizer: organizer and super_admin.
 * - /scanner: gate_staff and super_admin.
 * - /tickets, /booking, /: all users.
 *
 * @param {Object|null} user
 * @param {string} route
 * @returns {boolean}
 */
export function canAccessRoute(user, route) {
  const normalized = normalizeRoute(route);
  const role = getUserRole(user);

  // 1. /admin: strictly super_admin. Non-admins cannot access.
  if (normalized === '/admin' || normalized.startsWith('/admin/')) {
    return role === 'super_admin';
  }

  // 2. /organizer: organizer and super_admin
  if (normalized === '/organizer' || normalized.startsWith('/organizer/')) {
    return role === 'organizer' || role === 'super_admin';
  }

  // 3. /scanner: gate_staff and super_admin
  if (normalized === '/scanner' || normalized.startsWith('/scanner/')) {
    return role === 'gate_staff' || role === 'super_admin';
  }

  // 4. /tickets, /booking, /: all users
  if (
    normalized === '/' ||
    normalized === '/landing' ||
    normalized === '/booking' ||
    normalized.startsWith('/booking/') ||
    normalized === '/tickets' ||
    normalized.startsWith('/tickets/')
  ) {
    return true;
  }

  // Default for unknown public routes
  return true;
}

/**
 * Smart Role Redirection Resolution
 * - super_admin -> 'admin'
 * - organizer -> 'organizer'
 * - gate_staff -> 'scanner'
 * - attendee -> 'tickets' or 'landing'
 *
 * @param {string|Object|null} roleOrUser
 * @param {string} [defaultAttendeeRoute='tickets']
 * @returns {string}
 */
export function getDefaultRouteForRole(roleOrUser, defaultAttendeeRoute = 'tickets') {
  const role =
    typeof roleOrUser === 'object' && roleOrUser !== null
      ? getUserRole(roleOrUser)
      : roleOrUser;

  switch (role) {
    case 'super_admin':
      return 'admin';
    case 'organizer':
      return 'organizer';
    case 'gate_staff':
      return 'scanner';
    case 'attendee':
      return defaultAttendeeRoute || 'tickets';
    default:
      return 'landing';
  }
}
