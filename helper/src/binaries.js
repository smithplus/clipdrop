"use strict";

function resolveBinaryCommands(environment = process.env) {
  return {
    ytDlp: environment.CLIPDROP_YTDLP_PATH || "yt-dlp",
    ffmpeg: environment.CLIPDROP_FFMPEG_PATH || "ffmpeg",
    ffprobe: environment.CLIPDROP_FFPROBE_PATH || "ffprobe",
  };
}

module.exports = { resolveBinaryCommands };
