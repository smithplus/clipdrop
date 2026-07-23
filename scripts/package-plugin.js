#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const packageJson = require("../package.json");

function collectPluginFiles(root, directory = "") {
  const absoluteDirectory = path.join(root, directory);
  const files = [];
  for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
    if (entry.name === "test" || entry.name.startsWith(".")) {
      continue;
    }
    const relativePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPluginFiles(root, relativePath));
    } else {
      files.push(relativePath.split(path.sep).join("/"));
    }
  }
  return files.sort();
}

function packagePlugin() {
  const repositoryRoot = path.join(__dirname, "..");
  const pluginRoot = path.join(repositoryRoot, "plugin");
  const outputDirectory = path.join(repositoryRoot, "dist");
  const outputPath = path.join(
    outputDirectory,
    `ClipDrop-${packageJson.version}.ccx`,
  );
  const files = collectPluginFiles(pluginRoot);

  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.rmSync(outputPath, { force: true });
  const result = spawnSync("zip", ["-q", outputPath, ...files], {
    cwd: pluginRoot,
    stdio: "inherit",
  });
  if (result.error) {
    throw new Error(`Could not run zip: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`zip exited with code ${result.status}.`);
  }
  return outputPath;
}

if (require.main === module) {
  console.log(packagePlugin());
}

module.exports = { collectPluginFiles, packagePlugin };
