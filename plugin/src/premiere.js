"use strict";

const { deriveDownloadsDir } = require("./domain");

const IMPORT_BIN_NAME = "ClipDrop Imports";

async function getActiveProjectPath(premiere) {
  const project = await premiere.Project.getActiveProject();
  if (!project) {
    return null;
  }
  if (typeof project.path === "string" && project.path) {
    return project.path;
  }
  if (typeof project.getPath === "function") {
    return (await project.getPath()) || null;
  }
  return null;
}

// The default output destination: a "downloads" folder beside the open
// project file. Returns null when the project is unsaved, so the panel keeps
// the manual folder picker as the fallback.
async function getProjectDownloadsDirectory(premiere) {
  try {
    return deriveDownloadsDir(await getActiveProjectPath(premiere));
  } catch {
    return null;
  }
}

async function findBin(root) {
  const items = await root.getItems();
  return items.find((item) => item.name === IMPORT_BIN_NAME) || null;
}

async function getOrCreateImportBin(project) {
  const root = await project.getRootItem();
  let target = await findBin(root);
  if (target) {
    return target;
  }

  let succeeded = false;
  project.lockedAccess(() => {
    succeeded = project.executeTransaction((compoundAction) => {
      compoundAction.addAction(root.createBinAction(IMPORT_BIN_NAME, false));
    }, "Create ClipDrop Imports bin");
  });
  if (!succeeded) {
    throw new Error("Premiere could not create the ClipDrop Imports bin.");
  }

  target = await findBin(root);
  if (!target) {
    throw new Error("Premiere created the bin but could not find it.");
  }
  return target;
}

async function importIntoPremiere(premiere, filePath) {
  const project = await premiere.Project.getActiveProject();
  if (!project) {
    throw new Error("Open a Premiere project before importing.");
  }

  const folder = await getOrCreateImportBin(project);
  const target = premiere.ProjectItem.cast(folder);
  const imported = await project.importFiles([filePath], true, target, false);
  if (!imported) {
    throw new Error("Premiere could not import the downloaded file.");
  }
}

module.exports = {
  importIntoPremiere,
  getOrCreateImportBin,
  getActiveProjectPath,
  getProjectDownloadsDirectory,
  IMPORT_BIN_NAME,
};
