import { randomUUID } from 'node:crypto';
import type { LabSession, LabState } from '@malware-lab/shared-types';

type LabAction = 'prepare' | 'detect' | 'contain' | 'remediate' | 'restore';
const transitions: Record<LabAction, LabState> = { prepare: 'prepared', detect: 'detected', contain: 'contained', remediate: 'remediating', restore: 'clean' };

export class LabRegistry {
  private readonly sessions = new Map<string, LabSession>();
  list(): LabSession[] { return [...this.sessions.values()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)); }
  create(scenarioId: string, scenarioName: string): LabSession {
    const now = new Date().toISOString();
    const lab: LabSession = { id: randomUUID(), scenarioId, scenarioName, state: 'idle', createdAt: now, updatedAt: now, vmName: null, snapshot: null };
    this.sessions.set(lab.id, lab);
    return lab;
  }
  transition(id: string, action: LabAction): LabSession | null {
    const current = this.sessions.get(id);
    if (!current) return null;
    const updated: LabSession = { ...current, state: transitions[action], vmName: action === 'prepare' ? 'analysis-win-01' : current.vmName, snapshot: action === 'prepare' ? 'clean-baseline' : current.snapshot, updatedAt: new Date().toISOString() };
    this.sessions.set(id, updated);
    return updated;
  }
}
