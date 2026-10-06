/**
 * Authentication Service Abstraction (SPEC-03 / FEAT-AUTH-03)
 * Provides authentication interface for Email/Password and OAuth.
 */
class AuthService {
  constructor() {
    this.currentUser = null;
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
      return { user: null, error: new Error('Email and password are required.') };
    }

    if (password === 'invalid-pass') {
      return { user: null, error: new Error('Invalid email or password.') };
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
      return { user: null, error: new Error('Email and password are required.') };
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
      email: `attendee.${provider}@example.com`,
      user_metadata: {
        full_name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} Attendee`,
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

  // Helper for test state overrides
  setUser(user) {
    this.currentUser = user;
    this.notifyAuthState(user);
  }
}

export const authService = new AuthService();
