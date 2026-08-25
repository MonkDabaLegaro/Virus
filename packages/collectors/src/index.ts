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
  events: TelemetryEvent[];
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

function validTimestamp(value: string): boolean {
  return value.length <= 64 && Number.isFinite(Date.parse(value));
}

function validText(value: string, max: number): boolean {
  return value.trim().length > 0 && value.length <= max;
}

function validateObservation(observation: WindowsObservation): void {
  if (!validTimestamp(observation.timestamp)) throw new Error('Invalid Windows observation');

  if (observation.kind === 'process') {
    if (!Number.isInteger(observation.pid) || observation.pid < 0 || (observation.ppid !== null && (!Number.isInteger(observation.ppid) || observation.ppid < 0)) || !validText(observation.image, 1024) || (observation.commandLine !== undefined && observation.commandLine.length > 4096)) {
      throw new Error('Invalid Windows observation');
    }
    return;
  }

  if (observation.kind === 'filesystem') {
    if (!validText(observation.path, 4096) || (observation.extension !== undefined && observation.extension.length > 128)) throw new Error('Invalid Windows observation');
    return;
  }

  if (observation.kind === 'registry') {
    if (!validText(observation.key, 4096) || (observation.valueName !== undefined && observation.valueName.length > 1024)) throw new Error('Invalid Windows observation');
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
    const events = input.events.map((event) => {
      if (event.scenarioId !== scenarioId) throw new Error('Fixture scenario mismatch');
      return { ...event, tags: provenance(event.tags, 'collector:fixture') };
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
        kind: observation.kind,
        action: observation.action,
        tags: ['collector:windows-observation', 'source:imported-observation']
      } as const;

      if (observation.kind === 'process') {
        return { ...base, kind: 'process', process: { pid: observation.pid, ppid: observation.ppid, image: observation.image, ...(observation.commandLine ? { commandLine: observation.commandLine } : {}) } };
      }
      if (observation.kind === 'filesystem') {
        return { ...base, kind: 'filesystem', file: { path: observation.path, ...(observation.extension ? { extension: observation.extension } : {}) } };
      }
      if (observation.kind === 'registry') {
        return { ...base, kind: 'registry', registry: { key: observation.key, ...(observation.valueName ? { valueName: observation.valueName } : {}) } };
      }
      return { ...base, kind: 'network', network: { protocol: observation.protocol, destinationIp: observation.destinationIp, destinationPort: observation.destinationPort } };
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
