import { useState } from 'react';
import { AuthProvider, AuthModal, useAuth } from './features/auth';
import { EventBookingPage } from './features/seatmap';
import { MyTicketsPage } from './features/tickets';
import { GateScannerPage } from './features/gate-scanner';
import { LandingPage, FEATURED_EVENTS } from './features/landing';
import { LanguageProvider, useLanguage } from './context';
import './App.css';

export function MainNavbar({
  activeView = 'landing',
  activeTab,
  onSelectView,
  onSelectTab,
  onSelectFeaturedEvents,
  onOpenAuth,
}) {
  const { user, signOut } = useAuth();
  const { language, toggleLanguage, t } = useLanguage();

  const currentView = activeView || (activeTab === 'events' ? 'booking' : activeTab) || 'landing';

  const handleSelectView = (view) => {
    if (onSelectView) onSelectView(view);
    if (onSelectTab) onSelectTab(view === 'landing' ? 'events' : view);
  };

  const handleFeaturedEventsClick = () => {
    if (onSelectFeaturedEvents) {
      onSelectFeaturedEvents();
    } else {
      handleSelectView('landing');
    }
  };

  return (
    <header className="main-navbar" role="banner">
      <div className="navbar-content">
        <div
          className="navbar-brand"
          role="button"
          tabIndex={0}
          data-testid="navbar-brand-logo"
          onClick={() => handleSelectView('landing')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleSelectView('landing');
            }
          }}
          aria-label={t('navbar.brand_name', 'TicketCraft')}
          style={{ cursor: 'pointer' }}
        >
          <span className="brand-icon" aria-hidden="true">🎟️</span>
          <div className="brand-text">
            <span className="brand-name">{t('navbar.brand_name', 'TicketCraft')}</span>
            <span className="brand-tagline">{t('navbar.tagline', 'Real-Time Interactive Ticketing')}</span>
          </div>
        </div>

        {/* Center Nav Links */}
        <nav className="nav-center-links" aria-label="Main Navigation">
          <button
            type="button"
            className={`nav-link-btn ${currentView === 'landing' ? 'active' : ''}`}
            data-testid="nav-link-home"
            onClick={() => handleSelectView('landing')}
          >
            {t('navbar.home', 'Home')}
          </button>
          <button
            type="button"
            className={`nav-link-btn ${currentView === 'booking' ? 'active' : ''}`}
            data-testid="nav-link-events"
            onClick={handleFeaturedEventsClick}
          >
            {t('navbar.featured_events', 'Featured Events')}
          </button>
          <button
            type="button"
            className={`nav-link-btn ${currentView === 'tickets' ? 'active' : ''}`}
            data-testid="nav-link-my-tickets"
            onClick={() => handleSelectView('tickets')}
          >
            {t('navbar.my_tickets', 'My Tickets')}
          </button>
          <button
            type="button"
            className={`nav-link-btn ${currentView === 'scanner' ? 'active' : ''}`}
            data-testid="nav-link-scanner"
            onClick={() => handleSelectView('scanner')}
          >
            {t('navbar.scanner', 'Gate Scanner')}
          </button>
        </nav>

        <div className="navbar-user-section">
          {/* Bilingual Language Switcher */}
          <button
            type="button"
            className="nav-btn nav-btn-lang"
            data-testid="language-toggle-btn"
            onClick={toggleLanguage}
            aria-label={t('navbar.lang_aria', language === 'en' ? 'Switch to Arabic' : 'Switch to English')}
          >
            <span className="lang-globe-icon" aria-hidden="true">🌐</span>
            <span className="lang-text">{t('navbar.lang_toggle', language === 'en' ? 'العربية' : 'English')}</span>
          </button>

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
                {t('navbar.sign_out', 'Sign Out')}
              </button>
            </div>
          ) : (
            <div className="nav-guest-profile" data-testid="user-guest-badge">
              <span className="guest-pill">{t('navbar.guest', 'Guest')}</span>
              <button
                type="button"
                className="nav-btn nav-btn-signin"
                data-testid="btn-nav-signin"
                onClick={onOpenAuth}
              >
                {t('navbar.sign_in', 'Sign In')}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export function AppContent() {
  const { language } = useLanguage();
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'booking' | 'tickets'
  const [hasOpenedBooking, setHasOpenedBooking] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('evt-symphony-2026');
  const [isHeaderAuthOpen, setIsHeaderAuthOpen] = useState(false);

  const selectedEvent =
    FEATURED_EVENTS.find((e) => e.id === selectedEventId) || FEATURED_EVENTS[0];

  const handleSelectFeaturedEvents = () => {
    if (currentView === 'landing') {
      const el = document.getElementById('featured-events');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById('featured-events');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    }
  };

  const handleSelectEvent = (eventId) => {
    setSelectedEventId(eventId || 'evt-symphony-2026');
    setHasOpenedBooking(true);
    setCurrentView('booking');
  };

  const currentEventTitle =
    language === 'ar' && selectedEvent?.title_ar
      ? selectedEvent.title_ar
      : selectedEvent?.title || 'Grand Symphony Concert';

  return (
    <div className="app-layout">
      <MainNavbar
        activeView={currentView}
        onSelectView={setCurrentView}
        onSelectFeaturedEvents={handleSelectFeaturedEvents}
        onOpenAuth={() => setIsHeaderAuthOpen(true)}
      />

      {currentView === 'landing' && (
        <LandingPage
          onSelectEvent={handleSelectEvent}
          onNavigateToTickets={() => setCurrentView('tickets')}
        />
      )}

      {currentView === 'tickets' && (
        <MyTicketsPage onExploreEvents={() => setCurrentView('landing')} />
      )}

      {currentView === 'scanner' && (
        <GateScannerPage
          eventId={selectedEvent?.id || 'evt-symphony-2026'}
          eventName={currentEventTitle}
          onBackToApp={() => setCurrentView('landing')}
        />
      )}

      {hasOpenedBooking && (
        <div
          style={{ display: currentView === 'booking' ? 'block' : 'none' }}
          data-testid="booking-page-wrapper"
        >
          <EventBookingPage
            eventId={selectedEvent?.id || 'evt-symphony-2026'}
            eventName={currentEventTitle}
            requireAuth={true}
            onNavigateToDashboard={() => setCurrentView('tickets')}
            onBackToEvents={() => setCurrentView('landing')}
          />
        </div>
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
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
