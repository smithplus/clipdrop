"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ClipDropController } = require("../src/controller");

test("ClipDropController follows a job and imports the completed file", async () => {
  const states = [];
  const imported = [];
  const jobs = [
    { id: "job-1", status: "running", phase: "download", progress: 50 },
    {
      id: "job-1",
      status: "completed",
      phase: "finalize",
      progress: 100,
      filePath: "/tmp/clip.mp4",
    },
  ];
  const controller = new ClipDropController({
    client: {
      createJob: async () => ({ id: "job-1", status: "queued" }),
      getJob: async () => jobs.shift(),
    },
    importMedia: async (filePath) => imported.push(filePath),
    onState: (state) => states.push(state),
    delay: async () => {},
  });

  const result = await controller.submit({ url: "https://youtu.be/test" });

  assert.equal(result.status, "completed");
  assert.deepEqual(imported, ["/tmp/clip.mp4"]);
  assert.equal(states.at(-1).kind, "imported");
});

test("ClipDropController exposes failed jobs without importing", async () => {
  const states = [];
  const controller = new ClipDropController({
    client: {
      createJob: async () => ({ id: "job-2", status: "queued" }),
      getJob: async () => ({
        id: "job-2",
        status: "failed",
        error: { code: "PROCESS_FAILED", message: "Download failed" },
      }),
    },
    importMedia: async () => assert.fail("must not import"),
    onState: (state) => states.push(state),
    delay: async () => {},
  });

  await assert.rejects(() => controller.submit({}), /Download failed/);
  assert.equal(states.at(-1).kind, "error");
});

test("ClipDropController cancels the active job", async () => {
  const cancelled = [];
  const controller = new ClipDropController({
    client: { cancelJob: async (id) => cancelled.push(id) },
    importMedia: async () => {},
    onState: () => {},
  });
  controller.activeJobId = "job-3";

  assert.equal(await controller.cancel(), true);
  assert.deepEqual(cancelled, ["job-3"]);
});

test("ClipDropController reports helper health", async () => {
  const states = [];
  const controller = new ClipDropController({
    client: { health: async () => ({ ready: true, version: "0.1.0" }) },
    importMedia: async () => {},
    onState: (state) => states.push(state),
  });

  const health = await controller.checkHealth();
  assert.equal(health.ready, true);
  assert.deepEqual(states[0], { kind: "health", health });
});
