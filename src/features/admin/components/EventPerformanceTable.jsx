import { useMemo } from 'react';
import { useLanguage } from '../../../context';
import { EyeIcon } from '../../../components/common/Icons';
import '../AdminDashboard.css';

/**
 * Baseline fallback events matching Figma 1:1 (Node 125:85 / 145:27548 & 145:27643)
 */
const FIGMA_DEFAULT_EVENTS = [
  {
    id: 'evt-001',
    title: 'Nocturne Symphony',
    title_ar: 'سيمفونية نوكتورن',
    date: '15 Oct 2026',
    date_ar: '١٥ أكتوبر ٢٠٢٦',
    time: '20:00',
    venue: 'The Grand Hall',
    venue_ar: 'القاعة الكبرى',
    status: 'published',
    sold: 416,
    capacity: 520,
    occupancy: '80.0%',
    revenue: 'SAR 77,120',
    scanned: '312 / 416',
    scannedCount: 312,
    revenueNum: 77120,
  },
  {
    id: 'evt-002',
    title: 'Electric Afterhours',
    title_ar: 'ما بعد ساعات إلكتريك',
    date: '14 Oct 2026',
    date_ar: '١٤ أكتوبر ٢٠٢٦',
    time: '21:00',
    venue: 'The Grand Hall',
    venue_ar: 'القاعة الكبرى',
    status: 'published',
    sold: 338,
    capacity: 520,
    occupancy: '65.0%',
    revenue: 'SAR 63,400',
    scanned: '208 / 338',
    scannedCount: 208,
    revenueNum: 63400,
  },
  {
    id: 'evt-003',
    title: 'The Last Curtain',
    title_ar: 'الستار الأخير',
    date: '13 Oct 2026',
    date_ar: '١٣ أكتوبر ٢٠٢٦',
    time: '19:00',
    venue: 'Studio Theatre',
    venue_ar: 'مسرح الاستوديو',
    status: 'published',
    sold: 260,
    capacity: 520,
    occupancy: '50.0%',
    revenue: 'SAR 48,400',
    scanned: '156 / 260',
    scannedCount: 156,
    revenueNum: 48400,
  },
  {
    id: 'evt-004',
    title: 'Dunes & Frequencies',
    title_ar: 'كثبان وترددات',
    date: '23 Oct 2026',
    date_ar: '٢٣ أكتوبر ٢٠٢٦',
    time: '18:00',
    venue: 'Desert Pavilion',
    venue_ar: 'جناح الصحراء',
    status: 'draft',
    sold: 0,
    capacity: 520,
    occupancy: '0.0%',
    revenue: 'SAR 0',
    scanned: '0 / 0',
    scannedCount: 0,
    revenueNum: 0,
  },
];

/**
 * Converts Western digits to Eastern Arabic digits for Arabic localization
 */
const toArabicDigits = (val) => {
  if (val === null || val === undefined) return '';
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(val).replace(/[0-9]/g, (digit) => arabicDigits[Number(digit)]);
};

/**
 * EventPerformanceTable Component
 * 1:1 Pixel-Perfect implementation for TicketCraft Admin Dashboard
 * Blueprint: Node 125:85 / 145:27548 (EN) & 145:27643 (AR)
 *
 * @param {Object} props
 * @param {Array} [props.events] - Array of event items. Fallbacks to Figma baseline events if empty.
 * @param {string} [props.language] - 'en' | 'ar' localization mode.
 * @param {Function} [props.onSelectEvent] - Callback triggered when selecting an event row.
 * @param {Function} [props.onViewDetails] - Callback triggered when clicking for detailed view.
 */
