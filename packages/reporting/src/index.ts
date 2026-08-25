import type { AnalysisReport } from '@malware-lab/shared-types';

function escapeCell(value: unknown): string {
  return String(value ?? '—').replace(/\|/g, '\\|').replace(/\r?\n/g, ' ');
}

export function renderMarkdownReport(report: AnalysisReport): string {
  const lines: string[] = [
    '# Malware Lab Analysis Report', '',
    `Scenario: \`${report.scenarioId}\`  `,
    `Generated: ${report.generatedAt}`, '',
    '## Summary', '',
    `- Events: ${report.summary.events}`,
    `- Findings: ${report.summary.findings}`,
    `- Indicators: ${report.summary.indicators}`,
    `- ATT&CK mappings: ${report.summary.attackMappings}`, '',
    '## Detection findings', ''
  ];
  if (!report.findings.length) lines.push('No findings.');
  else for (const finding of report.findings) lines.push(`- **${finding.ruleId} — ${finding.title}** (${finding.severity}): ${finding.rationale}`);

  lines.push('', '## Correlations', '');
  if (!report.correlations.length) lines.push('No multi-signal correlations.');
  else for (const correlation of report.correlations) lines.push(`- **${correlation.title}** (${correlation.severity}): ${correlation.rationale}`);

  lines.push('', '## MITRE ATT&CK mappings', '', '| Technique | Tactic | Confidence | Evidence |', '| --- | --- | --- | --- |');
  if (!report.attackMappings.length) lines.push('| — | — | — | — |');
  else for (const mapping of report.attackMappings) lines.push(`| ${escapeCell(mapping.techniqueId)} ${escapeCell(mapping.techniqueName)} | ${escapeCell(mapping.tactic)} | ${escapeCell(mapping.confidence)} | ${escapeCell(mapping.eventIds.join(', '))} |`);

  lines.push('', '## Evidence indicators', '', '| Type | Value | Events |', '| --- | --- | --- |');
  if (!report.indicators.length) lines.push('| — | — | — |');
  else for (const indicator of report.indicators) lines.push(`| ${escapeCell(indicator.type)} | ${escapeCell(indicator.value)} | ${escapeCell(indicator.eventIds.join(', '))} |`);

  lines.push('', '## Process lifecycle', '', '| PID | Parent | Image | Start | Stop |', '| ---: | ---: | --- | --- | --- |');
  if (!report.processTree.length) lines.push('| — | — | — | — | — |');
  else for (const process of report.processTree) lines.push(`| ${process.pid} | ${process.parentPid ?? '—'} | ${escapeCell(process.image)} | ${process.startedAt ?? '—'} | ${process.stoppedAt ?? '—'} |`);

  lines.push('', '## Filesystem changes', '', '| Action | Path | Events |', '| --- | --- | --- |');
  if (!report.filesystemDiff.length) lines.push('| — | — | — |');
  else for (const delta of report.filesystemDiff) lines.push(`| ${escapeCell(delta.action)} | ${escapeCell(delta.path)} | ${escapeCell(delta.eventIds.join(', '))} |`);

  lines.push('', '## Registry changes', '', '| Action | Key | Value |', '| --- | --- | --- |');
  if (!report.registryDiff.length) lines.push('| — | — | — |');
  else for (const delta of report.registryDiff) lines.push(`| ${escapeCell(delta.action)} | ${escapeCell(delta.key)} | ${escapeCell(delta.valueName)} |`);

  lines.push('', '## Network flows', '', '| Protocol | Destination | Count |', '| --- | --- | ---: |');
  if (!report.networkFlows.length) lines.push('| — | — | 0 |');
  else for (const flow of report.networkFlows) lines.push(`| ${escapeCell(flow.protocol)} | ${escapeCell(`${flow.destinationIp}:${flow.destinationPort}`)} | ${flow.count} |`);

  lines.push('', '## Timeline', '');
  if (!report.timeline.length) lines.push('No timeline entries.');
  else for (const entry of report.timeline) lines.push(`- ${entry.timestamp} — **${entry.kind.toUpperCase()}** — ${entry.title}`);

  lines.push('', '## Notes', '', 'This report is derived from Malware Lab telemetry and defensive rules. Fixture-backed sessions are synthetic and must not be treated as evidence from a real host.', '');
  return lines.join('\n');
}
