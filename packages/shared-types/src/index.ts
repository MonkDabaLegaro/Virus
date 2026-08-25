export type ScenarioCategory = 'ransomware' | 'spyware' | 'trojan' | 'worm';
export type Risk = 'low' | 'medium' | 'high' | 'critical';
export type LabState = 'idle' | 'prepared' | 'running' | 'detected' | 'contained' | 'remediating' | 'clean';
export type TelemetryKind = 'process' | 'filesystem' | 'registry' | 'network';
export type DetectionSeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type AttackConfidence = 'low' | 'medium' | 'high';

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
  network: { mode: 'internal'; name: string; hostAccess: false; internetAccess: false };
  integrations: { sharedFolders: false; clipboard: false; dragAndDrop: false; usbPassthrough: false };
}

export interface LabExecutionPlan {
  labId: string;
  scenarioId: string;
  hypervisorId: string | null;
  profile: LabProfile;
  realExecutionEnabled: false;
  steps: string[];
}

export type VmPowerState = 'powered-off' | 'running' | 'paused' | 'saved' | 'unknown';
export type VmNetworkMode = 'internal' | 'host-only' | 'nat' | 'bridged' | 'not-attached' | 'unknown';
export interface VmDescriptor { providerId: 'virtualbox' | 'hyper-v'; vmId: string; name: string; powerState: VmPowerState }
export interface VmNetworkAdapter { slot: string; mode: VmNetworkMode; networkName: string | null }
export interface VmInspection extends VmDescriptor {
  cpuCount: number | null;
  memoryMb: number | null;
  snapshots: string[];
  networkAdapters: VmNetworkAdapter[];
  integrations: { sharedFolders: boolean | null; clipboard: boolean | null; dragAndDrop: boolean | null; usbPassthrough: boolean | null };
}
export interface VmValidationCheck { id: string; label: string; status: 'pass' | 'fail' | 'unknown'; detail: string }
export interface VmValidationReport { vm: VmInspection; profileId: string; safeToRestore: boolean; safeForFutureExecution: boolean; checks: VmValidationCheck[] }
export interface VmRestoreResult { providerId: 'virtualbox' | 'hyper-v'; vmId: string; snapshot: string; restored: true; message: string }

export interface TelemetryEvent {
  id: string;
  scenarioId: string;
  timestamp: string;
  kind: TelemetryKind;
  action: string;
  process?: { pid: number; ppid: number | null; image: string; commandLine?: string };
  file?: { path: string; extension?: string };
  registry?: { key: string; valueName?: string };
  network?: { protocol: 'tcp' | 'udp'; destinationIp: string; destinationPort: number };
  tags: string[];
}

export interface DetectionFinding {
  id: string;
  ruleId: string;
  title: string;
  severity: DetectionSeverity;
  eventIds: string[];
  rationale: string;
}

export interface DetectionCorrelation {
  id: string;
  title: string;
  severity: DetectionSeverity;
  findingIds: string[];
  eventIds: string[];
  rationale: string;
}

export interface TelemetrySummary {
  total: number;
  byKind: Record<TelemetryKind, number>;
  detections: number;
  highestSeverity: DetectionSeverity | null;
}

export interface ProcessLifecycle {
  pid: number;
  parentPid: number | null;
  image: string;
  commandLine?: string;
  startedAt: string | null;
  stoppedAt: string | null;
  childPids: number[];
  eventIds: string[];
}

export interface FilesystemDelta {
  path: string;
  extension: string | null;
  action: string;
  firstSeenAt: string;
  lastSeenAt: string;
  eventIds: string[];
}

export interface RegistryDelta {
  key: string;
  valueName: string | null;
  action: string;
  firstSeenAt: string;
  lastSeenAt: string;
  eventIds: string[];
}

export interface NetworkFlow {
  protocol: 'tcp' | 'udp';
  destinationIp: string;
  destinationPort: number;
  count: number;
  firstSeenAt: string;
  lastSeenAt: string;
  eventIds: string[];
}

export type IndicatorType = 'ip' | 'port' | 'file-extension' | 'registry-key' | 'process-image';
export interface EvidenceIndicator { type: IndicatorType; value: string; eventIds: string[] }

export interface AttackMapping {
  techniqueId: 'T1486' | 'T1021.002' | 'T1547.001';
  techniqueName: string;
  tactic: 'Impact' | 'Lateral Movement' | 'Persistence';
  confidence: AttackConfidence;
  findingIds: string[];
  eventIds: string[];
  rationale: string;
}

export interface AnalysisTimelineEntry {
  id: string;
  timestamp: string;
  kind: 'telemetry' | 'detection' | 'correlation';
  title: string;
  detail: string;
  severity?: DetectionSeverity;
  eventIds: string[];
}

export interface AnalysisReport {
  scenarioId: string;
  generatedAt: string;
  summary: { events: number; findings: number; indicators: number; attackMappings: number };
  processTree: ProcessLifecycle[];
  filesystemDiff: FilesystemDelta[];
  registryDiff: RegistryDelta[];
  networkFlows: NetworkFlow[];
  indicators: EvidenceIndicator[];
  attackMappings: AttackMapping[];
  findings: DetectionFinding[];
  correlations: DetectionCorrelation[];
  timeline: AnalysisTimelineEntry[];
}
