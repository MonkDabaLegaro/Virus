# Hypervisor adapters

Malware Security Lab separates hypervisor discovery from guarded VM operations.

## Implemented guarded adapters

### VirtualBox

Uses `VBoxManage` with argument arrays and without shell interpolation.

Supported operations:

- list VMs;
- inspect VM state, CPU, memory, snapshots and network adapters;
- inspect clipboard, drag-and-drop, shared-folder and USB settings when VirtualBox exposes them;
- validate a VM against `lab-profiles/windows-analysis.json`;
- restore the configured baseline snapshot while the VM is powered off.

A network adapter only passes isolation when it uses VirtualBox `intnet` and the configured network name.

### Hyper-V

Uses PowerShell with fixed scripts. VM IDs and snapshot names are passed through environment variables instead of being interpolated into PowerShell source.

Supported operations are equivalent to the VirtualBox adapter. A Hyper-V `Private` switch is normalized as the lab's guest-only `internal` network. A Hyper-V `Internal` switch is explicitly normalized as `host-only` because it connects guests to the host and therefore fails validation.

Hyper-V host Enhanced Session Mode must be disabled before clipboard/drive-style integrations can be proven disabled. If the adapter cannot prove an integration is disabled, the validation result is `unknown` and the VM is not considered ready for future execution.

## Deliberately absent

The guarded adapter does not expose:

- VM start;
- VM resume;
- sample transfer;
- guest command execution;
- network reconfiguration;
- malware detonation.

Those capabilities remain outside the current execution surface even when a hypervisor is installed.

## Baseline restore

`POST /api/vms/restore-baseline` is the only mutating hypervisor operation currently exposed. It requires the target VM to be powered off and the configured baseline snapshot/checkpoint to exist. The operation does not start the VM afterwards.
