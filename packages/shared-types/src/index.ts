export type ScenarioCategory = 'ransomware' | 'spyware' | 'trojan' | 'worm';
export type Risk = 'low' | 'medium' | 'high' | 'critical';
export type LabState = 'idle' | 'prepared' | 'running' | 'detected' | 'contained' | 'remediating' | 'clean';
export type VmPowerState = 'powered-off' | 'running' | 'paused' | 'saved' | 'unknown';
export type VmNetworkMode = 'internal' | 'host-only' | 'nat' | 'bridged' | 'not-attached' | 'unknown';

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
  vmName: string;
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

export interface VmDescriptor {
  providerId: 'virtualbox' | 'hyper-v';
  vmId: string;
  name: string;
  powerState: VmPowerState;
}

export interface VmNetworkAdapter {
  slot: string;
  mode: VmNetworkMode;
  networkName: string | null;
}

export interface VmInspection extends VmDescriptor {
  cpuCount: number | null;
  memoryMb: number | null;
  snapshots: string[];
  networkAdapters: VmNetworkAdapter[];
  integrations: {
    sharedFolders: boolean | null;
    clipboard: boolean | null;
    dragAndDrop: boolean | null;
    usbPassthrough: boolean | null;
  };
}

export interface VmValidationCheck {
  id: 'powered-off' | 'baseline-snapshot' | 'isolated-network' | 'shared-folders-disabled' | 'clipboard-disabled' | 'drag-drop-disabled' | 'usb-disabled' | 'cpu-capacity' | 'memory-capacity';
  label: string;
  status: 'pass' | 'fail' | 'unknown';
  detail: string;
}

export interface VmValidationReport {
  vm: VmInspection;
  profileId: string;
  safeToRestore: boolean;
  safeForFutureExecution: boolean;
  checks: VmValidationCheck[];
}

export interface VmRestoreResult {
  providerId: 'virtualbox' | 'hyper-v';
  vmId: string;
  snapshot: string;
  restored: true;
  message: string;
}
