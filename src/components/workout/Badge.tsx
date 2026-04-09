import type { BadgeType } from '../../services/comparisonService';

const BADGE_CONFIG: Record<BadgeType, { label: string; classes: string }> = {
  'PR': { label: 'PR', classes: 'bg-[#fbbf24] text-black' },
  '+1': { label: '+1', classes: 'bg-[#22c55e] text-white' },
  'Matched': { label: 'Matched', classes: 'bg-[#3b82f6] text-white' },
  'Volume Up': { label: 'Vol \u2191', classes: 'bg-[#a855f7] text-white' },
  'Comeback': { label: 'Back', classes: 'bg-[#f97316] text-white' },
};

interface BadgeProps {
  type: BadgeType;
}

export default function Badge({ type }: BadgeProps) {
  const config = BADGE_CONFIG[type];
  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold leading-none ${config.classes}`}
    >
      {config.label}
    </span>
  );
}
