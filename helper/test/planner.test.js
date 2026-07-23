"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createDownloadPlan, createConversionPlan } = require("../src/planner");

const job = {
  id: "job-123",
  url: "https://youtu.be/dQw4w9WgXcQ",
  mode: "full",
  outputKind: "video_audio",
  outputDirectory: "/tmp/clipdrop",
  startSeconds: null,
  endSeconds: null,
};

test("createDownloadPlan downloads one source without playlists", () => {
  const plan = createDownloadPlan(job, "/tmp/clipdrop-job");

  assert.equal(plan.command, "yt-dlp");
  assert.ok(plan.args.includes("--no-playlist"));
  assert.ok(plan.args.includes("--newline"));
  assert.equal(plan.args.at(-1), job.url);
  assert.match(plan.outputTemplate, /source\.\%\(ext\)s$/);
});

test("createConversionPlan makes Premiere-friendly video with audio", () => {
  const plan = createConversionPlan(job, "/tmp/source.webm", "/tmp/final.mp4");

  assert.equal(plan.command, "ffmpeg");
  assert.ok(plan.args.includes("libx264"));
  assert.ok(plan.args.includes("aac"));
  assert.ok(plan.args.includes("yuv420p"));
  assert.equal(plan.outputPath, "/tmp/final.mp4");
});

test("createConversionPlan trims segments precisely", () => {
  const plan = createConversionPlan(
    { ...job, mode: "segment", startSeconds: 10.5, endSeconds: 20 },
    "/tmp/source.mp4",
    "/tmp/final.mp4",
  );

  assert.deepEqual(
    plan.args.slice(plan.args.indexOf("-ss"), plan.args.indexOf("-ss") + 4),
    ["-ss", "10.5", "-to", "20"],
  );
});

test("createConversionPlan emits WAV for audio-only jobs", () => {
  const plan = createConversionPlan(
    { ...job, outputKind: "audio_only" },
    "/tmp/source.webm",
    "/tmp/final.wav",
  );

  assert.ok(plan.args.includes("pcm_s24le"));
  assert.ok(plan.args.includes("-vn"));
});

test("createConversionPlan removes audio for video-only jobs", () => {
  const plan = createConversionPlan(
    { ...job, outputKind: "video_only" },
    "/tmp/source.webm",
    "/tmp/final.mp4",
  );

  assert.ok(plan.args.includes("-an"));
  assert.equal(plan.args.includes("aac"), false);
});
