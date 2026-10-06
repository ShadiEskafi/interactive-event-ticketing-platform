import { useState } from 'react';
import { AuthProvider, AuthModal, useAuth } from './features/auth';
import { EventBookingPage } from './features/seatmap';
import { MyTicketsPage } from './features/tickets';
import './App.css';

function MainNavbar({ activeTab = 'events', onSelectTab, onOpenAuth }) {
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

        {/* Center Nav Links */}
        <nav className="nav-center-links" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'events' ? 'active' : ''}`}
            data-testid="nav-link-events"
            onClick={() => onSelectTab && onSelectTab('events')}
          >
            Events
          </button>
          <button
            type="button"
            className={`nav-link-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            data-testid="nav-link-my-tickets"
            onClick={() => onSelectTab && onSelectTab('tickets')}
          >
            My Tickets
          </button>
        </nav>

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
  const [activeNavTab, setActiveNavTab] = useState('events'); // 'events' | 'tickets'
  const [isHeaderAuthOpen, setIsHeaderAuthOpen] = useState(false);

  return (
    <div className="app-layout">
      <MainNavbar
        activeTab={activeNavTab}
        onSelectTab={setActiveNavTab}
        onOpenAuth={() => setIsHeaderAuthOpen(true)}
      />

      {activeNavTab === 'tickets' ? (
        <MyTicketsPage onExploreEvents={() => setActiveNavTab('events')} />
      ) : (
        <EventBookingPage
          requireAuth={true}
          onNavigateToDashboard={() => setActiveNavTab('tickets')}
        />
      )}

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
