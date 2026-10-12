import { useState, useMemo } from 'react';
import { useLanguage } from '../../../context';
import {
  SearchIcon,
  XIcon,
  RefreshCwIcon,
  FileTextIcon,
} from '../../../components/common/Icons';

const ACTION_LABELS = {
  ROLE_UPDATE: { en: 'Role Update', ar: 'تعديل صلاحية', color: 'badge-role' },
  GATE_STAFF_CREATED: { en: 'Gate Staff Created', ar: 'إنشاء طاقم بوابة', color: 'badge-staff' },
  EVENT_CREATED: { en: 'Event Created', ar: 'إنشاء فعالية', color: 'badge-create' },
  EVENT_UPDATED: { en: 'Event Updated', ar: 'تحديث فعالية', color: 'badge-update' },
  EVENT_DELETED: { en: 'Event Deleted', ar: 'حذف فعالية', color: 'badge-delete' },
  HOLDS_FLUSHED: { en: 'Holds Flushed', ar: 'تحرير حجز معلق', color: 'badge-flush' },
  CLEAN_STATE_RESET: { en: 'Clean State Reset', ar: 'تصفير شامل للنظام', color: 'badge-reset' },
  USER_STATUS_TOGGLED: { en: 'Status Toggled', ar: 'تعديل حالة مستخدم', color: 'badge-toggle' },
};

/**
 * AdminAuditLogTab Component
 * Renders immutable audit trial of critical administrative actions.
 * Pure SVG icons and zero emojis.
 */
export function AdminAuditLogTab({ logs = [], onRefresh }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (log.actorEmail && log.actorEmail.toLowerCase().includes(term)) ||
        (log.target && String(log.target).toLowerCase().includes(term)) ||
        (log.action && log.action.toLowerCase().includes(term)) ||
        (log.details && JSON.stringify(log.details).toLowerCase().includes(term));

      const matchAction = actionFilter === 'ALL' || log.action === actionFilter;
      return matchSearch && matchAction;
    });
  }, [logs, searchTerm, actionFilter]);

  const formatTimestamp = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const date = new Date(isoString);
      return date.toLocaleString(isAr ? 'ar-EG' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return isoString;
    }
  };

  const renderDetails = (details) => {
    if (!details) return '-';
    if (typeof details === 'string') return details;
    const entries = Object.entries(details);
    if (entries.length === 0) return '-';

    return (
      <div className="audit-details-chip-list">
        {entries.map(([key, val]) => (
          <span key={key} className="audit-detail-pill">
            <strong className="detail-key">{key}:</strong>{' '}
            <span className="detail-val">
              {typeof val === 'object' ? JSON.stringify(val) : String(val)}
            </span>
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="admin-audit-log-tab" data-testid="admin-audit-log-tab">
      {/* Top Controls Bar */}
      <div className="table-controls-bar audit-controls-bar">
        <div className="search-box-wrapper">
          <span className="search-icon">
            <SearchIcon size={16} />
          </span>
          <input
            type="text"
            className="admin-input search-input"
            placeholder={
              isAr
                ? 'ابحث بالبريد، الإجراء، الهدف، أو التفاصيل...'
                : 'Search audit logs by actor, action, target, or metadata...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="audit-search-input"
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

        <div className="filter-actions-group">
          <select
            className="admin-select filter-select"
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            data-testid="audit-action-filter"
          >
            <option value="ALL">{isAr ? 'جميع الإجراءات' : 'All Action Types'}</option>
            {Object.keys(ACTION_LABELS).map((actionKey) => (
              <option key={actionKey} value={actionKey}>
                {isAr ? ACTION_LABELS[actionKey].ar : ACTION_LABELS[actionKey].en} ({actionKey})
              </option>
            ))}
          </select>

          {onRefresh && (
            <button
              type="button"
              className="admin-btn btn-secondary btn-refresh-audit"
              onClick={onRefresh}
              data-testid="btn-refresh-audit"
            >
              <RefreshCwIcon size={16} />
              <span>{isAr ? 'تحديث السجل' : 'Refresh Log'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="table-responsive">
        <table className="admin-table audit-table" data-testid="audit-table">
          <thead>
            <tr>
              <th>{isAr ? 'التوقيت' : 'Timestamp'}</th>
              <th>{isAr ? 'الإجراء' : 'Action'}</th>
              <th>{isAr ? 'المنفّذ (Actor)' : 'Actor Email'}</th>
              <th>{isAr ? 'الهدف (Target)' : 'Target'}</th>
              <th>{isAr ? 'البيانات والتفاصيل' : 'Metadata Details'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan="5" className="empty-table-cell">
                  <div className="empty-placeholder">
                    <span className="empty-icon">
                      <FileTextIcon size={36} />
                    </span>
                    <p className="empty-text">
                      {isAr
                        ? 'لا توجد سجلات تدقيق مطابقة'
                        : 'No audit log entries found matching criteria'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const labelInfo = ACTION_LABELS[log.action] || {
                  en: log.action,
                  ar: log.action,
                  color: 'badge-default',
                };
                return (
                  <tr key={log.id} data-testid={`audit-row-${log.id}`}>
                    <td className="timestamp-cell">
                      <span className="timestamp-text">{formatTimestamp(log.timestamp)}</span>
                    </td>
                    <td>
                      <span className={`audit-badge ${labelInfo.color}`}>
                        {isAr ? labelInfo.ar : labelInfo.en}
                      </span>
                    </td>
                    <td className="actor-email-cell">
                      <code>{log.actorEmail}</code>
                    </td>
                    <td className="target-cell">
                      <span className="target-text">{log.target || '-'}</span>
                    </td>
                    <td className="details-cell">{renderDetails(log.details)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AdminAuditLogTab;
