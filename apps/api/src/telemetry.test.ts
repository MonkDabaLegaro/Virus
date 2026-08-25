import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { resolveScenarioFixturePath } from './telemetry.ts';

test('resolves a scenario telemetry fixture independent of malware category', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'malware-lab-fixture-'));
  try {
    const fixture = path.join(root, 'scenarios', 'spyware', 'regin', 'fixtures', 'telemetry.json');
    await mkdir(path.dirname(fixture), { recursive: true });
    await writeFile(fixture, '[]', 'utf8');

    assert.equal(await resolveScenarioFixturePath(root, 'regin'), fixture);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test('rejects ambiguous duplicate scenario fixture ids', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'malware-lab-fixture-'));
  try {
    for (const category of ['ransomware', 'worm']) {
      const fixture = path.join(root, 'scenarios', category, 'duplicate', 'fixtures', 'telemetry.json');
      await mkdir(path.dirname(fixture), { recursive: true });
      await writeFile(fixture, '[]', 'utf8');
    }

    await assert.rejects(resolveScenarioFixturePath(root, 'duplicate'), /Ambiguous scenario fixture/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
