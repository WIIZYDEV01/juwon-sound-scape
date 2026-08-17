import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Song } from "@/lib/types";
import { sampleSongs } from "@/lib/sample-songs";
import {
  getMusicProvider,
  musicTrackToSong,
  songsFromTracks,
  type MusicSearchResults,
  type MusicTrack,
} from "@/lib/music";
import { resolveCuratedArtistName, searchCuratedSongs } from "@/lib/music/curated-search";
import { resolveCuratedSongToTrack } from "@/lib/music/resolve-curated-playback";
import { getValidSpotifyToken, searchSpotifyTracks } from "@/lib/spotify";
import { spotifyTrackToMusicTrack } from "@/lib/spotify-map";
import { searchDeezerTracks } from "@/lib/deezer";
import { searchArchiveTracks } from "@/lib/archive";
import { getPopularJamendoTracks, searchJamendoTracks } from "@/lib/jamendo";

const provider = getMusicProvider();

const searchFallbackSongs = (query: string) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return sampleSongs.filter((song) =>
    [song.title, song.artist_name, song.genre ?? "", song.lyrics ?? ""].some(
      (value) => value.toLowerCase().includes(normalizedQuery)
    )
  );
};

function dedupeTracks(tracks: MusicTrack[]) {
  const seen = new Set<string>();
  return tracks.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}

function isFullTrack(t: MusicTrack) {
  return (
    t.availability !== "preview_only" &&
    t.provider !== "deezer" &&
    t.provider !== "spotify" &&
    (t.duration || 0) >= 60 &&
    Boolean(t.playbackUrl)
  );
}

function preferFullTracks(tracks: MusicTrack[]) {
  return [...tracks].sort((a, b) => Number(isFullTrack(b)) - Number(isFullTrack(a)));
}

export function useTrendingSongs() {
  return useQuery({
    queryKey: ["music", provider.id, "trending"],
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const tracks = await provider.getTrending(100);
      if (tracks.length) return songsFromTracks(tracks);
      // Soft fallback so Home always has something to play if catalog is empty
      return sampleSongs;
    },
  });
}

export function useNewReleases() {
  return useQuery({
    queryKey: ["music", provider.id, "new"],
    staleTime: 5 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const tracks = await provider.getNewReleases(100);
      if (tracks.length) return songsFromTracks(tracks);
      return sampleSongs;
    },
  });
}

export function useGenreTracks(genre: string) {
  return useQuery({
    queryKey: ["music", provider.id, "genre", genre],
    enabled: Boolean(genre),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => songsFromTracks(await provider.searchByGenre(genre, 48)),
  });
}

export function useMusicSearch(query: string) {
  return useQuery({
    queryKey: ["music", provider.id, "search", query],
    enabled: query.trim().length > 0,
    staleTime: 2 * 60 * 1000,
    queryFn: async (): Promise<MusicSearchResults> => {
      const trimmed = query.trim();
      const canonical = resolveCuratedArtistName(trimmed) || trimmed;

      let live: MusicSearchResults = {
        query: trimmed,
        tracks: [],
        artists: [],
        albums: [],
        playlists: [],
        mixes: [],
      };
      let liveFailed = false;

      try {
        const results = await provider.search(canonical);
        live = { ...results, query: trimmed };
        if (
          !results.tracks.length &&
          !results.artists.length &&
          !results.albums.length &&
          !results.playlists.length &&
          canonical !== trimmed
        ) {
          const retry = await provider.search(trimmed);
          live = { ...retry, query: trimmed };
        }
      } catch (e) {
        console.error("Provider search failed:", e);
        liveFailed = true;
      }

      try {
        const fullFree = (
          await Promise.all([
            searchArchiveTracks(canonical, 8).catch(() => [] as MusicTrack[]),
            searchJamendoTracks(canonical, 10).catch(() => [] as MusicTrack[]),
          ])
        ).flat();
        if (fullFree.length) {
          live.tracks = dedupeTracks([...live.tracks, ...fullFree]);
        }
      } catch (e) {
        console.warn("Free full-song search skipped:", e);
      }

      try {
        const deezerTracks = await searchDeezerTracks(canonical, 15);
        if (deezerTracks.length) {
          live.tracks = dedupeTracks([...live.tracks, ...deezerTracks]);
        }
      } catch (e) {
        console.warn("Deezer search skipped:", e);
      }

      try {
        const token = await getValidSpotifyToken();
        if (token) {
          const spotifyTracks = await searchSpotifyTracks(canonical, 10);
          const mapped = spotifyTracks.map(spotifyTrackToMusicTrack);
          live.tracks = dedupeTracks([...mapped, ...live.tracks]);
        }
      } catch (e) {
        console.warn("Spotify search skipped:", e);
      }

      try {
        const curatedHits = searchCuratedSongs(trimmed, 6);
        const resolved = (
          await Promise.all(
            curatedHits.map((song) =>
              resolveCuratedSongToTrack(song, live.tracks).catch(() => null)
            )
          )
        ).filter((t): t is MusicTrack => Boolean(t));
        if (resolved.length) {
          live.tracks = dedupeTracks([...resolved, ...live.tracks]);
        }
      } catch (e) {
        console.warn("Curated song resolve skipped:", e);
      }

      if (
        live.tracks.length ||
        live.artists.length ||
        live.albums.length ||
        live.playlists.length
      ) {
        return { ...live, tracks: preferFullTracks(live.tracks) };
      }

      if (liveFailed) {
        // Signal UI that live catalog failed (caller can still show curated directory)
        throw new Error("Live catalog unavailable");
      }

      const fallback = searchFallbackSongs(trimmed);
      const { data } = await supabase
        .from("songs")
        .select("*")
        .or(
          `title.ilike.%${trimmed}%,artist_name.ilike.%${trimmed}%,genre.ilike.%${trimmed}%`
        )
        .limit(40);

      const dbSongs = (data as Song[]) || [];
      return {
        query: trimmed,
        tracks: [...dbSongs, ...fallback].map((s) => ({
          id: s.id,
          provider: "local" as const,
          providerId: s.id,
          title: s.title,
          artistName: s.artist_name,
          artworkUrl: s.cover_url,
          duration: s.duration,
          plays: s.plays,
          genre: s.genre,
          releaseDate: s.created_at,
          playbackUrl: s.audio_url,
          availability: s.audio_url ? ("available" as const) : ("unavailable" as const),
        })),
        artists: [],
        albums: [],
        playlists: [],
        mixes: [],
      };
    },
  });
}

