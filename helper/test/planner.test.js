"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  createDownloadPlan,
  createConversionPlan,
  selectFormat,
} = require("../src/planner");

const job = {
  id: "job-123",
  url: "https://youtu.be/dQw4w9WgXcQ",
  mode: "full",
  outputKind: "video_audio",
  outputDirectory: "/tmp/clipdrop",
  quality: "best",
  compat: false,
  startSeconds: null,
  endSeconds: null,
};

function argValue(args, flag) {
  const index = args.indexOf(flag);
  return index === -1 ? null : args[index + 1];
}

test("createDownloadPlan downloads one source without playlists", () => {
  const plan = createDownloadPlan(job, "/tmp/clipdrop-job");

  assert.equal(plan.command, "yt-dlp");
  assert.ok(plan.args.includes("--no-playlist"));
  assert.ok(plan.args.includes("--newline"));
  assert.equal(plan.args.at(-1), job.url);
  assert.match(plan.outputTemplate, /source\.\%\(ext\)s$/);
});

test("createDownloadPlan downloads only the selected segment window", () => {
  const plan = createDownloadPlan(
    { ...job, mode: "segment", startSeconds: 10.5, endSeconds: 20 },
    "/tmp/clipdrop-job",
  );

  assert.equal(argValue(plan.args, "--download-sections"), "*10.5-20");
  assert.ok(plan.args.includes("--force-keyframes-at-cuts"));
  assert.equal(plan.args.at(-1), job.url);
});

test("createDownloadPlan omits sections for full clips", () => {
  const plan = createDownloadPlan(job, "/tmp/clipdrop-job");
  assert.equal(plan.args.includes("--download-sections"), false);
});

test("createDownloadPlan retries transient host failures", () => {
  const plan = createDownloadPlan(job, "/tmp/clipdrop-job");
  assert.ok(plan.args.includes("--retries"));
  assert.ok(plan.args.includes("--fragment-retries"));
});

test("selectFormat caps resolution and prefers H.264 up to 1080p", () => {
  assert.match(selectFormat({ ...job, quality: "1080" }), /\[height<=1080\]/);
  assert.match(selectFormat({ ...job, quality: "1080" }), /vcodec\^=avc1/);
  assert.match(selectFormat({ ...job, quality: "720" }), /vcodec\^=avc1/);
});

test("selectFormat does not force H.264 above 1080p", () => {
  const format = selectFormat({ ...job, quality: "2160" });
  assert.match(format, /\[height<=2160\]/);
  assert.equal(/vcodec\^=avc1/.test(format), false);
});

test("selectFormat for best quality has no height cap", () => {
  assert.equal(/height<=/.test(selectFormat({ ...job, quality: "best" })), false);
});

test("selectFormat for audio only selects an audio stream", () => {
  assert.match(selectFormat({ ...job, outputKind: "audio_only" }), /bestaudio/);
});

test("createConversionPlan re-encodes when the source codec is unknown", () => {
  const plan = createConversionPlan(job, "/tmp/source.webm", "/tmp/final.mp4");

  assert.equal(plan.command, "ffmpeg");
  assert.ok(plan.args.includes("libx264"));
  assert.ok(plan.args.includes("aac"));
  assert.ok(plan.args.includes("yuv420p"));
  assert.equal(plan.outputPath, "/tmp/final.mp4");
});

test("createConversionPlan remuxes an H.264/AAC source with a stream copy", () => {
  const plan = createConversionPlan(
    job,
    "/tmp/source.mp4",
    "/tmp/final.mp4",
    {},
    { videoCodec: "h264", audioCodec: "aac" },
  );

  assert.equal(plan.args.includes("libx264"), false);
  assert.ok(plan.args.includes("copy"));
  assert.ok(plan.args.includes("+faststart"));
});

test("createConversionPlan copies H.264 video but re-encodes non-AAC audio", () => {
  const plan = createConversionPlan(
    job,
    "/tmp/source.mkv",
    "/tmp/final.mp4",
    {},
    { videoCodec: "h264", audioCodec: "opus" },
  );

  const videoIndex = plan.args.indexOf("-c:v");
  assert.equal(plan.args[videoIndex + 1], "copy");
  assert.ok(plan.args.includes("aac"));
});

test("createConversionPlan re-encodes when compat mode is forced", () => {
  const plan = createConversionPlan(
    { ...job, compat: true },
    "/tmp/source.mp4",
    "/tmp/final.mp4",
    {},
    { videoCodec: "h264", audioCodec: "aac" },
  );

  assert.ok(plan.args.includes("libx264"));
  assert.equal(plan.args.includes("copy"), false);
});

test("createConversionPlan re-encodes VP9 video into H.264", () => {
  const plan = createConversionPlan(
    job,
    "/tmp/source.webm",
    "/tmp/final.mp4",
    {},
    { videoCodec: "vp9", audioCodec: "opus" },
  );

  assert.ok(plan.args.includes("libx264"));
  assert.ok(plan.args.includes("aac"));
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

test("plans use explicitly bundled media binaries", () => {
  const download = createDownloadPlan(job, "/tmp/clipdrop-job", {
    ytDlp: "/bundle/yt-dlp",
  });
  const conversion = createConversionPlan(
    job,
    "/tmp/source.webm",
    "/tmp/final.mp4",
    { ffmpeg: "/bundle/ffmpeg" },
  );

  assert.equal(download.command, "/bundle/yt-dlp");
  assert.equal(conversion.command, "/bundle/ffmpeg");
});
