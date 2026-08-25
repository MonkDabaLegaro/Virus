import cors from '@fastify/cors';
import Fastify from 'fastify';
import { readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { LabRegistry, LabTransitionError } from '@malware-lab/lab-core';
import { HypervisorOperationError, inspectVirtualMachine, listVirtualMachines, probeHypervisors, restoreBaselineSnapshot, validateVirtualMachine } from '@malware-lab/hypervisor';
import { SampleRegistry } from '@malware-lab/sample-registry';
import { createTelemetryService } from './telemetry';
import type { LabExecutionPlan, LabProfile, ScenarioSummary, TelemetryKind } from '@malware-lab/shared-types';

const app = Fastify({ logger: true });
await app.register(cors, { origin: ['http://127.0.0.1:4300', 'http://localhost:4300'] });
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const scenarioRoot = path.join(repoRoot, 'scenarios');
const sampleRegistry = new SampleRegistry(path.join(repoRoot, '.malware-lab', 'sample-registry.json'));
const registry = new LabRegistry();
const telemetry = createTelemetryService(repoRoot);

const manifestSchema = z.object({ id:z.string(), name:z.string(), category:z.enum(['ransomware','spyware','trojan','worm']), year:z.number().int(), platform:z.string(), risk:z.enum(['low','medium','high','critical']), description:z.string(), executionPolicy:z.literal('vm-only') });
const profileSchema = z.object({ id:z.string(), label:z.string(), vmName:z.string().min(1), guestOs:z.string(), architecture:z.string(), cpuCount:z.number().int().positive(), memoryMb:z.number().int().positive(), disposable:z.literal(true), baselineSnapshot:z.string(), network:z.object({mode:z.literal('internal'),name:z.string(),hostAccess:z.literal(false),internetAccess:z.literal(false)}), integrations:z.object({sharedFolders:z.literal(false),clipboard:z.literal(false),dragAndDrop:z.literal(false),usbPassthrough:z.literal(false)}) });
async function loadScenarios():Promise<ScenarioSummary[]>{ const files=await readdir(scenarioRoot,{recursive:true}); const manifests=files.filter(e=>e.endsWith('manifest.json')); return (await Promise.all(manifests.map(async e=>manifestSchema.parse(JSON.parse(await readFile(path.join(scenarioRoot,e),'utf8')))))).sort((a,b)=>a.name.localeCompare(b.name)); }
async function loadLabProfile():Promise<LabProfile>{ return profileSchema.parse(JSON.parse(await readFile(path.join(repoRoot,'lab-profiles','windows-analysis.json'),'utf8'))); }
async function resolveProfile(profileId?:string){ const p=await loadLabProfile(); if(profileId&&p.id!==profileId) throw new Error('Lab profile not found'); return p; }

app.get('/health',async()=>({status:'ok'}));
app.get('/api/system',async()=>({host:{platform:os.platform(),architecture:os.arch(),hostname:os.hostname()},mode:'local-only' as const,networkPolicy:'isolated-lab-only' as const,realExecutionEnabled:false,hypervisors:await probeHypervisors()}));
app.get('/api/scenarios',async()=>loadScenarios());
app.get<{Params:{id:string}}>('/api/scenarios/:id',async(req,reply)=>{ const s=(await loadScenarios()).find(x=>x.id===req.params.id); if(!s)return reply.code(404).send({message:'Scenario not found'}); return s; });
app.get('/api/samples',async()=>sampleRegistry.list());
app.post('/api/samples',async(req,reply)=>{ const body=z.object({sha256:z.string().regex(/^[a-f0-9]{64}$/i),family:z.string().min(1).max(80),aliases:z.array(z.string().min(1).max(80)).max(20).optional(),sourceReference:z.string().max(500).nullable().optional()}).parse(req.body); return reply.code(201).send(await sampleRegistry.register(body)); });
app.get('/api/lab-profiles',async()=>[await loadLabProfile()]);

app.get('/api/vms',async()=>listVirtualMachines());
app.get<{Params:{providerId:string;vmId:string}}>('/api/vms/:providerId/:vmId',async req=>inspectVirtualMachine(req.params.providerId,req.params.vmId));
app.post('/api/vms/validate',async req=>{ const body=z.object({providerId:z.enum(['virtualbox','hyper-v']),vmId:z.string().min(1),profileId:z.string().optional()}).parse(req.body); return validateVirtualMachine(body.providerId,body.vmId,await resolveProfile(body.profileId)); });
app.post('/api/vms/restore-baseline',async req=>{ const body=z.object({providerId:z.enum(['virtualbox','hyper-v']),vmId:z.string().min(1),profileId:z.string().optional()}).parse(req.body); return restoreBaselineSnapshot(body.providerId,body.vmId,await resolveProfile(body.profileId)); });

app.post<{Params:{scenarioId:string}}>('/api/telemetry/replay/:scenarioId',async(req,reply)=>{ const scenario=(await loadScenarios()).find(x=>x.id===req.params.scenarioId); if(!scenario)return reply.code(404).send({message:'Scenario not found'}); return telemetry.replay(scenario.id); });
app.get('/api/telemetry/events',async req=>{ const query=z.object({kind:z.enum(['process','filesystem','registry','network']).optional()}).parse(req.query); return telemetry.events(query.kind as TelemetryKind|undefined); });
app.get('/api/telemetry/summary',async()=>telemetry.summary());
app.get('/api/detections',async()=>telemetry.findings());
app.get('/api/detections/correlations',async()=>telemetry.correlations());
app.get('/api/analysis/report',async()=>telemetry.report());
app.get('/api/analysis/report.md',async(_req,reply)=>reply.type('text/markdown; charset=utf-8').send(telemetry.markdownReport()));

app.get('/api/labs',async()=>registry.list());
app.post('/api/labs',async(req,reply)=>{ const body=z.object({scenarioId:z.string()}).parse(req.body); const s=(await loadScenarios()).find(x=>x.id===body.scenarioId); if(!s)return reply.code(404).send({message:'Scenario not found'}); return registry.create(s.id,s.name); });
app.get<{Params:{id:string}}>('/api/labs/:id/plan',async(req,reply)=>{ const lab=registry.get(req.params.id); if(!lab)return reply.code(404).send({message:'Lab not found'}); const hypervisors=await probeHypervisors(); const profile=await loadLabProfile(); const plan:LabExecutionPlan={labId:lab.id,scenarioId:lab.scenarioId,hypervisorId:hypervisors.find(x=>x.available&&(x.id==='virtualbox'||x.id==='hyper-v'))?.id??null,profile,realExecutionEnabled:false,steps:['restore-clean-snapshot','verify-isolated-network','verify-host-integrations-disabled','stage-sample-through-quarantine-boundary','start-telemetry','manual-execution-gate','collect-artifacts','restore-clean-snapshot']}; return plan; });
app.post<{Params:{id:string}}>('/api/labs/:id/actions',async(req,reply)=>{ const body=z.object({action:z.enum(['prepare','detect','contain','remediate','restore'])}).parse(req.body); const profile=await loadLabProfile(); const updated=registry.transition(req.params.id,body.action,body.action==='prepare'?{vmName:profile.vmName,snapshot:profile.baselineSnapshot}:undefined); if(!updated)return reply.code(404).send({message:'Lab not found'}); return updated; });

app.setErrorHandler((error,_request,reply)=>{ if(error instanceof z.ZodError)return reply.code(400).send({message:'Invalid request',issues:error.issues}); if(error instanceof LabTransitionError)return reply.code(409).send({message:error.message,code:'invalid-lab-transition',currentState:error.currentState,action:error.action,allowedActions:error.allowedActions}); if(error instanceof HypervisorOperationError){ const status=error.code==='vm-not-found'?404:error.code==='unsafe-state'||error.code==='snapshot-missing'?409:400; return reply.code(status).send({message:error.message,code:error.code}); } if(error instanceof Error&&error.message==='Lab profile not found')return reply.code(404).send({message:error.message}); if(error instanceof Error&&error.message==='Invalid SHA-256')return reply.code(400).send({message:error.message}); app.log.error(error); return reply.code(500).send({message:'Internal control plane error'}); });
await app.listen({host:'127.0.0.1',port:4310});
