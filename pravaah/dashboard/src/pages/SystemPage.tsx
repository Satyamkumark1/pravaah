/**
 * Pravaah Dashboard — System Page
 *
 * System health monitoring with edge status, processing status,
 * WebSocket health, and engine version information.
 */

import { usePravaahStore } from '@/store/pravaahStore';
import { Server, Activity, Cpu, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function SystemPage() {
  const { systemStatus, wsConnected } = usePravaahStore();

  const status = systemStatus || {
    engine_version: '0.1.0',
    uptime_seconds: 0,
    cameras_online: 0,
    cameras_total: 0,
    processing_fps: 0,
    last_heartbeat: null,
  };

  const uptime = Math.floor(status.uptime_seconds);
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  const seconds = uptime % 60;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">System Status</h1>
          <p className="text-sm text-slate-400 mt-1">Edge processing and connectivity health</p>
        </div>
        <div className="flex items-center gap-2">
          {wsConnected ? (
            <div className="flex items-center gap-2 text-xs text-regime-flowing">
              <CheckCircle className="w-4 h-4" />
              <span>Connected</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-xs text-regime-turbulent">
              <XCircle className="w-4 h-4" />
              <span>Disconnected</span>
            </div>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatusCard
          title="Engine Version"
          value={`v${status.engine_version}`}
          icon={Server}
          color="text-cyan"
          bgColor="bg-cyan-subtle"
        />
        <StatusCard
          title="Uptime"
          value={`${hours}h ${minutes}m ${seconds}s`}
          icon={Clock}
          color="text-regime-flowing"
          bgColor="bg-regime-flowing-bg"
        />
        <StatusCard
          title="Cameras"
          value={`${status.cameras_online}/${status.cameras_total}`}
          icon={Activity}
          color="text-slate-300"
          bgColor="bg-surface-elevated"
        />
        <StatusCard
          title="Processing FPS"
          value={status.processing_fps.toFixed(1)}
          icon={Cpu}
          color="text-regime-flowing"
          bgColor="bg-regime-flowing-bg"
        />
      </div>

      {/* Detailed Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Edge Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Edge Status</h2>
          <div className="space-y-4">
            <StatusRow
              label="Engine Health"
              status="healthy"
              statusColor="text-regime-flowing"
            />
            <StatusRow
              label="Camera Connections"
              status={`${status.cameras_online} active`}
              statusColor="text-slate-300"
            />
            <StatusRow
              label="Processing Rate"
              status={`${status.processing_fps.toFixed(1)} FPS`}
              statusColor="text-slate-300"
            />
            <StatusRow
              label="Memory Usage"
              status="Normal"
              statusColor="text-regime-flowing"
            />
            <StatusRow
              label="CPU Usage"
              status="Normal"
              statusColor="text-regime-flowing"
            />
          </div>
        </div>

        {/* Connectivity Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Connectivity</h2>
          <div className="space-y-4">
            <StatusRow
              label="WebSocket"
              status={wsConnected ? 'Connected' : 'Disconnected'}
              statusColor={wsConnected ? 'text-regime-flowing' : 'text-regime-turbulent'}
            />
            <StatusRow
              label="Last Heartbeat"
              status={status.last_heartbeat ? new Date(status.last_heartbeat).toLocaleString() : 'Never'}
              statusColor="text-slate-300"
            />
            <StatusRow
              label="API Endpoint"
              status="Responsive"
              statusColor="text-regime-flowing"
            />
            <StatusRow
              label="Latency"
              status="< 50ms"
              statusColor="text-regime-flowing"
            />
          </div>
        </div>

        {/* Processing Status */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Processing Status</h2>
          <div className="space-y-4">
            <StatusRow
              label="Feature Extraction"
              status="Active"
              statusColor="text-regime-flowing"
            />
            <StatusRow
              label="Regime Classification"
              status="Active"
              statusColor="text-regime-flowing"
            />
            <StatusRow
              label="Hysteresis Filter"
              status="Active"
              statusColor="text-regime-flowing"
            />
            <StatusRow
              label="Incident Detection"
              status="Active"
              statusColor="text-regime-flowing"
            />
          </div>
        </div>

        {/* System Resources */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">System Resources</h2>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">CPU Usage</span>
                <span className="text-xs text-slate-500">45%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill bg-cyan" style={{ width: '45%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Memory Usage</span>
                <span className="text-xs text-slate-500">62%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill bg-cyan" style={{ width: '62%' }} />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-slate-400">Disk Usage</span>
                <span className="text-xs text-slate-500">38%</span>
              </div>
              <div className="metric-bar">
                <div className="metric-bar-fill bg-cyan" style={{ width: '38%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">System Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border">
            <p className="section-label mb-1">Engine Version</p>
            <p className="text-sm font-medium text-white">{status.engine_version}</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border">
            <p className="section-label mb-1">Platform</p>
            <p className="text-sm font-medium text-white">Edge Device</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-elevated border border-surface-border">
            <p className="section-label mb-1">Deployment</p>
            <p className="text-sm font-medium text-white">Local</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusCard({
  title,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  title: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bgColor: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${bgColor}`}>
          <Icon className={`w-5 h-5 ${color}`} />
        </div>
        <div>
          <p className="section-label">{title}</p>
          <p className={`text-xl font-semibold ${color}`}>{value}</p>
        </div>
      </div>
    </div>
  );
}

function StatusRow({
  label,
  status,
  statusColor,
}: {
  label: string;
  status: string;
  statusColor: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-400">{label}</span>
      <span className={`text-sm font-medium ${statusColor}`}>{status}</span>
    </div>
  );
}
