import { useEffect, useMemo, useState } from 'react';
import type {
  LabProfile,
  SystemStatus,
  VmDescriptor,
  VmInspection,
  VmValidationReport
} from '@malware-lab/shared-types';
import { api } from '../../api';
import { Icon } from '../../Icon';

type SupportedProvider = 'virtualbox' | 'hyper-v';

function vmKey(vm: VmDescriptor): string {
  return `${vm.providerId}:${vm.vmId}`;
}

function isSupportedProvider(providerId: string): providerId is SupportedProvider {
  return providerId === 'virtualbox' || providerId === 'hyper-v';
}

function verdict(report: VmValidationReport | null): { label: string; className: string } {
  if (!report) return { label: 'NOT VALIDATED', className: 'neutral' };
  if (report.safeForFutureExecution) return { label: 'FUTURE EXECUTION READY', className: 'pass' };
  if (report.safeToRestore) return { label: 'RESTORE READY', className: 'warn' };
  return { label: 'BLOCKED', className: 'fail' };
}

export function VirtualMachinesView({ system, profiles }: { system: SystemStatus | null; profiles: LabProfile[] }) {
  const [vms, setVms] = useState<VmDescriptor[]>([]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [inspection, setInspection] = useState<VmInspection | null>(null);
  const [report, setReport] = useState<VmValidationReport | null>(null);
  const [busy, setBusy] = useState<'loading' | 'validating' | 'restoring' | null>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profile = profiles[0] ?? null;
  const selectedVm = useMemo(() => vms.find((vm) => vmKey(vm) === selectedKey) ?? null, [vms, selectedKey]);
  const providerStatuses = system?.hypervisors ?? [];
  const currentVerdict = verdict(report);

  const refreshVms = async () => {
    setBusy('loading');
    try {
      const next = await api.vms();
      setVms(next);
      setSelectedKey((current) => current && next.some((vm) => vmKey(vm) === current) ? current : next[0] ? vmKey(next[0]) : null);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudieron enumerar las máquinas virtuales.');
    } finally {
      setBusy(null);
    }
  };

  useEffect(() => { void refreshVms(); }, []);

  useEffect(() => {
    setReport(null);
    setMessage(null);
    if (!selectedVm) {
      setInspection(null);
      return;
    }
    setBusy('loading');
    void api.vm(selectedVm.providerId, selectedVm.vmId)
      .then((value) => { setInspection(value); setError(null); })
      .catch((cause) => { setInspection(null); setError(cause instanceof Error ? cause.message : 'No se pudo inspeccionar la VM.'); })
      .finally(() => setBusy(null));
  }, [selectedVm?.providerId, selectedVm?.vmId]);

  const validate = async () => {
    if (!selectedVm || !profile || !isSupportedProvider(selectedVm.providerId)) return;
    setBusy('validating');
    setMessage(null);
    try {
      const nextReport = await api.validateVm(selectedVm.providerId, selectedVm.vmId, profile.id);
      setReport(nextReport);
      setInspection(nextReport.vm);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'La validación falló.');
    } finally {
      setBusy(null);
    }
  };

  const restoreBaseline = async () => {
    if (!selectedVm || !profile || !report?.safeToRestore || !isSupportedProvider(selectedVm.providerId)) return;
    const approved = window.confirm(`Restore ${selectedVm.name} to ${profile.baselineSnapshot}? All changes after the snapshot will be discarded.`);
    if (!approved) return;
    setBusy('restoring');
    setMessage(null);
    try {
      const result = await api.restoreVmBaseline(selectedVm.providerId, selectedVm.vmId, profile.id);
      setMessage(result.message);
      const nextReport = await api.validateVm(selectedVm.providerId, selectedVm.vmId, profile.id);
      setReport(nextReport);
      setInspection(nextReport.vm);
      setError(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No se pudo restaurar el baseline.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="vm-control-layout">
      <article className="panel vm-inventory-panel">
        <div className="panel-heading compact">
          <div><span className="eyebrow">VM INVENTORY</span><h3>Detected guests</h3></div>
          <button className="compact-action" onClick={() => void refreshVms()} disabled={busy !== null}><Icon name="restore" size={15} /> REFRESH</button>
        </div>
        <div className="provider-strip">
          {providerStatuses.map((provider) => {
            const guarded = provider.id === 'virtualbox' || provider.id === 'hyper-v';
            return <div className="provider-chip" key={provider.id}><span className={`mini-dot ${provider.available ? 'online' : ''}`} /><div><strong>{provider.label}</strong><small>{provider.available ? guarded ? 'GUARDED OPS' : 'DISCOVERY ONLY' : 'UNAVAILABLE'}</small></div></div>;
          })}
        </div>
        <div className="vm-list">
          {vms.length === 0 && busy !== 'loading' ? <div className="empty-state">No se detectaron VMs compatibles en VirtualBox o Hyper-V.</div> : vms.map((vm) => (
            <button className={`vm-list-row ${selectedKey === vmKey(vm) ? 'selected' : ''}`} key={vmKey(vm)} onClick={() => setSelectedKey(vmKey(vm))}>
              <div className="vm-list-icon"><Icon name="vm" /></div>
              <div className="vm-list-main"><strong>{vm.name}</strong><span>{vm.providerId.toUpperCase()} / {vm.vmId.slice(0, 18)}</span></div>
              <span className={`power-state power-${vm.powerState}`}>{vm.powerState.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </article>

      <article className="panel vm-detail-panel">
        <div className="panel-heading">
          <div><span className="eyebrow">GUARDED VM CONTROL</span><h2>{inspection?.name ?? selectedVm?.name ?? 'Select a virtual machine'}</h2></div>
          <div className={`validation-verdict ${currentVerdict.className}`}>{currentVerdict.label}</div>
        </div>

        {error && <div className="inline-error">{error}</div>}
        {message && <div className="inline-success">{message}</div>}

        {!selectedVm ? <div className="empty-state large-empty">Select a detected VM to inspect its isolation boundary.</div> : <>
          <div className="vm-detail-grid">
            <div className="vm-visual"><div className="machine-frame large"><Icon name="vm" size={40} /><strong>{inspection?.name ?? selectedVm.name}</strong><span>{selectedVm.providerId.toUpperCase()} / {inspection?.powerState ?? selectedVm.powerState}</span></div></div>
            <div className="inspection-grid">
              <div><span>POWER</span><strong>{inspection?.powerState.toUpperCase() ?? 'LOADING'}</strong></div>
              <div><span>CPU</span><strong>{inspection?.cpuCount ?? '—'} vCPU</strong></div>
              <div><span>MEMORY</span><strong>{inspection?.memoryMb ?? '—'} MB</strong></div>
              <div><span>SNAPSHOTS</span><strong>{inspection?.snapshots.length ?? 0}</strong></div>
              <div><span>NETWORK ADAPTERS</span><strong>{inspection?.networkAdapters.length ?? 0}</strong></div>
              <div><span>PROFILE</span><strong>{profile?.id ?? '—'}</strong></div>
            </div>
          </div>

          <div className="vm-actions">
            <button className="primary-action" onClick={() => void validate()} disabled={busy !== null || !profile || !isSupportedProvider(selectedVm.providerId)}><Icon name="shield-check" /> {busy === 'validating' ? 'VALIDATING' : 'VALIDATE ISOLATION'}</button>
            <button className="danger-safe-action" onClick={() => void restoreBaseline()} disabled={busy !== null || !report?.safeToRestore}><Icon name="restore" /> {busy === 'restoring' ? 'RESTORING' : 'RESTORE CLEAN SNAPSHOT'}</button>
          </div>

          <div className="vm-split">
            <section className="subpanel">
              <div className="subpanel-heading"><span>NETWORK</span><strong>{profile?.network.name ?? '—'}</strong></div>
              <div className="adapter-list">
                {inspection?.networkAdapters.length ? inspection.networkAdapters.map((adapter) => <div key={adapter.slot}><span>NIC {adapter.slot}</span><strong>{adapter.mode.toUpperCase()}</strong><code>{adapter.networkName ?? 'NO NETWORK NAME'}</code></div>) : <div className="empty-state">No attached network adapters reported.</div>}
              </div>
            </section>

            <section className="subpanel">
              <div className="subpanel-heading"><span>SAFETY CHECKS</span><strong>{report ? `${report.checks.filter((check) => check.status === 'pass').length}/${report.checks.length}` : 'NOT RUN'}</strong></div>
              <div className="check-list">
                {report ? report.checks.map((check) => <div className="check-row" key={check.id}><span className={`check-indicator ${check.status}`} /><div><strong>{check.label}</strong><small>{check.detail}</small></div><code>{check.status.toUpperCase()}</code></div>) : <div className="empty-state">Run validation to prove snapshot, power, network and host-integration invariants.</div>}
              </div>
            </section>
          </div>

          <div className="guardrail-banner"><Icon name="shield-alert" /><div><strong>EXECUTION GATE REMAINS LOCKED</strong><p>This panel can inspect, validate and restore a powered-off baseline. It cannot start guests, transfer samples or execute guest commands.</p></div></div>
        </>}
      </article>
    </section>
  );
}
