/**
 * Pravaah Dashboard — Live Monitoring Page
 *
 * 2x2 responsive camera wall with live regime indicators.
 * Shows real-time crowd movement status across all cameras.
 */

import { usePravaahStore } from '@/store/pravaahStore';
import { REGIME_CONFIG } from '@/types/domain';
import { Camera, Clock, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import RegimeBadge from '@/components/ui/RegimeBadge';

export default function LiveMonitoring() {
  const { cameras, cameraStates } = usePravaahStore();

  const cameraList = Object.values(cameras);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Live Monitoring</h1>
          <p className="text-sm text-slate-400 mt-1">Real-time camera wall and crowd status</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2 h-2 rounded-full bg-regime-flowing animate-pulse" />
          <span>Live</span>
        </div>
      </div>

      {/* Camera Wall */}
      {cameraList.length === 0 ? (
        <div className="card p-12 text-center">
          <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No cameras available</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cameraList.map((camera) => {
            const state = cameraStates[camera.camera_id];

            return (
              <Link
                key={camera.camera_id}
                to={`/cameras/${camera.camera_id}`}
                className="card overflow-hidden hover:border-cyan/50 transition-colors group"
              >
                {/* Video/Visualization Placeholder */}
                <div className="relative aspect-video bg-surface-elevated border-b border-surface-border">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                      <p className="text-xs text-slate-500">{state ? 'Live Feed' : 'Awaiting Video'}</p>
                    </div>
                  </div>

                  {/* Regime Overlay */}
                  <div className="absolute top-3 left-3">
                    <RegimeBadge regime={camera.current_regime} size="lg" />
                  </div>

                  {/* Live Badge — reflects whether a video is actually processing */}
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-black/50 backdrop-blur">
                    <span className={`w-2 h-2 rounded-full ${camera.online ? 'bg-regime-flowing animate-pulse' : 'bg-slate-600'}`} />
                    <span className="text-xs text-white font-medium">{camera.online ? 'LIVE' : 'NO SIGNAL'}</span>
                  </div>

                  {/* Movement Overlay (simulated) */}
                  {state && (
                    <div className="absolute bottom-3 left-3 right-3">
                      <div className="flex items-center justify-between text-xs text-slate-300">
                        <span>Density: {(state.aggregate.density * 100).toFixed(0)}%</span>
                        <span>Velocity: {(state.aggregate.velocity * 100).toFixed(0)}%</span>
                      </div>
                      <div className="mt-2 h-1 bg-surface-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cyan/60 transition-all duration-500"
                          style={{ width: `${state.aggregate.flow_coherence * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Camera Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        <h3 className="text-sm font-medium text-white">{camera.location}</h3>
                      </div>
                      <p className="text-xs text-slate-500">{camera.camera_id}</p>
                    </div>
                    <div className="text-right">
                      {state && (
                        <div className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>Frame {state.frame_id}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

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
