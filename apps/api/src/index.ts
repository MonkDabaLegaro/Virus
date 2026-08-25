import cors from '@fastify/cors';
import Fastify from 'fastify';
import { readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { LabRegistry } from '@malware-lab/lab-core';
import { probeHypervisors } from '@malware-lab/hypervisor';
import { SampleRegistry } from '@malware-lab/sample-registry';
import type { LabExecutionPlan, LabProfile, ScenarioSummary } from '@malware-lab/shared-types';

const app = Fastify({ logger: true });
await app.register(cors, { origin: ['http://127.0.0.1:4300', 'http://localhost:4300'] });

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const scenarioRoot = path.join(repoRoot, 'scenarios');
const sampleRegistry = new SampleRegistry(path.join(repoRoot, '.malware-lab', 'sample-registry.json'));
const registry = new LabRegistry();

const manifestSchema = z.object({
  id: z.string(), name: z.string(), category: z.enum(['ransomware', 'spyware', 'trojan', 'worm']), year: z.number().int(), platform: z.string(), risk: z.enum(['low', 'medium', 'high', 'critical']), description: z.string(), executionPolicy: z.literal('vm-only')
});
const profileSchema = z.object({
  id: z.string(), label: z.string(), guestOs: z.string(), architecture: z.string(), cpuCount: z.number().int().positive(), memoryMb: z.number().int().positive(), disposable: z.literal(true), baselineSnapshot: z.string(),
  network: z.object({ mode: z.literal('internal'), name: z.string(), hostAccess: z.literal(false), internetAccess: z.literal(false) }),
  integrations: z.object({ sharedFolders: z.literal(false), clipboard: z.literal(false), dragAndDrop: z.literal(false), usbPassthrough: z.literal(false) })
});

async function loadScenarios(): Promise<ScenarioSummary[]> {
  const files = await readdir(scenarioRoot, { recursive: true });
  const manifests = files.filter((entry) => entry.endsWith('manifest.json'));
  const scenarios = await Promise.all(manifests.map(async (entry) => {
    const raw = await readFile(path.join(scenarioRoot, entry), 'utf8');
    return manifestSchema.parse(JSON.parse(raw));
  }));
  return scenarios.sort((a, b) => a.name.localeCompare(b.name));
}

async function loadLabProfile(): Promise<LabProfile> {
  const raw = await readFile(path.join(repoRoot, 'lab-profiles', 'windows-analysis.json'), 'utf8');
  return profileSchema.parse(JSON.parse(raw));
}

app.get('/health', async () => ({ status: 'ok' }));
app.get('/api/system', async () => ({
  host: { platform: os.platform(), architecture: os.arch(), hostname: os.hostname() },
  mode: 'local-only' as const,
  networkPolicy: 'isolated-lab-only' as const,
  realExecutionEnabled: false,
  hypervisors: await probeHypervisors()
}));
app.get('/api/scenarios', async () => loadScenarios());
app.get<{ Params: { id: string } }>('/api/scenarios/:id', async (request, reply) => {
  const scenario = (await loadScenarios()).find((item) => item.id === request.params.id);
  if (!scenario) return reply.code(404).send({ message: 'Scenario not found' });
  return scenario;
});
app.get('/api/samples', async () => sampleRegistry.list());
app.post('/api/samples', async (request, reply) => {
  const body = z.object({
    sha256: z.string().regex(/^[a-f0-9]{64}$/i),
    family: z.string().min(1).max(80),
    aliases: z.array(z.string().min(1).max(80)).max(20).optional(),
    sourceReference: z.string().max(500).nullable().optional()
  }).parse(request.body);
  const record = await sampleRegistry.register(body);
  return reply.code(201).send(record);
});
app.get('/api/lab-profiles', async () => [await loadLabProfile()]);
app.get('/api/labs', async () => registry.list());
app.post('/api/labs', async (request, reply) => {
  const body = z.object({ scenarioId: z.string() }).parse(request.body);
  const scenario = (await loadScenarios()).find((item) => item.id === body.scenarioId);
  if (!scenario) return reply.code(404).send({ message: 'Scenario not found' });
  return registry.create(scenario.id, scenario.name);
});
app.get<{ Params: { id: string } }>('/api/labs/:id/plan', async (request, reply) => {
  const lab = registry.get(request.params.id);
  if (!lab) return reply.code(404).send({ message: 'Lab not found' });
  const hypervisors = await probeHypervisors();
  const profile = await loadLabProfile();
  const plan: LabExecutionPlan = {
    labId: lab.id,
    scenarioId: lab.scenarioId,
    hypervisorId: hypervisors.find((item) => item.available)?.id ?? null,
    profile,
    realExecutionEnabled: false,
    steps: ['restore-clean-snapshot', 'verify-isolated-network', 'verify-host-integrations-disabled', 'stage-sample-through-quarantine-boundary', 'start-telemetry', 'manual-execution-gate', 'collect-artifacts', 'restore-clean-snapshot']
  };
  return plan;
});
app.post<{ Params: { id: string } }>('/api/labs/:id/actions', async (request, reply) => {
  const body = z.object({ action: z.enum(['prepare', 'detect', 'contain', 'remediate', 'restore']) }).parse(request.body);
  const updated = registry.transition(request.params.id, body.action);
  if (!updated) return reply.code(404).send({ message: 'Lab not found' });
  return updated;
});
app.setErrorHandler((error, _request, reply) => {
  if (error instanceof z.ZodError) return reply.code(400).send({ message: 'Invalid request', issues: error.issues });
  if (error instanceof Error && error.message === 'Invalid SHA-256') return reply.code(400).send({ message: error.message });
  app.log.error(error);
  return reply.code(500).send({ message: 'Internal control plane error' });
});
await app.listen({ host: '127.0.0.1', port: 4310 });
