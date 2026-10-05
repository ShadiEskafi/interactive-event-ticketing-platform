/**
 * Decoupled Seat Tooltip component
 * Rendered outside the SVG seat tree to eliminate re-renders of the 520 seat elements.
 */
export function SeatTooltip({ visible, seat, x, y }) {
  if (!visible || !seat) return null;

  const formattedPrice = typeof seat.price === 'number' ? seat.price.toFixed(2) : '0.00';

  return (
    <div
      role="tooltip"
      className="seat-tooltip-overlay"
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
          Row {seat.rowLabel}, Seat {seat.seatNumber}
        </div>
        <div className="seat-tooltip-details">
          <span className="seat-tooltip-category">{seat.category}</span>
          <span className="seat-tooltip-sep">-</span>
          <span className="seat-tooltip-price">${formattedPrice}</span>
        </div>
        <div className="seat-tooltip-status">
          Status: <strong className={`status-${seat.status}`}>{seat.status}</strong>
        </div>
      </div>
      <div className="seat-tooltip-arrow" />
    </div>
  );
}
