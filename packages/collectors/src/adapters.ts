import type { WindowsObservation } from './index.ts';

function record(value: unknown, message: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error(message);
  return value as Record<string, unknown>;
}

function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function integer(value: unknown): number | null {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isInteger(parsed) ? parsed : null;
}

function isoTimestamp(value: unknown, message: string): string {
  if (typeof value === 'number' && Number.isFinite(value)) return new Date(value * 1000).toISOString();
  const raw = text(value);
  if (!raw) throw new Error(message);
  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(raw) ? `${raw.replace(' ', 'T')}Z` : raw;
  const parsed = Date.parse(normalized);
  if (!Number.isFinite(parsed)) throw new Error(message);
  return new Date(parsed).toISOString();
}

function extension(path: string): string | undefined {
  const name = path.split(/[\\/]/).pop() ?? '';
  const dot = name.lastIndexOf('.');
  return dot > 0 && dot < name.length - 1 ? name.slice(dot + 1) : undefined;
}

function parseRegistryTarget(target: string): { key: string; valueName?: string } {
  const separator = target.lastIndexOf('\\');
  if (separator <= 0 || separator === target.length - 1) return { key: target };
  return { key: target.slice(0, separator), valueName: target.slice(separator + 1) };
}

export function adaptSysmonExport(rows: unknown[]): WindowsObservation[] {
  if (!Array.isArray(rows) || rows.length > 5000) throw new Error('Invalid Sysmon export');
  const observations: WindowsObservation[] = [];

  for (const value of rows) {
    const row = record(value, 'Invalid Sysmon export');
    const eventId = integer(row.EventID ?? row.EventId ?? row.eventId);
    if (![1, 3, 5, 11, 12, 13].includes(eventId ?? -1)) continue;
    const timestamp = isoTimestamp(row.UtcTime ?? row.utcTime ?? row.timestamp, 'Invalid Sysmon export');

    if (eventId === 1 || eventId === 5) {
      const pid = integer(row.ProcessId ?? row.ProcessID ?? row.pid);
      const image = text(row.Image ?? row.image);
      if (pid === null || pid < 0 || !image) throw new Error('Invalid Sysmon export');
      const ppid = eventId === 1 ? integer(row.ParentProcessId ?? row.ParentProcessID ?? row.ppid) : null;
      if (eventId === 1 && (ppid === null || ppid < 0)) throw new Error('Invalid Sysmon export');
      const commandLine = text(row.CommandLine ?? row.commandLine) ?? undefined;
      observations.push({ kind: 'process', timestamp, action: eventId === 1 ? 'start' : 'stop', pid, ppid, image, ...(commandLine ? { commandLine } : {}) });
      continue;
    }

    if (eventId === 3) {
      const protocolRaw = text(row.Protocol ?? row.protocol)?.toLowerCase();
      const destinationIp = text(row.DestinationIp ?? row.DestinationIP ?? row.destinationIp);
      const destinationPort = integer(row.DestinationPort ?? row.destinationPort);
      if ((protocolRaw !== 'tcp' && protocolRaw !== 'udp') || !destinationIp || destinationPort === null || destinationPort < 1 || destinationPort > 65535) throw new Error('Invalid Sysmon export');
      observations.push({ kind: 'network', timestamp, action: 'connect', protocol: protocolRaw, destinationIp, destinationPort });
      continue;
    }

    if (eventId === 11) {
      const path = text(row.TargetFilename ?? row.TargetFileName ?? row.path);
      if (!path) throw new Error('Invalid Sysmon export');
      const ext = extension(path);
      observations.push({ kind: 'filesystem', timestamp, action: 'create', path, ...(ext ? { extension: ext } : {}) });
      continue;
    }

    const target = text(row.TargetObject ?? row.targetObject ?? row.key);
    if (!target) throw new Error('Invalid Sysmon export');
    if (eventId === 12) observations.push({ kind: 'registry', timestamp, action: 'create-key', key: target });
    else {
      const registry = parseRegistryTarget(target);
      observations.push({ kind: 'registry', timestamp, action: 'set-value', ...registry });
    }
  }

  return observations;
}

