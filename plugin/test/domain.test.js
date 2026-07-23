"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { buildJobPayload, phaseLabel, deriveDownloadsDir } = require("../src/domain");

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
    quality: "best",
    compat: false,
    outputDirectory: form.outputDirectory,
  });
});

test("buildJobPayload carries the chosen quality and compat flag", () => {
  const payload = buildJobPayload({ ...form, quality: "1080", compat: true });
  assert.equal(payload.quality, "1080");
  assert.equal(payload.compat, true);
});

test("buildJobPayload falls back to best for an unknown quality", () => {
  assert.equal(buildJobPayload({ ...form, quality: "8k" }).quality, "best");
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
      quality: "best",
      compat: false,
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

test("deriveDownloadsDir places downloads next to the project file", () => {
  assert.equal(
    deriveDownloadsDir("/Users/editor/Movies/VR Skyrim/project.prproj"),
    "/Users/editor/Movies/VR Skyrim/downloads",
  );
  assert.equal(
    deriveDownloadsDir("C:\\Users\\Editor\\Videos\\project.prproj"),
    "C:\\Users\\Editor\\Videos\\downloads",
  );
});

test("deriveDownloadsDir returns null for unsaved or pathless projects", () => {
  assert.equal(deriveDownloadsDir(""), null);
  assert.equal(deriveDownloadsDir(null), null);
  assert.equal(deriveDownloadsDir("project.prproj"), null);
});

test("phaseLabel translates helper phases for the editor", () => {
  assert.equal(phaseLabel("download"), "Downloading");
  assert.equal(phaseLabel("convert"), "Preparing for Premiere");
  assert.equal(phaseLabel("queued"), "Queued");
  assert.equal(phaseLabel("unknown"), "Working");
});
