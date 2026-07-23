# Troubleshooting

## Helper Disconnected

Check:

```sh
curl http://127.0.0.1:47821/health
```

A healthy response contains `"ready": true`. If it does not respond:

- macOS: open `helper/install/macos/Start ClipDrop Helper.command`.
- Windows: open `helper\install\windows\Start ClipDrop Helper.cmd`.
- Confirm port `47821` is not already in use.

If it responds with `ready: false`, yt-dlp or ffmpeg is missing from `PATH`.

## Preview Does Not Load

- Confirm the link is public and valid.
- Some videos block embedded playback.
- Videos requiring authentication or age checks, or carrying regional
  restrictions, may fail.
- Use the Start and End fields when embedded playback is unavailable.

## ClipDrop Does Not Appear in Premiere

1. Confirm Premiere is version 25.6 or later.
2. Reinstall the `.ccx`.
3. Save the project and restart Premiere.
4. Open `Window > UXP Plugins > ClipDrop`.

## Download Succeeds but Import Fails

- A Premiere project must be open.
- The selected folder must remain available.
- Check read and write permissions.
- Try importing the generated file manually to distinguish a media-format issue
  from a Premiere API issue.

## Logs

macOS:

```text
~/Library/Logs/Adobe/Adobe Premiere Pro 2026/UXPLogs_*.log
```

The Helper writes to the terminal that started it. The standalone release will
write its own logs under `~/Library/Logs/ClipDrop`.
