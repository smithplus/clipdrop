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
- Full clip or precise selected segment. A segment downloads only its window,
  so a short clip from a long video no longer downloads the whole video.
- Resolution selection (Best, 2160p, 1440p, 1080p, 720p, 480p), preferring
  H.264 up to 1080p so most clips remux without a slow re-encode.
- Optional "maximum compatibility" mode that always re-encodes.
- Video with audio, WAV audio, or video without audio.
- Premiere-friendly H.264/AAC and 48 kHz WAV output.
- Clear, specific messages when YouTube blocks a download (private, region,
  rate-limited, or downloader out of date).
- Automatic import into `ClipDrop Imports`.
- Menu bar status, restart, logs, launch-at-login, and a "Check for Updates"
  action that refreshes the yt-dlp media engine.
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
4. Choose `Video + Audio`, `Audio Only`, or `Video Only`.
5. Pick a `Quality`. Leave `maximum compatibility` off unless a clip refuses to
   import, then select a folder.
6. Select `Download and Import`.

Time fields accept seconds, `MM:SS`, and `HH:MM:SS`. Manual selection remains
available when a video blocks embedded playback.

## Development

```sh
npm test
npm run package:plugin
npm install --prefix companion
npm run build:mac                       # Apple Silicon (arm64) DMG + zip
npm --prefix companion run build:mac:x64 # Intel build (run on an Intel mac)
npm --prefix companion run build:win     # Windows nsis installer
```

The suite covers the menu app, bundled binary resolution, local API, jobs,
conversion, format and quality selection, stream-copy remux, the yt-dlp
updater, the notarization hook, Premiere integration, In/Out selection,
preview messages, and packaging.

## Developer and AI Agent Handoff

This section is the operational starting point for future Claude, Codex, or
human contributors. Read it before changing behavior. The detailed documents
linked below remain authoritative when they cover a topic more deeply.

### Current Snapshot

