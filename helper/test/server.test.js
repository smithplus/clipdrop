"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { createApiServer } = require("../src/server");
const { JobManager } = require("../src/job-manager");

const validRequest = {
  url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
  mode: "full",
  outputKind: "audio_only",
  outputDirectory: "/tmp/clipdrop",
};

async function startTestServer() {
  const manager = new JobManager({
    runJob: async () => "/tmp/clipdrop/result.wav",
  });
  const server = createApiServer({
    manager,
    getHealth: async () => ({
      version: "0.1.0",
      platform: "test",
      binaries: { ytDlp: true, ffmpeg: true },
      ready: true,
    }),
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    server,
    baseUrl: `http://127.0.0.1:${address.port}`,
  };
}

test("GET /health reports helper readiness", async (t) => {
  const context = await startTestServer();
  t.after(() => context.server.close());

  const response = await fetch(`${context.baseUrl}/health`);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("access-control-allow-origin"), null);
  assert.equal((await response.json()).ready, true);
});

test("POST /jobs creates a job that can be read", async (t) => {
  const context = await startTestServer();
  t.after(() => context.server.close());

  const createdResponse = await fetch(`${context.baseUrl}/jobs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-clipdrop-client": "com.clipdrop.premiere",
    },
    body: JSON.stringify(validRequest),
  });
  const created = await createdResponse.json();

  assert.equal(createdResponse.status, 202);
  assert.match(created.id, /^[a-f0-9-]+$/);

  const response = await fetch(`${context.baseUrl}/jobs/${created.id}`, {
    headers: { "x-clipdrop-client": "com.clipdrop.premiere" },
  });
  assert.equal(response.status, 200);
  assert.equal((await response.json()).id, created.id);
});

test("POST /jobs returns a useful validation error", async (t) => {
  const context = await startTestServer();
  t.after(() => context.server.close());

  const response = await fetch(`${context.baseUrl}/jobs`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-clipdrop-client": "com.clipdrop.premiere",
    },
    body: JSON.stringify({ ...validRequest, url: "https://example.com" }),
  });
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.error.code, "INVALID_REQUEST");
  assert.match(body.error.message, /YouTube/i);
});

test("job routes reject requests without the ClipDrop client header", async (t) => {
  const context = await startTestServer();
  t.after(() => context.server.close());

  const response = await fetch(`${context.baseUrl}/jobs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(validRequest),
  });

  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "CLIENT_FORBIDDEN");
});

test("unknown routes return JSON 404 responses", async (t) => {
  const context = await startTestServer();
  t.after(() => context.server.close());

  const response = await fetch(`${context.baseUrl}/missing`);
  assert.equal(response.status, 404);
  assert.equal((await response.json()).error.code, "NOT_FOUND");
});
