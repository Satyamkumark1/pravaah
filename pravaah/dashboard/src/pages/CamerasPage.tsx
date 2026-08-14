/**
 * Pravaah Dashboard — Cameras Page
 *
 * List view of all cameras with their current status and regime.
 */

import { usePravaahStore } from '@/store/pravaahStore';
import { REGIME_CONFIG } from '@/types/domain';
import { Camera, Link as LinkIcon, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import RegimeBadge from '@/components/ui/RegimeBadge';
import VideoDownloadButton from '@/components/ui/VideoDownloadButton';

export default function CamerasPage() {
  const { cameras } = usePravaahStore();
  const cameraList = Object.values(cameras);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Cameras</h1>
          <p className="text-sm text-slate-400 mt-1">All monitored cameras and their status</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative">
            <VideoDownloadButton />
          </div>
          <div className="text-xs text-slate-500">
            {cameraList.length} cameras
          </div>
        </div>
      </div>

      {/* Camera List */}
      {cameraList.length === 0 ? (
        <div className="card p-12 text-center">
          <Camera className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No cameras configured</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="text-left p-4 section-label">Camera</th>
                <th className="text-left p-4 section-label">Location</th>
                <th className="text-left p-4 section-label">Regime</th>
                <th className="text-left p-4 section-label">Risk</th>
                <th className="text-left p-4 section-label">Status</th>
                <th className="text-right p-4 section-label">Actions</th>
              </tr>
            </thead>
            <tbody>
              {cameraList.map((camera) => {
                return (
                  <tr
                    key={camera.camera_id}
                    className="border-b border-surface-border hover:bg-surface-elevated/50 transition-colors"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-surface-border flex items-center justify-center">
                          <Camera className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{camera.camera_id}</p>
                          <p className="text-xs text-slate-500">{camera.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-sm text-slate-300">
                        <MapPin className="w-4 h-4 text-slate-500" />
                        {camera.location}
                      </div>
                    </td>
                    <td className="p-4">
                      <RegimeBadge regime={camera.current_regime} size="sm" />
                    </td>
                    <td className="p-4">
                      <span
                        className={`text-xs font-medium ${
                          camera.current_risk === null ? 'text-slate-500' :
                          camera.current_risk === 'LOW' ? 'text-regime-flowing' :
                          camera.current_risk === 'ELEVATED' ? 'text-regime-stopgo' :
                          camera.current_risk === 'HIGH' ? 'text-risk-high' :
                          'text-regime-turbulent'
                        }`}
                      >
                        {camera.current_risk ?? 'No Data'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${camera.online ? 'bg-regime-flowing' : 'bg-slate-600'}`} />
                        <span className="text-xs text-slate-400">
                          {camera.online ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        to={`/cameras/${camera.camera_id}`}
                        className="inline-flex items-center gap-1.5 text-xs text-cyan hover:text-cyan-bright transition-colors"
                      >
                        <LinkIcon className="w-3 h-3" />
                        View Details
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
