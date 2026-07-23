"use strict";

const VIDEO_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
]);

function parseYouTubeVideoId(value) {
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new TypeError("Introduce un enlace válido de YouTube.");
  }

  if (url.protocol !== "https:") {
    throw new TypeError("El enlace de YouTube debe usar HTTPS.");
  }

  let videoId = "";
  const host = url.hostname.toLowerCase();
  if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  } else if (
    YOUTUBE_HOSTS.has(host) ||
    host === "www.youtube-nocookie.com"
  ) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else {
      const [kind, id] = url.pathname.split("/").filter(Boolean);
      if (kind === "shorts" || kind === "embed") {
        videoId = id || "";
      }
    }
  }

  if (!VIDEO_ID_PATTERN.test(videoId)) {
    throw new TypeError("Introduce un enlace válido de YouTube.");
  }
  return videoId;
}

module.exports = { parseYouTubeVideoId };
