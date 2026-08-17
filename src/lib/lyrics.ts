export type LyricLine = {
  time: number;
  text: string;
};

export type SongLyrics = {
  plain: string;
  lines: LyricLine[];
};

type LrcLibHit = {
  trackName?: string;
  artistName?: string;
  duration?: number;
  plainLyrics?: string | null;
  syncedLyrics?: string | null;
};

const LRCLIB_BASE =
  typeof window !== "undefined" ? "/lrclib" : "https://lrclib.net";

const cache = new Map<string, SongLyrics | null>();

function clean(value: string) {
  return value
    .replace(/\[[^\]]+\]/g, " ")
    .replace(/\([^)]*\)/g, " ")
    .replace(/\b(feat|ft|featuring)\b.*$/i, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseLrc(lrc: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const row of lrc.split(/\r?\n/)) {
    const stamps = [...row.matchAll(/\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g)];
    if (!stamps.length) continue;
    const text = row.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, "").trim();
    if (!text || text === "♪") continue;
    for (const stamp of stamps) {
      const minutes = Number(stamp[1]);
      const seconds = Number(stamp[2]);
      const fraction = stamp[3] ? Number(stamp[3].padEnd(3, "0")) / 1000 : 0;
      lines.push({ time: minutes * 60 + seconds + fraction, text });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

function toSongLyrics(hit: LrcLibHit | null | undefined): SongLyrics | null {
  if (!hit) return null;
  const lines = hit.syncedLyrics ? parseLrc(hit.syncedLyrics) : [];
  const plain = (hit.plainLyrics || lines.map((l) => l.text).join("\n")).trim();
  if (!plain && !lines.length) return null;
  return { plain, lines };
}

async function getExact(artist: string, title: string, duration?: number) {
  const params = new URLSearchParams({
    artist_name: artist,
    track_name: title,
  });
  if (duration && duration > 40) params.set("duration", String(Math.round(duration)));
  const res = await fetch(`${LRCLIB_BASE}/api/get?${params.toString()}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Lyrics lookup failed (${res.status})`);
  return toSongLyrics((await res.json()) as LrcLibHit);
}

async function searchBest(artist: string, title: string) {
  const params = new URLSearchParams({
    artist_name: artist,
    track_name: title,
  });
  const res = await fetch(`${LRCLIB_BASE}/api/search?${params.toString()}`, {
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const hits = ((await res.json()) as LrcLibHit[]) || [];
  const withText = hits.find((h) => h.syncedLyrics || h.plainLyrics);
  return toSongLyrics(withText);
}

export async function fetchLyrics(song: {
  id: string;
  title: string;
  artist_name: string;
  duration?: number;
}): Promise<SongLyrics | null> {
  if (cache.has(song.id)) return cache.get(song.id) || null;
  const title = clean(song.title);
  const artist = clean(song.artist_name);
  if (!title) {
    cache.set(song.id, null);
    return null;
  }
  try {
    const exact = await getExact(artist || song.artist_name, title, song.duration);
    if (exact) {
      cache.set(song.id, exact);
      return exact;
    }
    const searched = await searchBest(artist || song.artist_name, title);
    cache.set(song.id, searched);
    return searched;
  } catch {
    cache.set(song.id, null);
    return null;
  }
}

export function activeLyricIndex(lines: LyricLine[], progress: number) {
  if (!lines.length) return -1;
  let index = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].time <= progress + 0.12) index = i;
    else break;
  }
  return index;
}
