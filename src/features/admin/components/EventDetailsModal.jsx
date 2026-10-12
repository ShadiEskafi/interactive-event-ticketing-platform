import { useEffect, useMemo } from 'react';
import { useLanguage } from '../../../context';
import { adminService, STANDARD_VENUE_CAPACITY } from '../services/adminService';
import {
  CalendarIcon,
  MapPinIcon,
  TicketIcon,
  ChairIcon,
  DollarSignIcon,
  BarChart3Icon,
  UsersIcon,
  XIcon,
  Edit3Icon,
  StarIcon,
  BuildingIcon,
} from '../../../components/common/Icons';

/**
 * EventDetailsModal Component
 * Comprehensive drilldown modal for event performance and configuration:
 * - Bilingual event titles and descriptions (AR / EN)
 * - Date, time, venue name, fixed capacity (520 seats)
 * - Seating tier pricing breakdown (VIP, Regular, Balcony)
 * - Realtime occupancy metrics (Capacity, Sold, Available, Occupancy %, Gross Revenue)
 * - Status badge (Live Interactive Map vs Draft)
 * - Dark Slate modal styling with pure SVG icons and zero emojis.
 */
export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  attendees,
  onEditEvent,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Handle escape key listener for accessibility
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Compute live event attendees
  const eventAttendees = useMemo(() => {
    if (!event) return [];
    if (Array.isArray(attendees) && attendees.length > 0) {
      const filtered = attendees.filter((a) => !a.event_id || a.event_id === event.id);
      if (filtered.length > 0) return filtered;
    }
    // Query directly from adminService if attendees array was empty or scoped elsewhere
    return adminService.getEventAttendees(event.id);
  }, [event, attendees]);

  if (!isOpen || !event) return null;

  const totalCapacity = STANDARD_VENUE_CAPACITY; // 520 seats
  const soldCount = eventAttendees.length;
  const availableCount = Math.max(0, totalCapacity - soldCount);
  const occupancyRate = totalCapacity > 0 ? Math.min(100, Math.round((soldCount / totalCapacity) * 100)) : 0;
  const totalRevenue = eventAttendees.reduce((sum, a) => sum + (Number(a.price) || 0), 0);
  const checkedInCount = eventAttendees.filter((a) => a.is_used).length;

  const vipPrice = event.tierPricing?.vip ?? event.vipPrice ?? 150;
  const regularPrice = event.tierPricing?.regular ?? event.regularPrice ?? 75;
  const balconyPrice = event.tierPricing?.balcony ?? event.balconyPrice ?? 45;

  const isDraft = event.status === 'draft';

  const formatCurrency = (amount) => {
    const num = Number(amount) || 0;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="event-details-title"
      data-testid="event-details-modal"
    >
      <div
        className="modal-window admin-event-modal event-details-modal-window"
        onClick={(e) => e.stopPropagation()}
        data-testid="event-details-window"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-title-box">
            <span className="modal-icon">
              <TicketIcon size={22} />
            </span>
            <div>
              <h2 id="event-details-title" className="modal-title">
                {isAr ? event.title_ar || event.title : event.title}
              </h2>
              <div className="event-secondary-title">
                {isAr ? event.title : event.title_ar || ''}
              </div>
            </div>
          </div>
          <div className="modal-header-actions">
            <span
              className={`status-pill ${isDraft ? 'pill-draft' : 'pill-published'}`}
              data-testid="event-details-status"
            >
              {isDraft
                ? isAr
                  ? 'مسودة (مخفية)'
                  : 'Draft'
                : isAr
                ? 'منشور (خريطة حية)'
                : 'Live Interactive Map'}
            </span>
            <button
              type="button"
              className="modal-close-btn"
              onClick={onClose}
              aria-label={isAr ? 'إغلاق' : 'Close'}
              data-testid="btn-close-details"
            >
              <XIcon size={18} />
            </button>
          </div>
        </div>

        {/* Event Gradient Visual Header Banner */}
        <div
          className="event-details-banner"
          style={{ background: event.imageGradient || 'linear-gradient(135deg, #1E1B4B 0%, #4338CA 100%)' }}
        >
          <div className="banner-content">
            <span className="banner-category-badge">
              {isAr ? event.category_ar || event.category : event.category}
            </span>
            <div className="banner-meta-items">
              <span className="meta-badge">
                <CalendarIcon size={14} />
                <span>{isAr ? event.date_ar || event.date : event.date}</span>
              </span>
              <span className="meta-badge">
                <MapPinIcon size={14} />
                <span>{isAr ? event.venue_ar || event.venue : event.venue}</span>
              </span>
              <span className="meta-badge fixed-seats-badge">
                <ChairIcon size={14} />
                <span>520 {isAr ? 'مقعداً ثابتاً' : 'Fixed Capacity'}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Event Description */}
        <div className="details-section description-section">
          <h3 className="section-label">
            {isAr ? 'نبذة عن الفعالية' : 'Event Description'}
          </h3>
          <p className="description-text">
            {isAr
              ? event.description_ar || event.description
              : event.description || event.description_ar}
          </p>
        </div>

        {/* Realtime Occupancy & Financial Performance Grid */}
        <div className="details-section">
          <h3 className="section-label">
            <BarChart3Icon size={16} />
            <span>{isAr ? 'مؤشرات الإشغال والمبيعات اللحظية' : 'Realtime Occupancy & Revenue'}</span>
          </h3>
          <div className="details-metrics-grid">
            {/* Total Capacity */}
            <div className="metric-box box-capacity" data-testid="detail-metric-capacity">
              <div className="metric-box-header">
                <span className="box-label">{isAr ? 'السعة الكلية' : 'Total Capacity'}</span>
                <ChairIcon size={18} />
              </div>
              <div className="metric-box-val">{totalCapacity}</div>
              <div className="metric-box-sub">
                {isAr ? 'قاعة صوتية معتمدة' : 'Standard acoustic auditorium'}
              </div>
            </div>

            {/* Sold Tickets */}
            <div className="metric-box box-sold" data-testid="detail-metric-sold">
              <div className="metric-box-header">
                <span className="box-label">{isAr ? 'التذاكر المباعة' : 'Tickets Sold'}</span>
                <TicketIcon size={18} />
              </div>
              <div className="metric-box-val">{soldCount}</div>
              <div className="metric-box-sub">
                {isAr
                  ? `${availableCount} مقعداً متاحاً للحجز`
                  : `${availableCount} remaining available seats`}
              </div>
            </div>

            {/* Occupancy Rate */}
            <div className="metric-box box-occupancy" data-testid="detail-metric-occupancy">
              <div className="metric-box-header">
                <span className="box-label">{isAr ? 'نسبة الإشغال' : 'Occupancy Rate'}</span>
                <UsersIcon size={18} />
              </div>
              <div className="metric-box-val">{occupancyRate}%</div>
              <div className="metric-box-sub">
                {isAr
                  ? `${checkedInCount} تم فحصهم بالبوابة`
                  : `${checkedInCount} gate check-ins`}
              </div>
            </div>

            {/* Total Revenue */}
            <div className="metric-box box-revenue" data-testid="detail-metric-revenue">
              <div className="metric-box-header">
                <span className="box-label">{isAr ? 'إجمالي المبيعات' : 'Total Revenue'}</span>
                <DollarSignIcon size={18} />
              </div>
              <div className="metric-box-val">{formatCurrency(totalRevenue)}</div>
              <div className="metric-box-sub">
                {isAr ? 'المبيعات المباشرة للفعالية' : 'Direct event gross revenue'}
              </div>
            </div>
          </div>

          {/* Occupancy Progress Visual */}
          <div className="occupancy-progress-wrapper">
            <div className="occupancy-progress-bar">
              <div
                className="progress-fill fill-occupancy"
                style={{ width: `${occupancyRate}%` }}
                role="progressbar"
                aria-valuenow={occupancyRate}
                aria-valuemin="0"
                aria-valuemax="100"
              />
            </div>
            <div className="occupancy-legend-row">
              <span>{isAr ? `المقاعد المحجوزة: ${soldCount}` : `Booked: ${soldCount} seats`}</span>
              <span>{isAr ? `المقاعد المتبقية: ${availableCount}` : `Available: ${availableCount} seats`}</span>
            </div>
          </div>
        </div>

        {/* Tier Pricing Breakdown */}
        <div className="details-section">
          <h3 className="section-label">
            <DollarSignIcon size={16} />
            <span>{isAr ? 'تسعير فئات المقاعد القياسية' : 'Seating Tier Pricing Breakdown'}</span>
          </h3>
          <div className="tier-breakdown-cards">
            {/* VIP Tier */}
            <div className="tier-price-card card-vip" data-testid="tier-price-vip">
              <div className="tier-card-header">
                <div className="tier-name-group">
                  <StarIcon size={16} filled={true} />
                  <span className="tier-title">VIP</span>
                </div>
                <span className="tier-capacity-tag">40 {isAr ? 'مقعد' : 'Seats'}</span>
              </div>
              <div className="tier-price-amount">{formatCurrency(vipPrice)}</div>
              <div className="tier-desc">
                {isAr ? 'الصفوف الأمامية (A-D) متضمنة خدمات الضيافة' : 'Front rows (A-D) with premium lounge perks'}
              </div>
            </div>

            {/* Regular Tier */}
            <div className="tier-price-card card-regular" data-testid="tier-price-regular">
              <div className="tier-card-header">
                <div className="tier-name-group">
                  <TicketIcon size={16} />
                  <span className="tier-title">{isAr ? 'عادي' : 'Regular'}</span>
                </div>
                <span className="tier-capacity-tag">360 {isAr ? 'مقعد' : 'Seats'}</span>
              </div>
              <div className="tier-price-amount">{formatCurrency(regularPrice)}</div>
              <div className="tier-desc">
                {isAr ? 'أرضية المسرح الرئيسية (الصفوف E-S)' : 'Main auditorium floor (Rows E-S)'}
              </div>
            </div>

            {/* Balcony Tier */}
            <div className="tier-price-card card-balcony" data-testid="tier-price-balcony">
              <div className="tier-card-header">
                <div className="tier-name-group">
                  <BuildingIcon size={16} />
                  <span className="tier-title">{isAr ? 'الشرفة' : 'Balcony'}</span>
                </div>
                <span className="tier-capacity-tag">120 {isAr ? 'مقعد' : 'Seats'}</span>
              </div>
              <div className="tier-price-amount">{formatCurrency(balconyPrice)}</div>
              <div className="tier-desc">
                {isAr ? 'الشرفة العلوية (الصفوف T-Z) إطلالة بانورامية' : 'Upper elevated tier (Rows T-Z) panoramic view'}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="modal-footer-actions">
          <button
            type="button"
            className="admin-btn btn-secondary"
            onClick={onClose}
            data-testid="btn-modal-details-close"
          >
            {isAr ? 'إغلاق النافذة' : 'Close'}
          </button>
          {onEditEvent && (
            <button
              type="button"
              className="admin-btn btn-primary"
              onClick={() => {
                onClose();
                onEditEvent(event);
              }}
              data-testid="btn-modal-details-edit"
            >
              <Edit3Icon size={16} />
              <span>{isAr ? 'تعديل بيانات الفعالية' : 'Edit Event'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default EventDetailsModal;
