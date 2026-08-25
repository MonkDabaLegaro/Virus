import { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { Icon, type IconName } from './Icon';
import type { LabSession, LabState, ScenarioSummary, SystemStatus } from '@malware-lab/shared-types';

type NavItem = { label: string; icon: IconName };

const navSections: Array<{ label: string; items: NavItem[] }> = [
  { label: 'CENTRO', items: [{ label: 'Dashboard', icon: 'dashboard' }] },
  {
    label: 'LABORATORIO',
    items: [
      { label: 'Laboratory', icon: 'laboratory' },
      { label: 'Virtual Machines', icon: 'vm' },
      { label: 'Network', icon: 'network' },
      { label: 'Samples', icon: 'samples' }
    ]
  },
  {
    label: 'ANÁLISIS',
    items: [
      { label: 'Processes', icon: 'processes' },
      { label: 'Filesystem', icon: 'filesystem' },
      { label: 'Registry', icon: 'registry' },
      { label: 'Telemetry', icon: 'terminal' }
    ]
  },
  {
    label: 'DEFENSA',
    items: [
      { label: 'Detection', icon: 'detection' },
      { label: 'IOC Scanner', icon: 'scanner' },
      { label: 'Remediation', icon: 'remediation' }
    ]
  }
];

const stateLabels: Record<LabState, string> = {
  idle: 'IDLE',
  prepared: 'PREPARED',
  running: 'RUNNING',
  detected: 'DETECTED',
  contained: 'CONTAINED',
  remediating: 'REMEDIATING',
  clean: 'CLEAN'
};

function StatusDot({ active, danger = false }: { active: boolean; danger?: boolean }) {
  return <span className={`status-dot ${active ? (danger ? 'danger' : 'active') : ''}`} />;
}

export function App() {
  const [system, setSystem] = useState<SystemStatus | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [labs, setLabs] = useState<LabSession[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<string>('wannacry');
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    try {
      const [nextSystem, nextScenarios, nextLabs] = await Promise.all([
        api.system(),
        api.scenarios(),
        api.labs()
      ]);
      setSystem(nextSystem);
      setScenarios(nextScenarios);
      setLabs(nextLabs);
      if (nextScenarios[0] && !nextScenarios.some((item) => item.id === selectedScenario)) {
        setSelectedScenario(nextScenarios[0].id);
      }
      setError(null);
    } catch {
      setError('No se pudo conectar con el control plane local.');
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const scenario = scenarios.find((item) => item.id === selectedScenario) ?? scenarios[0];
  const activeLab = useMemo(
    () => labs.find((lab) => lab.scenarioId === scenario?.id) ?? labs[0],
    [labs, scenario]
  );

  const createLab = async () => {
    if (!scenario) return;
    const lab = await api.createLab(scenario.id);
    setLabs((current) => [lab, ...current.filter((item) => item.id !== lab.id)]);
  };

  const action = async (name: 'prepare' | 'detect' | 'contain' | 'remediate' | 'restore') => {
    if (!activeLab) return;
    const updated = await api.actOnLab(activeLab.id, name);
    setLabs((current) => current.map((lab) => (lab.id === updated.id ? updated : lab)));
  };

  const availableHypervisor = system?.hypervisors.find((item) => item.available);
  const activeState = activeLab?.state ?? 'idle';

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><Icon name="biohazard" size={24} /></div>
          <div>
            <strong>MALWARE LAB</strong>
            <span>LOCAL RESEARCH SYSTEM</span>
          </div>
        </div>

        <nav>
          {navSections.map((section) => (
            <section className="nav-section" key={section.label}>
              <div className="nav-heading">{section.label}</div>
              {section.items.map((item) => (
                <button
                  className={`nav-item ${activeNav === item.label ? 'selected' : ''}`}
                  key={item.label}
                  onClick={() => setActiveNav(item.label)}
                >
                  <Icon name={item.icon} />
                  <span>{item.label}</span>
                </button>
              ))}
            </section>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div><StatusDot active={system?.networkPolicy === 'isolated-lab-only'} /> LAB NETWORK</div>
          <span>ISOLATED ONLY</span>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div>
            <span className="breadcrumb">LOCALHOST / CONTROL CENTER</span>
            <h1>{activeNav}</h1>
          </div>
          <div className="top-status">
            <div className="status-pill"><StatusDot active /> API ONLINE</div>
            <div className="status-pill"><StatusDot active={Boolean(availableHypervisor)} /> HYPERVISOR {availableHypervisor ? 'READY' : 'UNAVAILABLE'}</div>
            <div className="status-pill guarded"><Icon name="shield-check" size={14} /> HOST GUARDED</div>
          </div>
        </header>

        {error && <div className="error-banner">{error}</div>}

        <section className="metrics-grid">
          <article className="metric-card"><div className="metric-icon"><Icon name="vm" /></div><div><span>HYPERVISOR</span><strong>{availableHypervisor?.label ?? 'NOT DETECTED'}</strong></div></article>
          <article className="metric-card"><div className="metric-icon"><Icon name="network" /></div><div><span>NETWORK POLICY</span><strong>ISOLATED LAB</strong></div></article>
          <article className="metric-card"><div className="metric-icon"><Icon name="samples" /></div><div><span>SCENARIOS</span><strong>{String(scenarios.length).padStart(2, '0')}</strong></div></article>
          <article className="metric-card"><div className="metric-icon"><Icon name="laboratory" /></div><div><span>ACTIVE LABS</span><strong>{String(labs.length).padStart(2, '0')}</strong></div></article>
        </section>

        <section className="content-grid">
          <article className="panel lab-panel">
            <div className="panel-heading">
              <div><span className="eyebrow">ACTIVE LAB</span><h2>{scenario?.name ?? 'No scenario selected'}</h2></div>
              <div className={`state-badge state-${activeState.toLowerCase()}`}>{stateLabels[activeState]}</div>
            </div>
            <div className="lab-console">
              <div className="lab-machine">
                <div className="machine-frame"><Icon name="vm" size={32} /><strong>{activeLab?.vmName ?? 'WINDOWS ANALYSIS VM'}</strong><span>{scenario?.platform ?? 'Windows'} / Disposable guest</span></div>
                <div className="machine-lines" />
              </div>
              <div className="lab-facts">
                <div><span>SCENARIO</span><strong>{scenario?.id ?? '—'}</strong></div>
                <div><span>CATEGORY</span><strong>{scenario?.category?.toUpperCase() ?? '—'}</strong></div>
                <div><span>RISK</span><strong className="danger-text">{scenario?.risk?.toUpperCase() ?? '—'}</strong></div>
                <div><span>SNAPSHOT</span><strong>{activeLab?.snapshot ?? 'NOT PREPARED'}</strong></div>
              </div>
            </div>
            <div className="action-row">
              {!activeLab ? (
                <button className="primary-action" onClick={createLab}><Icon name="laboratory" /> CREATE LAB</button>
              ) : (
                <>
                  <button className="primary-action" onClick={() => action('prepare')}><Icon name="vm" /> PREPARE</button>
                  <button onClick={() => action('detect')}><Icon name="detection" /> DETECT</button>
                  <button onClick={() => action('contain')}><Icon name="detection" /> CONTAIN</button>
                  <button onClick={() => action('remediate')}><Icon name="remediation" /> REMEDIATE</button>
                  <button onClick={() => action('restore')}><Icon name="restore" /> RESTORE</button>
                </>
              )}
            </div>
          </article>

          <aside className="panel system-panel">
            <div className="panel-heading compact"><div><span className="eyebrow">SYSTEM STATUS</span><h3>Host boundary</h3></div></div>
            <div className="system-list">
              <div><span>Mode</span><strong>LOCAL ONLY</strong></div>
              <div><span>Real execution</span><strong>{system?.realExecutionEnabled ? 'ARMED' : 'LOCKED'}</strong></div>
              <div><span>Host</span><strong>{system?.host.platform ?? '—'} / {system?.host.architecture ?? '—'}</strong></div>
              <div><span>Network</span><strong>ISOLATED LAB ONLY</strong></div>
            </div>
            <div className="boundary-note"><Icon name="shield-check" /><p>El control plane no ejecuta muestras en el host. Los adaptadores de hipervisor están en modo de descubrimiento.</p></div>
          </aside>

          <article className="panel scenario-panel">
            <div className="panel-heading compact"><div><span className="eyebrow">SCENARIO LIBRARY</span><h3>Threat catalog</h3></div></div>
            <div className="scenario-list">
              {scenarios.map((item) => (
                <button key={item.id} className={`scenario-row ${item.id === scenario?.id ? 'selected' : ''}`} onClick={() => setSelectedScenario(item.id)}>
                  <div className="scenario-symbol"><Icon name="malware" /></div>
                  <div className="scenario-main"><strong>{item.name}</strong><span>{item.category} / {item.year}</span></div>
                  <span className={`risk risk-${item.risk}`}>{item.risk}</span>
                </button>
              ))}
            </div>
          </article>

          <article className="panel terminal-panel">
            <div className="panel-heading compact"><div><span className="eyebrow">EVENT STREAM</span><h3>Control plane telemetry</h3></div><span className="live-mark"><StatusDot active /> LIVE</span></div>
            <div className="terminal-window">
              <div><time>00:00:00</time><span className="event-type">SYSTEM</span><p>local control plane initialized</p></div>
              <div><time>00:00:01</time><span className="event-type">POLICY</span><p>host execution boundary locked</p></div>
              <div><time>00:00:02</time><span className="event-type">NETWORK</span><p>lab network policy: isolated-lab-only</p></div>
              {activeLab && <div><time>NOW</time><span className="event-type">LAB</span><p>{activeLab.scenarioName} state changed to {activeLab.state}</p></div>}
              <div className="terminal-prompt"><span>&gt;</span><i /></div>
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
