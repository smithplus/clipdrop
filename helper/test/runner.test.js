"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseDownloadProgress,
  createOutputFileName,
  mapProcessError,
  classifyYtDlpError,
  normalizeCodecInfo,
} = require("../src/runner");

test("parseDownloadProgress reads yt-dlp percentage lines", () => {
  assert.equal(parseDownloadProgress("[download]  37.4% of 8.00MiB"), 37.4);
  assert.equal(parseDownloadProgress("[download] Destination: source.mp4"), null);
});

test("createOutputFileName uses the correct Premiere-friendly extension", () => {
  assert.match(
    createOutputFileName({ id: "abc-123", outputKind: "video_audio" }),
    /^clipdrop-\d{8}-\d{6}-abc123\.mp4$/,
  );
  assert.match(
    createOutputFileName({ id: "abc-123", outputKind: "audio_only" }),
    /\.wav$/,
  );
});

test("normalizeCodecInfo reads video and audio codecs from ffprobe JSON", () => {
  const info = normalizeCodecInfo(
    JSON.stringify({
      streams: [
        { codec_type: "video", codec_name: "h264" },
        { codec_type: "audio", codec_name: "aac" },
      ],
    }),
  );

  assert.deepEqual(info, { videoCodec: "h264", audioCodec: "aac" });
});

test("normalizeCodecInfo returns null for unparseable or empty probes", () => {
  assert.equal(normalizeCodecInfo("not json"), null);
  assert.equal(normalizeCodecInfo(JSON.stringify({ streams: [] })), null);
});

test("classifyYtDlpError maps common YouTube failures to clear codes", () => {
  assert.equal(
    classifyYtDlpError("ERROR: [youtube] Requested format is not available").code,
    "FORMAT_UNAVAILABLE",
  );
  assert.equal(
    classifyYtDlpError("ERROR: Private video. Sign in if you've been granted access").code,
    "VIDEO_PRIVATE",
  );
  assert.equal(
    classifyYtDlpError("ERROR: unable to download video data: HTTP Error 429: Too Many Requests").code,
    "RATE_LIMITED",
  );
  assert.equal(
    classifyYtDlpError("ERROR: Sign in to confirm you're not a bot").code,
    "YOUTUBE_BLOCKED",
  );
  assert.equal(
    classifyYtDlpError("WARNING: nsig extraction failed: Some formats may be missing").code,
    "YTDLP_OUTDATED",
  );
  assert.equal(
    classifyYtDlpError("ERROR: Video unavailable. This video is not available").code,
    "VIDEO_UNAVAILABLE",
  );
});

test("classifyYtDlpError returns null for unrecognized output", () => {
  assert.equal(classifyYtDlpError("some unrelated failure"), null);
  assert.equal(classifyYtDlpError(""), null);
});

test("mapProcessError explains missing binaries", () => {
  const source = new Error("spawn yt-dlp ENOENT");
  source.code = "ENOENT";

  const result = mapProcessError(source, "yt-dlp");
  assert.equal(result.code, "BINARY_MISSING");
  assert.match(result.message, /yt-dlp/);
});
