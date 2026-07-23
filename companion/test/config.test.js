"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const {
  resolveRuntimePaths,
  createEngineEnvironment,
} = require("../src/config");

test("resolveRuntimePaths uses bundled resources in a packaged app", () => {
  const paths = resolveRuntimePaths({
    isPackaged: true,
    resourcesPath: "/Applications/ClipDrop.app/Contents/Resources",
    platform: "darwin",
  });

  assert.equal(
    paths.ytDlp,
    "/Applications/ClipDrop.app/Contents/Resources/bin/yt-dlp",
  );
  assert.equal(
    paths.ffmpeg,
    "/Applications/ClipDrop.app/Contents/Resources/bin/ffmpeg",
  );
  assert.equal(
    paths.ffprobe,
    "/Applications/ClipDrop.app/Contents/Resources/bin/ffprobe",
  );
  assert.equal(
    paths.helperRoot,
    "/Applications/ClipDrop.app/Contents/Resources/helper",
  );
});

test("resolveRuntimePaths uses repository resources during development", () => {
  const repositoryRoot = path.resolve(__dirname, "../..");
  const paths = resolveRuntimePaths({
    isPackaged: false,
    repositoryRoot,
    platform: "darwin",
  });

  assert.equal(paths.helperRoot, path.join(repositoryRoot, "helper"));
  assert.equal(paths.ytDlp, path.join(repositoryRoot, "companion", "vendor", "bin", "yt-dlp"));
});

test("createEngineEnvironment exposes every bundled media binary", () => {
  assert.deepEqual(
    createEngineEnvironment({
      ytDlp: "/bundle/yt-dlp",
      ffmpeg: "/bundle/ffmpeg",
      ffprobe: "/bundle/ffprobe",
    }),
    {
      CLIPDROP_YTDLP_PATH: "/bundle/yt-dlp",
      CLIPDROP_FFMPEG_PATH: "/bundle/ffmpeg",
      CLIPDROP_FFPROBE_PATH: "/bundle/ffprobe",
    },
  );
});
