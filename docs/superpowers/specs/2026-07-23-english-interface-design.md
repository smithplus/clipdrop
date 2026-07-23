# English Interface and Output Controls Design

## Goal

Make English the single language used by the ClipDrop plugin and repository
documentation while keeping the compact Premiere-style panel.

## Interface

- Translate all visible panel copy, labels, status messages, tooltips, and
  accessibility labels to English.
- Add locally bundled icons to the Mark In and Mark Out controls without adding
  a network or runtime dependency.
- Keep the existing three-option output selector visible:
  Video + Audio, Audio Only, and Video Only.
- Show the package version as muted text in the panel footer. The displayed
  value must match the plugin manifest version.

## Documentation

- Keep `README.md` as the only root README.
- Translate the project-maintained Markdown documentation to English.
- Update internal links and remove references to the former
  `README-CLIPDROP.md` filename.

## Verification

- Automated tests verify the English UI labels, output options, icons, and
  displayed version.
- The complete test suite and package integrity checks must pass.
- Install the resulting package locally and verify that Premiere loads the new
  version after restarting the application.

