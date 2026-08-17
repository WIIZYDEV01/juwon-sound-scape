import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

const ALLOWED_AUDIO_HOSTS = [
  "dzcdn.net",
  "deezer.com",
  "audius.co",
  "audius.io",
  "archive.org",
  "jamendo.com",
];

function isAllowedAudioUrl(raw: string) {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    if (
      ALLOWED_AUDIO_HOSTS.some(
        (allowed) => host === allowed || host.endsWith(`.${allowed}`)
      )
    ) {
      return true;
    }
    if (host.includes("audius") || host.includes("creatornode") || host.includes("dn1.") || host.includes("discoveryprovider")) {
      return true;
    }
    if (/\/v1\/tracks\/[^/]+\/stream/i.test(url.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

function refererFor(raw: string) {
  try {
    const host = new URL(raw).hostname.toLowerCase();
    if (host.includes("deezer") || host.includes("dzcdn")) return "https://www.deezer.com/";
    if (host.includes("jamendo")) return "https://www.jamendo.com/";
    if (host.includes("archive")) return "https://archive.org/";
    return "https://audius.co/";
  } catch {
    return "https://audius.co/";
  }
}

function attachOfflineAudio(middlewares: { use: Function }) {
  middlewares.use("/offline-audio", async (req: { url?: string }, res: {
    statusCode: number;
    setHeader: (k: string, v: string) => void;
    end: (b?: Buffer | string) => void;
  }) => {
    try {
      const raw = new URL(req.url || "", "http://127.0.0.1").searchParams.get("u") || "";
      if (!isAllowedAudioUrl(raw)) {
        res.statusCode = 400;
        res.end("Blocked");
        return;
      }
      const upstream = await fetch(raw, {
        redirect: "follow",
        headers: {
          Accept: "audio/mpeg,audio/*,*/*;q=0.8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
          Referer: refererFor(raw),
        },
      });
      if (!upstream.ok) {
        res.statusCode = upstream.status;
        res.end("Upstream failed");
        return;
      }
      const type = upstream.headers.get("content-type") || "audio/mpeg";
      res.statusCode = 200;
      res.setHeader("Content-Type", type);
      res.setHeader("Cache-Control", "no-store");
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    } catch {
      res.statusCode = 502;
      res.end("Fetch failed");
    }
  });
}

function offlineAudioProxy(): Plugin {
  return {
    name: "offline-audio-proxy",
    configureServer(server) {
      attachOfflineAudio(server.middlewares);
    },
    configurePreviewServer(server) {
      attachOfflineAudio(server.middlewares);
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "127.0.0.1",
    port: 8080,
    strictPort: true,
    hmr: {
      overlay: true,
      host: "127.0.0.1",
      port: 8080,
    },
    proxy: {
      "/audius-api": {
        target: "https://api.audius.co",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/audius-api/, ""),
      },
      "/deezer-api": {
        target: "https://api.deezer.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/deezer-api/, ""),
      },
      "/ia": {
        target: "https://archive.org",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/ia/, ""),
      },
      "/jamendo-api": {
        target: "https://api.jamendo.com",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/jamendo-api/, ""),
      },
      "/lrclib": {
        target: "https://lrclib.net",
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/lrclib/, ""),
      },
    },
  },
  plugins: [react(), offlineAudioProxy()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
