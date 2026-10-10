import { useState, useEffect, useCallback } from 'react';
import { SeatMap } from './SeatMap';
import { CartSummary } from './components/CartSummary';
import { useSeatSelection } from './hooks/useSeatSelection';
import { ticketingService as mockTicketingService } from '../../services';
import {
  useSeatHold,
  useRealtimeSeats,
  CollisionAlert,
  HoldCheckoutView,
  persistPendingBooking,
  clearPendingBooking,
  getStoredPendingBooking,
  useExpiredSeatsCleanup,
} from '../hold';
import { useAuth, AuthModal } from '../auth';
import { TicketReceiptPage } from '../tickets';
import { useLanguage } from '../../context';
import './SeatMap.css';
import '../hold/Hold.css';
import '../checkout/CheckoutFlow.css';

/**
 * Event Booking Page Container (Feature Modules FEAT-SEAT-01, FEAT-HOLD-02, FEAT-AUTH-03, FEAT-TICK-04)
 */
export function EventBookingPage({
  venueId = '00000000-0000-0000-0000-000000000001',
  eventId = 'evt-symphony-2026',
  eventName = 'Grand Symphony Concert',
  requireAuth = true,
  onNavigateToDashboard,
  onBackToEvents,
}) {
  const [layout, setLayout] = useState(null);
  const [seats, setSeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'checkout' | 'receipt'
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { user } = useAuth();
  const { t } = useLanguage();
  const [authedAttendee, setAuthedAttendee] = useState(null);

  const {
    selectedSeats,
    setSelectedSeats,
    alertMessage,
    subtotal,
    tierSummary,
    toggleSeat,
    clearSelection,
    clearAlert,
  } = useSeatSelection();

  const {
    isLocking,
    holdError,
    reservationData,
    setReservationData,
    isExpired,
    reserve,
    release,
    handleExpire,
    clearHoldError,
  } = useSeatHold();

  // Background defensive sweep for expired seat holds
  useExpiredSeatsCleanup(eventId);

  // Load initial layout and seats
  const refreshSeats = useCallback(async () => {
    try {
      try {
        await mockTicketingService.releaseExpiredSeats(eventId);
      } catch {
        // Safe sweep fallback
      }
      const seatData = await mockTicketingService.getSeatAvailability(eventId);
      setSeats(seatData);
    } catch {
      // Safe fallback
    }
  }, [eventId]);

  useEffect(() => {
    let isMounted = true;

    async function loadInitialData() {
      try {
        setIsLoading(true);
        try {
          await mockTicketingService.releaseExpiredSeats(eventId);
        } catch {
          // Safe sweep fallback
        }
        const [venueLayout, seatData] = await Promise.all([
          mockTicketingService.getVenueLayout(venueId),
          mockTicketingService.getSeatAvailability(eventId),
        ]);
        if (isMounted) {
          setLayout(venueLayout);
          setSeats(seatData);

          // Hold Hydration on Mount: check if pending_booking or active hold exists in sessionStorage
          const pending = getStoredPendingBooking();
          if (pending && pending.reservedUntil) {
            const untilMs = new Date(pending.reservedUntil).getTime();
            if (untilMs > Date.now()) {
              // 1. Re-attach held seats to user's cart
              let seatsToRestore = [];
              if (pending.seats && pending.seats.length > 0) {
                seatsToRestore = pending.seats;
              } else if (pending.seatIds && pending.seatIds.length > 0) {
                seatsToRestore = seatData.filter((s) => pending.seatIds.includes(s.id));
              }

              if (seatsToRestore.length > 0) {
                setSelectedSeats(seatsToRestore);
              }

              // 2. Re-attach reservation data to restore hold timer
              if (setReservationData) {
                setReservationData({
                  seatIds: pending.seatIds || seatsToRestore.map((s) => s.id),
                  reservedUntil: pending.reservedUntil,
                  userId: pending.anonymousSessionId || pending.userId,
                });
              }

              // 3. Re-open checkout / auth modal state
              if (pending.isAuthModalOpen || (requireAuth && !user && pending.viewMode !== 'checkout')) {
                setIsAuthModalOpen(true);
                setViewMode('map');
              } else if (pending.viewMode === 'checkout' || user) {
                setViewMode('checkout');
              }
            } else {
              // Hold expired: automatically clear storage and release hold
              clearPendingBooking();
              if (pending.seatIds && pending.seatIds.length > 0) {
                mockTicketingService.releaseSeats(
                  pending.eventId || eventId,
                  pending.seatIds,
                  pending.anonymousSessionId || pending.userId
                );
              }
            }
          }
        }
      } catch {
        // Safe fallback
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadInitialData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venueId, eventId]);

  // Subscribe to Realtime seat updates (Supabase Realtime channel / mock fallback)
  useRealtimeSeats(
    eventId,
    useCallback((update) => {
      setSeats((prevSeats) => {
        const updateArray = Array.isArray(update) ? update : [update];
        const normalized = updateArray.map((s) => ({
          id: s.id,
          rowLabel: s.row_label || s.rowLabel,
          seatNumber: s.seat_number || s.seatNumber,
          category: s.category,
          price: s.price !== undefined ? parseFloat(s.price) : undefined,
          status: s.status,
          reservedBy: s.reserved_by !== undefined ? s.reserved_by : s.reservedBy,
          reservedUntil: s.reserved_until !== undefined ? s.reserved_until : s.reservedUntil,
        }));
        const updatedMap = new Map(normalized.map((s) => [s.id, s]));
        return prevSeats.map((seat) => {
          if (!updatedMap.has(seat.id)) return seat;
          const patch = updatedMap.get(seat.id);
          return {
            ...seat,
            status: patch.status ?? seat.status,
            reservedBy: patch.reservedBy !== undefined ? patch.reservedBy : seat.reservedBy,
            reservedUntil: patch.reservedUntil !== undefined ? patch.reservedUntil : seat.reservedUntil,
            category: patch.category ?? seat.category,
            price: patch.price !== undefined && !isNaN(patch.price) ? patch.price : seat.price,
          };
        });
      });
    }, [])
  );

  // Transition from Map to Checkout with atomic reservation & auth boundary
  const handleProceedToCheckout = async () => {
    if (selectedSeats.length === 0 || isLocking) return;

    const seatIds = selectedSeats.map((s) => s.id);
    const activeUserId = user?.id || reservationData?.userId;
    const result = await reserve(eventId, seatIds, activeUserId);

    if (!result.success) {
      // Re-fetch seats so conflicted ones immediately render Amber (#F59E0B)
      await refreshSeats();
      return;
    }

    if (requireAuth && !user) {
      persistPendingBooking({
        eventId,
        seatIds,
        seats: selectedSeats,
        reservedUntil: result.reserved_until,
        subtotal,
        anonymousSessionId: result.reserved_by,
        isAuthModalOpen: true,
        viewMode: 'map',
      });
      setIsAuthModalOpen(true);
    } else {
      persistPendingBooking({
        eventId,
        seatIds,
        seats: selectedSeats,
        reservedUntil: result.reserved_until,
        subtotal,
        anonymousSessionId: result.reserved_by,
        isAuthModalOpen: false,
        viewMode: 'checkout',
      });
      setViewMode('checkout');
    }
  };

  const handleAuthSuccess = async (authenticatedUser) => {
    setAuthedAttendee(authenticatedUser);
    const seatIds = selectedSeats.map((s) => s.id);
    const anonId = reservationData?.userId;

    try {
      await mockTicketingService.transferHold(
        eventId,
        seatIds,
        authenticatedUser.id,
        anonId
      );
    } catch {
      // Safe fallback
    }

    if (reservationData) {
      persistPendingBooking({
        eventId,
        seatIds,
        seats: selectedSeats,
        reservedUntil: reservationData.reservedUntil,
        subtotal,
        anonymousSessionId: authenticatedUser.id,
        isAuthModalOpen: false,
        viewMode: 'checkout',
      });
    }

    setIsAuthModalOpen(false);
    setViewMode('checkout');
  };

  const handleCloseAuthModal = async () => {
    setIsAuthModalOpen(false);
    if (reservationData?.seatIds) {
      await release(eventId, reservationData.seatIds);
    }
    clearPendingBooking();
    await refreshSeats();
  };

  const handleModalExpire = async () => {
    handleExpire();
    if (reservationData?.seatIds) {
      await release(eventId, reservationData.seatIds);
    }
    clearPendingBooking();
  };

  // Return to Seat Map after expiration or cancellation
  const handleReturnToMap = async () => {
    if (reservationData?.seatIds) {
      await release(eventId, reservationData.seatIds);
    }
    clearPendingBooking();
    clearSelection();
    await refreshSeats();
    setViewMode('map');
  };

  const handlePaymentSuccess = async (result) => {
    setConfirmedBooking(result?.booking || result);
    clearPendingBooking();
    clearSelection();
    await refreshSeats();
    setViewMode('receipt');
  };

  return (
    <div className="event-booking-page">
      {/* Event Header */}
      <header className="event-header">
        <div className="event-header-content">
          {onBackToEvents && (
            <div className="event-back-nav">
              <button
                type="button"
                className="btn-back-to-events"
                data-testid="btn-back-to-events"
                onClick={onBackToEvents}
              >
                &larr; {t('events.back_to_events', 'Back to Events').replace(/^←\s*/, '')}
              </button>
            </div>
          )}
          <h1 className="event-title">{eventName || 'Grand Symphony Concert'}</h1>
          <div className="event-meta">
            <span className="event-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Saturday, Nov 14, 2026 &bull; 8:00 PM
            </span>
            <span className="event-meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {layout?.name || 'Grand Symphony Hall'} &bull; Auditorium
            </span>
          </div>
        </div>
      </header>

      {/* Accessible Inline Alert Banner (5-seat limit guard) */}
      {alertMessage && (
        <div className="booking-alert-banner" role="alert" aria-live="assertive">
          <span>{alertMessage}</span>
          <button
            type="button"
            className="alert-dismiss-btn"
            aria-label="Dismiss alert"
            onClick={clearAlert}
          >
            &times;
          </button>
        </div>
      )}

      {/* Accessible Collision Warning Banner (Seat hold conflict) */}
      <CollisionAlert message={holdError} onDismiss={clearHoldError} />

      {/* Main Content: Map, Checkout, or Receipt View */}
      {viewMode === 'receipt' ? (
        <TicketReceiptPage
          booking={confirmedBooking}
          onNavigateToDashboard={onNavigateToDashboard}
          onReturnToMap={handleReturnToMap}
        />
      ) : viewMode === 'checkout' ? (
        <HoldCheckoutView
          selectedSeats={selectedSeats}
          reservationData={reservationData}
          isExpired={isExpired}
          onExpire={handleExpire}
          onReturnToMap={handleReturnToMap}
          onPaymentSuccess={handlePaymentSuccess}
          user={authedAttendee || user}
        />
      ) : (
        <main className="booking-body">
          {isLoading ? (
            <div className="loading-state" style={{ color: '#94A3B8', padding: '3rem', textAlign: 'center' }}>
              Loading auditorium seating plan...
            </div>
          ) : (
            <>
              <SeatMap
                layout={layout}
                seats={seats}
                selectedSeats={selectedSeats}
                onSeatSelect={toggleSeat}
              />

              <CartSummary
                selectedSeats={selectedSeats}
                tierSummary={tierSummary}
                subtotal={subtotal}
                onDeselectSeat={toggleSeat}
                onCheckout={handleProceedToCheckout}
              />
            </>
          )}
        </main>
      )}

      {/* Smart Frictionless Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={handleCloseAuthModal}
        reservedUntil={reservationData?.reservedUntil}
        isExpired={isExpired}
        onExpire={handleModalExpire}
        onReturnToMap={handleReturnToMap}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
