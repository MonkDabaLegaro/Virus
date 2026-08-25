import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';
import type { HypervisorStatus, LabProfile, VmDescriptor, VmInspection, VmNetworkMode, VmPowerState, VmRestoreResult, VmValidationCheck, VmValidationReport } from '@malware-lab/shared-types';

const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 5000;
const MAX_BUFFER = 256 * 1024;

type ProviderId = 'virtualbox' | 'hyper-v';
export type HypervisorErrorCode = 'provider-unavailable' | 'unsupported-provider' | 'vm-not-found' | 'unsafe-state' | 'snapshot-missing';

export class HypervisorOperationError extends Error {
  constructor(public readonly code: HypervisorErrorCode, message: string) {
    super(message);
    this.name = 'HypervisorOperationError';
  }
}

async function run(command: string, args: string[], env?: NodeJS.ProcessEnv): Promise<string> {
  const { stdout } = await execFileAsync(command, args, {
    timeout: COMMAND_TIMEOUT_MS,
    maxBuffer: MAX_BUFFER,
    windowsHide: true,
    env: env ? { ...process.env, ...env } : process.env
  });
  return stdout;
}

async function probeCommand(id: string, label: string, command: string, args: string[]): Promise<HypervisorStatus> {
  try {
    const stdout = await run(command, args);
    const version = stdout.trim().split(/\r?\n/)[0];
    return { id, label, available: true, ...(version ? { version } : {}) };
  } catch {
    return { id, label, available: false };
  }
}

async function probeHyperV(): Promise<HypervisorStatus> {
  if (os.platform() !== 'win32') return { id: 'hyper-v', label: 'Hyper-V', available: false };
  try {
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', 'Get-Command Get-VM -ErrorAction Stop | Out-Null']);
    return { id: 'hyper-v', label: 'Hyper-V', available: true };
  } catch {
    return { id: 'hyper-v', label: 'Hyper-V', available: false };
  }
}

export async function probeHypervisors(): Promise<HypervisorStatus[]> {
  const probes = await Promise.all([
    probeCommand('virtualbox', 'VirtualBox', 'VBoxManage', ['--version']),
    probeCommand('vmware', 'VMware', os.platform() === 'win32' ? 'vmrun.exe' : 'vmrun', []),
    probeHyperV(),
    os.platform() === 'linux'
      ? probeCommand('libvirt', 'libvirt', 'virsh', ['--version'])
      : Promise.resolve({ id: 'libvirt', label: 'libvirt', available: false } as HypervisorStatus)
  ]);
  return probes;
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
  return input.split(/\r?\n/).flatMap((line): VmDescriptor[] => {
    const match = line.match(/^"(.+)"\s+\{([^}]+)\}$/);
    if (!match?.[1] || !match[2]) return [];
    return [{ providerId: 'virtualbox', name: match[1], vmId: match[2], powerState: 'unknown' }];
  });
}

function normalizeVBoxPowerState(value: string | undefined): VmPowerState {
  if (value === 'poweroff' || value === 'aborted') return 'powered-off';
  if (value === 'running') return 'running';
  if (value === 'paused') return 'paused';
  if (value === 'saved') return 'saved';
  return 'unknown';
}

function normalizeVBoxNetworkMode(value: string | undefined): VmNetworkMode {
  if (!value || value === 'none') return 'not-attached';
  if (value === 'intnet') return 'internal';
  if (value === 'hostonly' || value === 'hostonlynet') return 'host-only';
  if (value === 'nat' || value === 'natnetwork') return 'nat';
  if (value === 'bridged') return 'bridged';
  return 'unknown';
}

function disabledValue(value: string | undefined): boolean | null {
  if (value === undefined) return null;
  return ['off', 'disabled', 'none', '0', 'false'].includes(value.toLowerCase());
}

