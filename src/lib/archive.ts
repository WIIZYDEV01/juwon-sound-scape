import type { MusicTrack } from "@/lib/music/types";

const IA_API =
  typeof window !== "undefined" ? "/ia" : "https://archive.org";
const IA_CDN = "https://archive.org";
const FETCH_MS = 4000;

const DOWN_KEY = "ds-archive-down-until";

function archiveAvailable() {
  if (typeof sessionStorage === "undefined") return true;
  const until = Number(sessionStorage.getItem(DOWN_KEY) || 0);
  return Date.now() >= until;
}

function markArchiveDown() {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(DOWN_KEY, String(Date.now() + 5 * 60 * 1000));
}

async function iaFetch(url: string): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(FETCH_MS) });
}

type IaDoc = {
  identifier?: string;
  title?: string;
  creator?: string | string[];
  downloads?: number;
};

type IaFile = {
  name?: string;
  format?: string;
  length?: string | number;
  size?: string;
};

function sanitizeQuery(query: string) {
  return query
    .replace(/[:"()[\]{}]/g, " ")
    .replace(/\b(AND|OR|NOT)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function creatorName(value: unknown): string {
  if (Array.isArray(value)) return String(value[0] || "").trim();
  if (typeof value === "string") return value.trim();
  return "";
}

function encodeIaPath(name: string) {
  return name
    .split("/")
    .map((part) => encodeURIComponent(part))
    .join("/");
}

function parseLength(value: string | number | undefined): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string" || !value.trim()) return 0;
  if (/^\d+(\.\d+)?$/.test(value.trim())) return Number(value);
  const parts = value.split(":").map((n) => Number(n));
  if (parts.some((n) => !Number.isFinite(n))) return 0;
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}

function audioRank(file: IaFile): number {
  const name = (file.name || "").toLowerCase();
  const format = (file.format || "").toLowerCase();
  if (!name || name.endsWith(".jpg") || name.endsWith(".png") || name.endsWith(".gif")) {
    return -1;
  }
  if (/\b(sample|preview|snippet|trailer|speech|interview)\b/i.test(name)) return -1;
  const isAudio =
    /\.(mp3|ogg|oga|m4a)$/i.test(name) ||
    /mp3|ogg vorbis|vbr mp3|128kbps mp3|mpeg|vorbis/.test(format);
  if (!isAudio) return -1;
  if (format.includes("vbr mp3")) return 6;
  if (format.includes("128kbps")) return 5;
  if (format === "mp3" || name.endsWith(".mp3")) return 4;
  if (format.includes("ogg") || name.endsWith(".ogg") || name.endsWith(".oga")) return 3;
  if (name.endsWith(".m4a")) return 2;
  return 1;
}

function pickAudioFile(files: IaFile[]): IaFile | null {
  const ranked = files
    .map((file) => ({ file, rank: audioRank(file) }))
    .filter((row) => row.rank > 0)
    .sort((a, b) => b.rank - a.rank);
  return ranked[0]?.file || null;
}

async function hydrateDoc(doc: IaDoc): Promise<MusicTrack | null> {
  const identifier = doc.identifier?.trim();
  if (!identifier) return null;
  try {
    const res = await iaFetch(`${IA_API}/metadata/${encodeURIComponent(identifier)}`);
    if (!res.ok) return null;
    const meta = (await res.json()) as {
      files?: IaFile[];
      metadata?: { title?: string; creator?: string | string[]; collection?: string[] };
    };
    const audio = pickAudioFile(meta.files || []);
    if (!audio?.name) return null;
    const duration = parseLength(audio.length);
    if (duration > 0 && duration < 50) return null;
    if (duration > 30 * 60) return null;
    const artist =
      creatorName(doc.creator) || creatorName(meta.metadata?.creator) || "Internet Archive";
    const title = (doc.title || meta.metadata?.title || audio.name.replace(/\.[^.]+$/, "")).trim();
    return {
      id: `archive-${identifier}`,
      provider: "archive",
      providerId: identifier,
      title: title || "Untitled",
      artistName: artist,
      artworkUrl: `${IA_CDN}/services/img/${encodeURIComponent(identifier)}`,
      duration: Math.round(duration) || 0,
      plays: doc.downloads || 0,
      genre: "archive",
      playbackUrl: `${IA_CDN}/download/${encodeURIComponent(identifier)}/${encodeIaPath(audio.name)}`,
      availability: "available",
      externalUrl: `${IA_CDN}/details/${encodeURIComponent(identifier)}`,
    };
  } catch {
    return null;
  }
}

async function searchArchive(lucene: string, limit: number): Promise<MusicTrack[]> {
  const params = new URLSearchParams();
  params.set("q", lucene);
  params.append("fl[]", "identifier");
  params.append("fl[]", "title");
  params.append("fl[]", "creator");
  params.append("fl[]", "downloads");
  params.append("sort[]", "downloads desc");
  params.set("rows", String(Math.min(20, Math.max(3, limit))));
  params.set("page", "1");
  params.set("output", "json");

  const res = await iaFetch(`${IA_API}/advancedsearch.php?${params.toString()}`);
  if (!res.ok) throw new Error(`Archive search failed (${res.status})`);
  const data = (await res.json()) as { response?: { docs?: IaDoc[] } };
  const docs = (data.response?.docs || []).filter((d) => d.identifier).slice(0, limit);
  const tracks = await Promise.all(docs.map(hydrateDoc));
  return tracks.filter((t): t is MusicTrack => Boolean(t?.playbackUrl));
}

export async function searchArchiveTracks(query: string, limit = 8): Promise<MusicTrack[]> {
  const q = sanitizeQuery(query);
  if (!q || !archiveAvailable()) return [];
  try {
    return await searchArchive(
      `(${q}) AND mediatype:(audio) AND format:(MP3) AND -collection:(audio_bookspoetry) AND -collection:(librivoxaudio)`,
      limit
    );
  } catch {
    markArchiveDown();
    return [];
  }
}

export async function getPopularArchiveTracks(limit = 12): Promise<MusicTrack[]> {
  if (!archiveAvailable()) return [];
  try {
    const [netlabels, african] = await Promise.all([
      searchArchive(
        "collection:(netlabels) AND mediatype:(audio) AND format:(VBR MP3)",
        Math.max(6, Math.ceil(limit * 0.7))
      ),
      searchArchive(
        "mediatype:(audio) AND format:(MP3) AND (subject:(africa) OR subject:(afrobeats) OR subject:(highlife) OR subject:(african music))",
        Math.max(4, Math.floor(limit * 0.5))
      ),
    ]);
    const seen = new Set<string>();
    return [...african, ...netlabels].filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    }).slice(0, limit);
  } catch {
    markArchiveDown();
    return [];
  }
}
