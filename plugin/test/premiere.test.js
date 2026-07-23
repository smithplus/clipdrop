"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { importIntoPremiere } = require("../src/premiere");

function createPremiere(items = []) {
  let projectLocked = false;
  const root = {
    getItems: async () => items,
    createBinAction: (name) => ({
      apply() {
        items.push({ name, type: "folder" });
      },
    }),
  };
  const imports = [];
  const project = {
    getRootItem: async () => root,
    lockedAccess(callback) {
      projectLocked = true;
      try {
        return callback();
      } finally {
        projectLocked = false;
      }
    },
    executeTransaction(callback) {
      assert.equal(
        projectLocked,
        true,
        "bin creation must run inside project.lockedAccess",
      );
      callback({
        addAction(action) {
          action.apply();
          return true;
        },
      });
      return true;
    },
    importFiles: async (...args) => {
      imports.push(args);
      return true;
    },
  };
  return {
    api: {
      Project: { getActiveProject: async () => project },
      ProjectItem: { cast: (item) => item },
    },
    imports,
    items,
  };
}

test("importIntoPremiere reuses the ClipDrop bin", async () => {
  const existing = { name: "ClipDrop Imports", type: "folder" };
  const premiere = createPremiere([existing]);

  await importIntoPremiere(premiere.api, "/tmp/clip.mp4");

  assert.deepEqual(premiere.imports[0], [
    ["/tmp/clip.mp4"],
    true,
    existing,
    false,
  ]);
  assert.equal(premiere.items.length, 1);
});

test("importIntoPremiere creates the ClipDrop bin when needed", async () => {
  const premiere = createPremiere();

  await importIntoPremiere(premiere.api, "/tmp/audio.wav");

  assert.equal(premiere.items[0].name, "ClipDrop Imports");
  assert.equal(premiere.imports[0][2], premiere.items[0]);
});

test("importIntoPremiere requires an active project", async () => {
  const api = { Project: { getActiveProject: async () => null } };
  await assert.rejects(
    () => importIntoPremiere(api, "/tmp/clip.mp4"),
    /proyecto abierto/i,
  );
});
