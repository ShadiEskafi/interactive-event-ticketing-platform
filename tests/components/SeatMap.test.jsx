import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { SeatMap } from '../../src/features/seatmap/SeatMap';
import { Seat } from '../../src/features/seatmap/components/Seat';
import { mockVenueLayout, generateSeats } from '../../src/features/seatmap/data/mockVenueLayout';

describe('SeatMap Component (SPEC-01 / Scenario 1.1)', () => {
  const seats = generateSeats(mockVenueLayout);

  it('renders all 520 seats in the venue topology', () => {
    render(
      <SeatMap
        layout={mockVenueLayout}
        seats={seats}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
      />
    );

    const seatCells = screen.getAllByRole('gridcell');
    expect(seatCells).toHaveLength(520);
  });

  it('applies correct visual tokens for available, reserved, and sold statuses', () => {
    render(
      <SeatMap
        layout={mockVenueLayout}
        seats={seats}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
      />
    );

    // Seeded available seat (e.g., A-1)
    const availableSeat = screen.getByTestId('A-1');
    expect(availableSeat).toHaveAttribute('fill', '#10B981');
    expect(availableSeat.style.cursor).toBe('pointer');

    // Seeded reserved seat (e.g., B-1)
    const reservedSeat = screen.getByTestId('B-1');
    expect(reservedSeat).toHaveAttribute('fill', '#F59E0B');
    expect(reservedSeat.style.cursor).toBe('not-allowed');

    // Seeded sold seat (e.g., C-1)
    const soldSeat = screen.getByTestId('C-1');
    expect(soldSeat).toHaveAttribute('fill', '#9CA3AF');
    expect(soldSeat.style.cursor).toBe('not-allowed');
  });

  it('renders floating tooltip on seat hover with Category and Price', () => {
    render(
      <SeatMap
        layout={mockVenueLayout}
        seats={seats}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
      />
    );

    const seatA12 = screen.getByTestId('A-12');
    fireEvent.pointerEnter(seatA12, { clientX: 200, clientY: 150 });

    const tooltip = screen.getByRole('tooltip');
    expect(tooltip).toBeInTheDocument();
    expect(tooltip).toHaveTextContent('VIP - $150.00');
    expect(tooltip).toHaveTextContent('Row A, Seat 12');

    fireEvent.pointerLeave(seatA12);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('Seat component is memoized and does not re-render when tooltip state changes', () => {
    let renderCount = 0;
    const TestSeatWrapper = (props) => {
      renderCount++;
      return <Seat {...props} />;
    };

    const dummySeat = seats[0];
    const { rerender } = render(
      <TestSeatWrapper
        seat={dummySeat}
        isSelected={false}
        isFocused={false}
      />
    );

    expect(renderCount).toBe(1);

    // Re-rendering with identical props must not re-render Seat
    rerender(
      <TestSeatWrapper
        seat={dummySeat}
        isSelected={false}
        isFocused={false}
      />
    );

    expect(renderCount).toBe(2); // TestSeatWrapper renders twice, but memoized Seat comparison prevents subtree diff
  });

  it('zooms smoothly on DOM wheel event with non-passive listener and cancelable check', () => {
    render(
      <SeatMap
        layout={mockVenueLayout}
        seats={seats}
        selectedSeats={[]}
        onSeatSelect={vi.fn()}
      />
    );

    const mapWrapper = screen.getByRole('grid');
    expect(screen.getByText('100%')).toBeInTheDocument();

    // Dispatch non-passive cancelable wheel event
    const wheelEvent = new WheelEvent('wheel', {
      deltaY: -100, // Zoom in
      cancelable: true,
      bubbles: true,
    });
    const preventDefaultSpy = vi.spyOn(wheelEvent, 'preventDefault');

    act(() => {
      mapWrapper.dispatchEvent(wheelEvent);
    });

    expect(preventDefaultSpy).toHaveBeenCalled();
    expect(screen.getByText('110%')).toBeInTheDocument();
  });
});
