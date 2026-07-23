"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { validateJobRequest } = require("../src/validation");

const validRequest = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  mode: "full",
  outputKind: "video_audio",
  outputDirectory: "/Users/editor/Movies/ClipDrop",
};

test("validateJobRequest normalizes a full clip request", () => {
  assert.deepEqual(validateJobRequest(validRequest), {
    ...validRequest,
    startSeconds: null,
    endSeconds: null,
  });
});

test("validateJobRequest normalizes segment times", () => {
  const result = validateJobRequest({
    ...validRequest,
    mode: "segment",
    startTime: "00:12.5",
    endTime: "01:02",
  });

  assert.equal(result.startSeconds, 12.5);
  assert.equal(result.endSeconds, 62);
});

test("validateJobRequest rejects an invalid segment range", () => {
  assert.throws(
    () =>
      validateJobRequest({
        ...validRequest,
        mode: "segment",
        startTime: "20",
        endTime: "10",
      }),
    /posterior/i,
  );
});

test("validateJobRequest only accepts public YouTube URLs in version one", () => {
  assert.throws(
    () => validateJobRequest({ ...validRequest, url: "https://example.com/video" }),
    /YouTube/i,
  );
});

test("validateJobRequest accepts absolute Windows output paths", () => {
  const result = validateJobRequest({
    ...validRequest,
    outputDirectory: "C:\\Users\\Editor\\Videos\\ClipDrop",
  });

  assert.equal(result.outputDirectory, "C:\\Users\\Editor\\Videos\\ClipDrop");
});
