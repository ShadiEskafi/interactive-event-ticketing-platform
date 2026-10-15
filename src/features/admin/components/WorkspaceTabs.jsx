import {
  BarChart3Icon,
  CalendarIcon,
  UsersIcon,
  ShieldIcon,
  ZapIcon,
  FileTextIcon,
} from '../../../components/common/Icons';

/**
 * WorkspaceTabs Component - Admin Dashboard Tabs Navigation Bar
 * Follows Figma Node 125:85 / 145:27548 (EN) & 145:27643 (AR)
 * Displays 6 primary workspace tabs with clean active underline indicator.
 */
export function WorkspaceTabs({
  activeTab = 'overview',
  onSelectTab,
  language = 'en',
  activeRole = 'super_admin',
}) {
  const isAr = language === 'ar';
  const isOrganizer = activeRole === 'organizer';

  const allTabs = [
    {
      key: 'overview',
      labelEn: isOrganizer ? 'Organizer overview' : 'Platform overview',
      labelAr: isOrganizer ? 'نظرة المنظم' : 'النظرة العامة',
      Icon: BarChart3Icon,
    },
    {
      key: 'events',
      labelEn: isOrganizer ? 'My events' : 'Events governance',
      labelAr: isOrganizer ? 'فعالياتي' : 'حوكمة الفعاليات',
      Icon: CalendarIcon,
    },
    {
      key: 'attendees',
      labelEn: 'Attendee registry',
      labelAr: 'سجل الحضور',
      Icon: UsersIcon,
    },
    {
      key: 'users',
      labelEn: isOrganizer ? 'Gate staff' : 'Users & roles',
      labelAr: isOrganizer ? 'طاقم البوابات' : 'المستخدمون والصلاحيات',
      Icon: ShieldIcon,
    },
    {
      key: 'concurrency',
      labelEn: 'System & concurrency',
      labelAr: 'الصحة والتزامن',
      Icon: ZapIcon,
      superAdminOnly: true,
    },
    {
      key: 'audit_logs',
      labelEn: 'Audit logs',
      labelAr: 'سجل التدقيق',
      Icon: FileTextIcon,
      superAdminOnly: true,
    },
  ];

  const tabs = allTabs.filter(
    (tab) => !tab.superAdminOnly || activeRole === 'super_admin'
  );

  return (
    <div
      className="tc-workspace-tabs-bar"
      role="tablist"
      aria-label={isAr ? 'تبويبات مساحة العمل' : 'Workspace navigation tabs'}
    >
      {tabs.map((tab) => {
        const isActive =
          activeTab === tab.key ||
          (tab.key === 'concurrency' && activeTab === 'system_health');
        const TabIcon = tab.Icon;

        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tc-tab-btn ${isActive ? 'active' : ''}`}
            onClick={() => onSelectTab?.(tab.key)}
            data-testid={`tab-${tab.key}`}
          >
            <TabIcon size={16} />
            <span>{isAr ? tab.labelAr : tab.labelEn}</span>
          </button>
        );
      })}
    </div>
  );
}

export default WorkspaceTabs;
