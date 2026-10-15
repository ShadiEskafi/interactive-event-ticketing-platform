import { useLanguage } from '../../../context';

/**
 * Arabic digit converter helper
 */
const toArabicDigits = (val) => {
  const digits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(val).replace(/[0-9]/g, (d) => digits[d]);
};

/**
 * Format number with comma separators (supports English and Arabic-Indic numerals)
 */
const formatNumber = (num, isAr) => {
  const n = Number(num);
  const formatted = isNaN(n) ? '0' : n.toLocaleString('en-US');
  return isAr ? toArabicDigits(formatted) : formatted;
};

/**
 * Format currency amount
 */
const formatCurrency = (amount, isAr) => {
  const n = Number(amount) || 0;
  const formatted = n.toLocaleString('en-US');
  return isAr ? `${toArabicDigits(formatted)} $` : `$${formatted}`;
};

/**
 * Default sample events matching standard TicketCraft 520-seat auditorium topologies
 */
const DEFAULT_PUBLISHED_EVENTS = [
  {
    id: 'evt-symphony-2026',
    title: 'Grand Symphony Gala 2026',
    title_ar: 'حفل السيمفونية الكبرى ٢٠٢٦',
    venue: 'Grand Symphony Hall • Main Stage',
    venue_ar: 'قاعة السيمفونية الكبرى • المسرح الرئيسي',
    date: 'Sat, Nov 14, 2026',
    date_ar: 'السبت، ١٤ نوفمبر ٢٠٢٦',
    capacity: 520,
    sold: 338,
    price: 150,
    revenue: 50700,
    status: 'published',
  },
  {
    id: 'evt-electronic-odyssey',
    title: 'Electronic Odyssey Music Night',
    title_ar: 'ملحمة الموسيقى الإلكترونية',
    venue: 'Acoustic Soundstage • Hall B',
    venue_ar: 'المسرح الصوتي • القاعة ب',
    date: 'Thu, Nov 26, 2026',
    date_ar: 'الخميس، ٢٦ نوفمبر ٢٠٢٦',
    capacity: 520,
    sold: 416,
    price: 150,
    revenue: 62400,
    status: 'published',
  },
  {
    id: 'evt-arabic-orchestra',
    title: 'National Arabic Orchestra Live',
    title_ar: 'الأوركسترا العربية الوطنية',
    venue: 'Royal Opera House',
    venue_ar: 'دار الأوبرا الملكية',
    date: 'Fri, Dec 04, 2026',
    date_ar: 'الجمعة، ٤ ديسمبر ٢٠٢٦',
    capacity: 520,
    sold: 260,
    price: 150,
    revenue: 39000,
    status: 'published',
  },
];

/**
 * EventPerformanceChart Component
 * Visual occupancy & capacity analytics widget for published events.
 * 1:1 Pixel-Perfect with Figma (Node 125:85 / 145:27696 & 145:27643)
 *
 * Features:
 * - Capacity vs Sold visual occupancy bar for each published event
 * - Shows event title, venue/date, sold / total capacity, percentage bar, and revenue
 * - Modular flexbox layout with zero arbitrary absolute positioning
 *
 * @param {Object} props
 * @param {Array} [props.events] - List of event objects
 * @param {string} [props.language] - 'en' | 'ar'
 */
