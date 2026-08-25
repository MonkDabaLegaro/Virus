import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProcessTree, buildFilesystemDiff, buildRegistryDiff, buildNetworkFlows, extractIndicators, buildAttackMappings, buildTimeline, buildAnalysisReport } from './index.ts';

const events = [
  {id:'evt-001',scenarioId:'wannacry',timestamp:'2017-05-12T10:00:00.000Z',kind:'process',action:'start',process:{pid:4920,ppid:740,image:'C:\\Lab\\Sample\\wannacry-demo.exe',commandLine:'wannacry-demo.exe --fixture'},tags:['fixture','synthetic']},
  {id:'evt-002',scenarioId:'wannacry',timestamp:'2017-05-12T10:00:01.000Z',kind:'filesystem',action:'rename',file:{path:'C:\\Lab\\Documents\\report.docx.WNCRY',extension:'WNCRY'},tags:['fixture','synthetic','ransomware-like']},
  {id:'evt-003',scenarioId:'wannacry',timestamp:'2017-05-12T10:00:01.500Z',kind:'filesystem',action:'rename',file:{path:'C:\\Lab\\Documents\\budget.xlsx.WNCRY',extension:'WNCRY'},tags:['fixture','synthetic','ransomware-like']},
  {id:'evt-004',scenarioId:'wannacry',timestamp:'2017-05-12T10:00:02.000Z',kind:'registry',action:'set-value',registry:{key:'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',valueName:'LabFixture'},tags:['fixture','synthetic']},
  {id:'evt-005',scenarioId:'wannacry',timestamp:'2017-05-12T10:00:02.500Z',kind:'network',action:'connect',network:{protocol:'tcp',destinationIp:'192.0.2.25',destinationPort:445},tags:['fixture','synthetic','documentation-ip']},
  {id:'evt-006',scenarioId:'wannacry',timestamp:'2017-05-12T10:00:03.000Z',kind:'process',action:'stop',process:{pid:4920,ppid:740,image:'C:\\Lab\\Sample\\wannacry-demo.exe'},tags:['fixture','synthetic']}
] as any;
const findings = [
  {id:'det-ransomware-extension',ruleId:'LAB-RANSOM-001',title:'Burst of ransomware-style extension changes',severity:'high',eventIds:['evt-002','evt-003'],rationale:'fixture'},
  {id:'det-smb-activity',ruleId:'LAB-NET-001',title:'SMB activity observed in replay',severity:'medium',eventIds:['evt-005'],rationale:'fixture'},
  {id:'det-run-key',ruleId:'LAB-REG-001',title:'Run key modification',severity:'high',eventIds:['evt-004'],rationale:'fixture'}
] as any;

test('builds a process lifecycle without inventing missing parent nodes',()=>{ const tree=buildProcessTree(events); assert.equal(tree.length,1); assert.deepEqual(tree[0],{pid:4920,parentPid:740,image:'C:\\Lab\\Sample\\wannacry-demo.exe',commandLine:'wannacry-demo.exe --fixture',startedAt:'2017-05-12T10:00:00.000Z',stoppedAt:'2017-05-12T10:00:03.000Z',childPids:[],eventIds:['evt-001','evt-006']}); });
test('describes filesystem and registry changes as observed deltas',()=>{ const fs=buildFilesystemDiff(events); const reg=buildRegistryDiff(events); assert.equal(fs.length,2); assert.equal(fs[0]?.action,'rename'); assert.equal(reg[0]?.valueName,'LabFixture'); });
test('aggregates repeated network observations into flows',()=>{ const flows=buildNetworkFlows([events[4],{...events[4],id:'evt-007',timestamp:'2017-05-12T10:00:04.000Z'}]); assert.equal(flows[0]?.count,2); assert.deepEqual(flows[0]?.eventIds,['evt-005','evt-007']); });
test('extracts unique evidence indicators with provenance',()=>{ const indicators=extractIndicators(events); assert.ok(indicators.some(i=>i.type==='ip'&&i.value==='192.0.2.25')); assert.ok(indicators.some(i=>i.type==='file-extension'&&i.value==='WNCRY')); });
test('maps defensive findings to ATT&CK with explicit confidence',()=>{ assert.deepEqual(buildAttackMappings(findings).map(m=>[m.techniqueId,m.confidence]),[['T1486','high'],['T1021.002','low'],['T1547.001','high']]); });
test('builds a time-ordered session timeline and report',()=>{ const timeline=buildTimeline(events,findings); assert.equal(timeline[0]?.timestamp,'2017-05-12T10:00:00.000Z'); assert.ok(timeline.some(e=>e.kind==='detection')); const report=buildAnalysisReport('wannacry',events,findings,'2026-08-25T16:00:00.000Z'); assert.equal(report.summary.events,6); assert.equal(report.attackMappings.length,3); });
