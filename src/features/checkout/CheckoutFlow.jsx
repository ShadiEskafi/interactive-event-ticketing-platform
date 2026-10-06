import { useState, useCallback } from 'react';
import { useAuth } from '../auth/hooks/useAuth';
import { useAuthBoundary } from '../auth/hooks/useAuthBoundary';
import { AuthModal } from '../auth/AuthModal';
import { PaymentStep } from './components/PaymentStep';
import { CartSummary } from '../seatmap/components/CartSummary';
import './CheckoutFlow.css';

/**
 * Checkout Flow Coordinator (SPEC-03 / FEAT-AUTH-03)
 * Orchestrates Step 1 (Review) and Step 2 (Payment), gating checkout behind frictionless auth.
 */
export function CheckoutFlow({
  eventId = 'evt-symphony-2026',
  selectedSeats = [],
  subtotal = 0,
  tierSummary = {},
  reservationData = null,
  isExpired = false,
  onExpire = null,
  onDeselectSeat = null,
  onReturnToMap = null,
  onPaymentSuccess = null,
  customTicketingService = null,
  initialStep = 'review',
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(initialStep); // 'review' | 'payment'
  const [authenticatedAttendee, setAuthenticatedAttendee] = useState(user);

  const handleTransferSuccess = useCallback(
    ({ user: authedUser }) => {
      setAuthenticatedAttendee(authedUser);
      setStep('payment');
    },
    []
  );

  const {
    isAuthModalOpen,
    isExpired: isAuthExpired,
    proceedToCheckout,
    closeAuthModal,
    handleAuthSuccess,
    handleHoldExpired,
  } = useAuthBoundary({
    eventId,
    selectedSeats,
    subtotal,
    reservedUntil: reservationData?.reservedUntil,
    anonymousSessionId: reservationData?.userId,
    onHoldExpired: onExpire,
    onTransferSuccess: handleTransferSuccess,
    customTicketingService,
  });

  const handleStartCheckout = () => {
    const result = proceedToCheckout(reservationData?.userId);
    if (result.isDirect) {
      setAuthenticatedAttendee(user);
      setStep('payment');
    }
  };

  const handleReturnFromModal = () => {
    closeAuthModal();
    if (onReturnToMap) {
      onReturnToMap();
    }
  };

  return (
    <div className="checkout-flow-container" data-testid="checkout-flow">
      {/* Checkout Step Breadcrumbs */}
      <nav className="checkout-flow-steps" aria-label="Checkout Progress">
        <div className={`step-indicator ${step === 'review' ? 'active' : 'completed'}`}>
          <span className="step-number">1</span>
          <span className="step-label">Review Cart</span>
        </div>
        <div className={`step-indicator ${step === 'payment' ? 'active' : ''}`}>
          <span className="step-number">2</span>
          <span className="step-label">Payment</span>
        </div>
      </nav>

      {/* Step 1: Cart Review */}
      {step === 'review' && (
        <div className="checkout-review-view" data-testid="checkout-step-review">
          <CartSummary
            selectedSeats={selectedSeats}
            tierSummary={tierSummary}
            subtotal={subtotal}
            onDeselectSeat={onDeselectSeat}
            onCheckout={handleStartCheckout}
          />
        </div>
      )}

      {/* Step 2: Payment Form */}
      {step === 'payment' && (
        <PaymentStep
          user={authenticatedAttendee || user}
          selectedSeats={selectedSeats}
          subtotal={subtotal}
          reservedUntil={reservationData?.reservedUntil}
          isExpired={isExpired || isAuthExpired}
          onExpire={onExpire}
          onReturnToMap={onReturnToMap}
          onPaymentSuccess={onPaymentSuccess}
        />
      )}

      {/* Smart Frictionless Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        reservedUntil={reservationData?.reservedUntil}
        isExpired={isExpired || isAuthExpired}
        onExpire={handleHoldExpired}
        onReturnToMap={handleReturnFromModal}
        onAuthSuccess={handleAuthSuccess}
      />
    </div>
  );
}