function parseVBoxInspection(vmId: string, input: string, snapshotsInput: string): VmInspection {
  const info = parseMachineReadable(input);
  const descriptor: VmInspection = {
    providerId: 'virtualbox',
    vmId,
    name: info.get('name') ?? vmId,
    powerState: normalizeVBoxPowerState(info.get('VMState')),
    cpuCount: Number.isFinite(Number(info.get('cpus'))) ? Number(info.get('cpus')) : null,
    memoryMb: Number.isFinite(Number(info.get('memory'))) ? Number(info.get('memory')) : null,
    snapshots: [],
    networkAdapters: [],
    integrations: {
      sharedFolders: null,
      clipboard: disabledValue(info.get('SharedClipboard')),
      dragAndDrop: disabledValue(info.get('DragAndDrop')),
      usbPassthrough: disabledValue(info.get('USBController'))
    }
  };

  for (const [key, value] of info) {
    const nic = key.match(/^nic(\d+)$/);
    if (!nic || value === 'none') continue;
    const slot = nic[1]!;
    const mode = normalizeVBoxNetworkMode(value);
    const networkName = mode === 'internal' ? info.get(`intnet${slot}`) ?? null : mode === 'host-only' ? info.get(`hostonlyadapter${slot}`) ?? info.get(`hostonlynet${slot}`) ?? null : null;
    descriptor.networkAdapters.push({ slot, mode, networkName });
  }

  const snapshotInfo = parseMachineReadable(snapshotsInput);
  for (const [key, value] of snapshotInfo) if (/^SnapshotName(?:-\d+)?$/.test(key)) descriptor.snapshots.push(value);
  const sharedFolderKeys = [...info.keys()].filter((key) => /^SharedFolderNameMachineMapping\d+$/.test(key));
  descriptor.integrations.sharedFolders = sharedFolderKeys.length > 0 ? false : null;
  return descriptor;
}

async function listVBoxVms(): Promise<VmDescriptor[]> {
  try {
    return parseVBoxVmList(await run('VBoxManage', ['list', 'vms']));
  } catch {
    return [];
  }
}

async function inspectVBoxVm(vmId: string): Promise<VmInspection> {
  try {
    const [info, snapshots] = await Promise.all([
      run('VBoxManage', ['showvminfo', vmId, '--machinereadable']),
      run('VBoxManage', ['snapshot', vmId, 'list', '--machinereadable'])
    ]);
    return parseVBoxInspection(vmId, info, snapshots);
  } catch {
    throw new HypervisorOperationError('vm-not-found', `VirtualBox VM ${vmId} could not be inspected.`);
  }
}

function normalizeHyperVState(value: string | undefined): VmPowerState {
  if (value === 'Off') return 'powered-off';
  if (value === 'Running') return 'running';
  if (value === 'Paused') return 'paused';
  if (value === 'Saved') return 'saved';
  return 'unknown';
}

function normalizeHyperVSwitchType(value: string | undefined): VmNetworkMode {
  if (value === 'Private') return 'internal';
  if (value === 'Internal') return 'host-only';
  if (value === 'External') return 'bridged';
  return value ? 'unknown' : 'not-attached';
}

function parseJsonOutput<T>(stdout: string): T {
  const trimmed = stdout.trim();
  if (!trimmed) throw new Error('Empty provider output');
  return JSON.parse(trimmed) as T;
}

async function listHyperVVms(): Promise<VmDescriptor[]> {
  if (os.platform() !== 'win32') return [];
  try {
    const script = '$ErrorActionPreference="Stop"; Get-VM | Select-Object Id,Name,State | ConvertTo-Json -Compress';
    const parsed = parseJsonOutput<Array<{ Id: string; Name: string; State: string }> | { Id: string; Name: string; State: string }>(await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script]));
    const rows = Array.isArray(parsed) ? parsed : [parsed];
    return rows.map((row) => ({ providerId: 'hyper-v', vmId: row.Id, name: row.Name, powerState: normalizeHyperVState(row.State) }));
  } catch {
    return [];
  }
}

