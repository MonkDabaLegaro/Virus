import { randomUUID } from 'node:crypto';
import type { LabSession, LabState } from '@malware-lab/shared-types';

export type LabAction = 'prepare' | 'detect' | 'contain' | 'remediate' | 'restore';

const allowedByState: Record<LabState, readonly LabAction[]> = {
  idle: ['prepare'],
  prepared: ['detect'],
  running: ['detect'],
  detected: ['contain'],
  contained: ['remediate'],
  remediating: ['restore'],
  clean: ['prepare']
};

const nextState: Record<LabAction, LabState> = {
  prepare: 'prepared',
  detect: 'detected',
  contain: 'contained',
  remediate: 'remediating',
  restore: 'clean'
};

export class LabTransitionError extends Error {
  readonly currentState: LabState;
  readonly action: LabAction;
  readonly allowedActions: readonly LabAction[];

  constructor(currentState: LabState, action: LabAction) {
    const allowedActions = allowedByState[currentState];
    super(`Action ${action} is not allowed from state ${currentState}. Allowed: ${allowedActions.join(', ') || 'none'}.`);
    this.name = 'LabTransitionError';
    this.currentState = currentState;
    this.action = action;
    this.allowedActions = allowedActions;
  }
}

export function getAllowedLabActions(state: LabState): readonly LabAction[] {
  return allowedByState[state];
}

export class LabRegistry {
  private readonly sessions = new Map<string, LabSession>();

  list(): LabSession[] {
    return [...this.sessions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  get(id: string): LabSession | null {
    return this.sessions.get(id) ?? null;
  }

  create(scenarioId: string, scenarioName: string): LabSession {
    const now = new Date().toISOString();
    const lab: LabSession = {
      id: randomUUID(),
      scenarioId,
      scenarioName,
      state: 'idle',
      createdAt: now,
      updatedAt: now,
      vmName: null,
      snapshot: null
    };
    this.sessions.set(lab.id, lab);
    return lab;
  }

  transition(id: string, action: LabAction, binding?: { vmName?: string; snapshot?: string }): LabSession | null {
    const current = this.sessions.get(id);
    if (!current) return null;
    if (!allowedByState[current.state].includes(action)) throw new LabTransitionError(current.state, action);

    const updated: LabSession = {
      ...current,
      state: nextState[action],
      vmName: binding?.vmName ?? current.vmName,
      snapshot: binding?.snapshot ?? current.snapshot,
      updatedAt: new Date().toISOString()
    };
    this.sessions.set(id, updated);
    return updated;
  }
}
