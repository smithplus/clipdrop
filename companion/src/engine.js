"use strict";

const path = require("node:path");
const { createEngineEnvironment } = require("./config");

function listen(server, { host, port }) {
  return new Promise((resolve, reject) => {
    const onError = (error) => {
      server.off("listening", onListening);
      reject(error);
    };
    const onListening = () => {
      server.off("error", onError);
      resolve();
    };
    server.once("error", onError);
    server.once("listening", onListening);
    server.listen(port, host);
  });
}

function close(server) {
  if (!server.listening) {
    return Promise.resolve();
  }
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

async function startApiEngine({
  host = "127.0.0.1",
  port = 47821,
  manager,
  getHealth,
  createServer,
}) {
  const serverFactory =
    createServer || require("../../helper/src/server").createApiServer;
  const server = serverFactory({ manager, getHealth });
  await listen(server, { host, port });

  return {
    server,
    host,
    port: server.address().port,
    stop: () => close(server),
  };
}

async function startClipDropEngine({
  paths,
  host = "127.0.0.1",
  port = 47821,
}) {
  Object.assign(process.env, createEngineEnvironment(paths));

  const helperModule = (name) =>
    require(path.join(paths.helperRoot, "src", name));
  const { createApiServer } = helperModule("server");
  const { getHealth } = helperModule("health");
  const { JobManager } = helperModule("job-manager");
  const { runMediaJob } = helperModule("runner");
  const manager = new JobManager({ runJob: runMediaJob });

  return startApiEngine({
    host,
    port,
    manager,
    getHealth,
    createServer: createApiServer,
  });
}

module.exports = { startApiEngine, startClipDropEngine };
