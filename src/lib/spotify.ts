const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;
const REDIRECT_URI = "http://127.0.0.1:8080/callback";
const SCOPES = [
  "user-read-email",
  "user-read-private",
  "streaming",
  "user-read-playback-state",
  "user-modify-playback-state",
].join(" ");

const TOKEN_KEY = "spotify_access_token";
const REFRESH_KEY = "spotify_refresh_token";
const EXPIRY_KEY = "spotify_token_expiry";
const VERIFIER_KEY = "spotify_code_verifier";

function base64UrlEncode(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function sha256(plain: string) {
  const data = new TextEncoder().encode(plain);
  return crypto.subtle.digest("SHA-256", data);
}

function randomVerifier(length = 64) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const values = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(values, (v) => chars[v % chars.length]).join("");
}

export function isSpotifyConfigured() {
  return Boolean(CLIENT_ID);
}

export function getSpotifyAccessToken(): string | null {
  const token = localStorage.getItem(TOKEN_KEY);
  const expiry = Number(localStorage.getItem(EXPIRY_KEY) || 0);
  if (!token || Date.now() >= expiry) return null;
  return token;
}

export function clearSpotifySession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(EXPIRY_KEY);
  localStorage.removeItem(VERIFIER_KEY);
}

export async function startSpotifyLogin() {
  if (!CLIENT_ID) {
    throw new Error("Missing VITE_SPOTIFY_CLIENT_ID");
  }

  const verifier = randomVerifier();
  const challenge = base64UrlEncode(await sha256(verifier));
  localStorage.setItem(VERIFIER_KEY, verifier);

  const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: "code",
    redirect_uri: REDIRECT_URI,
    scope: SCOPES,
    code_challenge_method: "S256",
    code_challenge: challenge,
  });

  window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}

export async function exchangeSpotifyCode(code: string) {
  const verifier = localStorage.getItem(VERIFIER_KEY);
  if (!verifier) throw new Error("Missing PKCE verifier. Try connecting again.");

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    code_verifier: verifier,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description || data.error || "Spotify token exchange failed");
  }

  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + (data.expires_in - 60) * 1000));
  localStorage.removeItem(VERIFIER_KEY);

  return data.access_token as string;
}

export async function refreshSpotifyToken() {
  const refreshToken = localStorage.getItem(REFRESH_KEY);
  if (!refreshToken || !CLIENT_ID) return null;

  const body = new URLSearchParams({
    client_id: CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await res.json();
  if (!res.ok) {
    clearSpotifySession();
    return null;
  }

  localStorage.setItem(TOKEN_KEY, data.access_token);
  if (data.refresh_token) localStorage.setItem(REFRESH_KEY, data.refresh_token);
  localStorage.setItem(EXPIRY_KEY, String(Date.now() + (data.expires_in - 60) * 1000));
  return data.access_token as string;
}

export async function getValidSpotifyToken() {
  const existing = getSpotifyAccessToken();
  if (existing) return existing;
  return refreshSpotifyToken();
}

export type SpotifyTrack = {
  id: string;
  name: string;
  duration_ms: number;
  preview_url: string | null;
  popularity: number;
  external_urls?: { spotify?: string };
  artists: { name: string }[];
  album: { images: { url: string }[] };
};

async function spotifySearchOnce(
  token: string,
  query: string,
  limit: number,
  withMarket: boolean
): Promise<{ tracks: SpotifyTrack[]; status: number; message?: string }> {
  const params = new URLSearchParams({
    q: query,
    type: "track",
    limit: String(limit),
  });
  if (withMarket) params.set("market", "from_token");

  const res = await fetch(`https://api.spotify.com/v1/search?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return {
      tracks: [],
      status: res.status,
      message: data.error?.message || `Spotify search failed (${res.status})`,
    };
  }
  return {
    tracks: ((data.tracks?.items || []) as SpotifyTrack[]).filter(Boolean),
    status: res.status,
  };
}

export async function searchSpotifyTracks(query: string, limit = 10): Promise<SpotifyTrack[]> {
  const token = await getValidSpotifyToken();
  if (!token) throw new Error("Connect Spotify to search their catalog");

  const capped = Math.min(Math.max(1, limit), 10);
  let result = await spotifySearchOnce(token, query, capped, true);
  if (result.status === 401) {
    clearSpotifySession();
    throw new Error("Spotify login expired. Click Connect Spotify again.");
  }
  if (result.status !== 200) {
    result = await spotifySearchOnce(token, query, capped, false);
  }
  if (result.status === 403) {
    throw new Error(
      result.message?.includes("Premium") || result.message?.includes("premium")
        ? "Spotify requires Premium on the account that created this app (juwon / the Dashboard owner). Free accounts get 403 on every search."
        : result.message ||
            "Spotify blocked this app (403). The Dashboard owner needs Spotify Premium, and juwon’s Spotify email must be the one in User Management."
    );
  }
  if (result.status >= 400) {
    throw new Error(result.message || "Spotify search failed");
  }
  return result.tracks;
}
