# Referencia oficial de Adobe Premiere UXP

Copia descargada el 23 de julio de 2026 para validar ClipDrop contra la
documentacion y los ejemplos oficiales de Adobe.

## Contenido

- `official-pages/01-building-first-plugin.html`: primer plugin UXP.
- `official-pages/02-manifest.html`: manifiesto, compatibilidad y permisos.
- `official-pages/03-entrypoints.html`: paneles, comandos y ciclo de vida.
- `official-pages/04-project-api-import.html`: API `Project`, incluido
  `importFiles`.
- `official-pages/05-filesystem.html`: selector de carpetas y permisos.
- `official-pages/06-package-ccx.html`: empaquetado `.ccx`.
- `official-pages/07-install-ccx.html`: instalacion mediante Creative Cloud.
- `uxp-premiere-pro-samples-main/`: ejemplos oficiales completos de Adobe.
- `downloads/uxp-premiere-pro-samples-main.zip`: copia original descargada.

## Ejemplos relevantes para ClipDrop

- `sample-panels/premiere-api/src/import.ts`: firma oficial de `importFiles`.
- `sample-panels/premiere-api/src/projectPanel.ts`: transacciones y creacion
  de bins mediante `project.lockedAccess`.
- `sample-panels/premiere-api/index.ts`: registro de paneles con
  `entrypoints.setup`.
- `sample-panels/premiere-api/public/manifest.json`: manifiesto v5 y permisos.
- `sample-panels/oauth-workflow-sample/`: panel UXP conectado a un servidor
  Node local.

## Fuentes online

- https://developer.adobe.com/premiere-pro/uxp/
- https://developer.adobe.com/premiere-pro/uxp/plugins/
- https://developer.adobe.com/premiere-pro/uxp/plugins/concepts/manifest/
- https://developer.adobe.com/premiere-pro/uxp/plugins/distribution/package/
- https://github.com/AdobeDocs/uxp-premiere-pro-samples

## Comprobaciones pendientes para ClipDrop

1. Envolver la transaccion que crea `ClipDrop Imports` en
   `project.lockedAccess`, como hace el ejemplo oficial.
2. Cargar el panel en Premiere mediante UXP Developer Tool.
3. Generar desde UXP Developer Tool el `.ccx` candidato a distribucion.
4. Instalar ese `.ccx` mediante Creative Cloud Desktop.
5. Probar las tres salidas y un segmento corto en macOS y Windows.

La documentacion online puede cambiar. Antes de una publicacion publica,
comparar de nuevo el manifiesto, los permisos y el proceso de empaquetado.
