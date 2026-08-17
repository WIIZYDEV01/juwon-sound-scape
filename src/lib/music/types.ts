/** Normalized music models — provider-agnostic */

export type MusicProviderId =
  | "audius"
  | "audiomack"
  | "spotify"
  | "deezer"
  | "jamendo"
  | "archive"
  | "local"
  | "supabase";

export type TrackAvailability =
  | "available"
  | "unavailable"
  | "preview_only"
  | "subscription_required"
  | "region_restricted";

export interface MusicArtist {
  id: string;
  provider: MusicProviderId;
  providerId: string;
  name: string;
  handle?: string;
  imageUrl?: string | null;
  isVerified?: boolean;
  followerCount?: number;
  trackCount?: number;
  genres?: string[];
  externalUrl?: string;
}

export interface MusicAlbum {
  id: string;
  provider: MusicProviderId;
  providerId: string;
  title: string;
  artistName: string;
  artistId?: string;
  artworkUrl?: string | null;
  releaseDate?: string | null;
  trackCount?: number;
  isAlbum?: boolean;
  externalUrl?: string;
}

export interface MusicTrack {
  id: string;
  provider: MusicProviderId;
  providerId: string;
  title: string;
  artistName: string;
  artistId?: string;
  albumId?: string;
  albumTitle?: string;
  artworkUrl?: string | null;
  duration: number;
  trackNumber?: number;
  plays?: number;
  genre?: string | null;
  releaseDate?: string | null;
  explicit?: boolean;
  playbackUrl?: string | null;
  previewUrl?: string | null;
  availability: TrackAvailability;
  unavailableReason?: string;
  externalUrl?: string;
}

export interface MusicPlaylist {
  id: string;
  provider: MusicProviderId;
  providerId: string;
  title: string;
  description?: string | null;
  artworkUrl?: string | null;
  ownerName?: string;
  trackCount?: number;
  isAlbum?: boolean;
  tracks?: MusicTrack[];
}

export interface MusicSearchResults {
  query: string;
  tracks: MusicTrack[];
  artists: MusicArtist[];
  albums: MusicAlbum[];
  playlists: MusicPlaylist[];
  mixes: MusicPlaylist[];
}

export interface MusicProvider {
  id: MusicProviderId;
  displayName: string;
  search(query: string, options?: { limit?: number }): Promise<MusicSearchResults>;
  getTrending(limit?: number): Promise<MusicTrack[]>;
  getNewReleases(limit?: number): Promise<MusicTrack[]>;
  getArtist(artistId: string): Promise<MusicArtist | null>;
  getArtistTracks(artistId: string, options?: { limit?: number; offset?: number }): Promise<MusicTrack[]>;
  getArtistAlbums(artistId: string): Promise<MusicAlbum[]>;
  getAlbum(albumId: string): Promise<MusicAlbum | null>;
  getAlbumTracks(albumId: string): Promise<MusicTrack[]>;
  getPlaylist(playlistId: string): Promise<MusicPlaylist | null>;
  searchByGenre(genre: string, limit?: number): Promise<MusicTrack[]>;
  searchMixes(query: string, limit?: number): Promise<MusicPlaylist[]>;
  /** Resolve a display name to the best live artist match + full catalog */
  resolveArtistByName?(
    name: string
  ): Promise<{
    artist: MusicArtist | null;
    tracks: MusicTrack[];
    albums: MusicAlbum[];
    relatedArtists: MusicArtist[];
  }>;
}
