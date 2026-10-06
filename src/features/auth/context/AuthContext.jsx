import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './authContextInstance';
import { authService as defaultAuthService } from '../../../services/authService';

export function AuthProvider({ children, customAuthService }) {
  const service = customAuthService || defaultAuthService;

  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { session: currentSession, user: currentUser } = await service.getSession();
        if (isMounted) {
          setSession(currentSession);
          setUser(currentUser);
        }
      } catch (err) {
        if (isMounted) {
          setAuthError(err.message || 'Failed to initialize session');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    const unsubscribe = service.onAuthStateChange((updatedUser) => {
      if (isMounted) {
        setUser(updatedUser);
        setSession(updatedUser ? { user: updatedUser } : null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [service]);

  const signIn = useCallback(
    async ({ email, password }) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const result = await service.signInWithPassword({ email, password });
        if (result.error) {
          setAuthError(result.error.message || 'Invalid email or password.');
          return { success: false, error: result.error };
        }
        setUser(result.user);
        setSession({ user: result.user });
        return { success: true, user: result.user };
      } catch (err) {
        const msg = err.message || 'Authentication error';
        setAuthError(msg);
        return { success: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const signUp = useCallback(
    async ({ email, password, fullName }) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const result = await service.signUp({ email, password, fullName });
        if (result.error) {
          setAuthError(result.error.message || 'Registration failed.');
          return { success: false, error: result.error };
        }
        setUser(result.user);
        setSession({ user: result.user });
        return { success: true, user: result.user };
      } catch (err) {
        const msg = err.message || 'Registration error';
        setAuthError(msg);
        return { success: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const signInWithOAuth = useCallback(
    async (provider) => {
      setIsLoading(true);
      setAuthError(null);
      try {
        const result = await service.signInWithOAuth(provider);
        if (result.error) {
          setAuthError(result.error.message || 'OAuth error.');
          return { success: false, error: result.error };
        }
        setUser(result.user);
        setSession({ user: result.user });
        return { success: true, user: result.user };
      } catch (err) {
        const msg = err.message || 'OAuth authentication failed';
        setAuthError(msg);
        return { success: false, error: err };
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await service.signOut();
      setUser(null);
      setSession(null);
      setAuthError(null);
    } finally {
      setIsLoading(false);
    }
  }, [service]);

  const clearError = useCallback(() => {
    setAuthError(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      session,
      isLoading,
      authError,
      signIn,
      signUp,
      signInWithOAuth,
      signOut,
      clearError,
    }),
    [user, session, isLoading, authError, signIn, signUp, signInWithOAuth, signOut, clearError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
