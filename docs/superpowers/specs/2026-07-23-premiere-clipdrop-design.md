# Premiere ClipDrop Design

## Summary

Build a cross-platform Premiere Pro plugin that lets an editor paste a video URL, choose either the full clip or a precise time segment, choose the output type, download and normalize the media locally, then import it into the current Premiere project.

The plugin is designed as a modern UXP plugin for Premiere Pro with a small local helper service. The UXP panel owns the editor-facing workflow and Premiere import step. The helper owns network downloads, ffmpeg processing, binary management, and operating-system-specific work.

## Goals

- Provide a Premiere panel where the editor can paste a supported URL and import media without leaving Premiere.
- Support full clip downloads and segment downloads using start/end time fields.
- Support output modes: video with audio, audio only, and video only.
- Produce Premiere-friendly files by default.
- Work on macOS and Windows from the same GitHub repository.
- Ship installable release artifacts through GitHub Releases.
- Keep the downloader implementation legal, explicit, and user-controlled.

## Non-Goals

- Do not bypass DRM, paywalls, private access controls, regional locks, or platform restrictions.
- Do not embed account scraping, browser cookie theft, or automated login behavior.
- Do not support every `yt-dlp` site in the first version, even if the helper may technically work with more than YouTube.
- Do not build a CEP/ZXP version in the first version.
- Do not auto-edit downloaded clips into the active timeline in the first version.

## Users and Workflow

The primary user is an editor working inside Premiere Pro who has permission to use source media and wants a faster import workflow.

The first-version workflow:

1. Open the `ClipDrop` panel in Premiere.
2. Paste a YouTube URL.
3. Choose `Full Clip` or `Segment`.
4. If `Segment` is selected, enter start and end times.
5. Choose `Video + Audio`, `Audio Only`, or `Video Only`.
6. Choose or confirm the output folder.
7. Click `Import`.
8. Watch progress in the panel.
9. The final file appears in a `ClipDrop Imports` bin in the current project.

## Technical Direction

Use UXP for the Premiere plugin because it is Adobe's current extension path for new Premiere development. Package the plugin as `.ccx` for installation through Creative Cloud Desktop or compatible UXP installation tooling.

Use a local helper because download and media-processing work needs reliable binary execution, process management, filesystem access, and long-running progress reporting. Keeping that outside the UXP panel makes the plugin more reliable across macOS and Windows.

## Components

### UXP Plugin

Responsibilities:

- Render the Premiere panel UI.
- Validate URL, mode, time range, and output type before sending a job.
- Discover whether the helper is installed and reachable.
- Send download jobs to the helper over localhost.
- Display progress, completion, cancellation, and errors.
- Import the completed file into the active Premiere project.
- Create or reuse a `ClipDrop Imports` project bin.

The plugin should not shell out directly to `yt-dlp` or `ffmpeg` in the first version.

### Local Helper

Responsibilities:

- Run as a small local service on `127.0.0.1`.
- Accept jobs only from the local machine.
- Execute `yt-dlp` and `ffmpeg`.
- Normalize output into Premiere-friendly media.
- Emit structured progress updates.
- Save files in the selected output folder.
- Return final file paths to the UXP plugin.
- Provide a health endpoint so the panel can show whether setup is complete.

The helper must not expose remote network control beyond the local machine.

### Download and Media Pipeline

For `Video + Audio`:

- Use `yt-dlp` to fetch the best reasonable source streams.
- Use `ffmpeg` to produce an `.mp4` with H.264 video and AAC audio when conversion is needed.

For `Audio Only`:

- Use `yt-dlp` and `ffmpeg` to produce `.wav` by default.
- A later preference can allow `.m4a`.

For `Video Only`:

- Produce an `.mp4` video-only file.

For `Segment`:

- Download or stream source media through the helper.
- Use `ffmpeg` time trimming with explicit start and end values.
- Prefer reliable output over byte-range partial-download complexity.

## API Between Plugin and Helper

The helper exposes a local HTTP API.

Required endpoints:

