"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { resolveBinaryCommands } = require("../src/binaries");

test("resolveBinaryCommands prefers bundled paths from the environment", () => {
  assert.deepEqual(
    resolveBinaryCommands({
      CLIPDROP_YTDLP_PATH: "/bundle/yt-dlp",
      CLIPDROP_FFMPEG_PATH: "/bundle/ffmpeg",
      CLIPDROP_FFPROBE_PATH: "/bundle/ffprobe",
    }),
    {
      ytDlp: "/bundle/yt-dlp",
      ffmpeg: "/bundle/ffmpeg",
      ffprobe: "/bundle/ffprobe",
    },
  );
});

test("resolveBinaryCommands falls back to commands on PATH", () => {
  assert.deepEqual(resolveBinaryCommands({}), {
    ytDlp: "yt-dlp",
    ffmpeg: "ffmpeg",
    ffprobe: "ffprobe",
  });
});
