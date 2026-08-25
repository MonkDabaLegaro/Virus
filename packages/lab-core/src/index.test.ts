import test from 'node:test';
import assert from 'node:assert/strict';
import { LabRegistry, LabTransitionError } from './index.ts';

function createPrepared(registry: LabRegistry) {
  const lab = registry.create('wannacry', 'WannaCry');
  return registry.transition(lab.id, 'prepare', {
    vmName: 'malware-lab-win-analysis',
    snapshot: 'clean-baseline'
  })!;
}

test('accepts the guarded lifecycle in order', () => {
  const registry = new LabRegistry();
  let lab = createPrepared(registry);
  assert.equal(lab.state, 'prepared');

  lab = registry.transition(lab.id, 'detect')!;
  assert.equal(lab.state, 'detected');

  lab = registry.transition(lab.id, 'contain')!;
  assert.equal(lab.state, 'contained');

  lab = registry.transition(lab.id, 'remediate')!;
  assert.equal(lab.state, 'remediating');

  lab = registry.transition(lab.id, 'restore')!;
  assert.equal(lab.state, 'clean');
});

test('rejects actions that skip lifecycle phases', () => {
  const registry = new LabRegistry();
  const lab = registry.create('wannacry', 'WannaCry');

  assert.throws(() => registry.transition(lab.id, 'contain'), (error: unknown) => {
    assert.ok(error instanceof LabTransitionError);
    assert.equal(error.currentState, 'idle');
    assert.equal(error.action, 'contain');
    assert.deepEqual(error.allowedActions, ['prepare']);
    return true;
  });
});

test('allows a clean lab to be prepared for a new cycle', () => {
  const registry = new LabRegistry();
  let lab = createPrepared(registry);
  lab = registry.transition(lab.id, 'detect')!;
  lab = registry.transition(lab.id, 'contain')!;
  lab = registry.transition(lab.id, 'remediate')!;
  lab = registry.transition(lab.id, 'restore')!;
  lab = registry.transition(lab.id, 'prepare', {
    vmName: 'malware-lab-win-analysis',
    snapshot: 'clean-baseline'
  })!;

  assert.equal(lab.state, 'prepared');
});

test('returns null for a missing lab instead of treating it as a transition error', () => {
  const registry = new LabRegistry();
  assert.equal(registry.transition('missing', 'prepare'), null);
});
