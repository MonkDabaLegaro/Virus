# VM Control workflow

La vista **Virtual Machines** es el punto de inspección y recuperación de guests del laboratorio.

## Flujo

1. El frontend consulta `GET /api/vms`.
2. La selección de una VM consulta `GET /api/vms/:providerId/:vmId`.
3. `Validate Isolation` envía la VM y el perfil a `POST /api/vms/validate`.
4. El backend inspecciona la VM mediante el adaptador del hipervisor y devuelve un `VmValidationReport`.
5. La interfaz muestra cada invariant como `PASS`, `FAIL` o `UNKNOWN`.
6. `Restore Clean Snapshot` solo se habilita cuando `safeToRestore` es verdadero.
7. La restauración vuelve a validar la VM y mantiene el guest apagado.

## Estados de la interfaz

`FUTURE EXECUTION READY` significa que todos los checks fueron demostrados como `PASS`. No significa que la ejecución esté habilitada; `realExecutionEnabled` continúa en `false`.

`RESTORE READY` significa únicamente que la VM está apagada y existe el baseline requerido.

`BLOCKED` significa que ni siquiera se cumplen las precondiciones para una restauración segura.

## Operaciones no expuestas

La vista no ofrece controles para iniciar una VM, adjuntar muestras, ejecutar comandos dentro del guest o modificar redes. Esas operaciones no forman parte del API actual.
