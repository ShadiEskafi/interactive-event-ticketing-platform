import { useState } from 'react';
import { AuthProvider, AuthModal, useAuth } from './features/auth';
import { EventBookingPage } from './features/seatmap';
import './App.css';

function MainNavbar({ onOpenAuth }) {
  const { user, signOut } = useAuth();

  return (
    <header className="main-navbar" role="banner">
      <div className="navbar-content">
        <div className="navbar-brand">
          <span className="brand-icon" aria-hidden="true">🎟️</span>
          <div className="brand-text">
            <span className="brand-name">TicketCraft</span>
            <span className="brand-tagline">Real-Time Interactive Ticketing</span>
          </div>
        </div>

        <div className="navbar-user-section">
          {user ? (
            <div className="nav-user-profile" data-testid="user-profile-badge">
              <span className="user-avatar" aria-hidden="true">
                {(user.user_metadata?.full_name || user.email || 'U')[0].toUpperCase()}
              </span>
              <span className="user-identity">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                type="button"
                className="nav-btn nav-btn-signout"
                data-testid="btn-signout"
                onClick={signOut}
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="nav-guest-profile" data-testid="user-guest-badge">
              <span className="guest-pill">Guest</span>
              <button
                type="button"
                className="nav-btn nav-btn-signin"
                data-testid="btn-nav-signin"
                onClick={onOpenAuth}
              >
                Sign In
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppContent() {
  const [isHeaderAuthOpen, setIsHeaderAuthOpen] = useState(false);

  return (
    <div className="app-layout">
      <MainNavbar onOpenAuth={() => setIsHeaderAuthOpen(true)} />
      <EventBookingPage requireAuth={true} />

      {/* Standalone Auth Modal when clicking Sign In from navbar */}
      <AuthModal
        isOpen={isHeaderAuthOpen}
        onClose={() => setIsHeaderAuthOpen(false)}
        onAuthSuccess={() => setIsHeaderAuthOpen(false)}
      />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
