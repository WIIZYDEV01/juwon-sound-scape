import type { MusicTrack } from "@/lib/music/types";

type DeezerTrack = {
  id: number;
  title?: string;
  duration?: number;
  preview?: string | null;
  rank?: number;
  artist?: { name?: string };
  album?: { title?: string; cover_medium?: string; cover_big?: string };
};

const DEEZER_BASE =
  typeof window !== "undefined" ? "/deezer-api" : "https://api.deezer.com";

export async function searchDeezerTracks(query: string, limit = 15): Promise<MusicTrack[]> {
  const q = query.trim();
  if (!q) return [];

  const params = new URLSearchParams({
    q,
    limit: String(Math.min(25, Math.max(1, limit))),
  });
  const res = await fetch(`${DEEZER_BASE}/search?${params.toString()}`);
  if (!res.ok) throw new Error(`Deezer search failed (${res.status})`);
  const data = (await res.json()) as { data?: DeezerTrack[] };

  return (data.data || [])
    .filter((t) => t?.id && t.preview)
    .map((t) => ({
      id: `deezer-${t.id}`,
      provider: "deezer" as const,
      providerId: String(t.id),
      title: t.title || "Untitled",
      artistName: t.artist?.name || "Unknown Artist",
      albumTitle: t.album?.title,
      artworkUrl: t.album?.cover_big || t.album?.cover_medium || null,
      duration: 30,
      plays: t.rank || 0,
      genre: "deezer",
      playbackUrl: t.preview || null,
      previewUrl: t.preview || null,
      availability: "preview_only" as const,
      externalUrl: `https://www.deezer.com/track/${t.id}`,
    }));
}
