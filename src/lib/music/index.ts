import type { Song } from "@/lib/types";
import type { MusicProvider, MusicTrack } from "./types";
import { audiusProvider } from "./providers/audius";

/** Active catalog provider. Swap/add providers here without rewriting UI. */
export function getMusicProvider(): MusicProvider {
  return audiusProvider;
}

export function musicTrackToSong(track: MusicTrack): Song {
  return {
    id: track.id,
    title: track.title,
    artist_name: track.artistName,
    uploaded_by: track.provider,
    cover_url: track.artworkUrl || null,
    audio_url: track.playbackUrl || "",
    duration: track.duration || 0,
    plays: track.plays || 0,
    genre: track.genre || null,
    lyrics: track.unavailableReason || null,
    created_at: track.releaseDate || new Date().toISOString(),
  };
}

export function songsFromTracks(tracks: MusicTrack[]): Song[] {
  return tracks.map(musicTrackToSong);
}

export * from "./types";
