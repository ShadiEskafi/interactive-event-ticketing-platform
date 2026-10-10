/**
 * TicketCraft Bilingual Localization Dictionary (English & Arabic)
 * Covers all platform layers: Navbar, Hero, Events, Seatmap, Hold, Checkout, Auth, Tickets, Footer.
 */

export const translations = {
  en: {
    navbar: {
      brand_name: 'TicketCraft',
      tagline: 'Real-Time Interactive Ticketing',
      home: 'Home',
      featured_events: 'Featured Events',
      my_tickets: 'My Tickets',
      scanner: 'Gate Scanner',
      guest: 'Guest',
      sign_in: 'Sign In',
      sign_out: 'Sign Out',
      lang_toggle: 'العربية',
      lang_aria: 'Switch to Arabic',
    },
    hero: {
      badge: 'Next-Gen High Concurrency Ticketing',
      title: 'Discover & Book Exceptional Live Experiences',
      subtitle:
        'Reserve high-demand seats in real time with millisecond collision detection, cryptographic digital wallet passes, and guaranteed zero double-bookings.',
      metrics: {
        seats_val: '520',
        seats_label: 'Realtime Seats',
        lock_val: '300s',
        lock_label: 'Pessimistic Atomic Lock',
        qr_val: 'HMAC-SHA256',
        qr_label: 'Signed QR Passes',
      },
      search_placeholder: 'Search events, artists, venues...',
      search_aria: 'Search events by keyword',
      clear_search: 'Clear search text',
      categories: {
        all: 'All',
        classical: 'Classical',
        rock_pop: 'Rock & Pop',
        theatre: 'Theatre',
        festivals: 'Festivals',
      },
    },
    events: {
      eyebrow: 'Available Now',
      section_title: 'Featured Live Experiences',
      section_desc:
        'Select an event to explore the interactive seating map, view tier pricing, and hold your seats in real-time.',
      empty_title: 'No Events Found',
      empty_desc: "We couldn't find any events matching your search.",
      reset_filters: 'Reset Filters',
      tickets_from: 'Tickets from',
      tickets: 'Tickets',
      select_seats: 'Select Seats →',
      live_map: 'Live Interactive Map',
      back_to_events: '← Back to Events',
    },
    why: {
      eyebrow: 'Engineered for Concurrency',
      title: 'Why TicketCraft?',
      subtitle:
        'Our ground-up distributed architecture eliminates booking conflicts, slashes latency, and ensures tamper-proof entry.',
      card1: {
        tag: 'GPU-Accelerated',
        title: '60fps Pan-Zoom SVG Engine',
        body: 'Hardware-accelerated vector rendering for 520+ individual seats with fluid pinch, scroll wheel zoom, and instant hover inspection without DOM lag.',
        bullet1: 'Sub-16ms render loop with native vector scaling',
        bullet2: 'Accessible ARIA grid navigation with Arrow keys',
        bullet3: 'Color-blind friendly category palette',
      },
      card2: {
        tag: 'Zero Double-Bookings',
        title: 'Collision-Proof Realtime Hold (300s)',
        body: 'Pessimistic atomic locking backed by PostgreSQL RPC and Supabase Realtime guarantees zero double-bookings with a strict 300-second reservation countdown.',
        bullet1: 'PostgreSQL atomic RPC locks held seats instantly',
        bullet2: '200ms broadcast sync to all active attendees',
        bullet3: 'Automatic garbage-collection release on timeout',
      },
      card3: {
        tag: 'Tamper-Proof',
        title: 'Offline Web Crypto QR Passes',
        body: 'HMAC-SHA256 cryptographically signed entry tokens verified in microseconds. Downloadable high-contrast passes work completely offline at venue gates.',
        bullet1: 'W3C Web Crypto API client-side verification',
        bullet2: 'High-contrast optical scanning brightness mode',
        bullet3: 'Printable A5 PDF & PNG digital wallet export',
      },
    },
    seatmap: {
      stage: 'STAGE / PERFORMANCE AREA',
      zoom_in: 'Zoom in',
      zoom_out: 'Zoom out',
      reset_view: 'Reset view',
      loading: 'Loading auditorium seating plan...',
      vip: 'VIP',
      regular: 'Regular',
      balcony: 'Balcony',
      available: 'Available',
      selected: 'Selected',
      reserved: 'Reserved',
      sold: 'Sold',
      row: 'Row',
      seat: 'Seat',
    },
    cart: {
      title: 'Selected Seats',
      seats_count: 'seats selected',
      subtotal: 'Subtotal',
      empty: 'No seats selected yet. Click any available seat on the map.',
      max_alert: 'Maximum of 5 seats allowed per booking.',
      proceed: 'Proceed to Checkout',
    },
    hold: {
      banner_locked: 'Seats locked for checkout',
      timer_label: 'Hold Time Remaining',
      urgent_warning: 'Less than 1 minute remaining! Please complete your purchase.',
      expired_title: 'Reservation Expired',
      expired_desc:
        'Your 300-second reservation window has expired. Held seats have been released back to the auditorium.',
      back_to_map: 'Return to Seat Map',
    },
    auth: {
      modal_title: 'Sign In to Complete Booking',
      signin_tab: 'Sign In',
      signup_tab: 'Sign Up',
      email_label: 'Email Address',
      password_label: 'Password',
      full_name_label: 'Full Name',
      signin_btn: 'Sign In',
      signup_btn: 'Create Account',
      guest_mode: 'Continue as Guest',
      oauth_google: 'Continue with Google',
      oauth_github: 'Continue with GitHub',
    },
    checkout: {
      step_review: 'Step 1: Review Tickets',
      step_payment: 'Step 2: Payment Details',
      card_number: 'Card Number',
      expiry: 'MM/YY',
      cvv: 'CVV',
      confirm_and_pay: 'Confirm & Pay',
      processing: 'Securing Your Tickets...',
    },
    tickets: {
      title: 'My Tickets',
      subtitle:
        'Manage your confirmed event bookings and access high-contrast QR entry passes.',
      tab_upcoming: 'Upcoming Events',
      tab_past: 'Past Events',
      no_tickets_title: 'No Tickets Found',
      no_tickets_desc:
        'You have no active event passes yet. Browse available seats and book your first concert experience.',
      no_past_desc: 'You have no past event tickets.',
      explore_events: 'Explore Events',
      loading: 'Loading your confirmed tickets...',
      show_qr: 'Show QR Pass',
      download_pdf: 'Download PDF',
      download_png: 'Download PNG',
      brightness_boost: 'High-Contrast Gate Scanner Mode',
      entry_pass: 'Verified Entry Pass',
      verified: 'HMAC-SHA256 Authenticated',
    },
    scanner: {
      title: 'Gate Ticket Scanner',
      back: 'Exit Scanner',
      admitted: 'Admitted',
      declined: 'Declined',
      manual_entry: 'Manual Code',
      entry_granted: 'Entry Granted',
      already_used: 'Already Used',
      invalid_ticket: 'Invalid Ticket',
      offline_warning: 'Offline Mode - Visual ID Verification Advised',
    },
    footer: {
      brand_name: 'TicketCraft',
      description:
        'Interactive event ticketing engineered for high-concurrency seat maps, atomic pessimistic holds, and cryptographic digital passes.',
      platform: 'Platform',
      architecture: 'Architecture',
      security: 'Security & Guarantee',
      auditorium_map: 'Auditorium Map',
      featured_events: 'Featured Events',
      my_passes: 'My Passes & Tickets',
      copyright:
        '© 2026 TicketCraft, Inc. All rights reserved. Built with precision for live entertainment.',
      status_online: 'Realtime Booking Cluster: Online',
    },
  },

  ar: {
    navbar: {
      brand_name: 'تيكت كرافت',
      tagline: 'حجز تذاكر تفاعلي فوري',
      home: 'الرئيسية',
      featured_events: 'الفعاليات المميزة',
      my_tickets: 'تذاكري',
      scanner: 'ماسح البوابات',
      guest: 'زائر',
      sign_in: 'تسجيل الدخول',
      sign_out: 'تسجيل الخروج',
      lang_toggle: 'English',
      lang_aria: 'التبديل إلى الإنجليزية',
    },
    hero: {
      badge: 'الجيل الجديد لحجز التذاكر عالي الكثافة',
      title: 'اكتشف واحجز تجارب وفعاليات استثنائية',
      subtitle:
        'احجز المقاعد ذات الإقبال العالي فورياً مع كشف فوري للتعارض وتذاكر رقمية مشفرة وضمان عدم الحجز المزدوج.',
      metrics: {
        seats_val: '٥٢٠',
        seats_label: 'مقعداً فورياً',
        lock_val: '٣٠٠ ثانية',
        lock_label: 'حجز ذري مؤكد',
        qr_val: 'HMAC-SHA256',
        qr_label: 'تذاكر مشفرة',
      },
      search_placeholder: 'ابحث عن الفعاليات، الفنانين، القاعات...',
      search_aria: 'البحث عن الفعاليات بالكلمات المفتاحية',
      clear_search: 'مسح نص البحث',
      categories: {
        all: 'الكل',
        classical: 'كلاسيكي',
        rock_pop: 'روك وبوب',
        theatre: 'مسرح',
        festivals: 'مهرجانات',
      },
    },
    events: {
      eyebrow: 'متاح الآن',
      section_title: 'أبرز الفعاليات الحية',
      section_desc:
        'اختر فعالية لاستكشاف خريطة المقاعد التفاعلية وأسعار الفئات وتثبيت مقاعدك فورياً.',
      empty_title: 'لم يتم العثور على فعاليات',
      empty_desc: 'لم نتمكن من العثور على أي فعاليات مطابقة لبحثك.',
      reset_filters: 'إعادة ضبط التصفية',
      tickets_from: 'التذاكر تبدأ من',
      tickets: 'التذاكر',
      select_seats: 'اختر المقاعد ←',
      live_map: 'خريطة تفاعلية حية',
      back_to_events: '← العودة إلى الفعاليات',
    },
    why: {
      eyebrow: 'مصممة للتعامل مع أعلى كثافة حجز',
      title: 'لماذا تيكت كرافت؟',
      subtitle:
        'بنيتنا الموزعة تقضي على تعارض الحجوزات وتقلل زمن الاستجابة وتضمن دخولاً آمناً غير قابل للتلاعب.',
      card1: {
        tag: 'تسريع بالمعالج الرسومي',
        title: 'محرك SVG للتكبير والتحريك بـ ٦٠ إطاراً/ثانية',
        body: 'تصيير متجهات مسرّع عتادياً لأكثر من ٥٢٠ مقعداً مع تكبير سلس وفحص فوري للمقاعد دون بطء.',
        bullet1: 'حلقة تصيير أسرع من ١٦ مللي ثانية مع تحجيم متجهات أصيل',
        bullet2: 'تنقل عبر الشبكة بدعم كامل للوحة المفاتيح ومعايير الوصول',
        bullet3: 'لوحة ألوان متوافقة مع عمى الألوان لجميع الفئات',
      },
      card2: {
        tag: 'صفر حجوزات مكررة',
        title: 'حجز مؤقت مانع للتعارض (٣٠٠ ثانية)',
        body: 'قفل ذري مدعوم بـ PostgreSQL RPC وتزامن Supabase الفوري يمنع الحجز المزدوج تماماً بعد تنازلي لمدة ٣٠٠ ثانية.',
        bullet1: 'إجراءات PostgreSQL الذرية تقفل المقاعد المحجوزة فورياً',
        bullet2: 'بث التحديثات خلال ٢٠٠ مللي ثانية لجميع المستخدمين النشطين',
        bullet3: 'تحرير المقاعد تلقائياً فور انتهاء مهلة الحجز',
      },
      card3: {
        tag: 'مقاومة للتزوير',
        title: 'تذاكر QR مشفرة تعمل دون إنترنت',
        body: 'تذاكر دخول موقعة تشفيرياً بـ HMAC-SHA256 يتم التحقق منها بأجزاء من الثانية وتعمل بالكامل دون اتصال عند بوابات الدخول.',
        bullet1: 'تحقق عميل موثوق عبر معايير W3C Web Crypto API',
        bullet2: 'وضع سطوع عالي للمسح البصري السريع عند البوابات',
        bullet3: 'تصدير قابل للطباعة بصيغ PDF بحجم A5 وبطاقات PNG رقمية',
      },
    },
    seatmap: {
      stage: 'منطقة المسرح / العرض',
      zoom_in: 'تكبير',
      zoom_out: 'تصغير',
      reset_view: 'إعادة ضبط العرض',
      loading: 'جاري تحميل مخطط مقاعد القاعة...',
      vip: 'كبار الشخصيات',
      regular: 'عادي',
      balcony: 'شرفة',
      available: 'متاح',
      selected: 'محدد',
      reserved: 'محجوز مؤقتاً',
      sold: 'مباع',
      row: 'الصف',
      seat: 'المقعد',
    },
    cart: {
      title: 'المقاعد المحددة',
      seats_count: 'مقاعد محددة',
      subtotal: 'المجموع الفرعي',
      empty: 'لم يتم تحديد مقاعد بعد. انقر على أي مقعد متاح على الخريطة.',
      max_alert: 'الحد الأقصى ٥ مقاعد لكل حجز.',
      proceed: 'المتابعة إلى الدفع',
    },
    hold: {
      banner_locked: 'المقاعد محجوزة مؤقتاً لإتمام الدفع',
      timer_label: 'الوقت المتبقي للحجز',
      urgent_warning: 'أقل من دقيقة متبقية! يرجى إتمام عملية الدفع.',
      expired_title: 'انتهت صلاحية الحجز',
      expired_desc:
        'انتهت فترة الـ ٣٠٠ ثانية للحجز المؤقت وتم تحرير المقاعد للجمهور مرة أخرى.',
      back_to_map: 'العودة إلى خريطة المقاعد',
    },
    auth: {
      modal_title: 'تسجيل الدخول لإتمام الحجز',
      signin_tab: 'تسجيل الدخول',
      signup_tab: 'إنشاء حساب',
      email_label: 'البريد الإلكتروني',
      password_label: 'كلمة المرور',
      full_name_label: 'الاسم الكامل',
      signin_btn: 'تسجيل الدخول',
      signup_btn: 'إنشاء حساب جديد',
      guest_mode: 'المتابعة كزائر',
      oauth_google: 'المتابعة عبر Google',
      oauth_github: 'المتابعة عبر GitHub',
    },
    checkout: {
      step_review: 'الخطوة ١: مراجعة التذاكر',
      step_payment: 'الخطوة ٢: تفاصيل الدفع',
      card_number: 'رقم البطاقة',
      expiry: 'الشهر/السنة',
      cvv: 'رمز الأمان (CVV)',
      confirm_and_pay: 'تأكيد ودفع',
      processing: 'جاري تأمين تذاكرك...',
    },
    tickets: {
      title: 'تذاكري',
      subtitle:
        'إدارة حجوزاتك المؤكدة والوصول إلى تذاكر QR الرقمية للدخول.',
      tab_upcoming: 'الفعاليات القادمة',
      tab_past: 'الفعاليات السابقة',
      no_tickets_title: 'لا توجد تذاكر',
      no_tickets_desc:
        'ليس لديك تذاكر نشطة حالياً. تصفح المقاعد المتاحة واحجز فعاليتك الأولى.',
      no_past_desc: 'ليس لديك أي تذاكر لفعاليات سابقة.',
      explore_events: 'استكشاف الفعاليات',
      loading: 'جاري تحميل تذاكرك المؤكدة...',
      show_qr: 'عرض تذكرة QR',
      download_pdf: 'تحميل PDF',
      download_png: 'تحميل PNG',
      brightness_boost: 'وضع السطوع العالي لمسح البوابات',
      entry_pass: 'تذكرة دخول معتمدة',
      verified: 'تم التحقق تشفيرياً بـ HMAC-SHA256',
    },
    scanner: {
      title: 'ماسح تذاكر البوابات',
      back: 'الخروج من الماسح',
      admitted: 'تم الدخول',
      declined: 'مرفوض',
      manual_entry: 'إدخال يدوي',
      entry_granted: 'تم السماح بالدخول',
      already_used: 'تم استخدامها مسبقاً',
      invalid_ticket: 'تذكرة غير صالحة',
      offline_warning: 'وضع عدم الاتصال - يُنصح بالتحقق البصري من الهوية',
    },
    footer: {
      brand_name: 'تيكت كرافت',
      description:
        'منصة حجز تذاكر تفاعلية مصممة لخرائط المقاعد عالية الكثافة والحجز الذري والتذاكر الرقمية المشفرة.',
      platform: 'المنصة',
      architecture: 'البنية الهندسية',
      security: 'الأمان والضمان',
      auditorium_map: 'خريطة القاعة',
      featured_events: 'الفعاليات المميزة',
      my_passes: 'تذاكري وتصاريحي',
      copyright:
        '© ٢٠٢٦ تيكت كرافت، جميع الحقوق محفوظة. صُممت بدقة للفعاليات الحية.',
      status_online: 'عنقود الحجز الفوري: متصل',
    },
  },
};

/**
 * Helper to resolve nested translation keys with fallback
 * @param {'en'|'ar'} lang
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function getTranslation(lang, key, fallback) {
  if (!key) return fallback || '';
  const currentDict = translations[lang] || translations.en;

  const parts = key.split('.');
  let current = currentDict;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      current = undefined;
      break;
    }
  }

  if (typeof current === 'string') {
    return current;
  }

  // Fallback to English dictionary
  if (lang !== 'en') {
    let enCurrent = translations.en;
    for (const part of parts) {
      if (enCurrent && typeof enCurrent === 'object' && part in enCurrent) {
        enCurrent = enCurrent[part];
      } else {
        enCurrent = undefined;
        break;
      }
    }
    if (typeof enCurrent === 'string') {
      return enCurrent;
    }
  }

  return fallback !== undefined ? fallback : key;
}
