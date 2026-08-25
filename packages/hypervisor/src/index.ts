import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';
import type {
  HypervisorStatus,
  LabProfile,
  VmDescriptor,
  VmInspection,
  VmNetworkMode,
  VmPowerState,
  VmRestoreResult,
  VmValidationCheck,
  VmValidationReport
} from '@malware-lab/shared-types';

const execFileAsync = promisify(execFile);
const commandOptions = { timeout: 5000, windowsHide: true, maxBuffer: 256 * 1024 } as const;

export class HypervisorOperationError extends Error {
  constructor(
    public readonly code: 'provider-unavailable' | 'unsupported-provider' | 'vm-not-found' | 'unsafe-state' | 'snapshot-missing',
    message: string
  ) {
    super(message);
    this.name = 'HypervisorOperationError';
  }
}

async function run(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<string> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { ...commandOptions, ...(env ? { env } : {}) });
    return `${stdout}${stderr}`.trim();
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new HypervisorOperationError('provider-unavailable', `${command} failed: ${reason}`);
  }
}

async function probe(command: string, args: string[], id: string, label: string): Promise<HypervisorStatus> {
  try {
    const output = await run(command, args);
    const version = output.split(/\r?\n/)[0]?.slice(0, 120);
    return { id, label, available: true, ...(version ? { version } : {}) };
  } catch {
    return { id, label, available: false };
  }
}

export async function probeHypervisors(): Promise<HypervisorStatus[]> {
  const probes: Array<Promise<HypervisorStatus>> = [
    probe('VBoxManage', ['--version'], 'virtualbox', 'VirtualBox'),
    probe('vmrun', ['-T', 'ws', 'list'], 'vmware', 'VMware Workstation')
  ];
  if (os.platform() === 'win32') {
    probes.push(probe('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', '(Get-Module -ListAvailable Hyper-V | Select-Object -First 1).Version.ToString()'], 'hyper-v', 'Hyper-V'));
  }
  if (os.platform() === 'linux') probes.push(probe('virsh', ['--version'], 'libvirt', 'libvirt / KVM'));
  return Promise.all(probes);
}

function unquote(value: string | undefined): string | undefined {
  if (value === undefined) return undefined;
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed.slice(1, -1).replace(/\\"/g, '"');
  return trimmed;
}

export function parseMachineReadable(input: string): Map<string, string> {
  const result = new Map<string, string>();
  for (const line of input.split(/\r?\n/)) {
    const index = line.indexOf('=');
    if (index <= 0) continue;
    result.set(line.slice(0, index), unquote(line.slice(index + 1)) ?? '');
  }
  return result;
}

export function parseVBoxVmList(input: string): VmDescriptor[] {
  return input.split(/\r?\n/).map((line) => {
    const match = line.match(/^"(.+)"\s+\{([^}]+)\}$/);
    if (!match?.[1] || !match[2]) return null;
    return { providerId: 'virtualbox' as const, name: match[1], vmId: match[2], powerState: 'unknown' as const };
  }).filter((value): value is VmDescriptor => value !== null);
}

function normalizeVBoxPowerState(value: string | undefined): VmPowerState {
  if (value === 'poweroff' || value === 'aborted') return 'powered-off';
  if (value === 'running') return 'running';
  if (value === 'paused') return 'paused';
  if (value === 'saved') return 'saved';
  return 'unknown';
}

function normalizeVBoxNetworkMode(value: string | undefined): VmNetworkMode {
  if (value === 'intnet') return 'internal';
  if (value === 'hostonly' || value === 'hostonlynet') return 'host-only';
  if (value === 'nat' || value === 'natnetwork') return 'nat';
  if (value === 'bridged') return 'bridged';
  if (!value || value === 'none' || value === 'null') return 'not-attached';
  return 'unknown';
}

function disabledValue(value: string | undefined): boolean | null {
  if (value === undefined) return null;
  return ['disabled', 'off', 'none', 'false', '0'].includes(value.toLowerCase()) ? false : true;
}

function parseJsonOutput<T>(output: string): T[] {
  if (!output.trim()) return [];
  const parsed = JSON.parse(output) as T | T[] | null;
  if (parsed === null) return [];
  return Array.isArray(parsed) ? parsed : [parsed];
}

interface VmProvider {
  readonly id: 'virtualbox' | 'hyper-v';
  list(): Promise<VmDescriptor[]>;
  inspect(vmId: string): Promise<VmInspection>;
  restoreSnapshot(vmId: string, snapshot: string): Promise<VmRestoreResult>;
}

