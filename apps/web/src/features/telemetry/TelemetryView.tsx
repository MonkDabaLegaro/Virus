import { useEffect, useMemo, useState } from 'react';
import type { DetectionFinding, TelemetryEvent, TelemetryKind, TelemetrySummary } from '@malware-lab/shared-types';
import { api } from '../../api';
import { Icon } from '../../Icon';
import { CollectorPanel } from './CollectorPanel';

const viewKinds:Record<string,TelemetryKind|undefined>={Processes:'process',Filesystem:'filesystem',Registry:'registry',Network:'network',Telemetry:undefined};

function eventDetail(event:TelemetryEvent):string{
  if(event.kind==='process') return `${event.action} ${event.process?.image ?? ''} PID ${event.process?.pid ?? '—'}`;
  if(event.kind==='filesystem') return `${event.action} ${event.file?.path ?? ''}`;
  if(event.kind==='registry') return `${event.action} ${event.registry?.key ?? ''}${event.registry?.valueName?` / ${event.registry.valueName}`:''}`;
  return `${event.action} ${event.network?.protocol.toUpperCase() ?? ''} ${event.network?.destinationIp ?? ''}:${event.network?.destinationPort ?? ''}`;
}

export function TelemetryView({section,scenarioId}:{section:string;scenarioId:string}){
  const [events,setEvents]=useState<TelemetryEvent[]>([]);
  const [summary,setSummary]=useState<TelemetrySummary|null>(null);
  const [detections,setDetections]=useState<DetectionFinding[]>([]);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const kind=viewKinds[section];

  const refresh=async()=>{
    try{
      const [nextEvents,nextSummary,nextDetections]=await Promise.all([api.telemetryEvents(kind),api.telemetrySummary(),api.detections()]);
      setEvents(nextEvents); setSummary(nextSummary); setDetections(nextDetections); setError(null);
    }catch(cause){setError(cause instanceof Error?cause.message:'No se pudo cargar la telemetría.');}
  };
  useEffect(()=>{void refresh();},[section]);

  const replay=async()=>{
    setBusy(true);
    try{await api.replayTelemetry(scenarioId);await refresh();}
    catch(cause){setError(cause instanceof Error?cause.message:'No se pudo cargar el fixture.');}
    finally{setBusy(false);}
  };

  const relevantDetections=useMemo(()=>section==='Detection'?detections:detections.filter(f=>f.eventIds.some(id=>events.some(e=>e.id===id))),[section,detections,events]);

  if(section==='Detection') return <section className="content-grid single-mode"><article className="panel wide-panel"><div className="panel-heading"><div><span className="eyebrow">DETECTION ENGINE</span><h2>Defensive findings from replay</h2></div><button className="primary-action" onClick={()=>void replay()} disabled={busy}><Icon name="terminal" /> {busy?'REPLAYING':'REPLAY SAFE FIXTURE'}</button></div>{error&&<div className="inline-error">{error}</div>}<div className="telemetry-metrics"><div><span>EVENTS</span><strong>{summary?.total??0}</strong></div><div><span>DETECTIONS</span><strong>{summary?.detections??0}</strong></div><div><span>HIGHEST</span><strong>{summary?.highestSeverity?.toUpperCase()??'NONE'}</strong></div></div><div className="finding-list">{relevantDetections.length===0?<div className="empty-state">No findings loaded. Replay the safe fixture to exercise detection rules.</div>:relevantDetections.map(f=><div className={`finding-row severity-${f.severity}`} key={f.id}><div><strong>{f.title}</strong><span>{f.ruleId} / {f.severity.toUpperCase()}</span></div><p>{f.rationale}</p><code>{f.eventIds.join(', ')}</code></div>)}</div></article></section>;

  return <section className="content-grid single-mode"><article className="panel wide-panel"><div className="panel-heading"><div><span className="eyebrow">DEFENSIVE TELEMETRY</span><h2>{section}</h2></div><button className="primary-action" onClick={()=>void replay()} disabled={busy}><Icon name="terminal" /> {busy?'REPLAYING':'REPLAY SAFE FIXTURE'}</button></div>{error&&<div className="inline-error">{error}</div>}<div className="telemetry-metrics"><div><span>PROCESS</span><strong>{summary?.byKind.process??0}</strong></div><div><span>FILESYSTEM</span><strong>{summary?.byKind.filesystem??0}</strong></div><div><span>REGISTRY</span><strong>{summary?.byKind.registry??0}</strong></div><div><span>NETWORK</span><strong>{summary?.byKind.network??0}</strong></div></div>{section==='Telemetry'&&<CollectorPanel scenarioId={scenarioId} onImported={refresh}/>}<div className="telemetry-table"><div className="telemetry-row header"><span>TIME</span><span>KIND</span><span>ACTION</span><span>DETAIL</span><span>TAGS</span></div>{events.length===0?<div className="empty-state">No telemetry loaded. Replay a safe fixture or import defensive observations.</div>:events.map(event=><div className="telemetry-row" key={event.id}><time>{new Date(event.timestamp).toLocaleTimeString()}</time><strong>{event.kind.toUpperCase()}</strong><span>{event.action}</span><code>{eventDetail(event)}</code><small>{event.tags.join(' / ')}</small></div>)}</div></article></section>;
}
