import { useState } from 'react';

/**
 * Sign In Form Component
 */
export function LoginForm({ onSubmit, disabled = false, isLoading = false, error = null }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    if (onSubmit) {
      onSubmit({ email, password });
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit} noValidate={false}>
      {error && (
        <div className="auth-error-banner" role="alert" aria-live="polite">
          {error}
        </div>
      )}

      <div className="auth-form-group">
        <label htmlFor="login-email">Email Address</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          disabled={disabled}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          disabled={disabled}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        className="btn-auth-primary"
        data-testid="btn-signin-submit"
        disabled={disabled || isLoading}
      >
        {isLoading ? 'Signing In...' : 'Sign In'}
      </button>
    </form>
  );
}
