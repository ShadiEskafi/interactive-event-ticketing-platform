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
} from '../../../components/common/Icons';
import { ConfirmModificationModal } from '../../../components/modals/ConfirmModificationModal';
import { CreateUserModal } from './CreateUserModal';
import { CreateGateStaffModal } from './CreateGateStaffModal';

/**
 * UsersManagementTab Component
 * RBAC governance directory for platform users:
 * - Displays user profile, email, registered role, and status.
 * - In-place role modification selector with ConfirmModificationModal review diff dialog.
 * - Actions to provision users (+ Add User) and gate staff (+ Add Gate Staff).
 * - Pure SVG icons, zero emoji dependency.
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
    <div className="users-management-tab" data-testid="users-management-tab">
      {/* Search & Filter Controls */}
      <div className="table-controls-bar">
        <div className="search-box-wrapper">
          <span className="search-icon">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            className="admin-input search-input"
            placeholder={
              isAr
                ? 'ابحث بالاسم أو البريد الإلكتروني للمستخدم...'
                : 'Search users by name or email...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="users-search-input"
          />
          {searchTerm && (
            <button
              type="button"
              className="clear-search-btn"
              onClick={() => setSearchTerm('')}
              title={isAr ? 'مسح' : 'Clear'}
            >
              <XIcon size={14} />
            </button>
          )}
        </div>

        <div className="filter-actions-group" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <select
            className="admin-select filter-select"
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

          {/* Provisioning Action Buttons */}
          <div className="user-management-btn-group" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {activeRole !== 'organizer' && (
              <button
                type="button"
                className="admin-btn btn-primary"
                data-testid="btn-add-user"
                onClick={() => setIsCreateUserOpen(true)}
              >
                <PlusIcon size={14} />
                <span>{isAr ? '+ إضافة مستخدم' : '+ Add User'}</span>
              </button>
            )}
            <button
              type="button"
              className="admin-btn btn-secondary"
              data-testid="btn-add-gate-staff"
              onClick={() => setIsCreateGateStaffOpen(true)}
            >
              <TicketIcon size={14} />
              <span>{isAr ? '+ إضافة طاقم بوابة' : '+ Add Gate Staff'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="table-responsive">
        <table className="admin-table users-table">
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
                      <div className="user-avatar-circle">
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
                        className="admin-select select-inline-role"
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
                      <span
                        className={`status-pill ${
                          u.status === 'suspended' ? 'pill-draft' : 'pill-published'
                        }`}
                      >
                        {u.status === 'suspended'
                          ? isAr
                            ? 'موقوف'
                            : 'Suspended'
                          : isAr
                          ? 'نشط'
                          : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Role Modification Confirmation Modal */}
      {pendingRoleChange && (
        <ConfirmModificationModal
          isOpen={Boolean(pendingRoleChange)}
          title={isAr ? 'تأكيد تغيير الصلاحية' : 'Confirm Role Modification'}
          description={
            isAr
              ? `سيتم تحديث صلاحيات الحساب للمستخدم "${pendingRoleChange.user.name}". يرجى مراجعة الصلاحية الجديدة:`
              : `You are about to change the permissions for "${pendingRoleChange.user.name}". Please review:`
          }
          changes={[
            {
              label: isAr ? 'مستوى الصلاحية' : 'Role Level',
              oldValue: isAr
                ? getRoleOption(pendingRoleChange.user.role).labelAr
                : getRoleOption(pendingRoleChange.user.role).labelEn,
              newValue: isAr
                ? getRoleOption(pendingRoleChange.newRole).labelAr
                : getRoleOption(pendingRoleChange.newRole).labelEn,
            },
          ]}
          onConfirm={handleConfirmRoleChange}
          onCancel={handleCancelRoleChange}
          confirmText={isAr ? 'تأكيد التعديل' : 'Update Role'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
        />
      )}

      {/* Provision User Modal */}
      <CreateUserModal
        isOpen={isCreateUserOpen}
        onClose={() => setIsCreateUserOpen(false)}
        onSubmit={(userData) => {
          onCreateUser?.(userData);
          setIsCreateUserOpen(false);
        }}
      />

      {/* Provision Gate Staff Modal */}
      <CreateGateStaffModal
        isOpen={isCreateGateStaffOpen}
        onClose={() => setIsCreateGateStaffOpen(false)}
        events={events}
        initialEventId={selectedEventId}
        onSubmit={(staffData) => {
          onCreateGateStaff?.(staffData);
          setIsCreateGateStaffOpen(false);
        }}
      />
    </div>
  );
}

export default UsersManagementTab;
