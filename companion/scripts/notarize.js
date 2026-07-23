"use strict";

// electron-builder afterSign hook. It notarizes the macOS build only when the
// Apple credentials are present in the environment, so unsigned local builds
// keep working while CI (with secrets) produces a notarized, Gatekeeper-clean
// app. Provide these to enable it:
//   APPLE_ID                     Apple Developer account e-mail
//   APPLE_APP_SPECIFIC_PASSWORD  app-specific password for that account
//   APPLE_TEAM_ID                10-character Apple Developer Team ID

function notarizeCredentials(env = process.env) {
  const appleId = env.APPLE_ID;
  const appleIdPassword = env.APPLE_APP_SPECIFIC_PASSWORD;
  const teamId = env.APPLE_TEAM_ID;
  if (!appleId || !appleIdPassword || !teamId) {
    return null;
  }
  return { appleId, appleIdPassword, teamId };
}

async function notarizeMac(context, deps = {}) {
  const { electronPlatformName, appOutDir } = context;
  if (electronPlatformName !== "darwin") {
    return "skipped-not-macos";
  }

  const credentials = (deps.notarizeCredentials || notarizeCredentials)(
    deps.env || process.env,
  );
  if (!credentials) {
    // eslint-disable-next-line no-console
    console.log(
      "ClipDrop: skipping notarization (Apple credentials not set).",
    );
    return "skipped-no-credentials";
  }

  const appName = context.packager.appInfo.productFilename;
  const notarize =
    deps.notarize || require("@electron/notarize").notarize;
  await notarize({
    appBundleId: context.packager.appInfo.id,
    appPath: `${appOutDir}/${appName}.app`,
    ...credentials,
  });
  return "notarized";
}

module.exports = notarizeMac;
module.exports.notarizeMac = notarizeMac;
module.exports.notarizeCredentials = notarizeCredentials;
