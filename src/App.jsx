import { useState, useCallback } from 'react';
import {
  AuthProvider,
  AuthModal,
  useAuth,
  RouteGuard,
  getUserRole,
  getDefaultRouteForRole,
} from './features/auth';
import { EventBookingPage } from './features/seatmap';
import { MyTicketsPage } from './features/tickets';
import { GateScannerPage } from './features/gate-scanner';
import { LandingPage, FEATURED_EVENTS } from './features/landing';
import { AdminDashboardPage, adminService } from './features/admin';
import { LanguageProvider, useLanguage } from './context';
import { TicketIcon, GlobeIcon } from './components/common/Icons';
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const currentView = activeView || (activeTab === 'events' ? 'booking' : activeTab) || 'landing';
  const role = user ? (getUserRole(user) || 'attendee') : null;

  const handleSelectView = (view) => {
    setIsMobileMenuOpen(false);
    if (onSelectView) onSelectView(view);
    if (onSelectTab) onSelectTab(view === 'landing' ? 'events' : view);
  };

  const handleFeaturedEventsClick = () => {
    setIsMobileMenuOpen(false);
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
          <span className="brand-icon brand-icon-svg" aria-hidden="true">
            <TicketIcon size={24} />
          </span>
          <div className="brand-text">
            <span className="brand-name">{t('navbar.brand_name', 'TicketCraft')}</span>
            <span className="brand-tagline">{t('navbar.tagline', 'Real-Time Interactive Ticketing')}</span>
          </div>
        </div>

        {/* Center Nav Links (Desktop & Mobile Drawer with Strict Role-Based Visibility) */}
        <nav
          className={`nav-center-links ${isMobileMenuOpen ? 'mobile-open' : ''}`}
          aria-label="Main Navigation"
        >
          {/* Home: Visible to everyone */}
          <button
            type="button"
            className={`nav-link-btn ${currentView === 'landing' ? 'active' : ''}`}
            data-testid="nav-link-home"
            onClick={() => handleSelectView('landing')}
          >
            {t('navbar.home', 'Home')}
          </button>

          {/* Featured Events: Visible to Guest, Attendee, Organizer, Super Admin (Hidden for Gate Staff) */}
          {(!user || role !== 'gate_staff') && (
            <button
              type="button"
              className={`nav-link-btn ${currentView === 'booking' ? 'active' : ''}`}
              data-testid="nav-link-events"
              onClick={handleFeaturedEventsClick}
            >
              {t('navbar.featured_events', 'Featured Events')}
            </button>
          )}

          {/* My Tickets: Strictly visible to authenticated Attendee only */}
          {user && role === 'attendee' && (
            <button
              type="button"
              className={`nav-link-btn ${currentView === 'tickets' ? 'active' : ''}`}
              data-testid="nav-link-my-tickets"
              onClick={() => handleSelectView('tickets')}
            >
              {t('navbar.my_tickets', 'My Tickets')}
            </button>
          )}

          {/* Gate Scanner: Strictly visible to authenticated Gate Staff only */}
          {user && role === 'gate_staff' && (
            <button
              type="button"
              className={`nav-link-btn ${currentView === 'scanner' ? 'active' : ''}`}
              data-testid="nav-link-scanner"
              onClick={() => handleSelectView('scanner')}
            >
              {t('navbar.scanner', 'Gate Scanner')}
            </button>
          )}

          {/* Organizer Hub: Strictly visible to authenticated Organizer only */}
          {user && role === 'organizer' && (
            <button
              type="button"
              className={`nav-link-btn ${currentView === 'organizer' ? 'active' : ''}`}
              data-testid="nav-link-organizer"
              onClick={() => handleSelectView('organizer')}
            >
              {t('navbar.organizer_hub', 'Organizer Hub')}
            </button>
          )}

          {/* Admin Hub: Strictly visible to authenticated Super Admin only */}
          {user && role === 'super_admin' && (
            <button
              type="button"
              className={`nav-link-btn ${currentView === 'admin' ? 'active' : ''}`}
              data-testid="nav-link-admin"
              onClick={() => handleSelectView('admin')}
            >
              {t('navbar.admin_hub', 'Admin Hub')}
            </button>
          )}
        </nav>

        <div className="navbar-actions-group">
          <div className="navbar-user-section">
            {/* Bilingual Language Switcher */}
            <button
              type="button"
              className="nav-btn nav-btn-lang"
              data-testid="language-toggle-btn"
              onClick={toggleLanguage}
              aria-label={t('navbar.lang_aria', language === 'en' ? 'Switch to Arabic' : 'Switch to English')}
            >
              <span className="lang-globe-icon lang-globe-svg" aria-hidden="true">
                <GlobeIcon size={18} />
              </span>
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
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    signOut();
                  }}
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
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    if (onOpenAuth) onOpenAuth();
                  }}
                >
                  {t('navbar.sign_in', 'Sign In')}
                </button>
              </div>
            )}
          </div>

          {/* Accessible Mobile Menu Toggle / Hamburger Button */}
          <button
            type="button"
            className={`mobile-menu-toggle ${isMobileMenuOpen ? 'open' : ''}`}
            data-testid="mobile-menu-toggle"
            aria-label={isMobileMenuOpen ? t('navbar.close_menu', 'Close Menu') : t('navbar.open_menu', 'Open Navigation Menu')}
            aria-expanded={isMobileMenuOpen}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
            <span className="hamburger-bar" />
          </button>
        </div>
      </div>

      {/* Accessible Backdrop for Mobile Drawer */}
      {isMobileMenuOpen && (
        <div
          className="mobile-menu-backdrop"
          data-testid="mobile-menu-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </header>
  );
}

