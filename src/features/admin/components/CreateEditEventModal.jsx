import { useState, useEffect } from 'react';
import { useLanguage } from '../../../context';
import {
  AlertTriangleIcon,
  DollarSignIcon,
  StarIcon,
  TicketIcon,
  BuildingIcon,
  SparklesIcon,
  Edit3Icon,
  XIcon,
} from '../../../components/common/Icons';

const GRADIENT_PRESETS = [
  {
    id: 'indigo',
    name: 'Royal Deep Indigo',
    value: 'linear-gradient(135deg, #1E1B4B 0%, #312E81 50%, #4338CA 100%)',
  },
  {
    id: 'cyber',
    name: 'Neon Cyberpulse',
    value: 'linear-gradient(135deg, #4A044E 0%, #701A75 50%, #A21CAF 100%)',
  },
  {
    id: 'emerald',
    name: 'Emerald Solstice',
    value: 'linear-gradient(135deg, #064E3B 0%, #065F46 50%, #047857 100%)',
  },
  {
    id: 'obsidian',
    name: 'Obsidian Opera',
    value: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)',
  },
];

const CATEGORIES = [
  { en: 'Classical', ar: 'كلاسيكي' },
  { en: 'Rock & Pop', ar: 'روك وبوب' },
  { en: 'Theatre', ar: 'مسرح' },
  { en: 'Festivals', ar: 'مهرجانات' },
];

function getInitialFormState(eventToEdit) {
  if (eventToEdit) {
    return {
      title: eventToEdit.title || '',
      title_ar: eventToEdit.title_ar || '',
      category: eventToEdit.category || 'Classical',
      category_ar: eventToEdit.category_ar || 'كلاسيكي',
      date: eventToEdit.date || '',
      date_ar: eventToEdit.date_ar || '',
      venue: eventToEdit.venue || 'Grand Symphony Hall • Auditorium',
      venue_ar: eventToEdit.venue_ar || 'قاعة السيمفونية الكبرى • المسرح الرئيسي',
      vipPrice: eventToEdit.vipPrice || eventToEdit.tierPricing?.vip || 150,
      regularPrice: eventToEdit.regularPrice || eventToEdit.tierPricing?.regular || 75,
      balconyPrice: eventToEdit.balconyPrice || eventToEdit.tierPricing?.balcony || 45,
      description: eventToEdit.description || '',
      description_ar: eventToEdit.description_ar || '',
      status: eventToEdit.status || 'published',
      imageGradient: eventToEdit.imageGradient || GRADIENT_PRESETS[0].value,
    };
  }

  return {
    title: '',
    title_ar: '',
    category: 'Classical',
    category_ar: 'كلاسيكي',
    date: 'Saturday, Dec 12, 2026 • 8:00 PM',
    date_ar: 'السبت، ١٢ ديسمبر ٢٠٢٦ • ٨:٠٠ م',
    venue: 'Grand Symphony Hall • Auditorium',
    venue_ar: 'قاعة السيمفونية الكبرى • المسرح الرئيسي',
    vipPrice: 150,
    regularPrice: 75,
    balconyPrice: 45,
    description:
      'Exciting interactive live performance in our certified 520-seat acoustic auditorium.',
    description_ar:
      'أداء حي وتفاعلي استثنائي في مسرحنا الصوتي المعتمد والمجهز بـ ٥٢٠ مقعداً تفاعلياً.',
    status: 'published',
    imageGradient: GRADIENT_PRESETS[0].value,
  };
}

/**
 * EventForm Component
 * Keyed inner form ensuring fresh state on event selection without setState inside effect.
 */
