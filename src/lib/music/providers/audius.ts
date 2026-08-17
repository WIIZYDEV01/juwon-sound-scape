import type {
  MusicAlbum,
  MusicArtist,
  MusicPlaylist,
  MusicProvider,
  MusicSearchResults,
  MusicTrack,
} from "../types";

const APP_NAME = "DeSoundwave";
const API_BASE = "https://api.audius.co/v1";
/** Direct discovery node stream — browsers play this faster than api.audius.co redirects */
const STREAM_BASE = "https://discoveryprovider.audius.co/v1";

type RawTrack = {
  id: string;
  title: string;
  duration?: number;
  play_count?: number;
  genre?: string | null;
  created_at?: string;
  release_date?: string;
  is_streamable?: boolean;
  track_cid?: string;
  artwork?: Record<string, string>;
  user?: { id?: string; name?: string; handle?: string; is_verified?: boolean };
  permalink?: string;
};

type RawUser = {
  id: string;
  name?: string;
  handle?: string;
  is_verified?: boolean;
  follower_count?: number;
  track_count?: number;
  profile_picture?: Record<string, string>;
};

type RawPlaylist = {
  id: string;
  playlist_name?: string;
  description?: string | null;
  is_album?: boolean;
  track_count?: number;
  artwork?: Record<string, string>;
  user?: { id?: string; name?: string; handle?: string };
  tracks?: RawTrack[];
  permalink?: string;
  release_date?: string;
  created_at?: string;
};

async function audiusFetch<T>(path: string): Promise<T> {
  const sep = path.includes("?") ? "&" : "?";
  const res = await fetch(
    `${API_BASE}${path}${sep}app_name=${encodeURIComponent(APP_NAME)}`
  );
  if (!res.ok) throw new Error(`Audius error ${res.status}`);
  return res.json() as Promise<T>;
}

function art(obj?: Record<string, string> | null) {
  if (!obj) return null;
  return obj["480x480"] || obj["1000x1000"] || obj["150x150"] || null;
}

function mapTrack(t: RawTrack): MusicTrack {
  const streamable = t.is_streamable !== false && Boolean(t.id);
  const title = t.title || "Untitled";
  return {
    id: `audius-track-${t.id}`,
    provider: "audius",
    providerId: t.id,
    title,
    artistName: t.user?.name || t.user?.handle || "Unknown Artist",
    artistId: t.user?.id ? `audius-artist-${t.user.id}` : undefined,
    artworkUrl: art(t.artwork),
    duration: t.duration || 0,
    plays: t.play_count || 0,
    genre: t.genre || null,
    releaseDate: t.release_date || t.created_at || null,
    playbackUrl: streamable
      ? `${STREAM_BASE}/tracks/${t.id}/stream?app_name=${encodeURIComponent(APP_NAME)}`
      : null,
    availability: streamable ? "available" : "unavailable",
    unavailableReason: streamable
      ? undefined
      : "Playback unavailable for this track on Audius.",
    externalUrl: t.permalink ? `https://audius.co${t.permalink}` : undefined,
  };
}

function isDemoOrSnippet(track: MusicTrack) {
  const blob = `${track.title} ${track.artistName}`.toLowerCase();
  return /\b(demo|snippet|preview only|30\s*sec|type\s*beat|free\s*beat|loop kit)\b/i.test(
    blob
  );
}

function preferRealTracks(tracks: MusicTrack[]) {
  return tracks.filter(
    (t) =>
      t.availability === "available" &&
      Boolean(t.playbackUrl) &&
      !isDemoOrSnippet(t) &&
      (t.duration || 0) >= 60
  );
}

/** Softer filter for albums/playlists — keep intros, drop demos/type beats only */
function playableCatalogTracks(tracks: MusicTrack[]) {
  return tracks.filter(
    (t) => t.availability === "available" && Boolean(t.playbackUrl) && !isDemoOrSnippet(t)
  );
}