- Current version: `0.4.1`.
- Branch and release source: `main`.
- Public release:
  [`v0.4.1`](https://github.com/smithplus/clipdrop/releases/tag/v0.4.1).
- Release status: usable macOS Apple Silicon prerelease.
- Local installation target: `/Applications/ClipDrop.app`.
- Premiere requirement: version 25.6 or later.
- Local API: `http://127.0.0.1:47821`.
- Premiere plugin ID: `com.clipdrop.premiere`.
- Companion app ID: `com.clipdrop.companion`.
- Automated suite at this handoff: 105 tests.
- Windows runtime paths exist, but no tested Windows installer is published.
- The macOS app is not Developer ID signed or Apple notarized.

The `0.4.1` panel is registered locally and its engine reports `ready: true`.
The YouTube error 153 fix has automated coverage and is included in the public
release, but its final confirmation inside a restarted Premiere WebView should
be repeated when development resumes.

### System Ownership

| Path | Responsibility | Important entry points |
| --- | --- | --- |
| `plugin/` | Premiere UXP panel, preview selection, job submission, and import | `index.html`, `main.js`, `manifest.json` |
| `plugin/src/` | Testable panel domain and Premiere integration modules | `domain.js`, `controller.js`, `premiere.js`, `helper-client.js` |
| `plugin/preview/` | Local WebView and official YouTube IFrame API integration | `player.html`, `player.js`, `player-config.js` |
| `helper/` | Reusable local API, validation, job execution, and media conversion | `server.js`, `job-manager.js`, `runner.js`, `planner.js` |
| `companion/` | Electron menu bar app, bundled engine lifecycle, UPIA registration, yt-dlp updates, and DMG build | `src/main.js`, `src/engine.js`, `src/plugin-installer.js`, `src/updater.js`, `scripts/notarize.js` |
| `scripts/` | Root packaging utilities | `package-plugin.js` |
| `dist/` | Versioned `.ccx` panel artifacts committed for direct access | `ClipDrop-<version>.ccx` |
| `docs/` | Architecture, installation, troubleshooting, validation, and approved designs | See the documentation index below |

The historical `helper/install/` scripts are development fallbacks. They are
not the stable end-user experience. End users run the ClipDrop companion app.

### Runtime Flow

1. The UXP panel loads `plugin:/preview/player.html` in a WebView.
2. The WebView uses the official YouTube IFrame API for preview and sends
   versioned metadata/time events to the panel.
3. The panel sends a validated job (URL, mode, output kind, quality, compat)
   to the companion app over local HTTP.
4. `JobManager` serializes jobs, running one at a time with progress and
   cancellation state while the rest wait in `queued`.
5. Bundled `yt-dlp` retrieves the authorized source media at the requested
   resolution. For a segment it downloads only the selected window with
   `--download-sections` and `--force-keyframes-at-cuts`.
6. `ffprobe` inspects the source. When it is already H.264/AAC (and `compat`
   is off), bundled `ffmpeg` remuxes with a stream copy; otherwise it
   re-encodes to H.264/AAC MP4, H.264 video-only MP4, or 48 kHz WAV.
7. The panel imports the completed file into the `ClipDrop Imports` Premiere
   bin through `Project.importFiles()`.

The preview is for selection only. Numeric In and Out seconds are
authoritative: yt-dlp cuts the segment to those keyframe-accurate boundaries
during download, so a short clip from a long video no longer downloads the
whole video.

### Non-Negotiable Invariants

- Keep all product UI and maintained documentation in English.
- Do not replace custom `.control` elements with native UXP `<button>` widgets.
  Premiere applies native pill styling that ignores important CSS.
- Do not use CSS Grid in the panel. The supported Premiere UXP runtime requires
  the existing Flexbox layout.
- Keep the minimum panel width at 280 px and verify both 280x600 and 380x720.
- Keep the engine bound to `127.0.0.1`; do not expose it to the LAN.
- Keep the `x-clipdrop-client: com.clipdrop.premiere` requirement on job routes.
- Keep end-user binaries bundled. Do not reintroduce Node.js, Homebrew, yt-dlp,
  ffmpeg, or ffprobe as user-installed prerequisites.
- Keep `localFileSystem: "request"` unless a reviewed feature truly requires
  broader access. Prefer letting the companion app create output directories.
- Preserve the responsible-use boundary: public YouTube URLs only, with no DRM,
  paywall, private-access, authentication, or regional-restriction bypass.
- Add a failing test before every behavior change, then run the complete suite.
- Never publish an installer unless tests, package integrity, local health, and
  Adobe registration checks pass.

### YouTube Preview Constraint

YouTube error `153` means the player did not receive an HTTP Referer or
equivalent API client identity. A local UXP WebView uses the `plugin:` protocol
and does not provide a normal website referrer.

`plugin/preview/player-config.js` must continue to provide both `origin` and
`widget_referrer` as:

```text
https://com.clipdrop.premiere
```

Do not remove or replace this identity without retesting inside Premiere.
Errors `101` and `150` are different: they mean the video owner disabled
embedded playback and should fall back to manual time entry.

### Development Commands

Run core tests without desktop packaging dependencies:

```sh
npm test
npm run test:plugin
npm run test:helper
npm run test:companion
npm run test:packaging
```

Build the Premiere panel:

```sh
npm run package:plugin
unzip -t dist/ClipDrop-<version>.ccx
```

Install companion build dependencies and build macOS Apple Silicon:

```sh
npm install --prefix companion
npm run build:mac
```

Run only the source engine during development:

```sh
npm run start:helper
```

The build downloads a pinned official yt-dlp release, verifies its SHA-256
checksum, and copies architecture-specific ffmpeg and ffprobe binaries into the
app resources. Generated binaries and `companion/dist/` are intentionally
ignored by Git.

### Version Synchronization

Every release version must be updated consistently in:

- Root `package.json`.
- `plugin/manifest.json`.
- The visible footer in `plugin/index.html`.
- `companion/package.json`.
- `companion/package-lock.json`.
- The `.ccx` path in `companion/package.json` under `extraResources`.
- README and installation artifact names.
- Local validation documentation.

Build the `.ccx` before the companion app. The companion build expects the
matching `dist/ClipDrop-<version>.ccx` and embeds it as
`Resources/installer/ClipDrop.ccx`.

### Local Installation and Verification

After building, quit the existing ClipDrop menu bar app before replacing it:

```sh
osascript -e 'tell application "ClipDrop" to quit'
ditto companion/dist/mac-arm64/ClipDrop.app /Applications/ClipDrop.app
xattr -dr com.apple.quarantine /Applications/ClipDrop.app
open -a /Applications/ClipDrop.app
```

Verify engine health:

```sh
curl http://127.0.0.1:47821/health
```

The response must contain the current version and `"ready": true`.

Verify Adobe registration:

```sh
"/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent" \
  --list all
```

Premiere must list ClipDrop with the current version and `Enabled` status.
Restart Premiere after every panel update because an open Premiere process keeps
the previous UXP panel and WebView in memory. Never close Premiere
automatically when an editor may have unsaved work.

### Release Checklist

1. Confirm `git diff --check` is clean.
2. Run `npm test`.
3. Build and integrity-check the matching `.ccx`.
4. Build the self-contained DMG.
5. Replace and open the local companion app.
6. Confirm the local health endpoint is ready.
7. Confirm UPIA lists the new panel version.
8. Restart Premiere and manually test preview, selection, download, and import.
9. Commit and push `main`.
10. Wait for `.github/workflows/validate.yml` to pass.
11. Publish the DMG and `.ccx` under a matching `v<version>` GitHub release.
12. Keep releases marked prerelease until signing and notarization are complete.

### Known Constraints and Follow-Up Work

- Signing and notarization are wired in `companion/package.json`
  (`hardenedRuntime`, `build/entitlements.mac.plist`) and the
  `scripts/notarize.js` afterSign hook, which activates only when `APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, and `APPLE_TEAM_ID` are set. A signing
  certificate (`CSC_LINK`/`CSC_KEY_PASSWORD`) and those secrets must be
  provided on the build machine or in CI to produce a Gatekeeper-clean app.
- The macOS build targets `arm64` and `x64`, but `prepare:binaries` bundles
  host-architecture ffmpeg/ffprobe (`ffmpeg-static` ships only the host arch),
  so the `x64` DMG must be built on an Intel mac or supplied with `x64`
  ffmpeg/ffprobe. `yt-dlp_macos` is already universal. The script now fails
  loudly on a cross-architecture mismatch instead of shipping the wrong binary.
- The Windows `nsis` target exists but is not yet validated on a real Windows
  machine with Premiere.
- Some YouTube videos legitimately disable embedded playback.
- The panel must remain usable with manual Start and End fields when preview
  fails.

The next requested feature is an output destination mode that defaults to:

```text
<Premiere project directory>/Downloads
```

The active Premiere `Project.path` property supplies the absolute project file
path. Derive its parent directory in a cross-platform helper, append
`Downloads`, and send that path to the companion engine. The companion should
create the directory, preserving the panel's `"request"` filesystem permission.
Keep `Custom Folder` as an explicit alternative. If the project has not been
saved and has no usable path, show a clear message and fall back to the custom
folder picker. This feature has been requested but is not implemented in
`0.4.1`.

### Safe Handoff Procedure

Before ending an iteration:

1. Leave the worktree clean or document every intentional uncommitted file.
2. Record commands actually run and tests actually passed.
3. Distinguish automated validation from manual Premiere validation.
4. Update version references and local validation notes when publishing.
5. Commit focused changes and push only after GitHub-facing artifacts are ready.

## Documentation

- [Installation](docs/installation.md)
- [Architecture](docs/architecture.md)
- [Development](docs/development.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Local validation](docs/local-validation-2026-07-23.md)
- [AI agent handoff README design](docs/superpowers/specs/2026-07-23-ai-agent-handoff-readme-design.md)
- [Standalone distribution design](docs/superpowers/specs/2026-07-23-clipdrop-standalone-distribution-design.md)

## Responsible Use

ClipDrop does not bypass DRM, paywalls, authentication, or regional
restrictions. Use it only with media you own, are authorized to use, or are
legally allowed to download. You are responsible for complying with applicable
rights and the source service's terms.

## Repository

`https://github.com/smithplus/clipdrop`