export function AppContent() {
  const { language } = useLanguage();
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'booking' | 'tickets'
  const [hasOpenedBooking, setHasOpenedBooking] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('evt-symphony-2026');
  const [isHeaderAuthOpen, setIsHeaderAuthOpen] = useState(false);

  const allEvents =
    typeof adminService !== 'undefined' && typeof adminService.getAllEvents === 'function'
      ? adminService.getAllEvents()
      : FEATURED_EVENTS;

  const selectedEvent =
    allEvents.find((e) => e.id === selectedEventId) || allEvents[0] || FEATURED_EVENTS[0];

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

  const handleAuthSuccess = useCallback((authedUser) => {
    setIsHeaderAuthOpen(false);
    if (authedUser) {
      const role = getUserRole(authedUser);
      const targetView = getDefaultRouteForRole(role);
      setCurrentView(targetView);
    }
  }, []);

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
        <RouteGuard
          route="/scanner"
          onUnauthorized={() => setCurrentView('landing')}
          onNavigate={setCurrentView}
        >
          <GateScannerPage
            eventId={selectedEvent?.id || 'evt-symphony-2026'}
            eventName={currentEventTitle}
            onBackToApp={() => setCurrentView('landing')}
          />
        </RouteGuard>
      )}

      {currentView === 'organizer' && (
        <RouteGuard
          route="/organizer"
          onUnauthorized={() => setCurrentView('landing')}
          onNavigate={setCurrentView}
        >
          <AdminDashboardPage
            initialRole="organizer"
            onNavigateToHome={() => setCurrentView('landing')}
            onNavigateToScanner={(eventId) => {
              setSelectedEventId(eventId || selectedEventId);
              setCurrentView('scanner');
            }}
          />
        </RouteGuard>
      )}

      {currentView === 'admin' && (
        <RouteGuard
          route="/admin"
          onUnauthorized={() => setCurrentView('landing')}
          onNavigate={setCurrentView}
        >
          <AdminDashboardPage
            initialRole="super_admin"
            onNavigateToHome={() => setCurrentView('landing')}
            onNavigateToScanner={(eventId) => {
              setSelectedEventId(eventId || selectedEventId);
              setCurrentView('scanner');
            }}
          />
        </RouteGuard>
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
        onAuthSuccess={handleAuthSuccess}
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