- `GET /health`: returns helper version, platform, and availability of required binaries.
- `POST /jobs`: starts a download/import-prep job and returns a job id.
- `GET /jobs/:id`: returns status, progress, current phase, warnings, errors, and final file path when complete.
- `POST /jobs/:id/cancel`: cancels an active job.

Job request fields:

- `url`: source URL.
- `mode`: `full` or `segment`.
- `startTime`: optional time string or seconds, required for segment mode.
- `endTime`: optional time string or seconds, required for segment mode.
- `outputKind`: `video_audio`, `audio_only`, or `video_only`.
- `outputDirectory`: absolute local folder path selected by the user.

Job result fields:

- `status`: `queued`, `running`, `completed`, `failed`, or `cancelled`.
- `phase`: human-readable phase such as `metadata`, `download`, `convert`, or `finalize`.
- `progress`: number from 0 to 100 when available.
- `filePath`: absolute local path when complete.
- `error`: structured error code and message when failed.

## UI Design

The panel should be compact and utility-focused, matching a professional editor workflow rather than a landing-page style.

Primary controls:

- URL input.
- Segmented control for `Full Clip` / `Segment`.
- Start and end inputs shown only for segment mode.
- Segmented control or radio group for output type.
- Output folder selector.
- Import button.
- Cancel button during active jobs.
- Progress area with current phase and concise status.

The UI should avoid instructional clutter. Error messages should be specific and actionable.

## Error Handling

The panel should handle:

- Helper not installed or not running.
- Required binaries missing or outdated.
- Invalid URL.
- Unsupported source.
- Private, unavailable, region-locked, live, or DRM-protected media.
- Invalid time range.
- Output folder not writable.
- Download failure.
- Conversion failure.
- Premiere import failure.

Error messages must not suggest bypassing platform restrictions.

## Legal and Safety Copy

The plugin should include a concise first-run notice:

Use this tool only for media you own, have permission to use, or are legally allowed to use. The tool does not bypass DRM, paywalls, private access, or platform restrictions.

This notice should be present in the README and visible in the panel on first run or settings.

## Packaging and Distribution

The GitHub repository should include:

- `plugin/`: UXP plugin source.
- `helper/`: local helper source.
- `docs/`: design and user documentation.
- Build scripts for macOS and Windows artifacts.
- GitHub Actions workflow for validation and release packaging when feasible.

Release artifacts:

- `ClipDrop.ccx`
- `ClipDrop-Helper-macOS.pkg` or a signed `.app`/installer equivalent.
- `ClipDrop-Helper-Windows-Setup.exe` or `.msi`.

The first local development version may use unsigned/dev installation, but the release design should account for signing and notarization on macOS.

## Testing Strategy

Plugin tests:

- Validate form state and request payload creation.
- Validate helper health/error states.
- Validate progress state transitions.

Helper tests:

- Validate time parsing.
- Validate job request schema.
- Validate command planning for full clip and segment modes.
- Validate output filename generation.
- Validate error mapping from process failures.

Integration tests:

- Run helper against a small known public test URL only when network access is explicitly available.
- Verify output file exists and has expected container/stream properties.

Manual Premiere tests:

- Install helper.
- Install plugin.
- Open Premiere and confirm panel loads.
- Run each output mode.
- Run a short segment import.
- Confirm files land in `ClipDrop Imports`.
- Confirm cancellation leaves no broken import.

## First Implementation Milestones

1. Scaffold repository structure and development docs.
2. Build helper core with health endpoint, job model, validation, and mocked command execution.
3. Add helper command planning for `yt-dlp` and `ffmpeg`.
4. Add real helper execution and progress parsing.
5. Build UXP panel UI and helper connection state.
6. Connect panel job submission and progress polling.
7. Add Premiere import into `ClipDrop Imports`.
8. Package local development builds.
9. Add GitHub release packaging path.

## Open Decisions

- Final product name: use `ClipDrop` as the working name until changed.
- Default audio-only format: use `.wav` for first version.
- Signing and notarization approach: document before public release; not required for first local prototype.
- Whether to support non-YouTube URLs: defer until after YouTube path is stable.

## Approval

The approved direction is a UXP Premiere plugin plus a local helper service, distributed through GitHub Releases with cross-platform install artifacts.
