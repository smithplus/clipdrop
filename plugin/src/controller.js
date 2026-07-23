"use strict";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

class ClipDropController {
  constructor({
    client,
    importMedia,
    onState,
    delay = (milliseconds) =>
      new Promise((resolve) => setTimeout(resolve, milliseconds)),
    pollInterval = 700,
  }) {
    this.client = client;
    this.importMedia = importMedia;
    this.onState = onState;
    this.delay = delay;
    this.pollInterval = pollInterval;
    this.activeJobId = null;
  }

  emit(state) {
    this.onState(state);
  }

  async checkHealth() {
    try {
      const health = await this.client.health();
      this.emit({ kind: "health", health });
      return health;
    } catch (error) {
      this.emit({ kind: "health-error", error });
      throw error;
    }
  }

  async submit(payload) {
    try {
      let job = await this.client.createJob(payload);
      this.activeJobId = job.id;
      this.emit({ kind: "job", job });

      while (!TERMINAL_STATUSES.has(job.status)) {
        await this.delay(this.pollInterval);
        job = await this.client.getJob(job.id);
        this.emit({ kind: "job", job });
      }

      if (job.status === "failed") {
        const error = new Error(
          job.error?.message || "The download could not be completed.",
        );
        error.code = job.error?.code || "JOB_FAILED";
        throw error;
      }
      if (job.status === "cancelled") {
        this.emit({ kind: "cancelled", job });
        return job;
      }

      await this.importMedia(job.filePath);
      this.emit({ kind: "imported", job });
      return job;
    } catch (error) {
      this.emit({ kind: "error", error });
      throw error;
    } finally {
      this.activeJobId = null;
    }
  }

  async cancel() {
    if (!this.activeJobId) {
      return false;
    }
    await this.client.cancelJob(this.activeJobId);
    return true;
  }
}

module.exports = { ClipDropController };
