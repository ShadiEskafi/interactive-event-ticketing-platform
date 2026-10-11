import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ScanResultOverlay } from '../../src/features/gate-scanner/components/ScanResultOverlay';
import { GateScannerPage } from '../../src/features/gate-scanner/GateScannerPage';
import { SeatMap } from '../../src/features/seatmap/SeatMap';
import { CartSummary } from '../../src/features/seatmap/components/CartSummary';
import { AuthModal } from '../../src/features/auth/AuthModal';
import { SessionExpiredModal } from '../../src/features/hold/SessionExpiredModal';
import { PassModal } from '../../src/features/tickets/components/FullScreenQRModal';
import { MainNavbar } from '../../src/App';
import { AuthProvider } from '../../src/features/auth';
import { LanguageProvider } from '../../src/context';
import { MockAuthService } from '../mocks/mockAuthService';

describe('📱 Mobile Responsiveness Overhaul Suite', () => {
  let mockAuth;

  beforeEach(() => {
    mockAuth = new MockAuthService(null);
    vi.clearAllMocks();
  });

  describe('1. Gate Scanner Mobile Overlays & Viewfinder', () => {
    it('ScanResultOverlay centers with max-w-[92vw], max-h-[85vh] and safe-area CTA', () => {
      const mockResult = {
        valid: true,
        status: 'ENTRY_GRANTED',
        message: 'Access granted.',
        attendee_name: 'Jane Doe',
        tier: 'VIP',
        section: 'Stalls',
        row_label: 'B',
        seat_number: 7,
      };

      const onClose = vi.fn();
      render(<ScanResultOverlay result={mockResult} onClose={onClose} />);

      const overlay = screen.getByTestId('scan-result-overlay');
      expect(overlay.className).toContain('flex items-center justify-center');
      expect(overlay.className).toContain('p-4');

      const card = screen.getByTestId('scan-result-card');
      expect(card.className).toContain('max-w-[92vw]');
      expect(card.className).toContain('max-h-[85vh]');
      expect(card.className).toContain('overflow-y-auto');

      const nextScanBtn = screen.getByTestId('btn-dismiss-result');
      expect(nextScanBtn).toBeInTheDocument();
      fireEvent.click(nextScanBtn);
      expect(onClose).toHaveBeenCalled();
    });

    it('GateScannerPage renders thumb-reachable gate selector and controls', () => {
      render(
        <LanguageProvider>
          <GateScannerPage eventId="evt-symphony-2026" eventName="Grand Symphony" />
        </LanguageProvider>
      );

      expect(screen.getByTestId('gate-scanner-page')).toBeInTheDocument();
      expect(screen.getByTestId('btn-select-gate')).toBeInTheDocument();
      expect(screen.getByTestId('btn-manual-entry-modal')).toBeInTheDocument();
      expect(screen.getByTestId('camera-scanner-container')).toBeInTheDocument();
    });
  });

  describe('2. Interactive SVG SeatMap & Mobile Bottom Sheet', () => {
    it('SeatMap wrapper and SVG canvas enforce touch-action: none', () => {
      const mockLayout = {
        viewBox: '0 0 1000 800',
        stage: { name: 'Main Stage' },
        sections: [],
      };

      render(
        <SeatMap
          layout={mockLayout}
          seats={[{ id: 'A-1', rowLabel: 'A', seatNumber: 1, cx: 200, cy: 300, price: 100, category: 'VIP', status: 'available' }]}
          selectedSeats={[]}
        />
      );

      const wrapper = screen.getByRole('grid', { name: /Venue seating plan/i });
      expect(wrapper.style.touchAction).toBe('none');

      const svg = wrapper.querySelector('svg');
      expect(svg.style.touchAction).toBe('none');
    });

    it('CartSummary operates as expandable mobile bottom sheet with toggle and checkout CTA', () => {
      const selectedSeats = [
        { id: 'A-1', rowLabel: 'A', seatNumber: 1, category: 'VIP', price: 150 },
        { id: 'A-2', rowLabel: 'A', seatNumber: 2, category: 'VIP', price: 150 },
      ];
      const onCheckout = vi.fn();
      const onDeselectSeat = vi.fn();

      render(
        <CartSummary
          selectedSeats={selectedSeats}
          onCheckout={onCheckout}
          onDeselectSeat={onDeselectSeat}
        />
      );

      expect(screen.getByTestId('cart-seat-count')).toHaveTextContent('2');
      expect(screen.getByTestId('cart-subtotal')).toHaveTextContent('$300.00');

      const toggleBtn = screen.getByRole('button', { name: /Expand selected seats/i });
      expect(toggleBtn).toBeInTheDocument();

      // Click to expand bottom sheet
      fireEvent.click(toggleBtn);
      expect(screen.getByRole('button', { name: /Collapse selected seats/i })).toBeInTheDocument();

      // Checkout button is active and callable
      const checkoutBtn = screen.getByRole('button', { name: /Proceed to Checkout/i });
      fireEvent.click(checkoutBtn);
      expect(onCheckout).toHaveBeenCalled();
    });
  });

  describe('3. Global Modals & Dialogs Mobile Hardening', () => {
    it('AuthModal applies p-4 sm:p-6 backdrop and w-full max-w-[95vw] sm:max-w-lg max-h-[90vh] container', () => {
      render(
        <AuthProvider authService={mockAuth}>
          <AuthModal isOpen={true} onClose={vi.fn()} />
        </AuthProvider>
      );

      const backdrop = screen.getByTestId('auth-modal-backdrop');
      expect(backdrop.className).toContain('flex items-center justify-center');
      expect(backdrop.className).toContain('p-4');

      const container = screen.getByTestId('auth-modal');
      expect(container.className).toContain('max-w-[95vw]');
      expect(container.className).toContain('max-h-[90vh]');
      expect(container.className).toContain('overflow-y-auto');
    });

    it('SessionExpiredModal applies responsive modal classes and Return to Map CTA', () => {
      const onReturnToMap = vi.fn();
      render(<SessionExpiredModal isOpen={true} onReturnToMap={onReturnToMap} />);

      const overlay = screen.getByRole('dialog');
      expect(overlay.className).toContain('flex items-center justify-center');
      expect(overlay.className).toContain('p-4');

      const card = overlay.querySelector('.session-expired-card');
      expect(card.className).toContain('max-w-[95vw]');
      expect(card.className).toContain('max-h-[90vh]');
      expect(card.className).toContain('overflow-y-auto');

      const returnBtn = screen.getByRole('button', { name: /Return to Seat Map/i });
      fireEvent.click(returnBtn);
      expect(onReturnToMap).toHaveBeenCalled();
    });

    it('FullScreenQRModal / PassModal scales QR code and renders export PNG/PDF buttons without clipping', () => {
      const mockTicket = {
        id: 'tkt-1',
        ticket_code: 'TKT-10029',
        event_title: 'Grand Symphony Concert',
        row_label: 'A',
        seat_number: 1,
        tier: 'VIP',
        attendee_name: 'Test Attendee',
        qr_payload: 'TKT-10029|TEST_SIGNATURE',
      };

      render(<PassModal isOpen={true} ticket={mockTicket} onClose={vi.fn()} />);

      const backdrop = screen.getByTestId('qr-modal-backdrop');
      expect(backdrop.className).toContain('flex items-center justify-center');

      const container = screen.getByTestId('full-screen-qr-container');
      expect(container.className).toContain('max-w-[95vw]');
      expect(container.className).toContain('max-h-[90vh]');
      expect(container.className).toContain('overflow-y-auto');

      // QR Code container
      expect(screen.getByTestId('qr-code-container')).toBeInTheDocument();

      // Download PDF and PNG buttons must be present
      expect(screen.getByTestId('download-pdf-btn')).toBeInTheDocument();
      expect(screen.getByTestId('download-png-btn')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download Printable PDF/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Download High-Resolution PNG/i })).toBeInTheDocument();
    });
  });

  describe('4. Header & Navigation Mobile Menu Drawer', () => {
    it('MainNavbar renders mobile menu toggle and toggles drawer on mobile screens', () => {
      const onSelectView = vi.fn();

      render(
        <LanguageProvider>
          <AuthProvider authService={mockAuth}>
            <MainNavbar onSelectView={onSelectView} />
          </AuthProvider>
        </LanguageProvider>
      );

      const menuToggle = screen.getByTestId('mobile-menu-toggle');
      expect(menuToggle).toBeInTheDocument();
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');

      // Open mobile drawer
      fireEvent.click(menuToggle);
      expect(menuToggle).toHaveAttribute('aria-expanded', 'true');

      // Nav center links has mobile-open class
      const navLinks = screen.getByRole('navigation', { name: /Main Navigation/i });
      expect(navLinks.className).toContain('mobile-open');

      // Backdrop exists
      const backdrop = screen.getByTestId('mobile-menu-backdrop');
      expect(backdrop).toBeInTheDocument();

      // Clicking link selects view and closes drawer
      const ticketsLink = screen.getByTestId('nav-link-my-tickets');
      fireEvent.click(ticketsLink);
      expect(onSelectView).toHaveBeenCalledWith('tickets');
      expect(menuToggle).toHaveAttribute('aria-expanded', 'false');
    });
  });
});
