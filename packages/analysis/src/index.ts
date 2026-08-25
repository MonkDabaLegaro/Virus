import type {
  AnalysisReport,
  AnalysisTimelineEntry,
  AttackMapping,
  DetectionCorrelation,
  DetectionFinding,
  EvidenceIndicator,
  FilesystemDelta,
  IndicatorType,
  NetworkFlow,
  ProcessLifecycle,
  RegistryDelta,
  TelemetryEvent
} from '@malware-lab/shared-types';

const attackByRule: Record<string, Omit<AttackMapping, 'findingIds' | 'eventIds'>> = {
  'LAB-RANSOM-001': {
    techniqueId: 'T1486',
    techniqueName: 'Data Encrypted for Impact',
    tactic: 'Impact',
    confidence: 'high',
    rationale: 'Ransomware-style file renames are consistent with data encrypted for impact.'
  },
  'LAB-NET-001': {
    techniqueId: 'T1021.002',
    techniqueName: 'SMB/Windows Admin Shares',
    tactic: 'Lateral Movement',
    confidence: 'low',
    rationale: 'TCP/445 is contextual SMB evidence only; the destination port alone does not prove use of admin shares.'
  },
  'LAB-REG-001': {
    techniqueId: 'T1547.001',
    techniqueName: 'Registry Run Keys / Startup Folder',
    tactic: 'Persistence',
    confidence: 'high',
    rationale: 'The observed Run-key modification directly matches the ATT&CK sub-technique.'
  }
};

export function buildProcessTree(events: TelemetryEvent[]): ProcessLifecycle[] {
  const byPid = new Map<number, ProcessLifecycle>();
  for (const event of events.filter((item) => item.kind === 'process' && item.process)) {
    const process = event.process!;
    const current = byPid.get(process.pid) ?? {
      pid: process.pid,
      parentPid: process.ppid,
      image: process.image,
      ...(process.commandLine ? { commandLine: process.commandLine } : {}),
      startedAt: null,
      stoppedAt: null,
      childPids: [],
      eventIds: []
    };
    current.image = process.image || current.image;
    current.parentPid = process.ppid ?? current.parentPid;
    if (process.commandLine) current.commandLine = process.commandLine;
    if (event.action === 'start') current.startedAt = event.timestamp;
    if (event.action === 'stop') current.stoppedAt = event.timestamp;
    current.eventIds.push(event.id);
    byPid.set(process.pid, current);
  }
  for (const node of byPid.values()) {
    if (node.parentPid !== null && byPid.has(node.parentPid)) byPid.get(node.parentPid)!.childPids.push(node.pid);
  }
  return [...byPid.values()].sort((a, b) => (a.startedAt ?? '').localeCompare(b.startedAt ?? ''));
}

export function buildFilesystemDiff(events: TelemetryEvent[]): FilesystemDelta[] {
  return events.filter((event) => event.kind === 'filesystem' && event.file).map((event) => ({
    path: event.file!.path,
    extension: event.file!.extension ?? null,
    action: event.action,
    firstSeenAt: event.timestamp,
    lastSeenAt: event.timestamp,
    eventIds: [event.id]
  }));
}

export function buildRegistryDiff(events: TelemetryEvent[]): RegistryDelta[] {
  return events.filter((event) => event.kind === 'registry' && event.registry).map((event) => ({
    key: event.registry!.key,
    valueName: event.registry!.valueName ?? null,
    action: event.action,
    firstSeenAt: event.timestamp,
    lastSeenAt: event.timestamp,
    eventIds: [event.id]
  }));
}

export function buildNetworkFlows(events: TelemetryEvent[]): NetworkFlow[] {
  const flows = new Map<string, NetworkFlow>();
  const networkEvents = events.filter((event) => event.kind === 'network' && event.network).sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  for (const event of networkEvents) {
    const network = event.network!;
    const key = `${network.protocol}|${network.destinationIp}|${network.destinationPort}`;
    const flow = flows.get(key) ?? {
      protocol: network.protocol,
      destinationIp: network.destinationIp,
      destinationPort: network.destinationPort,
      count: 0,
      firstSeenAt: event.timestamp,
      lastSeenAt: event.timestamp,
      eventIds: []
    };
    flow.count += 1;
    flow.lastSeenAt = event.timestamp;
    flow.eventIds.push(event.id);
    flows.set(key, flow);
  }
  return [...flows.values()].sort((a, b) => a.firstSeenAt.localeCompare(b.firstSeenAt));
}

