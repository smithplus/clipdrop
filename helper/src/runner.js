"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn, execFile } = require("node:child_process");
const { promisify } = require("node:util");
const { createDownloadPlan, createConversionPlan } = require("./planner");
const { resolveBinaryCommands } = require("./binaries");

const execFileAsync = promisify(execFile);

function parseDownloadProgress(line) {
  const match = line.match(/\[download\]\s+(\d+(?:\.\d+)?)%/);
  return match ? Number(match[1]) : null;
}

function createOutputFileName(job, now = new Date()) {
  const stamp = now
    .toISOString()
    .replace(/[-:]/g, "")
    .replace("T", "-")
    .slice(0, 15);
  const shortId = job.id.replace(/[^a-z0-9]/gi, "").slice(0, 8);
  const extension = job.outputKind === "audio_only" ? "wav" : "mp4";
  return `clipdrop-${stamp}-${shortId}.${extension}`;
}

// yt-dlp writes the real reason a download failed to stderr. These rules turn
// the raw text into a stable code and a clear, English, editor-facing message.
// Order matters: more specific rules come before broad "unavailable" ones.
const YT_DLP_ERROR_RULES = [
  {
    pattern: /confirm your age|age-restricted|inappropriate for some users/i,
    code: "AGE_RESTRICTED",
    message:
      "YouTube marked this video as age-restricted, so it cannot be downloaded here.",
  },
  {
    pattern: /private video|this video is private/i,
    code: "VIDEO_PRIVATE",
    message:
      "This is a private video. ClipDrop only works with public videos you are allowed to use.",
  },
  {
    pattern: /requested format (is )?not available|requested format could not/i,
    code: "FORMAT_UNAVAILABLE",
    message:
      "That quality is not available for this video. Choose a lower quality and try again.",
  },
  {
    pattern: /http error 429|too many requests/i,
    code: "RATE_LIMITED",
    message:
      "YouTube is rate-limiting downloads right now. Wait a few minutes and try again.",
  },
  {
    pattern: /confirm you(')?re not a bot|sign in to confirm you/i,
    code: "YOUTUBE_BLOCKED",
    message:
      "YouTube is asking ClipDrop to verify it is not a bot. Update ClipDrop, then try again.",
  },
  {
    pattern:
      /nsig extraction|unable to extract|signature extraction|player response|precondition check failed/i,
    code: "YTDLP_OUTDATED",
    message:
      "YouTube changed its player and ClipDrop's downloader needs an update. Update ClipDrop and try again.",
  },
  {
    pattern:
      /video unavailable|not available in your country|this video is not available|has been removed|content isn'?t available/i,
    code: "VIDEO_UNAVAILABLE",
    message:
      "This video is unavailable. It may be removed, region-locked, or no longer public.",
  },
];

function classifyYtDlpError(stderr) {
  const text = String(stderr || "");
  for (const rule of YT_DLP_ERROR_RULES) {
    if (rule.pattern.test(text)) {
      const error = new Error(rule.message);
      error.code = rule.code;
      return error;
    }
  }
  return null;
}

function mapProcessError(error, command) {
  if (error.code === "ENOENT") {
    const mapped = new Error(
      `${command} was not found. Reinstall ClipDrop.`,
    );
    mapped.code = "BINARY_MISSING";
    return mapped;
  }
  if (error.name === "AbortError") {
    return error;
  }
  const mapped = new Error(error.message || `${command} failed.`);
  mapped.code = error.code || "PROCESS_FAILED";
  return mapped;
}

function emitLines(stream, callback) {
  if (!stream || !callback) {
    return;
  }
  let pending = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r?\n|\r/);
    pending = lines.pop();
    for (const line of lines) {
      if (line) callback(line);
    }
  });
  stream.on("end", () => {
    if (pending) callback(pending);
  });
}

