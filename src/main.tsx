import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const rootEl = document.getElementById("root");

function showBootError(message: string) {
  if (!rootEl) return;
  rootEl.innerHTML = `<div style="padding:32px;color:#fff;font-family:Inter,system-ui,sans-serif;max-width:560px"><h1 style="margin:0 0 12px">De Soundwave</h1><p style="opacity:.85">${message}</p><p style="opacity:.7">Open <b>http://127.0.0.1:8080/</b> and refresh.</p></div>`;
}

async function boot() {
  if (!rootEl) throw new Error("Missing #root");
  const { default: App } = await import("./App.tsx");
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

void boot().catch((err) => {
  showBootError(err instanceof Error ? err.message : String(err));
});
