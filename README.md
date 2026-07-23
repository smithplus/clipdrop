# ClipDrop

ClipDrop es una extensión UXP para Adobe Premiere Pro que permite
previsualizar material autorizado de YouTube, marcar puntos In y Out, descargar
solamente el segmento elegido e importarlo al proyecto abierto.

> Estado: `0.2.0` es una versión de desarrollo funcional. El panel, el preview
> y la conversión están probados en macOS con Premiere Pro 26.3. El instalador
> autocontenido que elimina Node.js, yt-dlp y ffmpeg como requisitos externos
> todavía está en desarrollo.

## Funciones

- Preview mediante el reproductor oficial de YouTube.
- Timeline con cabezal y marcadores In/Out.
- Marcado desde el tiempo actual o mediante campos editables.
- Clip completo o segmento.
- Video con audio, audio WAV o video sin audio.
- Conversión a formatos adecuados para Premiere.
- Importación automática en `ClipDrop Imports`.
- Helper local limitado a `127.0.0.1`.

## Requisitos actuales

- Adobe Premiere Pro 25.6 o posterior.
- Node.js 20 o posterior.
- yt-dlp.
- ffmpeg y ffprobe.

La versión autocontenida planificada incluirá estas dependencias y arrancará el
Helper automáticamente.

## Inicio rápido

### macOS

```sh
brew install node yt-dlp ffmpeg
```

1. Descarga o clona este repositorio.
2. Abre `helper/install/macos/Start ClipDrop Helper.command`.
3. Instala `dist/ClipDrop-0.2.0.ccx`.
4. Abre un proyecto en Premiere.
5. Abre `Ventana > UXP Plugins > ClipDrop`.

### Windows

1. Instala Node.js, yt-dlp y ffmpeg.
2. Abre `helper\install\windows\Start ClipDrop Helper.cmd`.
3. Instala `dist\ClipDrop-0.2.0.ccx`.
4. Abre `Ventana > UXP Plugins > ClipDrop` en Premiere.

Consulta [Instalación](docs/installation.md) para usar UPIA sin navegar por
Creative Cloud Desktop.

## Uso

1. Pega un enlace público de YouTube que tengas permiso para descargar.
2. Pulsa `Preview`.
3. Marca In y Out en la timeline, con los botones o escribiendo los tiempos.
4. Elige el tipo de salida y la carpeta.
5. Pulsa `Descargar e importar`.

Los tiempos aceptan segundos, `MM:SS` y `HH:MM:SS`. Si un video impide la
reproducción embebida, la selección manual continúa disponible.

## Desarrollo

```sh
npm test
npm run start:helper
npm run package:plugin
```

Las 57 pruebas actuales cubren validación, trabajos, conversión, API local,
integración con Premiere, selección In/Out, mensajes del preview y empaquetado.

## Documentación

- [Instalación](docs/installation.md)
- [Arquitectura](docs/architecture.md)
- [Desarrollo](docs/development.md)
- [Solución de problemas](docs/troubleshooting.md)
- [Validación local](docs/local-validation-2026-07-23.md)
- [Diseño de distribución independiente](docs/superpowers/specs/2026-07-23-clipdrop-standalone-distribution-design.md)
- [Diseño del preview](docs/superpowers/specs/2026-07-23-clipdrop-preview-selection-design.md)

## Uso responsable

ClipDrop no evita DRM, pagos, autenticación ni restricciones regionales.
Utilízalo únicamente con material propio, autorizado o permitido legalmente.
El usuario es responsable de respetar los derechos aplicables y las
condiciones del servicio de origen.

## Repositorio

`https://github.com/smithplus/clipdrop`
