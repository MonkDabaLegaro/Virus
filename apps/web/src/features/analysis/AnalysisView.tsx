import { useEffect, useMemo, useState } from 'react';
import type { AnalysisReport } from '@malware-lab/shared-types';
import { api } from '../../api';
import { Icon } from '../../Icon';

type AnalysisSection = 'Analysis' | 'Processes' | 'Filesystem' | 'Registry' | 'Network' | 'IOC Scanner' | 'Detection' | 'Timeline' | 'Reports';

function Empty({ children }: { children: string }) { return <div className="empty-state">{children}</div>; }

export function AnalysisView({ section, scenarioId }: { section: AnalysisSection; scenarioId: string }) {
  const [report, setReport] = useState<AnalysisReport | null>(null);
  const [markdown, setMarkdown] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try { setReport(await api.analysisReport()); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo cargar el análisis.'); }
  };
  useEffect(() => { void refresh(); }, [section]);

  const replay = async () => {
    setBusy(true); setMarkdown(null);
    try { await api.replayTelemetry(scenarioId); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo reproducir el fixture.'); }
    finally { setBusy(false); }
  };

  const loadMarkdown = async () => {
    setBusy(true);
    try { setMarkdown(await api.analysisReportMarkdown()); setError(null); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'No se pudo generar el reporte.'); }
    finally { setBusy(false); }
  };

  const metrics = useMemo(() => report?.summary ?? { events: 0, findings: 0, indicators: 0, attackMappings: 0 }, [report]);
  const heading = section === 'IOC Scanner' ? 'Evidence Indicators' : section;

  const body = (() => {
    if (!report) return <Empty>Replay the safe fixture to create an analysis session.</Empty>;
    if (section === 'Processes') return report.processTree.length ? <div className="analysis-table">{report.processTree.map(process => <div className="analysis-row process-row" key={process.pid}><code>{process.pid}</code><code>{process.parentPid ?? '—'}</code><strong>{process.image}</strong><span>{process.startedAt ? new Date(process.startedAt).toLocaleTimeString() : '—'} → {process.stoppedAt ? new Date(process.stoppedAt).toLocaleTimeString() : 'ACTIVE'}</span></div>)}</div> : <Empty>No process lifecycle events.</Empty>;
    if (section === 'Filesystem') return report.filesystemDiff.length ? <div className="analysis-table">{report.filesystemDiff.map(delta => <div className="analysis-row delta-row" key={delta.eventIds.join('-')}><strong>{delta.action.toUpperCase()}</strong><code>{delta.path}</code><span>{delta.extension ?? 'NO EXTENSION'}</span></div>)}</div> : <Empty>No observed filesystem changes.</Empty>;
    if (section === 'Registry') return report.registryDiff.length ? <div className="analysis-table">{report.registryDiff.map(delta => <div className="analysis-row delta-row" key={delta.eventIds.join('-')}><strong>{delta.action.toUpperCase()}</strong><code>{delta.key}</code><span>{delta.valueName ?? 'DEFAULT VALUE'}</span></div>)}</div> : <Empty>No observed Registry changes.</Empty>;
    if (section === 'Network') return report.networkFlows.length ? <div className="analysis-table">{report.networkFlows.map(flow => <div className="analysis-row network-row" key={`${flow.protocol}-${flow.destinationIp}-${flow.destinationPort}`}><strong>{flow.protocol.toUpperCase()}</strong><code>{flow.destinationIp}:{flow.destinationPort}</code><span>{flow.count} observation{flow.count === 1 ? '' : 's'}</span><small>{flow.eventIds.join(', ')}</small></div>)}</div> : <Empty>No network flows.</Empty>;
    if (section === 'IOC Scanner') return report.indicators.length ? <div className="ioc-grid">{report.indicators.map(indicator => <article key={`${indicator.type}-${indicator.value}`}><span>{indicator.type.toUpperCase()}</span><code>{indicator.value}</code><small>{indicator.eventIds.join(', ')}</small></article>)}</div> : <Empty>No indicators extracted.</Empty>;
    if (section === 'Detection') return <div className="analysis-stack">{report.correlations.map(correlation => <article className="correlation-card" key={correlation.id}><span>CORRELATION / {correlation.severity.toUpperCase()}</span><strong>{correlation.title}</strong><p>{correlation.rationale}</p></article>)}{report.findings.length ? report.findings.map(finding => <article className={`finding-row severity-${finding.severity}`} key={finding.id}><div><strong>{finding.title}</strong><span>{finding.ruleId} / {finding.severity.toUpperCase()}</span></div><p>{finding.rationale}</p><code>{finding.eventIds.join(', ')}</code></article>) : <Empty>No findings.</Empty>}</div>;
    if (section === 'Timeline') return report.timeline.length ? <div className="timeline-list">{report.timeline.map(entry => <div key={entry.id}><time>{new Date(entry.timestamp).toLocaleTimeString()}</time><span className={`timeline-kind ${entry.kind}`}>{entry.kind.toUpperCase()}</span><strong>{entry.title}</strong><small>{entry.eventIds.join(', ')}</small></div>)}</div> : <Empty>No timeline entries.</Empty>;
    if (section === 'Reports') return <div className="report-workspace"><button className="primary-action" onClick={() => void loadMarkdown()} disabled={busy}><Icon name="file" /> {busy ? 'GENERATING' : 'GENERATE MARKDOWN'}</button>{markdown ? <pre>{markdown}</pre> : <Empty>Generate a read-only Markdown report from the current analysis session.</Empty>}</div>;
    return <div className="analysis-overview"><section><span>ATT&CK MAPPINGS</span>{report.attackMappings.map(mapping => <article key={mapping.techniqueId}><strong>{mapping.techniqueId}</strong><h3>{mapping.techniqueName}</h3><p>{mapping.tactic} / {mapping.confidence.toUpperCase()} CONFIDENCE</p><small>{mapping.rationale}</small></article>)}</section><section><span>SESSION CORRELATION</span>{report.correlations.length ? report.correlations.map(correlation => <article key={correlation.id}><strong>{correlation.title}</strong><p>{correlation.rationale}</p><small>{correlation.findingIds.join(' / ')}</small></article>) : <Empty>No correlation yet.</Empty>}</section></div>;
  })();

  return <section className="content-grid single-mode"><article className="panel wide-panel"><div className="panel-heading"><div><span className="eyebrow">FORENSIC ANALYSIS</span><h2>{heading}</h2></div><button className="primary-action" onClick={() => void replay()} disabled={busy}><Icon name="terminal" /> {busy ? 'PROCESSING' : 'REPLAY SAFE FIXTURE'}</button></div>{error && <div className="inline-error">{error}</div>}<div className="analysis-metrics"><div><span>EVENTS</span><strong>{metrics.events}</strong></div><div><span>FINDINGS</span><strong>{metrics.findings}</strong></div><div><span>INDICATORS</span><strong>{metrics.indicators}</strong></div><div><span>ATT&CK</span><strong>{metrics.attackMappings}</strong></div></div><div className="analysis-body">{body}</div><div className="guardrail-banner"><Icon name="shield-alert" /><div><strong>FIXTURE-DERIVED EVIDENCE</strong><p>These views interpret synthetic replay telemetry. They do not execute samples, inspect the host, or claim a real compromise.</p></div></div></article></section>;
}
