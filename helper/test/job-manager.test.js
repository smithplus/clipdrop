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
      const error = new Error("yt-dlp was not found");
      error.code = "BINARY_MISSING";
      throw error;
    },
  });

  const created = manager.create(request);
  await nextTurn();

  assert.deepEqual(manager.get(created.id).error, {
    code: "BINARY_MISSING",
    message: "yt-dlp was not found",
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

test("JobManager runs one job at a time and queues the rest", async () => {
  const started = [];
  let releaseFirst;
  const manager = new JobManager({
    runJob: (job) =>
      new Promise((resolve) => {
        started.push(job.id);
        if (started.length === 1) {
          releaseFirst = () => resolve("/tmp/first.mp4");
        } else {
          resolve("/tmp/other.mp4");
        }
      }),
  });

  const first = manager.create(request);
  const second = manager.create(request);
  await nextTurn();

  assert.equal(started.length, 1);
  assert.equal(manager.get(first.id).status, "running");
  assert.equal(manager.get(second.id).status, "queued");

  releaseFirst();
  for (let i = 0; i < 20 && manager.get(second.id).status !== "completed"; i++) {
    await nextTurn();
  }

  assert.equal(manager.get(first.id).status, "completed");
  assert.equal(manager.get(second.id).status, "completed");
  assert.deepEqual(started, [first.id, second.id]);
});

test("JobManager skips a job that was cancelled while queued", async () => {
  let releaseFirst;
  const started = [];
  const manager = new JobManager({
    runJob: (job) =>
      new Promise((resolve) => {
        started.push(job.id);
        releaseFirst = () => resolve("/tmp/first.mp4");
      }),
  });

  const first = manager.create(request);
  const second = manager.create(request);
  await nextTurn();

  assert.equal(manager.cancel(second.id), true);
  assert.equal(manager.get(second.id).status, "cancelled");

  releaseFirst();
  for (let i = 0; i < 20 && manager.get(first.id).status !== "completed"; i++) {
    await nextTurn();
  }

  assert.equal(manager.get(first.id).status, "completed");
  // The cancelled job never reached runJob.
  assert.deepEqual(started, [first.id]);
});

test("JobManager rejects unknown job ids", () => {
  const manager = new JobManager({ runJob: async () => "/tmp/file.mp4" });
  assert.equal(manager.get("missing"), null);
  assert.equal(manager.cancel("missing"), false);
});
