# Desarrollo

## Preparación

```sh
git clone https://github.com/smithplus/clipdrop.git
cd clipdrop
npm test
```

El proyecto no tiene dependencias npm en tiempo de ejecución. Las pruebas usan
el runner integrado de Node.js.

## Comandos

```sh
npm test
npm run test:helper
npm run test:plugin
npm run test:packaging
npm run start:helper
npm run package:plugin
```

## Estructura

- `plugin/`: panel UXP y preview.
- `helper/`: API local y procesamiento multimedia.
- `scripts/`: empaquetado.
- `dist/`: paquete `.ccx`.
- `docs/`: arquitectura, instalación y decisiones de diseño.

## Ciclo recomendado

1. Añade una prueba que describa el comportamiento.
2. Confirma que falla por la funcionalidad ausente.
3. Implementa el cambio mínimo.
4. Ejecuta la suite completa.
5. Regenera el `.ccx`.
6. Instala y prueba en Premiere.

## Cargar con UDT

1. Activa el modo desarrollador en las preferencias de plugins de Premiere.
2. Reinicia Premiere.
3. Añade `plugin/manifest.json` en UXP Developer Tool.
4. Usa `Load & Watch`.

## GitHub Actions

`.github/workflows/validate.yml` ejecuta pruebas, crea el `.ccx` y lo publica
como artefacto de la ejecución. Los instaladores autocontenidos multiplataforma
se añadirán en una fase posterior.
