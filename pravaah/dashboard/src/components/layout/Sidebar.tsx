import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Video,
  Camera,
  AlertTriangle,
  BarChart3,
  Server,
  Waves,
} from 'lucide-react';
import { usePravaahStore } from '@/store/pravaahStore';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { to: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { to: '/live', label: 'Live Monitoring', icon: Video },
  { to: '/cameras', label: 'Cameras', icon: Camera },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/system', label: 'System', icon: Server },
] as const;

export default function Sidebar() {
  const { incidents, cameraStates } = usePravaahStore();
  const location = useLocation();

  const activeAlerts = incidents.filter((i) => !i.acknowledged && !i.closed_at).length;
  const turbulentCams = Object.values(cameraStates).filter(
    (s) => s.regime === 'TURBULENT'
  ).length;

  return (
    <aside className="w-56 shrink-0 flex flex-col border-r border-surface-border bg-surface/80 backdrop-blur-sm">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-cyan/10 border border-cyan/30 flex items-center justify-center">
          <Waves className="w-4 h-4 text-cyan" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-wider text-white">PRAVAAH</span>
          <p className="text-[9px] text-slate-500 tracking-widest uppercase">Crowd Intelligence</p>
        </div>
      </div>

      {/* Turbulent alert strip */}
      {turbulentCams > 0 && (
        <div className="mx-3 mt-3 px-3 py-2 rounded-lg bg-regime-turbulent-bg border border-regime-turbulent/30 flex items-center gap-2 alert-ring">
          <span className="status-dot bg-regime-turbulent animate-pulse" />
          <span className="text-xs text-regime-turbulent font-medium">
            {turbulentCams} turbulent {turbulentCams === 1 ? 'camera' : 'cameras'}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => {
          const isActive = location.pathname === to || (to !== '/' && location.pathname.startsWith(to));

          return (
            <NavLink
              key={to}
              to={to}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group relative',
                isActive
                  ? 'bg-cyan/10 text-cyan border border-cyan/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-surface-elevated'
              )}
            >
              <Icon
                className={clsx(
                  'w-4 h-4 shrink-0 transition-colors',
                  isActive ? 'text-cyan' : 'text-slate-500 group-hover:text-slate-300'
                )}
              />
              <span>{label}</span>
              {label === 'Incidents' && activeAlerts > 0 && (
                <span className="ml-auto px-1.5 py-0.5 text-[10px] font-bold bg-regime-turbulent text-white rounded-full">
                  {activeAlerts}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom — privacy notice */}
      <div className="px-4 py-4 border-t border-surface-border">
        <p className="text-[9px] text-slate-600 leading-relaxed">
          Privacy-preserving · No identity tracking · Edge-first inference
        </p>
      </div>
    </aside>
  );
}
