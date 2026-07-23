# AI Agent Handoff README Design

## Goal

Add a self-contained `Developer and AI Agent Handoff` section to the existing
user-facing README. A future Claude, Codex, or human contributor should be able
to orient themselves, make a scoped change, validate it, and publish a release
without reconstructing the project's history from chat logs.

## Placement and Audience

The README remains user-first. The handoff section belongs after the existing
development introduction and before the documentation index. It targets
contributors who already understand JavaScript but may not know Premiere UXP,
Electron packaging, or ClipDrop's local engine.

## Required Content

The section must include:

1. A concise architecture map for `plugin/`, `helper/`, `companion/`,
   `scripts/`, `dist/`, and `docs/`.
2. The end-to-end data flow from YouTube preview through download, conversion,
   and Premiere import.
3. The authoritative commands for tests, panel packaging, companion dependency
   installation, macOS builds, and source-mode engine startup.
4. Project invariants:
   - UI and documentation are written in English.
   - The panel uses custom controls because native UXP buttons ignore key CSS.
   - The API remains bound to `127.0.0.1:47821`.
   - Job routes require the ClipDrop client header.
   - yt-dlp, ffmpeg, and ffprobe are bundled for end users.
   - Root, panel, companion, footer, and packaged artifact versions remain in
     sync.
   - Changes use test-first development and the complete suite must pass.
5. Premiere and YouTube integration hazards, including WebView error 153,
   project restart requirements after panel upgrades, saved-project path
   handling, and Adobe UPIA registration.
6. A release checklist covering tests, `.ccx`, DMG, local installation, UPIA
   verification, health verification, GitHub Actions, and GitHub Releases.
7. Current platform status and the next intended feature: an optional
   `<project directory>/Downloads` destination with a custom-folder fallback.
8. Links to detailed architecture, development, installation,
   troubleshooting, validation, and design specs.

## Boundaries

- Do not create a separate `CLAUDE.md` in this change.
- Do not duplicate full implementation details already maintained in `docs/`.
- Do not claim Windows support before a Windows installer is built and tested.
- Do not call the unsigned macOS build production-ready.
- Do not change application behavior as part of this documentation update.

## Acceptance Criteria

- The README remains useful to a first-time end user.
- A new agent can identify each subsystem and its ownership boundary.
- All commands and current version references are accurate.
- Known constraints and unfinished work are explicit.
- Markdown links resolve to existing repository files.
- `npm test` and `git diff --check` remain clean.
