/**
 * Visual key for seat status colors and tier pricing
 */
export function SectionLegend({ sections = [] }) {
  const statusItems = [
    { label: 'Available', color: '#10B981', border: '#047857' },
    { label: 'Selected', color: '#2563EB', border: '#1E40AF' },
    { label: 'Reserved', color: '#F59E0B', border: '#D97706' },
    { label: 'Sold', color: '#9CA3AF', border: '#6B7280' },
  ];

  return (
    <div className="section-legend" aria-label="Seating map legend">
      <div className="legend-group">
        <span className="legend-group-title">Status:</span>
        <div className="legend-items">
          {statusItems.map((item) => (
            <div key={item.label} className="legend-item">
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
          <span className="legend-group-title">Tiers:</span>
          <div className="legend-items">
            {sections.map((sec) => (
              <div key={sec.id} className="legend-item tier-item">
                <span className="tier-name">{sec.name}:</span>
                <span className="tier-price">${sec.defaultPrice.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
