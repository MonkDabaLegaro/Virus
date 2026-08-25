import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptNetworkFlowExport, adaptProcmonExport, adaptSysmonExport } from './adapters.ts';

test('sysmon adapter maps supported exported events to defensive observations', () => {
  const observations = adaptSysmonExport([
    { EventID: 1, UtcTime: '2026-08-25 18:00:00.000', ProcessId: '4100', ParentProcessId: '900', Image: 'C:\\Lab\\sample.exe', CommandLine: 'sample.exe --observed' },
    { EventID: 3, UtcTime: '2026-08-25 18:00:01.000', Protocol: 'tcp', DestinationIp: '192.0.2.25', DestinationPort: '445' },
    { EventID: 11, UtcTime: '2026-08-25 18:00:02.000', TargetFilename: 'C:\\Lab\\doc.txt.WNCRY' },
    { EventID: 13, UtcTime: '2026-08-25 18:00:03.000', TargetObject: 'HKCU\\Software\\Lab\\Observed' },
    { EventID: 5, UtcTime: '2026-08-25 18:00:04.000', ProcessId: '4100', Image: 'C:\\Lab\\sample.exe' }
  ]);

  assert.deepEqual(observations.map((item) => item.kind), ['process', 'network', 'filesystem', 'registry', 'process']);
  assert.equal(observations[0]?.kind === 'process' ? observations[0].action : null, 'start');
  assert.equal(observations[4]?.kind === 'process' ? observations[4].action : null, 'stop');
});

test('sysmon adapter ignores unsupported event ids instead of inventing semantics', () => {
  assert.deepEqual(adaptSysmonExport([{ EventID: 22, UtcTime: '2026-08-25 18:00:00.000', QueryName: 'example.test' }]), []);
});

test('procmon adapter maps explicit writes, renames and registry mutations only', () => {
  const csv = [
    'Time of Day,Process Name,PID,Operation,Path,Result,Detail',
    '18:00:00.000,sample.exe,4100,CreateFile,C:\\Lab\\readme.txt,SUCCESS,Desired Access: Read Attributes',
    '18:00:01.000,sample.exe,4100,WriteFile,C:\\Lab\\doc.txt.WNCRY,SUCCESS,Offset: 0',
    '18:00:02.000,sample.exe,4100,SetRenameInformationFile,C:\\Lab\\renamed.WNCRY,SUCCESS,ReplaceIfExists: True',
    '18:00:03.000,sample.exe,4100,RegSetValue,HKCU\\Software\\Lab\\Observed,SUCCESS,Type: REG_SZ'
  ].join('\n');

  const observations = adaptProcmonExport(csv, '2026-08-25');
  assert.deepEqual(observations.map((item) => item.kind), ['filesystem', 'filesystem', 'registry']);
  assert.equal(observations[0]?.kind === 'filesystem' ? observations[0].action : null, 'modify');
  assert.equal(observations[1]?.kind === 'filesystem' ? observations[1].action : null, 'rename');
});

test('network flow adapter supports generic and zeek-style exported rows', () => {
  const observations = adaptNetworkFlowExport([
    { timestamp: '2026-08-25T18:00:00.000Z', protocol: 'tcp', destinationIp: '192.0.2.25', destinationPort: 445 },
    { ts: 1787680801, proto: 'udp', 'id.resp_h': '198.51.100.10', 'id.resp_p': 53 }
  ]);

  assert.equal(observations.length, 2);
  assert.ok(observations.every((item) => item.kind === 'network' && item.action === 'connect'));
  assert.equal(observations[1]?.kind === 'network' ? observations[1].destinationPort : null, 53);
});

test('adapters reject malformed supported rows rather than partially normalizing them', () => {
  assert.throws(() => adaptSysmonExport([{ EventID: 3, UtcTime: 'bad', Protocol: 'tcp', DestinationIp: '192.0.2.25', DestinationPort: '70000' }]), /Invalid Sysmon export/);
  assert.throws(() => adaptNetworkFlowExport([{ timestamp: 'bad', protocol: 'tcp', destinationIp: '192.0.2.25', destinationPort: 445 }]), /Invalid network flow export/);
});
