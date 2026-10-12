/**
 * Pure SVG Icons Library
 * Standard SVG icons matching modern design tokens (Slate dark style, accessible aria-hidden,
 * customizable size 16/20/24px and className).
 * Zero emoji dependency.
 */

function SvgBase({
  size = 20,
  className = '',
  style,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  children,
  ...props
}) {
  const isHidden = ariaLabel ? undefined : (ariaHidden ?? true);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`svg-icon ${className}`.trim()}
      style={style}
      aria-hidden={isHidden}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Standard Icons
// ---------------------------------------------------------------------------

export function TicketIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
      <path d="M13 5v2" />
      <path d="M13 17v2" />
      <path d="M13 11v2" />
    </SvgBase>
  );
}

export function CalendarIcon(props) {
  return (
    <SvgBase {...props}>
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </SvgBase>
  );
}

export function ClockIcon(props) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </SvgBase>
  );
}

export function MapPinIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </SvgBase>
  );
}

export function UserIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </SvgBase>
  );
}

export function UsersIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M17 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M7 21v-2a4 4 0 0 1 3-3.87" />
      <path d="M9 17h6" />
      <circle cx="12" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </SvgBase>
  );
}

export function ShieldIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </SvgBase>
  );
}

export function ShieldAlertIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" strokeWidth="3" />
    </SvgBase>
  );
}

export function LockIcon(props) {
  return (
    <SvgBase {...props}>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </SvgBase>
  );
}

export function LogOutIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </SvgBase>
  );
}

export function CheckCircleIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </SvgBase>
  );
}

export function AlertTriangleIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="3" />
    </SvgBase>
  );
}

export function XCircleIcon(props) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </SvgBase>
  );
}

export function Trash2Icon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </SvgBase>
  );
}

export function Edit3Icon(props) {
  return (
    <SvgBase {...props}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </SvgBase>
  );
}

export function PlusIcon(props) {
  return (
    <SvgBase {...props}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </SvgBase>
  );
}

export function RefreshCwIcon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </SvgBase>
  );
}

export function GlobeIcon(props) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </SvgBase>
  );
}

export function ChevronDownIcon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="6 9 12 15 18 9" />
    </SvgBase>
  );
}

export function ChevronRightIcon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="9 18 15 12 9 6" />
    </SvgBase>
  );
}

export function ChevronLeftIcon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="15 18 9 12 15 6" />
    </SvgBase>
  );
}

export function ChevronUpIcon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="18 15 12 9 6 15" />
    </SvgBase>
  );
}

export function SearchIcon(props) {
  return (
    <SvgBase {...props}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </SvgBase>
  );
}

export function EyeIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </SvgBase>
  );
}

export function FilterIcon(props) {
  return (
    <SvgBase {...props}>
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </SvgBase>
  );
}

export function SparklesIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z" />
      <path d="M19 4v3" />
      <path d="M20.5 5.5h-3" />
      <path d="M5 18v2" />
      <path d="M6 19H4" />
    </SvgBase>
  );
}

export function BuildingIcon(props) {
  return (
    <SvgBase {...props}>
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01" />
      <path d="M16 6h.01" />
      <path d="M12 6h.01" />
      <path d="M8 10h.01" />
      <path d="M16 10h.01" />
      <path d="M12 10h.01" />
      <path d="M8 14h.01" />
      <path d="M16 14h.01" />
      <path d="M12 14h.01" />
    </SvgBase>
  );
}

export function InfoIcon(props) {
  return (
    <SvgBase {...props}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" strokeWidth="3" />
    </SvgBase>
  );
}

export function BarChart3Icon(props) {
  return (
    <SvgBase {...props}>
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </SvgBase>
  );
}

export function QrCodeIcon(props) {
  return (
    <SvgBase {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <path d="M17 17h4v4h-4z" />
      <path d="M7 7h.01" strokeWidth="3" />
      <path d="M17 7h.01" strokeWidth="3" />
      <path d="M7 17h.01" strokeWidth="3" />
    </SvgBase>
  );
}

export function HomeIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </SvgBase>
  );
}

export function ArrowLeftIcon(props) {
  return (
    <SvgBase {...props}>
      <line x1="19" y1="12" x2="5" y2="12" />
      <polyline points="12 19 5 12 12 5" />
    </SvgBase>
  );
}

export function ArrowRightIcon(props) {
  return (
    <SvgBase {...props}>
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </SvgBase>
  );
}

export function SpinnerIcon(props) {
  return (
    <SvgBase className="animate-spin" {...props}>
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </SvgBase>
  );
}

// ---------------------------------------------------------------------------
// Specialized Platform Icons (Replacing emojis)
// ---------------------------------------------------------------------------

export function CrownIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14v2H5v-2z" />
    </SvgBase>
  );
}

