import type { MusicTrack } from "@/lib/music/types";

const JAMENDO_API =
  typeof window !== "undefined" ? "/jamendo-api" : "https://api.jamendo.com";

type JamendoTrack = {
  id?: string | number;
  name?: string;
  duration?: number;
  artist_name?: string;
  album_name?: string;
  album_image?: string;
  image?: string;
  audio?: string;
  audiodownload?: string;
  shareurl?: string;
};

function clientId() {
  return String(import.meta.env.VITE_JAMENDO_CLIENT_ID || "").trim();
}

export function isJamendoConfigured() {
  return clientId().length > 8;
}

async function jamendoTracks(extra: Record<string, string>, limit: number): Promise<MusicTrack[]> {
  if (!isJamendoConfigured()) return [];
  const params = new URLSearchParams({
    client_id: clientId(),
    format: "json",
    limit: String(Math.min(30, Math.max(1, limit))),
    audioformat: "mp32",
    include: "musicinfo",
    ...extra,
  });
  const res = await fetch(`${JAMENDO_API}/v3.0/tracks/?${params.toString()}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`Jamendo search failed (${res.status})`);
  const data = (await res.json()) as {
    headers?: { status?: string; error_message?: string };
    results?: JamendoTrack[];
  };
  if (data.headers?.status && data.headers.status !== "success") {
    throw new Error(data.headers.error_message || "Jamendo request failed");
  }
  return (data.results || [])
    .filter((t) => t?.id && (t.audio || t.audiodownload) && (t.duration || 0) >= 50)
    .map((t) => ({
      id: `jamendo-${t.id}`,
      provider: "jamendo" as const,
      providerId: String(t.id),
      title: t.name || "Untitled",
      artistName: t.artist_name || "Unknown Artist",
      albumTitle: t.album_name,
      artworkUrl: t.album_image || t.image || null,
      duration: Math.round(t.duration || 0),
      plays: 0,
      genre: "jamendo",
      playbackUrl: t.audio || t.audiodownload || null,
      availability: "available" as const,
      externalUrl: t.shareurl || `https://www.jamendo.com/track/${t.id}`,
    }));
}

export async function searchJamendoTracks(query: string, limit = 12): Promise<MusicTrack[]> {
  const q = query.trim();
  if (!q || !isJamendoConfigured()) return [];
  return jamendoTracks({ search: q, order: "popularity_total" }, limit);
}

export async function getPopularJamendoTracks(limit = 20): Promise<MusicTrack[]> {
  if (!isJamendoConfigured()) return [];
  return jamendoTracks({ order: "popularity_week" }, limit);
}
