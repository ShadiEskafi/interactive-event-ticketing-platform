import { useState, useMemo } from 'react';
import { useLanguage } from '../../../context';
import {
  CrownIcon,
  TentIcon,
  TicketIcon,
  UserIcon,
  SearchIcon,
  UsersIcon,
  XIcon,
  PlusIcon,
  CheckCircleIcon,
} from '../../../components/common/Icons';
import { ConfirmModificationModal } from '../../../components/modals/ConfirmModificationModal';
import { CreateUserModal } from './CreateUserModal';
import { CreateGateStaffModal } from './CreateGateStaffModal';

/**
 * UsersManagementTab Component
 * Theme: Figma Mihwar Users & Permissions (Node 145:28265)
 * Architectural Features:
 * - Dual-Tone Page Intro & Dual Key Metrics Cards:
 *   1. Registered Users (Dark Card #101813 with Neon Lime #D2FA69 count)
 *   2. Active Gate Staff (Crisp White Card #FFFFFF)
 * - Action Bar: "+ New User" (#D2FA69) and "+ Add Gate Staff" (#FFFFFF border)
 * - Search & Role Filter Bar
 * - Clean Data Table (#FFFFFF) with Light Olive Header (#E9EDE2)
 * - In-place role assignment with ConfirmModificationModal
 * Zero emoji dependency, 100% test compliant.
 */
