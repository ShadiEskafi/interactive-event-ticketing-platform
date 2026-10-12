import { useState, useEffect, useCallback, useMemo } from 'react';
import { AuthContext } from './authContextInstance';
import { authService as defaultAuthService } from '../../../services/authService';

export function AuthProvider({ children, customAuthService }) {
  const service = customAuthService || defaultAuthService;

  const [user, setUser] = useState(() => {
    if (service && service.currentUser && !service.isUserInvalidated?.(service.currentUser.id)) {
      return service.currentUser;
    }
    return null;
  });
  const [session, setSession] = useState(() => {
    if (service && service.currentUser && !service.isUserInvalidated?.(service.currentUser.id)) {
      return { user: service.currentUser };
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(() => !service?.currentUser);
  const [authError, setAuthError] = useState(null);

  // Initialize session on mount
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { session: currentSession, user: currentUser, invalidated } = await service.getSession();
        if (isMounted) {
          if (invalidated) {
            setUser(null);
            setSession(null);
            setAuthError('Your privileges were updated. Please sign in again to access updated features.');
          } else {
            setSession(currentSession);
            setUser(currentUser);
          }
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
        if (updatedUser) {
          const invalidationKey = `ticketcraft_invalidated_user_${updatedUser.id}`;
          const isInvalidated =
            (typeof service.isUserInvalidated === 'function' && service.isUserInvalidated(updatedUser.id)) ||
            (typeof window !== 'undefined' && window.localStorage?.getItem(invalidationKey));

          if (isInvalidated) {
            if (typeof service.clearUserInvalidation === 'function') {
              service.clearUserInvalidation(updatedUser.id);
            } else if (typeof window !== 'undefined' && window.localStorage) {
              window.localStorage.removeItem(invalidationKey);
            }
            service.signOut();
            setUser(null);
            setSession(null);
            setAuthError('Your privileges were updated. Please sign in again to access updated features.');
            return;
          }
        }
        setUser(updatedUser);
        setSession(updatedUser ? { user: updatedUser } : null);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [service]);

  // Real-time listener for session invalidation (cross-tab / storage updates)
  useEffect(() => {
    if (!user?.id) return;
    const invalidationKey = `ticketcraft_invalidated_user_${user.id}`;

    const checkInvalidation = () => {
      const isInvalidated =
        (typeof service.isUserInvalidated === 'function' && service.isUserInvalidated(user.id)) ||
        (typeof window !== 'undefined' && window.localStorage?.getItem(invalidationKey));

      if (isInvalidated) {
        if (typeof service.clearUserInvalidation === 'function') {
          service.clearUserInvalidation(user.id);
        } else if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(invalidationKey);
        }
        service.signOut();
        setUser(null);
        setSession(null);
        setAuthError('Your privileges were updated. Please sign in again to access updated features.');
      }
    };

    checkInvalidation();

    const handleStorage = (e) => {
      if (!e.key || e.key === invalidationKey) {
        checkInvalidation();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
      return () => {
        window.removeEventListener('storage', handleStorage);
      };
    }
  }, [user, service]);

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

  const invalidateUser = useCallback(
    (userId) => {
      if (typeof service.invalidateUser === 'function') {
        service.invalidateUser(userId);
      }
    },
    [service]
  );

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
      invalidateUser,
    }),
    [user, session, isLoading, authError, signIn, signUp, signInWithOAuth, signOut, clearError, invalidateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
