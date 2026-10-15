import { INITIAL_SUPER_ADMIN, PLATFORM_USERS_STORAGE_KEY } from '../features/admin/services/adminService';
import { supabase } from '../services/supabaseClient';

export const CLEAN_SLATE_KEY = 'ticketcraft_clean_slate_v20261012_pristine';

/**
 * Completely purges all legacy demo and test data from localStorage,
 * clears active auth sessions, and resets the platform state to pristine baseline
 * retaining exclusively the Super Admin.
 */
export function purgeClientDemoStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    const alreadyPurged = window.localStorage.getItem(CLEAN_SLATE_KEY);
    if (!alreadyPurged) {
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (
          key &&
          (key.startsWith('ticketcraft_') ||
            key.startsWith('sb-') ||
            key.includes('supabase') ||
            key.includes('auth-token'))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((k) => window.localStorage.removeItem(k));

      // Reset platform users exclusively to the Super Admin
      window.localStorage.setItem(
        PLATFORM_USERS_STORAGE_KEY,
        JSON.stringify([INITIAL_SUPER_ADMIN])
      );

      // Sign out Supabase auth client locally
      supabase.auth.signOut().catch(() => {});

      // Mark clean slate as applied
      window.localStorage.setItem(CLEAN_SLATE_KEY, 'true');
    }
  } catch (err) {
    console.warn('[cleanSlatePurge] Storage purge encountered error:', err);
  }
}
