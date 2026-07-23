"use strict";

const path = require("node:path");

function executableName(name, platform) {
  return platform === "win32" ? `${name}.exe` : name;
}

function resolveRuntimePaths({
  isPackaged,
  resourcesPath,
  repositoryRoot,
  platform = process.platform,
}) {
  const resourceRoot = isPackaged
    ? resourcesPath
    : path.join(repositoryRoot, "companion", "vendor");
  const binaryRoot = path.join(resourceRoot, "bin");

  return {
    helperRoot: isPackaged
      ? path.join(resourcesPath, "helper")
      : path.join(repositoryRoot, "helper"),
    pluginRoot: isPackaged
      ? path.join(resourcesPath, "plugin")
      : path.join(repositoryRoot, "plugin"),
    ytDlp: path.join(binaryRoot, executableName("yt-dlp", platform)),
    ffmpeg: path.join(binaryRoot, executableName("ffmpeg", platform)),
    ffprobe: path.join(binaryRoot, executableName("ffprobe", platform)),
  };
}

function createEngineEnvironment(paths) {
  return {
    CLIPDROP_YTDLP_PATH: paths.ytDlp,
    CLIPDROP_FFMPEG_PATH: paths.ffmpeg,
    CLIPDROP_FFPROBE_PATH: paths.ffprobe,
  };
}

module.exports = { resolveRuntimePaths, createEngineEnvironment };
