# ClipDrop Standalone Distribution Design

Date: 2026-07-23
Status: Approved for implementation

## Objective

After a one-time installation, opening ClipDrop in Premiere must show a ready
panel without requiring a terminal, Node.js, Homebrew, manual background-engine
startup, or interaction with Creative Cloud Desktop.

ClipDrop will be distributed publicly from:

- Repository: `https://github.com/smithplus/clipdrop`
- Local source: `/Users/martinsmith/projects/personal/clipdrop`

## User Experience

### Installation

The user downloads one platform-specific installer from GitHub Releases.
The installer:

1. Installs the ClipDrop menu bar application and its media tools.
2. Registers the application to launch automatically for the current user.
3. Installs the Premiere UXP panel through Adobe UPIA.
4. Starts ClipDrop immediately in the menu bar or system tray.
5. Verifies `http://127.0.0.1:47821/health`.

The installer reports success only when the panel is registered and the engine
health check returns `ready: true`.

### Daily Use

1. The operating system starts the ClipDrop companion app when the user signs in.
2. The app starts and monitors the background media engine.
3. The user opens Premiere and then ClipDrop.
4. The panel checks ClipDrop and becomes usable immediately.

The normal workflow must not open Terminal, Command Prompt, Creative Cloud
Desktop, or a separate ClipDrop window.

### Menu Bar and System Tray

ClipDrop follows the same user-facing pattern as Overlord:

- macOS shows a persistent ClipDrop icon in the menu bar.
- Windows shows a persistent ClipDrop icon in the system tray.
- Launching ClipDrop does not open a regular application window.
- The menu exposes:
  - `ClipDrop is ready`
  - `Open Logs`
  - `Restart ClipDrop`
  - `Launch at Login`
  - `Quit`

The icon makes the background dependency visible and controllable without
requiring the editor to understand or start a separate Helper.

### Failure State

The panel retries the ClipDrop connection for a short bounded period before
showing an error. If ClipDrop remains unavailable, the panel shows:

- `Retry`
- `Open Diagnostics`
- The installed ClipDrop version and expected port when available

It must not suggest installing Node.js or manually running source files.

## Architecture

### Premiere Panel

The existing UXP panel remains responsible for:

- Collecting URL, duration, output type, and destination.
- Sending jobs to the local ClipDrop engine.
- Monitoring progress and cancellation.
- Importing completed media into `ClipDrop Imports`.

UXP cannot safely replace the background engine because it cannot execute `yt-dlp` and
`ffmpeg` as unrestricted native processes.

### ClipDrop Companion App

The companion is an Electron tray application. Electron is selected because it
provides one maintained codebase for macOS and Windows, includes the Node.js
runtime required by the existing engine, and supports menu bar/system tray,
launch-at-login, process supervision, packaging, and updates.

The application has no normal window in daily use. Its main process hosts the
existing loopback API and runs media jobs directly. The panel never asks the
user to open, install, or repair a separate Helper.

Release bundles include pinned, known-good media binaries:

- `yt-dlp`
- `ffmpeg`
- `ffprobe`

No system installation of these tools is required. ClipDrop resolves bundled
binaries relative to its installation directory and does not depend on `PATH`.

### Service Management

macOS:

- Install `ClipDrop.app` under `/Applications` or `~/Applications`.
- Register launch-at-login through the Electron application.
- Keep the media engine in the Electron main process.
- Produce logs under `~/Library/Logs/ClipDrop`.

Windows:

- Install under `%LOCALAPPDATA%\Programs\ClipDrop`.
- Register launch-at-login through the Electron application.
- Keep the media engine in the Electron main process.
- Produce logs under `%LOCALAPPDATA%\ClipDrop\logs`.

ClipDrop listens only on `127.0.0.1:47821` and keeps the existing
`x-clipdrop-client` request check.

### Premiere Panel Rendering

The panel must reproduce the approved compact visual design inside Premiere,
not only in a browser fixture.

- Do not use CSS Grid because Premiere UXP does not support it.
- Do not rely on native UXP button appearance for primary visual controls.
- Implement local custom button controls with explicit focus, pointer, keyboard,
  selected, disabled, and busy states.
- Keep the 16:9 preview, In/Out timeline, three output modes, and small version
  label.
- Replace `Helper ready` with `Ready`.
- Replace `Helper disconnected` with `ClipDrop unavailable`.
- Do not expose implementation terms such as Helper, localhost, Node.js,
  yt-dlp, or ffmpeg in the normal panel workflow.

## Packaging

GitHub Releases will contain:

- `ClipDrop-macOS-arm64.dmg`
- `ClipDrop-macOS-x64.dmg`
- `ClipDrop-Windows-x64-Setup.exe`
- `ClipDrop-<version>.ccx`
- `SHA256SUMS`
- Release notes

The first local build may use development signing. Public macOS releases must
be signed with an Apple Developer ID and notarized before being described as
production-ready.

UPIA is still required internally to register the UXP panel with Premiere, but
the installer invokes it directly. The user does not need to open or navigate
Creative Cloud Desktop. Premiere itself supplies the Adobe runtime required by
the panel.

## Repository Structure

```text
clipdrop/
├── .github/workflows/
├── companion/
│   ├── src/
│   ├── assets/
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── development.md
│   ├── installation.md
│   ├── troubleshooting.md
│   └── reference/
├── helper/
├── plugin/
├── scripts/
├── THIRD_PARTY_NOTICES.md
├── LICENSE
├── README.md
└── package.json
```

The downloaded copy of Adobe's full documentation and sample repository will
not remain in the main repository. ClipDrop documentation will cite and link
the relevant official Adobe pages.

## Updates

Version one uses explicit GitHub Releases rather than silent automatic updates.
Installing a newer release replaces versioned application files atomically,
restarts the companion app and reinstalls the panel.

Automatic updates are deferred until signed update metadata and rollback
behavior can be implemented safely.

## Testing

Automated tests cover:

- Existing request validation, job lifecycle, conversion plans, and panel logic.
- Resolution of bundled binaries without `PATH`.
- Tray menu state and launch-at-login behavior.
- Companion lifecycle and engine restart behavior.
- Installer preflight and post-install health checks.
- Package contents and checksums.

Local release validation covers:

- Fresh installation.
- ClipDrop availability after sign-in without a terminal.
- Companion restart after forced termination.
- Premiere panel connection.
- Full clip and segment workflows.
- Video with audio, audio-only, and video-only outputs.
- Import into an open Premiere project.
- Upgrade and uninstall.

GitHub Actions build and test macOS arm64, macOS x64, and Windows x64 release
artifacts. Platform installers are not published unless their tests pass.

## Security and Legal

- The API remains loopback-only.
- Jobs require the ClipDrop client header.
- Playlists, private media, DRM bypass, and authenticated downloads remain out
  of scope.
- Bundled third-party binaries use pinned versions and published checksums.
- Their licenses and required notices are included in
  `THIRD_PARTY_NOTICES.md`.
- The installer never downloads executable dependencies from arbitrary URLs.

## Success Criteria

The standalone version is complete when:

1. A new user installs one file from GitHub Releases.
2. No development dependency or terminal interaction is required.
3. ClipDrop is connected when opened in Premiere.
4. A permitted segment can be downloaded, converted, and imported.
5. ClipDrop returns automatically after a crash or the next sign-in.
6. Installation and troubleshooting are documented for macOS and Windows.
7. The panel matches the approved compact design inside Premiere itself.
