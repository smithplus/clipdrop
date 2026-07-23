"use strict";

let player = null;
let pendingLoad = null;
let timeTimer = null;
let metadataTimer = null;
let selectionOut = null;

function send(type, payload = {}) {
  window.uxpHost.postMessage({ version: 1, type, ...payload });
}

function sendTime() {
  if (!player || typeof player.getCurrentTime !== "function") {
    return;
  }
  const currentSeconds = Number(player.getCurrentTime()) || 0;
  const playerState = Number(player.getPlayerState());
  send("time", { currentSeconds, playerState });
  if (selectionOut !== null && currentSeconds >= selectionOut) {
    selectionOut = null;
    player.pauseVideo();
  }
}

function startTimeUpdates() {
  clearInterval(timeTimer);
  timeTimer = setInterval(sendTime, 150);
}

function sendMetadataWhenAvailable() {
  clearInterval(metadataTimer);
  let attempts = 0;
  metadataTimer = setInterval(() => {
    attempts += 1;
    const durationSeconds = Number(player?.getDuration()) || 0;
    if (durationSeconds > 0) {
      clearInterval(metadataTimer);
      send("metadata", { durationSeconds });
    } else if (attempts >= 40) {
      clearInterval(metadataTimer);
      send("error", {
        code: "METADATA_TIMEOUT",
        message: "YouTube no informó la duración del video.",
      });
    }
  }, 250);
}

function loadVideo(videoId) {
  selectionOut = null;
  player.cueVideoById({ videoId, startSeconds: 0 });
  sendMetadataWhenAvailable();
}

function handleCommand(command) {
  if (!command || command.version !== 1) {
    return;
  }
  if (command.type === "load") {
    if (!player) {
      pendingLoad = command.videoId;
    } else {
      loadVideo(command.videoId);
    }
    return;
  }
  if (!player) {
    return;
  }
  if (command.type === "play") {
    selectionOut = null;
    player.playVideo();
  } else if (command.type === "pause") {
    selectionOut = null;
    player.pauseVideo();
  } else if (command.type === "seek") {
    player.seekTo(Number(command.seconds) || 0, command.allowSeekAhead !== false);
    sendTime();
  } else if (command.type === "playSelection") {
    selectionOut = Number(command.outSeconds);
    player.seekTo(Number(command.inSeconds) || 0, true);
    player.playVideo();
  }
}

window.addEventListener("message", (event) => handleCommand(event.data));

window.onYouTubeIframeAPIReady = function onYouTubeIframeAPIReady() {
  player = new YT.Player("player", {
    width: "100%",
    height: "100%",
    playerVars: {
      autoplay: 0,
      controls: 1,
      playsinline: 1,
      rel: 0,
    },
    events: {
      onReady() {
        send("ready");
        startTimeUpdates();
        if (pendingLoad) {
          loadVideo(pendingLoad);
          pendingLoad = null;
        }
      },
      onStateChange() {
        sendTime();
      },
      onError(event) {
        send("error", {
          code: event.data,
          message: "YouTube no permite reproducir este video aquí.",
        });
      },
    },
  });
};

window.addEventListener("beforeunload", () => {
  clearInterval(timeTimer);
  clearInterval(metadataTimer);
});
