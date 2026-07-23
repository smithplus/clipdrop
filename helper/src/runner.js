"use strict";

const fs = require("node:fs/promises");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { createDownloadPlan, createConversionPlan } = require("./planner");

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

function mapProcessError(error, command) {
  if (error.code === "ENOENT") {
    const mapped = new Error(
      `${command} was not found. Reinstall or repair ClipDrop Helper.`,
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

async function runMediaJob(job, controls) {
  await fs.mkdir(job.outputDirectory, { recursive: true });
  const workingDirectory = await fs.mkdtemp(path.join(os.tmpdir(), "clipdrop-"));
  const outputPath = path.join(
    job.outputDirectory,
    createOutputFileName(job),
  );

  try {
    controls.update({ phase: "download", progress: 1 });
    const download = createDownloadPlan(job, workingDirectory);
    const onDownloadLine = (line) => {
      const percentage = parseDownloadProgress(line);
      if (percentage !== null) {
        controls.update({
          phase: "download",
          progress: Math.min(70, Math.round(percentage * 0.7)),
        });
      }
    };
    await runProcess(download.command, download.args, {
      signal: controls.signal,
      onStdout: onDownloadLine,
      onStderr: onDownloadLine,
    });

    const sourcePath = await findDownloadedSource(workingDirectory);
    controls.update({ phase: "convert", progress: 72 });
    const conversion = createConversionPlan(job, sourcePath, outputPath);
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
  runProcess,
  runMediaJob,
};
