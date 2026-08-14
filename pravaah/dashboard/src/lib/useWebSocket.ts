/**
 * Pravaah Dashboard — WebSocket Client Hook
 *
 * Manages connection to /ws/live, parses typed WSEvents,
 * and dispatches to the Zustand store.
 *
 * Reconnects automatically with exponential backoff (max 30s).
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePravaahStore } from '@/store/pravaahStore';
import type { WSEvent, IncidentSummary } from '@/types/domain';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8000/ws/live';
const MAX_RECONNECT_DELAY_MS = 30_000;
const INITIAL_RECONNECT_DELAY_MS = 1_000;

export function useWebSocket(): void {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectDelayRef = useRef(INITIAL_RECONNECT_DELAY_MS);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const {
    setCameraState,
    setSystemStatus,
    addIncident,
    setWsConnected,
    setWsError,
  } = usePravaahStore();

  const handleMessage = useCallback(
    (raw: string) => {
      let event: WSEvent;
      try {
        event = JSON.parse(raw) as WSEvent;
      } catch {
        // Ignore unparseable messages
        return;
      }

      if (event.type === 'ping') return;

      switch (event.type) {
        case 'camera_state':
          setCameraState(event.payload);
          break;

        case 'system_status':
          setSystemStatus(event.payload);
          break;

        case 'incident_opened': {
          const summary: IncidentSummary = {
            incident_id: event.payload.incident_id,
            camera_id: event.payload.camera_id,
            location: event.payload.camera_id, // will be enriched from camera list
            regime: event.payload.regime,
            risk: event.payload.risk,
            opened_at: event.timestamp,
            closed_at: null,
            acknowledged: false,
            description: event.payload.description,
          };
          addIncident(summary);
          break;
        }

        case 'incident_updated':
        case 'incident_closed':
          // Handled by incident detail page — no global state change needed
          break;

        default:
          break;
      }
    },
    [setCameraState, setSystemStatus, addIncident]
  );

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      setWsError(null);
      reconnectDelayRef.current = INITIAL_RECONNECT_DELAY_MS;
    };

    ws.onmessage = (evt) => {
      handleMessage(evt.data as string);
    };

    ws.onerror = () => {
      setWsError('WebSocket connection error');
    };

    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;

      // Schedule reconnect with backoff
      const delay = reconnectDelayRef.current;
      reconnectDelayRef.current = Math.min(delay * 2, MAX_RECONNECT_DELAY_MS);
      reconnectTimerRef.current = setTimeout(connect, delay);
    };
  }, [handleMessage, setWsConnected, setWsError]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);
}
