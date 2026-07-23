"use strict";

const IMPORT_BIN_NAME = "ClipDrop Imports";

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

module.exports = { importIntoPremiere, getOrCreateImportBin, IMPORT_BIN_NAME };
