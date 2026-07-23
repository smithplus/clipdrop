# ClipDrop

ClipDrop is a UXP extension for Adobe Premiere Pro that lets editors preview
authorized YouTube media, mark In and Out points, download only the selected
segment, and import it into the open project.

> Status: `0.4.1` is a locally validated macOS Apple Silicon release. The
> ClipDrop menu bar app includes its media engine, yt-dlp, ffmpeg, ffprobe, and
> the Premiere panel. Users do not need Node.js, Homebrew, or a manually started
> service. A Windows installer is the next distribution target.

## Features

- Preview through the official YouTube player.
- Timeline with a playhead and In/Out markers.
- Full clip or precise selected segment.
- Video with audio, WAV audio, or video without audio.
- Premiere-friendly H.264/AAC and 48 kHz WAV output.
- Automatic import into `ClipDrop Imports`.
- Menu bar status, restart, logs, and launch-at-login controls.
- Local-only communication on `127.0.0.1`.

## Install on macOS

1. Download `ClipDrop-0.4.1-macOS-arm64.dmg`.
2. Drag `ClipDrop` to Applications and open it once.
3. Keep `Launch at Login` enabled in the ClipDrop menu bar menu.
4. Open Premiere Pro 25.6 or later.
5. Open `Window > UXP Plugins > ClipDrop`.

The app registers the bundled Premiere panel through Adobe's installed UPIA
component. Creative Cloud does not need to remain open while ClipDrop runs.
Because the current development build is not notarized, macOS may require
right-clicking ClipDrop and selecting `Open` the first time.

See [Installation](docs/installation.md) for local development and manual panel
installation.

## Usage

1. Paste a public YouTube link that you are authorized to download.
2. Select `Preview`.
3. Mark In and Out on the timeline, use the controls, or enter the times.
4. Choose `Video + Audio`, `Audio Only`, or `Video Only`, then select a folder.
5. Select `Download and Import`.

Time fields accept seconds, `MM:SS`, and `HH:MM:SS`. Manual selection remains
available when a video blocks embedded playback.

## Development

```sh
npm test
npm run package:plugin
npm install --prefix companion
npm run build:mac
```

The suite covers the menu app, bundled binary resolution, local API, jobs,
conversion, Premiere integration, In/Out selection, preview messages, and
packaging.

## Documentation

- [Installation](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Local validation](docs/local-validation-2026-07-23.md)
- [Standalone distribution design](docs/superpowers/specs/2026-07-23-clipdrop-standalone-distribution-design.md)

## Responsible Use

ClipDrop does not bypass DRM, paywalls, authentication, or regional
restrictions. Use it only with media you own, are authorized to use, or are
legally allowed to download. You are responsible for complying with applicable
rights and the source service's terms.

## Repository

`https://github.com/smithplus/clipdrop`
