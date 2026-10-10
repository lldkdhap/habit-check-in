import { init } from "@neutralinojs/lib";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { browserHabitRepository } from "./storage/browser";
import { habitRepository } from "./storage/neutralino";
import "./styles.css";

const isNeutralino = "NL_TOKEN" in window;
if (isNeutralino) init();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App repository={isNeutralino ? habitRepository : browserHabitRepository} />
  </StrictMode>,
);
