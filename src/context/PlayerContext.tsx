import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useEffect,
} from "react";
import { Song } from "@/lib/types";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  audiusTrackIdFromSongId,
  buildAudiusStreamUrl,
  prefetchAudioUrl,
} from "@/lib/music/audius-stream";
import { getMusicProvider, musicTrackToSong } from "@/lib/music";
import { getOfflineAudioUrl, isPreviewSong } from "@/lib/offline-downloads";
import {
  onSpotifyPlaybackState,
  pauseSpotifyPlayback,
  playSpotifyTrack,
  seekSpotifyPlayback,
  setSpotifyVolume,
  spotifyTrackIdFromSong,
  toggleSpotifyPlayback,
} from "@/lib/spotify-playback";

const db = supabase as any;

interface PlayerState {
  currentSong: Song | null;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  shuffle: boolean;
  repeat: "off" | "all" | "one";
  queue: Song[];
  showLyrics: boolean;
}

interface PlayerContextType extends PlayerState {
  playSong: (song: Song, queue?: Song[]) => void;
  togglePlay: () => void;
  nextSong: () => void;
  prevSong: () => void;
  setVolume: (v: number) => void;
  seekTo: (t: number) => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLyrics: () => void;
  audioRef: React.RefObject<HTMLAudioElement | null>;
}

const PlayerContext = createContext<PlayerContextType | null>(null);

export const usePlayer = () => {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
};

function isSpotifySong(song: Song) {
  return (
    song.id.startsWith("spotify-") ||
    Boolean(song.audio_url?.startsWith("spotify:")) ||
    song.uploaded_by === "spotify"
  );
}

function playableOnly(songs: Song[]) {
  return songs.filter(
    (s) =>
      isSpotifySong(s) ||
      s.audio_url?.startsWith("offline:") ||
      (Boolean(s.audio_url) && !s.audio_url.includes("open.spotify.com"))
  );
}

function pickNextIndex(
  queue: Song[],
  currentId: string | undefined,
  shuffle: boolean,
  direction: 1 | -1
) {
  if (!queue.length) return -1;
  const idx = queue.findIndex((q) => q.id === currentId);
  if (shuffle) {
    if (queue.length === 1) return 0;
    let next = Math.floor(Math.random() * queue.length);
    let guard = 0;
    while (next === idx && guard++ < 8) {
      next = Math.floor(Math.random() * queue.length);
    }
    return next;
  }
  if (idx < 0) return 0;
  if (direction === 1) return (idx + 1) % queue.length;
  return idx <= 0 ? queue.length - 1 : idx - 1;
}

