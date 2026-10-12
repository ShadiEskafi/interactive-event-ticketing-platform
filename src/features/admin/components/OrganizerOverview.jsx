import { useLanguage } from '../../../context';
import {
  DollarSignIcon,
  TicketIcon,
  CheckCircleIcon,
  CalendarIcon,
  BuildingIcon,
  ChairIcon,
  CameraIcon,
  StarIcon,
  QrCodeIcon,
  PlusIcon,
  EyeIcon,
} from '../../../components/common/Icons';

/**
 * OrganizerOverview Component
 * Tailored workspace for event creators and organizers:
 * - 4 Organizer KPI Cards: Gross Revenue, Sold Tickets, Attendance Check-in Rate, Active Events.
 * - Seating Tier Breakdown: VIP (40 seats), Regular (360 seats), Balcony (120 seats) with progress bars.
 * - Direct CTA to launch the Gate Scanner for this event.
 * Zero emoji dependency, pure SVG icons.
 */
export function OrganizerOverview({
  organizerStats = {},
  selectedEvent = null,
  attendees = [],
  onNavigateToScanner,
  onCreateEventClick,
  onViewDetails,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const formatCurrency = (val) => `$${(Number(val) || 0).toLocaleString()}`;

  // Seating Tier breakdown based on standard 520-seat interactive venue
  // VIP: 40, Regular: 360, Balcony: 120
  const totalVip = 40;
  const totalRegular = 360;
  const totalBalcony = 120;

  const vipSold = attendees.filter((a) => a.tier?.toLowerCase().includes('vip')).length;
  const balconySold = attendees.filter((a) => a.tier?.toLowerCase().includes('balcony')).length;
  const regularSold = Math.max(0, attendees.length - vipSold - balconySold);

  const vipPercent = Math.min(100, Math.round((vipSold / totalVip) * 100));
  const regularPercent = Math.min(100, Math.round((regularSold / totalRegular) * 100));
  const balconyPercent = Math.min(100, Math.round((balconySold / totalBalcony) * 100));

  const kpis = [
    {
      id: 'revenue',
      titleEn: 'Gross Revenue',
      titleAr: 'إيرادات مبيعات التذاكر',
      value: formatCurrency(organizerStats.organizerRevenue || 38400),
      subtitleEn: 'Direct net ticket sales',
      subtitleAr: 'المبيعات المباشرة لهذه الفعالية',
      Icon: DollarSignIcon,
      colorClass: 'kpi-emerald',
    },
    {
      id: 'sold',
      titleEn: 'Sold Tickets',
      titleAr: 'التذاكر المباعة',
      value: `${attendees.length} / 520`,
      subtitleEn: `${Math.round((attendees.length / 520) * 100)}% venue capacity reached`,
      subtitleAr: `تم بيع ${Math.round((attendees.length / 520) * 100)}٪ من سعة القاعة`,
      Icon: TicketIcon,
      colorClass: 'kpi-indigo',
    },
    {
      id: 'checkin',
      titleEn: 'Gate Check-in Rate',
      titleAr: 'نسبة الدخول والتحقق بالبوابة',
      value: `${organizerStats.attendanceRate || 62}%`,
      subtitleEn: `${organizerStats.checkedInCount || attendees.filter((a) => a.is_used).length} attendees scanned`,
      subtitleAr: `تم مسح ${organizerStats.checkedInCount || attendees.filter((a) => a.is_used).length} تذكرة مشفرة`,
      Icon: CheckCircleIcon,
      colorClass: 'kpi-cyan',
    },
    {
      id: 'active_events',
      titleEn: 'My Active Events',
      titleAr: 'فعالياتي المنشورة',
      value: organizerStats.activeEventsCount || 2,
      subtitleEn: 'Standard 520-seat interactive layouts',
      subtitleAr: 'قاعات تفاعلية قياسية (٥٢٠ مقعداً)',
      Icon: CalendarIcon,
      colorClass: 'kpi-violet',
    },
  ];

  return (
    <div className="organizer-overview" data-testid="organizer-overview">
      {/* Selected Event Focus Banner */}
      {selectedEvent && (
        <div className="organizer-event-focus-card">
          <div className="focus-card-left">
            <span className="focus-category-tag">
              {isAr ? selectedEvent.category_ar || selectedEvent.category : selectedEvent.category}
            </span>
            <h2 className="focus-event-title" data-testid="organizer-focused-event-title">
              {isAr ? selectedEvent.title_ar || selectedEvent.title : selectedEvent.title}
            </h2>
            <div className="focus-meta-row">
              <span className="focus-meta-item">
                <CalendarIcon size={14} className="meta-icon" />
                <span>{isAr ? selectedEvent.date_ar || selectedEvent.date : selectedEvent.date}</span>
              </span>
              <span className="focus-meta-item">
                <BuildingIcon size={14} className="meta-icon" />
                <span>{isAr ? selectedEvent.venue_ar || selectedEvent.venue : selectedEvent.venue}</span>
              </span>
              <span className="focus-meta-item fixed-capacity-pill">
                <ChairIcon size={14} className="meta-icon" />
                <span>{isAr ? 'سعة ثابتة: ٥٢٠ مقعداً' : 'Fixed Capacity: 520 Seats'}</span>
              </span>
            </div>
          </div>
          <div className="focus-card-right">
            <button
              type="button"
              className="admin-btn btn-outline btn-sm btn-view-details"
              onClick={() => onViewDetails?.(selectedEvent)}
              data-testid="btn-view-event-details"
            >
              <EyeIcon size={16} />
              <span>{isAr ? 'عرض تفاصيل الفعالية' : 'View Event Details'}</span>
            </button>
            <button
              type="button"
              className="admin-btn btn-scanner-launch"
              onClick={() => onNavigateToScanner?.(selectedEvent.id)}
              data-testid="btn-launch-gate-scanner"
            >
              <span className="scanner-pulse-icon">
                <CameraIcon size={20} />
              </span>
              <div className="scanner-btn-content">
                <span className="btn-main-text">
                  {isAr ? 'تشغيل ماسح البوابات' : 'Launch Gate Scanner'}
                </span>
                <span className="btn-sub-text">
                  {isAr ? 'تحقق ومسح التذاكر المشفرة' : 'Validate cryptographic QR passes'}
                </span>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Organizer KPI Grid */}
      <section className="kpi-grid" aria-label={isAr ? 'إحصائيات المنظم' : 'Organizer KPIs'}>
        {kpis.map((kpi) => {
          const KpiIcon = kpi.Icon;
          return (
            <div key={kpi.id} className={`kpi-card ${kpi.colorClass}`} data-testid={`org-kpi-${kpi.id}`}>
              <div className="kpi-card-header">
                <span className="kpi-title">{isAr ? kpi.titleAr : kpi.titleEn}</span>
                <span className="kpi-icon">
                  <KpiIcon size={20} />
                </span>
              </div>
              <div className="kpi-value">{kpi.value}</div>
              <div className="kpi-subtitle">{isAr ? kpi.subtitleAr : kpi.subtitleEn}</div>
            </div>
          );
        })}
      </section>

      {/* Seating Tier Breakdown & Gate Checkin Summary */}
      <div className="organizer-panels-grid">
        {/* Tier Breakdown Card */}
        <div className="admin-card tier-breakdown-card" data-testid="tier-breakdown-card">
          <div className="card-header">
            <h3 className="card-title">
              {isAr ? 'توزيع مبيعات فئات المقاعد (٥٢٠ مقعداً)' : 'Seating Tier Sales Distribution (520 Seats)'}
            </h3>
            <span className="badge-standard-venue">
              {isAr ? 'قاعة تفاعلية معتمدة' : 'Certified Layout'}
            </span>
          </div>

          <div className="tier-bars-container">
            {/* VIP Tier */}
            <div className="tier-bar-item">
              <div className="tier-label-row">
                <span className="tier-name tier-vip">
                  <StarIcon size={14} filled={true} className="tier-icon" />
                  <span>VIP ({isAr ? 'كبار الشخصيات' : 'VIP'})</span>
                </span>
                <span className="tier-count">
                  {vipSold} / {totalVip} {isAr ? 'مقعداً' : 'seats'} ({vipPercent}%)
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-vip"
                  style={{ width: `${vipPercent}%` }}
                  role="progressbar"
                  aria-valuenow={vipPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>

            {/* Regular Tier */}
            <div className="tier-bar-item">
              <div className="tier-label-row">
                <span className="tier-name tier-regular">
                  <TicketIcon size={14} className="tier-icon" />
                  <span>{isAr ? 'الدرجة العادية' : 'Regular Tier'}</span>
                </span>
                <span className="tier-count">
                  {regularSold} / {totalRegular} {isAr ? 'مقعداً' : 'seats'} ({regularPercent}%)
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-regular"
                  style={{ width: `${regularPercent}%` }}
                  role="progressbar"
                  aria-valuenow={regularPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>

            {/* Balcony Tier */}
            <div className="tier-bar-item">
              <div className="tier-label-row">
                <span className="tier-name tier-balcony">
                  <BuildingIcon size={14} className="tier-icon" />
                  <span>{isAr ? 'الشرفة / البلكون' : 'Balcony Tier'}</span>
                </span>
                <span className="tier-count">
                  {balconySold} / {totalBalcony} {isAr ? 'مقعداً' : 'seats'} ({balconyPercent}%)
                </span>
              </div>
              <div className="progress-track">
                <div
                  className="progress-fill fill-balcony"
                  style={{ width: `${balconyPercent}%` }}
                  role="progressbar"
                  aria-valuenow={balconyPercent}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Gate Turnstile Quick Dispatch */}
        <div className="admin-card gate-dispatch-card">
          <div className="card-header">
            <h3 className="card-title">
              {isAr ? 'تشغيل بوابات الدخول والتفتيش' : 'Gate Turnstile Operations'}
            </h3>
            <span className="badge-live-pulse">
              <span className="pulse-dot" /> Live
            </span>
          </div>
          <p className="card-desc">
            {isAr
              ? 'قم بتفويض طاقم البوابات أو افتح الماسح الضوئي المعتمد للتحقق من التذاكر المشفرة بـ HMAC-SHA256 فورياً دون الحاجة لاتصال مستمر.'
              : 'Dispatch gate marshals or launch turnstile camera scanner to authenticate offline-capable HMAC-SHA256 digital passes.'}
          </p>
          <div className="gate-actions-row">
            <button
              type="button"
              className="admin-btn btn-primary"
              onClick={() => onNavigateToScanner?.(selectedEvent?.id)}
            >
              <QrCodeIcon size={16} />
              <span>{isAr ? 'فتح ماسح البوابات للفعالية' : 'Open Scanner For Event'}</span>
            </button>
            {onCreateEventClick && (
              <button
                type="button"
                className="admin-btn btn-secondary"
                onClick={onCreateEventClick}
              >
                <PlusIcon size={16} />
                <span>{isAr ? 'إنشاء فعالية إضافية' : 'Add Another Event'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrganizerOverview;
