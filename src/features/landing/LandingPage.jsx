import { useState, useMemo } from 'react';
import { FEATURED_EVENTS } from './featuredEvents';
import { useLanguage } from '../../context';
import './LandingPage.css';

const CATEGORIES = [
  { key: 'All', labelKey: 'hero.categories.all', fallback: 'All' },
  { key: 'Classical', labelKey: 'hero.categories.classical', fallback: 'Classical' },
  { key: 'Rock & Pop', labelKey: 'hero.categories.rock_pop', fallback: 'Rock & Pop' },
  { key: 'Theatre', labelKey: 'hero.categories.theatre', fallback: 'Theatre' },
  { key: 'Festivals', labelKey: 'hero.categories.festivals', fallback: 'Festivals' },
];

export function LandingPage({ onSelectEvent, onNavigateToTickets }) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredEvents = useMemo(() => {
    return FEATURED_EVENTS.filter((event) => {
      const matchesCategory =
        selectedCategory === 'All' || event.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        event.title.toLowerCase().includes(q) ||
        (event.title_ar && event.title_ar.includes(q)) ||
        event.venue.toLowerCase().includes(q) ||
        (event.venue_ar && event.venue_ar.includes(q)) ||
        event.category.toLowerCase().includes(q) ||
        (event.category_ar && event.category_ar.includes(q)) ||
        event.description.toLowerCase().includes(q) ||
        (event.description_ar && event.description_ar.includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const handleEventClick = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event.id);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const primaryEvent = filteredEvents.find((e) => e.isPrimary) || filteredEvents[0];
  const secondaryEvents = filteredEvents.filter((e) => e !== primaryEvent);

  const getEventTitle = (event) => (language === 'ar' && event.title_ar ? event.title_ar : event.title);
  const getEventVenue = (event) => (language === 'ar' && event.venue_ar ? event.venue_ar : event.venue);
  const getEventDate = (event) => (language === 'ar' && event.date_ar ? event.date_ar : event.date);
  const getEventCategory = (event) => (language === 'ar' && event.category_ar ? event.category_ar : event.category);
  const getEventStatusPill = (event) => (language === 'ar' && event.statusPill_ar ? event.statusPill_ar : event.statusPill);
  const getEventCapacity = (event) => (language === 'ar' && event.capacity_ar ? event.capacity_ar : event.capacity);
  const getEventDescription = (event) => (language === 'ar' && event.description_ar ? event.description_ar : event.description);
  const getEventHighlights = (event) => (language === 'ar' && event.highlights_ar ? event.highlights_ar : event.highlights);
  const getEventPriceRange = (event) => (language === 'ar' && event.priceRange_ar ? event.priceRange_ar : event.priceRange);
  const getEventCta = (event) => (language === 'ar' && event.ctaText_ar ? event.ctaText_ar : event.ctaText);

  return (
    <div className="landing-page" data-testid="landing-page">
      {/* 1. Hero Section */}
      <section className="landing-hero" aria-labelledby="hero-heading">
        <div className="hero-glow-blob hero-glow-1" aria-hidden="true" />
        <div className="hero-glow-blob hero-glow-2" aria-hidden="true" />

        <div className="hero-container">
          <div className="hero-badge">
            <span className="hero-badge-pulse" aria-hidden="true" />
            <span>{t('hero.badge', 'Next-Gen High Concurrency Ticketing')}</span>
          </div>

          <h1 id="hero-heading" className="hero-title">
            {t('hero.title', 'Discover & Book Exceptional Live Experiences')}
          </h1>

          <p className="hero-subtitle">
            {t(
              'hero.subtitle',
              'Reserve high-demand seats in real time with millisecond collision detection, cryptographic digital wallet passes, and guaranteed zero double-bookings.'
            )}
          </p>

          {/* Live Platform Metric Pills */}
          <div className="hero-metrics" role="region" aria-label="Live Platform Metrics">
            <div className="metric-pill" data-testid="metric-pill-seats">
              <span className="metric-icon" aria-hidden="true">⚡</span>
              <div className="metric-info">
                <span className="metric-value">{t('hero.metrics.seats_val', '520')}</span>
                <span className="metric-label">{t('hero.metrics.seats_label', 'Realtime Seats')}</span>
              </div>
            </div>

            <div className="metric-pill" data-testid="metric-pill-lock">
              <span className="metric-icon" aria-hidden="true">⏱️</span>
              <div className="metric-info">
                <span className="metric-value">{t('hero.metrics.lock_val', '300s')}</span>
                <span className="metric-label">{t('hero.metrics.lock_label', 'Pessimistic Atomic Lock')}</span>
              </div>
            </div>

            <div className="metric-pill" data-testid="metric-pill-qr">
              <span className="metric-icon" aria-hidden="true">🛡️</span>
              <div className="metric-info">
                <span className="metric-value">{t('hero.metrics.qr_val', 'HMAC-SHA256')}</span>
                <span className="metric-label">{t('hero.metrics.qr_label', 'Signed QR Passes')}</span>
              </div>
            </div>
          </div>

          {/* Live Search & Category Filter Controls */}
          <div className="hero-search-filter-card" role="search" aria-label="Event search and filters">
            <div className="search-input-wrapper">
              <span className="search-input-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                className="search-input"
                placeholder={t('hero.search_placeholder', 'Search events, artists, venues...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="hero-search-input"
                aria-label={t('hero.search_aria', 'Search events by keyword')}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label={t('hero.clear_search', 'Clear search text')}
                >
                  &times;
                </button>
              )}
            </div>

            <div className="category-filters" role="group" aria-label="Category filters">
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    className={`category-pill-btn ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat.key)}
                    aria-pressed={isActive}
                    data-testid={`category-filter-${cat.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                  >
                    {t(cat.labelKey, cat.fallback)}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 2. Featured Events Grid */}
      <section
        id="featured-events"
        className="featured-events-section"
        aria-labelledby="featured-events-heading"
      >
        <div className="section-container">
          <div className="section-header">
            <div>
              <span className="section-eyebrow">{t('events.eyebrow', 'Available Now')}</span>
              <h2 id="featured-events-heading" className="section-title">
                {t('events.section_title', 'Featured Live Experiences')}
              </h2>
            </div>
            <p className="section-description">
              {t(
                'events.section_desc',
                'Select an event to explore the interactive seating map, view tier pricing, and hold your seats in real-time.'
              )}
            </p>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="events-empty-state" data-testid="events-empty-state">
              <span className="empty-state-icon" aria-hidden="true">🎟️</span>
              <h3>{t('events.empty_title', 'No Events Found')}</h3>
              <p>
                {t('events.empty_desc', "We couldn't find any events matching your search.")}
              </p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleResetFilters}
              >
                {t('events.reset_filters', 'Reset Filters')}
              </button>
            </div>
          ) : (
            <div className="events-grid-layout">
              {/* Primary Event Card (Grand Symphony Concert) */}
              {primaryEvent && (
                <article
                  className="event-card event-card-primary"
                  data-testid="primary-event-card"
                  aria-label={`Featured event: ${getEventTitle(primaryEvent)}`}
                >
                  <div
                    className="event-card-banner"
                    style={{ background: primaryEvent.imageGradient }}
                  >
                    <div className="card-badge-row">
                      <span className="status-pill status-pill-live">
                        <span className="status-pulse-dot" aria-hidden="true" />
                        {getEventStatusPill(primaryEvent)}
                      </span>
                      <span className="category-badge">{getEventCategory(primaryEvent)}</span>
                    </div>

                    <div className="banner-visual-overlay">
                      <span className="banner-decor-icon" aria-hidden="true">🎼</span>
                      <span className="banner-capacity-pill">{getEventCapacity(primaryEvent)}</span>
                    </div>
                  </div>

                  <div className="event-card-body">
                    <div className="event-date-row">
                      <span className="event-calendar-icon" aria-hidden="true">📅</span>
                      <span className="event-date-text">{getEventDate(primaryEvent)}</span>
                    </div>

                    <h3 className="event-card-title">{getEventTitle(primaryEvent)}</h3>

                    <div className="event-venue-row">
                      <span className="event-venue-icon" aria-hidden="true">📍</span>
                      <span className="event-venue-text">{getEventVenue(primaryEvent)}</span>
                    </div>

                    <p className="event-card-description">{getEventDescription(primaryEvent)}</p>

                    <div className="event-highlights-list">
                      {getEventHighlights(primaryEvent).map((highlight, idx) => (
                        <span key={idx} className="highlight-tag">
                          ✓ {highlight}
                        </span>
                      ))}
                    </div>

                    <div className="event-card-footer">
                      <div className="event-price-block">
                        <span className="price-label">{t('events.tickets_from', 'Tickets from')}</span>
                        <span className="price-amount">{getEventPriceRange(primaryEvent)}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-select-seats btn-select-seats-primary"
                        data-testid="btn-select-seats-symphony"
                        onClick={() => handleEventClick(primaryEvent)}
                      >
                        {getEventCta(primaryEvent)}
                      </button>
                    </div>
                  </div>
                </article>
              )}

              {/* Secondary Event Cards */}
              {secondaryEvents.map((event) => (
                <article
                  key={event.id}
                  className="event-card event-card-secondary"
                  data-testid={`event-card-${event.id}`}
                  aria-label={`Event: ${getEventTitle(event)}`}
                >
                  <div
                    className="event-card-banner"
                    style={{ background: event.imageGradient }}
                  >
                    <div className="card-badge-row">
                      <span className="status-pill">{getEventStatusPill(event)}</span>
                      <span className="category-badge">{getEventCategory(event)}</span>
                    </div>
                    <div className="banner-visual-overlay">
                      <span className="banner-decor-icon" aria-hidden="true">✨</span>
                      <span className="banner-capacity-pill">{getEventCapacity(event)}</span>
                    </div>
                  </div>

                  <div className="event-card-body">
                    <div className="event-date-row">
                      <span className="event-calendar-icon" aria-hidden="true">📅</span>
                      <span className="event-date-text">{getEventDate(event)}</span>
                    </div>

                    <h3 className="event-card-title">{getEventTitle(event)}</h3>

                    <div className="event-venue-row">
                      <span className="event-venue-icon" aria-hidden="true">📍</span>
                      <span className="event-venue-text">{getEventVenue(event)}</span>
                    </div>

                    <p className="event-card-description">{getEventDescription(event)}</p>

                    <div className="event-card-footer">
                      <div className="event-price-block">
                        <span className="price-label">{t('events.tickets', 'Tickets')}</span>
                        <span className="price-amount">{getEventPriceRange(event)}</span>
                      </div>

                      <button
                        type="button"
                        className="btn-select-seats"
                        onClick={() => handleEventClick(event)}
                      >
                        {getEventCta(event)}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. Why TicketCraft? Architecture Highlights */}
      <section
        className="why-ticketcraft-section"
        aria-labelledby="why-heading"
        data-testid="why-ticketcraft-section"
      >
        <div className="section-container">
          <div className="section-header text-center">
            <span className="section-eyebrow">{t('why.eyebrow', 'Engineered for Concurrency')}</span>
            <h2 id="why-heading" className="section-title">
              {t('why.title', 'Why TicketCraft?')}
            </h2>
            <p className="section-description mx-auto">
              {t(
                'why.subtitle',
                'Our ground-up distributed architecture eliminates booking conflicts, slashes latency, and ensures tamper-proof entry.'
              )}
            </p>
          </div>

          <div className="features-highlight-grid">
            {/* Card 1: 60fps Pan-Zoom SVG Engine */}
            <div className="feature-highlight-card" data-testid="feature-card-svg-engine">
              <div className="feature-icon-wrapper feature-icon-blue">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </svg>
              </div>
              <span className="feature-tag">{t('why.card1.tag', 'GPU-Accelerated')}</span>
              <h3 className="feature-card-title">{t('why.card1.title', '60fps Pan-Zoom SVG Engine')}</h3>
              <p className="feature-card-body">
                {t(
                  'why.card1.body',
                  'Hardware-accelerated vector rendering for 520+ individual seats with fluid pinch, scroll wheel zoom, and instant hover inspection without DOM lag or layout thrashing.'
                )}
              </p>
              <ul className="feature-bullet-list">
                <li>{t('why.card1.bullet1', 'Sub-16ms render loop with native vector scaling')}</li>
                <li>{t('why.card1.bullet2', 'Accessible ARIA grid navigation with Arrow keys')}</li>
                <li>{t('why.card1.bullet3', 'Color-blind friendly category palette')}</li>
              </ul>
            </div>

            {/* Card 2: Collision-Proof Realtime Hold (300s) */}
            <div className="feature-highlight-card" data-testid="feature-card-realtime-hold">
              <div className="feature-icon-wrapper feature-icon-amber">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <span className="feature-tag">{t('why.card2.tag', 'Zero Double-Bookings')}</span>
              <h3 className="feature-card-title">{t('why.card2.title', 'Collision-Proof Realtime Hold (300s)')}</h3>
              <p className="feature-card-body">
                {t(
                  'why.card2.body',
                  'Pessimistic atomic locking backed by PostgreSQL RPC and Supabase Realtime guarantees zero double-bookings with a strict 300-second reservation countdown.'
                )}
              </p>
              <ul className="feature-bullet-list">
                <li>{t('why.card2.bullet1', 'PostgreSQL atomic RPC locks held seats instantly')}</li>
                <li>{t('why.card2.bullet2', '200ms broadcast sync to all active attendees')}</li>
                <li>{t('why.card2.bullet3', 'Automatic garbage-collection release on timeout')}</li>
              </ul>
            </div>

            {/* Card 3: Offline Web Crypto QR Wallet Passes */}
            <div className="feature-highlight-card" data-testid="feature-card-qr-passes">
              <div className="feature-icon-wrapper feature-icon-emerald">
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </div>
              <span className="feature-tag">{t('why.card3.tag', 'Tamper-Proof')}</span>
              <h3 className="feature-card-title">{t('why.card3.title', 'Offline Web Crypto QR Passes')}</h3>
              <p className="feature-card-body">
                {t(
                  'why.card3.body',
                  'HMAC-SHA256 cryptographically signed entry tokens verified in microseconds. Downloadable high-contrast passes work completely offline at venue gates.'
                )}
              </p>
              <ul className="feature-bullet-list">
                <li>{t('why.card3.bullet1', 'W3C Web Crypto API client-side verification')}</li>
                <li>{t('why.card3.bullet2', 'High-contrast optical scanning brightness mode')}</li>
                <li>{t('why.card3.bullet3', 'Printable A5 PDF & PNG digital wallet export')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Brand Footer */}
      <footer className="landing-footer" role="contentinfo">
        <div className="footer-container">
          <div className="footer-top-grid">
            <div className="footer-brand-column">
              <div className="footer-brand-logo" data-testid="footer-brand">
                <span className="footer-brand-icon" aria-hidden="true">🎟️</span>
                <span className="footer-brand-name">{t('footer.brand_name', 'TicketCraft')}</span>
              </div>
              <p className="footer-brand-description">
                {t(
                  'footer.description',
                  'Interactive event ticketing engineered for high-concurrency seat maps, atomic pessimistic holds, and cryptographic digital passes.'
                )}
              </p>
              <div className="footer-tech-stack-pills">
                <span className="tech-pill">React 19</span>
                <span className="tech-pill">Vite 8</span>
                <span className="tech-pill">Supabase Realtime</span>
                <span className="tech-pill">Web Crypto</span>
              </div>
            </div>

            <div className="footer-links-column">
              <h4 className="footer-heading">{t('footer.platform', 'Platform')}</h4>
              <ul className="footer-links-list">
                <li>
                  <a href="#featured-events">{t('footer.auditorium_map', 'Auditorium Map')}</a>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-nav-link"
                    onClick={() => {
                      const el = document.getElementById('featured-events');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                  >
                    {t('footer.featured_events', 'Featured Events')}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    className="footer-nav-link"
                    onClick={onNavigateToTickets}
                  >
                    {t('footer.my_passes', 'My Passes & Tickets')}
                  </button>
                </li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h4 className="footer-heading">{t('footer.architecture', 'Architecture')}</h4>
              <ul className="footer-links-list">
                <li><span>520-Seat SVG Topology</span></li>
                <li><span>Pessimistic RPC Locks</span></li>
                <li><span>HMAC-SHA256 Signatures</span></li>
                <li><span>WCAG 2.1 AA Compliant</span></li>
              </ul>
            </div>

            <div className="footer-links-column">
              <h4 className="footer-heading">{t('footer.security', 'Security & Guarantee')}</h4>
              <ul className="footer-links-list">
                <li><span>Zero Double-Booking Guarantee</span></li>
                <li><span>300s Session Reservation</span></li>
                <li><span>Offline Gate Verification</span></li>
                <li><span>Client Data Privacy</span></li>
              </ul>
            </div>
          </div>

          <div className="footer-bottom-bar">
            <p className="footer-copyright">
              {t(
                'footer.copyright',
                `© ${new Date().getFullYear()} TicketCraft, Inc. All rights reserved. Built with precision for live entertainment.`
              )}
            </p>
            <div className="footer-status-indicator">
              <span className="status-indicator-dot" aria-hidden="true" />
              <span>{t('footer.status_online', 'Realtime Booking Cluster: Online')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
