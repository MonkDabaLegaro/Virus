import test from 'node:test';
import assert from 'node:assert/strict';
import { parseObservationImport } from './import-model.ts';

test('parses a JSON observation array', () => {
  const observations = parseObservationImport('[{"kind":"process"}]');
  assert.equal(observations.length, 1);
  assert.deepEqual(observations[0], { kind: 'process' });
});

test('rejects non-array JSON input', () => {
  assert.throws(() => parseObservationImport('{"kind":"process"}'), /JSON array/);
});

test('rejects imports above the API limit', () => {
  const input = JSON.stringify(Array.from({ length: 5001 }, () => ({ kind: 'process' })));
  assert.throws(() => parseObservationImport(input), /5,000/);
});
