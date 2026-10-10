import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LandingPage } from '../../src/features/landing';
import { AppContent } from '../../src/App';
import { AuthProvider } from '../../src/features/auth';
import { MockAuthService } from '../mocks/mockAuthService';
import { mockTicketingService } from '../../src/features/seatmap/services/mockTicketingService';

describe('Landing Page & Navigation Integration (TicketCraft MVP)', () => {
  let mockAuth;

  beforeEach(() => {
    mockAuth = new MockAuthService(null);
    window.sessionStorage.clear();
    mockTicketingService.resetState();
  });

  describe('LandingPage Component UI & Interactions', () => {
    it('renders hero headline, architectural metric pills, and search/filter inputs', () => {
      render(<LandingPage />);

      // Hero headline
      expect(
        screen.getByRole('heading', {
          name: /Discover & Book Exceptional Live Experiences/i,
        })
      ).toBeInTheDocument();

      // Platform metric pills
      expect(screen.getByTestId('metric-pill-seats')).toHaveTextContent('520');
      expect(screen.getByTestId('metric-pill-seats')).toHaveTextContent(/Realtime Seats/i);

      expect(screen.getByTestId('metric-pill-lock')).toHaveTextContent('300s');
      expect(screen.getByTestId('metric-pill-lock')).toHaveTextContent(/Pessimistic Atomic Lock/i);

      expect(screen.getByTestId('metric-pill-qr')).toHaveTextContent('HMAC-SHA256');
      expect(screen.getByTestId('metric-pill-qr')).toHaveTextContent(/Signed QR Passes/i);

      // Search input
      expect(screen.getByTestId('hero-search-input')).toBeInTheDocument();

      // Category filters
      expect(screen.getByTestId('category-filter-all')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter-classical')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter-rock---pop')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter-theatre')).toBeInTheDocument();
      expect(screen.getByTestId('category-filter-festivals')).toBeInTheDocument();
    });

    it('filters events dynamically by category button click', () => {
      render(<LandingPage />);

      // Initially All is active: both Symphony and Cyberpunk visible
      expect(screen.getByText('Grand Symphony Concert')).toBeInTheDocument();
      expect(screen.getByText('Cyberpunk Night 2026: Neon Pulse')).toBeInTheDocument();

      // Click "Classical" category filter
      fireEvent.click(screen.getByTestId('category-filter-classical'));

      expect(screen.getByText('Grand Symphony Concert')).toBeInTheDocument();
      expect(screen.queryByText('Cyberpunk Night 2026: Neon Pulse')).not.toBeInTheDocument();

      // Click "Rock & Pop" category filter
      fireEvent.click(screen.getByTestId('category-filter-rock---pop'));

      expect(screen.getByText('Cyberpunk Night 2026: Neon Pulse')).toBeInTheDocument();
      expect(screen.queryByText('Grand Symphony Concert')).not.toBeInTheDocument();
    });

    it('filters events dynamically by live search input and handles empty state reset', () => {
      render(<LandingPage />);

      const searchInput = screen.getByTestId('hero-search-input');

      // Search for "Swan Lake"
      fireEvent.change(searchInput, { target: { value: 'Swan Lake' } });

      expect(screen.getByText(/Swan Lake: Tchaikovsky Masterpiece/i)).toBeInTheDocument();
      expect(screen.queryByText('Grand Symphony Concert')).not.toBeInTheDocument();

      // Search for non-existent event
      fireEvent.change(searchInput, { target: { value: 'NonExistentConcert123' } });
      expect(screen.getByTestId('events-empty-state')).toBeInTheDocument();
      expect(screen.getByText(/No Events Found/i)).toBeInTheDocument();

      // Click Reset Filters
      fireEvent.click(screen.getByRole('button', { name: /Reset Filters/i }));
      expect(screen.getByText('Grand Symphony Concert')).toBeInTheDocument();
      expect(searchInput).toHaveValue('');
    });

    it('renders primary event card with "Live Interactive Map", location, date, price range, and CTA', () => {
      const onSelectEvent = vi.fn();
      render(<LandingPage onSelectEvent={onSelectEvent} />);

      const primaryCard = screen.getByTestId('primary-event-card');
      expect(primaryCard).toBeInTheDocument();
      expect(primaryCard).toHaveTextContent('Grand Symphony Concert');
      expect(primaryCard).toHaveTextContent('Live Interactive Map');
      expect(primaryCard).toHaveTextContent('Grand Symphony Hall • Auditorium');
      expect(primaryCard).toHaveTextContent('$45 – $150');

      const selectSeatsBtn = screen.getByTestId('btn-select-seats-symphony');
      expect(selectSeatsBtn).toBeInTheDocument();
      expect(selectSeatsBtn).toHaveTextContent(/Select Seats →/i);

      fireEvent.click(selectSeatsBtn);
      expect(onSelectEvent).toHaveBeenCalledWith('evt-symphony-2026');
    });

    it('renders secondary event cards and invokes onSelectEvent on CTA click', () => {
      const onSelectEvent = vi.fn();
      render(<LandingPage onSelectEvent={onSelectEvent} />);

      const cyberpunkCard = screen.getByTestId('event-card-evt-cyberpunk-2026');
      expect(cyberpunkCard).toBeInTheDocument();
      expect(cyberpunkCard).toHaveTextContent('Cyberpunk Night 2026: Neon Pulse');
      expect(cyberpunkCard).toHaveTextContent('$65 – $180');

      const ctaBtn = cyberpunkCard.querySelector('.btn-select-seats');
      fireEvent.click(ctaBtn);
      expect(onSelectEvent).toHaveBeenCalledWith('evt-cyberpunk-2026');
    });

    it('renders "Why TicketCraft?" architecture section with 3 cards', () => {
      render(<LandingPage />);

      expect(screen.getByTestId('why-ticketcraft-section')).toBeInTheDocument();
      expect(screen.getByTestId('feature-card-svg-engine')).toHaveTextContent(
        '60fps Pan-Zoom SVG Engine'
      );
      expect(screen.getByTestId('feature-card-realtime-hold')).toHaveTextContent(
        'Collision-Proof Realtime Hold (300s)'
      );
      expect(screen.getByTestId('feature-card-qr-passes')).toHaveTextContent(
        'Offline Web Crypto QR Passes'
      );
    });

    it('renders brand footer with platform links, copyright, and technology pills', () => {
      render(<LandingPage />);

      expect(screen.getByTestId('footer-brand')).toHaveTextContent('TicketCraft');
      expect(screen.getByText(/© 2026 TicketCraft, Inc./i)).toBeInTheDocument();
      expect(screen.getByText(/Realtime Booking Cluster: Online/i)).toBeInTheDocument();
    });
  });

  describe('Navigation & App Integration', () => {
    it('defaults to "landing" view on initial mount in AppContent', () => {
      render(
        <AuthProvider customAuthService={mockAuth}>
          <AppContent />
        </AuthProvider>
      );

      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('nav-link-home')).toHaveClass('active');
    });

    it('navigates seamlessly from landing to booking upon selecting seats on an event card', async () => {
      render(
        <AuthProvider customAuthService={mockAuth}>
          <AppContent />
        </AuthProvider>
      );

      // Initially on landing page
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();

      // Click "Select Seats →" on Grand Symphony Concert card
      fireEvent.click(screen.getByTestId('btn-select-seats-symphony'));

      // Now booking page wrapper is visible with "← Back to Events"
      const backBtn = await screen.findByTestId('btn-back-to-events');
      expect(backBtn).toBeInTheDocument();
      expect(backBtn).toHaveTextContent('← Back to Events');

      // Click "← Back to Events"
      fireEvent.click(backBtn);

      // Returns to landing page seamlessly
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('redirects from "My Tickets" to "landing" when clicking Explore Events button', async () => {
      render(
        <AuthProvider customAuthService={mockAuth}>
          <AppContent />
        </AuthProvider>
      );

      // Navigate to My Tickets via Navbar
      fireEvent.click(screen.getByTestId('nav-link-my-tickets'));

      // My Tickets is rendered with empty state
      const exploreBtn = await screen.findByTestId('btn-explore-events');
      expect(exploreBtn).toBeInTheDocument();

      // Click Explore Events
      fireEvent.click(exploreBtn);

      // Landing page is restored
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('navigates to landing view when brand logo or Home is clicked in navbar', () => {
      render(
        <AuthProvider customAuthService={mockAuth}>
          <AppContent />
        </AuthProvider>
      );

      // Navigate to My Tickets
      fireEvent.click(screen.getByTestId('nav-link-my-tickets'));
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();

      // Click Brand logo
      fireEvent.click(screen.getByTestId('navbar-brand-logo'));
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();

      // Navigate to My Tickets again
      fireEvent.click(screen.getByTestId('nav-link-my-tickets'));
      expect(screen.queryByTestId('landing-page')).not.toBeInTheDocument();

      // Click Home button
      fireEvent.click(screen.getByTestId('nav-link-home'));
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('handles Featured Events navbar click by scrolling or navigating to events', () => {
      const scrollIntoViewMock = vi.fn();
      window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      render(
        <AuthProvider customAuthService={mockAuth}>
          <AppContent />
        </AuthProvider>
      );

      // On landing page, click Featured Events
      fireEvent.click(screen.getByTestId('nav-link-events'));
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
    });
  });
});