function mapArtist(u: RawUser): MusicArtist {
  return {
    id: `audius-artist-${u.id}`,
    provider: "audius",
    providerId: u.id,
    name: u.name || u.handle || "Unknown",
    handle: u.handle,
    imageUrl: art(u.profile_picture),
    isVerified: u.is_verified,
    followerCount: u.follower_count,
    trackCount: u.track_count,
    externalUrl: u.handle ? `https://audius.co/${u.handle}` : undefined,
  };
}

function mapAlbum(p: RawPlaylist): MusicAlbum {
  return {
    id: `audius-album-${p.id}`,
    provider: "audius",
    providerId: p.id,
    title: p.playlist_name || "Untitled",
    artistName: p.user?.name || p.user?.handle || "Unknown Artist",
    artistId: p.user?.id ? `audius-artist-${p.user.id}` : undefined,
    artworkUrl: art(p.artwork),
    releaseDate: p.release_date || p.created_at || null,
    trackCount: p.track_count || p.tracks?.length || 0,
    isAlbum: p.is_album !== false,
    externalUrl: p.permalink ? `https://audius.co${p.permalink}` : undefined,
  };
}

function mapPlaylist(p: RawPlaylist): MusicPlaylist {
  return {
    id: `audius-playlist-${p.id}`,
    provider: "audius",
    providerId: p.id,
    title: p.playlist_name || "Untitled",
    description: p.description,
    artworkUrl: art(p.artwork),
    ownerName: p.user?.name || p.user?.handle,
    trackCount: p.track_count || p.tracks?.length || 0,
    isAlbum: Boolean(p.is_album),
    tracks: (p.tracks || []).map(mapTrack),
  };
}

function dedupeTracks(tracks: MusicTrack[]) {
  const map = new Map<string, MusicTrack>();
  tracks.forEach((t) => map.set(t.id, t));
  return Array.from(map.values());
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, " ").replace(/\s+/g, " ").trim();
}

function nameScore(candidate: string, query: string) {
  const c = normalizeName(candidate);
  const q = normalizeName(query);
  if (!c || !q) return 0;
  if (c === q) return 100;
  if (c.startsWith(q) || q.startsWith(c)) return 85;
  if (c.includes(q)) return 70;
  const tokens = q.split(" ").filter(Boolean);
  if (tokens.length && tokens.every((t) => c.includes(t))) return 55;
  if (tokens.some((t) => t.length > 2 && c.includes(t))) return 25;
  return 0;
}

function trackRelevance(track: MusicTrack, query: string) {
  const q = normalizeName(query);
  if (!q) return 0;
  const title = normalizeName(track.title);
  const artist = normalizeName(track.artistName);
  const blob = `${title} ${artist}`;
  const tokens = q.split(" ").filter(Boolean);

  let score = 0;
  const artistScore = nameScore(track.artistName, query);
  const titleScore = nameScore(track.title, query);
  score += artistScore * 3;
  score += titleScore * 2;
  if (blob.includes(q)) score += 40;
  if (tokens.length > 1 && tokens.every((t) => blob.includes(t))) score += 35;
  else if (tokens.some((t) => t.length > 2 && blob.includes(t))) score += 12;

  // Multi-word artist queries must mostly match — stop "daniel" alone matching Kizz Daniel
  if (tokens.length > 1) {
    const hitCount = tokens.filter((t) => blob.includes(t)).length;
    const needed = Math.ceil(tokens.length * 0.6);
    if (hitCount < needed && artistScore < 40 && titleScore < 40) {
      return 0;
    }
  }

  // Penalize unrelated noise hard
  if (/type\s*beat|free\s*beat|nightcore|sped\s*up|karaoke|ai\s*cover|cover\s*by/i.test(blob)) {
    score -= artistScore >= 70 ? 5 : 50;
  }

  return score;
}

/** Filter out type-beats / karaoke noise unless the uploader IS the searched artist */
function isLowQualityMatch(track: MusicTrack, query: string) {
  const blob = `${track.title} ${track.artistName}`.toLowerCase();
  const artistScore = nameScore(track.artistName, query);
  if (artistScore >= 70) return false;
  return /type\s*beat|instrumental(?!\s*version)|free\s*beat|nightcore|sped\s*up|karaoke|cover\s*by|ft\.?\s*ai\b|ai\s*cover/i.test(
    blob
  );
}

