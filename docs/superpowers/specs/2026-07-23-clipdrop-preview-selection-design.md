# ClipDrop Preview and In/Out Selection Design

Date: 2026-07-23
Status: Approved

## Objective

ClipDrop will let an editor preview a public YouTube video inside the Premiere
panel, mark an In and Out point with a timeline or time fields, preview the
selection, and download only the selected segment.

The preview must not download or cache the full source before the editor starts
the download job.

## Experience

1. The editor pastes a supported YouTube URL.
2. ClipDrop validates the URL and enables `Cargar preview`.
3. The official YouTube embedded player loads in a 16:9 viewport.
4. ClipDrop reads the video duration and current playback time.
5. The editor can set In and Out using:
   - Timeline handles.
   - `Marcar In` and `Marcar Out` at the current playback time.
   - Editable `HH:MM:SS` fields.
6. ClipDrop displays the selected duration.
7. `Reproducir selección` seeks to In and pauses at Out.
8. `Descargar e importar selección` sends the chosen seconds to the Helper.
9. The Helper downloads and creates the precise final segment with ffmpeg.

Full-clip, audio-only, and video-only workflows remain available.

## Layout

The panel uses a compact editing layout:

- URL field and `Cargar preview`.
- Responsive 16:9 player.
- Current-time and total-duration readout.
- Selection timeline with playhead, In handle, Out handle, and selected range.
- Transport row with play/pause, mark In, mark Out, and play-selection controls.
- In, Out, and selected-duration fields.
- Output format and destination controls.
- Primary `Descargar e importar` action.

At narrow panel widths, time fields wrap into two rows. Controls retain stable
dimensions and do not overlap or resize the timeline.

The embedded player retains YouTube's own playback controls and branding.
ClipDrop does not cover, replace, or interfere with those controls.

## Architecture

### Local WebView

The UXP panel loads `plugin:/preview/player.html` in an Adobe UXP WebView.
The local page loads the official YouTube IFrame Player API and owns the
`YT.Player` instance.

Required manifest permissions:

```json
{
  "webview": {
    "allow": "yes",
    "domains": [
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
      "https://www.google.com",
      "https://*.googlevideo.com"
    ],
    "allowLocalRendering": "yes",
    "enableMessageBridge": "localOnly"
  }
}
```

The final domain list will be reduced to the minimum confirmed by local tests.
It will not use `"all"`.

### Message Protocol

Messages from the UXP panel to the WebView:

- `load`: video ID and optional start time.
- `play`
- `pause`
- `seek`: seconds and whether seeking may fetch new buffered data.
- `playSelection`: In and Out seconds.

Messages from the WebView to the UXP panel:

- `ready`
- `metadata`: duration and basic playback availability.
- `time`: current seconds and player state.
- `ended`
- `error`: normalized YouTube player error.

Every message is an object with a version and type. Unknown message types are
ignored. Video IDs are parsed by the panel rather than interpolating arbitrary
URLs into HTML.

### Selection Model

A dedicated selection model owns:

- `durationSeconds`
- `currentSeconds`
- `inSeconds`
- `outSeconds`
- `isPlayingSelection`

It enforces:

- `0 <= In < Out <= duration`
- A small minimum segment duration.
- Clamping after duration changes.
- A single canonical seconds representation.

Timeline handles and text fields dispatch changes to this model. UI components
render from the model instead of updating one another directly.

### Playback Precision

YouTube preview seeking can land on the nearest keyframe and is not the source
of final cut precision. The selected numeric seconds are sent to the Helper,
and ffmpeg produces the exact requested segment.

During `Reproducir selección`, the WebView polls current playback time and
pauses when it reaches Out. This is a preview convenience, not a frame-accurate
edit decision system.

## Error Handling

The manual time workflow remains usable when:

- Embedding is disabled by the video owner.
- The video requires authentication or age verification.
- The video is unavailable in the user's region.
- YouTube returns a player error.
- The network is offline.
- The WebView cannot initialize.

ClipDrop shows one concise error and a `Reintentar preview` action. It does not
automatically fall back to extracting or proxying the YouTube media stream.

Invalid or reversed In/Out values disable the download action and identify the
field that needs correction.

## Privacy and Policy

- Preview uses YouTube's official embedded player.
- Autoplay remains disabled until the editor presses play.
- YouTube controls, attribution, advertisements, and playback restrictions
  remain intact.
- ClipDrop does not overlay the player.
- Download remains restricted to material the user owns or is authorized to
  use.

Because YouTube's API policies restrict downloading and storing audiovisual
content through API clients, public distribution must document that the
downloader is for authorized material and should be reviewed before presenting
ClipDrop as a YouTube API integration.

## Testing

Automated tests cover:

- YouTube video ID parsing for supported URL forms.
- Selection-model clamping and validation.
- Timeline and text field synchronization.
- In/Out marking from current time.
- Selection playback stop behavior.
- Message validation and unknown-message handling.
- Preview errors preserving manual selection.
- Job payload values matching selected In/Out seconds.
- Manifest WebView permissions remaining domain-scoped.

Local Premiere tests cover:

- WebView loading in Premiere Pro 26.3.
- Preview playback and seeking.
- Mark In and Out from the current time.
- Dragging each handle.
- Editing time fields.
- Playing only the selection.
- Narrow and wide panel layouts.
- A video with embedding disabled.
- Exact downloaded duration and import into `ClipDrop Imports`.

## Success Criteria

The feature is complete when an editor can paste an embeddable video URL,
preview it, select a segment through either interaction method, download only
that range, and receive the imported result without the selection controls
drifting or disagreeing.
