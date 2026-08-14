/**
 * Pravaah Dashboard — Analytics Page
 *
 * Historical analysis with regime timeline, pressure trends, entropy trends,
 * velocity variance, and warning window duration charts.
 */

import { usePravaahStore } from '@/store/pravaahStore';
import { REGIME_CONFIG } from '@/types/domain';
import { TrendingUp, Activity, AlertTriangle } from 'lucide-react';

export default function AnalyticsPage() {
  const { metricsHistory, cameras } = usePravaahStore();

  // Aggregate metrics across all cameras
  const allHistory = Object.values(metricsHistory).flat();
  
  // Calculate aggregate statistics
  const avgPressure = allHistory.length > 0 
    ? allHistory.reduce((sum, h) => sum + h.pressure, 0) / allHistory.length 
    : 0;
  const avgEntropy = allHistory.length > 0 
    ? allHistory.reduce((sum, h) => sum + h.direction_entropy, 0) / allHistory.length 
    : 0;
  const avgCoherence = allHistory.length > 0 
    ? allHistory.reduce((sum, h) => sum + h.flow_coherence, 0) / allHistory.length 
    : 0;

  // Count regime occurrences
  const regimeCounts = allHistory.reduce((acc, h) => {
    acc[h.regime] = (acc[h.regime] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Analytics</h1>
          <p className="text-sm text-slate-400 mt-1">Historical crowd movement analysis</p>
        </div>
        <div className="text-xs text-slate-500">
          {Object.keys(cameras).length} cameras monitored
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-subtle">
              <Activity className="w-5 h-5 text-cyan" />
            </div>
            <div>
              <p className="section-label">Avg Pressure</p>
              <p className="text-2xl font-semibold text-white">{(avgPressure * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-regime-stopgo-bg">
              <TrendingUp className="w-5 h-5 text-regime-stopgo" />
            </div>
            <div>
              <p className="section-label">Avg Entropy</p>
              <p className="text-2xl font-semibold text-white">{(avgEntropy * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
        <div className="card p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-regime-flowing-bg">
              <Activity className="w-5 h-5 text-regime-flowing" />
            </div>
            <div>
              <p className="section-label">Avg Coherence</p>
              <p className="text-2xl font-semibold text-white">{(avgCoherence * 100).toFixed(0)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Regime Distribution */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Regime Distribution</h2>
          <div className="space-y-3">
            {Object.entries(REGIME_CONFIG).map(([regime, cfg]) => {
              const count = regimeCounts[regime] || 0;
              const total = allHistory.length || 1;
              const percentage = (count / total) * 100;
              
              return (
                <div key={regime}>
                  <div className="flex items-center justify-between mb-1">
                    <span className={`text-sm font-medium ${cfg.textClass}`}>{cfg.label}</span>
                    <span className="text-xs text-slate-400">{count} points ({percentage.toFixed(1)}%)</span>
                  </div>
                  <div className="metric-bar">
                    <div
                      className={`metric-bar-fill ${cfg.dotClass}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pressure Trend */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Pressure Trend</h2>
          <div className="h-48 flex items-end gap-0.5">
            {allHistory.slice(-60).map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${h.pressure * 100}%`,
                  backgroundColor: h.pressure > 0.6 ? '#ef4444' : '#06b6d4',
                  opacity: 0.3 + (i / 60) * 0.7,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Last 60 data points
          </p>
        </div>

        {/* Entropy Trend */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Direction Entropy Trend</h2>
          <div className="h-48 flex items-end gap-0.5">
            {allHistory.slice(-60).map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${h.direction_entropy * 100}%`,
                  backgroundColor: h.direction_entropy > 0.5 ? '#f59e0b' : '#06b6d4',
                  opacity: 0.3 + (i / 60) * 0.7,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Last 60 data points
          </p>
        </div>

        {/* Flow Coherence Trend */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Flow Coherence Trend</h2>
          <div className="h-48 flex items-end gap-0.5">
            {allHistory.slice(-60).map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-all duration-300"
                style={{
                  height: `${h.flow_coherence * 100}%`,
                  backgroundColor: '#22c55e',
                  opacity: 0.3 + (i / 60) * 0.7,
                }}
              />
            ))}
          </div>
          <p className="text-xs text-slate-500 mt-2 text-center">
            Last 60 data points
          </p>
        </div>
      </div>

      {/* Warning Window Analysis */}
      <div className="card p-6">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-regime-stopgo" />
          <h2 className="text-lg font-semibold text-white">Warning Window Analysis</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border">
            <p className="section-label mb-1">Total Warning Events</p>
            <p className="text-2xl font-semibold text-white">
              {allHistory.filter(h => h.regime === 'STOP_AND_GO').length}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border">
            <p className="section-label mb-1">Turbulent Events</p>
            <p className="text-2xl font-semibold text-regime-turbulent">
              {allHistory.filter(h => h.regime === 'TURBULENT').length}
            </p>
          </div>
          <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border">
            <p className="section-label mb-1">Data Points Analyzed</p>
            <p className="text-2xl font-semibold text-white">{allHistory.length}</p>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="card p-4">
        <div className="flex items-center gap-6 text-xs">
          <span className="text-slate-500">Regime Legend:</span>
          {Object.entries(REGIME_CONFIG).map(([regime, cfg]) => (
            <div key={regime} className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${cfg.dotClass}`} />
              <span className={cfg.textClass}>{cfg.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