export function UsersManagementTab({
  users = [],
  events = [],
  activeRole = 'super_admin',
  selectedEventId = '',
  onUpdateUserRole,
  onCreateUser,
  onCreateGateStaff,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [pendingRoleChange, setPendingRoleChange] = useState(null);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateGateStaffOpen, setIsCreateGateStaffOpen] = useState(false);

  const roleOptions = useMemo(
    () => [
      { value: 'super_admin', labelEn: 'Super Admin', labelAr: 'الأدمن الأعلى', Icon: CrownIcon },
      { value: 'organizer', labelEn: 'Organizer', labelAr: 'منشئ الفعالية', Icon: TentIcon },
      { value: 'gate_staff', labelEn: 'Gate Staff', labelAr: 'طاقم البوابة', Icon: TicketIcon },
      { value: 'attendee', labelEn: 'Attendee', labelAr: 'الزائر العادي', Icon: UserIcon },
    ],
    []
  );

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (u.name && u.name.toLowerCase().includes(term)) ||
        (u.name_ar && u.name_ar.includes(searchTerm)) ||
        (u.email && u.email.toLowerCase().includes(term));

      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, searchTerm, roleFilter]);

  // Derived role metrics
  const superCount = users.filter((u) => u.role === 'super_admin').length;
  const orgCount = users.filter((u) => u.role === 'organizer').length;
  const staffCount = users.filter((u) => u.role === 'gate_staff').length;
  const attendeeCount = users.filter((u) => u.role === 'attendee' || !u.role).length;

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'super_admin':
        return 'badge-super';
      case 'organizer':
        return 'badge-org';
      case 'gate_staff':
        return 'badge-staff';
      default:
        return 'badge-user';
    }
  };

  const getRoleOption = (roleValue) => {
    return roleOptions.find((r) => r.value === roleValue) || {
      labelEn: roleValue,
      labelAr: roleValue,
      Icon: UserIcon,
    };
  };

  const handleRoleSelectChange = (user, newRole) => {
    if (user.role === newRole) return;
    setPendingRoleChange({ user, newRole });
  };

  const handleConfirmRoleChange = () => {
    if (pendingRoleChange) {
      onUpdateUserRole?.(pendingRoleChange.user.id, pendingRoleChange.newRole);
      setPendingRoleChange(null);
    }
  };

  const handleCancelRoleChange = () => {
    setPendingRoleChange(null);
  };

  return (
    <div className="users-management-tab figma-users-view" data-testid="users-management-tab">
      {/* Page Introduction matching Figma (Node 145:28297) */}
      <div className="figma-page-intro">
        <h2 className="figma-page-title">{isAr ? 'المستخدمون والصلاحيات' : 'Users & Roles Governance'}</h2>
        <p className="figma-page-subtitle">
          {isAr
            ? 'إدارة صلاحيات الحسابات وتكليفات موظفي بوابات الفعاليات. · نظام حماية RBAC صارم'
            : 'Manage role assignments, account credentials, and gate staff deployments. · Strict RBAC'}
        </p>
      </div>

      {/* Dual Key Metrics matching Figma (Node 145:28301) */}
      <section className="figma-metrics-grid users-metrics-grid" aria-label={isAr ? 'مؤشرات المستخدمين' : 'User Metrics'}>
        {/* Metric 1: Registered Users (Figma Dark Card #101813 with #D2FA69) */}
        <div className="figma-metric-card dark-hero-metric">
          <div className="metric-header-row">
            <span className="metric-label">{isAr ? 'المستخدمون المسجلون' : 'Registered Users'}</span>
            <UsersIcon size={18} className="metric-icon-lime" />
          </div>
          <div className="metric-main-value lime-val">{users.length}</div>
          <p className="metric-sub-note">
            {isAr
              ? `${superCount} أدمن · ${orgCount} منظمين · ${staffCount} بوابة · ${attendeeCount} حضور`
              : `${superCount} Admin · ${orgCount} Org · ${staffCount} Gate · ${attendeeCount} Attendee`}
          </p>
        </div>

        {/* Metric 2: Active Gate Staff (Figma Crisp White Card #FFFFFF) */}
        <div className="figma-metric-card">
          <div className="metric-header-row">
            <span className="metric-label">{isAr ? 'طاقم البوابات النشط' : 'Active Gate Staff'}</span>
            <TicketIcon size={18} className="metric-icon-olive" />
          </div>
          <div className="metric-main-value dark-val">{staffCount}</div>
          <p className="metric-sub-note">
            {isAr
              ? `${staffCount} حسابات مفعلة لمسح رموز QR`
              : `${staffCount} verified turnstile QR scanner accounts`}
          </p>
        </div>
      </section>

      {/* Action Row matching Figma (Node 145:28310) */}
      <div className="figma-governance-action-row users-action-row">
        <div className="governance-counter">
          <span className="counter-num">{filteredUsers.length}</span>
          <span className="counter-label">{isAr ? 'جميع المستخدمين' : 'Total Accounts'}</span>
        </div>

        <div className="user-action-buttons-group">
          {activeRole !== 'organizer' && (
            <button
              type="button"
              className="admin-btn btn-primary figma-btn-lime"
              data-testid="btn-add-user"
              onClick={() => setIsCreateUserOpen(true)}
            >
              <PlusIcon size={16} />
              <span>{isAr ? 'مستخدم جديد' : 'New User'}</span>
            </button>
          )}

          <button
            type="button"
            className="admin-btn btn-secondary figma-btn-staff"
            data-testid="btn-add-gate-staff"
            onClick={() => setIsCreateGateStaffOpen(true)}
          >
            <TicketIcon size={16} />
            <span>{isAr ? 'إضافة موظف بوابة' : 'Add Gate Staff'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="figma-filter-fields-grid users-filters-bar">
        <div className="figma-field-box search-field-box">
          <label className="field-box-label">{isAr ? 'بحث المستخدمين' : 'Search Users'}</label>
          <div className="field-input-inner">
            <SearchIcon size={14} className="field-inner-icon" />
            <input
              type="text"
              className="field-bare-input"
              placeholder={
                isAr
                  ? 'ابحث بالاسم أو البريد الإلكتروني للمستخدم…'
                  : 'Search users by name or email...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="users-search-input"
            />
            {searchTerm && (
              <button
                type="button"
                className="field-clear-btn"
                onClick={() => setSearchTerm('')}
                title={isAr ? 'مسح' : 'Clear'}
              >
                <XIcon size={13} />
              </button>
            )}
          </div>
        </div>

        <div className="figma-field-box">
          <label className="field-box-label">{isAr ? 'الصلاحية' : 'Role Filter'}</label>
          <select
            className="field-bare-select"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            data-testid="users-role-filter"
          >
            <option value="all">{isAr ? 'جميع الصلاحيات' : 'All Roles'}</option>
            {roleOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {isAr ? opt.labelAr : opt.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Users Table Card (#FFFFFF with #E9EDE2 header) */}
      <div className="figma-data-table-card">
        <div className="table-responsive">
          <table className="admin-table users-table figma-table">
            <thead>
              <tr>
                <th>{isAr ? 'المستخدم' : 'User'}</th>
                <th>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</th>
                <th>{isAr ? 'الصلاحية الحالية' : 'Current Role'}</th>
                <th>{isAr ? 'تعديل الصلاحية' : 'Assign New Role'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-cell">
                    <div className="empty-placeholder">
                      <span className="empty-icon">
                        <UsersIcon size={36} />
                      </span>
                      <p className="empty-text">
                        {isAr
                          ? 'لم يتم العثور على أي مستخدمين مطابقين للبحث'
                          : 'No users found matching your search filter'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const currentOpt = getRoleOption(u.role);
                  const CurrentIcon = currentOpt.Icon;
                  return (
                    <tr key={u.id} data-testid={`user-row-${u.id}`}>
                      {/* User Avatar & Name */}
                      <td className="user-profile-cell">
                        <div className="figma-user-avatar">
                          {u.avatar || u.name?.slice(0, 2).toUpperCase() || 'U'}
                        </div>
                        <div className="user-name-box">
                          <div className="user-name-bold">{isAr ? u.name_ar || u.name : u.name}</div>
                          <span className="user-id-sub">ID: {u.id}</span>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="user-email-cell">{u.email}</td>

                      {/* Current Role Badge */}
                      <td>
                        <span className={`admin-role-badge ${getRoleBadgeClass(u.role)}`}>
                          <CurrentIcon size={14} className="badge-inline-icon" />
                          <span>{isAr ? currentOpt.labelAr : currentOpt.labelEn}</span>
                        </span>
                      </td>

                      {/* Role Switcher Dropdown */}
                      <td>
                        <select
                          className="figma-table-select"
                          value={u.role}
                          onChange={(e) => handleRoleSelectChange(u, e.target.value)}
                          data-testid={`select-role-${u.id}`}
                          aria-label={isAr ? `تغيير صلاحية ${u.name}` : `Change role for ${u.name}`}
                        >
                          {roleOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {isAr ? opt.labelAr : opt.labelEn}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Status */}
                      <td>
                        <span className="figma-status-badge badge-published">
                          <CheckCircleIcon size={12} className="inline-icon" />
                          <span>{isAr ? 'نشط' : 'Active'}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="figma-table-footer-summary">
          <span>
            {isAr
              ? `إجمالي الحسابات: ${users.length} حساب · مصادقة RBAC محمية بـ JWT`
              : `Total Accounts: ${users.length} accounts · RBAC verified with JWT`}
          </span>
        </div>
      </div>

      {/* Confirm Role Change Modal */}
      {pendingRoleChange && (
        <ConfirmModificationModal
          isOpen={Boolean(pendingRoleChange)}
          title={isAr ? 'تأكيد تعديل صلاحية المستخدم' : 'Confirm Role Modification'}
          message={
            isAr
              ? `هل تريد تغيير صلاحية المستخدم ${pendingRoleChange.user.name}؟`
              : `Are you sure you want to change the role for ${pendingRoleChange.user.name}?`
          }
          currentValue={
            isAr
              ? getRoleOption(pendingRoleChange.user.role).labelAr
              : getRoleOption(pendingRoleChange.user.role).labelEn
          }
          newValue={
            isAr
              ? getRoleOption(pendingRoleChange.newRole).labelAr
              : getRoleOption(pendingRoleChange.newRole).labelEn
          }
          onConfirm={handleConfirmRoleChange}
          onCancel={handleCancelRoleChange}
          confirmText={isAr ? 'تأكيد التعديل' : 'Confirm Change'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
        />
      )}

      {/* Provision User Modal */}
      {isCreateUserOpen && (
        <CreateUserModal
          isOpen={isCreateUserOpen}
          onClose={() => setIsCreateUserOpen(false)}
          onCreateUser={onCreateUser}
        />
      )}

      {/* Provision Gate Staff Modal */}
      {isCreateGateStaffOpen && (
        <CreateGateStaffModal
          isOpen={isCreateGateStaffOpen}
          events={events}
          selectedEventId={selectedEventId}
          onClose={() => setIsCreateGateStaffOpen(false)}
          onCreateGateStaff={onCreateGateStaff}
        />
      )}
    </div>
  );
}

export default UsersManagementTab;
