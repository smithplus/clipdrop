"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseTime } = require("../src/time");

test("parseTime accepts seconds and editor-style timecodes", () => {
  assert.equal(parseTime(12.5), 12.5);
  assert.equal(parseTime("90"), 90);
  assert.equal(parseTime("01:30"), 90);
  assert.equal(parseTime("01:02:03.5"), 3723.5);
});

test("parseTime rejects malformed or negative values", () => {
  for (const value of ["", "1:60", "1:2:60", "-1", "abc", null]) {
    assert.throws(() => parseTime(value), /tiempo/i);
  }
});
