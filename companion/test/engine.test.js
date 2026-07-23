"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { startApiEngine } = require("../src/engine");

test("startApiEngine owns the local API lifecycle", async (t) => {
  const manager = {
    create() {
      throw new Error("not used");
    },
    get() {
      return null;
    },
  };
  const engine = await startApiEngine({
    host: "127.0.0.1",
    port: 0,
    manager,
    getHealth: async () => ({ ready: true, version: "test" }),
  });
  t.after(() => engine.stop());

  const response = await fetch(`http://127.0.0.1:${engine.port}/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ready: true, version: "test" });

  await engine.stop();
  assert.equal(engine.server.listening, false);
});
