import { TicketIcon, HomeIcon } from '../../../components/common/Icons';

/**
 * DashboardNavbar Component - Top Navigation Bar (Figma Node 125:85 / 145:27548 & 145:27643)
 * Height: 96px, Background: #101813 (Deep Forest)
 * Provides 1:1 Pixel-Perfect alignment with brand cluster, center links, and actions.
 */
export function DashboardNavbar({
  onNavigateHome,
  onToggleLanguage,
  language = 'en',
}) {
  const isAr = language === 'ar';

  return (
    <nav className="tc-navigation-bar" aria-label={isAr ? 'شريط التنقل الرئيسي' : 'Main Navigation'}>
      {/* 1. Brand Cluster */}
      <div
        className="tc-brand-cluster"
        onClick={onNavigateHome}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onNavigateHome?.();
          }
        }}
        data-testid="brand-cluster"
      >
        <div className="tc-brand-mark" aria-hidden="true">
          <TicketIcon size={22} />
        </div>
        <div className="tc-brand-text">
          <span className="tc-brand-title">TicketCraft</span>
          <span className="tc-brand-subtitle">تيكت كرافت</span>
        </div>
      </div>

      {/* 2. Center Navigation Links */}
      <div className="tc-nav-center-links" role="menubar">
        <button
          type="button"
          className="tc-nav-link"
          onClick={onNavigateHome}
          role="menuitem"
        >
          {isAr ? 'الفعاليات' : 'Events'}
        </button>
        <button
          type="button"
          className="tc-nav-link"
          role="menuitem"
        >
          {isAr ? 'المميزات' : 'Features'}
        </button>
        <button
          type="button"
          className="tc-nav-link"
          role="menuitem"
        >
          {isAr ? 'المنظمون' : 'Organizers'}
        </button>
        <button
          type="button"
          className="tc-nav-link"
          role="menuitem"
        >
          {isAr ? 'الأسعار' : 'Pricing'}
        </button>
      </div>

      {/* 3. Header Action Buttons */}
      <div className="tc-header-actions">
        <button
          type="button"
          className="tc-lang-toggle-btn"
          onClick={onToggleLanguage}
          data-testid="btn-language-toggle"
          aria-label={isAr ? 'Switch language to English' : 'تغيير اللغة إلى العربية'}
        >
          {isAr ? 'EN / AR' : 'AR / EN'}
        </button>

        <button
          type="button"
          className="tc-btn-action-lime"
          onClick={onNavigateHome}
          data-testid="btn-navigate-home"
        >
          <HomeIcon size={16} />
          <span>{isAr ? 'الرئيسية' : 'Home'}</span>
        </button>
      </div>
    </nav>
  );
}

export default DashboardNavbar;
