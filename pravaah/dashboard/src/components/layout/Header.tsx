import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Activity } from 'lucide-react';
import { usePravaahStore } from '@/store/pravaahStore';
import { clsx } from 'clsx';

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <span className="font-mono text-xs text-slate-400 tabular-nums">
      {time.toLocaleTimeString('en-GB', { hour12: false })}
    </span>
  );
}

export default function Header() {
  const { wsConnected, systemStatus } = usePravaahStore();

  return (
    <header className="h-14 shrink-0 flex items-center justify-between px-6 border-b border-surface-border bg-surface/90 backdrop-blur-sm">
      {/* Left — venue name */}
      <div className="flex items-center gap-3">
        <div>
          <h1 className="text-sm font-semibold text-white tracking-wide">
            Operations Center
          </h1>
          <p className="text-[10px] text-slate-500 tracking-widest uppercase">
            Festival Ground Alpha · Edge Node A1
          </p>
        </div>
      </div>

      {/* Right — status indicators */}
      <div className="flex items-center gap-5">
        {/* Edge node status */}
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-regime-flowing" />
          <span className="text-xs text-slate-400">
            {systemStatus?.edge_status ?? 'CONNECTING'}
          </span>
        </div>

        {/* WS connection */}
        <div
          className={clsx(
            'flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
            wsConnected
              ? 'bg-regime-flowing-bg text-regime-flowing border-regime-flowing/20'
              : 'bg-regime-turbulent-bg text-regime-turbulent border-regime-turbulent/20'
          )}
          title={wsConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
          aria-label={wsConnected ? 'WebSocket connected' : 'WebSocket disconnected'}
        >
          {wsConnected ? (
            <Wifi className="w-3 h-3" aria-hidden />
          ) : (
            <WifiOff className="w-3 h-3" aria-hidden />
          )}
          <span>{wsConnected ? 'LIVE' : 'OFFLINE'}</span>
        </div>

        {/* Clock */}
        <Clock />
      </div>
    </header>
  );
}
