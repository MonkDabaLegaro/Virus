import test from 'node:test';
import assert from 'node:assert/strict';
import { FixtureTelemetryCollector, WindowsObservationCollector } from './index.ts';

const fixtureEvent = {
  id: 'evt-001',
  scenarioId: 'wannacry',
  timestamp: '2017-05-12T10:00:00.000Z',
  kind: 'process' as const,
  action: 'start',
  process: { pid: 4920, ppid: 740, image: 'C:\\Lab\\Sample\\wannacry-demo.exe' },
  tags: ['fixture', 'synthetic']
};

test('fixture collector preserves event semantics and adds collector provenance', async () => {
  const collector = new FixtureTelemetryCollector();
  const result = await collector.collect({ scenarioId: 'wannacry', events: [fixtureEvent] });

  assert.equal(result.collectorId, 'fixture');
  assert.equal(result.source, 'fixture');
  assert.equal(result.scenarioId, 'wannacry');
  assert.equal(result.events[0]?.id, 'evt-001');
  assert.deepEqual(result.events[0]?.tags, ['fixture', 'synthetic', 'collector:fixture']);
});

test('fixture collector rejects malformed telemetry instead of trusting JSON casts', async () => {
  const collector = new FixtureTelemetryCollector();
  await assert.rejects(
    collector.collect({ scenarioId: 'wannacry', events: [{ id: 'bad', scenarioId: 'wannacry', timestamp: 'not-a-date', kind: 'process', action: 'start', tags: [] } as any] }),
    /Invalid fixture telemetry event/
  );
});

test('windows collector normalizes structured process, filesystem, registry and network observations', async () => {
  const collector = new WindowsObservationCollector();
  const result = await collector.collect({
    scenarioId: 'wannacry',
    observations: [
      { kind: 'process', timestamp: '2026-08-25T18:00:00.000Z', action: 'start', pid: 4100, ppid: 900, image: 'C:\\Lab\\sample.exe', commandLine: 'sample.exe --observed' },
      { kind: 'filesystem', timestamp: '2026-08-25T18:00:01.000Z', action: 'rename', path: 'C:\\Lab\\doc.txt.WNCRY', extension: 'WNCRY' },
      { kind: 'registry', timestamp: '2026-08-25T18:00:02.000Z', action: 'set-value', key: 'HKCU\\Software\\Lab', valueName: 'Observed' },
      { kind: 'network', timestamp: '2026-08-25T18:00:03.000Z', action: 'connect', protocol: 'tcp', destinationIp: '192.0.2.25', destinationPort: 445 }
    ]
  });

  assert.equal(result.collectorId, 'windows-observation');
  assert.equal(result.events.length, 4);
  assert.deepEqual(result.events.map((event) => event.kind), ['process', 'filesystem', 'registry', 'network']);
  assert.ok(result.events.every((event) => event.tags.includes('collector:windows-observation')));
  assert.ok(result.events.every((event) => event.tags.includes('source:imported-observation')));
});

test('windows collector rejects malformed imported observations', async () => {
  const collector = new WindowsObservationCollector();

  await assert.rejects(
    collector.collect({
      scenarioId: 'wannacry',
      observations: [{ kind: 'network', timestamp: 'not-a-date', action: 'connect', protocol: 'tcp', destinationIp: '192.0.2.25', destinationPort: 70000 }]
    }),
    /Invalid Windows observation/
  );
});

test('windows collector creates deterministic event ids from the import order', async () => {
  const collector = new WindowsObservationCollector();
  const result = await collector.collect({
    scenarioId: 'wannacry',
    observations: [
      { kind: 'process', timestamp: '2026-08-25T18:00:00.000Z', action: 'start', pid: 1, ppid: null, image: 'C:\\Lab\\a.exe' },
      { kind: 'process', timestamp: '2026-08-25T18:00:01.000Z', action: 'stop', pid: 1, ppid: null, image: 'C:\\Lab\\a.exe' }
    ]
  });

  assert.deepEqual(result.events.map((event) => event.id), ['windows-observation-0001', 'windows-observation-0002']);
});
