import React from 'react';

const STATUS_COLORS = {
  available: '#10B981',
  selected: '#2563EB',
  reserved: '#F59E0B',
  sold: '#9CA3AF',
  unavailable: '#E5E7EB',
};

function SeatComponent({
  seat,
  isSelected,
  isFocused = false,
  onSelect,
  onHover,
  onHoverLeave,
  onFocus,
}) {
  const isInteractive = seat.status === 'available' || isSelected;
  const currentFill = isSelected ? STATUS_COLORS.selected : (STATUS_COLORS[seat.status] || STATUS_COLORS.available);
  const cursorStyle = isInteractive ? 'pointer' : 'not-allowed';

  const handleClick = (e) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(seat);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (onSelect) {
        onSelect(seat);
      }
    }
  };

  const handlePointerEnter = (e) => {
    if (onHover) {
      const rect = e.currentTarget.getBoundingClientRect();
      onHover(seat, {
        clientX: e.clientX,
        clientY: e.clientY,
        rect,
      });
    }
  };

  const handlePointerLeave = () => {
    if (onHoverLeave) {
      onHoverLeave();
    }
  };

  const handleFocus = () => {
    if (onFocus) {
      onFocus(seat);
    }
  };

  const formattedPrice = typeof seat.price === 'number' ? seat.price.toFixed(2) : '0.00';
  const ariaLabel = `Seat ${seat.rowLabel}${seat.seatNumber}, Category: ${seat.category}, Price: $${formattedPrice}, Status: ${isSelected ? 'selected' : seat.status}`;

  return (
    <g
      className={`seat-node ${isSelected ? 'is-selected' : ''} ${isFocused ? 'is-focused' : ''}`}
      transform={`translate(${seat.cx}, ${seat.cy})`}
    >
      <circle
        role="gridcell"
        data-seat-id={seat.id}
        data-testid={seat.id}
        r={seat.radius || 12}
        fill={currentFill}
        stroke={isFocused ? '#1D4ED8' : isSelected ? '#1E40AF' : '#047857'}
        strokeWidth={isFocused ? 3 : isSelected ? 2 : 1}
        tabIndex={isInteractive ? 0 : -1}
        aria-label={ariaLabel}
        aria-selected={isSelected}
        style={{
          cursor: cursorStyle,
          transition: 'fill 0.15s ease, stroke 0.15s ease, transform 0.15s ease',
          outline: 'none',
        }}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onFocus={handleFocus}
      />
      {seat.radius >= 11 && (
        <text
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="9"
          fill="#FFFFFF"
          fontWeight="600"
          pointerEvents="none"
          userSelect="none"
        >
          {seat.seatNumber}
        </text>
      )}
    </g>
  );
}

/**
 * Strict React.memo comparison to guarantee 60fps render performance
 * Prevents 520 seat re-renders when hovering or moving tooltips.
 */
export const Seat = React.memo(SeatComponent, (prevProps, nextProps) => {
  return (
    prevProps.seat.id === nextProps.seat.id &&
    prevProps.seat.status === nextProps.seat.status &&
    prevProps.seat.price === nextProps.seat.price &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isFocused === nextProps.isFocused
  );
});