class VirtualBoxProvider implements VmProvider {
  readonly id = 'virtualbox' as const;

  async list(): Promise<VmDescriptor[]> {
    const descriptors = parseVBoxVmList(await run('VBoxManage', ['list', 'vms']));
    return Promise.all(descriptors.map(async (descriptor) => {
      try {
        const info = parseMachineReadable(await run('VBoxManage', ['showvminfo', descriptor.vmId, '--machinereadable']));
        return { ...descriptor, powerState: normalizeVBoxPowerState(info.get('VMState')) };
      } catch {
        return descriptor;
      }
    }));
  }

  async inspect(vmId: string): Promise<VmInspection> {
    const info = parseMachineReadable(await run('VBoxManage', ['showvminfo', vmId, '--machinereadable']));
    const name = info.get('name') ?? info.get('Name');
    if (!name) throw new HypervisorOperationError('vm-not-found', `VirtualBox VM not found: ${vmId}`);

    let snapshotOutput = '';
    try { snapshotOutput = await run('VBoxManage', ['snapshot', vmId, 'list', '--machinereadable']); } catch { snapshotOutput = ''; }
    const snapshots = [...snapshotOutput.matchAll(/^SnapshotName(?:-[^=]+)?=(?:"([^"]+)"|(.+))$/gm)].map((match) => (match[1] ?? match[2] ?? '').trim()).filter(Boolean);
    const networkAdapters = Array.from({ length: 8 }, (_, index) => index + 1).flatMap((slot) => {
      const rawMode = info.get(`nic${slot}`);
      if (!rawMode || rawMode === 'none') return [];
      const mode = normalizeVBoxNetworkMode(rawMode);
      const networkName = mode === 'internal' ? info.get(`intnet${slot}`) ?? null : mode === 'host-only' ? info.get(`hostonlyadapter${slot}`) ?? info.get(`hostonlynet${slot}`) ?? null : null;
      return [{ slot: String(slot), mode, networkName }];
    });
    const hasSharedFolders = [...info.keys()].some((key) => key.startsWith('SharedFolderNameMachineMapping') || key.startsWith('SharedFolderPathMachineMapping'));

    return {
      providerId: this.id,
      vmId,
      name,
      powerState: normalizeVBoxPowerState(info.get('VMState')),
      cpuCount: Number.isFinite(Number(info.get('cpus'))) ? Number(info.get('cpus')) : null,
      memoryMb: Number.isFinite(Number(info.get('memory'))) ? Number(info.get('memory')) : null,
      snapshots,
      networkAdapters,
      integrations: {
        sharedFolders: hasSharedFolders,
        clipboard: disabledValue(info.get('clipboard') ?? info.get('ClipboardMode')),
        dragAndDrop: disabledValue(info.get('draganddrop') ?? info.get('DragAndDropMode')),
        usbPassthrough: disabledValue(info.get('usb') ?? info.get('USBController'))
      }
    };
  }

  async restoreSnapshot(vmId: string, snapshot: string): Promise<VmRestoreResult> {
    const inspection = await this.inspect(vmId);
    if (inspection.powerState !== 'powered-off') throw new HypervisorOperationError('unsafe-state', 'The VM must be powered off before restoring a baseline snapshot.');
    if (!inspection.snapshots.includes(snapshot)) throw new HypervisorOperationError('snapshot-missing', `Snapshot not found: ${snapshot}`);
    await run('VBoxManage', ['snapshot', vmId, 'restore', snapshot]);
    return { providerId: this.id, vmId, snapshot, restored: true, message: `Restored ${inspection.name} to ${snapshot}. The VM remains powered off.` };
  }
}

type HyperVVmJson = { Id: string; Name: string; State: string };
type HyperVInspectionJson = {
  Id: string; Name: string; State: string; ProcessorCount: number; MemoryStartup: number; Snapshots?: string[] | string | null;
  Network?: Array<{ SwitchName?: string | null; SwitchType?: string | null }> | { SwitchName?: string | null; SwitchType?: string | null } | null;
  EnhancedSessionEnabled?: boolean | null;
};

function normalizeHyperVPowerState(value: string): VmPowerState {
  if (value === 'Off') return 'powered-off';
  if (value === 'Running') return 'running';
  if (value === 'Paused') return 'paused';
  if (value === 'Saved') return 'saved';
  return 'unknown';
}

function normalizeHyperVNetworkMode(value: string | null | undefined): VmNetworkMode {
  if (value === 'Private') return 'internal';
  if (value === 'Internal') return 'host-only';
  if (value === 'External') return 'bridged';
  if (!value) return 'not-attached';
  return 'unknown';
}

async function powershell(script: string, extraEnv?: Record<string, string>): Promise<string> {
  if (os.platform() !== 'win32') throw new HypervisorOperationError('provider-unavailable', 'Hyper-V adapter is only available on Windows hosts.');
  return run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { ...process.env, ...(extraEnv ?? {}) });
}

