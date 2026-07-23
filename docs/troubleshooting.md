# Troubleshooting

## ClipDrop Is Unavailable

1. Select the ClipDrop icon in the macOS menu bar.
2. Select `Restart ClipDrop`.
3. Confirm the menu reads `ClipDrop is ready`.
4. Reopen the panel in Premiere.

Use `Open Logs` from the same menu when restart does not recover the app.

## Preview Does Not Load

- Confirm the link is public and valid.
- Some videos block embedded playback.
- Videos requiring authentication or age checks, or carrying regional
  restrictions, may fail.
- Use the Start and End fields when embedded playback is unavailable.

## ClipDrop Does Not Appear in Premiere

1. Confirm Premiere is version 25.6 or later.
2. Quit and reopen ClipDrop so it can register the bundled panel.
3. Save the project and restart Premiere.
4. Open `Window > UXP Plugins > ClipDrop`.

For development builds, install `dist/ClipDrop-0.4.3.ccx` manually with UPIA as
described in [Installation](installation.md).

## Download Succeeds but Import Fails

- A Premiere project must be open.
- The selected folder must remain available.
- Check read and write permissions.
- Try importing the generated file manually to distinguish a media-format issue
  from a Premiere API issue.

## Logs

ClipDrop logs are available through `Open Logs` in the menu bar menu. Premiere
UXP logs are stored at:

```text
~/Library/Logs/Adobe/Adobe Premiere Pro 2026/UXPLogs_*.log
```
