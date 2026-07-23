"use strict";

const { entrypoints, storage } = require("uxp");
const premiere = require("premierepro");
const { buildJobPayload, phaseLabel } = require("./src/domain");
const { HelperClient } = require("./src/helper-client");
const { importIntoPremiere } = require("./src/premiere");
const { ClipDropController } = require("./src/controller");

let initialized = false;
let mode = "full";
let outputKind = "video_audio";
let controller;

function setGroupSelection(buttons, selected) {
  for (const button of buttons) {
    const isSelected = button === selected;
    button.classList.toggle("is-selected", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  }
}

function setBusy(isBusy) {
  document.getElementById("import-button").disabled = isBusy;
  document.getElementById("cancel-button").hidden = !isBusy;
}

function showMessage(text = "", type = "") {
  const message = document.getElementById("message");
  message.textContent = text;
  message.classList.toggle("is-error", type === "error");
  message.classList.toggle("is-success", type === "success");
}

function renderState(state) {
  const progress = document.getElementById("progress-bar");
  const progressLabel = document.getElementById("progress-label");
  const progressValue = document.getElementById("progress-value");
  const dot = document.getElementById("status-dot");
  const helperLabel = document.getElementById("helper-label");

  if (state.kind === "health") {
    const ready = state.health.ready;
    dot.className = `status-dot ${ready ? "is-online" : "is-offline"}`;
    helperLabel.textContent = ready ? "Helper listo" : "Faltan componentes";
    if (!ready) {
      showMessage("Repara ClipDrop Helper para instalar yt-dlp y ffmpeg.", "error");
    }
    return;
  }
  if (state.kind === "health-error") {
    dot.className = "status-dot is-offline";
    helperLabel.textContent = "Helper desconectado";
    showMessage(state.error.message, "error");
    return;
  }
  if (state.kind === "job") {
    const value = Number.isFinite(state.job.progress) ? state.job.progress : 0;
    progress.value = value;
    progressLabel.textContent = phaseLabel(state.job.phase);
    progressValue.textContent = `${Math.round(value)}%`;
    setBusy(true);
    showMessage("");
    return;
  }
  if (state.kind === "imported") {
    progress.value = 100;
    progressLabel.textContent = "Importado";
    progressValue.textContent = "100%";
    setBusy(false);
    showMessage("Archivo añadido a ClipDrop Imports.", "success");
    return;
  }
  if (state.kind === "cancelled") {
    progressLabel.textContent = "Cancelado";
    progressValue.textContent = "";
    setBusy(false);
    showMessage("Trabajo cancelado.");
    return;
  }
  if (state.kind === "error") {
    progressLabel.textContent = "No se pudo completar";
    progressValue.textContent = "";
    setBusy(false);
    showMessage(state.error.message, "error");
  }
}

async function chooseOutputFolder() {
  const folder = await storage.localFileSystem.getFolder();
  if (!folder) {
    return;
  }
  const nativePath = storage.localFileSystem.getNativePath(folder);
  document.getElementById("output-folder").value = nativePath;
  localStorage.setItem("clipdrop.outputDirectory", nativePath);
}

function initialize() {
  if (initialized) {
    return;
  }
  initialized = true;

  const client = new HelperClient();
  controller = new ClipDropController({
    client,
    importMedia: (filePath) => importIntoPremiere(premiere, filePath),
    onState: renderState,
  });

  const fullButton = document.getElementById("mode-full");
  const segmentButton = document.getElementById("mode-segment");
  const modeButtons = [fullButton, segmentButton];
  fullButton.addEventListener("click", () => {
    mode = "full";
    setGroupSelection(modeButtons, fullButton);
    document.getElementById("time-fields").hidden = true;
  });
  segmentButton.addEventListener("click", () => {
    mode = "segment";
    setGroupSelection(modeButtons, segmentButton);
    document.getElementById("time-fields").hidden = false;
  });

  const outputButtons = [
    document.getElementById("output-video-audio"),
    document.getElementById("output-audio-only"),
    document.getElementById("output-video-only"),
  ];
  const outputValues = ["video_audio", "audio_only", "video_only"];
  outputButtons.forEach((button, index) => {
    button.addEventListener("click", () => {
      outputKind = outputValues[index];
      setGroupSelection(outputButtons, button);
    });
  });

  const savedFolder = localStorage.getItem("clipdrop.outputDirectory");
  if (savedFolder) {
    document.getElementById("output-folder").value = savedFolder;
  }
  document
    .getElementById("choose-folder")
    .addEventListener("click", () => chooseOutputFolder().catch((error) => {
      showMessage(error.message, "error");
    }));

  const legalNotice = document.getElementById("legal-notice");
  legalNotice.hidden = localStorage.getItem("clipdrop.legalAccepted") === "true";
  document.getElementById("accept-notice").addEventListener("click", () => {
    localStorage.setItem("clipdrop.legalAccepted", "true");
    legalNotice.hidden = true;
  });

  document.getElementById("cancel-button").addEventListener("click", () => {
    controller.cancel().catch((error) => showMessage(error.message, "error"));
  });

  document.getElementById("clip-form").addEventListener("submit", (event) => {
    event.preventDefault();
    try {
      const payload = buildJobPayload({
        url: document.getElementById("source-url").value,
        mode,
        startTime: document.getElementById("start-time").value,
        endTime: document.getElementById("end-time").value,
        outputKind,
        outputDirectory: document.getElementById("output-folder").value,
      });
      setBusy(true);
      controller.submit(payload).catch(() => {});
    } catch (error) {
      showMessage(error.message, "error");
    }
  });

  controller.checkHealth().catch(() => {});
}

document.addEventListener("DOMContentLoaded", initialize);

entrypoints.setup({
  panels: {
    clipdropPanel: {
      create() {
        initialize();
      },
      show() {
        controller?.checkHealth().catch(() => {});
      },
    },
  },
});