function EventForm({ eventToEdit, onSubmit, onClose }) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [formData, setFormData] = useState(() => getInitialFormState(eventToEdit));
  const [validationError, setValidationError] = useState('');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCategoryChange = (e) => {
    const val = e.target.value;
    const cat = CATEGORIES.find((c) => c.en === val);
    setFormData((prev) => ({
      ...prev,
      category: val,
      category_ar: cat ? cat.ar : val,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setValidationError(
        isAr ? 'يرجى إدخال عنوان الفعالية بالإنجليزية' : 'Please enter event title (English)'
      );
      return;
    }
    if (!formData.title_ar.trim()) {
      setValidationError(
        isAr ? 'يرجى إدخال عنوان الفعالية بالعربية' : 'Please enter event title (Arabic)'
      );
      return;
    }

    setValidationError('');
    onSubmit?.(formData);
  };

  const isEdit = Boolean(eventToEdit);

  return (
    <form onSubmit={handleSubmit} className="admin-modal-form" data-testid="modal-form">
      {validationError && (
        <div className="form-error-alert" role="alert">
          <AlertTriangleIcon size={16} />
          <span>{validationError}</span>
        </div>
      )}

      <div className="form-grid">
        {/* Title English */}
        <div className="form-group">
          <label htmlFor="evt-title" className="form-label">
            {isAr ? 'عنوان الفعالية (بالإنجليزية) *' : 'Event Title (English) *'}
          </label>
          <input
            id="evt-title"
            type="text"
            className="admin-input"
            placeholder="e.g. Royal Symphony Gala"
            value={formData.title}
            onChange={(e) => handleChange('title', e.target.value)}
            required
            data-testid="input-title"
          />
        </div>

        {/* Title Arabic */}
        <div className="form-group">
          <label htmlFor="evt-title-ar" className="form-label">
            {isAr ? 'عنوان الفعالية (بالعربية) *' : 'Event Title (Arabic) *'}
          </label>
          <input
            id="evt-title-ar"
            type="text"
            dir="rtl"
            className="admin-input"
            placeholder="مثال: حفل السيمفونية الملكي"
            value={formData.title_ar}
            onChange={(e) => handleChange('title_ar', e.target.value)}
            required
            data-testid="input-title-ar"
          />
        </div>

        {/* Category */}
        <div className="form-group">
          <label htmlFor="evt-category" className="form-label">
            {isAr ? 'الفئة الموسيقية / النوع' : 'Category'}
          </label>
          <select
            id="evt-category"
            className="admin-select"
            value={formData.category}
            onChange={handleCategoryChange}
            data-testid="select-category"
          >
            {CATEGORIES.map((c) => (
              <option key={c.en} value={c.en}>
                {isAr ? `${c.ar} (${c.en})` : c.en}
              </option>
            ))}
          </select>
        </div>

        {/* Status (Published / Draft) */}
        <div className="form-group">
          <label htmlFor="evt-status" className="form-label">
            {isAr ? 'حالة النشر' : 'Publishing Status'}
          </label>
          <select
            id="evt-status"
            className="admin-select"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            data-testid="select-status"
          >
            <option value="published">{isAr ? 'منشور (متاح للحجز)' : 'Published (Live)'}</option>
            <option value="draft">{isAr ? 'مسودة (مخفي)' : 'Draft'}</option>
          </select>
        </div>

        {/* Date & Time English */}
        <div className="form-group">
          <label htmlFor="evt-date" className="form-label">
            {isAr ? 'التاريخ والوقت (بالإنجليزية)' : 'Date & Time (English)'}
          </label>
          <input
            id="evt-date"
            type="text"
            className="admin-input"
            placeholder="e.g. Saturday, Dec 12, 2026 • 8:00 PM"
            value={formData.date}
            onChange={(e) => handleChange('date', e.target.value)}
            data-testid="input-date"
          />
        </div>

        {/* Date & Time Arabic */}
        <div className="form-group">
          <label htmlFor="evt-date-ar" className="form-label">
            {isAr ? 'التاريخ والوقت (بالعربية)' : 'Date & Time (Arabic)'}
          </label>
          <input
            id="evt-date-ar"
            type="text"
            dir="rtl"
            className="admin-input"
            placeholder="السبت، ١٢ ديسمبر ٢٠٢٦ • ٨:٠٠ م"
            value={formData.date_ar}
            onChange={(e) => handleChange('date_ar', e.target.value)}
            data-testid="input-date-ar"
          />
        </div>

        {/* Venue English */}
        <div className="form-group">
          <label htmlFor="evt-venue" className="form-label">
            {isAr ? 'اسم المسرح / القاعة (بالإنجليزية)' : 'Venue Name (English)'}
          </label>
          <input
            id="evt-venue"
            type="text"
            className="admin-input"
            value={formData.venue}
            onChange={(e) => handleChange('venue', e.target.value)}
            data-testid="input-venue"
          />
        </div>

        {/* Venue Arabic */}
        <div className="form-group">
          <label htmlFor="evt-venue-ar" className="form-label">
            {isAr ? 'اسم المسرح / القاعة (بالعربية)' : 'Venue Name (Arabic)'}
          </label>
          <input
            id="evt-venue-ar"
            type="text"
            dir="rtl"
            className="admin-input"
            value={formData.venue_ar}
            onChange={(e) => handleChange('venue_ar', e.target.value)}
            data-testid="input-venue-ar"
          />
        </div>
      </div>

      {/* Seating Tier Pricing Section */}
      <div className="tier-pricing-section">
        <h4 className="pricing-section-title">
          <DollarSignIcon size={16} />
          <span>{isAr ? 'تسعير فئات المقاعد (بالدولار)' : 'Seating Tier Pricing ($ USD)'}</span>
        </h4>
        <div className="pricing-inputs-grid">
          <div className="pricing-item">
            <label htmlFor="price-vip" className="pricing-label tier-vip-label">
              <StarIcon size={14} filled={true} />
              <span>VIP Tier (40 {isAr ? 'مقعد' : 'seats'})</span>
            </label>
            <div className="price-input-wrapper">
              <span className="currency-prefix">$</span>
              <input
                id="price-vip"
                type="number"
                min="1"
                className="admin-input price-input"
                value={formData.vipPrice}
                onChange={(e) => handleChange('vipPrice', Number(e.target.value))}
                data-testid="input-price-vip"
              />
            </div>
          </div>

          <div className="pricing-item">
            <label htmlFor="price-reg" className="pricing-label tier-reg-label">
              <TicketIcon size={14} />
              <span>Regular Tier (360 {isAr ? 'مقعد' : 'seats'})</span>
            </label>
            <div className="price-input-wrapper">
              <span className="currency-prefix">$</span>
              <input
                id="price-reg"
                type="number"
                min="1"
                className="admin-input price-input"
                value={formData.regularPrice}
                onChange={(e) => handleChange('regularPrice', Number(e.target.value))}
                data-testid="input-price-reg"
              />
            </div>
          </div>

          <div className="pricing-item">
            <label htmlFor="price-bal" className="pricing-label tier-bal-label">
              <BuildingIcon size={14} />
              <span>Balcony Tier (120 {isAr ? 'مقعد' : 'seats'})</span>
            </label>
            <div className="price-input-wrapper">
              <span className="currency-prefix">$</span>
              <input
                id="price-bal"
                type="number"
                min="1"
                className="admin-input price-input"
                value={formData.balconyPrice}
                onChange={(e) => handleChange('balconyPrice', Number(e.target.value))}
                data-testid="input-price-bal"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Visual Gradient Preset Picker */}
      <div className="gradient-preset-section">
        <label className="form-label">
          <SparklesIcon size={16} />
          <span>{isAr ? 'سمة التصميم والألوان' : 'Visual Theme Gradient'}</span>
        </label>
        <div className="gradient-presets-grid">
          {GRADIENT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`gradient-swatch ${formData.imageGradient === p.value ? 'selected' : ''}`}
              style={{ background: p.value }}
              onClick={() => handleChange('imageGradient', p.value)}
              title={p.name}
              data-testid={`preset-${p.id}`}
            >
              <span className="preset-name-overlay">{p.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Actions */}
      <div className="modal-footer-actions">
        <button
          type="button"
          className="admin-btn btn-secondary"
          onClick={onClose}
          data-testid="btn-modal-cancel"
        >
          {isAr ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="submit"
          className="admin-btn btn-primary btn-save"
          data-testid="btn-modal-submit"
        >
          {isEdit
            ? isAr
              ? 'حفظ التغييرات'
              : 'Save Changes'
            : isAr
            ? 'إنشاء الفعالية وحفظها'
            : 'Create Event'}
        </button>
      </div>
    </form>
  );
}

/**
 * CreateEditEventModal Component
 * Wizard for creating new events or updating existing events.
 * Enforces FIXED standard 520-seat interactive venue capacity with prominent notice.
 * Pure SVG icons and zero emojis.
 */
export function CreateEditEventModal({
  isOpen,
  onClose,
  eventToEdit = null,
  onSubmit,
}) {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  // Handle escape key listener
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isEdit = Boolean(eventToEdit);

  return (
    <div
      className="modal-backdrop"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="create-edit-event-modal"
    >
      <div
        className="modal-window admin-event-modal"
        onClick={(e) => e.stopPropagation()}
        data-testid="modal-window"
      >
        {/* Modal Header */}
        <div className="modal-header">
          <div className="header-title-box">
            <span className="modal-icon">
              {isEdit ? <Edit3Icon size={20} /> : <SparklesIcon size={20} />}
            </span>
            <h2 id="modal-title" className="modal-title">
              {isEdit
                ? isAr
                  ? 'تعديل بيانات الفعالية'
                  : 'Edit Event Details'
                : isAr
                ? 'إنشاء فعالية تفاعلية جديدة'
                : 'Create New Interactive Event'}
            </h2>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label={isAr ? 'إغلاق' : 'Close'}
            data-testid="btn-modal-close"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Prominent Fixed Venue Capacity Notice (Enforcing 520 seats rule) */}
        <div className="venue-capacity-notice-banner" data-testid="capacity-notice-banner">
          <div className="notice-icon">
            <BuildingIcon size={24} />
          </div>
          <div className="notice-content">
            <h4 className="notice-heading">
              {isAr ? 'سعة القاعة ثابتة: ٥٢٠ مقعداً تفاعلياً' : 'Fixed Venue Capacity: 520 Interactive Seats'}
            </h4>
            <p className="notice-body">
              {isAr
                ? 'يتم ربط جميع الفعاليات تلقائياً بمخطط المسرح القياسي (Auditorium Topology) بـ ٥٢٠ مقعداً تفاعلياً موزعاً عبر ٣ فئات (VIP، Regular، Balcony).'
                : 'All events automatically bind to our standard 520-seat certified auditorium layout across 3 interactive tiers (VIP, Regular, Balcony).'}
            </p>
          </div>
        </div>

        {/* Keyed Form to eliminate setState-in-effect warning */}
        <EventForm
          key={eventToEdit?.id || 'new-event'}
          eventToEdit={eventToEdit}
          onSubmit={onSubmit}
          onClose={onClose}
        />
      </div>
    </div>
  );
}

export default CreateEditEventModal;
