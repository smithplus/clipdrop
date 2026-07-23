# Validación local de ClipDrop 0.1.0

Fecha: 2026-07-23

Entorno:

- macOS
- Adobe Premiere Pro 26.3.0
- Node.js 26.5.0
- yt-dlp 2026.07.04
- ffmpeg 8.1.2

## Resultados

- Las 44 pruebas automáticas pasaron.
- El Helper respondió en `127.0.0.1:47821` con `ready: true`.
- El paquete `dist/ClipDrop-0.1.0.ccx` pasó la comprobación de integridad ZIP.
- El instalador oficial UPIA de Adobe instaló el paquete correctamente.
- UPIA listó `ClipDrop 0.1.0` como habilitado para Premiere Pro.
- El registro UXP de Premiere confirmó la carga de
  `com.clipdrop.premiere` sin errores del plugin.
- Una descarga real produjo un segmento MP4 de 2.000 segundos con video H.264
  1920x1080 y audio AAC de 48 kHz.

## Instalación verificada en macOS

```sh
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" \
  --install "/ruta/a/dist/ClipDrop-0.1.0.ccx"
```

## Prueba manual final

1. Abre `helper/install/macos/Start ClipDrop Helper.command`.
2. Abre un proyecto de Premiere.
3. Abre `Ventana > UXP Plugins > ClipDrop`.
4. Elige una carpeta de destino y usa un video que tengas permiso para
   descargar.
5. Confirma que el resultado aparece en `ClipDrop Imports`.

La apertura visual del panel y la selección del archivo requieren interacción
con Premiere. El resto del flujo quedó validado localmente.
