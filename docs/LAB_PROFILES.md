# Lab Profiles

Los perfiles describen las propiedades que debe cumplir un guest antes de que un escenario pueda considerarlo apto para análisis dinámico.

## windows-analysis

El perfil inicial exige:

- guest Windows desechable;
- snapshot `clean-baseline`;
- red interna sin acceso al host ni a Internet;
- carpetas compartidas deshabilitadas;
- portapapeles deshabilitado;
- drag-and-drop deshabilitado;
- USB passthrough deshabilitado.

`GET /api/labs/:id/plan` permite inspeccionar el plan previsto, pero `realExecutionEnabled` permanece en `false`. El plan es declarativo: no ejecuta ni transfiere muestras.