function rankTracks(tracks: MusicTrack[], query: string) {
  return [...tracks]
    .filter((t) => !isLowQualityMatch(t, query) && trackRelevance(t, query) >= 12)
    .sort((a, b) => {
      const as = trackRelevance(a, query) * 10 + (a.plays || 0) / 100000;
      const bs = trackRelevance(b, query) * 10 + (b.plays || 0) / 100000;
      return bs - as;
    });
}

function rankArtists(artists: MusicArtist[], query: string) {
  return [...artists].sort((a, b) => {
    const as = nameScore(a.name, query) * 10 + (a.followerCount || 0) / 10000 + (a.isVerified ? 20 : 0);
    const bs = nameScore(b.name, query) * 10 + (b.followerCount || 0) / 10000 + (b.isVerified ? 20 : 0);
    return bs - as;
  });
}

function stripPrefix(id: string, prefix: string) {
  return id.startsWith(prefix) ? id.slice(prefix.length) : id;
}

async function fetchAllUserTracks(userId: string): Promise<MusicTrack[]> {
  const pageSize = 100;
  const out: MusicTrack[] = [];
  for (let offset = 0; offset < 500; offset += pageSize) {
    const data = await audiusFetch<{ data: RawTrack[] }>(
      `/users/${userId}/tracks?limit=${pageSize}&offset=${offset}`
    );
    const page = (data.data || []).map(mapTrack);
    out.push(...page);
    if (page.length < pageSize) break;
  }
  return out;
}