export function EventPerformanceTable({
  events,
  language: languageProp,
  onSelectEvent,
  onViewDetails,
}) {
  const context = useLanguage();
  const language = languageProp || context.language || 'en';
  const isAr = language === 'ar';

  // Normalize data using either provided events or Figma defaults
  const displayEvents = useMemo(() => {
    if (Array.isArray(events) && events.length > 0) {
      return events.map((evt, idx) => {
        const capacity = evt.capacity || 520;
        const sold =
          typeof evt.sold === 'number'
            ? evt.sold
            : typeof evt.totalBooked === 'number'
            ? evt.totalBooked
            : 0;

        const occupancy =
          evt.occupancy ||
          (capacity > 0 ? `${((sold / capacity) * 100).toFixed(1)}%` : '0.0%');

        const revenueNum =
          typeof evt.revenue === 'number'
            ? evt.revenue
            : typeof evt.revenueNum === 'number'
            ? evt.revenueNum
            : sold * (evt.price || 150);

        const revenue =
          typeof evt.revenue === 'string'
            ? evt.revenue
            : `SAR ${revenueNum.toLocaleString()}`;

        const scannedCount =
          typeof evt.scannedCount === 'number'
            ? evt.scannedCount
            : typeof evt.scanned === 'number'
            ? evt.scanned
            : Math.floor(sold * 0.75);

        const scanned =
          typeof evt.scanned === 'string'
            ? evt.scanned
            : `${scannedCount} / ${sold}`;

        return {
          id: evt.id || `evt-dyn-${idx}`,
          title: evt.title || `Event ${idx + 1}`,
          title_ar: evt.title_ar || evt.title || `فعالية ${idx + 1}`,
          date: evt.date || '15 Oct 2026',
          date_ar: evt.date_ar || evt.date || '١٥ أكتوبر ٢٠٢٦',
          time: evt.time || '20:00',
          venue: evt.venue || 'The Grand Hall',
          venue_ar: evt.venue_ar || evt.venue || 'القاعة الكبرى',
          status: evt.status === 'draft' ? 'draft' : 'published',
          sold,
          capacity,
          occupancy,
          revenue,
          revenueNum,
          scanned,
          scannedCount,
          rawEvent: evt,
        };
      });
    }
    return FIGMA_DEFAULT_EVENTS;
  }, [events]);

  // Dynamic calculations for table summary footer
  const summaryTotals = useMemo(() => {
    let totalRevenue = 0;
    let totalSold = 0;
    let totalScanned = 0;

    displayEvents.forEach((evt) => {
      totalRevenue += evt.revenueNum || 0;
      totalSold += evt.sold || 0;
      totalScanned += evt.scannedCount || 0;
    });

    return {
      revenue: totalRevenue,
      sold: totalSold,
      scanned: totalScanned,
    };
  }, [displayEvents]);

  // Section meta string
  const eventCount = displayEvents.length;
  const sectionMeta = isAr
    ? `${toArabicDigits(eventCount)} فعاليات · ٥٢٠ مقعد لكل فعالية`
    : `${eventCount} events · 520 seats each`;

  // Summary footer text matching Figma 1:1
  const summaryFooterText = isAr
    ? `الإجمالي · ${toArabicDigits(summaryTotals.revenue.toLocaleString())} ر.س · ${toArabicDigits(summaryTotals.sold.toLocaleString())} مباعة · ${toArabicDigits(summaryTotals.scanned.toLocaleString())} تم مسحها · المسودة مستبعدة من الإشغال`
    : `Total · SAR ${summaryTotals.revenue.toLocaleString()} · ${summaryTotals.sold.toLocaleString()} sold · ${summaryTotals.scanned.toLocaleString()} scanned · Draft excluded from occupancy`;

  return (
    <section
      className="tc-section-container"
      aria-label={isAr ? 'أداء الفعاليات' : 'Event performance'}
      data-testid="event-performance-section"
    >
      {/* Section Header */}
      <div className="tc-section-header">
        <h3 className="tc-section-title">
          {isAr ? 'أداء الفعاليات' : 'Event performance'}
        </h3>
        <span className="tc-section-meta" data-testid="event-performance-meta">
          {sectionMeta}
        </span>
      </div>

      {/* Data Table Card */}
      <div className="tc-table-card">
        <div className="tc-table-responsive">
          <table
            className="tc-data-table"
            data-testid="event-performance-table"
          >
            <thead>
              <tr>
                <th scope="col">{isAr ? 'الفعالية' : 'Event'}</th>
                <th scope="col">{isAr ? 'حالة النشر' : 'Publication'}</th>
                <th scope="col">{isAr ? 'المباع / السعة' : 'Sold / capacity'}</th>
                <th scope="col">{isAr ? 'نسبة الإشغال' : 'Occupancy'}</th>
                <th scope="col">{isAr ? 'الإيرادات' : 'Revenue'}</th>
                <th scope="col">{isAr ? 'تم مسحها' : 'Scanned'}</th>
              </tr>
            </thead>
            <tbody>
              {displayEvents.map((evt) => {
                const isDraft = evt.status === 'draft';
                const eventTitle = isAr ? evt.title_ar : evt.title;
                const eventDate = isAr ? evt.date_ar : evt.date;
                const eventVenue = isAr ? evt.venue_ar : evt.venue;
                const subtitle = `${eventDate} · ${evt.time} · ${eventVenue}`;

                const handleRowClick = () => {
                  if (onSelectEvent) {
                    onSelectEvent(evt.id);
                  }
                  if (onViewDetails) {
                    onViewDetails(evt.rawEvent || evt);
                  }
                };

                return (
                  <tr
                    key={evt.id}
                    onClick={handleRowClick}
                    style={{
                      cursor:
                        onSelectEvent || onViewDetails ? 'pointer' : 'default',
                    }}
                    tabIndex={onSelectEvent || onViewDetails ? 0 : undefined}
                    role={onSelectEvent || onViewDetails ? 'button' : undefined}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleRowClick();
                      }
                    }}
                    data-testid={`event-performance-row-${evt.id}`}
                  >
                    {/* 1. Event: Title + Subtitle */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                        <div>
                          <div className="tc-table-event-name">{eventTitle}</div>
                          <div className="tc-table-event-venue">{subtitle}</div>
                        </div>
                        {onViewDetails && (
                          <button
                            type="button"
                            className="tc-btn-action-dark"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewDetails(evt.rawEvent || evt);
                            }}
                            data-testid={`btn-drilldown-${evt.id}`}
                            style={{ height: '28px', padding: '0 8px', fontSize: '11px', flexShrink: 0 }}
                            aria-label={`View details for ${eventTitle}`}
                          >
                            <EyeIcon size={12} />
                            <span>{isAr ? 'عرض' : 'View'}</span>
                          </button>
                        )}
                      </div>
                    </td>

                    {/* 2. Publication Badge */}
                    <td>
                      <span
                        className={`tc-status-pill ${
                          isDraft ? 'tc-status-pill-gray' : 'tc-status-pill-green'
                        }`}
                        data-testid={`badge-status-${evt.id}`}
                      >
                        {isDraft
                          ? isAr
                            ? 'مسودة'
                            : 'Draft'
                          : isAr
                          ? 'منشور'
                          : 'Published'}
                      </span>
                    </td>

                    {/* 3. Sold / Capacity */}
                    <td>
                      {evt.sold} / {evt.capacity}
                    </td>

                    {/* 4. Occupancy */}
                    <td>{evt.occupancy}</td>

                    {/* 5. Revenue */}
                    <td style={{ fontWeight: 600 }}>{evt.revenue}</td>

                    {/* 6. Scanned */}
                    <td>{evt.scanned}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table Summary Footer */}
        <div
          className="tc-table-summary-footer"
          data-testid="event-performance-summary"
        >
          {summaryFooterText}
        </div>
      </div>
    </section>
  );
}

export default EventPerformanceTable;
