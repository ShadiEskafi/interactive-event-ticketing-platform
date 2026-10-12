import { useState, useMemo } from 'react';
import { useLanguage } from '../../../context';
import {
  SearchIcon,
  XIcon,
  PlusIcon,
  FolderIcon,
  ChairIcon,
  StarIcon,
  Edit3Icon,
  Trash2Icon,
  EyeIcon,
} from '../../../components/common/Icons';
import { ConfirmDestructiveModal } from '../../../components/modals/ConfirmDestructiveModal';

/**
 * EventsManagementTab Component
 * Comprehensive management table for events:
 * - Search & category filtering
 * - Displays: Title, Category, Date, Venue, Capacity (Fixed 520), Status, Featured Star
 * - Actions: View event details modal, Feature on Home toggle, Edit event, Delete event
 * Zero emoji dependency, pure SVG icons.
 */
export function EventsManagementTab({
  events = [],
  onEditEvent,
  onDeleteEvent,
  onToggleFeatured,
  onCreateEventClick,
  onViewDetails,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [eventToDelete, setEventToDelete] = useState(null);

  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const matchSearch =
        !searchTerm ||
        (evt.title && evt.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (evt.title_ar && evt.title_ar.includes(searchTerm)) ||
        (evt.venue && evt.venue.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (evt.category && evt.category.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'published' && evt.status !== 'draft') ||
        (statusFilter === 'draft' && evt.status === 'draft');

      return matchSearch && matchStatus;
    });
  }, [events, searchTerm, statusFilter]);

  const handleDeleteClick = (evt) => {
    setEventToDelete(evt);
  };

  const handleConfirmDelete = () => {
    if (eventToDelete) {
      onDeleteEvent?.(eventToDelete.id);
      setEventToDelete(null);
    }
  };

  const handleCancelDelete = () => {
    setEventToDelete(null);
  };

  return (
    <div className="events-management-tab" data-testid="events-management-tab">
      {/* Top Filter and Search Bar */}
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
                ? 'ابحث باسم الفعالية، القاعة، أو الفئة...'
                : 'Search by event title, venue, or category...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            data-testid="events-search-input"
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
          {/* Status Filter */}
          <select
            className="admin-select filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="status-filter-select"
          >
            <option value="all">{isAr ? 'جميع الحالات' : 'All Statuses'}</option>
            <option value="published">{isAr ? 'منشور (نشط)' : 'Published'}</option>
            <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
          </select>

          {onCreateEventClick && (
            <button
              type="button"
              className="admin-btn btn-primary btn-add-event"
              onClick={onCreateEventClick}
              data-testid="btn-add-event-tab"
            >
              <PlusIcon size={16} />
              <span>{isAr ? 'إضافة فعالية' : 'Add Event'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Events Table */}
      <div className="table-responsive">
        <table className="admin-table events-table">
          <thead>
            <tr>
              <th>{isAr ? 'الفعالية' : 'Event'}</th>
              <th>{isAr ? 'الفئة' : 'Category'}</th>
              <th>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
              <th>{isAr ? 'القاعة والسعة' : 'Venue & Capacity'}</th>
              <th>{isAr ? 'نطاق الأسعار' : 'Price Range'}</th>
              <th>{isAr ? 'الحالة' : 'Status'}</th>
              <th>{isAr ? 'مميز' : 'Featured'}</th>
              <th className="actions-header">{isAr ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody>
            {filteredEvents.length === 0 ? (
              <tr>
                <td colSpan="8" className="empty-table-cell">
                  <div className="empty-placeholder">
                    <span className="empty-icon">
                      <FolderIcon size={36} />
                    </span>
                    <p className="empty-text">
                      {isAr
                        ? 'لم يتم العثور على أي فعاليات مطابقة للبحث'
                        : 'No events found matching your filter'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredEvents.map((evt) => (
                <tr key={evt.id} data-testid={`event-row-${evt.id}`}>
                  {/* Title & Preview */}
                  <td className="event-primary-cell">
                    <div className="event-badge-color" style={{ background: evt.imageGradient }} />
                    <div className="event-info">
                      <div className="event-name-bold">
                        {isAr ? evt.title_ar || evt.title : evt.title}
                      </div>
                      <span className="event-id-sub">ID: {evt.id}</span>
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="category-pill">
                      {isAr ? evt.category_ar || evt.category : evt.category}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="date-cell">{isAr ? evt.date_ar || evt.date : evt.date}</td>

                  {/* Venue & Fixed Capacity */}
                  <td>
                    <div className="venue-text">{isAr ? evt.venue_ar || evt.venue : evt.venue}</div>
                    <span className="fixed-capacity-tag">
                      <ChairIcon size={14} className="tag-inline-icon" />
                      <span>520 {isAr ? 'مقعداً ثابتاً' : 'Fixed Seats'}</span>
                    </span>
                  </td>

                  {/* Price */}
                  <td className="price-cell">
                    {isAr ? evt.priceRange_ar || evt.priceRange : evt.priceRange || '$45 – $150'}
                  </td>

                  {/* Status */}
                  <td>
                    <span
                      className={`status-pill ${
                        evt.status === 'draft' ? 'pill-draft' : 'pill-published'
                      }`}
                    >
                      {evt.status === 'draft' ? (isAr ? 'مسودة' : 'Draft') : (isAr ? 'منشور' : 'Live')}
                    </span>
                  </td>

                  {/* Featured on Home */}
                  <td className="featured-toggle-cell">
                    <button
                      type="button"
                      className={`btn-star-toggle ${evt.isPrimary ? 'is-featured' : ''}`}
                      onClick={() => onToggleFeatured?.(evt.id)}
                      title={
                        evt.isPrimary
                          ? isAr
                            ? 'معروض كفعالية مميزة بالصفحة الرئيسية'
                            : 'Currently featured on Home'
                          : isAr
                          ? 'تمييز بالصفحة الرئيسية'
                          : 'Feature on Home'
                      }
                      data-testid={`btn-feature-${evt.id}`}
                    >
                      <StarIcon size={16} filled={evt.isPrimary} />
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="actions-cell">
                    <div className="action-buttons-group">
                      <button
                        type="button"
                        className="admin-btn btn-xs btn-outline btn-details"
                        onClick={() => onViewDetails?.(evt)}
                        data-testid={`btn-details-${evt.id}`}
                        title={isAr ? 'عرض تفاصيل الفعالية' : 'View event details'}
                      >
                        <EyeIcon size={14} />
                        <span>{isAr ? 'تفاصيل' : 'Details'}</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn btn-xs btn-outline btn-edit"
                        onClick={() => onEditEvent?.(evt)}
                        data-testid={`btn-edit-${evt.id}`}
                        title={isAr ? 'تعديل الفعالية' : 'Edit event'}
                      >
                        <Edit3Icon size={14} />
                        <span>{isAr ? 'تعديل' : 'Edit'}</span>
                      </button>
                      <button
                        type="button"
                        className="admin-btn btn-xs btn-danger btn-delete"
                        onClick={() => handleDeleteClick(evt)}
                        data-testid={`btn-delete-${evt.id}`}
                        title={isAr ? 'حذف الفعالية' : 'Delete event'}
                      >
                        <Trash2Icon size={14} />
                        <span>{isAr ? 'حذف' : 'Delete'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Interactive Destructive Deletion Confirmation Modal */}
      {eventToDelete && (
        <ConfirmDestructiveModal
          isOpen={Boolean(eventToDelete)}
          title={isAr ? 'تأكيد حذف الفعالية' : 'Confirm Event Deletion'}
          message={
            isAr
              ? 'هل أنت متأكد من حذف هذه الفعالية نهائياً من المنصة؟'
              : 'Are you sure you want to permanently delete this event from the platform?'
          }
          itemName={
            isAr
              ? eventToDelete.title_ar || eventToDelete.title
              : eventToDelete.title
          }
          consequences={
            isAr
              ? 'سيتم حذف الفعالية وإلغاء جميع أقفال وتذاكر المقاعد الـ ٥٢٠ المرتبطة بها نهائياً. لا يمكن التراجع عن هذا الإجراء.'
              : 'This action will permanently remove the event, its certified 520-seat layout, and any active holds or tickets. This action cannot be undone.'
          }
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          confirmText={isAr ? 'حذف الفعالية نهائياً' : 'Delete Event'}
          cancelText={isAr ? 'إلغاء' : 'Cancel'}
          isDangerous={true}
        />
      )}
    </div>
  );
}

export default EventsManagementTab;
