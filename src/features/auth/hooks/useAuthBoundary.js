import { useState, useCallback } from 'react';
import { useAuth } from './useAuth';
import { ticketingService as defaultTicketingService } from '../../../services/ticketingService';

const PENDING_BOOKING_KEY = 'pending_booking';

/**
 * Auth Boundary Hook (SPEC-03 / FEAT-AUTH-03)
 * Intercepts unauthenticated checkout attempts, preserves seat holds in sessionStorage,
 * and transfers hold ownership seamlessly to authenticated users.
 */
export function useAuthBoundary({
  eventId,
  selectedSeats = [],
  subtotal = 0,
  reservedUntil = null,
  anonymousSessionId = null,
  onHoldExpired = null,
  onTransferSuccess = null,
  customTicketingService = null,
}) {
  const { user } = useAuth();
  const service = customTicketingService || defaultTicketingService;

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isExpired, setIsExpired] = useState(false);

  /**
   * Persists pending booking state into sessionStorage
   */
  const persistPendingBooking = useCallback(
    (anonId) => {
      if (typeof window === 'undefined' || !window.sessionStorage) return;

      const effectiveAnon = anonId || anonymousSessionId;
      if (effectiveAnon) {
        try {
          window.sessionStorage.setItem('ticketcraft_anon_session_id', effectiveAnon);
        } catch {
          // Safe fallback
        }
      }

      const payload = {
        eventId,
        seatIds: selectedSeats.map((s) => s.id),
        seats: selectedSeats,
        reservedUntil,
        subtotal,
        anonymousSessionId: effectiveAnon,
      };

      try {
        window.sessionStorage.setItem(PENDING_BOOKING_KEY, JSON.stringify(payload));
      } catch {
        // Quota fallback
      }
    },
    [eventId, selectedSeats, reservedUntil, subtotal, anonymousSessionId]
  );

  /**
   * Gatekeeper triggered on "Proceed to Checkout"
   */
  const proceedToCheckout = useCallback(
    (activeAnonId) => {
      if (selectedSeats.length === 0) return { canProceed: false };

      // 1. If already authenticated, proceed immediately to payment
      if (user) {
        if (onTransferSuccess) {
          onTransferSuccess({ user, isDirect: true });
        }
        return { canProceed: true, isDirect: true };
      }

      // 2. Unauthenticated: write pending_booking to sessionStorage and open AuthModal
      persistPendingBooking(activeAnonId);
      setIsExpired(false);
      setIsAuthModalOpen(true);
      return { canProceed: false, isModalOpened: true };
    },
    [user, selectedSeats, persistPendingBooking, onTransferSuccess]
  );

  const closeAuthModal = useCallback(() => {
    if (!isExpired) {
      setIsAuthModalOpen(false);
    }
  }, [isExpired]);

  /**
   * Handles post-authentication account linkage and hold transfer
   */
  const handleAuthSuccess = useCallback(
    async (authenticatedUser) => {
      const seatIds = selectedSeats.map((s) => s.id);
      const effectiveAnonId = anonymousSessionId;

      try {
        // Transfer temporary hold to authenticated user
        await service.transferHold(
          eventId,
          seatIds,
          authenticatedUser.id,
          effectiveAnonId
        );
      } catch {
        // Resilient fallback
      }

      setIsAuthModalOpen(false);

      if (onTransferSuccess) {
        onTransferSuccess({
          user: authenticatedUser,
          seatIds,
          subtotal,
          reservedUntil,
        });
      }
    },
    [eventId, selectedSeats, anonymousSessionId, subtotal, reservedUntil, service, onTransferSuccess]
  );

  /**
   * Edge case: Handle hold timer expiration while interacting with AuthModal
   */
  const handleHoldExpired = useCallback(async () => {
    setIsExpired(true);

    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.removeItem(PENDING_BOOKING_KEY);
      } catch {
        // Safe fallback
      }
    }

    const seatIds = selectedSeats.map((s) => s.id);

    try {
      await service.releaseSeats(eventId, seatIds, anonymousSessionId);
    } catch {
      // Safe unload fallback
    }

    if (onHoldExpired) {
      onHoldExpired();
    }
  }, [eventId, selectedSeats, anonymousSessionId, service, onHoldExpired]);

  return {
    isAuthModalOpen,
    isExpired,
    proceedToCheckout,
    closeAuthModal,
    handleAuthSuccess,
    handleHoldExpired,
    persistPendingBooking,
  };
}
