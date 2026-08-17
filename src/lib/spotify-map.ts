import { Song } from "@/lib/types";
import { SpotifyTrack } from "@/lib/spotify";
import type { MusicTrack } from "@/lib/music/types";

export function spotifyTrackToSong(track: SpotifyTrack): Song {
  const preview = track.preview_url;
  return {
    id: `spotify-${track.id}`,
    title: track.name,
    artist_name: track.artists.map((a) => a.name).join(", "),
    uploaded_by: "spotify",
    cover_url: track.album.images[0]?.url || null,
    // Prefer 30s preview for in-app play; full track opens Spotify if no preview
    audio_url: preview || `spotify:track:${track.id}`,
    duration: Math.floor((track.duration_ms || 0) / 1000),
    plays: (track.popularity || 0) * 100,
    genre: "spotify",
    lyrics: null,
    created_at: new Date().toISOString(),
  };
}

export function spotifyTrackToMusicTrack(track: SpotifyTrack): MusicTrack {
  const preview = track.preview_url;
  const spotifyUri = `spotify:track:${track.id}`;
  return {
    id: `spotify-${track.id}`,
    provider: "spotify",
    providerId: track.id,
    title: track.name,
    artistName: track.artists.map((a) => a.name).join(", "),
    artworkUrl: track.album.images[0]?.url || null,
    duration: Math.floor((track.duration_ms || 0) / 1000),
    plays: (track.popularity || 0) * 100,
    genre: "spotify",
    playbackUrl: preview || spotifyUri,
    previewUrl: preview,
    availability: preview ? "preview_only" : "available",
    unavailableReason: undefined,
    externalUrl: track.external_urls?.spotify,
  };
}