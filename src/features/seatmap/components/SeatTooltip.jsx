import { useLanguage } from '../../../context';

/**
 * Decoupled Seat Tooltip component
 * Rendered outside the SVG seat tree to eliminate re-renders of the 520 seat elements.
 */
export function SeatTooltip({ visible, seat, x, y }) {
  const { t, isRtl } = useLanguage();

  if (!visible || !seat) return null;

  const formattedPrice = typeof seat.price === 'number' ? seat.price.toFixed(2) : '0.00';

  const getLocalizedCategory = (cat) => {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('vip')) return t('seatmap.vip', 'كبار الشخصيات');
    if (lower.includes('balcony')) return t('seatmap.balcony', 'شرفة');
    if (lower.includes('regular') || lower.includes('standard')) return t('seatmap.regular', 'عادي');
    return cat;
  };

  const getLocalizedStatus = (status) => {
    switch (status) {
      case 'available':
        return t('seatmap.available', 'متاح');
      case 'selected':
        return t('seatmap.selected', 'محدد');
      case 'reserved':
        return t('seatmap.reserved', 'محجوز مؤقتاً');
      case 'sold':
        return t('seatmap.sold', 'مباع');
      default:
        return status;
    }
  };

  const rowPrefix = t('seatmap.row', 'الصف');
  const seatPrefix = t('seatmap.seat', 'المقعد');
  const statusLabel = t('seatmap.status', 'الحالة');

  return (
    <div
      role="tooltip"
      className="seat-tooltip-overlay"
      dir={isRtl ? 'rtl' : 'ltr'}
      style={{
        position: 'absolute',
        left: `${x}px`,
        top: `${y}px`,
        transform: 'translate(-50%, -130%)',
        pointerEvents: 'none',
        zIndex: 50,
      }}
    >
      <div className="seat-tooltip-card">
        <div className="seat-tooltip-title">
          {rowPrefix} {seat.rowLabel}{isRtl ? '، ' : ', '}{seatPrefix} {seat.seatNumber}
        </div>
        <div className="seat-tooltip-details">
          <span className="seat-tooltip-category">{getLocalizedCategory(seat.category)}</span>
          <span className="seat-tooltip-sep"> - </span>
          <span className="seat-tooltip-price" dir="ltr">${formattedPrice}</span>
        </div>
        <div className="seat-tooltip-status">
          {statusLabel}: <strong className={`status-${seat.status}`}>{getLocalizedStatus(seat.status)}</strong>
        </div>
      </div>
      <div className="seat-tooltip-arrow" />
    </div>
  );
}
