/**
 * Audiomack provider scaffold — inactive until Consumer Key + Secret are available.
 * Official docs: https://audiomack.com/data-api/docs
 * Keys must live on a server proxy (never VITE_ secrets).
 */
import type {
  MusicAlbum,
  MusicArtist,
  MusicPlaylist,
  MusicProvider,
  MusicSearchResults,
  MusicTrack,
} from "../types";

const empty = (query = ""): MusicSearchResults => ({
  query,
  tracks: [],
  artists: [],
  albums: [],
  playlists: [],
  mixes: [],
});

export const audiomackProvider: MusicProvider = {
  id: "audiomack",
  displayName: "Audiomack",

  async search(query) {
    return empty(query);
  },

  async getTrending() {
    return [] as MusicTrack[];
  },

  async getNewReleases() {
    return [] as MusicTrack[];
  },

  async getArtist() {
    return null as MusicArtist | null;
  },

  async getArtistTracks() {
    return [] as MusicTrack[];
  },

  async getArtistAlbums() {
    return [] as MusicAlbum[];
  },

  async getAlbum() {
    return null as MusicAlbum | null;
  },

  async getAlbumTracks() {
    return [] as MusicTrack[];
  },

  async getPlaylist() {
    return null as MusicPlaylist | null;
  },

  async searchByGenre() {
    return [] as MusicTrack[];
  },

  async searchMixes() {
    return [] as MusicPlaylist[];
  },
};
