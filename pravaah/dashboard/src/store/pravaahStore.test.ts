import { describe, it, expect, beforeEach } from 'vitest';
import { usePravaahStore } from './pravaahStore';
import type { CameraStatePayload } from '@/types/domain';

function makePayload(overrides: Partial<CameraStatePayload> = {}): CameraStatePayload {
  return {
    camera_id: 'CAM-01',
    frame_id: 1,
    regime: 'FLOWING',
    risk: 'LOW',
    warning_window_ms: null,
    aggregate: {
      density: 0.3,
      velocity: 0.5,
      pressure: 0.1,
      direction_entropy: 0.15,
      flow_coherence: 0.85,
    },
    cells: [],
    ...overrides,
  };
}

const initialState = usePravaahStore.getState();

beforeEach(() => {
  usePravaahStore.setState(initialState, true);
});

describe('pravaahStore setCameraState', () => {
  it('records the latest payload and appends to metrics history', () => {
    usePravaahStore.getState().setCameraState(makePayload({ frame_id: 1 }));
    usePravaahStore.getState().setCameraState(makePayload({ frame_id: 2 }));

    const state = usePravaahStore.getState();
    expect(state.cameraStates['CAM-01'].frame_id).toBe(2);
    expect(state.metricsHistory['CAM-01']).toHaveLength(2);
  });

  it('caps metrics history at 60 points per camera', () => {
    for (let i = 0; i < 75; i++) {
      usePravaahStore.getState().setCameraState(makePayload({ frame_id: i }));
    }
    expect(usePravaahStore.getState().metricsHistory['CAM-01']).toHaveLength(60);
  });

  it('does not create a camera metadata entry that was never set', () => {
    usePravaahStore.getState().setCameraState(makePayload());
    expect(usePravaahStore.getState().cameras['CAM-01']).toBeUndefined();
  });
});

describe('pravaahStore addIncident', () => {
  it('caps incidents at 100, newest first', () => {
    for (let i = 0; i < 120; i++) {
      usePravaahStore.getState().addIncident({
        incident_id: `INC-${i}`,
        camera_id: 'CAM-01',
        location: 'CAM-01',
        regime: 'TURBULENT',
        risk: 'CRITICAL',
        opened_at: new Date().toISOString(),
        closed_at: null,
        acknowledged: false,
        description: 'test',
      });
    }
    const incidents = usePravaahStore.getState().incidents;
    expect(incidents).toHaveLength(100);
    expect(incidents[0].incident_id).toBe('INC-119');
  });
});
