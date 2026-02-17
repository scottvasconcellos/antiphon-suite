import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
// Design system first so tokens and base styles apply; app.css overrides (e.g. body gradient) last
import "@antiphon/design-system/styles";
import "./styles/app.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
