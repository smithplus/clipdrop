"use strict";

const { randomUUID } = require("node:crypto");
const { validateJobRequest } = require("./validation");

function publicJob(job) {
  const { controller: _controller, ...result } = job;
  return { ...result };
}

function structuredError(error) {
  return {
    code: error.code || "JOB_FAILED",
    message: error.message || "The job could not be completed.",
  };
}

class JobManager {
  constructor({ runJob }) {
    if (typeof runJob !== "function") {
      throw new TypeError("JobManager requires a runJob function.");
    }
    this.runJob = runJob;
    this.jobs = new Map();
  }

  create(request) {
    const normalized = validateJobRequest(request);
    const now = new Date().toISOString();
    const job = {
      ...normalized,
      id: randomUUID(),
      status: "queued",
      phase: "queued",
      progress: 0,
      filePath: null,
      error: null,
      warnings: [],
      createdAt: now,
      updatedAt: now,
      controller: new AbortController(),
    };
    this.jobs.set(job.id, job);
    queueMicrotask(() => this.execute(job));
    return publicJob(job);
  }

  get(id) {
    const job = this.jobs.get(id);
    return job ? publicJob(job) : null;
  }

  cancel(id) {
    const job = this.jobs.get(id);
    if (!job || !["queued", "running"].includes(job.status)) {
      return false;
    }
    job.controller.abort();
    this.update(job, {
      status: "cancelled",
      phase: "cancelled",
      error: null,
    });
    return true;
  }

  update(job, patch) {
    Object.assign(job, patch, { updatedAt: new Date().toISOString() });
  }

  async execute(job) {
    if (job.controller.signal.aborted) {
      return;
    }

    this.update(job, { status: "running", phase: "metadata" });
    try {
      const filePath = await this.runJob(publicJob(job), {
        signal: job.controller.signal,
        update: (patch) => {
          if (!job.controller.signal.aborted) {
            this.update(job, patch);
          }
        },
      });
      if (!job.controller.signal.aborted) {
        this.update(job, {
          status: "completed",
          phase: "finalize",
          progress: 100,
          filePath,
          error: null,
        });
      }
    } catch (error) {
      if (job.controller.signal.aborted || error.name === "AbortError") {
        this.update(job, {
          status: "cancelled",
          phase: "cancelled",
          error: null,
        });
        return;
      }
      this.update(job, {
        status: "failed",
        phase: "failed",
        error: structuredError(error),
      });
    }
  }
}

module.exports = { JobManager };
