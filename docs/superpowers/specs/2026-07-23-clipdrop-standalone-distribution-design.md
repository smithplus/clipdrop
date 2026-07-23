# ClipDrop Standalone Distribution Design

Date: 2026-07-23
Status: Proposed for implementation

## Objective

After a one-time installation, opening ClipDrop in Premiere must show a ready
panel without requiring a terminal, Node.js, Homebrew, manual Helper startup,
or interaction with Creative Cloud Desktop.

ClipDrop will be distributed publicly from:

- Repository: `https://github.com/smithplus/clipdrop`
- Local source: `/Users/martinsmith/projects/personal/clipdrop`

## User Experience

### Installation

The user downloads one platform-specific installer from GitHub Releases.
The installer:

1. Installs the standalone Helper and its media tools.
2. Registers an automatic per-user background service.
3. Installs the Premiere UXP panel through Adobe UPIA.
4. Starts the Helper immediately.
5. Verifies `http://127.0.0.1:47821/health`.

The installer reports success only when the panel is registered and the Helper
health check returns `ready: true`.

### Daily Use

1. The operating system starts the Helper when the user signs in.
2. The service restarts the Helper if it exits unexpectedly.
3. The user opens Premiere and then ClipDrop.
4. The panel checks the Helper and becomes usable immediately.

The normal workflow must not open Terminal, Command Prompt, Creative Cloud
Desktop, or a separate ClipDrop window.

### Failure State

The panel retries the Helper connection for a short bounded period before
showing an error. If the Helper remains unavailable, the panel shows:

- `Reintentar`
- `Open Diagnostics`
- The installed Helper version and expected port when available

It must not suggest installing Node.js or manually running source files.

## Architecture

### Premiere Panel

The existing UXP panel remains responsible for:

- Collecting URL, duration, output type, and destination.
- Sending jobs to the local Helper.
- Monitoring progress and cancellation.
- Importing completed media into `ClipDrop Imports`.

UXP cannot safely replace the Helper because it cannot execute `yt-dlp` and
`ffmpeg` as unrestricted native processes.

### Standalone Helper

The Helper will be built as a platform-specific executable. Its JavaScript
application code uses only Node.js built-in modules, making it suitable for a
Node Single Executable Application build.

Release bundles include pinned, known-good media binaries:

- `yt-dlp`
- `ffmpeg`
- `ffprobe`

No system installation of these tools is required. The Helper resolves bundled
binaries relative to its installation directory and does not depend on `PATH`.

### Service Management

macOS:

- Install under `~/Library/Application Support/ClipDrop`.
- Register `~/Library/LaunchAgents/com.clipdrop.helper.plist`.
- Use `RunAtLoad` and `KeepAlive`.
- Produce logs under `~/Library/Logs/ClipDrop`.

Windows:

- Install under `%LOCALAPPDATA%\ClipDrop`.
- Register a per-user scheduled task triggered at sign-in.
- Restart after unexpected exits.
- Produce logs under `%LOCALAPPDATA%\ClipDrop\logs`.

The Helper listens only on `127.0.0.1:47821` and keeps the existing
`x-clipdrop-client` request check.

## Packaging

GitHub Releases will contain:

- `ClipDrop-macOS-arm64.pkg`
- `ClipDrop-macOS-x64.pkg`
- `ClipDrop-Windows-x64.exe`
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
├── docs/
│   ├── architecture.md
│   ├── development.md
│   ├── installation.md
│   ├── troubleshooting.md
│   └── reference/
├── helper/
├── installers/
│   ├── macos/
│   └── windows/
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
reloads the service, and reinstalls the panel.

Automatic updates are deferred until signed update metadata and rollback
behavior can be implemented safely.

## Testing

Automated tests cover:

- Existing request validation, job lifecycle, conversion plans, and panel logic.
- Resolution of bundled binaries without `PATH`.
- Service configuration generation.
- Installer preflight and post-install health checks.
- Package contents and checksums.

Local release validation covers:

- Fresh installation.
- Helper availability after sign-in without a terminal.
- Helper restart after forced termination.
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
5. The Helper returns automatically after a crash or the next sign-in.
6. Installation and troubleshooting are documented for macOS and Windows.
