import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Song } from "@/lib/types";
import { activeLyricIndex, type SongLyrics } from "@/lib/lyrics";

interface LyricsPanelProps {
  song: Song;
  lyrics: SongLyrics | null;
  loading: boolean;
  progress: number;
  onClose: () => void;
  onSeek?: (time: number) => void;
}

export default function LyricsPanel({
  song,
  lyrics,
  loading,
  progress,
  onClose,
  onSeek,
}: LyricsPanelProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);
  const active = lyrics?.lines.length
    ? activeLyricIndex(lyrics.lines, progress)
    : -1;

  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [active, song.id]);

  return (
    <div className="fixed inset-x-0 top-0 bottom-[72px] z-40 bg-background/95 backdrop-blur-xl animate-fade-in flex flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-3 shrink-0">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-primary">
            Subtitles
          </p>
          <h2 className="text-lg font-bold text-foreground truncate">{song.title}</h2>
          <p className="text-sm text-muted-foreground truncate">{song.artist_name}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground shrink-0"
          aria-label="Close subtitles"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-8 scrollbar-thin">
        {loading ? (
          <p className="text-muted-foreground text-sm pt-8">Loading lyrics…</p>
        ) : lyrics?.lines.length ? (
          <div className="space-y-4 max-w-xl mx-auto py-6">
            {lyrics.lines.map((line, index) => {
              const isActive = index === active;
              return (
                <button
                  key={`${line.time}-${index}`}
                  type="button"
                  ref={isActive ? (el) => { activeRef.current = el; } : undefined}
                  onClick={() => onSeek?.(line.time)}
                  className={`block w-full text-left text-xl sm:text-2xl leading-snug transition-colors ${
                    isActive
                      ? "text-foreground font-semibold"
                      : "text-muted-foreground/70 hover:text-foreground"
                  }`}
                >
                  {line.text}
                </button>
              );
            })}
          </div>
        ) : lyrics?.plain ? (
          <pre className="max-w-xl mx-auto py-6 text-lg leading-relaxed text-foreground/90 whitespace-pre-wrap font-sans">
            {lyrics.plain}
          </pre>
        ) : (
          <p className="text-muted-foreground text-sm pt-8 max-w-md">
            No lyrics found for this song. Music keeps playing — close this and try another track.
          </p>
        )}
      </div>
    </div>
  );
}
