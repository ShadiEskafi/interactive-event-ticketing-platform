import '../AdminDashboard.css';

/**
 * DashboardLayout Component - Structural Foundation Shell
 * Follows Figma Mihwar Design System (Node 125:85 / 145:27548 & 145:27643)
 * Provides clean Flexbox & CSS Grid slot architecture with zero arbitrary absolute positioning.
 */
export function DashboardLayout({
  dir = 'ltr',
  navbar = null,
  controls = null,
  tabs = null,
  intro = null,
  kpiGrid = null,
  charts = null,
  tables = null,
  footer = null,
  children = null,
  className = '',
}) {
  return (
    <div
      className={`tc-dashboard-shell ${className}`}
      dir={dir}
      data-testid="admin-dashboard-layout"
    >
      {/* 1. Shared Header & Navigation */}
      <header className="tc-shared-header" role="banner">
        {navbar}
        {controls}
      </header>

      {/* 2. Workspace Navigation Tabs */}
      <nav className="tc-tabs-container" aria-label="Dashboard Workspace Tabs">
        {tabs}
      </nav>

      {/* 3. Main Workspace Grid Container */}
      <main className="tc-main-workspace" role="main">
        {intro && <section className="tc-page-intro-slot">{intro}</section>}

        {kpiGrid && <section className="tc-kpi-slot" aria-label="Key Performance Indicators">{kpiGrid}</section>}

        {tables && <section className="tc-tables-slot" aria-label="Performance Data Tables">{tables}</section>}

        {charts && <section className="tc-charts-slot" aria-label="Analytics and Inventory">{charts}</section>}

        {/* Fallback / Direct Tab Content Slot */}
        {children && <section className="tc-children-slot">{children}</section>}
      </main>

      {/* 4. Footer */}
      {footer && <footer className="tc-footer-slot" role="contentinfo">{footer}</footer>}
    </div>
  );
}

export default DashboardLayout;
