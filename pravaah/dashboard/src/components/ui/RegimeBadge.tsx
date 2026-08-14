import { REGIME_CONFIG } from '@/types/domain';
import type { Regime } from '@/types/domain';
import { clsx } from 'clsx';

interface RegimeBadgeProps {
  regime: Regime | null;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
  className?: string;
}

const SIZE_CLASSES = {
  sm: 'text-[10px] px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
  lg: 'text-sm px-3 py-1.5',
};

export default function RegimeBadge({
  regime,
  size = 'md',
  showDot = true,
  className,
}: RegimeBadgeProps) {
  if (regime === null) {
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1.5 font-semibold tracking-widest uppercase rounded-md border',
          SIZE_CLASSES[size],
          'bg-surface-elevated text-slate-500 border-surface-border',
          className
        )}
        role="status"
        aria-label="No data"
      >
        {showDot && <span className="w-1.5 h-1.5 rounded-full shrink-0 bg-slate-600" aria-hidden="true" />}
        No Data
      </span>
    );
  }

  const cfg = REGIME_CONFIG[regime];
  const isPulsing = regime === 'TURBULENT';

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-semibold tracking-widest uppercase rounded-md border',
        SIZE_CLASSES[size],
        cfg.bgClass,
        cfg.textClass,
        cfg.borderClass,
        className
      )}
      role="status"
      aria-label={`Regime: ${cfg.label}`}
    >
      {showDot && (
        <span
          className={clsx(
            'w-1.5 h-1.5 rounded-full shrink-0',
            cfg.dotClass,
            isPulsing && 'animate-pulse'
          )}
          aria-hidden="true"
        />
      )}
      {cfg.label}
    </span>
  );
}