async function inspectHyperVVm(vmId: string): Promise<VmInspection> {
  if (os.platform() !== 'win32') throw new HypervisorOperationError('provider-unavailable', 'Hyper-V operations require Windows.');
  const script = `$ErrorActionPreference='Stop';
$vm=Get-VM -Id $env:MALWARE_LAB_VM_ID;
$snapshots=@(Get-VMSnapshot -VM $vm -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name);
$adapters=@(Get-VMNetworkAdapter -VM $vm | ForEach-Object { $switch=$null; if($_.SwitchName){$switch=Get-VMSwitch -Name $_.SwitchName -ErrorAction SilentlyContinue}; [pscustomobject]@{Name=$_.Name;SwitchName=$_.SwitchName;SwitchType=if($switch){[string]$switch.SwitchType}else{$null}} });
$hostInfo=Get-VMHost;
[pscustomobject]@{Id=[string]$vm.Id;Name=$vm.Name;State=[string]$vm.State;ProcessorCount=$vm.ProcessorCount;MemoryStartup=$vm.MemoryStartup;Snapshots=$snapshots;Adapters=$adapters;EnhancedSessionModeEnabled=$hostInfo.EnableEnhancedSessionMode} | ConvertTo-Json -Depth 5 -Compress`;
  try {
    const data = parseJsonOutput<{ Id: string; Name: string; State: string; ProcessorCount: number; MemoryStartup: number; Snapshots: string[] | null; Adapters: Array<{ Name: string; SwitchName: string | null; SwitchType: string | null }> | { Name: string; SwitchName: string | null; SwitchType: string | null } | null; EnhancedSessionModeEnabled: boolean }>(await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { MALWARE_LAB_VM_ID: vmId }));
    const adapters = !data.Adapters ? [] : Array.isArray(data.Adapters) ? data.Adapters : [data.Adapters];
    const integrationsOff = data.EnhancedSessionModeEnabled === false ? false : null;
    return {
      providerId: 'hyper-v',
      vmId: data.Id,
      name: data.Name,
      powerState: normalizeHyperVState(data.State),
      cpuCount: data.ProcessorCount ?? null,
      memoryMb: data.MemoryStartup ? Math.round(data.MemoryStartup / 1024 / 1024) : null,
      snapshots: data.Snapshots ?? [],
      networkAdapters: adapters.map((adapter, index) => ({ slot: String(index + 1), mode: normalizeHyperVSwitchType(adapter.SwitchType ?? undefined), networkName: adapter.SwitchName ?? null })),
      integrations: { sharedFolders: integrationsOff, clipboard: integrationsOff, dragAndDrop: integrationsOff, usbPassthrough: integrationsOff }
    };
  } catch {
    throw new HypervisorOperationError('vm-not-found', `Hyper-V VM ${vmId} could not be inspected.`);
  }
}

export async function listVirtualMachines(): Promise<VmDescriptor[]> {
  const [virtualbox, hyperv] = await Promise.all([listVBoxVms(), listHyperVVms()]);
  return [...virtualbox, ...hyperv];
}

export async function inspectVirtualMachine(providerId: string, vmId: string): Promise<VmInspection> {
  if (providerId === 'virtualbox') return inspectVBoxVm(vmId);
  if (providerId === 'hyper-v') return inspectHyperVVm(vmId);
  throw new HypervisorOperationError('unsupported-provider', `Provider ${providerId} does not expose guarded VM operations.`);
}

function booleanCheck(id: string, label: string, actual: boolean | null, expectedDisabled: boolean): VmValidationCheck {
  if (actual === null) return { id, label, status: 'unknown', detail: 'Provider could not prove this integration is disabled.' };
  const pass = actual === expectedDisabled;
  return { id, label, status: pass ? 'pass' : 'fail', detail: pass ? 'Integration is disabled.' : 'Integration is enabled.' };
}