export function TentIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M19 20H5a2 2 0 0 1-2-2L12 3l9 15a2 2 0 0 1-2 2z" />
      <path d="M12 3v17" />
      <path d="m9 20 3-7 3 7" />
    </SvgBase>
  );
}

export function StarIcon({
  size = 20,
  className = '',
  filled = false,
  style,
  'aria-label': ariaLabel,
  'aria-hidden': ariaHidden,
  ...props
}) {
  const isHidden = ariaLabel ? undefined : (ariaHidden ?? true);
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`svg-icon ${className}`.trim()}
      style={style}
      aria-hidden={isHidden}
      aria-label={ariaLabel}
      {...props}
    >
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

export function DownloadIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </SvgBase>
  );
}

export function CameraIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </SvgBase>
  );
}

export function CheckIcon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="20 6 9 17 4 12" />
    </SvgBase>
  );
}

export function XIcon(props) {
  return (
    <SvgBase {...props}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </SvgBase>
  );
}

export function ZapIcon(props) {
  return (
    <SvgBase {...props}>
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </SvgBase>
  );
}

export function ChairIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M6 19v3" />
      <path d="M18 19v3" />
      <path d="M4 11a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
      <path d="M6 8V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" />
    </SvgBase>
  );
}

export function DollarSignIcon(props) {
  return (
    <SvgBase {...props}>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </SvgBase>
  );
}

export function TrendingUpIcon(props) {
  return (
    <SvgBase {...props}>
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </SvgBase>
  );
}

export function FileTextIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </SvgBase>
  );
}

export function FolderIcon(props) {
  return (
    <SvgBase {...props}>
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </SvgBase>
  );
}

// ---------------------------------------------------------------------------
// Named aliases without "Icon" suffix
// ---------------------------------------------------------------------------
export function Ticket(props) { return <TicketIcon {...props} />; }
export function Calendar(props) { return <CalendarIcon {...props} />; }
export function Clock(props) { return <ClockIcon {...props} />; }
export function MapPin(props) { return <MapPinIcon {...props} />; }
export function User(props) { return <UserIcon {...props} />; }
export function Users(props) { return <UsersIcon {...props} />; }
export function Shield(props) { return <ShieldIcon {...props} />; }
export function ShieldAlert(props) { return <ShieldAlertIcon {...props} />; }
export function Lock(props) { return <LockIcon {...props} />; }
export function LogOut(props) { return <LogOutIcon {...props} />; }
export function CheckCircle(props) { return <CheckCircleIcon {...props} />; }
export function AlertTriangle(props) { return <AlertTriangleIcon {...props} />; }
export function XCircle(props) { return <XCircleIcon {...props} />; }
export function Trash2(props) { return <Trash2Icon {...props} />; }
export function Edit3(props) { return <Edit3Icon {...props} />; }
export function Plus(props) { return <PlusIcon {...props} />; }
export function RefreshCw(props) { return <RefreshCwIcon {...props} />; }
export function Globe(props) { return <GlobeIcon {...props} />; }
export function ChevronDown(props) { return <ChevronDownIcon {...props} />; }
export function ChevronRight(props) { return <ChevronRightIcon {...props} />; }
export function ChevronLeft(props) { return <ChevronLeftIcon {...props} />; }
export function ChevronUp(props) { return <ChevronUpIcon {...props} />; }
export function Search(props) { return <SearchIcon {...props} />; }
export function Eye(props) { return <EyeIcon {...props} />; }
export function Filter(props) { return <FilterIcon {...props} />; }
export function Sparkles(props) { return <SparklesIcon {...props} />; }
export function Building(props) { return <BuildingIcon {...props} />; }
export function Info(props) { return <InfoIcon {...props} />; }
export function BarChart3(props) { return <BarChart3Icon {...props} />; }
export function QrCode(props) { return <QrCodeIcon {...props} />; }
export function Home(props) { return <HomeIcon {...props} />; }
export function ArrowLeft(props) { return <ArrowLeftIcon {...props} />; }
export function ArrowRight(props) { return <ArrowRightIcon {...props} />; }
export function Spinner(props) { return <SpinnerIcon {...props} />; }
export function Crown(props) { return <CrownIcon {...props} />; }
export function Tent(props) { return <TentIcon {...props} />; }
export function Star(props) { return <StarIcon {...props} />; }
export function Download(props) { return <DownloadIcon {...props} />; }
export function Camera(props) { return <CameraIcon {...props} />; }
export function Check(props) { return <CheckIcon {...props} />; }
export function X(props) { return <XIcon {...props} />; }
export function Zap(props) { return <ZapIcon {...props} />; }
export function Chair(props) { return <ChairIcon {...props} />; }
export function DollarSign(props) { return <DollarSignIcon {...props} />; }
export function TrendingUp(props) { return <TrendingUpIcon {...props} />; }
export function FileText(props) { return <FileTextIcon {...props} />; }
export function Folder(props) { return <FolderIcon {...props} />; }

