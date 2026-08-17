import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

const rootEl = document.getElementById("root");

function hideSplash() {
  const splash = document.getElementById("app-splash");
  if (!splash) return;
  splash.classList.add("is-hidden");
  window.setTimeout(() => splash.remove(), 500);
}

function showBootError(message: string) {
  if (!rootEl) return;
  hideSplash();
  rootEl.innerHTML = `<div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;padding:32px;text-align:center;color:#fff;font-family:Inter,system-ui,sans-serif"><h1 style="margin:0;font-size:22px">De Soundwave</h1><p style="margin:0;opacity:.75;max-width:420px">${message}</p><button onclick="location.reload()" style="margin-top:8px;padding:10px 22px;border-radius:999px;border:0;background:#39ff14;color:#04140a;font-weight:700;cursor:pointer">Reload</button></div>`;
}

async function boot() {
  if (!rootEl) throw new Error("Missing #root");
  const { default: App } = await import("./App.tsx");
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  requestAnimationFrame(hideSplash);
}

void boot().catch(() => {
  showBootError("Something went wrong while starting the app. Please reload.");
});
