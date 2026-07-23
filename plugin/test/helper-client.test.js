"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { HelperClient } = require("../src/helper-client");

function response(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  };
}

test("HelperClient sends jobs to the local helper", async () => {
  const calls = [];
  const client = new HelperClient({
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return response(202, { id: "job-1", status: "queued" });
    },
  });

  const result = await client.createJob({ url: "https://youtu.be/test" });
  assert.equal(result.id, "job-1");
  assert.equal(calls[0].url, "http://127.0.0.1:47821/jobs");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(
    calls[0].options.headers["x-clipdrop-client"],
    "com.clipdrop.premiere",
  );
});

test("HelperClient surfaces structured helper errors", async () => {
  const client = new HelperClient({
    fetchImpl: async () =>
      response(400, {
        error: { code: "INVALID_REQUEST", message: "Invalid link" },
      }),
  });

  await assert.rejects(
    () => client.createJob({}),
    (error) =>
      error.code === "INVALID_REQUEST" && error.message === "Invalid link",
  );
});

test("HelperClient explains connection failures", async () => {
  const client = new HelperClient({
    fetchImpl: async () => {
      throw new TypeError("Failed to fetch");
    },
  });

  await assert.rejects(
    () => client.health(),
    (error) => error.code === "HELPER_OFFLINE" && /Helper/i.test(error.message),
  );
});
