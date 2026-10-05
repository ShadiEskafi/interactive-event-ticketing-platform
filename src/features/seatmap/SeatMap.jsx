import { useState, useCallback, useMemo, useRef } from 'react';
import { Seat } from './components/Seat';
import { SeatTooltip } from './components/SeatTooltip';
import { Stage } from './components/Stage';
import { SectionLegend } from './components/SectionLegend';
import { usePanZoom } from './hooks/usePanZoom';

const ROW_ORDER = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R'];

export function SeatMap({
  layout,
  seats = [],
  selectedSeats = [],
  onSeatSelect,
}) {
  const containerRef = useRef(null);
  const [focusedSeatId, setFocusedSeatId] = useState(null);
  const [tooltipState, setTooltipState] = useState({
    visible: false,
    seat: null,
    x: 0,
    y: 0,
  });

  const {
    transform,
    zoomIn,
    zoomOut,
    resetTransform,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
  } = usePanZoom();

  // Create lookup map for fast O(1) seat retrieval
  const seatMap = useMemo(() => {
    const map = new Map();
    seats.forEach((seat) => map.set(seat.id, seat));
    return map;
  }, [seats]);

  // Selected seat IDs set for O(1) checks
  const selectedSeatIds = useMemo(() => {
    return new Set(selectedSeats.map((s) => s.id));
  }, [selectedSeats]);

  // Group seats by row for accessible SVG <g role="row"> structure
  const seatsByRow = useMemo(() => {
    const grouped = new Map();
    ROW_ORDER.forEach((rowLabel) => grouped.set(rowLabel, []));

    seats.forEach((seat) => {
      if (grouped.has(seat.rowLabel)) {
        grouped.get(seat.rowLabel).push(seat);
      } else {
        grouped.set(seat.rowLabel, [seat]);
      }
    });

    return Array.from(grouped.entries()).filter(([, rowSeats]) => rowSeats.length > 0);
  }, [seats]);

  // Tooltip event handlers (decoupled pointer delegation)
  const handleSeatHover = useCallback((seat, { clientX, clientY }) => {
    if (!containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    setTooltipState({
      visible: true,
      seat,
      x: clientX - containerRect.left,
      y: clientY - containerRect.top,
    });
  }, []);

  const handleSeatHoverLeave = useCallback(() => {
    setTooltipState((prev) => (prev.visible ? { ...prev, visible: false, seat: null } : prev));
  }, []);

  // Keyboard navigation across adjacent grid cells
  const handleKeyDown = useCallback(
    (e) => {
      const currentSeatId = focusedSeatId || (selectedSeats[0]?.id) || 'A-1';
      const currentSeat = seatMap.get(currentSeatId);

      if (!currentSeat) return;

      const currentRowIdx = ROW_ORDER.indexOf(currentSeat.rowLabel);
      let targetSeatId = null;

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        const nextNum = currentSeat.seatNumber + 1;
        const candidate = `${currentSeat.rowLabel}-${nextNum}`;
        if (seatMap.has(candidate)) targetSeatId = candidate;
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        const prevNum = currentSeat.seatNumber - 1;
        const candidate = `${currentSeat.rowLabel}-${prevNum}`;
        if (seatMap.has(candidate)) targetSeatId = candidate;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (currentRowIdx < ROW_ORDER.length - 1) {
          const nextRowLabel = ROW_ORDER[currentRowIdx + 1];
          const candidate = `${nextRowLabel}-${currentSeat.seatNumber}`;
          if (seatMap.has(candidate)) {
            targetSeatId = candidate;
          } else {
            // Find closest available seat in that row
            const rowSeats = seatMap.get(`${nextRowLabel}-1`);
            if (rowSeats) targetSeatId = `${nextRowLabel}-1`;
          }
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (currentRowIdx > 0) {
          const prevRowLabel = ROW_ORDER[currentRowIdx - 1];
          const candidate = `${prevRowLabel}-${currentSeat.seatNumber}`;
          if (seatMap.has(candidate)) {
            targetSeatId = candidate;
          } else {
            targetSeatId = `${prevRowLabel}-1`;
          }
        }
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onSeatSelect) {
          onSeatSelect(currentSeat);
        }
        return;
      }

      if (targetSeatId && seatMap.has(targetSeatId)) {
        setFocusedSeatId(targetSeatId);
        const el = containerRef.current?.querySelector(`[data-seat-id="${targetSeatId}"]`);
        if (el) {
          el.focus();
        }
      }
    },
    [focusedSeatId, selectedSeats, seatMap, onSeatSelect]
  );

  return (
    <div
      ref={containerRef}
      className="seat-map-wrapper"
      role="grid"
      aria-label="Venue seating plan"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onWheel={onWheel}
    >
      {/* Pan & Zoom Floating Toolbar */}
      <div className="map-controls" role="toolbar" aria-label="Map Zoom and Navigation Controls">
        <button
          type="button"
          className="btn-map-control"
          onClick={zoomIn}
          aria-label="Zoom in"
          title="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          className="btn-map-control"
          onClick={zoomOut}
          aria-label="Zoom out"
          title="Zoom out"
        >
          &minus;
        </button>
        <button
          type="button"
          className="btn-map-control btn-reset"
          onClick={resetTransform}
          aria-label="Reset view"
          title="Reset view"
        >
          Reset
        </button>
        <span className="scale-indicator">{Math.round(transform.scale * 100)}%</span>
      </div>

      {/* SVG Seating Viewport */}
      <svg
        className="seat-map-svg"
        viewBox={layout?.viewBox || '0 0 1400 950'}
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          className="transform-viewport"
          transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}
        >
          {/* Stage Area */}
          <Stage stage={layout?.stage} />

          {/* Section Seating Topology grouped in <g role="row"> */}
          {seatsByRow.map(([rowLabel, rowSeats]) => (
            <g
              key={rowLabel}
              role="row"
              aria-label={`Row ${rowLabel}`}
              className="seat-row-group"
            >
              {/* Row label markers */}
              <text
                x={(rowSeats[0]?.cx || 100) - 40}
                y={rowSeats[0]?.cy || 0}
                dominantBaseline="central"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="13"
                fontWeight="700"
                className="row-indicator"
              >
                {rowLabel}
              </text>

              {rowSeats.map((seat) => (
                <Seat
                  key={seat.id}
                  seat={seat}
                  isSelected={selectedSeatIds.has(seat.id)}
                  isFocused={focusedSeatId === seat.id}
                  onSelect={onSeatSelect}
                  onHover={handleSeatHover}
                  onHoverLeave={handleSeatHoverLeave}
                  onFocus={() => setFocusedSeatId(seat.id)}
                />
              ))}

              <text
                x={(rowSeats[rowSeats.length - 1]?.cx || 1000) + 40}
                y={rowSeats[0]?.cy || 0}
                dominantBaseline="central"
                textAnchor="middle"
                fill="#94A3B8"
                fontSize="13"
                fontWeight="700"
                className="row-indicator"
              >
                {rowLabel}
              </text>
            </g>
          ))}
        </g>
      </svg>

      {/* Decoupled Floating Tooltip Overlay */}
      <SeatTooltip
        visible={tooltipState.visible}
        seat={tooltipState.seat}
        x={tooltipState.x}
        y={tooltipState.y}
      />

      {/* Seating Map Legend */}
      <SectionLegend sections={layout?.sections} />
    </div>
  );
}