function csvRows(input: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i]!;
    if (char === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i += 1; }
      else quoted = !quoted;
    } else if (char === ',' && !quoted) {
      row.push(field); field = '';
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && input[i + 1] === '\n') i += 1;
      row.push(field); field = '';
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
    } else field += char;
  }
  if (quoted) throw new Error('Invalid Procmon export');
  if (field.length || row.length) { row.push(field); if (row.some((value) => value.length > 0)) rows.push(row); }
  return rows;
}

function procmonTimestamp(day: string, time: string): string {
  const date = text(day);
  const value = text(time);
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !value) throw new Error('Invalid Procmon export');
  return isoTimestamp(`${date}T${value}Z`, 'Invalid Procmon export');
}

export function adaptProcmonExport(input: string | unknown[], day: string): WindowsObservation[] {
  const rows: Record<string, unknown>[] = [];
  if (typeof input === 'string') {
    if (input.length > 5_000_000) throw new Error('Invalid Procmon export');
    const parsed = csvRows(input);
    const header = parsed.shift();
    if (!header) return [];
    for (const values of parsed) {
      const row: Record<string, unknown> = {};
      header.forEach((name, index) => { row[name.trim()] = values[index] ?? ''; });
      rows.push(row);
    }
  } else {
    if (!Array.isArray(input) || input.length > 5000) throw new Error('Invalid Procmon export');
    rows.push(...input.map((value) => record(value, 'Invalid Procmon export')));
  }

  const observations: WindowsObservation[] = [];
  for (const row of rows) {
    const operation = text(row.Operation ?? row.operation);
    const path = text(row.Path ?? row.path);
    const time = text(row['Time of Day'] ?? row.TimeOfDay ?? row.timestamp);
    if (!operation || !path || !time) throw new Error('Invalid Procmon export');
    const timestamp = /^\d{4}-\d{2}-\d{2}T/.test(time) ? isoTimestamp(time, 'Invalid Procmon export') : procmonTimestamp(day, time);

    if (operation === 'WriteFile') {
      const ext = extension(path);
      observations.push({ kind: 'filesystem', timestamp, action: 'modify', path, ...(ext ? { extension: ext } : {}) });
    } else if (operation === 'SetRenameInformationFile' || operation === 'SetRenameInformationEx') {
      const ext = extension(path);
      observations.push({ kind: 'filesystem', timestamp, action: 'rename', path, ...(ext ? { extension: ext } : {}) });
    } else if (operation === 'RegSetValue') {
      const registry = parseRegistryTarget(path);
      observations.push({ kind: 'registry', timestamp, action: 'set-value', ...registry });
    } else if (operation === 'RegDeleteValue') {
      const registry = parseRegistryTarget(path);
      observations.push({ kind: 'registry', timestamp, action: 'delete-value', ...registry });
    } else if (operation === 'RegCreateKey') {
      observations.push({ kind: 'registry', timestamp, action: 'create-key', key: path });
    } else if (operation === 'RegDeleteKey') {
      observations.push({ kind: 'registry', timestamp, action: 'delete-key', key: path });
    }
  }
  return observations;
}

export function adaptNetworkFlowExport(rows: unknown[]): WindowsObservation[] {
  if (!Array.isArray(rows) || rows.length > 5000) throw new Error('Invalid network flow export');
  return rows.map((value) => {
    const row = record(value, 'Invalid network flow export');
    const timestamp = isoTimestamp(row.timestamp ?? row.ts, 'Invalid network flow export');
    const protocolRaw = text(row.protocol ?? row.proto)?.toLowerCase();
    const destinationIp = text(row.destinationIp ?? row.dstIp ?? row['id.resp_h']);
    const destinationPort = integer(row.destinationPort ?? row.dstPort ?? row['id.resp_p']);
    if ((protocolRaw !== 'tcp' && protocolRaw !== 'udp') || !destinationIp || destinationPort === null || destinationPort < 1 || destinationPort > 65535) throw new Error('Invalid network flow export');
    return { kind: 'network', timestamp, action: 'connect', protocol: protocolRaw, destinationIp, destinationPort } satisfies WindowsObservation;
  });
}