function addIndicator(map: Map<string, EvidenceIndicator>, type: IndicatorType, value: string, eventId: string): void {
  const key = `${type}|${value}`;
  const current = map.get(key) ?? { type, value, eventIds: [] };
  if (!current.eventIds.includes(eventId)) current.eventIds.push(eventId);
  map.set(key, current);
}

export function extractIndicators(events: TelemetryEvent[]): EvidenceIndicator[] {
  const indicators = new Map<string, EvidenceIndicator>();
  for (const event of events) {
    if (event.process?.image) addIndicator(indicators, 'process-image', event.process.image, event.id);
    if (event.file?.extension) addIndicator(indicators, 'file-extension', event.file.extension, event.id);
    if (event.registry?.key) addIndicator(indicators, 'registry-key', event.registry.key, event.id);
    if (event.network?.destinationIp) addIndicator(indicators, 'ip', event.network.destinationIp, event.id);
    if (event.network?.destinationPort !== undefined) addIndicator(indicators, 'port', String(event.network.destinationPort), event.id);
  }
  return [...indicators.values()];
}

export function buildAttackMappings(findings: DetectionFinding[]): AttackMapping[] {
  return findings.flatMap((finding) => {
    const mapping = attackByRule[finding.ruleId];
    return mapping ? [{ ...mapping, findingIds: [finding.id], eventIds: [...finding.eventIds] }] : [];
  });
}

function eventTitle(event: TelemetryEvent): string {
  if (event.kind === 'process') return `${event.action} process ${event.process?.image ?? ''}`;
  if (event.kind === 'filesystem') return `${event.action} file ${event.file?.path ?? ''}`;
  if (event.kind === 'registry') return `${event.action} registry ${event.registry?.key ?? ''}`;
  return `${event.action} ${event.network?.protocol ?? ''} ${event.network?.destinationIp ?? ''}:${event.network?.destinationPort ?? ''}`;
}

export function buildTimeline(events: TelemetryEvent[], findings: DetectionFinding[], correlations: DetectionCorrelation[] = []): AnalysisTimelineEntry[] {
  const byId = new Map(events.map((event) => [event.id, event]));
  const entries: AnalysisTimelineEntry[] = events.map((event) => ({
    id: `timeline-${event.id}`,
    timestamp: event.timestamp,
    kind: 'telemetry',
    title: eventTitle(event),
    detail: event.kind,
    eventIds: [event.id]
  }));
  for (const finding of findings) {
    const timestamp = finding.eventIds.map((id) => byId.get(id)?.timestamp).filter((value): value is string => Boolean(value)).sort()[0];
    if (timestamp) entries.push({ id: `timeline-${finding.id}`, timestamp, kind: 'detection', title: finding.title, detail: finding.rationale, severity: finding.severity, eventIds: [...finding.eventIds] });
  }
  for (const correlation of correlations) {
    const timestamp = correlation.eventIds.map((id) => byId.get(id)?.timestamp).filter((value): value is string => Boolean(value)).sort()[0];
    if (timestamp) entries.push({ id: `timeline-${correlation.id}`, timestamp, kind: 'correlation', title: correlation.title, detail: correlation.rationale, severity: correlation.severity, eventIds: [...correlation.eventIds] });
  }
  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp) || a.kind.localeCompare(b.kind));
}

export function buildAnalysisReport(
  scenarioId: string,
  events: TelemetryEvent[],
  findings: DetectionFinding[],
  generatedAt = new Date().toISOString(),
  correlations: DetectionCorrelation[] = []
): AnalysisReport {
  const indicators = extractIndicators(events);
  const attackMappings = buildAttackMappings(findings);
  return {
    scenarioId,
    generatedAt,
    summary: { events: events.length, findings: findings.length, indicators: indicators.length, attackMappings: attackMappings.length },
    processTree: buildProcessTree(events),
    filesystemDiff: buildFilesystemDiff(events),
    registryDiff: buildRegistryDiff(events),
    networkFlows: buildNetworkFlows(events),
    indicators,
    attackMappings,
    findings: [...findings],
    correlations: [...correlations],
    timeline: buildTimeline(events, findings, correlations)
  };
}
