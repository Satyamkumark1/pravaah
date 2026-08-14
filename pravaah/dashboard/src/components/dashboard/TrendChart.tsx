/**
 * Pravaah Dashboard — Trend Chart Component
 *
 * Reusable bar chart for displaying metric trends over time.
 */

interface TrendChartProps {
  title: string;
  data: number[];
  color?: string;
  maxPoints?: number;
}

export default function TrendChart({
  title,
  data,
  color = '#06b6d4',
  maxPoints = 60,
}: TrendChartProps) {
  const displayData = data.slice(-maxPoints);
  const currentValue = data[data.length - 1] || 0;

  return (
    <div className="p-3 rounded-lg bg-surface-elevated border border-surface-border">
      <p className="text-xs text-slate-500 mb-2">{title}</p>
      <div className="h-16 flex items-end gap-0.5">
        {displayData.map((value, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-300"
            style={{
              height: `${value * 100}%`,
              backgroundColor: color,
              opacity: 0.3 + (i / displayData.length) * 0.7,
            }}
          />
        ))}
      </div>
      <p className="text-xs text-slate-500 mt-2 text-right">
        Current: {(currentValue * 100).toFixed(0)}%
      </p>
    </div>
  );
}
