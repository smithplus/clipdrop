"use strict";

const path = require("node:path");

function createDownloadPlan(job, workingDirectory, binaries = {}) {
  const outputTemplate = path.join(workingDirectory, "source.%(ext)s");
  return {
    command: binaries.ytDlp || "yt-dlp",
    outputTemplate,
    args: [
      "--no-playlist",
      "--newline",
      "--no-part",
      "--restrict-filenames",
      "--output",
      outputTemplate,
      job.url,
    ],
  };
}

function segmentArgs(job) {
  if (job.mode !== "segment") {
    return [];
  }
  return ["-ss", String(job.startSeconds), "-to", String(job.endSeconds)];
}

function createConversionPlan(job, sourcePath, outputPath, binaries = {}) {
  const common = [
    "-y",
    "-hide_banner",
    "-i",
    sourcePath,
    ...segmentArgs(job),
  ];

  let mediaArgs;
  if (job.outputKind === "audio_only") {
    mediaArgs = ["-map", "0:a:0", "-vn", "-c:a", "pcm_s24le", "-ar", "48000"];
  } else if (job.outputKind === "video_only") {
    mediaArgs = [
      "-map",
      "0:v:0",
      "-an",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
    ];
  } else {
    mediaArgs = [
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      "-c:v",
      "libx264",
      "-preset",
      "medium",
      "-crf",
      "18",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "320k",
      "-ar",
      "48000",
      "-movflags",
      "+faststart",
    ];
  }

  return {
    command: binaries.ffmpeg || "ffmpeg",
    args: [...common, ...mediaArgs, outputPath],
    outputPath,
  };
}

module.exports = { createDownloadPlan, createConversionPlan };