function runProcess(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stderrTail = "";

    emitLines(child.stdout, options.onStdout);
    emitLines(child.stderr, (line) => {
      stderrTail = `${stderrTail}\n${line}`.slice(-4000);
      options.onStderr?.(line);
    });

    const abort = () => {
      child.kill("SIGTERM");
      const error = new Error("Job cancelled.");
      error.name = "AbortError";
      reject(error);
    };
    if (options.signal?.aborted) {
      abort();
      return;
    }
    options.signal?.addEventListener("abort", abort, { once: true });

    child.once("error", (error) => {
      options.signal?.removeEventListener("abort", abort);
      reject(mapProcessError(error, command));
    });
    child.once("close", (code) => {
      options.signal?.removeEventListener("abort", abort);
      if (code === 0) {
        resolve();
      } else if (!options.signal?.aborted) {
        const error = new Error(
          stderrTail.trim() || `${command} exited with code ${code}.`,
        );
        error.code = "PROCESS_FAILED";
        reject(error);
      }
    });
  });
}

async function findDownloadedSource(workingDirectory) {
  const entries = await fs.readdir(workingDirectory, { withFileTypes: true });
  const source = entries.find(
    (entry) => entry.isFile() && entry.name.startsWith("source."),
  );
  if (!source) {
    const error = new Error("The download finished without producing a file.");
    error.code = "SOURCE_MISSING";
    throw error;
  }
  return path.join(workingDirectory, source.name);
}

function normalizeCodecInfo(probeJson) {
  let data;
  try {
    data = JSON.parse(probeJson);
  } catch {
    return null;
  }
  const streams = Array.isArray(data.streams) ? data.streams : [];
  const video = streams.find((stream) => stream.codec_type === "video");
  const audio = streams.find((stream) => stream.codec_type === "audio");
  if (!video && !audio) {
    return null;
  }
  return {
    videoCodec: video?.codec_name || null,
    audioCodec: audio?.codec_name || null,
  };
}

async function probeSource(sourcePath, binaries = resolveBinaryCommands()) {
  const ffprobe = binaries.ffprobe || "ffprobe";
  try {
    const { stdout } = await execFileAsync(
      ffprobe,
      [
        "-v",
        "quiet",
        "-print_format",
        "json",
        "-show_streams",
        sourcePath,
      ],
      { timeout: 10000, windowsHide: true },
    );
    return normalizeCodecInfo(stdout);
  } catch {
    // A failed probe is not fatal: the conversion falls back to a re-encode.
    return null;
  }
}

async function runMediaJob(job, controls, binaries = resolveBinaryCommands()) {
  await fs.mkdir(job.outputDirectory, { recursive: true });
  const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "clipdrop-"));
  const outputPath = path.join(
    job.outputDirectory,
    createOutputFileName(job),
  );

  try {
    controls.update({ phase: "download", progress: 1 });
    const download = createDownloadPlan(job, workingDirectory, binaries);
    const onDownloadLine = (line) => {
      const percentage = parseDownloadProgress(line);
      if (percentage !== null) {
        controls.update({
          phase: "download",
          progress: Math.min(70, Math.round(percentage * 0.7)),
        });
      }
    };
    try {
      await runProcess(download.command, download.args, {
        signal: controls.signal,
        onStdout: onDownloadLine,
        onStderr: onDownloadLine,
      });
    } catch (error) {
      if (error.name === "AbortError" || error.code === "BINARY_MISSING") {
        throw error;
      }
      throw classifyYtDlpError(error.message) || error;
    }

    const sourcePath = await findDownloadedSource(workingDirectory);
    controls.update({ phase: "convert", progress: 72 });
    const sourceInfo = await probeSource(sourcePath, binaries);
    const conversion = createConversionPlan(
      job,
      sourcePath,
      outputPath,
      binaries,
      sourceInfo,
    );
    await runProcess(conversion.command, conversion.args, {
      signal: controls.signal,
    });
    controls.update({ phase: "finalize", progress: 98 });
    return outputPath;
  } catch (error) {
    throw mapProcessError(error, error.command || "the process");
  } finally {
    await fs.rm(workingDirectory, { recursive: true, force: true });
  }
}

module.exports = {
  parseDownloadProgress,
  createOutputFileName,
  mapProcessError,
  classifyYtDlpError,
  normalizeCodecInfo,
  probeSource,
  runProcess,
  runMediaJob,
};
