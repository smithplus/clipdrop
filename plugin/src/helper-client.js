"use strict";

class HelperClient {
  constructor({
    baseUrl = "http://127.0.0.1:47821",
    fetchImpl = globalThis.fetch,
  } = {}) {
    this.baseUrl = baseUrl;
    this.fetch = fetchImpl;
  }

  async request(path, options) {
    let response;
    try {
      response = await this.fetch(`${this.baseUrl}${path}`, {
        ...options,
        headers: {
          "x-clipdrop-client": "com.clipdrop.premiere",
          ...(options?.headers || {}),
        },
      });
    } catch {
      const error = new Error(
        "ClipDrop Helper is unavailable. Open or reinstall the Helper.",
      );
      error.code = "HELPER_OFFLINE";
      throw error;
    }

    const body = await response.json();
    if (!response.ok) {
      const error = new Error(
        body.error?.message || `The Helper responded with status ${response.status}.`,
      );
      error.code = body.error?.code || "HELPER_ERROR";
      throw error;
    }
    return body;
  }

  health() {
    return this.request("/health");
  }

  createJob(payload) {
    return this.request("/jobs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  getJob(id) {
    return this.request(`/jobs/${encodeURIComponent(id)}`);
  }

  cancelJob(id) {
    return this.request(`/jobs/${encodeURIComponent(id)}/cancel`, {
      method: "POST",
    });
  }
}

module.exports = { HelperClient };
