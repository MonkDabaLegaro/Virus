import type { DetectionCorrelation, DetectionFinding, TelemetryEvent } from '@malware-lab/shared-types';

export function detect(events: TelemetryEvent[]): DetectionFinding[] {
  const out: DetectionFinding[] = [];
  const encrypted = events.filter((event) => event.kind === 'filesystem' && event.action === 'rename' && event.file?.path.endsWith('.WNCRY'));
  if (encrypted.length >= 2) out.push({ id: 'det-ransomware-extension', ruleId: 'LAB-RANSOM-001', title: 'Burst of ransomware-style extension changes', severity: 'high', eventIds: encrypted.map((event) => event.id), rationale: 'Multiple synthetic file rename events use the .WNCRY extension within the replay.' });
  const smb = events.filter((event) => event.kind === 'network' && event.network?.destinationPort === 445);
  if (smb.length) out.push({ id: 'det-smb-activity', ruleId: 'LAB-NET-001', title: 'SMB activity observed in replay', severity: 'medium', eventIds: smb.map((event) => event.id), rationale: 'Synthetic telemetry contains TCP/445 activity inside the isolated lab network.' });
  const runKey = events.filter((event) => event.kind === 'registry' && event.registry?.key.toLowerCase().includes('\\run'));
  if (runKey.length) out.push({ id: 'det-run-key', ruleId: 'LAB-REG-001', title: 'Run key modification', severity: 'high', eventIds: runKey.map((event) => event.id), rationale: 'Synthetic replay includes a registry autorun modification.' });
  return out;
}

export function correlateDetections(findings: DetectionFinding[], events: TelemetryEvent[]): DetectionCorrelation[] {
  const selectedIds = ['det-ransomware-extension', 'det-run-key', 'det-smb-activity'];
  const selected = selectedIds.map((id) => findings.find((finding) => finding.id === id)).filter((finding): finding is DetectionFinding => Boolean(finding));
  if (selected.length < 2) return [];
  const byId = new Map(events.map((event) => [event.id, event]));
  const times = selected.flatMap((finding) => finding.eventIds.map((id) => Date.parse(byId.get(id)?.timestamp ?? ''))).filter(Number.isFinite);
  if (times.length < 2 || Math.max(...times) - Math.min(...times) > 10_000) return [];
  return [{
    id: 'corr-ransomware-fixture',
    title: 'Correlated ransomware-like replay activity',
    severity: 'high',
    findingIds: selected.map((finding) => finding.id),
    eventIds: [...new Set(selected.flatMap((finding) => finding.eventIds))],
    rationale: 'Multiple independent defensive signals occurred within a short synthetic replay window.'
  }];
}
