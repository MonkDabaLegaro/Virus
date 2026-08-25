# Malware Security Lab

Laboratorio local y modular para estudiar malware, organizar conocimiento histórico y practicar análisis, detección, contención y remediación dentro de entornos virtualizados aislados.

> El repositorio está migrando desde la colección histórica `Virus`. Las carpetas `Ransomware/`, `Spyware/`, `Trojan/` y `Worm/` se conservan mientras su contenido se transforma al nuevo contrato de escenarios.

## Foundation actual

- Frontend React + TypeScript + Vite con identidad visual verde bosque.
- Control plane Fastify limitado a `127.0.0.1`.
- Contratos compartidos mediante npm workspaces.
- Registro local de sesiones de laboratorio.
- Descubrimiento de VirtualBox, VMware Workstation, Hyper-V y libvirt/KVM.
- Primer escenario modular: WannaCry.
- SVG de Lucide almacenados localmente y documentados en `THIRD_PARTY_NOTICES.md`.
- Ejecución real bloqueada en esta foundation; la capa actual de hipervisor es de solo descubrimiento.

## Estructura

```text
apps/
  web/
  api/
packages/
  shared-types/
  lab-core/
  hypervisor/
scenarios/
  ransomware/
    wannacry/
docs/
```

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://127.0.0.1:4300`.

Consulta `docs/ARCHITECTURE.md`, `docs/SAFETY_MODEL.md` y `docs/DEVELOPMENT.md` antes de extender la integración con hipervisores.

## Muestras reales

Las muestras de malware no se almacenan ni distribuyen dentro de este repositorio. El futuro Sample Registry trabajará por hashes y referencias a un almacén local de cuarentena externo al árbol Git.

El análisis dinámico real estará restringido a máquinas virtuales desechables y redes de laboratorio aisladas.
