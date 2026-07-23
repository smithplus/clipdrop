"use strict";

const { entrypoints, storage } = require("uxp");
const premiere = require("premierepro");
const { buildJobPayload, phaseLabel, timeToSeconds } = require("./src/domain");
const { HelperClient } = require("./src/helper-client");
const { importIntoPremiere } = require("./src/premiere");
const { ClipDropController } = require("./src/controller");
const { parseYouTubeVideoId } = require("./src/youtube");
const { SelectionModel, formatTimecode } = require("./src/selection");
const {
  createPreviewCommand,
  parsePreviewEvent,
} = require("./src/preview-protocol");

let initialized = false;
let mode = "full";
let outputKind = "video_audio";
let controller;
let previewReady = false;
let previewVideoId = null;
let previewPlayerState = -1;
const selection = new SelectionModel(0);

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

function setDurationMode(nextMode) {
  mode = nextMode;
  const fullButton = document.getElementById("mode-full");
  const segmentButton = document.getElementById("mode-segment");
  setGroupSelection(
    [fullButton, segmentButton],
    nextMode === "segment" ? segmentButton : fullButton,
  );
  document.getElementById("time-fields").hidden = nextMode !== "segment";
}

function sendPreview(type, payload = {}) {
  document
    .getElementById("preview-player")
    .postMessage(createPreviewCommand(type, payload), "*");
}

function renderSelection({ syncFields = true } = {}) {
  const {
    durationSeconds,
    currentSeconds,
    inSeconds,
    outSeconds,
  } = selection.snapshot();
  const duration = durationSeconds || 1;
  const inPercent = (inSeconds / duration) * 100;
  const outPercent = (outSeconds / duration) * 100;
  const currentPercent = (currentSeconds / duration) * 100;

  const inRange = document.getElementById("selection-in-range");
  const outRange = document.getElementById("selection-out-range");
  inRange.max = String(durationSeconds);
  outRange.max = String(durationSeconds);
  inRange.value = String(inSeconds);
  outRange.value = String(outSeconds);

  const selectedRange = document.getElementById("selection-range");
  selectedRange.style.left = `${inPercent}%`;
  selectedRange.style.width = `${Math.max(0, outPercent - inPercent)}%`;
  document.getElementById("selection-playhead").style.left =
    `${currentPercent}%`;
  document.getElementById("preview-current-time").textContent =
    formatTimecode(currentSeconds);
  document.getElementById("preview-total-time").textContent =
    formatTimecode(durationSeconds);
  document.getElementById("selection-duration").textContent =
    formatTimecode(Math.max(0, outSeconds - inSeconds));

  if (syncFields && durationSeconds > 0) {
    document.getElementById("start-time").value = formatTimecode(inSeconds);
    document.getElementById("end-time").value = formatTimecode(outSeconds);
  }
}

function handlePreviewEvent(data) {
  const event = parsePreviewEvent(data);
  if (!event) {
    return;
  }
  if (event.type === "ready") {
    previewReady = true;
    if (previewVideoId) {
      sendPreview("load", { videoId: previewVideoId });
    }
    return;
  }
  if (event.type === "metadata") {
    selection.setDuration(event.durationSeconds);
    renderSelection();
    document.getElementById("load-preview").disabled = false;
    showMessage("Preview ready.", "success");
    return;
  }
  if (event.type === "time") {
    selection.setCurrent(event.currentSeconds);
    previewPlayerState = event.playerState;
    document.getElementById("preview-toggle").textContent =
      previewPlayerState === 1 ? "❚❚" : "▶";
    renderSelection({ syncFields: false });
    return;
  }
  if (event.type === "error") {
    document.getElementById("load-preview").disabled = false;
    showMessage(event.message, "error");
  }
}

function loadPreview() {
  previewVideoId = parseYouTubeVideoId(
    document.getElementById("source-url").value.trim(),
  );
  document.getElementById("preview-section").hidden = false;
  document.getElementById("load-preview").disabled = true;
  showMessage("Loading preview...");
  if (previewReady) {
    sendPreview("load", { videoId: previewVideoId });
  }
}

