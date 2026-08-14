/**
 * Pravaah Dashboard — API Client
 *
 * Thin wrappers over the FastAPI REST endpoints.
 * No business logic here — just typed fetch calls.
 */

import type {
  CameraMetadata,
  IncidentSummary,
  VideoSummary,
} from '@/types/domain';

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000';

async function parseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const body = await response.json().catch(() => ({})) as Record<string, unknown>;
    const errMsg =
      (body as { error?: { message?: string } }).error?.message ??
      `Request failed: ${response.status}`;
    throw new Error(errMsg);
  }

  return response.json() as Promise<T>;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  return parseResponse<T>(response);
}

// No Content-Type here on purpose — the browser sets the multipart boundary
// itself for FormData; setting it manually breaks upload parsing.
async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, { method: 'POST', body: formData });
  return parseResponse<T>(response);
}

export const api = {
  health: () => apiFetch<{ status: string; engine_version: string }>('/health'),

  getCameras: () => apiFetch<CameraMetadata[]>('/api/cameras'),

  getCamera: (cameraId: string) =>
    apiFetch<CameraMetadata>(`/api/cameras/${cameraId}`),

  getIncidents: () => apiFetch<IncidentSummary[]>('/api/incidents'),

  uploadCameraVideo: (cameraId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiUpload<{ status: string; camera_id: string }>(`/api/cameras/${cameraId}/video`, formData);
  },

  stopCameraVideo: (cameraId: string) =>
    apiFetch<{ status: string }>(`/api/cameras/${cameraId}/video/stop`, { method: 'POST' }),

  getVideoSummary: (cameraId: string) =>
    apiFetch<VideoSummary>(`/api/cameras/${cameraId}/video/summary`),
};
