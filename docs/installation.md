# Instalación

## Compatibilidad

- Premiere Pro 25.6 o posterior.
- macOS arm64/x64 o Windows x64.
- Node.js 20 o posterior.
- yt-dlp, ffmpeg y ffprobe disponibles en `PATH`.

## macOS

Instala las dependencias:

```sh
brew install node yt-dlp ffmpeg
```

Inicia el Helper:

```sh
open "helper/install/macos/Start ClipDrop Helper.command"
```

Instala `dist/ClipDrop-0.2.0.ccx` con doble clic. También puedes usar UPIA:

```sh
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" \
  --install "/ruta/completa/ClipDrop-0.2.0.ccx"
```

## Windows

1. Instala Node.js, yt-dlp y ffmpeg.
2. Confirma que `node`, `yt-dlp`, `ffmpeg` y `ffprobe` funcionan desde CMD.
3. Ejecuta `helper\install\windows\Start ClipDrop Helper.cmd`.
4. Abre `dist\ClipDrop-0.2.0.ccx`.

UPIA también puede instalar el paquete sin navegar por Creative Cloud Desktop:

```bat
"%CommonProgramFiles%\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe" /install "C:\ruta\ClipDrop-0.2.0.ccx"
```

## Abrir el panel

1. Abre un proyecto en Premiere.
2. Selecciona `Ventana > UXP Plugins > ClipDrop`.
3. Verifica que el indicador diga `Helper listo`.

Después de actualizar el `.ccx`, guarda el proyecto y reinicia Premiere para
asegurar que la nueva versión sustituya al plugin que estaba cargado en memoria.

## Desarrollo

UXP Developer Tool 2.2 o posterior sólo es necesario para `Load & Watch`,
depuración y empaquetado oficial durante desarrollo. No es necesario para usar
un `.ccx` ya instalado.
