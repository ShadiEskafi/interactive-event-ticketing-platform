import { useLanguage } from '../../../context';

/**
 * SVG Stage representation
 */
export function Stage({ stage }) {
  const { t } = useLanguage();
  if (!stage) return null;

  const stageLabel = stage.label || t('seatmap.stage', 'منطقة المسرح / العرض');

  return (
    <g className="stage-area" aria-hidden="true">
      <rect
        x={stage.x}
        y={stage.y}
        width={stage.width}
        height={stage.height}
        rx="10"
        ry="10"
        fill="#1E293B"
        stroke="#475569"
        strokeWidth="2"
      />
      <text
        x={stage.x + stage.width / 2}
        y={stage.y + stage.height / 2}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#F8FAFC"
        fontSize="15"
        fontWeight="700"
        letterSpacing="2"
        style={{ userSelect: 'none' }}
      >
        {stageLabel}
      </text>
    </g>
  );
}
