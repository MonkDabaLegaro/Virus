import { randomUUID } from 'node:crypto';
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { SampleRecord, SampleRegistrationInput } from '@malware-lab/shared-types';

const SHA256_PATTERN = /^[a-f0-9]{64}$/i;

export class SampleRegistry {
  constructor(private readonly registryPath: string) {}

  async list(): Promise<SampleRecord[]> {
    try {
      const raw = await readFile(this.registryPath, 'utf8');
      const parsed = JSON.parse(raw) as SampleRecord[];
      return [...parsed].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return [];
      throw error;
    }
  }

  async register(input: SampleRegistrationInput): Promise<SampleRecord> {
    const sha256 = input.sha256.trim().toLowerCase();
    if (!SHA256_PATTERN.test(sha256)) throw new Error('Invalid SHA-256');

    const records = await this.list();
    const existing = records.find((record) => record.sha256 === sha256);
    if (existing) return existing;

    const record: SampleRecord = {
      id: randomUUID(),
      sha256,
      family: input.family.trim().toLowerCase(),
      aliases: [...new Set(input.aliases?.map((alias) => alias.trim()).filter(Boolean) ?? [])],
      sourceReference: input.sourceReference?.trim() || null,
      state: 'metadata-only',
      createdAt: new Date().toISOString()
    };

    await mkdir(path.dirname(this.registryPath), { recursive: true });
    const next = [record, ...records];
    const temporaryPath = `${this.registryPath}.tmp`;
    await writeFile(temporaryPath, `${JSON.stringify(next, null, 2)}\n`, 'utf8');
    await rename(temporaryPath, this.registryPath);
    return record;
  }
}
