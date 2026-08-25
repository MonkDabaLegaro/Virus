# Defensive analysis model

The analysis layer derives forensic views from `TelemetryEvent[]`; it never executes a sample or changes the guest.

## Derived artifacts

- process lifecycle/tree;
- observed filesystem and Registry deltas;
- aggregated network flows;
- evidence indicators with source event IDs;
- detection correlations;
- MITRE ATT&CK mappings with explicit confidence;
- a unified analysis timeline;
- a Markdown report.

A filesystem or Registry "diff" means **observed changes in telemetry**. The system does not invent a previous value or filename when the collector did not provide one.

## ATT&CK mapping policy

Mappings are generated from defensive findings, not directly from a family name.

- `LAB-RANSOM-001` -> `T1486 Data Encrypted for Impact`, high confidence.
- `LAB-REG-001` -> `T1547.001 Registry Run Keys / Startup Folder`, high confidence.
- `LAB-NET-001` -> `T1021.002 SMB/Windows Admin Shares`, low confidence. TCP/445 is contextual evidence and does not by itself prove use of an administrative share.

Canonical references:

- https://attack.mitre.org/techniques/T1486/
- https://attack.mitre.org/techniques/T1547/001/
- https://attack.mitre.org/techniques/T1021/002/

## Safety boundary

Fixture-backed reports are synthetic. Indicators extracted from fixtures are evidence values for the exercise, not claims about a real compromised host. The current analysis API remains read-only with respect to the VM and host.
