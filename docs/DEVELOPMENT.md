# Development

## Requisitos

- Node.js 22 o superior.
- npm 11 o superior recomendado.
- Un navegador moderno.

No necesitas un hipervisor para desarrollar la interfaz.

## Instalación

```bash
npm install
npm run dev
```

Servicios locales:

- Frontend: `http://127.0.0.1:4300`
- API: `http://127.0.0.1:4310`

Vite proxifica `/api` hacia el control plane, por lo que la aplicación web no necesita conocer puertos de backend en sus componentes.

## Verificación

```bash
npm run typecheck
npm run build
```

## Hipervisores

La foundation puede detectar en modo de lectura:

- VirtualBox mediante `VBoxManage`.
- VMware Workstation mediante `vmrun`.
- Hyper-V en Windows mediante PowerShell.
- libvirt/KVM en Linux mediante `virsh`.

No se realizan operaciones mutables sobre VMs en esta etapa.
