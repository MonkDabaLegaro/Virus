# Telemetry collectors

## Purpose

Collectors are normalization boundaries between external defensive evidence and the internal `TelemetryEvent[]` contract. They do not execute samples, issue guest commands, capture traffic, or collect from the host.

Current package:

```text
packages/collectors/
  src/index.ts
  src/index.test.ts
```

## Collector contract

Every collector exposes:

- a stable collector ID;
- a source classification;
- a `collect(input)` method;
- a normalized `CollectorResult` containing `TelemetryEvent[]`.

Every imported event receives provenance tags so downstream analysis can distinguish synthetic fixture replay from imported observations.

## Available collectors

### `fixture`

Source: `fixture`

Purpose: load repository-owned synthetic telemetry fixtures through the same normalization boundary used by other evidence sources.

Safety properties:

- runtime validation of event structure;
- scenario ID consistency check;
- maximum 5,000 events per replay;
- adds `collector:fixture` provenance;
- no guest or host execution.

Fixtures are resolved by scenario ID across all malware categories. Duplicate matching fixture IDs are rejected as ambiguous.

### `windows-observation`

Source: `imported-observation`

Purpose: normalize already-observed Windows evidence supplied as structured JSON.

Supported observations:

- process start/stop;
- filesystem create/modify/rename/delete;
- Registry set/delete value and create/delete key;
- network connect/listen observations.

Safety properties:

- maximum 5,000 observations per request;
- timestamps, process IDs, ports and field lengths are validated;
- deterministic event IDs within each import;
- adds `collector:windows-observation` and `source:imported-observation` provenance;
- performs no PowerShell, WMI, WinRM, ETW, packet capture or guest-agent execution.

## HTTP surface

```text
GET  /api/collectors
POST /api/telemetry/import/windows
POST /api/telemetry/replay/:scenarioId
```

The Windows import body is:

```json
{
  "scenarioId": "wannacry",
  "observations": [
    {
      "kind": "process",
      "timestamp": "2026-08-25T18:00:00.000Z",
      "action": "start",
      "pid": 4100,
      "ppid": 900,
      "image": "C:\\Lab\\sample.exe"
    }
  ]
}
```

A successful import replaces the active in-memory telemetry session. It does not append observations from unrelated scenarios.

## Next adapters

Future adapters may consume exports from defensive guest tooling, but they must preserve the same boundary: external tooling produces evidence, the collector only parses and normalizes it. Any active guest instrumentation or execution requires a separate reviewed capability and must not be added implicitly to this package.
