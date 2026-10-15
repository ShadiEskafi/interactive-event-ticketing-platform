import { useLanguage } from '../../../context';

/**
 * PublicationBadge Component
 * Displays the publication state of an event ('published' vs 'draft')
 *
 * @param {Object} props
 * @param {string} [props.status='published'] - 'published' or 'draft'
 * @param {string} [props.language] - 'en' | 'ar'
 * @param {string} [props.className] - Additional classes
 */
export function PublicationBadge({
  status = 'published',
  language: propLanguage,
  className = '',
  ...props
}) {
  const langContext = useLanguage();
  const currentLanguage = propLanguage || langContext?.language || 'en';
  const isAr = currentLanguage === 'ar';

  const isDraft = String(status || '').toLowerCase() === 'draft';
  const pillStyle = isDraft ? 'tc-status-pill-gray' : 'tc-status-pill-green';
  const defaultText = isDraft
    ? isAr
      ? 'مسودة'
      : 'Draft'
    : isAr
    ? 'منشور'
    : 'Published';

  return (
    <span
      className={`tc-status-pill ${pillStyle} ${className}`.trim()}
      data-testid="publication-badge"
      {...props}
    >
      {defaultText}
    </span>
  );
}

/**
 * OccupancyBadge Component
 * Displays venue or event occupancy rate
 * e.g. "65.0% occupied" / "٦٥.٠٪ مشغول"
 *
 * @param {Object} props
 * @param {number|string} [props.rate=65.0] - Occupancy rate percentage
 * @param {string} [props.label] - Custom label override
 * @param {string} [props.language] - 'en' | 'ar'
 * @param {string} [props.className] - Additional classes
 */
export function OccupancyBadge({
  rate = 65.0,
  label,
  language: propLanguage,
  className = '',
  ...props
}) {
  const langContext = useLanguage();
  const currentLanguage = propLanguage || langContext?.language || 'en';
  const isAr = currentLanguage === 'ar';

  const numericRate = typeof rate === 'number' ? rate : parseFloat(rate) || 0;
  const formattedRate = `${numericRate.toFixed(1)}%`;

  const displayText =
    label || (isAr ? `${formattedRate} مشغول` : `${formattedRate} occupied`);

  return (
    <span
      className={`tc-status-pill tc-status-pill-green ${className}`.trim()}
      data-testid="occupancy-badge"
      {...props}
    >
      {displayText}
    </span>
  );
}

/**
 * RoleBadge Component
 * Displays governance & platform roles with distinct design tokens:
 * - Super Admin: Dark surface (#1c2921) with electric lime accent (#d2fa69)
 * - Organizer: Light sage badge (#eaf2e5) with forest green text (#315f3d)
 * - Gate Staff: Subtle muted pill (#ebeee6) with neutral text
 * - Attendee: Subtle muted pill (#ebeee6) with neutral text
 *
 * @param {Object} props
 * @param {string} [props.role='super_admin'] - Role identifier
 * @param {string} [props.language] - 'en' | 'ar'
 * @param {string} [props.className] - Additional classes
 */
export function RoleBadge({
  role = 'super_admin',
  language: propLanguage,
  className = '',
  ...props
}) {
  const langContext = useLanguage();
  const currentLanguage = propLanguage || langContext?.language || 'en';
  const isAr = currentLanguage === 'ar';

  const normalized = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

  let pillStyle;
  let defaultText;

  switch (normalized) {
    case 'super_admin':
    case 'admin':
      pillStyle = 'tc-status-pill-dark';
      defaultText = isAr ? 'سوبر أدمن' : 'Super Admin';
      break;
    case 'organizer':
      pillStyle = 'tc-status-pill-green';
      defaultText = isAr ? 'منظم فعاليات' : 'Organizer';
      break;
    case 'gate_staff':
    case 'staff':
      pillStyle = 'tc-status-pill-gray';
      defaultText = isAr ? 'موظف بوابة' : 'Gate Staff';
      break;
    case 'attendee':
    case 'user':
      pillStyle = 'tc-status-pill-gray';
      defaultText = isAr ? 'حاضر' : 'Attendee';
      break;
    default:
      pillStyle = 'tc-status-pill-gray';
      defaultText = role;
      break;
  }

  return (
    <span
      className={`tc-status-pill ${pillStyle} ${className}`.trim()}
      data-testid="role-badge"
      {...props}
    >
      {defaultText}
    </span>
  );
}

export function StatusBadges({ type, ...props }) {
  if (type === 'publication') {
    return <PublicationBadge {...props} />;
  }
  if (type === 'occupancy') {
    return <OccupancyBadge {...props} />;
  }
  if (type === 'role') {
    return <RoleBadge {...props} />;
  }
  return null;
}

export default StatusBadges;
