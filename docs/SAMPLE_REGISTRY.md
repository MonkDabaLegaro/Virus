# Sample Registry

El Sample Registry almacena únicamente metadatos locales sobre muestras de investigación. No copia, descarga ni distribuye binarios.

## Datos registrados

- SHA-256 canónico.
- Familia asociada.
- Alias opcionales.
- Referencia de procedencia opcional.
- Fecha de incorporación.

Los datos se guardan en `.malware-lab/sample-registry.json`, ruta ignorada por Git.

## Límite deliberado

El registro no acepta una ruta ejecutable ni ofrece una acción de ejecución. La vinculación futura con un almacén de cuarentena será un adaptador separado y requerirá comprobar el hash antes de cualquier transferencia a una VM.
