import type {
  AnalysisReport,
  DetectionCorrelation,
  DetectionFinding,
  LabExecutionPlan,
  LabProfile,
  LabSession,
  SampleRecord,
  ScenarioSummary,
  SystemStatus,
  TelemetryEvent,
  TelemetryKind,
  TelemetrySummary,
  VmDescriptor,
  VmInspection,
  VmRestoreResult,
  VmValidationReport
} from '@malware-lab/shared-types';

export interface CollectorDescriptor {
  id:string;
  label:string;
  platform:'any'|'windows';
  mode:'replay'|'import';
  guestExecution:false;
  hostCollection:false;
}
export interface CollectorImportResult {
  collectorId:string;
  source:'fixture'|'imported-observation';
  scenarioId:string;
  events:TelemetryEvent[];
}

async function json<T>(url:string,init?:RequestInit):Promise<T>{
  const response=await fetch(url,{...init,headers:{'content-type':'application/json',...(init?.headers??{})}});
  if(!response.ok){const payload=await response.json().catch(()=>null) as {message?:string}|null;throw new Error(payload?.message??`Request failed: ${response.status}`)}
  return response.json() as Promise<T>;
}
async function text(url:string):Promise<string>{ const response=await fetch(url); if(!response.ok)throw new Error(`Request failed: ${response.status}`); return response.text(); }

export const api={
  system:()=>json<SystemStatus>('/api/system'),
  scenarios:()=>json<ScenarioSummary[]>('/api/scenarios'),
  samples:()=>json<SampleRecord[]>('/api/samples'),
  profiles:()=>json<LabProfile[]>('/api/lab-profiles'),
  labs:()=>json<LabSession[]>('/api/labs'),
  collectors:()=>json<CollectorDescriptor[]>('/api/collectors'),
  telemetryEvents:(kind?:TelemetryKind)=>json<TelemetryEvent[]>(`/api/telemetry/events${kind?`?kind=${kind}`:''}`),
  telemetrySummary:()=>json<TelemetrySummary>('/api/telemetry/summary'),
  detections:()=>json<DetectionFinding[]>('/api/detections'),
  correlations:()=>json<DetectionCorrelation[]>('/api/detections/correlations'),
  analysisReport:()=>json<AnalysisReport>('/api/analysis/report'),
  analysisReportMarkdown:()=>text('/api/analysis/report.md'),
  replayTelemetry:(scenarioId:string)=>json<TelemetryEvent[]>(`/api/telemetry/replay/${encodeURIComponent(scenarioId)}`,{method:'POST'}),
  importWindowsObservations:(scenarioId:string,observations:unknown[])=>json<CollectorImportResult>('/api/telemetry/import/windows',{method:'POST',body:JSON.stringify({scenarioId,observations})}),
  vms:()=>json<VmDescriptor[]>('/api/vms'),
  vm:(providerId:string,vmId:string)=>json<VmInspection>(`/api/vms/${encodeURIComponent(providerId)}/${encodeURIComponent(vmId)}`),
  validateVm:(providerId:'virtualbox'|'hyper-v',vmId:string,profileId?:string)=>json<VmValidationReport>('/api/vms/validate',{method:'POST',body:JSON.stringify({providerId,vmId,...(profileId?{profileId}:{})})}),
  restoreVmBaseline:(providerId:'virtualbox'|'hyper-v',vmId:string,profileId?:string)=>json<VmRestoreResult>('/api/vms/restore-baseline',{method:'POST',body:JSON.stringify({providerId,vmId,...(profileId?{profileId}:{})})}),
  plan:(labId:string)=>json<LabExecutionPlan>(`/api/labs/${labId}/plan`),
  createLab:(scenarioId:string)=>json<LabSession>('/api/labs',{method:'POST',body:JSON.stringify({scenarioId})}),
  registerSample:(input:{sha256:string;family:string;aliases?:string[];sourceReference?:string|null})=>json<SampleRecord>('/api/samples',{method:'POST',body:JSON.stringify(input)}),
  actOnLab:(labId:string,action:'prepare'|'detect'|'contain'|'remediate'|'restore')=>json<LabSession>(`/api/labs/${labId}/actions`,{method:'POST',body:JSON.stringify({action})})
};
