# ClipDrop 0.4.3 Local Validation

Date: 2026-07-23

Environment:

- macOS Apple Silicon
- Adobe Premiere Pro 26.3.0
- ClipDrop menu bar app 0.4.3
- yt-dlp 2026.07.04, bundled universal binary
- ffmpeg 6.0 and ffprobe 4.4.1, bundled arm64 binaries

## Results

- All 73 automated tests passed.
- The installed app reported `ready: true` at its local health endpoint.
- Adobe UPIA listed `ClipDrop 0.4.3` as enabled for Premiere Pro.
- The app package contains the panel and all three executable dependencies.
- A real authorized-media test produced a 2.000-second 1920x1080 MP4 with H.264
  video and AAC audio.
- The panel was visually checked at 380x720 and the 280x600 minimum with no
  horizontal overflow or clipped controls.
- The YouTube player supplies ClipDrop's installed app ID through the official
  `origin` and `widget_referrer` parameters to prevent player error 153.
- `ClipDrop-0.4.3-macOS-arm64.dmg` was built successfully.

## Installed Paths

```text
/Applications/ClipDrop.app
dist/ClipDrop-0.4.3.ccx
companion/dist/ClipDrop-0.4.3-macOS-arm64.dmg
```

## Remaining Manual Premiere Check

Premiere was closed during replacement. Reopen Premiere, select
`Window > UXP Plugins > ClipDrop`, and confirm:

1. The panel footer reads `v0.4.3`.
2. The status reads `Ready`.
3. Preview and In/Out controls appear with the compact custom styling.
4. A completed download appears in `ClipDrop Imports`.

The local build is unsigned and not notarized. Signing and notarization remain
required before broad public distribution.
