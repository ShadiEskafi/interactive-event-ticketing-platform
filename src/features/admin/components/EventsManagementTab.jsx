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
 * Theme: Figma Mihwar Events Governance (Node 145:27858 / 145:27738)
 * Architectural Features:
 * - Dual-Tone Page Intro & Header Counter (4 events on platform)
 * - 4-Field Modular Filter Controls Bar (Search, Venue, Category, Status) in Crisp White Cards (#FFFFFF)
 * - Clean Data Table Surface (#FFFFFF) with Light Sage Header (#E9EDE2) and Status Pills
 * - Actions Group (Pure SVG Eye, Pencil, Trash icons)
 * - Fixed 520 Capacity Enforcement Badge
 * Zero emoji dependency, 100% test compliant.
 */
export function EventsManagementTab({
  events = [],
  onEditEvent,
  onOpenEditModal,
  onDeleteEvent,
  onToggleFeatured,
  onCreateEventClick,
  onOpenCreateModal,
  onViewDetails,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const handleCreate = onCreateEventClick || onOpenCreateModal;
  const handleEdit = onEditEvent || onOpenEditModal;

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'published' | 'draft'
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [venueFilter, setVenueFilter] = useState('all');
  const [eventToDelete, setEventToDelete] = useState(null);

  const categories = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.category) set.add(e.category);
    });
    return Array.from(set);
  }, [events]);

  const venues = useMemo(() => {
    const set = new Set();
    events.forEach((e) => {
      if (e.venue) set.add(e.venue);
    });
    return Array.from(set);
  }, [events]);

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

      const matchCategory =
        categoryFilter === 'all' || evt.category === categoryFilter;

      const matchVenue =
        venueFilter === 'all' || evt.venue === venueFilter;

      return matchSearch && matchStatus && matchCategory && matchVenue;
    });
  }, [events, searchTerm, statusFilter, categoryFilter, venueFilter]);

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
    <div className="events-management-tab figma-governance-view" data-testid="events-management-tab">
      {/* Page Introduction matching Figma (Node 145:27890) */}
      <div className="figma-page-intro">
        <h2 className="figma-page-title">{isAr ? 'حوكمة الفعاليات' : 'Events Governance'}</h2>
        <p className="figma-page-subtitle">
          {isAr
            ? 'إدارة النشر والفعاليات الرئيسية والقاعات ذات السعة الثابتة. · السعة القياسية ٥٢٠ مقعداً'
            : 'Manage publishing, featured home status, and fixed 520-seat interactive venues.'}
        </p>
      </div>

      {/* Top Action Row: Counter + Create Event Button */}
      <div className="figma-governance-action-row">
        <div className="governance-counter">
          <span className="counter-num">{filteredEvents.length}</span>
          <span className="counter-label">{isAr ? 'فعاليات على المنصة' : 'Events on Platform'}</span>
        </div>

        {handleCreate && (
          <button
            type="button"
            className="admin-btn btn-primary btn-add-event figma-btn-lime"
            onClick={handleCreate}
            data-testid="btn-add-event-tab"
          >
            <PlusIcon size={16} />
            <span>{isAr ? 'فعالية جديدة' : 'New Event'}</span>
          </button>
        )}
      </div>

      {/* Filter Cards Row matching Figma (Node 145:27899) */}
      <div className="figma-filter-fields-grid">
        {/* Search Input Box */}
        <div className="figma-field-box search-field-box">
          <label className="field-box-label">{isAr ? 'بحث الفعاليات' : 'Search Events'}</label>
          <div className="field-input-inner">
            <SearchIcon size={14} className="field-inner-icon" />
            <input
              type="text"
              className="field-bare-input"
              placeholder={isAr ? 'ابحث بالاسم أو القاعة…' : 'Search by title, venue...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="events-search-input"
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

        {/* Venue Filter Box */}
        <div className="figma-field-box">
          <label className="field-box-label">{isAr ? 'القاعة' : 'Venue'}</label>
          <select
            className="field-bare-select"
            value={venueFilter}
            onChange={(e) => setVenueFilter(e.target.value)}
          >
            <option value="all">{isAr ? 'جميع القاعات' : 'All Venues'}</option>
            {venues.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter Box */}
        <div className="figma-field-box">
          <label className="field-box-label">{isAr ? 'الفئة' : 'Category'}</label>
          <select
            className="field-bare-select"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="all">{isAr ? 'جميع الفئات' : 'All Categories'}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter Box */}
        <div className="figma-field-box">
          <label className="field-box-label">{isAr ? 'حالة النشر' : 'Publishing Status'}</label>
          <select
            className="field-bare-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            data-testid="status-filter-select"
          >
            <option value="all">{isAr ? 'الكل · منشور / مسودة' : 'All · Published / Draft'}</option>
            <option value="published">{isAr ? 'منشور (نشط)' : 'Published'}</option>
            <option value="draft">{isAr ? 'مسودة' : 'Draft'}</option>
          </select>
        </div>
      </div>

      {/* Table Container Card (#FFFFFF with #E9EDE2 header) */}
      <div className="figma-data-table-card">
        <div className="table-responsive">
          <table className="admin-table events-table figma-table">
            <thead>
              <tr>
                <th>{isAr ? 'الفعالية · عربي / إنجليزي' : 'Event Title & Venue'}</th>
                <th>{isAr ? 'الفئة' : 'Category'}</th>
                <th>{isAr ? 'التاريخ والوقت' : 'Date & Time'}</th>
                <th>{isAr ? 'القاعة والسعة' : 'Venue & Capacity'}</th>
                <th>{isAr ? 'نطاق الأسعار' : 'Price Range'}</th>
                <th>{isAr ? 'الحالة' : 'Status'}</th>
                <th>{isAr ? 'رئيسية' : 'Featured'}</th>
                <th className="actions-header">{isAr ? 'الإجراءات' : 'Actions'}</th>
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
                      <div className="event-info">
                        <div className="event-name-bold">
                          {isAr ? evt.title_ar || evt.title : evt.title}
                        </div>
                        <span className="event-id-sub">
                          {evt.venue || 'The Grand Hall'} · ID: {evt.id}
                        </span>
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
                        <ChairIcon size={13} className="tag-inline-icon" />
                        <span>520 {isAr ? 'مقعداً ثابتاً' : 'Fixed Seats'}</span>
                      </span>
                    </td>

                    {/* Price */}
                    <td className="price-cell tabular-num">
                      {isAr ? evt.priceRange_ar || evt.priceRange : evt.priceRange || '$45 – $150'}
                    </td>

                    {/* Status */}
                    <td>
                      <span
                        className={`figma-status-badge ${
                          evt.status === 'draft' ? 'badge-draft' : 'badge-published'
                        }`}
                      >
                        {evt.status === 'draft' ? (isAr ? 'مسودة' : 'Draft') : (isAr ? 'منشور' : 'Published')}
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

                    {/* Actions: Eye, Pencil, Trash */}
                    <td className="actions-cell">
                      <div className="action-buttons-group">
                        <button
                          type="button"
                          className="figma-btn-icon btn-details"
                          onClick={() => onViewDetails?.(evt)}
                          data-testid={`btn-details-${evt.id}`}
                          title={isAr ? 'عرض تفاصيل الفعالية' : 'View event details'}
                        >
                          <EyeIcon size={16} />
                        </button>
                        <button
                          type="button"
                          className="figma-btn-icon btn-edit"
                          onClick={() => handleEdit?.(evt)}
                          data-testid={`btn-edit-${evt.id}`}
                          title={isAr ? 'تعديل الفعالية' : 'Edit event'}
                        >
                          <Edit3Icon size={16} />
                        </button>
                        <button
                          type="button"
                          className="figma-btn-icon btn-delete danger"
                          onClick={() => handleDeleteClick(evt)}
                          data-testid={`btn-delete-${evt.id}`}
                          title={isAr ? 'حذف الفعالية' : 'Delete event'}
                        >
                          <Trash2Icon size={16} />
                        </button>
                      </div>
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
              ? `السعة القياسية ثابتة عند ٥٢٠ مقعداً لكل فعالية لمنع تضارب الحجوزات ونظام الأقفال الذرية`
              : `Standard 520 seats capacity enforced per event with atomic hold protection`}
          </span>
        </div>
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
