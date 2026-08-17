/** @deprecated Prefer `@/lib/music` provider abstraction. Kept for compatibility. */
export {
  getMusicProvider as audiusProviderCompat,
} from "@/lib/music";

import { getMusicProvider, songsFromTracks } from "@/lib/music";
import type { Song } from "@/lib/types";

const provider = getMusicProvider();

export async function fetchAudiusTrending(limit = 100): Promise<Song[]> {
  return songsFromTracks(await provider.getTrending(limit));
}

export async function fetchAudiusNewReleases(limit = 100): Promise<Song[]> {
  return songsFromTracks(await provider.getNewReleases(limit));
}

export async function searchAudiusTracksDeep(query: string): Promise<Song[]> {
  const results = await provider.search(query);
  return songsFromTracks(results.tracks);
}
