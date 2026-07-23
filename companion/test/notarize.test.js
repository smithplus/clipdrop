"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { notarizeMac, notarizeCredentials } = require("../scripts/notarize");

test("notarizeCredentials returns null unless all Apple secrets are set", () => {
  assert.equal(notarizeCredentials({}), null);
  assert.equal(
    notarizeCredentials({ APPLE_ID: "a@b.com", APPLE_TEAM_ID: "TEAM123456" }),
    null,
  );
  assert.deepEqual(
    notarizeCredentials({
      APPLE_ID: "a@b.com",
      APPLE_APP_SPECIFIC_PASSWORD: "secret",
      APPLE_TEAM_ID: "TEAM123456",
    }),
    { appleId: "a@b.com", appleIdPassword: "secret", teamId: "TEAM123456" },
  );
});

test("notarizeMac skips non-macOS platforms", async () => {
  const result = await notarizeMac({ electronPlatformName: "win32" });
  assert.equal(result, "skipped-not-macos");
});

test("notarizeMac skips when credentials are absent", async () => {
  const result = await notarizeMac(
    { electronPlatformName: "darwin", appOutDir: "/out" },
    { env: {} },
  );
  assert.equal(result, "skipped-no-credentials");
});

test("notarizeMac notarizes when credentials are present", async () => {
  const calls = [];
  const context = {
    electronPlatformName: "darwin",
    appOutDir: "/out",
    packager: {
      appInfo: { productFilename: "ClipDrop", id: "com.clipdrop.companion" },
    },
  };
  const result = await notarizeMac(context, {
    env: {
      APPLE_ID: "a@b.com",
      APPLE_APP_SPECIFIC_PASSWORD: "secret",
      APPLE_TEAM_ID: "TEAM123456",
    },
    notarize: (options) => {
      calls.push(options);
      return Promise.resolve();
    },
  });

  assert.equal(result, "notarized");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].appPath, "/out/ClipDrop.app");
  assert.equal(calls[0].teamId, "TEAM123456");
});
