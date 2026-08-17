import type { Song } from "@/lib/types";

const DB_NAME = "desoundwave-offline";
const STORE = "tracks";
const DB_VERSION = 1;
const CHANGE_EVENT = "ds-downloads-changed";

export type OfflineTrackMeta = {
  id: string;
  title: string;
  artist_name: string;
  cover_url: string | null;
  duration: number;
  genre: string | null;
  created_at: string;
  source: string;
  isPreview: boolean;
  savedAt: number;
};

type OfflineRecord = OfflineTrackMeta & {
  audioBlob: Blob;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function notify() {
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export function onDownloadsChange(cb: () => void) {
  window.addEventListener(CHANGE_EVENT, cb);
  return () => window.removeEventListener(CHANGE_EVENT, cb);
}

export function isPreviewSong(song: Pick<Song, "id" | "uploaded_by" | "genre" | "duration">) {
  return (
    song.id.startsWith("deezer-") ||
    song.id.startsWith("spotify-") ||
    song.uploaded_by === "deezer" ||
    song.uploaded_by === "spotify" ||
    song.genre === "deezer" ||
    song.genre === "spotify" ||
    (song.duration > 0 && song.duration <= 35)
  );
}

export function canSaveOffline(song: Song) {
  if (song.id.startsWith("spotify-")) return false;
  if (song.audio_url?.startsWith("spotify:")) return false;
  if (song.audio_url?.includes("open.spotify.com")) return false;
  return (
    Boolean(song.audio_url?.startsWith("http")) ||
    Boolean(song.audio_url?.startsWith("/")) ||
    song.id.startsWith("audius-") ||
    song.id.startsWith("deezer-") ||
    song.id.startsWith("archive-") ||
    song.id.startsWith("jamendo-")
  );
}

function safeFilename(song: Song) {
  const base = `${song.artist_name} - ${song.title}`
    .replace(/[<>:"/\\|?*]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
  return `${base || "song"}.mp3`;
}

export function triggerFileDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

async function fetchAudio(url: string): Promise<Blob> {
  const candidates = [
    url.startsWith("http") ? `/offline-audio?u=${encodeURIComponent(url)}` : "",
    url,
  ].filter(Boolean);

  let lastError = "Could not save this file offline";
  for (const candidate of candidates) {
    try {
      const res = await fetch(candidate);
      if (!res.ok) {
        lastError = `Could not save this file offline (${res.status})`;
        continue;
      }
      const blob = await res.blob();
      const type = (blob.type || "").toLowerCase();
      if (blob.size < 8000 || type.includes("json") || type.includes("html") || type.includes("text/")) {
        lastError = "This source blocked the download";
        continue;
      }
      return blob;
    } catch {
      lastError = "Could not save this file offline";
    }
  }
  throw new Error(lastError);
}

export async function isDownloaded(id: string): Promise<boolean> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => resolve(Boolean(req.result));
    req.onerror = () => reject(req.error);
  });
}

export async function listDownloads(): Promise<OfflineTrackMeta[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => {
      const rows = (req.result as OfflineRecord[]).map(({ audioBlob: _b, ...meta }) => meta);
      rows.sort((a, b) => b.savedAt - a.savedAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getOfflineAudioUrl(id: string): Promise<string | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).get(id);
    req.onsuccess = () => {
      const row = req.result as OfflineRecord | undefined;
      resolve(row?.audioBlob ? URL.createObjectURL(row.audioBlob) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export function offlineMetaToSong(meta: OfflineTrackMeta): Song {
  return {
    id: meta.id,
    title: meta.title,
    artist_name: meta.artist_name,
    uploaded_by: "local",
    cover_url: meta.cover_url,
    audio_url: `offline:${meta.id}`,
    duration: meta.duration,
    plays: 0,
    genre: meta.genre,
    lyrics: meta.isPreview ? "Offline preview" : null,
    created_at: meta.created_at,
  };
}

export async function saveDownload(song: Song, audioUrl: string): Promise<void> {
  if (!canSaveOffline(song) && !audioUrl.startsWith("http") && !audioUrl.startsWith("/")) {
    throw new Error("This track cannot be saved for offline play.");
  }
  const audioBlob = await fetchAudio(audioUrl);
  try {
    triggerFileDownload(audioBlob, safeFilename(song));
  } catch {
    /* IndexedDB locker still saves even if the browser blocks a file save */
  }
  const record: OfflineRecord = {
    id: song.id,
    title: song.title,
    artist_name: song.artist_name,
    cover_url: song.cover_url,
    duration: song.duration || 30,
    genre: song.genre,
    created_at: song.created_at,
    source: song.uploaded_by || song.genre || "catalog",
    isPreview: isPreviewSong(song),
    savedAt: Date.now(),
    audioBlob,
  };
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).put(record);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  try {
    await navigator.storage?.persist?.();
  } catch {
    /* ignore */
  }
  notify();
}

export async function removeDownload(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const req = db.transaction(STORE, "readwrite").objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
  notify();
}
