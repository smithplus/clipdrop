"use strict";

const path = require("node:path");
const { parseTime } = require("./time");

const MODES = new Set(["full", "segment"]);
const OUTPUT_KINDS = new Set(["video_audio", "audio_only", "video_only"]);
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
  "www.youtube-nocookie.com",
]);

function isAbsolutePath(value) {
  return path.posix.isAbsolute(value) || path.win32.isAbsolute(value);
}

function validateYoutubeUrl(value) {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new TypeError("Introduce un enlace válido de YouTube.");
  }

  if (parsed.protocol !== "https:" || !YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new TypeError("La primera versión sólo admite enlaces públicos de YouTube.");
  }
}

function validateJobRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("El trabajo debe ser un objeto.");
  }

  validateYoutubeUrl(request.url);

  if (!MODES.has(request.mode)) {
    throw new TypeError("El modo debe ser full o segment.");
  }
  if (!OUTPUT_KINDS.has(request.outputKind)) {
    throw new TypeError("El tipo de salida no es válido.");
  }
  if (
    typeof request.outputDirectory !== "string" ||
    !isAbsolutePath(request.outputDirectory)
  ) {
    throw new TypeError("La carpeta de salida debe ser una ruta absoluta.");
  }

  let startSeconds = null;
  let endSeconds = null;
  if (request.mode === "segment") {
    startSeconds = parseTime(request.startTime);
    endSeconds = parseTime(request.endTime);
    if (endSeconds <= startSeconds) {
      throw new RangeError("El final debe ser posterior al inicio.");
    }
  }

  return {
    ...request,
    startSeconds,
    endSeconds,
  };
}

module.exports = { validateJobRequest, validateYoutubeUrl };
