/**
 * Pravaah Dashboard — Camera Detail Page
 *
 * Detailed view of a single camera with state inspector and trend charts.
 */

import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePravaahStore } from '@/store/pravaahStore';
import { api } from '@/lib/api';
import { REGIME_CONFIG, RISK_CONFIG, type VideoSummary } from '@/types/domain';
import { Camera, Clock, AlertTriangle, ArrowLeft, Upload, Square } from 'lucide-react';
import { Link } from 'react-router-dom';
import RegimeBadge from '@/components/ui/RegimeBadge';

export default function CameraDetail() {
  const { id } = useParams<{ id: string }>();
  const { cameras, cameraStates, metricsHistory } = usePravaahStore();
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [summary, setSummary] = useState<VideoSummary | null>(null);

  const state = cameraStates[id || ''];

  // Re-fetch the risk summary as new frames arrive so it stays live while
  // processing, and picks up the final result once the run completes.
  useEffect(() => {
    if (!id) return;
    api.getVideoSummary(id)
      .then(setSummary)
      .catch(() => setSummary(null));
  }, [id, state?.frame_id]);

  async function handleVideoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    setUploading(true);
    setUploadError(null);
    try {
      await api.uploadCameraVideo(id, file);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleVideoStop() {
    if (!id) return;
    try {
      await api.stopCameraVideo(id);
    } catch (err) {
      console.error('Failed to stop video processing:', err);
    }
  }

  const camera = cameras[id || ''];
  const history = metricsHistory[id || ''] || [];

  if (!camera) {
    return (
      <div className="card p-12 text-center">
        <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-400">Camera not found</p>
        <Link to="/cameras" className="text-cyan text-sm mt-4 inline-block">
          ← Back to cameras
        </Link>
      </div>
    );
  }

  const cfg = camera.current_regime ? REGIME_CONFIG[camera.current_regime] : null;
  const warningWindowActive = state?.warning_window_ms !== null;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/cameras"
            className="p-2 rounded-lg bg-surface-elevated border border-surface-border hover:border-cyan transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-white">{camera.location}</h1>
            <p className="text-sm text-slate-400 mt-1">{camera.camera_id}</p>
          </div>
        </div>
        <RegimeBadge regime={camera.current_regime} size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video/Visualization */}
        <div className="lg:col-span-2 space-y-6">
          {/* Video Placeholder */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Live Feed</h2>
              <div className="flex items-center gap-3">
                {state && (
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Clock className="w-3 h-3" />
                    <span>Frame {state.frame_id}</span>
                  </div>
                )}
                <label
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                    uploading
                      ? 'bg-surface-border text-slate-500 cursor-not-allowed'
                      : 'bg-cyan text-surface hover:bg-cyan-bright'
                  }`}
                >
                  <input
                    type="file"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska"
                    className="hidden"
                    onChange={handleVideoUpload}
                    disabled={uploading}
                  />
                  <Upload className="w-3 h-3" />
                  {uploading ? 'Uploading…' : 'Upload Video'}
                </label>
                <button
                  onClick={handleVideoStop}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface-elevated border border-surface-border text-slate-400 hover:border-regime-turbulent/50 hover:text-regime-turbulent transition-colors"
                >
                  <Square className="w-3 h-3" />
                  Stop
                </button>
              </div>
            </div>
            {uploadError && (
              <p className="text-xs text-regime-turbulent mb-3">{uploadError}</p>
            )}
            <div className="relative aspect-video bg-surface-elevated rounded-lg border border-surface-border overflow-hidden">
              {/* Grid overlay */}
              <div className="absolute inset-0 grid grid-cols-8 grid-rows-8 gap-px bg-cyan/5 p-4">
                {Array.from({ length: 64 }).map((_, i) => {
                  const row = Math.floor(i / 8);
                  const col = i % 8;
                  const cell = state?.cells?.find(c => c.row === row && c.col === col);
                  const cellColor = cell ? REGIME_CONFIG[cell.regime].color : '#64748b'; // slate — no data, not a claimed regime
                  const opacity = cell ? cell.density * 0.8 : 0.08;

                  return (
                    <div
                      key={i}
                      className="rounded-sm transition-all duration-300"
                      style={{
                        backgroundColor: cellColor,
                        opacity,
                      }}
                    />
                  );
                })}
              </div>

              {/* Warning Window Indicator */}
              {warningWindowActive && state?.warning_window_ms && (
                <div className="absolute top-4 right-4 px-3 py-2 rounded-lg bg-regime-stopgo-bg border border-regime-stopgo/30 warning-pulse">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-regime-stopgo" />
                    <span className="text-xs font-semibold text-regime-stopgo">
                      WARNING WINDOW
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    ~{Math.round(state.warning_window_ms / 1000)}s remaining
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Trend Charts */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Metric Trends</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TrendChart
                title="Pressure"
                data={history.map(h => h.pressure)}
                color={history[history.length - 1]?.pressure > 0.6 ? '#ef4444' : '#06b6d4'}
              />
              <TrendChart
                title="Direction Entropy"
                data={history.map(h => h.direction_entropy)}
                color={history[history.length - 1]?.direction_entropy > 0.5 ? '#f59e0b' : '#06b6d4'}
              />
              <TrendChart
                title="Velocity"
                data={history.map(h => h.velocity)}
                color="#06b6d4"
              />
              <TrendChart
                title="Flow Coherence"
                data={history.map(h => h.flow_coherence)}
                color="#22c55e"
              />
            </div>
          </div>
        </div>

        {/* State Inspector */}
        <div className="space-y-4">
          {/* Camera Info */}
          <div className="card p-4">
            <p className="section-label mb-3">Camera Info</p>
            <div className="space-y-3">
              <InfoRow label="ID" value={camera.camera_id} />
              <InfoRow label="Location" value={camera.location} />
              <InfoRow label="Description" value={camera.description} />
              <InfoRow
                label="Status"
                value={camera.online ? 'Online' : 'Offline'}
                valueColor={camera.online ? 'text-regime-flowing' : 'text-slate-500'}
              />
            </div>
          </div>

          {/* Current State */}
          <div className={`card p-4 border-l-4 ${cfg ? cfg.borderClass.replace('/30', '') : 'border-surface-border'}`}>
            <p className="section-label mb-3">Current State</p>
            <div className="space-y-3">
              <InfoRow label="Regime" value={cfg ? cfg.label : 'No Data'} valueColor={cfg ? cfg.textClass : 'text-slate-500'} />
              <InfoRow
                label="Risk"
                value={camera.current_risk ?? 'No Data'}
                valueColor={
                  camera.current_risk === null ? 'text-slate-500' :
                  camera.current_risk === 'LOW' ? 'text-regime-flowing' :
                  camera.current_risk === 'ELEVATED' ? 'text-regime-stopgo' :
                  camera.current_risk === 'HIGH' ? 'text-risk-high' :
                  'text-regime-turbulent'
                }
              />
              {warningWindowActive && state?.warning_window_ms && (
                <InfoRow
                  label="Warning Window"
                  value={`~${Math.round(state.warning_window_ms / 1000)}s`}
                  valueColor="text-regime-stopgo"
                />
              )}
            </div>
          </div>

          {/* Risk Summary — whole-video rollup, not just the latest frame */}
          {summary && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="section-label">Risk Summary</p>
                <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                  summary.status === 'PROCESSING' ? 'text-cyan' : 'text-slate-500'
                }`}>
                  {summary.status === 'PROCESSING' ? 'Processing…' : 'Complete'}
                </span>
              </div>
              <div className="space-y-3">
                <InfoRow label="Frames Analyzed" value={String(summary.frames_processed)} />
                <InfoRow label="Peak Regime" value={REGIME_CONFIG[summary.peak_regime].label} valueColor={REGIME_CONFIG[summary.peak_regime].textClass} />
                <InfoRow label="Peak Risk" value={RISK_CONFIG[summary.peak_risk].label} valueColor={RISK_CONFIG[summary.peak_risk].textClass} />
                <InfoRow
                  label="Incidents Triggered"
                  value={String(summary.incidents_triggered)}
                  valueColor={summary.incidents_triggered > 0 ? 'text-regime-turbulent' : 'text-slate-300'}
                />
              </div>

              {summary.frames_processed > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] text-slate-500 mb-1.5">Time in each regime</p>
                  <div className="flex h-2 rounded-full overflow-hidden bg-surface-border">
                    {(Object.keys(summary.regime_counts) as Array<keyof typeof summary.regime_counts>).map((regime) => {
                      const pct = (summary.regime_counts[regime] / summary.frames_processed) * 100;
                      if (pct === 0) return null;
                      return (
                        <div
                          key={regime}
                          style={{ width: `${pct}%`, backgroundColor: REGIME_CONFIG[regime].color }}
                          title={`${REGIME_CONFIG[regime].label}: ${pct.toFixed(0)}%`}
                        />
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Live Metrics */}
          {state && (
            <div className="card p-4">
              <p className="section-label mb-3">Live Metrics</p>
              <div className="space-y-3">
                <MetricRow label="Density" value={state.aggregate.density} />
                <MetricRow label="Velocity" value={state.aggregate.velocity} />
                <MetricRow label="Pressure" value={state.aggregate.pressure} />
                <MetricRow label="Direction Entropy" value={state.aggregate.direction_entropy} />
                <MetricRow label="Flow Coherence" value={state.aggregate.flow_coherence} />
              </div>
            </div>
          )}

          {/* Grid Cell Details */}
          {state && state.cells && (
            <div className="card p-4">
              <p className="section-label mb-3">Grid Cell Summary</p>
              <div className="grid grid-cols-4 gap-2">
                {state.cells.slice(0, 8).map((cell) => (
                  <div
                    key={`${cell.row}-${cell.col}`}
                    className="p-2 rounded bg-surface-elevated border border-surface-border text-center"
                  >
                    <p className="text-[10px] text-slate-500">R{cell.row}C{cell.col}</p>
                    <p className="text-xs font-medium text-white mt-1">
                      {(cell.density * 100).toFixed(0)}%
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Showing 8 of {state.cells.length} cells
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value, valueColor = 'text-slate-300' }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-xs text-slate-500">{label}</span>
      <span className={`text-xs font-medium ${valueColor}`}>{value}</span>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs text-slate-500">{label}</span>
        <span className="mono-value">{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="metric-bar">
        <div
          className="metric-bar-fill bg-cyan"
          style={{ width: `${value * 100}%` }}
        />
      </div>
    </div>
  );
}

function TrendChart({ title, data, color }: { title: string; data: number[]; color: string }) {
  const maxPoints = 60;
  const displayData = data.slice(-maxPoints);
  
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
        Current: {(data[data.length - 1] * 100).toFixed(0)}%
      </p>
    </div>
  );
}
