"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const pluginRoot = path.join(__dirname, "..");

test("UXP manifest targets Premiere 25.6 with narrow permissions", () => {
  const manifest = JSON.parse(
    fs.readFileSync(path.join(pluginRoot, "manifest.json"), "utf8"),
  );

  assert.equal(manifest.manifestVersion, 5);
  assert.deepEqual(manifest.host, {
    app: "premierepro",
    minVersion: "25.6.0",
  });
  assert.equal(manifest.requiredPermissions.localFileSystem, "request");
  assert.deepEqual(manifest.requiredPermissions.network.domains, [
    "http://127.0.0.1:47821",
  ]);
});

test("panel markup contains every primary workflow control", () => {
  const html = fs.readFileSync(path.join(pluginRoot, "index.html"), "utf8");
  for (const id of [
    "source-url",
    "mode-full",
    "mode-segment",
    "start-time",
    "end-time",
    "output-video-audio",
    "output-audio-only",
    "output-video-only",
    "choose-folder",
    "import-button",
    "cancel-button",
    "progress-bar",
  ]) {
    assert.match(html, new RegExp(`id="${id}"`));
  }
});
