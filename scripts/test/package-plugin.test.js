"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const { collectPluginFiles } = require("../package-plugin");

test("collectPluginFiles includes runtime files and excludes tests", () => {
  const root = path.join(__dirname, "..", "..", "plugin");
  const files = collectPluginFiles(root);

  assert.ok(files.includes("manifest.json"));
  assert.ok(files.includes("index.html"));
  assert.ok(files.includes("src/domain.js"));
  assert.equal(files.some((file) => file.startsWith("test/")), false);
});
