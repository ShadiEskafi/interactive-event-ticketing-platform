import { useMemo } from 'react';
import { useLanguage } from '../../../context';
import '../AdminDashboard.css';

/**
 * Baseline fallback activity items matching Figma 1:1 (Node 125:85 / 145:27548 & 145:27643)
 */
const FIGMA_DEFAULT_ACTIVITIES = [
  {
    id: 'act-001',
    title_en: 'Flush hold · 15 Oct · 19:30:00',
    title_ar: 'تفريغ الحجز · ١٥ أكتوبر · ١٩:٣٠:٠٠',
    desc_en: '8 expired holds released; 12 active holds remain.',
    desc_ar: 'تم تحرير ٨ حجوزات منتهية الصلاحية؛ يتبقى ١٢ حجزاً نشطاً.',
  },
  {
    id: 'act-002',
    title_en: 'Edit event · 15 Oct · 18:42:16',
    title_ar: 'تعديل فعالية · ١٥ أكتوبر · ١٨:٤٢:١٦',
    desc_en: 'Updated bilingual description. Capacity remains 520.',
    desc_ar: 'تم تحديث الوصف ثنائي اللغة. السعة تبقى ٥٢٠.',
  },
  {
    id: 'act-003',
    title_en: 'Role change · 15 Oct · 17:10:34',
    title_ar: 'تغيير الدور · ١٥ أكتوبر · ١٧:١٠:٣٤',
    desc_en: 'Sami Khalil assigned Gate Staff role for EVT-001.',
    desc_ar: 'تم تعيين سامي خليل لدور موظف بوابة للفعالية EVT-001.',
  },
];

/**
 * Action label mapping for dynamic audit log actions
 */
const ACTION_LABEL_MAP = {
  HOLDS_FLUSHED: { en: 'Flush hold', ar: 'تفريغ الحجز' },
  EVENT_UPDATED: { en: 'Edit event', ar: 'تعديل فعالية' },
  ROLE_UPDATE: { en: 'Role change', ar: 'تغيير الدور' },
  GATE_STAFF_CREATED: { en: 'Gate staff created', ar: 'إنشاء طاقم بوابة' },
  EVENT_CREATED: { en: 'Create event', ar: 'إنشاء فعالية' },
  EVENT_DELETED: { en: 'Delete event', ar: 'حذف فعالية' },
  USER_STATUS_TOGGLED: { en: 'User status changed', ar: 'تغيير حالة مستخدم' },
  CLEAN_STATE_RESET: { en: 'State reset', ar: 'إعادة ضبط النظام' },
};

/**
 * Formats a dynamic audit log into title and description
 */
function formatDynamicAuditLog(log, isAr) {
  // If item already possesses customized bilingual titles
  if (log.title_en || log.title_ar || log.title) {
    return {
      id: log.id || Math.random().toString(36).slice(2, 9),
      title: isAr
        ? log.title_ar || log.title || log.title_en
        : log.title_en || log.title || log.title_ar,
      desc: isAr
        ? log.desc_ar || log.desc || log.description || log.desc_en
        : log.desc_en || log.desc || log.description || log.desc_ar,
    };
  }

  // Derive title from action & timestamp
  const actionLabel =
    ACTION_LABEL_MAP[log.action]?.[isAr ? 'ar' : 'en'] ||
    log.action ||
    (isAr ? 'إجراء نظام' : 'System action');

  let timeString;
  if (log.timestamp) {
    try {
      const date = new Date(log.timestamp);
      const datePart = date.toLocaleDateString(isAr ? 'ar-SA' : 'en-US', {
        day: 'numeric',
        month: 'short',
      });
      const timePart = date.toLocaleTimeString(isAr ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      timeString = `${datePart} · ${timePart}`;
    } catch {
      timeString = String(log.timestamp);
    }
  } else {
    timeString = isAr ? '١٥ أكتوبر · ١٩:٣٠:٠٠' : '15 Oct · 19:30:00';
  }

  const title = `${actionLabel} · ${timeString}`;

  // Derive readable description
  let desc;
  if (typeof log.details === 'string') {
    desc = log.details;
  } else if (log.details && typeof log.details === 'object') {
    desc =
      log.details.description ||
      log.details.note ||
      log.details.message ||
      JSON.stringify(log.details);
  } else if (log.target) {
    desc = isAr
      ? `الهدف: ${log.target} · المنفذ: ${log.actorEmail || 'المسؤول'}`
      : `Target: ${log.target} · Actor: ${log.actorEmail || 'Admin'}`;
  } else {
    desc = isAr
      ? `تم تنفيذ العملية بواسطة ${log.actorEmail || 'المسؤول'}`
      : `Action performed by ${log.actorEmail || 'Admin'}`;
  }

  return {
    id: log.id || Math.random().toString(36).slice(2, 9),
    title,
    desc,
  };
}

/**
 * RecentActivityFeed Component
 * 1:1 Pixel-Perfect implementation for TicketCraft Admin Dashboard
 * Blueprint: Node 125:85 / 145:27548 (EN) & 145:27643 (AR)
 *
 * @param {Object} props
 * @param {Array} [props.auditLogs] - Array of audit log records. Falls back to Figma items if empty.
 * @param {string} [props.language] - 'en' | 'ar' localization mode.
 */
export function RecentActivityFeed({
  auditLogs,
  language: languageProp,
}) {
  const context = useLanguage();
  const language = languageProp || context.language || 'en';
  const isAr = language === 'ar';

  const items = useMemo(() => {
    if (Array.isArray(auditLogs) && auditLogs.length > 0) {
      return auditLogs.slice(0, 5).map((log) => formatDynamicAuditLog(log, isAr));
    }

    return FIGMA_DEFAULT_ACTIVITIES.map((act) => ({
      id: act.id,
      title: isAr ? act.title_ar : act.title_en,
      desc: isAr ? act.desc_ar : act.desc_en,
    }));
  }, [auditLogs, isAr]);

  return (
    <div
      className="tc-panel-card tc-panel-white"
      data-testid="recent-activity-panel"
    >
      {/* Panel Header */}
      <h3 className="tc-panel-title" data-testid="recent-activity-title">
        {isAr ? 'النشاط الأخير' : 'Recent activity'}
      </h3>

      {/* Activity Items List */}
      <div
        className="tc-activity-list"
        role="feed"
        aria-label={isAr ? 'سجل النشاط الأخير' : 'Recent activity feed'}
      >
        {items.map((item, index) => (
          <article
            key={item.id || index}
            className="tc-activity-item"
            data-testid={`activity-item-${index}`}
          >
            <h4 className="tc-activity-title">{item.title}</h4>
            <p className="tc-activity-desc">{item.desc}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export default RecentActivityFeed;
