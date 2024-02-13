import "./ui/style.css";
import "@logseq/libs";
import React from "react";
import ReactDOM from "react-dom/client";
import { LogseqApp } from "./ui/LogseqApp"; // Correctly import the LogseqApp component

import { SettingSchemaDesc } from "@logseq/libs"; // Correctly import the SettingSchemaDesc type

// Correctly declare the settingsSchema variable once
const settingsSchema: SettingSchemaDesc[] = [];

logseq.useSettingsSchema(settingsSchema);

async function main() {
  // Ensure the element with id "app" exists in your index.html
  const rootElement = document.getElementById("app");
  if (!rootElement) {
    console.error('Element with id "app" not found');
    return;
  }
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <LogseqApp /> {/* Correctly use the LogseqApp component */}
    </React.StrictMode>
  );

  // Define the createModel function outside of the main function
  function createModel() {
    return {
      show() {
        logseq.showMainUI({ autoFocus: true });
      },
    };
  }

  logseq.provideModel(createModel());
  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });
}

logseq.ready(main).catch(console.error);
