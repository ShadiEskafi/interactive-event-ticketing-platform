import { useState, useMemo, useEffect } from 'react';
import { FEATURED_EVENTS } from './featuredEvents';
import { adminService } from '../admin/services/adminService';
import { useLanguage } from '../../context';
import {
  ZapIcon,
  ClockIcon,
  ShieldIcon,
  SearchIcon,
  TicketIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowUpRightIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  CheckIcon,
  LockIcon,
  BarChart3Icon,
  QrCodeIcon,
  DownloadIcon,
  UserIcon,
  SparklesIcon,
  MusicIcon,
  TheaterIcon,
} from '../../components/common/Icons';
import './LandingPage.css';

const CATEGORIES = [
  { key: 'All', labelKey: 'hero.categories.all', fallback: 'All' },
  { key: 'Classical', labelKey: 'hero.categories.classical', fallback: 'Classical' },
  { key: 'Rock & Pop', labelKey: 'hero.categories.rock_pop', fallback: 'Rock & Pop' },
  { key: 'Theatre', labelKey: 'hero.categories.theatre', fallback: 'Theatre' },
  { key: 'Festivals', labelKey: 'hero.categories.festivals', fallback: 'Festivals' },
];

function getCategoryVectorIcon(category) {
  const cat = (category || '').toLowerCase();
  if (cat.includes('class') || cat.includes('كلاسيك')) {
    return <MusicIcon size={24} className="genre-vector-svg" />;
  }
  if (cat.includes('rock') || cat.includes('pop') || cat.includes('روك') || cat.includes('بوب')) {
    return <ZapIcon size={24} className="genre-vector-svg" />;
  }
  if (cat.includes('theat') || cat.includes('مسرح')) {
    return <TheaterIcon size={24} className="genre-vector-svg" />;
  }
  if (cat.includes('fest') || cat.includes('مهرجان')) {
    return <SparklesIcon size={24} className="genre-vector-svg" />;
  }
  return <TicketIcon size={24} className="genre-vector-svg" />;
}

function parseEventDateBlock(event, language = 'en') {
  const defaultDate = { month: 'NOV', day: '14', weekday: 'SAT' };
  if (!event) return defaultDate;

  const rawIso = event.date_time || event.event_date;
  if (rawIso) {
    const d = new Date(rawIso);
    if (!isNaN(d.getTime())) {
      const isAr = language === 'ar';
      return {
        month: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { month: 'short' }).toUpperCase(),
        day: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { day: 'numeric' }),
        weekday: d.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', { weekday: 'short' }).toUpperCase(),
      };
    }
  }

  const rawStr = language === 'ar' && event.date_ar ? event.date_ar : (event.date || '');
  if (!rawStr) return defaultDate;

  if (language === 'ar') {
    const arMonths = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    let month = 'نوفمبر';
    for (const m of arMonths) {
      if (rawStr.includes(m)) {
        month = m;
        break;
      }
    }
    const dayMatch = rawStr.match(/[0-9\u0660-\u0669]+/);
    const day = dayMatch ? dayMatch[0] : '١٤';
    const parts = rawStr.split(/[،•·,]/).map((s) => s.trim()).filter(Boolean);
    const weekday = parts[0] || 'السبت';
    return { month, day, weekday };
  } else {
    const enMonths = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    let month = 'NOV';
    const upper = rawStr.toUpperCase();
    for (const m of enMonths) {
      if (upper.includes(m)) {
        month = m;
        break;
      }
    }
    const dayMatch = rawStr.match(/\b([0-9]{1,2})\b/);
    const day = dayMatch ? dayMatch[1] : '14';
    const parts = rawStr.split(/[•·,]/).map((s) => s.trim()).filter(Boolean);
    const weekday = (parts[0] || 'SAT').slice(0, 3).toUpperCase();
    return { month, day, weekday };
  }
}

