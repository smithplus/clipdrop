"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { JobManager } = require("../src/job-manager");

const request = {
  url: "https://youtu.be/dQw4w9WgXcQ",
  mode: "full",
  outputKind: "video_audio",
  outputDirectory: "/tmp/clipdrop-output",
};

function nextTurn() {
  return new Promise((resolve) => setImmediate(resolve));
}

test("JobManager completes a queued job and exposes its result", async () => {
  const manager = new JobManager({
    runJob: async (_job, controls) => {
      controls.update({ phase: "download", progress: 42 });
      return "/tmp/clipdrop-output/clipdrop.mp4";
    },
  });

  const created = manager.create(request);
  assert.equal(created.status, "queued");
  await nextTurn();

  assert.deepEqual(manager.get(created.id), {
    ...manager.get(created.id),
    status: "completed",
    phase: "finalize",
    progress: 100,
    filePath: "/tmp/clipdrop-output/clipdrop.mp4",
    error: null,
  });
});

test("JobManager maps execution failures to a structured error", async () => {
  const manager = new JobManager({
    runJob: async () => {
      const error = new Error("No se encontró yt-dlp");
      error.code = "BINARY_MISSING";
      throw error;
    },
  });

  const created = manager.create(request);
  await nextTurn();

  assert.deepEqual(manager.get(created.id).error, {
    code: "BINARY_MISSING",
    message: "No se encontró yt-dlp",
  });
  assert.equal(manager.get(created.id).status, "failed");
});

test("JobManager cancels an active job", async () => {
  const manager = new JobManager({
    runJob: (_job, controls) =>
      new Promise((_resolve, reject) => {
        controls.signal.addEventListener("abort", () => {
          const error = new Error("cancelled");
          error.name = "AbortError";
          reject(error);
        });
      }),
  });

  const created = manager.create(request);
  await nextTurn();
  assert.equal(manager.cancel(created.id), true);
  await nextTurn();

  assert.equal(manager.get(created.id).status, "cancelled");
  assert.equal(manager.get(created.id).phase, "cancelled");
});

test("JobManager rejects unknown job ids", () => {
  const manager = new JobManager({ runJob: async () => "/tmp/file.mp4" });
  assert.equal(manager.get("missing"), null);
  assert.equal(manager.cancel("missing"), false);
});
