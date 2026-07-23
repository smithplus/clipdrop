# Installation

## Compatibility

- Premiere Pro 25.6 or later.
- macOS arm64/x64 or Windows x64.
- Node.js 20 or later.
- yt-dlp, ffmpeg, and ffprobe available on `PATH`.

## macOS

Install the dependencies:

```sh
brew install node yt-dlp ffmpeg
```

Start the Helper:

```sh
open "helper/install/macos/Start ClipDrop Helper.command"
```

Double-click `dist/ClipDrop-0.3.0.ccx` to install it. You can also use UPIA:

```sh
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" \
  --install "/full/path/ClipDrop-0.3.0.ccx"
```

## Windows

1. Install Node.js, yt-dlp, and ffmpeg.
2. Confirm `node`, `yt-dlp`, `ffmpeg`, and `ffprobe` work from CMD.
3. Run `helper\install\windows\Start ClipDrop Helper.cmd`.
4. Open `dist\ClipDrop-0.3.0.ccx`.

UPIA can also install the package without navigating through Creative Cloud
Desktop:

```bat
"%CommonProgramFiles%\Adobe\Adobe Desktop Common\RemoteComponents\UPI\UnifiedPluginInstallerAgent\UnifiedPluginInstallerAgent.exe" /install "C:\path\ClipDrop-0.3.0.ccx"
```

## Open the Panel

1. Open a project in Premiere.
2. Select `Window > UXP Plugins > ClipDrop`.
3. Confirm the status reads `Helper ready`.

After updating the `.ccx`, save the project and restart Premiere so the new
version replaces the plugin already loaded in memory.

## Development

UXP Developer Tool 2.2 or later is required only for `Load & Watch`, debugging,
and official packaging during development. It is not required to use an
installed `.ccx`.
