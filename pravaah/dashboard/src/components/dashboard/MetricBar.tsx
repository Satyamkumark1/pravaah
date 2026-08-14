/**
 * Pravaah Dashboard — Metric Bar Component
 *
 * Reusable progress bar for displaying metric values.
 */

interface MetricBarProps {
  value: number;
  color?: string;
  showValue?: boolean;
  label?: string;
}

export default function MetricBar({
  value,
  color = 'bg-cyan',
  showValue = true,
  label,
}: MetricBarProps) {
  const percentage = Math.min(value * 100, 100);

  return (
    <div>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-slate-500">{label}</span>
          {showValue && <span className="text-xs text-slate-500">{(value * 100).toFixed(0)}%</span>}
        </div>
      )}
      <div className="metric-bar">
        <div
          className={`metric-bar-fill ${color}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
