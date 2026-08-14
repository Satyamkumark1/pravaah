/**
 * Pravaah Dashboard — Incidents Page
 *
 * Incident timeline with filters and detail view.
 */

import { useState } from 'react';
import { usePravaahStore } from '@/store/pravaahStore';
import { REGIME_CONFIG } from '@/types/domain';
import { AlertTriangle, Clock, MapPin, Filter, Check } from 'lucide-react';
import RegimeBadge from '@/components/ui/RegimeBadge';

export default function IncidentsPage() {
  const { incidents } = usePravaahStore();
  const [filterRegime, setFilterRegime] = useState<string>('ALL');
  const [filterAcknowledged, setFilterAcknowledged] = useState<string>('ALL');

  const filteredIncidents = incidents.filter(incident => {
    if (filterRegime !== 'ALL' && incident.regime !== filterRegime) return false;
    if (filterAcknowledged === 'ACKNOWLEDGED' && !incident.acknowledged) return false;
    if (filterAcknowledged === 'UNACKNOWLEDGED' && incident.acknowledged) return false;
    return true;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Incidents</h1>
          <p className="text-sm text-slate-400 mt-1">Risk indicator timeline and history</p>
        </div>
        <div className="text-xs text-slate-500">
          {filteredIncidents.length} incidents
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Filter className="w-4 h-4" />
            <span>Filters:</span>
          </div>
          <select
            value={filterRegime}
            onChange={(e) => setFilterRegime(e.target.value)}
            className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan focus:outline-none"
          >
            <option value="ALL">All Regimes</option>
            <option value="FLOWING">Flowing</option>
            <option value="STOP_AND_GO">Stop & Go</option>
            <option value="TURBULENT">Turbulent</option>
          </select>
          <select
            value={filterAcknowledged}
            onChange={(e) => setFilterAcknowledged(e.target.value)}
            className="bg-surface-elevated border border-surface-border rounded-lg px-3 py-1.5 text-xs text-white focus:border-cyan focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="UNACKNOWLEDGED">Unacknowledged</option>
            <option value="ACKNOWLEDGED">Acknowledged</option>
          </select>
        </div>
      </div>

      {/* Incident List */}
      {filteredIncidents.length === 0 ? (
        <div className="card p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No incidents found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIncidents.map((incident) => {
            const cfg = REGIME_CONFIG[incident.regime];
            return (
              <div
                key={incident.incident_id}
                className={`card p-4 border-l-4 ${cfg.borderClass.replace('/30', '')} ${
                  !incident.acknowledged ? 'alert-ring' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <RegimeBadge regime={incident.regime} size="sm" />
                      <span className="text-xs text-slate-500">{incident.incident_id}</span>
                      {!incident.acknowledged && (
                        <span className="px-2 py-0.5 rounded bg-regime-turbulent-bg text-regime-turbulent text-xs font-semibold">
                          NEW
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white mb-1">{incident.description}</p>
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="w-3 h-3" />
                        <span>{incident.location}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(incident.opened_at).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {incident.acknowledged ? (
                      <div className="flex items-center gap-1.5 text-xs text-regime-flowing">
                        <Check className="w-4 h-4" />
                        <span>Acknowledged</span>
                      </div>
                    ) : (
                      <button className="px-3 py-1.5 rounded-lg bg-cyan text-surface text-xs font-semibold hover:bg-cyan-bright transition-colors">
                        Acknowledge
                      </button>
                    )}
                  </div>
                </div>
              </div>
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
