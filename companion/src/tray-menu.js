"use strict";

const STATUS_LABELS = {
  ready: "ClipDrop is ready",
  starting: "ClipDrop is starting",
  unavailable: "ClipDrop is unavailable",
};

function createTrayMenuTemplate({ status, launchAtLogin, actions }) {
  return [
    {
      label: STATUS_LABELS[status] || STATUS_LABELS.unavailable,
      enabled: false,
    },
    { type: "separator" },
    { label: "Open Logs", click: actions.openLogs },
    { label: "Restart ClipDrop", click: actions.restart },
    { type: "separator" },
    {
      label: "Launch at Login",
      type: "checkbox",
      checked: launchAtLogin,
      click: (item) => actions.setLaunchAtLogin(item.checked),
    },
    { type: "separator" },
    { label: "Quit", click: actions.quit },
  ];
}

module.exports = { createTrayMenuTemplate };
