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
  assert.deepEqual(manifest.requiredPermissions.webview, {
    allow: "yes",
    domains: [
      "https://www.youtube.com",
      "https://www.youtube-nocookie.com",
    ],
    allowLocalRendering: "yes",
    enableMessageBridge: "localOnly",
  });
});

test("panel markup contains every primary workflow control", () => {
  const html = fs.readFileSync(path.join(pluginRoot, "index.html"), "utf8");
  for (const id of [
    "source-url",
    "load-preview",
    "preview-player",
    "selection-timeline",
    "mark-in",
    "mark-out",
    "play-selection",
    "selection-duration",
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

test("panel uses English copy and exposes every output mode", () => {
  const html = fs.readFileSync(path.join(pluginRoot, "index.html"), "utf8");

  assert.match(html, /<html lang="en">/);
  assert.match(html, />Mark In</);
  assert.match(html, />Mark Out</);
  assert.match(html, />\s*Video \+ Audio\s*</);
  assert.match(html, />\s*Audio Only\s*</);
  assert.match(html, />\s*Video Only\s*</);
});

test("mark controls include local accessible icons", () => {
  const html = fs.readFileSync(path.join(pluginRoot, "index.html"), "utf8");

  assert.match(
    html,
    /id="mark-in"[\s\S]*?<svg[^>]+class="mark-icon"[^>]+aria-hidden="true"/,
  );
  assert.match(
    html,
    /id="mark-out"[\s\S]*?<svg[^>]+class="mark-icon"[^>]+aria-hidden="true"/,
  );
});

test("panel footer displays the manifest version", () => {
  const html = fs.readFileSync(path.join(pluginRoot, "index.html"), "utf8");
  const manifest = JSON.parse(
    fs.readFileSync(path.join(pluginRoot, "manifest.json"), "utf8"),
  );
  const version = html.match(/id="app-version">v([^<]+)</)?.[1];

  assert.equal(version, manifest.version);
});

test("panel stylesheet only uses layout modes supported by Premiere UXP", () => {
  const css = fs.readFileSync(path.join(pluginRoot, "style.css"), "utf8");

  assert.doesNotMatch(css, /display:\s*grid/);
  assert.match(css, /form\s*\{[\s\S]*?width:\s*100%/);
  for (const selector of [
    ".url-row",
    ".preview-controls",
    ".segmented",
    ".time-grid",
    ".folder-row",
  ]) {
    const escaped = selector.replace(".", "\\.");
    assert.match(css, new RegExp(`${escaped}\\s*\\{[\\s\\S]*?display:\\s*flex`));
  }
});

test("local preview page loads the official YouTube player API", () => {
  const html = fs.readFileSync(
    path.join(pluginRoot, "preview", "player.html"),
    "utf8",
  );
  const script = fs.readFileSync(
    path.join(pluginRoot, "preview", "player.js"),
    "utf8",
  );
  assert.match(html, /https:\/\/www\.youtube\.com\/iframe_api/);
  assert.match(html, /src="player\.js"/);
  assert.ok(
    html.indexOf('src="player.js"') <
      html.indexOf("https://www.youtube.com/iframe_api"),
    "the message bridge must register before YouTube calls its ready callback",
  );
  assert.match(script, /window\.uxpHost\.postMessage/);
});
