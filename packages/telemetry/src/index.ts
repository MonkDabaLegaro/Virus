import { readFile } from 'node:fs/promises';
import type { TelemetryEvent, TelemetryKind } from '@malware-lab/shared-types';
export class TelemetryStore { private events:TelemetryEvent[]=[]; replace(events:TelemetryEvent[]){ this.events=[...events].sort((a,b)=>a.timestamp.localeCompare(b.timestamp)); } list(kind?:TelemetryKind){ return kind?this.events.filter(e=>e.kind===kind):[...this.events]; } async loadFixture(file:string){ const raw=await readFile(file,'utf8'); const parsed=JSON.parse(raw) as TelemetryEvent[]; this.replace(parsed); return this.list(); } }
