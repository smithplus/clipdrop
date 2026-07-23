# ClipDrop 0.1.0 Local Validation

Date: 2026-07-23

Environment:

- macOS
- Adobe Premiere Pro 26.3.0
- Node.js 26.5.0
- yt-dlp 2026.07.04
- ffmpeg 8.1.2

## Results

- All 44 automated tests passed.
- The Helper responded at `127.0.0.1:47821` with `ready: true`.
- `dist/ClipDrop-0.1.0.ccx` passed the ZIP integrity check.
- Adobe's official UPIA installer installed the package successfully.
- UPIA listed `ClipDrop 0.1.0` as enabled for Premiere Pro.
- Premiere's UXP log confirmed that `com.clipdrop.premiere` loaded without
  plugin errors.
- A real download produced a 2.000-second MP4 segment with 1920x1080 H.264
  video and 48 kHz AAC audio.

## Verified macOS Installation

```sh
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" \
  --install "/path/to/dist/ClipDrop-0.1.0.ccx"
```

## Final Manual Test

1. Open `helper/install/macos/Start ClipDrop Helper.command`.
2. Open a Premiere project.
3. Open `Window > UXP Plugins > ClipDrop`.
4. Choose an output folder and use a video you are authorized to download.
5. Confirm the result appears in `ClipDrop Imports`.

Opening the panel and selecting a file require interaction with Premiere. The
rest of the workflow was validated locally.
