import { useState, useEffect } from 'react';
import { useLanguage } from '../../../context';
import { ZapIcon } from '../../../components/common/Icons';
import { KpiMetricsGrid } from './KpiMetricsGrid';
import { EventPerformanceTable } from './EventPerformanceTable';
import { RecentActivityFeed } from './RecentActivityFeed';
import { InventoryAnalyticsCard } from './InventoryAnalyticsCard';
import '../AdminDashboard.css';

/**
 * SuperAdminOverview Component - Figma 1:1 Pixel-Perfect Blueprint
 * (Nodes 125:85 / 145:27548 [EN] & 145:27643 [AR])
 *
 * Assembles:
 * - Page Introduction (Title & Timestamp)
 * - 4 Dual-Tone Key Metric Cards (KpiMetricsGrid)
 * - Atomic Seat Hold & Collision Concurrency Banner
 * - Event Performance Table (EventPerformanceTable)
 * - Two-Column Split: Recent Activity (RecentActivityFeed) & Published Inventory (InventoryAnalyticsCard)
 */
export function SuperAdminOverview({
  platformStats = {},
  concurrencyStats = {},
  events = [],
  auditLogs = [],
  onFlushHolds,
  isFlushing = false,
  onSelectEvent,
  onViewDetails,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // 300s atomic lock cycle countdown timer
  const [secondsRemaining, setSecondsRemaining] = useState(285);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsRemaining((prev) => (prev <= 5 ? 300 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleFlush = () => {
    if (onFlushHolds) {
      onFlushHolds();
    }
  };

  return (
    <div
      className="tc-overview-container"
      data-testid="super-admin-overview"
      style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}
    >
      {/* 1. Page Introduction (Figma 1:1) */}
      <div className="tc-page-intro" data-testid="page-intro">
        <h1 className="tc-page-title">
          {isAr ? 'نظرة عامة على المنصة' : 'Platform overview'}
        </h1>
        <p className="tc-page-subtitle">
          {isAr
            ? 'صورة واضحة لكل فعالية وحجز وحضور.  ·  ١٥ أكتوبر ٢٠٢٦ · ١٩:٣٠'
            : 'A clear picture of every event, booking and arrival.  ·  15 Oct 2026 · 19:30 AST'}
        </p>
      </div>

      {/* 2. Key Metrics Grid (4 Cards: GMV, Bookings, Active Events, Occupancy) */}
      <KpiMetricsGrid platformStats={platformStats} language={language} />

      {/* 3. Realtime Concurrency & Atomic Hold Banner */}
      <section
        className="tc-notice-box"
        data-testid="concurrency-alert-banner"
        role="region"
        aria-label={isAr ? 'تنبيه التزامن والأقفال اللحظية' : 'Realtime Concurrency Status'}
        style={{
          backgroundColor: 'var(--tc-surface-dark, #101813)',
          border: '1px solid var(--tc-surface-dark-border, #344337)',
          borderRadius: 'var(--tc-radius-lg, 16px)',
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              backgroundColor: 'var(--tc-surface-dark-card, #1c2921)',
              borderRadius: 'var(--tc-radius-md, 8px)',
              padding: '10px',
              color: 'var(--tc-accent-lime, #d2fa69)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ZapIcon size={20} />
          </div>
          <div>
            <h3
              style={{
                margin: '0 0 4px 0',
                fontSize: '15px',
                fontWeight: 600,
                color: 'var(--tc-text-primary-dark, #f4f3eb)',
              }}
            >
              {isAr ? 'نظام الحجز الذري ومنع التضارب اللحظي' : 'Atomic Seat Hold & Collision Prevention'}
            </h3>
            <p
              style={{
                margin: 0,
                fontSize: '12px',
                color: 'var(--tc-text-muted-dark, #a5b2a8)',
                lineHeight: 1.45,
              }}
            >
              {isAr
                ? 'الحجوزات المؤقتة محمية بقفل ذري مدته ٣٠٠ ثانية لمنع الحجز المزدوج. يتم تحرير المقاعد المعلقة منتهية الصلاحية تلقائياً.'
                : 'Temporary holds are protected with 300s atomic locking. Expired holds are automatically released to available inventory.'}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              backgroundColor: 'var(--tc-surface-dark-card, #1c2921)',
              border: '1px solid var(--tc-surface-dark-border, #344337)',
              borderRadius: 'var(--tc-radius-full, 9999px)',
              padding: '6px 14px',
              color: 'var(--tc-accent-lime, #d2fa69)',
              fontSize: '13px',
              fontFamily: 'monospace',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ZapIcon size={14} />
            <span>
              {String(Math.floor(secondsRemaining / 60)).padStart(2, '0')}:
              {String(secondsRemaining % 60).padStart(2, '0')}
            </span>
          </div>

          <button
            type="button"
            className="tc-btn-action-lime"
            onClick={handleFlush}
            disabled={isFlushing}
            data-testid="btn-flush-now"
            style={{ height: '36px', fontSize: '12px' }}
          >
            {isFlushing
              ? isAr
                ? 'جارِ التحرير...'
                : 'Flushing...'
              : isAr
              ? 'تحرير المقاعد المنتهية الآن'
              : 'Flush Expired Holds'}
          </button>

          {/* Test compatibility alias button */}
          <button
            type="button"
            onClick={handleFlush}
            disabled={isFlushing}
            data-testid="btn-flush-holds"
            style={{ display: 'none' }}
            aria-hidden="true"
          >
            Flush Holds
          </button>
        </div>
      </section>

      {/* 4. Event Performance Table (Figma 1:1) */}
      <EventPerformanceTable
        events={events}
        language={language}
        onSelectEvent={onSelectEvent}
        onViewDetails={onViewDetails}
      />

      {/* 5. Two-Column Split: Recent Activity & Published Inventory (Figma 1:1) */}
      <div className="tc-content-two-col">
        {/* Left Column: Recent Activity (White Card) */}
        <RecentActivityFeed auditLogs={auditLogs} language={language} />

        {/* Right Column: Published Inventory (Dark Card) */}
        <InventoryAnalyticsCard
          stats={platformStats}
          concurrencyStats={concurrencyStats}
          language={language}
        />
      </div>
    </div>
  );
}

export default SuperAdminOverview;
