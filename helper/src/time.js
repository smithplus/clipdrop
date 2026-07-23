"use strict";

function timeError() {
  return new TypeError("Time must use seconds, MM:SS, or HH:MM:SS.");
}

function parseTime(value) {
  if (typeof value === "number") {
    if (Number.isFinite(value) && value >= 0) {
      return value;
    }
    throw timeError();
  }

  if (typeof value !== "string" || value.trim() === "") {
    throw timeError();
  }

  const parts = value.trim().split(":");
  if (parts.length > 3 || parts.some((part) => !/^\d+(?:\.\d+)?$/.test(part))) {
    throw timeError();
  }

  const numbers = parts.map(Number);
  if (numbers.length >= 2 && numbers.at(-1) >= 60) {
    throw timeError();
  }
  if (numbers.length === 3 && numbers[1] >= 60) {
    throw timeError();
  }

  return numbers.reduce((total, part) => total * 60 + part, 0);
}

module.exports = { parseTime };
