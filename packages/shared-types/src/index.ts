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

export interface SampleRegistrationInput {
  sha256: string;
  family: string;
  aliases?: string[];
  sourceReference?: string | null;
}

export interface SampleRecord {
  id: string;
  sha256: string;
  family: string;
  aliases: string[];
  sourceReference: string | null;
  state: 'metadata-only';
  createdAt: string;
}

export interface LabProfile {
  id: string;
  label: string;
  guestOs: string;
  architecture: string;
  cpuCount: number;
  memoryMb: number;
  disposable: true;
  baselineSnapshot: string;
  network: {
    mode: 'internal';
    name: string;
    hostAccess: false;
    internetAccess: false;
  };
  integrations: {
    sharedFolders: false;
    clipboard: false;
    dragAndDrop: false;
    usbPassthrough: false;
  };
}

export interface LabExecutionPlan {
  labId: string;
  scenarioId: string;
  hypervisorId: string | null;
  profile: LabProfile;
  realExecutionEnabled: false;
  steps: string[];
}
