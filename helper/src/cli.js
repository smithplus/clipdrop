#!/usr/bin/env node
"use strict";

const { JobManager } = require("./job-manager");
const { runMediaJob } = require("./runner");
const { createApiServer } = require("./server");
const { getHealth } = require("./health");

const port = Number(process.env.CLIPDROP_PORT || 47821);
const host = "127.0.0.1";
const manager = new JobManager({ runJob: runMediaJob });
const server = createApiServer({ manager, getHealth });

server.listen(port, host, () => {
  console.log(`ClipDrop Helper available at http://${host}:${port}`);
});

function shutdown() {
  server.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
