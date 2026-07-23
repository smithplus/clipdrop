"use strict";

const nodeCrypto = require("node:crypto");
const nodeFs = require("node:fs");
const nodePath = require("node:path");

const RELEASE_LATEST =
  "https://github.com/yt-dlp/yt-dlp/releases/latest/download";

function assetName(platform = process.platform) {
  if (platform === "darwin") return "yt-dlp_macos";
  if (platform === "win32") return "yt-dlp.exe";
  return "yt-dlp";
}

function targetName(platform = process.platform) {
  return platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
}

// yt-dlp versions look like "2026.07.04" or nightly "2026.07.04.123456".
// Compare them component by component as integers.
function parseVersion(value) {
  return String(value || "")
    .trim()
    .split(/[.\-]/)
    .map((part) => Number.parseInt(part, 10))
    .filter((part) => Number.isFinite(part));
}

function isNewer(candidate, current) {
  const a = parseVersion(candidate);
  const b = parseVersion(current);
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    const left = a[index] || 0;
    const right = b[index] || 0;
    if (left !== right) {
      return left > right;
    }
  }
  return false;
}

function checksumOf(buffer, crypto = nodeCrypto) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function verifyChecksum(buffer, sumsText, asset, crypto = nodeCrypto) {
  const line = String(sumsText)
    .split(/\r?\n/)
    .find((entry) => entry.trim().endsWith(asset));
  if (!line) {
    return false;
  }
  return line.trim().split(/\s+/)[0] === checksumOf(buffer, crypto);
}

// ClipDrop prefers a verified, user-updated yt-dlp in userData over the copy
// bundled at build time, so YouTube changes can be fixed without a full
// reinstall. The bundled binary is always the safe fallback.
function pickYtDlpPath({ bundled, updated, exists = nodeFs.existsSync }) {
  if (updated && exists(updated)) {
    return updated;
  }
  return bundled;
}

async function updateYtDlp({
  userBinDir,
  platform = process.platform,
  fetchImpl = globalThis.fetch,
  fs = nodeFs,
  crypto = nodeCrypto,
} = {}) {
  const asset = assetName(platform);
  const releaseRoot = RELEASE_LATEST;

  const [binaryResponse, sumsResponse] = await Promise.all([
    fetchImpl(`${releaseRoot}/${asset}`),
    fetchImpl(`${releaseRoot}/SHA2-256SUMS`),
  ]);
  if (!binaryResponse.ok || !sumsResponse.ok) {
    throw new Error("Could not reach the yt-dlp release server.");
  }

  const binary = Buffer.from(await binaryResponse.arrayBuffer());
  const sums = await sumsResponse.text();
  if (!verifyChecksum(binary, sums, asset, crypto)) {
    throw new Error("The downloaded yt-dlp did not match its signed checksum.");
  }

  fs.mkdirSync(userBinDir, { recursive: true });
  const installedPath = nodePath.join(userBinDir, targetName(platform));
  fs.writeFileSync(installedPath, binary, { mode: 0o755 });
  fs.chmodSync(installedPath, 0o755);
  return { installedPath, asset };
}

module.exports = {
  assetName,
  targetName,
  parseVersion,
  isNewer,
  checksumOf,
  verifyChecksum,
  pickYtDlpPath,
  updateYtDlp,
};
