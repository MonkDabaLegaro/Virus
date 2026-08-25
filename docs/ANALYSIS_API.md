# Analysis API

The control plane exposes one aggregate forensic contract so consumers do not rebuild evidence interpretation independently.

## Endpoints

- `GET /api/analysis/report` returns the current `AnalysisReport`.
- `GET /api/analysis/report.md` renders the same report as Markdown in memory.
- `GET /api/detections/correlations` returns multi-signal defensive correlations.

The report includes process lifecycles, observed filesystem and Registry deltas, aggregated network flows, evidence indicators, ATT&CK mappings, findings, correlations and a unified timeline.

`report.md` does not write to the host filesystem. The browser can display or copy the generated Markdown. Fixture-derived reports remain explicitly marked as synthetic evidence.
