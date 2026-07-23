"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const {
  APP_ORIGIN,
  createPlayerVars,
  playerErrorMessage,
} = require("../preview/player-config");

test("preview identifies the installed ClipDrop app to YouTube", () => {
  assert.equal(APP_ORIGIN, "https://com.clipdrop.premiere");
  assert.deepEqual(createPlayerVars(), {
    autoplay: 0,
    controls: 1,
    playsinline: 1,
    rel: 0,
    origin: APP_ORIGIN,
    widget_referrer: APP_ORIGIN,
  });
});

test("preview explains YouTube client identity errors", () => {
  assert.match(playerErrorMessage(153), /identify ClipDrop/i);
  assert.match(playerErrorMessage(101), /owner.*embedded/i);
  assert.match(playerErrorMessage(150), /owner.*embedded/i);
});

test("preview config loads before the YouTube player controller", () => {
  const html = fs.readFileSync(
    path.join(__dirname, "..", "preview", "player.html"),
    "utf8",
  );
  assert.ok(
    html.indexOf('src="player-config.js"') <
      html.indexOf('src="player.js"'),
  );
});
