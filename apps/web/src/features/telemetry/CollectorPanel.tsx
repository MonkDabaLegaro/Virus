import { useEffect, useMemo, useState } from 'react';
import { api, type CollectorDescriptor, type ExportedEvidenceFormat } from '../../api';
import { Icon } from '../../Icon';
import { parseObservationImport } from './import-model';

type InputFormat = 'windows-observation' | ExportedEvidenceFormat;

const examples: Record<InputFormat, string> = {
  'windows-observation': `[
  {
    "kind": "process",
    "timestamp": "2026-08-25T18:00:00.000Z",
    "action": "start",
    "pid": 4100,
    "ppid": 900,
    "image": "C:\\\\Lab\\\\sample.exe"
  }
]`,
  'sysmon-json': `[
  {
    "EventID": 3,
    "UtcTime": "2026-08-25 18:00:01.000",
    "Protocol": "tcp",
    "DestinationIp": "192.0.2.25",
    "DestinationPort": "445"
  }
]`,
  'procmon-csv': `Time of Day,Process Name,PID,Operation,Path,Result,Detail
18:00:01.000,sample.exe,4100,WriteFile,C:\\Lab\\doc.txt.WNCRY,SUCCESS,Offset: 0`,
  'procmon-json': `[
  {
    "Time of Day": "18:00:01.000",
    "Process Name": "sample.exe",
    "PID": "4100",
    "Operation": "WriteFile",
    "Path": "C:\\\\Lab\\\\doc.txt.WNCRY",
    "Result": "SUCCESS"
  }
]`,
  'network-flow-json': `[
  {
    "timestamp": "2026-08-25T18:00:03.000Z",
    "protocol": "tcp",
    "destinationIp": "192.0.2.25",
    "destinationPort": 445
  }
]`
};

function parseExportedInput(format: ExportedEvidenceFormat, input: string): unknown {
  if (format === 'procmon-csv') return input;
  let parsed: unknown;
  try { parsed = JSON.parse(input); }
  catch { throw new Error('Exported evidence must contain valid JSON for the selected format.'); }
  if (!Array.isArray(parsed)) throw new Error('Exported evidence JSON must be an array.');
  if (parsed.length > 5000) throw new Error('Exported evidence cannot exceed 5,000 entries.');
  return parsed;
}

export function CollectorPanel({ scenarioId, onImported }: { scenarioId: string; onImported: () => Promise<void> }) {
  const [collectors, setCollectors] = useState<CollectorDescriptor[]>([]);
  const [format, setFormat] = useState<InputFormat>('windows-observation');
  const [input, setInput] = useState(examples['windows-observation']);
  const [procmonDay, setProcmonDay] = useState('2026-08-25');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const needsDay = format === 'procmon-csv' || format === 'procmon-json';
  const selectedLabel = useMemo(() => collectors.find((collector) => collector.id === format)?.label ?? 'Windows Observation Import', [collectors, format]);

  useEffect(() => {
    void api.collectors().then(setCollectors).catch((cause) => setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los collectors.'));
  }, []);

  const changeFormat = (next: InputFormat) => {
    setFormat(next);
    setInput(examples[next]);
    setResult(null);
    setError(null);
  };

  const importEvidence = async () => {
    setBusy(true);
    setResult(null);
    try {
      const imported = format === 'windows-observation'
        ? await api.importWindowsObservations(scenarioId, parseObservationImport(input))
        : await api.importExportedEvidence(scenarioId, format, parseExportedInput(format, input), needsDay ? procmonDay : undefined);
      await onImported();
      setError(null);
      setResult(`${imported.events.length} EVENTS IMPORTED / ${(imported.adapter ?? imported.collectorId).toUpperCase()}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo importar la evidencia.');
    } finally {
      setBusy(false);
    }
  };

  return <section className="collector-panel">
    <div className="collector-heading">
      <div><span className="eyebrow">COLLECTOR BOUNDARY</span><h3>Observation-only ingestion</h3></div>
      <span className="state-badge">EXECUTION LOCKED</span>
    </div>
    <div className="collector-cards">
      {collectors.map((collector) => <div className="collector-card" key={collector.id}>
        <div><Icon name={collector.mode === 'import' ? 'scanner' : 'terminal'} /><strong>{collector.label}</strong></div>
        <span>{collector.platform.toUpperCase()} / {collector.mode.toUpperCase()}</span>
        <small>GUEST EXECUTION OFF / HOST COLLECTION OFF</small>
      </div>)}
    </div>
    <div className="collector-import">
      <div className="collector-import-copy">
        <strong>{selectedLabel.toUpperCase()}</strong>
        <p>Import only evidence already exported from defensive tooling. Parsing and normalization do not invoke Sysmon, Procmon, PowerShell, WMI or guest commands.</p>
      </div>
      <div className="collector-format-row">
        <label>FORMAT
          <select value={format} onChange={(event) => changeFormat(event.target.value as InputFormat)}>
            <option value="windows-observation">Normalized observations JSON</option>
            <option value="sysmon-json">Sysmon JSON export</option>
            <option value="procmon-csv">Procmon CSV export</option>
            <option value="procmon-json">Procmon JSON export</option>
            <option value="network-flow-json">Network flow JSON export</option>
          </select>
        </label>
        {needsDay && <label>CAPTURE DAY (UTC)<input type="date" value={procmonDay} onChange={(event) => setProcmonDay(event.target.value)} /></label>}
      </div>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label="Exported defensive evidence" />
      <div className="collector-actions">
        <button className="primary-action" onClick={() => void importEvidence()} disabled={busy || !input.trim()}><Icon name="scanner" /> {busy ? 'IMPORTING' : 'IMPORT EVIDENCE'}</button>
        {result && <span className="collector-result">{result}</span>}
      </div>
      {error && <div className="inline-error">{error}</div>}
    </div>
  </section>;
}
