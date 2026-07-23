#!/usr/bin/env node
"use strict";

const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const YT_DLP_VERSION = "2026.07.04";
const companionRoot = path.join(__dirname, "..");
const binaryRoot = path.join(companionRoot, "vendor", "bin");

async function download(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not download ${url}: ${response.status}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

function checksum(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function prepareYtDlp() {
  const assets = {
    darwin: "yt-dlp_macos",
    win32: "yt-dlp.exe",
    linux: "yt-dlp",
  };
  const asset = assets[process.platform];
  if (!asset) {
    throw new Error(`Unsupported platform: ${process.platform}`);
  }
  const releaseRoot =
    `https://github.com/yt-dlp/yt-dlp/releases/download/${YT_DLP_VERSION}`;
  const [binary, sums] = await Promise.all([
    download(`${releaseRoot}/${asset}`),
    download(`${releaseRoot}/SHA2-256SUMS`),
  ]);
  const sumLine = sums
    .toString("utf8")
    .split(/\r?\n/)
    .find((line) => line.trim().endsWith(asset));
  if (!sumLine || sumLine.trim().split(/\s+/)[0] !== checksum(binary)) {
    throw new Error("The yt-dlp checksum does not match its signed release.");
  }
  const target = path.join(
    binaryRoot,
    process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp",
  );
  fs.writeFileSync(target, binary, { mode: 0o755 });
}

function copyBinary(source, name) {
  const target = path.join(
    binaryRoot,
    process.platform === "win32" ? `${name}.exe` : name,
  );
  fs.copyFileSync(source, target);
  fs.chmodSync(target, 0o755);
}

function assertArchIsBuildable() {
  const targetArch = process.env.CLIPDROP_TARGET_ARCH || process.arch;
  // yt-dlp_macos is a universal binary, but ffmpeg-static and
  // @ffprobe-installer only provide the host architecture. Cross-bundling
  // (for example an x64 app from an Apple Silicon mac) would ship the wrong
  // ffmpeg, so fail loudly instead of producing a broken build.
  if (
    process.platform === "darwin" &&
    targetArch !== process.arch
  ) {
    throw new Error(
      `Cannot bundle ffmpeg for ${targetArch} on a ${process.arch} host. ` +
        `Build the ${targetArch} app on a matching mac, or provide ${targetArch} ` +
        `ffmpeg and ffprobe binaries in ${binaryRoot}.`,
    );
  }
  return targetArch;
}

async function main() {
  const targetArch = assertArchIsBuildable();
  fs.mkdirSync(binaryRoot, { recursive: true });
  copyBinary(require("ffmpeg-static"), "ffmpeg");
  copyBinary(require("@ffprobe-installer/ffprobe").path, "ffprobe");
  await prepareYtDlp();
  console.log(
    `Prepared ClipDrop media tools for ${process.platform}/${targetArch} in ${binaryRoot}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
