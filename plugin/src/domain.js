"use strict";

const PHASE_LABELS = {
  queued: "En cola",
  metadata: "Checking link",
  download: "Downloading",
  convert: "Preparing for Premiere",
  finalize: "Importing",
  cancelled: "Cancelled",
  failed: "Could not complete",
};

function timeToSeconds(value) {
  if (typeof value !== "string" || !/^\d+(?::\d+(?:\.\d+)?){0,2}$/.test(value)) {
    return null;
  }
  const parts = value.split(":").map(Number);
  if (
    (parts.length >= 2 && parts.at(-1) >= 60) ||
    (parts.length === 3 && parts[1] >= 60)
  ) {
    return null;
  }
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function buildJobPayload(form) {
  const url = form.url?.trim();
  const outputDirectory = form.outputDirectory?.trim();
  if (!url) {
    throw new TypeError("Paste a YouTube link.");
  }
  if (!outputDirectory) {
    throw new TypeError("Choose an output folder.");
  }

  const payload = {
    url,
    mode: form.mode,
    outputKind: form.outputKind,
    outputDirectory,
  };

  if (form.mode === "segment") {
    const startTime = form.startTime?.trim();
    const endTime = form.endTime?.trim();
    if (!startTime || !endTime) {
      throw new TypeError("Enter both start and end times.");
    }
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    if (startSeconds === null || endSeconds === null) {
      throw new TypeError("Use seconds, MM:SS, or HH:MM:SS.");
    }
    if (endSeconds <= startSeconds) {
      throw new RangeError("The end time must be after the start time.");
    }
    payload.startTime = startTime;
    payload.endTime = endTime;
  }

  return payload;
}

function phaseLabel(phase) {
  return PHASE_LABELS[phase] || "Procesando";
}

module.exports = { buildJobPayload, phaseLabel, timeToSeconds };
