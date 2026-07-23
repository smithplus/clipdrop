"use strict";

const COMMAND_TYPES = new Set([
  "load",
  "play",
  "pause",
  "seek",
  "playSelection",
]);
const EVENT_TYPES = new Set(["ready", "metadata", "time", "ended", "error"]);

function createPreviewCommand(type, payload = {}) {
  if (!COMMAND_TYPES.has(type)) {
    throw new TypeError("Comando de preview no válido.");
  }
  return { version: 1, type, ...payload };
}

function parsePreviewEvent(value) {
  if (
    !value ||
    typeof value !== "object" ||
    value.version !== 1 ||
    !EVENT_TYPES.has(value.type)
  ) {
    return null;
  }

  if (
    value.type === "metadata" &&
    (!Number.isFinite(value.durationSeconds) || value.durationSeconds <= 0)
  ) {
    return null;
  }
  if (
    value.type === "time" &&
    (!Number.isFinite(value.currentSeconds) ||
      !Number.isFinite(value.playerState))
  ) {
    return null;
  }

  if (value.type === "metadata") {
    return {
      version: 1,
      type: value.type,
      durationSeconds: value.durationSeconds,
    };
  }
  if (value.type === "time") {
    return {
      version: 1,
      type: value.type,
      currentSeconds: value.currentSeconds,
      playerState: value.playerState,
    };
  }
  if (value.type === "error") {
    return {
      version: 1,
      type: value.type,
      code: value.code ?? null,
      message: String(value.message || "No se pudo cargar el preview."),
    };
  }
  return { version: 1, type: value.type };
}

module.exports = { createPreviewCommand, parsePreviewEvent };
