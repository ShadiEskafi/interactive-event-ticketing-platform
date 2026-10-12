/**
 * Deterministic Mock Auth Provider for SPEC-03 Test Verification
 * Simulates Supabase GoTrue Auth API in-memory without network dependencies.
 */
export class MockAuthService {
  constructor(initialUser = null) {
    this.currentUser = initialUser;
    this.listeners = new Set();
  }

  isUserInvalidated(userId) {
    if (!userId) return false;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return Boolean(window.localStorage.getItem(`ticketcraft_invalidated_user_${userId}`));
      } catch {
        return false;
      }
    }
    return false;
  }

  clearUserInvalidation(userId) {
    if (!userId) return;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(`ticketcraft_invalidated_user_${userId}`);
      } catch {
        // Safe fallback
      }
    }
  }

  invalidateUser(userId) {
    if (!userId) return;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(`ticketcraft_invalidated_user_${userId}`, Date.now().toString());
      } catch {
        // Safe fallback
      }
    }
    if (this.currentUser && this.currentUser.id === userId) {
      this.clearUserInvalidation(userId);
      this.signOut();
    }
  }

  async getSession() {
    if (this.currentUser && this.isUserInvalidated(this.currentUser.id)) {
      this.clearUserInvalidation(this.currentUser.id);
      await this.signOut();
      return { session: null, user: null, invalidated: true };
    }

    return {
      session: this.currentUser ? { user: this.currentUser } : null,
      user: this.currentUser,
    };
  }

  async signInWithPassword({ email, password }) {
    if (!email || !password) {
      return { user: null, error: new Error('Email and password required') };
    }

    const normalizedEmail = (email || '').trim().toLowerCase();

    // Hardcoded Super Admin Authentication Check
    if (normalizedEmail === 'shadieskafi@gmail.com') {
      if (password === '1234567899') {
        const superAdminUser = {
          id: 'usr_super_admin_shadi',
          email: 'shadieskafi@gmail.com',
          role: 'super_admin',
          user_metadata: {
            full_name: 'Shadi Askafi',
            role: 'super_admin',
          },
          app_metadata: {
            role: 'super_admin',
          },
        };
        this.currentUser = superAdminUser;
        this.notifyAuthState(superAdminUser);
        return { user: superAdminUser, error: null };
      }
      return { user: null, error: new Error('Invalid email or password.') };
    }

    if (password === 'invalid-pass') {
      return { user: null, error: new Error('Invalid login credentials') };
    }

    const user = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email,
      role: 'attendee',
      user_metadata: {
        full_name: email.split('@')[0] || 'Valued Attendee',
        role: 'attendee',
      },
      app_metadata: {
        role: 'attendee',
      },
    };

    this.currentUser = user;
    this.notifyAuthState(user);

    return { user, error: null };
  }

  async signUp({ email, password, fullName }) {
    if (!email || !password) {
      return { user: null, error: new Error('Email and password required') };
    }

    const user = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email,
      role: 'attendee',
      user_metadata: {
        full_name: fullName || email.split('@')[0] || 'New Attendee',
        role: 'attendee',
      },
      app_metadata: {
        role: 'attendee',
      },
    };

    this.currentUser = user;
    this.notifyAuthState(user);

    return { user, error: null };
  }

  async signInWithOAuth(provider) {
    const user = {
      id: `usr_oauth_${provider}_${Math.random().toString(36).substring(2, 9)}`,
      email: `user.${provider}@example.com`,
      role: 'attendee',
      user_metadata: {
        full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        role: 'attendee',
      },
      app_metadata: {
        role: 'attendee',
      },
    };

    this.currentUser = user;
    this.notifyAuthState(user);

    return { user, error: null, provider };
  }

  async signOut() {
    this.currentUser = null;
    this.notifyAuthState(null);
    return { error: null };
  }

  onAuthStateChange(callback) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  notifyAuthState(user) {
    this.listeners.forEach((callback) => {
      try {
        callback(user);
      } catch {
        // Safe isolation
      }
    });
  }

  setUser(user) {
    this.currentUser = user;
    this.notifyAuthState(user);
  }

  reset() {
    this.currentUser = null;
    this.listeners.clear();
  }
}

export const mockAuthService = new MockAuthService();
