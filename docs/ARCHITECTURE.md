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
  hypervisor/   descubrimiento y futuros adaptadores de VM
scenarios/
  <category>/<family>/
docs/
```

## Reglas de dependencia

`apps/web` no conoce comandos del sistema ni detalles de hipervisores.

`apps/api` orquesta casos de uso y expone una API ligada a `127.0.0.1`.

`packages/lab-core` define estados y reglas del laboratorio sin acoplarse a VirtualBox, Hyper-V, VMware o KVM.

`packages/hypervisor` encapsula tecnología de virtualización. La primera iteración solo realiza probes de lectura; las operaciones mutables se añadirán detrás de una política explícita.

`scenarios` describe malware, requisitos de guest, material educativo, detección y remediación. No contiene muestras reales.

## Estado actual

La colección histórica `Ransomware/`, `Spyware/`, `Trojan/` y `Worm/` permanece intacta mientras se migra el contenido al contrato de escenarios. No debe borrarse hasta validar paridad documental.
