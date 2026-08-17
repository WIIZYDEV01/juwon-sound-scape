import { Play, Pause } from "lucide-react";
import { Song } from "@/lib/types";
import { usePlayer } from "@/context/PlayerContext";
import { toast } from "sonner";

interface SongCardProps {
  song: Song;
  queue?: Song[];
}

export default function SongCard({ song, queue }: SongCardProps) {
  const { playSong, togglePlay, currentSong, isPlaying } = usePlayer();
  const isActive = currentSong?.id === song.id;
  const available =
    song.id.startsWith("spotify-") ||
    Boolean(song.audio_url?.startsWith("spotify:")) ||
    Boolean(song.audio_url && !song.audio_url.includes("open.spotify.com"));

  const defaultCover =
    "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop";

  const onClick = () => {
    if (!available) {
      toast.error(
        song.lyrics ||
          "Playback unavailable for this track in your region/provider."
      );
      return;
    }
    if (isActive) {
      togglePlay();
      return;
    }
    playSong(song, queue);
  };

  return (
    <div
      className={`group relative bg-card/80 backdrop-blur-sm hover:bg-card-hover rounded-lg p-3 transition-all duration-200 ${
        available ? "cursor-pointer" : "cursor-not-allowed opacity-70"
      }`}
      onClick={onClick}
    >
      <div className="relative mb-3">
        <img
          src={song.cover_url || defaultCover}
          alt={song.title}
          className="w-full aspect-square object-cover rounded-md shadow-lg"
          loading="lazy"
        />
        {available && (
          <button
            className={`absolute bottom-2 right-2 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-xl transition-all duration-200 ${
              isActive && isPlaying
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0"
            }`}
          >
            {isActive && isPlaying ? (
              <Pause className="w-5 h-5 text-primary-foreground fill-primary-foreground" />
            ) : (
              <Play className="w-5 h-5 text-primary-foreground fill-primary-foreground ml-0.5" />
            )}
          </button>
        )}
        {!available && (
          <div className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center">
            <span className="text-[10px] uppercase tracking-wide text-white px-2 text-center">
              Unavailable
            </span>
          </div>
        )}
      </div>
      <p
        className={`text-sm font-semibold truncate ${
          isActive ? "text-primary" : "text-foreground"
        }`}
      >
        {song.title}
      </p>
      <p className="text-xs text-muted-foreground truncate mt-1">{song.artist_name}</p>
      {song.uploaded_by === "deezer" || song.uploaded_by === "spotify" ? (
        <p className="text-[10px] text-muted-foreground/80 mt-1">30s preview</p>
      ) : song.uploaded_by === "audius" ||
        song.uploaded_by === "archive" ||
        song.uploaded_by === "jamendo" ? (
        <p className="text-[10px] text-primary/80 mt-1">Full song</p>
      ) : null}
    </div>
  );
}
