/**
 * DashboardFooter Component - Admin Dashboard Bottom Footer
 * Follows Figma Node 125:85 / 145:27548 (EN) & 145:27643 (AR)
 * Displays copyright notice, illustrative data disclaimers, and platform status.
 */
export function DashboardFooter({ language = 'en' }) {
  const isAr = language === 'ar';

  return (
    <footer className="tc-workspace-footer" data-testid="dashboard-footer" role="contentinfo">
      <div className="tc-footer-copyright">
        {isAr
          ? 'تيكت كرافت © 2026 · بيانات توضيحية · تصميم ثابت · لا توجد خدمات متصلة'
          : 'TicketCraft © 2026 · Illustrative data · Static design · No connected services'}
      </div>
      <div className="tc-footer-status">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: '#315f3d',
              display: 'inline-block',
            }}
            aria-hidden="true"
          />
          {isAr ? 'حالة النظام: تشغيلي' : 'System: Operational'}
        </span>
      </div>
    </footer>
  );
}

export default DashboardFooter;
