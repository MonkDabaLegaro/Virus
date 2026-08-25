# Safety Model

Malware Security Lab admite investigación con muestras reales únicamente dentro de laboratorios virtualizados controlados.

## Invariantes

1. Las muestras reales no se almacenan en Git.
2. El control plane escucha únicamente en loopback por defecto.
3. El host nunca es un objetivo de análisis.
4. Las rutas de muestras deben apuntar a un almacén de cuarentena externo al repositorio.
5. Un escenario ejecutable requiere política `vm-only`.
6. Las redes de laboratorio deben ser virtuales y aisladas de la LAN física.
7. Carpetas compartidas, portapapeles compartido y drag-and-drop deben permanecer deshabilitados para guests de malware.
8. El rollback a snapshot limpio forma parte del ciclo normal de laboratorio.
9. La disponibilidad de un hipervisor no habilita automáticamente ejecución real.
10. Las operaciones mutables del hipervisor requieren una configuración explícita separada del modo de descubrimiento.

## Estado de la foundation

`realExecutionEnabled` es `false`. La capa de hipervisor únicamente detecta tecnologías instaladas; todavía no arranca VMs ni transfiere muestras.

Esto permite desarrollar y probar el frontend y el control plane sin convertir accidentalmente el host en entorno de detonación.