export const PlayerProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<PlayerState>({
    currentSong: null,
    isPlaying: false,
    progress: 0,
    duration: 0,
    volume: 0.7,
    shuffle: false,
    repeat: "off",
    queue: [],
    showLyrics: false,
  });

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stateRef = useRef(state);
  const playTokenRef = useRef(0);
  const progressTickRef = useRef(0);
  const startPlaybackRef = useRef<(song: Song, queue: Song[]) => Promise<void>>(
    async () => undefined
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  const isDbSongId = (songId: string) =>
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      songId
    );

  const recordPlay = useCallback(async (songId: string) => {
    if (!isDbSongId(songId)) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.user) {
      await db.from("play_history").insert({
        user_id: session.user.id,
        song_id: songId,
      });
    }
  }, []);

  const resolvePlayUrl = useCallback(async (song: Song) => {
    try {
      const offline = await getOfflineAudioUrl(song.id);
      if (offline) return offline;
    } catch {
      /* play from network */
    }
    if (song.audio_url?.startsWith("offline:")) {
      return (await getOfflineAudioUrl(song.id)) || "";
    }
    const trackId = audiusTrackIdFromSongId(song.id);
    if (trackId) {
      try {
        return await buildAudiusStreamUrl(trackId);
      } catch {
        return song.audio_url;
      }
    }
    return song.audio_url;
  }, []);

  const prefetchQueueNeighbor = useCallback(
    async (queue: Song[], currentId: string | undefined, shuffle: boolean) => {
      const nextIdx = pickNextIndex(queue, currentId, shuffle, 1);
      if (nextIdx < 0) return;
      const next = queue[nextIdx];
      if (!next || next.id === currentId) return;
      const url = await resolvePlayUrl(next);
      prefetchAudioUrl(url);
    },
    [resolvePlayUrl]
  );

  const startPlayback = useCallback(
    async (song: Song, queue: Song[]) => {
      const audio = audioRef.current;
      if (!audio) return;

      const token = ++playTokenRef.current;
      const nextQueue = playableOnly(queue.length ? queue : [song]);

      setState((s) => ({
        ...s,
        currentSong: song,
        isPlaying: true,
        progress: 0,
        duration: song.duration || 0,
        queue: nextQueue.length ? nextQueue : s.queue,
      }));

      const spotifyId = spotifyTrackIdFromSong(song.id, song.audio_url);
      if (spotifyId && !song.audio_url?.includes("http")) {
        audio.pause();
        try {
          await playSpotifyTrack(spotifyId);
          if (token !== playTokenRef.current) return;
          recordPlay(song.id);
        } catch (err) {
          console.error("Spotify playback failed:", err);
          if (token !== playTokenRef.current) return;
          setState((s) => ({ ...s, isPlaying: false }));
          toast.error(
            err instanceof Error
              ? err.message
              : "Could not play this song on Spotify."
          );
        }
        return;
      }

      if (song.audio_url?.includes("open.spotify.com")) {
        window.open(song.audio_url, "_blank", "noopener,noreferrer");
        setState((s) => ({ ...s, isPlaying: false }));
        return;
      }

      if (!song.audio_url) {
        setState((s) => ({ ...s, isPlaying: false }));
        return;
      }

      try {
        void pauseSpotifyPlayback();
        audio.preload = "auto";
        const url = await resolvePlayUrl(song);
        if (token !== playTokenRef.current) return;
        if (audio.src !== url) audio.src = url || "";
        await audio.play();
        if (token !== playTokenRef.current) return;
        recordPlay(song.id);
        void prefetchQueueNeighbor(
          nextQueue.length ? nextQueue : stateRef.current.queue,
          song.id,
          stateRef.current.shuffle
        );
      } catch (err) {
        console.error("Playback failed:", err);
        if (token !== playTokenRef.current) return;
        const q = nextQueue.length ? nextQueue : stateRef.current.queue;
        const idx = q.findIndex((x) => x.id === song.id);
        const rest =
          idx >= 0 ? q.slice(idx + 1) : q.filter((x) => x.id !== song.id);
        if (rest.length) {
          void startPlaybackRef.current(rest[0], q);
        } else {
          setState((s) => ({ ...s, isPlaying: false }));
        }
      }
    },
    [prefetchQueueNeighbor, recordPlay, resolvePlayUrl]
  );

  useEffect(() => {
    startPlaybackRef.current = startPlayback;
  }, [startPlayback]);

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "auto";
    audio.crossOrigin = "anonymous";
    audioRef.current = audio;

    const onTimeUpdate = () => {
      const now = performance.now();
      if (now - progressTickRef.current < 250) return;
      progressTickRef.current = now;
      setState((s) =>
        s.progress === audio.currentTime ? s : { ...s, progress: audio.currentTime }
      );
    };

    const onLoadedMetadata = () => {
      const d = audio.duration;
      if (d && isFinite(d)) setState((s) => ({ ...s, duration: d }));
    };

    const playNextOrRadio = () => {
      const s = stateRef.current;
      if (s.repeat === "one" && s.currentSong) {
          audio.currentTime = 0;
        void audio.play();
        return;
      }
      const q = playableOnly(s.queue);
      const current = s.currentSong;
      if (!current) {
        setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
        return;
      }
      const idx = q.findIndex((x) => x.id === current.id);
      if (idx >= 0 && idx < q.length - 1) {
        void startPlaybackRef.current(q[idx + 1], q);
        return;
      }
      if (s.shuffle && q.length > 1) {
        const nextIdx = pickNextIndex(q, current.id, true, 1);
        if (nextIdx >= 0 && q[nextIdx]) {
          void startPlaybackRef.current(q[nextIdx], q);
          return;
        }
      }
      void (async () => {
        try {
          const more = await getMusicProvider().search(
            `${current.artist_name} ${current.title}`.trim() || current.title,
            { limit: 15 }
          );
          const extras = more.tracks
            .filter((t) => (t.duration || 0) >= 90 && t.playbackUrl)
            .map(musicTrackToSong)
            .filter((t) => t.audio_url && t.id !== current.id && !isPreviewSong(t));
          const unseen = extras.filter((t) => !q.some((x) => x.id === t.id));
          const nextQueue = playableOnly([...q, ...unseen]);
          const next = unseen[0] || extras[0];
          if (next) void startPlaybackRef.current(next, nextQueue.length ? nextQueue : [next]);
          else setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
        } catch {
          setState((prev) => ({ ...prev, isPlaying: false, progress: 0 }));
        }
      })();
    };

    const onEnded = () => playNextOrRadio();

    const onError = () => {
      const s = stateRef.current;
      const q = playableOnly(s.queue);
      if (!s.currentSong || !q.length) {
        setState((prev) => ({ ...prev, isPlaying: false }));
        return;
      }
      const idx = q.findIndex((x) => x.id === s.currentSong?.id);
      const rest = idx >= 0 ? q.slice(idx + 1) : q.slice(1);
      if (rest.length) void startPlaybackRef.current(rest[0], q);
      else setState((prev) => ({ ...prev, isPlaying: false }));
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.pause();
      audio.src = "";
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = state.volume;
    void setSpotifyVolume(state.volume);
  }, [state.volume]);

  useEffect(() => {
    return onSpotifyPlaybackState((spotify) => {
      setState((s) => {
        if (!s.currentSong || !isSpotifySong(s.currentSong)) return s;
        return {
          ...s,
          isPlaying: !spotify.paused,
          progress: spotify.position,
          duration: spotify.duration || s.duration,
        };
      });
    });
  }, []);

  const playSong = useCallback(
    (song: Song, queue?: Song[]) => {
      const q = playableOnly(queue?.length ? queue : [song]);
      const start =
        q.find((x) => x.id === song.id) ||
        (isSpotifySong(song) ||
        (song.audio_url && !song.audio_url.includes("open.spotify.com"))
          ? song
          : q[0]);
      if (!start) {
    setState((s) => ({
      ...s,
      currentSong: song,
          isPlaying: false,
      progress: 0,
      duration: song.duration || 0,
          queue: q,
        }));
        return;
      }
      void startPlayback(start, q.length ? q : [start]);
    },
    [startPlayback]
  );

  const togglePlay = useCallback(() => {
    const current = stateRef.current.currentSong;
    if (current && isSpotifySong(current)) {
      void toggleSpotifyPlayback();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play().then(() => setState((s) => ({ ...s, isPlaying: true })));
    } else {
      audio.pause();
      setState((s) => ({ ...s, isPlaying: false }));
    }
  }, []);

  const nextSong = useCallback(() => {
    const s = stateRef.current;
    const q = playableOnly(s.queue);
    if (!s.currentSong || !q.length) return;
    const nextIdx = pickNextIndex(q, s.currentSong.id, s.shuffle, 1);
    const next = q[nextIdx];
    if (next) void startPlayback(next, q);
  }, [startPlayback]);

  const prevSong = useCallback(() => {
    const s = stateRef.current;
      const audio = audioRef.current;
    if (!s.currentSong || !s.queue.length) return;
      if (audio && audio.currentTime > 3) {
        audio.currentTime = 0;
      setState((prev) => ({ ...prev, progress: 0 }));
      return;
    }
    const q = playableOnly(s.queue);
    const prevIdx = pickNextIndex(q, s.currentSong.id, false, -1);
    const prev = q[prevIdx];
    if (prev) void startPlayback(prev, q);
  }, [startPlayback]);

  const setVolume = useCallback((v: number) => {
    setState((s) => ({ ...s, volume: v }));
  }, []);

  const seekTo = useCallback((t: number) => {
    const current = stateRef.current.currentSong;
    if (current && isSpotifySong(current)) {
      void seekSpotifyPlayback(t);
      setState((s) => ({ ...s, progress: t }));
      return;
    }
    const audio = audioRef.current;
    if (audio && isFinite(t)) {
      audio.currentTime = t;
    setState((s) => ({ ...s, progress: t }));
    }
  }, []);

  const toggleShuffle = useCallback(() => {
    setState((s) => ({ ...s, shuffle: !s.shuffle }));
  }, []);

  const toggleRepeat = useCallback(() => {
    setState((s) => ({
      ...s,
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
    }));
  }, []);

  const toggleLyrics = useCallback(() => {
    setState((s) => ({ ...s, showLyrics: !s.showLyrics }));
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        playSong,
        togglePlay,
        nextSong,
        prevSong,
        setVolume,
        seekTo,
        toggleShuffle,
        toggleRepeat,
        toggleLyrics,
        audioRef,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};