export function EventPerformanceChart({
  events = null,
  language: propLanguage,
}) {
  let contextLang = 'en';
  try {
    const ctx = useLanguage();
    if (ctx?.language) contextLang = ctx.language;
  } catch {
    // Context fallback for isolated testing
  }

  const activeLanguage = propLanguage || contextLang || 'en';
  const isAr = activeLanguage === 'ar';

  // Use provided events if available, otherwise fallback to standard published events
  const rawEvents = Array.isArray(events) && events.length > 0 ? events : DEFAULT_PUBLISHED_EVENTS;

  // Filter for published events (exclude drafts)
  const publishedEvents = rawEvents.filter((e) => e.status !== 'draft');
  const displayEvents = publishedEvents.length > 0 ? publishedEvents : rawEvents;

  // Compute aggregate totals across displayed events
  const aggregate = displayEvents.reduce(
    (acc, evt) => {
      const cap = typeof evt.capacity === 'number' ? evt.capacity : (parseInt(evt.capacity, 10) || 520);
      const sold = evt.sold ?? evt.totalBooked ?? evt.booked ?? evt.ticketsSold ?? Math.round(cap * 0.65);
      const price = evt.price || evt.regularPrice || evt.tierPricing?.regular || 150;
      const rev = evt.revenue ?? evt.totalRevenue ?? (sold * price);

      acc.totalCapacity += cap;
      acc.totalSold += sold;
      acc.totalRevenue += rev;
      return acc;
    },
    { totalCapacity: 0, totalSold: 0, totalRevenue: 0 }
  );

  const overallOccupancy = aggregate.totalCapacity > 0
    ? ((aggregate.totalSold / aggregate.totalCapacity) * 100).toFixed(1)
    : '0.0';

  return (
    <div
      className="tc-panel-card tc-panel-white tc-event-performance-chart"
      data-testid="event-performance-chart"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Header */}
      <div className="tc-section-header">
        <h3 className="tc-panel-title">
          {isAr ? 'أداء الفعاليات المنشورة' : 'Event Performance'}
        </h3>
        <span className="tc-section-meta">
          {isAr
            ? `${displayEvents.length} فعاليات · ٥٢٠ مقعداً لكل فعالية`
            : `${displayEvents.length} events · 520 seats per venue`}
        </span>
      </div>

      {/* Events Occupancy List */}
      <div
        className="tc-perf-chart-list"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {displayEvents.map((evt) => {
          const title = isAr ? evt.title_ar || evt.title : evt.title;
          const venue = isAr ? evt.venue_ar || evt.venue || 'القاعة الكبرى' : evt.venue || 'The Grand Hall';
          const date = isAr ? evt.date_ar || evt.date || '' : evt.date || '';
          const dateVenue = [date, venue].filter(Boolean).join(' · ');

          const capacity = typeof evt.capacity === 'number' ? evt.capacity : (parseInt(evt.capacity, 10) || 520);
          const sold = evt.sold ?? evt.totalBooked ?? evt.booked ?? evt.ticketsSold ?? Math.round(capacity * 0.65);
          const occupancy = capacity > 0 ? Math.min(100, Math.round((sold / capacity) * 100)) : 0;
          const price = evt.price || evt.regularPrice || evt.tierPricing?.regular || 150;
          const revenue = evt.revenue ?? evt.totalRevenue ?? (sold * price);

          return (
            <div
              key={evt.id || title}
              className="tc-perf-event-item"
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingBottom: '16px',
                borderBottom: '1px solid #f0f2eb',
              }}
              data-testid={`perf-event-${evt.id || 'item'}`}
            >
              {/* Event Metadata & Stats Row */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: 'var(--tc-text-primary-light, #101813)',
                    }}
                  >
                    {title}
                  </span>
                  {dateVenue && (
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'var(--tc-text-muted-light, #657066)',
                      }}
                    >
                      {dateVenue}
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: '16px',
                    textAlign: isAr ? 'left' : 'right',
                  }}
                >
                  <span
                    style={{
                      fontSize: '12px',
                      color: 'var(--tc-text-muted-light, #657066)',
                    }}
                  >
                    {formatNumber(sold, isAr)} / {formatNumber(capacity, isAr)} {isAr ? 'مقعد' : 'sold'}
                  </span>
                  <span
                    style={{
                      fontWeight: 600,
                      fontSize: '14px',
                      color: 'var(--tc-text-primary-light, #101813)',
                    }}
                  >
                    {formatCurrency(revenue, isAr)}
                  </span>
                </div>
              </div>

              {/* Visual Occupancy Bar: Capacity vs Sold */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  className="tc-progress-track"
                  style={{
                    height: '10px',
                    backgroundColor: '#e9ede2',
                    borderRadius: '5px',
                    flex: 1,
                    overflow: 'hidden',
                  }}
                  role="progressbar"
                  aria-valuenow={occupancy}
                  aria-valuemin="0"
                  aria-valuemax="100"
                  aria-label={`${title} ${occupancy}%`}
                >
                  <div
                    style={{
                      width: `${Math.min(100, Math.max(0, occupancy))}%`,
                      height: '100%',
                      backgroundColor: occupancy >= 75 ? 'var(--tc-badge-green-text, #315f3d)' : 'var(--tc-surface-dark, #101813)',
                      borderRadius: '5px',
                      transition: 'width 200ms cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: 'var(--tc-text-primary-light, #101813)',
                    minWidth: '38px',
                    textAlign: isAr ? 'left' : 'right',
                  }}
                >
                  {isAr ? toArabicDigits(occupancy) : occupancy}%
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Aggregate Summary Footer */}
      <div
        style={{
          marginTop: '4px',
          paddingTop: '12px',
          borderTop: '1px solid var(--tc-border-light, #d8dcd1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '12px',
          color: 'var(--tc-text-muted-light, #657066)',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        <span>
          {isAr
            ? `الإجمالي: ${formatNumber(aggregate.totalSold, true)} / ${formatNumber(aggregate.totalCapacity, true)} مقعداً مباعاً (${toArabicDigits(overallOccupancy)}٪ إشغال)`
            : `Total: ${formatNumber(aggregate.totalSold, false)} / ${formatNumber(aggregate.totalCapacity, false)} seats sold (${overallOccupancy}% occupancy)`}
        </span>
        <span style={{ fontWeight: 600, color: 'var(--tc-text-primary-light, #101813)' }}>
          {isAr ? 'الإيرادات: ' : 'Revenue: '}
          {formatCurrency(aggregate.totalRevenue, isAr)}
        </span>
      </div>
    </div>
  );
}

export default EventPerformanceChart;
