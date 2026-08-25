# Architecture

## Objetivo

Malware Security Lab es una aplicación local-first. No está diseñada como servicio público ni como plataforma multiusuario: el objetivo arquitectónico es reducir fricción para investigación y mantener límites claros entre la interfaz, el control plane y la infraestructura de laboratorio.

## Monorepo

```text
apps/
  web/          interfaz de control local
  api/          control plane HTTP local
packages/
  shared-types/ contratos compartidos
  lab-core/     ciclo de vida de laboratorios
  hypervisor/   adaptadores y validación de VM
  telemetry/    almacenamiento temporal de eventos normalizados
  collectors/   normalización de fixtures y observaciones defensivas
  detection/    reglas y correlación defensiva
  analysis/     derivados forenses y ATT&CK
  reporting/    generación de reportes
scenarios/
  <category>/<family>/
docs/
```

## Reglas de dependencia

`apps/web` no conoce comandos del sistema ni detalles de hipervisores.

`apps/api` orquesta casos de uso y expone una API ligada a `127.0.0.1`.

`packages/lab-core` define estados y reglas del laboratorio sin acoplarse a VirtualBox, Hyper-V, VMware o KVM.

`packages/hypervisor` encapsula tecnología de virtualización y las operaciones permitidas sobre VMs. Las mutaciones permanecen limitadas por validaciones de aislamiento y estado seguro.

`packages/collectors` no controla VMs ni ejecuta herramientas de guest. Su única responsabilidad es transformar evidencia externa o fixtures sintéticos al contrato `TelemetryEvent[]`, añadiendo procedencia y validación runtime.

`packages/telemetry` mantiene la sesión de eventos normalizados que consumen detección y análisis.

`packages/detection`, `packages/analysis` y `packages/reporting` son capas defensivas puras: consumen eventos, derivan findings, correlaciones, artefactos forenses y reportes sin modificar host o guest.

`scenarios` describe malware, requisitos de guest, material educativo, detección y remediación. No contiene muestras reales.

## Flujo de evidencia

```text
fixture / imported observation
          |
          v
   collectors boundary
          |
          v
     TelemetryEvent[]
          |
    +-----+------+----------------+
    |            |                |
 telemetry    detection        analysis
                                |
                                v
                             reporting
```

## Estado actual

La colección histórica `Ransomware/`, `Spyware/`, `Trojan/` y `Worm/` permanece intacta mientras se migra el contenido al contrato de escenarios. No debe borrarse hasta validar paridad documental.

El execution gate continúa cerrado: la arquitectura actual permite replay sintético, importación de observaciones defensivas y control limitado de VMs, pero no inicia malware ni ejecuta collectors dentro del guest.
