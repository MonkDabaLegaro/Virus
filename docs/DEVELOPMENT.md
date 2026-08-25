# Development

## Requirements

- Node.js 22 or newer.
- npm with workspace support.
- Optional: VirtualBox or Hyper-V for guarded VM inspection and baseline restore.

The web and API bind to loopback addresses by default. No public deployment is required for the laboratory control plane.

## Install

```bash
npm install
```

## Development

```bash
npm run dev
```

The default services are:

- web: `http://127.0.0.1:4300`;
- API: `http://127.0.0.1:4310`.

## Verification

Run the same sequence used by CI:

```bash
npm run typecheck
npm test
npm run build
```

Tests for pure domain packages use Node's built-in test runner and TypeScript stripping under Node 22. CI runs on Ubuntu and does not require a hypervisor because guarded hypervisor operations are not invoked by the build/test pipeline.

## Safety during development

Do not commit malware binaries. The `samples/`, `quarantine/`, `.malware-lab/` and `*.vir` paths are ignored. Fixture-backed telemetry is synthetic. Real-execution support remains disabled.