export function LandingPage({ events: propEvents, onSelectEvent, onNavigateToTickets }) {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [bookmarkedEvents, setBookmarkedEvents] = useState(new Set());
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Live real-time internal events state
  const [internalEvents, setInternalEvents] = useState(() => {
    try {
      if (adminService && typeof adminService.getAllEvents === 'function') {
        const dynamicList = adminService.getAllEvents();
        if (Array.isArray(dynamicList) && dynamicList.length > 0) {
          return dynamicList;
        }
      }
    } catch {
      // Safe fallback
    }
    return FEATURED_EVENTS;
  });

  useEffect(() => {
    let unsubscribe = null;
    if (adminService && typeof adminService.subscribe === 'function') {
      unsubscribe = adminService.subscribe((updated) => {
        if (Array.isArray(updated)) {
          setInternalEvents(updated);
        }
      });
    }

    const handleCustomEvent = (e) => {
      if (e?.detail?.events && Array.isArray(e.detail.events)) {
        setInternalEvents(e.detail.events);
      } else if (adminService && typeof adminService.getAllEvents === 'function') {
        setInternalEvents(adminService.getAllEvents());
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('ticketcraft:events-updated', handleCustomEvent);
    }

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
      if (typeof window !== 'undefined') {
        window.removeEventListener('ticketcraft:events-updated', handleCustomEvent);
      }
    };
  }, []);

  // Live Atomic Hold countdown simulation (5:00 -> 0:00)
  const [secondsRemaining, setSecondsRemaining] = useState(272); // Starts at 04:32 matching Figma
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Interactive Seating Showcase states
  const [showcaseZoom, setShowcaseZoom] = useState(100);
  const [activeShowcaseSeat, setActiveShowcaseSeat] = useState({
    row: 'F',
    num: 12,
    category: 'Stalls',
    price: language === 'ar' ? '١٨٠ ر.س' : 'SAR 180',
    viewNote:
      language === 'ar'
        ? 'الصالة الرئيسية · إطلالة مركزية واضحة ومباشرة'
        : 'Stalls · Clear, central stage view',
  });

  const allEvents = useMemo(() => {
    if (propEvents !== undefined && Array.isArray(propEvents)) {
      return propEvents;
    }
    return internalEvents;
  }, [propEvents, internalEvents]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
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
  }, [allEvents, searchQuery, selectedCategory]);

  const handleEventClick = (event) => {
    if (onSelectEvent) {
      onSelectEvent(event.id);
    }
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
  };

  const toggleBookmark = (eventId, e) => {
    e.stopPropagation();
    setBookmarkedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  };

  const scrollToFeaturedEvents = () => {
    const el = document.getElementById('featured-events');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const primaryEvent = filteredEvents.find((e) => e.isPrimary) || filteredEvents[0];
  const secondaryEvents = filteredEvents.filter((e) => e !== primaryEvent);

  const getEventTitle = (event) => (language === 'ar' && event.title_ar ? event.title_ar : event.title);
  const getEventVenue = (event) => (language === 'ar' && event.venue_ar ? event.venue_ar : event.venue);
  const getEventDate = (event) => (language === 'ar' && event.date_ar ? event.date_ar : event.date);
  const getEventCategory = (event) => (language === 'ar' && event.category_ar ? event.category_ar : event.category);
  const getEventStatusPill = (event) => (language === 'ar' && event.statusPill_ar ? event.statusPill_ar : event.statusPill);
  const getEventCapacity = (event) => (language === 'ar' && event.capacity_ar ? event.capacity_ar : event.capacity);
  const _getEventDescription = (event) => (language === 'ar' && event.description_ar ? event.description_ar : event.description);
  const getEventPriceRange = (event) => (language === 'ar' && event.priceRange_ar ? event.priceRange_ar : event.priceRange);
  const getEventCta = (event) => (language === 'ar' && event.ctaText_ar ? event.ctaText_ar : event.ctaText);

  // Mock seat layout rows for the Figma showcases (A to H)
  const SHOWCASE_ROWS = [
    { row: 'A', seats: ['b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a'] },
    { row: 'B', seats: ['a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b'] },
    { row: 'C', seats: ['a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a'] },
    { row: 'D', seats: ['a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'h', 'h', 'h', 'a', 'a', 'a', 'b'] },
    { row: 'E', seats: ['a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a'] },
    { row: 'F', seats: ['b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 's', 's', 's', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b'] },
    { row: 'G', seats: ['a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a'] },
    { row: 'H', seats: ['b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a', 'a', 'a', 'b', 'b', 'a', 'a', 'a', 'b', 'a'] },
  ];

  return (
    <div className="landing-page" data-testid="landing-page">
      {/* 1. HERO SECTION (Dark Forest Palette #101813 with Lime #D2FA69 Accents) */}
      <section className="figma-hero" aria-labelledby="hero-heading">
        <div className="hero-noise-overlay" aria-hidden="true" />
        <div className="hero-radial-glow" aria-hidden="true" />

        <div className="hero-wrapper">
          <div className="hero-split-grid">
            {/* Left Column: Promise, Discovery & Live Metrics */}
            <div className="hero-content-col">
              <div className="hero-section-marker">
                <span className="marker-dot" aria-hidden="true" />
                <span className="marker-text">
                  {language === 'ar' ? 'أمسيتك. مقعدك. بلا تردد.' : 'LESS FRICTION. MORE LIVE.'}
                </span>
              </div>

              {/* Accessible Primary Headline matching test query + Figma typography */}
              <h1 id="hero-heading" className="hero-display-title">
                <span className="sr-only">
                  {language === 'ar'
                    ? 'اكتشف واحجز تجارب وفعاليات استثنائية'
                    : 'Discover & Book Exceptional Live Experiences'}
                </span>
                {language === 'ar' ? (
                  <>
                    أمسيتك.<br />
                    مقعدك.<br />
                    <span className="text-highlight">بلا تردد.</span>
                  </>
                ) : (
                  <>
                    Your night.<br />
                    Your seat.<br />
                    <span className="text-highlight">No second<br />guesses.</span>
                  </>
                )}
              </h1>

              {/* Lead description */}
              <p className="hero-lead-text">
                {t(
                  'hero.subtitle',
                  'Pick the perfect view. Hold it for five minutes. Walk in with a pass that works—even when the internet doesn’t.'
                )}
              </p>

              {/* Search & Category Discovery Card */}
              <div className="hero-search-card" role="search" aria-label="Event search and filters">
                <div className="search-bar-row">
                  <span className="search-icon-box" aria-hidden="true">
                    <SearchIcon size={20} />
                  </span>
                  <input
                    type="text"
                    className="hero-search-field"
                    placeholder={
                      language === 'ar'
                        ? 'ابحث باسم الفنان، الفعالية أو القاعة...'
                        : 'Artist, event or venue'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="hero-search-input"
                    aria-label={t('hero.search_aria', 'Search events by keyword')}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-action"
                      onClick={() => setSearchQuery('')}
                      aria-label={t('hero.clear_search', 'Clear search text')}
                    >
                      &times;
                    </button>
                  )}
                  <button
                    type="button"
                    className="hero-search-submit-btn"
                    onClick={scrollToFeaturedEvents}
                  >
                    {language === 'ar' ? 'البحث عن الفعاليات' : 'Find events'}
                  </button>
                </div>

                <div className="hero-category-pills-row" role="group" aria-label="Category filters">
                  {CATEGORIES.map((cat) => {
                    const isActive = selectedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        className={`hero-pill-btn ${isActive ? 'active' : ''}`}
                        onClick={() => setSelectedCategory(cat.key)}
                        aria-pressed={isActive}
                        data-testid={`category-filter-${cat.key.toLowerCase().replace(/[^a-z0-9]/g, '-')}`}
                      >
                        {t(cat.labelKey, cat.fallback)}
                      </button>
                    );
                  })}
                </div>

                <div className="hero-guest-reassurance">
                  <span className="reassurance-check" aria-hidden="true">
                    <CheckIcon size={14} />
                  </span>
                  <span>
                    {language === 'ar'
                      ? 'لا حاجة لتسجيل حساب لتصفح المقاعد أو حجزها.'
                      : 'No account needed to browse or pick your seat.'}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Artwork, Floating Mini Seat Map & Digital Pass */}
            <div className="hero-visual-col">
              <div className="hero-photo-container hero-stage-backdrop">
                <div className="hero-stage-artwork" aria-hidden="true">
                  <div className="hero-stage-radial-glow" />
                  <div className="hero-stage-rings">
                    <span className="stage-ring ring-1" />
                    <span className="stage-ring ring-2" />
                    <span className="stage-ring ring-3" />
                  </div>
                  <div className="hero-stage-monogram">
                    <TicketIcon size={44} className="hero-monogram-icon" />
                    <span className="hero-monogram-text">TICKETCRAFT // 520 SEATS</span>
                  </div>
                </div>
                <div className="photo-badge-chip">
                  <span>{language === 'ar' ? 'اللحظة تبدأ هنا' : 'THE MOMENT STARTS HERE'}</span>
                </div>

                {/* Floating Interactive Mini Seat Map Preview */}
                <div className="floating-seatmap-card" aria-hidden="true">
                  <div className="mini-seatmap-header">
                    <div>
                      <h4 className="mini-event-name">
                        {language === 'ar' ? 'سيمفونية الليل' : 'Nocturne Symphony'}
                      </h4>
                      <p className="mini-event-sub">
                        {language === 'ar'
                          ? 'القاعة الكبرى · ٢٤ أكتوبر · ٨:٠٠ م'
                          : 'The Grand Hall · 24 Oct · 8:00 PM'}
                      </p>
                    </div>
                    <span className="mini-live-pill">
                      <span className="mini-pulse-dot" />
                      {language === 'ar' ? 'توافر فوري' : '● LIVE AVAILABILITY'}
                    </span>
                  </div>

                  <div className="mini-stage-block">
                    <div className="mini-stage-bar" />
                    <span className="mini-stage-text">S T A G E</span>
                  </div>

                  {/* 6 mini seat rows */}
                  <div className="mini-rows-stack">
                    {SHOWCASE_ROWS.slice(0, 6).map((r) => (
                      <div key={r.row} className="mini-seat-row">
                        <span className="mini-row-label">{r.row}</span>
                        <div className="mini-seats-line">
                          {r.seats.slice(0, 14).map((status, idx) => (
                            <span
                              key={idx}
                              className={`mini-seat-cell seat-status-${status}`}
                            />
                          ))}
                        </div>
                        <span className="mini-row-label">{r.row}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mini-map-footer">
                    <span className="mini-selected-info">
                      {language === 'ar'
                        ? '٣ مقاعد محددة · الصالة الرئيسية، الصف F'
                        : '3 seats selected · Stalls, Row F'}
                    </span>
                    <div className="mini-zoom-pill">
                      <span>−</span>
                      <span>100%</span>
                      <span>+</span>
                    </div>
                  </div>

                  {/* Protected Atomic Hold Bar */}
                  <div
                    className="mini-checkout-strip"
                    onClick={() => primaryEvent && handleEventClick(primaryEvent)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="strip-hold-status">
                      <LockIcon size={14} />
                      <span>
                        {language === 'ar' ? 'قفل المقاعد · ' : 'Seat hold · '}
                        {formatTimer(secondsRemaining)}
                      </span>
                    </div>
                    <span className="strip-cta">
                      {language === 'ar' ? 'المتابعة للدفع ←' : 'Checkout →'}
                    </span>
                  </div>
                </div>

                {/* Floating Mobile Digital Wallet Pass Mockup */}
                <div className="floating-digital-pass" aria-hidden="true">
                  <div className="pass-phone-shell">
                    <div className="pass-status-bar">
                      <span className="phone-clock">9:41</span>
                      <div className="phone-icons">
                        <span className="phone-dot" />
                        <span className="phone-dot" />
                        <span className="phone-battery" />
                      </div>
                    </div>

                    <div className="pass-inner-card">
                      <div className="pass-brand-row">
                        <span className="pass-brand-name">TicketCraft</span>
                        <TicketIcon size={16} />
                      </div>

                      <h4 className="pass-event-title">
                        {language === 'ar' ? 'سيمفونية الليل' : 'Nocturne Symphony'}
                      </h4>
                      <p className="pass-event-venue">
                        {language === 'ar'
                          ? '٢٤ أكتوبر ٢٠٢٦ · ٨:٠٠ م\nالقاعة الكبرى، الرياض'
                          : '24 OCT 2026 · 8:00 PM\nThe Grand Hall, Riyadh'}
                      </p>

                      <div className="pass-tier-grid">
                        <div className="pass-tier-item">
                          <span className="pass-tier-label">SECTION</span>
                          <span className="pass-tier-val">STALLS</span>
                        </div>
                        <div className="pass-tier-item">
                          <span className="pass-tier-label">ROW</span>
                          <span className="pass-tier-val">F</span>
                        </div>
                        <div className="pass-tier-item">
                          <span className="pass-tier-label">SEAT</span>
                          <span className="pass-tier-val">12</span>
                        </div>
                      </div>

                      <div className="pass-qr-container">
                        <div className="pass-qr-box">
                          <QrCodeIcon size={84} />
                        </div>
                        <div className="pass-qr-badge">
                          <ShieldIcon size={12} />
                          <span>VERIFIED · OFFLINE READY</span>
                        </div>
                        <span className="pass-demo-code">TC–NOC–F12 · DEMO PASS</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Platform Promises & Architectural Metrics Bar */}
          <div className="hero-metrics-bar" role="region" aria-label="Platform Guarantees">
            <div className="metric-cell" data-testid="metric-pill-seats">
              <span className="metric-stat-number">{t('hero.metrics.seats_val', '520')}</span>
              <span className="metric-stat-desc">{t('hero.metrics.seats_label', 'Realtime Seats')}</span>
            </div>

            <div className="metric-cell" data-testid="metric-pill-lock">
              <span className="metric-stat-number">{t('hero.metrics.lock_val', '300s')}</span>
              <span className="metric-stat-desc">{t('hero.metrics.lock_label', 'Pessimistic Atomic Lock')}</span>
            </div>

            <div className="metric-cell" data-testid="metric-pill-qr">
              <span className="metric-stat-number">{t('hero.metrics.qr_val', 'HMAC-SHA256')}</span>
              <span className="metric-stat-desc">{t('hero.metrics.qr_label', 'Signed QR Passes')}</span>
            </div>

            <button
              type="button"
              className="scroll-cue-btn"
              onClick={scrollToFeaturedEvents}
            >
              <span>{language === 'ar' ? 'اختر ليلتك القادمة' : 'FIND YOUR NEXT NIGHT'}</span>
              <ChevronDownIcon size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* 2. FEATURED LIVE EXPERIENCES (Light Cream #F4F3EB Palette) */}
      <section
        id="featured-events"
        className="figma-featured-section"
        aria-labelledby="featured-events-heading"
      >
        <div className="section-bounds">
          <div className="section-title-row">
            <div>
              <div className="section-eyebrow-pill">
                <span className="marker-dot-dark" aria-hidden="true" />
                <span>{language === 'ar' ? 'أمسيات تبدأ من هنا' : 'GOOD NIGHTS START HERE'}</span>
              </div>
              <h2 id="featured-events-heading" className="featured-section-heading">
                {language === 'ar' ? 'تجارب حية تستحق حضورك.' : 'Worth being there for.'}
              </h2>
            </div>
            <button
              type="button"
              className="view-all-events-btn"
              onClick={handleResetFilters}
            >
              <span>{language === 'ar' ? 'عرض جميع الفعاليات' : 'View all events'}</span>
              <ArrowUpRightIcon size={16} />
            </button>
          </div>

          {filteredEvents.length === 0 ? (
            <div className="events-empty-state" data-testid="events-empty-state">
              <span className="empty-state-icon" aria-hidden="true">
                <TicketIcon size={36} />
              </span>
              <h3>{t('events.empty_title', 'No Events Found')}</h3>
              <p>{t('events.empty_desc', "We couldn't find any events matching your search.")}</p>
              <button
                type="button"
                className="btn-reset-filters"
                onClick={handleResetFilters}
              >
                {t('events.reset_filters', 'Reset Filters')}
              </button>
            </div>
          ) : (
            <div className="events-cards-grid">
              {/* Primary Event Card */}
              {primaryEvent && (() => {
                const dateParts = parseEventDateBlock(primaryEvent, language);
                return (
                  <article
                    className="event-figma-card event-card-primary"
                    data-testid="primary-event-card"
                    aria-label={`Featured event: ${getEventTitle(primaryEvent)}`}
                  >
                    <div
                      className="card-media-wrapper card-ticket-pass"
                      style={{
                        background:
                          primaryEvent.imageGradient ||
                          'linear-gradient(135deg, #101813 0%, #16261c 50%, #203627 100%)',
                      }}
                    >
                      <div className="ticket-pass-pattern" aria-hidden="true">
                        <div className="ticket-mesh-glow" />
                        <span className="ticket-pass-watermark">TICKETCRAFT // LIVE PASS</span>
                      </div>

                      <div className="media-top-badges">
                        <div className="media-badge-group">
                          <span className="category-tag-pill">{getEventCategory(primaryEvent).toUpperCase()}</span>
                          <span className="ticket-live-dot-pill">
                            <span className="live-pulsing-dot" />
                            {language === 'ar' ? 'حي' : 'LIVE'}
                          </span>
                        </div>
                        <button
                          type="button"
                          className={`save-event-icon-btn ${bookmarkedEvents.has(primaryEvent.id) ? 'bookmarked' : ''}`}
                          onClick={(e) => toggleBookmark(primaryEvent.id, e)}
                          aria-label="Bookmark event"
                        >
                          <TicketIcon size={16} />
                        </button>
                      </div>

                      <div className="ticket-pass-centerpiece">
                        <div className="ticket-date-block" aria-label={getEventDate(primaryEvent)}>
                          <span className="ticket-date-month">{dateParts.month}</span>
                          <span className="ticket-date-day">{dateParts.day}</span>
                          <span className="ticket-date-weekday">{dateParts.weekday}</span>
                        </div>

                        <div className="ticket-genre-emblem" aria-hidden="true">
                          {getCategoryVectorIcon(primaryEvent.category)}
                        </div>
                      </div>

                      <div className="ticket-perforation-edge" aria-hidden="true">
                        <span className="ticket-notch notch-left" />
                        <span className="ticket-notch-line" />
                        <span className="ticket-notch notch-right" />
                      </div>
                    </div>

                    <div className="card-info-body">
                      <span className="card-datetime-label">{getEventDate(primaryEvent)}</span>
                      <h3 className="card-title-text">{getEventTitle(primaryEvent)}</h3>

                      <div className="card-venue-row">
                        <MapPinIcon size={15} />
                        <span>{getEventVenue(primaryEvent)}</span>
                      </div>

                      {/* Preserves required live map and price attributes for tests */}
                      <div className="card-badges-row">
                        <span className="status-pill-subtle">{getEventStatusPill(primaryEvent)}</span>
                        <span className="capacity-pill-subtle">{getEventCapacity(primaryEvent)}</span>
                      </div>

                      <div className="card-footer-strip">
                        <div className="price-tag-group">
                          <span className="price-from-label">{t('events.tickets_from', 'Tickets from')}</span>
                          <span className="price-value-bold">{getEventPriceRange(primaryEvent)}</span>
                        </div>

                        <button
                          type="button"
                          className="btn-select-seats btn-select-seats-primary"
                          data-testid="btn-select-seats-symphony"
                          onClick={() => handleEventClick(primaryEvent)}
                        >
                          <span>{getEventCta(primaryEvent)}</span>
                          <ArrowUpRightIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })()}

              {/* Secondary Event Cards */}
              {secondaryEvents.map((event) => {
                const dateParts = parseEventDateBlock(event, language);
                return (
                  <article
                    key={event.id}
                    className="event-figma-card event-card-secondary"
                    data-testid={`event-card-${event.id}`}
                    aria-label={`Event: ${getEventTitle(event)}`}
                  >
                    <div
                      className="card-media-wrapper card-ticket-pass"
                      style={{
                        background:
                          event.imageGradient ||
                          'linear-gradient(135deg, #101813 0%, #16261c 50%, #203627 100%)',
                      }}
                    >
                      <div className="ticket-pass-pattern" aria-hidden="true">
                        <div className="ticket-mesh-glow" />
                        <span className="ticket-pass-watermark">PASS // 520 SEATS</span>
                      </div>

                      <div className="media-top-badges">
                        <span className="category-tag-pill">{getEventCategory(event).toUpperCase()}</span>
                        <button
                          type="button"
                          className={`save-event-icon-btn ${bookmarkedEvents.has(event.id) ? 'bookmarked' : ''}`}
                          onClick={(e) => toggleBookmark(event.id, e)}
                          aria-label="Bookmark event"
                        >
                          <TicketIcon size={16} />
                        </button>
                      </div>

                      <div className="ticket-pass-centerpiece">
                        <div className="ticket-date-block" aria-label={getEventDate(event)}>
                          <span className="ticket-date-month">{dateParts.month}</span>
                          <span className="ticket-date-day">{dateParts.day}</span>
                          <span className="ticket-date-weekday">{dateParts.weekday}</span>
                        </div>

                        <div className="ticket-genre-emblem" aria-hidden="true">
                          {getCategoryVectorIcon(event.category)}
                        </div>
                      </div>

                      <div className="ticket-perforation-edge" aria-hidden="true">
                        <span className="ticket-notch notch-left" />
                        <span className="ticket-notch-line" />
                        <span className="ticket-notch notch-right" />
                      </div>
                    </div>

                    <div className="card-info-body">
                      <span className="card-datetime-label">{getEventDate(event)}</span>
                      <h3 className="card-title-text">{getEventTitle(event)}</h3>

                      <div className="card-venue-row">
                        <MapPinIcon size={15} />
                        <span>{getEventVenue(event)}</span>
                      </div>

                      <div className="card-badges-row">
                        <span className="status-pill-subtle">{getEventStatusPill(event)}</span>
                        <span className="capacity-pill-subtle">{getEventCapacity(event)}</span>
                      </div>

                      <div className="card-footer-strip">
                        <div className="price-tag-group">
                          <span className="price-from-label">{t('events.tickets', 'Tickets')}</span>
                          <span className="price-value-bold">{getEventPriceRange(event)}</span>
                        </div>

                        <button
                          type="button"
                          className="btn-select-seats"
                          onClick={() => handleEventClick(event)}
                        >
                          <span>{getEventCta(event)}</span>
                          <ArrowUpRightIcon size={16} />
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <div className="featured-curation-note">
            <p>
              {language === 'ar'
                ? 'مزيج من الكلاسيكية وعصرية الإيقاع.. ليلة تمثلك وتشبه شغفك.'
                : 'A little classical. A little chaos. A night that feels like you.'}
            </p>
          </div>
        </div>
      </section>

      {/* 3. INTERACTIVE SEATING SHOWCASE (Figma "A Better Point of View") */}
      <section className="figma-showcase-section" aria-labelledby="showcase-heading">
        <div className="section-bounds">
          <div className="showcase-header-row">
            <div className="showcase-title-block">
              <div className="section-eyebrow-pill">
                <span className="marker-dot-dark" aria-hidden="true" />
                <span>{language === 'ar' ? 'زاوية رؤية أفضل' : 'A BETTER POINT OF VIEW'}</span>
              </div>
              <h2 id="showcase-heading" className="showcase-main-heading">
                {language === 'ar'
                  ? 'لا تحجز مقعدك فقط.\nاعرف إطلالتك مسبقاً.'
                  : 'Don’t just book a seat.\nKnow your seat.'}
              </h2>
            </div>
            <p className="showcase-support-copy">
              {language === 'ar'
                ? 'عش تفاصيل الأمسية كما ترغب. استكشف القاعة وقارن الإطلالات وشاهد التوافر الفوري بدقة بالغة.'
                : 'Get closer to the night you want. Explore the room, compare views, and see what’s available—right now.'}
            </p>
          </div>

          <div className="showcase-demonstration-grid">
            {/* Left: Map Workspace */}
            <div className="showcase-map-workspace">
              <div className="workspace-filter-pills">
                <div className="workspace-filter-btn">
                  <span className="filter-type">{language === 'ar' ? 'الفئة:' : 'Category'}</span>
                  <span className="filter-val">{language === 'ar' ? 'الصالة الرئيسية' : 'Stalls'}</span>
                  <ChevronDownIcon size={14} />
                </div>
                <div className="workspace-filter-btn">
                  <span className="filter-type">{language === 'ar' ? 'السعر:' : 'Price'}</span>
                  <span className="filter-val">{language === 'ar' ? '١٠٠–٢٥٠ ر.س' : 'SAR 100–250'}</span>
                  <ChevronDownIcon size={14} />
                </div>
                <div className="workspace-filter-btn">
                  <span className="filter-type">{language === 'ar' ? 'المسافة:' : 'Proximity'}</span>
                  <span className="filter-val">{language === 'ar' ? 'قريب من المسرح' : 'Near stage'}</span>
                  <ChevronDownIcon size={14} />
                </div>
              </div>

              {/* Live Interactive Map Box */}
              <div className="showcase-map-canvas">
                <div className="canvas-header-bar">
                  <div>
                    <h4 className="canvas-event-title">Nocturne Symphony</h4>
                    <span className="canvas-event-meta">The Grand Hall · 24 Oct · 8:00 PM</span>
                  </div>
                  <span className="canvas-live-badge">● LIVE AVAILABILITY</span>
                </div>

                <div className="canvas-stage-area">
                  <div className="canvas-stage-line" />
                  <span className="canvas-stage-tag">S T A G E</span>
                </div>

                {/* 8 Rows Seat Grid */}
                <div className="canvas-seat-rows-scroll" data-testid="showcase-seat-scroll">
                  <div className="canvas-seat-rows" style={{ transform: `scale(${showcaseZoom / 100})`, transformOrigin: 'top center', transition: 'transform 0.2s ease' }}>
                    {SHOWCASE_ROWS.map((r) => (
                      <div key={r.row} className="canvas-row">
                        <span className="row-letter">{r.row}</span>
                        <div className="row-seats">
                          {r.seats.map((status, idx) => {
                            const seatNum = idx + 1;
                            const isCurrentlySelected = activeShowcaseSeat.row === r.row && activeShowcaseSeat.num === seatNum;
                            return (
                              <button
                                key={idx}
                                type="button"
                                className={`seat-unit seat-status-${isCurrentlySelected ? 's' : status}`}
                                onClick={() => {
                                  setActiveShowcaseSeat({
                                    row: r.row,
                                    num: seatNum,
                                    category: r.row <= 'C' ? 'VIP' : 'Stalls',
                                    price: r.row <= 'C' ? (language === 'ar' ? '٢٤٠ ر.س' : 'SAR 240') : (language === 'ar' ? '١٨٠ ر.س' : 'SAR 180'),
                                    viewNote:
                                      language === 'ar'
                                        ? `الصف ${r.row} · المقعد ${seatNum} · إطلالة مركزية واضحة`
                                        : `Row ${r.row} · Seat ${seatNum} · Clear, central stage view`,
                                  });
                                }}
                                aria-label={`Row ${r.row} Seat ${seatNum}`}
                              />
                            );
                          })}
                        </div>
                        <span className="row-letter">{r.row}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Floating Seat Hover Preview Card */}
                <div className="floating-seat-view-card">
                  <div className="seat-view-vector-stage" aria-hidden="true">
                    <div className="mini-stage-curve" />
                    <span className="mini-stage-cone" />
                    <span className="mini-view-angle-text">STAGE 100% SIGHTLINE</span>
                  </div>
                  <div className="seat-view-info">
                    <div className="seat-view-title-row">
                      <strong>{`${language === 'ar' ? 'الصف' : 'Row'} ${activeShowcaseSeat.row} · ${language === 'ar' ? 'المقعد' : 'Seat'} ${activeShowcaseSeat.num}`}</strong>
                      <span className="seat-view-price">{activeShowcaseSeat.price}</span>
                    </div>
                    <p className="seat-view-note">{activeShowcaseSeat.viewNote}</p>
                    <span className="seat-view-badge">SELECTED</span>
                  </div>
                </div>

                {/* Map Controls */}
                <div className="canvas-controls-bar">
                  <span className="controls-seat-count">
                    {language === 'ar'
                      ? `الصف ${activeShowcaseSeat.row} · مقعد محدد`
                      : `Row ${activeShowcaseSeat.row} · Selected Seat`}
                  </span>
                  <div className="controls-zoom-group">
                    <button
                      type="button"
                      className="zoom-btn"
                      onClick={() => setShowcaseZoom((z) => Math.max(z - 10, 80))}
                    >
                      −
                    </button>
                    <span className="zoom-value">{showcaseZoom}%</span>
                    <button
                      type="button"
                      className="zoom-btn"
                      onClick={() => setShowcaseZoom((z) => Math.min(z + 10, 130))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="canvas-drag-hint">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                    <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                    <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                    <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                  </svg>
                  <span>
                    {language === 'ar'
                      ? 'اسحب للاستكشاف · مرر للتكبير · انقر فوق أي مقعد للمعاينة'
                      : 'Drag to explore · Scroll to zoom · Select a seat to preview'}
                  </span>
                </div>
              </div>

              {/* Seat State Legend */}
              <div className="showcase-legend-row">
                <div className="legend-item">
                  <span className="legend-swatch swatch-available" />
                  <span>{language === 'ar' ? 'متاح' : 'Available'}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-swatch swatch-selected" />
                  <span>{language === 'ar' ? 'محدد' : 'Selected'}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-swatch swatch-held" />
                  <span>{language === 'ar' ? 'محجوز مؤقتاً' : 'Held'}</span>
                </div>
                <div className="legend-item">
                  <span className="legend-swatch swatch-booked" />
                  <span>{language === 'ar' ? 'مباع' : 'Booked'}</span>
                </div>
              </div>
            </div>

            {/* Right: Benefits Breakdown & Atomic Hold Summary */}
            <div className="showcase-breakdown-col">
              <div className="map-benefit-item">
                <div className="benefit-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="5 9 2 12 5 15" />
                    <polyline points="9 5 12 2 15 5" />
                    <polyline points="15 19 12 22 9 19" />
                    <polyline points="19 9 22 12 19 15" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <line x1="12" y1="2" x2="12" y2="22" />
                  </svg>
                </div>
                <div>
                  <h4 className="benefit-title">
                    {language === 'ar' ? 'استكشف كافة الزوايا' : 'Explore every angle'}
                  </h4>
                  <p className="benefit-desc">
                    {language === 'ar'
                      ? 'تحرك عبر القاعة وقرّب العرض وصولاً إلى أدق تفاصيل كل مقعد.'
                      : 'Pan across the venue and zoom down to the individual seat.'}
                  </p>
                </div>
              </div>

              <div className="map-benefit-item">
                <div className="benefit-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="21" x2="4" y2="14" />
                    <line x1="4" y1="10" x2="4" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12" y2="3" />
                    <line x1="20" y1="21" x2="20" y2="16" />
                    <line x1="20" y1="12" x2="20" y2="3" />
                    <line x1="1" y1="14" x2="7" y2="14" />
                    <line x1="9" y1="8" x2="15" y2="8" />
                    <line x1="17" y1="16" x2="23" y2="16" />
                  </svg>
                </div>
                <div>
                  <h4 className="benefit-title">
                    {language === 'ar' ? 'اختر مكانك المثالي' : 'Find your sweet spot'}
                  </h4>
                  <p className="benefit-desc">
                    {language === 'ar'
                      ? 'صنّف المقاعد حسب الفئة والسعر والمسافة من المسرح.'
                      : 'Filter by category, price or distance from the stage.'}
                  </p>
                </div>
              </div>

              <div className="map-benefit-item">
                <div className="benefit-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="2" />
                    <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14" />
                  </svg>
                </div>
                <div>
                  <h4 className="benefit-title">
                    {language === 'ar' ? 'تزامن فوري حقيقي' : 'Live means live'}
                  </h4>
                  <p className="benefit-desc">
                    {language === 'ar'
                      ? 'تحديثات مباشرة في أجزاء من الثانية. لا مقاعد محجوزة مسبقاً ولا تعارضات.'
                      : 'Availability updates in real time. No stale inventory, no conflicting selections.'}
                  </p>
                </div>
              </div>

              {/* "Your view. Secured." Atomic Hold Card */}
              <div className="showcase-secured-card">
                <div className="secured-header">
                  <span className="secured-title">
                    {language === 'ar' ? 'إطلالتك مضمونة ومحمية.' : 'Your view. Secured.'}
                  </span>
                  <LockIcon size={18} />
                </div>
                <span className="secured-seat-range">
                  {language === 'ar'
                    ? 'الصالة الرئيسية · الصف F · المقاعد 10، 11، 12'
                    : 'Stalls · Row F · Seats 10, 11, 12'}
                </span>
                <div className="secured-timer-row">
                  <span className="secured-countdown">{formatTimer(secondsRemaining)}</span>
                  <span className="secured-timer-sub">
                    {language === 'ar' ? '٣٠٠ ثانية.\nمحفوظة حصرياً لك.' : '300 seconds.\nExclusively yours.'}
                  </span>
                </div>
                <button
                  type="button"
                  className="btn-secured-cta"
                  onClick={() => primaryEvent && handleEventClick(primaryEvent)}
                >
                  <span>{language === 'ar' ? 'اختر مقعدك' : 'Pick your seat'}</span>
                  <ArrowUpRightIcon size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WHY TICKETCRAFT? (BUILT FOR THE MOMENT - Architectural Deep Dive) */}
      <section
        id="why-ticketcraft"
        className="why-ticketcraft-section"
        aria-labelledby="why-heading"
        data-testid="why-ticketcraft-section"
      >
        <div className="section-bounds">
          <div className="why-section-header">
            <div className="why-title-column">
              <div className="section-eyebrow-pill-lime">
                <span className="marker-dot-lime" aria-hidden="true" />
                <span>{language === 'ar' ? 'صُمم لأجل هذه اللحظة' : 'BUILT FOR THE MOMENT'}</span>
              </div>
              <h2 id="why-heading" className="why-large-title">
                {t('why.title', 'Why TicketCraft?')}
              </h2>
              <p className="why-large-tagline">
                {language === 'ar'
                  ? 'سحر الأمسية مباشر.\nويقين الحجز هندسي.'
                  : 'The magic is live.\nThe certainty is engineered.'}
              </p>
            </div>
            <p className="why-supporting-text">
              {language === 'ar'
                ? 'من أول نقرة وحتى مسح التذكرة عند البوابة، أدق التفاصيل التي لا ينبغي أن تقلق بشأنها تم التكفل بها مسبقاً.'
                : 'From the first click to the gate scan, the details you shouldn’t have to think about are already handled.'}
            </p>
          </div>

          <div className="why-core-cards-grid">
            {/* Card 1: Atomic Reservation Engine (300s) */}
            <div className="why-tech-card" data-testid="feature-card-realtime-hold">
              <div className="card-top-row">
                <div className="tech-icon-circle icon-circle-lime">
                  <LockIcon size={22} />
                </div>
                <span className="tech-badge-chip">01 / RESERVATION ENGINE</span>
              </div>

              <div className="hold-display-module">
                <span className="giant-timer-digits">{formatTimer(secondsRemaining)}</span>
                <span className="timer-rule-text">
                  {language === 'ar'
                    ? 'مقعد واحد. حاجز واحد. بالضبط ٣٠٠ ثانية.'
                    : 'ONE SEAT. ONE HOLDER. EXACTLY 300 SECONDS.'}
                </span>
                <div className="hold-progress-track">
                  <div
                    className="hold-progress-fill"
                    style={{ width: `${(secondsRemaining / 300) * 100}%` }}
                  />
                </div>
                <div className="lifecycle-stepper">
                  <span className="step-point">SELECT</span>
                  <span className="step-point active-point">ATOMIC LOCK</span>
                  <span className="step-point">PAY & CONFIRM</span>
                </div>
              </div>

              <h3 className="tech-card-heading">
                {t('why.card2.title', 'Collision-Proof Realtime Hold (300s)')}
              </h3>
              <p className="tech-card-subhead">
                {language === 'ar' ? 'لا يمكن لأحد أن يأخذ مقعدك.' : 'Your seat can’t be someone else’s.'}
              </p>
              <p className="tech-card-body">
                {t(
                  'why.card2.body',
                  'A concurrency-safe atomic lock protects your selection during checkout. Zero double-booking—even when everyone wants the same seat.'
                )}
              </p>

              <div className="tech-card-rule">
                <ClockIcon size={16} />
                <span>
                  {language === 'ar'
                    ? 'نفد الوقت؟ تعود المقاعد غير المؤكدة فوراً للتوافر العام.'
                    : 'Time runs out? Unpurchased seats release automatically back to availability.'}
                </span>
              </div>
            </div>

            {/* Card 2: Offline Security Architecture */}
            <div className="why-tech-card" data-testid="feature-card-qr-passes">
              <div className="card-top-row">
                <div className="tech-icon-circle icon-circle-lime">
                  <QrCodeIcon size={22} />
                </div>
                <span className="tech-badge-chip">02 / OFFLINE SECURITY</span>
              </div>

              <div className="crypto-verification-module">
                <div className="crypto-qr-stamp">
                  <QrCodeIcon size={88} />
                </div>
                <div className="crypto-layers-stack">
                  <div className="crypto-layer-item">
                    <LockIcon size={16} />
                    <span>{language === 'ar' ? 'موقعة تشفيرياً' : 'Cryptographically signed'}</span>
                  </div>
                  <div className="crypto-layer-item">
                    <ShieldIcon size={16} />
                    <span>{language === 'ar' ? 'تحقق على الجهاز' : 'Verified on device'}</span>
                  </div>
                  <div className="crypto-layer-item">
                    <ZapIcon size={16} />
                    <span>{language === 'ar' ? 'تحقق ١٠٠٪ دون إنترنت' : '100% offline validation'}</span>
                  </div>
                </div>
              </div>

              <h3 className="tech-card-heading">
                {t('why.card3.title', 'Offline Web Crypto QR Passes')}
              </h3>
              <p className="tech-card-subhead">
                {language === 'ar' ? 'لا توجد شبكة؟ لا زال الضوء أخضر.' : 'No signal. Still a green light.'}
              </p>
              <p className="tech-card-body">
                {t(
                  'why.card3.body',
                  'Every digital pass carries a tamper-proof cryptographic QR. Gate devices validate its signature autonomously, without venue internet connectivity.'
                )}
              </p>

              <div className="tech-card-rule">
                <CheckIcon size={16} />
                <span>
                  {language === 'ar'
                    ? 'توليد فوري للبطاقات. ومسح سريع بأجزاء من الثانية.'
                    : 'Instant pass generation. Millisecond mobile-camera verification.'}
                </span>
              </div>
            </div>

            {/* Card 3: 60fps Pan-Zoom SVG Engine */}
            <div className="why-tech-card" data-testid="feature-card-svg-engine">
              <div className="card-top-row">
                <div className="tech-icon-circle icon-circle-lime">
                  <ZapIcon size={22} />
                </div>
                <span className="tech-badge-chip">03 / HIGH-PERF ENGINE</span>
              </div>

              <div className="svg-engine-module">
                <div className="engine-fps-pill">
                  <span className="fps-number">60</span>
                  <span className="fps-label">FPS VECTOR LOOP</span>
                </div>
                <div className="topology-badge-row">
                  <span className="topo-pill">520+ AUDITORIUM SEATS</span>
                  <span className="topo-pill">GPU ACCELERATED</span>
                </div>
              </div>

              <h3 className="tech-card-heading">
                {t('why.card1.title', '60fps Pan-Zoom SVG Engine')}
              </h3>
              <p className="tech-card-body">
                {t(
                  'why.card1.body',
                  'Hardware-accelerated vector rendering for 520+ individual seats with fluid pinch, scroll wheel zoom, and instant hover inspection without DOM lag or layout thrashing.'
                )}
              </p>

              <ul className="engine-bullets-list">
                <li>{t('why.card1.bullet1', 'Sub-16ms render loop with native vector scaling')}</li>
                <li>{t('why.card1.bullet2', 'Accessible ARIA grid navigation with Arrow keys')}</li>
                <li>{t('why.card1.bullet3', 'Color-blind friendly category palette')}</li>
              </ul>
            </div>
          </div>

          {/* Frictionless Essentials Row */}
          <div className="frictionless-row">
            <div className="frictionless-item">
              <div className="frictionless-icon">
                <UserIcon size={20} />
              </div>
              <div>
                <h4 className="frictionless-title">
                  {language === 'ar' ? 'تجاوز جدار التسجيل الإجباري' : 'Skip the sign-up wall'}
                </h4>
                <p className="frictionless-desc">
                  {language === 'ar'
                    ? 'تصفح الفعاليات، اختر مقاعدك وادفع كزائر.'
                    : 'Browse, choose seats and check out as a guest.'}
                </p>
              </div>
            </div>

            <div className="frictionless-item">
              <div className="frictionless-icon">
                <DownloadIcon size={20} />
              </div>
              <div>
                <h4 className="frictionless-title">
                  {language === 'ar' ? 'بطاقتك بالصيغة التي تفضلها' : 'Your pass, your format'}
                </h4>
                <p className="frictionless-desc">
                  {language === 'ar'
                    ? 'تصدير بضغطة زر لملفات PDF عالية الدقة وصور PNG رقمية.'
                    : 'One-click, high-resolution PDF and PNG exports.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS (Three Steps. Then You're There) */}
      <section className="figma-how-section" aria-labelledby="how-heading">
        <div className="section-bounds">
          <div className="how-header-row">
            <div>
              <div className="section-eyebrow-pill">
                <span className="marker-dot-dark" aria-hidden="true" />
                <span>{language === 'ar' ? 'ثلاث خطوات بسيطة.. وأنت هناك' : 'THREE STEPS. THEN YOU’RE THERE.'}</span>
              </div>
              <h2 id="how-heading" className="how-title">
                {language === 'ar' ? 'خطوات دفع أسهل.. لتستمتع بالعرض أسرع.' : 'Less checkout. More showtime.'}
              </h2>
            </div>
            <ArrowRightIcon size={32} />
          </div>

          <div className="how-steps-grid">
            <div className="how-step-card">
              <div className="step-num-bar">
                <span className="step-index">01</span>
                <span className="step-line" />
              </div>
              <div className="step-preview-tile">
                <div className="tile-top-row">
                  <TicketIcon size={20} />
                  <strong>SAR 180</strong>
                </div>
                <div className="tile-bottom-row">
                  <span className="tile-dot" />
                  <span>Stalls · Row F · Seat 12</span>
                </div>
              </div>
              <h3 className="step-heading">{language === 'ar' ? 'اختر مقعدك' : 'Pick Seat'}</h3>
              <p className="step-desc">
                {language === 'ar'
                  ? 'استكشف الخريطة التفاعلية وقارن زوايا الرؤية بأسعار شفافة وواضحة.'
                  : 'Explore the visual map, compare your view and choose your spot with transparent pricing.'}
              </p>
            </div>

            <div className="how-step-card">
              <div className="step-num-bar">
                <span className="step-index">02</span>
                <span className="step-line" />
              </div>
              <div className="step-preview-tile">
                <div className="tile-top-row">
                  <LockIcon size={20} />
                  <strong>05:00</strong>
                </div>
                <div className="tile-bottom-row">
                  <span className="tile-dot" />
                  <span>{language === 'ar' ? 'دفع محمي' : 'Protected checkout'}</span>
                </div>
              </div>
              <h3 className="step-heading">{language === 'ar' ? 'احجز وادفع' : 'Hold & Pay'}</h3>
              <p className="step-desc">
                {language === 'ar'
                  ? 'تُقفل مقاعدك فورياً لخمس دقائق. ادفع بأمان كزائر دون الحاجة لتسجيل حساب.'
                  : 'Your seats lock instantly for five minutes. Pay securely as a guest, without creating an account.'}
              </p>
            </div>

            <div className="how-step-card">
              <div className="step-num-bar">
                <span className="step-index">03</span>
                <span className="step-line" />
              </div>
              <div className="step-preview-tile">
                <div className="tile-top-row">
                  <QrCodeIcon size={20} />
                  <strong>ADMIT ✓</strong>
                </div>
                <div className="tile-bottom-row">
                  <span className="tile-dot" />
                  <span>Cryptographic QR verified</span>
                </div>
              </div>
              <h3 className="step-heading">{language === 'ar' ? 'دخول فوري دون إنترنت' : 'Instant Offline Entry'}</h3>
              <p className="step-desc">
                {language === 'ar'
                  ? 'تصلك بطاقتك الرقمية فوراً. احفظها واعرضها عند البوابة وتعمل حتى مع انقطاع الشبكة.'
                  : 'Your digital pass arrives instantly. Save it, show it, and get scanned in—even without venue internet.'}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. VENUE & ORGANIZER ECOSYSTEM */}
      <section id="ecosystem" className="figma-ecosystem-section" aria-labelledby="ecosystem-heading">
        <div className="section-bounds">
          <div className="ecosystem-header-row">
            <div>
              <div className="section-eyebrow-pill-lime">
                <span className="marker-dot-lime" aria-hidden="true" />
                <span>{language === 'ar' ? 'لصُنّاع الأمسيات الاستثنائية' : 'FOR THE PEOPLE BEHIND THE NIGHT'}</span>
              </div>
              <h2 id="ecosystem-heading" className="ecosystem-large-heading">
                {language === 'ar' ? 'قاعة ممتلئة.\nورؤية تشغيلية واضحة.' : 'A full house.\nA clear picture.'}
              </h2>
            </div>
            <div className="ecosystem-intro-col">
              <p>
                {language === 'ar'
                  ? 'مساحة عمل موحدة لإدارة قاعتك وإيراداتك ودخول الجماهير بسلاسة من الكواليس وحتى البوابة الخارجية.'
                  : 'One connected workspace for your venue, your revenue and every arrival. Keep the experience moving—from backstage to the front gate.'}
              </p>
              <button
                type="button"
                className="btn-organizer-explore"
                onClick={scrollToFeaturedEvents}
              >
                <span>{language === 'ar' ? 'استكشف أدوات المنظمين' : 'Explore organizer tools'}</span>
                <ArrowUpRightIcon size={16} />
              </button>
            </div>
          </div>

          <div className="ecosystem-suite-grid">
            {/* Organizer Dashboard Mockup */}
            <div className="dashboard-window-card">
              <div className="dash-sidebar">
                <span className="dash-brand">TicketCraft</span>
                <span className="dash-workspace-label">ORGANIZER WORKSPACE</span>
                <ul className="dash-nav-list">
                  <li className="active"><BarChart3Icon size={14} /> Overview</li>
                  <li><CalendarIcon size={14} /> Events</li>
                  <li><TicketIcon size={14} /> Seating</li>
                  <li><QrCodeIcon size={14} /> Gate check-ins</li>
                  <li><LockIcon size={14} /> Settings</li>
                </ul>
                <span className="dash-venue-tag">The Grand Hall, Riyadh</span>
              </div>

              <div className="dash-content-area">
                <div className="dash-title-strip">
                  <div>
                    <h4>Nocturne Symphony</h4>
                    <span>24 October 2026 · Live event overview</span>
                  </div>
                  <span className="dash-open-badge">● GATES OPEN</span>
                </div>

                <div className="dash-metrics-cards-row">
                  <div className="dash-mini-metric">
                    <span className="m-label">REVENUE</span>
                    <span className="m-num">SAR 128,400</span>
                    <span className="m-sub">Ticket revenue</span>
                  </div>
                  <div className="dash-mini-metric">
                    <span className="m-label">CHECKED IN</span>
                    <span className="m-num">642 / 800</span>
                    <span className="m-sub">80.3% attendance</span>
                  </div>
                  <div className="dash-mini-metric">
                    <span className="m-label">TICKETS SOLD</span>
                    <span className="m-num">714</span>
                    <span className="m-sub">89.3% of capacity</span>
                  </div>
                </div>

                <div className="dash-charts-row">
                  <div className="dash-chart-card">
                    <div className="chart-header">
                      <strong>Gate check-ins</strong>
                      <span>Every 15 min</span>
                    </div>
                    <div className="mock-bars-visual">
                      <span style={{ height: '35%' }} />
                      <span style={{ height: '55%' }} />
                      <span style={{ height: '80%' }} />
                      <span style={{ height: '100%' }} />
                      <span style={{ height: '70%' }} />
                      <span style={{ height: '40%' }} />
                    </div>
                    <div className="chart-time-axis">
                      <span>18:00</span>
                      <span>18:45</span>
                      <span>19:30</span>
                      <span>20:15</span>
                    </div>
                  </div>

                  <div className="dash-gates-card">
                    <strong>Gate activity</strong>
                    <div className="gate-row">
                      <span>North gate</span>
                      <strong>286</strong>
                    </div>
                    <div className="gate-row">
                      <span>Main entrance</span>
                      <strong>244</strong>
                    </div>
                    <div className="gate-row">
                      <span>East gate · Offline</span>
                      <strong>112</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mobile Gate Scanner Preview */}
            <div className="scanner-app-card">
              <div className="scanner-app-header">
                <strong>Gate scanner</strong>
                <QrCodeIcon size={18} />
              </div>
              <span className="scanner-device-id">EAST GATE · DEVICE 03</span>

              <div className="scanner-viewfinder-frame">
                <div className="viewfinder-box">
                  <QrCodeIcon size={96} />
                </div>
                <span className="viewfinder-hint">Align QR within the frame</span>
              </div>

              <div className="scan-success-banner">
                <div className="banner-check-title">
                  <CheckIcon size={16} />
                  <strong>Valid pass</strong>
                </div>
                <span className="banner-seat-line">Stalls · Row F · Seat 12</span>
                <span className="banner-verified-badge">VERIFIED OFFLINE · ADMIT ONE</span>
              </div>

              <div className="scanner-offline-foot">
                <ShieldIcon size={14} />
                <span>No venue internet required</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. FAQ & TRUST ACCORDION */}
      <section className="figma-faq-section" aria-labelledby="faq-heading">
        <div className="section-bounds">
          <div className="faq-split-grid">
            <div className="faq-intro-col">
              <div className="section-eyebrow-pill">
                <span className="marker-dot-dark" aria-hidden="true" />
                <span>{language === 'ar' ? 'أسئلة مهمة. إجابات واضحة.' : 'GOOD QUESTIONS. CLEAR ANSWERS.'}</span>
              </div>
              <h2 id="faq-heading" className="faq-title">
                {language === 'ar'
                  ? 'ثقة كاملة..\nقبل أن يُرفع الستار.'
                  : 'Confidence,\nbefore the\ncurtain rises.'}
              </h2>
              <p className="faq-subtext">
                {language === 'ar'
                  ? 'لا شروط مخفية. فقط طريقك المباشر من رغبة الحضور إلى قلب التجربة.'
                  : 'No hidden rules. Just a clearer way to get from ‘I want to go’ to ‘I’m here.’'}
              </p>

              <div className="faq-trust-points">
                <div className="trust-point">
                  <ShieldIcon size={18} />
                  <span>{language === 'ar' ? 'تذاكر رقمية مشفرة بـ HMAC-SHA256' : 'Cryptographically signed QR passes'}</span>
                </div>
                <div className="trust-point">
                  <LockIcon size={18} />
                  <span>{language === 'ar' ? 'حجز ذري مؤقت يضمن عدم التكرار' : 'Protected atomic seat reservations'}</span>
                </div>
                <div className="trust-point">
                  <ZapIcon size={18} />
                  <span>{language === 'ar' ? 'تحقق مستقل عند البوابات بدون إنترنت' : 'Autonomous offline verification'}</span>
                </div>
              </div>
            </div>

            <div className="faq-accordion-col">
              {[
                {
                  q: language === 'ar' ? 'كم مدة تثبيت المقاعد مؤقتاً؟' : 'How long are my seats held?',
                  a: language === 'ar'
                    ? 'بالضبط 5 دقائق (300 ثانية) من لحظة اختيار المقعد. قفل ذري يحميه ريثما تكمل عملية الدفع، وفي حال نفاد الوقت يُتاح المقعد مجدداً للجميع.'
                    : 'Exactly 5 minutes (300 seconds) from selection. An atomic lock protects them while you complete payment. If the timer expires before purchase, the seats release automatically and become available again.',
                },
                {
                  q: language === 'ar' ? 'هل ستعمل تذكرتي بدون إنترنت داخل القاعة؟' : 'Will my ticket work without internet at the venue?',
                  a: language === 'ar'
                    ? 'نعم بالتأكيد. تستخدم تذكرتك رمز QR مشفر يتم فحصه محلياً 100% بأجهزة البوابات دون الحاجة لأي اتصال بالإنترنت في القاعة.'
                    : 'Yes. Your pass uses a tamper-proof cryptographic QR that gate devices validate 100% offline. Download your pass before arriving; venue internet is not required for gate validation.',
                },
                {
                  q: language === 'ar' ? 'هل يمكنني استرداد قيمة التذكرة إذا تغيرت خططي؟' : 'Can I get a refund if my plans change?',
                  a: language === 'ar'
                    ? 'تخضع سياسات الاسترجاع والإلغاء لسياسة منظم الفعالية المحددة لكل عرض. يرجى مراجعة الشروط قبل الدفع.'
                    : 'Refunds, cancellations and exchanges follow the event organizer’s policy—not a universal TicketCraft guarantee. Review the event-specific terms before checkout, and contact the organizer for eligible requests.',
                },
                {
                  q: language === 'ar' ? 'هل أحتاج لإنشاء حساب أو تثبيت تطبيق معين؟' : 'Do I need an account, or a particular app?',
                  a: language === 'ar'
                    ? 'لا يوجد أي تسجيل إجباري. تصفح واختر مقاعدك وادفع كزائر، وتصلك بطاقتك الرقمية فوراً ويمكنك تصديرها كملف PDF أو صورة PNG.'
                    : 'No forced registration. Browse, select seats and pay as a guest. Your digital pass is generated instantly and can be exported in high-resolution PDF or PNG with one click.',
                },
              ].map((item, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div key={idx} className={`faq-item-card ${isOpen ? 'open' : ''}`}>
                    <button
                      type="button"
                      className="faq-question-btn"
                      onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                      aria-expanded={isOpen}
                    >
                      <span>{item.q}</span>
                      <span className="faq-toggle-icon">{isOpen ? '−' : '+'}</span>
                    </button>
                    {isOpen && (
                      <div className="faq-answer-content">
                        <p>{item.a}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION (Lime Palette #D2FA69) */}
      <section className="figma-cta-banner">
        <div className="section-bounds cta-banner-relative">
          <div className="cta-banner-content">
            <div className="section-eyebrow-pill-dark">
              <span className="marker-dot-dark" aria-hidden="true" />
              <span>{language === 'ar' ? 'أمسيتك القادمة بانتظارك' : 'THE NEXT GREAT NIGHT IS YOURS'}</span>
            </div>
            <h2 className="cta-banner-title">
              {language === 'ar'
                ? 'عش التجربة..\nونحن نتكفل بالتذكرة.'
                : 'Be there.\nWe’ll take care of the ticket.'}
            </h2>
            <div className="cta-actions-row">
              <button
                type="button"
                className="btn-cta-primary"
                onClick={scrollToFeaturedEvents}
              >
                <span>{language === 'ar' ? 'استكشف الفعاليات القادمة' : 'Explore Upcoming Events'}</span>
                <ArrowUpRightIcon size={18} />
              </button>
              <button
                type="button"
                className="btn-cta-secondary"
                onClick={scrollToFeaturedEvents}
              >
                <span>{language === 'ar' ? 'أدرج فعاليتك أو قاعتك' : 'List Your Venue / Event'}</span>
                <ArrowUpRightIcon size={18} />
              </button>
            </div>
          </div>

          {/* Floating Ticket Stamp Decor */}
          <div className="floating-ticket-stamp" aria-hidden="true">
            <div className="stamp-notch-left" />
            <div className="stamp-notch-right" />
            <div className="stamp-header">
              <span className="stamp-brand">TicketCraft</span>
              <ArrowUpRightIcon size={18} />
            </div>
            <h4 className="stamp-admit">ADMIT<br />YOURSELF.</h4>
            <div className="stamp-perforation" />
            <span className="stamp-footer-quote">
              {language === 'ar' ? 'أمسية رائعة. ذكريات لا تنتهي.' : 'ONE GOOD NIGHT. INFINITE MEMORIES.'}
            </span>
          </div>
        </div>
      </section>

      {/* 9. BRAND FOOTER */}
      <footer className="landing-footer" role="contentinfo">
        <div className="footer-bounds">
          <div className="footer-top-sitemap">
            <div className="footer-brand-column">
              <div className="footer-brand-header" data-testid="footer-brand">
                <span className="footer-ticket-icon" aria-hidden="true">
                  <TicketIcon size={22} />
                </span>
                <span className="footer-brand-name">TicketCraft</span>
              </div>
              <p className="footer-purpose-text">
                {language === 'ar'
                  ? 'صُممت لأمسيات تبقى في الذاكرة..\nوصُنعت لأولئك الذين يصنعونها.'
                  : 'Made for the nights that stay with you.\nCrafted for the people who make them.'}
              </p>
              <div className="footer-tech-stack-pills">
                <span className="tech-pill">React 19</span>
                <span className="tech-pill">Vite 8</span>
                <span className="tech-pill">Supabase Realtime</span>
                <span className="tech-pill">Web Crypto</span>
              </div>
            </div>

            <div className="footer-sitemap-column">
              <h4 className="sitemap-heading">{language === 'ar' ? 'استكشف' : 'DISCOVER'}</h4>
              <ul className="sitemap-links">
                <li><button type="button" onClick={scrollToFeaturedEvents}>{language === 'ar' ? 'جميع الفعاليات' : 'All events'}</button></li>
                <li><button type="button" onClick={() => setSelectedCategory('Classical')}>{language === 'ar' ? 'الحفلات الموسيقية' : 'Concerts & live music'}</button></li>
                <li><button type="button" onClick={() => setSelectedCategory('Theatre')}>{language === 'ar' ? 'المسرح والفنون' : 'Theatre & arts'}</button></li>
                <li><button type="button" onClick={() => setSelectedCategory('Festivals')}>{language === 'ar' ? 'المهرجانات' : 'Festivals'}</button></li>
              </ul>
            </div>

            <div className="footer-sitemap-column">
              <h4 className="sitemap-heading">{language === 'ar' ? 'المنصة' : 'PLATFORM'}</h4>
              <ul className="sitemap-links">
                <li><button type="button" onClick={scrollToFeaturedEvents}>{language === 'ar' ? 'خريطة المقاعد التفاعلية' : 'Interactive seating'}</button></li>
                <li><button type="button" onClick={onNavigateToTickets}>{language === 'ar' ? 'البطاقات الرقمية' : 'Digital passes'}</button></li>
                <li><span>{language === 'ar' ? 'حجز الضيوف الفوري' : 'Guest checkout'}</span></li>
                <li><span>{language === 'ar' ? 'تشفير HMAC-SHA256' : 'HMAC-SHA256 Signed Passes'}</span></li>
              </ul>
            </div>

            <div className="footer-sitemap-column">
              <h4 className="sitemap-heading">{language === 'ar' ? 'للمنظمين' : 'FOR ORGANIZERS'}</h4>
              <ul className="sitemap-links">
                <li><span>{language === 'ar' ? 'أدرج فعاليتك' : 'List your event'}</span></li>
                <li><span>{language === 'ar' ? 'سجل قاعتك' : 'Register your venue'}</span></li>
                <li><span>{language === 'ar' ? 'تطبيق مسح البوابة' : 'Gate scanner app'}</span></li>
                <li><span>{language === 'ar' ? 'تحليلات الإيرادات' : 'Revenue analytics'}</span></li>
              </ul>
            </div>

            <div className="footer-sitemap-column">
              <h4 className="sitemap-heading">{language === 'ar' ? 'الدعم' : 'SUPPORT'}</h4>
              <ul className="sitemap-links">
                <li><span>{language === 'ar' ? 'مركز المساعدة' : 'Help center'}</span></li>
                <li><span>{language === 'ar' ? 'الحجز والدخول' : 'Booking & entry'}</span></li>
                <li><span>{language === 'ar' ? 'سياسات الاسترداد' : 'Refund policies'}</span></li>
                <li><span>{language === 'ar' ? 'إمكانية الوصول' : 'Accessibility'}</span></li>
              </ul>
            </div>
          </div>

          {/* Large Brand Statement in English & Arabic matching Figma #128:14320 */}
          <div className="footer-brand-statement">
            <span className="statement-en">TicketCraft</span>
            <span className="statement-ar">تيكت كرافت</span>
          </div>

          <div className="footer-bottom-bar">
            <p className="footer-copyright-text">
              © 2026 TicketCraft, Inc. All rights reserved.
            </p>
            <div className="footer-legal-links">
              <span>{language === 'ar' ? 'شروط الخدمة' : 'Terms of Service'}</span>
              <span>{language === 'ar' ? 'سياسة الخصوصية' : 'Privacy Policy'}</span>
              <span>{language === 'ar' ? 'تفضيلات الكوكيز' : 'Cookie preferences'}</span>
            </div>
            <div className="footer-cluster-status">
              <span className="cluster-status-dot" aria-hidden="true" />
              <span>{t('footer.status_online', 'Realtime Booking Cluster: Online')}</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
