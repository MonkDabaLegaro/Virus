export type ScenarioCategory = 'ransomware' | 'spyware' | 'trojan' | 'worm';
export type Risk = 'low' | 'medium' | 'high' | 'critical';
export type LabState = 'idle' | 'prepared' | 'running' | 'detected' | 'contained' | 'remediating' | 'clean';

export interface ScenarioSummary {
  id: string;
  name: string;
  category: ScenarioCategory;
  year: number;
  platform: string;
  risk: Risk;
  description: string;
  executionPolicy: 'vm-only';
}

export interface LabSession {
  id: string;
  scenarioId: string;
  scenarioName: string;
  state: LabState;
  createdAt: string;
  updatedAt: string;
  vmName: string | null;
  snapshot: string | null;
}

export interface HypervisorStatus {
  id: string;
  label: string;
  available: boolean;
  version?: string;
}

export interface SystemStatus {
  host: { platform: string; architecture: string; hostname: string };
  mode: 'local-only';
  networkPolicy: 'isolated-lab-only';
  realExecutionEnabled: boolean;
  hypervisors: HypervisorStatus[];
}
