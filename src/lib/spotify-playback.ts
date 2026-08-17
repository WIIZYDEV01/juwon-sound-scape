import { getValidSpotifyToken } from "./spotify";

type SpotifyPlayerInstance = {
  connect: () => Promise<boolean>;
  disconnect: () => void;
  togglePlay: () => Promise<void>;
  pause: () => Promise<void>;
  resume: () => Promise<void>;
  seek: (ms: number) => Promise<void>;
  setVolume: (v: number) => Promise<void>;
  addListener: (event: string, cb: (arg: any) => void) => void;
};

type PlaybackState = {
  paused: boolean;
  position: number;
  duration: number;
};

type StateListener = (state: PlaybackState) => void;

declare global {
  interface Window {
    Spotify?: {
      Player: new (opts: {
        name: string;
        getOAuthToken: (cb: (token: string) => void) => void;
        volume?: number;
      }) => SpotifyPlayerInstance;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}

let player: SpotifyPlayerInstance | null = null;
let deviceId: string | null = null;
let readyPromise: Promise<string> | null = null;
const listeners = new Set<StateListener>();

export function onSpotifyPlaybackState(listener: StateListener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function loadSdk(): Promise<void> {
  if (window.Spotify) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const prev = window.onSpotifyWebPlaybackSDKReady;
    window.onSpotifyWebPlaybackSDKReady = () => {
      prev?.();
      resolve();
    };
    if (document.querySelector('script[src*="sdk.scdn.co/spotify-player"]')) return;
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    script.onerror = () => reject(new Error("Could not load Spotify player"));
    document.head.appendChild(script);
  });
}

async function ensureDevice(): Promise<string> {
  if (deviceId) return deviceId;
  if (readyPromise) return readyPromise;

  readyPromise = (async () => {
    const token = await getValidSpotifyToken();
    if (!token) throw new Error("Connect Spotify first");
    await loadSdk();
    if (!window.Spotify) throw new Error("Spotify player failed to load");

    return new Promise<string>((resolve, reject) => {
      const instance = new window.Spotify.Player({
        name: "De Soundwave",
        getOAuthToken: (cb) => {
          void getValidSpotifyToken().then((t) => cb(t || ""));
        },
        volume: 0.8,
      });

      instance.addListener("ready", ({ device_id }: { device_id: string }) => {
        deviceId = device_id;
        player = instance;
        resolve(device_id);
      });
      instance.addListener("not_ready", () => {
        deviceId = null;
      });
      instance.addListener("initialization_error", ({ message }: { message: string }) => {
        reject(new Error(message || "Spotify player failed to start"));
      });
      instance.addListener("authentication_error", ({ message }: { message: string }) => {
        reject(new Error(message || "Spotify login expired. Connect again."));
      });
      instance.addListener("account_error", () => {
        reject(new Error("Spotify Premium is required to play full songs in De Soundwave."));
      });
      instance.addListener("player_state_changed", (state: any) => {
        if (!state) return;
        const next: PlaybackState = {
          paused: Boolean(state.paused),
          position: Number(state.position || 0) / 1000,
          duration: Number(state.duration || 0) / 1000,
        };
        listeners.forEach((fn) => fn(next));
      });

      void instance.connect().then((ok) => {
        if (!ok) reject(new Error("Could not connect the Spotify player"));
      });
    });
  })();

  try {
    return await readyPromise;
  } catch (err) {
    readyPromise = null;
    player = null;
    deviceId = null;
    throw err;
  }
}

export function spotifyTrackIdFromSong(songId: string, audioUrl?: string | null) {
  if (songId.startsWith("spotify-")) return songId.slice("spotify-".length);
  const uri = audioUrl?.match(/spotify:track:([a-zA-Z0-9]+)/);
  if (uri) return uri[1];
  const open = audioUrl?.match(/open\.spotify\.com\/track\/([a-zA-Z0-9]+)/);
  return open?.[1] || null;
}

export async function playSpotifyTrack(trackId: string) {
  const token = await getValidSpotifyToken();
  if (!token) throw new Error("Connect Spotify first");
  const device = await ensureDevice();

  const res = await fetch(
    `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(device)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
    }
  );

  if (res.status === 204 || res.status === 202 || res.ok) return;
  if (res.status === 403) {
    throw new Error("Spotify Premium is required to play this song in the app.");
  }
  if (res.status === 404) {
    throw new Error("Spotify player is not ready. Click Connect Spotify and try again.");
  }
  const data = await res.json().catch(() => ({}));
  throw new Error(data?.error?.message || "Could not start Spotify playback");
}

export async function toggleSpotifyPlayback() {
  if (!player) return false;
  await player.togglePlay();
  return true;
}

export async function pauseSpotifyPlayback() {
  if (!player) return;
  await player.pause();
}

export async function seekSpotifyPlayback(seconds: number) {
  if (!player) return;
  await player.seek(Math.max(0, Math.floor(seconds * 1000)));
}

export async function setSpotifyVolume(volume: number) {
  if (!player) return;
  await player.setVolume(Math.min(1, Math.max(0, volume)));
}
