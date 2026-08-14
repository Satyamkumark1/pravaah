/**
 * Pravaah Dashboard — Overview Page
 *
 * High-level operational summary with KPI cards and key panels.
 * Answers: Where are the problems? What's the overall state?
 */

import { usePravaahStore } from '@/store/pravaahStore';
import { REGIME_CONFIG } from '@/types/domain';
import { Activity, AlertTriangle, Camera, TrendingUp } from 'lucide-react';
import { useMemo } from 'react';

export default function Overview() {
  const { cameras, incidents, systemStatus } = usePravaahStore();

  // Compute KPIs
  const kpis = useMemo(() => {
    const cameraList = Object.values(cameras);
    const flowing = cameraList.filter(c => c.current_regime === 'FLOWING').length;
    const stopAndGo = cameraList.filter(c => c.current_regime === 'STOP_AND_GO').length;
    const turbulent = cameraList.filter(c => c.current_regime === 'TURBULENT').length;
    const activeAlerts = incidents.filter(i => !i.acknowledged).length;

    return {
      activeCameras: cameraList.length,
      flowing,
      stopAndGo,
      turbulent,
      activeAlerts,
    };
  }, [cameras, incidents]);

  const kpiCards = [
    {
      label: 'Active Cameras',
      value: kpis.activeCameras,
      icon: Camera,
      color: 'text-cyan',
      bgColor: 'bg-cyan-subtle',
    },
    {
      label: 'Flowing',
      value: kpis.flowing,
      icon: Activity,
      color: 'text-regime-flowing',
      bgColor: 'bg-regime-flowing-bg',
    },
    {
      label: 'Stop & Go',
      value: kpis.stopAndGo,
      icon: TrendingUp,
      color: 'text-regime-stopgo',
      bgColor: 'bg-regime-stopgo-bg',
    },
    {
      label: 'Turbulent',
      value: kpis.turbulent,
      icon: AlertTriangle,
      color: 'text-regime-turbulent',
      bgColor: 'bg-regime-turbulent-bg',
      alert: kpis.turbulent > 0,
    },
    {
      label: 'Active Alerts',
      value: kpis.activeAlerts,
      icon: AlertTriangle,
      color: 'text-regime-turbulent',
      bgColor: 'bg-regime-turbulent-bg',
      alert: kpis.activeAlerts > 0,
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Overview</h1>
          <p className="text-sm text-slate-400 mt-1">Operational summary and crowd status</p>
        </div>
        {systemStatus && (
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-regime-flowing animate-pulse" />
            <span>Engine v{systemStatus.engine_version}</span>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpiCards.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className={`card p-4 relative overflow-hidden ${
                kpi.alert ? 'alert-ring' : ''
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="section-label mb-2">{kpi.label}</p>
                  <p className={`text-3xl font-semibold ${kpi.color}`}>
                    {kpi.value}
                  </p>
                </div>
                <div className={`p-2 rounded-lg ${kpi.bgColor}`}>
                  <Icon className={`w-5 h-5 ${kpi.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Status List */}
        <div className="lg:col-span-2 card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Camera Status</h2>
          <div className="space-y-3">
            {Object.values(cameras).length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No cameras available
              </div>
            ) : (
              Object.values(cameras).map((camera) => {
                const cfg = camera.current_regime ? REGIME_CONFIG[camera.current_regime] : null;
                return (
                  <div
                    key={camera.camera_id}
                    className="flex items-center justify-between p-3 rounded-lg bg-surface-elevated border border-surface-border hover:border-cyan/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-border flex items-center justify-center">
                        <Camera className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{camera.location}</p>
                        <p className="text-xs text-slate-500">{camera.camera_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2 py-1 rounded ${cfg ? `${cfg.bgClass} ${cfg.textClass}` : 'bg-surface-border text-slate-500'}`}
                      >
                        {cfg ? cfg.label : 'No Data'}
                      </span>
                      <span className={`w-2 h-2 rounded-full ${camera.online ? 'bg-regime-flowing' : 'bg-slate-600'}`} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Active Warning */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Active Warnings</h2>
          {kpis.turbulent > 0 || kpis.stopAndGo > 0 ? (
            <div className="space-y-3">
              {Object.values(cameras)
                .filter(c => c.current_regime === 'STOP_AND_GO' || c.current_regime === 'TURBULENT')
                .map((camera) => {
                  const cfg = REGIME_CONFIG[camera.current_regime as 'STOP_AND_GO' | 'TURBULENT'];
                  return (
                    <div
                      key={camera.camera_id}
                      className={`p-3 rounded-lg border ${cfg.bgClass} ${cfg.borderClass}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`w-2 h-2 rounded-full ${cfg.dotClass} ${
                          camera.current_regime === 'TURBULENT' ? 'animate-pulse' : ''
                        }`} />
                        <span className={`text-xs font-semibold ${cfg.textClass}`}>
                          {cfg.label}
                        </span>
                      </div>
                      <p className="text-sm text-white">{camera.location}</p>
                      <p className="text-xs text-slate-400 mt-1">{camera.description}</p>
                    </div>
                  );
                })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-regime-flowing-bg mx-auto mb-3 flex items-center justify-center">
                <Activity className="w-6 h-6 text-regime-flowing" />
              </div>
              <p className="text-sm text-slate-400">All systems normal</p>
              <p className="text-xs text-slate-500 mt-1">No active warnings</p>
            </div>
          )}
        </div>
      </div>

      {/* Movement Trend Placeholder */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Movement Trend</h2>
        <div className="h-48 flex items-center justify-center border border-dashed border-surface-border rounded-lg">
          <p className="text-sm text-slate-500">Real-time trend visualization</p>
        </div>
      </div>
    </div>
  );
}
