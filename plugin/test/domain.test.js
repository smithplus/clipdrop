"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildJobPayload, phaseLabel } = require("../src/domain");

const form = {
  url: "https://youtu.be/dQw4w9WgXcQ",
  mode: "full",
  startTime: "",
  endTime: "",
  outputKind: "video_audio",
  outputDirectory: "/Users/editor/Movies",
};

test("buildJobPayload creates a full clip request", () => {
  assert.deepEqual(buildJobPayload(form), {
    url: form.url,
    mode: "full",
    outputKind: "video_audio",
    outputDirectory: form.outputDirectory,
  });
});

test("buildJobPayload includes both times for a segment", () => {
  assert.deepEqual(
    buildJobPayload({
      ...form,
      mode: "segment",
      startTime: "00:10",
      endTime: "01:30.5",
    }),
    {
      url: form.url,
      mode: "segment",
      startTime: "00:10",
      endTime: "01:30.5",
      outputKind: "video_audio",
      outputDirectory: form.outputDirectory,
    },
  );
});

test("buildJobPayload rejects incomplete forms", () => {
  assert.throws(() => buildJobPayload({ ...form, url: "" }), /link/i);
  assert.throws(
    () => buildJobPayload({ ...form, outputDirectory: "" }),
    /folder/i,
  );
  assert.throws(
    () =>
      buildJobPayload({
        ...form,
        mode: "segment",
        startTime: "10",
        endTime: "",
      }),
    /start and end/i,
  );
});

test("buildJobPayload rejects a reversed segment", () => {
  assert.throws(
    () =>
      buildJobPayload({
        ...form,
        mode: "segment",
        startTime: "01:00",
        endTime: "00:30",
      }),
    /after/i,
  );
});

test("phaseLabel translates helper phases for the editor", () => {
  assert.equal(phaseLabel("download"), "Downloading");
  assert.equal(phaseLabel("convert"), "Preparing for Premiere");
  assert.equal(phaseLabel("unknown"), "Procesando");
});
