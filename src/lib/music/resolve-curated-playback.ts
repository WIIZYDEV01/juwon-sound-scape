import { getMusicProvider, musicTrackToSong } from "./index";
import { getValidSpotifyToken, searchSpotifyTracks } from "@/lib/spotify";
import { spotifyTrackToMusicTrack } from "@/lib/spotify-map";
import { searchDeezerTracks } from "@/lib/deezer";
import type { CuratedSong } from "./curated-library";
import type { MusicTrack } from "./types";
import type { Song } from "@/lib/types";

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/\[e\]/g, " ")
    .replace(/\b(feat|ft|featuring)\b.*$/g, " ")
    .replace(/\b(remix|bonus|extended|version|radio edit|official|audio|video|lyrics)\b/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function compact(value: string) {
  return normalize(value).replace(/\s+/g, "");
}

function titleScore(want: string, got: string): number {
  if (!want || !got) return 0;
  if (got === want || compact(got) === compact(want)) return 50;
  if (got.startsWith(want) || want.startsWith(got) || compact(got).includes(compact(want))) return 42;
  const wantWords = want.split(" ").filter((w) => w.length > 1);
  const gotSet = new Set(got.split(" ").filter(Boolean));
  if (wantWords.length && wantWords.every((w) => gotSet.has(w))) return 36;
  return 0;
}

function artistScore(song: CuratedSong, artistName: string): number {
  const got = compact(artistName);
  const want = compact(song.artist);
  if (!got || !want) return 0;
  if (got === want) return 40;
  if (got.includes(want) || want.includes(got)) return 32;
  const featured = (song.featured || []).map(compact).filter(Boolean);
  if (featured.some((f) => got.includes(f) || f.includes(got))) return 28;
  return 0;
}

export function pickBestTrackForCuratedSong(
  song: CuratedSong,
  tracks: MusicTrack[]
): MusicTrack | null {
  const wantTitle = normalize(song.title);
  const ranked = tracks
    .filter(
      (t) =>
        t.playbackUrl ||
        t.provider === "spotify" ||
        t.provider === "deezer" ||
        t.id.startsWith("spotify-")
    )
    .map((t) => {
      const ts = titleScore(wantTitle, normalize(t.title));
      const as = artistScore(song, t.artistName);
      const score = ts >= 50 && as >= 0 ? ts + Math.max(as, 8) : ts && as ? ts + as : 0;
      return { t, score };
    })
    .filter((x) => x.score >= 50)
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      const full = (t: typeof a.t) =>
        (t.provider === "audius" || t.provider === "jamendo" || t.provider === "archive") &&
        (t.duration || 0) >= 60
          ? 1
          : 0;
      return full(b.t) - full(a.t) || (b.t.plays || 0) - (a.t.plays || 0);
    });

  return ranked[0]?.t || null;
}

function isFullPlayable(track: MusicTrack | null): track is MusicTrack {
  return Boolean(
    track &&
      track.playbackUrl &&
      track.availability !== "preview_only" &&
      track.provider !== "deezer" &&
      track.provider !== "spotify" &&
      (track.duration || 0) >= 60
  );
}

export async function resolveCuratedSongToTrack(
  song: CuratedSong,
  existing: MusicTrack[] = []
): Promise<MusicTrack | null> {
  const fromExisting = pickBestTrackForCuratedSong(song, existing);
  if (isFullPlayable(fromExisting)) return fromExisting;

  const artistAlts = [song.artist];
  if (/kcee/i.test(song.artist)) artistAlts.push("KCee", "Kcee");
  const queries = Array.from(
    new Set([
      `${song.title} ${song.artist}`,
      ...artistAlts.map((a) => `${song.title} ${a}`),
    ])
  ).filter((q) => q.trim().length > 1);

  try {
    const live = await getMusicProvider().search(`${song.title} ${song.artist}`, {
      limit: 20,
    });
    const audiusHit = pickBestTrackForCuratedSong(song, live.tracks);
    if (audiusHit && (audiusHit.duration || 0) >= 60) return audiusHit;
  } catch {
    /* fall through */
  }

  for (const q of queries) {
    try {
      const deezer = await searchDeezerTracks(q, 12);
      const hit = pickBestTrackForCuratedSong(song, deezer);
      if (hit) return hit;
    } catch {
      /* try next query */
    }
  }

  const token = await getValidSpotifyToken();
  if (token) {
    for (const q of queries) {
      try {
        const spotifyTracks = await searchSpotifyTracks(q, 10);
        const mapped = spotifyTracks.map(spotifyTrackToMusicTrack);
        const hit = pickBestTrackForCuratedSong(song, mapped);
        if (hit) return hit;
      } catch {
        /* ignore Spotify 403 */
      }
    }
  }

  return fromExisting || null;
}

export async function resolveCuratedSongToPlayable(
  song: CuratedSong,
  existing: MusicTrack[] = []
): Promise<Song | null> {
  const track = await resolveCuratedSongToTrack(song, existing);
  return track ? musicTrackToSong(track) : null;
}
