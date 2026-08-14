/**
 * Pravaah Dashboard — Global State Store (Zustand)
 *
 * Single source of truth for all live data consumed by the UI.
 * No business logic — state is mutated by the WebSocket consumer only.
 */

import { create } from 'zustand';
import type {
  CameraMetadata,
  CameraStatePayload,
  IncidentSummary,
  SystemStatusPayload,
  Regime,
} from '@/types/domain';

// ---------------------------------------------------------------------------
// Historical data point for charts
// ---------------------------------------------------------------------------

export interface MetricDataPoint {
  timestamp: number;  // epoch ms
  density: number;
  velocity: number;
  pressure: number;
  direction_entropy: number;
  flow_coherence: number;
  regime: Regime;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

interface PravaahState {
  // Camera state
  cameras: Record<string, CameraMetadata>;
  cameraStates: Record<string, CameraStatePayload>;
  setCameraState: (payload: CameraStatePayload) => void;
  setCameras: (cameras: CameraMetadata[]) => void;

  // Metrics history (last 60 points per camera)
  metricsHistory: Record<string, MetricDataPoint[]>;

  // Incidents
  incidents: IncidentSummary[];
  setIncidents: (incidents: IncidentSummary[]) => void;
  addIncident: (incident: IncidentSummary) => void;

  // System status
  systemStatus: SystemStatusPayload | null;
  setSystemStatus: (status: SystemStatusPayload) => void;

  // WebSocket connection status
  wsConnected: boolean;
  setWsConnected: (connected: boolean) => void;
  wsError: string | null;
  setWsError: (error: string | null) => void;
}

const MAX_HISTORY_POINTS = 60;

export const usePravaahStore = create<PravaahState>((set) => ({
  cameras: {},
  cameraStates: {},
  metricsHistory: {},
  incidents: [],
  systemStatus: null,
  wsConnected: false,
  wsError: null,

  setCameraState: (payload) =>
    set((state) => {
      const point: MetricDataPoint = {
        timestamp: Date.now(),
        ...payload.aggregate,
        regime: payload.regime,
      };

      const history = state.metricsHistory[payload.camera_id] ?? [];
      const newHistory = [...history, point].slice(-MAX_HISTORY_POINTS);

      return {
        cameraStates: {
          ...state.cameraStates,
          [payload.camera_id]: payload,
        },
        // Also update camera metadata regime/risk
        cameras: state.cameras[payload.camera_id]
          ? {
              ...state.cameras,
              [payload.camera_id]: {
                ...state.cameras[payload.camera_id],
                current_regime: payload.regime,
                current_risk: payload.risk,
              },
            }
          : state.cameras,
        metricsHistory: {
          ...state.metricsHistory,
          [payload.camera_id]: newHistory,
        },
      };
    }),

  setCameras: (cameras) =>
    set({
      cameras: Object.fromEntries(cameras.map((c) => [c.camera_id, c])),
    }),

  setIncidents: (incidents) => set({ incidents }),

  addIncident: (incident) =>
    set((state) => ({
      incidents: [incident, ...state.incidents].slice(0, 100),
    })),

  setSystemStatus: (systemStatus) => set({ systemStatus }),

  setWsConnected: (wsConnected) => set({ wsConnected }),
  setWsError: (wsError) => set({ wsError }),
}));
