# Solución de problemas

## Helper desconectado

Comprueba:

```sh
curl http://127.0.0.1:47821/health
```

Una respuesta correcta contiene `"ready": true`. Si no responde:

- macOS: abre `helper/install/macos/Start ClipDrop Helper.command`.
- Windows: abre `helper\install\windows\Start ClipDrop Helper.cmd`.
- Confirma que el puerto `47821` no esté ocupado.

Si responde pero `ready` es `false`, falta yt-dlp o ffmpeg en `PATH`.

## El preview no carga

- Confirma que el enlace sea público y válido.
- Algunos videos bloquean la reproducción embebida.
- Videos con autenticación, edad o restricciones regionales pueden fallar.
- Usa los campos Inicio y Final si la reproducción embebida no está disponible.

## ClipDrop no aparece en Premiere

1. Confirma que Premiere sea 25.6 o posterior.
2. Instala nuevamente el `.ccx`.
3. Guarda el proyecto y reinicia Premiere.
4. Busca `Ventana > UXP Plugins > ClipDrop`.

## Descarga correcta, importación fallida

- Debe haber un proyecto abierto.
- La carpeta elegida debe seguir disponible.
- Comprueba permisos de lectura y escritura.
- Intenta importar manualmente el archivo generado para distinguir un problema
  de formato de un problema de API.

## Registros

macOS:

```text
~/Library/Logs/Adobe/Adobe Premiere Pro 2026/UXPLogs_*.log
```

El Helper escribe en la terminal que lo inició. La versión independiente
escribirá registros propios bajo `~/Library/Logs/ClipDrop`.
