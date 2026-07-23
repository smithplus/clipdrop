"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  parseDownloadProgress,
  createOutputFileName,
  mapProcessError,
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

test("mapProcessError explains missing binaries", () => {
  const source = new Error("spawn yt-dlp ENOENT");
  source.code = "ENOENT";

  const result = mapProcessError(source, "yt-dlp");
  assert.equal(result.code, "BINARY_MISSING");
  assert.match(result.message, /yt-dlp/);
});