/** Back-compat hook used by older pages */
export function useSearchSongs(query: string) {
  const q = useMusicSearch(query);
  return {
    ...q,
    data: q.data ? q.data.tracks.map(musicTrackToSong) : [],
  };
}

export function useAllSongs() {
  return useTrendingSongs();
}

/** Full-length free catalog (Archive + Jamendo + long Audius tracks). */
export function useFreeFullSongs() {
  return useQuery({
    queryKey: ["music", "free-full"],
    staleTime: 10 * 60 * 1000,
    retry: 1,
    queryFn: async () => {
      const [jamendo, audius] = await Promise.all([
        getPopularJamendoTracks(16).catch(() => [] as MusicTrack[]),
        provider
          .getTrending(36)
          .then((tracks) => tracks.filter((t) => (t.duration || 0) >= 90))
          .catch(() => [] as MusicTrack[]),
      ]);
      const tracks = dedupeTracks([...jamendo, ...audius]);
      return songsFromTracks(tracks);
    },
  });
}

export function useArtist(artistId: string | undefined) {
  return useQuery({
    queryKey: ["music", provider.id, "artist", artistId],
    enabled: Boolean(artistId),
    staleTime: 10 * 60 * 1000,
    queryFn: () => provider.getArtist(artistId!),
  });
}

export function useArtistTracks(artistId: string | undefined) {
  return useQuery({
    queryKey: ["music", provider.id, "artist-tracks", artistId],
    enabled: Boolean(artistId),
    staleTime: 10 * 60 * 1000,
    queryFn: async () =>
      songsFromTracks(await provider.getArtistTracks(artistId!, { limit: 500 })),
  });
}

export function useArtistAlbums(artistId: string | undefined) {
  return useQuery({
    queryKey: ["music", provider.id, "artist-albums", artistId],
    enabled: Boolean(artistId),
    staleTime: 10 * 60 * 1000,
    queryFn: () => provider.getArtistAlbums(artistId!),
  });
}

export function useResolveArtistByName(name: string | undefined) {
  return useQuery({
    queryKey: ["music", provider.id, "resolve-artist", name],
    enabled: Boolean(name?.trim()),
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      if (!provider.resolveArtistByName) {
        const results = await provider.search(name!.trim());
        return {
          artist: results.artists[0] || null,
          tracks: results.tracks,
          albums: results.albums,
          relatedArtists: results.artists.slice(1),
        };
      }
      return provider.resolveArtistByName(name!.trim());
    },
  });
}

export function useAlbum(albumId: string | undefined) {
  return useQuery({
    queryKey: ["music", provider.id, "album", albumId],
    enabled: Boolean(albumId),
    staleTime: 10 * 60 * 1000,
    queryFn: () => provider.getAlbum(albumId!),
  });
}

export function useAlbumTracks(albumId: string | undefined) {
  return useQuery({
    queryKey: ["music", provider.id, "album-tracks", albumId],
    enabled: Boolean(albumId),
    staleTime: 10 * 60 * 1000,
    queryFn: async () => songsFromTracks(await provider.getAlbumTracks(albumId!)),
  });
}

export function useMixes(query: string) {
  return useQuery({
    queryKey: ["music", provider.id, "mixes", query],
    staleTime: 10 * 60 * 1000,
    queryFn: () => provider.searchMixes(query || "dj mix", 24),
  });
}

export function useLikedSongs(userId: string | undefined) {
  return useQuery({
    queryKey: ["liked_songs", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("liked_songs")
        .select("song_id, songs(*)")
        .eq("user_id", userId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data?.map((d: any) => d.songs).filter(Boolean) as Song[]) || [];
    },
  });
}

export function usePlayHistory(userId: string | undefined) {
  return useQuery({
    queryKey: ["play_history", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("play_history")
        .select("song_id, songs(*)")
        .eq("user_id", userId!)
        .order("played_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data?.map((d: any) => d.songs).filter(Boolean) as Song[]) || [];
    },
  });
}

export type { MusicSearchResults };
