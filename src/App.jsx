import { useState, useCallback, useEffect } from 'react';
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
import { supabase } from './services/supabaseClient';
import { LanguageProvider, useLanguage } from './context';
import { TicketIcon, ArrowUpRightIcon } from './components/common/Icons';
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

  const handleScrollToSection = (sectionId) => {
    setIsMobileMenuOpen(false);
    if (currentView !== 'landing') {
      handleSelectView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
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
          <div className="brand-mark-box" aria-hidden="true">
            <TicketIcon size={20} className="brand-mark-svg" />
          </div>
          <div className="brand-text">
            <div className="brand-name-wrap">
              <span className="brand-name">{t('navbar.brand_name', 'TicketCraft')}</span>
              <span className="brand-edition-tag">MIHWAR</span>
            </div>
            <span className="brand-tagline">
              {language === 'ar' ? 'محور | تيكت كرافت' : t('navbar.tagline', 'Real-Time Interactive Ticketing')}
            </span>
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

          {/* Features / Why TicketCraft */}
          <button
            type="button"
            className="nav-link-btn nav-link-figma-item"
            onClick={() => handleScrollToSection('why-ticketcraft')}
          >
            {t('navbar.features', language === 'ar' ? 'المزايا' : 'Features')}
          </button>

          {/* Organizers / Ecosystem */}
          <button
            type="button"
            className="nav-link-btn nav-link-figma-item"
            onClick={() => handleScrollToSection('ecosystem')}
          >
            {t('navbar.organizers', language === 'ar' ? 'المنظمون' : 'Organizers')}
          </button>

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
          {/* Bilingual Language Capsule Toggle (Figma template EL-eda14dc5) */}
          <button
            type="button"
            className="nav-btn nav-btn-lang"
            data-testid="language-toggle-btn"
            onClick={toggleLanguage}
            aria-label={t('navbar.lang_aria', language === 'en' ? 'Switch to Arabic' : 'Switch to English')}
          >
            <div className="lang-capsule" aria-hidden="true">
              <span className={`lang-badge ${language === 'ar' ? 'active' : ''}`}>AR</span>
              <span className="lang-divider">/</span>
              <span className={`lang-badge ${language === 'en' ? 'active' : ''}`}>EN</span>
            </div>
            <span className="lang-text sr-only">
              {t('navbar.lang_toggle', language === 'en' ? 'العربية' : 'English')}
            </span>
          </button>

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
                <button
                  type="button"
                  className="nav-btn nav-btn-cta"
                  data-testid="btn-nav-get-started"
                  onClick={handleFeaturedEventsClick}
                >
                  <span>{t('navbar.get_started', language === 'ar' ? 'ابدأ الآن' : 'Get Started')}</span>
                  <ArrowUpRightIcon size={16} />
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

  const [platformEvents, setPlatformEvents] = useState(() =>
    typeof adminService !== 'undefined' && typeof adminService.getAllEvents === 'function'
      ? adminService.getAllEvents()
      : FEATURED_EVENTS
  );

  useEffect(() => {
    let isMounted = true;
    let channel = null;

    async function syncEvents() {
      if (
        typeof adminService !== 'undefined' &&
        typeof adminService.fetchEventsFromSupabase === 'function'
      ) {
        try {
          const events = await adminService.fetchEventsFromSupabase();
          if (isMounted && Array.isArray(events)) {
            setPlatformEvents(events);
          }
        } catch {
          // Safe fallback
        }
      }
    }

    syncEvents();

    // Subscribe to live adminService updates in the current window
    const unsubscribeAdmin =
      typeof adminService !== 'undefined' && typeof adminService.subscribe === 'function'
        ? adminService.subscribe((updated) => {
            if (isMounted && Array.isArray(updated)) {
              setPlatformEvents(updated);
            }
          })
        : null;

    const handleEventsUpdated = (e) => {
      if (isMounted) {
        if (e?.detail?.events && Array.isArray(e.detail.events)) {
          setPlatformEvents(e.detail.events);
        } else if (typeof adminService !== 'undefined' && typeof adminService.getAllEvents === 'function') {
          setPlatformEvents(adminService.getAllEvents());
        }
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ticketcraft:events-updated', handleEventsUpdated);
    }

    if (
      typeof supabase !== 'undefined' &&
      supabase &&
      typeof supabase.channel === 'function' &&
      import.meta.env?.MODE !== 'test'
    ) {
      try {
        channel = supabase
          .channel('public:events:app')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'events' },
            () => {
              syncEvents();
            }
          )
          .subscribe();
      } catch {
        // Safe Realtime subscription fallback
      }
    }

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        syncEvents();
      }
    };

    const handleStorage = (e) => {
      if (e.key && (e.key.includes('event') || e.key.includes('ticketcraft'))) {
        syncEvents();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorage);
    }

    return () => {
      isMounted = false;
      if (typeof unsubscribeAdmin === 'function') {
        unsubscribeAdmin();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('ticketcraft:events-updated', handleEventsUpdated);
      }
      if (channel && typeof supabase !== 'undefined' && typeof supabase.removeChannel === 'function') {
        try {
          supabase.removeChannel(channel);
        } catch {
          // Safe cleanup
        }
      }
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorage);
      }
    };
  }, []);

  const allEvents = platformEvents;

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
          events={allEvents}
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
