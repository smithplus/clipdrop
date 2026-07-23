"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { parseYouTubeVideoId } = require("../src/youtube");

test("parseYouTubeVideoId accepts supported YouTube URL forms", () => {
  const id = "YE7VzlLtp-4";
  for (const url of [
    `https://www.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?t=12`,
    `https://www.youtube.com/shorts/${id}`,
    `https://www.youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`,
  ]) {
    assert.equal(parseYouTubeVideoId(url), id);
  }
});

test("parseYouTubeVideoId rejects unsupported or malformed URLs", () => {
  for (const url of [
    "https://example.com/watch?v=YE7VzlLtp-4",
    "http://www.youtube.com/watch?v=YE7VzlLtp-4",
    "https://www.youtube.com/watch?v=short",
    "not a url",
  ]) {
    assert.throws(() => parseYouTubeVideoId(url), /YouTube/i);
  }
});
