import { useContext } from 'react';
import { AuthContext } from '../context/authContextInstance';

/**
 * Hook to consume AuthContext
 * Returns graceful guest fallback if used outside an AuthProvider for testing resilience.
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      session: null,
      isLoading: false,
      authError: null,
      signIn: async () => ({ success: false, error: new Error('No AuthProvider mounted') }),
      signUp: async () => ({ success: false, error: new Error('No AuthProvider mounted') }),
      signInWithOAuth: async () => ({ success: false, error: new Error('No AuthProvider mounted') }),
      signOut: async () => {},
      clearError: () => {},
    };
  }
  return context;
}
