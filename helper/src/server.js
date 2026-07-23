"use strict";

const http = require("node:http");

const MAX_BODY_BYTES = 1024 * 1024;
const CLIENT_ID = "com.clipdrop.premiere";

// The Premiere UXP panel sends custom headers (content-type, x-clipdrop-client),
// which makes its requests non-simple and triggers a CORS preflight. Without
// these headers the panel's fetch throws and the panel reports the engine as
// unavailable even though it is listening. The engine stays bound to loopback,
// so a permissive origin here does not widen its exposure.
const CORS_HEADERS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, x-clipdrop-client",
  "access-control-max-age": "600",
};

function sendJson(response, status, body) {
  response.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    ...CORS_HEADERS,
  });
  response.end(JSON.stringify(body));
}

async function readJson(request) {
  let body = "";
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      const error = new Error("The request is too large.");
      error.code = "BODY_TOO_LARGE";
      throw error;
    }
  }
  try {
    return JSON.parse(body || "{}");
  } catch {
    const error = new Error("The JSON body is invalid.");
    error.code = "INVALID_JSON";
    throw error;
  }
}

function jobIdFromPath(pathname, suffix = "") {
  const pattern = suffix
    ? new RegExp(`^/jobs/([^/]+)/${suffix}$`)
    : /^\/jobs\/([^/]+)$/;
  return pathname.match(pattern)?.[1] || null;
}

function createApiServer({ manager, getHealth }) {
  return http.createServer(async (request, response) => {
    const url = new URL(request.url, "http://127.0.0.1");
    try {
      if (request.method === "OPTIONS") {
        response.writeHead(204, CORS_HEADERS);
        response.end();
        return;
      }

      if (request.method === "GET" && url.pathname === "/health") {
        sendJson(response, 200, await getHealth());
        return;
      }

      if (
        url.pathname.startsWith("/jobs") &&
        request.headers["x-clipdrop-client"] !== CLIENT_ID
      ) {
        sendJson(response, 403, {
          error: {
            code: "CLIENT_FORBIDDEN",
            message: "The request did not come from the ClipDrop panel.",
          },
        });
        return;
      }

      if (request.method === "POST" && url.pathname === "/jobs") {
        const job = manager.create(await readJson(request));
        sendJson(response, 202, job);
        return;
      }

      const cancelId = jobIdFromPath(url.pathname, "cancel");
      if (request.method === "POST" && cancelId) {
        const job = manager.get(cancelId);
        if (!job) {
          sendJson(response, 404, {
            error: { code: "JOB_NOT_FOUND", message: "Job not found." },
          });
          return;
        }
        manager.cancel(cancelId);
        sendJson(response, 200, manager.get(cancelId));
        return;
      }

      const jobId = jobIdFromPath(url.pathname);
      if (request.method === "GET" && jobId) {
        const job = manager.get(jobId);
        if (!job) {
          sendJson(response, 404, {
            error: { code: "JOB_NOT_FOUND", message: "Job not found." },
          });
          return;
        }
        sendJson(response, 200, job);
        return;
      }

      sendJson(response, 404, {
        error: { code: "NOT_FOUND", message: "Route not found." },
      });
    } catch (error) {
      const status = error.code === "BODY_TOO_LARGE" ? 413 : 400;
      sendJson(response, status, {
        error: {
          code: error.code === "BODY_TOO_LARGE" ? error.code : "INVALID_REQUEST",
          message: error.message,
        },
      });
    }
  });
}

module.exports = { createApiServer };
