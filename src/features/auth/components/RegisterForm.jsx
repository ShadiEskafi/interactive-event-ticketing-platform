import { useState } from 'react';

/**
 * Sign Up Form Component
 */
export function RegisterForm({ onSubmit, disabled = false, isLoading = false, error = null }) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || isLoading) return;
    if (onSubmit) {
      onSubmit({ fullName, email, password });
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
        <label htmlFor="register-fullname">Full Name</label>
        <input
          id="register-fullname"
          name="fullName"
          type="text"
          autoComplete="name"
          required
          disabled={disabled}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="Jane Doe"
        />
      </div>

      <div className="auth-form-group">
        <label htmlFor="register-email">Email Address</label>
        <input
          id="register-email"
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
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
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
        data-testid="btn-signup-submit"
        disabled={disabled || isLoading}
      >
        {isLoading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
}
