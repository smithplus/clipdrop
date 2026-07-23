"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SelectionModel,
  formatTimecode,
  shouldStopSelection,
} = require("../src/selection");

test("SelectionModel initializes to the full video duration", () => {
  const model = new SelectionModel(130.5);

  assert.deepEqual(model.snapshot(), {
    durationSeconds: 130.5,
    currentSeconds: 0,
    inSeconds: 0,
    outSeconds: 130.5,
  });
});

test("SelectionModel marks In and Out from the current playback time", () => {
  const model = new SelectionModel(180);

  model.setCurrent(12.25);
  model.markIn();
  model.setCurrent(48.75);
  model.markOut();

  assert.equal(model.inSeconds, 12.25);
  assert.equal(model.outSeconds, 48.75);
});

test("SelectionModel clamps handles to a valid range", () => {
  const model = new SelectionModel(60);

  model.setIn(20);
  model.setOut(40);
  model.setIn(50);
  model.setOut(10);

  assert.ok(model.inSeconds < model.outSeconds);
  assert.ok(model.inSeconds >= 0);
  assert.ok(model.outSeconds <= 60);
});

test("SelectionModel clamps all values when duration changes", () => {
  const model = new SelectionModel(120);
  model.setIn(80);
  model.setOut(110);
  model.setCurrent(100);

  model.setDuration(90);

  assert.equal(model.durationSeconds, 90);
  assert.equal(model.currentSeconds, 90);
  assert.equal(model.outSeconds, 90);
  assert.ok(model.inSeconds < model.outSeconds);
});

test("formatTimecode emits editor-friendly values", () => {
  assert.equal(formatTimecode(0), "00:00.000");
  assert.equal(formatTimecode(62.345), "01:02.345");
  assert.equal(formatTimecode(3661.2), "01:01:01.200");
});

test("shouldStopSelection stops only after the Out point", () => {
  assert.equal(
    shouldStopSelection({ isPlayingSelection: true, currentSeconds: 10, outSeconds: 10 }),
    true,
  );
  assert.equal(
    shouldStopSelection({ isPlayingSelection: true, currentSeconds: 9.9, outSeconds: 10 }),
    false,
  );
  assert.equal(
    shouldStopSelection({ isPlayingSelection: false, currentSeconds: 12, outSeconds: 10 }),
    false,
  );
});
