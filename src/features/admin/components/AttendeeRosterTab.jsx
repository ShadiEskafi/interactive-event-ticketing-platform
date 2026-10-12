import { useState, useMemo } from 'react';
import { useLanguage } from '../../../context';
import {
  SearchIcon,
  XIcon,
  DownloadIcon,
  UsersIcon,
} from '../../../components/common/Icons';

/**
 * AttendeeRosterTab Component
 * Detailed attendee and ticket registry:
 * - Search by name, email, ticket code, or seat
 * - Filter by scan status (All / Scanned / Pending)
 * - UTF-8 BOM CSV export action button with SVG Download icon
 * - Status badges (Scanned with timestamp / Pending)
 * Zero emoji dependency.
 */
export function AttendeeRosterTab({
  attendees = [],
  selectedEventId,
  onExportCSV,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'scanned' | 'pending'

  // Summary counts
  const totalCount = attendees.length;
  const scannedCount = attendees.filter((a) => a.is_used).length;
  const pendingCount = totalCount - scannedCount;

  const filteredAttendees = useMemo(() => {
    return attendees.filter((a) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        !searchTerm ||
        (a.attendee_name && a.attendee_name.toLowerCase().includes(term)) ||
        (a.email && a.email.toLowerCase().includes(term)) ||
        (a.ticket_code && a.ticket_code.toLowerCase().includes(term)) ||
        (a.seat && a.seat.toLowerCase().includes(term));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'scanned' && a.is_used) ||
        (statusFilter === 'pending' && !a.is_used);

      return matchSearch && matchStatus;
    });
  }, [attendees, searchTerm, statusFilter]);

  return (
    <div className="attendee-roster-tab" data-testid="attendee-roster-tab">
      {/* Metrics Bar */}
      <div className="roster-metrics-bar">
        <div className="metric-chip chip-total">
          <span className="chip-label">{isAr ? 'إجمالي الحضور:' : 'Total Registered:'}</span>
          <span className="chip-val">{totalCount}</span>
        </div>
        <div className="metric-chip chip-scanned">
          <span className="chip-label">{isAr ? 'تم الدخول (مسح):' : 'Checked In:'}</span>
          <span className="chip-val">{scannedCount}</span>
        </div>
        <div className="metric-chip chip-pending">
          <span className="chip-label">{isAr ? 'بانتظار الوصول:' : 'Pending:'}</span>
          <span className="chip-val">{pendingCount}</span>
        </div>
      </div>

      {/* Controls Bar */}
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
                ? 'ابحث بالاسم، البريد، الرمز، أو رقم المقعد...'
                : 'Search by name, email, code, or seat...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="roster-search-input"
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
          {/* Status filter */}
          <select
            className="admin-select filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="roster-status-filter"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="scanned">{isAr ? 'تم التحقق بالبوابة (Scanned)' : 'Scanned / Checked In'}</option>
            <option value="pending">{isAr ? 'في الانتظار (Pending)' : 'Pending'}</option>
          </select>

          {/* Export CSV Button */}
          <button
            type="button"
            className="admin-btn btn-export-csv"
            onClick={() => onExportCSV?.(selectedEventId)}
            data-testid="btn-export-csv"
            title={
              isAr
                ? 'تصدير كشف الحضور بصيغة CSV مشفر بـ UTF-8 لبرامج Excel'
                : 'Export attendee roster as UTF-8 CSV'
            }
          >
            <span className="btn-icon">
              <DownloadIcon size={16} />
            </span>
            <span>{isAr ? 'تصدير كشف الحضور (CSV)' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* Attendees Table */}
      <div className="table-responsive">
        <table className="admin-table roster-table">
          <thead>
            <tr>
              <th>{isAr ? 'رمز التذكرة' : 'Ticket Code'}</th>
              <th>{isAr ? 'اسم الزائر والبريد' : 'Attendee & Email'}</th>
              <th>{isAr ? 'المقعد' : 'Seat'}</th>
              <th>{isAr ? 'الفئة' : 'Tier'}</th>
              <th>{isAr ? 'السعر' : 'Price'}</th>
              <th>{isAr ? 'حالة الدخول' : 'Gate Check-in'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredAttendees.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table-cell">
                  <div className="empty-placeholder">
                    <span className="empty-icon">
                      <UsersIcon size={36} />
                    </span>
                    <p className="empty-text">
                      {isAr
                        ? 'لا توجد سجلات حضور مطابقة لمعايير البحث'
                        : 'No attendees match your search filters'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredAttendees.map((att) => (
                <tr key={att.ticket_code || att.id} data-testid={`roster-row-${att.ticket_code}`}>
                  {/* Ticket Code */}
                  <td>
                    <code className="ticket-code-tag">{att.ticket_code}</code>
                  </td>

                  {/* Name & Email */}
                  <td className="attendee-details-cell">
                    <div className="attendee-name">{att.attendee_name}</div>
                    <div className="attendee-email">{att.email}</div>
                  </td>

                  {/* Seat */}
                  <td>
                    <span className="seat-chip">{att.seat}</span>
                  </td>

                  {/* Tier */}
                  <td>
                    <span
                      className={`tier-badge ${
                        att.tier?.toLowerCase().includes('vip')
                          ? 'tier-vip'
                          : att.tier?.toLowerCase().includes('balcony')
                          ? 'tier-balcony'
                          : 'tier-regular'
                      }`}
                    >
                      {att.tier}
                    </span>
                  </td>

                  {/* Price */}
                  <td className="price-cell">${att.price}</td>

                  {/* Gate Status Badge */}
                  <td>
                    {att.is_used ? (
                      <div className="gate-status-badge badge-scanned" data-testid="status-scanned">
                        <span className="badge-indicator" />
                        <div className="status-texts">
                          <span className="status-title">{isAr ? 'تم الدخول' : 'Scanned'}</span>
                          {att.scanned_at && (
                            <span className="status-timestamp">
                              {new Date(att.scanned_at).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="gate-status-badge badge-pending" data-testid="status-pending">
                        <span className="badge-indicator" />
                        <span className="status-title">{isAr ? 'في الانتظار' : 'Pending'}</span>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AttendeeRosterTab;
