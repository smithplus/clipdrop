#!/bin/zsh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../../.." && pwd)"

for TOOL in node yt-dlp ffmpeg; do
  if ! command -v "$TOOL" >/dev/null 2>&1; then
    echo "Falta $TOOL."
    echo "Instálalo y vuelve a abrir ClipDrop Helper."
    read -r "?Pulsa Enter para cerrar."
    exit 1
  fi
done

cd "$PROJECT_DIR" || exit 1
exec node helper/src/cli.js