export const audiusProvider: MusicProvider = {
  id: "audius",
  displayName: "Audius",

  async search(query, options) {
    const raw = query.trim();
    const empty: MusicSearchResults = {
      query: raw,
      tracks: [],
      artists: [],
      albums: [],
      playlists: [],
      mixes: [],
    };
    if (!raw) return empty;

    // Prefer canonical artist spelling when query is a known curated name/alias
    let canonical = raw;
    try {
      const { resolveCuratedArtistName } = await import("../curated-search");
      canonical = resolveCuratedArtistName(raw) || raw;
    } catch {
      canonical = raw;
    }

    const queries = Array.from(
      new Set([raw, canonical].map((s) => s.trim()).filter(Boolean))
    );
    const limit = options?.limit ?? 100;

    const [trackPages, userPages, playlistPages] = await Promise.all([
      Promise.all(
        queries.flatMap((q) =>
          [0, 100].map((offset) =>
            audiusFetch<{ data: RawTrack[] }>(
              `/tracks/search?query=${encodeURIComponent(q)}&limit=${limit}&offset=${offset}`
            ).then((r) => (r.data || []).map(mapTrack))
          )
        )
      ),
      Promise.all(
        queries.map((q) =>
          audiusFetch<{ data: RawUser[] }>(
            `/users/search?query=${encodeURIComponent(q)}&limit=25`
          ).then((r) => (r.data || []).map(mapArtist))
        )
      ),
      Promise.all(
        queries.map((q) =>
          audiusFetch<{ data: RawPlaylist[] }>(
            `/playlists/search?query=${encodeURIComponent(q)}&limit=40`
          ).then((r) => (r.data || []).map(mapPlaylist))
        )
      ),
    ]);

    const rankQuery = canonical;
    const artists = rankArtists(
      Array.from(
        new Map(
          userPages
            .flat()
            .filter((a) => (a.trackCount || 0) > 0)
            .map((a) => [a.id, a])
        ).values()
      ),
      rankQuery
    );

    // Only expand FULL catalogs for strong name matches — weak matches pollute results
    const strongMatches = artists
      .filter(
        (a) =>
          nameScore(a.name, rankQuery) >= 85 ||
          nameScore(a.handle || "", rankQuery) >= 85
      )
      .slice(0, 3);

    const catalogBatches = strongMatches.length
      ? await Promise.all(
          strongMatches.map(async (a) => {
            try {
              return await fetchAllUserTracks(a.providerId);
            } catch {
              return [] as MusicTrack[];
            }
          })
        )
      : [];

    const playlists = Array.from(
      new Map(playlistPages.flat().map((p) => [p.id, p])).values()
    );

    const tracks = rankTracks(
      dedupeTracks([...catalogBatches.flat(), ...trackPages.flat()]),
      rankQuery
    );
    const albums = playlists.filter((p) => p.isAlbum).map((p) => ({
      id: p.id.replace("audius-playlist-", "audius-album-"),
      provider: "audius" as const,
      providerId: p.providerId,
      title: p.title,
      artistName: p.ownerName || "Unknown",
      artworkUrl: p.artworkUrl,
      trackCount: p.trackCount,
      isAlbum: true,
    }));
    const mixes = playlists.filter(
      (p) =>
        !p.isAlbum &&
        /mix|dj|set|party|club|amapiano|afrobeats|naija/i.test(
          `${p.title} ${p.description || ""}`
        )
    );
    const plainPlaylists = playlists.filter((p) => !p.isAlbum);

    // Prefer artists that actually match the typed query
    const matchedArtists = artists.filter(
      (a) =>
        nameScore(a.name, rankQuery) >= 40 ||
        nameScore(a.handle || "", rankQuery) >= 40
    );

    return {
      query: raw,
      tracks,
      artists: (matchedArtists.length ? matchedArtists : artists).slice(0, 20),
      albums: albums.filter(
        (a) =>
          nameScore(a.title, rankQuery) >= 25 ||
          nameScore(a.artistName, rankQuery) >= 25
      ),
      playlists: plainPlaylists.filter(
        (p) =>
          nameScore(p.title, rankQuery) >= 25 ||
          nameScore(p.ownerName || "", rankQuery) >= 25
      ),
      mixes,
    };
  },

  async getTrending(limit = 100) {
    const data = await audiusFetch<{ data: RawTrack[] }>(
      `/tracks/trending?limit=${Math.min(limit * 2, 100)}`
    );
    return preferRealTracks((data.data || []).map(mapTrack)).slice(0, limit);
  },

  async getNewReleases(limit = 100) {
    const [week, month] = await Promise.all([
      audiusFetch<{ data: RawTrack[] }>(`/tracks/trending?time=week&limit=100`),
      audiusFetch<{ data: RawTrack[] }>(`/tracks/trending?time=month&limit=100`),
    ]);
    return preferRealTracks(
      dedupeTracks(
        [...(week.data || []), ...(month.data || [])].map(mapTrack)
      )
    )
      .sort(
        (a, b) =>
          new Date(b.releaseDate || 0).getTime() -
          new Date(a.releaseDate || 0).getTime()
      )
      .slice(0, limit);
  },

  async getArtist(artistId) {
    const id = stripPrefix(artistId, "audius-artist-");
    const data = await audiusFetch<{ data: RawUser[] }>(`/users/${id}`);
    const user = Array.isArray(data.data) ? data.data[0] : (data as any).data;
    if (!user) return null;
    return mapArtist(user);
  },

  async getArtistTracks(artistId, options) {
    const id = stripPrefix(artistId, "audius-artist-");
    const limit = options?.limit ?? 100;
    const offset = options?.offset ?? 0;
    if (limit >= 100 && offset === 0) {
      return fetchAllUserTracks(id);
    }
    const data = await audiusFetch<{ data: RawTrack[] }>(
      `/users/${id}/tracks?limit=${limit}&offset=${offset}`
    );
    return (data.data || []).map(mapTrack);
  },

  async getArtistAlbums(artistId) {
    const id = stripPrefix(artistId, "audius-artist-");
    // Audius albums are playlists owned by user with is_album
    try {
      const data = await audiusFetch<{ data: RawPlaylist[] }>(
        `/users/${id}/albums?limit=100`
      );
      return (data.data || []).map(mapAlbum);
    } catch {
      const playlists = await audiusFetch<{ data: RawPlaylist[] }>(
        `/users/${id}/playlists?limit=100`
      );
      return (playlists.data || [])
        .filter((p) => p.is_album)
        .map(mapAlbum);
    }
  },

  async getAlbum(albumId) {
    const id = stripPrefix(stripPrefix(albumId, "audius-album-"), "audius-playlist-");

    // Full DJ mix stored as a single long track
    if (id.startsWith("mixtrack-")) {
      const trackId = id.slice("mixtrack-".length);
      const data = await audiusFetch<{ data: RawTrack[] }>(`/tracks/${trackId}`);
      const t = Array.isArray(data.data) ? data.data[0] : (data as any).data;
      if (!t) return null;
      const track = mapTrack(t);
      return {
        id: `audius-album-mixtrack-${trackId}`,
        provider: "audius" as const,
        providerId: trackId,
        title: track.title,
        artistName: track.artistName,
        artistId: track.artistId,
        artworkUrl: track.artworkUrl,
        releaseDate: track.releaseDate,
        trackCount: 1,
        isAlbum: false,
        externalUrl: track.externalUrl,
      };
    }

    const data = await audiusFetch<{ data: RawPlaylist[] }>(`/playlists/${id}`);
    const pl = Array.isArray(data.data) ? data.data[0] : (data as any).data;
    if (!pl) return null;
    return mapAlbum(pl);
  },

  async getAlbumTracks(albumId) {
    const id = stripPrefix(stripPrefix(albumId, "audius-album-"), "audius-playlist-");

    if (id.startsWith("mixtrack-")) {
      const trackId = id.slice("mixtrack-".length);
      const data = await audiusFetch<{ data: RawTrack[] }>(`/tracks/${trackId}`);
      const t = Array.isArray(data.data) ? data.data[0] : (data as any).data;
      return t ? [mapTrack(t)] : [];
    }

    const data = await audiusFetch<{ data: RawPlaylist[] }>(`/playlists/${id}`);
    const pl = Array.isArray(data.data) ? data.data[0] : (data as any).data;
    if (!pl) return [];
    if (pl.tracks?.length) {
      return playableCatalogTracks(pl.tracks.map(mapTrack));
    }
    try {
      const tracks = await audiusFetch<{ data: RawTrack[] }>(
        `/playlists/${id}/tracks?limit=200`
      );
      return playableCatalogTracks((tracks.data || []).map(mapTrack));
    } catch {
      return [];
    }
  },

  async getPlaylist(playlistId) {
    const id = stripPrefix(playlistId, "audius-playlist-");

    if (id.startsWith("mixtrack-")) {
      const tracks = await this.getAlbumTracks(`audius-playlist-${id}`);
      const t = tracks[0];
      if (!t) return null;
      return {
        id: `audius-playlist-${id}`,
        provider: "audius" as const,
        providerId: t.providerId,
        title: t.title,
        description: `Full mix · ${Math.round((t.duration || 0) / 60)} min`,
        artworkUrl: t.artworkUrl,
        ownerName: t.artistName,
        trackCount: 1,
        isAlbum: false,
        tracks,
      };
    }

    const data = await audiusFetch<{ data: RawPlaylist[] }>(`/playlists/${id}`);
    const pl = Array.isArray(data.data) ? data.data[0] : (data as any).data;
    if (!pl) return null;
    const mapped = mapPlaylist(pl);
    if (!mapped.tracks?.length) {
      mapped.tracks = await this.getAlbumTracks(`audius-playlist-${id}`);
    } else {
      mapped.tracks = playableCatalogTracks(mapped.tracks);
    }
    return mapped;
  },

  async searchByGenre(genre, limit = 48) {
    const data = await audiusFetch<{ data: RawTrack[] }>(
      `/tracks/search?query=${encodeURIComponent(genre)}&limit=${Math.min(limit * 2, 100)}`
    );
    return preferRealTracks((data.data || []).map(mapTrack))
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, limit);
  },

  async searchMixes(query, limit = 24) {
    const base = query.trim() || "afrobeats";
    // Prefer FULL-LENGTH mix TRACKS (true DJ sets), not short playlist clips
    const mixQueries = [
      `${base} dj mix`,
      `${base} mixtape`,
      "amapiano mix dj",
      "afrobeats mix full",
      "naija mix dj",
    ];

    const trackBatches = await Promise.all(
      mixQueries.map((q) =>
        audiusFetch<{ data: RawTrack[] }>(
          `/tracks/search?query=${encodeURIComponent(q)}&limit=40`
        )
          .then((r) => (r.data || []).map(mapTrack))
          .catch(() => [] as MusicTrack[])
      )
    );

    const longMixTracks = preferRealTracks(dedupeTracks(trackBatches.flat()))
      .filter((t) => (t.duration || 0) >= 900) // 15+ minutes = real mix sets
      .sort((a, b) => (b.plays || 0) - (a.plays || 0))
      .slice(0, limit);

    // Expose each long mix as a 1-track "playlist" so existing Mix UI can open/play it
    const asPlaylists: MusicPlaylist[] = longMixTracks.map((t) => ({
      id: `audius-playlist-mixtrack-${t.providerId}`,
      provider: "audius",
      providerId: t.providerId,
      title: t.title,
      description: `Full mix · ${Math.round((t.duration || 0) / 60)} min`,
      artworkUrl: t.artworkUrl,
      ownerName: t.artistName,
      trackCount: 1,
      isAlbum: false,
      tracks: [t],
    }));

    if (asPlaylists.length >= Math.min(8, limit)) {
      return asPlaylists.slice(0, limit);
    }

    // Fallback: multi-track playlists (still skip empty albums)
    const playlistData = await audiusFetch<{ data: RawPlaylist[] }>(
      `/playlists/search?query=${encodeURIComponent(`${base} mix`)}&limit=${limit}`
    );
    const playlists = (playlistData.data || [])
      .map(mapPlaylist)
      .filter((p) => !p.isAlbum && (p.trackCount || 0) >= 5);

    return [...asPlaylists, ...playlists].slice(0, limit);
  },

  async resolveArtistByName(name: string) {
    const q = name.trim();
    if (!q) {
      return { artist: null, tracks: [], albums: [], relatedArtists: [] };
    }

    const users = await audiusFetch<{ data: RawUser[] }>(
      `/users/search?query=${encodeURIComponent(q)}&limit=25`
    ).then((r) => (r.data || []).map(mapArtist));

    const ranked = rankArtists(users, q);
    const best =
      ranked.find((a) => nameScore(a.name, q) >= 70 || nameScore(a.handle || "", q) >= 70) ||
      ranked[0] ||
      null;

    if (!best) {
      // Fallback: track search only (still real API data)
      const trackHits = await audiusFetch<{ data: RawTrack[] }>(
        `/tracks/search?query=${encodeURIComponent(q)}&limit=100`
      ).then((r) => rankTracks((r.data || []).map(mapTrack), q));
      return {
        artist: null,
        tracks: trackHits,
        albums: [],
        relatedArtists: [],
      };
    }

    const [tracks, albums, playlists] = await Promise.all([
      fetchAllUserTracks(best.providerId),
      this.getArtistAlbums(best.id).catch(() => [] as MusicAlbum[]),
      audiusFetch<{ data: RawPlaylist[] }>(
        `/users/${best.providerId}/playlists?limit=50`
      )
        .then((r) => (r.data || []).map(mapPlaylist))
        .catch(() => [] as MusicPlaylist[]),
    ]);

    const albumFromPlaylists = playlists
      .filter((p) => p.isAlbum)
      .map((p) => ({
        id: p.id.replace("audius-playlist-", "audius-album-"),
        provider: "audius" as const,
        providerId: p.providerId,
        title: p.title,
        artistName: p.ownerName || best.name,
        artistId: best.id,
        artworkUrl: p.artworkUrl,
        trackCount: p.trackCount,
        isAlbum: true,
      }));

    const mergedAlbums = [...albums, ...albumFromPlaylists].filter(
      (a, i, arr) => arr.findIndex((x) => x.providerId === a.providerId) === i
    );

    return {
      artist: best,
      tracks: rankTracks(tracks, best.name),
      albums: mergedAlbums,
      relatedArtists: ranked.filter((a) => a.id !== best.id).slice(0, 8),
    };
  },
};