class HyperVProvider implements VmProvider {
  readonly id = 'hyper-v' as const;

  async list(): Promise<VmDescriptor[]> {
    const output = await powershell("Get-VM | Select-Object @{n='Id';e={$_.Id.Guid}},Name,State | ConvertTo-Json -Compress");
    return parseJsonOutput<HyperVVmJson>(output).map((vm) => ({ providerId: this.id, vmId: vm.Id, name: vm.Name, powerState: normalizeHyperVPowerState(vm.State) }));
  }

  async inspect(vmId: string): Promise<VmInspection> {
    const script = [
      "$vm=Get-VM -Id ([guid]$env:MALWARE_LAB_VM_ID) -ErrorAction Stop",
      "$snapshots=@(Get-VMSnapshot -VM $vm -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)",
      "$network=@(Get-VMNetworkAdapter -VM $vm | ForEach-Object { $switch=$null; if ($_.SwitchName) { $switch=Get-VMSwitch -Name $_.SwitchName -ErrorAction SilentlyContinue }; [pscustomobject]@{SwitchName=$_.SwitchName;SwitchType=if($switch){$switch.SwitchType.ToString()}else{$null}} })",
      "$hostCfg=Get-VMHost",
      "[pscustomobject]@{Id=$vm.Id.Guid;Name=$vm.Name;State=$vm.State.ToString();ProcessorCount=$vm.ProcessorCount;MemoryStartup=$vm.MemoryStartup;Snapshots=$snapshots;Network=$network;EnhancedSessionEnabled=$hostCfg.EnableEnhancedSessionMode} | ConvertTo-Json -Depth 6 -Compress"
    ].join(';');
    const rows = parseJsonOutput<HyperVInspectionJson>(await powershell(script, { MALWARE_LAB_VM_ID: vmId }));
    const vm = rows[0];
    if (!vm) throw new HypervisorOperationError('vm-not-found', `Hyper-V VM not found: ${vmId}`);
    const snapshots = vm.Snapshots === null || vm.Snapshots === undefined ? [] : Array.isArray(vm.Snapshots) ? vm.Snapshots : [vm.Snapshots];
    const rawNetwork = vm.Network === null || vm.Network === undefined ? [] : Array.isArray(vm.Network) ? vm.Network : [vm.Network];
    const enhancedDisabled = vm.EnhancedSessionEnabled === false;
    return {
      providerId: this.id,
      vmId: vm.Id,
      name: vm.Name,
      powerState: normalizeHyperVPowerState(vm.State),
      cpuCount: vm.ProcessorCount ?? null,
      memoryMb: Number.isFinite(vm.MemoryStartup) ? Math.round(vm.MemoryStartup / 1024 / 1024) : null,
      snapshots,
      networkAdapters: rawNetwork.map((adapter, index) => ({ slot: String(index + 1), mode: normalizeHyperVNetworkMode(adapter.SwitchType), networkName: adapter.SwitchName ?? null })),
      integrations: {
        sharedFolders: enhancedDisabled ? false : null,
        clipboard: enhancedDisabled ? false : null,
        dragAndDrop: enhancedDisabled ? false : null,
        usbPassthrough: enhancedDisabled ? false : null
      }
    };
  }

  async restoreSnapshot(vmId: string, snapshot: string): Promise<VmRestoreResult> {
    const inspection = await this.inspect(vmId);
    if (inspection.powerState !== 'powered-off') throw new HypervisorOperationError('unsafe-state', 'The VM must be powered off before restoring a baseline checkpoint.');
    if (!inspection.snapshots.includes(snapshot)) throw new HypervisorOperationError('snapshot-missing', `Checkpoint not found: ${snapshot}`);
    const script = [
      "$vm=Get-VM -Id ([guid]$env:MALWARE_LAB_VM_ID) -ErrorAction Stop",
      "$snapshot=Get-VMSnapshot -VM $vm -Name $env:MALWARE_LAB_SNAPSHOT -ErrorAction Stop",
      "Restore-VMSnapshot -VMSnapshot $snapshot -Confirm:$false"
    ].join(';');
    await powershell(script, { MALWARE_LAB_VM_ID: vmId, MALWARE_LAB_SNAPSHOT: snapshot });
    return { providerId: this.id, vmId, snapshot, restored: true, message: `Restored ${inspection.name} to ${snapshot}. The VM remains powered off.` };
  }
}

