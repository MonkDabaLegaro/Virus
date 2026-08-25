# Telemetry collectors

## Purpose

Collectors are normalization boundaries between external defensive evidence and the internal `TelemetryEvent[]` contract. They do not execute samples, issue guest commands, capture traffic, or collect from the host.

Current package:

```text
packages/collectors/
  src/index.ts
  src/index.test.ts
  src/adapters.ts
  src/adapters.test.ts
```

## Collector contract

Every collector exposes a stable collector ID, source classification, `collect(input)` method and normalized `CollectorResult` containing `TelemetryEvent[]`.

Every imported event receives provenance tags so downstream analysis can distinguish synthetic fixture replay from imported observations.

## Available collectors

### `fixture`

Loads repository-owned synthetic telemetry fixtures through runtime validation. It enforces scenario consistency, a maximum of 5,000 events and `collector:fixture` provenance. Fixtures are resolved across all scenario categories and duplicate IDs are rejected as ambiguous.

### `windows-observation`

Normalizes already-observed Windows evidence supplied as structured JSON. Supported observations are process lifecycle, filesystem mutations, Registry mutations and network connect/listen events.

The collector validates timestamps, PIDs, ports and field lengths, generates deterministic event IDs, adds `collector:windows-observation` and `source:imported-observation`, and performs no PowerShell, WMI, WinRM, ETW, packet capture or guest-agent execution.

## Export adapters

Adapters translate exports from defensive tooling into `WindowsObservation[]`. They are pure parsers: no tool invocation, filesystem traversal, host inspection or guest communication occurs.

### `sysmon-json`

Supported exported Sysmon event IDs:

- `1` Process Create -> process `start`;
- `3` Network Connection -> network `connect`;
- `5` Process Terminated -> process `stop`;
- `11` File Create -> filesystem `create`;
- `12` Registry Object Create/Delete -> currently normalized conservatively as `create-key` when exported as a supported object event;
- `13` Registry Value Set -> Registry `set-value`.

Unsupported event IDs are ignored rather than assigned speculative semantics. Supported rows with malformed required fields are rejected.

### `procmon-csv` / `procmon-json`

Supported operations are deliberately conservative:

- `WriteFile` -> filesystem `modify`;
- `SetRenameInformationFile` / `SetRenameInformationEx` -> filesystem `rename`;
- `RegSetValue` -> Registry `set-value`;
- `RegDeleteValue` -> Registry `delete-value`;
- `RegCreateKey` -> Registry `create-key`;
- `RegDeleteKey` -> Registry `delete-key`.

`CreateFile` is intentionally not mapped because Process Monitor uses it for opens as well as creates; treating it as a file creation would overstate the evidence.

Procmon exports require the capture day because the common CSV `Time of Day` field has no date component.

### `network-flow-json`

Accepts generic flow rows using `timestamp`, `protocol`, `destinationIp`, `destinationPort`, plus Zeek-style aliases `ts`, `proto`, `id.resp_h`, `id.resp_p`. Rows normalize to network `connect` observations.

## HTTP surface

```text
GET  /api/collectors
POST /api/telemetry/import/windows
POST /api/telemetry/import/exported
POST /api/telemetry/replay/:scenarioId
```

Exported evidence request:

```json
{
  "scenarioId": "wannacry",
  "format": "sysmon-json",
  "data": [
    {
      "EventID": 3,
      "UtcTime": "2026-08-25 18:00:01.000",
      "Protocol": "tcp",
      "DestinationIp": "192.0.2.25",
      "DestinationPort": "445"
    }
  ]
}
```

For `procmon-csv` and `procmon-json`, also send:

```json
{
  "procmonDay": "2026-08-25"
}
```

A successful import replaces the active in-memory telemetry session and then flows through the existing detection, analysis and reporting pipeline.

## Safety boundary

These adapters ingest evidence that has already been exported elsewhere. They do not deploy or configure Sysmon/Procmon, execute commands in the guest, transfer samples, inspect credentials, capture keystrokes, or start network sniffing. Active instrumentation requires a separate reviewed capability and must not be introduced implicitly through this package.
