import cors from '@fastify/cors';
import Fastify from 'fastify';
import { readFile, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { LabRegistry } from '@malware-lab/lab-core';
import { probeHypervisors } from '@malware-lab/hypervisor';
import type { ScenarioSummary } from '@malware-lab/shared-types';

const app = Fastify({ logger: true });
await app.register(cors, { origin: ['http://127.0.0.1:4300', 'http://localhost:4300'] });

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..');
const scenarioRoot = path.join(repoRoot, 'scenarios');
const registry = new LabRegistry();

const manifestSchema = z.object({
  id: z.string(), name: z.string(), category: z.enum(['ransomware', 'spyware', 'trojan', 'worm']), year: z.number().int(), platform: z.string(), risk: z.enum(['low', 'medium', 'high', 'critical']), description: z.string(), executionPolicy: z.literal('vm-only')
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
app.get('/api/labs', async () => registry.list());
app.post('/api/labs', async (request, reply) => {
  const body = z.object({ scenarioId: z.string() }).parse(request.body);
  const scenario = (await loadScenarios()).find((item) => item.id === body.scenarioId);
  if (!scenario) return reply.code(404).send({ message: 'Scenario not found' });
  return registry.create(scenario.id, scenario.name);
});
app.post<{ Params: { id: string } }>('/api/labs/:id/actions', async (request, reply) => {
  const body = z.object({ action: z.enum(['prepare', 'detect', 'contain', 'remediate', 'restore']) }).parse(request.body);
  const updated = registry.transition(request.params.id, body.action);
  if (!updated) return reply.code(404).send({ message: 'Lab not found' });
  return updated;
});
app.setErrorHandler((error, _request, reply) => {
  if (error instanceof z.ZodError) return reply.code(400).send({ message: 'Invalid request', issues: error.issues });
  app.log.error(error);
  return reply.code(500).send({ message: 'Internal control plane error' });
});
await app.listen({ host: '127.0.0.1', port: 4310 });
