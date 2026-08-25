import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildAnalysisReport } from '@malware-lab/analysis';
import {
  FixtureTelemetryCollector,
  WindowsObservationCollector,
  adaptNetworkFlowExport,
  adaptProcmonExport,
  adaptSysmonExport,
  listCollectors,
  type WindowsObservationCollectorInput
} from '@malware-lab/collectors';
import { correlateDetections, detect } from '@malware-lab/detection';
import { renderMarkdownReport } from '@malware-lab/reporting';
import { TelemetryStore } from '@malware-lab/telemetry';
import type { AnalysisReport, TelemetryKind, TelemetrySummary } from '@malware-lab/shared-types';

export type ExportedEvidenceFormat = 'sysmon-json' | 'procmon-csv' | 'procmon-json' | 'network-flow-json';
export interface ExportedEvidenceImport {
  scenarioId: string;
  format: ExportedEvidenceFormat;
  data: unknown;
  procmonDay?: string;
}

export async function resolveScenarioFixturePath(repoRoot: string, scenarioId: string): Promise<string> {
  const id = scenarioId.trim();
  if (!id || id.length > 120 || id === '.' || id === '..' || id.includes('/') || id.includes('\\')) throw new Error('Invalid scenario fixture id');

  const scenarioRoot = path.join(repoRoot, 'scenarios');
  const entries = await readdir(scenarioRoot, { recursive: true });
  const matches = entries
    .filter((entry) => path.basename(entry) === 'telemetry.json')
    .filter((entry) => path.basename(path.dirname(entry)) === 'fixtures')
    .filter((entry) => path.basename(path.dirname(path.dirname(entry))) === id)
    .map((entry) => path.join(scenarioRoot, entry));

  if (matches.length === 0) throw new Error('Scenario fixture not found');
  if (matches.length > 1) throw new Error('Ambiguous scenario fixture');
  return matches[0]!;
}

function adaptExportedEvidence(input: ExportedEvidenceImport) {
  if (input.format === 'sysmon-json') {
    if (!Array.isArray(input.data)) throw new Error('Invalid Sysmon export');
    return adaptSysmonExport(input.data);
  }
  if (input.format === 'network-flow-json') {
    if (!Array.isArray(input.data)) throw new Error('Invalid network flow export');
    return adaptNetworkFlowExport(input.data);
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.procmonDay ?? '')) throw new Error('Invalid Procmon export');
  if (input.format === 'procmon-csv') {
    if (typeof input.data !== 'string') throw new Error('Invalid Procmon export');
    return adaptProcmonExport(input.data, input.procmonDay!);
  }
  if (!Array.isArray(input.data)) throw new Error('Invalid Procmon export');
  return adaptProcmonExport(input.data, input.procmonDay!);
}

export function createTelemetryService(repoRoot: string) {
  const store = new TelemetryStore();
  const fixtureCollector = new FixtureTelemetryCollector();
  const windowsCollector = new WindowsObservationCollector();

  function findings() {
    return detect(store.list());
  }

  function correlations() {
    const events = store.list();
    return correlateDetections(detect(events), events);
  }

  function report(): AnalysisReport {
    const events = store.list();
    const currentFindings = detect(events);
    const currentCorrelations = correlateDetections(currentFindings, events);
    const scenarioId = events[0]?.scenarioId ?? 'unloaded';
    return buildAnalysisReport(scenarioId, events, currentFindings, new Date().toISOString(), currentCorrelations);
  }

  return {
    collectors() {
      return listCollectors();
    },
    async replay(scenarioId: string) {
      const fixturePath = await resolveScenarioFixturePath(repoRoot, scenarioId);
      const raw = await readFile(fixturePath, 'utf8');
      const parsed: unknown = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('Invalid fixture telemetry event');
      const result = await fixtureCollector.collect({ scenarioId, events: parsed });
      store.replace(result.events);
      return result.events;
    },
    async importWindows(input: WindowsObservationCollectorInput) {
      const result = await windowsCollector.collect(input);
      store.replace(result.events);
      return result;
    },
    async importExported(input: ExportedEvidenceImport) {
      const observations = adaptExportedEvidence(input);
      const result = await windowsCollector.collect({ scenarioId: input.scenarioId, observations });
      store.replace(result.events);
      return { ...result, adapter: input.format, observations: observations.length };
    },
    events(kind?: TelemetryKind) {
      return store.list(kind);
    },
    findings,
    correlations,
    report,
    markdownReport() {
      return renderMarkdownReport(report());
    },
    summary(): TelemetrySummary {
      const events = store.list();
      const currentFindings = detect(events);
      const byKind = { process: 0, filesystem: 0, registry: 0, network: 0 };
      for (const event of events) byKind[event.kind] += 1;
      const rank = { info: 0, low: 1, medium: 2, high: 3, critical: 4 };
      const highestSeverity = currentFindings.map((finding) => finding.severity).sort((a, b) => rank[b] - rank[a])[0] ?? null;
      return { total: events.length, byKind, detections: currentFindings.length, highestSeverity };
    }
  };
}
