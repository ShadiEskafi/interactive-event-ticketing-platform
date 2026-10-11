import { useLanguage } from '../../../context';

/**
 * Visual key for seat status colors and tier pricing
 */
export function SectionLegend({ sections = [] }) {
  const { t } = useLanguage();

  const statusItems = [
    { key: 'available', label: t('seatmap.available', 'متاح'), color: '#10B981', border: '#047857' },
    { key: 'selected', label: t('seatmap.selected', 'محدد'), color: '#2563EB', border: '#1E40AF' },
    { key: 'reserved', label: t('seatmap.reserved', 'محجوز مؤقتاً'), color: '#F59E0B', border: '#D97706' },
    { key: 'sold', label: t('seatmap.sold', 'مباع'), color: '#9CA3AF', border: '#6B7280' },
  ];

  const getTierLabel = (name) => {
    const lower = (name || '').toLowerCase();
    if (lower.includes('vip')) return t('seatmap.vip', 'كبار الشخصيات');
    if (lower.includes('balcony')) return t('seatmap.balcony', 'شرفة');
    if (lower.includes('regular') || lower.includes('standard')) return t('seatmap.regular', 'عادي');
    return name;
  };

  return (
    <div className="section-legend" aria-label={t('seatmap.status_title', 'مفتاح خريطة المقاعد')}>
      <div className="legend-group">
        <span className="legend-group-title">{t('seatmap.status_title', 'الحالة:')}</span>
        <div className="legend-items">
          {statusItems.map((item) => (
            <div key={item.key} className="legend-item">
              <span
                className="legend-dot"
                style={{ backgroundColor: item.color, borderColor: item.border }}
              />
              <span className="legend-label">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {sections.length > 0 && (
        <div className="legend-group">
          <span className="legend-group-title">{t('seatmap.tiers_title', 'الفئات:')}</span>
          <div className="legend-items">
            {sections.map((sec) => (
              <div key={sec.id} className="legend-item tier-item">
                <span className="tier-name">{getTierLabel(sec.name)}:</span>
                <span className="tier-price">${sec.defaultPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
