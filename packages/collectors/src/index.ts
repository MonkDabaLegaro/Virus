import type { TelemetryEvent } from '@malware-lab/shared-types';

export type CollectorSource = 'fixture' | 'imported-observation';

export interface CollectorResult {
  collectorId: string;
  source: CollectorSource;
  scenarioId: string;
  events: TelemetryEvent[];
}

export interface TelemetryCollector<Input> {
  readonly id: string;
  readonly source: CollectorSource;
  collect(input: Input): Promise<CollectorResult>;
}

export interface CollectorDescriptor {
  id: string;
  label: string;
  platform: 'any' | 'windows';
  mode: 'replay' | 'import';
  guestExecution: false;
  hostCollection: false;
}

export interface FixtureCollectorInput {
  scenarioId: string;
  events: unknown[];
}

type WindowsProcessObservation = {
  kind: 'process';
  timestamp: string;
  action: 'start' | 'stop';
  pid: number;
  ppid: number | null;
  image: string;
  commandLine?: string;
};

type WindowsFilesystemObservation = {
  kind: 'filesystem';
  timestamp: string;
  action: 'create' | 'modify' | 'rename' | 'delete';
  path: string;
  extension?: string;
};

type WindowsRegistryObservation = {
  kind: 'registry';
  timestamp: string;
  action: 'set-value' | 'delete-value' | 'create-key' | 'delete-key';
  key: string;
  valueName?: string;
};

type WindowsNetworkObservation = {
  kind: 'network';
  timestamp: string;
  action: 'connect' | 'listen';
  protocol: 'tcp' | 'udp';
  destinationIp: string;
  destinationPort: number;
};

export type WindowsObservation =
  | WindowsProcessObservation
  | WindowsFilesystemObservation
  | WindowsRegistryObservation
  | WindowsNetworkObservation;

export interface WindowsObservationCollectorInput {
  scenarioId: string;
  observations: WindowsObservation[];
}