// ---------------------------------------------------------------------------
// Dynamic Icon Lookup Component
// ---------------------------------------------------------------------------

export function Icon({ name, size = 20, className = '', ...props }) {
  if (!name) return null;
  const key = String(name).toLowerCase().replace(/icon$/, '');

  switch (key) {
    case 'ticket': return <TicketIcon size={size} className={className} {...props} />;
    case 'calendar': return <CalendarIcon size={size} className={className} {...props} />;
    case 'clock': return <ClockIcon size={size} className={className} {...props} />;
    case 'mappin':
    case 'map-pin': return <MapPinIcon size={size} className={className} {...props} />;
    case 'user': return <UserIcon size={size} className={className} {...props} />;
    case 'users': return <UsersIcon size={size} className={className} {...props} />;
    case 'shield': return <ShieldIcon size={size} className={className} {...props} />;
    case 'shieldalert':
    case 'shield-alert': return <ShieldAlertIcon size={size} className={className} {...props} />;
    case 'lock': return <LockIcon size={size} className={className} {...props} />;
    case 'logout':
    case 'log-out': return <LogOutIcon size={size} className={className} {...props} />;
    case 'checkcircle':
    case 'check-circle': return <CheckCircleIcon size={size} className={className} {...props} />;
    case 'alerttriangle':
    case 'alert-triangle': return <AlertTriangleIcon size={size} className={className} {...props} />;
    case 'xcircle':
    case 'x-circle': return <XCircleIcon size={size} className={className} {...props} />;
    case 'trash2':
    case 'trash-2':
    case 'trash': return <Trash2Icon size={size} className={className} {...props} />;
    case 'edit3':
    case 'edit-3':
    case 'edit': return <Edit3Icon size={size} className={className} {...props} />;
    case 'plus': return <PlusIcon size={size} className={className} {...props} />;
    case 'refreshcw':
    case 'refresh-cw':
    case 'refresh': return <RefreshCwIcon size={size} className={className} {...props} />;
    case 'globe': return <GlobeIcon size={size} className={className} {...props} />;
    case 'chevrondown':
    case 'chevron-down': return <ChevronDownIcon size={size} className={className} {...props} />;
    case 'chevronright':
    case 'chevron-right': return <ChevronRightIcon size={size} className={className} {...props} />;
    case 'chevronleft':
    case 'chevron-left': return <ChevronLeftIcon size={size} className={className} {...props} />;
    case 'chevronup':
    case 'chevron-up': return <ChevronUpIcon size={size} className={className} {...props} />;
    case 'search': return <SearchIcon size={size} className={className} {...props} />;
    case 'eye': return <EyeIcon size={size} className={className} {...props} />;
    case 'filter': return <FilterIcon size={size} className={className} {...props} />;
    case 'sparkles': return <SparklesIcon size={size} className={className} {...props} />;
    case 'building': return <BuildingIcon size={size} className={className} {...props} />;
    case 'info': return <InfoIcon size={size} className={className} {...props} />;
    case 'barchart3':
    case 'bar-chart-3':
    case 'barchart':
    case 'bar-chart': return <BarChart3Icon size={size} className={className} {...props} />;
    case 'qrcode':
    case 'qr-code': return <QrCodeIcon size={size} className={className} {...props} />;
    case 'home': return <HomeIcon size={size} className={className} {...props} />;
    case 'arrowleft':
    case 'arrow-left': return <ArrowLeftIcon size={size} className={className} {...props} />;
    case 'arrowright':
    case 'arrow-right': return <ArrowRightIcon size={size} className={className} {...props} />;
    case 'spinner': return <SpinnerIcon size={size} className={className} {...props} />;
    case 'crown': return <CrownIcon size={size} className={className} {...props} />;
    case 'tent': return <TentIcon size={size} className={className} {...props} />;
    case 'star': return <StarIcon size={size} className={className} {...props} />;
    case 'download': return <DownloadIcon size={size} className={className} {...props} />;
    case 'camera': return <CameraIcon size={size} className={className} {...props} />;
    case 'check': return <CheckIcon size={size} className={className} {...props} />;
    case 'x': return <XIcon size={size} className={className} {...props} />;
    case 'zap': return <ZapIcon size={size} className={className} {...props} />;
    case 'chair': return <ChairIcon size={size} className={className} {...props} />;
    case 'dollarsign':
    case 'dollar-sign': return <DollarSignIcon size={size} className={className} {...props} />;
    case 'trendingup':
    case 'trending-up': return <TrendingUpIcon size={size} className={className} {...props} />;
    case 'filetext':
    case 'file-text': return <FileTextIcon size={size} className={className} {...props} />;
    case 'folder': return <FolderIcon size={size} className={className} {...props} />;
    default:
      console.warn(`[Icon] Unknown icon name: "${name}"`);
      return null;
  }
}

export default Icon;
