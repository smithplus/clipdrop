"use strict";

const MIN_SEGMENT_SECONDS = 0.05;

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(Number(value) || 0, minimum), maximum);
}

class SelectionModel {
  constructor(durationSeconds) {
    this.durationSeconds = 0;
    this.currentSeconds = 0;
    this.inSeconds = 0;
    this.outSeconds = 0;
    this.setDuration(durationSeconds);
  }

  setDuration(value) {
    const duration = Math.max(Number(value) || 0, 0);
    this.durationSeconds = duration;
    this.currentSeconds = clamp(this.currentSeconds, 0, duration);
    this.outSeconds = this.outSeconds
      ? clamp(this.outSeconds, 0, duration)
      : duration;
    this.inSeconds = clamp(this.inSeconds, 0, duration);

    if (duration >= MIN_SEGMENT_SECONDS && this.inSeconds >= this.outSeconds) {
      this.inSeconds = Math.max(0, this.outSeconds - MIN_SEGMENT_SECONDS);
    }
    return this.snapshot();
  }

  setCurrent(value) {
    this.currentSeconds = clamp(value, 0, this.durationSeconds);
    return this.currentSeconds;
  }

  setIn(value) {
    const maximum = Math.max(0, this.outSeconds - MIN_SEGMENT_SECONDS);
    this.inSeconds = clamp(value, 0, maximum);
    return this.inSeconds;
  }

  setOut(value) {
    const minimum = Math.min(
      this.durationSeconds,
      this.inSeconds + MIN_SEGMENT_SECONDS,
    );
    this.outSeconds = clamp(value, minimum, this.durationSeconds);
    return this.outSeconds;
  }

  markIn() {
    return this.setIn(this.currentSeconds);
  }

  markOut() {
    return this.setOut(this.currentSeconds);
  }

  snapshot() {
    return {
      durationSeconds: this.durationSeconds,
      currentSeconds: this.currentSeconds,
      inSeconds: this.inSeconds,
      outSeconds: this.outSeconds,
    };
  }
}

function formatTimecode(seconds) {
  const totalMilliseconds = Math.max(0, Math.round((Number(seconds) || 0) * 1000));
  const milliseconds = totalMilliseconds % 1000;
  const totalSeconds = Math.floor(totalMilliseconds / 1000);
  const secondPart = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutePart = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  const base = hours
    ? `${String(hours).padStart(2, "0")}:${String(minutePart).padStart(2, "0")}`
    : String(minutePart).padStart(2, "0");
  return `${base}:${String(secondPart).padStart(2, "0")}.${String(milliseconds).padStart(3, "0")}`;
}

function shouldStopSelection({
  isPlayingSelection,
  currentSeconds,
  outSeconds,
}) {
  return Boolean(isPlayingSelection) && currentSeconds >= outSeconds;
}

module.exports = {
  MIN_SEGMENT_SECONDS,
  SelectionModel,
  formatTimecode,
  shouldStopSelection,
};