function requireScenarioId(value: string): string {
  const scenarioId = value.trim();
  if (!scenarioId || scenarioId.length > 120) throw new Error('Invalid collector scenario id');
  return scenarioId;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validTimestamp(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 64 && Number.isFinite(Date.parse(value));
}

function validText(value: unknown, max: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max;
}

function validOptionalText(value: unknown, max: number): boolean {
  return value === undefined || (typeof value === 'string' && value.length <= max);
}

function invalidFixture(): never {
  throw new Error('Invalid fixture telemetry event');
}

function validateFixtureEvent(value: unknown): asserts value is TelemetryEvent {
  if (!isRecord(value)) invalidFixture();
  if (!validText(value.id, 200) || !validText(value.scenarioId, 120) || !validTimestamp(value.timestamp) || !validText(value.action, 120) || !Array.isArray(value.tags) || value.tags.some((tag) => typeof tag !== 'string' || tag.length > 128)) invalidFixture();

  if (value.kind === 'process') {
    if (!isRecord(value.process) || !Number.isInteger(value.process.pid) || (value.process.pid as number) < 0 || (value.process.ppid !== null && (!Number.isInteger(value.process.ppid) || (value.process.ppid as number) < 0)) || !validText(value.process.image, 1024) || !validOptionalText(value.process.commandLine, 4096)) invalidFixture();
    return;
  }
  if (value.kind === 'filesystem') {
    if (!isRecord(value.file) || !validText(value.file.path, 4096) || !validOptionalText(value.file.extension, 128)) invalidFixture();
    return;
  }
  if (value.kind === 'registry') {
    if (!isRecord(value.registry) || !validText(value.registry.key, 4096) || !validOptionalText(value.registry.valueName, 1024)) invalidFixture();
    return;
  }
  if (value.kind === 'network') {
    if (!isRecord(value.network) || (value.network.protocol !== 'tcp' && value.network.protocol !== 'udp') || !validText(value.network.destinationIp, 128) || !Number.isInteger(value.network.destinationPort) || (value.network.destinationPort as number) < 1 || (value.network.destinationPort as number) > 65535) invalidFixture();
    return;
  }
  invalidFixture();
}

function validateObservation(observation: WindowsObservation): void {
  if (!validTimestamp(observation.timestamp)) throw new Error('Invalid Windows observation');

  if (observation.kind === 'process') {
    if (!Number.isInteger(observation.pid) || observation.pid < 0 || (observation.ppid !== null && (!Number.isInteger(observation.ppid) || observation.ppid < 0)) || !validText(observation.image, 1024) || !validOptionalText(observation.commandLine, 4096)) {
      throw new Error('Invalid Windows observation');
    }
    return;
  }

  if (observation.kind === 'filesystem') {
    if (!validText(observation.path, 4096) || !validOptionalText(observation.extension, 128)) throw new Error('Invalid Windows observation');
    return;
  }

  if (observation.kind === 'registry') {
    if (!validText(observation.key, 4096) || !validOptionalText(observation.valueName, 1024)) throw new Error('Invalid Windows observation');
    return;
  }

  if (!validText(observation.destinationIp, 128) || !Number.isInteger(observation.destinationPort) || observation.destinationPort < 1 || observation.destinationPort > 65535) {
    throw new Error('Invalid Windows observation');
  }
}

function provenance(tags: string[], marker: string): string[] {
  return [...new Set([...tags, marker])];
}

export class FixtureTelemetryCollector implements TelemetryCollector<FixtureCollectorInput> {
  readonly id = 'fixture';
  readonly source = 'fixture' as const;

  async collect(input: FixtureCollectorInput): Promise<CollectorResult> {
    const scenarioId = requireScenarioId(input.scenarioId);
    if (input.events.length > 5000) throw new Error('Invalid fixture telemetry event');
    const events = input.events.map((value): TelemetryEvent => {
      validateFixtureEvent(value);
      if (value.scenarioId !== scenarioId) throw new Error('Fixture scenario mismatch');
      return { ...value, tags: provenance(value.tags, 'collector:fixture') };
    });
    return { collectorId: this.id, source: this.source, scenarioId, events };
  }
}

export class WindowsObservationCollector implements TelemetryCollector<WindowsObservationCollectorInput> {
  readonly id = 'windows-observation';
  readonly source = 'imported-observation' as const;

  async collect(input: WindowsObservationCollectorInput): Promise<CollectorResult> {
    const scenarioId = requireScenarioId(input.scenarioId);
    if (input.observations.length > 5000) throw new Error('Invalid Windows observation');

    const events = input.observations.map((observation, index): TelemetryEvent => {
      validateObservation(observation);
      const base = {
        id: `${this.id}-${String(index + 1).padStart(4, '0')}`,
        scenarioId,
        timestamp: new Date(observation.timestamp).toISOString(),
        tags: ['collector:windows-observation', 'source:imported-observation']
      };

      if (observation.kind === 'process') {
        return { ...base, kind: 'process', action: observation.action, process: { pid: observation.pid, ppid: observation.ppid, image: observation.image, ...(observation.commandLine ? { commandLine: observation.commandLine } : {}) } };
      }
      if (observation.kind === 'filesystem') {
        return { ...base, kind: 'filesystem', action: observation.action, file: { path: observation.path, ...(observation.extension ? { extension: observation.extension } : {}) } };
      }
      if (observation.kind === 'registry') {
        return { ...base, kind: 'registry', action: observation.action, registry: { key: observation.key, ...(observation.valueName ? { valueName: observation.valueName } : {}) } };
      }
      return { ...base, kind: 'network', action: observation.action, network: { protocol: observation.protocol, destinationIp: observation.destinationIp, destinationPort: observation.destinationPort } };
    });

    return { collectorId: this.id, source: this.source, scenarioId, events };
  }
}

export function listCollectors(): CollectorDescriptor[] {
  return [
    { id: 'fixture', label: 'Synthetic Fixture Replay', platform: 'any', mode: 'replay', guestExecution: false, hostCollection: false },
    { id: 'windows-observation', label: 'Windows Observation Import', platform: 'windows', mode: 'import', guestExecution: false, hostCollection: false }
  ];
}