function providerFor(id: string): VmProvider {
  if (id === 'virtualbox') return new VirtualBoxProvider();
  if (id === 'hyper-v') return new HyperVProvider();
  throw new HypervisorOperationError('unsupported-provider', `Provider ${id} does not expose guarded VM operations yet.`);
}

export async function listVirtualMachines(): Promise<VmDescriptor[]> {
  const statuses = await probeHypervisors();
  const providerIds = statuses.filter((status) => status.available && (status.id === 'virtualbox' || status.id === 'hyper-v')).map((status) => status.id);
  const groups = await Promise.all(providerIds.map(async (id) => {
    try { return await providerFor(id).list(); } catch { return []; }
  }));
  return groups.flat().sort((a, b) => a.name.localeCompare(b.name));
}

export async function inspectVirtualMachine(providerId: string, vmId: string): Promise<VmInspection> {
  return providerFor(providerId).inspect(vmId);
}

function booleanCheck(id: VmValidationCheck['id'], label: string, actual: boolean | null, expected: false): VmValidationCheck {
  if (actual === null) return { id, label, status: 'unknown', detail: 'The provider could not prove this integration is disabled.' };
  return actual === expected ? { id, label, status: 'pass', detail: 'Disabled as required.' } : { id, label, status: 'fail', detail: 'Enabled; this violates the lab profile.' };
}

export async function validateVirtualMachine(providerId: string, vmId: string, profile: LabProfile): Promise<VmValidationReport> {
  const vm = await inspectVirtualMachine(providerId, vmId);
  const networkOk = vm.networkAdapters.length > 0 && vm.networkAdapters.every((adapter) => adapter.mode === 'internal' && adapter.networkName === profile.network.name);
  const checks: VmValidationCheck[] = [
    { id: 'powered-off', label: 'VM powered off', status: vm.powerState === 'powered-off' ? 'pass' : 'fail', detail: `Observed state: ${vm.powerState}.` },
    { id: 'baseline-snapshot', label: 'Clean baseline snapshot', status: vm.snapshots.includes(profile.baselineSnapshot) ? 'pass' : 'fail', detail: vm.snapshots.includes(profile.baselineSnapshot) ? `${profile.baselineSnapshot} is available.` : `${profile.baselineSnapshot} was not found.` },
    { id: 'isolated-network', label: 'Guest-only isolated network', status: networkOk ? 'pass' : 'fail', detail: networkOk ? `${profile.network.name} is isolated from the host.` : 'Every attached adapter must use the configured guest-only network. NAT, bridged, host-only and Hyper-V Internal switches are rejected.' },
    booleanCheck('shared-folders-disabled', 'Shared folders disabled', vm.integrations.sharedFolders, false),
    booleanCheck('clipboard-disabled', 'Clipboard disabled', vm.integrations.clipboard, false),
    booleanCheck('drag-drop-disabled', 'Drag and drop disabled', vm.integrations.dragAndDrop, false),
    booleanCheck('usb-disabled', 'USB passthrough disabled', vm.integrations.usbPassthrough, false),
    { id: 'cpu-capacity', label: 'CPU capacity', status: vm.cpuCount === null ? 'unknown' : vm.cpuCount >= profile.cpuCount ? 'pass' : 'fail', detail: `Required: ${profile.cpuCount}; observed: ${vm.cpuCount ?? 'unknown'}.` },
    { id: 'memory-capacity', label: 'Memory capacity', status: vm.memoryMb === null ? 'unknown' : vm.memoryMb >= profile.memoryMb ? 'pass' : 'fail', detail: `Required: ${profile.memoryMb} MB; observed: ${vm.memoryMb ?? 'unknown'} MB.` }
  ];
  return {
    vm,
    profileId: profile.id,
    safeToRestore: checks.filter((check) => check.id === 'powered-off' || check.id === 'baseline-snapshot').every((check) => check.status === 'pass'),
    safeForFutureExecution: checks.every((check) => check.status === 'pass'),
    checks
  };
}

export async function restoreBaselineSnapshot(providerId: string, vmId: string, profile: LabProfile): Promise<VmRestoreResult> {
  const report = await validateVirtualMachine(providerId, vmId, profile);
  if (!report.safeToRestore) throw new HypervisorOperationError('unsafe-state', 'Baseline restore requires a powered-off VM with the configured clean snapshot.');
  return providerFor(providerId).restoreSnapshot(vmId, profile.baselineSnapshot);
}
