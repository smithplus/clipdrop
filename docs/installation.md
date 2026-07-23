# Installation

## Compatibility

- Adobe Premiere Pro 25.6 or later.
- macOS Apple Silicon for the current `0.4.1` installer.
- Internet access for YouTube preview and authorized downloads.

Node.js, Homebrew, yt-dlp, ffmpeg, and ffprobe are not required for normal use.

## macOS

1. Download `ClipDrop-0.4.1-macOS-arm64.dmg`.
2. Drag `ClipDrop` to `/Applications`.
3. Open ClipDrop once. Its icon appears in the macOS menu bar.
4. Confirm the menu reads `ClipDrop is ready`.
5. Open Premiere and select `Window > UXP Plugins > ClipDrop`.

ClipDrop registers its bundled `.ccx` through Adobe's UPIA component on the
first launch of each app version. Creative Cloud Desktop does not need to stay
open.

The current development build is not signed or notarized. If Gatekeeper blocks
it, right-click the app, select `Open`, and confirm once. Public production
releases should be signed and notarized before general distribution.

## Updating

1. Quit ClipDrop from its menu bar menu.
2. Replace `/Applications/ClipDrop.app` with the newer version.
3. Open ClipDrop once.
4. Restart Premiere so it reloads the updated panel.

## Manual Development Install

Developers can build and install the panel without the menu app:

```sh
npm run package:plugin
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" \
  --install "/full/path/ClipDrop-0.4.1.ccx"
```

Run `npm run start:helper` only when developing directly from source. End users
should run the ClipDrop app instead.

## Windows

The engine and installer paths are designed for Windows, but a tested Windows
installer is not published in `0.4.1`. Do not treat the source helper scripts as
the stable end-user installation.
