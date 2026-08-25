import { execFile } from 'node:child_process';
import os from 'node:os';
import { promisify } from 'node:util';
import type { HypervisorStatus } from '@malware-lab/shared-types';

const execFileAsync = promisify(execFile);
async function probe(command: string, args: string[], id: string, label: string): Promise<HypervisorStatus> {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, { timeout: 2500, windowsHide: true, maxBuffer: 64 * 1024 });
    const version = `${stdout}${stderr}`.trim().split(/\r?\n/)[0]?.slice(0, 120);
    return { id, label, available: true, ...(version ? { version } : {}) };
  } catch { return { id, label, available: false }; }
}

export async function probeHypervisors(): Promise<HypervisorStatus[]> {
  const probes: Array<Promise<HypervisorStatus>> = [
    probe('VBoxManage', ['--version'], 'virtualbox', 'VirtualBox'),
    probe('vmrun', ['-T', 'ws', 'list'], 'vmware', 'VMware Workstation')
  ];
  if (os.platform() === 'win32') probes.push(probe('powershell.exe', ['-NoProfile','-NonInteractive','-Command','(Get-Module -ListAvailable Hyper-V | Select-Object -First 1).Version.ToString()'], 'hyper-v', 'Hyper-V'));
  if (os.platform() === 'linux') probes.push(probe('virsh', ['--version'], 'libvirt', 'libvirt / KVM'));
  return Promise.all(probes);
}

export interface HypervisorProvider { readonly id: string; probe(): Promise<HypervisorStatus>; }
// Mutating VM operations intentionally do not live in the probe layer.
// They will be added behind an explicit lab safety policy and configuration gate.
