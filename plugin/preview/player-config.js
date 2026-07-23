"use strict";

(function exposePreviewConfig(root, factory) {
  const config = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = config;
  }
  if (root) {
    root.ClipDropPreviewConfig = config;
  }
})(typeof globalThis === "object" ? globalThis : this, () => {
  const APP_ORIGIN = "https://com.clipdrop.premiere";

  function createPlayerVars() {
    return {
      autoplay: 0,
      controls: 1,
      playsinline: 1,
      rel: 0,
      origin: APP_ORIGIN,
      widget_referrer: APP_ORIGIN,
    };
  }

  function playerErrorMessage(code) {
    if (Number(code) === 153) {
      return "YouTube could not identify ClipDrop. Restart ClipDrop and try again.";
    }
    if ([101, 150].includes(Number(code))) {
      return "The video owner does not allow embedded playback.";
    }
    return "YouTube does not allow this video to play here.";
  }

  return { APP_ORIGIN, createPlayerVars, playerErrorMessage };
});
