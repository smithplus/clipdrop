"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const {
  assetName,
  parseVersion,
  isNewer,
  verifyChecksum,
  pickYtDlpPath,
  updateYtDlp,
} = require("../src/updater");

test("assetName maps each platform to its yt-dlp release asset", () => {
  assert.equal(assetName("darwin"), "yt-dlp_macos");
  assert.equal(assetName("win32"), "yt-dlp.exe");
  assert.equal(assetName("linux"), "yt-dlp");
});

test("parseVersion and isNewer compare yt-dlp calendar versions", () => {
  assert.deepEqual(parseVersion("2026.07.04"), [2026, 7, 4]);
  assert.equal(isNewer("2026.07.05", "2026.07.04"), true);
  assert.equal(isNewer("2026.07.04", "2026.07.04"), false);
  assert.equal(isNewer("2026.06.30", "2026.07.04"), false);
  assert.equal(isNewer("2026.07.04.123456", "2026.07.04"), true);
});

test("verifyChecksum accepts a matching signed sum and rejects a bad one", () => {
  const buffer = Buffer.from("clipdrop");
  const digest = crypto.createHash("sha256").update(buffer).digest("hex");
  const sums = `deadbeef  yt-dlp.exe\n${digest}  yt-dlp_macos\n`;

  assert.equal(verifyChecksum(buffer, sums, "yt-dlp_macos"), true);
  assert.equal(verifyChecksum(buffer, sums, "yt-dlp.exe"), false);
  assert.equal(verifyChecksum(buffer, sums, "missing"), false);
});

test("pickYtDlpPath prefers a present user-updated binary", () => {
  assert.equal(
    pickYtDlpPath({ bundled: "/app/yt-dlp", updated: "/user/yt-dlp", exists: () => true }),
    "/user/yt-dlp",
  );
  assert.equal(
    pickYtDlpPath({ bundled: "/app/yt-dlp", updated: "/user/yt-dlp", exists: () => false }),
    "/app/yt-dlp",
  );
});

test("updateYtDlp verifies the checksum before installing", async () => {
  const binary = Buffer.from("fake-yt-dlp-binary");
  const digest = crypto.createHash("sha256").update(binary).digest("hex");
  const writes = [];
  const fakeFs = {
    mkdirSync: () => {},
    writeFileSync: (path, data) => writes.push({ path, size: data.length }),
    chmodSync: () => {},
  };
  const fetchImpl = (url) =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(binary),
      text: () => Promise.resolve(`${digest}  yt-dlp_macos\n`),
    });

  const result = await updateYtDlp({
    userBinDir: "/user/bin",
    platform: "darwin",
    fetchImpl,
    fs: fakeFs,
  });

  assert.match(result.installedPath, /\/user\/bin\/yt-dlp$/);
  assert.equal(writes.length, 1);
});

test("updateYtDlp refuses a binary that fails checksum verification", async () => {
  const fetchImpl = () =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(Buffer.from("tampered")),
      text: () => Promise.resolve("0000  yt-dlp_macos\n"),
    });

  await assert.rejects(
    updateYtDlp({
      userBinDir: "/user/bin",
      platform: "darwin",
      fetchImpl,
      fs: { mkdirSync() {}, writeFileSync() {}, chmodSync() {} },
    }),
    /checksum/i,
  );
});
