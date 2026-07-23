"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");

function resolveUpiaPath({
  platform = process.platform,
  environment = process.env,
} = {}) {
  if (platform === "darwin") {
    return "/Library/Application Support/Adobe/Adobe Desktop Common/RemoteComponents/UPI/UnifiedPluginInstallerAgent/UnifiedPluginInstallerAgent.app/Contents/MacOS/UnifiedPluginInstallerAgent";
  }
  if (platform === "win32") {
    const commonFiles =
      environment.CommonProgramFiles || "C:\\Program Files\\Common Files";
    return path.win32.join(
      commonFiles,
      "Adobe",
      "Adobe Desktop Common",
      "RemoteComponents",
      "UPI",
      "UnifiedPluginInstallerAgent",
      "UnifiedPluginInstallerAgent.exe",
    );
  }
  return null;
}

function createInstallCommand({ platform, installerPath, packagePath }) {
  return {
    command: installerPath,
    args: [platform === "win32" ? "/install" : "--install", packagePath],
  };
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: "ignore" });
    child.once("error", reject);
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Adobe's plugin installer exited with code ${code}.`));
      }
    });
  });
}

async function installBundledPlugin({
  packagePath,
  platform = process.platform,
  installerPath = resolveUpiaPath({ platform }),
}) {
  if (!installerPath || !fs.existsSync(installerPath)) {
    throw new Error("Adobe's Premiere plugin installer is not available.");
  }
  if (!fs.existsSync(packagePath)) {
    throw new Error("The bundled Premiere plugin is missing.");
  }
  const install = createInstallCommand({
    platform,
    installerPath,
    packagePath,
  });
  await run(install.command, install.args);
}

module.exports = {
  resolveUpiaPath,
  createInstallCommand,
  installBundledPlugin,
};
