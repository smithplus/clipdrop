"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createTrayMenuTemplate } = require("../src/tray-menu");

test("tray menu reports a ready engine without implementation terminology", () => {
  const actions = {
    openLogs() {},
    restart() {},
    setLaunchAtLogin() {},
    quit() {},
  };
  const template = createTrayMenuTemplate({
    status: "ready",
    launchAtLogin: true,
    actions,
  });

  assert.equal(template[0].label, "ClipDrop is ready");
  assert.equal(template[0].enabled, false);
  assert.equal(template[2].label, "Open Logs");
  assert.equal(template[3].label, "Restart ClipDrop");
  assert.equal(template[5].label, "Launch at Login");
  assert.equal(template[5].checked, true);
  assert.doesNotMatch(JSON.stringify(template), /Helper|Node|ffmpeg|yt-dlp/);
});

test("tray menu distinguishes starting and unavailable states", () => {
  const actions = {
    openLogs() {},
    restart() {},
    setLaunchAtLogin() {},
    quit() {},
  };

  assert.equal(
    createTrayMenuTemplate({
      status: "starting",
      launchAtLogin: false,
      actions,
    })[0].label,
    "ClipDrop is starting",
  );
  assert.equal(
    createTrayMenuTemplate({
      status: "unavailable",
      launchAtLogin: false,
      actions,
    })[0].label,
    "ClipDrop is unavailable",
  );
});
