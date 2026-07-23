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

  const succeeded = project.executeTransaction((compoundAction) => {
    compoundAction.addAction(root.createBinAction(IMPORT_BIN_NAME, false));
  }, "Crear carpeta ClipDrop Imports");
  if (!succeeded) {
    throw new Error("Premiere no pudo crear la carpeta ClipDrop Imports.");
  }

  target = await findBin(root);
  if (!target) {
    throw new Error("Premiere creó la carpeta, pero no pudo encontrarla.");
  }
  return target;
}

async function importIntoPremiere(premiere, filePath) {
  const project = await premiere.Project.getActiveProject();
  if (!project) {
    throw new Error("Necesitas un proyecto abierto en Premiere para importar.");
  }

  const folder = await getOrCreateImportBin(project);
  const target = premiere.ProjectItem.cast(folder);
  const imported = await project.importFiles([filePath], true, target, false);
  if (!imported) {
    throw new Error("Premiere no pudo importar el archivo descargado.");
  }
}

module.exports = { importIntoPremiere, getOrCreateImportBin, IMPORT_BIN_NAME };