function updateSelectionFromField(kind) {
  const input = document.getElementById(
    kind === "in" ? "start-time" : "end-time",
  );
  const seconds = timeToSeconds(input.value.trim());
  if (seconds === null) {
    throw new TypeError("Use seconds, MM:SS, or HH:MM:SS.");
  }
  if (kind === "in") {
    selection.setIn(seconds);
  } else {
    selection.setOut(seconds);
  }
  setDurationMode("segment");
  renderSelection();
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
    helperLabel.textContent = ready ? "Helper ready" : "Components missing";
    if (!ready) {
      showMessage("Repair ClipDrop Helper to install yt-dlp and ffmpeg.", "error");
    }
    return;
  }
  if (state.kind === "health-error") {
    dot.className = "status-dot is-offline";
    helperLabel.textContent = "Helper disconnected";
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
    progressLabel.textContent = "Imported";
    progressValue.textContent = "100%";
    setBusy(false);
    showMessage("File added to ClipDrop Imports.", "success");
    return;
  }
  if (state.kind === "cancelled") {
    progressLabel.textContent = "Cancelled";
    progressValue.textContent = "";
    setBusy(false);
    showMessage("Job cancelled.");
    return;
  }
  if (state.kind === "error") {
    progressLabel.textContent = "Could not complete";
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

  document
    .getElementById("mode-full")
    .addEventListener("click", () => setDurationMode("full"));
  document
    .getElementById("mode-segment")
    .addEventListener("click", () => setDurationMode("segment"));

  document.getElementById("load-preview").addEventListener("click", () => {
    try {
      loadPreview();
    } catch (error) {
      showMessage(error.message, "error");
    }
  });
  window.addEventListener("message", (event) => {
    handlePreviewEvent(event.data);
  });

  const inRange = document.getElementById("selection-in-range");
  const outRange = document.getElementById("selection-out-range");
  inRange.addEventListener("input", () => {
    selection.setIn(inRange.value);
    selection.setCurrent(selection.inSeconds);
    setDurationMode("segment");
    renderSelection();
    sendPreview("seek", {
      seconds: selection.inSeconds,
      allowSeekAhead: false,
    });
  });
  outRange.addEventListener("input", () => {
    selection.setOut(outRange.value);
    selection.setCurrent(selection.outSeconds);
    setDurationMode("segment");
    renderSelection();
    sendPreview("seek", {
      seconds: selection.outSeconds,
      allowSeekAhead: false,
    });
  });
  inRange.addEventListener("change", () => {
    sendPreview("seek", { seconds: selection.inSeconds, allowSeekAhead: true });
  });
  outRange.addEventListener("change", () => {
    sendPreview("seek", {
      seconds: selection.outSeconds,
      allowSeekAhead: true,
    });
  });

  document.getElementById("mark-in").addEventListener("click", () => {
    selection.markIn();
    setDurationMode("segment");
    renderSelection();
  });
  document.getElementById("mark-out").addEventListener("click", () => {
    selection.markOut();
    setDurationMode("segment");
    renderSelection();
  });
  document.getElementById("play-selection").addEventListener("click", () => {
    sendPreview("playSelection", {
      inSeconds: selection.inSeconds,
      outSeconds: selection.outSeconds,
    });
  });
  document.getElementById("preview-toggle").addEventListener("click", () => {
    sendPreview(previewPlayerState === 1 ? "pause" : "play");
  });

  for (const [id, kind] of [
    ["start-time", "in"],
    ["end-time", "out"],
  ]) {
    document.getElementById(id).addEventListener("change", () => {
      try {
        updateSelectionFromField(kind);
        showMessage("");
      } catch (error) {
        showMessage(error.message, "error");
      }
    });
  }

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
  renderSelection();
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
