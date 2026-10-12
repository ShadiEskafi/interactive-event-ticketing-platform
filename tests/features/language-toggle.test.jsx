import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import { AppContent, MainNavbar } from '../../src/App';
import { LanguageProvider, useLanguage, LANGUAGE_STORAGE_KEY } from '../../src/context';
import { AuthProvider } from '../../src/features/auth';
import { MockAuthService } from '../mocks/mockAuthService';

describe('Bilingual Localization & RTL Support (TicketCraft MVP - Arabic Default)', () => {
  let mockAuth;

  beforeEach(() => {
    mockAuth = new MockAuthService(null);
    window.sessionStorage.clear();
    window.localStorage.clear();
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
  });

  afterEach(() => {
    document.documentElement.lang = 'ar';
    document.documentElement.dir = 'rtl';
    window.localStorage.clear();
  });

  describe('Core LanguageContext & Root Document Attributes', () => {
    it('defaults to Arabic with RTL direction and synchronizes documentElement', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
      });

      expect(result.current.language).toBe('ar');
      expect(result.current.dir).toBe('rtl');
      expect(result.current.isRtl).toBe(true);
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });

    it('toggles to English and updates documentElement lang to "en" and dir to "ltr"', () => {
      const { result } = renderHook(() => useLanguage(), {
        wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
      });

      act(() => {
        result.current.toggleLanguage();
      });

      expect(result.current.language).toBe('en');
      expect(result.current.dir).toBe('ltr');
      expect(result.current.isRtl).toBe(false);
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');

      act(() => {
        result.current.toggleLanguage();
      });

      expect(result.current.language).toBe('ar');
      expect(result.current.dir).toBe('rtl');
      expect(result.current.isRtl).toBe(true);
      expect(document.documentElement.lang).toBe('ar');
      expect(document.documentElement.dir).toBe('rtl');
    });

    it('persists language selection in localStorage across page reloads', () => {
      // 1. Initial mount and toggle to English
      const { result, unmount } = renderHook(() => useLanguage(), {
        wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
      });

      act(() => {
        result.current.setLanguage('en');
      });

      expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('en');
      unmount();

      // 2. Next mount: reads 'en' from localStorage
      const { result: reloadedResult } = renderHook(() => useLanguage(), {
        wrapper: ({ children }) => <LanguageProvider>{children}</LanguageProvider>,
      });

      expect(reloadedResult.current.language).toBe('en');
      expect(reloadedResult.current.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');
      expect(document.documentElement.dir).toBe('ltr');
    });

    it('provides graceful fallback when useLanguage is invoked outside LanguageProvider', () => {
      const { result } = renderHook(() => useLanguage());

      expect(result.current.language).toBe('en');
      expect(result.current.dir).toBe('ltr');
      expect(result.current.isRtl).toBe(false);
      expect(result.current.t('non.existent.key', 'My Default')).toBe('My Default');
    });
  });

  describe('Navbar Language Switcher & Full Platform Translation', () => {
    it('renders language toggle button in MainNavbar and toggles language between Arabic and English', () => {
      render(
        <LanguageProvider>
          <AuthProvider customAuthService={mockAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      const toggleBtn = screen.getByTestId('language-toggle-btn');
      expect(toggleBtn).toBeInTheDocument();
      // Initially in Arabic, button offers to switch to English: "English"
      expect(toggleBtn).toHaveTextContent('English');

      // Center nav links reflect Arabic translations by default
      expect(screen.getByTestId('nav-link-home')).toHaveTextContent('الرئيسية');
      expect(screen.getByTestId('nav-link-events')).toHaveTextContent('الفعاليات المميزة');
      expect(screen.getByTestId('btn-nav-signin')).toHaveTextContent('تسجيل الدخول');
      expect(screen.getByTestId('user-guest-badge')).toHaveTextContent('زائر');

      // Click to toggle to English
      fireEvent.click(toggleBtn);

      // Now in English, button offers to switch back to Arabic: "العربية"
      expect(toggleBtn).toHaveTextContent('العربية');
      expect(document.documentElement.dir).toBe('ltr');
      expect(document.documentElement.lang).toBe('en');

      expect(screen.getByTestId('nav-link-home')).toHaveTextContent('Home');
      expect(screen.getByTestId('nav-link-events')).toHaveTextContent('Featured Events');
      expect(screen.getByTestId('btn-nav-signin')).toHaveTextContent('Sign In');
      expect(screen.getByTestId('user-guest-badge')).toHaveTextContent('Guest');

      // Click again to toggle back to Arabic
      fireEvent.click(toggleBtn);

      expect(toggleBtn).toHaveTextContent('English');
      expect(document.documentElement.dir).toBe('rtl');
      expect(document.documentElement.lang).toBe('ar');
    });

    it('translates My Tickets link for authenticated attendee when language is toggled', () => {
      const attendeeAuth = new MockAuthService({
        id: 'usr-attendee',
        email: 'attendee@ticketcraft.com',
        role: 'attendee',
      });

      render(
        <LanguageProvider>
          <AuthProvider customAuthService={attendeeAuth}>
            <MainNavbar />
          </AuthProvider>
        </LanguageProvider>
      );

      const toggleBtn = screen.getByTestId('language-toggle-btn');
      expect(screen.getByTestId('nav-link-my-tickets')).toHaveTextContent('تذاكري');

      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('nav-link-my-tickets')).toHaveTextContent('My Tickets');

      fireEvent.click(toggleBtn);
      expect(screen.getByTestId('nav-link-my-tickets')).toHaveTextContent('تذاكري');
    });

    it('translates Landing Page hero, metrics, filters, events, and Why section into Arabic with 1-2-3 numerals', () => {
      render(
        <LanguageProvider initialLanguage="ar">
          <AuthProvider customAuthService={mockAuth}>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      );

      // Verify Arabic headline
      expect(
        screen.getByRole('heading', {
          name: /اكتشف واحجز تجارب وفعاليات استثنائية/i,
        })
      ).toBeInTheDocument();

      // Verify Arabic metric pills with Western numerals (1-2-3 per user preference)
      expect(screen.getByTestId('metric-pill-seats')).toHaveTextContent('520');
      expect(screen.getByTestId('metric-pill-seats')).toHaveTextContent('مقعداً فورياً');
      expect(screen.getByTestId('metric-pill-lock')).toHaveTextContent('حجز ذري مؤكد');

      // Verify Arabic category filter pills
      expect(screen.getByTestId('category-filter-all')).toHaveTextContent('الكل');
      expect(screen.getByTestId('category-filter-classical')).toHaveTextContent('كلاسيكي');
      expect(screen.getByTestId('category-filter-rock---pop')).toHaveTextContent('روك وبوب');

      // Verify Primary event card title and CTA in Arabic
      expect(screen.getByText('حفل السيمفونية الكبرى')).toBeInTheDocument();
      expect(screen.getByTestId('btn-select-seats-symphony')).toHaveTextContent('اختر المقاعد ←');

      // Verify "Why TicketCraft?" in Arabic
      expect(screen.getByText('لماذا تيكت كرافت؟')).toBeInTheDocument();
      expect(
        screen.getByText('محرك SVG للتكبير والتحريك بـ 60 إطاراً/ثانية')
      ).toBeInTheDocument();
    });

    it('supports selecting an Arabic event card and navigating to booking with Arabic event title and back button', async () => {
      render(
        <LanguageProvider initialLanguage="ar">
          <AuthProvider customAuthService={mockAuth}>
            <AppContent />
          </AuthProvider>
        </LanguageProvider>
      );

      // Click Arabic CTA on Grand Symphony Concert card
      fireEvent.click(screen.getByTestId('btn-select-seats-symphony'));

      // In booking view: title and back navigation are in Arabic
      const backBtn = await screen.findByTestId('btn-back-to-events');
      expect(backBtn).toBeInTheDocument();
      expect(backBtn).toHaveTextContent(/العودة إلى الفعاليات/i);

      // Click Back to Events
      fireEvent.click(backBtn);

      // Returned to Arabic Landing Page
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
      expect(screen.getByTestId('primary-event-card')).toHaveTextContent('حفل السيمفونية الكبرى');
    });
  });
});
