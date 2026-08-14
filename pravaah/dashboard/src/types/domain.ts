/**
 * Pravaah Dashboard — Shared Domain Types
 *
 * These types mirror the Python Pydantic schemas exactly.
 * The event contract version is 1. Do not change field names
 * without also updating the backend and incrementing the version.
 */

// ---------------------------------------------------------------------------
// Regime & Risk — centralized, never duplicated
// ---------------------------------------------------------------------------

export type Regime = 'FLOWING' | 'STOP_AND_GO' | 'TURBULENT';

export type RiskLevel = 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

// ---------------------------------------------------------------------------
// Regime display configuration — color/label/icon mapping lives here only
// ---------------------------------------------------------------------------

export const REGIME_CONFIG = {
  FLOWING: {
    label: 'Flowing',
    color: '#22c55e',
    dimColor: '#16a34a',
    bgClass: 'bg-regime-flowing-bg',
    textClass: 'text-regime-flowing',
    borderClass: 'border-regime-flowing/30',
    dotClass: 'bg-regime-flowing',
    description: 'Stable, coherent crowd movement',
  },
  STOP_AND_GO: {
    label: 'Stop & Go',
    color: '#f59e0b',
    dimColor: '#d97706',
    bgClass: 'bg-regime-stopgo-bg',
    textClass: 'text-regime-stopgo',
    borderClass: 'border-regime-stopgo/30',
    dotClass: 'bg-regime-stopgo',
    description: 'Intermittent movement — warning window active',
  },
  TURBULENT: {
    label: 'Turbulent',
    color: '#ef4444',
    dimColor: '#dc2626',
    bgClass: 'bg-regime-turbulent-bg',
    textClass: 'text-regime-turbulent',
    borderClass: 'border-regime-turbulent/30',
    dotClass: 'bg-regime-turbulent',
    description: 'Chaotic movement — immediate review required',
  },
} as const satisfies Record<Regime, {
  label: string;
  color: string;
  dimColor: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  dotClass: string;
  description: string;
}>;

export const RISK_CONFIG = {
  LOW: { label: 'Low', color: '#22c55e', textClass: 'text-risk-low' },
  ELEVATED: { label: 'Elevated', color: '#f59e0b', textClass: 'text-risk-elevated' },
  HIGH: { label: 'High', color: '#f97316', textClass: 'text-risk-high' },
  CRITICAL: { label: 'Critical', color: '#ef4444', textClass: 'text-risk-critical' },
} as const satisfies Record<RiskLevel, { label: string; color: string; textClass: string }>;

// ---------------------------------------------------------------------------
// Feature metrics
// ---------------------------------------------------------------------------

export interface AggregateFeatures {
  density: number;          // 0–1
  velocity: number;         // 0–1
  pressure: number;         // 0–1
  direction_entropy: number; // 0–1
  flow_coherence: number;   // 0–1
}

export interface CellFeatures {
  row: number;
  col: number;
  regime: Regime;
  density: number;
  velocity: number;
  pressure: number;
  direction_entropy: number;
}

// ---------------------------------------------------------------------------
// Camera
// ---------------------------------------------------------------------------

export interface CameraMetadata {
  camera_id: string;
  location: string;
  description: string;
  current_regime: Regime | null;  // null until a video has been processed
  current_risk: RiskLevel | null;
  online: boolean;
}

export interface CameraStatePayload {
  camera_id: string;
  frame_id: number;
  regime: Regime;
  risk: RiskLevel;
  warning_window_ms: number | null;
  aggregate: AggregateFeatures;
  cells: CellFeatures[];
}

// ---------------------------------------------------------------------------
// Incidents
// ---------------------------------------------------------------------------

export interface IncidentPayload {
  incident_id: string;
  camera_id: string;
  regime: Regime;
  risk: RiskLevel;
  description: string;
  acknowledged: boolean;
}

export interface IncidentSummary {
  incident_id: string;
  camera_id: string;
  location: string;
  regime: Regime;
  risk: RiskLevel;
  opened_at: string;
  closed_at: string | null;
  acknowledged: boolean;
  description: string;
}

// ---------------------------------------------------------------------------
// Video risk summary — aggregated result of one uploaded-video run
// ---------------------------------------------------------------------------

export interface RegimeCounts {
  FLOWING: number;
  STOP_AND_GO: number;
  TURBULENT: number;
}

export interface VideoSummary {
  camera_id: string;
  status: 'PROCESSING' | 'COMPLETE';
  frames_processed: number;
  regime_counts: RegimeCounts;
  peak_regime: Regime;
  peak_risk: RiskLevel;
  incidents_triggered: number;
  started_at: string;
  completed_at: string | null;
}

// ---------------------------------------------------------------------------
// System status
// ---------------------------------------------------------------------------

export interface SystemStatusPayload {
  edge_status: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  processing_fps: number;
  ws_clients: number;
  last_heartbeat: string;
  engine_version: string;
  uptime_seconds: number;
  cameras_online: number;
  cameras_total: number;
}

// ---------------------------------------------------------------------------
// WebSocket event envelope — discriminated union
// ---------------------------------------------------------------------------

export type WSEvent =
  | { type: 'camera_state'; version: number; timestamp: string; payload: CameraStatePayload }
  | { type: 'incident_opened'; version: number; timestamp: string; payload: IncidentPayload }
  | { type: 'incident_updated'; version: number; timestamp: string; payload: IncidentPayload }
  | { type: 'incident_closed'; version: number; timestamp: string; payload: IncidentPayload }
  | { type: 'system_status'; version: number; timestamp: string; payload: SystemStatusPayload }
  | { type: 'ping' };
