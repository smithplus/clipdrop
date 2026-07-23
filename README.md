# ClipDrop

ClipDrop is a UXP extension for Adobe Premiere Pro that lets editors preview
authorized YouTube media, mark In and Out points, download only the selected
segment, and import it into the open project.

> Status: `0.3.0` is a functional development release. The panel, preview, and
> conversion pipeline have been tested on macOS with Premiere Pro 26.3. A
> self-contained installer that removes Node.js, yt-dlp, and ffmpeg as external
> requirements is still under development.

## Features

- Preview through the official YouTube player.
- Timeline with a playhead and In/Out markers.
- In and Out marking from the current time or editable fields.
- Full clip or selected segment.
- Video with audio, WAV audio, or video without audio.
- Conversion to Premiere-friendly formats.
- Automatic import into `ClipDrop Imports`.
- Local Helper restricted to `127.0.0.1`.

## Current Requirements

- Adobe Premiere Pro 25.6 or later.
- Node.js 20 or later.
- yt-dlp.
- ffmpeg and ffprobe.

The planned self-contained release will bundle these dependencies and start the
Helper automatically.

## Quick Start

### macOS

```sh
brew install node yt-dlp ffmpeg
```

1. Download or clone this repository.
2. Open `helper/install/macos/Start ClipDrop Helper.command`.
3. Install `dist/ClipDrop-0.3.0.ccx`.
4. Open a project in Premiere.
5. Open `Window > UXP Plugins > ClipDrop`.

### Windows

1. Install Node.js, yt-dlp, and ffmpeg.
2. Open `helper\install\windows\Start ClipDrop Helper.cmd`.
3. Install `dist\ClipDrop-0.3.0.ccx`.
4. Open `Window > UXP Plugins > ClipDrop` in Premiere.

See [Installation](docs/installation.md) to use UPIA without navigating through
Creative Cloud Desktop.

## Usage

1. Paste a public YouTube link that you are authorized to download.
2. Select `Preview`.
3. Mark In and Out on the timeline, use the buttons, or enter the times.
4. Choose `Video + Audio`, `Audio Only`, or `Video Only`, then select a folder.
5. Select `Download and Import`.

Time fields accept seconds, `MM:SS`, and `HH:MM:SS`. Manual selection remains
available when a video blocks embedded playback.

## Development

```sh
npm test
npm run start:helper
npm run package:plugin
```

The automated suite covers validation, jobs, conversion, the local API,
Premiere integration, In/Out selection, preview messages, and packaging.

## Documentation

- [Installation](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Local validation](docs/local-validation-2026-07-23.md)
- [Standalone distribution design](docs/superpowers/specs/2026-07-23-clipdrop-standalone-distribution-design.md)
- [Preview design](docs/superpowers/specs/2026-07-23-clipdrop-preview-selection-design.md)

## Responsible Use

ClipDrop does not bypass DRM, paywalls, authentication, or regional
restrictions. Use it only with media you own, are authorized to use, or are
legally allowed to download. You are responsible for complying with applicable
rights and the source service's terms.

## Repository

`https://github.com/smithplus/clipdrop`
