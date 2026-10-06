import { useState, useEffect, useRef } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthTimerHeader } from './components/AuthTimerHeader';
import { LoginForm } from './components/LoginForm';
import { RegisterForm } from './components/RegisterForm';
import { OAuthProviders } from './components/OAuthProviders';
import { SessionExpiredView } from './components/SessionExpiredView';
import './AuthModal.css';

/**
 * Smart Frictionless Authentication Modal (SPEC-03 / Scenario 3.1, 3.2, 3.3)
 */
export function AuthModal({
  isOpen = false,
  onClose,
  reservedUntil,
  isExpired = false,
  onExpire,
  onReturnToMap,
  onAuthSuccess,
}) {
  const { signIn, signUp, signInWithOAuth, authError, clearError } = useAuth();
  const [activeTab, setActiveTab] = useState('signin'); // 'signin' | 'signup'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const modalRef = useRef(null);

  // Focus management and Escape key dismissal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isExpired && !isSubmitting && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Initial focus on modal
    const focusable = modalRef.current?.querySelector('input, button');
    if (focusable) {
      focusable.focus();
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, isExpired, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSignIn = async ({ email, password }) => {
    setIsSubmitting(true);
    const result = await signIn({ email, password });
    setIsSubmitting(false);
    if (result.success && onAuthSuccess) {
      onAuthSuccess(result.user);
    }
  };

  const handleSignUp = async ({ fullName, email, password }) => {
    setIsSubmitting(true);
    const result = await signUp({ fullName, email, password });
    setIsSubmitting(false);
    if (result.success && onAuthSuccess) {
      onAuthSuccess(result.user);
    }
  };

  const handleOAuth = async (provider) => {
    setIsSubmitting(true);
    const result = await signInWithOAuth(provider);
    setIsSubmitting(false);
    if (result.success && onAuthSuccess) {
      onAuthSuccess(result.user);
    }
  };

  return (
    <div
      className="auth-modal-backdrop"
      data-testid="auth-modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExpired && !isSubmitting && onClose) {
          onClose();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-modal-title"
        className="auth-modal-container"
        data-testid="auth-modal"
      >
        {/* Top Header with Title and Hold Countdown Badge */}
        <header className="auth-modal-header">
          <div className="auth-header-title-row">
            <h2 id="auth-modal-title" className="auth-modal-title">
              Sign In to Complete Booking
            </h2>
            {!isExpired && onClose && (
              <button
                type="button"
                className="btn-modal-close"
                aria-label="Close modal"
                disabled={isSubmitting}
                onClick={onClose}
              >
                &times;
              </button>
            )}
          </div>

          <p className="auth-modal-subtitle">
            Please log in or create an account to secure your reserved seats.
          </p>

          {/* Active 300s Countdown Badge */}
          {reservedUntil && (
            <AuthTimerHeader reservedUntil={reservedUntil} onExpire={onExpire} />
          )}
        </header>

        {/* Content Body */}
        {isExpired ? (
          <SessionExpiredView onReturnToMap={onReturnToMap} />
        ) : (
          <div className="auth-modal-body">
            {/* Tab Navigation */}
            <div className="auth-tabs" role="tablist" aria-label="Authentication Options">
              <button
                type="button"
                role="tab"
                id="tab-signin"
                aria-selected={activeTab === 'signin'}
                aria-controls="panel-signin"
                className={`auth-tab-btn ${activeTab === 'signin' ? 'active' : ''}`}
                onClick={() => {
                  clearError();
                  setActiveTab('signin');
                }}
              >
                Sign In
              </button>
              <button
                type="button"
                role="tab"
                id="tab-signup"
                aria-selected={activeTab === 'signup'}
                aria-controls="panel-signup"
                className={`auth-tab-btn ${activeTab === 'signup' ? 'active' : ''}`}
                onClick={() => {
                  clearError();
                  setActiveTab('signup');
                }}
              >
                Sign Up
              </button>
            </div>

            {/* Active Tab Panel */}
            <div
              role="tabpanel"
              id={`panel-${activeTab}`}
              aria-labelledby={`tab-${activeTab}`}
              className="auth-tabpanel"
            >
              {activeTab === 'signin' ? (
                <LoginForm
                  onSubmit={handleSignIn}
                  disabled={isExpired}
                  isLoading={isSubmitting}
                  error={authError}
                />
              ) : (
                <RegisterForm
                  onSubmit={handleSignUp}
                  disabled={isExpired}
                  isLoading={isSubmitting}
                  error={authError}
                />
              )}
            </div>

            {/* OAuth Social Buttons */}
            <OAuthProviders
              onSelectProvider={handleOAuth}
              disabled={isExpired}
              isLoading={isSubmitting}
            />
          </div>
        )}
      </div>
    </div>
  );
}
