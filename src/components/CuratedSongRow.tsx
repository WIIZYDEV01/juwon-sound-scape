import { useState } from "react";
import { Loader2, Play } from "lucide-react";
import { toast } from "sonner";
import { usePlayer } from "@/context/PlayerContext";
import type { CuratedSong } from "@/lib/music/curated-library";
import { resolveCuratedSongToPlayable } from "@/lib/music/resolve-curated-playback";
import type { MusicTrack } from "@/lib/music/types";
import type { Song } from "@/lib/types";
import { musicTrackToSong } from "@/lib/music";
import { isPreviewSong } from "@/lib/offline-downloads";

interface CuratedSongRowProps {
  song: CuratedSong;
  existingTracks?: MusicTrack[];
  upcoming?: CuratedSong[];
  extraQueue?: Song[];
}

export default function CuratedSongRow({
  song,
  existingTracks = [],
  upcoming = [],
  extraQueue = [],
}: CuratedSongRowProps) {
  const { playSong } = usePlayer();
  const [busy, setBusy] = useState(false);

  const onPlay = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const playable = await resolveCuratedSongToPlayable(song, existingTracks);
      if (!playable?.audio_url && !playable?.id.startsWith("spotify-")) {
        toast.error(
          `No licensed preview found for “${song.title}” by ${song.artist}.`
        );
        return;
      }

      const upcomingRest = upcoming.filter(
        (s) => !(s.title === song.title && s.artist === song.artist)
      );
      const resolvedRest = (
        await Promise.all(
          upcomingRest.slice(0, 8).map((s) =>
            resolveCuratedSongToPlayable(s, existingTracks).catch(() => null)
          )
        )
      ).filter((s): s is Song => Boolean(s?.audio_url || s?.id.startsWith("spotify-")));

      const fromSearch = extraQueue.length
        ? extraQueue
        : existingTracks.map(musicTrackToSong).filter((s) => Boolean(s.audio_url));

      const seen = new Set<string>([playable.id]);
      const queued = [...resolvedRest, ...fromSearch].filter((item) => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });
      queued.sort((a, b) => Number(isPreviewSong(a)) - Number(isPreviewSong(b)));
      const queue = [playable, ...queued];

      playSong(playable, queue);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load this song. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={busy}
      className="w-full flex items-center justify-between gap-3 rounded-lg px-4 py-3 bg-card hover:bg-card-hover border border-border transition-colors text-left disabled:opacity-70"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">{song.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {song.artist}
          {song.featured?.length ? ` ft. ${song.featured.join(", ")}` : ""}
          {song.genre ? ` · ${song.genre}` : ""}
        </p>
      </div>
      <span className="text-xs text-primary whitespace-nowrap flex items-center gap-1">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
        Play
      </span>
    </button>
  );
}
