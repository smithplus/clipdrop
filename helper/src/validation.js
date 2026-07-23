"use strict";

const path = require("node:path");
const { parseTime } = require("./time");

const MODES = new Set(["full", "segment"]);
const OUTPUT_KINDS = new Set(["video_audio", "audio_only", "video_only"]);
const QUALITIES = new Set(["best", "2160", "1440", "1080", "720", "480"]);
const DEFAULT_QUALITY = "best";
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
    throw new TypeError("Enter a valid YouTube link.");
  }

  if (parsed.protocol !== "https:" || !YOUTUBE_HOSTS.has(parsed.hostname.toLowerCase())) {
    throw new TypeError("This version only supports public YouTube links.");
  }
}

function validateJobRequest(request) {
  if (!request || typeof request !== "object" || Array.isArray(request)) {
    throw new TypeError("The job must be an object.");
  }

  validateYoutubeUrl(request.url);

  if (!MODES.has(request.mode)) {
    throw new TypeError("Mode must be full or segment.");
  }
  if (!OUTPUT_KINDS.has(request.outputKind)) {
    throw new TypeError("The output type is invalid.");
  }
  const quality = request.quality === undefined ? DEFAULT_QUALITY : request.quality;
  if (!QUALITIES.has(quality)) {
    throw new TypeError("The quality is invalid.");
  }
  const compat = Boolean(request.compat);
  if (
    typeof request.outputDirectory !== "string" ||
    !isAbsolutePath(request.outputDirectory)
  ) {
    throw new TypeError("The output folder must be an absolute path.");
  }

  let startSeconds = null;
  let endSeconds = null;
  if (request.mode === "segment") {
    startSeconds = parseTime(request.startTime);
    endSeconds = parseTime(request.endTime);
    if (endSeconds <= startSeconds) {
      throw new RangeError("The end time must be after the start time.");
    }
  }

  return {
    ...request,
    quality,
    compat,
    startSeconds,
    endSeconds,
  };
}

module.exports = { validateJobRequest, validateYoutubeUrl };
