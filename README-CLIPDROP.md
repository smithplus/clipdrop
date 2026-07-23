# ClipDrop para Adobe Premiere Pro

ClipDrop descarga material de YouTube que tengas permiso para usar, permite
elegir un clip completo o un segmento y lo importa directamente en una carpeta
`ClipDrop Imports` del proyecto abierto en Premiere.

## Requisitos

- Adobe Premiere Pro 25.6 o posterior.
- Node.js 20 o posterior.
- `yt-dlp` y `ffmpeg` disponibles en el sistema.
- UXP Developer Tool 2.2 o posterior para cargar la versión de desarrollo.

En macOS con Homebrew:

```sh
brew install node yt-dlp ffmpeg
```

En Windows pueden instalarse Node.js, yt-dlp y ffmpeg con sus instaladores
oficiales o con el gestor de paquetes habitual del equipo.

## Probar en macOS

Para probar el paquete ya instalado en esta Mac:

1. Abre `helper/install/macos/Start ClipDrop Helper.command`.
2. Abre un proyecto en Premiere.
3. Abre `Ventana > UXP Plugins > ClipDrop`.

Para cargar el código fuente durante el desarrollo:

1. Activa `Preferencias > Plugins > Enable developer mode` y reinicia Premiere.
2. En UXP Developer Tool, añade la carpeta `plugin` y pulsa `Load & Watch`.

## Probar en Windows

1. Abre `helper\install\windows\Start ClipDrop Helper.cmd`.
2. Activa el modo desarrollador de plugins en Premiere y reinícialo.
3. Añade la carpeta `plugin` en UXP Developer Tool y pulsa `Load & Watch`.
4. Abre `Ventana > UXP Plugins > ClipDrop`.

## Instalar el panel empaquetado

Genera el paquete:

```sh
npm run package:plugin
```

El archivo resultante queda en `dist/ClipDrop-0.1.0.ccx`. Ábrelo con doble clic
para que Creative Cloud Desktop instale el panel. El Helper debe permanecer
abierto mientras se realizan descargas.

También puede instalarse con la herramienta oficial UPIA incluida con Creative
Cloud. Consulta `docs/local-validation-2026-07-23.md` para ver el comando y la
validación realizada en Premiere Pro 26.3.

## Uso

1. Pega un enlace público de YouTube.
2. Elige `Clip completo` o `Segmento`.
3. Elige video con audio, sólo audio o sólo video.
4. Elige la carpeta de destino.
5. Pulsa `Descargar e importar`.

Los segmentos aceptan segundos, `MM:SS` o `HH:MM:SS`. El video se normaliza a
H.264/AAC en MP4; el audio se prepara como WAV de 48 kHz.

## Desarrollo

```sh
npm test
npm run start:helper
```

La API sólo escucha en `127.0.0.1:47821`. ClipDrop no evita DRM, pagos,
restricciones regionales ni accesos privados.
