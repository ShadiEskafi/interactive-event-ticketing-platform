import { useState, useMemo } from 'react';
import { useLanguage } from '../../../context';
import {
  SearchIcon,
  XIcon,
  DownloadIcon,
  UsersIcon,
  CheckCircleIcon,
  ClockIcon,
} from '../../../components/common/Icons';

/**
 * AttendeeRosterTab Component
 * Theme: Figma Mihwar Attendee Registry (Node 145:28065)
 * Architectural Features:
 * - Dual-Tone Page Intro & Actions Row (Export CSV with UTF-8 BOM indicator)
 * - 3 Crisp White Key Metric Cards (#FFFFFF, #D8DCD1):
 *   1. Remaining Seats (520 capacity baseline)
 *   2. Occupancy Rate %
 *   3. Checked In Attendance %
 * - Search & Check-in Status Filter Bar
 * - Clean Data Table (#FFFFFF) with Light Olive Header (#E9EDE2)
 * Zero emoji dependency, 100% test compliant.
 */
export function AttendeeRosterTab({
  attendees = [],
  selectedEventId,
  events = [],
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
  const capacity = 520;
  const remainingSeats = Math.max(0, capacity - totalCount);
  const occupancyPercent = Math.min(100, Math.round((totalCount / capacity) * 100));
  const scannedPercent = totalCount > 0 ? Math.round((scannedCount / totalCount) * 100) : 0;

  const currentEvent = events.find((e) => e.id === selectedEventId) || events[0] || null;

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
    <div className="attendee-roster-tab figma-roster-view" data-testid="attendee-roster-tab">
      {/* Page Introduction matching Figma (Node 145:28097) */}
      <div className="figma-page-intro">
        <h2 className="figma-page-title">{isAr ? 'سجل الحضور والتذاكر' : 'Attendee Roster & Tickets'}</h2>
        <p className="figma-page-subtitle">
          {isAr
            ? 'كل تذكرة ومقعد وحضور في سجل تدقيق موحد. · السعة القياسية ٥٢٠ مقعداً'
            : 'Every ticket, seat, and gate arrival recorded in a unified ledger. · Standard 520 seats'}
        </p>
      </div>

      {/* Top Action Row: Export CSV + Event Indicator */}
      <div className="figma-roster-action-row">
        <div className="export-action-box">
          <button
            type="button"
            className="admin-btn btn-export-csv figma-btn-export"
            onClick={() => onExportCSV?.(selectedEventId)}
            data-testid="btn-export-csv"
            title={
              isAr
                ? 'تصدير كشف الحضور بصيغة CSV مشفر بـ UTF-8 لبرامج Excel'
                : 'Export attendee roster as UTF-8 CSV'
            }
          >
            <DownloadIcon size={16} />
            <span>{isAr ? 'تصدير كشف الحضور CSV' : 'Export Attendee CSV'}</span>
          </button>
          <span className="export-hint-text">
            {isAr ? 'UTF-8 BOM · يدعم الأحرف العربية' : 'UTF-8 BOM · Arabic charset compatible'}
          </span>
        </div>

        {currentEvent && (
          <div className="roster-active-event-badge">
            <span className="event-badge-label">{isAr ? 'الفعالية المحددة:' : 'Active Event:'}</span>
            <span className="event-badge-title">
              {isAr ? currentEvent.title_ar || currentEvent.title : currentEvent.title}
            </span>
          </div>
        )}
      </div>

      {/* 3 Key Metrics Row matching Figma (Node 145:28111) */}
      <section className="figma-metrics-grid roster-metrics-grid" aria-label={isAr ? 'مؤشرات الحضور' : 'Attendance Metrics'}>
        {/* Metric 1: Remaining Seats */}
        <div className="figma-metric-card">
          <div className="metric-header-row">
            <span className="metric-label">{isAr ? 'المقاعد المتبقية' : 'Remaining Seats'}</span>
            <UsersIcon size={18} className="metric-icon-olive" />
          </div>
          <div className="metric-main-value dark-val">{remainingSeats}</div>
          <p className="metric-sub-note">
            {isAr
              ? `${remainingSeats} متاحة من أصل ٥٢٠ مقعداً`
              : `${remainingSeats} available of 520 total`}
          </p>
        </div>

        {/* Metric 2: Occupancy Rate */}
        <div className="figma-metric-card">
          <div className="metric-header-row">
            <span className="metric-label">{isAr ? 'نسبة الإشغال' : 'Occupancy Rate'}</span>
            <ClockIcon size={18} className="metric-icon-olive" />
          </div>
          <div className="metric-main-value dark-val">{occupancyPercent}%</div>
          <p className="metric-sub-note">
            {isAr
              ? `${totalCount} مقعد محجوز من ٥٢٠`
              : `${totalCount} booked of 520 seats`}
          </p>
        </div>

        {/* Metric 3: Checked In (Scanned) */}
        <div className="figma-metric-card">
          <div className="metric-header-row">
            <span className="metric-label">{isAr ? 'الحضور الذين دخلوا' : 'Checked In'}</span>
            <CheckCircleIcon size={18} className="metric-icon-olive" />
          </div>
          <div className="metric-main-value dark-val">
            {scannedCount} <span className="value-sub-percent">({scannedPercent}%)</span>
          </div>
          <p className="metric-sub-note">
            {isAr
              ? `${pendingCount} في الانتظار بالبوابة`
              : `${pendingCount} pending at gate`}
          </p>
        </div>
      </section>

      {/* Filter and Search Bar */}
      <div className="figma-filter-fields-grid roster-filters-bar">
        <div className="figma-field-box search-field-box">
          <label className="field-box-label">{isAr ? 'بحث الحضور' : 'Search Attendees'}</label>
          <div className="field-input-inner">
            <SearchIcon size={14} className="field-inner-icon" />
            <input
              type="text"
              className="field-bare-input"
              placeholder={
                isAr
                  ? 'ابحث بالاسم، البريد، الرمز، أو رقم المقعد…'
                  : 'Search by name, email, code, or seat...'
              }
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="roster-search-input"
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
          <label className="field-box-label">{isAr ? 'حالة الدخول' : 'Gate Check-in'}</label>
          <select
            className="field-bare-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="roster-status-filter"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="scanned">{isAr ? 'تم التحقق بالبوابة (Scanned)' : 'Scanned / Checked In'}</option>
            <option value="pending">{isAr ? 'في الانتظار (Pending)' : 'Pending'}</option>
          </select>
        </div>
      </div>

      {/* Attendees Table Card (#FFFFFF with #E9EDE2 header) */}
      <div className="figma-data-table-card">
        <div className="table-responsive">
          <table className="admin-table roster-table figma-table">
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
                      <code className="figma-code-pill">{att.ticket_code}</code>
                    </td>

                    {/* Name & Email */}
                    <td className="attendee-details-cell">
                      <div className="attendee-name-bold">{att.attendee_name}</div>
                      <div className="attendee-email-sub">{att.email}</div>
                    </td>

                    {/* Seat */}
                    <td>
                      <span className="seat-chip-figma">{att.seat}</span>
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
                    <td className="price-cell tabular-num">${att.price}</td>

                    {/* Gate Status Badge */}
                    <td>
                      {att.is_used ? (
                        <div className="figma-gate-pill gate-scanned" data-testid="status-scanned">
                          <CheckCircleIcon size={13} className="gate-icon" />
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
                        <div className="figma-gate-pill gate-pending" data-testid="status-pending">
                          <ClockIcon size={13} className="gate-icon" />
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

        {/* Table Footer Summary */}
        <div className="figma-table-footer-summary">
          <span>
            {isAr
              ? `إجمالي الحضور المسجل: ${totalCount} تذكرة · تم التحقق من ${scannedCount} بالبوابة · سعة القاعة ٥٢٠ مقعداً`
              : `Total Attendees: ${totalCount} tickets · ${scannedCount} validated at gate · Fixed 520-seat capacity`}
          </span>
        </div>
      </div>
    </div>
  );
}

export default AttendeeRosterTab;