export async function validateVirtualMachine(providerId: ProviderId, vmId: string, profile: LabProfile): Promise<VmValidationReport> {
  const vm = await inspectVirtualMachine(providerId, vmId);
  const networkPass = vm.networkAdapters.length > 0 && vm.networkAdapters.every((adapter) => adapter.mode === 'internal' && adapter.networkName === profile.network.name);
  const checks: VmValidationCheck[] = [
    { id: 'powered-off', label: 'VM powered off', status: vm.powerState === 'powered-off' ? 'pass' : 'fail', detail: `Observed power state: ${vm.powerState}.` },
    { id: 'baseline-snapshot', label: 'Baseline snapshot exists', status: vm.snapshots.includes(profile.baselineSnapshot) ? 'pass' : 'fail', detail: vm.snapshots.includes(profile.baselineSnapshot) ? `Found ${profile.baselineSnapshot}.` : `Required snapshot ${profile.baselineSnapshot} was not found.` },
    { id: 'isolated-network', label: 'Guest-only isolated network', status: networkPass ? 'pass' : 'fail', detail: networkPass ? `All attached adapters use ${profile.network.name}.` : 'Every attached adapter must use the guest-only internal network defined by the profile.' },
    booleanCheck('shared-folders-disabled', 'Shared folders disabled', vm.integrations.sharedFolders, false),
    booleanCheck('clipboard-disabled', 'Clipboard disabled', vm.integrations.clipboard, false),
    booleanCheck('drag-drop-disabled', 'Drag and drop disabled', vm.integrations.dragAndDrop, false),
    booleanCheck('usb-disabled', 'USB passthrough disabled', vm.integrations.usbPassthrough, false),
    { id: 'cpu-capacity', label: 'CPU capacity', status: vm.cpuCount === null ? 'unknown' : vm.cpuCount >= profile.cpuCount ? 'pass' : 'fail', detail: vm.cpuCount === null ? 'CPU count unavailable.' : `Observed ${vm.cpuCount} vCPU; profile requires ${profile.cpuCount}.` },
    { id: 'memory-capacity', label: 'Memory capacity', status: vm.memoryMb === null ? 'unknown' : vm.memoryMb >= profile.memoryMb ? 'pass' : 'fail', detail: vm.memoryMb === null ? 'Memory unavailable.' : `Observed ${vm.memoryMb} MB; profile requires ${profile.memoryMb} MB.` }
  ];
  const safeToRestore = checks.find((check) => check.id === 'powered-off')?.status === 'pass' && checks.find((check) => check.id === 'baseline-snapshot')?.status === 'pass';
  return { vm, profileId: profile.id, safeToRestore, safeForFutureExecution: checks.every((check) => check.status === 'pass'), checks };
}

export async function restoreBaselineSnapshot(providerId: ProviderId, vmId: string, profile: LabProfile): Promise<VmRestoreResult> {
  const report = await validateVirtualMachine(providerId, vmId, profile);
  if (!report.safeToRestore) {
    if (report.vm.powerState !== 'powered-off') throw new HypervisorOperationError('unsafe-state', 'Baseline restore requires a powered-off VM.');
    throw new HypervisorOperationError('snapshot-missing', `Baseline snapshot ${profile.baselineSnapshot} is missing.`);
  }
  if (providerId === 'virtualbox') await run('VBoxManage', ['snapshot', vmId, 'restore', profile.baselineSnapshot]);
  else {
    const script = `$ErrorActionPreference='Stop'; $vm=Get-VM -Id $env:MALWARE_LAB_VM_ID; $snapshot=Get-VMSnapshot -VM $vm -Name $env:MALWARE_LAB_SNAPSHOT -ErrorAction Stop; Restore-VMSnapshot -VMSnapshot $snapshot -Confirm:$false`;
    await run('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], { MALWARE_LAB_VM_ID: vmId, MALWARE_LAB_SNAPSHOT: profile.baselineSnapshot });
  }
  return { providerId, vmId, snapshot: profile.baselineSnapshot, restored: true, message: 'Baseline restored. VM remains powered off.' };
}
