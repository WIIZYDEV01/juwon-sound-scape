import {
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1,
  Volume2, VolumeX, Captions, Heart, Download
} from "lucide-react";
import { usePlayer } from "@/context/PlayerContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import {
  canSaveOffline,
  isDownloaded,
  isPreviewSong,
  saveDownload,
} from "@/lib/offline-downloads";
import { fetchLyrics, type SongLyrics } from "@/lib/lyrics";
import LyricsPanel from "@/components/LyricsPanel";

function formatTime(s: number) {
  if (!s || !isFinite(s)) return "0:00";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function MusicPlayer() {
  const {
    currentSong, isPlaying, progress, duration, volume, shuffle, repeat,
    togglePlay, nextSong, prevSong, setVolume, seekTo, toggleShuffle, toggleRepeat, toggleLyrics, showLyrics,
    audioRef,
  } = usePlayer();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [lyrics, setLyrics] = useState<SongLyrics | null>(null);
  const [lyricsLoading, setLyricsLoading] = useState(false);

  const handleLike = async () => {
    if (!user || !currentSong) return;

    const isDbSong =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        currentSong.id
      );

    // Built-in local samples can be hearted in UI only until they exist in Supabase
    if (!isDbSong) {
      setLiked(!liked);
      return;
    }

    if (liked) {
      await supabase.from("liked_songs").delete().eq("user_id", user.id).eq("song_id", currentSong.id);
    } else {
      await supabase.from("liked_songs").insert({ user_id: user.id, song_id: currentSong.id });
    }
    setLiked(!liked);
  };

  useEffect(() => {
    if (!currentSong) {
      setDownloaded(false);
      setLyrics(null);
      return;
    }
    void isDownloaded(currentSong.id).then(setDownloaded);
    let cancelled = false;
    setLyricsLoading(true);
    void fetchLyrics(currentSong).then((data) => {
      if (cancelled) return;
      setLyrics(data);
      setLyricsLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [currentSong?.id]);

  const handleDownload = async () => {
    if (!currentSong || saving) return;
    if (downloaded) {
      toast.success("Already in Downloads — open Library → Downloads");
      return;
    }
    const liveSrc = audioRef.current?.src || "";
    const src =
      currentSong.audio_url.startsWith("http") || currentSong.audio_url.startsWith("/")
        ? currentSong.audio_url
        : liveSrc.startsWith("http") || liveSrc.startsWith("/") || liveSrc.startsWith("blob:")
          ? liveSrc
          : currentSong.audio_url;
    if (
      !canSaveOffline(currentSong) &&
      !src.startsWith("http") &&
      !src.startsWith("/")
    ) {
      toast.error("This source cannot be saved. Play a track marked Full song, then tap Download.");
      return;
    }
    setSaving(true);
    const toastId = toast.loading(
      isPreviewSong(currentSong) ? "Saving 30-second preview…" : "Downloading song…"
    );
    try {
      await saveDownload(currentSong, src);
      setDownloaded(true);
      toast.success(
        isPreviewSong(currentSong)
          ? "Saved the 30-second preview. Full chart hits need Audiomack keys. Home → Free full songs play all the way through."
          : "Downloaded. Check your phone Downloads folder, or Library → Downloads.",
        { id: toastId }
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save this song. Try a Full song from Home.", {
        id: toastId,
      });
    } finally {
      setSaving(false);
    }
  };

  if (!currentSong) return null;

  return (
    <>
      {showLyrics ? (
        <LyricsPanel
          song={currentSong}
          lyrics={lyrics}
          loading={lyricsLoading}
          progress={progress}
          onClose={toggleLyrics}
          onSeek={seekTo}
        />
      ) : null}

      <div className="fixed bottom-0 left-0 right-0 h-[72px] bg-black/75 backdrop-blur-xl border-t border-white/10 z-50 flex items-center px-4 gap-4 animate-slide-up">
        <div className="flex items-center gap-3 w-[200px] min-w-[140px]">
          <img src={currentSong.cover_url || ""} alt="" className="w-12 h-12 rounded-md shadow-lg" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{currentSong.title}</p>
            <p className="text-xs text-muted-foreground truncate">{currentSong.artist_name}</p>
            {isPreviewSong(currentSong) ? (
              <p className="text-[10px] text-amber-400 truncate">30s preview</p>
            ) : null}
          </div>
          <button type="button" onClick={handleLike} className="ml-1 flex-shrink-0">
            <Heart className={`w-4 h-4 ${liked ? "fill-primary text-primary" : "text-muted-foreground hover:text-foreground"}`} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center max-w-[600px] mx-auto">
          <div className="flex items-center gap-4 mb-1">
            <button onClick={toggleShuffle}>
              <Shuffle className={`w-4 h-4 ${shuffle ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} />
            </button>
            <button onClick={prevSong}><SkipBack className="w-4 h-4 text-foreground fill-foreground" /></button>
            <button
              onClick={togglePlay}
              className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying
                ? <Pause className="w-4 h-4 text-background fill-background" />
                : <Play className="w-4 h-4 text-background fill-background ml-0.5" />
              }
            </button>
            <button type="button" onClick={nextSong}><SkipForward className="w-4 h-4 text-foreground fill-foreground" /></button>
            <button
              type="button"
              onClick={() => void handleDownload()}
              disabled={saving}
              aria-label="Download"
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-card-hover"
            >
              <Download className={`w-4 h-4 ${downloaded ? "text-primary" : saving ? "text-muted-foreground animate-pulse" : "text-foreground"}`} />
            </button>
            <button
              type="button"
              onClick={toggleLyrics}
              aria-label="Subtitles"
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                showLyrics ? "bg-primary text-primary-foreground" : "bg-secondary hover:bg-card-hover"
              }`}
            >
              <Captions className="w-4 h-4" />
            </button>
            <button type="button" onClick={toggleRepeat}>
              {repeat === "one"
                ? <Repeat1 className="w-4 h-4 text-primary" />
                : <Repeat className={`w-4 h-4 ${repeat === "all" ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} />
              }
            </button>
          </div>
          <div className="flex items-center gap-2 w-full">
            <span className="text-[10px] text-muted-foreground w-8 text-right">{formatTime(progress)}</span>
            <div className="flex-1 h-1 bg-secondary rounded-full group cursor-pointer relative"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                seekTo(pct * duration);
              }}
            >
              <div
                className="h-full bg-foreground rounded-full group-hover:bg-primary transition-colors relative"
                style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground w-8">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3 w-[200px] justify-end">
          <button type="button" onClick={() => void handleDownload()} disabled={saving} aria-label="Download">
            <Download className={`w-4 h-4 ${downloaded ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} />
          </button>
          <button type="button" onClick={toggleLyrics} aria-label="Subtitles">
            <Captions className={`w-4 h-4 ${showLyrics ? "text-primary" : "text-muted-foreground hover:text-foreground"}`} />
          </button>
          <button onClick={() => setVolume(volume === 0 ? 0.7 : 0)}>
            {volume === 0
              ? <VolumeX className="w-4 h-4 text-muted-foreground" />
              : <Volume2 className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            }
          </button>
          <div className="w-20 h-1 bg-secondary rounded-full cursor-pointer"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              setVolume((e.clientX - rect.left) / rect.width);
            }}
          >
            <div className="h-full bg-foreground rounded-full" style={{ width: `${volume * 100}%` }} />
          </div>
        </div>
      </div>
    </>
  );
}

