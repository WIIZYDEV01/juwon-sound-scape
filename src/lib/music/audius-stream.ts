const APP_NAME = "DeSoundwave";
const API_HOST = "https://api.audius.co";

let discoveryPromise: Promise<string> | null = null;
const streamCache = new Map<string, string>();

async function pickDiscoveryNode(): Promise<string> {
  if (!discoveryPromise) {
    discoveryPromise = fetch(API_HOST)
      .then(async (res) => {
        if (!res.ok) throw new Error("Audius discovery failed");
        const json = (await res.json()) as { data?: string[] };
        const nodes = json.data || [];
        if (!nodes.length) throw new Error("No Audius nodes");
        return nodes[Math.floor(Math.random() * Math.min(nodes.length, 3))];
      })
      .catch(() => {
        discoveryPromise = null;
        return "https://discoveryprovider.audius.co";
      });
  }
  return discoveryPromise;
}

/** Build a stream URL on a healthy discovery node (faster + more reliable than api.audius.co). */
export async function buildAudiusStreamUrl(trackId: string): Promise<string> {
  const cached = streamCache.get(trackId);
  if (cached) return cached;
  const node = await pickDiscoveryNode();
  const url = `${node}/v1/tracks/${encodeURIComponent(trackId)}/stream?app_name=${encodeURIComponent(APP_NAME)}`;
  streamCache.set(trackId, url);
  return url;
}

export function audiusTrackIdFromSongId(songId: string): string | null {
  if (songId.startsWith("audius-track-")) return songId.slice("audius-track-".length);
  return null;
}

/** Warm the browser buffer for the next track without playing it. */
export function prefetchAudioUrl(url: string | null | undefined) {
  if (!url || typeof window === "undefined") return;
  try {
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = url;
    // Touch load so the CDN starts buffering
    audio.load();
  } catch {
    /* ignore */
  }
}
