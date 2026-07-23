"use strict";

const path = require("node:path");

const QUALITY_HEIGHTS = {
  "2160": 2160,
  "1440": 1440,
  "1080": 1080,
  "720": 720,
  "480": 480,
};

// YouTube still offers progressive H.264 (avc1) and AAC (mp4a) up to 1080p.
// Preferring them at those heights lets the conversion step remux with a
// stream copy instead of a second, slower re-encode.
const AVC_FRIENDLY_MAX_HEIGHT = 1080;

function heightFilter(job) {
  const height = QUALITY_HEIGHTS[job.quality] || null;
  return { height, filter: height ? `[height<=${height}]` : "" };
}

function selectFormat(job) {
  const { height, filter } = heightFilter(job);
  const preferAvc = height !== null && height <= AVC_FRIENDLY_MAX_HEIGHT;

  if (job.outputKind === "audio_only") {
    return "bestaudio[acodec^=mp4a]/bestaudio/best";
  }

  if (job.outputKind === "video_only") {
    return preferAvc
      ? `bestvideo${filter}[vcodec^=avc1]/bestvideo${filter}/best${filter}`
      : `bestvideo${filter}/best${filter}/best`;
  }

  return preferAvc
    ? `bestvideo${filter}[vcodec^=avc1]+bestaudio[acodec^=mp4a]/` +
        `bestvideo${filter}+bestaudio/best${filter}/best`
    : `bestvideo${filter}+bestaudio/best${filter}/best`;
}

function createDownloadPlan(job, workingDirectory, binaries = {}) {
  const outputTemplate = path.join(workingDirectory, "source.%(ext)s");
  const args = [
    "--no-playlist",
    "--newline",
    "--no-part",
    "--restrict-filenames",
    // YouTube's media hosts intermittently answer with HTTP 403; a retry
    // usually lands on a host that serves the file, so never fail on the
    // first transient error.
    "--retries",
    "10",
    "--fragment-retries",
    "10",
    "--file-access-retries",
    "3",
    "-f",
    selectFormat(job),
    "--output",
    outputTemplate,
  ];

  // A segment only downloads the requested window instead of the whole video.
  // `--force-keyframes-at-cuts` makes the extracted file frame-accurate to the
  // In/Out points, so the conversion step no longer needs to trim.
  if (job.mode === "segment") {
    args.push(
      "--download-sections",
      `*${job.startSeconds}-${job.endSeconds}`,
      "--force-keyframes-at-cuts",
    );
  }

  args.push(job.url);

  return {
    command: binaries.ytDlp || "yt-dlp",
    outputTemplate,
    args,
  };
}

function isH264(codec) {
  return codec === "h264" || codec === "avc1";
}

function isAac(codec) {
  return codec === "aac";
}

const VIDEO_ENCODE = [
  "-c:v",
  "libx264",
  "-preset",
  "medium",
  "-crf",
  "18",
  "-pix_fmt",
  "yuv420p",
];
const VIDEO_COPY = ["-c:v", "copy"];
const AUDIO_ENCODE = ["-c:a", "aac", "-b:a", "320k", "-ar", "48000"];
const AUDIO_COPY = ["-c:a", "copy"];
const FASTSTART = ["-movflags", "+faststart"];

// `sourceInfo` (from ffprobe) lets a clip that YouTube already served as
// H.264/AAC skip a second re-encode and remux with a stream copy. When it is
// null (probe unavailable) or the user forces `compat`, ClipDrop re-encodes,
// preserving the previous, always-safe behavior.
function createConversionPlan(
  job,
  sourcePath,
  outputPath,
  binaries = {},
  sourceInfo = null,
) {
  const base = ["-y", "-hide_banner", "-i", sourcePath];
  const command = binaries.ffmpeg || "ffmpeg";

  if (job.outputKind === "audio_only") {
    return {
      command,
      args: [
        ...base,
        "-map",
        "0:a:0",
        "-vn",
        "-c:a",
        "pcm_s24le",
        "-ar",
        "48000",
        outputPath,
      ],
      outputPath,
    };
  }

  const forceEncode = Boolean(job.compat);
  const canCopyVideo =
    !forceEncode && Boolean(sourceInfo) && isH264(sourceInfo.videoCodec);
  const videoArgs = canCopyVideo ? VIDEO_COPY : VIDEO_ENCODE;

  if (job.outputKind === "video_only") {
    return {
      command,
      args: [
        ...base,
        "-map",
        "0:v:0",
        "-an",
        ...videoArgs,
        ...FASTSTART,
        outputPath,
      ],
      outputPath,
    };
  }

  const canCopyAudio =
    !forceEncode && Boolean(sourceInfo) && isAac(sourceInfo.audioCodec);
  const audioArgs = canCopyAudio ? AUDIO_COPY : AUDIO_ENCODE;

  return {
    command,
    args: [
      ...base,
      "-map",
      "0:v:0",
      "-map",
      "0:a:0?",
      ...videoArgs,
      ...audioArgs,
      ...FASTSTART,
      outputPath,
    ],
    outputPath,
  };
}

module.exports = { createDownloadPlan, createConversionPlan, selectFormat };
