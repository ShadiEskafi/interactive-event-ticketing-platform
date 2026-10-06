/**
 * Deterministic Mock Auth Provider for SPEC-03 Test Verification
 * Simulates Supabase GoTrue Auth API in-memory without network dependencies.
 */
export class MockAuthService {
  constructor(initialUser = null) {
    this.currentUser = initialUser;
    this.listeners = new Set();
  }

  async getSession() {
    return {
      session: this.currentUser ? { user: this.currentUser } : null,
      user: this.currentUser,
    };
  }

  async signInWithPassword({ email, password }) {
    if (!email || !password) {
      return { user: null, error: new Error('Email and password required') };
    }

    if (password === 'invalid-pass') {
      return { user: null, error: new Error('Invalid login credentials') };
    }

    const user = {
      id: `usr_${Math.random().toString(36).substring(2, 9)}`,
      email,
      user_metadata: {
        full_name: email.split('@')[0] || 'Valued Attendee',
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
      user_metadata: {
        full_name: fullName || email.split('@')[0] || 'New Attendee',
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
      user_metadata: {
        full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
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
