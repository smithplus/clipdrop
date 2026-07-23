"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  resolveUpiaPath,
  createInstallCommand,
} = require("../src/plugin-installer");

test("resolveUpiaPath finds Adobe's macOS installer", () => {
  assert.equal(
    resolveUpiaPath({ platform: "darwin" }),
    "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent",
  );
});

test("createInstallCommand uses the platform-specific install flag", () => {
  assert.deepEqual(
    createInstallCommand({
      platform: "darwin",
      installerPath: "/Adobe/UPIA",
      packagePath: "/ClipDrop.ccx",
    }),
    { command: "/Adobe/UPIA", args: ["--install", "/ClipDrop.ccx"] },
  );
  assert.deepEqual(
    createInstallCommand({
      platform: "win32",
      installerPath: "C:\\Adobe\\UPIA.exe",
      packagePath: "C:\\ClipDrop.ccx",
    }),
    {
      command: "C:\\Adobe\\UPIA.exe",
      args: ["/install", "C:\\ClipDrop.ccx"],
    },
  );
});
