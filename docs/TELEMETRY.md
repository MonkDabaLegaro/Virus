# Telemetry replay

La primera implementación usa fixtures sintéticos y reproducibles. `POST /api/telemetry/replay/wannacry` carga eventos desde `scenarios/ransomware/wannacry/fixtures/telemetry.json`. Las IPs usan rangos reservados para documentación y las rutas apuntan a `C:\Lab`.

El pipeline separa `packages/telemetry` (almacenamiento/consulta) de `packages/detection` (reglas defensivas puras). No ejecuta malware, no captura tráfico real y no contiene payloads.
