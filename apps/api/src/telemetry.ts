import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { buildAnalysisReport } from '@malware-lab/analysis';
import { FixtureTelemetryCollector, WindowsObservationCollector, listCollectors, type WindowsObservationCollectorInput } from '@malware-lab/collectors';
import { correlateDetections, detect } from '@malware-lab/detection';
import { renderMarkdownReport } from '@malware-lab/reporting';
import { TelemetryStore } from '@malware-lab/telemetry';
import type { AnalysisReport, TelemetryEvent, TelemetryKind, TelemetrySummary } from '@malware-lab/shared-types';

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
      const fixturePath = path.join(repoRoot, 'scenarios', 'ransomware', scenarioId, 'fixtures', 'telemetry.json');
      const raw = await readFile(fixturePath, 'utf8');
      const result = await fixtureCollector.collect({ scenarioId, events: JSON.parse(raw) as TelemetryEvent[] });
      store.replace(result.events);
      return result.events;
    },
    async importWindows(input: WindowsObservationCollectorInput) {
      const result = await windowsCollector.collect(input);
      store.replace(result.events);
      return result;
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
