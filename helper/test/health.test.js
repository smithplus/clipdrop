"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getHealth } = require("../src/health");
const packageJson = require("../../package.json");

test("getHealth reports ready only when both media binaries exist", async () => {
  const result = await getHealth(async (command) => command === "ffmpeg");

  assert.equal(result.version, packageJson.version);
  assert.equal(result.platform, process.platform);
  assert.deepEqual(result.binaries, { ytDlp: false, ffmpeg: true });
  assert.equal(result.ready, false);
});

test("getHealth uses each binary's supported version flag", async () => {
  const calls = [];
  const result = await getHealth(async (command, args) => {
    calls.push([command, args]);
    return true;
  });

  assert.deepEqual(calls, [
    ["yt-dlp", ["--version"]],
    ["ffmpeg", ["-version"]],
  ]);
  assert.equal(result.ready, true);
});
