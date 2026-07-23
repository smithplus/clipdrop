"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createPreviewCommand,
  parsePreviewEvent,
} = require("../src/preview-protocol");

test("createPreviewCommand creates versioned player commands", () => {
  assert.deepEqual(createPreviewCommand("load", { videoId: "YE7VzlLtp-4" }), {
    version: 1,
    type: "load",
    videoId: "YE7VzlLtp-4",
  });
  assert.deepEqual(
    createPreviewCommand("playSelection", { inSeconds: 10, outSeconds: 20 }),
    {
      version: 1,
      type: "playSelection",
      inSeconds: 10,
      outSeconds: 20,
    },
  );
});

test("createPreviewCommand rejects unsupported commands", () => {
  assert.throws(() => createPreviewCommand("download", {}), /preview/i);
});

test("parsePreviewEvent validates metadata and time events", () => {
  assert.deepEqual(
    parsePreviewEvent({ version: 1, type: "metadata", durationSeconds: 90 }),
    { version: 1, type: "metadata", durationSeconds: 90 },
  );
  assert.deepEqual(
    parsePreviewEvent({
      version: 1,
      type: "time",
      currentSeconds: 12.5,
      playerState: 1,
    }),
    {
      version: 1,
      type: "time",
      currentSeconds: 12.5,
      playerState: 1,
    },
  );
});

test("parsePreviewEvent ignores unknown or malformed events", () => {
  assert.equal(parsePreviewEvent({ version: 2, type: "ready" }), null);
  assert.equal(parsePreviewEvent({ version: 1, type: "unknown" }), null);
  assert.equal(
    parsePreviewEvent({
      version: 1,
      type: "metadata",
      durationSeconds: -1,
    }),
    null,
  );
});
