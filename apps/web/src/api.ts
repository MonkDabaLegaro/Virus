import type { LabSession, ScenarioSummary, SystemStatus } from '@malware-lab/shared-types';

async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(init?.headers ?? {})
    }
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  system: () => json<SystemStatus>('/api/system'),
  scenarios: () => json<ScenarioSummary[]>('/api/scenarios'),
  labs: () => json<LabSession[]>('/api/labs'),
  createLab: (scenarioId: string) =>
    json<LabSession>('/api/labs', {
      method: 'POST',
      body: JSON.stringify({ scenarioId })
    }),
  actOnLab: (labId: string, action: 'prepare' | 'detect' | 'contain' | 'remediate' | 'restore') =>
    json<LabSession>(`/api/labs/${labId}/actions`, {
      method: 'POST',
      body: JSON.stringify({ action })
    })
};
