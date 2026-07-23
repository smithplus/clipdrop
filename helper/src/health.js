"use strict";

const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const packageJson = require("../../package.json");

const execFileAsync = promisify(execFile);

async function checkBinary(command, args) {
  try {
    await execFileAsync(command, args, {
      timeout: 5000,
      windowsHide: true,
    });
    return true;
  } catch {
    return false;
  }
}

async function getHealth(binaryCheck = checkBinary) {
  const [ytDlp, ffmpeg] = await Promise.all([
    binaryCheck("yt-dlp", ["--version"]),
    binaryCheck("ffmpeg", ["-version"]),
  ]);
  return {
    version: packageJson.version,
    platform: process.platform,
    binaries: { ytDlp, ffmpeg },
    ready: ytDlp && ffmpeg,
  };
}

module.exports = { getHealth, checkBinary };
