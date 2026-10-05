import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SeatMap } from '../../src/features/seatmap/SeatMap';
import { mockVenueLayout, generateSeats } from '../../src/features/seatmap/data/mockVenueLayout';

describe('SeatMap Accessibility & Keyboard Navigation (WCAG 2.1 AA)', () => {
  const seats = generateSeats(mockVenueLayout);

  it('provides proper ARIA grid and row semantics', () => {
    render(
      <SeatMap
        layout={mockVenueLayout}
        seats={seats}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
      />
    );

    const grid = screen.getByRole('grid');
    expect(grid).toBeInTheDocument();
    expect(grid).toHaveAttribute('aria-label', 'Venue seating plan');

    // 18 rows (A-E: 5, F-M: 8, N-R: 5)
    const rows = screen.getAllByRole('row');
    expect(rows).toHaveLength(18);
  });

  it('navigates with Arrow keys and toggles selection with Enter or Space', () => {
    const handleSelect = vi.fn();

    render(
      <SeatMap
        layout={mockVenueLayout}
        seats={seats}
        selectedSeats={[]}
        onSeatSelect={handleSelect}
      />
    );

    const grid = screen.getByRole('grid');
    const seatA1 = screen.getByTestId('A-1');

    // Focus first seat
    seatA1.focus();

    // Press ArrowRight to move to A-2
    fireEvent.keyDown(grid, { key: 'ArrowRight' });

    // Press Enter to select
    fireEvent.keyDown(grid, { key: 'Enter' });
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'A-2' })
    );

    // Press Space to select
    fireEvent.keyDown(grid, { key: ' ' });
    expect(handleSelect).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'A-2' })
    );
  });
});
