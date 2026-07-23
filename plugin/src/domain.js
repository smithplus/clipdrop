"use strict";

const PHASE_LABELS = {
  queued: "En cola",
  metadata: "Comprobando enlace",
  download: "Descargando",
  convert: "Preparando para Premiere",
  finalize: "Importando",
  cancelled: "Cancelado",
  failed: "No se pudo completar",
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
    throw new TypeError("Pega un enlace de YouTube.");
  }
  if (!outputDirectory) {
    throw new TypeError("Elige una carpeta de destino.");
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
      throw new TypeError("Indica el tiempo de inicio y final.");
    }
    const startSeconds = timeToSeconds(startTime);
    const endSeconds = timeToSeconds(endTime);
    if (startSeconds === null || endSeconds === null) {
      throw new TypeError("Usa segundos, MM:SS o HH:MM:SS.");
    }
    if (endSeconds <= startSeconds) {
      throw new RangeError("El final debe ser posterior al inicio.");
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
