# Lab state machine

The laboratory lifecycle is intentionally strict. A UI action cannot skip defensive phases, and the API enforces the same rule independently of the frontend.

## Allowed transitions

```text
idle        --prepare-->   prepared
clean       --prepare-->   prepared
prepared    --detect-->    detected
running     --detect-->    detected
detected    --contain-->   contained
contained   --remediate--> remediating
remediating --restore-->   clean
```

`running` is retained as a future execution-state contract but the current product exposes no action that starts a VM or runs a sample.

Any other action raises `LabTransitionError`. The HTTP control plane converts that error into `409 Conflict` with the current state, rejected action and list of allowed actions.

The frontend mirrors the transition table only to disable impossible controls. Backend enforcement remains authoritative.
