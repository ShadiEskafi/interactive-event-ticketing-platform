import { useState, useCallback, useMemo } from 'react';

const MAX_SEATS = 5;

/**
 * Seat Selection State Machine & Cart Hook
 * Enforces the hard 5-seat booking ceiling and maintains subtotal and tier breakdown.
 */
export function useSeatSelection(initialSelected = []) {
  const [selectedSeats, setSelectedSeats] = useState(initialSelected);
  const [alertMessage, setAlertMessage] = useState(null);

  const toggleSeat = useCallback((seat) => {
    if (!seat) return;

    setSelectedSeats((prev) => {
      const isAlreadySelected = prev.some((s) => s.id === seat.id);

      if (isAlreadySelected) {
        setAlertMessage(null);
        return prev.filter((s) => s.id !== seat.id);
      }

      // If seat is not available for booking, ignore click
      if (seat.status !== 'available') {
        return prev;
      }

      // Check max limit
      if (prev.length >= MAX_SEATS) {
        setAlertMessage('Maximum of 5 seats allowed per booking.');
        return prev;
      }

      setAlertMessage(null);
      return [...prev, seat];
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedSeats([]);
    setAlertMessage(null);
  }, []);

  const clearAlert = useCallback(() => {
    setAlertMessage(null);
  }, []);

  const seatCount = selectedSeats.length;

  const subtotal = useMemo(() => {
    return selectedSeats.reduce((sum, seat) => sum + (seat.price || 0), 0);
  }, [selectedSeats]);

  const tierSummary = useMemo(() => {
    const summary = { VIP: 0, Regular: 0, Balcony: 0 };
    selectedSeats.forEach((seat) => {
      const cat = seat.category || 'Regular';
      summary[cat] = (summary[cat] || 0) + 1;
    });
    return summary;
  }, [selectedSeats]);

  const isLimitReached = selectedSeats.length >= MAX_SEATS;

  return {
    selectedSeats,
    setSelectedSeats,
    alertMessage,
    seatCount,
    subtotal,
    tierSummary,
    isLimitReached,
    toggleSeat,
    clearSelection,
    clearAlert,
  };
}
