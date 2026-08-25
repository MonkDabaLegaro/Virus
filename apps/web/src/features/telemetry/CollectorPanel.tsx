import { useEffect, useState } from 'react';
import { api, type CollectorDescriptor } from '../../api';
import { Icon } from '../../Icon';
import { parseObservationImport } from './import-model';

const example = `[
  {
    "kind": "process",
    "timestamp": "2026-08-25T18:00:00.000Z",
    "action": "start",
    "pid": 4100,
    "ppid": 900,
    "image": "C:\\\\Lab\\\\sample.exe"
  }
]`;

export function CollectorPanel({ scenarioId, onImported }: { scenarioId: string; onImported: () => Promise<void> }) {
  const [collectors, setCollectors] = useState<CollectorDescriptor[]>([]);
  const [input, setInput] = useState(example);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    void api.collectors().then(setCollectors).catch((cause) => setError(cause instanceof Error ? cause.message : 'No se pudieron cargar los collectors.'));
  }, []);

  const importObservations = async () => {
    setBusy(true);
    setResult(null);
    try {
      const observations = parseObservationImport(input);
      const imported = await api.importWindowsObservations(scenarioId, observations);
      await onImported();
      setError(null);
      setResult(`${imported.events.length} EVENTS IMPORTED / ${imported.collectorId.toUpperCase()}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron importar las observaciones.');
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
        <strong>WINDOWS OBSERVATION IMPORT</strong>
        <p>Paste structured evidence exported from defensive tooling. The control plane validates and normalizes it; it does not run collectors inside the guest.</p>
      </div>
      <textarea value={input} onChange={(event) => setInput(event.target.value)} spellCheck={false} aria-label="Windows observations JSON" />
      <div className="collector-actions">
        <button className="primary-action" onClick={() => void importObservations()} disabled={busy || !input.trim()}><Icon name="scanner" /> {busy ? 'IMPORTING' : 'IMPORT OBSERVATIONS'}</button>
        {result && <span className="collector-result">{result}</span>}
      </div>
      {error && <div className="inline-error">{error}</div>}
    </div>
  </section>;
}
